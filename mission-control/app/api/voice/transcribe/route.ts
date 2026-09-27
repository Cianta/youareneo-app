import { json, failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession, reserveUsage } from "@/lib/voice/server";
import { transcriptionProvider } from "@/lib/voice/providers";
import { inspectAudio } from "@/lib/voice/audio";
import { limitedBody } from "@/lib/voice/validation";
import { MAX_AUDIO_BYTES } from "@/lib/voice/contracts";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { user } = await voiceSession();
    const provider = transcriptionProvider();
    const form = await (
      await limitedBody(req, MAX_AUDIO_BYTES + 100_000)
    ).formData();
    const file = form.get("audio");
    if (!(file instanceof File))
      throw new HttpError(400, "Eine Aufnahme fehlt.");
    const audio = await inspectAudio(file);
    await reserveUsage(user.id, audio.seconds);
    const transcript = await provider.transcribe(
      audio,
      form.get("language") === "de" ? "de" : "auto",
    );
    return json({
      success: true,
      transcript,
      seconds: audio.seconds,
      provider: provider.name,
    });
  } catch (e) {
    return failure(e);
  }
}
