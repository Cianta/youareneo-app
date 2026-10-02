"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  usePersonal,
  inWorkspace,
  AREAS,
  AREA_COLORS,
} from "@/lib/workspace/personal";
import { localDate } from "@/lib/workspace/time";
import {
  addDays,
  weekDates,
  shiftMonth,
  monthStats,
  emptyDay,
  emptyMonth,
  type PlannerDay,
} from "@/lib/workspace/planner";
import { Modal } from "@/components/ui/Modal";
const nice = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("de-AT", options);
export function DailyPlanner({
  onAddGoal,
  renderGoals,
}: {
  onAddGoal: () => void;
  renderGoals: React.ReactNode;
}) {
  const s = usePersonal();
  const today = localDate(new Date());
  const [date, setDate] = useState(today),
    [view, setView] = useState("Woche"),
    [detail, setDetail] = useState<string | null>(null),
    [reasonGoal, setReasonGoal] = useState(""),
    [reason, setReason] = useState(""),
    [reasonSearch, setReasonSearch] = useState("");
  const dates = weekDates(date),
    weekKey = `${s.workspace}:${dates[0]}`,
    monthKey = `${s.workspace}:${date.slice(0, 7)}`;
  const week = s.weeks[weekKey] ?? { intention: "", win: "", release: "" };
  const month = s.months[monthKey] ?? emptyMonth();
  const goals = s.goals.filter((g) => inWorkspace(g, s.workspace));
  const reasonKey = goals.some((g) => g.id === reasonGoal)
    ? reasonGoal
    : s.workspace;
  const reasons = s.reasons[reasonKey] ?? [];
  const stats = monthStats(s.days, s.workspace, date.slice(0, 7));
  const patchDay = (d: string, patch: Partial<PlannerDay>) => {
    const state = usePersonal.getState(),
      key = `${state.workspace}:${d}`;
    state.set({
      days: {
        ...state.days,
        [key]: { ...(state.days[key] ?? emptyDay()), ...patch },
      },
    });
  };
  const dayFor = (d: string) => s.days[`${s.workspace}:${d}`] ?? emptyDay();
  const selectedDay = detail ? dayFor(detail) : emptyDay();
  const patchMonth = (patch: Partial<typeof month>) =>
    s.set({ months: { ...s.months, [monthKey]: { ...month, ...patch } } });
  return (
    <>
      <header className="p-heading">
        <div>
          <span className="w-eyebrow">DEIN CHANCENPLANER</span>
          <h1>Raum für das Wesentliche.</h1>
          <p>Deine Woche. Dein Rhythmus. Dein nächster Schritt.</p>
        </div>
        <button className="w-btn" onClick={onAddGoal}>
          <Plus size={16} /> Neues Ziel
        </button>
      </header>
      <div className="p-toolbar">
        <div className="p-segments" aria-label="Planeransicht">
          {["Woche", "Monatsrückblick", "Kompass"].map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="p-save">● Auf diesem Gerät gespeichert</span>
      </div>
      {view !== "Kompass" && (
        <div className="p-datebar">
          <div>
            <span className="w-eyebrow">
              {view === "Woche" ? "DEINE WOCHE" : "DEIN MONAT"}
            </span>
            <h2>
              {view === "Woche"
                ? `${nice(dates[0], { day: "numeric", month: "short" })} – ${nice(dates[6], { day: "numeric", month: "short", year: "numeric" })}`
                : nice(date, { month: "long", year: "numeric" })}
            </h2>
          </div>
          <div className="s-actions">
            <button
              className="w-icon"
              aria-label="Vorheriger Zeitraum"
              onClick={() =>
                setDate(
                  view === "Woche" ? addDays(date, -7) : shiftMonth(date, -1),
                )
              }
            >
              <ChevronLeft size={18} />
            </button>
            <button className="w-btn" onClick={() => setDate(today)}>
              Heute
            </button>
            <button
              className="w-icon"
              aria-label="Nächster Zeitraum"
              onClick={() =>
                setDate(
                  view === "Woche" ? addDays(date, 7) : shiftMonth(date, 1),
                )
              }
            >
              <ChevronRight size={18} />
            </button>
            <input
              className="w-input p-date"
              type={view === "Woche" ? "date" : "month"}
              aria-label="Zeitraum wählen"
              value={view === "Woche" ? date : date.slice(0, 7)}
              onChange={(e) =>
                e.target.value &&
                setDate(
                  view === "Woche" ? e.target.value : `${e.target.value}-01`,
                )
              }
            />
          </div>
        </div>
      )}
      {view === "Woche" && (
        <>
          <section className="p-intention">
            <Sparkles size={20} />
            <label>
              <span>Diese Woche zählt</span>
              <input
                value={week.intention}
                placeholder="Ein klarer Gedanke reicht …"
                onChange={(e) =>
                  s.set({
                    weeks: {
                      ...s.weeks,
                      [weekKey]: { ...week, intention: e.target.value },
                    },
                  })
                }
              />
            </label>
            <Link href="/dashboard/calendar" className="w-btn">
              Kalender <ArrowUpRight size={14} />
            </Link>
          </section>
          <div className="p-week">
            {dates.map((d) => {
              const day = dayFor(d);
              return (
                <article
                  key={d}
                  className={`p-day ${d === today ? "is-today" : ""}`}
                >
                  <button
                    className="p-day-head"
                    onClick={() => setDetail(d)}
                    aria-label={`${nice(d, { weekday: "long", day: "numeric", month: "long" })} öffnen`}
                  >
                    <span>{nice(d, { weekday: "short" })}</span>
                    <strong>{nice(d, { day: "2-digit" })}</strong>
                    {d === today && <small>Heute</small>}
                  </button>
                  <span className="p-caption">MEINE 3 SCHRITTE</span>
                  <div className="p-steps">
                    {[0, 1, 2].map((i) => (
                      <div className="p-step" key={i}>
                        <button
                          className={day.completed?.[i] ? "is-done" : ""}
                          disabled={!day.top[i]?.trim()}
                          aria-label={`${nice(d, { weekday: "long" })}: Schritt ${i + 1} ${day.completed?.[i] ? "wieder öffnen" : "abschließen"}`}
                          aria-pressed={!!day.completed?.[i]}
                          onClick={() =>
                            patchDay(d, {
                              completed: [0, 1, 2].map((j) =>
                                j === i
                                  ? !day.completed?.[j]
                                  : !!day.completed?.[j],
                              ),
                            })
                          }
                        >
                          {day.completed?.[i] ? <Check size={12} /> : i + 1}
                        </button>
                        <textarea
                          rows={2}
                          aria-label={`${nice(d, { weekday: "long" })}: Schritt ${i + 1}`}
                          value={day.top[i] ?? ""}
                          placeholder={
                            i === 0 ? "Was zählt?" : "Platz für mehr"
                          }
                          style={{
                            textDecoration: day.completed?.[i]
                              ? "line-through"
                              : undefined,
                          }}
                          onChange={(e) =>
                            patchDay(d, {
                              top: [0, 1, 2].map((j) =>
                                j === i ? e.target.value : (day.top[j] ?? ""),
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <button className="p-day-note" onClick={() => setDetail(d)}>
                    <span>{day.opportunity || "Eine Chance entdecken"}</span>
                    <ArrowUpRight size={13} />
                  </button>
                  {day.energy && (
                    <span className="p-energy-mini">
                      Energie {"●".repeat(day.energy)}
                      {"○".repeat(5 - day.energy)}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
          <div className="p-week-footer">
            <label>
              <span>Das nehme ich mit</span>
              <input
                className="w-input"
                placeholder="Ein Erfolg, eine Erkenntnis …"
                value={week.win}
                onChange={(e) =>
                  s.set({
                    weeks: {
                      ...s.weeks,
                      [weekKey]: { ...week, win: e.target.value },
                    },
                  })
                }
              />
            </label>
            <label>
              <span>Das darf leichter werden</span>
              <input
                className="w-input"
                placeholder="Weniger davon. Mehr Raum für mich."
                value={week.release}
                onChange={(e) =>
                  s.set({
                    weeks: {
                      ...s.weeks,
                      [weekKey]: { ...week, release: e.target.value },
                    },
                  })
                }
              />
            </label>
          </div>
        </>
      )}
      {view === "Monatsrückblick" && (
        <>
          <div className="p-stats">
            {[
              [stats.active, "Tage bewusst geplant"],
              [
                `${stats.completed} / ${stats.planned}`,
                "Schritte abgeschlossen",
              ],
              [
                stats.energy === null ? "—" : `${stats.energy} / 5`,
                "Energie · eigene Angaben",
              ],
              [stats.gratitude, "Momente der Dankbarkeit"],
            ].map(([value, label]) => (
              <div className="w-card" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="p-month-grid">
            <section className="w-card p-balance">
              <span className="w-eyebrow">MEINE LEBENSBALANCE</span>
              <h2>Wie fühlt es sich an?</h2>
              <p className="w-muted">Dein eigener Blick, von 1 bis 10.</p>
              {AREAS.map((area) => (
                <label key={area}>
                  <span>
                    <i style={{ background: AREA_COLORS[area] }} />
                    {area}
                    <b>{month.balance[area] ?? "—"}</b>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    aria-label={`${area}: Zufriedenheit`}
                    aria-valuetext={
                      month.balance[area]
                        ? `${month.balance[area]} von 10`
                        : "Noch nicht bewertet"
                    }
                    value={month.balance[area] ?? 5}
                    onChange={(e) =>
                      patchMonth({
                        balance: {
                          ...month.balance,
                          [area]: Number(e.target.value),
                        },
                      })
                    }
                  />
                  <button
                    type="button"
                    className="p-text-button"
                    onClick={() =>
                      patchMonth({
                        balance: {
                          ...month.balance,
                          [area]: month.balance[area] ?? 5,
                        },
                      })
                    }
                  >
                    {month.balance[area] ? "Bewertet" : "5 übernehmen"}
                  </button>
                </label>
              ))}
            </section>
            <section className="p-reflections">
              {(
                [
                  [
                    "wins",
                    "Das ist gewachsen",
                    "Ein Erfolg, auf den du stolz bist.",
                  ],
                  ["lesson", "Das habe ich gelernt", "Eine Erkenntnis genügt."],
                  [
                    "release",
                    "Das lasse ich los",
                    "Was braucht keinen Platz mehr?",
                  ],
                  [
                    "next",
                    "Das nehme ich mir vor",
                    "Ein kleiner Schritt für den nächsten Monat.",
                  ],
                ] as const
              ).map(([key, title, placeholder], i) => (
                <label className="w-card" key={key}>
                  <span className="p-caption">0{i + 1}</span>
                  <h3>{title}</h3>
                  <textarea
                    className="w-input"
                    rows={2}
                    placeholder={placeholder}
                    value={month[key]}
                    onChange={(e) => patchMonth({ [key]: e.target.value })}
                  />
                </label>
              ))}
            </section>
          </div>
          <details className="w-card p-collected">
            <summary>Meine gesammelten Momente dieses Monats</summary>
            {Object.entries(s.days)
              .filter(
                ([key, d]) =>
                  key.startsWith(`${s.workspace}:${date.slice(0, 7)}-`) &&
                  (d.gratitude || d.learned || d.opportunity),
              )
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, d]) => (
                <article key={key}>
                  <strong>
                    {nice(key.split(":")[1], {
                      day: "numeric",
                      month: "short",
                    })}
                  </strong>
                  {d.opportunity && <p>Chance · {d.opportunity}</p>}
                  {d.gratitude && <p>Dankbar · {d.gratitude}</p>}
                  {d.learned && <p>Gelernt · {d.learned}</p>}
                </article>
              ))}
            {!stats.active && (
              <p className="w-muted">
                Deine Einträge aus der Woche sammeln sich hier.
              </p>
            )}
          </details>
        </>
      )}
      {view === "Kompass" && (
        <div className="p-compass">
          <section className="p-intention">
            <Sparkles size={22} />
            <label>
              <span>Mein Nordstern</span>
              <textarea
                rows={2}
                value={s.mission}
                onChange={(e) => s.set({ mission: e.target.value })}
                placeholder="Wofür möchte ich meine Zeit einsetzen?"
              />
            </label>
          </section>
          <label className="p-values">
            <span>Meine Werte</span>
            <input
              className="w-input"
              value={s.values}
              onChange={(e) => s.set({ values: e.target.value })}
              placeholder="Freiheit · Verbundenheit · Gesundheit …"
            />
          </label>
          {renderGoals}
          <section className="w-card p-reasons">
            <div className="w-section-head">
              <div>
                <span className="w-eyebrow">WAS MICH TRÄGT</span>
                <h2>Mein Warum.</h2>
              </div>
              <select
                className="w-input"
                aria-label="Gründe für ein Ziel"
                value={reasonKey === s.workspace ? "" : reasonKey}
                onChange={(e) => {
                  setReasonGoal(e.target.value);
                  setReasonSearch("");
                }}
              >
                <option value="">Mein Weg</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reason.trim()) return;
                const next = [...reasons];
                const gap = next.findIndex((x) => !x.trim());
                if (gap < 0) next.push(reason.trim());
                else next[gap] = reason.trim();
                s.set({ reasons: { ...s.reasons, [reasonKey]: next } });
                setReason("");
              }}
              className="p-reason-add"
            >
              <input
                className="w-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Was macht es dir wichtig?"
                aria-label="Ein neuer Grund"
              />
              <button className="w-btn w-btn-primary" disabled={!reason.trim()}>
                <Plus size={16} /> Behalten
              </button>
            </form>
            <div className="p-reason-meta">
              <span>
                {reasons.filter((x) => x.trim()).length}{" "}
                {reasons.filter((x) => x.trim()).length === 1
                  ? "Grund"
                  : "Gründe"}{" "}
                · so viele, wie dir guttun
              </span>
              {reasons.filter(Boolean).length > 6 && (
                <input
                  className="w-input"
                  aria-label="Gründe durchsuchen"
                  placeholder="Suchen …"
                  value={reasonSearch}
                  onChange={(e) => setReasonSearch(e.target.value)}
                />
              )}
            </div>
            <div className="p-reason-cards">
              {reasons.map(
                (r, i) =>
                  r.trim() &&
                  r
                    .toLocaleLowerCase()
                    .includes(reasonSearch.toLocaleLowerCase()) && (
                    <article key={i}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <textarea
                        aria-label={`Grund ${i + 1}`}
                        value={r}
                        rows={2}
                        onChange={(e) =>
                          s.set({
                            reasons: {
                              ...s.reasons,
                              [reasonKey]: reasons.map((x, j) =>
                                i === j ? e.target.value : x,
                              ),
                            },
                          })
                        }
                      />
                      <button
                        aria-label={`Grund ${i + 1} entfernen`}
                        className="w-icon"
                        onClick={() =>
                          s.set({
                            reasons: {
                              ...s.reasons,
                              [reasonKey]: reasons.map((x, j) =>
                                i === j ? "" : x,
                              ),
                            },
                          })
                        }
                      >
                        <X size={13} />
                      </button>
                    </article>
                  ),
              )}
            </div>
            {!reasons.some((x) => x.trim()) && (
              <p className="w-muted">
                Ein ehrlicher Grund ist ein guter Anfang.
              </p>
            )}
          </section>
        </div>
      )}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={
          detail
            ? nice(detail, { weekday: "long", day: "numeric", month: "long" })
            : ""
        }
      >
        <div className="s-form p-day-detail">
          <label>
            Verbunden mit
            <select
              className="w-input"
              value={selectedDay.goal}
              onChange={(e) =>
                detail && patchDay(detail, { goal: e.target.value })
              }
            >
              <option value="">Meinem Weg</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>
          {(
            [
              ["opportunity", "Meine Chance"],
              ["gratitude", "Dafür bin ich dankbar"],
              ["learned", "Das nehme ich mit"],
            ] as const
          ).map(([field, label]) => (
            <label key={field}>
              {label}
              <textarea
                rows={2}
                className="w-input"
                value={selectedDay[field]}
                onChange={(e) =>
                  detail && patchDay(detail, { [field]: e.target.value })
                }
              />
            </label>
          ))}
          <div>
            <span>Meine Energie</span>
            <div className="p-energy">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className="w-btn"
                  aria-pressed={selectedDay.energy === n}
                  onClick={() => detail && patchDay(detail, { energy: n })}
                >
                  {
                    [
                      "Erschöpft",
                      "Ruhig",
                      "Ausgeglichen",
                      "Wach",
                      "Voller Energie",
                    ][n - 1]
                  }
                </button>
              ))}
            </div>
          </div>
          <button
            className="w-btn w-btn-primary"
            onClick={() => setDetail(null)}
          >
            Fertig
          </button>
        </div>
      </Modal>
    </>
  );
}
