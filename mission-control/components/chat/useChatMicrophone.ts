"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Callbacks = { onAudio: (blob: Blob) => void; onSpeechStart: () => void };
export function useChatMicrophone(callbacks: Callbacks) {
  const refs = useRef(callbacks);
  refs.current = callbacks;
  const [state, setState] = useState<
      "idle" | "requesting" | "listening" | "recording"
    >("idle"),
    [level, setLevel] = useState(0),
    [error, setError] = useState("");
  const run = useRef<{
    token: number;
    stream: MediaStream | null;
    ctx: AudioContext | null;
    rec: MediaRecorder | null;
    frame: number;
    timer: ReturnType<typeof setInterval> | null;
    active: boolean;
    send: boolean;
    handsFree: boolean;
  }>({
    token: 0,
    stream: null,
    ctx: null,
    rec: null,
    frame: 0,
    timer: null,
    active: false,
    send: false,
    handsFree: false,
  });
  const mounted = useRef(true);
  const release = useCallback(() => {
    const r = run.current;
    r.stream?.getTracks().forEach((t) => t.stop());
    r.stream = null;
    void r.ctx?.close().catch(() => {});
    r.ctx = null;
    cancelAnimationFrame(r.frame);
    if (r.timer) clearInterval(r.timer);
    r.timer = null;
    if (mounted.current) {
      setState("idle");
      setLevel(0);
    }
  }, []);
  const cancel = useCallback(() => {
    const r = run.current;
    r.token++;
    r.active = false;
    r.send = false;
    if (r.rec?.state !== "inactive") r.rec?.stop();
    r.rec = null;
    release();
  }, [release]);
  const finish = useCallback(() => {
    const r = run.current;
    if (r.handsFree) {
      cancel();
      return;
    }
    r.active = false;
    if (r.rec?.state === "recording") {
      r.send = true;
      r.rec.stop();
    } else {
      r.token++;
      release();
    }
  }, [cancel, release]);
  const start = useCallback(
    async (handsFree: boolean) => {
      cancel();
      const r = run.current,
        token = ++r.token;
      r.active = true;
      r.handsFree = handsFree;
      setError("");
      setState("requesting");
      if (!handsFree) refs.current.onSpeechStart();
      try {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
          throw Error(
            "Dein Browser unterstützt diese Aufnahme nicht. Du kannst unten Text eingeben.",
          );
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (!mounted.current || token !== r.token || !r.active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        r.stream = stream;
        const mime = [
          "audio/webm;codecs=opus",
          "audio/mp4;codecs=mp4a.40.2",
          "audio/mp4",
          "audio/ogg;codecs=opus",
        ].find((m) => MediaRecorder.isTypeSupported(m));
        if (!mime)
          throw Error(
            "Kein Aufnahmeformat verfügbar. Bitte nutze Text oder einen anderen Browser.",
          );
        let analyser: AnalyserNode | null = null;
        try {
          r.ctx = new AudioContext();
          await r.ctx.resume();
          analyser = r.ctx.createAnalyser();
          analyser.fftSize = 512;
          r.ctx.createMediaStreamSource(stream).connect(analyser);
        } catch {
          if (handsFree)
            throw Error(
              "Stille-Erkennung ist nicht verfügbar. Bitte nutze „Gedrückt halten“.",
            );
        }
        if (token !== r.token || !r.active) return;
        const begin = () => {
          if (!r.active || token !== r.token) return;
          let chunks: BlobPart[] = [],
            bytes = 0,
            heard = false,
            aboveAt = 0,
            lastVoice = performance.now(),
            started = performance.now();
          const rec = new MediaRecorder(stream, {
            mimeType: mime,
            audioBitsPerSecond: 64000,
          });
          r.rec = rec;
          r.send = !handsFree;
          rec.ondataavailable = (e) => {
            if (token !== r.token || !mounted.current) return;
            if (e.data.size) {
              bytes += e.data.size;
              if (bytes <= 5 * 1024 * 1024) chunks.push(e.data);
              else {
                r.send = false;
                cancel();
                setError("Die Aufnahme war zu groß. Bitte kürzer sprechen.");
              }
            }
          };
          rec.onerror = () => {
            if (token !== r.token || !mounted.current) return;
            cancel();
            if (mounted.current)
              setError(
                "Die Aufnahme wurde unterbrochen. Bitte erneut starten.",
              );
          };
          rec.onstop = () => {
            const send = r.send && token === r.token && (!handsFree || heard),
              blob = new Blob(chunks, { type: mime });
            chunks = [];
            if (token !== r.token || !mounted.current) return;
            cancelAnimationFrame(r.frame);
            if (r.timer) clearInterval(r.timer);
            r.timer = null;
            r.rec = null;
            if (handsFree && r.active) begin();
            else release();
            if (send && blob.size) refs.current.onAudio(blob);
          };
          rec.start(250);
          setState(handsFree ? "listening" : "recording");
          const values = new Float32Array(512);
          const tick = () => {
            if (rec.state !== "recording" || token !== r.token) return;
            const now = performance.now();
            let rms = 0;
            if (analyser) {
              analyser.getFloatTimeDomainData(values);
              rms = Math.sqrt(
                values.reduce((s, v) => s + v * v, 0) / values.length,
              );
            }
            setLevel(Math.min(1, rms * 8));
            if (rms > 0.025) {
              if (!aboveAt) aboveAt = now;
              if (now - aboveAt >= 120) {
                lastVoice = now;
                if (!heard) {
                  heard = true;
                  setState("recording");
                  if (handsFree) refs.current.onSpeechStart();
                }
              }
            } else aboveAt = 0;
            if (handsFree && heard && now - lastVoice > 1000) {
              r.send = true;
              rec.stop();
              return;
            }
            if (
              now - started >= 60000 ||
              (handsFree && !heard && now - started >= 15000)
            ) {
              r.send = heard || !handsFree;
              rec.stop();
              return;
            }
            r.frame = requestAnimationFrame(tick);
          };
          r.timer = setInterval(() => {
            if (
              rec.state === "recording" &&
              performance.now() - started >= 60000
            ) {
              r.send = heard || !handsFree;
              rec.stop();
            }
          }, 500);
          tick();
        };
        begin();
      } catch (e) {
        if (token !== r.token || !mounted.current) return;
        cancel();
        setError(
          e instanceof DOMException
            ? "Bitte erlaube den Mikrofonzugriff."
            : e instanceof Error
              ? e.message
              : "Aufnahme nicht möglich.",
        );
      }
    },
    [cancel, release],
  );
  useEffect(() => {
    mounted.current = true;
    const hide = () => {
      if (document.hidden) cancel();
    };
    const blur = () => {
      if (!run.current.handsFree) finish();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", blur);
    return () => {
      mounted.current = false;
      cancel();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", blur);
    };
  }, [cancel, finish]);
  return { state, level, error, start, finish, cancel };
}
