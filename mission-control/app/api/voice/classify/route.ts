import { json, failure, sameOrigin } from "@/lib/auth/http";
import { voiceSession, reserveUsage } from "@/lib/voice/server";
import { classify, classificationReady } from "@/lib/voice/providers";
import { smallJson, text } from "@/lib/voice/validation";
import { ownProjectRules } from "@/lib/voice/project-rules";
import { HttpError } from "@/lib/auth/http";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb, user } = await voiceSession();
    classificationReady();
    const body = await smallJson(req);
    const transcript = text(body.transcript, 20000, true);
    const { data, error } = await sb
      .from("trinity_projects")
      .select("name")
      .order("name")
      .limit(200);
    if (error) throw error;
    const projects = (data ?? []).map(p => p.name as string);
    const source = body.source === "voice" ? "voice" : "text";
    if (body.project != null && typeof body.project !== "string")
      throw new HttpError(400, "Bitte einen gültigen Ort auswählen.");
    const target = typeof body.project === "string" && body.project ? text(body.project, 100, true) : null;
    if (target && !projects.includes(target)) throw new HttpError(400, "Dieser Ort gehört nicht zu deinen Projekten.");
    const initialRules = await ownProjectRules(sb, user.id, target);
    await reserveUsage(user.id, 0);
    let note = await classify(transcript, projects, source, target ? {project:target, rules:initialRules} : undefined);
    let rulesApplied = !!initialRules;
    if (!target && note.project) {
      const rules = await ownProjectRules(sb, user.id, note.project);
      if (rules) {
        // Two actual provider requests are counted when an inferred place has rules.
        await reserveUsage(user.id, 0);
        note = await classify(transcript, projects, source, {project:note.project, rules});
        rulesApplied = true;
      }
    }
    return json({success:true, note, rulesApplied});
  } catch (e) {
    return failure(e);
  }
}
