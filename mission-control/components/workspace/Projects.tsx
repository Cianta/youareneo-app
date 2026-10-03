"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Compass, ArrowUpRight, Sparkles, Search, Network } from "lucide-react";
import type { BrainGraph } from "@/lib/brain/graph";
import { LoadingState, EmptyState, ErrorState } from "./States";
export default function Projects() {
  const [projects, setProjects] = useState<string[]>([]),
    [graph, setGraph] = useState<BrainGraph | null>(null),
    [name, setName] = useState(""),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [insightError, setInsightError] = useState(""),
    [message, setMessage] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    setInsightError("");
    const results = await Promise.allSettled([
      fetch("/api/notes/projects", { cache: "no-store", signal }).then(
        async (r) => {
          const d = await r.json();
          if (!r.ok)
            throw Error(d.error || "Projekte konnten nicht geladen werden.");
          return d.projects as string[];
        },
      ),
      fetch("/api/brain", { cache: "no-store", signal }).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error();
        return d.graph as BrainGraph;
      }),
    ]);
    if (signal?.aborted) return;
    const [p, g] = results;
    if (p.status === "fulfilled") setProjects(p.value);
    else
      setError(
        p.reason instanceof Error
          ? p.reason.message
          : "Projekte konnten nicht geladen werden.",
      );
    if (g.status === "fulfilled" && g.value?.nodes) setGraph(g.value);
    else {
      setGraph(null);
      setInsightError(
        "Die Projekt-Einblicke sind gerade nicht verfügbar. Deine Projekte kannst du weiter öffnen.",
      );
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const visible = projects.filter((p) =>
    p.toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de")),
  );
  const linked = useMemo(
    () =>
      new Map(
        projects.map((p) => {
          const ids = new Set(
            graph?.links
              .filter(
                (l) =>
                  l.source === "project:" + p || l.target === "project:" + p,
              )
              .map((l) => (l.source === "project:" + p ? l.target : l.source)),
          );
          return [p, graph?.nodes.filter((n) => ids.has(n.id)) ?? []];
        }),
      ),
    [projects, graph],
  );
  const active = projects.includes(selected) ? selected : projects[0];
  const neighbors = linked.get(active) ?? [];
  const recent = (graph?.nodes ?? [])
    .filter((n) => n.type === "notiz" || n.type === "aufgabe")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const untethered = (graph?.nodes ?? [])
    .filter(
      (n) =>
        (n.type === "notiz" || n.type === "aufgabe") &&
        !graph?.links.some(
          (l) =>
            (l.source === n.id && l.target.startsWith("project:")) ||
            (l.target === n.id && l.source.startsWith("project:")),
        ),
    )
    .slice(0, 3);
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
      setSelected(name.trim());
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
    <section className="w-page project-studio">
      <header className="project-observatory">
        <Image
          src="/images/projects-stargazer-v1.webp"
          alt="Sternenforscher-Arbeitszimmer mit Bibliothek und Blick in einen violetten Nachthimmel"
          fill
          sizes="(max-width:767px) 100vw, 85vw"
          quality={60}
          priority
        />
        <div>
          <span className="w-eyebrow">DEIN OBSERVATORIUM</span>
          <h1>Deine Projekte.</h1>
          <p>
            Ideen werden zu Sternbildern. Entdecke, was zusammengehört – und wo
            dein nächster Schritt wartet.
          </p>
          <a className="w-btn" href="#project-name">
            <Sparkles size={16} /> Neues Projekt
          </a>
        </div>
      </header>
      <div className="project-studio-layout">
        <div>
          <div className="project-tools">
            <label className="studio-search">
              <Search size={16} />
              <input
                type="search"
                aria-label="Projekte suchen"
                placeholder="Dein Projekt finden …"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <span className="w-tag">{projects.length} Projekte</span>
          </div>
          {error && <ErrorState message={error} retry={() => void load()} />}
          {insightError && (
            <p role="status" className="w-muted">
              {insightError}
            </p>
          )}
          {loading ? (
            <LoadingState />
          ) : !projects.length && !error ? (
            <EmptyState
              title="Noch kein Projekt"
              href="#project-name"
              label="Erstes Projekt benennen"
            >
              Gib deiner Idee ein Zuhause. Deine Projekte gehören zu deinem
              Konto.
            </EmptyState>
          ) : (
            <div className="project-constellations">
              {visible.map((p, i) => {
                const nodes = linked.get(p) ?? [];
                return (
                  <article
                    className="project-star-card"
                    data-active={p === active}
                    key={p}
                    style={
                      {
                        "--studio-accent": [
                          "#716393",
                          "#387f89",
                          "#b77896",
                          "#7d8b66",
                        ][i % 4],
                      } as React.CSSProperties
                    }
                  >
                    <button
                      className="project-select"
                      aria-pressed={p === active}
                      onClick={() => setSelected(p)}
                    >
                      <svg viewBox="0 0 180 75" aria-hidden="true">
                        <path d="M12 58 48 32 82 49 123 16 164 37" />
                        <circle cx="12" cy="58" r="3" />
                        <circle cx="48" cy="32" r="5" />
                        <circle cx="82" cy="49" r="3" />
                        <circle cx="123" cy="16" r="6" />
                        <circle cx="164" cy="37" r="3" />
                      </svg>
                      <span>{p}</span>
                      <small>
                        {graph
                          ? `${nodes.filter((n) => n.type === "notiz" || n.type === "aufgabe").length} Gedanken · ${nodes.filter((n) => n.type === "aufgabe").length} Aufgaben`
                          : "Einblicke laden …"}
                      </small>
                    </button>
                    <Link
                      className="project-open"
                      href={"/notiz?project=" + encodeURIComponent(p)}
                    >
                      Projekt öffnen <ArrowUpRight size={15} />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
          {!loading && projects.length > 0 && !visible.length && (
            <p>Kein Projekt passt zur Suche.</p>
          )}
          <form
            className="w-card s-form project-create"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <h2>Ein neuer Stern am Horizont</h2>
            <label htmlFor="project-name">
              Projektname
              <input
                id="project-name"
                className="w-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Was möchtest du in die Welt bringen?"
                maxLength={100}
                required
              />
            </label>
            <button className="w-btn" disabled={busy || !name.trim()}>
              {busy ? "Wird angelegt …" : "Projekt anlegen"}
            </button>
            {message && <p role="status">{message}</p>}
          </form>
        </div>
        <aside className="project-explore" aria-label="Projekte entdecken">
          <section className="studio-widget" data-color="violet">
            <Compass size={21} />
            <h2>{active || "Dein nächster Schritt"}</h2>
            <p>
              {active
                ? "Gedanken, Aufgaben und Verbindungen dieses Projekts."
                : "Lege ein Projekt an und sammle, was dir wichtig ist."}
            </p>
            {neighbors.slice(0, 5).map((n) => (
              <Link key={n.id} href={n.href}>
                <span>{n.label}</span>
                <ArrowUpRight size={13} />
              </Link>
            ))}
            {active && (
              <Link
                className="w-btn"
                href={"/notiz?project=" + encodeURIComponent(active) + "&new=1"}
              >
                Gedanken hinzufügen
              </Link>
            )}
            {graph && !neighbors.length && active && (
              <small>Dieses Projekt hat noch keine verknüpften Gedanken.</small>
            )}
          </section>
          <section className="studio-widget" data-color="teal">
            <Network size={21} />
            <h2>Noch freie Ideen</h2>
            <p>
              Gedanken ohne Projektzuordnung. Vielleicht beginnt hier etwas
              Neues.
            </p>
            {untethered.map((n) => (
              <Link key={n.id} href={n.href}>
                <span>{n.label}</span>
                <ArrowUpRight size={13} />
              </Link>
            ))}
            {graph && !untethered.length && (
              <small>Deine Gedanken sind bereits eingeordnet.</small>
            )}
            <Link href="/gehirn">Verbindungen im Gehirn entdecken →</Link>
          </section>
          <section className="studio-widget" data-color="rose">
            <h2>Zuletzt hinzugekommen</h2>
            {recent.map((n) => (
              <Link key={n.id} href={n.href}>
                <span>
                  {n.label}
                  <small>
                    {new Date(n.createdAt).toLocaleDateString("de-AT")}
                  </small>
                </span>
                <ArrowUpRight size={13} />
              </Link>
            ))}
            {graph && !recent.length && (
              <p>Deine erste Notiz wird hier erscheinen.</p>
            )}
          </section>
          <p className="w-storage-note">
            {graph?.truncated
              ? "Einblicke zeigen den aktuellen Ausschnitt deines Wissensgraphen. "
              : ""}
            Lokale Projektboards bleiben unter{" "}
            <Link href="/dashboard/kanban">Aufgaben</Link> erreichbar.
          </p>
        </aside>
      </div>
    </section>
  );
}
