"use client";
import { useEffect, useRef, useState } from "react";

type Take = { url: string; name: string; size: number };
const TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

/** Local-only recording: camera/mic or screen + mic, preview and download. No upload yet. */
export function Recorder() {
  const live = useRef<HTMLVideoElement>(null), recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), chunks = useRef<Blob[]>([]);
  const [state, setState] = useState<"idle" | "ready" | "recording">("idle"), [error, setError] = useState(""), [takes, setTakes] = useState<Take[]>([]), [seconds, setSeconds] = useState(0);
  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (live.current) live.current.srcObject = null; };
  useEffect(() => () => { stop(); }, []);
  useEffect(() => { if (state !== "recording") return; const t = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(t); }, [state]);
  const urls = useRef<string[]>([]);
  useEffect(() => { urls.current = takes.map(t => t.url); }, [takes]);
  useEffect(() => () => urls.current.forEach(u => URL.revokeObjectURL(u)), []);

  async function prepare(screen: boolean) {
    setError(""); stop();
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: screen ? false : { width: { ideal: 1920 }, height: { ideal: 1080 } } });
      const tracks = screen ? [...(await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false })).getVideoTracks(), ...mic.getAudioTracks()] : mic.getTracks();
      stream.current = new MediaStream(tracks);
      if (live.current) { live.current.srcObject = stream.current; live.current.muted = true; void live.current.play(); }
      setState("ready");
    } catch (e) {
      setError(e instanceof DOMException && e.name === "NotAllowedError" ? "Kamera, Mikrofon oder Bildschirm wurde nicht freigegeben. Bitte im Browser erlauben." : "Gerät konnte nicht gestartet werden.");
      setState("idle");
    }
  }
  function record() {
    if (!stream.current) return;
    const mimeType = TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? "";
    const rec = new MediaRecorder(stream.current, { mimeType, videoBitsPerSecond: 8_000_000 });
    chunks.current = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: rec.mimeType || "video/webm" });
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      setTakes(prev => [{ url: URL.createObjectURL(blob), name: `aufnahme-${stamp}.${blob.type.includes("mp4") ? "mp4" : "webm"}`, size: blob.size }, ...prev]);
    };
    rec.start(1000); recorder.current = rec; setSeconds(0); setState("recording");
  }
  function finish() { recorder.current?.stop(); setState("ready"); }

  return <div className="kurs-recorder">
    <div className="kurs-stage"><video ref={live} playsInline aria-label="Live-Vorschau"/>{state === "recording" && <span className="kurs-rec">● {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>}</div>
    <div className="studio-row">
      {state !== "recording" && <><button type="button" className="w-btn" onClick={() => prepare(false)}>Kamera & Mikrofon</button><button type="button" className="w-btn" onClick={() => prepare(true)}>Bildschirm & Mikrofon</button></>}
      {state === "ready" && <button type="button" className="w-btn" onClick={record}>Aufnahme starten</button>}
      {state === "recording" && <button type="button" className="w-btn studio-danger" onClick={finish}>Aufnahme beenden</button>}
      {state === "ready" && <button type="button" className="w-btn" onClick={() => { stop(); setState("idle"); }}>Geräte freigeben</button>}
    </div>
    {error && <p className="kurs-note" role="alert">{error}</p>}
    {takes.length > 0 && <ol className="kurs-takes">{takes.map(t => <li key={t.url}><video src={t.url} controls preload="metadata"/><a className="w-btn" href={t.url} download={t.name}>Speichern ({(t.size / 1_048_576).toFixed(1)} MB)</a></li>)}</ol>}
  </div>;
}
