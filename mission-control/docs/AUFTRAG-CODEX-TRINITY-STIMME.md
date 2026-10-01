# Auftrag an Codex: Stimme, Sprachnotizen und Avatar für Trinity

Stand 27.09.2026. Baut auf dem Supabase-Login (PR Cianta/youareneo-app#7) auf. Erst anfangen, wenn PR #7 gemergt ist oder als Basis-Branch dient. Nur Staging (`trinity-stg.youareneo.com`, `/docker/mission-control-stg`), Produktion erst nach Freigabe durch den Nutzer.

## Ziel

Trinity wird die persönliche Arbeitsoberfläche („OS“) für Mitglieder: sprechen statt tippen, Notizen landen sofort richtig eingeordnet, Trinity antwortet mit Stimme. Hermes (separater Agent) liest die Notizen und führt mit „hermes“ markierte Aufträge aus.

**Nutzungsmodell:** Nutzen ist frei. **Speichern** (Notizen, Verlauf) nur mit aktivem Zugang `foerder` in `neo_access`. Später kommt ein Einmalkauf dazu (Produkt `app`), bitte die Prüfung so bauen, dass eine Liste erlaubter Produkte reicht (`['foerder','app']`).

**Name:** Der Produktname steht noch nicht fest. App-Name und Assistentinnen-Name („Trinity“) nur aus Konfiguration lesen (`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_ASSISTANT_NAME`), nirgends fest im Code.

## Phase 1 – Sprachnotizen („TrinityCal“)

1. **Installierbar als App (PWA):** `manifest.webmanifest`, Icons, `display: standalone`, Service Worker nur für die Hülle. Manifest-`shortcuts`: „Neue Sprachnotiz“ → `/notiz?rec=1` (startet direkt die Aufnahme). So entsteht das Symbol auf dem Handy-Startbildschirm.
2. **Aufnahme:** großer Mikrofon-Knopf, `MediaRecorder` (webm/opus, auf iOS mp4/aac), Pegelanzeige, Pause/Weiter. Im Browser Tastenkürzel `Alt+N` (Aufnahme starten/stoppen), überall in Trinity.
3. **Umwandlung in Text:** `POST /api/voice/transcribe` (Server). Anbieter hinter einer Schnittstelle `TranscriptionProvider`, per Env wählbar (`TRANSCRIBE_PROVIDER`):
   - `infomaniak` (`whisper`) als Standard; Nutzeränderung vom 27.09.2026, siehe unten.
   - `openai` (`gpt-4o-transcribe`) als ausdrücklich ausgewählter Rückfall.
   - Sprache Deutsch voreinstellen, Englisch erkennen.
   - **Audio nach erfolgreicher Umwandlung löschen**, außer der Nutzer hakt „Aufnahme behalten“ an (dann Supabase Storage, privater Bucket).
4. **Einordnen:** Claude (`claude-haiku-4-5`, Anthropic-SDK, Schlüssel nur serverseitig) liefert strukturiert (Tool-Use/JSON): `title`, `summary`, `type` (aufgabe | idee | notiz | termin), `project` (aus den vorhandenen Projekten des Nutzers wählen oder `null`), `tags[]`, `due` (ISO oder null), `assignee` (optional). Der Nutzer kann alles vor dem Speichern ändern.
5. **Speichern:** Tabelle `trinity_notes` (id, user_id, created_at, title, transcript, summary, type, project, tags, due, audio_path null, source `voice|text`), RLS: nur eigene Zeilen. Liste mit Suche und Filter nach Projekt, Typ und Tag.
6. **Hermes:** Notizen mit Tag `hermes` erzeugen eine Zeile in `hermes_queue` (note_id, instruction, status `wartet_auf_bestaetigung|freigegeben|erledigt|abgelehnt`, result). **Alles, was nach außen wirkt** (Mail, Kauf, Veröffentlichen, Löschen), braucht einen Klick „Freigeben“ in Trinity. Für Hermes einen Lese- und Status-Endpunkt `GET/PATCH /api/hermes/queue` mit eigenem Token (`HERMES_API_TOKEN`), später MCP.
7. **Handy ohne App-Öffnen:** eine Kurzanleitung für einen iOS-Kurzbefehl bzw. eine Android-Verknüpfung, die `/notiz?rec=1` öffnet. Einen **globalen** Mac-Kurzbefehl (außerhalb des Browsers) nur dokumentieren (Kurzbefehle-App/Raycast), nicht bauen.

## Phase 2 – Sprachchat mit Trinity

- Gedrückt halten zum Sprechen (und Umschalter „Freihändig“ mit Stille-Erkennung).
- Text → Claude (`claude-sonnet-5`, Streaming) mit Zugriff auf die eigenen Notizen als Kontext → Antwort als Text **und** Stimme.
- **Sprachausgabe** hinter `SpeechProvider`: `vocallab` (Nutzer hat Lifetime; verbindlicher Anbieter laut Nutzeränderung); Stimme pro Nutzer wählbar. Wiedergabe abbrechbar, sobald der Nutzer wieder spricht.
- Rückfall ohne Server-Kosten: Browser-`speechSynthesis`.

## Phase 3 – Avatar

- Kleine Figur oben rechts aus **Energielinien** (Canvas oder SVG, keine Bilddatei), vier Zustände: ruhig, hört zu (reagiert auf Mikrofonpegel über `AnalyserNode`), denkt, spricht (reagiert auf die Lautstärke der Sprachausgabe).
- Klick öffnet den Sprachchat. `prefers-reduced-motion` respektieren. Farben aus dem bestehenden Theme.

## Regeln

- **Kosten:** Minuten und Anfragen pro Nutzer und Monat zählen (`usage`-Tabelle), Obergrenze per Env (`VOICE_MINUTES_PER_MONTH`), freundliche Meldung bei Erreichen.
- **Datenschutz:** keine Audios oder Transkripte in Logs. In der App kurz erklären, welcher Anbieter was verarbeitet.
- **Schlüssel** (`INFOMANIAK_AI_PRODUCT_ID`, `INFOMANIAK_API_TOKEN`, `ANTHROPIC_API_KEY`, optional `OPENAI_API_KEY`, später `VOCALLAB_API_KEY`, `HERMES_API_TOKEN`) trägt der Nutzer selbst in die Staging-`.env` ein. Leere Platzhalter und eine Liste liefern, niemals Werte in Chat, Code oder Commits.
- Die Aufnahme- und Notiz-Komponente wiederverwendbar bauen (eigene Komponente plus API). Claude nutzt sie später für Zeitstempel-Notizen im Kinoraum.
- Nur `/docker/mission-control-stg` und das Repo anfassen. Nichts an Traefik, n8n, `archiv`, `medien`, DNS, Make oder Memberspot.
- Deutsche Oberfläche. Tests für: Rechteprüfung (ohne `foerder` nichts speichern), RLS, Hermes-Freigabe, Kostenlimit.
- Änderungen und neue Env-Variablen in „Änderungen durch Codex“ dokumentieren. Pro Phase ein eigener PR, Staging-Link an den Nutzer.

## Änderungen durch Codex

Phase 1 auf `codex/trinity-voice-phase1`, aufbauend auf PR #7 (`codex/trinity-supabase-login`). Keine Phase 2/3 und kein Produktionsdeploy.

- `/notiz` ist der neue kostenlose Arbeitsraum, auch ohne Förderzugang. Aufnahme und Textentwurf funktionieren ohne Anmeldung; KI-Anfragen benötigen ein NEO-Konto zur individuellen Kontingentzuordnung. Speichern von Notizen, Projekten und Audio wird in API **und RLS** durch aktive Produkte aus `['foerder','app']` geschützt. Die Liste steht in `lib/voice/contracts.ts` und der SQL-Funktion `trinity_can_save()`; Änderungen müssen beide Stellen aktualisieren. Der bisherige Dashboard-Zugang bleibt unverändert.
- App- und Assistentinnen-Namen kommen zur Laufzeit aus `NEXT_PUBLIC_APP_NAME` und `NEXT_PUBLIC_ASSISTANT_NAME`; Fallbacks sind neutral. Bestehende Datenbank-, Cookie-, localStorage-Schlüssel und externe Integrationspfade bleiben aus Kompatibilitätsgründen stabil. Neue Entwürfe, Audio und Auth werden nicht in localStorage persistiert.
- `manifest.webmanifest`, PNG-Icons, App-Shortcut `/notiz?rec=1` und Service Worker. Der alte Proxy-Cache wird entfernt; nur öffentliche Offline-Seite und Icons werden gecacht. Anleitung in `/notiz/hilfe`. Browser können für Mikrofon/AudioContext einen zusätzlichen Tipp verlangen; systemweite Mac-Automation wird nur dokumentiert.
- `VoiceRecorder` und `NoteWorkspace` sind wiederverwendbare Komponenten. WebM/Opus bzw. MP4/AAC wird per `MediaRecorder.isTypeSupported` gewählt; Pause, Weiter, Pegelanzeige und Alt+N sind enthalten. Aufnahmen maximal fünf Minuten / 20 MB. Der Server prüft die wirkliche Audiozeit durch Dekodierung mit FFmpeg. Temporäre Audiodateien werden auch bei Fehlern entfernt.
- `TranscriptionProvider`: Infomaniak `whisper` und optional OpenAI `gpt-4o-transcribe` implementiert. Deutsch/Englisch werden standardmäßig automatisch erkannt; Deutsch kann explizit bevorzugt werden. Infomaniak `whisper` ist der Standard; OpenAI wird nur bei expliziter Auswahl genutzt. Amical wurde auf Nutzerwunsch entfernt, da keine Server-API existiert.
- Anthropic-SDK mit `claude-haiku-4-5` und erzwungenem Tool-Use. Alle strukturierten Felder werden validiert und bleiben vor dem Speichern bearbeitbar. Keine automatische Ausführung von Modellvorschlägen.
- Neue Tabellen `trinity_notes`, `hermes_queue`, `usage` und `trinity_projects`; alle mit RLS. Zusätzlich zu den beauftragten Notizfeldern: `assignee` und generierte `search_document` für deutsche Volltextsuche. `project` ist ein benutzereigener Projektname mit zusammengesetztem Fremdschlüssel. Es existierte keine benutzergebundene Projekttabelle; bisherige Browser-Boards werden daher nicht unbemerkt an KI-Anbieter übertragen. Eigene Projektnamen lassen sich ausdrücklich übernehmen. Claude darf nur aus dieser eigenen Liste auswählen.
- Die Service-Role-exklusive View `trinity_hermes_pending` filtert freigegebene Aufträge mit aktiven Rechten vor der Seitengröße und prüft diese Bedingung beim Abschluss atomar erneut.
- Notizen sind nach Speichern unveränderlich, damit freigegebene Hermes-Anweisungen nicht nachträglich ausgetauscht werden. Eine Notiz mit Tag `hermes` erzeugt innerhalb derselben DB-Transaktion genau einen wartenden Queue-Eintrag. Queue zusätzlich mit `user_id`, `created_at`, `approved_at` zur Eigentümerprüfung und Freigabe. Alle Aufträge benötigen Freigabe. Hermes kann weder neue Aufträge anlegen noch sich selbst freigeben.
- Privater Storage-Bucket `trinity-audio`. Transkription selbst speichert kein Audio. Nur „Aufnahme behalten“ plus ausdrückliches Speichern legt Audio dort ab. Wiedergabe erfolgt über einen authentifizierten Server-Endpunkt, ohne dauerhafte öffentliche URLs.
- `usage` zählt `voice_seconds` und `requests` je `user_id` und UTC-Monat. Atomic RPC reserviert vor Anbieteraufrufen das Kontingent; parallele Anfragen können es nicht überschreiten. Transkription und Einordnung zählen je eine Anfrage. Begonnene Anbieteraufrufe werden auch bei Fehlern angerechnet, weil externe Kosten bereits entstanden sein können. Fehlende Schlüssel werden vor der Reservierung erkannt.

### Neue Env-Variablen (nur Staging)

In `/docker/mission-control-stg/.env`. Geheimwerte trägt der Nutzer selbst ein. Vorhandene Supabase-/FuseBase-Variablen bleiben erhalten.

| Variable | Zweck / Vorgabe |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Frei wählbarer App-Name; bereits vorhanden, jetzt zur Laufzeit verwendet |
| `NEXT_PUBLIC_ASSISTANT_NAME` | Frei wählbarer Assistentinnen-Name |
| `TRANSCRIBE_PROVIDER` | `infomaniak` (Standard), optional ausdrücklich `openai` |
| `INFOMANIAK_AI_PRODUCT_ID` | Numerische AI-Services-Produkt-ID; nur serverseitig |
| `INFOMANIAK_API_TOKEN` | Bearer-Token für das AI-Services-Produkt; nur serverseitig |
| `OPENAI_API_KEY` | Schlüssel für Transkription, nur serverseitig |
| `ANTHROPIC_API_KEY` | Schlüssel für Einordnung, nur serverseitig |
| `HERMES_API_TOKEN` | Eigenes zufälliges Secret, mindestens 32 Zeichen; nur Server und Hermes |
| `VOICE_MINUTES_PER_MONTH` | Monatslimit in ganzen Minuten, Standard `120`; `0` sperrt Audio |
| `VOICE_REQUESTS_PER_MONTH` | Monatslimit für Transkription plus Einordnung, Standard `600`; `0` sperrt alle KI-Anfragen |

`VOCALLAB_API_KEY` und ElevenLabs werden in Phase 1 nicht gebraucht und nicht angelegt.
Nach Eingabe: ausschließlich `cd /docker/mission-control-stg && docker compose up -d --build`.
Leere Vorlage: `deploy/voice.env.example`. Nicht mit `.env` überschreiben, nur fehlende Einträge ergänzen.

### API-Vertrag für Wiederverwendung und Hermes

Alle Antworten: `Cache-Control: private, no-store`. Fehler: `{success:false,error:string}`. Sitzungsgebundene Schreibanfragen prüfen die Origin. Bestehende Auth-/Provision-Endpunkte und Cookie-Namen bleiben gleich.

- `GET /api/voice/config`: Anmeldung, `canSave`, Anbieterbereitschaft, Limits und eigenen Verbrauch prüfen.
- `POST /api/voice/transcribe`: Multipart `audio` (Datei), `language` (`auto|de`). Antwort `{success:true,transcript,seconds,provider}`. Kein Upload in den Storage.
- `POST /api/voice/classify`: JSON `{transcript,source:"voice"|"text"}`. Antwort `{success:true,note:{title,transcript,summary,type,project,tags,due,assignee,source}}`.
- `GET /api/notes`: eigene Notizen; Parameter `q` (Volltext), `type`, `project`, `tag`, `before` (ISO-Zeit für nächste Seite, 50 Einträge).
- `POST /api/notes`: Multipart `id` (UUID als Wiederholungsschlüssel), `note` (JSON des oben beschriebenen Entwurfs), optional `audio`. Antwort `{success:true,id,created}`. Wiederholung derselben bereits gespeicherten eigenen UUID liefert `created:false`.
- `GET/POST /api/notes/projects`: eigene Namen lesen bzw. `{name}` anlegen.
- `GET /api/notes/:id/audio`: private Audio-Wiedergabe, eigene Sitzung erforderlich.
- `GET /api/notes/queue`: eigene wartende und abgeschlossene Aufträge. `PATCH` mit `{note_id,status:"freigegeben"|"abgelehnt"}` entscheidet ausschließlich einen eigenen wartenden Auftrag. Aufbewahrungszugang erforderlich.
- **Hermes:** `Authorization: Bearer <HERMES_API_TOKEN>`. `GET /api/hermes/queue` liefert `{success:true,queue:[{note_id,user_id,instruction,status,created_at}]}`, ausschließlich `freigegeben` mit noch aktivem Zugang, älteste zuerst, maximal 100. `PATCH` nimmt `{note_id,status:"erledigt"|"abgelehnt",result}` entgegen und kann nur freigegebene Aufträge abschließen; Wiederholung/ungültiger Übergang liefert 409. `result` maximal 10.000 Zeichen, kein HTML.
- Hermes muss `note_id` als Idempotenzschlüssel verwenden und vor externen Aktionen seinen eigenen Ausführungsstand dauerhaft abgleichen. Die Queue ist kein Exactly-once-Ausführungssystem und erteilt keine Berechtigung für Folgeschritte außerhalb der bestätigten Anweisung. Keine n8n-/Hermes-Workflows in diesem Auftrag geändert.

### Abnahme Phase 1

Automatisch: `npm run test:auth`, `npm run test:voice`, `npx tsc --noEmit`, `npm run build`. Reale Datenbankprüfung: `supabase/tests/voice_rls.sql` als Datenbankbesitzer; alle Testkonten/Notizen werden in derselben Transaktion zurückgerollt.

1. `/notiz` ohne Anmeldung öffnen: Text und lokale Aufnahme möglich, Speichern gesperrt; KI verlangt Anmeldung.
2. Mit NEO-Testkonto ohne Förderzugang: Transkription/Einordnung nach gesetzten Schlüsseln möglich, Save-API 403; direkter Datenbank-/Storage-Write ebenfalls verweigert.
3. Mit Förderzugang: neues eigenes Projekt, Textnotiz speichern, Suche/Typ/Projekt/Tag prüfen; zweites Konto sieht nichts davon. Ein Widerruf verhindert weitere Saves, vorhandene eigene Notizen bleiben lesbar.
4. Mikrofon: WebM/Opus auf Chrome/Android, MP4/AAC auf Safari/iOS; Pegel, Pause/Weiter, Alt+N, Stop nach fünf Minuten, verweigerte Berechtigung und Netzfehler prüfen. Deutsch und Englisch transkribieren; vor Speichern alle Felder bearbeiten.
5. Ohne Häkchen wird Audio nach Umwandlung aus dem Entwurf entfernt; mit Häkchen und Speichern nur über eigene Sitzung abspielbar.
6. Hermes-Tag: wartender Auftrag; Worker-GET enthält ihn nicht. Freigeben, endgültig bestätigen, Worker sieht ihn. Worker kann keinen wartenden Auftrag selbst freigeben/abschließen. Ablehnung und Ergebnis sichtbar. Externe Aktion im Test nur simulieren.
7. Quota: kleines Minuten-/Anfragenlimit setzen, parallel anfragen, Grenze prüfen. Textnotizen bleiben benutzbar. Monatswechsel in UTC.
8. PWA: Installation auf iOS/Android, Shortcut und Offline-Hülle prüfen. Keine Auth-, Notiz- oder Audiodaten in Cache Storage/localStorage.

Echte Anbieteraufrufe benötigen die vom Nutzer eingetragenen Schlüssel. Physische iOS-/Android-Installation bleibt bis zum Gerätetest ausdrücklich unbestätigt. Phase 2 beginnt erst nach Rückmeldung zu Phase 1.

### Stand der Prüfung am 27.09.2026

- 8 neue Voice-/Hermes-/Upload-/Quota-Tests und 6 bestehende Auth-Tests erfolgreich; TypeScript und Produktionsbuild erfolgreich.
- Migrationen im Zielprojekt angewendet. RLS und Rechteverlust, privater Storage, wartende Queue, geschützte Freigabe, aktive Hermes-View und Abschluss über die View sowie Minuten-/Anfragenlimit direkt in PostgreSQL geprüft. SQL-Fixtures vollständig zurückgerollt.
- Zusätzlich echtes Quota-Rennen: acht parallele 30-Sekunden-Reservierungen bei einer Minute Limit; exakt zwei wurden angenommen.
- Staging liefert `/notiz`, `/notiz/hilfe`, Manifest, Service Worker und Icons mit HTTP 200. Manifest: `standalone`, Shortcut `/notiz?rec=1`. Anonyme Daten-APIs liefern 401; Hermes ohne eingerichteten Token 503. Textentwurf und deaktiviertes Speichern anonym sowie Layout bei 390 px im Browser geprüft.
- **Blocker für angemeldete HTTP-Abnahme:** Der vorhandene `SUPABASE_ANON_KEY` auf Staging wird vom Supabase-Gateway mit `Invalid API key` abgewiesen. Die per Magic-Link-Verifikation erzeugte Testsitzung ist gültig (direkt mit gültigem Service-API-Key geprüft), wird mit diesem Publishable-/Anon-Key jedoch zurückgewiesen. Nutzer wurde gebeten, nur den Schlüssel in der Staging-`.env` selbst zu korrigieren. Kein Ersatzschlüssel erzeugt oder übernommen.
- Die für die mailfreien HTTP-Versuche erzeugten Testkonten wurden ausschließlich anhand ihrer neu erzeugten IDs entfernt. Kontrollabfrage: keine übrig gebliebenen Testkonten, Notizen, Queue-Einträge oder Audioobjekte. Bestehende Mitglieder unverändert.
- Nach korrigiertem Login-Key kann `scripts/test-voice-staging.mjs --run` in der Staging-Containerumgebung erneut laufen. Es prüft den echten Save-/Such-/Audio-/Hermes-Freigabe-/Revoke-Fluss und entfernt seine eigenen Fixtures auch bei Fehlern. Anleitung: lokal `ssh root@76.13.137.234 'cd /docker/mission-control-stg && docker compose exec -T mission-control node --input-type=module - --run' < scripts/test-voice-staging.mjs`.
- OpenAI-/Anthropic-Aufrufe und Hermes-Workerbetrieb benötigen Nutzerschlüssel; dafür noch keine Live-Erfolgsbehauptung. Echte Mikrofonaufnahme und Installation auf physischen iOS-/Android-Geräten ausstehend. Amical später auf Nutzerwunsch entfernt. Phase 2 nicht begonnen; Produktion unverändert.

### Wiederholte Staging-Abnahme nach Schlüsselmeldung

Der Compose-Neustart hat den gemeldeten Schlüsselwechsel noch nicht bestätigt: In der tatsächlich verwendeten Staging-`.env` sind OpenAI, Anthropic und Hermes weiterhin leer, und Supabase weist den Anon-Key mit 401 ab. Angemeldete Abnahme, Live-KI und Hermes-Worker sind deshalb weiterhin unbestätigt. Nutzer wurde nach der gespeicherten Datei gefragt.

Das mailfreie Smoke-Skript prüft zusätzlich Passwort-Anmeldung/falsches Passwort, Magic-Link-Einmaligkeit, gemeinsame sichere Cookie-Attribute sowie bei gesetztem Hermes-Token Worker-Sichtbarkeit erst nach Freigabe und idempotenten Abschluss. Mit `--live-providers` und `VOICE_TEST_AUDIO_PATH` (WebM mit unkritischem gesprochenem Testinhalt im Container) sind echte Transkription und Einordnung ausdrücklich zuschaltbar. Keine Geheimnisse oder Anmeldelinks werden ausgegeben. Syntaxprüfung erfolgreich; diese Erweiterungen sind bis zur Konfigurationskorrektur noch nicht vollständig live durchlaufen.

Handy-Test nach erfolgreicher Serverabnahme: `/login` öffnen, mit der vereinbarten Testadresse Magic Link anfordern und im selben Browser bestätigen. Danach `/notiz` öffnen, Mikrofon erlauben, kurzen Testsatz aufnehmen, pausieren/fortsetzen und umwandeln. Transkript/Felder prüfen, speichern. Einen ausdrücklich als internen Test bezeichneten Hermes-Auftrag speichern und separat freigeben; zunächst muss er auf Bestätigung warten. Auf iOS über Safari „Zum Home-Bildschirm“, auf Android über Chrome „App installieren“. Physische Mikrofon-/PWA-Abnahme bleibt Nutzertest; Amical entfernt, Phase 2 nicht begonnen.

### Anbieteränderung: Infomaniak als Standard

Auf ausdrücklichen Nutzerauftrag ersetzt Infomaniak den bisherigen Standard. `TRANSCRIBE_PROVIDER=infomaniak`; neue Server-Variablen `INFOMANIAK_AI_PRODUCT_ID` und `INFOMANIAK_API_TOKEN` trägt der Nutzer selbst ein. OpenAI bleibt nur mit `TRANSCRIBE_PROVIDER=openai` und `OPENAI_API_KEY` auswählbar; kein automatischer Wechsel nach Fehlern. Amical ist als Provider und Env-Variable entfernt: lokale Desktop-App ohne Server-API. Phase 2 ist weiterhin nicht begonnen; ihre Sprachausgabe ist für VocalLab vorgesehen.

Die [Transkriptions-Dokumentation](https://developer.infomaniak.com/docs/api/post/1/ai/%7Bproduct_id%7D/openai/audio/transcriptions) nennt Modell `whisper` und einen asynchronen Auftrag. Der Adapter lädt Multipart-Audio mit Bearer-Token hoch, fragt den [Batch-Status](https://developer.infomaniak.com/docs/api/get/1/ai/%7Bproduct_id%7D/results/%7Bbatch_id%7D) ab und liest das Textresultat. Bei Bedarf wird ausschließlich der dokumentierte Downloadpfad am festen API-Host verwendet. Gesamte Zeitgrenze 120 Sekunden; Fehler werden ohne Anbieterdetails/Geheimnisse ausgegeben. Vorhandene API-Antwortformate bleiben erhalten.

Die Datenschutz-Info nennt beim aktiven Standard „Infomaniak, Schweiz“ für Audio und weiterhin Anthropic für die Einordnung des Texts. Sie zeigt den richtigen Provider auch vor der Anmeldung. Im OpenAI-Modus nennt sie OpenAI. Kein Datenbank-/Cookie-/Provision-Vertrag geändert.

Prüfung des Anbieterwechsels: 12 Voice-Tests und 6 Auth-Tests erfolgreich, TypeScript und lokaler Produktionsbuild erfolgreich. Infomaniak-HTTP-Antworten werden in diesen Tests simuliert, einschließlich Multipart-Upload, asynchroner Statusfolge, sicherem Download, Fehlern und Zeitüberschreitung. Echte Infomaniak-Transkription bleibt bis zur Eingabe von Produkt-ID und Token und erfolgreicher angemeldeter Staging-Abnahme offen.

### 01.10.2026 – Phase 2 freigegeben und umgesetzt

Nach „freigabe erteilt“: `/sprechen` mit Gedrückthalten, optionaler Stille-Erkennung, abbrechbarer Claude-Sonnet-5-Textantwort, optionalem ausschließlich eigenem Notizkontext, VocalLab-`SpeechProvider` und Browser-Stimme. Gespräch flüchtig, Speichern ausdrücklich über bestehende zugangsgeschützte Notiz-API. Kein Avatar, keine externen Aktionen, keine Produktion.

Neu: `VOCALLAB_API_KEY`, optional `SPEECH_PROVIDER` und `VOCALLAB_MODEL`. Neue interne Chat-/Sprachausgabe-Endpunkte, eigene Stimmpräferenz in `user_metadata.trinity_speech_voice`; `neo_profiles`, Login, Cookies und Provision unverändert. Die bestehenden Monatslimits zählen zusätzlich Chat-Anfragen und TTS-Anfragen samt Zeichen-Zeitbudget. Vollständige Verträge, Referenz, Datenschutzgrenzen und Prüfstand: [TRINITY-SPRACHE-PHASE2.md](TRINITY-SPRACHE-PHASE2.md). Echte Anbieter-/Handy-Abnahme bleibt auf Nutzerwunsch später; VocalLab-Lifetime/API-Zuordnung noch zu bestätigen.

### 01.10.2026 – Infomaniak-Variablennamen abgeglichen

Nutzerkorrektur gemäß `.env.example`: verbindlich `INFOMANIAK_API_TOKEN` und `INFOMANIAK_AI_PRODUCT_ID`. Bereitschaftsprüfung und alle Infomaniak-HTTP-Aufrufe verwenden denselben serverseitigen Token-Leser. `INFOMANIAK_API_TOKEN` hat Vorrang; der bisherige Name `INFOMANIAK_AI_TOKEN` bleibt vorläufig als Rückfall lesbar, damit vorhandene Staging-Konfigurationen weiterlaufen. Vorlagen dokumentieren nur den neuen Namen. Keine echten Werte gelesen, kopiert oder geändert; keine echten Anbieteraufrufe. Infomaniak bleibt Transkriptionsanbieter, Anthropic für Chat/Einordnung unverändert.

### 01.10.2026 – Phase 3 im Automodus

Auf Nutzerfreigabe: Energielinien-Avatar in den Kopfzeilen von Übersicht, Notizen, Gehirn und Sprachchat. Vier Zustände, Mikrofonpegel aus dem vorhandenen Analyser, VocalLab-Ausgabepegel aus lokaler Web-Audio-Messung. Browser-Stimme zeigt den tatsächlichen Sprechzustand ohne simulierten Lautstärkepegel. Klick öffnet `/sprechen`, dort Fokus aufs Textfeld; reduzierte Bewegung vollständig berücksichtigt. Optionaler `onMeter`-Callback für die wiederverwendbare Aufnahme-Komponente. Keine neuen Env-Variablen oder Änderungen an HTTP-/Datenbank-/Cookie-Verträgen. Eigener Branch `codex/trinity-avatar` auf PR #13; nur Staging. Details und späterer Handytest: [TRINITY-AVATAR-PHASE3.md](TRINITY-AVATAR-PHASE3.md).
