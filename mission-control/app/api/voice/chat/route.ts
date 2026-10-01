import { failure, sameOrigin } from "@/lib/auth/http";
import { voiceSession, reserveUsage } from "@/lib/voice/server";
import { smallJson } from "@/lib/voice/validation";
import { chatMessages } from "@/lib/chat/validation";
import {
  chatReady,
  ownContext,
  answer,
  responseStream,
} from "@/lib/chat/server";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb, user } = await voiceSession();
    chatReady();
    const body = await smallJson(req),
      messages = chatMessages(body.messages);
    const notes =
      body.includeNotes === true
        ? await ownContext(sb, user.id, messages.at(-1)!.content)
        : [];
    await reserveUsage(user.id, 0);
    const abort = new AbortController();
    const end = () => abort.abort();
    req.signal.addEventListener("abort", end, { once: true });
    if (req.signal.aborted) end();
    const timer = setTimeout(end, 90000);
    return new Response(
      responseStream(answer(messages, notes, abort.signal), () => {
        clearTimeout(timer);
        req.signal.removeEventListener("abort", end);
        end();
      }),
      {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "private, no-store",
          "X-Accel-Buffering": "no",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
