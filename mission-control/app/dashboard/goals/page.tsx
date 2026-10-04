"use client";
import "@/components/workspace/journal-refinement.css";
import { useState, useEffect } from "react";
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
import dynamic from "next/dynamic";
const Modal=dynamic(()=>import("@/components/ui/Modal").then(m=>m.Modal),{ssr:false});
import {PlannerExtras} from "@/components/workspace/PlannerExtras";
import {JournalCompass} from "@/components/workspace/JournalCompass";
import {LifeWheel} from "@/components/workspace/LifeWheel";
import {JOURNAL_VIEWS} from "@/lib/workspace/planner";
import {JournalNavigator,JournalPages} from "@/components/workspace/JournalPages";
import {localDate} from "@/lib/workspace/time";
import {JournalNotes,JournalYear} from "@/components/workspace/JournalNotes";
import {DayPlan} from "@/components/workspace/DayPlan";
import {Attachments} from "@/components/workspace/Attachments";
import {PlaceField} from "@/components/workspace/PlaceField";
import Link from "next/link";
import { DailyPlanner } from "@/components/workspace/DailyPlanner";
import { WorkspaceChoice } from "@/components/workspace/WorkspaceChoice";
export default function GoalsPage() {
  const s = usePersonal(),
    { board } = useBoard();
  const [date,setDate]=useState(localDate()),[view,setView]=useState("Woche");
  useEffect(()=>{const change=(e:Event)=>setView((e as CustomEvent<string>).detail);window.addEventListener("neo-journal-view",change);return()=>window.removeEventListener("neo-journal-view",change);},[]);
  const [editing, setEditing] = useState<Partial<SoulGoal> | null>(null);
  return (
    <div className="w-page journal-page journal-refined"><div className="journal-label"><span className="w-eyebrow">MEIN JOURNAL · ZIELE & NOTIZEN</span><Link href="/notiz">Sprachnotizen & Hermes →</Link><select className="journal-view-select w-input" aria-label="Planerseite wählen" value={view} onChange={e=>setView(e.target.value)}>{JOURNAL_VIEWS.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></div><div className="journal-top"><LifeWheel date={date} onDateChange={setDate}/><JournalCompass date={date} onAddGoal={()=>setEditing({})} onViewChange={setView}/></div><div className="journal-main"><JournalYear date={date}/>
      {["Woche","Monatsrückblick","Kompass"].includes(view)?<>
      <DailyPlanner selectedDate={date} onDateChange={setDate} selectedView={view} onViewChange={setView}
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
                    <button className="w-btn" onClick={()=>window.dispatchEvent(new CustomEvent("neo-plan-add",{detail:{kind:"goal",sourceId:g.id,date}}))}><Plus size={15}/> Zum Tagesplan · {g.minutes||45} min</button>
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
      <PlannerExtras date={date} view={view}/><DayPlan date={date}/></>:<><JournalPages view={view} date={date} setDate={setDate}/><PlannerExtras date={date} view={view}/></>}</div><div className="journal-side-stack"><JournalNavigator date={date} setDate={setDate} view={view} setView={setView}/><JournalNotes date={date} onDateChange={setDate}/></div>
      {editing!==null&&<Modal
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
                ...editing,
                id: editing.id ?? crypto.randomUUID(),
                workspace: String(f.get("workspace")) as Workspace,
                title: String(f.get("title")).trim(),
                why: String(f.get("why")).trim(),
                step: String(f.get("step")).trim(),
                area: String(f.get("area")) as Area,
                due: String(f.get("due")),
                done: editing.done ?? false,
                projectId: String(f.get("project")),
                minutes:Number(f.get("minutes"))||45,
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
            <label>Geschätzte Dauer · Minuten<input className="w-input" name="minutes" type="number" min="1" max="1440" defaultValue={editing.minutes??45}/></label>
            <PlaceField value={editing.location} onChange={location=>setEditing({...editing,location})}/>
            <Attachments items={editing.attachments} onChange={attachments=>setEditing({...editing,attachments})}/>
            <WorkspaceChoice value={editing.workspace} />
            <button className="w-btn w-btn-primary">Speichern</button>
          </form>
        )}
      </Modal>}
    </div>
  );
}
