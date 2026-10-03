import { HttpError } from "@/lib/auth/http";
import type { CrmProvider, MemberContact } from "./contracts";
type Environment = Record<string, string | undefined>;
export function providerConfig(
  provider: CrmProvider,
  userId: string,
  env: Environment = process.env,
) {
  const prefix = provider === "hubspot" ? "CRM_HUBSPOT" : "CRM_GHL";
  if (
    !env[prefix + "_OWNER_USER_ID"] ||
    env[prefix + "_OWNER_USER_ID"] !== userId
  )
    return null;
  const token = env[prefix + "_TOKEN"]?.trim();
  const location = env.CRM_GHL_LOCATION_ID?.trim();
  return token && (provider === "hubspot" || location)
    ? { token, location }
    : null;
}
const clean = (value: unknown, max = 250) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, max)
    : "";
export async function importContacts(
  provider: CrmProvider,
  userId: string,
  request: typeof fetch = fetch,
  env: Environment = process.env,
) {
  const config = providerConfig(provider, userId, env);
  if (!config)
    throw new HttpError(
      503,
      "Diese CRM-Anbindung ist für dein Konto noch nicht eingerichtet.",
    );
  const contacts = new Map<string, MemberContact>();
  let after = "",
    truncated = false;
  const seen = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    const url = new URL(
      provider === "hubspot"
        ? "https://api.hubapi.com/crm/v3/objects/contacts"
        : "https://services.leadconnectorhq.com/contacts/search",
    );
    if (provider === "hubspot") {
      url.searchParams.set("limit", "100");
      url.searchParams.set(
        "properties",
        "firstname,lastname,email,company,phone",
      );
      if (after) url.searchParams.set("after", after);
    }
    const response = await request(url, {
      method: provider === "hubspot" ? "GET" : "POST",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: "Bearer " + config.token,
        Accept: "application/json",
        ...(provider === "ghl"
          ? { "Content-Type": "application/json", Version: "2023-02-21" }
          : {}),
      },
      ...(provider === "ghl"
        ? {
            body: JSON.stringify({
              locationId: config.location,
              page,
              pageLimit: 100,
            }),
          }
        : {}),
    });
    if (!response.ok)
      throw new HttpError(
        response.status === 429 ? 429 : 503,
        response.status === 429
          ? "Das CRM-Limit ist erreicht. Bitte später erneut versuchen."
          : "Das CRM antwortet nicht erfolgreich. Bitte prüfe Token und Leseberechtigung.",
      );
    const raw = await response.json();
    const rows = provider === "hubspot" ? raw.results : raw.contacts;
    if (!Array.isArray(rows) || rows.length > 100)
      throw new HttpError(503, "Die CRM-Antwort hat ein unerwartetes Format.");
    let added = 0;
    for (const row of rows) {
      if (
        !row ||
        typeof row !== "object" ||
        (provider === "ghl" &&
          row.locationId &&
          row.locationId !== config.location)
      )
        continue;
      const remoteId = clean(row.id, 100);
      if (!remoteId) continue;
      const p = provider === "hubspot" ? (row.properties ?? {}) : row;
      const first = clean(p.firstname ?? p.firstName ?? p.firstNameLowerCase),
        last = clean(p.lastname ?? p.lastName ?? p.lastNameLowerCase);
      const name =
        clean(
          [first, last].filter(Boolean).join(" ") ||
            p.contactName ||
            p.name ||
            p.email,
        ) || "Kontakt ohne Namen";
      const id = provider + ":" + remoteId;
      if (!contacts.has(id)) added++;
      contacts.set(id, {
        id,
        name,
        email: clean(p.email, 254),
        company: clean(p.company ?? p.companyName ?? p.businessName),
        phone: clean(p.phone, 40),
        workspace: "organization",
        source: provider,
        updatedAt: new Date().toISOString(),
        remoteUpdatedAt: clean(row.updatedAt ?? row.dateUpdated, 40),
        tags: Array.isArray(row.tags)
          ? row.tags
              .filter((t: unknown) => typeof t === "string")
              .slice(0, 20)
              .map((t: string) => clean(t, 50))
          : [],
      });
    }
    if (provider === "hubspot") {
      const next = clean(raw.paging?.next?.after, 200);
      if (!next) break;
      if (seen.has(next))
        throw new HttpError(
          503,
          "Das CRM liefert wiederholte Seiten. Der Import wurde abgebrochen.",
        );
      seen.add(next);
      after = next;
    } else {
      const total = Number(raw.total ?? raw.totalCount);
      if (rows.length < 100 || (Number.isFinite(total) && page * 100 >= total))
        break;
      if (!added)
        throw new HttpError(
          503,
          "Das CRM liefert wiederholte Seiten. Der Import wurde abgebrochen.",
        );
    }
    if (page === 20) truncated = true;
  }
  return { contacts: [...contacts.values()], truncated };
}
