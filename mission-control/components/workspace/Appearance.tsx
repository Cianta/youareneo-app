"use client";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
type Mode = "dark" | "light" | "system";
export function Appearance() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("dark");
  const [brightness, setBrightness] = useState(100);
  useEffect(() => {
    const root = document.documentElement;
    const saved = root.dataset.appearance;
    if (saved === "dark" || saved === "light" || saved === "system")
      setMode(saved);
    setBrightness(Number(root.dataset.brightness) || 100);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      document.documentElement.dataset.theme =
        mode === "system" ? (mq.matches ? "dark" : "light") : mode;
      document.documentElement.dataset.appearance = mode;
      document.documentElement.dataset.brightness = String(brightness);
      document.documentElement.style.setProperty(
        "--ui-brightness",
        String(brightness / 100),
      );
    };
    // Initial values are read by the pre-paint script, then the controls take over.
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mode, brightness, ready]);
  function save(nextMode: Mode, nextBrightness: number) {
    setMode(nextMode);
    setBrightness(nextBrightness);
    try {
      localStorage.setItem(
        "trinity-appearance",
        JSON.stringify({ mode: nextMode, brightness: nextBrightness }),
      );
    } catch {
      /* controls still work for this session */
    }
  }
  return (
    <>
      <button
        className="w-appearance-trigger w-icon"
        title="Darstellung und Helligkeit"
        aria-label="Darstellung und Helligkeit"
        onClick={() => setOpen(true)}
      >
        <Moon size={18} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Dein Licht. Dein Wohlfühlraum."
      >
        <p className="w-muted">So hell wie nötig. So ruhig, wie du es magst.</p>
        <div className="w-theme-options">
          {(
            [
              { value: "dark", label: "Dunkel", icon: Moon },
              { value: "light", label: "Hell", icon: Sun },
              { value: "system", label: "System", icon: Monitor },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              className={mode === value ? "selected" : ""}
              aria-pressed={mode === value}
              key={value}
              onClick={() => save(value, brightness)}
            >
              <Icon size={23} />
              {label}
            </button>
          ))}
        </div>
        <label className="w-brightness-label" htmlFor="workspace-brightness">
          Helligkeit <output>{brightness}%</output>
        </label>
        <div className="w-brightness-control">
          <Moon size={16} />
          <input
            id="workspace-brightness"
            type="range"
            min="45"
            max="100"
            step="1"
            value={brightness}
            onChange={(e) => save(mode, Number(e.target.value))}
          />
          <Sun size={20} />
        </div>
        <p className="w-storage-note">
          Deine Einstellung bleibt in diesem Browser gespeichert. „System“ folgt
          dem Hell-/Dunkelmodus deines Geräts.
        </p>
        <button className="w-text-link" onClick={() => save("dark", 100)}>
          Auf Standard zurücksetzen
        </button>
      </Modal>
    </>
  );
}
