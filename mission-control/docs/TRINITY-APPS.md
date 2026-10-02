# Meine Apps · Umzugsprüfung und Ausbau auf Staging

Stand: 02.10.2026. Branch `codex/trinity-meine-apps`, aufbauend auf PR #16. Neue Nutzerfreigabe: übrige Apps prüfen/verbessern, unter „Meine Apps“ mit Bildern verbinden, Radio als 60er-Kneipenradio zwischen Garage und viktorianischem Garten Eden, Kochbuch als verwunschenes viktorianisches Schatzbuch. Nur `/docker/mission-control-stg`; Produktion und externe Anwendungen bleiben unverändert.

## Ergebnis der Umzugsprüfung

Der Umzug ist für die übrigen Apps **nicht vollständig nachgewiesen**. Das aktuelle Repository (einschließlich `main`, geprüft am 02.10.) enthält für die neun Apps unter `apps/` nur README-Platzhalter. Öffentliche Abrufe der sechs bestehenden App-Domains liefern zwar HTTP 200, aber einen JavaScript-Redirect nach `you-are-neo.nimbusweb.me/auth/`. Ein HTTP-200 allein ist daher kein bestandener App-Test. Das Archiv liefert seine eigene Oberfläche; `/apps` liefert dort dieselbe Archiv-Hülle und ist kein bestätigtes App-Verzeichnis.

| App | Geprüftes Ziel / Quelle | Stand | Gestaltung und nächster Arbeitsschritt |
|---|---|---|---|
| Radio | `radio.youareneo.com`, Radio-Prototyp in `memberspot/radio/radio.html` | Alte Domain führt zu FuseBase; neuer nativer Radio-Raum auf Trinity-Staging | Nussbaum, Messing, Stofflautsprecher, bernsteinfarbene Skala und Pflanzenlinien. Sender suchen, starten, pausieren, Lautstärke, im eigenen Konto merken. |
| Kochbuch | `apps/kochbuch/README.md`, lokales `workspace/kochbuchprojekt.html` | Vorhandener HTML-Entwurf nur Ankündigung; kein bestätigtes aktives Ziel. Neuer privater Rezeptbereich auf Trinity-Staging | Dunkelgrüner Einband, botanisches Ornament, Papierseiten. Eigene Rezepte erstellen, lesen, nach Zutaten/Jahreszeit filtern, weitere Seiten laden. |
| Visual Room | `visual-room.youareneo.com`, eigener älterer Quellstand `workspace/visual-room-codex-next` | Domain noch FuseBase; Quellstand verwendet eigene Supabase-Anmeldung `neo-auth`, nicht Trinitys SSR-Cookie | Gläsernes Gewächshaus, Lichtbilder auf Wasser. Aktuellen Deploy-Quellstand bestätigen, dann Cookie-Anbindung und sparsame optionale Effekte. Nicht aus dem alten Memberspot-Baum überschreiben. |
| Kinoraum | `apps/kinoraum/README.md`, Ankündigungs-HTML, älterer `memberspot/kinosaal/PLAN.md` | Kein bestätigtes aktuelles Ziel; die geprüften Namen kinoraum/kinosaal/kino lösen hier nicht auf | Salon-Kino mit Samt, Messing und klarer Programmliste. Aktuellen Katalog und Player-Quellstand bestätigen; Memberspot-Kurse nur über erlaubte bestehende Links. |
| Frequency Room | `frequency.youareneo.com`, lokale Entwürfe | Domain noch FuseBase; ältere HTML-Skizze bietet teilweise nur Klickeffekte/Alerts statt Synth/REC | Analoge Klangwerkstatt, Bakelitregler, Oszilloskop. Echte Audio-/MIDI-Funktionen am aktuellen Quellstand prüfen, danach UI und Ressourcenbereinigung. |
| Good News | `good-news.youareneo.com`, lokale HTML-Skizze | Domain noch FuseBase; Entwurf enthält erfundene Beispielmeldungen und optische Filter, keinen belegten Live-Feed | Ruhige Zeitungsstube. Zuerst reale Quellen und Datum, dann funktionierende Filter; Beispielmeldungen nie als aktuelle Nachrichten veröffentlichen. |
| Art Atelier | `art.youareneo.com`, lokale HTML-Skizze | Domain noch FuseBase; im Entwurf zahlreiche Alerts/Klickeffekte ohne echte Upload-/Speicheranbindung | Helle Orangerie mit großer Zeichenfläche, Leinen, Farbtuben, Kolibri. Zeichnen/Upload/Export und private Speicherung an aktueller Quelle prüfen. |
| Living Arts Room | `living-arts-room.youareneo.com`, lokale HTML-Skizze | Domain noch FuseBase; Entwurf mit externem Beispielbild, keine bestätigte private Bildbibliothek | Garten-Salon mit Bilderrahmen, Kamin und optionalem Tageslicht. Tatsächliche Bibliothek/Zugriffsrechte vor Integration bestätigen. |
| Trinity OS | `/dashboard` | Neue gemeinsame Arbeitsoberfläche vorhanden; vollständige echte Abnahme weiter offen | Ruhiger grüner Schreibtisch. „Meine Apps“ als fester Einstieg, vorhandene Arbeitsbereiche bleiben erhalten. |

