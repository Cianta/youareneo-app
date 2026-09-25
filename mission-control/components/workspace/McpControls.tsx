"use client";
import { useState } from "react";
import { usePersonal } from "@/lib/workspace/personal";
import { useBoard } from "@/lib/workspace/useBoard";
import { createTask } from "@/lib/workspace/board";
import { useAuthStore } from "@/lib/store";
import type { BrainNode } from "@/lib/workspace/brain";
import { markdownFile } from "@/lib/workspace/brain";
import { Modal } from "@/components/ui/Modal";
export function ShareWithAgents({ nodes }: { nodes: BrainNode[] }) {
  const [open, setOpen] = useState(false),
    [chosen, setChosen] = useState<string[]>([]),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <button className="w-btn" onClick={() => setOpen(true)}>
        Agenten freigeben
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Wissen gezielt für Agenten freigeben"
      >
        <p className="w-muted">
          Nur angekreuzte Dokumente werden als Momentaufnahme auf dem
          Trinity-Server gespeichert. Jeder mit deinem OAuth-Zugang freigegebene
          Agent kann sie lesen. Eine neue Freigabe ersetzt die vorherige; ohne
          Auswahl wird die Freigabe geleert.
        </p>
        <div className="s-stack" style={{ maxHeight: 300, overflow: "auto" }}>
          {nodes.map((n) => (
            <label className="s-check" key={n.id}>
              <input
                type="checkbox"
                checked={chosen.includes(n.id)}
                onChange={(e) =>
                  setChosen(
                    e.target.checked
                      ? [...chosen, n.id]
                      : chosen.filter((id) => id !== n.id),
                  )
                }
              />
              {n.kind}: {n.title}
            </label>
          ))}
        </div>
        <button
          className="w-btn w-btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await fetch("/api/mcp/workspace", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    documents: nodes
                      .filter((n) => chosen.includes(n.id))
                      .map((n) => ({
                        id: n.id,
                        title: n.title,
                        kind: n.kind,
                        markdown: markdownFile(n, nodes),
                      })),
                  }),
                }),
                data = await r.json();
              if (!r.ok) throw new Error(data.error);
              setStatus(`${chosen.length} Dokumente freigegeben.`);
            } catch (e) {
              setStatus(
                e instanceof Error ? e.message : "Freigabe fehlgeschlagen",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Speichern …" : `${chosen.length} Dokumente freigeben`}
        </button>
        <p role="status">{status}</p>
      </Modal>
    </>
  );
}
type Draft = { id: string; kind: string; title: string; body: string };
export function McpControls() {
  const [connections, setConnections] = useState<
      { id: string; name: string; scope: string }[]
    >([]),
    [drafts, setDrafts] = useState<Draft[]>([]),
    [status, setStatus] = useState(""),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  const s = usePersonal(),
    { change } = useBoard(),
    user = useAuthStore((x) => x.user);
  const refresh = async () => {
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/mcp/connections"),
        c = await r.json();
      if (!r.ok) throw new Error(c.error);
      setConnections(c.connections);
      setUrl(c.url);
      const q = await fetch("/api/mcp/workspace"),
        d = await q.json();
      if (!q.ok) throw new Error(d.error);
      setDrafts(d.drafts);
      setStatus("Verbindungen aktualisiert.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Verbindung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    const r = await fetch("/api/mcp/workspace", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!r.ok)
      throw new Error("Entwurf bleibt im Posteingang. Erneut versuchen.");
    setDrafts(drafts.filter((d) => d.id !== id));
  };
  const accept = async (d: Draft) => {
    try {
      if (d.kind === "note") {
        const id = `mcp-${d.id}`;
        if (!s.notes.some((n) => n.id === id))
          s.set({
            notes: [
              ...s.notes,
              {
                id,
                title: d.title,
                body: d.body,
                area: "Leben",
                links: [],
                updatedAt: new Date().toISOString(),
              },
            ],
          });
      } else {
        const ok = change((board) => {
          const id = `mcp-${d.id}`;
          if (board.cards[id]) return board;
          const next = createTask(board, d.title, user?.name ?? null);
          const generated = Object.keys(next.cards).find(
            (k) => !board.cards[k],
          )!;
          const card = { ...next.cards[generated], id, description: d.body };
          delete next.cards[generated];
          next.cards[id] = card;
          next.projects = next.projects.map((p) => ({
            ...p,
            columns: p.columns.map((c) => ({
              ...c,
              cardIds: c.cardIds.map((i) => (i === generated ? id : i)),
            })),
          }));
          return next;
        });
        if (!ok) throw new Error("Aufgabe konnte nicht übernommen werden.");
      }
      await remove(d.id);
      setStatus("Entwurf übernommen.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Übernahme fehlgeschlagen");
    }
  };
  return (
    <section className="w-card s-stack">
      <span className="w-eyebrow">DEINE AGENTEN · MCP + OAUTH</span>
      <h2>Trinity mit Codex, Claude Code oder Hermes verbinden.</h2>
      <p className="w-muted">
        In einem Client mit Remote-MCP und OAuth den Trinity-Endpunkt
        hinzufügen. Du meldest dich mit deinem FuseBase-Konto an und bestätigst
        die Rechte. Lesen betrifft nur ausdrücklich freigegebene
        Second-Brain-Dokumente; Schreibzugriff erzeugt Entwürfe zur Übernahme.
      </p>
      {url && <code className="s-prewrap">{url}</code>}
      <button className="w-btn" disabled={busy} onClick={refresh}>
        {busy ? "Prüfen …" : "MCP-Status & Entwürfe laden"}
      </button>
      <p role="status">{status}</p>
      {connections.map((c) => (
        <div className="s-cosmos-row" key={c.id}>
          <span>
            {c.name}
            <small>{c.scope}</small>
          </span>
          <button
            className="w-btn"
            onClick={async () => {
              const r = await fetch("/api/mcp/connections", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: c.id }),
              });
              if (r.ok) {
                setConnections(connections.filter((x) => x.id !== c.id));
                setStatus("Verbindung widerrufen.");
              } else setStatus("Widerruf fehlgeschlagen.");
            }}
          >
            Widerrufen
          </button>
        </div>
      ))}
      {drafts.map((d) => (
        <article className="w-card" key={d.id}>
          <span className="w-eyebrow">
            {d.kind === "note" ? "NOTIZ" : "AUFGABE"} · AGENTENENTWURF
          </span>
          <h3>{d.title}</h3>
          <p className="s-prewrap">{d.body}</p>
          <div className="s-actions">
            <button className="w-btn" onClick={() => accept(d)}>
              Übernehmen
            </button>
            <button
              className="w-btn"
              onClick={() => remove(d.id).catch((e) => setStatus(e.message))}
            >
              Verwerfen
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
