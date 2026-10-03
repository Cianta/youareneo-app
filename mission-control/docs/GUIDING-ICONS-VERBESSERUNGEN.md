# Lilasonne, Trinity-Einstieg und Bildauslieferung

Stand: 4. Oktober 2026. Branch `codex/guiding-icons-performance`, auf PR #23 (`codex/guiding-journal-focus`) aufgebaut. Nutzer hat die Veröffentlichung auf Staging und Produktion ausdrücklich beauftragt.

## Änderungen

- Browser-Favicon als transparente Lilasonne in PNG sowie ICO mit 16/32/48/64 px. Auch `/favicon.ico` ist ersetzt. Kein weißer Bildhintergrund und kein weißer Rand.
- Installationssymbole 192/512 px mit Alpha; Android-Maskable- und Apple-Symbol mit durchgehend dunklem Lilahintergrund. Die Sonne bleibt innerhalb der sicheren Maskenfläche. Neue Dateinamen `trinity-sun-v2-*` vermeiden die alten Bild-URLs in Browser-/Manifest-Caches. Der öffentliche Service-Worker-Cache wechselt auf `neo-public-shell-v5`; die private Cache-Grenze bleibt erhalten.
- „Mit AI planen“ auf der Übersicht öffnet das aktuelle Trinity-Widget mit einem bearbeitbaren Tagesplan-Prompt. Der alte, unsichtbare FloatingAgent-Einstieg entfällt dort. Ein vorhandener Entwurf wird erhalten; Öffnen führt weder zu einer Nachricht noch einer Aufnahme. Internes Browser-Ereignis `neo-assistant-open` mit `{prompt:string}`, begrenzt auf 4.000 Zeichen, ohne Server-API-Änderung.
- Die Trinity-Beschriftung auf den dunklen Login-/Auth-Seiten hat jetzt ausreichenden Kontrast unabhängig vom Helligkeitsregler des Arbeitsbereichs. Die Startseiten-Signatur verwendet den konfigurierten App-Namen; Trinity bleibt die Assistentin.
- Das erhaltene Tempelbild nutzt Qualität 60, explizit erlaubte Bildqualitäten `[60,75]` und AVIF mit WebP-Rückfall. Die kleine Dock-Sonne erhält korrekte 28-px-Größenhinweise und konkurriert nicht mehr als priorisiertes Bild mit dem Hauptinhalt. Kein Bild-/Funktionsabbau, keine Änderung der Logoanimation.

Keine neuen Env-Variablen. Auth-, Cookie-, Provisioning-, Tabellen- und KI-Provider-Schnittstellen unverändert; FuseBase-Rückfall bleibt erhalten. Keine Änderungen an anderen VPS-Diensten oder DNS. Echte Konto-/Mikrofon-/KI-Abnahme bleibt entsprechend dem Nutzerwunsch separat.

## Bildnachweis und Systemmasken

Transparente Quelle: vorhandene `public/pwa/trinity-sun-transparent.png`. Größenvarianten durch normale Lanczos-Skalierung/ICO-Konvertierung mit Alpha. Opaque Maskenquelle wurde mit dem eingebauten Imagegen aus derselben Sonne erzeugt; ausschließlich der Hintergrund wurde auf dunkles Lila umgestellt. Apple-180 und Maskable-512 stammen aus dieser Quelle.

Dateiquelle des generierten Hintergrunds: `exec-5376075a-38c0-42a8-a469-927eae02cc56.png`. Prompt: identische violette photorealistische Sonne, nur voller dunkler Hintergrund `#1b112a`, keine Schrift/Rahmen/weißen Ränder, zentriert, Sonnenscheibe 64 % des Quadrats, wichtige Form innerhalb des zentralen 80-%-Kreises. Ausgabe visuell geprüft; Randfarbe rund `#1d0f2f`, subtiler Lilaverlauf.

