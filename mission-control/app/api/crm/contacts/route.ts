import { json, failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { smallJson, text } from "@/lib/voice/validation";
import { CRM_PROVIDERS, CONTACT_STAGES } from "@/lib/crm/contracts";
import { providerConfig } from "@/lib/crm/providers";
import {
  crmRoot,
  readMemberContacts,
  updateMemberContacts,
} from "@/lib/crm/cache";
import { meetingConfigured } from "@/lib/meeting/mail";
export const runtime = "nodejs";
export async function GET() {
  try {
    const { user } = await voiceSession();
    return json({
      success: true,
      userId: user.id,
      contacts: await readMemberContacts(crmRoot(), user.id),
      providers: CRM_PROVIDERS.map((id) => ({
        id,
        ready: !!providerConfig(id, user.id),
      })),
      mailReady: meetingConfigured(user.id),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { user } = await voiceSession(true);
    const b = await smallJson(req);
    if (b.userId !== user.id)
      throw new HttpError(
        409,
        "Das Konto hat gewechselt. Bitte den Kontakt erneut öffnen.",
      );
    const id = text(b.id, 150, true);
    if (!CONTACT_STAGES.includes(b.stage) || typeof b.favorite !== "boolean")
      throw new HttpError(400, "Bitte prüfe den Kontaktstatus.");
    const nextContact = text(b.nextContact, 10);
    if (nextContact && !/^\d{4}-\d{2}-\d{2}$/.test(nextContact))
      throw new HttpError(400, "Ungültiges Datum.");
    const note = text(b.note, 4000);
    let found = false;
    await updateMemberContacts(crmRoot(), user.id, (old) =>
      old.map((c) => {
        if (c.id !== id) return c;
        found = true;
        return {
          ...c,
          stage: b.stage,
          note,
          nextContact,
          favorite: b.favorite,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
    if (!found) throw new HttpError(404, "Kontakt nicht gefunden.");
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
