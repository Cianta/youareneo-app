# Baut den Kinosaal: ../kinosaal.bundle.js (für den Lader) und ../kinosaal-standalone.html (eigener Tab / Test)
import json, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
FONTS = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600&display=swap'
css = open('01-style.css').read()
body = open('02-body.html').read()
js = '(function () {\n' + ''.join(open(f).read() + '\n' for f in
     ['03-core.js','04-scene.js','05-player.js','06-catalog.js','07-notes.js','08-focus.js']) + '})();\n'
out = '/* KINOSAAL · YOU ARE NEO – Paket (gebaut aus memberspot/kinosaal) */\n(function () {\n' \
  '  var host = document.getElementById("ks-mount"); if (!host || host.dataset.ks) return; host.dataset.ks = "1";\n' \
  '  var l = document.createElement("link"); l.rel = "stylesheet"; l.href = %s; document.head.appendChild(l);\n' % json.dumps(FONTS) + \
  '  var st = document.createElement("style"); st.textContent = %s; document.head.appendChild(st);\n' % json.dumps(css) + \
  '  host.innerHTML = %s;\n})();\n' % json.dumps(body) + js
open('../kinosaal.bundle.js','w').write(out)
html = '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' \
  '<title>Kinosaal · YOU ARE NEO</title><style>html,body{margin:0;background:#050B14}#ks-root{border-radius:0!important;min-height:100vh}</style></head>' \
  '<body><div id="ks-mount"></div><script>' + out.replace('</script', '<\\/script') + '</script></body></html>'
open('../kinosaal-standalone.html','w').write(html)
print('bundle', len(out), 'standalone', len(html))
