// Converts the read-only Memberspot export (collected in the admin UI) into the Kursraum import file.
// Usage: npx tsx scripts/memberspot-to-kursraum.ts <memberspot-export.json> [lib/courses/katalog.json]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { htmlToText } from "../lib/courses/richtext";
import { slugOf } from "../lib/courses/studio";

type MsLesson = { title: string; name?: string | null; description?: string | null; html?: string | null; type?: string | null; status?: string | null; noVideo?: boolean; videos?: string[]; iframes?: string[]; attachments?: { name: string; url: string }[]; thumb?: string | null };
type MsChapter = { title: string; header?: string; thumb?: string | null; lessons: MsLesson[] };
type MsCourse = { href: string; title: string; cover: string | null; cardText?: string; chapters: MsChapter[] };

const [src, out = "lib/courses/katalog.json"] = process.argv.slice(2);
const ms = JSON.parse(readFileSync(src, "utf8")) as { courses: MsCourse[]; cats?: Record<string, string[]>; images?: Record<string, string> };
const categoryOf = (href: string) => Object.entries(ms.cats ?? {}).find(([name, list]) => name !== "Ohne Kategorie" && list.includes(href))?.[0] ?? null;
// Memberspot's CDN refuses outside requests, so copied images are written to public/kurse/ and served by guiding.space.
mkdirSync("public/kurse", { recursive: true });
const imageOf = (u?: string | null) => {
  if (!u || u.includes("/assets/images/defaults/")) return null;
  const data = ms.images?.[u];
  if (!data) return u.startsWith("https://fvd-data.s3.amazonaws.com/") ? u : null;
  const m = data.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/);
  if (!m) return null;
  const file = `${createHash("sha1").update(u.split("?")[0]).digest("hex").slice(0, 16)}.${m[1].replace("jpeg", "jpg")}`;
  writeFileSync(`public/kurse/${file}`, Buffer.from(m[2], "base64"));
  return `/kurse/${file}`;
};
const https = imageOf;
const kindOf = (type?: string | null) => /pdf/i.test(type ?? "") ? "pdf" : /text|artikel|iframe|agent|aufgabe/i.test(type ?? "") ? "text" : /live/i.test(type ?? "") ? "live" : "video";
// The card text is "Title\nDescription\n<chapters>\n<lessons>\n0:00"; the description is everything between.
const descriptionOf = (c: MsCourse) => { const lines = (c.cardText ?? "").split("\n").map(l => l.trim()).filter(Boolean); const i = lines.indexOf(c.title); const rest = lines.slice(i + 1).filter(l => !/^\d+$|^\d+:\d\d$/.test(l)); return rest.join("\n\n") || null; };
const embed = (l: MsLesson) => (l.iframes ?? []).find(s => /youtube|youtu\.be|vimeo|riverside/.test(s)) ?? null;

const used = new Set<string>();
const courses = ms.courses.map((c, i) => {
  let slug = slugOf(c.title) || `kurs-${i + 1}`;
  while (used.has(slug)) slug += "-2";
  used.add(slug);
  return {
    slug, title: c.title.slice(0, 200), category: categoryOf(c.href), description: descriptionOf(c), cover_url: https(c.cover), price_eur: null, position: i,
    modules: c.chapters.map((ch, mi) => ({
      title: (ch.title || (ch.header ?? "").split("\n")[0].replace(/\s*(Veröffentlicht|Entwurf|Bald verfügbar|Geplant)\s*$/, "").trim() || `Kapitel ${mi + 1}`).slice(0, 200), summary: (ch.header ?? "").replace(ch.title, "").replace(/\s*(Veröffentlicht|Entwurf|Bald verfügbar|Geplant)\s*$/, "").replace(/\.\.\.$/, "…").trim().slice(0, 2000) || null,
      thumb_url: https(ch.thumb),
      lessons: ch.lessons.map(l => {
        const src = embed(l);
        return {
          title: (l.name || l.title).slice(0, 200), summary: l.description?.slice(0, 1000) || null, body: htmlToText(l.html) || null, kind: kindOf(l.type),
          status: l.status === "Veröffentlicht" ? "published" : "draft", thumb_url: https(l.thumb),
          // Signed Memberspot file links expire; only permanent https links are kept. iFrame lessons keep their page as a link.
          attachments: [...(l.attachments ?? []).filter(a => a.url.startsWith("https://") && !/mspotcdn|X-Goog-Signature|token=/i.test(a.url)).map(a => ({ name: a.name || "Datei", url: a.url })),
            ...(/iframe/i.test(l.type ?? "") ? (l.iframes ?? []).filter(s => s.startsWith("https://") && !src).map(s => ({ name: "Eingebettete Seite öffnen", url: s })) : [])],
          video_source: src ? (/riverside/.test(src) ? "riverside" : /vimeo/.test(src) ? "vimeo" : "youtube") : "none", video_ref: src,
          // Memberspot-hosted media cannot be embedded elsewhere; these lessons need a new video source.
          video_missing: kindOf(l.type) === "video" && !src && !l.noVideo,
        };
      }),
    })),
  };
});
writeFileSync(out, JSON.stringify(courses, null, 1));
const lessons = courses.flatMap(c => c.modules.flatMap(m => m.lessons));
console.log(`${courses.length} Kurse, ${courses.reduce((n, c) => n + c.modules.length, 0)} Module, ${lessons.length} Lektionen, ${lessons.filter(l => l.video_missing).length} mit Memberspot-Video zum Umziehen → ${out}`);
