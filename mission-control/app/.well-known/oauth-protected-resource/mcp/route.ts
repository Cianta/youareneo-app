import { issuer, resource, json, READ } from "@/lib/mcp/oauth";
export async function GET() {
  try {
    return json({
      resource: resource(),
      authorization_servers: [issuer()],
      scopes_supported: [READ],
      bearer_methods_supported: ["header"],
      resource_name: "Trinity Workspace",
    });
  } catch {
    return json({ error: "MCP noch nicht konfiguriert" }, 503);
  }
}
