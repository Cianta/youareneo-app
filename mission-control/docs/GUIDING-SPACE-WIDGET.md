# guiding.space · Trinity und wiedergefundene Astro-Bereiche

Stand: 02.10.2026. Eigener Branch `codex/guiding-space-widget`, auf PR #20 / `26dcdf7`.

## Name und gemeinsame Oberfläche

Das Produkt heißt **guiding.space**, der persönliche Arbeitsraum **Guiding Space**, das Konzept **Guiding System**. **Trinity** bleibt die hauseigene Assistentin. Öffentliche Namen: `NEXT_PUBLIC_APP_NAME=guiding.space`, `NEXT_PUBLIC_ASSISTANT_NAME=Trinity`. Keine neuen Secrets. Bestehende technische IDs, Datenablagen, App-Slugs und Routen bleiben bestehen, damit vorhandene Verknüpfungen und persönliche Daten weiter funktionieren. Desktop-Paketname angepasst; kein neues Desktop-Installationspaket gebaut.

Das kleine Menü unter Trinity unten rechts öffnet den Gesprächsbereich auf der aktuellen Seite. Sprachchat entfällt als Navigationseintrag; `/sprechen` bleibt als direkt aufrufbare vollständige Gesprächsseite. Mikrofon, Ton und Zahnrad bleiben im gemeinsamen Dock. Helligkeit und die bisherigen Stimmeinstellungen bleiben verfügbar.

| Bedienung | Wirkung |
| --- | --- |
| Alt+Y | Widget öffnen und Eingabe fokussieren |
| Alt+X halten | Diktieren, beim Loslassen in die Eingabe/markierte Textstelle einfügen |
| Alt+H halten | Weitere Aufnahme aufnehmen und als neuen Absatz anhängen |
| Alt+C | Den bearbeiteten Prompt ausdrücklich senden |
| Mikrofontaste halten | Auf Handy und Desktop diktieren und Text anhängen |
| Escape / Schließen | Aufnahme und Ausgabe stoppen, Gespräch schließen; Text bleibt im laufenden Tab |

Zeichen- und physische Tastencodes berücksichtigen QWERTZ sowie Option-Zeichen auf macOS; beide Y/Z-Positionen öffnen das Widget. AltGr, Texteingabe-Komposition und Wiederholung lösen keine zusätzlichen Aktionen aus. Tastenkürzel gelten im aktiven Browserfenster, nicht systemweit. Alt+Tab/Command+Tab bleiben Betriebssystem-Tasten.

**Loslassen sendet niemals automatisch.** Auch „Freihändig bis zur Sprechpause“ beendet das Mikrofon und fügt nur Text ein. Erst Senden/Alt+C startet Trinity. Neuer bewusster Aufnahmestart kann laufende Sprachausgabe unterbrechen. Nach zu frühem Loslassen startet keine verspätete Aufnahme. Beim Kontowechsel werden Entwurf und Verlauf verworfen, bevor ein alter Gedanke an das neue Konto geschickt werden könnte.

Entwurf und Verlauf bleiben beim Schließen und Seitenwechsel nur im Arbeitsspeicher erhalten; kein Gespräch in localStorage. Neuladen verwirft sie und wird bei vorhandenen Inhalten angekündigt. Maximal 4.000 Zeichen pro Sendung; längere Transkription bleibt zum Kürzen sichtbar, sie wird nicht still abgeschnitten. „Als Notiz speichern“ bleibt eine eigene Aktion; Kontext aus eigenen Notizen ist optional. Der bestehende globale Notizablauf mit Ctrl+Shift+Leertaste, Ortsvorschlag und Hermes-Freigabe bleibt erhalten.

## Vergleich mit früheren lokalen Ständen

Gezielte Vergleiche: ursprüngliches `/Users/cianta/Claude/Apps/mission-control`, dessen registrierte lokale Arbeitskopie, `trinity-renewal` auf `feat/trinity-living-workspace` / `7b90c63`, sowie `origin/feat/trinity-planner-voice`. Vorhandene fremde Arbeitskopien wurden ausschließlich gelesen.

