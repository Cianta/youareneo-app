export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "sources"; notes: { id: string; title: string }[] }
  | { type: "done" }
  | { type: "error"; message: string };
export function speechChunks(text: string, max = 1900) {
  const result: string[] = [];
  let rest = text.trim();
  while (rest) {
    let end = Math.min(max, rest.length);
    if (end < rest.length) {
      const boundary = Math.max(
        rest.lastIndexOf(". ", end),
        rest.lastIndexOf("! ", end),
        rest.lastIndexOf("? ", end),
        rest.lastIndexOf("\n", end),
      );
      if (boundary > max / 2) end = boundary + 1;
      else {
        const space = rest.lastIndexOf(" ", end);
        if (space > max / 2) end = space;
      }
    }
    result.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  return result;
}
