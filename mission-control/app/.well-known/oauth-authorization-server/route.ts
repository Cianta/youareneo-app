import { issuer, json, READ, WRITE } from "@/lib/mcp/oauth";
export async function GET() {
  try {
    const i = issuer();
    return json({
      issuer: i,
      authorization_endpoint: i + "/oauth/authorize",
      token_endpoint: i + "/oauth/token",
      registration_endpoint: i + "/oauth/register",
      revocation_endpoint: i + "/oauth/revoke",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: [READ, WRITE],
    });
  } catch {
    return json({ error: "MCP noch nicht konfiguriert" }, 503);
  }
}
