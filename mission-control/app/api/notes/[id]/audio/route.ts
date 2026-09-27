import { json, failure, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { uuid } from "@/lib/voice/validation";
import { AUDIO_BUCKET } from "@/lib/voice/contracts";
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { sb, user } = await voiceSession();
    const id = uuid((await context.params).id);
    const { data: note, error } = await sb
      .from("trinity_notes")
      .select("audio_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!note?.audio_path)
      throw new HttpError(404, "Keine Aufnahme vorhanden.");
    const { data, error: downloadError } = await sb.storage
      .from(AUDIO_BUCKET)
      .download(note.audio_path);
    if (downloadError || !data)
      throw new HttpError(404, "Aufnahme nicht verfügbar.");
    return new Response(data, {
      headers: {
        "Content-Type": data.type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
