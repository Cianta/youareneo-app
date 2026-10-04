"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Search, Plus, ArrowUpRight } from "lucide-react";
import {
  usePersonal,
  inWorkspace,
  AREAS,
  type Area,
} from "@/lib/workspace/personal";
import { useNotebookStore, useNeuralNotebookStore } from "@/lib/store";
import { localDate } from "@/lib/workspace/time";
import { Attachments } from "./Attachments";
import type { Attachment, BrainNote } from "@/lib/workspace/personal";
function paperInk(hex: string) {
  const rgb = /^#[0-9a-f]{6}$/i.test(hex)
    ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    : [1, 1, 1];
  const linear = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2] > 0.179
    ? "#000"
    : "#fff";
}
export function NotebookDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const personal = usePersonal(),
    entries = useNotebookStore((s) => s.entries),
    quick = useNeuralNotebookStore((s) => s.quickNotes);
  const [query, setQuery] = useState(""),
    [editing, setEditing] = useState<string | null>(null),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [area, setArea] = useState<Area>("Leben"),
    [color, setColor] = useState("#f1dfab"),
    [attachments, setAttachments] = useState<Attachment[]>([]),
    [message, setMessage] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const capture = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    search.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      if (before?.isConnected) before.focus();
    };
  }, [open, onClose]);
  const reset = () => {
    setEditing(null);
    setTitle("");
    setBody("");
    setAttachments([]);
    if(capture.current){capture.current.open=false;capture.current.querySelector("summary")?.focus();}
  };
  const choose = (note: BrainNote) => {
    if(capture.current)capture.current.open=true;
    setEditing(note.id);
    setTitle(note.title);
    setBody(note.body);
    setArea(note.area);
    setColor(note.color || "#f1dfab");
    setAttachments(note.attachments ?? []);
  };
  const notes = personal.notes
    .filter(
      (n) =>
        inWorkspace(n, personal.workspace) &&
        `${n.title} ${n.body} ${n.area}`
          .toLocaleLowerCase("de")
          .includes(query.toLocaleLowerCase("de")),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <aside
      id="notebook-drawer"
      className="notebook-drawer"
      aria-label="Notizschublade"
      hidden={!open}
    >
      <span className="notebook-binding" aria-hidden="true"/><header>
        <div>
          <span className="w-eyebrow">DEINE GEDANKEN · GRIFFBEREIT</span>
          <h2>Notizbuch</h2>
        </div>
        <button
          className="w-icon"
          aria-label="Notizschublade einklappen"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </header>
      <div className="notebook-drawer-scroll">
        <label className="studio-search">
          <Search size={16} />
          <input
            ref={search}
            aria-label="Notizschublade durchsuchen"
            type="search"
            placeholder="Notizen finden …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <details className="drawer-capture" ref={capture}><summary>+ Einen neuen Gedanken festhalten</summary><form
          className="s-form drawer-note-form"
          onSubmit={(e) => {
            e.preventDefault();
            const current = usePersonal.getState();
            const previous = current.notes.find((n) => n.id === editing);
            const note: BrainNote = {
              ...previous,
              id: editing ?? crypto.randomUUID(),
              title: title.trim(),
              body: body.trim(),
              area,
              color,
              attachments,
              workspace: previous?.workspace ?? current.workspace,
              date: previous?.date ?? localDate(),
              updatedAt: new Date().toISOString(),
              links: previous?.links ?? [],
            };
            current.set({
              notes: previous
                ? current.notes.map((n) => (n.id === note.id ? note : n))
                : [note, ...current.notes],
            });
            setMessage(
              previous
                ? "Notiz aktualisiert."
                : "Notiz im Journal gespeichert.",
            );
            reset();
          }}
        >
          <label>
            {editing ? "Notiz bearbeiten" : "Schneller Gedanke"}
            <input
              className="w-input"
              aria-label="Notiztitel"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Eine Idee, die bleiben soll …"
            />
          </label>
          <textarea
            className="w-input"
            aria-label="Notiztext"
            rows={3}
            value={body}
            maxLength={10000}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Was möchtest du festhalten?"
          />
          <div className="drawer-note-options">
            <select
              aria-label="Notizbereich"
              value={area}
              onChange={(e) => setArea(e.target.value as Area)}
            >
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <label>
              Farbe
              <input
                type="color"
                aria-label="Notizfarbe"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
          </div>
          <Attachments items={attachments} onChange={setAttachments} />
          <div className="studio-actions">
            <button className="w-btn" disabled={!title.trim()}>
              <Plus size={15} />
              {editing ? "Änderung speichern" : "Notiz speichern"}
            </button>
            {editing && (
              <button className="w-btn" type="button" onClick={reset}>
                Abbrechen
              </button>
            )}
          </div>
        </form></details>
        {message && <p role="status">{message}</p>}
        <div className="drawer-notes">
          {notes.map((n,i) => (
            <button
              key={n.id}
              className="drawer-sticky"
              onClick={() => choose(n)}
              style={
                {
                  "--paper": n.color || "#f1dfab",
                  "--paper-ink": paperInk(n.color || "#f1dfab"),
                  "--tilt": ((n.rotation ?? (i%2?1.4:-1.2)) % 5) + "deg",
                } as React.CSSProperties
              }
            >
              <small>
                {n.area} · {n.date ?? n.updatedAt.slice(0, 10)}
              </small>
              <strong>{n.title}</strong>
              <span>{n.body.slice(0, 220)}</span>
              {!!n.attachments?.length && (
                <small>{n.attachments.length} Anhänge</small>
              )}
            </button>
          ))}
        </div>
        {!notes.length && (
          <p className="w-muted">
            {query
              ? "Keine passenden Journalnotizen."
              : "Platz für deinen ersten Gedanken."}
          </p>
        )}
        {(entries.length > 0 || quick.length > 0) && (
          <details className="drawer-legacy">
            <summary>
              Bisherige Notizbuch-Einträge ({entries.length + quick.length})
            </summary>
            {entries
              .filter((n) =>
                `${n.date} ${n.journal}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((n) => (
                <article key={n.id}>
                  <strong>{n.date}</strong>
                  <p>{n.journal}</p>
                  {n.goals?.length > 0 && (
                    <ul>
                      {n.goals.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            {quick
              .filter((n) => n.text.toLowerCase().includes(query.toLowerCase()))
              .map((n) => (
                <article key={n.id}>
                  <small>{n.label}</small>
                  <p>{n.text}</p>
                </article>
              ))}
          </details>
        )}
        <Link className="w-btn" href="/dashboard/goals">
          Journal & Ziele öffnen <ArrowUpRight size={15} />
        </Link>
        <p className="w-storage-note">
          Notizen auf diesem Gerät. Die Schublade bleibt beim Wechsel der Seite
          offen.
        </p>
      </div>
    </aside>
  );
}
