import type {WeatherPlace} from "./ambience";
import { PROACTIVE_MODES, type ProactiveMode } from "./proactive";
export type AssistantPreferences = {
  brightness: number; sound: boolean; microphone: boolean;
  volume: number; rate: number; pitch: number;
  provider: "browser" | "vocallab" | "off";
  browserVoice: string; voice: string; microphoneDeviceId: string;
  companion: "dragon" | "human" | "tree" | "off"; energyColor: "violet" | "teal" | "rose";
  companionMotion: boolean; adaptiveMood: boolean; daylight: boolean; atmosphere: number; weatherEnabled:boolean; weatherPlace:WeatherPlace|null;
  proactive: ProactiveMode;
};
export const defaultPreferences: AssistantPreferences = {
  brightness: 100, sound: true, microphone: true, volume: .8,
  rate: 1, pitch: 1, provider: "browser", browserVoice: "", voice: "", microphoneDeviceId: "",
  companion: "dragon", energyColor: "violet", companionMotion: true, adaptiveMood: true, daylight:true, atmosphere:7, weatherEnabled:false, weatherPlace:null,
  proactive: "gentle",
};
const bounded = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
export function preferencesOf(value: unknown): AssistantPreferences {
  const p = value && typeof value === "object" ? value as Partial<AssistantPreferences> : {};
  return {
    daylight: p.daylight !== false, atmosphere: bounded(p.atmosphere,0,15,7), weatherEnabled:p.weatherEnabled===true,
    weatherPlace: p.weatherPlace && typeof p.weatherPlace.name==="string" && Number.isFinite(p.weatherPlace.latitude) && Math.abs(p.weatherPlace.latitude)<=90 && Number.isFinite(p.weatherPlace.longitude) && Math.abs(p.weatherPlace.longitude)<=180 ? {name:p.weatherPlace.name.slice(0,100),latitude:Math.round(p.weatherPlace.latitude*100)/100,longitude:Math.round(p.weatherPlace.longitude*100)/100} : null,
    microphoneDeviceId: typeof p.microphoneDeviceId === "string" ? p.microphoneDeviceId.slice(0,500) : "",
    companion: ["dragon","human","tree","off"].includes(p.companion || "") ? p.companion! : "dragon",
    energyColor: ["violet","teal","rose"].includes(p.energyColor || "") ? p.energyColor! : "violet",
    companionMotion: p.companionMotion !== false, adaptiveMood: p.adaptiveMood !== false,
    brightness: bounded(p.brightness, 0, 100, 100), sound: p.sound !== false, microphone: p.microphone !== false,
    volume: bounded(p.volume, 0, 1, .8), rate: bounded(p.rate, .5, 2, 1), pitch: bounded(p.pitch, .5, 2, 1),
    provider: ["browser", "vocallab", "off"].includes(p.provider || "") ? p.provider! : "browser",
    browserVoice: typeof p.browserVoice === "string" ? p.browserVoice.slice(0, 300) : "",
    voice: typeof p.voice === "string" ? p.voice.slice(0, 200) : "",
    proactive: PROACTIVE_MODES.includes(p.proactive as ProactiveMode) ? p.proactive! : "gentle",
  };
}
export function themePalette(brightness: number) {
  const amount = bounded(brightness, 0, 100, 100) / 100;
  const mix = (dark: number[], light: number[]) => dark.map((v, i) => Math.round(v + (light[i] - v) * amount));
  const rgb = (color: number[]) => `rgb(${color.join(", ")})`;
  const background = mix([19, 20, 30], [248, 248, 247]);
  // Pick the higher-contrast foreground even at intermediate slider positions.
  const luminance = background.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const lightText = luminance < .18;
  return {
    "--theme-bg": rgb(background), "--theme-surface": rgb(mix([28, 29, 42], [255, 254, 251])),
    "--theme-sidebar": rgb(mix([22, 24, 37], [241, 244, 246])),
    "--theme-panel": rgb(mix([33, 35, 50], [237, 242, 245])),
    "--theme-text": lightText ? "#ffffff" : "#000000",
    "--theme-muted": luminance > .08 && luminance < .3 ? (lightText ? "#ffffff" : "#000000") : lightText ? "#c7cbdc" : "#394957",
    "--theme-border": lightText ? "#75788f" : "#858c99",
    "--theme-accent": lightText ? "#94ded8" : "#075e64",
    "--theme-purple": lightText ? "#dac2f5" : "#513170",
    "--theme-pink": lightText ? "#f0b5d0" : "#963461",
    "--theme-green": lightText ? "#b5dfbb" : "#23552c",
    "--theme-active": rgb(mix([40, 34, 61], [234, 228, 245])),
  };
}
export function isCaptureShortcut(event: Pick<KeyboardEvent, "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey" | "isComposing">) {
  return event.code === "Space" && event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey && !event.isComposing;
}