Die gefundenen lokalen älteren Entwürfe sind Referenzmaterial, kein Beweis, dass sie nach dem Umzug der aktuelle Deploy-Quellstand sind. FuseBase, Memberspot, Portal, Medien-Dienst, DNS und Traefik wurden nicht verändert. Keine alten Daten gelöscht, kopiert oder automatisch einem Konto zugeordnet.

## Auf Staging umgesetzt

- `/dashboard/apps`: alle neun Räume mit eigenen kleinen lokalen SVG-Illustrationen, fester Route und ehrlicher Anzeige des aktuellen Zugangs. In Hauptnavigation, Übersicht, Labor und Befehlspalette erreichbar. Galerie als Server-Komponente; keine Iframes, automatischen Audio-/Providerabrufe oder WebGL-Bibliothek auf dieser Seite. App-Links haben `prefetch=false`.
- `/dashboard/apps/radio`: eigener Radio-Raum mit nativer HTML-Audiowiedergabe. Public Radio-Browser-Suche mit zwei festen Spiegeln, maximal zwei parallelen Suchanfragen, 7 Sekunden Timeout pro Spiegel, Abbruch bei Suchwechsel/Verlassen, 5 Minuten Cache mit höchstens 24 Einträgen. Nur HTTPS-Streams ohne URL-Zugangsdaten; Sender nach UUID dedupliziert. Kein fingierter Audiometer, keine Daueranimation, kein Autoplay; Audio stoppt beim Verlassen. Merkliste aus eigenen privaten Notizen.
- `/dashboard/apps/kochbuch`: eigener Rezeptbereich im Schatzbuch-Stil. Titel, Zutaten, Zubereitung, Jahreszeit; erst nach Knopfdruck speichern. Ein fehlgeschlagener identischer Speicherversuch verwendet dieselbe UUID, passend zur bestehenden idempotenten Notiz-API. Entwurf bleibt bei Fehler erhalten. Nativer aufklappbarer Text statt schwerem Editor, Filter auf den geladenen Seiten, weitere Seiten nachladen, eigener Lade-/Fehler-/Leerzustand.
- `/dashboard/apps/[slug]`: sechs feste Detailseiten mit Gestaltungsausblick und bestätigtem bisherigen Link, sofern vorhanden. Keine Tokens in Link-URLs oder Client-Code. Der Browser sendet das bestehende `.youareneo.com`-Cookie entsprechend seiner Domain-Regel auch an diese Subdomains; daraus folgt noch keine Unterstützung durch deren alten Login. Externe Ziele öffnen ausdrücklich einen neuen Tab. Kinoraum wird mit seinem offenen Stand angezeigt, ohne erfundene Ziel-URL.

