import { json, failure } from "@/lib/auth/http";
import { voiceSession, limits } from "@/lib/voice/server";
import { transcriptionConfig } from "@/lib/voice/transcription-config";
export async function GET() {
  try {
    const { sb, user, canSave } = await voiceSession();
    const month = new Date().toISOString().slice(0, 7) + "-01";
    const { data: usage, error } = await sb
      .from("usage")
      .select("voice_seconds,requests")
      .eq("user_id", user.id)
      .eq("month", month)
      .maybeSingle();
    if (error) throw error;
    return json({
      success: true,
      canSave,
      userId: user.id,
      limits: limits(),
      usage: usage ?? { voice_seconds: 0, requests: 0 },
      provider: transcriptionConfig().provider,
      transcriptionReady: transcriptionConfig().ready,
      classificationReady: !!process.env.ANTHROPIC_API_KEY?.trim(),
    });
  } catch (e) {
    return failure(e);
  }
}