[Maskable-Icons und sichere Fläche](https://web.dev/articles/maskable-icon?hl=en), [Manifest-Icons und Apple-Symbole](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons). Die OS-Maske und der Zeitpunkt, zu dem ein bereits installiertes Symbol aktualisiert wird, liegen beim jeweiligen System. Keine Neuinstallation oder Löschung lokaler App-Daten für diese Veröffentlichung erforderlich.

## Prüfung und Tempo

Build/TypeScript und alle 80 Unit-/Integrationstests erfolgreich; bestehende Warnung bei der Dateiverfolgung des alten Shopify-/DB-Moduls bleibt, ohne Buildfehler. Lokale Fixtures verwenden weder reale Konten noch entfernte KI-Anbieter. Die ergänzte Browserprüfung öffnet das Widget beim ersten verzögerten Laden, überprüft den vorbefüllten Prompt, einen erhaltenen eigenen Entwurf und null Schreibvorgänge. Manifest und Favicon-Verknüpfungen werden ebenfalls geprüft. Die Browser-Suiten für wiederhergestellte Räume, Assistent, Chat und Logo/Kommunikation sind erfolgreich: Astro-/Human-Design-Berechnung, Ideenboard, gemeinsamer Fokustimer, Diktat bis zum ausdrücklichen Senden, Mikrofon-Freigaberennen/Abbruch, Kontenwechsel, unabhängige Solar-Ebenen, Ruhe bei deaktivierter Bewegung, Raumlinks/Telefon und 320/390-px-Ansichten. Keine tatsächlichen Provideraufrufe. Bildprüfung bestätigt alle transparenten PNG-Ecken, vier ICO-Größen und deckende dunkle Apple-/Maskable-Ecken. Vexp meldet keine gebrochenen Imports, Parsefehler oder offenen Abhängigkeiten; beide genannten betroffenen Tests wurden ausgeführt.

Mobiler Lighthouse 13.5.0, lokaler Produktionsbuild, je drei Läufe und Median. Kaltes Browser-Caching, simuliertes Mobilgerät mit 412 × 823 px und gedrosselten Netzwerk-/CPU-Werten; Konto-/Daten-Fixtures. Kein VPS-/Mobilfunk-/echter Kontotest.

| Route | Performance | Accessibility | LCP | TBT |
|---|---:|---:|---:|---:|
| `/login` | 95 | 100 | 2.91 s | 2.5 ms |
| `/dashboard` | 88 | 100 | 3.75 s | 24.5 ms |
| `/notiz` | 95 | 100 | 2.78 s | 15.0 ms |

Alle neun Läufe ohne Konsolenfehler, unerwartete externe Zugriffe oder Schreibvorgänge. Kein 3D-Renderer auf diesen Seiten. Historischer Fünfseiten-Nachweis bleibt in `GUIDING-JOURNAL-FOKUS.md`; Ziele und Kalender wurden für dieses Paket nicht erneut mit Lighthouse gemessen. Die Startseite verbessert sich von 86 auf 88, erreicht aber das frühere Ziel ≥ 90 weiterhin nicht. Verbleibende Bremse sind insbesondere gemeinsam geladene Styles/Schriften; eine separate Bündelaufteilung wäre ein weiterer Arbeitsschritt. Kein experimentelles CSS-Inlining ausgeliefert.

Gemessene Tempelbild-Antworten:

| Breite | Bisher WebP q75 | Neu AVIF q60 | Neu WebP q60 |
|---|---:|---:|---:|
| 750 px | 53.676 Bytes | 24.853 Bytes (−54 %) | 43.314 Bytes (−19 %) |
| 1920 px | 183.936 Bytes | 90.054 Bytes (−51 %) | 150.322 Bytes (−18 %) |

[Next.js-Bildformate und Qualitätsfreigabe](https://nextjs.org/docs/app/api-reference/components/image#formats). AVIF-Erzeugung erfolgt beim ersten Abruf, danach über den bestehenden Bildcache; größere Cache-/Erzeugungskosten sind der bekannte Format-Tradeoff. WebP bleibt explizit geprüft.

Maschinenlesbarer Messnachweis: [GUIDING-ICONS-LIGHTHOUSE.json](GUIDING-ICONS-LIGHTHOUSE.json). Veröffentlichungsnachweis folgt nach Staging-/Produktionskontrolle.

## Kurz testen

1. Seite neu laden: Tab-Symbol ist die transparente Lilasonne. Installationsmanifest und Apple-Symbol verwenden die neue Sonne ohne weißen Bildrand.
2. Übersicht → „Mit AI planen“: Trinity öffnet den bearbeitbaren Tagesplan-Prompt. Erst ausdrückliches Senden startet die KI-Anfrage. Einen eigenen Text schreiben, schließen und erneut öffnen: der Text bleibt.
3. Login: Trinity-Beschriftung rechts unten auch bei zuvor hellem Arbeitsbereich gut lesbar.
4. Handy: Navigation, kleines Fokusfenster, Journal, Kalender und Trinity-Widget bedienen. Reale Mikrofon-/Infomaniak-/Hermes-Abnahme ist damit nicht behauptet.
