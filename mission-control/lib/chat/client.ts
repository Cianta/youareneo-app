import type { ChatEvent } from "./contracts";
export async function readChat(
  response: Response,
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw Error(data.error || "Der Chat ist gerade nicht verfügbar.");
  }
  const reader = response.body?.getReader();
  if (!reader) throw Error("Die Antwort fehlt.");
  const decoder = new TextDecoder();
  let pending = "",
    done = false,
    total = 0;
  try {
    while (true) {
      if (signal.aborted) throw new DOMException("Abgebrochen", "AbortError");
      const next = await reader.read();
      if (next.done) break;
      total += next.value.length;
      if (total > 100000) throw Error("Die Antwort war zu lang.");
      pending += decoder.decode(next.value, { stream: true });
      let idx: number;
      while ((idx = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, idx);
        pending = pending.slice(idx + 1);
        if (!line.trim()) continue;
        const event = JSON.parse(line) as ChatEvent;
        if (event.type === "error") throw Error(event.message);
        if (event.type === "done") done = true;
        onEvent(event);
      }
    }
    if (!done) throw Error("Die Antwort wurde unterbrochen.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
