# Teil 2 – Bedienbarkeit auf Staging

Stand: 01.10.2026. Branch `codex/trinity-bedienbarkeit`, aufbauend auf PR #9 / PR #8. Nutzerfreigabe: „einfach weiter“, echte Integrationstests ausdrücklich auf später verschoben. Nur Staging: https://trinity-stg.youareneo.com.

## Umgesetzt

- Neue gemeinsame Arbeitsoberfläche mit fester Desktop-Navigation: Übersicht, Notizen, Aufgaben, Projekte, Notebooks/Ziele, Labor, Einstellungen und Archiv-Link. Mobile Tab-Leiste: Übersicht, Notizen, Aufgaben, Mehr. Die beiden permanenten Seitenleisten verdrängen den Hauptinhalt nicht mehr.
- Befehlspalette über sichtbare Suche, `⌘K` oder `Ctrl+K`: Seiten, Aktionen, eigene Notizen, eigene Aufgaben aus Notizen, Projekte und Tags. Pfeiltasten/Home/End, Enter, Escape; nativer modaler Fokusbereich und Rückkehr zum Auslöser. Zuletzt verwendete IDs werden pro Benutzer lokal gespeichert; keine Auth-Sitzung in localStorage.
- `?` öffnet die Tastenkürzel-Hilfe außerhalb von Eingabefeldern. `Alt+N` bleibt für Aufnahme erhalten.
- Neue Startseite mit direkten Arbeitsschritten. Die bisherige Gesamtübersicht bleibt unter `/dashboard/labor/uebersicht` erhalten. Halb fertige Integrationen und Link-Sammlungen liegen im Labor. Doppelte Alt-Routen sind nicht gelöscht, aber nicht länger Teil der Standardnavigation.
- Eigene Projekte unter `/dashboard/projekte`. Neue Projekte verwenden die bestehende Supabase-Tabelle und bestehende RLS; lokale Kanban-Projekte werden nicht stillschweigend umgedeutet oder migriert.
- Erste Einrichtung: Name → erstes Projekt → erste Textnotiz. Jederzeit überspringbar; Abschluss/Überspringen wird im eigenen Auth-Profil gespeichert und gilt geräteübergreifend. Dieser Ablauf versendet keine Mail und ruft kein KI-Modell auf. Er ändert keine bestehenden `neo_profiles`-Zeilen.
- Gemeinsame Lade-, Leer- und Fehlerkomponenten, Dashboard-/Notiz-Fehlergrenzen, sichtbare Suchfehler mit Wiederholen, Ladezustand der Notizliste und Projekte. Unabhängige Suchanfragen werden abgebrochen; verspätete Ergebnisse überschreiben keine neuere Suche.
- Bestehende Aufgaben- und Notebook-Seiten für schmale Bildschirme angepasst; 44-px-Bedienflächen in der neuen Oberfläche und den Dashboard-Inhalten, zusätzliche Labels für Formulare und Symbolbuttons. Notebook-Panel erst auf Wunsch, innerhalb eines Dialogs; nach erstem Öffnen bleibt sein Zustand beim Schließen erhalten.
- Fokus-Timer läuft in einer kleinen eigenen Komponente weiter, auch wenn das Notebook geschlossen ist. Audio-Player, Notebook, Completion-Dialog, Recorder und Kanban werden bei Bedarf geladen. Die große alte TopBar und Sidebar gehören nicht mehr zum gemeinsamen Einstieg. Unnötiger gemeinsamer Kanban-GET und globaler Agenten-GET entfallen; Agenten werden auf den benötigten Seiten geladen.
- Dashboard-Identität wird serverseitig geprüft/gerendert; Anzeige-Metadaten sind keine Berechtigungsquelle. Schriftfamilien außerhalb von Inter werden nicht mehr auf jeder Seite vorgeladen. Standard-Favicon vorhanden; Login-Kontrast verbessert.
- Der Env-Editor liest oder schreibt keine Serverdateien mehr. Seine Route antwortet bewusst mit HTTP 410. Das Eingabeformular samt neuem localStorage-Schreiben von API-Schlüsseln ist entfernt. Vorhandene Server-Secrets oder eventuell früher im Browser gespeicherte Schlüssel wurden weder ausgelesen noch verändert.

