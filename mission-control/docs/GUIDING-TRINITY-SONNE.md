# Trinity-Sonne: transparentes Bild und eigene Animation

Der weiße Hintergrund der bisherigen Datei `public/pwa/purple-sun-512.png` war echte Bildfläche. Diese Datei bleibt als bisheriges Installationssymbol erhalten. Für Logo-Animation und Assistentinnen-Einstieg gibt es jetzt `public/pwa/trinity-sun-transparent.png` (1254 × 1254, RGBA, 1.88 MB Masterdatei). Alle vier Eckpixel sind vollständig transparent; rund 40.5 % der Pixel haben Alpha 0. Im Logo wird über Next Image nur die benötigte kleine optimierte Fassung geladen, keine 1.88-MB-Datei bei jeder Ansicht.

Werkzeug: eingebautes **Imagegen**, Bearbeitung der vorhandenen Sonne, mit `transparent_background: true`. Quelldatei bleibt erhalten. Das Bild ist eine gestalterische Solarillustration, kein astronomisches Livebild.

Verwendeter Prompt:

> Use case: background-extraction. Edit target: the attached existing Trinity purple sun. Remove ONLY the opaque white backdrop and white square/circular halo, yielding a real alpha-transparent PNG cutout of the sun itself, with naturally fading transparent purple corona at its edge. Preserve the exact violet solar sphere, centered position and relative diameter, its photorealistic plasma texture, pink-white active regions and delicate violet prominences, identity and color palette. Do not add anything, no lettering, no frame, no disk behind the sun, no white matte. The asset will be composited in a logo animation on both ivory and dark backgrounds. Keep fine solar filaments at the limb and a modest purple translucent corona; empty corners and empty space around the sun must be fully alpha transparent. Return a clean high resolution square PNG of this identical sun.

`TrinityLogo.tsx` verbindet das vorhandene Yin-Yang-Zeichen mit der Sonne im 20-Sekunden-Zyklus: Ruhe → Verdichtung → violette Sonne → Rückkehr. Die freigestellte Sonnenoberfläche dreht sich ruhig; Korona, Plasma-Bögen, Filamente und aktive Regionen bewegen sich separat. Es ist keine bloße Überblendung einer rechteckigen Logo-Datei. Animation über CSS/SVG, ohne 3D-Paket oder React-Updates pro Frame. Bei `prefers-reduced-motion` und deaktivierter Begleiterbewegung bleibt das ursprüngliche Zeichen statisch.

Prüfskript: `npm run test:logo-communication:browser` auf dem lokalen Produktionsbuild. Der vergrößerte Ablaufnachweis verwendet dasselbe echte SVG und eine 384-Pixel-Fassung des transparenten PNG auf hellem/dunklem Grund; die App selbst lädt im 36-Pixel-Header die 96-Pixel-Fassung. Der Ablaufnachweis friert vier Phasen ein und ist kein Screenshot persönlicher Daten.
