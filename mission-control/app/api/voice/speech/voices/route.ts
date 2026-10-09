import { json, failure } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { speechConfig, speechProvider, trinityVoice } from "@/lib/chat/speech";
export async function GET(req: Request) {
  try {
    const { user } = await voiceSession();
    const config = speechConfig();
    return json({
      success: true,
      ...config,
      voices: config.ready ? await speechProvider().voices(req.signal) : [],
      defaultVoice: trinityVoice()?.id ?? null,
      selected:
        typeof user.user_metadata.trinity_speech_voice === "string"
          ? user.user_metadata.trinity_speech_voice
          : null,
    });
  } catch (e) {
    return failure(e);
  }
}
