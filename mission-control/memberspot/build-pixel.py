from pathlib import Path
import shutil,json,re
p=Path(__file__).resolve().parent
backup=Path('/Users/cianta/workspace/visual-room-backups/20260919-161420')
archive=p/'visual-room-claude-original'
if not archive.exists():shutil.copytree(backup/'visual-room',archive)
shutil.copy2(backup/'visual-room-standalone.html',p/'visual-room-claude-original.html')
parts=['03-core.js','04-visuals.js','05-drum.js','06-catalog.js','07-audio.js','08-world.js','09-studio.js','10-extras.js','11-creations.js']
style=(archive/'01-style.html').read_text()
style=re.sub(r'background-image:url\([^;]+\);','background-image:none;',style)
body=(archive/'02-body.html').read_text()
sources={name:(archive/name).read_text() for name in parts}
sources['03-core.js']=sources['03-core.js'].replace("var PIXEL = window.VR_MODE === 'pixel';", "var PIXEL = true;")
sources['08-world.js']=sources['08-world.js'].replace("if (!im.complete || !im.naturalWidth || a < .01) return;", "if (!ready(im) || a < .01) return;").replace("pa = photoAlpha(t, 0, show)","pa = 0").replace("pa = photoAlpha(t, 30, show)","pa = 0")
# Keep original artwork and interaction. Only external world/animal photos are excluded.
js="window.VR_MODE='pixel';\n"+(archive/'animals.js').read_text()+"\n(function(){\n"+''.join(sources.values())+'''\nvar cinematicButton=document.createElement('button');cinematicButton.textContent='◈';cinematicButton.title='Cinematic-Raum öffnen';cinematicButton.setAttribute('aria-label',cinematicButton.title);cinematicButton.onclick=function(){var u=new URL(location.href);u.searchParams.set('pixel','0');location.assign(u.href);};$('vr-tools').appendChild(cinematicButton);\n})();'''
fonts=re.findall(r'href="(https://fonts.googleapis.com/css2[^"]+)"',style)
css=style.split('<style>')[1].split('</style>')[0]
bundle='''(function(){var host=document.getElementById('vr-mount');if(!host||host.dataset.vr)return;host.dataset.vr='1';'''
for font in fonts:bundle+="var l=document.createElement('link');l.rel='stylesheet';l.href="+json.dumps(font)+";document.head.appendChild(l);"
bundle+="var st=document.createElement('style');st.textContent="+json.dumps(css)+";document.head.appendChild(st);host.innerHTML="+json.dumps(body)+";})();\n"+js
(p/'visual-room-pixel.bundle.js').write_text(bundle)
(p/'visual-room-pixel.html').write_text('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visual Room · Pixel</title><style>body{margin:0;background:#03070d}</style><script>window.VR_IS_STANDALONE=true;</script>'+style+body+'<script>'+js+'</script></html>')
print('Original archiviert, Pixel aus Claude-Original mit gezielten Fotofixes gebaut.')
