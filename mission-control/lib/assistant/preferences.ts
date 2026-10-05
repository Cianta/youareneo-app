import { PROACTIVE_MODES, type ProactiveMode } from "./proactive";
export type AssistantPreferences = {
  brightness: number; sound: boolean; microphone: boolean;
  volume: number; rate: number; pitch: number;
  provider: "browser" | "vocallab" | "off";
  browserVoice: string; voice: string;
  proactive: ProactiveMode;
};
export const defaultPreferences: AssistantPreferences = {
  brightness: 0, sound: true, microphone: true, volume: .8,
  rate: 1, pitch: 1, provider: "browser", browserVoice: "", voice: "",
  proactive: "gentle",
};
const bounded = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
export function preferencesOf(value: unknown): AssistantPreferences {
  const p = value && typeof value === "object" ? value as Partial<AssistantPreferences> : {};
  return {
    brightness: bounded(p.brightness, 0, 100, 0), sound: p.sound !== false, microphone: p.microphone !== false,
    volume: bounded(p.volume, 0, 1, .8), rate: bounded(p.rate, .5, 2, 1), pitch: bounded(p.pitch, .5, 2, 1),
    provider: ["browser", "vocallab", "off"].includes(p.provider || "") ? p.provider! : "browser",
    browserVoice: typeof p.browserVoice === "string" ? p.browserVoice.slice(0, 300) : "",
    voice: typeof p.voice === "string" ? p.voice.slice(0, 200) : "",
    proactive: PROACTIVE_MODES.includes(p.proactive as ProactiveMode) ? p.proactive! : "gentle",
  };
}
export function themePalette(brightness: number) {
  const amount = bounded(brightness, 0, 100, 0) / 100;
  const mix = (dark: number[], light: number[]) => dark.map((v, i) => Math.round(v + (light[i] - v) * amount));
  const rgb = (color: number[]) => `rgb(${color.join(", ")})`;
  const background = mix([15, 20, 18], [244, 247, 242]);
  // Pick the higher-contrast foreground even at intermediate slider positions.
  const luminance = background.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const lightText = luminance < .18;
  return {
    "--theme-bg": rgb(background), "--theme-surface": rgb(mix([25, 34, 28], [231, 238, 229])),
    "--theme-sidebar": rgb(mix([18, 34, 24], [222, 233, 218])),
    "--theme-panel": rgb(mix([30, 41, 34], [235, 242, 232])),
    "--theme-text": lightText ? "#ffffff" : "#000000",
    "--theme-muted": luminance > .08 && luminance < .3 ? (lightText ? "#ffffff" : "#000000") : lightText ? "#c1d4c7" : "#253d2c",
    "--theme-border": lightText ? "#667d6b" : "#677866",
    "--theme-accent": lightText ? "#b5dfbb" : "#23552c",
    "--theme-active": rgb(mix([27, 61, 39], [197, 221, 193])),
  };
}
export function isCaptureShortcut(event: Pick<KeyboardEvent, "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey" | "isComposing">) {
  return event.code === "Space" && event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey && !event.isComposing;
}
