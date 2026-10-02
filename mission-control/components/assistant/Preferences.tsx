"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { defaultPreferences, preferencesOf, themePalette, type AssistantPreferences } from "@/lib/assistant/preferences";
const Context = createContext({ preferences: defaultPreferences, update: (_: Partial<AssistantPreferences>) => {} });
export const useAssistantPreferences = () => useContext(Context);
export function AssistantPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences), [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { setPreferences(preferencesOf(JSON.parse(localStorage.getItem("trinity-display-voice") || "{}"))); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(themePalette(preferences.brightness))) root.style.setProperty(name, value);
    root.dataset.trinityTheme = "adjustable";
    root.style.colorScheme = preferences.brightness >= 50 ? "light" : "dark";
    if (loaded) try { localStorage.setItem("trinity-display-voice", JSON.stringify(preferences)); } catch {}
  }, [preferences, loaded]);
  return <Context.Provider value={{ preferences, update: patch => setPreferences(old => preferencesOf({ ...old, ...patch })) }}>{children}</Context.Provider>;
}
