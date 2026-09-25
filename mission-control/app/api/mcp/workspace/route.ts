import { readMcSession } from "@/lib/fusebase/session";
import { database } from "@/lib/mcp/store";
import { boundedJson, sameOrigin, json } from "@/lib/mcp/oauth";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: "Origin abgelehnt" }, 403);
    const s = await readMcSession();
    if (!s?.userId)
      return json(
        {
          error:
            "Bitte über das echte FuseBase-Konto anmelden. Vorschaukonten haben keinen Agentenzugang.",
        },
        401,
      );
    const b = await boundedJson(req, 1024 * 1024);
    if (
      !Array.isArray(b.documents) ||
      b.documents.length > 500 ||
      b.documents.some(
        (d: unknown) =>
          !d ||
          typeof d !== "object" ||
          !["id", "title", "kind", "markdown"].every(
            (k) => typeof (d as Record<string, unknown>)[k] === "string",
          ),
      )
    )
      return json({ error: "Ungültige Dokumente" }, 400);
    const docs = b.documents.map(
      (d: { id: string; title: string; kind: string; markdown: string }) => ({
        id: d.id,
        title: d.title,
        kind: d.kind,
        markdown: d.markdown,
      }),
    );
    const updated = new Date().toISOString();
    database()
      .prepare(
        "INSERT INTO vault VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET content=excluded.content,updated=excluded.updated",
      )
      .run(String(s.userId), JSON.stringify(docs), updated);
    return json({ success: true, updated });
  } catch {
    return json(
      { error: "MCP-Speicher noch nicht aktiviert oder Anfrage zu groß." },
      503,
    );
  }
}
export async function GET() {
  try {
    const s = await readMcSession();
    if (!s?.userId) return json({ error: "Anmeldung erforderlich" }, 401);
    const drafts = database()
      .prepare(
        "SELECT * FROM inbox WHERE user_id=? ORDER BY created DESC LIMIT 100",
      )
      .all(String(s.userId));
    return json({ drafts });
  } catch {
    return json({ error: "MCP noch nicht aktiviert" }, 503);
  }
}
export async function DELETE(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: "Origin abgelehnt" }, 403);
    const s = await readMcSession();
    if (!s?.userId) return json({ error: "Anmeldung erforderlich" }, 401);
    const b = await boundedJson(req, 1024);
    database()
      .prepare("DELETE FROM inbox WHERE id=? AND user_id=?")
      .run(String(b.id), String(s.userId));
    return json({ success: true });
  } catch {
    return json({ error: "Entwurf konnte nicht entfernt werden" }, 503);
  }
}
