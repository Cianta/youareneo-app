# Trinity überall bedienen

Stand 02.10.2026, Branch `codex/trinity-global-assistant`, auf PR #18.

Die Navigation liegt jetzt im gemeinsamen App-Rahmen. Sie bleibt beim Wechsel zwischen Dashboard, Notizen, Gehirn und Sprachchat erhalten. Auf dem Handy übernimmt die untere Tab-Leiste die Navigation. Ein einziger Trinity-Avatar sitzt mit Mikrofon, Ton und Zahnrad transparent unten rechts, auf dem Handy oberhalb der Tabs. Chat-Code wird erst beim Öffnen geladen, die 3D-Bibliothek weiterhin nur im Gehirn.

## Aufnehmen und einordnen

Mikrofon gedrückt halten oder **Ctrl+Shift+Leertaste** halten, auch auf dem Mac. Loslassen beendet die Aufnahme und startet Transkription und Einordnung. **Alt+Tab und ⌘Tab sind vom Betriebssystem reserviert**; eine Website kann diese Kombinationen nicht zuverlässig übernehmen. Der Ersatz wird auch in der App erklärt. Die Aufnahme funktioniert im aktiven Trinity-Browserfenster, nicht systemweit außerhalb der Website.

Beim ersten Mal muss der Browser den Mikrofonzugriff erlauben. Wer vor der Erlaubnis loslässt, startet keine Aufnahme. Maximal 60 Sekunden / 5 MiB pro globaler Aufnahme, entsprechend dem vorhandenen Chat-Mikrofon. Die längere Aufnahme im Notizraum bleibt separat verfügbar. Pro Fenster ist nur eine Aufnahme aktiv: Eine neue Aufnahme beendet die andere, ohne deren abgebrochenes Audio abzusenden. Schließen/Escape verwirft eine laufende Aufnahme; Verlassen des sichtbaren Tabs beendet sie.

Der gesprochene Text wird über den bestehenden Infomaniak-Endpunkt transkribiert. Anthropic schlägt Titel, Ort, Typ und Tags vor. Man kann einen vorhandenen Ort direkt nennen, den Vorschlag bearbeiten oder einen Ort auswählen und mit dessen Regeln neu einordnen. Ein gültiger `?project=...`-Kontext ist ein ausdrücklicher Zielort. Die Einordnung legt keine neuen Projekte an.

**Erst „Am gewählten Ort speichern“ schreibt eine Notiz.** Hermes-Aufträge warten weiterhin auf eine gesonderte Freigabe. Fehler bei der Einordnung erhalten den transkribierten Text; Fehler beim Speichern erhalten den Entwurf. Eine unveränderte Wiederholung nutzt dieselbe Notiz-ID, um doppelte Notizen zu vermeiden. Ein Kontowechsel verwirft private Entwürfe vor einem weiteren Speicherversuch. Entwürfe liegen nur im Arbeitsspeicher und gehen beim Neuladen verloren; der Browser warnt beim Verlassen mit offenem Entwurf.

## Stimme und Darstellung

Zahnrad → **Stimme & Erscheinungsbild**: stufenlos Dunkel/Hell, Mikrofon an/aus, Sprachausgabe an/aus, Lautstärke, Browser-Stimme, Tempo und Tonhöhe. VocalLab ist auswählbar, sobald der bestehende Server-Anschluss bereit ist. „Sprachchat starten“ öffnet den vorhandenen Chat im schwebenden Fenster; ein Avatar-Klick öffnet ihn ebenfalls. Mikrofon und Audio starten nie allein durch Laden der Seite.

Nur diese Geräte-Einstellungen liegen unter `trinity-display-voice` im localStorage. Sitzung, Kontodaten und Notizinhalt bleiben davon getrennt; Supabase-Sitzungen verwenden weiterhin HttpOnly-Cookies. Keine neuen Env-Variablen, Secrets oder Anbieter erforderlich.

## Regeln für einen Ort

