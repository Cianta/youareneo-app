import { json, failure } from "@/lib/auth/http";
import { voiceSession } from "@/lib/voice/server";
import { ownGraph } from "@/lib/brain/server";
export async function GET(req: Request) {
  try {
    const { sb, user } = await voiceSession();
    return json({
      success: true,
      graph: await ownGraph(
        sb,
        user.id,
        new URL(req.url).searchParams.get("refresh") === "1",
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
