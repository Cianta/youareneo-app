import { database } from "@/lib/mcp/store";
import { boundedJson, validRedirect, random, json } from "@/lib/mcp/oauth";
export async function POST(req: Request) {
  try {
    const b = await boundedJson(req, 8192);
    if (
      !Array.isArray(b.redirect_uris) ||
      !b.redirect_uris.length ||
      b.redirect_uris.length > 8 ||
      !b.redirect_uris.every(
        (s: unknown) =>
          typeof s === "string" && s.length < 2048 && validRedirect(s),
      ) ||
      (b.token_endpoint_auth_method && b.token_endpoint_auth_method !== "none")
    )
      return json({ error: "invalid_client_metadata" }, 400);
    const db = database();
    if (
      Number(
        (db.prepare("SELECT COUNT(*) AS n FROM clients").get() as { n: number })
          .n,
      ) > 1000
    )
      return json({ error: "registration_limit" }, 429);
    const id = random(),
      name = String(b.client_name || "MCP Agent").slice(0, 80);
    db.prepare("INSERT INTO clients VALUES(?,?,?)").run(
      id,
      name,
      JSON.stringify(b.redirect_uris),
    );
    return json(
      {
        client_id: id,
        client_name: name,
        redirect_uris: b.redirect_uris,
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      201,
    );
  } catch (e) {
    return json({ error: "registration_unavailable" }, 503);
  }
}
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
