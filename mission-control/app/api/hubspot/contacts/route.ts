import { readMcSession } from "@/lib/fusebase/session";
export async function GET(req: Request) {
  const session = await readMcSession();
  if (!session?.userId)
    return Response.json(
      { error: "Bitte mit FuseBase anmelden." },
      { status: 401 },
    );
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN,
    owner = process.env.HUBSPOT_TRINITY_USER_ID;
  if (!token || !owner)
    return Response.json(
      {
        error:
          "HubSpot ist für diese Trinity-Installation noch nicht verbunden. Der Server benötigt einen Kontakte-Lesezugang und dessen zugeordnetes Trinity-Konto.",
      },
      { status: 503 },
    );
  if (String(session.userId) !== owner)
    return Response.json(
      { error: "Für dieses Konto ist keine HubSpot-Verbindung eingerichtet." },
      { status: 403 },
    );
  const after = new URL(req.url).searchParams.get("after") ?? "";
  if (after && !/^\d{1,30}$/.test(after))
    return Response.json({ error: "Ungültige Seite" }, { status: 400 });
  const url = new URL("https://api.hubapi.com/crm/v3/objects/contacts");
  url.searchParams.set("limit", "100");
  url.searchParams.set("properties", "firstname,lastname,email,company");
  if (after) url.searchParams.set("after", after);
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok)
      return Response.json(
        {
          error: `HubSpot meldet ${r.status}. Verbindung und Kontakte-Leserecht prüfen.`,
        },
        { status: 502 },
      );
    const data = await r.json();
    return Response.json(
      {
        contacts: data.results.map(
          (c: {
            id: string;
            updatedAt: string;
            properties: Record<string, string>;
          }) => ({
            id: "hubspot:" + c.id,
            name:
              [c.properties.firstname, c.properties.lastname]
                .filter(Boolean)
                .join(" ") ||
              c.properties.email ||
              c.id,
            email: c.properties.email ?? "",
            company: c.properties.company ?? "",
            workspace: "organization",
            source: "hubspot",
            updatedAt: c.updatedAt,
          }),
        ),
        after: data.paging?.next?.after ?? null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "HubSpot ist derzeit nicht erreichbar." },
      { status: 502 },
    );
  }
}
