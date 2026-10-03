# Arbeitsstruktur YOU ARE NEO

```
youareneo-app/
├── youareneo.code-workspace   ← in VS Code öffnen (Datei → Arbeitsbereich aus Datei öffnen)
├── shopify-theme/             ← youareneo.com: eigene Sektionen, Blöcke, Skripte
├── mission-control/           ← Trinity OS / Mission Control (Next.js, Railway)
├── apps/                      ← 9 Portal-Apps (visual-room, kochbuch, kinoraum, …)
├── shared/                    ← gemeinsamer Code (z. B. Fördermitgliedschaft)
└── docs/                      ← diese Doku, Notizen, Entscheidungen
```

## Regeln, damit es ordentlich bleibt

- **Ein Projekt = ein Ordner.** Neue App → `apps/<name>/` mit eigenem `README.md`.
- **Keine Geheimnisse ins Repo** (`.env`, Tokens). Vorlage: `.env.example`.
- **Theme-Änderungen** nie direkt am Live-Theme – immer Kopie → testen → veröffentlichen.
- **Bilder/Videos** gehören nach Shopify → Inhalte → Dateien, nicht ins Repo.
- **Notizen & Entscheidungen** als kurze Markdown-Datei in `docs/` (Datum vorne: `2026-10-03-startseite.md`).

## Vexp (Token-Sparer in VS Code)

Vexp läuft lokal auf deinem Mac, deshalb kann ich es aus der Cloud-Sitzung nicht einsehen. So findest du es:

- **Einstellungen:** `Cmd + ,` → oben „vexp“ eingeben. Dort stehen alle Optionen der Erweiterung.
- **Ersparnis/Statistik:** `Cmd + Shift + P` → „vexp“ eingeben → die Befehle der Erweiterung (Status/Stats/Dashboard, je nach Version) erscheinen. Viele Versionen zeigen den Wert auch unten in der Statusleiste.
- **Projekt-Konfiguration:** liegt meist im Projektordner unter `.vexp/` – den Ordner bitte **nicht** löschen, darin steckt der Index.
