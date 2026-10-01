"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";
import { MAX_RECORDING_SECONDS } from "@/lib/voice/contracts";
type Props = {
  autoStart?: boolean;
  disabled?: boolean;
  onRecording: (blob: Blob) => void;
  onActiveChange?: (active: boolean) => void;
  onMeter?: (level: number | null) => void;
};
export function VoiceRecorder({
  autoStart = false,
  disabled = false,
  onRecording,
  onActiveChange,
  onMeter,
}: Props) {
  const [status, setStatus] = useState<
    "idle" | "recording" | "paused" | "requesting"
  >("idle");
  const [seconds, setSeconds] = useState(0),
    [level, setLevel] = useState(0),
    [error, setError] = useState("");
  const meterRef = useRef(onMeter);
  meterRef.current = onMeter;
  const displayLevel =
    status === "recording" ? Math.round(level * 20) / 20 : null;
  useEffect(() => {
    meterRef.current?.(displayLevel);
  }, [displayLevel]);
  useEffect(() => () => meterRef.current?.(null), []);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    context = useRef<AudioContext | null>(null);
  const watchdog = useRef<ReturnType<typeof setInterval> | null>(null);
  const frame = useRef(0),
    chunks = useRef<Blob[]>([]),
    elapsed = useRef(0),
    last = useRef(0),
    mounted = useRef(true),
    busy = useRef(false);
  const onRecordingRef = useRef(onRecording);
  onRecordingRef.current = onRecording;
  const activeRef = useRef(onActiveChange);
  activeRef.current = onActiveChange;
  const release = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (watchdog.current) clearInterval(watchdog.current);
    watchdog.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void context.current?.close().catch(() => {});
    context.current = null;
    activeRef.current?.(false);
  }, []);
  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive")
      recorder.current.stop();
  }, []);
  const start = useCallback(async () => {
    if (
      disabled ||
      busy.current ||
      recorder.current?.state === "recording" ||
      recorder.current?.state === "paused"
    )
      return;
    busy.current = true;
    setError("");
    setStatus("requesting");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error(
          "Dieser Browser unterstützt keine Aufnahme. Bitte nutze Safari, Chrome oder eine Textnotiz.",
        );
      const input = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (!mounted.current) {
        input.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = input;
      const mime = [
        "audio/webm;codecs=opus",
        "audio/mp4;codecs=mp4a.40.2",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((m) => MediaRecorder.isTypeSupported(m));
      if (!mime)
        throw new Error(
          "Kein unterstütztes Audioformat. Bitte einen anderen Browser verwenden.",
        );
      const r = new MediaRecorder(input, {
        mimeType: mime,
        audioBitsPerSecond: 64000,
      });
      recorder.current = r;
      chunks.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onerror = () => {
        release();
        if (mounted.current) {
          setError("Die Aufnahme wurde unterbrochen. Bitte erneut versuchen.");
          setStatus("idle");
        }
      };
      r.onstop = () => {
        const blob = new Blob(chunks.current, { type: r.mimeType });
        chunks.current = [];
        release();
        if (mounted.current) {
          setLevel(0);
          setStatus("idle");
          if (blob.size) onRecordingRef.current(blob);
        }
      };
      // Metering is optional: a suspended AudioContext must not prevent recording on iOS.
      let analyser: AnalyserNode | null = null;
      try {
        const ctx = new AudioContext();
        context.current = ctx;
        void ctx.resume().catch(() => {});
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(input).connect(analyser);
      } catch {}
      const data = new Uint8Array(256);
      elapsed.current = 0;
      last.current = performance.now();
      setSeconds(0);
      r.start(1000);
      setStatus("recording");
      activeRef.current?.(true);
      const tick = () => {
        const now = performance.now();
        if (r.state === "recording")
          elapsed.current += (now - last.current) / 1000;
        last.current = now;
        setSeconds(Math.floor(elapsed.current));
        if (analyser && r.state === "recording") {
          analyser.getByteTimeDomainData(data);
          setLevel(
            Math.min(
              1,
              Math.sqrt(
                data.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) /
                  data.length,
              ) * 5,
            ),
          );
        } else setLevel(0);
        if (elapsed.current >= MAX_RECORDING_SECONDS) {
          stop();
          return;
        }
        frame.current = requestAnimationFrame(tick);
      };
      // RAF pauses in background tabs; the timer still enforces the recording cap.
      watchdog.current = setInterval(() => {
        if (
          r.state === "recording" &&
          elapsed.current + (performance.now() - last.current) / 1000 >=
            MAX_RECORDING_SECONDS
        )
          stop();
      }, 1000);
      tick();
    } catch (e) {
      release();
      if (mounted.current) {
        setStatus("idle");
        setError(
          e instanceof DOMException
            ? "Bitte erlaube den Mikrofonzugriff und tippe auf Aufnahme starten."
            : e instanceof Error
              ? e.message
              : "Aufnahme nicht möglich.",
        );
      }
    } finally {
      busy.current = false;
    }
  }, [disabled, release, stop]);
  const toggle = useCallback(() => {
    if (
      recorder.current?.state === "recording" ||
      recorder.current?.state === "paused"
    )
      stop();
    else void start();
  }, [start, stop]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state !== "inactive") recorder.current?.stop();
      chunks.current = [];
      release();
    };
  }, [release]);
  const attempted = useRef(false);
  useEffect(() => {
    if (autoStart && !attempted.current) {
      attempted.current = true;
      void start();
    }
  }, [autoStart, start]);
  useEffect(() => {
    const handler = () => toggle();
    window.addEventListener("neo-toggle-recording", handler);
    return () => window.removeEventListener("neo-toggle-recording", handler);
  }, [toggle]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (status === "recording" || status === "paused") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [status]);
  const active = status === "recording" || status === "paused";
  return (
    <section className="voice-recorder" aria-label="Sprachaufnahme">
      <button
        type="button"
        className={"voice-mic " + (active ? "is-recording" : "")}
        disabled={disabled || status === "requesting"}
        onClick={toggle}
        aria-label={active ? "Aufnahme stoppen" : "Aufnahme starten"}
      >
        {active ? <Square size={34} /> : <Mic size={40} />}
      </button>
      <div>
        <strong>
          {status === "requesting"
            ? "Mikrofon wird geöffnet …"
            : status === "paused"
              ? "Aufnahme pausiert"
              : status === "recording"
                ? "Ich höre zu …"
                : "Was möchtest du festhalten?"}
        </strong>
        <p>
          {active
            ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} / 5:00`
            : "Sprechen oder unten schreiben · Alt+N startet und stoppt"}
        </p>
        <meter aria-label="Mikrofonpegel" min={0} max={1} value={level} />
      </div>
      {active && (
        <button
          type="button"
          className="voice-secondary"
          onClick={() => {
            const r = recorder.current;
            if (r?.state === "recording") {
              r.pause();
              setStatus("paused");
            } else if (r?.state === "paused") {
              last.current = performance.now();
              r.resume();
              setStatus("recording");
            }
          }}
        >
          {status === "paused" ? <Play size={18} /> : <Pause size={18} />}{" "}
          {status === "paused" ? "Weiter" : "Pause"}
        </button>
      )}
      {error && (
        <p role="alert" className="voice-error">
          {error}
        </p>
      )}
    </section>
  );
}