## Daten und Grenzen

Die Inhaltssuche verwendet ausschließlich `trinity_notes` und `trinity_projects`, mit geprüftem Benutzer und explizitem `user_id` zusätzlich zur bestehenden RLS. Aufgabentreffer sind eigene Notizen vom Typ `aufgabe`; Tags stammen ausschließlich aus eigenen Notizen. Pro Suche höchstens drei begrenzte Abfragen (maximal 20 Treffer je Abfrage), keine Schleife über Projekte/Notizen und kein Service-Role-Zugriff. Bestehende Volltext-, Eigentümer- und Projektindizes werden verwendet; kein neues Schema und keine spekulative Migration.

Die lokalen Boards, Ziele, Journale und gemeinsamen Datei-APIs bleiben Altbestände. Die neue Suche liest sie nicht. Die Umstellung ihrer Eigentümerschaft ist weiterhin eine fachliche Entscheidung und keine bereits erledigte Datenmigration. Labor-Seiten können weiterhin eigene ältere Detailzustände/englische Texte enthalten; die gemeinsame Navigation und Fehlergrenze sind erneuert, die jeweiligen externen Anwendungen nicht. Vorhandene Daten und FuseBase-Rückfalloption bleiben erhalten.

`neo_profiles`, Provision-Payloads, Cookie-Name/-Domain, Login-/Magic-Link-/Recovery-Verträge, Hermes-Freigabe und Infomaniak-Provider sind unverändert. Die Umgebungswerte wurden nicht bearbeitet. Kein VocalLab, kein `/gehirn`, keine 3D-Bibliothek; Sprach-Phase 2 und Bedienbarkeits-Teil 3 bleiben separate Freigaben.

## Schnittstellenänderungen

| Schnittstelle | Vertrag |
|---|---|
| `GET /api/search?q=...` | Authentifizierung erforderlich; `q` bis 120 Zeichen. Antwort `{ success: true, userId, items: [{ id, label, href, group, keywords? }] }`. Begrenzte aktuelle Treffer, keine vollständige Bestandszählung. Fehler über vorhandenes Fehlerformat, keine gemeinsamen Alt-Daten. |
| `POST /api/onboarding` | Angemeldeter eigener Benutzer, gleiche Origin-Prüfung wie übrige Schreib-APIs. `{ name?: string, complete?: true }` → `{ success: true }`. Name 1–80 Zeichen. Schreibt nur `user_metadata.trinity_display_name` und/oder `user_metadata.trinity_onboarding_complete`; keine Rollen/Rechte. |
| `GET /api/notes?id=<UUID>` | Neuer optionaler Filter auf genau die eigene Notiz. Bisherige Filter und Antwort unverändert. |
| `GET/POST /api/settings/env` | HTTP 410, `{ ok: false, error: "Die Server-Konfiguration wird außerhalb der App verwaltet." }`; kein Lesen/Schreiben von Dateien oder Keys. |
| `GET /api/auth/me` | Unveränderte Form; `displayName` bevorzugt einen vom Nutzer im neuen Onboarding gesetzten Anzeigenamen, sonst den bestehenden Profilnamen. |
| `/notiz` | Optionale URL-Parameter `note`, `project`, `tag`, `type` für Suchtreffer; `rec=1` bleibt. |

Keine neuen Env-Variablen für Staging. `TEST_BROWSER_PATH` und optional `TEST_BASE_URL` sind nur lokale Testparameter, keine Server-Konfiguration.

## Technische Prüfung

