import { database } from "@/lib/mcp/store";
import { hash, json } from "@/lib/mcp/oauth";
export async function POST(req: Request) {
  try {
    const p = new URLSearchParams((await req.text()).slice(0, 8192));
    const db = database();
    db.prepare(
      "UPDATE grants SET revoked=1 WHERE client_id=? AND id IN (SELECT grant_id FROM tokens WHERE hash=?)",
    ).run(p.get("client_id") || "", hash(p.get("token") || ""));
    return json({});
  } catch {
    return json({ error: "temporarily_unavailable" }, 503);
  }
}