## Gemeinsames Konto und Datenvertrag

Die **neuen nativen** Bereiche nutzen Trinitys bestehenden Login und Cookie. Der Rezeptbereich verwendet `trinity_notes` mit Tag `kochbuch` und Jahreszeit-Tag, Typ `notiz`, Quelle `text`; Zutaten/Zubereitung stehen als lesbarer Text in `transcript`. Radio-Merkungen verwenden Tag `radiofavorit`, Titel = Sendername, `transcript` = validiertes JSON `{ id, name, stream, country, tags }`. Dadurch bleiben Inhalte über dieselbe Notizsuche erreichbar. Diese Tags führen keine separaten Konten oder Berechtigungen ein.

`GET /api/auth/me` prüft die Identität für Sammlungsladen; `GET /api/notes?tag=...&before=...` liest höchstens 50 eigene Einträge pro Seite. Bei Kontowechsel werden alte Einträge, alte Seitencursor und kontengebundene Speicher-Wiederholungs-IDs verworfen, bei 401/403 die lokale Sammlungsanzeige geleert. Fehler beim Nachladen behalten bisher geladene Seiten und den fehlgeschlagenen Cursor für „Wiederholen“. `POST /api/notes` bleibt FormData mit `id` und `note`, ausschließlich nach ausdrücklicher Nutzeraktion. Serverautorisierung und RLS bleiben maßgeblich. Keine Auth-Sitzung, Rezepte oder Merkliste in localStorage.

Die bestehenden RLS-Policies für `trinity_notes`, `trinity_projects`, `neo_access` und `neo_profiles` wurden am 02.10. **nur gelesen**. Notiz-Lesen ist an `auth.uid() = user_id` gebunden; Erstellen zusätzlich an `trinity_can_save()`. Kein Schema, keine Policy, keine Profile und keine Produktrechte geändert. Eine gemeinsame Cookie-Domain kann nur Apps verbinden, die denselben serverseitigen Auth-Vertrag implementieren; die alten FuseBase-Domains tun das momentan nicht. Keine automatische Konten- oder Sammlungsübernahme behauptet.

**Neue Env-Variablen: keine.** Kein neuer API-Endpunkt, Cookie-Name, Produktname oder Tabellenfeld. Die neuen Tags und UI-Routen sind hier und im verbindlichen Bedienbarkeitsauftrag dokumentiert. Vorhandene FuseBase-Rückfalloption bleibt bestehen.

## Prüfungen

- 5 neue Tests: neun eindeutige Galerie-Einstiege/Illustrationen, kompatibles Rezeptformat und Längen, sichere Senderdaten, Spiegelwechsel/Cache/Deduplizierung und Abbruch veralteter Suche.
- Bestehende 8 Workspace- und 13 Voice-Tests bestanden. TypeScript und Produktionsbuild bestanden. Bekannte bestehende Turbopack-Tracing-Warnung über Shopify bleibt.
- Browser mit ausschließlich lokalen Fixtures: neun Karten und Bilder, sechs Detailseiten, Mobilansicht ohne horizontalen Inhaltsüberlauf und aktive Bedienelemente mindestens 44 px; Rezept erstellen mit fehlgeschlagenem Versuch und idempotentem Wiederholen, Lesen, Suche/Zurücksetzen, Fehler/Wiederholen, Kontowechsel, 50/51-Seiten-Nachladen samt Fehler und Cursor; Radio-Deduplizierung, kein Autoplay, simulierte Wiedergabe, Konto-Merkliste, schnelle Suchwechsel, Verzeichnisfehler und Audio-Cleanup beim Seitenwechsel. Keine JavaScript-Seitenfehler. Keine realen Konten/Schreibzugriffe oder Streams im Browser-Test.
- Öffentliches Radio-Verzeichnis zusätzlich read-only abgefragt: HTTP 200, CORS `*`, HTTPS-Ergebnisse. Zwei begrenzte 1024-Byte-Streamproben: HTTP 200 mit `audio/mpeg` bzw. HTTP 206 mit `audio/aacp`; kein Konto und kein kontinuierliches Streaming.
- Drei kalte mobile Lighthouse-Läufe pro neuer Seite auf dem Aufbaustand `bf8199e` (Lighthouse 13.5.0, 412×823, DPR 1,75, simulierte Mobilverbindung und CPU 4×): **alle drei Seiten Median 96 Performance / 100 Accessibility**, CLS 0, keine Konsolenfehler, keine schweren 3D-Chunks. LCP ca. 2,78 s; TBT 13–14 ms. JavaScript entpackt: Galerie 579.091 B, Radio 592.795 B, Kochbuch 589.088 B. Die Summe enthält die gemeinsame Next-/React-Hülle, keine neuen großen Bibliotheken. [Messwerte](audits/2026-10-02-local-apps/lighthouse-summary.json). Lokale Fixtures sind kein Ersatz für authentifizierte Staging-/Handy-/Alt-App-Abnahme.

