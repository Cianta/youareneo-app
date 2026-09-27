import { json, failure, sameOrigin } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { smallJson, text } from "@/lib/voice/validation";
export async function GET() {
  try {
    const { sb } = await voiceSession();
    const { data, error } = await sb
      .from("trinity_projects")
      .select("name")
      .order("name")
      .limit(200);
    if (error) throw error;
    return json({ success: true, projects: (data ?? []).map((p) => p.name) });
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
