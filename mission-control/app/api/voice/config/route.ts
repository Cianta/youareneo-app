import { json, failure } from "@/lib/auth/http";
import { voiceSession, limits } from "@/lib/voice/server";
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
      provider: process.env.TRANSCRIBE_PROVIDER || "openai",
      transcriptionReady:
        (process.env.TRANSCRIBE_PROVIDER || "openai") === "openai" &&
        !!process.env.OPENAI_API_KEY?.trim(),
      classificationReady: !!process.env.ANTHROPIC_API_KEY?.trim(),
    });
  } catch (e) {
    return failure(e);
  }
}
