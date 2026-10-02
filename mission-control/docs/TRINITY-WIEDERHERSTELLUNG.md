# Trinity: frühere Räume und helle Grundfarben

Stand: 2. Oktober 2026. Ausgangspunkt: `12d0e33` (PR #19). Referenz für frühere Funktionen: `feat/trinity-living-workspace`, Commit `7b90c63`. Nur gezielte Übernahme; Supabase-Anmeldung, Notizen, Gehirn, neue Apps und globaler Sprachassistent bleiben erhalten.

## Warum Bereiche fehlten

Die neue Startseite ersetzte die frühere Übersicht durch Einstiegskarten. Viele bestehende Routen wurden ins Labor verschoben. Sechs zusätzliche Seiten und die persönliche Astrologie aus dem früheren Entwicklungsstand waren in diesem Zweig noch nicht integriert. Deshalb wurde nicht der gesamte frühere Quellstand zurückgesetzt.

## Wieder erreichbar

| Bereich | Zugang | Erhaltene / wieder eingebundene Funktionen |
|---|---|---|
| Startseite | `/dashboard` | Originales Sanctuary-/Tempelmotiv, Tagesbegrüßung, Board-Aufgaben, Erledigen, Termine heute, Fokus, eigene App-Links |
| Ideenboard | `/dashboard/eden`, direkt im Menü | Bestehende Canvas-Boards/Karten/Verbindungen; zusätzliche Tabellen, Diagramme, Formeln ohne `eval`, Kontaktkarten, Word/PDF-Export und Kontextmenü |
| Tagesplan & Ziele | `/dashboard/goals`, direkt im Menü | Tag/Woche/Monat, Top 3, Reflexion, Energie, Chancen, Lebensbereiche, Ziele, Gründe, Mindmap/Pyramide und Fortschritt |
| Kalender | `/dashboard/calendar`, direkt im Menü | Wochenübersicht, Terminerstellung und Bearbeitung, Überschneidungen, Fokusstart |
| Astrologie & Identität | `/dashboard/soul`, direkt im Menü | Himmelskompass mit Mond, westlichen/vedischen und chinesischen Systemen, Maya/Tzolkin und modernem Dreamspell/Baumkalender; Geburtsprofile, Ortssuche mit Zeitzone, Sonnen-/Mondzeichen, Aszendent bei vorhandener Zeit/Koordinaten, Human Design mit Zentren, Kanälen und Toren |
| Team Flow | `/dashboard/ninjas` | Vorhandene Teamansicht plus Profilberechnung und symbolischer Vergleich mehrerer Personen |
| Fokus & Meditation | `/dashboard/meditation`, direkt im Menü | Vorhandene Medien plus frühere Link-Sammlung; Ruhepol-Dialog, Atemansicht, geteilter Fokus-Timer, Visual Room erst auf ausdrücklichen Klick |
| Lokales Wissensarchiv | `/dashboard/second-brain` | Frühere Notizen, verknüpfte Ziele/Boards/Profile, Markdown-ZIP und ausdrücklich ausgewählter Obsidian-Ordner; bestehendes `/gehirn` bleibt für Kontonotizen |
| Kontakte | `/dashboard/contacts` | Eigene lokale Kontakte, Suche und Kartenverknüpfung |
| Werkzeuge und eigene Links | `/dashboard/tools` | Verzeichnis, Kategorien, Aus-/Einblenden und eigene Links |
| Lesezeichen | Seitenleiste | Vorhandene Favoriten und gespeicherte Verknüpfungen |
| Frühere Gesamtübersicht | `/dashboard/labor/uebersicht` | Frühere Ideen-/Zielspalten, Kennzahlen, Agenten und weitere Module weiterhin erreichbar |

Alle Dashboard-Seiten des Referenzstands besitzen jetzt wieder eine Route in diesem Zweig. Weitere vorhandene Medien-, Matrix-, Vereins-, Self-, Agenten-, Daten- und Kommunikationsseiten bleiben im Verzeichnis/Labor und in der Befehlspalette erreichbar. Es wurden keine Inhalte oder alten Speicherschlüssel gelöscht.

## Daten und Grenzen

- Frühere Canvas-, Kanban-, Kalender-, Tagesplan-, Geburt-, Kontakt- und Wissensarchivdaten bleiben in den vorhandenen **lokalen** Speichern dieses Browsers. Auch Privat/Organisation ist dort ein lokaler Ansichtsfilter, keine Zugriffskontrolle und kein getrenntes Cloud-Konto. Auf einem gemeinsam verwendeten Browser können diese alten Daten weiterhin sichtbar sein.
- Supabase-Notizen, neue Projekte und `/gehirn` behalten ihre bisherige Kontobindung. Die Wiederherstellung verändert weder Auth-Cookies noch Profile, Zugangsrechte oder Tabellen.
- Geburtsberechnung läuft auf dem Trinity-Server mit lokalen Bibliotheken; Orte werden aus einem lokalen Städteverzeichnis gesucht. Kein externer Horoskopanbieter erhält Eingaben. Das Ergebnis wird vom Browser im vorhandenen lokalen Profil abgelegt.
- Astrologische Deutungen sind symbolisch. Vedische Lahiri-Werte sind Näherungen; Dreamspell und Baumkalender moderne Traditionen. Ohne Geburtszeit werden kein Human Design und kein Aszendent erfunden. Die Bibliothek wurde gegen ihre dokumentierte Referenz geprüft, nicht gegen sämtliche astrologischen Grenzfälle.
- Der alte MCP-/Agenten-Freigabeserver und die frühere FuseBase-gebundene HubSpot-Schnittstelle werden nicht aktiviert. Lokale Kontakte/Export funktionieren; ein Konto gebundener CRM-Abgleich ist weiterhin offen. Externe Apps behalten ihre bestehenden Verbindungen und gegebenenfalls eigene Anmeldung.
- Fokus-Timer und hochgeladener Audio-Player bleiben jeweils genau einmal im aktuellen App-Rahmen montiert. Ein fehlgeschlagener Agentenabruf zeigt einen Hinweis, lässt das Ideenboard aber verfügbar.

## Farben und Installation

Default: fast weißes Beige (`#f8f8f7`) mit kühlem Seitenleisten-/Flächenton, dunkles Türkis, Lila und Rosa; Notizen behalten grüne Akzente. Der stufenlose Helligkeitsregler bleibt erhalten. Die alte grüne Darstellung wird einmalig auf die neue helle Grundlage umgestellt; Mikrofon-, Stimm- und Lautstärkewünsche bleiben erhalten. Danach bleibt auch die neu gewählte Dunkelstufe gespeichert.

Neue öffentliche Assets unter `public/pwa/purple-sun-*`: 1254px WebP-Master, Favicon 16/32/48px, PNG 32/180/192/512px und Maskable 512px. iOS-Touch-Icon, Browser-Metadaten, Manifest und der ausschließlich öffentliche Service-Worker-Cache verwenden die neue Sonne. Bereits installierte Apps übernehmen das Icon je nach Betriebssystem verzögert; falls nötig auf dem Handy entfernen und neu zum Home-Bildschirm hinzufügen. Dabei werden keine Trinity-Kontoinhalte entfernt.

Bild erstellt mit dem eingebauten `image_gen` (keine eigene API, kein Token). Prompt: Eine einzelne mittige, möglichst fotorealistische lila Sonne mit granularer Plasmaoberfläche, Filamenten, zurückhaltender violett-lavendelfarbener Corona und rosa Licht, auf fast weißem beige-blauen Hintergrund; quadratisch, klare Kreisform und sichere Ränder für App-Masken; ohne Buchstaben, Gesicht, Schrift, Wasserzeichen oder weitere Objekte. Original generiert am 2. Oktober 2026; abgeleitete Größen nur heruntergerechnet. Das frühere Tempelmotiv ist unverändert inhaltlich übernommen und komprimiert.

## Prüfung

- `npm run test:restored` prüft astronomische Referenzen, Zeitzonen/unmögliche Daten, sichere Medien-/Exportfunktionen, lokale Ortssuche und Erhaltung von Kanban-Metadaten.
- `npm run test:restored:browser` läuft ausschließlich gegen einen lokalen Produktionsbuild mit synthetischer Anmeldung. Prüft elf Räume, Sidebar-Erhaltung, altes Ideenboard, echte lokale Geburtsberechnung, Farb-Migration, Fokusdialog und Mobilbreiten. Keine realen Konten oder externen Anbieteraufrufe.
- Die vorhandenen Tests für Auth, Notizen, Stimme, Chat, Gehirn und Apps bleiben maßgeblich. Echte Mail-, KI-, Hermes- und Handy-Abnahme ist weiterhin vom Nutzer auf später verschoben.
- Bau, Leistungswerte und Veröffentlichung werden im Abschluss unten ergänzt. Keine neuen Env-Variablen oder Secrets erforderlich.

### Verifikation des finalen Stands

63 automatische Tests erfolgreich, TypeScript und lokaler Produktionsbuild erfolgreich. Der Browser-Test erreicht elf Räume, berechnet ein Referenz-Geburtsprofil auf dem lokalen Server, erhält das vorhandene Ideenboard und die Stimmpräferenzen bei der Farb-Migration. Der globale Assistent besteht weiterhin seinen Aufnahme-/Entwurfs-/Kontowechsel-Test. Der neue Himmelskompass-Code wird auf der Startseite erst beim Öffnen geladen; die erste Mondanzeige berechnet der Server. Das Tempelbild wird über responsive Bildoptimierung mit hoher Ladepriorität ausgeliefert. Kein 3D-Bundle auf den fünf Kernseiten.

Mobiler Lighthouse-Lauf gegen lokale Produktions-Fixtures, je ein finaler Lauf pro Seite (keine angemeldete Live-Abnahme):

| Seite | Performance | Barrierefreiheit | Konsolenfehler |
|---|---:|---:|---:|
| Login | 100 | 100 | 0 |
| Notizen | 96 | 100 | 0 |
| Tagesübersicht | 93 | 100 | 0 |
| Aufgaben | 99 | 100 | 0 |
| Notebooks & Ziele | 96 | 100 | 0 |

Vexp ist erreichbar; seine mechanische Änderungserkennung für dieses separate Git-Worktree ist nicht verfügbar. Deshalb wurden aktuelle Dateien, Git-Diff, Build, Tests und Browser direkt geprüft. Die neuen Bibliotheken laufen lokal; `fflate` ist gegenüber dem historischen Stand auf die korrigierte Version 0.8.3 aktualisiert.

Die wiederhergestellten Ruhepol-Regler steuern den einen gemeinsamen Audioplayer; vorhandene ausgewählte Arbeits-/Pausentracks werden wieder abgespielt. Der globale Ton-Schalter und seine Lautstärke gelten auch für Fokusmusik; ausgeschalteter Ton unterdrückt den Abschlussgong.
