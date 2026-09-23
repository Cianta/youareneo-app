import { NextResponse } from 'next/server';
import { getAgent, saveMediaJob } from '@/lib/db';
import { dispatchChat } from '@/lib/agents/base';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── Podcast Script Generation ─────────────────────────────────────────────
    if (body.action === 'podcast-script') {
      const agent = getAgent('gemini') ?? getAgent('claude');
      if (!agent) return NextResponse.json<ApiResponse>({ success: false, error: 'No agent' }, { status: 503 });

      const script = await dispatchChat({
        agent: {
          ...agent,
          systemPrompt: 'You are a professional podcast script writer. Write engaging, natural-sounding scripts that work well when spoken aloud. Use a conversational tone, include natural pauses [PAUSE], emphasis markers [EMPHASIS], and keep sentences shorter than they would be in written form.',
          temperature: 0.75,
        },
        messages: [{
          id: 'podcast-gen',
          role: 'user',
          content: `Write a 60-second podcast episode intro script for the topic: "${body.topic}".
Format:
- Opening hook (10 seconds)
- Brief teaser of what listeners will learn (20 seconds)
- Host introduction and show name mention (15 seconds)
- Episode preview / call to action (15 seconds)
Use [PAUSE] for natural pauses. Make it punchy and energetic.`,
          agentId: agent.id,
          timestamp: new Date().toISOString(),
        }],
        injectMemory: true,
      });

      return NextResponse.json<ApiResponse>({ success: true, data: { script } });
    }

    // ── Text-to-Speech Generation ─────────────────────────────────────────────
    const { text, voice = 'nova' } = body;
    if (!text?.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'text is required' }, { status: 400 });
    }

    // Try ElevenLabs first
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID;

    if (elevenLabsKey && elevenLabsVoiceId) {
      const job = saveMediaJob({ type: 'tts', status: 'processing', input: text, agentId: 'system', voice });
      try {
        const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        });

        if (elRes.ok) {
          // In production: save to file system or cloud storage
          // For demo: return success with simulated URL
          const completedJob = saveMediaJob({ ...job, status: 'done', completedAt: new Date().toISOString() });
          return NextResponse.json<ApiResponse>({
            success: true,
            data: { url: `/audio/${job.id}.mp3`, duration: Math.ceil(text.length / 15), job: completedJob },
          });
        }
      } catch {
        saveMediaJob({ ...job, status: 'error' });
      }
    }

    // Fallback: OpenAI TTS
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const job = saveMediaJob({ type: 'tts', status: 'processing', input: text, agentId: 'system', voice });
      try {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey: openaiKey });
        const mp3 = await client.audio.speech.create({
          model: 'tts-1-hd',
          voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
          input: text,
        });
        // In production: write buffer to disk
        const completedJob = saveMediaJob({ ...job, status: 'done', completedAt: new Date().toISOString() });
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { url: `/audio/${job.id}.mp3`, duration: Math.ceil(text.length / 15), job: completedJob },
        });
      } catch (err) {
        saveMediaJob({ ...job, status: 'error', error: String(err) });
        return NextResponse.json<ApiResponse>({ success: false, error: `TTS failed: ${String(err)}` }, { status: 500 });
      }
    }

    // No TTS service available
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'No TTS service configured. Add ELEVENLABS_API_KEY or OPENAI_API_KEY to .env.local',
    }, { status: 503 });

  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
