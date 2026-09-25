"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  Circle,
  CalendarDays,
  Sparkles,
  Leaf,
  Sun,
  Play,
  Columns3,
  Orbit,
} from "lucide-react";
import {
  useAuthStore,
  useTemporalStore,
  useFocusStore,
  useFloatingAgentStore,
  useLauncherStore,
} from "@/lib/store";
import { useBoard } from "@/lib/workspace/useBoard";
import {
  boardTasks,
  createTask,
  isDone,
  moveTask,
} from "@/lib/workspace/board";
import { localDate, validWebUrl } from "@/lib/workspace/time";
import { FocusCard } from "./FocusSpace";

export function Today() {
  const user = useAuthStore((s) => s.user);
  const { board, ready, error, change } = useBoard();
  const temporal = useTemporalStore();
  const apps = useLauncherStore((s) => s.apps);
  const [now, setNow] = useState(new Date());
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<"open" | "done">("open");
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const tasks = boardTasks(board, user?.name ?? null);
  const done = tasks.filter((t) => t.done).length;
  const visible = tasks.filter((t) => (filter === "done" ? t.done : !t.done));
  const today = localDate(now);
  const events = temporal.events
    .filter(
      (e) =>
        e.date === today &&
        temporal.calendars.some((c) => c.id === e.calendarId && c.visible),
    )
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  const links = Object.values(apps)
    .flat()
    .filter((a) => a.kind === "webapp" && validWebUrl(a.url))
    .slice(0, 4);
  const greeting =
    now.getHours() < 11
      ? "Guten Morgen"
      : now.getHours() < 18
        ? "Schön, dass du da bist"
        : "Guten Abend";
  function add(e: FormEvent) {
    e.preventDefault();
    if (change((b) => createTask(b, title, user?.name ?? null))) setTitle("");
  }
  function finish(task: (typeof tasks)[number]) {
    change((b) => {
      const project = b.projects.find((p) => p.id === task.projectId)!;
      const target = project.columns.find((c) =>
        task.done ? !isDone(c.label) : isDone(c.label),
      );
      if (!target)
        throw new Error("Lege im Board zuerst eine Spalte „Erledigt“ an.");
      return moveTask(b, task.projectId, task.id, target.id);
    });
  }
  return (
    <div className="today-page">
      <div className="w-page-heading">
        <div>
          <div className="w-eyebrow">
            <span className="w-live-dot" />
            {now.toLocaleDateString("de-AT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          <h1>
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
            <span className="w-heading-sun">
              <Sun size={29} />
            </span>
          </h1>
          <p>Dein Kopf wird frei. Dein Tag bekommt Richtung.</p>
        </div>
        <Link className="w-btn" href="/dashboard/calendar">
          <CalendarDays size={16} />
          Tag planen <ArrowUpRight size={15} />
        </Link>
      </div>
      <section className="w-hero">
        <div className="w-hero-content">
          <span className="w-eyebrow">
            <Leaf size={13} /> DEIN RAUM. DEIN RHYTHMUS.
          </span>
          <h2>
            Großes entsteht
            <br />
            aus <em>bewussten Momenten.</em>
          </h2>
          <p>
            Verbinde, was dir wichtig ist. Schaffe mit Klarheit.
            <br />
            Und vergiss dabei nicht, durchzuatmen.
          </p>
          <button
            className="w-btn w-btn-primary"
            onClick={() => useFocusStore.setState({ isOpen: true })}
          >
            <Play size={15} />
            In den Fokus finden <ArrowUpRight size={16} />
          </button>
        </div>
        <span className="w-hero-caption">
          THE SANCTUARY <span>01 / ∞</span>
        </span>
        <div className="w-hero-orbits" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </section>
      <div className="w-summary-strip">
        <div>
          <span className="w-summary-icon">
            <Columns3 size={18} />
          </span>
          <strong>{ready ? tasks.length - done : "–"}</strong>
          <span>offene Aufgaben</span>
        </div>
        <div>
          <span className="w-summary-icon">
            <Check size={18} />
          </span>
          <strong>{ready ? done : "–"}</strong>
          <span>abgeschlossen</span>
        </div>
        <div>
          <span className="w-summary-icon">
            <CalendarDays size={18} />
          </span>
          <strong>{events.length}</strong>
          <span>Termine heute</span>
        </div>
        <Link href="/dashboard/eden">
          <Orbit size={17} />
          <span>Platz für eine neue Idee</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="w-cockpit-grid">
        <section className="w-card w-tasks-card">
          <div className="w-section-head">
            <div>
              <span className="w-eyebrow">SCHRITT FÜR SCHRITT</span>
              <h2>Was heute zählt</h2>
            </div>
            <Link
              className="w-icon"
              href="/dashboard/vision/tasks"
              aria-label="Zum Kanban-Board"
            >
              <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className="w-task-tabs">
            <button
              className={filter === "open" ? "active" : ""}
              onClick={() => setFilter("open")}
            >
              Offen <span>{tasks.length - done}</span>
            </button>
            <button
              className={filter === "done" ? "active" : ""}
              onClick={() => setFilter("done")}
            >
              Erledigt <span>{done}</span>
            </button>
            <small>Aus deinen Boards</small>
          </div>
          {error && (
            <p role="alert" className="w-error">
              {error}
            </p>
          )}
          <div className="w-task-list">
            {visible.slice(0, 5).map((task) => (
              <div className="w-task-row" key={task.id}>
                <button
                  className={`w-check ${task.done ? "checked" : ""}`}
                  aria-label={`${task.done ? "Wieder öffnen" : "Erledigen"}: ${task.title}`}
                  onClick={() => finish(task)}
                >
                  {task.done && <Check size={12} />}
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {task.projectName}
                    <span>·</span>
                    {task.columnName}
                  </small>
                </div>
                <button
                  className="w-task-focus"
                  title="Mit dieser Aufgabe fokussieren"
                  aria-label={`Fokus: ${task.title}`}
                  onClick={() => {
                    const f = useFocusStore.getState();
                    f.setDailyTask(0, task.title);
                    f.setDailyTaskDone(0, false);
                    useFocusStore.setState({ isOpen: true });
                  }}
                >
                  <Play size={14} />
                </button>
              </div>
            ))}
            {ready && visible.length === 0 && (
              <div className="w-empty">
                <Circle size={25} />
                <strong>
                  {filter === "done"
                    ? "Jeder kleine Schritt zählt."
                    : "Raum für deinen nächsten Schritt."}
                </strong>
                <p>
                  {filter === "done"
                    ? "Abgeschlossene Aufgaben findest du hier."
                    : "Was möchtest du heute bewegen? Lege deine erste Aufgabe an."}
                </p>
              </div>
            )}
          </div>
          <form onSubmit={add} className="w-quick-add">
            <Plus size={17} />
            <input
              aria-label="Neue Aufgabe"
              placeholder="Ein nächster Schritt …"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              disabled={!title.trim() || !ready}
              aria-label="Aufgabe hinzufügen"
            >
              <ArrowRight size={18} />
            </button>
          </form>
          {visible.length > 5 && (
            <Link className="w-text-link" href="/dashboard/vision/tasks">
              Alle {visible.length} Aufgaben ansehen <ArrowRight size={14} />
            </Link>
          )}
        </section>
        <FocusCard />
        <section className="w-card w-agenda-card">
          <div className="w-section-head">
            <div>
              <span className="w-eyebrow">IM FLUSS DER ZEIT</span>
              <h2>Dein Tageslauf</h2>
            </div>
            <Link
              className="w-icon"
              href="/dashboard/calendar"
              aria-label="Kalender öffnen"
            >
              <Plus size={18} />
            </Link>
          </div>
          <div className="w-agenda">
            {events.slice(0, 4).map((e) => (
              <div key={e.id} className="w-agenda-event">
                <time>{e.startTime || "Heute"}</time>
                <span
                  className="w-agenda-dot"
                  style={{
                    background: temporal.calendars.find(
                      (c) => c.id === e.calendarId,
                    )?.color,
                  }}
                />
                <div>
                  <strong>{e.title}</strong>
                  <small>
                    {e.endTime ? `bis ${e.endTime}` : "Zeit für dich"}
                  </small>
                </div>
              </div>
            ))}
            {!events.length && (
              <div className="w-empty">
                <CalendarDays size={26} />
                <strong>Dein Tag darf sich entfalten.</strong>
                <p>
                  Plane einen Termin oder reserviere Zeit für konzentriertes
                  Arbeiten.
                </p>
              </div>
            )}
          </div>
          <Link className="w-text-link" href="/dashboard/calendar">
            Liveplan öffnen <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="w-bottom-grid">
        <section className="w-card">
          <div className="w-section-head">
            <div>
              <span className="w-eyebrow">ALLES, WAS DICH WEITERBRINGT</span>
              <h2>Deine Arbeitswelt</h2>
            </div>
            <Link className="w-text-link" href="/dashboard/apps">
              Alle Apps <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="w-app-shortcuts">
            {links.map((app) => (
              <a
                href={app.url}
                key={app.id}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{app.name.slice(0, 1).toUpperCase()}</span>
                <strong>{app.name}</strong>
                <ArrowUpRight size={13} />
              </a>
            ))}
            <Link href="/dashboard/apps" className="w-add-shortcut">
              <span>
                <Plus size={19} />
              </span>
              <strong>App hinzufügen</strong>
            </Link>
          </div>
        </section>
        <section className="w-ai-card">
          <span className="w-ai-orb">
            <Sparkles size={24} />
          </span>
          <div>
            <span className="w-eyebrow">DEIN DENKPARTNER</span>
            <h2>
              Du bringst die Vision.
              <br />
              Trinity hilft beim nächsten Schritt.
            </h2>
            <button
              className="w-text-link"
              onClick={() => {
                const ai = useFloatingAgentStore.getState();
                ai.setInput("Hilf mir, meinen Tag zu strukturieren.");
                if (!ai.isOpen) ai.toggle();
              }}
            >
              Mit AI planen <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </div>
      <footer className="w-page-footer">
        <span>Weniger verstreut. Mehr verbunden.</span>
        <span>
          <Leaf size={12} /> Für ein Leben in Balance.
        </span>
        <span>TRINITY · YOU ARE NEO</span>
      </footer>
    </div>
  );
}
