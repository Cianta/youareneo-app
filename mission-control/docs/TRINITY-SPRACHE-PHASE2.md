# Sprach-Phase 2 – Gespräch und Sprachausgabe

Freigabe am 01.10.2026 nach Teil 2. Eigener Branch `codex/trinity-voice-phase2`, aufbauend auf Graph-PR #11 und damit #10/#9/#8/#7. Nur Staging: https://trinity-stg.youareneo.com/sprechen. Keine echte Anbieter-/Mail-/Handy-Abnahme in diesem Schritt; der Nutzer möchte später testen. Kein Avatar (Sprach-Phase 3).

## Verhalten

- „Sprachchat“ in Navigation und Befehlspalette. App-/Assistentinnenname stammen weiterhin aus der vorhandenen Konfiguration.
- Gedrückt halten (Maus, Touch, Leertaste/Enter), Loslassen sendet. Optional freihändig: lokaler Pegel erkennt Sprache und schließt nach etwa einer Sekunde Stille ab. Maximal eine Minute pro Segment, ruhige Segmente werden ohne Anbieteraufruf verworfen. Bei Hintergrundwechsel/Verlassen und „Alles stoppen“ werden Tracks freigegeben.
- Neue Sprache unterbricht Textanfrage und Wiedergabe. Web-Audio-Echo-Unterdrückung angefordert; Kopfhörer bleiben bei Freihändig sinnvoll. Keine akustische Sprecheridentifikation. Browser-Permission, Autoplay und physische Geräte müssen später real geprüft werden.
- Transkription verwendet unverändert Infomaniak (`TRANSCRIBE_PROVIDER`); keine dauerhafte Aufnahme. Textantwort von `claude-sonnet-5` über das vorhandene Anthropic-SDK wird fortlaufend angezeigt. Sprache folgt der vollständigen Antwort in begrenzten Abschnitten. Keine Tools/externen Aktionen, kein automatisches Speichern oder Hermes-Freigeben.
- Eigene Notizen sind standardmäßig **nicht** im Kontext. Aktivierter Schalter: eine auf `user_id` und RLS begrenzte Volltextabfrage, maximal sechs passende Notizen, begrenzte Auszüge. Verwendete Notizen werden als Links angezeigt. Keine fremden/alten gemeinsamen Daten und kein Service-Role-Kontext.
- Gespräch bleibt nur im aktuellen React-Speicher, kein localStorage/Service-Worker-/Server-Verlauf. Optional „Gespräch als Notiz speichern“ über vorhandene Note-API mit denselben Förder-/App-Rechten und UUID-Wiederholungsschutz. Keine automatische Hermes-Markierung. Browser-Reload/neues Gespräch leert die flüchtige Unterhaltung.

## VocalLab und Browser-Stimme

