"use client";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  NODE_TYPES,
  filterGraph,
  matchesNode,
  type BrainGraph,
  type NodeType,
} from "@/lib/brain/graph";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/workspace/States";
import { colors, labels } from "./shared";
import "./brain.css";
const Graph2D = dynamic(() => import("./Graph2D"), {
  ssr: false,
  loading: () => <LoadingState label="2D-Ansicht wird geladen …" />,
});
const Graph3D = dynamic(() => import("./Graph3D"), {
  ssr: false,
  loading: () => <LoadingState label="3D-Ansicht wird geladen …" />,
});
class CanvasBoundary extends Component<
  { children: ReactNode; onFail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function limitedGraphics() {
  if (
    matchMedia("(max-width: 767px), (prefers-reduced-motion: reduce)").matches
  )
    return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4)
    return true;
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  if (memory && memory < 4) return true;
  const canvas = document.createElement("canvas");
  try {
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!gl) return true;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|software/i.test(renderer);
  } catch {
    return true;
  }
}
export default function BrainWorkspace({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const [graph, setGraph] = useState<BrainGraph | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(true);
  const [query, setQuery] = useState(initialQuery),
    [types, setTypes] = useState<NodeType[]>([...NODE_TYPES]),
    [since, setSince] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"2d" | "3d" | "list">("2d"),
    [ready, setReady] = useState(false),
    [limited, setLimited] = useState(true),
    [reduced, setReduced] = useState(false),
    [fallback, setFallback] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 560 });
  useEffect(() => setQuery(initialQuery), [initialQuery]);
  useEffect(() => {
    const update = () => {
      const low = limitedGraphics();
      setLimited(low);
      setReduced(matchMedia("(prefers-reduced-motion: reduce)").matches);
      setMode(low ? "2d" : "3d");
      setReady(true);
    };
    update();
    const mq = matchMedia(
      "(max-width: 767px), (prefers-reduced-motion: reduce)",
    );
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    fetch("/api/brain" + (retry ? "?refresh=1" : ""), {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw Error(
            r.status === 401
              ? "Bitte melde dich an, um dein Gehirn zu öffnen."
              : d.error || "Der Wissensgraph konnte nicht geladen werden.",
          );
        if (!controller.signal.aborted) setGraph(d.graph);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({
        width: Math.max(280, el.clientWidth),
        height: Math.max(360, Math.min(640, innerHeight * 0.63)),
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [busy, graph, mode]);
  const filtered = useMemo(
    () => (graph ? filterGraph(graph, types, since) : null),
    [graph, types, since],
  );
  // d3 mutates positions/endpoints. Each mode/filter gets its own disposable copy.
  const data = useMemo(
    () =>
      filtered
        ? {
            ...filtered,
            nodes: filtered.nodes.map((n) => ({ ...n })),
            links: filtered.links.map((l) => ({ ...l })),
          }
        : null,
    [filtered, mode],
  );
  const hits = useMemo(
    () => filtered?.nodes.filter((n) => matchesNode(n, query)) || [],
    [filtered, query],
  );
  const active = filtered?.nodes.find((n) => n.id === selected);
  const fail = useCallback(() => {
    setMode("2d");
    setLimited(true);
    setFallback(
      "3D ist hier nicht verfügbar. Die 2D-Ansicht enthält dieselben Inhalte.",
    );
  }, []);
  return (
    <main className="brain-workspace">
      <header>
        <div>
          <Link href="/dashboard">← Übersicht</Link>
          <h1>Gehirn</h1>
          <p>Deine Gedanken und ihre Verbindungen</p>
        </div>
        <button
          className="workspace-button"
          onClick={() => window.dispatchEvent(new Event("neo-open-search"))}
        >
          Suchen · ⌘K
        </button>
      </header>
      <div className="brain-toolbar">
        <label>
          Im Graph suchen
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Thema, Projekt oder Person"
          />
        </label>
        <label>
          Seit
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
          />
        </label>
        <label>
          Ansicht
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="2d">2D</option>
            <option value="3d" disabled={limited}>
              3D{limited ? " (auf diesem Gerät nicht aktiv)" : ""}
            </option>
            <option value="list">Liste</option>
          </select>
        </label>
        <button
          className="workspace-button"
          onClick={() => setRetry((n) => n + 1)}
          disabled={busy}
        >
          Aktualisieren
        </button>
      </div>
      <fieldset className="brain-types">
        <legend>Knotentypen</legend>
        {NODE_TYPES.map((t) => (
          <label key={t} style={{ borderColor: colors[t] }}>
            <input
              type="checkbox"
              checked={types.includes(t)}
              onChange={() =>
                setTypes((old) =>
                  old.includes(t) ? old.filter((x) => x !== t) : [...old, t],
                )
              }
            />
            {labels[t]}
          </label>
        ))}
      </fieldset>
      <p className="workspace-muted">
        Nur deine Daten. Personen stammen aus Zuständigkeitsangaben. Tags
        verbinden Notizen; @Projekt und @[Projekt mit Leerzeichen] verweisen auf
        eigene Projekte. „Seit“ behält den zugehörigen Kontext.{" "}
        {limited ? "2D schont Bewegung und Grafikleistung." : ""}
      </p>
      {fallback && <p role="status">{fallback}</p>}
      {busy ? (
        <LoadingState label="Dein Wissensgraph wird geladen …" />
      ) : error ? (
        <>
          <ErrorState message={error} retry={() => setRetry((n) => n + 1)} />
          <Link href="/login">Zum Login</Link>
        </>
      ) : !graph?.nodes.length ? (
        <EmptyState
          title="Dein Wissensraum ist noch leer"
          href="/notiz?new=1"
          label="Notiz schreiben"
        >
          Speichere deine erste Notiz oder lege ein Projekt an. Verbindungen
          entstehen aus Tags und Zuordnungen.
        </EmptyState>
      ) : (
        <>
          {graph.truncated && (
            <p role="status">
              Ausschnitt: bis zu 1.000 aktuelle Notizen, 200 Projekte und 2.000
              Knoten. Weitere Inhalte findest du in der Notizsuche.
            </p>
          )}
          <p role="status">
            {filtered?.nodes.length} Knoten · {filtered?.links.length}{" "}
            Verbindungen{query ? ` · ${hits.length} Suchtreffer` : ""}
          </p>
          <div className="brain-body">
            <section aria-label="Wissensgraph">
              <div className="brain-canvas" ref={viewport}>
                {!filtered?.nodes.length ? (
                  <p>
                    Keine Knoten für diese Filter. Wähle weitere Typen oder
                    einen früheren Zeitraum.
                  </p>
                ) : mode === "list" ? (
                  <p>Wähle einen Eintrag in der Ergebnisliste.</p>
                ) : (
                  ready &&
                  data && (
                    <CanvasBoundary
                      key={mode}
                      onFail={
                        mode === "3d"
                          ? fail
                          : () => {
                              setMode("list");
                              setFallback(
                                "Die Grafik konnte nicht geladen werden. Alle Inhalte sind in der Liste verfügbar.",
                              );
                            }
                      }
                    >
                      {mode === "3d" ? (
                        <Graph3D
                          data={data}
                          {...size}
                          query={query}
                          selected={selected}
                          onSelect={(n) => setSelected(n.id)}
                          reduced={reduced}
                          onFail={fail}
                        />
                      ) : (
                        <Graph2D
                          data={data}
                          {...size}
                          query={query}
                          selected={selected}
                          onSelect={(n) => setSelected(n.id)}
                          reduced={reduced}
                        />
                      )}
                    </CanvasBoundary>
                  )
                )}
              </div>
              <p className="workspace-muted">
                Knoten wählen für Vorschau · Ziehen zum Bewegen · Scrollen zum
                Zoomen. Die Liste ist mit der Tastatur bedienbar.
              </p>
            </section>
            <aside aria-label="Vorschau und Treffer">
              {active ? (
                <section className="brain-preview">
                  <small>{labels[active.type]}</small>
                  <h2>{active.label}</h2>
                  <p>{active.summary}</p>
                  <p>{active.degree} Verbindungen</p>
                  <Link className="workspace-button" href={active.href}>
                    Öffnen
                  </Link>
                </section>
              ) : (
                <p>Wähle einen Knoten oder Listeneintrag.</p>
              )}
              <h2>{query ? "Suchtreffer" : "Knoten"}</h2>
              <ul className="brain-results">
                {hits.map((n) => (
                  <li key={n.id}>
                    <button
                      aria-pressed={n.id === selected}
                      onClick={() => setSelected(n.id)}
                    >
                      <span style={{ color: colors[n.type] }}>●</span> {n.label}
                      <small>{labels[n.type]}</small>
                    </button>
                  </li>
                ))}
              </ul>
              {!hits.length && (
                <p>Keine Treffer. Ändere Suchbegriff oder Filter.</p>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
