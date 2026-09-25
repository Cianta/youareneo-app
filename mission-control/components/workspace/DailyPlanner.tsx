"use client";
import { useState } from "react";
import {
  usePersonal,
  inWorkspace,
  AREA_COLORS,
} from "@/lib/workspace/personal";
import { localDate } from "@/lib/workspace/time";
export function DailyPlanner() {
  const s = usePersonal(),
    [date, setDate] = useState(localDate(new Date())),
    [view, setView] = useState("Mindmap"),
    [page, setPage] = useState(0);
  const key = `${s.workspace}:${date}`,
    day = s.days[key] ?? {
      top: ["", "", ""],
      opportunity: "",
      gratitude: "",
      learned: "",
      goal: "",
    };
  const goals = s.goals.filter((g) => inWorkspace(g, s.workspace));
  const selected = goals.find((g) => g.id === day.goal);
  const reasonKey = selected?.id ?? s.workspace;
  const reasons = s.reasons[reasonKey] ?? [];
  const patch = (p: Partial<typeof day>) =>
    s.set({ days: { ...s.days, [key]: { ...day, ...p } } });
  return (
    <section className="s-planner">
      <div className="w-card s-form">
        <div className="w-section-head">
          <div>
            <span className="w-eyebrow">CHANCENPLANER</span>
            <h2>Ein Tag mit Richtung.</h2>
          </div>
          <input
            aria-label="Planungstag"
            type="date"
            className="w-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <label>
          Welchem Ziel dient dieser Tag?
          <select
            className="w-input"
            value={day.goal}
            onChange={(e) => patch({ goal: e.target.value })}
          >
            <option value="">Mein gesamter Weg</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        {day.top.map((value, i) => (
          <label key={i}>
            Mein Fokus {i + 1}
            <input
              className="w-input"
              value={value}
              onChange={(e) =>
                patch({
                  top: day.top.map((v, j) => (i === j ? e.target.value : v)),
                })
              }
            />
          </label>
        ))}
        {(
          [
            ["opportunity", "Welche Chance möchte ich heute nutzen?"],
            ["gratitude", "Was trägt mich heute?"],
            ["learned", "Was habe ich gelernt und bewegt?"],
          ] as const
        ).map(([field, label]) => (
          <label key={field}>
            {label}
            <textarea
              className="w-input"
              value={day[field]}
              onChange={(e) => patch({ [field]: e.target.value })}
            />
          </label>
        ))}
        <h3>100 Gründe für {selected?.title ?? "meinen Weg"}</h3>
        <p className="w-muted">
          {reasons.filter(Boolean).length} von 100 ausgefüllt · dauerhaft beim
          Ziel gespeichert.
        </p>
        <div className="s-actions">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              type="button"
              className="w-btn"
              aria-pressed={page === i}
              onClick={() => setPage(i)}
              key={i}
            >
              {i * 10 + 1}–{i * 10 + 10}
            </button>
          ))}
        </div>
        {Array.from({ length: 10 }, (_, i) => page * 10 + i).map((i) => (
          <label key={i}>
            Grund {i + 1}
            <input
              className="w-input"
              value={reasons[i] ?? ""}
              onChange={(e) => {
                const next = Array.from({ length: 100 }, (_, j) =>
                  j === i ? e.target.value : (reasons[j] ?? ""),
                );
                s.set({ reasons: { ...s.reasons, [reasonKey]: next } });
              }}
            />
          </label>
        ))}
      </div>
      <aside className="w-card s-goal-map">
        <span className="w-eyebrow">DEINE ZIELE IN VERBINDUNG</span>
        <select
          aria-label="Zieldarstellung"
          className="w-input"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          {["Mindmap", "Pyramide", "Fortschritt"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {view === "Mindmap" ? (
          <svg viewBox="0 0 420 420" role="img" aria-label="Ziele als Mindmap">
            <circle
              cx="210"
              cy="210"
              r="48"
              fill="var(--w-surface)"
              stroke="var(--w-accent)"
            />
            <text x="210" y="215" textAnchor="middle" fill="var(--w-text)">
              Mein Warum
            </text>
            {goals.slice(0, 12).map((g, i) => {
              const a =
                  (i / Math.max(1, Math.min(12, goals.length))) * Math.PI * 2,
                x = 210 + Math.cos(a) * 145,
                y = 210 + Math.sin(a) * 145;
              return (
                <g key={g.id}>
                  <line
                    x1="210"
                    y1="210"
                    x2={x}
                    y2={y}
                    stroke={AREA_COLORS[g.area]}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="32"
                    fill="var(--w-surface)"
                    stroke={AREA_COLORS[g.area]}
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--w-text)"
                  >
                    {g.title.slice(0, 16)}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : view === "Pyramide" ? (
          <div className="s-pyramid">
            {goals.map((g, i) => (
              <div
                key={g.id}
                style={{
                  width: `${55 + (i / Math.max(1, goals.length)) * 45}%`,
                  borderColor: AREA_COLORS[g.area],
                }}
              >
                {g.title}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h2>
              {goals.filter((g) => g.done).length} / {goals.length}
            </h2>
            <progress
              aria-label="Erreichte Ziele"
              value={goals.filter((g) => g.done).length}
              max={goals.length || 1}
            />
            {goals.map((g) => (
              <p key={g.id}>
                {g.done ? "✓" : "○"} {g.title}
              </p>
            ))}
          </div>
        )}
        <p className="w-muted">
          {goals.length
            ? "Deine tatsächlichen Ziele – die Ansicht wächst mit deinen Einträgen."
            : "Lege dein erstes Ziel an, um die Ansicht zu füllen."}
        </p>
      </aside>
    </section>
  );
}
