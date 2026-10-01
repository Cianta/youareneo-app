import { json, failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { smallJson, text } from "@/lib/voice/validation";
import { speechProvider } from "@/lib/chat/speech";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb } = await voiceSession();
    const body = await smallJson(req),
      voice = text(body.voice, 200, true);
    if (
      !(await speechProvider().voices(req.signal)).some((v) => v.id === voice)
    )
      throw new HttpError(400, "Bitte wähle eine verfügbare Stimme.");
    const { error } = await sb.auth.updateUser({
      data: { trinity_speech_voice: voice },
    });
    if (error) throw error;
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
