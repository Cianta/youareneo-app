# Trinity Produktionsveröffentlichung · 02.10.2026

Nach ausdrücklicher Freigabe des Nutzers auf `https://trinity.youareneo.com` veröffentlicht. Laufzeitcode: `b36e1575dbc76e42faeb1425b300d8d7492ae631`, Image `mission-control:release-b36e157`. Enthält den fertigen Stand bis PR #17: Supabase-Login, Sprachnotizen/PWA/Hermes-Freigabe, Navigation/Befehlspalette, Wissensgraph, Sprachchat/Avatar sowie Meine Apps mit Radio Eden und Küchenschatzbuch. Externe alte Räume werden verlinkt; ihr Code und ihre Daten wurden nicht migriert.

## Deployment

Nur `/docker/mission-control` angefasst. 337 versionierte Dateien installiert und geprüft; vorab gleicher Runtime-Stand mit Staging verglichen. Keine fremden Zusatzrouten im Produktionsquellcode. Vorhandene Compose-Labels, Produktionsvolumen und Netzwerk erhalten; Build auf lokale Quelle umgestellt. Start ausschließlich über `docker compose up -d --build`. Kein Traefik-Neustart.

Code und alte Compose-Konfiguration gesichert unter `/docker/mission-control/.codex-backups/production-20261002T101632Z-b36e157`. Vorheriges Image erhalten: `sha256:11dd628effde41028071c616d66653489f7717f2033fc5bfdf9910f81001d2f0`. Kein Löschen von Nutzerdaten, Containervolumen, Konten oder Profilen.

Produktions-Konfiguration siehe `deploy/docker-compose.production.yml`; Secret-Einbindung und ihre Staging-Abhängigkeit sind in der Login-Übergabe dokumentiert. Schlüsseldateien werden vom Nutzer gepflegt und wurden nicht verändert.

## Prüfung

- Alle sechs lokalen Testgruppen erfolgreich: Auth, Voice, Workspace, Brain, Chat und Apps. Simulierte HTTP-/KI-Antworten; keine echten Mails, Kontenänderungen oder KI-Aufrufe.
- Produktionsbuild einschließlich TypeScript erfolgreich. Bestehender Next.js-Dateitracing-Hinweis aus `lib/db.ts` bleibt.
- Laufender Produktionscontainer bestätigt richtige Origin, Supabase-Projekt, Infomaniak-Provider und vorhandene Konfiguration für Transkription, Klassifizierung und Hermes. Anon-Key direkt von Supabase `/auth/v1/settings` mit HTTP 200 akzeptiert. Dies prüft die Konfiguration, nicht die Leistung oder Zugangsrechte des KI-Produkts.
- 29 öffentliche HTTP-Prüfungen erfolgreich, zusätzlich elf Login-Assets: Login, Linkbestätigung, Passwortformular, Notiz, Sprachchat, Graph-Shell und Manifest mit HTTP 200; alle neun App-Bilder mit HTTP 200.
- Meine Apps/Radio/Kochbuch ohne Sitzung mit 307 auf **Produktions**-Login. Graph-Shell ist öffentlich, Graph-API verlangt eine Sitzung. Auth-/Notiz-/Voice-/Brain-/Hermes-APIs ohne Sitzung bzw. Hermes-Token mit HTTP 401. Leere Auth-Anfragen mit 400; Provision/Revoke ohne Secret mit 401. Keine privaten Inhalte gelesen.
- Supabase: vorhandene Tabellen `neo_access`, `neo_profiles`, `trinity_notes`, `trinity_projects`, `hermes_queue`, `usage` haben RLS; Graph- und Speicherfunktionen vorhanden. Nur Metadaten gelesen, keine Migration ausgeführt.
- Exakter Produktions-Redirect in Supabase zusätzlich gespeichert und angezeigt; vorhandener Staging-Eintrag erhalten. Allgemeine Site URL nicht verändert.
- Browser auf Meine Apps geöffnet; ohne Sitzung erscheint korrekt der neue NEO-Login.

Echte Anmeldung, Magic-Link-Zustellung, Passwortwechsel, gemeinsame Sitzung im Archiv, Transkription, Sprachchat/TTS, Hermes-Ausführung und Handy/PWA-Abnahme wurden wie vom Nutzer zuvor gewünscht nicht vorgezogen. Keine Behauptung einer vollständigen Live-Abnahme. Keine automatische Bearbeitung oder Ausführung von Hermes-Aufträgen.

## Nutzung

`https://trinity.youareneo.com/login` öffnen und mit dem bestehenden NEO-Konto anmelden oder selbst einen Magic Link anfordern. Danach `https://trinity.youareneo.com/dashboard/apps`: Radio Eden hören oder eigene Rezepte speichern. Notizen und Merkliste gehören dem angemeldeten Konto. Die externen alten Räume sind klar als solche gekennzeichnet.

## Rückfall

Vor einer Rücknahme prüfen, dass seit diesem Deployment niemand neue Produktionsdateien geändert hat. Die Sicherung enthält `source-before.tar`, `new-files.json`, `docker-compose.before.yml`, Release-Manifest und die vorige Image-ID. Neue Dateien nur anhand dieser Liste entfernen, vorherige Quelldateien und Compose wiederherstellen, den Build-Kontext auf die wiederhergestellte lokale Quelle setzen und ausschließlich im Produktionsordner `docker compose up -d --build` ausführen. Das alte Compose hatte einen älteren Remote-Build-Kontext; unverändertes Wiederaufbauen dieses Remote-Kontexts würde nicht den gesicherten lokalen Planner-Stand herstellen. Keine Volumen oder Daten löschen.

Für den FuseBase-Rückfall im neuen Code kann `AUTH_PROVIDER` in der Produktions-Compose auf `fusebase` gesetzt werden (aktuell hat diese Compose-Einstellung Vorrang vor der `.env`). Anschließend ebenfalls `docker compose up -d --build`. Vorhandene FuseBase-Dateien, Variablen und Mail-Datei bleiben erhalten.
