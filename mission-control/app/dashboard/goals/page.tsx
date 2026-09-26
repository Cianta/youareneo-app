"use client";
import { useState } from "react";
import { Plus, Check, Trash2, Pencil } from "lucide-react";
import {
  usePersonal,
  inWorkspace,
  type Workspace,
  AREAS,
  AREA_COLORS,
  type SoulGoal,
  type Area,
} from "@/lib/workspace/personal";
import { useBoard } from "@/lib/workspace/useBoard";
import { Modal } from "@/components/ui/Modal";
import { DailyPlanner } from "@/components/workspace/DailyPlanner";
import { WorkspaceChoice } from "@/components/workspace/WorkspaceChoice";
export default function GoalsPage() {
  const s = usePersonal(),
    { board } = useBoard();
  const [editing, setEditing] = useState<Partial<SoulGoal> | null>(null);
  return (
    <div className="w-page">
      <DailyPlanner
        onAddGoal={() => setEditing({})}
        renderGoals={
          <>
            <div className="s-grid">
              {s.goals
                .filter((g) => inWorkspace(g, s.workspace))
                .map((g) => (
                  <article
                    className="w-card s-goal"
                    key={g.id}
                    style={{ borderTopColor: AREA_COLORS[g.area] }}
                  >
                    <div className="w-section-head">
                      <span className="w-eyebrow">{g.area}</span>
                      <div className="s-actions">
                        <button
                          className="w-icon"
                          aria-label={`${g.title} bearbeiten`}
                          onClick={() => setEditing(g)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="w-icon"
                          aria-label={`${g.title} löschen`}
                          onClick={() => {
                            if (confirm("Dieses Ziel entfernen?"))
                              s.set({
                                goals: s.goals.filter((x) => x.id !== g.id),
                              });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <h2
                      style={{
                        textDecoration: g.done ? "line-through" : undefined,
                      }}
                    >
                      {g.title}
                    </h2>
                    <details>
                      <summary>Mein Warum</summary>
                      <p>{g.why || "Was trägt dieses Ziel?"}</p>
                    </details>
                    <p className="s-next-step">
                      ↳{" "}
                      {g.step ||
                        "Welcher kleine Schritt ist als Nächstes möglich?"}
                    </p>
                    {g.due && (
                      <small>
                        Bis{" "}
                        {new Date(g.due + "T12:00:00").toLocaleDateString(
                          "de-AT",
                        )}
                      </small>
                    )}
                    <button
                      className="w-btn"
                      onClick={() =>
                        s.set({
                          goals: s.goals.map((x) =>
                            x.id === g.id ? { ...x, done: !x.done } : x,
                          ),
                        })
                      }
                    >
                      <Check size={15} />
                      {g.done ? "Wieder öffnen" : "Als erreicht markieren"}
                    </button>
                  </article>
                ))}
            </div>
            {!s.goals.filter((g) => inWorkspace(g, s.workspace)).length && (
              <div className="s-empty">
                ✦<h2>Platz für das, was zählt.</h2>
                <p>Was soll in deinem Leben wachsen? Beginne mit einem Ziel.</p>
              </div>
            )}
          </>
        }
      />
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Ziel weiterentwickeln" : "Ein neues Ziel"}
      >
        {editing && (
          <form
            className="s-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const goal: SoulGoal = {
                id: editing.id ?? crypto.randomUUID(),
                workspace: String(f.get("workspace")) as Workspace,
                title: String(f.get("title")).trim(),
                why: String(f.get("why")).trim(),
                step: String(f.get("step")).trim(),
                area: String(f.get("area")) as Area,
                due: String(f.get("due")),
                done: editing.done ?? false,
                projectId: String(f.get("project")),
              };
              s.set({
                goals: editing.id
                  ? s.goals.map((g) => (g.id === editing.id ? goal : g))
                  : [...s.goals, goal],
              });
              setEditing(null);
            }}
          >
            <label>
              Mein Ziel
              <input
                className="w-input"
                name="title"
                required
                defaultValue={editing.title}
              />
            </label>
            <label>
              Warum bedeutet mir das etwas?
              <textarea
                className="w-input"
                name="why"
                required
                defaultValue={editing.why}
              />
            </label>
            <label>
              Mein nächster konkreter Schritt
              <input
                className="w-input"
                name="step"
                defaultValue={editing.step}
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
              Verbundenes Projekt
              <select
                className="w-input"
                name="project"
                defaultValue={editing.projectId ?? ""}
              >
                <option value="">Noch keines</option>
                {board.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Zieldatum · optional
              <input
                className="w-input"
                type="date"
                name="due"
                defaultValue={editing.due}
              />
            </label>
            <WorkspaceChoice value={editing.workspace} />
            <button className="w-btn w-btn-primary">Speichern</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
