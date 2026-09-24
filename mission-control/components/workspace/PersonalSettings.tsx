"use client";
import Link from "next/link";
import { usePersonal } from "@/lib/workspace/personal";
import { McpControls } from "./McpControls";
import { Appearance } from "./Appearance";
import { useUIExtStore } from "@/lib/store";
export function PersonalSettings() {
  const s = usePersonal(),
    ui = useUIExtStore();
  return (
    <>
      <McpControls />
      <section className="w-card s-stack">
        <span className="w-eyebrow">DEIN PERSÖNLICHER RAUM</span>
        <h2>So fühlt sich Trinity für dich richtig an.</h2>
        <div className="s-grid">
          <div className="s-stack">
            <div className="s-actions">
              <span>Darstellung & Helligkeit</span>
              <Appearance />
            </div>
            <label className="s-check">
              <input
                type="checkbox"
                checked={s.motion}
                onChange={(e) => s.set({ motion: e.target.checked })}
              />
              Logo und Ruheclips animieren
            </label>
            <label className="s-check">
              <input
                type="checkbox"
                checked={s.cosmosVisible}
                onChange={(e) => s.set({ cosmosVisible: e.target.checked })}
              />
              Himmelskompass im Menü anzeigen
            </label>
            <button
              className="w-btn"
              onClick={() =>
                s.set({
                  navOpen: {
                    work: true,
                    more: true,
                    soul: false,
                    bookmarks: false,
                  },
                })
              }
            >
              Menü auf Standard zurücksetzen
            </button>
          </div>
          <div className="s-stack">
            <label className="s-check">
              <input
                type="checkbox"
                checked={ui.musicMuted}
                onChange={(e) => ui.setMusicMuted(e.target.checked)}
              />
              Fokusmusik stummschalten
            </label>
            <label className="s-form">
              Musiklautstärke
              <input
                aria-label="Standard-Musiklautstärke"
                type="range"
                min="0"
                max="1"
                step=".05"
                value={ui.musicVolume}
                onChange={(e) => ui.setMusicVolume(Number(e.target.value))}
              />
            </label>
            <Link className="w-btn" href="/dashboard/meditation">
              Arbeits- und Pausenmusik auswählen →
            </Link>
            <Link className="w-btn" href="/dashboard/second-brain">
              Persönliches Wissen als Markdown sichern →
            </Link>
          </div>
        </div>
        <p className="w-muted">
          Betriebssystem-Einstellungen für reduzierte Bewegung haben Vorrang.
          Deine persönlichen Einstellungen werden auf diesem Gerät gespeichert.
        </p>
        <details>
          <summary>Konten & Zugang</summary>
          <p className="w-muted">
            Kundenkonten verwaltest du zentral in FuseBase: Organisation →
            Mitglieder → Kunde einladen → passendes Portal. Eine Portaleinladung
            allein garantiert noch keinen Zugang zu jeder extern gehosteten App.
          </p>
          <a
            className="w-btn"
            href="https://you-are-neo.nimbusweb.me/"
            target="_blank"
            rel="noopener noreferrer"
          >
            FuseBase-Verwaltung öffnen ↗
          </a>
          <p className="w-muted">
            Memberspot-Fördermitgliedschaften müssen serverseitig mit
            App-Berechtigungen verbunden werden. Die automatische Freischaltung
            ist noch nicht aktiv.
          </p>
        </details>
      </section>
    </>
  );
}
