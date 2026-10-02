"use client";
import { useEffect, useState } from "react";
import { useFocusStore } from "@/lib/store";
import {useAssistantPreferences} from "@/components/assistant/Preferences";
import { Dialog } from "./Dialog";
export function FocusRuntime() {
  const {preferences} = useAssistantPreferences();
  const running = useFocusStore((s) => s.pomodoroRunning),
    seconds = useFocusStore((s) => s.pomodoroSeconds),
    mode = useFocusStore((s) => s.pomodoroMode);
  const [ended, setEnded] = useState("");
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => useFocusStore.getState().tickPomodoro(),
      1000,
    );
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (seconds !== 0 || running) return;
    setEnded(
      mode === "focus"
        ? "Deine Fokuszeit ist vorbei. Zeit für eine Pause."
        : "Deine Pause ist vorbei. Bereit für den nächsten Schritt?",
    );
    if(preferences.sound) void import("@/lib/gong").then((m) => {if(preferences.sound)m.playGong();});
    useFocusStore.getState().advancePomodoro();
  }, [seconds, running, mode, preferences.sound]);
  return ended ? (
    <Dialog title="Ein Moment für dich" onClose={() => setEnded("")}>
      <p>{ended}</p>
      <div className="workspace-form-actions">
        <button
          className="workspace-button"
          onClick={() => {
            useFocusStore.getState().togglePomodoro();
            setEnded("");
          }}
        >
          Nächste Phase starten
        </button>
        <button className="workspace-button" onClick={() => setEnded("")}>
          Später
        </button>
      </div>
    </Dialog>
  ) : null;
}
