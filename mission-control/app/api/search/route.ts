import { voiceSession } from "@/lib/voice/server";
import { failure, json } from "@/lib/auth/http";
import { searchOwnContent } from "@/lib/workspace/server-search";
export async function GET(req: Request) {
  try {
    const { sb, user } = await voiceSession();
    const q = (new URL(req.url).searchParams.get("q") || "")
      .trim()
      .slice(0, 120);
    const items = await searchOwnContent(sb, user.id, q);
    return json({ success: true, userId: user.id, items });
  } catch (e) {
    return failure(e);
  }
}