- TypeScript erfolgreich; Next-Produktionsbuild erfolgreich. Bekannte bestehende Turbopack-Tracing-Warnung über `lib/db.ts` / Shopify bleibt (kein neuer Buildfehler).
- 6 Auth- und 12 Voice-Regressionstests bestanden. Provider/SMTP sind dabei simuliert; keine echte Mail, Transkription oder Hermes-Ausführung.
- 8 neue Workspace-Tests: Suchnormalisierung/Mehrwortsuche, Reihenfolge/Recents, Tastaturgrenzen, vier gültige mobile Ziele, konkrete Notizlinks, benutzergebundene und begrenzte REST-Abfragen mit Sonderzeichen, sichtbare Datenfehler, geschlossener Konfigurations-Endpunkt.
- Lokaler Browser-Test mit ausschließlich fiktiven Daten und abgefangenen API-Aufrufen: Palette öffnen/fokussieren, Aktion mit Tastatur aufrufen, eigene Aufgabe per Notizlink öffnen, Suchfehler wiederholen, alte Anfrage verwerfen, Hilfe/Escape, vier ≥44-px-Tabs und Hauptinhalte bei 390 px. Keine JavaScript-Seitenfehler in diesem Lauf. Test ist auf localhost beschränkt, keine echten Konten/Schlüssel.
- Öffentliche Staging-Notizseite und ihre Palette nach Deploy sichtbar geprüft. Angemeldete Abnahme, neue Lighthouse-Werte/Medianvergleich, RLS-Live-Abnahme, echter Handy-/Mail-/Infomaniak-/Hermes-Test sind auf Nutzerwunsch **noch offen**. Die alten Werte aus `TRINITY-INVENTAR.md` sind ausschließlich die historische Baseline; die Zielwerte ≥90/≥95 werden hier nicht als erreicht behauptet.

Lokale Wiederholung:

```sh
npm run test:auth
npm run test:voice
npm run test:workspace
npx tsc --noEmit
npm run build
# Separater lokaler Server, niemals diese Test-Konfiguration auf Staging setzen:
AUTH_PROVIDER=fusebase AUTH_APP_URL=http://127.0.0.1:3308 npx next start --hostname 127.0.0.1 --port 3308
# In einem zweiten Terminal, TEST_BROWSER_PATH zeigt auf lokalen Chromium/Chrome:
npm run test:workspace:browser
```

Der Browser-Test liefert alle API-Antworten selbst. Die reale private Suche/RLS wird damit nicht end-to-end bewiesen. Für den späteren Live-Termin: zwei Konten, fremde Notiz-ID/Projekt/Tag, fehlender/entzogener Zugang, wiederholtes Setup/Überspringen und Rückkehr nach Logout prüfen. Danach dieselben fünf Seiten dreimal mit kaltem HTTP-Cache messen; bei Dashboard sowohl Erststart-Dialog als auch eingerichteten Zustand unterscheiden. Offene Integrationsabnahme von #7/#8 bleibt getrennt.

## Deployment und spätere Abnahme

Source-Backup der überschriebenen Staging-Dateien liegt unter `/docker/mission-control-stg/.codex-backups/part2-20261001-1/`; kein Konfigurations-/Secret-Backup. Nur geänderte Anwendungsdateien übertragen; `docker-compose.yml` und `.env` nicht überschrieben. Deploy ausschließlich mit `docker compose up -d --build` in `/docker/mission-control-stg`. Keine Produktion, kein Traefik-Neustart, keine DNS-/Portal-/n8n-/Medien-Änderung.

Zum späteren Ausprobieren: https://trinity-stg.youareneo.com → Einrichtung durchgehen oder überspringen → `⌘K`/`Ctrl+K` → Notiz/Projekt finden → am Handy die vier Tabs benutzen. Infomaniak-/Mail-/Hermes-Abnahme erst zum gemeinsamen Testtermin. Dieser PR bleibt bis zur Abnahme ein Draft.
