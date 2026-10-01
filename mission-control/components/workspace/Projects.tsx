"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LoadingState, EmptyState, ErrorState } from "./States";
export default function Projects() {
  const [projects, setProjects] = useState<string[]>([]),
    [name, setName] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/notes/projects", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setProjects(d.projects);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Deine Projekte konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function create() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/notes/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setName("");
      setMessage(
        "Dein Projekt ist angelegt. Öffne es, um eine Notiz hinzuzufügen.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-page">
      <p className="workspace-eyebrow">ORDNEN</p>
      <h1>Deine Projekte</h1>
      <p className="workspace-lead">
        Ein Zuhause für deine Notizen und Aufgaben. Diese Projekte gehören zu
        deinem Konto und sind auf deinen Geräten verfügbar.
      </p>
      <form
        className="workspace-form"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <label htmlFor="project-name">Neues Projekt</label>
        <div className="workspace-form-actions">
          <input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Projektname"
            maxLength={100}
            required
          />
          <button className="workspace-button" disabled={busy || !name.trim()}>
            {busy ? "Wird angelegt …" : "Projekt anlegen"}
          </button>
        </div>
      </form>
      {message && (
        <p role="status" className="workspace-notice">
          {message}
        </p>
      )}
      {error && <ErrorState message={error} retry={() => void load()} />}
      {loading ? (
        <LoadingState />
      ) : !projects.length && !error ? (
        <EmptyState
          title="Noch kein Projekt"
          href="#project-name"
          label="Erstes Projekt benennen"
        >
          Trage oben einen Namen ein. Anschließend kannst du deine Notizen
          zuordnen.
        </EmptyState>
      ) : (
        <div className="workspace-grid" style={{ marginTop: 24 }}>
          {projects.map((p) => (
            <Link
              key={p}
              href={"/notiz?project=" + encodeURIComponent(p)}
              className="workspace-card"
            >
              {p}
              <small>Notizen öffnen →</small>
            </Link>
          ))}
        </div>
      )}
      <p className="workspace-muted">
        Deine bisherigen lokalen Boards findest du weiterhin unter Aufgaben. Sie
        werden nicht automatisch übertragen.
      </p>
    </section>
  );
}
