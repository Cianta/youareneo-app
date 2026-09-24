import { exchange, json } from "@/lib/mcp/oauth";
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (raw.length > 8192) return json({ error: "invalid_request" }, 400);
    return json(exchange(new URLSearchParams(raw)));
  } catch (e) {
    const error =
      e instanceof Error &&
      ["invalid_target", "invalid_grant", "unsupported_grant_type"].includes(
        e.message,
      )
        ? e.message
        : "invalid_request";
    return json({ error }, 400);
  }
}
export { OPTIONS } from "../register/route";
