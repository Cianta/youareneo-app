import { json, failure, sameOrigin, bodyOf, HttpError } from "@/lib/auth/http";
import { kursSession } from "@/lib/courses/server";
import { TABLES, kindOf, rowOf, idOf } from "@/lib/courses/studio";
import katalogJson from "@/lib/courses/katalog.json";

// Shape written by scripts/memberspot-to-kursraum.ts.
type ImportLesson = { title: string; summary: string | null; body: string | null; kind: string; status: string; thumb_url: string | null; attachments: { name: string; url: string }[]; video_source: string; video_ref: string | null };
type ImportCourse = { slug: string; title: string; category: string | null; description: string | null; cover_url: string | null; price_eur: number | null; position: number;
  modules: { title: string; summary: string | null; thumb_url: string | null; lessons: ImportLesson[] }[] };
const katalog = katalogJson as unknown as ImportCourse[];

// RLS lets only 'kurs-studio' members write; the session check gives a clear message first.
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { sb } = await kursSession({ studio: true });
    const body = await bodyOf(req);
    if (body.action === "import") return json({ success: true, ...(await importKatalog(sb)) });
    const kind = kindOf(body.kind), id = idOf(body.id);
    const row: Record<string, unknown> = rowOf(kind, (body.data ?? {}) as Record<string, unknown>);
    const query = id ? sb.from(TABLES[kind]).update(row).eq("id", id) : sb.from(TABLES[kind]).insert(row);
    const { data, error } = await query.select().single();
    if (error?.code === "23505") throw new HttpError(409, "Dieser Kurzname ist schon vergeben.");
    if (error) throw error;
    return json({ success: true, row: data });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const { sb } = await kursSession({ studio: true });
    const body = await bodyOf(req);
    const id = idOf(body.id);
    if (!id) throw new HttpError(400, "Eintrag fehlt.");
    const { error } = await sb.from(TABLES[kindOf(body.kind)]).delete().eq("id", id);
    if (error) throw error;
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}

/** Imports the course catalogue taken over from Memberspot as drafts, same order and structure. Existing slugs stay untouched. */
async function importKatalog(sb: Awaited<ReturnType<typeof kursSession>>["sb"]) {
  const { data: existing, error } = await sb.from("kurs_courses").select("slug");
  if (error) throw error;
  const known = new Set((existing ?? []).map(c => c.slug));
  let created = 0;
  for (const k of katalog) {
    if (known.has(k.slug)) continue;
    const { data: course, error: e1 } = await sb.from("kurs_courses").insert({
      slug: k.slug, title: k.title, category: k.category, description: k.description, cover_url: k.cover_url,
      price_eur: k.price_eur, position: k.position, products: ["kursbibliothek", `kurs-${k.slug}`], status: "draft",
    }).select("id").single();
    if (e1) throw e1;
    for (const [i, m] of k.modules.entries()) {
      const { data: mod, error: e2 } = await sb.from("kurs_modules").insert({ course_id: course.id, title: m.title, summary: m.summary, thumb_url: m.thumb_url, position: i }).select("id").single();
      if (e2) throw e2;
      if (!m.lessons.length) continue;
      const { error: e3 } = await sb.from("kurs_lessons").insert(m.lessons.map((l, j) => ({
        course_id: course.id, module_id: mod.id, title: l.title, summary: l.summary, body: l.body, kind: l.kind, status: l.status,
        thumb_url: l.thumb_url, attachments: l.attachments, video_source: l.video_source, video_ref: l.video_ref, position: i * 1000 + j,
      })));
      if (e3) throw e3;
    }
    created++;
  }
  return { created, skipped: katalog.length - created };
}
