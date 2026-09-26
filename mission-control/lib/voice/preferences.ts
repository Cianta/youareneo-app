"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
export type VoiceShortcut = {
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
};
export const defaultRecord: VoiceShortcut = {
  code: "Space",
  ctrl: true,
  alt: false,
  shift: true,
  meta: false,
};
export const defaultNext: VoiceShortcut = {
  code: "ArrowRight",
  ctrl: true,
  alt: false,
  shift: true,
  meta: false,
};
export function shortcutLabel(s: VoiceShortcut) {
  return [
    s.ctrl && "Ctrl",
    s.alt && "⌥",
    s.shift && "⇧",
    s.meta && "⌘",
    s.code
      .replace("Key", "")
      .replace("Digit", "")
      .replace("Space", "Leertaste")
      .replace("ArrowRight", "→"),
  ]
    .filter(Boolean)
    .join(" + ");
}
export function matches(
  e: Pick<
    KeyboardEvent,
    "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey"
  >,
  s: VoiceShortcut,
) {
  return (
    e.code === s.code &&
    e.ctrlKey === s.ctrl &&
    e.altKey === s.alt &&
    e.shiftKey === s.shift &&
    e.metaKey === s.meta
  );
}
export function allowedShortcut(s: VoiceShortcut) {
  return (
    ![
      "ShiftLeft",
      "ShiftRight",
      "ControlLeft",
      "ControlRight",
      "AltLeft",
      "AltRight",
      "MetaLeft",
      "MetaRight",
      "Escape",
      "Tab",
      "Enter",
    ].includes(s.code) &&
    (s.ctrl || s.alt || s.meta || /^F(?:[2-9]|1[0-2])$/.test(s.code)) &&
    !(
      (s.meta || s.ctrl) &&
      ["KeyQ", "KeyW", "KeyR", "KeyL", "KeyT", "KeyN"].includes(s.code)
    ) &&
    !(s.alt && s.code === "F4")
  );
}
type State = {
  enabled: boolean;
  mode: "toggle" | "hold";
  provider: "browser" | "openai" | "groq";
  language: string;
  record: VoiceShortcut;
  next: VoiceShortcut;
  set: (p: Partial<Omit<State, "set">>) => void;
};
export const useVoicePreferences = create<State>()(
  persist(
    (set) => ({
      enabled: false,
      mode: "toggle",
      provider: "browser",
      language: "de",
      record: defaultRecord,
      next: defaultNext,
      set,
    }),
    { name: "trinity-voice-v1" },
  ),
);
export function requestDictation(
  target?: HTMLInputElement | HTMLTextAreaElement | null,
) {
  window.dispatchEvent(
    new CustomEvent("trinity:dictate", { detail: { target } }),
  );
}

export const useVoiceRuntime = create<{
  phase: string;
  setPhase: (phase: string) => void;
}>((set) => ({ phase: "idle", setPhase: (phase) => set({ phase }) }));
