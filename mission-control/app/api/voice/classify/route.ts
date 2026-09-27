import { json, failure, sameOrigin } from "@/lib/auth/http";
import { voiceSession, reserveUsage } from "@/lib/voice/server";
import { classify, classificationReady } from "@/lib/voice/providers";
import { smallJson, text } from "@/lib/voice/validation";
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
    await reserveUsage(user.id, 0);
    return json({
      success: true,
      note: await classify(
        transcript,
        (data ?? []).map((p) => p.name),
        body.source === "voice" ? "voice" : "text",
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
