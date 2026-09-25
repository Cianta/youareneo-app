"use client";
import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Trees,
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";
import {
  useFocusStore,
  useUIExtStore,
  useGlobalAudioStore,
  POMO_DURATIONS,
} from "@/lib/store";
import { DEFAULT_WORK, DEFAULT_REST } from "@/lib/workspace/media";
import { formatCountdown } from "@/lib/workspace/time";
import { playGong } from "@/lib/gong";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
const labels = {
  focus: "Fokuszeit",
  break: "Bewusste Pause",
  "deep-recovery": "Tiefe Erholung",
};

/** Mounted once by the workspace shell. Views only control this same timer. */
export function FocusEngine() {
  const running = useFocusStore((s) => s.pomodoroRunning);
  const seconds = useFocusStore((s) => s.pomodoroSeconds);
  useEffect(() => {
    if (!running) return;
    const tick = () => useFocusStore.getState().tickPomodoro();
    tick();
    const id = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running]);
  useEffect(() => {
    if (seconds !== 0) return;
    const focus = useFocusStore.getState();
    if (focus.pomodoroSeconds !== 0) return;
    playGong();
    focus.advancePomodoro();
    useFocusStore.setState({ isOpen: true });
  }, [seconds]);
  return null;
}
export function FocusCard() {
  const f = useFocusStore();
  const progress = 1 - f.pomodoroSeconds / POMO_DURATIONS[f.pomodoroMode];
  return (
    <section className="w-card focus-card">
      <div className="w-section-head">
        <span className="w-eyebrow">DEIN RHYTHMUS</span>
        <span className="w-tag">
          {f.pomodoroMode === "focus" ? "Deep work" : "Regeneration"}
        </span>
      </div>
      <div
        className="focus-orbit"
        style={
          {
            "--progress": `${Math.max(0, Math.min(1, progress)) * 360}deg`,
          } as React.CSSProperties
        }
      >
        <div className="focus-orbit-inner">
          <span>{labels[f.pomodoroMode]}</span>
          <strong aria-label={`${f.pomodoroSeconds} Sekunden verbleibend`}>
            {formatCountdown(f.pomodoroSeconds)}
          </strong>
          <small>
            {f.pomodoroRunning
              ? "Ein Moment. Eine Sache."
              : "Raum für das Wesentliche."}
          </small>
        </div>
      </div>
      <div className="focus-actions">
        <button
          className="w-icon"
          onClick={f.resetPomodoro}
          aria-label="Fokus zurücksetzen"
        >
          <RotateCcw size={17} />
        </button>
        <button className="w-btn w-btn-primary" onClick={f.togglePomodoro}>
          {f.pomodoroRunning ? <Pause size={16} /> : <Play size={16} />}
          {f.pomodoroRunning
            ? "Pausieren"
            : f.pomodoroSeconds === POMO_DURATIONS[f.pomodoroMode]
              ? "Starten"
              : "Fortsetzen"}
        </button>
        <button
          className="w-icon"
          onClick={f.advancePomodoro}
          aria-label="Zur nächsten Phase"
        >
          <SkipForward size={17} />
        </button>
      </div>
      <button
        className="focus-sanctuary"
        onClick={() => useFocusStore.setState({ isOpen: true })}
      >
        <Trees size={16} /> Deinen Ruhepol öffnen <span>↗</span>
      </button>
    </section>
  );
}
export function FocusSpace() {
  const f = useFocusStore();
  const ui = useUIExtStore();
  const globalAudio = useGlobalAudioStore();
  const [visual, setVisual] = useState(false);
  // URL configurable without embedding a second local countdown or rewriting the remote app.
  const visualUrl =
    process.env.NEXT_PUBLIC_VISUAL_ROOM_URL ||
    "https://visual-room.youareneo.com";
  return (
    <Modal
      open={f.isOpen}
      onClose={() => {
        useFocusStore.setState({ isOpen: false });
        setVisual(false);
      }}
      title="Dein Ruhepol"
      size="xl"
      className="focus-dialog"
    >
      <div className="focus-sanctuary-scene">
        <div className="w-eyebrow">ANKOMMEN · ATMEN · WEITERWACHSEN</div>
        <h3>
          {f.pomodoroMode === "focus"
            ? "Ganz bei einer Sache."
            : "Du musst gerade nichts leisten."}
        </h3>
        <div className="focus-breath" aria-hidden="true" />
        <strong className="focus-large-time">
          {formatCountdown(f.pomodoroSeconds)}
        </strong>
        <p>
          {labels[f.pomodoroMode]} ·{" "}
          {f.pomodoroRunning ? "läuft weiter" : "bereit, wenn du es bist"}
        </p>
        <div className="focus-actions">
          <button className="w-btn w-btn-primary" onClick={f.togglePomodoro}>
            {f.pomodoroRunning ? <Pause size={16} /> : <Play size={16} />}{" "}
            {f.pomodoroRunning ? "Pausieren" : "Starten"}
          </button>
          <button className="w-btn" onClick={f.advancePomodoro}>
            <SkipForward size={16} />{" "}
            {f.pomodoroMode === "focus" ? "Zur Pause" : "Zurück in den Fokus"}
          </button>
        </div>
      </div>
      <label className="w-focus-intention">
        Worauf möchtest du dich konzentrieren?
        <input
          className="w-input"
          value={f.dailyTasks[0]}
          onChange={(e) => f.setDailyTask(0, e.target.value)}
          placeholder="Eine Sache, die dir wichtig ist …"
          maxLength={200}
        />
      </label>
      <div className="focus-sound-controls">
        <label>
          Deine Musik
          <select
            value={
              (f.pomodoroMode === "focus"
                ? ui.selectedWorkTrackId
                : ui.selectedBreakTrackId) || ""
            }
            onChange={(e) =>
              (f.pomodoroMode === "focus"
                ? ui.setSelectedWorkTrackId
                : ui.setSelectedBreakTrackId)(e.target.value || null)
            }
          >
            <option value="">
              {(
                f.pomodoroMode === "focus"
                  ? globalAudio.workSoundUrl
                  : globalAudio.breakSoundUrl
              )
                ? "Standard aus Einstellungen"
                : "Stille"}
            </option>
            {(f.pomodoroMode === "focus" ? ui.workTracks : ui.breakTracks).map(
              (t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ),
            )}
          </select>
        </label>
        <button
          className="w-icon"
          aria-label={ui.musicMuted ? "Ton einschalten" : "Ton ausschalten"}
          onClick={() => ui.setMusicMuted(!ui.musicMuted)}
        >
          {ui.musicMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <label>
          Lautstärke
          <input
            aria-label="Musiklautstärke"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ui.musicVolume}
            onChange={(e) => ui.setMusicVolume(Number(e.target.value))}
          />
        </label>
        <Link
          href="/dashboard/meditation"
          onClick={() => useFocusStore.setState({ isOpen: false })}
        >
          Musik verwalten ↗
        </Link>
      </div>
      <button className="w-btn" onClick={() => setVisual(!visual)}>
        <Trees size={17} />
        {visual ? "Visual Room schließen" : "Visual Room dazuschalten"}
      </button>
      {visual && (
        <div className="visual-room-embed">
          <p>
            Trinity behält deine Fokuszeit. Falls der Raum hier nicht angezeigt
            wird:{" "}
            <a href={visualUrl} target="_blank" rel="noopener noreferrer">
              Separat öffnen <ExternalLink size={12} />
            </a>
          </p>
          <iframe
            title="Visual Room · Meditation"
            src={visualUrl}
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}
    </Modal>
  );
}
/** Single player for the existing uploaded focus/break library. Never remount audio between routes. */
export function FocusAudio() {
  const audio = useRef<HTMLAudioElement>(null);
  const { pomodoroMode, pomodoroRunning } = useFocusStore();
  const ui = useUIExtStore();
  const globalAudio = useGlobalAudioStore();
  const [error, setError] = useState(false);
  const tracks = pomodoroMode === "focus" ? ui.workTracks : ui.breakTracks;
  const id =
    pomodoroMode === "focus" ? ui.selectedWorkTrackId : ui.selectedBreakTrackId;
  const track = tracks.find((t) => t.id === id);
  const fallback =
    pomodoroMode === "focus"
      ? globalAudio.workSoundUrl
      : globalAudio.breakSoundUrl;
  const source = track?.dataUrl || fallback || (pomodoroMode === "focus" ? DEFAULT_WORK.dataUrl : DEFAULT_REST.dataUrl);
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    if (!pomodoroRunning || !source) {
      el.pause();
      return;
    }
    el.play()
      .then(() => setError(false))
      .catch(() => setError(true));
  }, [pomodoroRunning, source]);
  useEffect(() => {
    if (audio.current) {
      audio.current.volume = ui.musicVolume;
      audio.current.muted = ui.musicMuted;
    }
  }, [ui.musicVolume, ui.musicMuted]);
  return (
    <>
      <audio ref={audio} src={source || undefined} loop preload="none" />
      {error && pomodoroRunning && source && (
        <button
          className="w-audio-retry"
          onClick={() =>
            audio.current
              ?.play()
              .then(() => setError(false))
              .catch(() => setError(true))
          }
        >
          Musik starten · Browserfreigabe nötig
        </button>
      )}
    </>
  );
}
