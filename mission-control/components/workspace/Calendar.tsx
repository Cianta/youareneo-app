"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock3,
  Play,
  AlertCircle,
} from "lucide-react";
import { useTemporalStore, useFocusStore } from "@/lib/store";
import { localDate, overlaps } from "@/lib/workspace/time";
import { Modal } from "@/components/ui/Modal";
export function Calendar() {
  const store = useTemporalStore();
  const [date, setDate] = useState(localDate());
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [calendarId, setCalendarId] = useState("priv-default");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const day = useMemo(() => new Date(`${date}T12:00:00`), [date]);
  const events = store.events
    .filter(
      (e) =>
        e.date === date &&
        store.calendars.some((c) => c.id === e.calendarId && c.visible),
    )
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  const currentTime = now.toTimeString().slice(0, 5);
  const currentEvents = events.filter(
    (e) =>
      date === localDate(now) &&
      e.startTime &&
      e.endTime &&
      e.startTime <= currentTime &&
      e.endTime > currentTime,
  );
  const nextEvent =
    date === localDate(now)
      ? events.find((e) => e.startTime && e.startTime > currentTime)
      : null;
  const shift = (n: number) => {
    const next = new Date(day);
    next.setDate(next.getDate() + n);
    setDate(localDate(next));
  };
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(day);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i);
    return d;
  });
  function showNew() {
    setTitle("");
    setNotes("");
    setStart("09:00");
    setEnd("10:00");
    setEditingId(null);
    setError("");
    setOpen(true);
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fields = new FormData(e.currentTarget);
    const start = String(fields.get("start") || "");
    const end = String(fields.get("end") || "");
    const eventDate = String(fields.get("date") || date);
    if (end && start && end <= start) {
      setError("Die Endzeit muss nach der Startzeit liegen.");
      return;
    }
    const draft = {
      title: title.trim(),
      date: eventDate,
      startTime: start,
      endTime: end,
      calendarId,
      notes: notes.trim(),
    };
    if (!draft.title || !store.calendars.some((c) => c.id === calendarId)) {
      setError("Bitte Titel und Kalender auswählen.");
      return;
    }
    // One store update for edits: other events and their metadata are preserved.
    try {
      if (editingId)
        useTemporalStore.setState((s) => ({
          events: s.events.map((ev) =>
            ev.id === editingId ? { ...ev, ...draft } : ev,
          ),
        }));
      else store.addEvent(draft);
      setDate(eventDate);
      setOpen(false);
    } catch {
      setError(
        "Speichern fehlgeschlagen. Bitte prüfe den freien Browserspeicher.",
      );
    }
  }
  return (
    <div className="w-page">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">ZEIT FÜR DAS WESENTLICHE</span>
          <h1>Dein Kalender. Dein Rhythmus.</h1>
          <p>
            Ein Plan mit Platz fürs Leben – und für deine nächste gute Idee.
          </p>
        </div>
        <button className="w-btn w-btn-primary" onClick={showNew}>
          <Plus size={17} />
          Termin planen
        </button>
      </div>
      <div className="w-calendar-layout">
        <section className="w-card">
          <div className="w-calendar-toolbar">
            <h2>
              {day.toLocaleDateString("de-AT", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div>
              <button
                className="w-icon"
                onClick={() => shift(-7)}
                aria-label="Vorherige Woche"
              >
                <ChevronLeft size={18} />
              </button>
              <button className="w-btn" onClick={() => setDate(localDate())}>
                Heute
              </button>
              <button
                className="w-icon"
                onClick={() => shift(7)}
                aria-label="Nächste Woche"
              >
                <ChevronRight size={18} />
              </button>
              <input
                type="date"
                aria-label="Datum auswählen"
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="w-week-strip">
            {week.map((d) => {
              const key = localDate(d);
              return (
                <button
                  key={key}
                  className={key === date ? "selected" : ""}
                  aria-pressed={key === date}
                  onClick={() => setDate(key)}
                >
                  <span>
                    {d.toLocaleDateString("de-AT", { weekday: "short" })}
                  </span>
                  <strong>{d.getDate()}</strong>
                  <i
                    className={
                      store.events.some(
                        (e) =>
                          e.date === key &&
                          store.calendars.some(
                            (c) => c.id === e.calendarId && c.visible,
                          ),
                      )
                        ? "has-events"
                        : ""
                    }
                  />
                </button>
              );
            })}
          </div>
          <div className="w-section-head">
            <h3>
              {day.toLocaleDateString("de-AT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <span className="w-tag">{events.length} Termine</span>
          </div>
          <div className="w-day-events">
            {events.map((ev) => {
              const collision = events.some(
                (other) => other.id !== ev.id && overlaps(ev, other),
              );
              return (
                <div className="w-day-event" key={ev.id}>
                  <time>
                    {ev.startTime || "Ganztägig"}
                    <small>{ev.endTime}</small>
                  </time>
                  <button
                    style={{
                      borderLeftColor: store.calendars.find(
                        (c) => c.id === ev.calendarId,
                      )?.color,
                    }}
                    onClick={() => {
                      setEditingId(ev.id);
                      setTitle(ev.title);
                      setStart(ev.startTime || "");
                      setEnd(ev.endTime || "");
                      setCalendarId(ev.calendarId);
                      setNotes(ev.notes || "");
                      setError("");
                      setOpen(true);
                    }}
                  >
                    <strong>{ev.title}</strong>
                    <span>
                      {
                        store.calendars.find((c) => c.id === ev.calendarId)
                          ?.name
                      }
                    </span>
                    {ev.notes && <p>{ev.notes}</p>}
                    {collision && (
                      <small className="w-conflict">
                        <AlertCircle size={13} />
                        Überschneidung mit einem anderen Termin
                      </small>
                    )}
                  </button>
                </div>
              );
            })}
            {!events.length && (
              <div className="w-empty w-empty-large">
                <CalendarDays size={35} />
                <h3>Noch ganz viel Möglichkeit.</h3>
                <p>Reserviere Zeit für etwas, das dir wichtig ist.</p>
                <button className="w-btn" onClick={showNew}>
                  <Plus size={16} />
                  Ersten Termin planen
                </button>
              </div>
            )}
          </div>
        </section>
        <aside className="w-calendar-aside">
          <section className="w-card">
            <div className="w-section-head">
              <span className="w-eyebrow">DEIN LIVEPLAN</span>
              <time className="w-tag">
                {now.toLocaleTimeString("de-AT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            {date === localDate(now) && (
              <div className="w-live-plan">
                {currentEvents.length ? (
                  currentEvents.map((event) => (
                    <div key={event.id}>
                      <span className="w-live-dot" />
                      <strong>Jetzt: {event.title}</strong>
                      <small>bis {event.endTime}</small>
                    </div>
                  ))
                ) : (
                  <p>Gerade kein laufender Termin.</p>
                )}
                {nextEvent && (
                  <p>
                    Als Nächstes{" "}
                    <strong>
                      {nextEvent.startTime} · {nextEvent.title}
                    </strong>
                  </p>
                )}
              </div>
            )}
            <h2>Fokus braucht Freiraum.</h2>
            <p className="w-muted">
              Plane eine bewusste Arbeitseinheit. Danach ist Zeit zum
              Durchatmen.
            </p>
            <button
              className="w-btn w-btn-primary"
              onClick={() => {
                setEditingId(null);
                setTitle("Fokuszeit");
                setNotes("Eine Sache. Volle Aufmerksamkeit.");
                setCalendarId("priv-default");
                setStart("09:00");
                setEnd("09:45");
                setError("");
                setOpen(true);
              }}
            >
              <Clock3 size={16} />
              Fokusblock planen
            </button>
            <button
              className="w-text-link"
              onClick={() => useFocusStore.setState({ isOpen: true })}
            >
              <Play size={14} />
              Fokus jetzt starten
            </button>
          </section>
          <section className="w-card">
            <span className="w-eyebrow">MEINE KALENDER</span>
            {store.calendars.map((c) => (
              <label key={c.id} className="w-calendar-toggle">
                <input
                  type="checkbox"
                  checked={c.visible}
                  onChange={() => store.toggleCalendar(c.id)}
                />
                <span style={{ background: c.color }} />
                {c.name}
              </label>
            ))}
            <p className="w-storage-note">
              Termine werden derzeit in diesem Browser gespeichert. Eine
              Kontosynchronisierung ist noch nicht aktiv.
            </p>
          </section>
        </aside>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Termin bearbeiten" : "Zeit bewusst planen"}
      >
        <form onSubmit={save} className="w-form">
          <label>
            Was hast du vor?
            <input
              autoFocus
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Zum Beispiel: Kreativer Freiraum"
            />
          </label>
          <label>
            Kalender
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            >
              {store.calendars
                .filter((c) => c.provider === "local")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Datum
            <input name="date" type="date" defaultValue={date} required />
          </label>
          <div className="w-form-row">
            <label>
              Beginn
              <input
                name="start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
            <label>
              Ende
              <input
                name="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Notizen
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </label>
          {error && (
            <p role="alert" className="w-error">
              {error}
            </p>
          )}
          <div className="w-form-actions">
            {editingId && (
              <button
                type="button"
                className="w-btn"
                onClick={() => {
                  store.removeEvent(editingId);
                  setOpen(false);
                }}
              >
                <Trash2 size={15} />
                Löschen
              </button>
            )}
            <button type="submit" className="w-btn w-btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
