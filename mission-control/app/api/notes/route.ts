import { json, failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { limitedBody, noteOf, uuid } from "@/lib/voice/validation";
import { inspectAudio } from "@/lib/voice/audio";
import { AUDIO_BUCKET, MAX_AUDIO_BYTES } from "@/lib/voice/contracts";
export async function GET(req: Request) {
  try {
    const { sb, user } = await voiceSession();
    const params = new URL(req.url).searchParams;
    let query = sb
      .from("trinity_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    const before = params.get("before");
    if (before) query = query.lt("created_at", before);
    const q = params.get("q")?.slice(0, 200);
    if (q)
      query = query.textSearch("search_document", q, {
        type: "websearch",
        config: "german",
      });
    if (params.get("type")) query = query.eq("type", params.get("type"));
    if (params.get("project"))
      query = query.eq("project", params.get("project"));
    if (params.get("tag"))
      query = query.contains("tags", [params.get("tag")!.toLowerCase()]);
    const { data, error } = await query;
    if (error) throw error;
    return json({ success: true, notes: data ?? [] });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb, user } = await voiceSession(true);
    const form = await (
      await limitedBody(req, MAX_AUDIO_BYTES + 100_000)
    ).formData();
    let raw;
    try {
      raw = JSON.parse(String(form.get("note")));
    } catch {
      throw new HttpError(400, "Ungültige Notiz.");
    }
    const note = noteOf(raw),
      id = uuid(form.get("id"));
    const { data: existing, error: readError } = await sb
      .from("trinity_notes")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) return json({ success: true, id, created: false });
    const file = form.get("audio");
    let audio_path: string | null = null;
    if (file instanceof File && file.size) {
      if (note.source !== "voice")
        throw new HttpError(400, "Audio gehört zu einer Sprachnotiz.");
      const audio = await inspectAudio(file);
      audio_path = `${user.id}/${id}.${audio.extension}`;
      const { error } = await sb.storage
        .from(AUDIO_BUCKET)
        .upload(audio_path, audio.bytes, {
          contentType: audio.mime,
          upsert: false,
        });
      if (error)
        throw new HttpError(
          409,
          "Die Aufnahme konnte nicht gespeichert werden. Bitte prüfe deine Notizliste vor einem erneuten Versuch.",
        );
    }
    const { error } = await sb
      .from("trinity_notes")
      .insert({ ...note, id, user_id: user.id, audio_path });
    if (error) {
      if (audio_path) await sb.storage.from(AUDIO_BUCKET).remove([audio_path]);
      throw error;
    }
    return json({ success: true, id, created: true });
  } catch (e) {
    return failure(e);
  }
}
