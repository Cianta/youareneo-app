#!/bin/sh
# Setzt die Bausteine zu einer einzigen Memberspot-Seite zusammen: ../visual-room.html
cd "$(dirname "$0")"
{
  cat 01-style.html 02-body.html
  echo '<script>'
  cat animals.js
  echo '(function () {'
  cat 03-core.js 04-visuals.js 05-drum.js 06-catalog.js 07-audio.js 08-world.js 09-studio.js 10-extras.js 11-creations.js 12-experience.js
  echo '})();'
  echo '</script>'
} > ../visual-room.html
wc -c ../visual-room.html
# Vollbild-Fassung für den eigenen Tab (gehostet im FuseBase-Dateispeicher)
{
  echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visual Room · YOU ARE NEO</title>'
  echo '<style>html,body{margin:0;background:#03070D}#vr-root{border-radius:0!important}</style><script>window.VR_IS_STANDALONE=true</script></head><body>'
  cat ../visual-room.html
  echo '</body></html>'
} > ../visual-room-standalone.html
wc -c ../visual-room-standalone.html
