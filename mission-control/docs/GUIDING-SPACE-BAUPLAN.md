# guiding.space · Bauplan und überprüfbarer Gesamtstand

Stand: 2. Oktober 2026. Veröffentlicht als [PR #22](https://github.com/Cianta/youareneo-app/pull/22) auf `codex/guiding-space-companion`, Ausgangspunkt PR #21 / `0c808f5`. Dieses Dokument unterscheidet vorhandene Funktionen, neue Umsetzung und tatsächliche Abnahme. Ein erfolgreicher Build ist kein Test eines echten Mikrofons oder externen Kontos.

Das ausführliche Routeninventar bleibt in [TRINITY-INVENTAR.md](./TRINITY-INVENTAR.md). Dieser Bauplan ergänzt die aktuelle Umsetzung und die weiterhin offenen Integrationen.

## Produkt und Grenzen

**guiding.space** ist der persönliche Arbeitsraum; **Trinity** ist seine Assistentin. Bestehende Domain bleibt `trinity.youareneo.com`, Staging `trinity-stg.youareneo.com`. Ein späterer Umzug zu guiding.space braucht eine eigene Domain-/Login-/Iframe-Umstellung. Jetzt keine DNS-Änderung.

Nur `/docker/mission-control` und `/docker/mission-control-stg` auf dem VPS; Deploy mit `docker compose up -d --build`. Keine Änderungen an Traefik, Buzz-Diensten, Portal, n8n, Medien, Make, Memberspot oder FuseBase-Einstellungen. Bestehende Secrets bleiben unverändert, neue Werte trägt der Nutzer selbst ein. Gemeinsames Supabase-Projekt bleibt `emxqoahtipbmumghlixb`.

## Reihenfolge und Abnahme

| Bereich | Vorhandener Stand | Arbeit in diesem Paket | Abnahme |
|---|---|---|---|
| Anmeldung | Supabase-Cookies, Magic Link, Passwort, Rücksetzung, stilles Provisioning; FuseBase-Rückfall erhalten | Schnittstellen unverändert | Echte angemeldete End-to-End-Abnahme weiterhin ausstehend |
| Aufnahme | MediaRecorder, Infomaniak-Transkription, editierbarer Text; Alt+Y/X/H/C | Eingangsauswahl, lokaler Pegeltest, unterscheidbare Geräte-/Rechtefehler, erneuter Versuch nach Fehler, Aufnahme auch per Klick | Gerätefehler und Abbruch synthetisch testen; physisches Mikrofon separat |
| Assistentin | Globales Chat-Widget, Browser-Stimme, VocalLab-Schnittstelle, Hermes mit Freigabe | Lila Sonne als Einstieg; wählbarer Drache/Lichtgestalt/Lebensbaum, Energielinien, abschaltbare Reaktionen | Tastatur, mobile Ansicht, reduzierte Bewegung, kein automatisches Senden |
| Logo | Alte animierte SVG-Datei vorhanden, im neuen Shell nicht eingebunden | Animation wieder sichtbar, eindeutige SVG-IDs | Desktop/Mobil, keine ID-Kollision |
| Gestaltung | Fast weißes Beige/Blau, Akzente Türkis/Lila/Rosa/Grün, Helligkeitsregler | Navigation gruppieren und bebildern; Tageslicht und optional Wetter nur rechts | Sidebar unverändert bei Wetterwechsel; kein Overlay blockiert Eingaben |
| Aufmerksamkeit | Eigene Ziele mit Datum, Board-Priorität | Umrandung/Zahl für überfällige Ziele und dringende offene Aufgaben | Nur reale vorhandene Daten; erledigte Einträge herausrechnen |
| E-Mail/Anrufe | Alte Mailansicht las einen gemeinsamen Servercache; keine geprüfte persönliche Anrufquelle | Cache jetzt nach angemeldetem Konto getrennt; eigene ungelesene Mails können Hinweise geben; alte Datei bleibt erhalten | Kontenwechsel/Abmeldung entfernt offene Details; persönlicher Mail-Anschluss und Anrufquelle bleiben offen |
| Bestehende Räume | Ideenboard/Eden, Tagesplan, Kalender, Notizen, Gehirn, Fokus, Astro/HD, Personenprofile | Bestehende Einstiege bewahren und Regression prüfen | Routen und frühere Datenformate bleiben erhalten |
| Buzz | In Claudes Portal unter `archiv.youareneo.com/app/` gefunden; Portal erreichbar | Eigene App-Karte mit Bild und festem Portal-Link | Keine Behauptung gemeinsamen Logins; Einladung weiter separat |
| Andere Apps | Radio/Rezepte an Supabase-Notizen; externe Apps teilweise FuseBase | Bestand aus App-Katalog erhalten | Vollständige Konto-/Datenmigration externer Apps bleibt offen |
| Lokal & Geräte | Einige ältere Bereiche im Browser, Servernotizen im Konto; Offline-Seite bisher nur Hinweis | Offline-Textentwürfe; Datei-Export/Import; freiwillige private Serversicherung für klar benannte lokale Bereiche | Konflikterkennung, Eigentümerprüfung, lokale Rückkopie, keine Schlüssel/Sitzungen im Snapshot |
| Veröffentlichung | PR #21 auf beiden Instanzen | Eigenes PR, zuerst Staging, dann freigegebene Hauptdomain | Build, relevante Tests, Live-Routen und Assets, sichtbarer Browsernachweis |

## Inventur: was tatsächlich wiedergefunden wurde

- Vexp-Suche im gemeinsamen Index (app-youareneo, app-mission-control, app-trinity-renewal) bestätigt die alte `TrinityLogo`-Implementierung. Die Animation war im neuen `WorkspaceShell` nicht gerendert; die Datei war vorhanden.
- Lokale Suche findet Buzz in `Claude/Apps/mission-control/portal/site/app/index.html` und der zugehörigen nginx-Konfiguration. Das ist ein bestehender Portal-Einstieg, keine bereits vereinte NEO-Anmeldung. Die separaten Buzz-Container bleiben unangetastet.
- SHA-256-Abgleich der 30 Dateien aus `.codex-guiding-release.json`: auf Staging und Produktion keine Abweichung vom letzten Release. Dieser Befund gilt für diese Dateien, nicht für sämtliche externen Projekte oder historische Versionen.
- Astro-/Human-Design-Wiederherstellung aus PR #21 bleibt bestehen: Geburtsberechnung, Zentren/Kanäle/Tore, Mond-/Maya-/vedische/chinesische Perspektiven und Personenprofile. Neue Visualisierungen sind nicht als wiedergefundene historische Oberflächen auszugeben.
- Ursprüngliche serverseitige Übergabedokumente und `.env.example` hatten schon vor diesem Paket abweichende Stände; sie werden nicht blind überschrieben.

## Daten und Verhalten

- Mikrofon-Pegeltest: nur im Gerät, maximal 15 Sekunden, kein Recorder, kein Upload. Stoppen, Gerätewechsel, Schließen und ausgeblendeter Tab geben die Tracks frei.
- Dictation: Aufnahme → Transkription in bearbeitbaren Text → bewusstes Senden. Kein Gesprächsstart, Mailversand oder Hermes-Auftrag allein durch einen Avatarzustand.
- Avatar-Reaktionen: Abschlüsse in der laufenden Sitzung und aktive Zeit im sichtbaren Tab. Keine psychologische Bewertung, kein Punktestand. E-Mail-Signale nutzen ausschließlich den Cache des frisch geprüften Kontos; ohne zugeordnete Verbindung gibt es keinen Mailzähler.
- Tageslicht folgt der Gerätezeit. Der Wetter-Leseendpunkt ist öffentlich und enthält keine Kontodaten. Wetter ist optional mit selbst gewähltem Ort; ungefähre Ortskoordinaten an Open-Meteo über den App-Server, kein GPS. Bei Ausfall ruhige Darstellung. Navigation links bleibt bei den eigenen Einstellungen.
- Gerätesicherung ist bewusst manuell, keine unsichtbare Hintergrundsynchronisierung. Enthält ausgewählte Tagesplanung/Ziele/persönliche Notizen, Boards, Tagesnotizbuch und optional Geburtsprofile. Andere lokale Speicher werden nicht pauschal kopiert.
- Gespeicherte Supabase-Notizen/Rezepte/Radio-Merklisten sind schon kontogebunden. Kein vollständiger Offline-Spiegel dieser privaten Serverdaten. Offline-Seite ermöglicht neue Textentwürfe, die später bewusst übernommen werden.
- Sicherung ist privat per RLS, aber nicht Ende-zu-Ende-verschlüsselt. Sitzungen, Passwörter, Tokens, Mikrofon-Geräte-IDs, Audio und Agentenzugänge gehören nicht hinein. Freitext kann persönliche Informationen enthalten; Auswahl/Export sind sichtbar.

## Offene, getrennt zu prüfende Arbeiten

1. Physischer Mikrofontest in dem Browser/auf dem Handy, auf dem der Fehler auftritt. App-Rechte können eine gesperrte Betriebssystemfreigabe nicht umgehen.
2. Echte Infomaniak-/VocalLab-/Hermes-Abnahme mit Nutzerkonto und freigegebenem Testinhalt. Bisherige Fixtures ersetzen diese nicht.
3. Persönliche Mail- und Anrufintegration: Der sichere Anschluss im App-Code ist vorbereitet, der jeweilige externe Kontenanschluss bleibt offen. Keine zusätzlichen externen Einstellungen ohne passenden Auftrag.
4. Konten/Daten der externen Apps vollständig zusammenführen; ein Link allein ist keine Integration.
5. Startseite weiter optimieren: mobile Lighthouse-Leistung aktuell 87; Ziel ≥ 90 noch nicht erreicht. Vier weitere Hauptseiten erreichen im Median 91–96.
6. Optional später automatischer, zusammenführender Mehrgeräteabgleich. Dieses Paket liefert bewusst überprüfbare Sicherungsstände mit Versionskonflikten.

## Prüfprotokoll dieses Pakets

- Produktionsbuild und TypeScript erfolgreich. Ein zwischenzeitlicher Fehler im generierten Next-Font-Cache wurde durch einen sauberen Build behoben; keine Fontdateien oder Nutzerdateien gelöscht.
- 71 Unit-/Integrationstests erfolgreich; zusätzlicher erneuter Test der getrennten Maildateien nach Umstellung auf das beschreibbare Datenvolume erfolgreich.
- Vier Browserprüfungen mit lokalen Fixtures erfolgreich: Assistent/Kürzel/Einordnung, Chat/Audio-Abbruch, 11 wiederhergestellte Räume einschließlich Geburtsberechnung/Ideenboard/Fokus, neue Begleiter-/Geräte-/Wetter-/Sicherungsfunktionen. Handybreiten 320 und 390 px geprüft, kein verdecktes Promptfeld, keine JavaScript-Fehler. Der Chat-Test nutzt echten MediaRecorder mit synthetischem Audioeingang; das ist kein physischer Mikrofontest.
- Gerätefehler mit erfolgreichem erneutem Aufnahmeversuch, lokaler Pegeltest ohne Upload, ausgewählter Eingang, kein automatisches Chat-Senden, reduzierte Bewegung, Seitenleistenfarbe bei Wetterwechsel, Offline-Entwürfe, Versionskonflikt und Kontenwechsel geprüft.
- Mailcache getrennt je Nutzer; offene Maildetails verschwinden bei verlorener Sitzung. Bestehende gemeinsame Cachedatei nicht importiert oder gelöscht.
- Beide neuen Supabase-Migrationen angewendet. Transaktionaler RLS-Test mit zwei temporären Testidentitäten erfolgreich und vollständig zurückgerollt: eigener Zugriff, fremder Zugriff blockiert, Eigentümerwechsel blockiert, Schreiben ohne App-Zugang blockiert, anonymer Zugriff blockiert. Advisors melden keine Befunde zur neuen Tabelle; bestehende Befunde fremder Bereiche bleiben unberührt.
- Vexp `verify_done`: keine gebrochenen Imports, Parsefehler oder ausstehenden strukturellen Abhängigkeiten. Native CSS-/Browserprüfungen ergänzen den Index.

Die Performance-Messungen verwenden mobile Lighthouse-Simulation auf dem lokalen Produktionsbuild, je drei Läufe mit Konto-/Daten-Fixtures. Das ist keine Messung einer echten Sitzung über die Mobilfunkverbindung zum VPS. Kein 3D-Renderer wird auf den fünf Hauptseiten geladen. Die Sonne wird bereits serverseitig mit optimierter Bildgröße ausgeliefert; Einstellungen und Fokusdialogcode werden erst beim Öffnen geladen. Die Startseite liegt noch unter dem Ziel von 90 und bleibt als konkrete Performance-Arbeit offen. Ein Versuch mit zusätzlichem Font-Preload wurde wegen schlechterer Messwerte verworfen.


| Route | Performance (Median) | Accessibility | LCP | TBT | JS unkomprimiert |
|---|---:|---:|---:|---:|---:|
| `/login` | 95 | 100 | 2.93 s | 22.0 ms | 653 KiB |
| `/notiz` | 93 | 100 | 3.23 s | 12.0 ms | 814 KiB |
| `/dashboard` | 87 | 100 | 3.83 s | 14.0 ms | 824 KiB |
| `/dashboard/vision/tasks` | 91 | 100 | 3.46 s | 8.0 ms | 951 KiB |
| `/dashboard/kanban` | 96 | 100 | 2.71 s | 12.5 ms | 832 KiB |

Alle 15 Läufe ohne Konsolenfehler. Der einzelne zusätzliche Font-Preload-Versuch gehört nicht zu diesen endgültig gewählten Messwerten. Messwerte sind reproduzierbar mit `scripts/audit-workspace-local.mjs`; die Übersicht liegt in [GUIDING-COMPANION-LIGHTHOUSE.json](./GUIDING-COMPANION-LIGHTHOUSE.json).

## So bedienst du die neuen Funktionen

1. Rechts unten öffnet die lila Sonne oder das kleine Menü Trinity. **Alt+Y** setzt den Cursor in den Prompt.
2. Zahnrad → **Mikrofon** → Eingang wählen → **Mikrofon testen & freigeben**. Der Pegeltest läuft nur lokal und endet automatisch nach 15 Sekunden.
3. **Alt+X halten** diktiert; Loslassen liefert zuerst editierbaren Text. **Alt+H halten** ergänzt, **Alt+C** sendet bewusst. Auf dem Handy: **Klick statt Halten**, sprechen, **Stopp**, Text prüfen, senden.
4. **Begleiter & Stimme** wählt Drache/Lichtgestalt/Lebensbaum, Farbe, Bewegung und optionale Sprachausgabe. **Darstellung** enthält den stufenlosen Hell–Dunkel-Regler, Tageslicht und Wetter mit selbst gewähltem Ort.
5. **Geräte & Sync**: Bereiche auswählen, lokalen Export behalten, Serverstand prüfen und Sicherung ausdrücklich bestätigen. Auf einem anderen Gerät mit demselben Konto den Stand prüfen und bewusst wiederherstellen. Ein neuerer Stand oder Konto-Wechsel verhindert versehentliches Überschreiben.
6. **Meine Apps → Buzz** öffnet den bestehenden Portal-Einstieg. Die dortige Einladung und Kontenverknüpfung sind weiterhin getrennt.

Für dieses Paket sind **keine neuen Env-Variablen oder Schlüssel** nötig. Die vorhandenen Infomaniak-/VocalLab-/Hermes-Werte und SMTP-Einstellungen bleiben wie eingerichtet.

## Veröffentlichung und Live-Nachweis

- Anwendungscode `f860eb5c8d8bdfd7ee9e7661b32585d293204416` zuerst auf [Staging](https://trinity-stg.youareneo.com/notiz), anschließend entsprechend der bestehenden Freigabe auf der [Hauptdomain](https://trinity.youareneo.com/notiz) veröffentlicht. Dieser abschließende Dokumentationsnachtrag ändert keinen Anwendungscode.
- Ausschließlich `docker compose up -d --build` in den beiden freigegebenen App-Ordnern. Je Instanz 50 übertragene Dateien anhand SHA-256 überprüft; Konfiguration und alle vorher erfassten Env-Dateien unverändert. Rückkopien und vorheriges Image sind in `.codex-backups/companion-*` dokumentiert.
- Pro Instanz 24 Seiten-/API-Prüfungen und 23 statische Assets erfolgreich. Weitere fünf Prüfungen bestätigen Anmeldungspflicht beim Schreiben, Herkunftsprüfung und ungültige Wetterkoordinaten. Tatsächliche Orts-/Wetterabfragen und optimiertes Sonnenbild erfolgreich; das gelieferte 128px-WebP der Sonne hat 2.316 Bytes.
- Im Live-Browser: richtiges Mikrofon-Einstellungsfenster, Darstellungsregler, globales Chatfenster und Energiebegleiter sichtbar. Auf der Hauptdomain bleibt die Seitenleiste beim Wechsel Notizen → Gehirn → Notizen bestehen. Keine private Notiz geschrieben, keine Mail verschickt, keine Sprache an KI-Anbieter gesendet.
- Der neue öffentliche Wetter-Leseendpunkt und die selbstprüfenden privaten Routen sind in der Übergabe dokumentiert. Die abweichenden Original-Übergabedokumente auf dem Server wurden bewusst nicht überschrieben; maßgeblicher neuer Vertrag steht in diesem PR.

Das Paket ist veröffentlicht; die oben ausdrücklich offenen Abnahmen und Integrationen bleiben offen. Insbesondere bedeutet ein bestandenes lokales Audio-Fixture nicht, dass das physische Mikrofon im Browser des Nutzers bereits abgenommen ist.
