"use client";
import { useEffect, useState } from "react";
import { Mic, Keyboard, Link2 } from "lucide-react";
import {
  useVoicePreferences,
  shortcutLabel,
  allowedShortcut,
  defaultRecord,
  defaultNext,
  type VoiceShortcut,
} from "@/lib/voice/preferences";
export function VoiceSettings() {
  const s = useVoicePreferences();
  const [capturing, setCapturing] = useState<"record" | "next" | null>(null),
    [key, setKey] = useState(""),
    [configured, setConfigured] = useState<Record<string, boolean>>({}),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = () =>
    fetch("/api/voice/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setStatus(d.error);
        else setConfigured(d);
      })
      .catch(() => setStatus("Verbindungen nicht erreichbar."));
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (!capturing) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key === "Escape") {
        setCapturing(null);
        return;
      }
      const shortcut: VoiceShortcut = {
        code: e.code,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      };
      if (!allowedShortcut(shortcut)) {
        setStatus(
          "Bitte eine Kombination mit Ctrl, ⌥ oder ⌘ wählen, oder F2–F12.",
        );
        return;
      }
      const other = capturing === "record" ? s.next : s.record;
      if (shortcutLabel(other) === shortcutLabel(shortcut)) {
        setStatus(
          "Aufnahme und nächstes Feld brauchen unterschiedliche Tasten.",
        );
        return;
      }
      s.set({ [capturing]: shortcut });
      setCapturing(null);
      setStatus("Tastenkürzel gespeichert.");
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [capturing, s]);
  async function connect(remove = false) {
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/voice/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: s.provider, key, remove }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setKey("");
      await refresh();
      setStatus(
        remove
          ? "Verbindung entfernt."
          : "Schlüssel gespeichert. Die erste Aufnahme prüft die Verbindung.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="w-card s-stack" id="sprache" data-voice-settings>
      <div className="w-section-head">
        <div>
          <span className="w-eyebrow">DEINE STIMME IN TRINITY</span>
          <h2>Gedanken einfach aussprechen.</h2>
        </div>
        <Mic size={23} />
      </div>
      <label className="s-check">
        <input
          type="checkbox"
          checked={s.enabled}
          onChange={(e) => s.set({ enabled: e.target.checked })}
        />{" "}
        Spracheingabe & Tastenkürzel aktivieren
      </label>
      <div className="s-grid">
        <div className="s-form">
          <h3>
            <Keyboard size={16} /> Bedienung
          </h3>
          <label>
            Aufnahme
            <select
              className="w-input"
              value={s.mode}
              onChange={(e) =>
                s.set({ mode: e.target.value as "toggle" | "hold" })
              }
            >
              <option value="toggle">Taste drücken: an / aus</option>
              <option value="hold">Taste gedrückt halten: sprechen</option>
            </select>
          </label>
          {(["record", "next"] as const).map((field) => (
            <label key={field}>
              {field === "record"
                ? "Aufnahme starten / stoppen"
                : "Zum nächsten Textfeld"}
              <button
                type="button"
                data-shortcut-capture
                className="w-btn"
                onClick={() => setCapturing(field)}
              >
                {capturing === field
                  ? "Jetzt drücken … (Esc beendet)"
                  : shortcutLabel(s[field])}
              </button>
            </label>
          ))}
          <button
            className="p-text-button"
            onClick={() => s.set({ record: defaultRecord, next: defaultNext })}
          >
            Standardtasten wiederherstellen
          </button>
          <p className="w-muted">
            Gilt, solange Trinity im Vordergrund ist. Beim Feldwechsel wird die
            Aufnahme erst abgeschlossen. Esc verwirft die laufende Aufnahme.
          </p>
        </div>
        <div className="s-form">
          <h3>
            <Link2 size={16} /> Sprach-Anbieter
          </h3>
          <label>
            Anbieter
            <select
              className="w-input"
              value={s.provider}
              onChange={(e) => {
                s.set({ provider: e.target.value as typeof s.provider });
                setKey("");
                setStatus("");
              }}
            >
              <option value="browser">Browser-Spracherkennung</option>
              <option value="openai">OpenAI</option>
              <option value="groq">Groq</option>
            </select>
          </label>
          <label>
            Sprache
            <select
              className="w-input"
              value={s.language}
              onChange={(e) => s.set({ language: e.target.value })}
            >
              {[
                ["de", "Deutsch"],
                ["en", "English"],
                ["fr", "Français"],
                ["es", "Español"],
                ["it", "Italiano"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {s.provider !== "browser" && (
            <>
              <label>
                Dein API-Schlüssel{" "}
                {configured[s.provider] ? "· gespeichert" : ""}
                <input
                  className="w-input"
                  type="password"
                  autoComplete="new-password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={
                    configured[s.provider]
                      ? "Neuen Schlüssel einsetzen"
                      : "API-Schlüssel einfügen"
                  }
                />
              </label>
              <div className="s-actions">
                <button
                  className="w-btn w-btn-primary"
                  disabled={busy || key.trim().length < 10}
                  onClick={() => void connect()}
                >
                  Verbinden
                </button>
                {configured[s.provider] && (
                  <button
                    className="w-btn"
                    disabled={busy}
                    onClick={() => void connect(true)}
                  >
                    Trennen
                  </button>
                )}
              </div>
            </>
          )}
          <p className="w-muted">
            {s.provider === "browser"
              ? "Verwendet den Sprachdienst deines Browsers. Nicht jeder Browser unterstützt ihn."
              : "Aufnahmen gehen zur Transkription an deinen gewählten Anbieter. Dein Schlüssel wird kontogebunden und verschlüsselt auf dem VPS gespeichert. Es können API-Kosten entstehen."}{" "}
            Trinity speichert keine Audioaufnahme. Text wird erst nach dem
            Stoppen eingefügt, niemals automatisch abgesendet.
          </p>
        </div>
      </div>
      {status && (
        <p role="status" className="v-status">
          {status}
        </p>
      )}
    </section>
  );
}
