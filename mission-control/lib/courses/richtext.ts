// Lesson text is stored as a small Markdown subset, so the studio stays a plain textarea and
// the player never injects HTML. Memberspot's tiptap HTML is converted once at import.
export type Inline = { kind: "text" | "strong" | "em" | "link"; text: string; href?: string };
export type Block =
  | { kind: "p" | "quote"; inline: Inline[] }
  | { kind: "h"; level: 2 | 3; inline: Inline[] }
  | { kind: "ul" | "ol"; items: Inline[][] };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ", apos: "'" };
const decode = (s: string) => s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (m, e: string) =>
  e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m);

/** tiptap/ProseMirror HTML → Markdown subset. Unknown tags keep their text. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  let s = html.replace(/\r/g, "").replace(/<br[^>]*>/gi, "\n");
  s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) => /^https:\/\//.test(decode(href)) ? `[${text}](${decode(href)})` : text);
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**").replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, "_$2_");
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n## $1\n\n").replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n").replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, "\n\n### $1\n\n");
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner: string) => "\n\n" + [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m, i) => `${i + 1}. ${m[1].replace(/<\/?p[^>]*>/gi, " ").trim()}`).join("\n") + "\n\n");
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner: string) => "\n\n" + [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => `- ${m[1].replace(/<\/?p[^>]*>/gi, " ").trim()}`).join("\n") + "\n\n");
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner: string) => "\n\n> " + inner.replace(/<[^>]+>/g, " ").trim() + "\n\n");
  s = s.replace(/<\/(p|div)>/gi, "\n\n").replace(/<[^>]+>/g, "");
  return decode(s).split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function inline(text: string): Inline[] {
  const out: Inline[] = [], re = /\*\*(.+?)\*\*|_(.+?)_|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    out.push(m[1] ? { kind: "strong", text: m[1] } : m[2] ? { kind: "em", text: m[2] } : { kind: "link", text: m[3], href: m[4] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

export function parseBody(body: string | null | undefined): Block[] {
  return (body ?? "").split(/\n{2,}/).map(chunk => chunk.trim()).filter(Boolean).map((chunk): Block => {
    const lines = chunk.split("\n");
    if (lines.every(l => /^- /.test(l))) return { kind: "ul", items: lines.map(l => inline(l.slice(2))) };
    if (lines.every(l => /^\d+\. /.test(l))) return { kind: "ol", items: lines.map(l => inline(l.replace(/^\d+\. /, ""))) };
    if (/^### /.test(chunk)) return { kind: "h", level: 3, inline: inline(chunk.slice(4)) };
    if (/^## /.test(chunk)) return { kind: "h", level: 2, inline: inline(chunk.slice(3)) };
    if (/^> /.test(chunk)) return { kind: "quote", inline: inline(chunk.replace(/^> ?/gm, "")) };
    return { kind: "p", inline: inline(lines.join(" ")) };
  });
}
