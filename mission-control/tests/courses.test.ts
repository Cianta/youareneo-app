import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { htmlToText, parseBody } from "../lib/courses/richtext";
import { embedOf, youtubeId, vimeoId, httpsUrl, chaptersOf, chaptersText, youtubeWarning } from "../lib/courses/video";
import { courseOf, lessonOf, productsOf, slugOf } from "../lib/courses/studio";
import katalog from "../lib/courses/katalog.json";

const C = "11111111-1111-4111-8111-111111111111", M = "22222222-2222-4222-8222-222222222222";

test("youtube links of every shape become a privacy-friendly embed with clip points", () => {
  for (const ref of ["dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3", "https://youtu.be/dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ"]) assert.equal(youtubeId(ref), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://evil.test/watch?v=dQw4w9WgXcQ"), null);
  const e = embedOf("youtube", "https://youtu.be/dQw4w9WgXcQ", 30, 90)!;
  assert.equal(e.kind, "iframe"); assert(e.src.startsWith("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?"));
  assert(e.src.includes("start=30") && e.src.includes("end=90"));
});
test("riverside accepts a pasted iframe snippet or link but only on riverside hosts and https", () => {
  assert.equal(embedOf("riverside", '<iframe src="https://riverside.fm/embed/abc" width="100%"></iframe>')?.src, "https://riverside.fm/embed/abc");
  assert.equal(embedOf("riverside", "https://share.riverside.com/v/xyz")?.kind, "iframe");
  for (const bad of ["http://riverside.fm/embed/a", "https://riverside.fm.evil.test/a", "javascript:alert(1)", '<iframe src="https://evil.test"></iframe>']) assert.equal(embedOf("riverside", bad), null);
});
test("own server videos use media fragments for non-destructive cuts, vimeo ids are extracted", () => {
  assert.deepEqual(embedOf("url", "https://media.youareneo.com/kurs/a.mp4", 10, 70), { kind: "video", src: "https://media.youareneo.com/kurs/a.mp4#t=10,70" });
  assert.equal(embedOf("url", "https://u:p@media.test/a.mp4"), null);
  assert.equal(vimeoId("https://vimeo.com/123456789"), "123456789");
  assert.equal(embedOf("none", "x"), null); assert.equal(httpsUrl("ftp://a.test/x"), null);
});
test("chapters round-trip through the studio textarea and ignore malformed lines", () => {
  const ch = chaptersOf("12:30 Atem\nquatsch\n0:00 Ankommen\n1:02:03 Ausklang");
  assert.deepEqual(ch, [{ t: 0, label: "Ankommen" }, { t: 750, label: "Atem" }, { t: 3723, label: "Ausklang" }]);
  assert.deepEqual(chaptersOf(chaptersText(ch)), ch);
});
test("paid courses warn against YouTube unless the lesson is a free preview", () => {
  assert(youtubeWarning("youtube", true, false)); assert.equal(youtubeWarning("youtube", true, true), null);
  assert.equal(youtubeWarning("youtube", false, false), null); assert.equal(youtubeWarning("riverside", true, false), null);
});
test("studio input is validated before it reaches the database", () => {
  assert.equal(slugOf("Rücken befreien – Wirbelsäule & Straße"), "ruecken-befreien-wirbelsaeule-strasse");
  assert.deepEqual(productsOf("Kursbibliothek, kurs-yoga  foerder, <bad>"), ["kursbibliothek", "kurs-yoga", "foerder"]);
  const c = courseOf({ title: " Yoga ", price_eur: "60", products: "", status: "published" });
  assert.equal(c.slug, "yoga"); assert.equal(c.price_eur, 60); assert.deepEqual(c.products, []); assert.equal(c.status, "published");
  assert.throws(() => courseOf({ title: "" })); assert.throws(() => courseOf({ title: "x", cover_url: "http://a.test/x.jpg" }));
  const l = lessonOf({ course_id: C, module_id: M, title: "Eins", video_source: "evil", clip_start: "5", clip_end: "", chapters: "1:00 A", free_preview: true });
  assert.equal(l.video_source, "none"); assert.equal(l.video_ref, null); assert.equal(l.clip_end, null); assert.deepEqual(l.chapters, [{ t: 60, label: "A" }]);
  assert.throws(() => lessonOf({ course_id: C, module_id: M, title: "x", clip_start: 50, clip_end: 20 }));
  assert.throws(() => lessonOf({ course_id: "nope", module_id: M, title: "x" }));
});
test("imported catalogue has unique valid slugs, local or https images and valid lesson fields", () => {
  const list = katalog as unknown as { slug: string; cover_url: string | null; modules: { lessons: { title: string; kind: string; status: string; video_source: string; thumb_url: string | null }[] }[] }[];
  assert.equal(new Set(list.map(k => k.slug)).size, list.length);
  for (const k of list) {
    assert.equal(slugOf(k.slug), k.slug); assert(!k.cover_url || /^(https:\/\/|\/kurse\/)/.test(k.cover_url));
    if (k.cover_url?.startsWith("/kurse/")) assert(existsSync("public" + k.cover_url));
    for (const l of k.modules.flatMap(m => m.lessons)) {
      assert(l.title); assert(["video", "pdf", "text", "live"].includes(l.kind)); assert(["draft", "published"].includes(l.status));
      assert(["none", "riverside", "youtube", "vimeo", "url"].includes(l.video_source)); assert(!l.thumb_url || /^(https:\/\/|\/kurse\/)/.test(l.thumb_url));
    }
  }
});
test("memberspot html becomes the safe markdown subset and renders back into blocks", () => {
  const text = htmlToText('<h2>Übung</h2><p>Setz dich <strong>bequem</strong> hin &amp; atme.</p><ul><li><p>Eins</p></li><li><p>Zwei</p></li></ul><p><a href="javascript:alert(1)">böse</a> <a href="https://youareneo.com">Seite</a></p><script>x</script>');
  assert.equal(text, "## Übung\n\nSetz dich **bequem** hin & atme.\n\n- Eins\n- Zwei\n\nböse [Seite](https://youareneo.com)\n\nx");
  const blocks = parseBody(text);
  assert.deepEqual(blocks.map(b => b.kind), ["h", "p", "ul", "p", "p"]);
  assert.deepEqual((blocks[3] as { inline: { kind: string; href?: string }[] }).inline.filter(i => i.kind === "link").map(i => i.href), ["https://youareneo.com"]);
  assert.equal(htmlToText('<p data-placeholder="Inhalt" class="is-empty"><br class="ProseMirror-trailingBreak"></p>'), "");
});
test("migration keeps neo_access as the only entitlement source and protects video references", () => {
  const sql = readFileSync("supabase/migrations/20261028120000_kursraum.sql", "utf8");
  for (const t of ["kurs_courses", "kurs_modules", "kurs_lessons", "kurs_progress"]) assert(sql.includes(`alter table public.${t} enable row level security`));
  assert(sql.includes("revoke all on public.kurs_courses, public.kurs_modules, public.kurs_lessons, public.kurs_progress from public, anon"));
  assert(!/kurs_outline[\s\S]*?returns table \([^)]*video_ref/.test(sql));
  assert(!/alter table public\.neo_access/.test(sql));
});
