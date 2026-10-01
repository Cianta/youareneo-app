# Notizliste: aktuelle Treffer und verständliche Zustände

Stand 01.10.2026. Branch `codex/trinity-notes-states`, auf PR #15 (`0039e6f3515cb12fa7f67704d0b077db18e21dd6`). Fortsetzung nach „ok weiter“, im bestehenden Umfang von Bedienbarkeits-Teil 2. Nur Staging: https://trinity-stg.youareneo.com/notiz.

## Problem und Änderung

Eine bereits laufende Suche wurde beim Filterwechsel nicht abgebrochen. Kam ihre Antwort später als die neue Suche, überschrieben alte Treffer die aktuelle Liste. Derselbe Fehler konnte beim Nachladen weiterer Seiten und beim Abschluss einer vor dem Filterwechsel gestarteten Aktualisierung auftreten. Ladefehler landeten im Schreibformular; eine fehlgeschlagene Suche konnte wie eine leere Sammlung aussehen.

Die Liste bindet jede Anfrage an die aktuellen Filter, die einzelne Notiz-ID und die geladene Benutzerkennung. Neue Suche und Seitenwechsel brechen alte Anfragen ab. Zusätzlich werden verspätete Treffer und Fehler ignoriert, selbst wenn ein Transport den Abbruch nicht mehr berücksichtigt. Ein alter Aktualisierungs-Callback lädt die erste Seite der aktuellen Suche statt seiner überholten Filter. Nach Verlassen des Notizraums startet er keine neue Listenanfrage. Das ist UI-Konsistenz; die eigentliche Autorisierung bleibt unverändert in den bestehenden APIs und RLS.

- Während der Suche: Skeleton und `aria-busy`, keine alten Treffer unter neuen Filtern.
- Bei Ladefehler: gemeinsamer Fehlerzustand direkt an der Liste mit „Erneut versuchen“. Netzwerk-/ungültige Antwortfehler erhalten eine deutsche Meldung. Der Schreibentwurf bleibt erhalten.
- Ohne Suchtreffer: „Keine passenden Notizen“ mit „Alle Notizen anzeigen“. Ein nicht verfügbarer Notizlink erhält einen eigenen Hinweis. Filter und Notiz-URL lassen sich ohne Browser-Reload zurücksetzen; der Entwurf bleibt bestehen.
- Bei tatsächlich leerer Sammlung: weiterhin Einstieg zum Festhalten eines Gedankens. Vor der Anmeldung: Anmeldelink für die eigene Sammlung.
- Beim Nachladen: geladene Seiten bleiben bei Fehlern erhalten. Wiederholen verwendet denselben Cursor und ergänzt diese Seiten, statt sie zu ersetzen. Doppelte IDs an Seitengrenzen werden nicht erneut angehängt. Während einer laufenden Anfrage ist „Weitere laden“ gesperrt; nach Filterwechsel kann eine alte Seite nicht in die neue Suche gelangen.
- Die beiden Bibliotheks-Schalter melden ihren aktiven Zustand mit `aria-pressed`.

Keine neuen Endpunkte, Request-/Response-Felder, Tabellen, Cookies oder Env-Variablen. Keine Änderungen an Aufnahme, Transkription, Speichern, Hermes-Freigabe, Konten oder FuseBase-Rückfall. Kein zusätzlicher Anbieteraufruf und keine Datenmigration.

## Lokale Prüfung

Der neue Browsertest benutzt ausschließlich localhost und fiktive GET-Antworten. Externe Requests und Schreibaufrufe werden gesperrt. Vor der Korrektur reproduziert: „Veralteter Treffer“ ersetzt „Aktueller Treffer“ nach einem Suchwechsel. Nach der Korrektur geprüft:

- normal abgebrochene Anfrage sowie verspäteter Erfolg und Fehler trotz ignoriertem Abbruch;
- Filterwechsel während verzögerter Aktualisierung;
- Ladefehler ausschließlich an der Liste, Wiederholen und Unterschied zwischen Fehler und leerem Ergebnis;
- Filter zurücksetzen und nicht verfügbaren Notizlink verlassen, jeweils mit erhaltenem Entwurf;
- 50 geladene Notizen, Fehler beim Nachladen, Wiederholen mit derselben Seite und doppelter Grenz-ID;
- Filterwechsel während Nachladen und Verlassen der Seite mit noch laufender Anfrage;
- keine JavaScript-Seitenfehler und kein Schreibaufruf.

```sh
npm run build
# Separater lokaler Produktionsserver:
AUTH_PROVIDER=fusebase AUTH_APP_URL=http://127.0.0.1:3308 node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3308
# Zweites Terminal:
TEST_BROWSER_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npm run test:notes:browser
```

`TEST_BROWSER_PATH` ist ausschließlich ein lokaler Testparameter. Bestehende 13 Voice- und 8 Workspace-Tests, TypeScript und Produktionsbuild ebenfalls erfolgreich. Navigation-/Formular-Browsertest und Chat-/Avatar-/Aufnahme-Browsertest ebenfalls bestanden. Letzterer verwendet ausschließlich synthetisches Audio und fiktive Anbieterantworten; keine echte Transkription. Die bekannte Turbopack-Trace-Warnung aus `lib/db.ts` / Shopify bleibt.

## Bereitstellung und spätere Abnahme

Nur drei ausgewählte Anwendungs-/Paket-/Skriptdateien in `/docker/mission-control-stg`. Quellstand vor Ersetzen per SHA-256 geprüft und unter `.codex-backups/notes-states-20261001/` gesichert. Deployment ausschließlich `docker compose up -d --build` dort. Keine Server-Konfiguration oder Produktion geändert.

Echte Login-, Anbieter-, Hermes- und Handytests bleiben auf Nutzerwunsch später. Beim späteren Test mit eigenen gespeicherten Notizen schnell zwischen Suchbegriffen/Projekt/Typ wechseln, eine Suche ohne Treffer zurücksetzen und die nächste Seite nachladen. Bei unterbrochener Verbindung muss ein Fehler mit Wiederholen erscheinen und der aktuelle Entwurf erhalten bleiben. Die lokale Fixture-Prüfung ersetzt keine Live-RLS- oder Geräteabnahme.
