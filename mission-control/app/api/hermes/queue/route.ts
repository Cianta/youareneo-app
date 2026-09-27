import { json, failure, HttpError } from "@/lib/auth/http";
import { adminClient } from "@/lib/supabase/admin";
import { authorizeHermes, hermesDecision } from "@/lib/voice/hermes";
import { smallJson, text, uuid } from "@/lib/voice/validation";
export async function GET(req: Request) {
  try {
    authorizeHermes(req);
    const sb = adminClient();
    const { data, error } = await sb
      .from("trinity_hermes_pending")
      .select("note_id,user_id,instruction,status,created_at")
      .eq("status", "freigegeben")
      .order("created_at")
      .limit(100);
    if (error) throw error;
    return json({ success: true, queue: data ?? [] });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request) {
  try {
    authorizeHermes(req);
    const body = await smallJson(req),
      status = hermesDecision(body.status),
      note_id = uuid(body.note_id),
      result = text(body.result, 10000, true);
    const sb = adminClient();
    const { data, error } = await sb
      .from("trinity_hermes_pending")
      .update({ status, result })
      .eq("note_id", note_id)
      .eq("status", "freigegeben")
      .select("note_id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(409, "Auftrag bereits abgeschlossen.");
    return json({ success: true, note_id, status });
  } catch (e) {
    return failure(e);
  }
}
