# Teil 3 – Privater Wissensgraph

Freigabe am 01.10.2026; aufbauend auf Teil 2 / PR #10. Staging: https://trinity-stg.youareneo.com/gehirn. Produktion unverändert. Echte Integrations- und Handy-Abnahme auf Nutzerwunsch später.

## Verhalten

- `/gehirn` ist über Navigation, Labor-Verzeichnis und Befehlspalette erreichbar. „Im Gehirn suchen“ übernimmt den Suchbegriff als `?q=`. Treffer leuchten, übrige Knoten werden abgedunkelt.
- Notizen, Aufgaben, eigene Projekte, Tags, Personen aus Zuständigkeitsangaben und Hermes-Aufträge. Geteilte Tags verbinden Notizen über einen gemeinsamen Knoten (kein quadratisches Netz). `@Projekt`, `@[Projekt mit Leerzeichen]` und `#tag` werden zusätzlich erkannt. Keine fremden Kontakte oder gemeinsamen Altbestände.
- Klick/Listenauswahl fokussiert den Knoten und öffnet die Vorschau mit „Öffnen“. Tag-Erwähnungen ohne gespeicherten Tag führen zur zugrunde liegenden Notiz. Personen ebenfalls; sie sind keine neuen Personenprofile. Hermes lässt sich hier nicht freigeben.
- Typ-/Datumsfilter, Suche, Aktualisieren, zugängliche Ergebnisliste. Datumsfilter behält den zu neueren Notizen gehörenden älteren Kontext. Dunkler Raum, bestehende Theme-Akzente, transparente Kanten, dezenter Tiefennebel; keine teure Tiefenunschärfe-Nachbearbeitung. Simulation endet nach begrenzten Schritten.
- `react-force-graph-3d` und `three` laden ausschließlich dynamisch auf dieser Route. Kleine Bildschirme, reduzierte Bewegung, schwache/Software-Grafik oder WebGL-Verlust wechseln zu `react-force-graph-2d`; auch ein Listenmodus ist vorhanden. Bei reduzierter Bewegung wird ohne sichtbare Simulation initialisiert.

## Datenvertrag

`GET /api/brain` → `{success:true,graph:{nodes,links,truncated}}`; angemeldete eigene Sitzung erforderlich. Optional `?refresh=1` umgeht den kurzen Cache. Fehlerformat unverändert. Jeder Knoten hat `id,label,type,summary,href,createdAt,degree`, jede Kante `source,target,kind`. Keine Transkripte/Audio im Browser-Graph, nur begrenzte Vorschau. Kein Auth-/Graph-Cache in localStorage oder Service Worker.

Migration `20261001123355_trinity_brain_snapshot.sql` ergänzt ausschließlich `trinity_brain_snapshot()`. Ein RPC liest die bestehenden Tabellen in einer Abfrage als **SECURITY INVOKER** unter RLS und explizitem `auth.uid()`. Kein Service-Role-Aufruf und kein Benutzerparameter. Anon/PUBLIC erhalten kein EXECUTE. Bestehende Konten, Tabellen, Profile, Policies und Indizes bleiben unverändert. Die additive Funktion wurde im bestehenden Projekt angewendet.

Maximal 1.000 aktuelle Notizen, 200 Projekte und zugehörige Hermes-Zeilen. Der Server baut höchstens 2.000 Knoten und meldet einen Ausschnitt. Vollständige Notiztexte werden nur auf dem Server zur Verbindungserkennung verwendet; Vorschauen maximal 600 Zeichen. Cache 30 Sekunden je verifiziertem Benutzer, pro Prozess maximal 32 Einträge. Authentifizierung/Rechte werden vor jedem Cachezugriff geprüft. Neue Daten erscheinen spätestens nach Ablauf oder über „Aktualisieren“.

Keine neuen Env-Variablen. Cookie-, Login-, Provision- und Hermes-Verträge unverändert.

## Technische Prüfung

- TypeScript und Produktionsbuild erfolgreich; 6 Graph-Tests und 8 Workspace-Regressionstests bestanden.
- Graph-Tests: Eigentümertrennung, keine verwaisten Kanten, Tags/Erwähnungen/Zuständigkeit/Hermes, RegEx-Sonderzeichen, Datums-/Typfilter, 2.000-Knoten-Grenze, HTML-Escaping und benutzergetrennter Cache.
- Lokaler Browser-Test mit 2.000 fiktiven Knoten bei 390 px und reduzierter Bewegung: 2D-Rückfall, Suche, Vorschau-Link, Fehler/Retry und leerer Bestand; kein horizontaler Überlauf und keine JavaScript-Seitenfehler. Der Lauf ist keine FPS-Messung oder physische Geräteabnahme.
- Reale read-only SQL-Kontrolle ohne neue Konten/Notizen: fremde Testidentität liefert leere Arrays, Funktion verwendet Aufruferrechte, Anon darf nicht ausführen. Zwei-Konten-Abnahme steht als vollständig zurückrollendes `supabase/tests/brain_rls.sql` für später bereit; noch nicht ausgeführt.
- Supabase-Sicherheitsberater: kein Befund zur neuen Funktion. Bestehende andere Produktfunktionen/Tabellen wurden nicht geändert. Hinweise zu [aufrufbaren SECURITY-DEFINER-Funktionen](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) und [Passwortschutz](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) liegen außerhalb dieses Graph-Änderungsumfangs.

Wiederholung: `npm run test:brain`, `npm run test:workspace`, `npx tsc --noEmit`, `npm run build`. Mit lokalem Server und `TEST_BROWSER_PATH` auf einen Chromium-Browser: `npm run test:brain:browser` (nur localhost, abgefangene API mit Fixtures).

Noch offen: angemeldete Staging-Abnahme mit zwei echten Konten, 3D-Interaktion/FPS auf echter GPU und physischen Mobilgeräten sowie Lighthouse. Ziel „flüssig bis 2.000“ damit noch nicht vollständig bestätigt. Keine echten Anbieter-/Mail-/Hermes-Aufrufe.
