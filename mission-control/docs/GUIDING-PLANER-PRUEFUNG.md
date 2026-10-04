# Prüfung · Planer und Seitenwelten

4. Oktober 2026. Ausführbarer App-Stand: `a72d10b22589a67dacf6f4aebb03051e9b1ba2c5`, PR #26, Branch `codex/guiding-planner-worlds` auf PR #25.

## Lighthouse, Bundle und Konsole

Lokaler Produktionsbuild, Lighthouse 13.5.0, mobiler Bildschirm 412 × 823 px, DPR 1,75 und Lighthouse-Standarddrosselung für Mobilgeräte. Drei unabhängige Browserkontexte je Route, Browsercache jeweils geleert. API-Antworten simulieren ein angemeldetes Mitglied mit kleinen Testdaten; keine produktiven Sitzungen, Mails oder KI-/CRM-Anfragen. Diese Messungen ersetzen keinen späteren Test mit echten Konten und Mobilgeräten. Der erste Labordurchlauf zeigt ausdrücklich den schwächeren Kaltstart; berichtet wird der Median aller drei Läufe.

| Route | Einzelwerte Tempo | Median | Barrierefreiheit | Best Practices | LCP | TBT | CLS | JS unkomprimiert |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/dashboard/labor` | 86 / 90 / 90 | 90 | 100 | 100 | 3.54 s | 12 ms | 0.000 | 727 KiB |
| `/dashboard/goals` | 90 / 92 / 90 | 90 | 100 | 100 | 3.60 s | 36 ms | 0.000 | 785 KiB |
| `/dashboard/kanban` | 90 / 90 / 90 | 90 | 100 | 100 | 3.59 s | 11 ms | 0.000 | 907 KiB |
| `/gehirn` | 92 / 95 / 92 | 92 | 100 | 100 | 3.30 s | 26 ms | 0.000 | 915 KiB |
| `/dashboard/calendar` | 90 / 95 / 95 | 95 | 100 | 100 | 2.94 s | 32 ms | 0.000 | 776 KiB |

Alle 15 Läufe: keine Konsolenfehler, keine externen Anfragen und keine Schreibanfragen. Das 3D-Paket bleibt auf Gehirn und Kalender beschränkt. Geschlossene Dialoge laden auf Labor, Kanban und Kalender kein Framer-Motion-Paket. Der Kanban-Start spart rund 111 KiB JavaScript; Kartenbewegung bleibt per DndKit und kurzer CSS-Animation erhalten, der Editor lädt erst beim Öffnen. Die vier Bildausgaben benötigen zusammen rund 164 KiB, passende Bildgrößen und Qualität 60 werden vom vorhandenen Next-Optimizer geliefert.

Maschinenlesbare Werte: `GUIDING-PLANER-LIGHTHOUSE.json`.

## Funktionsprüfungen

Produktionsbuild einschließlich TypeScript bestanden; 92 Unit-Tests bestanden. Vexp prüft den vorhandenen Teilindex: keine bekannten Import- oder Parsefehler. Die vollständigen Build- und Browserprüfungen ergänzen diesen begrenzten Index.

- `test-planner-worlds-browser.mjs`: alle zehn Kategorien sichtbar, drei Gruppen und verschiedenfarbige Rahmen; manuelle Menüstellung; Lebensrad mit Pointer/Tastatur/Persistenz; zwölf Monate und sämtliche Planerseiten; Reiseübernahme ohne Duplikate und ohne Verlust älterer Prioritäten; Ritual-Tracker; 42-Tage-Headerkalender und gemeinsame Sichtbarkeit; Erhalt alter Kanban-Karten, Verschieben, echtes Drag & Drop und Bearbeiten über nachgeladenen Editor; Plus im Journal öffnet den tatsächlich angeklickten Kalendertag; kompakter Graph und Handyansichten 320/390 px ohne Überlauf oder Seitenfehler.
- `test-journal-browser.mjs`: bestehende Ziele und Notizen; neue Zettel; Headerwerkzeuge und Gast-Header; geordneter Fokusplan; automatischer Wechsel 45 Minuten Arbeit / 10 Minuten Pause mit Video- und Audioelement; Kalenderimport; Handyansichten.
- `test-studio-browser.mjs`: Notebook-Schublade, Kategorienausklappen, Kalender-Tabs und Erde, Meeting-Räume und Einladung mit Testdaten, CRM-Vorschau und Kontotrennung, Gehirn-Auswertungen.
- `test-workspace-browser.mjs`: Suche/Befehlspalette, Fehler/Wiederholen, Rennen zwischen Suchanfragen, Notiz-Direktlink, Hilfe und lokale Login-Formularprüfungen. Bisherige Ziele und Journale bleiben unter `/dashboard/journal-legacy` erreichbar.
- `test-logo-communication-browser.mjs`: geschichtete lila Sonne, transparente Assets, Bewegungseinstellung, Kommunikation, Raum-Persistenz, Duplikat-/Zugangsdatenprüfung und Telefonwidget.
- `test-brain-browser.mjs`: 2000 Testknoten, mobiler 2D-Rückfall, Suche/Vorschau/Wiederholen/Leerzustand; kein Überlauf oder Seitenfehler.

Die Prüfroutinen ändern keine echten Kalender, Kontakte oder Mitgliedskonten. Alle ursprünglichen Funktionen und Speicherschlüssel bleiben erhalten; die neuen Jahres-/Tagesfelder werden von der vorhandenen Arbeitsbereich-Sicherung erfasst. Diese Änderung richtet keine automatische Cloud-Synchronisation lokaler Planerdaten ein.

## Spätere gemeinsame Abnahme

Auf Nutzerwunsch weiterhin offen: echte Anmeldung und Magic Link, Mikrofon auf dem Handy, Infomaniak-Transkription, Hermes-Freigabe, reale CRM-Synchronisation und Mailversand. Keine neuen Env-Variablen erforderlich. Die Live-Abnahme mit diesen Anbietern bleibt davon getrennt.

## Auslieferung

Staging und Produktion laufen mit App-Commit `a72d10b22589a67dacf6f4aebb03051e9b1ba2c5`. Pro Instanz: 126 kombinierte Quell-Hashes geprüft, 91 HTTP-/Asset-Prüfungen bestanden, Container aktiv und Datenvolumen schreibbar. `.env`, `auth-mail.env` und Compose-Datei unverändert. Nur die beiden mission-control-Verzeichnisse wurden beschrieben, der Deploy erfolgte mit `docker compose up -d --build`. Traefik und die anderen Dienste wurden nicht geändert oder neu gestartet.

Der erste Produktionsbuild brach im bestehenden Google-Schriftlader ab (`next/font/google queries have exactly one entry`). Die Quelldateien wurden zurückgesetzt, die bisherige Produktionsversion blieb verfügbar. Der erneute Build desselben Stands sowie die anschließenden Prüfungen waren erfolgreich.

Die bestehende Produktionsansicht `/notiz` wurde nach Prüfung auf offene Eingaben neu geladen; neuer Monatskalenderknopf und neues Kopfbild sind sichtbar. Keine echte Anmeldung oder Aufnahme durchgeführt. Das serverseitige Übergabedokument mit Claudes parallelen Änderungen wurde beim Paketieren ausdrücklich ausgespart. Dieser Prüfbericht und die JSON-Messwerte ergänzen den PR als Dokumentations-Commit; sie ändern den laufenden App-Stand nicht.
