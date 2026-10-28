"use client";
import { useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/courses/data";

export type LibraryCourse = Course & { lessons: number; done: number; next: string | null };

/** Same structure as the former Memberspot library: continue row, category chips, list or grid. */
export function CourseLibrary({ courses, banner }: { courses: LibraryCourse[]; banner: string | null }) {
  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))] as string[];
  const [filter, setFilter] = useState<string | null>(null), [grid, setGrid] = useState(false);
  const shown = filter ? courses.filter(c => c.category === filter) : courses;
  const started = courses.filter(c => c.done > 0 && c.done < c.lessons);
  const pct = (c: LibraryCourse) => c.lessons ? Math.round(c.done / c.lessons * 100) : 0;
  const href = (c: LibraryCourse) => `/dashboard/kurse/${c.slug}${c.next ? `?l=${c.next}` : ""}`;
  return <>
    {banner && <img className="kurs-banner" src={banner} alt="Lebenskunst Academy" width={1128} height={600}/>}
    {started.length > 0 && <section className="kurs-continue"><h2>Fortsetzen</h2><div className="kurs-continue-row">{started.map(c => <Link key={c.id} href={href(c)} prefetch={false} className="kurs-continue-card" style={c.cover_url ? { backgroundImage: `linear-gradient(transparent 30%, #000c), url(${JSON.stringify(c.cover_url)})` } : undefined}>
      <b>{c.title}</b><small>{c.done} von {c.lessons} abgeschlossen</small><span aria-hidden="true">▶</span></Link>)}</div></section>}
    <section><div className="kurs-library-head"><h2>Sendungen und Kurse</h2>
      <div role="group" aria-label="Ansicht"><button type="button" aria-pressed={grid} onClick={() => setGrid(true)} title="Kacheln">▦</button><button type="button" aria-pressed={!grid} onClick={() => setGrid(false)} title="Liste">☰</button></div></div>
      {categories.length > 0 && <div className="kurs-chips" role="group" aria-label="Kategorie"><button type="button" aria-pressed={!filter} onClick={() => setFilter(null)}>Alle</button>
        {categories.map(c => <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}</div>}
      {!shown.length && <p className="kurs-note">Noch keine veröffentlichten Kurse.</p>}
      <div className={grid ? "kurs-grid" : "kurs-list"}>{shown.map(c => <article key={c.id} className="kurs-row">
        {c.cover_url ? <img src={c.cover_url} alt="" width={480} height={270} loading="lazy" decoding="async"/> : <div className="kurs-cover-empty" aria-hidden="true">◎</div>}
        <div><h3><Link href={href(c)} prefetch={false}>{c.title}</Link></h3><small>{pct(c)}% abgeschlossen{c.status === "draft" ? " · Entwurf" : ""}</small>{c.description && <p>{c.description}</p>}</div>
        <Link className="w-btn kurs-start" href={href(c)} prefetch={false} tabIndex={-1}>{c.done ? (c.done >= c.lessons ? "Ansehen" : "Fortsetzen") : "Starten"}</Link>
      </article>)}</div>
    </section>
  </>;
}
