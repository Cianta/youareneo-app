"use client";
// Kurze Ansagen von Trinity (nicht der Sprachchat): Trinity-Stimme über VocalLab,
// sonst Browser-Stimme. Fällt bei jedem Fehler leise auf Text zurück.
import type { AssistantPreferences } from "./preferences";

let stopCurrent: (() => void) | null = null;
let defaultVoice: string | undefined;
let listening = false;

const pulse = (state: "speaking" | "idle", level = 0) =>
  window.dispatchEvent(new CustomEvent("neo-assistant-state", { detail: { state, level } }));

export function stopSpeaking() {
  stopCurrent?.();
  stopCurrent = null;
}

/** Browser erlauben Ton erst nach einer Nutzeraktion; davor bleibt Trinity bei Text. */
export function mayAutoSpeak(p: Pick<AssistantPreferences, "sound" | "provider">) {
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return p.sound && p.provider !== "off" && activation?.hasBeenActive === true;
}

async function trinityVoice(p: AssistantPreferences, signal: AbortSignal) {
  if (p.voice) return p.voice;
  if (defaultVoice !== undefined) return defaultVoice;
  const r = await fetch("/api/voice/speech/voices", { cache: "no-store", signal });
  const d = await r.json();
  if (!r.ok || !d.ready) return (defaultVoice = "");
  const german = d.voices?.find((v: { languages: string[] }) => v.languages.some(l => l.startsWith("de")));
  return (defaultVoice = d.defaultVoice || d.selected || german?.id || d.voices?.[0]?.id || "");
}

function viaBrowser(text: string, p: AssistantPreferences, abort: AbortController) {
  return new Promise<void>(resolve => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = p.rate; u.pitch = p.pitch; u.volume = p.volume;
    u.voice = synth.getVoices().find(v => v.voiceURI === p.browserVoice) || synth.getVoices().find(v => v.lang.startsWith("de")) || null;
    u.onend = u.onerror = () => resolve();
    abort.signal.addEventListener("abort", () => { synth.cancel(); resolve(); }, { once: true });
    synth.speak(u);
  });
}

async function viaVocalLab(text: string, p: AssistantPreferences, abort: AbortController) {
  const voice = await trinityVoice(p, abort.signal);
  if (!voice) return false;
  const r = await fetch("/api/voice/speech", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }), signal: abort.signal,
  });
  if (!r.ok) return false;
  const url = URL.createObjectURL(await r.blob());
  const audio = new Audio(url);
  audio.volume = p.volume;
  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(Error("Audio"));
      abort.signal.addEventListener("abort", () => { audio.pause(); resolve(); }, { once: true });
      audio.play().catch(reject);
    });
  } finally { audio.src = ""; URL.revokeObjectURL(url); }
  return true;
}

/** Spricht eine kurze Zeile. Gibt zurück, ob etwas zu hören war. */
export async function speakLine(text: string, p: AssistantPreferences): Promise<boolean> {
  if (!mayAutoSpeak(p) || !text.trim()) return false;
  stopSpeaking();
  if (!listening) {
    listening = true;
    window.addEventListener("neo-stop-speech", stopSpeaking);
    window.addEventListener("neo-stop-chat", stopSpeaking);
  }
  const abort = new AbortController();
  const mine = () => abort.abort();
  stopCurrent = mine;
  pulse("speaking", .5);
  try {
    if (p.provider === "vocallab") {
      try { if (await viaVocalLab(text, p, abort)) return true; } catch { if (abort.signal.aborted) return false; }
    }
    await viaBrowser(text, p, abort);
    return true;
  } catch { return false; }
  finally {
    // Nur zurücksetzen, wenn keine neuere Ansage übernommen hat.
    if (stopCurrent === mine || stopCurrent === null) pulse("idle");
    if (stopCurrent === mine) stopCurrent = null;
  }
}
