import type { SupabaseClient } from "@supabase/supabase-js";
import type { Chapter, VideoSource } from "./video";

export type Course = {
  id: string; slug: string; title: string; subtitle: string | null; description: string | null;
  category: string | null; cover_url: string | null; price_eur: number | null; products: string[];
  status: "draft" | "published"; position: number;
};
export type Module = { id: string; course_id: string; title: string; summary: string | null; thumb_url: string | null; position: number };
export type Attachment = { name: string; url: string };
export type Lesson = {
  id: string; course_id: string; module_id: string; title: string; summary: string | null; body: string | null;
  kind: "video" | "pdf" | "text" | "live"; thumb_url: string | null; attachments: Attachment[]; status: "draft" | "published";
  video_source: VideoSource; video_ref: string | null; clip_start: number | null; clip_end: number | null;
  chapters: Chapter[]; duration_s: number | null; free_preview: boolean; position: number;
};
export type OutlineItem = Pick<Lesson, "id" | "module_id" | "title" | "position" | "duration_s" | "free_preview"> & { unlocked: boolean };
export type Progress = { lesson_id: string; completed_at: string | null; position_s: number };

const COURSE = "id,slug,title,subtitle,description,category,cover_url,price_eur,products,status,position";
export const coursePaid = (course: Pick<Course, "products">) => course.products.length > 0;

export async function listCourses(sb: SupabaseClient) {
  const { data, error } = await sb.from("kurs_courses").select(COURSE).order("position").order("title");
  if (error) throw error;
  return (data ?? []) as Course[];
}

/** Library view: every visible course with lesson count, own progress and the next open lesson. */
export async function loadLibrary(sb: SupabaseClient, userId: string) {
  const [courses, counts, visible, progress] = await Promise.all([
    listCourses(sb), sb.rpc("kurs_lesson_counts"),
    sb.from("kurs_lessons").select("id,course_id,position").order("position"),
    sb.from("kurs_progress").select("lesson_id").eq("user_id", userId).not("completed_at", "is", null),
  ]);
  for (const r of [counts, visible, progress]) if (r.error) throw r.error;
  const count = new Map((counts.data as { course_id: string; lessons: number }[]).map(r => [r.course_id, r.lessons]));
  const done = new Set((progress.data as { lesson_id: string }[]).map(p => p.lesson_id));
  const lessons = visible.data as { id: string; course_id: string; position: number }[];
  return courses.map(c => {
    const own = lessons.filter(l => l.course_id === c.id);
    return { ...c, lessons: count.get(c.id) ?? 0, done: own.filter(l => done.has(l.id)).length, next: own.find(l => !done.has(l.id))?.id ?? null };
  });
}

/** One course with everything this member may see; locked lessons come from the outline without video data. */
export async function loadCourse(sb: SupabaseClient, slug: string, userId: string) {
  const { data: course, error } = await sb.from("kurs_courses").select(COURSE).eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!course) return null;
  const [modules, lessons, outline] = await Promise.all([
    sb.from("kurs_modules").select("*").eq("course_id", course.id).order("position"),
    sb.from("kurs_lessons").select("*").eq("course_id", course.id).order("position"),
    sb.rpc("kurs_outline", { p_course: course.id }),
  ]);
  for (const r of [modules, lessons, outline]) if (r.error) throw r.error;
  const ids = (outline.data as OutlineItem[]).map(l => l.id);
  const progress = ids.length ? await sb.from("kurs_progress").select("lesson_id,completed_at,position_s").eq("user_id", userId).in("lesson_id", ids) : { data: [], error: null };
  if (progress.error) throw progress.error;
  return {
    course: course as Course, modules: modules.data as Module[], lessons: lessons.data as Lesson[],
    outline: outline.data as OutlineItem[], progress: progress.data as Progress[],
  };
}

export async function isStudio(sb: SupabaseClient) {
  const { data, error } = await sb.rpc("kurs_is_studio");
  return !error && data === true;
}
