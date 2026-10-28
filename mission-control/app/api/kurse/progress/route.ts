import { json, failure, sameOrigin, bodyOf, HttpError } from "@/lib/auth/http";
import { kursSession } from "@/lib/courses/server";
import { uuid } from "@/lib/voice/validation";

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb, user } = await kursSession();
    const body = await bodyOf(req);
    const lessonId = uuid(String(body.lessonId ?? ""));
    const positionS = Math.max(0, Math.min(86_400, Math.floor(Number(body.positionS) || 0)));
    // RLS hides locked lessons, so progress can only be stored for lessons this member may open.
    const { data: lesson, error: readError } = await sb.from("kurs_lessons").select("id").eq("id", lessonId).maybeSingle();
    if (readError) throw readError;
    if (!lesson) throw new HttpError(404, "Diese Lektion ist für dich nicht freigeschaltet.");
    const { error } = await sb.from("kurs_progress").upsert({
      user_id: user.id, lesson_id: lessonId, position_s: positionS,
      completed_at: body.completed === true ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" });
    if (error) throw error;
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
