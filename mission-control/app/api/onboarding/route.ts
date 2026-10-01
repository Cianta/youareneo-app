import { failure, json, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { smallJson, text } from "@/lib/voice/validation";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb } = await voiceSession();
    const body = await smallJson(req);
    const data: Record<string, unknown> = {};
    if (body.name !== undefined)
      data.trinity_display_name = text(body.name, 80, true);
    if (body.complete === true) data.trinity_onboarding_complete = true;
    if (!Object.keys(data).length)
      throw new HttpError(400, "Bitte gib einen Namen ein.");
    // User-editable presentation metadata only; never used for permissions.
    const { error } = await sb.auth.updateUser({ data });
    if (error) throw error;
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
