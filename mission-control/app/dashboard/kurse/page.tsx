import Link from "next/link";
import { kursSession } from "@/lib/courses/server";
import { loadLibrary } from "@/lib/courses/data";
import { HttpError } from "@/lib/auth/http";
import { CourseLibrary } from "@/components/courses/CourseLibrary";
import { previewMode, previewLibrary } from "@/lib/courses/preview";
import "@/components/courses/courses.css";

// Banner like the former Memberspot library. Memberspot's CDN refuses outside requests, so the image
// has to live on an own server or in public/ first.
const BANNER = process.env.KURSRAUM_BANNER_URL?.trim() || null;

export default async function Kursraum() {
  if (previewMode()) return <section className="workspace-page kurs-page kurs-library"><p className="kurs-note">Lokale Vorschau der importierten Kurse, ohne Login und ohne Fortschritt.</p>
    <CourseLibrary courses={previewLibrary()} banner={BANNER}/></section>;
  try {
    const { sb, user, studio } = await kursSession({ readOnly: true });
    const courses = await loadLibrary(sb, user.id);
    return <section className="workspace-page kurs-page kurs-library">
      <header className="kurs-intro">
        <p className="workspace-eyebrow">LEBENSKUNST ACADEMY · SENDUNGEN & KURSE</p>
        {studio && <nav className="kurs-actions"><Link className="w-btn" href="/dashboard/kurse/studio" prefetch={false}>Kursstudio öffnen</Link><Link className="w-btn" href="/dashboard/kurse/studio/aufnahme" prefetch={false}>Aufnahme (Rohversion)</Link></nav>}
      </header>
      <CourseLibrary courses={courses} banner={BANNER}/>
    </section>;
  } catch (e) {
    return <section className="workspace-page kurs-page"><p className="workspace-eyebrow">KURSRAUM</p><h1>Kurse</h1>
      <p className="kurs-note">{e instanceof HttpError ? e.message : "Die Kurse konnten gerade nicht geladen werden."}</p></section>;
  }
}
