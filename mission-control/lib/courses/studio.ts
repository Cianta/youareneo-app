import { HttpError } from "@/lib/auth/http";
import { chaptersOf, VIDEO_SOURCES, type VideoSource } from "./video";

const text = (v: unknown, max: number, field: string, required = false) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new HttpError(400, `${field} fehlt.`);
  if (s.length > max) throw new HttpError(400, `${field} ist zu lang.`);
  return s || null;
};
const int = (v: unknown) => v === "" || v == null ? null : Math.max(0, Math.floor(Number(v))) || 0;
const id = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null;
export const slugOf = (v: string) => v.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
/** Course-level unlock keys follow neo_access product names. */
export const productsOf = (v: unknown) => [...new Set((Array.isArray(v) ? v : String(v ?? "").split(/[\s,]+/))
  .map(p => String(p).trim().toLowerCase()).filter(p => /^[a-z][a-z0-9_-]{0,63}$/.test(p)))].slice(0, 20);

export function courseOf(d: Record<string, unknown>) {
  const title = text(d.title, 200, "Titel", true)!;
  const slug = slugOf(String(d.slug || title));
  if (!slug) throw new HttpError(400, "Kurzname fehlt.");
  const cover = text(d.cover_url, 2000, "Titelbild");
  if (cover && !/^(https:\/\/|\/kurse\/[\w.-]+$)/.test(cover)) throw new HttpError(400, "Titelbild braucht eine https-Adresse.");
  const price = d.price_eur === "" || d.price_eur == null ? null : Number(d.price_eur);
  if (price != null && !(price >= 0 && price < 1_000_000)) throw new HttpError(400, "Preis ist ungültig.");
  return {
    slug, title, subtitle: text(d.subtitle, 300, "Untertitel"), description: text(d.description, 20000, "Beschreibung"),
    category: text(d.category, 100, "Kategorie"), cover_url: cover, price_eur: price, products: productsOf(d.products),
    status: d.status === "published" ? "published" : "draft", position: int(d.position) ?? 0, updated_at: new Date().toISOString(),
  };
}
/** "Name | https://…" per line ⇄ attachment list. */
export function attachmentsOf(v: unknown) {
  return String(v ?? "").split("\n").map(l => l.split("|").map(s => s.trim())).filter(([, url]) => url?.startsWith("https://"))
    .map(([name, url]) => ({ name: (name || "Datei").slice(0, 200), url: url.slice(0, 2000) })).slice(0, 30);
}
export function moduleOf(d: Record<string, unknown>) {
  const course_id = id(d.course_id);
  if (!course_id) throw new HttpError(400, "Kurs fehlt.");
  return { course_id, title: text(d.title, 200, "Modultitel", true)!, summary: text(d.summary, 2000, "Zusammenfassung"), position: int(d.position) ?? 0 };
}
export function lessonOf(d: Record<string, unknown>) {
  const course_id = id(d.course_id), module_id = id(d.module_id);
  if (!course_id || !module_id) throw new HttpError(400, "Kurs oder Modul fehlt.");
  const video_source = (VIDEO_SOURCES.some(s => s.id === d.video_source) ? d.video_source : "none") as VideoSource;
  const clip_start = int(d.clip_start), clip_end = int(d.clip_end) || null;
  if (clip_end != null && clip_end <= (clip_start ?? 0)) throw new HttpError(400, "Das Ende muss nach dem Start liegen.");
  return {
    course_id, module_id, title: text(d.title, 200, "Lektionstitel", true)!, summary: text(d.summary, 1000, "Kurzbeschreibung"), body: text(d.body, 100000, "Text"),
    kind: ["video", "pdf", "text", "live"].includes(String(d.kind)) ? String(d.kind) : "video", status: d.status === "draft" ? "draft" : "published",
    attachments: attachmentsOf(d.attachments),
    video_source, video_ref: video_source === "none" ? null : text(d.video_ref, 2000, "Video"), clip_start, clip_end,
    chapters: chaptersOf(String(d.chapters ?? "")),
    duration_s: int(d.duration_s), free_preview: d.free_preview === true, position: int(d.position) ?? 0,
  };
}
export const TABLES = { course: "kurs_courses", module: "kurs_modules", lesson: "kurs_lessons" } as const;
export type Kind = keyof typeof TABLES;
export const kindOf = (v: unknown): Kind => { if (v === "course" || v === "module" || v === "lesson") return v; throw new HttpError(400, "Unbekannter Typ."); };
export const rowOf = (kind: Kind, d: Record<string, unknown>) => kind === "course" ? courseOf(d) : kind === "module" ? moduleOf(d) : lessonOf(d);
export { id as idOf };
