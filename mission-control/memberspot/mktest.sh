#!/bin/sh
# Lokale Testseite: Memberspot-ähnliche App mit eigenem Scroll-Container; Sichtbarkeits-Pause aus (Vorschau meldet sich als versteckt)
cd "$(dirname "$0")"
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VR Test</title></head><body style="margin:0;background:#eee;height:100vh;overflow:hidden"><div style="height:60px;background:#fff">Memberspot Header</div><div id="scroller" style="height:calc(100vh - 60px);overflow-y:auto"><div style="max-width:1300px;margin:20px auto;padding:0 16px">';
  sed -e 's/document\.hidden/false/g' -e 's/!visible ||/false ||/' -e 's/!tVisible ||/false ||/' -e 's/^function startShow() {/window.__startShow = startShow; function startShow() {/' visual-room.html;
  echo '<p style="height:200px">Nach der Seite</p></div></div></body></html>'; } > _vr-test.html
