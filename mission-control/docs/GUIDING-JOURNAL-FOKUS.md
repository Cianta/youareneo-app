# guiding.space · Journal, Kalender und gemeinsamer Fokus

Stand: 3. Oktober 2026. Branch `codex/guiding-journal-focus`, auf PR #22 (`95de75d`). Die Fotos aus „Planer Bilder“ dienten als Vorlage für die Struktur; private handschriftliche Inhalte und Fotos werden nicht in das Repository kopiert.

## Bedienung

- **Mein Raum**: Übersicht, Kanban, Ziele & Notizen, Kalender & Plan, Daten-Gehirn. **Arbeiten**: Ideenboard, Projekte, Daten-Labor und Postfach. **Entdecken** startet eingeklappt. Name und Himmelskompass stehen unter dem Logo; die sechs bisherigen Astro-/Human-Design-Perspektiven bleiben erreichbar. Die chinesische Monatsanzeige zeigt Element, Farbe und Tier.
- Oben: Lesezeichen vor der Suche, gemeinsamer kleiner Fokusring, **Fokus**, Notizbuch, Einstellungen, Darstellung und Abmelden. Der Ring öffnet Timer und Musik; **Fokus** wählt Ziele, Projekte, Aufgaben, Notizen und Termine mit Dauer und Reihenfolge. Das ist derselbe Timer wie auf der Übersicht und im bisherigen Fokusraum.
- **Ziele & Notizen** ist das Journal: Jahreskompass, vorhandener Wochen-/Chancenplaner, Monatsrückblick und Lebenskompass, dazu Jahres-/Monatsarchiv mit farbigen Papiernotizen. Farbe, Neigung, Datum, Dauer, Ort, Bild und Links sind bearbeitbar. Ein Bild kann lokal hochgeladen werden (JPEG/PNG/WebP bis 500 KB) oder als HTTPS-Link hinzugefügt werden. YouTube-Videos werden erst beim Öffnen ihrer Einbettung geladen; andere Links öffnen extern.
- **+**, Ziehen oder die geordnete Suchliste stellt den gemeinsamen Tagesplan zusammen. Reihenfolge, Zeit, Dauer und Erledigung sind bearbeitbar. Die ersten drei Schritte bleiben mit den vorhandenen Tagesprioritäten verbunden; Chancen, Dankbarkeit und Lernerfahrungen bleiben erhalten. Alte Prioritäten werden auch ohne erneutes Hinzufügen sofort im Fokus angeboten.
- **Kalender & Plan**: großer Monat mit bis zu vier sichtbaren Einträgen je Tag; farbige Jahresbelegung daneben, vorhandene Wochen-/Tagesansicht darunter. Rechts Kalenderauswahl, Tagesplan und Live-Plan. Bei Einträgen mit gewähltem Ort dreht sich die Erde dorthin; Orte werden bewusst gesucht, kein GPS. Für importierte Ortsnamen ohne Koordinaten wird kein Standort erfunden.
- **Kalender einbinden (+)** erlaubt mehrere Google-/Apple-/ICS-/lokale Kalender in eigenen Farben. ICS-Datei wählen oder Google-/iCloud-Abonnementlink verwenden, Anzeige mit Häkchen umschalten und Abo mit ↻ aktualisieren. Eingelesen wird das gerade ausgewählte Jahr. Aktualisierung ersetzt nur importierte Einträge dieses Kalenders/Jahres; eigene Einträge bleiben erhalten.
- **Meine Apps** enthält auch Archiv der Lebenskünste; Buzz bleibt als bestehender Portal-Link erhalten. Daten-Labor gruppiert vorhandene Programme nach Audio, Video, Bildern, Dokumenten, CRM, Kommunikation, Marketing, Daten und weiteren Bereichen. Verfügbare Markenbilder liegen lokal, übrige Programme haben eigene Buchstabensymbole.
- Die animierte Logo-Sonne verwendet nun dieselbe **lila Trinity-Sonne** wie das Installationssymbol. Der Einstieg der Assistentin rechts unten ist halb so groß; die Bedienknöpfe bleiben anklickbar.

