/** SSE chunks can end anywhere, including inside UTF-8 characters or JSON. */
export async function readAgentStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let doneMarker = false;
  function consume(line: string) {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload) return;
    if (payload === "[DONE]") {
      doneMarker = true;
      return;
    }
    const data = JSON.parse(payload);
    if (data.error) throw new Error(String(data.error));
    const text = data.text ?? data.delta;
    if (typeof text === "string") {
      full += text;
      onChunk(full);
    }
  }
  try {
    while (!doneMarker) {
      const { done, value } = await reader.read();
      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        consume(line);
        if (doneMarker) break;
      }
      if (done) {
        if (buffer.trim()) consume(buffer);
        break;
      }
    }
    if (!doneMarker)
      throw new Error(
        "Die Verbindung wurde unterbrochen. Bitte versuche es erneut.",
      );
    return full;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
