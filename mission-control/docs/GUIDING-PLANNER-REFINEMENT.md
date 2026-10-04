# Kalender, Journal und Chart – Gestaltungsrunde

Stand: 04.10.2026. Grundlage: `48d88f8` / PR #28.

- Jede der 14 Hauptseiten mit WorkspaceArtwork hat ein eigenes Motiv. Zehn neue Seitenbilder und fünf zusätzliche Systembilder wurden mit dem eingebauten Imagegen erzeugt. Die bestehenden Tempel- und Projektbilder bleiben erhalten. Die App lädt optimierte, versionierte WebP-Dateien mit hoher Priorität für das erste Seitenbild; vollständige PNG-Originale und der Prompt-Satz liegen im Bilderordner auf dem Desktop.
- Kalender: Monats-/Jahres-/Wochen-Tabs links, gemeinsame Kalenderauswahl im Kalenderkopf, Erde und direkte Auswahl aus Zielen, Notizen, Terminen, Projekten und Aufgaben rechts. Der Tagesplan steht darunter in voller Breite der rechten Spalte. Chancenplaner und Rückblicke sind dort weiterhin aufklappbar. Tagesplan, Prioritäten und Fokustimer nutzen ihre vorhandenen Daten.
- Journal: Lebensrad ohne doppelte Regler. Daneben letzte Journalnotiz, wählbares Hauptziel und drei Monatsziele sowie drei Tagesprioritäten. Die Tagesprioritäten ändern dieselben Felder wie Wochen- und Tagesplan. Die 14 Planeransichten, Reiseplanung, Jahreskompass und Notizen bleiben erhalten. Der Wochenplan ist in kompakte, verschiedenfarbige Tageskarten gegliedert.
- Die Notizschublade hat eine Buchbindung, Papierlinien und körperlich wirkende Zettel mit Magneten. Speichern, Suche, Bearbeiten, Anhänge und alte Notizbuch-Einträge bleiben verfügbar. Freie Papierfarben behalten eine kontrastgerechte Schriftfarbe.
- Kanban: drei unterschiedlich gefärbte Bereichsbuttons. Eigene Boards, Trello und Archiv behalten ihre Daten und Funktionen.
- Datenlabor: fünf vertikale Spalten in der gewünschten Reihenfolge. Daten & Automationen bleibt zusätzlich in Spalte fünf. Auf kleinen Bildschirmen werden die Karten in zwei Spalten gelesen. Gruppen, Suche und große Kategorieansicht behalten sämtliche Werkzeuge.
- Die neue Gestaltung lädt pro Bereich: Kalender-, Journal-, Chart-, Labor- und Kanban-CSS kommen nur auf den jeweiligen Seiten hinzu. Der aufklappbare Wochenplan im Kalender lädt seine Komponenten erst beim Öffnen. Auf dem Handy öffnet der Kategorie-Kopf alle Werkzeuge; der doppelte kleine Öffnen-Button entfällt.
- „Dein Chart“ im Menü: kompakter Geburtsprofil-Editor neben dem Soul-Blueprint-Überblick. Gespeicherte Ergebnisse erscheinen darunter in sechs Tastatur-bedienbaren System-Tabs. Tierkreis und Human-Design-Diagramme verwenden berechnete Daten; die großen Hintergrundbilder sind dekorative Illustrationen. Dreamspell wird weiter ausdrücklich vom traditionellen Maya-Tzolk’in unterschieden. Tagesenergien, frühere Astroansichten und Menschen/Team sind weiter erreichbar.

## Daten und Schnittstellen

Kein Auth-, Cookie-, Provider-, API-, Datenbank- oder Server-Env-Vertrag wurde verändert. Bestehende Browser-Speicher werden weiterverwendet. In `PlannerMonth` kommen optional `mainGoalId` und `goalIds` hinzu; sie referenzieren bestehende persönliche Ziele. Ältere Monatsdaten brauchen keine Migration. Die bestehende Sicherung übernimmt das komplette Monatsobjekt einschließlich dieser Felder.

## Prüfung

```sh
node node_modules/next/dist/bin/next build
node node_modules/tsx/dist/cli.mjs --test tests/workspace.test.ts tests/journal.test.ts tests/restored.test.ts tests/studio.test.ts
TEST_BASE_URL=http://127.0.0.1:3310 TEST_BROWSER_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' node scripts/test-planner-refinement-browser.mjs
```

Die Browserprüfung verwendet isolierte lokale Beispieldaten, blockiert externe Dienste und prüft die Chart-Berechnung am lokalen Server. Echte Login-, Mikrofon-, Infomaniak-, Hermes-, Mail- und CRM-Abnahmen bleiben wie vereinbart einem späteren gemeinsamen Test vorbehalten. Veröffentlichung erfolgt zuerst auf Staging, danach auf der freigegebenen Hauptdomain, ausschließlich in den beiden mission-control-Verzeichnissen.
