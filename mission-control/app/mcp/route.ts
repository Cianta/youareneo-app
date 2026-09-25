import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { database } from "@/lib/mcp/store";
import { bearer, issuer, READ, WRITE, json, random } from "@/lib/mcp/oauth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== issuer())
      return json({ error: "origin_not_allowed" }, 403);
    if (Number(req.headers.get("content-length") || 0) > 262144)
      return json({ error: "too_large" }, 413);
    const g = bearer(req);
    if (!g)
      return new Response(null, {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer resource_metadata="${issuer()}/.well-known/oauth-protected-resource/mcp", scope="${READ}"`,
          "Cache-Control": "no-store",
        },
      });
    const server = new McpServer({ name: "trinity", version: "1.0.0" });
    const db = database();
    const result = (data: unknown) => ({
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
    });
    server.registerTool(
      "list_workspace",
      {
        description:
          "List the documents explicitly shared by this Trinity user. Snapshot may be older than local edits.",
        inputSchema: {},
        annotations: { readOnlyHint: true },
      },
      async () => {
        const row = db
          .prepare("SELECT content,updated FROM vault WHERE user_id=?")
          .get(g.user_id) as { content: string; updated: string } | undefined;
        return result(
          row
            ? {
                updated: row.updated,
                documents: JSON.parse(row.content).map(
                  (d: { id: string; title: string; kind: string }) => ({
                    id: d.id,
                    title: d.title,
                    kind: d.kind,
                  }),
                ),
              }
            : { documents: [], message: "No workspace snapshot shared yet." },
        );
      },
    );
    server.registerTool(
      "read_document",
      {
        description: "Read one explicitly shared Markdown document.",
        inputSchema: { id: z.string().max(200) },
        annotations: { readOnlyHint: true },
      },
      async ({ id }) => {
        const row = db
          .prepare("SELECT content FROM vault WHERE user_id=?")
          .get(g.user_id) as { content: string } | undefined;
        const doc = row
          ? JSON.parse(row.content).find((d: { id: string }) => d.id === id)
          : null;
        return doc
          ? result(doc)
          : { ...result({ error: "Document not found" }), isError: true };
      },
    );
    if (g.scope.split(" ").includes(WRITE)) {
      server.registerTool(
        "propose_note",
        {
          description:
            "Create a note draft in the user inbox. The user must accept it in Trinity.",
          inputSchema: {
            title: z.string().min(1).max(200),
            body: z.string().max(12000),
          },
          annotations: { destructiveHint: false, openWorldHint: false },
        },
        async ({ title, body }) => {
          const id = random();
          db.prepare("INSERT INTO inbox VALUES(?,?,?,?,?,?)").run(
            id,
            g.user_id,
            "note",
            title,
            body,
            new Date().toISOString(),
          );
          return result({ id, status: "awaiting_user_acceptance" });
        },
      );
      server.registerTool(
        "propose_task",
        {
          description:
            "Propose a task. Never changes existing tasks. User chooses whether to add it to their board.",
          inputSchema: {
            title: z.string().min(1).max(200),
            description: z.string().max(12000),
          },
          annotations: { destructiveHint: false, openWorldHint: false },
        },
        async ({ title, description }) => {
          const id = random();
          db.prepare("INSERT INTO inbox VALUES(?,?,?,?,?,?)").run(
            id,
            g.user_id,
            "task",
            title,
            description,
            new Date().toISOString(),
          );
          return result({ id, status: "awaiting_user_acceptance" });
        },
      );
    }
    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
    });
    await server.connect(transport);
    try {
      return await transport.handleRequest(req);
    } finally {
      await server.close();
    }
  } catch {
    return json(
      { error: "MCP derzeit nicht verfügbar. Serverkonfiguration prüfen." },
      503,
    );
  }
}
export async function GET(req: Request) {
  try {
    if (!bearer(req))
      return new Response(null, {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer resource_metadata="${issuer()}/.well-known/oauth-protected-resource/mcp", scope="${READ}"`,
        },
      });
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  } catch {
    return json({ error: "MCP noch nicht aktiviert" }, 503);
  }
}
