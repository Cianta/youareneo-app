# Shopify-Theme – eigene Bausteine von youareneo.com

Hier liegen nur die **selbst gebauten** Teile des Themes (Debutify-Basis bleibt in Shopify).
Shopify ist die Quelle der Wahrheit. Dieser Ordner ist die lesbare Kopie zum Nachschauen, Vergleichen und Versionieren.

| Ordner | Inhalt |
|---|---|
| `sections/` | `elemente-scroll` (Logo-/Elemente-Animation), `es-zeitstrahl` (Entstehungsgeschichte), `es-wegweiser` (12 Knöpfe), `es-farben` / `es-feinschliff` (Lader für CSS/JS) |
| `blocks/` | angepasste Theme-Blöcke (z. B. Ankündigungsleiste mit Bronze-Schrift) |
| `templates/` | Seitenvorlagen, die eigene Sektionen benutzen |
| `files/` | Skripte & Styles aus **Shopify → Inhalte → Dateien** (`elemente-scroll-v6.js`, `es-zauber.js`, `es-farben-v2.css`, `es-kopf.css`, `elemente-zeitstrahl.js`, `elemente-seite.js`) |
| `assets/` | **Theme 2.0:** lesbare Quellen der `es2-*`-Dateien (in Shopify minifiziert unter Inhalte → Dateien, nur von „YOU ARE NEO THEME 2.0“ benutzt – die alten Dateien des Live-Themes bleiben unberührt) |

## Arbeitsablauf

1. Immer auf einer **Kopie** des Live-Themes arbeiten (Online Store → Themes → … → Duplizieren).
2. Änderungen hier im Ordner machen → in die Kopie hochladen → Vorschau prüfen.
3. Erst wenn alles passt: Kopie in Shopify **veröffentlichen**.

Mit Shopify CLI (am Mac):

```bash
shopify theme pull --store <shop>.myshopify.com --theme <ID>   # holen
shopify theme dev  --store <shop>.myshopify.com                # lokale Live-Vorschau
shopify theme push --store <shop>.myshopify.com --theme <ID> --only sections/es-*  # nur eigene Teile hochladen
```

## Theme 2.0 (03.10.26)

- Shopify-Theme **„YOU ARE NEO THEME 2.0“** (ID 201882206535), dupliziert vom Live-Theme „Feinschliff (03.10.26)“.
- Neue Skripte/Styles heißen `es2-*` und liegen in Shopify unter Inhalte → Dateien. Die Sektionen laden sie mit `file_url`.
- Minifizieren: `terser datei.js -c -m -o es2-….js`, CSS: `csso datei.css --no-restructure -o es2-….css`.
- Scroll-Logik: gemeinsamer Höchststand-Zähler `window.ESHW` (in `es2-scroll.js` und `es2-zauber.js`) – beim Hochscrollen fliegt das Logo zurück in den Header, alles bleibt stehen, bis man wieder an der alten Stelle ist.
