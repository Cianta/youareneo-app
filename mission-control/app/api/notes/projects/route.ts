import { json, failure, sameOrigin } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { smallJson, text } from "@/lib/voice/validation";
import { ownProjectRules } from "@/lib/voice/project-rules";
import { HttpError } from "@/lib/auth/http";
export async function GET(req: Request) {
  try {
    const { sb, user } = await voiceSession();
    const { data, error } = await sb
      .from("trinity_projects")
      .select("name")
      .order("name")
      .limit(200);
    if (error) throw error;
    const projects = (data ?? []).map(p => p.name as string);
    const target = new URL(req.url).searchParams.get("rulesFor");
    if (target && !projects.includes(target)) throw new HttpError(404, "Projekt nicht gefunden.");
    return json({ success: true, projects, ...(target ? {rules:await ownProjectRules(sb,user.id,target)} : {}) });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb, user } = await voiceSession(true);
    const name = text((await smallJson(req)).name, 100, true);
    const { error } = await sb
      .from("trinity_projects")
      .insert({ name, user_id: user.id });
    if (error && error.code !== "23505") throw error;
    return json({ success: true, name });
  } catch (e) {
    return failure(e);
  }
}
