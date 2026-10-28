import { createHash } from "node:crypto";
import { usesSupabase } from "@/lib/supabase/config";
import katalog from "./katalog.json";
import type { Course, Lesson, Module, OutlineItem } from "./data";
import type { LibraryCourse } from "@/components/courses/CourseLibrary";

// Local, read-only preview of the imported catalogue: only without Supabase login and with an explicit flag.
export const previewMode = () => process.env.KURSRAUM_PREVIEW === "1" && !usesSupabase();

const uid = (s: string) => { const h = createHash("sha1").update(s).digest("hex"); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`; };
type K = (typeof katalog)[number];
type KLesson = { title: string; summary?: string | null; body?: string | null; kind?: string; status?: string; thumb_url?: string | null; attachments?: { name: string; url: string }[]; video_source?: string; video_ref?: string | null };
const lessonsOf = (m: K["modules"][number]): KLesson[] => "lessons" in m ? (m as { lessons: KLesson[] }).lessons : "lesson" in m ? [(m as { lesson: KLesson }).lesson] : [];

function courseOf(k: K): Course {
  return { id: uid(k.slug), slug: k.slug, title: k.title, subtitle: null, description: k.description, category: k.category, cover_url: k.cover_url,
    price_eur: k.price_eur, products: [], status: "published", position: k.position };
}
export function previewLibrary(): LibraryCourse[] {
  return katalog.map(k => ({ ...courseOf(k), lessons: k.modules.reduce((n, m) => n + lessonsOf(m).length, 0), done: 0, next: null }));
}
export function previewCourse(slug: string) {
  const k = katalog.find(c => c.slug === slug);
  if (!k) return null;
  const course = courseOf(k);
  const modules: Module[] = [], lessons: Lesson[] = [];
  k.modules.forEach((m, i) => {
    const mod: Module = { id: uid(`${slug}/${i}`), course_id: course.id, title: m.title, summary: m.summary, thumb_url: ("thumb_url" in m ? m.thumb_url as string | null : null), position: i };
    modules.push(mod);
    lessonsOf(m).forEach((l, j) => lessons.push({
      id: uid(`${slug}/${i}/${j}`), course_id: course.id, module_id: mod.id, title: l.title, summary: l.summary ?? null, body: l.body ?? null,
      kind: (l.kind ?? "video") as Lesson["kind"], thumb_url: l.thumb_url ?? null, attachments: l.attachments ?? [], status: l.status === "draft" ? "draft" : "published",
      video_source: (l.video_source ?? "none") as Lesson["video_source"], video_ref: l.video_ref ?? null, clip_start: null, clip_end: null, chapters: [],
      duration_s: null, free_preview: false, position: i * 1000 + j,
    }));
  });
  const outline: OutlineItem[] = lessons.map(l => ({ id: l.id, module_id: l.module_id, title: l.title, position: l.position, duration_s: null, free_preview: false, unlocked: true }));
  return { course, modules, lessons, outline, progress: [] };
}
