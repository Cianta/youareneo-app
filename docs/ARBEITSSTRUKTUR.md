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

## Kreativ-Werkzeuge (über MCP verbunden)

| Werkzeug | Wofür | Kontingent |
|---|---|---|
| **MotionVid** | Videos 15–120 s, mehrere Szenen, Sprecher, Musik, Effekte, KI-Footage (Modelle Miltos 4/5/6, Standard: Miltos 6 Fast) | AppSumo-Lifetime, jeden Monat neue Credits – **bevorzugt für alle Videos** |
| **Robin Reach** | KI-Bilder (GPT Image 2.5 / Nano Banana Pro), bis 1536×1024 | ca. 100 Bilder/Monat |
| **ElevenLabs** | Bilder bearbeiten, Hochskalieren (Topaz), Sprache | Gratis-Plan, kleines Tageslimit |
| **Canva** | Bilder und Designs | Ergebnis nur in Canva abrufbar |
| **Gamma** | Präsentationen, Bilder | Gratis-Plan, Credits fast aufgebraucht |
