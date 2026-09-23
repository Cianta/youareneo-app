# Baut visual-room.bundle.js: fügt Stil + HTML in #vr-mount ein und startet die Seite
import json, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
style = open('01-style.html').read()
body = open('02-body.html').read()
js = open('animals.js').read() + '(function () {\n' + ''.join(open(f).read() for f in
     ['03-core.js','04-visuals.js','05-drum.js','06-catalog.js','07-audio.js','08-world.js','09-studio.js','10-extras.js','11-creations.js','12-experience.js']) + '\n})();\n'
head = style.split('<style>')[0]
css = style.split('<style>')[1].split('</style>')[0]
fonts = re.findall(r'href="(https://fonts\.googleapis\.com/css2[^"]+)"', head)
out = '/* VISUAL ROOM · YOU ARE NEO – Paket (gebaut aus memberspot/visual-room) */\n(function () {\n' \
  '  var host = document.getElementById("vr-mount"); if (!host || host.dataset.vr) return; host.dataset.vr = "1";\n' \
  '  ' + ''.join('var l = document.createElement("link"); l.rel = "stylesheet"; l.href = %s; document.head.appendChild(l);\n' % json.dumps(f.replace('&amp;','&')) for f in fonts) + \
  '  var st = document.createElement("style"); st.textContent = %s; document.head.appendChild(st);\n' % json.dumps(css) + \
  '  host.innerHTML = %s;\n})();\n' % json.dumps(body) + js
open('../visual-room.bundle.js','w').write(out)
print(len(out))
