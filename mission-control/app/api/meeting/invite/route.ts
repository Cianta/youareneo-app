import { json, failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { smallJson } from "@/lib/voice/validation";
import { invitationOf, sendInvitation } from "@/lib/meeting/mail";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { user } = await voiceSession(true);
    const b = await smallJson(req);
    if (b.userId !== user.id)
      throw new HttpError(
        409,
        "Das Konto hat gewechselt. Bitte die Einladung erneut vorbereiten.",
      );
    const invite = invitationOf(b);
    return json({ success: true, ...(await sendInvitation(user.id, invite)) });
  } catch (e) {
    return failure(e);
  }
}
