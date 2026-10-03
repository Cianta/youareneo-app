import { json, failure, sameOrigin, HttpError } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { smallJson } from "@/lib/voice/validation";
import {
  CRM_PROVIDERS,
  mergeImported,
  type CrmProvider,
} from "@/lib/crm/contracts";
import { importContacts } from "@/lib/crm/providers";
import { crmRoot, updateMemberContacts } from "@/lib/crm/cache";
export const runtime = "nodejs";
const active = new Set<string>();
export async function POST(req: Request) {
  let key = "",
    acquired = false;
  try {
    sameOrigin(req);
    const { user } = await voiceSession(true);
    const b = await smallJson(req);
    if (b.userId !== user.id)
      throw new HttpError(
        409,
        "Das Konto hat gewechselt. Bitte den Abgleich erneut vorbereiten.",
      );
    if (!CRM_PROVIDERS.includes(b.provider) || typeof b.commit !== "boolean")
      throw new HttpError(400, "Bitte wähle HubSpot oder HighLevel.");
    const provider = b.provider as CrmProvider;
    key = user.id + ":" + provider;
    if (active.has(key))
      throw new HttpError(409, "Für dieses CRM läuft bereits ein Abgleich.");
    active.add(key);
    acquired = true;
    const result = await importContacts(provider, user.id);
    if (b.commit)
      await updateMemberContacts(crmRoot(), user.id, (old) =>
        mergeImported(old, result.contacts),
      );
    return json({
      success: true,
      userId: user.id,
      provider,
      ...result,
      committed: b.commit,
    });
  } catch (e) {
    return failure(e);
  } finally {
    if (acquired) active.delete(key);
  }
}
