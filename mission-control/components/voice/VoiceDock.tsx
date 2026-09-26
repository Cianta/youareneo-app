"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { insertTranscript } from "@/lib/voice/text";
import {
  Mic,
  Square,
  X,
  ArrowRight,
  Settings2,
  Brain,
  MessageCircle,
} from "lucide-react";
import {
  useVoicePreferences,
  useVoiceRuntime,
  matches,
  shortcutLabel,
} from "@/lib/voice/preferences";
import { usePersonal } from "@/lib/workspace/personal";
import { useFloatingAgentStore } from "@/lib/store";
type Field = HTMLInputElement | HTMLTextAreaElement;
function editable(el: Element | null): el is Field {
  return (
    (el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLInputElement &&
        ["text", "search", "url", "email", "tel", ""].includes(el.type))) &&
    !el.disabled &&
    !el.readOnly &&
    !el.closest("[data-voice-settings]")
  );
}
export function VoiceDock() {
  const prefs = useVoicePreferences();
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(""),
    [phase, setPhase] = useState("idle"),
    [message, setMessage] = useState("");
  const scratch = useRef<HTMLTextAreaElement>(null),
    lastField = useRef<Field | null>(null),
    current = useRef<any>(null),
    state = useRef("idle"),
    stopRef = useRef<(discard?: boolean) => void>(() => {}),
    startRef = useRef<(target?: Field | null) => void>(() => {}),
    nextRef = useRef<() => void>(() => {}),
    nextPending = useRef(false);
  const changePhase = (value: string) => {
    state.current = value;
    setPhase(value);
    useVoiceRuntime.getState().setPhase(value);
  };
  useEffect(() => {
    let mounted = true;
    const focus = (e: FocusEvent) => {
      if (editable(e.target as Element)) lastField.current = e.target as Field;
    };
    const insert = (
      text: string,
      target: Field | null,
      selection: { start: number; end: number; value: string },
    ) => {
      if (!mounted || !text.trim()) return;
      if (target?.isConnected && editable(target)) {
        const { value, cursor } = insertTranscript(
          target.value,
          selection.value,
          selection.start,
          selection.end,
          text,
        );
        const proto =
          target instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(
          target,
          value,
        );
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.focus();
        try {
          target.setSelectionRange(cursor, cursor);
        } catch {
          /* Email fields do not support selection. */
        }
        setMessage("Text eingefügt.");
      } else {
        setDraft((v) => v + (v ? " " : "") + text.trim());
        setOpen(true);
        setMessage("Dein Text ist hier bereit.");
      }
    };
    const advance = () => {
      const root =
        lastField.current?.closest("dialog[open]") ??
        document.querySelector("dialog[open]") ??
        document;
      const fields = Array.from(root.querySelectorAll("input,textarea")).filter(
        (el): el is Field =>
          editable(el) &&
          el.getClientRects().length > 0 &&
          !el.closest("[data-voice-dock]"),
      );
      const i = fields.indexOf(lastField.current!);
      const target = fields[i + 1];
      if (target) {
        target.focus();
        target.scrollIntoView({ block: "nearest", behavior: "smooth" });
        lastField.current = target;
        setMessage("Nächstes Feld bereit.");
      } else setMessage("Du bist beim letzten Textfeld.");
    };
    nextRef.current = () => {
      if (state.current !== "idle") {
        nextPending.current = true;
        stopRef.current();
      } else advance();
    };
    const finish = () => {
      if (!mounted) return;
      clearTimeout(current.current?.timer);
      current.current = null;
      changePhase("idle");
      if (nextPending.current) {
        nextPending.current = false;
        advance();
      }
    };
    const stop = (discard = false) => {
      const run = current.current;
      if (!run) return;
      run.cancelled = discard;
      clearTimeout(run.timer);
      if (run.recorder?.state === "recording") run.recorder.stop();
      if (run.recognition) {
        discard ? run.recognition.abort() : run.recognition.stop();
      }
      if (run.stream)
        run.stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      if (discard) {
        run.abort?.abort();
        setMessage("Aufnahme verworfen.");
        nextPending.current = false;
        finish();
      } else if (run.pending) {
        run.stopRequested = true;
      } else changePhase("transcribing");
    };
    stopRef.current = stop;
    const start = async (target?: Field | null) => {
      const s = useVoicePreferences.getState();
      if (!s.enabled) {
        setOpen(true);
        setMessage("Aktiviere die Spracheingabe in den Einstellungen.");
        return;
      }
      if (state.current !== "idle") return;
      const field =
        target ??
        (editable(document.activeElement)
          ? document.activeElement
          : lastField.current);
      if (field) lastField.current = field;
      const selection = {
        start: field?.selectionStart ?? field?.value.length ?? 0,
        end: field?.selectionEnd ?? field?.value.length ?? 0,
        value: field?.value ?? "",
      };
      const run: any = {
        cancelled: false,
        pending: true,
        stopRequested: false,
        abort: new AbortController(),
      };
      current.current = run;
      changePhase("starting");
      setMessage("Mikrofon wird vorbereitet …");
      const deliver = (text: string) => {
        if (!run.cancelled) insert(text, field, selection);
      };
      try {
        if (s.provider === "browser") {
          const w = window as any,
            SR = w.SpeechRecognition || w.webkitSpeechRecognition;
          if (!SR)
            throw new Error(
              "Dieser Browser unterstützt keine Spracherkennung. Verbinde OpenAI oder Groq in den Einstellungen.",
            );
          const recognition = new SR();
          run.recognition = recognition;
          run.text = "";
          recognition.lang = s.language;
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.onresult = (e: any) => {
            for (let i = e.resultIndex; i < e.results.length; i++)
              if (e.results[i].isFinal)
                run.text += (run.text ? " " : "") + e.results[i][0].transcript;
          };
          recognition.onerror = (e: any) => {
            run.error = true;
            if (!run.cancelled)
              setMessage(
                e.error === "not-allowed"
                  ? "Mikrofonzugriff verweigert. Bitte die Browserberechtigung prüfen."
                  : e.error === "no-speech"
                    ? "Keine Sprache erkannt. Bitte erneut versuchen."
                    : "Spracherkennung nicht verfügbar. Prüfe Mikrofon oder Sprach-Anbieter.",
              );
          };
          recognition.onend = () => {
            if (run.cancelled) return;
            deliver(run.text);
            if (!run.text && !run.error)
              setMessage("Keine Sprache erkannt. Bitte erneut versuchen.");
            finish();
          };
          recognition.start();
          run.pending = false;
        } else {
          if (
            !navigator.mediaDevices?.getUserMedia ||
            typeof MediaRecorder === "undefined"
          )
            throw new Error(
              "Audioaufnahme ist in diesem Browser nicht verfügbar.",
            );
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          run.stream = stream;
          if (run.cancelled || run.stopRequested) {
            stream.getTracks().forEach((t) => t.stop());
            if (!run.cancelled) finish();
            return;
          }
          const mime = [
            "audio/webm;codecs=opus",
            "audio/mp4",
            "audio/webm",
          ].find((t) => MediaRecorder.isTypeSupported(t));
          const recorder = new MediaRecorder(
            stream,
            mime ? { mimeType: mime } : undefined,
          );
          run.recorder = recorder;
          const chunks: BlobPart[] = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size) chunks.push(e.data);
          };
          recorder.onerror = () => {
            setMessage("Die Aufnahme ist fehlgeschlagen.");
            stop(true);
          };
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            if (run.cancelled) return;
            changePhase("transcribing");
            setMessage("Trinity schreibt mit …");
            try {
              const blob = new Blob(chunks, { type: recorder.mimeType });
              if (blob.size < 100) throw new Error("Die Aufnahme war zu kurz.");
              if (blob.size > 8 * 1024 * 1024)
                throw new Error(
                  "Die Aufnahme ist zu groß. Bitte kürzer aufnehmen.",
                );
              const body = new FormData();
              body.set(
                "file",
                blob,
                recorder.mimeType.includes("mp4")
                  ? "speech.mp4"
                  : "speech.webm",
              );
              body.set("provider", s.provider);
              body.set("language", s.language);
              const response = await fetch("/api/voice/transcribe", {
                method: "POST",
                body,
                signal: run.abort.signal,
              });
              const data = await response.json();
              if (!response.ok)
                throw new Error(data.error || "Transkription fehlgeschlagen.");
              if (!run.cancelled) {
                deliver(data.text);
                if (!data.text?.trim()) setMessage("Keine Sprache erkannt.");
              }
            } catch (e) {
              if (!run.cancelled)
                setMessage(
                  e instanceof Error
                    ? e.message
                    : "Übertragung fehlgeschlagen.",
                );
            } finally {
              if (!run.cancelled) finish();
            }
          };
          recorder.start(1000);
          run.pending = false;
        }
        if (run.cancelled) return;
        changePhase("recording");
        setMessage("Ich höre zu …");
        run.timer = setTimeout(() => stop(), 120000);
        if (run.stopRequested) stop();
      } catch (e) {
        if (!run.cancelled) {
          setMessage(
            e instanceof Error ? e.message : "Mikrofon nicht verfügbar.",
          );
          run.stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          finish();
        }
      }
    };
    startRef.current = start;
    const command = (e: Event) => {
      const target = (e as CustomEvent).detail?.target;
      if (state.current === "idle") void start(target);
      else if (state.current !== "transcribing") stop();
    };
    const keydown = (e: KeyboardEvent) => {
      if ((e.target as Element)?.closest("[data-voice-settings]")) return;
      const s = useVoicePreferences.getState();
      if (!s.enabled) return;
      if (e.code === "Escape" && state.current !== "idle") {
        e.preventDefault();
        stop(true);
        return;
      }
      if (matches(e, s.record)) {
        e.preventDefault();
        if (e.repeat) return;
        if (state.current === "idle") void start();
        else if (s.mode === "toggle" && state.current !== "transcribing")
          stop();
      } else if (matches(e, s.next)) {
        e.preventDefault();
        if (!e.repeat) nextRef.current();
      }
    };
    const keyup = (e: KeyboardEvent) => {
      const s = useVoicePreferences.getState();
      if (
        s.mode === "hold" &&
        e.code === s.record.code &&
        ["recording", "starting"].includes(state.current)
      ) {
        e.preventDefault();
        stop();
      }
    };
    const blur = () => {
      if (["recording", "starting"].includes(state.current)) stop();
    };
    document.addEventListener("focusin", focus);
    window.addEventListener("trinity:dictate", command);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      mounted = false;
      stop(true);
      document.removeEventListener("focusin", focus);
      window.removeEventListener("trinity:dictate", command);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
    };
  }, []);
  useEffect(() => {
    if (!prefs.enabled && state.current !== "idle") stopRef.current(true);
  }, [prefs.enabled]);
  const save = () => {
    const s = usePersonal.getState();
    s.set({
      notes: [
        ...s.notes,
        {
          id: crypto.randomUUID(),
          title: draft.trim().split("\n")[0].slice(0, 70),
          body: draft.trim(),
          area: "Leben",
          links: [],
          workspace: s.workspace,
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    setDraft("");
    setMessage("In deinem Second Brain gespeichert.");
  };
  const chat = () => {
    const store = useFloatingAgentStore.getState();
    store.setInput(draft);
    if (!store.isOpen) store.toggle();
    setDraft("");
    setOpen(false);
  };
  return (
    <div className="v-dock" data-voice-dock>
      {open && (
        <section className="v-panel">
          <div className="w-section-head">
            <div>
              <span className="w-eyebrow">TRINITY HÄLT ES FEST</span>
              <h3>Ein Gedanke darf reichen.</h3>
            </div>
            <button
              className="w-icon"
              aria-label="Gedankenfeld schließen"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <textarea
            ref={scratch}
            className="w-input"
            aria-label="Dein Gedanke"
            rows={4}
            placeholder="Schreiben oder aussprechen …"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="s-actions">
            <button className="w-btn" disabled={!draft.trim()} onClick={save}>
              <Brain size={14} /> Behalten
            </button>
            <button className="w-btn" disabled={!draft.trim()} onClick={chat}>
              <MessageCircle size={14} /> Im Chat weiter
            </button>
            <button
              className="w-icon"
              aria-label="In Gedankenfeld diktieren"
              disabled={phase === "transcribing"}
              onClick={() =>
                phase === "idle"
                  ? startRef.current(scratch.current)
                  : stopRef.current()
              }
            >
              <Mic size={16} />
            </button>
          </div>
          <Link href="/dashboard/settings#sprache" className="v-settings-link">
            <Settings2 size={13} /> Stimme & Tasten einstellen
          </Link>
        </section>
      )}
      <div className={`v-pill ${phase === "recording" ? "is-recording" : ""}`}>
        <button
          aria-label={
            phase === "idle" ? "Spracheingabe starten" : "Aufnahme stoppen"
          }
          disabled={phase === "transcribing"}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() =>
            phase === "idle" ? startRef.current() : stopRef.current()
          }
        >
          {phase === "recording" || phase === "starting" ? (
            <Square size={15} />
          ) : (
            <Mic size={16} />
          )}
        </button>
        <button className="v-label" onClick={() => setOpen(!open)}>
          {phase === "recording"
            ? "Ich höre zu …"
            : phase === "transcribing"
              ? "Wird geschrieben …"
              : "Gedanken festhalten"}
          <small>
            {prefs.enabled ? shortcutLabel(prefs.record) : "Sprache einrichten"}
          </small>
        </button>
        {phase !== "idle" && (
          <button
            aria-label="Aufnahme verwerfen"
            onClick={() => stopRef.current(true)}
          >
            <X size={14} />
          </button>
        )}
        <button
          aria-label="Zum nächsten Textfeld"
          title={shortcutLabel(prefs.next)}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => nextRef.current()}
        >
          <ArrowRight size={15} />
        </button>
      </div>
      {message && (
        <div className="v-feedback" role="status">
          {message}
          <button aria-label="Hinweis schließen" onClick={() => setMessage("")}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