## 45 Minuten arbeiten, 10 Minuten Pause

Jeder ausgewählte Schritt reserviert `ceil(Dauer / 45)` Fokusblöcke. Beispiel: 60 Minuten Ziel + 15 Minuten Notiz ergeben drei Blöcke und zwei Zwischenpausen, 155 Minuten reservierte Zeit; anschließend zehn Minuten Abschluss-Pause. Die Reihenfolge bleibt erhalten. Der Abschluss markiert Aufgaben nicht automatisch als erledigt.

Nach jedem 45-Minuten-Block startet automatisch eine zehnminütige Pause mit Pausenmusik und einem bildschirmfüllenden Ruhebild/Video. Danach startet der nächste gewählte Block. Nach dem letzten Block und seiner Pause erscheint der Abschluss. **Zur App** schließt nur das Pausenbild, der Timer läuft weiter. **Stoppen** beendet die Warteschlange. Nach Neuladen startet kein gespeicherter Timer heimlich neu.

Der Pausenbildschirm ist ein natives Dialogfenster mit gefangener Tastaturführung und bedeckt die App. Echte Browser-Vollbilddarstellung erfordert den bewussten Knopf **Bildschirmfüllend**. Video startet stumm; Musik nutzt die bestehenden globalen Ton- und Lautstärkepräferenzen. Browser können automatische Wiedergabe blockieren; dann bietet die Musiksteuerung eine Freigabe per Klick. Ein eigenes bestehendes Video wird bevorzugt, sonst werden die vorhandenen YouTube-Naturvideos genutzt. Deren Verfügbarkeit/Wiedergabe ist von YouTube und Browserregeln abhängig.

Die beiden mitgelieferten Musikschleifen sind neu synthetisierte, ruhige Klangflächen, keine lizenzpflichtigen Fremdaufnahmen. Reproduzierbar mit `scripts/generate-focus-audio.py` und ffmpeg. Eigene gespeicherte Musik hat weiter Vorrang. Die Steuerung bietet Titelwechsel, Ton, Lautstärke und eine klickbare Zeitleiste; Musikfortschritt schreibt keine großen Audiodateien sekündlich in IndexedDB.

## Kalenderzugriff und Speicherung

