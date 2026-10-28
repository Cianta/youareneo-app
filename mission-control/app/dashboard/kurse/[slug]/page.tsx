import Link from "next/link";
import { notFound } from "next/navigation";
import { kursSession } from "@/lib/courses/server";
import { loadCourse } from "@/lib/courses/data";
import { HttpError } from "@/lib/auth/http";
import { CoursePlayer } from "@/components/courses/CoursePlayer";
import { previewMode, previewCourse } from "@/lib/courses/preview";
import "@/components/courses/courses.css";

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ l?: string }> }) {
  const [{ slug }, { l }] = await Promise.all([params, searchParams]);
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/.test(slug)) notFound();
  if (previewMode()) {
    const preview = previewCourse(slug);
    if (!preview) notFound();
    return <section className="workspace-page kurs-page"><p className="workspace-eyebrow"><Link href="/dashboard/kurse" prefetch={false}>← Kursraum</Link> · Lokale Vorschau</p><CoursePlayer {...preview} initialLesson={l ?? null}/></section>;
  }
  let data;
  try {
    const { sb, user, studio } = await kursSession({ readOnly: true });
    data = await loadCourse(sb, slug, user.id);
    if (!data) notFound();
    return <section className="workspace-page kurs-page">
      <p className="workspace-eyebrow"><Link href="/dashboard/kurse" prefetch={false}>← Kursraum</Link>{studio && <> · <Link href={`/dashboard/kurse/studio?kurs=${data.course.slug}`} prefetch={false}>Im Studio bearbeiten</Link></>}</p>
      <CoursePlayer {...data} initialLesson={l ?? null}/>
    </section>;
  } catch (e) {
    if (e instanceof HttpError) return <section className="workspace-page kurs-page"><p className="kurs-note">{e.message}</p></section>;
    throw e;
  }
}
