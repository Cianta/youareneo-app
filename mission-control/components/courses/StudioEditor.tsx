"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Course, Lesson, Module } from "@/lib/courses/data";
import { VIDEO_SOURCES, attachmentsText, chaptersText, embedOf, youtubeWarning, type VideoSource } from "@/lib/courses/video";

type Props = { courses: Course[]; course: Course | null; modules: Module[]; lessons: Lesson[] };
type Fields = Record<string, string | boolean | number | null>;

async function call(method: "POST" | "DELETE", body: unknown) {
  const res = await fetch("/api/kurse/studio", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Speichern fehlgeschlagen.");
  return data;
}
const formOf = (e: React.FormEvent<HTMLFormElement>): Fields => {
  const f = new FormData(e.currentTarget), out: Fields = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]));
  for (const box of e.currentTarget.querySelectorAll<HTMLInputElement>("input[type=checkbox]")) out[box.name] = box.checked;
  return out;
};

export function StudioEditor({ courses, course, modules, lessons }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [openLesson, setOpenLesson] = useState<string | null>(null);
  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true); setMsg("");
    try { await fn(); if (done) setMsg(done); router.refresh(); } catch (e) { setMsg(e instanceof Error ? e.message : "Fehler."); } finally { setBusy(false); }
  }
  const saveCourse = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = formOf(e);
    void run(async () => { const r = await call("POST", { kind: "course", id: course?.id, data: { ...data, status: data.published ? "published" : "draft" } });
      if (!course || r.row.slug !== course.slug) router.push(`/dashboard/kurse/studio?kurs=${r.row.slug}`); }, "Kurs gespeichert."); };
  const remove = (kind: string, id: string, label: string) => confirm(`„${label}" wirklich löschen? Das lässt sich nicht rückgängig machen.`)
    && void run(() => call("DELETE", { kind, id }), "Gelöscht.");

  return <div className="studio-layout">
    <aside className="studio-list"><h2>Kurse ({courses.length})</h2>
      <a className="w-btn" href="/dashboard/kurse/studio">+ Neuer Kurs</a>
      <button type="button" className="w-btn" disabled={busy} onClick={() => run(async () => { const r = await call("POST", { action: "import" }); setMsg(`${r.created} Kurse aus Memberspot als Entwurf angelegt, ${r.skipped} schon vorhanden.`); })}>Memberspot-Kurse importieren</button>
      <ol>{courses.map(c => <li key={c.id}><a href={`/dashboard/kurse/studio?kurs=${c.slug}`} aria-current={c.id === course?.id ? "page" : undefined}>{c.title}{c.status === "draft" && <small> · Entwurf</small>}</a></li>)}</ol>
    </aside>
    <div className="studio-main">
      {msg && <p className="kurs-note" role="status">{msg}</p>}
      <form className="w-card studio-form" onSubmit={saveCourse}>
        <h1>{course ? course.title : "Neuer Kurs"}</h1>
        <label>Titel<input className="w-input" name="title" required maxLength={200} defaultValue={course?.title}/></label>
        <label>Kurzname (Adresse)<input className="w-input" name="slug" maxLength={96} defaultValue={course?.slug} placeholder="wird aus dem Titel gebildet"/></label>
        <label>Untertitel<input className="w-input" name="subtitle" maxLength={300} defaultValue={course?.subtitle ?? ""}/></label>
        <label>Kategorie<input className="w-input" name="category" maxLength={100} defaultValue={course?.category ?? ""} placeholder="z. B. Trinity-Reihe, Bewegung & Energie"/></label>
        <label>Beschreibung<textarea className="w-input" name="description" rows={4} defaultValue={course?.description ?? ""}/></label>
        <label>Titelbild (https)<input className="w-input" name="cover_url" type="url" defaultValue={course?.cover_url ?? ""}/></label>
        <div className="studio-row"><label>Preis €<input className="w-input" name="price_eur" type="number" min={0} step="0.01" defaultValue={course?.price_eur ?? ""}/></label>
          <label>Reihenfolge<input className="w-input" name="position" type="number" defaultValue={course?.position ?? courses.length}/></label></div>
        <label>Zugang über (leer = frei für alle Mitglieder)<input className="w-input" name="products" defaultValue={course?.products.join(", ") ?? "kursbibliothek"} placeholder="kursbibliothek, kurs-mein-kurs, foerder"/></label>
        <label className="studio-check"><input type="checkbox" name="published" defaultChecked={course?.status === "published"}/> Veröffentlicht</label>
        <div className="studio-row"><button className="w-btn" disabled={busy}>Kurs speichern</button>
          {course && <><a className="w-btn" href={`/dashboard/kurse/${course.slug}`}>Ansehen</a><button type="button" className="w-btn studio-danger" disabled={busy} onClick={() => remove("course", course.id, course.title)}>Kurs löschen</button></>}</div>
      </form>

      {course && <section className="studio-modules"><h2>Module & Lektionen</h2>
        {modules.map((m, mi) => { const own = lessons.filter(l => l.module_id === m.id); return <details key={m.id} className="w-card" open>
          <summary>{m.title} <small>{own.length} Lektionen</small></summary>
          <form className="studio-row" onSubmit={e => { e.preventDefault(); const d = formOf(e); void run(() => call("POST", { kind: "module", id: m.id, data: { ...d, course_id: course.id } }), "Modul gespeichert."); }}>
            <input className="w-input" name="title" defaultValue={m.title} required aria-label="Modultitel"/><input className="w-input" name="position" type="number" defaultValue={m.position} aria-label="Reihenfolge"/>
            <button className="w-btn" disabled={busy}>Speichern</button><button type="button" className="w-btn studio-danger" disabled={busy} onClick={() => remove("module", m.id, m.title)}>Löschen</button></form>
          <ol className="studio-lessons">{own.map(l => <li key={l.id}>
            <button type="button" className="studio-lesson-toggle" onClick={() => setOpenLesson(openLesson === l.id ? null : l.id)}>{l.title} <small>{l.kind === "video" && l.video_source === "none" ? "Video fehlt" : VIDEO_SOURCES.find(s => s.id === l.video_source)?.label}{l.status === "draft" ? " · Entwurf" : ""}{l.free_preview ? " · Vorschau" : ""}</small></button>
            {openLesson === l.id && <LessonForm lesson={l} course={course} busy={busy} onSave={d => run(() => call("POST", { kind: "lesson", id: l.id, data: d }), "Lektion gespeichert.")} onDelete={() => remove("lesson", l.id, l.title)}/>}
          </li>)}</ol>
          <button type="button" className="w-btn" disabled={busy} onClick={() => run(() => call("POST", { kind: "lesson", data: { course_id: course.id, module_id: m.id, title: `Lektion ${own.length + 1}`, position: mi * 100 + own.length } }))}>+ Lektion</button>
        </details>; })}
        <button type="button" className="w-btn" disabled={busy} onClick={() => run(() => call("POST", { kind: "module", data: { course_id: course.id, title: `Modul ${modules.length + 1}`, position: modules.length } }))}>+ Modul</button>
      </section>}
    </div>
  </div>;
}

