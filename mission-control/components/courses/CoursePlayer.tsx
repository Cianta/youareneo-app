"use client";
import { useMemo, useRef, useState } from "react";
import type { Course, Lesson, Module, OutlineItem, Progress } from "@/lib/courses/data";
import { clock, embedOf } from "@/lib/courses/video";
import { LessonBody } from "./LessonBody";

type Props = { course: Course; modules: Module[]; lessons: Lesson[]; outline: OutlineItem[]; progress: Progress[]; initialLesson: string | null };

export function CoursePlayer({ course, modules, lessons, outline, progress, initialLesson }: Props) {
  const full = useMemo(() => new Map(lessons.map(l => [l.id, l])), [lessons]);
  const [done, setDone] = useState(() => new Set(progress.filter(p => p.completed_at).map(p => p.lesson_id)));
  const [current, setCurrent] = useState(() => outline.find(l => l.id === initialLesson && l.unlocked)?.id ?? outline.find(l => l.unlocked && !done.has(l.id))?.id ?? outline.find(l => l.unlocked)?.id ?? null);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null), frame = useRef<HTMLIFrameElement>(null);
  const lesson = current ? full.get(current) : undefined;
  const embed = lesson ? embedOf(lesson.video_source, lesson.video_ref, lesson.clip_start, lesson.clip_end) : null;
  const percent = outline.length ? Math.round(done.size / outline.length * 100) : 0;

  const open = (id: string) => { setCurrent(id); history.replaceState(null, "", `?l=${id}`); };
  async function toggleDone() {
    if (!lesson) return;
    const completed = !done.has(lesson.id);
    setError("");
    const res = await fetch("/api/kurse/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, completed, positionS: Math.floor(video.current?.currentTime ?? 0) }) });
    if (!res.ok) return setError((await res.json().catch(() => null))?.error ?? "Fortschritt konnte nicht gespeichert werden.");
    setDone(prev => { const next = new Set(prev); if (completed) next.add(lesson.id); else next.delete(lesson.id); return next; });
    const nextLesson = outline.find(l => l.unlocked && l.position > lesson.position && !done.has(l.id));
    if (completed && nextLesson) open(nextLesson.id);
  }
  // Chapters jump inside the own player; iframe hosts restart at the chapter via their start parameter.
  function seek(t: number) {
    if (!lesson) return;
    if (video.current) { video.current.currentTime = t; void video.current.play(); return; }
    const next = embedOf(lesson.video_source, lesson.video_ref, t, lesson.clip_end);
    if (frame.current && next) frame.current.src = next.src + (lesson.video_source === "youtube" ? "&autoplay=1" : "");
  }

  return <div className="kurs-layout">
    <article className="kurs-main">
      <header><h1>{course.title}</h1>{course.subtitle && <p>{course.subtitle}</p>}
        <div className="kurs-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Kursfortschritt"><span style={{ width: `${percent}%` }}/></div>
        <small>{done.size} von {outline.length} Lektionen abgeschlossen</small></header>
      {lesson ? <>
        {(embed || lesson.kind === "video") && <div className="kurs-stage">{embed?.kind === "iframe" ? <iframe ref={frame} key={lesson.id} src={embed.src} title={lesson.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/>
          : embed?.kind === "video" ? <video ref={video} key={lesson.id} src={embed.src} controls playsInline preload="metadata"/>
          : <div className="kurs-stage-empty">Das Video zu dieser Lektion folgt.</div>}</div>}
        <h2>{lesson.title}</h2>
        {lesson.chapters.length > 0 && <ol className="kurs-chapters">{lesson.chapters.map(c => <li key={c.t}><button type="button" onClick={() => seek(c.t)}><time>{clock(c.t)}</time> {c.label}</button></li>)}</ol>}
        {lesson.summary && <p className="kurs-summary">{lesson.summary}</p>}
        {lesson.body && <LessonBody body={lesson.body}/>}
        {lesson.attachments.length > 0 && <ul className="kurs-attachments">{lesson.attachments.map(a => <li key={a.url}><a href={a.url} target="_blank" rel="noopener noreferrer">📎 {a.name}</a></li>)}</ul>}
        <button type="button" className="w-btn kurs-done" onClick={toggleDone} aria-pressed={done.has(lesson.id)}>{done.has(lesson.id) ? "✓ Abgeschlossen" : "Als abgeschlossen markieren"}</button>
        {error && <p className="kurs-note" role="alert">{error}</p>}
      </> : <div className="kurs-locked"><h2>Dieser Kurs ist noch nicht freigeschaltet</h2>
        <p>{course.description ?? "Mit dem passenden Zugang öffnen sich alle Lektionen."}</p>
        {course.price_eur != null && <p>Einzelkurs {course.price_eur.toLocaleString("de-DE", { style: "currency", currency: "EUR" })} oder in der Kursbibliothek enthalten.</p>}</div>}
    </article>
    <nav className="kurs-outline" aria-label="Kursinhalt">{modules.map(m => <section key={m.id}><h3>{m.title}</h3><ol>
      {outline.filter(l => l.module_id === m.id).map(l => <li key={l.id}><button type="button" disabled={!l.unlocked} aria-current={l.id === current ? "true" : undefined} onClick={() => open(l.id)}>
        <span aria-hidden="true">{done.has(l.id) ? "✓" : l.unlocked ? "○" : "🔒"}</span>{l.title}{l.duration_s ? <small>{clock(l.duration_s)}</small> : null}{l.free_preview && <em>Vorschau</em>}
      </button></li>)}</ol></section>)}<a className="kurs-back" href="/dashboard/kurse">Zurück zur Kursübersicht →</a></nav>
  </div>;
}
