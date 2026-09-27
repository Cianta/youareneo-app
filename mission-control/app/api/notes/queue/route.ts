import { json, failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { adminClient } from "@/lib/supabase/admin";
import { smallJson, uuid } from "@/lib/voice/validation";
import { ownerDecision } from "@/lib/voice/hermes";
export async function GET() {
  try {
    const { sb } = await voiceSession();
    const { data, error } = await sb
      .from("hermes_queue")
      .select("note_id,instruction,status,result")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return json({ success: true, queue: data ?? [] });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    const { user } = await voiceSession(true);
    const body = await smallJson(req),
      status = ownerDecision(body.status),
      note_id = uuid(body.note_id);
    const { data, error } = await adminClient()
      .from("hermes_queue")
      .update({
        status,
        approved_at: status === "freigegeben" ? new Date().toISOString() : null,
      })
      .eq("note_id", note_id)
      .eq("user_id", user.id)
      .eq("status", "wartet_auf_bestaetigung")
      .select("note_id")
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new HttpError(
        409,
        "Dieser Auftrag wurde bereits entschieden oder ist nicht verfügbar.",
      );
    return json({ success: true, note_id, status });
  } catch (e) {
    return failure(e);
  }
}