Lokal wiederholen:

```sh
npm run test:apps
npm run test:workspace
npm run test:voice
npx tsc --noEmit
npm run build
# Separater lokaler Server, keine Änderung der Staging-Konfiguration:
AUTH_PROVIDER=fusebase AUTH_APP_URL=http://127.0.0.1:3308 node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3308
# TEST_BROWSER_PATH auf den vorhandenen Chromium-Browser setzen:
npm run test:apps:browser
npm run audit:apps:local
```

## Reihenfolge für die übrigen Apps

1. Aktuelle post-move URLs und Deploy-Quellstände bestätigen. Die bisherige harte VPS-Grenze lässt nur Mission Control/Staging zu; keine Änderungen an `/docker/medien` oder Claude-Quellen daraus ableiten.
2. Visual Room/Kinoraum am bestätigten Quellstand mit demselben Cookie-Vertrag verbinden; Datenbesitz und bestehende Speicherkeys prüfen. Vorhandene Profile/Konten/Sammlungen erhalten.
3. Frequency Room: Audiofreigabe, Synth/MIDI/Recording, Touch/Tastatur, Stop/Unmount; keine animierten Schein-Funktionen.
4. Art Atelier und Living Arts: echte private Bildspeicherung/Upload/Export und Sammlung, danach gemeinsame Galerie.
5. Good News: bestätigter Nachrichtenfeed mit Quellen/Datum und echten Filtern; danach Zeitungsgestaltung.
6. Je App kalte Mobile-Lighthouse-Läufe, Konsolen-/Bundleprüfung und reale Kernabläufe; Ziel ≥90 Performance und ≥95 Accessibility, erst nach Messung als erreicht bezeichnen.

Die übrigen sechs Räume haben heute verlässliche Trinity-Einstiege und eigene Gestaltungsideen, aber noch keinen vollständigen funktionalen Umbau. Der angemeldete Live-Test und die spätere Produktionsfreigabe bleiben getrennte Schritte.

## Staging-Auslieferung

Quelle vor dem Überschreiben gegen den bekannten PR-16-Stand geprüft; 29 Anwendungs-/Test-/Bilddateien installiert. Quellsicherung: `/docker/mission-control-stg/.codex-backups/apps-20261002/` (`source-before.tar`, Liste neuer Dateien). Deployment ausschließlich `docker compose up -d --build` in `/docker/mission-control-stg`. Die erste Auslieferung ist gestartet; anonyme Aufrufe der drei neuen Dashboard-Routen leiten nach `/login`, `/api/notes` bleibt HTTP 401, Radio-Illustration HTTP 200. Die angemeldeten fachlichen Abläufe sind bislang lokal mit Fixtures geprüft, kein erfundener Live-Kontentest.
