import Link from "next/link";
import { kursSession } from "@/lib/courses/server";
import { listCourses, type Lesson, type Module } from "@/lib/courses/data";
import { HttpError } from "@/lib/auth/http";
import { StudioEditor } from "@/components/courses/StudioEditor";
import "@/components/courses/courses.css";

export default async function KursStudio({ searchParams }: { searchParams: Promise<{ kurs?: string }> }) {
  const { kurs } = await searchParams;
  try {
    const { sb } = await kursSession({ readOnly: true, studio: true });
    const courses = await listCourses(sb);
    const selected = courses.find(c => c.slug === kurs) ?? null;
    let modules: Module[] = [], lessons: Lesson[] = [];
    if (selected) {
      const [m, l] = await Promise.all([
        sb.from("kurs_modules").select("*").eq("course_id", selected.id).order("position"),
        sb.from("kurs_lessons").select("*").eq("course_id", selected.id).order("position"),
      ]);
      if (m.error || l.error) throw m.error ?? l.error;
      modules = m.data as Module[]; lessons = l.data as Lesson[];
    }
    return <section className="workspace-page kurs-page kurs-studio">
      <p className="workspace-eyebrow"><Link href="/dashboard/kurse" prefetch={false}>← Kursraum</Link> · KURSSTUDIO</p>
      <StudioEditor key={selected?.id ?? "new"} courses={courses} course={selected} modules={modules} lessons={lessons}/>
    </section>;
  } catch (e) {
    return <section className="workspace-page kurs-page"><p className="kurs-note">{e instanceof HttpError ? e.message : "Das Kursstudio konnte nicht geladen werden."}</p></section>;
  }
}
