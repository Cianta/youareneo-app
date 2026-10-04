"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { brainInsights } from "@/lib/brain/insights";
import type { BrainGraph, BrainNode } from "@/lib/brain/graph";
import { labels, colors } from "./shared";
export function BrainInsights({
  graph,
  nodes,
  onSearch,
}: {
  graph: BrainGraph;
  nodes: BrainNode[];
  onSearch: (query: string) => void;
}) {
  const [view, setView] = useState<"types" | "topics" | "activity">("types");
  const data = useMemo(() => brainInsights(graph, nodes), [graph, nodes]);
  const total = Math.max(1, nodes.length);
  let offset = 0;
  return (
    <section className="brain-insights" aria-label="Wissen auswerten">
      <header>
        <div>
          <span className="w-eyebrow">DEIN WISSEN WIRD SICHTBAR</span>
          <h2>Was steckt in deinen Gedanken?</h2>
          <p>
            Die Auswertung folgt deiner Suche und den Filtern.{" "}
            {graph.truncated &&
              "Der Graph enthält einen begrenzten Ausschnitt."}
          </p>
        </div>
        <div className="brain-insight-switch" aria-label="Auswertungsbereich">
          {(
            [
              ["types", "Überblick"],
              ["topics", "Themen"],
              ["activity", "Aktivität"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={view === key}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="brain-insight-grid">
        <article className="studio-widget" data-color="violet">
          <h3>
            {view === "types"
              ? "Dein Wissensmix"
              : view === "topics"
                ? "Themen mit Verbindungen"
                : "Gedanken der letzten 7 Tage"}
          </h3>
          {view === "types" ? (
            <div className="brain-donut">
              <svg
                viewBox="0 0 120 120"
                aria-label="Anteile der Knotentypen"
                role="img"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="var(--theme-border)"
                  strokeWidth="12"
                />
                {data.types.map((t) => {
                  const start = offset;
                  offset += (t.count / total) * 100;
                  return (
                    <circle
                      key={t.type}
                      cx="60"
                      cy="60"
                      r="44"
                      fill="none"
                      stroke={colors[t.type]}
                      strokeWidth="12"
                      pathLength="100"
                      strokeDasharray={`${(t.count / total) * 100} 100`}
                      strokeDashoffset={-start}
                      transform="rotate(-90 60 60)"
                    />
                  );
                })}
                <text
                  x="60"
                  y="62"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="22"
                >
                  {nodes.length}
                </text>
                <text
                  x="60"
                  y="79"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="9"
                >
                  Knoten
                </text>
              </svg>
              <dl>
                {data.types.map((t) => (
                  <div key={t.type}>
                    <dt>
                      <i style={{ background: colors[t.type] }} />
                      {labels[t.type]}
                    </dt>
                    <dd>{t.count}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : view === "topics" ? (
            <div className="brain-bars">
              {data.topics.map((t) => (
                <button key={t.id} onClick={() => onSearch(t.label)}>
                  <span>{t.label}</span>
                  <i
                    style={{
                      width:
                        Math.max(
                          3,
                          (t.visibleDegree /
                            Math.max(
                              1,
                              ...data.topics.map((n) => n.visibleDegree),
                            )) *
                            100,
                        ) + "%",
                    }}
                  />
                  <strong>{t.visibleDegree}</strong>
                </button>
              ))}
              {!data.topics.length && (
                <p>Noch keine Themen. Verwende #Tags in deinen Notizen.</p>
              )}
            </div>
          ) : (
            <div
              className="brain-activity"
              role="img"
              aria-label={data.days
                .map((d) => d.date + ": " + d.count + " Gedanken")
                .join(", ")}
            >
              {data.days.map((d) => (
                <div key={d.date}>
                  <strong>{d.count}</strong>
                  <i
                    style={{
                      height:
                        Math.max(
                          3,
                          (d.count /
                            Math.max(1, ...data.days.map((n) => n.count))) *
                            100,
                        ) + "px",
                    }}
                  />
                  <span>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="studio-widget" data-color="teal">
          <h3>Deine nächsten Möglichkeiten</h3>
          <p>
            <strong>{data.connected}</strong> verbundene Knoten ·{" "}
            <strong>{data.links}</strong> Verbindungen
          </p>
          <h4>Noch ohne Verbindung · {data.unlinked.length}</h4>
          {data.unlinked.slice(0, 4).map((n) => (
            <Link key={n.id} href={n.href}>
              {n.label} →
            </Link>
          ))}
          {!data.unlinked.length && (
            <p>Alle angezeigten Gedanken haben bereits Verbindungen.</p>
          )}
          <details><summary>Verbindungen herstellen</summary><p>Ordne eine Notiz einem Projekt zu oder ergänze ein #Thema, um Zusammenhänge sichtbar zu machen.</p></details>
          <div className="studio-actions">
            <Link className="w-btn" href="/notiz?new=1">
              Gedanken festhalten
            </Link>
            <Link className="w-btn" href="/dashboard/projekte">
              Projekte ordnen
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
