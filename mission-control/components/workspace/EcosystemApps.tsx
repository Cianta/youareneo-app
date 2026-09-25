"use client";
import { usePersonal } from "@/lib/workspace/personal";
const apps = [
  [
    "Visual Room",
    "https://visual-room.youareneo.com/",
    "Fokus, Musik und lebendige Räume",
  ],
  [
    "Cookbook · Kochbuch",
    "https://fvd-data.s3.amazonaws.com/other/3708781/1790130415-amShCv/kochbuchprojekt.html",
    "Rezepte, Saisonalität und Ernährung",
  ],
  [
    "Kinoraum",
    "https://fvd-data.s3.amazonaws.com/other/3708781/1790130417-TydJ1H/kinoraum.html",
    "Film und Meditation",
  ],
  [
    "Radio",
    "https://fvd-data.s3.amazonaws.com/other/3708781/1790130421-NYOQGm/radio.html",
    "Musik entdecken",
  ],
  [
    "Good News",
    "https://fvd-data.s3.amazonaws.com/other/3708781/1790130423-84WZ2J/good-news.html",
    "Positive Nachrichten",
  ],
  [
    "Frequency Room",
    "https://fvd-data.s3.amazonaws.com/other/3708781/1790130425-J37A5A/frequency-room.html",
    "Frequenzen entdecken",
  ],
  [
    "Art Atelier",
    "https://fvd-data.s3.amazonaws.com/other/3708781/1790130428-1DZaik/art-atelier.html",
    "Kunst und Gestaltung",
  ],
  [
    "Living Arts Room",
    "https://fvd-data.s3.amazonaws.com/other/3708781/1790130430-yDIFTH/living-arts-room.html",
    "Bilder, Licht und Geschichten",
  ],
];
export function EcosystemApps() {
  const s = usePersonal();
  return (
    <details className="w-card" open>
      <summary>YOU ARE NEO · Unsere Räume</summary>
      <div className="s-grid">
        {apps
          .filter(([name]) => !s.hiddenLinks.includes("ecosystem:" + name))
          .map(([name, url, description]) => (
            <article className="s-ecosystem" key={name}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <h3>✦ {name} ↗</h3>
                <p>{description}</p>
              </a>
              <button
                className="w-icon"
                aria-label={`${name} aus Apps entfernen`}
                onClick={() =>
                  s.set({
                    hiddenLinks: [...s.hiddenLinks, "ecosystem:" + name],
                  })
                }
              >
                −
              </button>
            </article>
          ))}
      </div>
      <button
        className="w-btn"
        onClick={() =>
          s.set({
            hiddenLinks: s.hiddenLinks.filter(
              (x) => !x.startsWith("ecosystem:"),
            ),
          })
        }
      >
        Alle Räume anzeigen
      </button>
    </details>
  );
}