Zahnrad → „Regeln für einen Ort“ → eigenes Projekt auswählen. Regeln werden als gewöhnliche **private Notiz** mit Titel `Regeln · <Projekt>`, dem Projekt und Tag `projektregeln` gespeichert. Die neueste Version gilt, maximal 2.000 Zeichen. Frühere Versionen bleiben normale Notizen und lassen sich im Notizraum verwalten. Kein neues Tabellenfeld und keine Migration.

Regeln beeinflussen ausschließlich Titel, Zusammenfassung, Typ und Tags der Einordnung. Sie geben keine Rechte frei, führen keine Aktionen aus und ersetzen keine Hermes-Freigabe. Bei automatisch erkanntem Ort mit Regeln folgt ein zweiter Klassifizierungsaufruf; beide Aufrufe zählen gegen das bestehende Nutzungslimit.

Interne additive Verträge:

- `POST /api/voice/classify`: optional `project: string|null`; ein gesetzter Ort muss dem angemeldeten Nutzer gehören. Antwort ergänzt `rulesApplied: boolean`; bisherige Felder unverändert.
- `GET /api/notes/projects?rulesFor=<Projekt>`: bisheriges `projects` plus `rules: string`. Eigener Ort und eigene neueste Regelnotiz werden serverseitig geprüft. Ohne Parameter bleibt die Antwort unverändert.
- UI-Ereignis `neo-notes-changed` aktualisiert Notizliste und Graph nach bestätigtem Speichern. Keine externe Schnittstelle.

Auth-/Provision-/Cookie-Verträge, Profile, Portal und n8n bleiben unverändert. Der Zusatz ist auch in der verbindlichen Login-Übergabe festgehalten.

## Prüfung

`npm run test:assistant`, die vorhandenen Auth-/Voice-/Chat-/Workspace-/Brain-/Apps-Tests, `npx tsc --noEmit` und `npm run build`. Lokaler Browsertest: Produktionsbuild auf localhost starten; `TEST_BASE_URL=http://127.0.0.1:3310 TEST_BROWSER_PATH=<Chromium-Pfad> npm run test:assistant:browser`. Er verwendet ausschließlich synthetisches Audio, HTTP-Fixtures und Testidentitäten, keine echten Konten, Mikrofone oder Anbieter.

Der Browser prüft erhaltene Navigation, ein einziges Avatar, Helligkeitsregler, frühes Loslassen, Halten über einen Routenwechsel, gegenseitiges Stoppen von Mikrofonen, Entwurfserhalt bei Fehlern, Wiederholungs-ID, Kontowechsel, private Regelnotiz, Chat und mobile Abstände. Live-Login, echte Aufnahme/Infomaniak, VocalLab und Handy-Mikrofon sind auf Nutzerwunsch weiterhin separat abzunehmen. Der gemeinsame Vexp-Index deckt diesen Git-Arbeitsbranch nicht mechanisch ab; direkter Build und Tests sind der Nachweis.

## Kurzer Handy-Test

1. Mit dem NEO-Konto anmelden. Notizen/Gehirn öffnen: unten bleiben die Tabs sichtbar.
2. Zahnrad öffnen, Dunkel/Hell bewegen, Stimme und Lautstärke wählen.
3. Mikrofon unten rechts halten, Zugriff erlauben und danach erneut halten. Etwa „Gartenidee im Projekt Eden festhalten“ sprechen; loslassen.
4. Text und vorgeschlagenen Ort prüfen, bei Bedarf ändern. Erst dann speichern; Notizliste und Gehirn aktualisieren sich.
5. Zahnrad → Sprachchat starten. Zum Beenden schließen oder Ton ausschalten. Bei einer fehlenden Anbieterkonfiguration erscheint ein Hinweis, keine automatische Ersatz-Anmeldung.

Lokaler Prüfstand vor Deployment: 51 Unit-Tests bestanden; TypeScript und Produktionsbuild erfolgreich. Lighthouse 13.5.0, mobile Simulation, je ein lokaler Fixture-Lauf: Login 100, Notizen 97, Übersicht 97, Aufgaben 98, Kanban 95 (Performance); Accessibility jeweils 100, keine Konsolenfehler, keine Schreibrequests, kein 3D-Renderer auf diesen Seiten. Das sind lokale Messwerte, keine Aussage über Serverlatenz oder echte Nutzerkonten.