Adapter `SpeechProvider` mit `VocalLabSpeech` anhand der [offiziellen API-Referenz](https://www.vocallab.ai/help/api-reference). Das konkrete Lifetime-Angebot wurde beim Nutzer zur Zuordnung nachgefragt; bis jetzt keine API-Schlüssel übernommen oder echten Aufrufe ausgeführt. Der Nutzer muss API-Zugang und die Zuordnung seines Angebots bestätigen. [API-Schlüssel benötigen laut Anbieter einen berechtigten Tarif](https://www.vocallab.ai/help/api-keys); Lifetime ist hier nicht als automatisch API-berechtigt bestätigt.

Fester Host `https://api.vocallab.ai/api/v1`, Bearer nur serverseitig. Ausschließlich öffentliche Preset-Stimmen aus dem Katalog; gemeinsame Kontoklone/-Designs werden weder angezeigt noch angenommen. Stimmwahl pro Nutzer; „Stimme merken“ speichert nur die gewählte ID in eigenem `user_metadata.trinity_speech_voice`, nicht in `neo_profiles` und nie als Berechtigungsmerkmal.

`POST /tts` mit höchstens 2.000 Zeichen, gewählter Katalogstimme, konfiguriertem Modell und MP3. Antwort inline aus Base64, strenge Größe-/Formatprüfung. Keine fremden Antwort-URLs verfolgen, keine automatischen kostenpflichtigen POST-Wiederholungen. Nur die gerade erzeugte temporäre Generation wird nach Übernahme per DELETE bereinigt. Bei Netz-/Anbieterfehlern kann eine Kopie beim Anbieter verbleiben; Abbruch vor Erhalt der ID lässt sich nicht zuverlässig bereinigen. UI-Datenschutzhinweis nennt diese Grenze.

Fehlende VocalLab-Konfiguration → Browser-`speechSynthesis` bleibt auswählbar; auch „Nur Text“. Kein automatischer kostenpflichtiger Anbieterwechsel nach Fehlern. Browser-Stimmen können je nach Betriebssystem selbst Cloud-Dienste verwenden; sie verursachen keine Serverkosten in dieser App. Browser-Stimmwahl ist flüchtig, VocalLab-Stimmwahl ist ausdrücklich speicherbar.

## Neue Env-Variablen

Nur in `/docker/mission-control-stg/.env`, Werte setzt der Nutzer. Leere Vorlage: `deploy/voice-phase2.env.example`. Keine automatische Änderung an `.env` oder Compose.

| Variable | Zweck |
|---|---|
| `VOCALLAB_API_KEY` | Neu, geheim. Schlüssel für das konkrete API-berechtigte VocalLab-Konto. |
| `SPEECH_PROVIDER` | Optional, Standard `vocallab`; `browser` aktiviert nur Browser-Ausgabe. |
| `VOCALLAB_MODEL` | Optional, Standard `v-pro`; dokumentierte Alternativen `v-flash`, `v-lite`, `v-studio`. |

Vorhandene `ANTHROPIC_API_KEY`, Infomaniak-Konfiguration, Namen und Limits werden weiterverwendet. Kein neuer OpenAI-Schlüssel, keine neue Datenbankmigration. Nach Setzen der Werte nur `cd /docker/mission-control-stg && docker compose up -d --build`.

## Kosten und Grenzen

- Bestehendes atomisches Monatskontingent `usage` / `trinity_reserve_usage`, keine neue parallele Zählung.
- Transkription wie zuvor tatsächliche Audiozeit plus Anfrage. Jede Chat-Antwort eine Anfrage, höchstens 1.200 Modell-Ausgabetokens, begrenzte Eingabe (12 Nachrichten/20.000 Zeichen) und Notizkontext. Kein Modell-Retry.
- Jeder VocalLab-Abschnitt eine Anfrage plus vorab reserviertes Zeitbudget `ceil(Zeichen/15)` Sekunden nach der [dokumentierten Zeichenabrechnung](https://www.vocallab.ai/help/api-reference). Das ist ein Budget, keine Messung der ausgegebenen Audiodauer. `VOICE_MINUTES_PER_MONTH` umfasst damit Eingabeaudio **und** Sprachausgabe-Budget; `VOICE_REQUESTS_PER_MONTH` umfasst nun zusätzlich Chat und TTS.
- Bereits begonnene Anbieteranfragen werden auch bei Fehler/Abbruch angerechnet; externe Kosten sind dann eventuell bereits entstanden. Stimmenkatalog/Präferenz und Browser-Sprachausgabe zählen nicht als KI-Anfrage.

## Neue Schnittstellen

Bestehende Auth-/Provision-/Cookie-/Notiz-/Hermes-Verträge unverändert. Alle neuen Routen prüfen die Sitzung selbst; POSTs prüfen Origin. Antworten privat/no-store, keine Inhalte in Logs.

| Route | Vertrag |
|---|---|
| `POST /api/voice/chat` | `{messages:[{role:'user'|'assistant',content}],includeNotes?:boolean}` → NDJSON-Zeilen: `sources` mit eigenen `{id,title}`, `text` mit Delta, `done`; bei Stream-Abbruch `error` mit bereinigter Meldung. Vor Streambeginn bestehendes JSON-Fehlerformat. Kein Speichern. |
| `GET /api/voice/speech/voices` | `{success,provider,ready,voices:[{id,name,languages}],selected}`; nur Preset-Katalog, nur eigene gewählte ID. |
| `POST /api/voice/speech/preferences` | `{voice}` → `{success:true}`; ID muss im erlaubten Katalog liegen; nur eigene User-Metadaten. |
| `POST /api/voice/speech` | `{text,voice}` → `audio/mpeg`; bei Fehler JSON wie bisher. Keine öffentliche Audio-URL. |

## Prüfung

- TypeScript und Produktionsbuild erfolgreich. 6 Auth-, 12 Voice-, 8 Workspace-, 7 Graph- und 7 neue Chat-Tests bestanden.
- Chat-Tests: begrenzte Rollen/History, Chunking ohne Textverlust, eigene begrenzte Kontextabfrage, UTF-8-Streaming/Abbruch/Fehlerredaktion; VocalLab-Fake prüft festen Host, Bearer, Preset-Isolation, MP3, Bereinigung der gerade erzeugten ID, keine fremden URLs und keine POST-Retries.
- Lokaler Browser mit ausschließlich fiktiven API-Antworten und künstlichem Audiosignal: Textantwort, Kontextschalter/Quelllink, gesperrtes Speichern ohne Zugang, schnelles Loslassen während verzögerter Mikrofonfreigabe, MediaRecorder, Stille-Erkennung, Unterbrechung laufender Ausgabe und Stop mit beendeten Tracks. Ein aufgebrauchtes Kontingent beendet auch den freihändigen Mikrofonbetrieb. Bei 390 px kein horizontaler Überlauf/keine JS-Seitenfehler. Kein echtes Mikrofon/Anbietermail/Konto.
- Wiederholen: `npm run test:chat`; lokaler Produktionsserver wie in Teil 2, dann `TEST_BROWSER_PATH=<Chromium> npm run test:chat:browser`. Alle Fake-Tests sind auf localhost begrenzt.

Offen bleibt der spätere gemeinsame Test: echte Infomaniak-/Claude-/VocalLab-Aufrufe, Schlüssel/Tarif, Stimmenqualität, Echo/Autoplay und Hintergrund auf iOS/Android, echte Zwei-Konten-/Quota-/Speicherabnahme. Die erfolgreichen Fixtures ersetzen das nicht.

## Deployment

Nur geänderte Quelldateien in `/docker/mission-control-stg`; Source-Backup unter `.codex-backups/voice-phase2-20261001/`. `.env`, Compose, Produktion und fremde Dienste unverändert. Ausschließlich `docker compose up -d --build` verwendet. Der vorherige Graph-Deploy ist separat unter `.codex-backups/part3-20261001/` gesichert.
