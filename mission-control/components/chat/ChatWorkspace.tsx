"use client";
import { AssistantAvatar } from "@/components/chat/AssistantAvatar";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useBrand } from "@/components/voice/BrandProvider";
import { type ChatMessage, speechChunks } from "@/lib/chat/contracts";
import { readChat } from "@/lib/chat/client";
import type { SpeechVoice } from "@/lib/chat/speech";
import { observePlayback } from "@/lib/chat/playback-meter";
import { useChatMicrophone } from "./useChatMicrophone";
import "./chat.css";
type Turn = ChatMessage & {
  id: string;
  complete: boolean;
  sources?: { id: string; title: string }[];
};
export default function ChatWorkspace({
  providerLabel,
}: {
  providerLabel: string;
}) {
  const { assistantName } = useBrand();
  const [turns, setTurns] = useState<Turn[]>([]),
    [text, setText] = useState(""),
    [includeNotes, setIncludeNotes] = useState(false),
    [handsFree, setHandsFree] = useState(false),
    [status, setStatus] = useState("Bereit"),
    [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false),
    [canSave, setCanSave] = useState(false),
    [transcriptionReady, setTranscriptionReady] = useState(false),
    [chatReady, setChatReady] = useState(false);
  const [provider, setProvider] = useState<"vocallab" | "browser" | "off">(
      "browser",
    ),
    [vocalReady, setVocalReady] = useState(false),
    [voices, setVoices] = useState<SpeechVoice[]>([]),
    [voice, setVoice] = useState(""),
    [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]),
    [browserVoice, setBrowserVoice] = useState("");
  const [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false),
    [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false),
    [outputLevel, setOutputLevel] = useState(0);
  const session = useRef(0),
    controller = useRef<AbortController | null>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    objectURL = useRef(""),
    stopPlayback = useRef<(() => void) | null>(null),
    turnRef = useRef(turns),
    mounted = useRef(true),
    saveId = useRef<string | null>(null),
    bottom = useRef<HTMLDivElement>(null);
  turnRef.current = turns;
  const interrupt = useCallback(() => {
    session.current++;
    controller.current?.abort();
    controller.current = null;
    stopPlayback.current?.();
    stopPlayback.current = null;
    if (audio.current) {
      audio.current.pause();
      audio.current.src = "";
      audio.current = null;
    }
    if (objectURL.current) {
      URL.revokeObjectURL(objectURL.current);
      objectURL.current = "";
    }
    window.speechSynthesis?.cancel();
    if (mounted.current) {
      setBusy(false);
      setPlaying(false);
      setOutputLevel(0);
      setStatus("Bereit");
    }
  }, []);
  const audioTurn = useRef<(blob: Blob) => void>(() => {});
  const mic = useChatMicrophone({
    onAudio: (blob) => audioTurn.current(blob),
    onSpeechStart: interrupt,
  });
  const settings = useRef({ provider, voice, browserVoice });
  settings.current = { provider, voice, browserVoice };
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/voice/config", { signal: abort.signal, cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw Error(
            r.status === 401
              ? "Bitte melde dich für den Sprachchat an."
              : d.error,
          );
        if (abort.signal.aborted) return;
        setAuthenticated(true);
        setCanSave(d.canSave);
        setTranscriptionReady(d.transcriptionReady);
        setChatReady(d.classificationReady);
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          setAuthenticated(false);
          setError(
            e.message || "Die Verbindung konnte nicht hergestellt werden.",
          );
        }
      });
    fetch("/api/voice/speech/voices", {
      signal: abort.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (abort.signal.aborted) return;
        setVocalReady(d.ready);
        setVoices(d.voices || []);
        const chosen =
          d.voices?.find((v: SpeechVoice) => v.id === d.selected) ||
          d.voices?.find((v: SpeechVoice) =>
            v.languages.some((l) => l.startsWith("de")),
          ) ||
          d.voices?.[0];
        setVoice(chosen?.id || "");
        if (d.ready && chosen) setProvider("vocallab");
        else
          setNotice(
            "VocalLab ist noch nicht eingerichtet. Die Browser-Stimme steht als Rückfall bereit.",
          );
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setNotice(
            "VocalLab ist momentan nicht verfügbar. Die Browser-Stimme bleibt auswählbar.",
          );
      });
    return () => abort.abort();
  }, [retry]);
  useEffect(() => {
    const update = () => {
      const list = window.speechSynthesis?.getVoices() || [];
      setBrowserVoices(list);
      setBrowserVoice(
        (old) =>
          old ||
          list.find((v) => v.lang.startsWith("de"))?.voiceURI ||
          list[0]?.voiceURI ||
          "",
      );
    };
    update();
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", update);
  }, []);
  useEffect(() => {
    mounted.current = true;
    const hidden = () => {
      if (document.hidden) interrupt();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      mounted.current = false;
      interrupt();
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [interrupt]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [turns.length]);
  async function playText(answer: string, token: number, signal: AbortSignal) {
    const pref = settings.current;
    if (pref.provider === "off") return;
    const playback = (active: boolean) => {
      if (mounted.current && token === session.current) {
        setPlaying(active);
        setOutputLevel(0);
        setStatus(active ? "Spricht" : "Denkt");
      }
    };
    for (const chunk of speechChunks(answer)) {
      if (signal.aborted || token !== session.current) return;
      if (pref.provider === "browser") {
        if (!window.speechSynthesis)
          throw Error(
            "Dein Browser hat keine Sprachausgabe. Die Antwort steht als Text bereit.",
          );
        await new Promise<void>((resolve, reject) => {
          const speech = new SpeechSynthesisUtterance(chunk);
          speech.lang = "de-DE";
          speech.voice =
            window.speechSynthesis
              .getVoices()
              .find((v) => v.voiceURI === pref.browserVoice) || null;
          speech.onstart = () => playback(true);
          speech.onend = () => {
            playback(false);
            resolve();
          };
          speech.onerror = (e) => {
            playback(false);
            if (
              signal.aborted ||
              e.error === "canceled" ||
              e.error === "interrupted"
            )
              resolve();
            else
              reject(
                Error(
                  "Die Browser-Stimme konnte nicht starten. Nutze „Antwort vorlesen“.",
                ),
              );
          };
          stopPlayback.current = () => {
            speech.onstart = null;
            speech.onend = null;
            speech.onerror = null;
            window.speechSynthesis.cancel();
            resolve();
          };
          window.speechSynthesis.speak(speech);
        });
      } else {
        const r = await fetch("/api/voice/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk, voice: pref.voice }),
          signal,
        });
        if (!r.ok) {
          const d = await r.json();
          throw Error(d.error || "Sprachausgabe nicht verfügbar.");
        }
        const blob = await r.blob();
        if (signal.aborted || token !== session.current) return;
        const url = URL.createObjectURL(blob);
        objectURL.current = url;
        const player = new Audio(url);
        audio.current = player;
        let stopMeter: (() => void) | undefined;
        player.onplaying = () => {
          if (signal.aborted || token !== session.current) return;
          playback(true);
          stopMeter ??= observePlayback(player, (level) => {
            if (mounted.current && token === session.current)
              setOutputLevel(level);
          });
        };
        player.onwaiting = () => playback(false);
        try {
          await new Promise<void>((resolve, reject) => {
            player.onended = () => resolve();
            player.onerror = () =>
              reject(Error("Audio konnte nicht abgespielt werden."));
            stopPlayback.current = () => {
              player.pause();
              stopMeter?.();
              resolve();
            };
            void player
              .play()
              .catch(() =>
                reject(
                  Error(
                    "Bitte tippe auf „Antwort vorlesen“, damit dein Browser Audio abspielt.",
                  ),
                ),
              );
          });
        } finally {
          player.onplaying = null;
          player.onwaiting = null;
          player.onended = null;
          player.onerror = null;
          player.pause();
          stopMeter?.();
          playback(false);
          player.src = "";
          URL.revokeObjectURL(url);
          if (objectURL.current === url) objectURL.current = "";
          if (audio.current === player) audio.current = null;
        }
      }
      stopPlayback.current = null;
    }
  }
  async function send(content: string) {
    if (!content.trim() || !authenticated || !chatReady) return;
    interrupt();
    const token = session.current,
      abort = new AbortController();
    controller.current = abort;
    setError("");
    setBusy(true);
    setStatus("Denkt");
    saveId.current = null;
    const history = turnRef.current.filter((t) => t.complete);
    // Keep only complete user/assistant pairs, then the new user turn.
    const pairs: ChatMessage[] = [];
    for (let i = 0; i < history.length - 1; i++)
      if (history[i].role === "user" && history[i + 1].role === "assistant") {
        pairs.push(
          { role: "user", content: history[i].content },
          { role: "assistant", content: history[i + 1].content },
        );
        i++;
      }
    let messages = [
      ...pairs.slice(-10),
      { role: "user" as const, content: content.trim() },
    ];
    while (
      messages.reduce((n, m) => n + m.content.length, 0) > 18000 &&
      messages.length > 1
    )
      messages = messages.slice(2);
    const uid = crypto.randomUUID(),
      aid = crypto.randomUUID();
    let answer = "";
    setTurns((old) => [
      ...old,
      { id: uid, role: "user", content: content.trim(), complete: true },
      { id: aid, role: "assistant", content: "", complete: false },
    ]);
    setText("");
    try {
      const response = await fetch("/api/voice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, includeNotes }),
        signal: abort.signal,
      });
      if (response.status === 401 || response.status === 429) mic.cancel();
      await readChat(
        response,
        (event) => {
          if (token !== session.current) return;
          if (event.type === "text") {
            answer += event.text;
            setTurns((old) =>
              old.map((t) => (t.id === aid ? { ...t, content: answer } : t)),
            );
          }
          if (event.type === "sources")
            setTurns((old) =>
              old.map((t) =>
                t.id === aid ? { ...t, sources: event.notes } : t,
              ),
            );
          if (event.type === "done")
            setTurns((old) =>
              old.map((t) => (t.id === aid ? { ...t, complete: true } : t)),
            );
        },
        abort.signal,
      );
      if (token === session.current)
        await playText(answer, token, abort.signal);
    } catch (e) {
      if (!abort.signal.aborted && token === session.current)
        setError(e instanceof Error ? e.message : "Antwort nicht verfügbar.");
    } finally {
      if (token === session.current) {
        setBusy(false);
        setStatus("Bereit");
      }
    }
  }
  audioTurn.current = (blob) => {
    void (async () => {
      interrupt();
      const token = session.current,
        abort = new AbortController();
      controller.current = abort;
      setBusy(true);
      setStatus("Wandelt Sprache um");
      setError("");
      try {
        const form = new FormData();
        form.set(
          "audio",
          blob,
          blob.type.includes("mp4") ? "chat.mp4" : "chat.webm",
        );
        form.set("language", "auto");
        const r = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: form,
            signal: abort.signal,
          }),
          d = await r.json();
        if (!r.ok) {
          if (r.status === 401 || r.status === 429) mic.cancel();
          throw Error(d.error);
        }
        if (token !== session.current) return;
        await send(d.transcript);
      } catch (e) {
        if (!abort.signal.aborted && token === session.current)
          setError(
            e instanceof Error ? e.message : "Umwandlung fehlgeschlagen.",
          );
      } finally {
        if (token === session.current) {
          setBusy(false);
          setStatus("Bereit");
        }
      }
    })();
  };
  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      const transcript = turnRef.current
        .filter((t) => t.complete)
        .map(
          (t) => (t.role === "user" ? "Ich" : assistantName) + ": " + t.content,
        )
        .join("\n\n");
      if (!transcript || transcript.length > 20000)
        throw Error(
          "Zum Speichern ist das Gespräch zu lang. Bitte übernimm einen Ausschnitt in eine Notiz.",
        );
      saveId.current ||= crypto.randomUUID();
      const form = new FormData();
      form.set("id", saveId.current);
      form.set(
        "note",
        JSON.stringify({
          title: "Gespräch vom " + new Date().toLocaleDateString("de-DE"),
          transcript,
          summary: "",
          type: "notiz",
          project: null,
          tags: [],
          due: null,
          assignee: null,
          source: "text",
        }),
      );
      const r = await fetch("/api/notes", { method: "POST", body: form }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setNotice("Gespräch als eigene Notiz gespeichert.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }
  const stopAll = () => {
    mic.cancel();
    interrupt();
  };
  const lastAnswer = [...turns]
    .reverse()
    .find((t) => t.role === "assistant" && t.complete);
  return (
    <main className="chat-workspace">
      <header>
        <Link href="/dashboard">← Übersicht</Link>
        <h1>Mit {assistantName} sprechen</h1>
        <button
          className="workspace-button"
          onClick={() => window.dispatchEvent(new Event("neo-open-search"))}
        >
          Suchen · ⌘K
        </button>
        <AssistantAvatar
          state={
            mic.state === "recording"
              ? "listening"
              : playing
                ? "speaking"
                : busy
                  ? "thinking"
                  : mic.state === "listening"
                    ? "listening"
                    : "idle"
          }
          level={
            mic.state === "recording" ||
            (!busy && !playing && mic.state === "listening")
              ? mic.level
              : outputLevel
          }
        />
      </header>
      <p className="workspace-muted">
        Audio: {providerLabel}. Gespräch und optional ausgewählte eigene
        Notizen: Anthropic. Sprachausgabe: VocalLab oder die Stimme deines
        Browsers. Browser-Stimmen können je nach Gerät einen Dienst des
        Betriebssystems nutzen. Aufnahmen und Gespräch bleiben hier flüchtig;
        dauerhaft gespeichert wird nur auf deinen Klick.
      </p>
      {!authenticated && (
        <p>
          <Link href="/login">Zum Login</Link> · Ein NEO-Konto ist für
          KI-Anfragen erforderlich.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>
            Verbindung prüfen
          </button>
        </p>
      )}
      <div className="chat-settings">
        <label>
          <input
            type="checkbox"
            checked={includeNotes}
            onChange={(e) => setIncludeNotes(e.target.checked)}
          />
          Passende eigene Notizen als Kontext verwenden
        </label>
        <label>
          Sprachausgabe
          <select
            value={provider}
            onChange={(e) => {
              interrupt();
              setProvider(e.target.value as typeof provider);
            }}
          >
            <option value="vocallab" disabled={!vocalReady}>
              VocalLab{!vocalReady ? " (noch nicht bereit)" : ""}
            </option>
            <option value="browser">Browser-Stimme</option>
            <option value="off">Nur Text</option>
          </select>
        </label>
        {provider === "vocallab" ? (
          <label>
            Stimme
            <select
              value={voice}
              onChange={(e) => {
                interrupt();
                setVoice(e.target.value);
              }}
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.languages.join(", ")})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                void fetch("/api/voice/speech/preferences", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ voice }),
                })
                  .then(async (r) => {
                    if (!r.ok)
                      throw Error(
                        "Die Stimme konnte nicht gespeichert werden.",
                      );
                    setNotice("Stimme für dein Konto gespeichert.");
                  })
                  .catch((e) => setError(e.message));
              }}
            >
              Stimme merken
            </button>
          </label>
        ) : provider === "browser" ? (
          <label>
            Browser-Stimme
            <select
              value={browserVoice}
              onChange={(e) => {
                interrupt();
                setBrowserVoice(e.target.value);
              }}
            >
              <option value="">Standard</option>
              {browserVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <section className="chat-mic" aria-label="Spracheingabe">
        <label>
          <input
            type="checkbox"
            checked={handsFree}
            onChange={(e) => {
              stopAll();
              setHandsFree(e.target.checked);
            }}
          />
          Freihändig mit Stille-Erkennung
        </label>
        {handsFree ? (
          <button
            className="chat-record"
            disabled={!authenticated || !transcriptionReady || !chatReady}
            onClick={() =>
              mic.state === "idle" ? void mic.start(true) : stopAll()
            }
          >
            {mic.state === "idle"
              ? "Freihändig starten"
              : "Mikrofon ausschalten"}
          </button>
        ) : (
          <button
            className="chat-record"
            style={{ touchAction: "none" }}
            disabled={!authenticated || !transcriptionReady || !chatReady}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              void mic.start(false);
            }}
            onPointerUp={() => mic.finish()}
            onPointerCancel={() => mic.cancel()}
            onKeyDown={(e) => {
              if ([" ", "Enter"].includes(e.key) && !e.repeat) {
                e.preventDefault();
                void mic.start(false);
              }
            }}
            onKeyUp={(e) => {
              if ([" ", "Enter"].includes(e.key)) {
                e.preventDefault();
                mic.finish();
              }
            }}
          >
            Gedrückt halten zum Sprechen
          </button>
        )}
        <meter min={0} max={1} value={mic.level} aria-label="Mikrofonpegel" />
        <p role="status">
          {mic.state === "requesting"
            ? "Mikrofon wird angefragt"
            : mic.state === "recording"
              ? "Hört zu"
              : mic.state === "listening"
                ? "Wartet auf deine Stimme"
                : status}
        </p>
        {mic.error && <p role="alert">{mic.error}</p>}
        <button className="workspace-button" onClick={stopAll}>
          Alles stoppen
        </button>
        <p className="workspace-muted">
          Loslassen sendet die Aufnahme. Freihändig endet ein Satz nach etwa
          einer Sekunde Stille. Erneutes Sprechen unterbricht die Antwort;
          Kopfhörer helfen gegen Echo. Maximal eine Minute pro Aufnahme.
        </p>
      </section>
      <section className="chat-conversation" aria-label="Gespräch">
        {!turns.length && (
          <p>
            Stelle eine Frage oder sammle deine Gedanken. {assistantName} kann
            beraten; externe Aktionen und Hermes-Freigaben erfolgen hier nicht.
          </p>
        )}
        {turns.map((t) => (
          <article key={t.id} data-role={t.role}>
            <strong>{t.role === "user" ? "Du" : assistantName}</strong>
            <p>{t.content || (t.complete ? "Keine Textantwort." : "…")}</p>
            {!t.complete && t.content && (
              <small>Antwort läuft oder wurde unterbrochen.</small>
            )}
            {!!t.sources?.length && (
              <details>
                <summary>Eigene Notizen im Kontext</summary>
                <ul>
                  {t.sources.map((n) => (
                    <li key={n.id}>
                      <Link href={"/notiz?note=" + encodeURIComponent(n.id)}>
                        {n.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        ))}
        <div ref={bottom} />
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mic.cancel();
          void send(text);
        }}
      >
        <label htmlFor="chat-text">Oder schreiben</label>
        <textarea
          id="chat-text"
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <button
          className="workspace-button"
          disabled={!authenticated || !chatReady || !text.trim()}
          type="submit"
        >
          Senden
        </button>
      </form>
      <div className="chat-actions">
        <button
          className="workspace-button"
          disabled={!lastAnswer || busy}
          onClick={() => {
            if (!lastAnswer) return;
            interrupt();
            const token = session.current,
              abort = new AbortController();
            controller.current = abort;
            setBusy(true);
            void playText(lastAnswer.content, token, abort.signal)
              .catch((e) => {
                if (!abort.signal.aborted) setError(e.message);
              })
              .finally(() => {
                if (token === session.current) {
                  setBusy(false);
                  setStatus("Bereit");
                }
              });
          }}
        >
          Antwort vorlesen
        </button>
        <button
          className="workspace-button"
          disabled={!canSave || saving || busy || !turns.length}
          onClick={() => void save()}
        >
          {saving ? "Speichert …" : "Gespräch als Notiz speichern"}
        </button>
        <button
          className="workspace-button"
          onClick={() => {
            stopAll();
            setTurns([]);
            setText("");
            saveId.current = null;
            setNotice("Neues Gespräch gestartet.");
          }}
        >
          Neues Gespräch
        </button>
      </div>
      {!canSave && (
        <p className="workspace-muted">
          Gespräch nutzen ist frei. Dauerhaft speichern erfordert einen Förder-
          oder App-Zugang.
        </p>
      )}
      <p className="workspace-muted">
        KI-Anfragen nutzen dein Monatskontingent. VocalLab-Ausgabe zählt je
        Abschnitt eine Anfrage plus ein Zeitbudget anhand der Textlänge.
        Browser-Ausgabe verursacht hier keine Serverkosten. VocalLab erzeugt
        temporäre Audiodateien; wir fordern deren Löschung nach Übernahme an.
        Bei einem Anbieterfehler kann dort eine Kopie verbleiben.
      </p>
    </main>
  );
}