| Quelle / früherer Bereich | Ergebnis / Zugang |
| --- | --- |
| `SidebarClock` / `EnergyPopup` der ursprünglichen App | Bisher in der neuen Shell nicht erreichbar: Monats-Mondkalender, Mondphasen, westliche Bedeutungen, Nakshatra/Pada, Dreamspell-Siegel/Ton und kommende Portaltage. Jetzt unter `/dashboard/soul` → Tagesenergien & Kalender |
| `NinjasView` der ursprünglichen App | Mit aktuellem Code identisch, keine Funktionen gelöscht. Unter Menschen & Team erreichbar: Personenprofile, Geburt/Astro bearbeiten, manuelle HD-Typen |
| `BirthProfile` / `TeamFlow` aus `7b90c63` | Persönliches Geburtsprofil, sechs Systeme und Team-Ansichten zusammen in `/dashboard/soul` |
| Bereits berechnete `BirthResult.hd`-Daten | Zentren, Kanäle, 64 Tore, Persönlichkeit/Design und Planet/Tor/Linie jetzt tatsächlich sichtbar. Neue Zentrenübersicht aus vorhandenen Daten; kein wiedergefundener historischer vollständiger Bodygraph |
| Frühere Matrix-, Ideen-, Ziele-, Kalender- und Kontaktseiten | Schon in PR #20 wieder erreichbar; bleiben erhalten |

Persönliche Geburtsprofile und bestehende Personen-/Team-Daten behalten ihre bisherigen Speicherorte und Schlüssel. Dieser Schritt führt lokale Profile nicht automatisch in eine gemeinsame Cloud-Datenbank zusammen. Geburtsberechnung bleibt hinter angemeldeten API-Routen. Der frühere HD-Helfer ohne Berechnung und manuell gesetzte Typen werden nicht als historisch vorhandener vollständiger Rechner dargestellt.

Aktuelle Himmelsdaten verwenden die vorhandene Astronomie-Berechnung. Ältere Mondkalender-/Nakshatra-Hilfen bleiben als Näherungen gekennzeichnet; Dreamspell und Portaltage sind symbolische Systeme. Die rechnerische Human-Design-Ansicht ersetzt kein geprüftes Referenzchart.

## Domain später, Vereinsadressen jetzt

Aktuell bleiben `trinity.youareneo.com` und `trinity-stg.youareneo.com` unverändert. Keine DNS-, Traefik-, Cookie-Domain- oder Redirect-Allowlist-Änderung. Erst nach Kauf und eigenem Migrationsauftrag wird `guiding.space` die Hauptdomain.

Beim späteren Umzug: Seitenlinks mit Pfad und Query erhalten; API-POSTs und Auth-Callbacks gesondert kompatibel behandeln, keine pauschale Weiterleitung aller Methoden. Iframe-Ziele, erlaubte Einbettung und Cookie-/Anmeldeübergabe testen. Das Cookie unter `.youareneo.com` gilt nicht automatisch unter `guiding.space`; eine Weiterleitung allein schafft keine gemeinsame Sitzung zwischen diesen Domainfamilien. Die frühere Vereinsadresse bleibt dann für alte Links erhalten.

Supabase-Konto, Profile, `neo_access`, Auth-/Provision-Endpunkte und Cookie-Name bleiben unverändert. Bestehende neutrale **YOU ARE NEO**-Mailvorlagen bleiben für das gemeinsame Konto mit Visual Room und Portal passend; keine Produktumbenennung der gemeinsamen Kontomails und kein Mailversand in diesen Prüfungen. Infomaniak-Schlüssel und SMTP-Zugangsdaten werden nicht verändert.

## Prüfungen und Grenzen

TypeScript, Produktionsbuild, Unit-Tests und lokale Browserprüfungen prüfen Widget, explizites Senden, Aufnahmerennen, Kontowechsel, Audioausgabe und wiedergefundene Seiten. Browserprüfungen verwenden synthetisches Audio und abgefangene Test-APIs; sie verschicken keine Mails und rufen keine kostenpflichtigen Modelle auf. Reale Login-/Infomaniak-/Hermes-/Handytests bleiben wie vom Nutzer gewünscht für später offen.

Vexp-Tools für `run_pipeline` / `verify_done` waren in dieser Sitzung nicht verfügbar. Daher gezielte lokale Quellvergleiche, Git-Diff, TypeScript, Build und echte Browser-Ausführung mit Testdaten als Nachweis.

Inspiration: gemeinsame Tastaturbedienung und kompaktes Systemmenü aus der offiziellen [Omarchy-Navigation](https://omarchy.org/manual/navigation/) und [Tastenkürzel-Dokumentation](https://omarchy.org/manual/hotkeys/). Keine Änderung des Host-Betriebssystems.
