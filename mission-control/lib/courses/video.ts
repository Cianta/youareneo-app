export const VIDEO_SOURCES = [
  { id: "none", label: "Kein Video" },
  { id: "riverside", label: "Riverside" },
  { id: "youtube", label: "YouTube (nur frei/Vorschau)" },
  { id: "vimeo", label: "Vimeo" },
  { id: "url", label: "Eigener Server (mp4/HLS)" },
] as const;
export type VideoSource = (typeof VIDEO_SOURCES)[number]["id"];
export type Chapter = { t: number; label: string };
export type Embed = { kind: "iframe" | "video"; src: string } | null;

const RIVERSIDE_HOSTS = ["riverside.fm", "riverside.com"];

/** Accepts a URL or a pasted <iframe> snippet and returns a safe https URL, or null. */
export function httpsUrl(raw: string | null | undefined, hosts?: string[]): URL | null {
  const value = (raw ?? "").trim();
  const src = value.startsWith("<") ? value.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? "" : value;
  let url: URL;
  try { url = new URL(src); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (hosts && !hosts.some(h => url.hostname === h || url.hostname.endsWith("." + h))) return null;
  return url;
}

export function youtubeId(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const url = httpsUrl(value, ["youtube.com", "youtu.be", "youtube-nocookie.com"]);
  if (!url) return null;
  const id = url.hostname.endsWith("youtu.be") ? url.pathname.slice(1)
    : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] ?? "";
  return /^[\w-]{11}$/.test(id) ? id : null;
}

export function vimeoId(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (/^\d{6,12}$/.test(value)) return value;
  const url = httpsUrl(value, ["vimeo.com"]);
  return url?.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)?.[1] ?? null;
}

/** Turns a lesson's source into something the player can render. Clip points re-cut without re-encoding. */
export function embedOf(source: VideoSource, ref: string | null | undefined, start?: number | null, end?: number | null): Embed {
  const s = start && start > 0 ? Math.floor(start) : 0, e = end && end > s ? Math.floor(end) : 0;
  if (source === "youtube") {
    const id = youtubeId(ref);
    if (!id) return null;
    const q = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
    if (s) q.set("start", String(s));
    if (e) q.set("end", String(e));
    return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?${q}` };
  }
  if (source === "vimeo") {
    const id = vimeoId(ref);
    return id ? { kind: "iframe", src: `https://player.vimeo.com/video/${id}?dnt=1${s ? `#t=${s}s` : ""}` } : null;
  }
  if (source === "riverside") {
    const url = httpsUrl(ref, RIVERSIDE_HOSTS);
    return url ? { kind: "iframe", src: url.toString() } : null;
  }
  if (source === "url") {
    const url = httpsUrl(ref);
    if (!url) return null;
    if (s || e) url.hash = `t=${s}${e ? "," + e : ""}`;
    return { kind: "video", src: url.toString() };
  }
  return null;
}

/** "12:30 Einführung" lines ⇄ chapters, so the studio stays a plain textarea. */
export function chaptersOf(text: string): Chapter[] {
  return text.split("\n").map(line => line.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})\s+(.{1,120})$/)).filter(Boolean)
    .map(m => ({ t: Number(m![1] ?? 0) * 3600 + Number(m![2]) * 60 + Number(m![3]), label: m![4].trim() }))
    .sort((a, b) => a.t - b.t).slice(0, 100);
}
export function clock(seconds: number) {
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds / 60) % 60, s = Math.floor(seconds % 60);
  return (h ? `${h}:${String(m).padStart(2, "0")}` : String(m)) + ":" + String(s).padStart(2, "0");
}
export const attachmentsText = (list: { name: string; url: string }[]) => list.map(a => `${a.name} | ${a.url}`).join("\n");
export const chaptersText =(chapters: Chapter[]) => chapters.map(c => `${clock(c.t)} ${c.label}`).join("\n");

/** YouTube's API policy forbids paid access to embedded YouTube videos. */
export function youtubeWarning(source: VideoSource, coursePaid: boolean, freePreview: boolean) {
  return source === "youtube" && coursePaid && !freePreview
    ? "YouTube nur für freie Lektionen oder Vorschauen nutzen: Bezahlzugang zu eingebetteten YouTube-Videos verbieten die YouTube-Richtlinien (III.F.3.a)."
    : null;
}