function LessonForm({ lesson, course, busy, onSave, onDelete }: { lesson: Lesson; course: Course; busy: boolean; onSave: (d: Fields) => void; onDelete: () => void }) {
  const [source, setSource] = useState<VideoSource>(lesson.video_source), [ref, setRef] = useState(lesson.video_ref ?? ""), [preview, setPreview] = useState(lesson.free_preview);
  const embed = embedOf(source, ref), warning = youtubeWarning(source, course.products.length > 0, preview);
  return <form className="studio-form studio-lesson" onSubmit={e => { e.preventDefault(); onSave({ ...formOf(e), course_id: lesson.course_id, module_id: lesson.module_id }); }}>
    <label>Titel<input className="w-input" name="title" required maxLength={200} defaultValue={lesson.title}/></label>
    <div className="studio-row"><label>Videoquelle<select className="w-input" name="video_source" value={source} onChange={e => setSource(e.target.value as VideoSource)}>{VIDEO_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>Reihenfolge<input className="w-input" name="position" type="number" defaultValue={lesson.position}/></label></div>
    {source !== "none" && <label>{source === "riverside" ? "Riverside-Einbettungscode oder Link" : source === "url" ? "Video-Adresse (https, mp4 oder m3u8)" : "Link oder ID"}<textarea className="w-input" name="video_ref" rows={2} value={ref} onChange={e => setRef(e.target.value)}/></label>}
    {source !== "none" && ref && !embed && <p className="kurs-note">Diese Angabe erkenne ich nicht als gültiges {VIDEO_SOURCES.find(s => s.id === source)?.label}-Video.</p>}
    {warning && <p className="kurs-note" role="alert">{warning}</p>}
    <div className="studio-row"><label>Schnitt: Start (Sek.)<input className="w-input" name="clip_start" type="number" min={0} defaultValue={lesson.clip_start ?? ""}/></label>
      <label>Ende (Sek.)<input className="w-input" name="clip_end" type="number" min={1} defaultValue={lesson.clip_end ?? ""}/></label>
      <label>Länge (Sek.)<input className="w-input" name="duration_s" type="number" min={0} defaultValue={lesson.duration_s ?? ""}/></label></div>
    <div className="studio-row"><label>Art<select className="w-input" name="kind" defaultValue={lesson.kind}><option value="video">Video/Audio</option><option value="pdf">PDF</option><option value="text">Text</option><option value="live">Live-Termin</option></select></label>
      <label>Status<select className="w-input" name="status" defaultValue={lesson.status}><option value="published">Veröffentlicht</option><option value="draft">Entwurf</option></select></label></div>
    <label>Kurzbeschreibung<input className="w-input" name="summary" maxLength={1000} defaultValue={lesson.summary ?? ""}/></label>
    <label>Anhänge (eine Zeile je Datei: „Name | https://…")<textarea className="w-input" name="attachments" rows={2} defaultValue={attachmentsText(lesson.attachments)}/></label>
    <label>Kapitel (eine Zeile je Kapitel: „12:30 Titel")<textarea className="w-input" name="chapters" rows={3} defaultValue={chaptersText(lesson.chapters)}/></label>
    <label>Text zur Lektion<textarea className="w-input" name="body" rows={5} defaultValue={lesson.body ?? ""}/></label>
    <label className="studio-check"><input type="checkbox" name="free_preview" checked={preview} onChange={e => setPreview(e.target.checked)}/> Kostenlose Vorschau</label>
    {embed && <div className="kurs-stage studio-preview">{embed.kind === "iframe" ? <iframe src={embed.src} title="Vorschau" allow="fullscreen; picture-in-picture" loading="lazy"/> : <video src={embed.src} controls preload="metadata"/>}</div>}
    <div className="studio-row"><button className="w-btn" disabled={busy}>Lektion speichern</button><button type="button" className="w-btn studio-danger" disabled={busy} onClick={onDelete}>Löschen</button></div>
  </form>;
}
