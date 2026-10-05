"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  afterDismissed, afterShown, afterSnoozed, decideProactive, memoryOf, emptyMemory,
  type ProactiveMemory, type ProactiveSuggestion,
} from "@/lib/assistant/proactive";
import type { AssistantPreferences } from "@/lib/assistant/preferences";
import { speakLine, stopSpeaking } from "@/lib/assistant/speak";

const KEY = "trinity-proactive";
const TICK = 10_000;

function load(): ProactiveMemory {
  try { return memoryOf(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { return emptyMemory; }
}
function save(m: ProactiveMemory) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {} }

/** Trinity meldet sich von selbst – selten, kurz, nie während einer Aufnahme oder eines offenen Panels. */
export function useProactive(opts: {
  preferences: AssistantPreferences; name: string; path: string; busy: boolean; draftSince: number | null;
}) {
  const [suggestion, setSuggestion] = useState<ProactiveSuggestion | null>(null);
  const memory = useRef<ProactiveMemory>(emptyMemory);
  const lastActivity = useRef(Date.now()), startedAt = useRef(Date.now());
  const latest = useRef(opts); latest.current = opts;
  const shown = useRef<ProactiveSuggestion | null>(null); shown.current = suggestion;

  useEffect(() => {
    memory.current = load();
    const touch = () => { lastActivity.current = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach(e => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      const o = latest.current, now = Date.now();
      if (shown.current || document.hidden) return;
      const next = decideProactive({
        mode: o.preferences.proactive, name: o.name, hour: new Date(now).getHours(), path: o.path,
        sessionMs: now - startedAt.current, idleMs: now - lastActivity.current,
        draftAgeMs: o.draftSince === null ? null : now - o.draftSince, busy: o.busy,
      }, memory.current, now);
      if (!next) return;
      memory.current = afterShown(memory.current, next.kind, now); save(memory.current);
      setSuggestion(next);
      void speakLine(next.text, o.preferences);
    }, TICK);
    return () => { events.forEach(e => window.removeEventListener(e, touch)); window.clearInterval(timer); stopSpeaking(); };
  }, []);

  // Beginnt der Nutzer selbst etwas, tritt Trinity sofort zurück.
  useEffect(() => { if (opts.busy && shown.current) { stopSpeaking(); setSuggestion(null); } }, [opts.busy]);
  useEffect(() => { if (opts.preferences.proactive === "off") { stopSpeaking(); setSuggestion(null); } }, [opts.preferences.proactive]);

  const close = useCallback((update: (m: ProactiveMemory, now: number) => ProactiveMemory) => {
    stopSpeaking(); setSuggestion(null);
    memory.current = update(memory.current, Date.now()); save(memory.current);
    lastActivity.current = Date.now();
  }, []);
  return {
    suggestion,
    /** „Ja, bitte“: Gespräch öffnen. Zählt nicht als Ablehnung. */
    accept: useCallback(() => { const s = shown.current; stopSpeaking(); setSuggestion(null); lastActivity.current = Date.now(); return s; }, []),
    later: useCallback(() => close(afterDismissed), [close]),
    snoozeToday: useCallback(() => close(afterSnoozed), [close]),
  };
}
