"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Headphones,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import {ErrorState, LoadingState} from "@/components/workspace/States";
const VoiceRecorder=dynamic(()=>import("./VoiceRecorder").then(m=>m.VoiceRecorder),{ssr:false,loading:()=> <LoadingState label="Mikrofon wird vorbereitet …"/>});
import { useBrand } from "./BrandProvider";
import { useAssistantPreferences } from "@/components/assistant/Preferences";
import {
  emptyDraft,
  NOTE_TYPES,
  type NoteDraft,
  type SavedNote,
  type QueueEntry,
} from "@/lib/voice/contracts";
import "./voice.css";
import {OfflineDrafts} from "./OfflineDrafts";
const labels = {
  aufgabe: "Aufgabe",
  idee: "Idee",
  notiz: "Notiz",
  termin: "Termin",
};
async function api(path: string, options?: RequestInit) {
  const r = await fetch(path, { cache: "no-store", ...options });
  const data = await r.json();
  if (!r.ok)
    throw new Error(
      data.error || "Die Anfrage konnte nicht verarbeitet werden.",
    );
  return data;
}
type Config = {
  canSave: boolean;
  userId: string;
  provider: string;
  transcriptionReady: boolean;
  classificationReady: boolean;
  limits: { minutes: number; requests: number };
  usage: { voice_seconds: number; requests: number };
};
export function NoteWorkspace({ autoStart = false, initialProvider = "infomaniak", initialNote, initialProject="", initialTag="", initialType="" }: { autoStart?: boolean; initialProvider?: string; initialNote?: string; initialProject?: string; initialTag?: string; initialType?: string }) {
  const router = useRouter();
  const { appName, assistantName } = useBrand();
  const { preferences } = useAssistantPreferences();
  const [titleEdited, setTitleEdited] = useState(false);
  const [draft, setDraft] = useState<NoteDraft>(emptyDraft),
    [audio, setAudio] = useState<Blob | null>(null),
    [audioUrl, setAudioUrl] = useState("");
  const [keep, setKeep] = useState(false),
    [active, setActive] = useState(false),
    [language, setLanguage] = useState("auto");
  const [config, setConfig] = useState<Config | null>(null),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [projects, setProjects] = useState<string[]>([]),
    [newProject, setNewProject] = useState("");
  const [notes, setNotes] = useState<SavedNote[]>([]),
    [queue, setQueue] = useState<QueueEntry[]>([]),
    [tab, setTab] = useState<"notes" | "queue">("notes");
  const [q, setQ] = useState(""),
    [type, setType] = useState(initialType),
    [project, setProject] = useState(initialProject),
    [tag, setTag] = useState(initialTag);
  const [noteId, setNoteId] = useState(""),
    [confirm, setConfirm] = useState<string | null>(null),
    [playId, setPlayId] = useState<string | null>(null),
    [hasMore, setHasMore] = useState(false);
  const [notesLoading,setNotesLoading]=useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [notesError, setNotesError] = useState<{ message: string; before?: string } | null>(null);
  const notesScope = JSON.stringify([config?.userId, q, type, project, tag, initialNote]);
  const latestNotesScope = useRef(notesScope);
  latestNotesScope.current = notesScope;
  const latestLoadNotes = useRef<((before?: string) => Promise<void>) | null>(null);
  const notesMounted = useRef(false);
  const notesRequest = useRef({ version: 0, controller: null as AbortController | null });
  const cancelNotes = useCallback(() => {
    notesRequest.current.version++;
    notesRequest.current.controller?.abort();
    notesRequest.current.controller = null;
  }, []);
  useEffect(() => {
    notesMounted.current = true;
    return () => { notesMounted.current = false; cancelNotes(); };
  }, [cancelNotes]);
  useEffect(()=>{setQ("");},[initialNote]);
  useEffect(()=>{setProject(initialProject);setTag(initialTag);setType(initialType);},[initialProject,initialTag,initialType]);
  useEffect(()=>{if(initialProject)setDraft(d=>({...d,project:initialProject}));},[initialProject]);
  const field = <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage("");
  };
  const loadNotes = useCallback(
    async (before?: string): Promise<void> => {
      if (!notesMounted.current) return;
      // A write started before a filter change may finish with an old callback.
      // Refresh the current first page, rather than using its old filters/cursor.
      if (latestNotesScope.current !== notesScope) return latestLoadNotes.current?.();
      cancelNotes();
      const controller = new AbortController();
      const version = notesRequest.current.version;
      notesRequest.current.controller = controller;
      const current = () => notesMounted.current && version === notesRequest.current.version &&
        latestNotesScope.current === notesScope && !controller.signal.aborted;
      const params = new URLSearchParams({ q, type, project, tag });
      if (before) params.set("before", before);
      if (initialNote) params.set("id",initialNote);
      setNotesLoading(true);
      setNotesError(null);
      if (!before) {
        setNotes([]);
        setHasMore(false);
        setNotesLoaded(false);
      }
      try {
        const data = await api("/api/notes?" + params, { signal: controller.signal });
        if (!current()) return;
        setNotes((old) => {
          if (!before) return data.notes;
          const ids = new Set(old.map(note => note.id));
          return [...old, ...data.notes.filter((note: SavedNote) => !ids.has(note.id))];
        });
        setHasMore(data.notes.length === 50);
        setNotesLoaded(true);
      } catch (error) {
        if (current()) setNotesError({
          message: error instanceof Error && !(error instanceof TypeError) && !(error instanceof SyntaxError)
            ? error.message : "Die Notizen konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.",
          before,
        });
      } finally {
        if (current()) {
          notesRequest.current.controller = null;
          setNotesLoading(false);
        }
      }
    },
    [q, type, project, tag, initialNote, notesScope, cancelNotes],
  );
  latestLoadNotes.current = loadNotes;
  const refresh = useCallback(async () => {
    const c = await api("/api/voice/config");
    setConfig(c);
    const [p, h] = await Promise.all([
      api("/api/notes/projects"),
      api("/api/notes/queue"),
    ]);
    setProjects(p.projects);
    setQueue(h.queue);
  }, []);
  useEffect(()=>{
    const changed=()=>{void refresh().then(()=>latestLoadNotes.current?.()).catch(()=>{});};
    window.addEventListener("neo-notes-changed",changed);
    return()=>window.removeEventListener("neo-notes-changed",changed);
  },[refresh]);
  useEffect(() => {
    void refresh()
      .catch((e) => { if (!String(e.message).includes("melde dich")) setError(e.message); })
      .finally(() => setLoaded(true));
  }, [refresh]);
  useEffect(() => {
    cancelNotes();
    setNotes([]);
    setHasMore(false);
    setNotesLoaded(false);
    setNotesError(null);
    setNotesLoading(!!config);
    if (!config) return;
    const timer = setTimeout(
      () => void loadNotes(),
      250,
    );
    return () => { clearTimeout(timer); cancelNotes(); };
  }, [config?.userId, loadNotes, cancelNotes]);
  function clearFilters() {
    setQ(""); setType(""); setProject(""); setTag("");
    if (initialNote || initialProject || initialTag || initialType)
      router.replace("/notiz", { scroll: false });
  }
  const filtered = !!(q.trim() || type || project || tag.trim() || initialNote);
  useEffect(() => {
    if (!audio) {
      setAudioUrl("");
      return;
    }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (draft.transcript || audio) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [draft.transcript, audio]);
  async function action(name: string, fn: () => Promise<void>) {
    setBusy(name);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte erneut versuchen.");
    } finally {
      setBusy("");
    }
  }
  async function transcribe() {
    await action("Umwandlung", async () => {
      if (!audio) return;
      const form = new FormData();
      form.set("audio", audio, "recording");
      form.set("language", language);
      const data = await api("/api/voice/transcribe", {
        method: "POST",
        body: form,
      });
      setDraft((previous) => ({
        ...previous,
        transcript: previous.transcript
          ? previous.transcript + "\n" + data.transcript
          : data.transcript,
        title: previous.title || data.transcript.slice(0, 80),
        source: "voice",
      }));
      setNoteId(crypto.randomUUID());
      if (!keep) setAudio(null);
      setMessage(
        "Text ist bereit. Prüfe ihn und lass ihn auf Wunsch einordnen.",
      );
      await refresh();
    });
  }
  async function organize() {
    await action("Einordnung", async () => {
      const data = await api("/api/voice/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: draft.transcript,
          source: draft.source,
        }),
      });
      setDraft(data.note);
      setTitleEdited(true);
      setMessage("Vorschlag bereit. Du kannst alle Felder ändern.");
      await refresh();
    });
  }
  async function save() {
    await action("Speichern", async () => {
      const id = noteId || crypto.randomUUID();
      setNoteId(id);
      const form = new FormData();
      form.set("id", id);
      form.set(
        "note",
        JSON.stringify({
          ...draft,
          tags: draft.tags.map((t) => t.trim()).filter(Boolean),
        }),
      );
      if (keep && audio && draft.source === "voice")
        form.set("audio", audio, "recording");
      await api("/api/notes", { method: "POST", body: form });
      setDraft(emptyDraft());
      setTitleEdited(false);
      setAudio(null);
      setNoteId("");
      setKeep(false);
      setMessage("Gespeichert. Hermes-Aufträge warten auf deine Freigabe.");
      await Promise.all([refresh(), loadNotes()]);
    });
  }
  async function decide(note_id: string, status: "freigegeben" | "abgelehnt") {
    await action("Hermes", async () => {
      await api("/api/notes/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id, status }),
      });
      setConfirm(null);
      await refresh();
    });
  }
  return (
    <section className="voice-page">
      <div className="voice-wrap">
        <header className="voice-header">
          <button className="voice-secondary" onClick={()=>window.dispatchEvent(new Event("neo-open-search"))}>Suchen</button>
          <Link href="/dashboard" className="voice-back">
            <ArrowLeft size={16} />
            {appName}
          </Link>
          <span>DEIN GEDANKENRAUM</span>
          <Link href="/notiz/hilfe">
            Als App installieren <ArrowUpRight size={15} />
          </Link>

        </header>
        <div className="voice-heading">
          <div>
            <p className="voice-eyebrow">FESTHALTEN. ORDNEN. WEITERDENKEN.</p>
            <h1>Ein Gedanke genügt.</h1>
            <p>
              {assistantName} hilft dir, aus Worten den nächsten Schritt zu
              machen.
            </p>
          </div>
          <span className="voice-badge">Sprachnotizen</span>
        </div>
        {loaded && !config && (
          <aside className="voice-notice">
            Aufnehmen und schreiben geht sofort. Für die KI-Umwandlung bitte{" "}
            <Link href="/login?next=/notiz">mit deinem NEO-Konto anmelden</Link>
            . Speichern benötigt einen aktiven Förder- oder App-Zugang.
          </aside>
        )}
        {config && !config.canSave && (
          <aside className="voice-notice">
            Du kannst aufnehmen, transkribieren und einordnen. Speichern braucht
            einen aktiven Förder- oder App-Zugang. Ungespeicherte Entwürfe
            bleiben nur in diesem Tab.
          </aside>
        )}
        <div className="voice-columns">
          <section className="voice-card voice-compose">
            <OfflineDrafts disabled={!!busy||active||!!draft.transcript} onChoose={text=>setDraft({...emptyDraft(),transcript:text,title:text.slice(0,80)})}/>
            <VoiceRecorder
              autoStart={autoStart}
              disabled={!!busy || !preferences.microphone}
              onActiveChange={setActive}
              onMeter={(level) => window.dispatchEvent(new CustomEvent("neo-assistant-state", {
                detail: {state: level === null ? "idle" : "listening", level: level ?? 0},
              }))}
              onRecording={(blob) => {
                setAudio(blob);
                setNoteId(crypto.randomUUID());
                setMessage("Aufnahme bereit. Jetzt in Text umwandeln.");
              }}
            />
            <div className="voice-audio-options">
              <label>
                Sprache
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="auto">Deutsch / Englisch automatisch</option>
                  <option value="de">Deutsch bevorzugen</option>
                </select>
              </label>
              <label className="voice-check">
                <input
                  type="checkbox"
                  checked={keep}
                  disabled={!config?.canSave}
                  onChange={(e) => setKeep(e.target.checked)}
                />
                Aufnahme behalten
              </label>
            </div>
            {audio && (
              <div className="voice-audio">
                <audio controls src={audioUrl} preload="metadata" />
                <button
                  className="voice-primary"
                  disabled={!!busy || active || !config?.transcriptionReady}
                  onClick={transcribe}
                >
                  In Text umwandeln
                </button>
                <button
                  className="voice-text-button"
                  onClick={() => setAudio(null)}
                  disabled={!!busy || active}
                >
                  Aufnahme verwerfen
                </button>
              </div>
            )}
            {config && !config.transcriptionReady && (
              <p className="voice-muted">
                Spracherkennung wird eingerichtet. Textnotizen funktionieren
                bereits.
              </p>
            )}
            <label className="voice-label">
              Deine Worte
              <textarea
                placeholder="Sprich deinen Gedanken ein oder schreib ihn hier auf …"
                rows={6}
                maxLength={20000}
                value={draft.transcript}
                disabled={!!busy || active}
                onChange={(e) => {
                  field("transcript", e.target.value);
                  if (!titleEdited) field("title", e.target.value.slice(0, 80));
                }}
              />
            </label>
            <button
              className="voice-secondary voice-organize"
              onClick={organize}
              disabled={
                !!busy ||
                active ||
                !draft.transcript.trim() ||
                !config?.classificationReady
              }
            >
              <Sparkles size={17} />
              Mit {assistantName} einordnen
            </button>
            <div className="voice-divider" />
            <fieldset disabled={!!busy || active} className="voice-form-grid">
              <label className="voice-label voice-full">
                Titel
                <input
                  maxLength={200}
                  value={draft.title}
                  onChange={(e) => {
                    setTitleEdited(true);
                    field("title", e.target.value);
                  }}
                />
              </label>
              <label className="voice-label voice-full">
                Zusammenfassung
                <textarea
                  rows={2}
                  maxLength={4000}
                  value={draft.summary}
                  onChange={(e) => field("summary", e.target.value)}
                />
              </label>
              <label className="voice-label">
                Typ
                <select
                  value={draft.type}
                  onChange={(e) =>
                    field("type", e.target.value as NoteDraft["type"])
                  }
                >
                  {NOTE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {labels[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="voice-label">
                Projekt
                <select
                  value={draft.project || ""}
                  onChange={(e) => field("project", e.target.value || null)}
                >
                  <option value="">Ohne Projekt</option>
                  {projects.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="voice-label">
                Termin (deine Ortszeit)
                <input
                  type="datetime-local"
                  value={draft.due ? localDate(draft.due) : ""}
                  onChange={(e) =>
                    field(
                      "due",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    )
                  }
                />
              </label>
              <label className="voice-label">
                Zuständig
                <input
                  maxLength={100}
                  placeholder="Optional"
                  value={draft.assignee || ""}
                  onChange={(e) => field("assignee", e.target.value || null)}
                />
              </label>
              <label className="voice-label voice-full">
                Tags (mit Komma trennen)
                <input
                  maxLength={1000}
                  placeholder="z. B. idee, hermes"
                  value={draft.tags.join(", ")}
                  onChange={(e) =>
                    field(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trimStart().toLowerCase()),
                    )
                  }
                />
              </label>
            </fieldset>
            <details className="voice-project">
              <summary>Eigenes Projekt hinzufügen</summary>
              <div>
                <input
                  aria-label="Neuer Projektname"
                  placeholder="Projektname"
                  maxLength={100}
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                />
                <button
                  className="voice-secondary"
                  disabled={!!busy || !config?.canSave || !newProject.trim()}
                  onClick={() =>
                    action("Projekt", async () => {
                      const p = await api("/api/notes/projects", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newProject }),
                      });
                      field("project", p.name);
                      setNewProject("");
                      await refresh();
                    })
                  }
                >
                  <Plus size={16} />
                  Hinzufügen
                </button>
              </div>
              <p className="voice-muted">
                Übernimm bei Bedarf den Namen eines deiner bisherigen
                Projektboards. Es werden keine fremden oder gemeinsamen Projekte
                automatisch zugeordnet.
              </p>
            </details>
            {draft.tags.some((t) => t.trim() === "hermes") && (
              <p className="voice-notice">
                Diese Notiz wird zum Hermes-Auftrag. Vor der Freigabe passiert
                nichts. Prüfe den vollständigen Wortlaut in der Warteschlange.
              </p>
            )}
            <div className="voice-save">
              <span>
                {config?.canSave
                  ? "Nur für dich gespeichert"
                  : "Entwurf bleibt nur in diesem Tab"}
              </span>
              <button
                className="voice-primary"
                disabled={
                  !!busy ||
                  active ||
                  !config?.canSave ||
                  !draft.title.trim() ||
                  !draft.transcript.trim()
                }
                onClick={save}
              >
                <Check size={17} />
                Notiz speichern
              </button>
            </div>
            <p role="status" className="voice-status">
              {busy ? `${busy} …` : message}
            </p>
            {error && (
              <div role="alert" className="voice-error">{error}<button className="voice-secondary" onClick={()=>void action("Laden",async()=>{await refresh();await loadNotes();})}>Erneut versuchen</button></div>
            )}
            <details className="voice-privacy">
              <summary>Was mit deinen Worten passiert</summary>
              <p>
                Die Aufnahme bleibt zunächst in diesem Tab. Beim Umwandeln
                verarbeitet{" "}
                {(config?.provider ?? initialProvider) === "infomaniak"
                  ? "Infomaniak, Schweiz,"
                  : (config?.provider ?? initialProvider) === "openai"
                    ? "OpenAI" : "der konfigurierte Transkriptionsanbieter"} das Audio;
                Anthropic erhält beim Einordnen den Text und deine Projektnamen.
                Ohne „Aufnahme behalten“ wird das Audio nach erfolgreicher
                Umwandlung verworfen. Mit Häkchen und Speichern liegt es privat
                in Supabase. Text und Audio werden nicht in App-Logs oder
                Offline-Caches gespeichert. Ein Hermes-Auftrag übergibt nach
                deiner Freigabe seinen Wortlaut an Hermes.
              </p>
            </details>
            {config && (
              <p className="voice-muted">
                Dieser Monat: {Math.ceil(config.usage.voice_seconds / 60)} /{" "}
                {config.limits.minutes} Minuten · {config.usage.requests} /{" "}
                {config.limits.requests} KI-Anfragen
              </p>
            )}
          </section>
          <aside className="voice-library" aria-busy={notesLoading || !loaded}>
            <div className="voice-tabs">
              <button
                className={tab === "notes" ? "selected" : ""}
                aria-pressed={tab === "notes"}
                onClick={() => setTab("notes")}
              >
                Meine Notizen
              </button>
              <button
                className={tab === "queue" ? "selected" : ""}
                aria-pressed={tab === "queue"}
                onClick={() => setTab("queue")}
              >
                Hermes{" "}
                <span>
                  {
                    queue.filter((h) => h.status === "wartet_auf_bestaetigung")
                      .length
                  }
                </span>
              </button>
              <button
                title="Aktualisieren"
                aria-label="Notizen und Hermes aktualisieren"
                onClick={() =>
                  action("Aktualisierung", async () => {
                    await refresh();
                    await loadNotes();
                  })
                }
                disabled={!config || !!busy}
              >
                ↻
              </button>
            </div>
            {tab === "notes" ? (
              <>
                <div className="voice-search">
                  <Search size={17} />
                  <input
                    aria-label="Notizen durchsuchen"
                    placeholder="In deinen Worten suchen …"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="voice-filters">
                  <select
                    aria-label="Nach Typ filtern"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Alle Typen</option>
                    {NOTE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {labels[t]}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Nach Projekt filtern"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                  >
                    <option value="">Alle Projekte</option>
                    {projects.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    aria-label="Nach Tag filtern"
                    placeholder="Tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>
                {(notesLoading || !loaded)&&<LoadingState label="Notizen werden geladen …"/>}
                {notesError && <ErrorState message={notesError.message} retry={() => void loadNotes(notesError.before)}/>}
                {!notesLoading && !notesError && (notesLoaded || (loaded && !config)) && notes.length === 0 && (
                  <div className="voice-empty">
                    <Headphones size={32} />
                    {!config ? <>
                      <h2>Deine Notizen warten auf dich.</h2>
                      <p>Nach der Anmeldung findest du hier deine gespeicherten Notizen.</p>
                      <Link className="voice-secondary" href="/login?next=/notiz">Anmelden</Link>
                    </> : filtered ? <>
                      <h2>{initialNote ? "Diese Notiz ist nicht verfügbar." : "Keine passenden Notizen."}</h2>
                      <p>Zeige alle Notizen an oder ändere deine Suche und Filter.</p>
                      <button className="voice-secondary" onClick={clearFilters}>Alle Notizen anzeigen</button>
                    </> : <>
                      <h2>Platz für deine Gedanken.</h2>
                      <p>Deine gespeicherten Notizen erscheinen hier.</p>
                      <a className="voice-secondary" href="#note-composer">Gedanken festhalten</a>
                    </>}
                  </div>
                )}
                {notes.map((n) => (
                  <article className="voice-note" id={`note-${n.id}`} key={n.id}>
                    <div className="voice-note-meta">
                      <span>{labels[n.type]}</span>
                      <time>
                        {new Date(n.created_at).toLocaleDateString("de")}
                      </time>
                    </div>
                    <h2>{n.title}</h2>
                    <p>{n.summary}</p>
                    <details>
                      <summary>Wortlaut</summary>
                      <p className="voice-transcript">{n.transcript}</p>
                    </details>
                    <div className="voice-tags">
                      {n.project && <span>{n.project}</span>}
                      {n.tags.map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                    {n.due && (
                      <p className="voice-muted">
                        Termin: {new Date(n.due).toLocaleString("de")}
                      </p>
                    )}
                    {n.assignee && (
                      <p className="voice-muted">Zuständig: {n.assignee}</p>
                    )}
                    {n.audio_path &&
                      (playId === n.id ? (
                        <audio
                          controls
                          autoPlay
                          src={`/api/notes/${n.id}/audio`}
                        />
                      ) : (
                        <button
                          className="voice-text-button"
                          onClick={() => setPlayId(n.id)}
                        >
                          Aufnahme anhören
                        </button>
                      ))}
                  </article>
                ))}
                {hasMore && !notesError && (
                  <button
                    className="voice-secondary"
                    disabled={notesLoading}
                    onClick={() => void loadNotes(notes.at(-1)?.created_at)}
                  >
                    Weitere laden
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="voice-muted">
                  Nur freigegebene Aufträge kann Hermes abholen. Mail, Kauf,
                  Veröffentlichung oder Löschung erfolgen ausschließlich nach
                  deiner Entscheidung.
                </p>
                {queue.length === 0 && (
                  <div className="voice-empty">
                    <h2>Noch kein Auftrag.</h2>
                    <p>Markiere eine Notiz mit dem Tag „hermes“.</p>
                  </div>
                )}
                {queue.map((h) => (
                  <article className="voice-note" key={h.note_id}>
                    <span className="voice-queue-status">
                      {h.status.replaceAll("_", " ")}
                    </span>
                    <p className="voice-transcript">{h.instruction}</p>
                    {h.result && <p>Ergebnis: {h.result}</p>}
                    {h.status === "wartet_auf_bestaetigung" && (
                      <div className="voice-decisions">
                        {confirm === h.note_id ? (
                          <>
                            <p>
                              Hermes darf diesen vollständigen Auftrag
                              ausführen. Prüfe Empfänger, Inhalt und mögliche
                              Kosten.
                            </p>
                            <button
                              className="voice-primary"
                              disabled={!!busy || !config?.canSave}
                              onClick={() => decide(h.note_id, "freigegeben")}
                            >
                              Jetzt verbindlich freigeben
                            </button>
                            <button
                              className="voice-secondary"
                              onClick={() => setConfirm(null)}
                            >
                              Zurück
                            </button>
                          </>
                        ) : (
                          <button
                            className="voice-primary"
                            disabled={!!busy || !config?.canSave}
                            onClick={() => setConfirm(h.note_id)}
                          >
                            Freigeben
                          </button>
                        )}
                        <button
                          className="voice-secondary"
                          disabled={!!busy || !config?.canSave}
                          onClick={() => decide(h.note_id, "abgelehnt")}
                        >
                          Ablehnen
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
function localDate(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
