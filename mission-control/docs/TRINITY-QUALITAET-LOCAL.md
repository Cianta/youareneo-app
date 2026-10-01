# Lokale Qualitätsprüfung nach Avatar-Phase 3

Stand: 01.10.2026. Branch `codex/trinity-tempo-a11y`, aufbauend auf PR #14 / Commit `07b4ec1d17b490aec9eb24f4babe352c832235b3`. Fortsetzung nach Nutzerauftrag „weiter im automodus was du alle abarbeiten kannst“. Nur Staging.

## Ergebnis

Die fünf Kernseiten erreichen im lokalen Produktionsbuild die Ziele aus Bedienbarkeits-Teil 2. Je drei Läufe mit kaltem HTTP-Cache; Tabelle zeigt den Median. **Das sind Fixture-Messungen, keine angemeldete Staging-Abnahme.** Die historische Staging-Baseline vom 30.09. bleibt unverändert. Keine Aussage über echte Auth-/Datenbanklatenzen, Provider, Erststart-Dialog oder physische Handy-Hardware.

| Seite | Performance | Barrierefreiheit | LCP | CLS | TBT | JS entpackt |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/login` | 97 | 100 | 2,63 s | 0 | 26 ms | 531 KiB |
| `/notiz` | 95 | 100 | 2,78 s | 0,028 | 13 ms | 593 KiB |
| `/dashboard` | 97 | 100 | 2,63 s | 0 | 12 ms | 569 KiB |
| `/dashboard/vision/tasks` | 96 | 100 | 2,71 s | 0 | 21 ms | 865 KiB |
| `/dashboard/kanban` | 95 | 100 | 2,91 s | 0,017 | 11 ms | 744 KiB |

In allen 15 Läufen: keine Lighthouse-Laufwarnung, kein Konsolenfehler, kein API-Schreibaufruf. Der getrennte Build-Chunk mit `WebGLRenderer` wurde auf keiner dieser Seiten geladen. Das prüft konkret die Auslieferung des schweren Renderers an diese fünf Seiten, keine FPS oder vollständige Gerätekompatibilität des Graphen. Aufgaben und Notebooks laden weiterhin ihre benötigten Kanban-/Launcher-Bibliotheken; die Messung belegt keinen Grund für weitere Umbauten daran.

Messprofil: Lighthouse 13.5.0, Headless Brave ohne Erweiterungen, 412 × 823 px, DPR 1,75, simuliertes Mobilnetz (150 ms RTT, 1.638,4 kbit/s), 4× CPU-Verlangsamung. Pro Lauf neuer Browser-Kontext und geleerter HTTP-Cache. APIs werden ausschließlich im Browser mit fiktiven Daten beantwortet, externe Requests gesperrt. Die NotebookLM-Favicons werden durch ein lokales transparentes Bild ersetzt (zwei Requests pro Notebook-Lauf); das ist in den Belegen sichtbar. Keine Provider- oder echten Mitgliederzugriffe. Dashboard misst den eingerichteten Einstieg ohne Onboarding-Dialog.

Belege: [workspace-lighthouse.json](audits/2026-10-01-local/workspace-lighthouse.json), mit Messzeiten, Profil, Einzelwerten, tatsächlich geladenen JS-Chunks und gezählten abgefangenen Requests. Keine Cookies, Tokens, Zugangsdaten oder Auth-Links.

## Korrekturen

- Login besitzt einen benannten Hauptinhalt für Screenreader. Ein kurzer Viewport kann innerhalb der Seite bis zum unteren Formularbereich scrollen; zuvor konnte die globale `overflow: hidden`-Hülle Teile abschneiden.
- Login-Buttons mindestens 44 px hoch. Aktiver Modus mit `aria-pressed`; Fehler mit `role="alert"`, Versand-/Recovery-Rückmeldung mit `role="status"`. Verbleibende englische Formular-Rückfalltexte auf Deutsch.
- Ziel und Journal erhalten eindeutige deutsche Feldnamen und Platzhalter.
- Wiederholbarer lokaler Lighthouse-Lauf, einschließlich Schutz gegen versehentliche Remote-Aufrufe und gegen das Laden des 3D-Renderers auf Kernseiten. Lighthouse ausschließlich als fest versionierte Entwicklungsabhängigkeit; keine Client-Library.

Bestehende Login-Endpunkte, Payloads, Cookies, Supabase, Provider und Hermes-Verträge unverändert. Keine neuen Env-Variablen.

## Wiederholung

```sh
npm ci
npm run build
# Separater lokaler Server, niemals diese Testkonfiguration auf Staging setzen:
AUTH_PROVIDER=fusebase AUTH_APP_URL=http://127.0.0.1:3308 node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3308
# Zweites Terminal:
TEST_BROWSER_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npm run audit:workspace:local
TEST_BROWSER_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npm run test:workspace:browser
```

`TEST_BROWSER_PATH` muss auf einen lokal installierten Chromium-Browser zeigen. `AUDIT_RUNS` optional 1–5 (Standard 3), `AUDIT_OUTPUT_DIR` optional (Standard `/tmp/trinity-workspace-audit`). Diese Parameter sind ausschließlich für lokale Prüfung; nichts davon in die Server-`.env` eintragen. Der lokale Server muss denselben Produktionsbuild bedienen, dessen `.next/static/chunks` geprüft werden. Runs nacheinander und ohne parallele Browsertests ausführen.

14 Auth-/Workspace-Tests, TypeScript und Produktionsbuild bestanden. Der Browserlauf prüft zusätzlich den vollständigen Login bei 390 × 360 px, 44-px-Buttons, alle drei Formular-Modi mit abgefangenen Antworten und unveränderten Request-Formaten, vorgelesene Meldungen sowie Ziel-/Journalfelder. Vorhandene Palette-/Navigation-/Retry-/Suchrennen-Prüfung ebenfalls bestanden. Kein echter Mailversand. Die bekannte Turbopack-Trace-Warnung aus `lib/db.ts` / Shopify bleibt bestehen.

Referenz zur Messintegration: [Lighthouse mit Puppeteer](https://github.com/GoogleChrome/lighthouse/blob/main/docs/puppeteer.md).

## Staging und verbleibende Abnahme

Staging: https://trinity-stg.youareneo.com/login. Sechs ausgewählte Quell-/Paket-/Skriptdateien übertragen. Vorheriger Quellstand unter `/docker/mission-control-stg/.codex-backups/tempo-a11y-20261001/` gesichert. Das lokale Workspace-Testskript auf Staging entsprach noch PR #13; vor Ersetzen exakt gegen diesen bekannten Commit geprüft. Die Anwendungsdateien entsprachen PR #14. Deploy ausschließlich `docker compose up -d --build` in `/docker/mission-control-stg`; keine Konfigurationswerte oder anderen Dienste geändert.

Alle beauftragten Sprachphasen und Bedienbarkeits-Teile sind implementiert. Noch offen für den vom Nutzer verschobenen gemeinsamen Testtermin:

- Login, tatsächliche Mailzustellung/Magic Link/Recovery, Provision-Revoke und Sitzung unter `*.youareneo.com`.
- Reale Infomaniak-Transkription, Anthropic-Einordnung/Chat, Hermes-Freigabe und Worker; reale Quoten-/Zwei-Konten-Abnahme.
- VocalLab-Zugang und Zuordnung des konkreten Angebots, Sprachausgabe/Unterbrechung auf Geräten.
- Physischer iOS-/Android-Test: Mikrofon, Autoplay, PWA, Hintergrundwechsel; Graph-GPU/FPS bei 2.000 Knoten.
- Dieselben Lighthouse-Messungen auf angemeldetem Staging mit realen Daten sowie überspringbarem Erststart.

Produktion bleibt bis zur ausdrücklichen Freigabe unberührt. Gemeinsame Alt-Daten werden weiterhin nicht automatisch migriert oder privaten Konten zugeordnet.