Das Paket bietet **Leseimport mit manueller Aktualisierung**. Es richtet keinen privaten Google-/Apple-OAuth-Zugang ein und schreibt keine Termine an Anbieter zurück. Die bisherigen Schaltflächen, die eine verbundene Anmeldung lediglich vortäuschten, sind durch den tatsächlichen Kalenderimport ersetzt. ICS-Freigabelinks sind sensibel; eine private Datei ist eine Alternative zum veröffentlichten Kalender. Anleitung: [Google iCal-Integration](https://support.google.com/calendar/answer/37648), [Apple Kalender teilen](https://support.apple.com/guide/icloud/share-a-calendar-mm6b1a9479/icloud).

Kalenderabo-URLs liegen ausschließlich im lokalen Kalenderstore und werden aus Exporten sowie freiwilligen Serversicherungen entfernt. Nach Wiederherstellung auf einem anderen Gerät sind Termine/Farben da; Abonnementlinks müssen neu eingetragen werden. Journal, Planung und Kalender sind weiterhin lokale Bereiche mit bewusst ausgelöster Sicherung, kein automatischer Mehrgeräteabgleich. Supabase-Sprachnotizen und deren Hermes-Freigabe bleiben in ihrem bestehenden Bereich und sind vom Journal aus erreichbar.

Der ICS-Parser ist auf 2 MB, maximal 5.000 Termine und begrenzte Wiederholungsdurchläufe beschränkt. Ausnahmen, Ausschlüsse, mehrtägige Ganztagstermine und mitgelieferte VTIMEZONE-Definitionen werden verarbeitet. Fehlende Zeitzonen und extreme Sekunden-/Minuten-/Stundenwiederholungen werden mit Hinweis ausgelassen. Abonnementabruf akzeptiert ausschließlich fest erlaubte Google-/iCloud-Kalenderpfade, keine Umleitungen, keine beliebigen Serveradressen. Daten werden nicht serverseitig gespeichert oder protokolliert.

## Schnittstellen und Herkunft

- Additiv `POST /api/calendar/feed` mit `{url:string}` → `{text:string}`; frische Anmeldung und gleiche Herkunft erforderlich. Fehler `{success:false,error:string}` mit 400/401/403/413/502. Leseabruf, kein Schreiben zum Kalenderanbieter. Zehn Sekunden Timeout und 2 MB Antwortlimit.
- Bestehender Snapshot Version 1: erlaubter Schlüssel `trinity-temporal-v2` hinzugefügt; `trinity-personal-v1` ergänzt `planItems` und `years`. Kalender-URLs müssen leer sein. Alte Exporte bleiben lesbar; neue Exporte mit Kalenderanteil benötigen diese oder eine spätere App-Version. Keine neue Tabelle/Migration, kein Cookie-/Login-/Provisioning-Wechsel.
- Weltkarte aus [Natural Earth](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson), Public Domain. Lokal gespeichert; Three.js wird für diese Erde erst auf der Kalenderseite geladen. Bei fehlendem WebGL gibt es eine ruhige CSS-Erde, bei reduzierter Bewegung keinen automatischen Umlauf.
- Markenbilder aus [Simple Icons](https://github.com/simple-icons/simple-icons), CC0; Markenrechte bleiben bei den jeweiligen Inhabern. Keine entfernten Favicon-Abfragen beim Laden des Labors.
- Keine neuen Env-Variablen oder Schlüssel nötig. Bestehende Serverkonfiguration und ausgeschlossene Dienste bleiben erhalten.

## Prüfen

1. Journal öffnen: alte Ziele, Tagesprioritäten und Ideen sehen; farbige Notiz erstellen, bearbeiten, Bild/Link hinzufügen und per + in den Tagesplan aufnehmen. Datum wechseln und wieder zurück.
2. Fokus oben: heutigen Plan übernehmen, Reihenfolge/Dauer ändern, starten. Auf eine andere Seite wechseln: kleiner Ring läuft mit. Ring öffnen: pausieren/neustarten, Musik wechseln, Zeitleiste und Lautstärke bedienen, stoppen.
3. Nach 45 Minuten: automatische zehnminütige Pause, Ruhevideo und Pausenmusik; danach nächster gewählter Block. Browser-Ton bei Bedarf bewusst freigeben.
4. Kalender: Monats-/Jahresauswahl, Termin mit Ort, + zum Tagesplan, Kalenderdatei einlesen, Sichtbarkeit und Farben prüfen. Ein erneuter Import desselben Abos/Jahres erzeugt keine Duplikate.
5. Handy: Header-Icons, untere Tab-Leiste, Journalnotizen, Wochen-/Monatskalender und Trinity-Einstieg bedienen. Bestehende Astro-, Ideenboard-, Radio-/Rezept- und Assistentenrouten bleiben erreichbar.

Mess- und Veröffentlichungsnachweis stehen unten. Echte Konto-/Mikrofon-/KI-Abnahme bleibt entsprechend dem Nutzerwunsch separat; lokale Fixtures geben keine solche Abnahme vor.

## Technische Prüfung

Produktionsbuild und TypeScript erfolgreich. Alle 80 Unit-/Integrationstests erfolgreich, darunter neun neue Tests für Fokusblöcke, Hintergrundtimer, erhaltene Prioritäten/Reflexionen, Monatsraster, ICS-Wiederholungen/Ausnahmen/Ganztagstermine, Zeitzonen-/Größenlimits, erlaubte Feedpfade und das Entfernen von Abo-URLs aus Sicherungen. Vexp meldet keine gebrochenen Imports, Parsefehler oder offenen strukturellen Abhängigkeiten.

Lokale Browser-Fixtures bestätigen neue Headerfenster, Lilasonne, Journalbearbeitung, alte Prioritäten, geordnete Fokusblöcke, Neustarten/Stoppen, automatische 45/10-Pause, Musikwechsel zur Pause, ICS-Dateiimport und 320/390-Pixel-Ansichten ohne horizontales Überlaufen. Die Erde lädt ihren 3D-Renderer erst im sichtbaren Kalenderbereich. Zusätzlich sind wiederhergestellte Räume einschließlich Ideenboard/Geburtsberechnung, Begleiter-/Geräte-/Sicherungsfunktionen, Assistenten-Kürzel/Einordnung/Kontenwechsel und Chat-Diktat geprüft. Keine privaten Daten oder tatsächlichen Kalenderkonten angelegt; externe Videoaufrufe im Fixture blockiert. Die tatsächliche Video- und Musikwiedergabe im Browser des Nutzers bleibt getrennt zu prüfen.

## Lighthouse und Bündelprüfung

Mobiler Lighthouse 13.5.0 auf dem lokalen Produktionsbuild, je drei Läufe mit Konto-/Daten-Fixtures, Median. Kein Mobilfunk-/VPS- oder echter Konto-Test. Alle 15 Läufe ohne Konsolenfehler, unerwartete externe Zugriffe oder Schreibvorgänge.

| Route | Performance | Accessibility | LCP | TBT | JavaScript unkomprimiert |
|---|---:|---:|---:|---:|---:|
| `/login` | 96 | 96 | 2.85 s | 11.0 ms | 664 KiB |
| `/notiz` | 93 | 100 | 3.08 s | 11.5 ms | 878 KiB |
| `/dashboard` | 86 | 100 | 3.97 s | 15.0 ms | 886 KiB |
| `/dashboard/goals` | 91 | 100 | 3.46 s | 33.0 ms | 896 KiB |
| `/dashboard/calendar` | 91 | 100 | 3.45 s | 54.5 ms | 906 KiB |

Journal, Kalender, Notizen und Login erreichen das Performance-Ziel ≥ 90. Die Startseite erreicht 86; das Ziel ist dort weiterhin offen. Login hat einen verbleibenden Kontrastbefund (Accessibility 96), die vier anderen Seiten erreichen 100. Die Kalenderseite lädt vor Sichtbarkeit der Erde keinen 3D-Renderer. Gegenüber dem ersten Lauf dieses Pakets sinkt ihr JavaScript von 1.683 MB auf 0.928 MB und TBT von 271.5 auf 54.5 ms; Performance von 84 auf 91. Das ist ein lokaler Vergleich unter denselben Fixture-Bedingungen, keine allgemeine Geschwindigkeitsgarantie.

Endgültige Werte: [GUIDING-JOURNAL-LIGHTHOUSE.json](GUIDING-JOURNAL-LIGHTHOUSE.json). Reproduzierbar mit `scripts/audit-workspace-local.mjs`.

Zusätzliche Live-Korrektur: Der Gast-Header verwendet jetzt ein zugänglich als „Anmelden“ beschriftetes Login-Symbol. Der zuvor überlappende Textknopf entfällt auf schmalen Bildschirmen. Die Browserprüfung kontrolliert zusätzlich die tatsächlichen Abstände aller Headeraktionen bei 320 und 390 px, auch ohne Anmeldung. Ein lokaler Fehler im generierten Next-Font-Cache wurde durch erneutes Erzeugen ausschließlich des Buildverzeichnisses behoben; Quellcode und Nutzerdaten blieben erhalten. Die Lighthouse-Tabelle wurde vor diesem kleinen Gast-Header-Fix auf Commit `137072e` gemessen.
