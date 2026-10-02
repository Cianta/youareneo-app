"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { defaultPreferences, preferencesOf, themePalette, type AssistantPreferences } from "@/lib/assistant/preferences";
function restoredPreferences(value: Record<string, unknown>) { return preferencesOf({...value, ...(value?.appearanceVersion === 2 ? {} : {brightness:100})}); }
const Context = createContext({ preferences: defaultPreferences, update: (_: Partial<AssistantPreferences>) => {} });
export const useAssistantPreferences = () => useContext(Context);
export function AssistantPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences), [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { setPreferences(restoredPreferences(JSON.parse(localStorage.getItem("trinity-display-voice") || "{}"))); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(themePalette(preferences.brightness))) root.style.setProperty(name, value);
    root.dataset.trinityTheme = "adjustable";
    root.dataset.guidingMotion = String(preferences.companionMotion);
    root.style.colorScheme = preferences.brightness >= 50 ? "light" : "dark";
    if (loaded) try { localStorage.setItem("trinity-display-voice", JSON.stringify({...preferences, appearanceVersion: 2})); } catch {}
  }, [preferences, loaded]);
  return <Context.Provider value={{ preferences, update: patch => setPreferences(old => preferencesOf({ ...old, ...patch })) }}>{children}</Context.Provider>;
}
