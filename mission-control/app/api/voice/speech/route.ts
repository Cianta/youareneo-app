import { failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession, reserveUsage } from "@/lib/voice/server";
import { smallJson, text } from "@/lib/voice/validation";
import { speechProvider } from "@/lib/chat/speech";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { user } = await voiceSession();
    const body = await smallJson(req),
      content = text(body.text, 2000, true),
      voice = text(body.voice, 200, true),
      provider = speechProvider();
    if (!(await provider.voices(req.signal)).some((v) => v.id === voice))
      throw new HttpError(400, "Bitte wähle eine verfügbare Stimme.");
    // Reserve the provider's conservative character-based estimate before synthesis.
    await reserveUsage(user.id, Math.ceil(content.length / 15));
    const audio = await provider.synthesize(content, voice, req.signal);
    return new Response(audio as BodyInit, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
