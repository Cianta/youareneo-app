"use client";
import { useMemo, useState } from "react";
import { Search, Plus, Download, Link2, Trash2, Pencil } from "lucide-react";
import { zipSync, strToU8 } from "fflate";
import {
  usePersonal, inWorkspace, type Workspace,
  AREAS,
  AREA_COLORS,
  type BrainNote,
  type Area,
} from "@/lib/workspace/personal";
import {
  useSelfStore,
  useNinjasStore,
  useNeuralNotebookStore,
  useAuthStore,
  goalVisibleTo,
} from "@/lib/store";
import { useBoard } from "@/lib/workspace/useBoard";
import { visibleTo } from "@/lib/workspace/board";
import {
  type BrainNode,
  fileName,
  markdownFile,
  neighbors,
  downloadBlob,
} from "@/lib/workspace/brain";
import { ShareWithAgents } from "@/components/workspace/McpControls";
import { Modal } from "@/components/ui/Modal";
import { ObsidianSync } from '@/components/workspace/ObsidianSync';
import { WorkspaceChoice } from '@/components/workspace/WorkspaceChoice';
export default function SecondBrain() {
  const s = usePersonal(),
    profile = useSelfStore((x) => x.profile),
    members = useNinjasStore((x) => x.members),
    notebook = useNeuralNotebookStore(),
    user = useAuthStore((x) => x.user),
    { board } = useBoard();
  const [query, setQuery] = useState(""),
    [area, setArea] = useState("Alle"),
    [kind, setKind] = useState("Alle"),
    [selected, setSelected] = useState<string>("self"),
    [onlyNeighbors, setOnlyNeighbors] = useState(false),
    [editing, setEditing] = useState<Partial<BrainNote> | null>(null),
    [zoom, setZoom] = useState(1);
  const nodes = useMemo(() => {
    const n: BrainNode[] = [
      {
        id: "self",
        title: profile.name || user?.name || "Mein Kompass",
        kind: "Profil",
        area: "Leben",
        body: [
          profile.story,
          `## Vision\n${s.mission || profile.vision}`,
          `## Werte\n${s.values || profile.values}`,
          `## Stärken\n${profile.strengths}`,
        ].join("\n\n"),
        href: "/dashboard/goals",
        links: [],
      },
    ];
    s.goals.filter(g=>inWorkspace(g,s.workspace)).forEach((g) =>
      n.push({
        id: `goal:${g.id}`,
        title: g.title,
        kind: "Ziel",
        area: g.area,
        body: `${g.why}\n\n## Nächster Schritt\n${g.step}\n\nStatus: ${g.done ? "Erreicht" : "Offen"}\nZieldatum: ${g.due || "Offen"}`,
        href: "/dashboard/goals",
        links: ["self", ...(g.projectId ? [`project:${g.projectId}`] : [])],
      }),
    );
    board.projects
      .filter((p) => s.workspace === "organization" && visibleTo(p, user?.name ?? null))
      .forEach((p) =>
        n.push({
          id: `project:${p.id}`,
          title: p.name,
          kind: "Projekt",
          area: s.goals.find((g) => g.projectId === p.id)?.area ?? "Beruf",
          body: p.columns
            .map(
              (c) =>
                `## ${c.label}\n${c.cardIds
                  .filter(
                    (id) =>
                      board.cards[id] &&
                      visibleTo(board.cards[id], user?.name ?? null),
                  )
                  .map((id) => `- ${board.cards[id].title}`)
                  .join("\n")}`,
            )
            .join("\n\n"),
          href: "/dashboard/vision/tasks",
          links: [],
        }),
      );
    (s.workspace === "organization" ? members : []).forEach((m) =>
      n.push({
        id: `person:${m.id}`,
        title: m.name,
        kind: "Mensch",
        area: "Gemeinschaft",
        body: `${m.title}\n\n${m.bio}\n\n## Fähigkeiten\n${m.skills.join(", ")}`,
        href: "/dashboard/ninjas",
        links: [],
      }),
    );
    notebook.goals
      .filter((g) => goalVisibleTo(g, user?.name ?? null))
      .forEach((g) =>
        n.push({
          id: `legacy-goal:${g.id}`,
          title: g.text,
          kind: "Ziel",
          area: "Leben",
          body: g.notes.map((n) => n.text).join("\n\n"),
          href: "/dashboard/kanban",
          links: ["self"],
        }),
      );
    [
      ...notebook.quickNotes.map((n) => ({
        id: n.id,
        title: n.label,
        body: n.text,
      })),
      ...notebook.journal.map((n) => ({
        id: n.id,
        title: n.text.slice(0, 55),
        body: n.text,
      })),
    ].forEach((x) =>
      n.push({
        id: `notebook:${x.id}`,
        title: x.title,
        kind: "Notiz",
        area: "Leben",
        body: x.body,
        href: "/dashboard/kanban",
        links: [],
      }),
    );
    s.notes.filter(n=>inWorkspace(n,s.workspace)).forEach((x) =>
      n.push({
        id: `note:${x.id}`,
        title: x.title,
        kind: "Notiz",
        area: x.area,
        body: x.body,
        links: x.links,
      }),
    );
    for (const edge of s.relations) {
      const from = n.find((x) => x.id === edge.from);
      if (from && !from.links.includes(edge.to)) from.links.push(edge.to);
    }
    return n;
  }, [
    s.workspace,
    s.goals,
    s.notes,
    s.relations,
    s.mission,
    s.values,
    profile,
    members,
    board,
    notebook.goals,
    notebook.quickNotes,
    notebook.journal,
    user,
  ]);
  const neighborhood = neighbors(nodes, selected),
    visible = nodes.filter(
      (n) =>
        (area === "Alle" || n.area === area) &&
        (kind === "Alle" || n.kind === kind) &&
        `${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase()) &&
        (!onlyNeighbors || neighborhood.has(n.id)),
    ),
    active = nodes.find((n) => n.id === selected);
  const points = visible.map((n, i) => {
    if (n.id === "self") return { ...n, x: 440, y: 270 };
    const group = AREAS.indexOf(n.area as Area),
      siblings = visible.filter((x) => x.area === n.area && x.id !== "self"),
      rank = siblings.findIndex((x) => x.id === n.id),
      angle =
        (group * Math.PI) / 3 -
        Math.PI / 2 +
        (rank - (siblings.length - 1) / 2) *
          Math.min(0.23, 1.0 / Math.max(1, siblings.length)),
      radius = 160 + (rank % 3) * 32;
    return {
      ...n,
      x: 440 + Math.cos(angle) * radius * 1.6,
      y: 270 + Math.sin(angle) * radius,
    };
  });
  const exportAll = () => {
    const files: Record<string, Uint8Array> = {
      "README.md": strToU8(
        "# Trinity Second Brain\n\nLokaler Export mit Markdown und Obsidian-Wikilinks. Keine Passwörter, API-Schlüssel oder Geburtsdaten enthalten. Beziehungen stammen aus deinen Verknüpfungen.\n",
      ),
    };
    nodes.forEach(
      (n) => (files[fileName(n)] = strToU8(markdownFile(n, nodes))),
    );
    const zipped = zipSync(files);
    downloadBlob(
      new Uint8Array(zipped).buffer,
      "trinity-second-brain.zip",
      "application/zip",
    );
  };
  return (
    <div className="w-page">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">
            SECOND BRAIN · DEIN LEBENDIGER KOSMOS
          </span>
          <h1>Gedanken finden Verbindung.</h1>
          <p>
            Wissen, Menschen und Projekte – verbunden mit dem, was dir wichtig
            ist.
          </p>
        </div>
        <div className="s-actions">
          <ShareWithAgents nodes={nodes} />
          <button className="w-btn" onClick={exportAll}>
            <Download size={16} />
            Markdown-Vault
          </button>
          <button
            className="w-btn w-btn-primary"
            onClick={() => setEditing({})}
          >
            <Plus size={16} />
            Notiz
          </button>
        </div>
      </div>
      <ObsidianSync key={s.workspace} nodes={nodes}/><section className="s-brain-panel">
        <div className="s-brain-controls">
          <div className="w-apps-search">
            <Search size={16} />
            <input
              aria-label="Wissensnetz durchsuchen"
              placeholder="Gedanken, Ziele, Menschen …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="w-input"
            aria-label="Lebensbereich filtern"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option>Alle</option>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select
            className="w-input"
            aria-label="Art filtern"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {["Alle", "Profil", "Ziel", "Projekt", "Mensch", "Notiz"].map(
              (k) => (
                <option key={k}>{k}</option>
              ),
            )}
          </select>
          <label className="s-check">
            <input
              type="checkbox"
              checked={onlyNeighbors}
              onChange={(e) => setOnlyNeighbors(e.target.checked)}
            />
            Umgebung
          </label>
          <input
            type="range"
            aria-label="Graph vergrößern"
            min="0.7"
            max="1.6"
            step=".1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>
        <div className="s-graph-scroll">
          <svg
            viewBox="0 0 880 540"
            role="group"
            aria-label="Interaktives Wissensnetz"
            className="s-graph"
          >
            <g
              transform={`translate(440 270) scale(${zoom}) translate(-440 -270)`}
            >
              {AREAS.map((a, i) => {
                const angle = (i * Math.PI) / 3 - Math.PI / 2;
                return (
                  <g key={a}>
                    <circle
                      cx={440 + Math.cos(angle) * 220}
                      cy={270 + Math.sin(angle) * 165}
                      r="92"
                      fill={AREA_COLORS[a]}
                      opacity=".035"
                    />
                    <text
                      x={440 + Math.cos(angle) * 325}
                      y={270 + Math.sin(angle) * 242}
                      fill={AREA_COLORS[a]}
                      textAnchor="middle"
                      fontSize="11"
                      letterSpacing="2"
                    >
                      {a.toUpperCase()}
                    </text>
                  </g>
                );
              })}
              {points.flatMap((n) =>
                n.links.map((id) => {
                  const to = points.find((x) => x.id === id);
                  return to ? (
                    <line
                      key={`${n.id}-${id}`}
                      x1={n.x}
                      y1={n.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={AREA_COLORS[n.area]}
                      opacity={
                        n.id === selected || id === selected ? 0.8 : 0.22
                      }
                      strokeWidth="1.5"
                    />
                  ) : null;
                }),
              )}
              {points.map((n) => (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.kind}: ${n.title}`}
                  onClick={() => setSelected(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(n.id);
                    }
                  }}
                  className="s-graph-node"
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.id === selected ? 15 : 9}
                    fill={
                      n.kind === "Notiz"
                        ? AREA_COLORS.Notiz
                        : AREA_COLORS[n.area]
                    }
                    opacity=".18"
                  />
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.id === "self" ? 10 : 5}
                    fill={
                      n.kind === "Notiz"
                        ? AREA_COLORS.Notiz
                        : AREA_COLORS[n.area]
                    }
                  />
                  <text
                    x={n.x}
                    y={n.y + 27}
                    textAnchor="middle"
                    fontSize="11"
                    fill="currentColor"
                  >
                    {n.title.length > 24 ? n.title.slice(0, 22) + "…" : n.title}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>
        <div className="s-legend">
          {[...AREAS, "Notiz"].map((a) => (
            <span key={a}>
              <i style={{ background: AREA_COLORS[a] }} />
              {a}
            </span>
          ))}
          <span>{visible.length} Einträge</span>
        </div>
      </section>
      <div className="s-brain-bottom">
        <section className="w-card">
          <div className="w-section-head">
            <h2>Deine Einträge</h2>
            <span className="w-tag">
              {
                nodes.filter(
                  (n) =>
                    !n.links.length &&
                    !nodes.some((x) => x.links.includes(n.id)),
                ).length
              }{" "}
              noch unverknüpft
            </span>
          </div>
          <div className="s-node-list">
            {visible.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelected(n.id)}
                className={`s-node-row ${selected === n.id ? "selected" : ""}`}
              >
                <span
                  style={{
                    color: AREA_COLORS[n.kind === "Notiz" ? "Notiz" : n.area],
                  }}
                >
                  ●
                </span>
                <span>
                  {n.title}
                  <small>
                    {n.kind} · {n.area}
                  </small>
                </span>
              </button>
            ))}
            {!visible.length && (
              <p className="w-muted">Keine passenden Einträge.</p>
            )}
          </div>
        </section>
        <section className="w-card s-stack">
          {active ? (
            <>
              <span className="w-eyebrow">
                {active.kind} · {active.area}
              </span>
              <h2>{active.title}</h2>
              <p className="s-prewrap">
                {active.body || "Dieser Eintrag wartet auf deine Gedanken."}
              </p>
              <div className="s-actions">
                {active.href && (
                  <a className="w-btn" href={active.href}>
                    Quelle öffnen ↗
                  </a>
                )}
                <button
                  className="w-btn"
                  onClick={() =>
                    downloadBlob(
                      markdownFile(active, nodes),
                      fileName(active),
                      "text/markdown",
                    )
                  }
                >
                  <Download size={14} />
                  .md
                </button>
                {active.id.startsWith("note:") && (
                  <>
                    <button
                      className="w-icon"
                      aria-label="Notiz bearbeiten"
                      onClick={() =>
                        setEditing(
                          s.notes.find((n) => `note:${n.id}` === active.id) ??
                            null,
                        )
                      }
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="w-icon"
                      aria-label="Notiz löschen"
                      onClick={() => {
                        if (confirm("Diese Notiz löschen?"))
                          s.set({
                            notes: s.notes.filter(
                              (n) => `note:${n.id}` !== active.id,
                            ),
                          });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
              <h3>Verbindungen</h3>
              {nodes
                .filter(
                  (n) =>
                    n.id !== active.id &&
                    (active.links.includes(n.id) ||
                      n.links.includes(active.id)),
                )
                .map((n) => (
                  <button
                    className="w-btn"
                    key={n.id}
                    onClick={() => setSelected(n.id)}
                  >
                    {n.title} →
                  </button>
                ))}
              <label className="s-form">
                Neue Verbindung
                <select
                  className="w-input"
                  value=""
                  onChange={(e) => {
                    if (e.target.value)
                      s.set({
                        relations: [
                          ...s.relations,
                          { from: active.id, to: e.target.value },
                        ],
                      });
                  }}
                >
                  <option value="">Eintrag auswählen …</option>
                  {nodes
                    .filter(
                      (n) => n.id !== active.id && !active.links.includes(n.id),
                    )
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                </select>
              </label>
              {s.relations
                .filter((e) => e.from === active.id)
                .map((e) => (
                  <button
                    className="w-btn"
                    key={e.to}
                    onClick={() =>
                      s.set({ relations: s.relations.filter((x) => x !== e) })
                    }
                  >
                    Verbindung zu{" "}
                    {nodes.find((n) => n.id === e.to)?.title ??
                      "entferntem Eintrag"}{" "}
                    lösen
                  </button>
                ))}
            </>
          ) : (
            <p>Wähle einen Punkt im Wissensnetz.</p>
          )}
        </section>
      </div>
      <p className="w-muted">
        Verbindungen sind bewusst gesetzte Beziehungen. Keine heimliche
        KI-Auswertung deiner persönlichen Daten. Lokaler Speicher; der
        ZIP-Export lässt sich als Obsidian-Vault öffnen.
      </p>
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Gedanken festhalten"
      >
        {editing && (
          <form
            className="s-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                note: BrainNote = {
                  id: editing.id ?? crypto.randomUUID(),
                  workspace: String(f.get("workspace")) as Workspace,
                  title: String(f.get("title")).trim(),
                  body: String(f.get("body")),
                  area: String(f.get("area")) as Area,
                  links: editing.links ?? [],
                  updatedAt: new Date().toISOString(),
                };
              s.set({
                notes: editing.id
                  ? s.notes.map((n) => (n.id === editing.id ? note : n))
                  : [...s.notes, note],
              });
              setSelected(`note:${note.id}`);
              setEditing(null);
            }}
          >
            <label>
              Titel
              <input
                className="w-input"
                name="title"
                required
                defaultValue={editing.title}
              />
            </label>
            <label>
              Lebensbereich
              <select
                className="w-input"
                name="area"
                defaultValue={editing.area ?? "Leben"}
              >
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              Gedanken · Markdown
              <textarea
                className="w-input"
                name="body"
                rows={8}
                defaultValue={editing.body}
              />
            </label>
            <WorkspaceChoice value={editing.workspace}/><button className="w-btn w-btn-primary">Speichern</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
