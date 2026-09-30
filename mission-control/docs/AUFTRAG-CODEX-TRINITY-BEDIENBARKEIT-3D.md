# Auftrag an Codex: Trinity aufräumen, schneller machen, Second Brain in 3D

Stand 29.09.2026. Baut auf PR Cianta/youareneo-app#7 (Supabase-Login) und #8 (Sprachnotizen) auf. Nur Staging (`trinity-stg.youareneo.com`, `/docker/mission-control-stg`). Produktion erst nach Freigabe durch den Nutzer.

## Teil 1 – Bestandsaufnahme (zuerst, ohne Code zu ändern)

**Freigegeben am 30.09.2026:** Teil 1 darf sofort starten, auch solange PR #7 und #8 noch Drafts sind. Er baut auf dem Stand von PR #8 auf. Teil 2 und 3 warten weiter auf die Abnahme.

Lege `docs/TRINITY-INVENTAR.md` an. Pro Funktion bzw. Route eine Zeile:

| Funktion | Route | Wie erreicht man sie (Menü, Link, nur per URL) | Zustand (fertig / halb / kaputt / doppelt / tot) | Datenquelle | Probleme |

Dazu:
- **Tote und doppelte Seiten.** Keine löschen, sondern auflisten.
- **Reste von FuseBase** im Code (Imports, Env, Texte).
- **Messwerte** der fünf wichtigsten Seiten: Lighthouse (Performance, Barrierefreiheit), größte JS-Bundles, Fehler in der Konsole.

Schick dem Nutzer das Inventar mit einem Vorschlag, was du in welcher Reihenfolge angehst. Erst nach seinem Okay umbauen.

## Teil 2 – Alles erreichbar, alles schnell

Ziel: Jede fertige Funktion ist in höchstens zwei Klicks oder einem Tastendruck erreichbar.

1. **Befehlspalette** mit `⌘K` / `Ctrl+K`. Sie findet Seiten, Aktionen („Neue Notiz“, „Sprachnotiz aufnehmen“, „Projekt anlegen“) und Inhalte: eigene Notizen, Projekte, Aufgaben und Tags. Bedienung mit der Tastatur, zuletzt benutzte Einträge oben.
2. **Navigation** neu ordnen, nach Aufgaben statt nach Technik. Halbfertiges kommt hinter „Labor“, Totes verschwindet aus dem Menü.
3. **Einheitliche Zustände** für jede Liste und jede Seite:
   - Laden: Skeleton.
   - Leer: sagt, was man als Nächstes tun kann.
   - Fehler: sagt, was schiefging und wie man es behebt.
4. **Tastenkürzel**, dokumentiert in einem Hilfe-Dialog, der mit `?` aufgeht.
5. **Mobil:** Die App lässt sich auf dem Handy installieren (PWA aus Phase 1). Untere Tab-Leiste für die vier wichtigsten Bereiche, Touch-Ziele mindestens 44 px.
6. **Tempo:**
   - Routen-basiertes Code-Splitting und Lazy-Loading schwerer Teile (Editor, Graph, Audio).
   - Server-Komponenten, wo es passt.
   - Supabase-Abfragen ohne N+1, dafür nötige Indizes als Migration.
   - Ziel: Lighthouse Performance ≥ 90 und Barrierefreiheit ≥ 95 auf den fünf wichtigsten Seiten, keine Konsolenfehler.
7. **Einrichtung beim ersten Start:** drei kurze Schritte (Name, erstes Projekt, erste Notiz). Überspringbar, danach nie wieder.
8. **Verknüpfung zum Archiv:** In der Seitenleiste ein Link „Archiv der Lebenskünste“ auf `https://archiv.youareneo.com`. Das Archiv nicht umbauen, es gehört Claude.

## Teil 3 – Second Brain in 3D (Gimmick, aber schön)

Route `/gehirn`, im Menü als „Gehirn“:

- **3D-Kraftgraph** mit `3d-force-graph` bzw. `react-force-graph-3d` (three.js).
- **Knoten:** Notizen, Projekte, Aufgaben, Tags, Personen. Farbe je Typ, Größe nach Zahl der Verbindungen.
- **Kanten:** gleiche Tags, Erwähnungen (`@Projekt`, `#tag`), Zugehörigkeit zu einem Projekt, Hermes-Aufträge zu ihrer Notiz.
- **Bedienung:**
  - Klick fliegt die Kamera zum Knoten und öffnet rechts eine Vorschau mit dem Link „Öffnen“.
  - Die Suche (auch aus der Befehlspalette) hebt Treffer hervor und blendet den Rest ab.
  - Filter nach Typ und Zeitraum.
- **Stil:**
  - Dunkler Raum, leuchtende Knoten, dünne halbtransparente Kanten, leichte Tiefenunschärfe.
  - Farben aus dem bestehenden Theme, keine neuen.
  - Kein Dauergewackel: Die Simulation beruhigt sich nach ein paar Sekunden.
- **Leistung:** flüssig bis 2.000 Knoten. Auf Handys, bei wenig GPU-Leistung oder bei `prefers-reduced-motion` automatisch eine 2D-Ansicht (`react-force-graph-2d`) mit denselben Funktionen.
- **Daten:** nur die eigenen, über die bestehende RLS. Den Graph serverseitig als eine Abfrage aufbauen und kurz cachen.
- **Wichtig:** Die 3D-Bibliothek nur auf `/gehirn` laden (dynamic import), sie darf den Rest der App nicht bremsen.

## Regeln (wie bisher)

- Nur `/docker/mission-control-stg` und das Repo anfassen. Nichts an Traefik, n8n, `archiv`, `medien`, DNS, Make oder Memberspot.
- Keine Geheimnisse in Chat, Code oder Commits. Neue Env-Variablen als Liste an den Nutzer, er trägt sie selbst ein.
- App-Name und Name der Assistentin nur aus der Konfiguration (`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_ASSISTANT_NAME`), der Produktname steht noch nicht fest.
- Deutsche Oberfläche. Tests für die Befehlspalette (Suche und Tastatur), die Graph-Daten (nur eigene Knoten) und die mobile Navigation.
- Pro Teil ein eigener PR mit Staging-Link. Änderungen unter „Änderungen durch Codex“ dokumentieren.

## Änderungen durch Codex

30.09.2026 – Teil 1 auf PR #8 erstellt: [TRINITY-INVENTAR.md](TRINITY-INVENTAR.md) enthält alle 73 Seiten und 40 API-Routen, Navigation, Zustände, Datenquellen, Alt-/FuseBase-Reste, fünf angemeldete bzw. zugängliche mobile Lighthouse-Messungen auf Staging sowie JS- und Konsolenbefunde. Reduzierte, von Auth-/DOM-Inhalten bereinigte Messauszüge liegen unter `docs/audits/2026-09-30/`.

Nur Dokumentation, keine Umbauten oder Deployments. Keine Änderungen an Schnittstellen, Tabellenfeldern, Cookie-Namen, Umgebungswerten oder Produktion. Teil 2/3 und Sprach-Phase 2 bleiben bis zur jeweiligen Nutzerfreigabe offen. Die Bestandsaufnahme ersetzt nicht die noch offene Funktionsabnahme von PR #7/#8.
