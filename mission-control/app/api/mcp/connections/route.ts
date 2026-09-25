import { readMcSession } from "@/lib/fusebase/session";
import { database } from "@/lib/mcp/store";
import { boundedJson, sameOrigin, json, resource } from "@/lib/mcp/oauth";
export async function GET() {
  try {
    const s = await readMcSession();
    if (!s?.userId)
      return json(
        { error: "Bitte mit dem echten FuseBase-Konto anmelden." },
        401,
      );
    const connections = database()
      .prepare(
        "SELECT g.id,g.scope,g.created,c.name FROM grants g JOIN clients c ON c.id=g.client_id WHERE g.user_id=? AND g.revoked=0",
      )
      .all(String(s.userId));
    return json({ connections, url: resource() });
  } catch {
    return json(
      { error: "MCP/OAuth ist auf diesem Server noch nicht aktiviert." },
      503,
    );
  }
}
export async function DELETE(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: "Origin abgelehnt" }, 403);
    const s = await readMcSession();
    if (!s?.userId) return json({ error: "Anmeldung erforderlich" }, 401);
    const b = await boundedJson(req, 1024);
    database()
      .prepare("UPDATE grants SET revoked=1 WHERE id=? AND user_id=?")
      .run(String(b.id), String(s.userId));
    return json({ success: true });
  } catch {
    return json({ error: "Widerruf fehlgeschlagen" }, 503);
  }
}
