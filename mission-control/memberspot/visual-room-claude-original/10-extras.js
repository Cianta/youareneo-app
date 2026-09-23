
/* =====================================================================
   HEADER-VISUALIZER · PLAYER-MODI · SEE MIT STERNENPORTAL · START
   ===================================================================== */

/* ---------- Visualizer: klebt oben, zeigt alles, was die Seite erklingen lässt ---------- */
var VIZ = { on: store('vr_viz') !== 'off', data: null, drops: [], dust: [], level: 0 };
function vizToggle() { VIZ.on = !VIZ.on; store('vr_viz', VIZ.on ? 'on' : 'off'); studioPaint(); }
function drawViz(t, dt) {
  if (!VIZ.on || !vizAn) return;
  if (!VIZ.data) VIZ.data = new Uint8Array(vizAn.frequencyBinCount);
  vizAn.getByteFrequencyData(VIZ.data);
  var d = VIZ.data, n = 64, bw = W / n, sum = 0, i, k;
  for (i = 0; i < d.length; i++) sum += d[i];
  VIZ.level += ((sum / d.length / 255) - VIZ.level) * .2;
  if (analyser && fbuf) { var ms = 0; for (i = 0; i < fbuf.length; i++) ms += fbuf[i]; VIZ.level = Math.max(VIZ.level, ms / fbuf.length / 255 * .8); }
  var vis = smooth((VIZ.level - .015) * 40);          // unsichtbar, solange nichts klingt
  if (!VIZ.sm) VIZ.sm = new Float32Array(n);
  for (k = 0; k < n; k++) {
    var lo = Math.floor(Math.pow(k / n, 1.8) * d.length * .7), hi = Math.max(lo + 1, Math.floor(Math.pow((k + 1) / n, 1.8) * d.length * .7)), v = 0;
    for (i = lo; i < hi; i++) v = Math.max(v, d[i]);
    if (analyser && fbuf) v = Math.max(v, fbuf[Math.min(fbuf.length - 1, lo)] * .8);
    VIZ.sm[k] += (v / 255 - VIZ.sm[k]) * .12;            // weich nachziehen
  }
  if (vis > .01) {
    // drei durchscheinende Lichtvorhänge, runde Wellen, höchstens ein Drittel des Bildschirms
    for (var layer = 0; layer < 3; layer++) {
      var amp = H / 3 * (.55 + layer * .22) * vis, ph = t * (.6 + layer * .25) + layer * 2;
      go.beginPath(); go.moveTo(0, 0);
      var pts = [];
      for (k = 0; k <= n; k++) { var a = VIZ.sm[Math.min(n - 1, k)], y = Math.min(H / 3, Math.pow(a, 1.4) * amp * (1 + .15 * Math.sin(k * .35 + ph))); pts.push([k * bw, y]); }
      go.lineTo(pts[0][0], pts[0][1]);
      for (k = 1; k < pts.length; k++) { var mx = (pts[k - 1][0] + pts[k][0]) / 2, my = (pts[k - 1][1] + pts[k][1]) / 2; go.quadraticCurveTo(pts[k - 1][0], pts[k - 1][1], mx, my); }
      go.lineTo(W, 0); go.closePath();
      var lg = go.createLinearGradient(0, 0, W, 0);
      for (var c = 0; c <= 6; c++) lg.addColorStop(c / 6, 'hsla(' + ((c * 50 + layer * 40 + t * 8) % 360) + ',100%,62%,' + (.16 - layer * .03) * vis + ')');
      go.fillStyle = lg; go.fill();
      if (layer === 0) for (k = 2; k < n; k += 3) if (VIZ.sm[k] > .7 && Math.random() < (VIZ.sm[k] - .7) * .5) VIZ.drops.push({ x: k * bw, y: pts[k][1], vy: .6 + Math.random(), hue: (k / n * 300 + t * 8) % 360, s: 1 + VIZ.sm[k] * 1.5 });
    }
  }
  // Tropfen rinnen über den Bildschirm und sammeln sich unten als Sternenstaub
  VIZ.drops = VIZ.drops.filter(function (p) {
    p.vy += .05; p.y += p.vy; p.x += Math.sin(p.y * .02 + p.hue) * .3;
    go.fillStyle = 'hsla(' + p.hue + ',100%,70%,.55)'; go.beginPath(); go.ellipse(p.x, p.y, p.s * .7, p.s * 1.6, 0, 0, 6.2832); go.fill();
    if (p.y >= H - 4) { VIZ.dust.push({ x: p.x + (Math.random() - .5) * 8, y: H - 2 - Math.random() * 10, hue: p.hue, life: 1, s: p.s * .6 }); lakeDrop(p.x, p.hue); return false; }
    return true;
  });
  VIZ.dust = VIZ.dust.filter(function (p) {
    p.life -= dt / 12; if (p.life <= 0) return false;
    var tw = .5 + .5 * Math.sin(t * 6 + p.x);
    go.fillStyle = 'hsla(' + p.hue + ',100%,75%,' + p.life * (.4 + tw * .5) + ')'; go.beginPath(); go.arc(p.x, p.y, p.s * (.6 + tw * .5), 0, 6.2832); go.fill();
    return true;
  });
  if (VIZ.dust.length > 900) VIZ.dust.splice(0, VIZ.dust.length - 900);
  go.globalCompositeOperation = 'source-over';
}
afterFrame.push(drawViz);
// Hauptplayer hörbar machen: Chrome kann den Ton dieses Tabs teilen („Diesen Tab teilen“ + „Tab-Audio teilen“)
var tabStream = null;
function shareTabAudio() {
  if (tabStream) { tabStream.getTracks().forEach(function (x) { x.stop(); }); tabStream = null; analyser = null; studioPaint(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { toast('Tab-Ton teilen geht nur in Chrome oder Edge am Computer.'); return; }
  navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, preferCurrentTab: true, selfBrowserSurface: 'include' }).then(function (st) {
    if (!st.getAudioTracks().length) { st.getTracks().forEach(function (x) { x.stop(); }); toast('Bitte beim Teilen „Tab-Audio teilen“ anhaken.'); return; }
    tabStream = st; var c = ctx(), src = c.createMediaStreamSource(new MediaStream(st.getAudioTracks()));
    analyser = c.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = .8; fbuf = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser); src.connect(vizAn);            // nur analysieren, nicht nochmal abspielen
    st.getVideoTracks().forEach(function (v) { v.onended = function () { if (tabStream) shareTabAudio(); }; });
    toast('Hauptplayer wird jetzt mitgehört – Visuals & Visualizer reagieren darauf.'); studioPaint();
  }).catch(function () {});
}

/* ---------- Hauptplayer: groß · im Header · als Mini-Portal ---------- */
var PMODE = store('vr_pmode') || 'dock';
var pctl = document.createElement('div'); pctl.id = 'vr-pctl';
pctl.innerHTML = '<button data-pm="header" title="In den Header">⤒</button><button data-pm="mini" title="Minimieren">▁</button><button data-pm="dock" title="Wieder groß">⤢</button>';
$('vr-pwrap').appendChild(pctl);
var minip = document.createElement('div'); minip.id = 'vr-minip';
minip.innerHTML = '<span class="vr-portal-ico" title="Hauptplayer">◈</span><button data-mp="power" title="An / Aus">⏻</button><button data-mp="play" title="Start / Stop">▶</button>' +
  '<input type="range" min="0" max="1" step=".01" data-mp="vol" title="Lautstärke"><button data-mp="dock" title="Wieder groß">⤢</button><button data-mp="header" title="In den Header">⤒</button>';
bg.appendChild(minip);
function setPMode(m) {
  PMODE = m; store('vr_pmode', m);
  pwrap.classList.toggle('hdr', m === 'header'); pwrap.classList.toggle('mini', m === 'mini'); minip.classList.toggle('open', m === 'mini');
  minip.querySelector('[data-mp="vol"]').value = VOL.main;
}
pctl.addEventListener('click', function (e) { var b = e.target.closest('[data-pm]'); if (b) setPMode(b.dataset.pm); });
minip.addEventListener('click', function (e) {
  var b = e.target.closest('[data-mp]'); if (!b) return; var m = b.dataset.mp;
  if (m === 'dock' || m === 'header') setPMode(m);
  if (m === 'power' || m === 'play') { if (playerStopped) { playerStopped = false; currentUrl = null; refreshPlayer(); } else { playerStopped = true; pl.innerHTML = ''; currentUrl = null; } b.classList.toggle('on', !playerStopped); }
});
minip.addEventListener('input', function (e) { if (e.target.dataset.mp === 'vol') { VOL.main = +e.target.value; store('vr_vmain', String(VOL.main)); applyVolume('main'); } });
// Andock-Rechnung respektiert den Modus
var _layoutDock = layoutDock;
layoutDock = function () {
  _layoutDock();
  if (PMODE === 'header') { var w = Math.min(420, W - 2 * TW - 120), s = w / pwrap.offsetWidth; pwrap.style.transform = 'translate(' + ((W - w) / 2) + 'px,6px) scale(' + s + ')'; PR = { x: (W - w) / 2, y: 6, w: w, h: 110 * s, s: s }; }
  if (PMODE === 'mini') pwrap.style.transform = 'translate(-9999px,0)';   // spielt unsichtbar weiter
};
setPMode(PMODE);

/* ---------- Bedien-Ebene über dem Katalog ----------
   #vr-bg ist sticky und damit ein eigener Stapelkontext: alles darin liegt unter den Katalog-Panels.
   Player, Uhr, Studio und Mini-Player wandern deshalb einmal beim Start in eine deckungsgleiche
   zweite Sticky-Ebene, die über Katalog und „Meine Liste“ liegt. */
var ui = document.createElement('div'); ui.id = 'vr-ui';
bg.parentNode.insertBefore(ui, bg.nextSibling);
[pwrap, drumEl, studio, minip].forEach(function (el) { ui.appendChild(el); });

/* ---------- Fach unten in „Meine Liste“ ----------
   Beim Runterscrollen reserviert „Meine Liste“ unten Platz: oben der Studio-Knopf, darunter der Player. */
var aside = $('vr-aside'), adock = document.createElement('div'); adock.id = 'vr-adock';
adock.innerHTML = '<button id="vr-adock-st" title="Frequency-Studio öffnen / schließen"><span>◈</span> Studio</button>';
aside.appendChild(adock);
$('vr-adock-st').onclick = function () { ctx(); window.vrToggleStudio(); };
document.addEventListener('vr-studio', function () { $('vr-adock-st').classList.toggle('on', window.vrStudioOpen()); });
var wideMQ = window.matchMedia('(max-width:980px)');
window.vrDockC = function (pw, ph, C) {
  var k2 = smooth((svS - .7) / .65);
  if (wideMQ.matches || PMODE !== 'dock') { adock.style.height = '0px'; pwrap.classList.remove('adock'); return null; }
  var aR = aside.getBoundingClientRect(), bR = bg.getBoundingClientRect();
  var s = clamp((aR.width - 24) / pw, .3, .75), ch = ph * s, slot = ch + 64;
  adock.style.height = (k2 * slot).toFixed(1) + 'px';
  pwrap.classList.toggle('adock', k2 > .6);
  return { px: aR.left - bR.left + (aR.width - pw * s) / 2, py: aR.bottom - bR.top - ch - 12, ps: s,
           dx: W - TW - 110, dy: H - 92 * .96 - 14, ds: .46 };   // Uhr rückt in die freie Ecke rechts unten
};

/* ---------- Werkzeug-Runen am linken Stamm ---------- */
(function () {
  var map = { 'vr-mute': '♪', 'vr-mic': '◎', 'vr-change': '⟡', 'vr-mixbtn': '≋', 'vr-full': '⛶' };
  for (var id in map) { var b = $(id); if (b) b.dataset.rune = map[id]; }
  var _set = setSound; setSound = function (on) { _set(on); var b = $('vr-mute'); if (b) b.innerHTML = on ? '♪' : '∅'; };
  setSound(soundOn); $('vr-mic').innerHTML = '◎'; $('vr-change').innerHTML = '⟡'; $('vr-mixbtn').innerHTML = '≋'; $('vr-full').innerHTML = '⛶';
})();

/* ---------- Stiller See hinter dem Gong, Insel mit Sternenportal ---------- */
var LAKE = { ripples: [] };
function lakeGeo() { return { x: TWd * .545, y: G.gy - THd * .035, rx: TWd * .14, ry: 16 * G.s }; }
function lakeDrop(bx, hue) {   // Tropfen aus dem Visualizer fallen in den See
  if (!tVisible) return;
  var r1 = bg.getBoundingClientRect(), r2 = tc.getBoundingClientRect(), L = lakeGeo(), x = bx + r1.left - r2.left;
  if (Math.abs(x - L.x) < L.rx && r2.top < r1.bottom) LAKE.ripples.push({ x: x, r: 0, a: .8, hue: hue });
}
function drawLake(t) {
  var L = lakeGeo(), s = G.s;
  var wg = tg.createLinearGradient(0, L.y - L.ry, 0, L.y + L.ry); wg.addColorStop(0, '#0a1624'); wg.addColorStop(1, '#050a12');
  tg.fillStyle = wg; tg.beginPath(); tg.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, 6.2832); tg.fill();
  tg.save(); tg.beginPath(); tg.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, 6.2832); tg.clip();
  tg.globalCompositeOperation = 'lighter';
  for (var i = 0; i < 26; i++) { var sx = L.x + ((i * 71.3) % (L.rx * 2)) - L.rx, sy = L.y - L.ry + ((i * 13.7) % (L.ry * 2)); tg.fillStyle = 'rgba(200,220,255,' + (.15 + .15 * Math.sin(t * 2 + i)) + ')'; tg.fillRect(sx, sy, 1.2, 1.2); }
  LAKE.ripples = LAKE.ripples.filter(function (r) {
    r.r += 1.1; r.a -= .008; if (r.a <= 0) return false;
    tg.strokeStyle = 'hsla(' + r.hue + ',90%,70%,' + r.a * .6 + ')'; tg.lineWidth = 1;
    tg.beginPath(); tg.ellipse(r.x, L.y + (r.x % 7) - 3, r.r, r.r * L.ry / L.rx * 2.2, 0, 0, 6.2832); tg.stroke(); return true;
  });
  tg.globalCompositeOperation = 'source-over'; tg.restore();
  // Insel mit dreieckigem Sternenportal
  var ix = L.x + L.rx * .35, iy = L.y - L.ry * .4, pw = 26 * s, ph = 36 * s;
  tg.fillStyle = '#0c1210'; tg.beginPath(); tg.ellipse(ix, iy + 2, 44 * s, 8 * s, 0, Math.PI, 0); tg.fill();
  tg.save(); tg.beginPath(); tg.moveTo(ix, iy - ph); tg.lineTo(ix - pw, iy); tg.lineTo(ix + pw, iy); tg.closePath(); tg.clip();
  var pg = tg.createLinearGradient(ix, iy - ph, ix, iy); pg.addColorStop(0, '#1a0a3a'); pg.addColorStop(1, '#04142a'); tg.fillStyle = pg; tg.fillRect(ix - pw, iy - ph, pw * 2, ph);
  tg.globalCompositeOperation = 'lighter';
  for (i = 0; i < 30; i++) { var a = i * 2.4 + t * .3, rr = (i / 30) * pw; tg.fillStyle = 'rgba(230,220,255,' + (.4 + .4 * Math.sin(t * 3 + i)) + ')'; tg.beginPath(); tg.arc(ix + Math.cos(a) * rr, iy - ph * .38 + Math.sin(a) * rr * .8, .9, 0, 6.2832); tg.fill(); }
  tg.restore();
  tg.globalCompositeOperation = 'lighter';
  var pulse = .5 + .5 * Math.sin(t * 1.6) + (WS.hover === 'portal' ? .6 : 0);
  tg.strokeStyle = 'hsla(' + lerp(275, 44, goldAmt) + ',100%,70%,' + (.4 + pulse * .4) + ')'; tg.lineWidth = 2;
  tg.beginPath(); tg.moveTo(ix, iy - ph); tg.lineTo(ix - pw, iy); tg.lineTo(ix + pw, iy); tg.closePath(); tg.stroke();
  tg.globalCompositeOperation = 'source-over';
  hit('portal', ix, iy - ph * .4, pw * 1.1);
  // Wanderer: zwei Menschen, ein Hund, ein Esel mit viel Gepäck
  tg.fillStyle = '#05080a';
  function human(x, h, lean) { tg.beginPath(); tg.arc(x, iy - h, h * .12, 0, 6.2832); tg.fill(); tg.beginPath(); tg.moveTo(x - h * .12, iy - h * .86); tg.lineTo(x + h * .12 + lean, iy - h * .86); tg.lineTo(x + h * .1, iy - h * .4); tg.lineTo(x + h * .14, iy); tg.lineTo(x + h * .04, iy); tg.lineTo(x, iy - h * .38); tg.lineTo(x - h * .05, iy); tg.lineTo(x - h * .15, iy); tg.lineTo(x - h * .1, iy - h * .4); tg.closePath(); tg.fill(); }
  human(ix - pw - 16 * s, 26 * s, 1); human(ix - pw - 6 * s, 22 * s, -1);
  tg.strokeStyle = '#05080a'; tg.lineWidth = 1.4; tg.beginPath(); tg.moveTo(ix - pw - 21 * s, iy - 16 * s); tg.lineTo(ix - pw - 24 * s, iy); tg.stroke();   // Wanderstab
  var dx = ix + pw + 8 * s;   // Hund
  tg.beginPath(); tg.ellipse(dx, iy - 5 * s, 6 * s, 3 * s, 0, 0, 6.2832); tg.fill(); tg.beginPath(); tg.arc(dx + 6 * s, iy - 8 * s, 2.5 * s, 0, 6.2832); tg.fill();
  tg.fillRect(dx - 5 * s, iy - 3 * s, 1.5 * s, 3 * s); tg.fillRect(dx + 3 * s, iy - 3 * s, 1.5 * s, 3 * s); tg.beginPath(); tg.moveTo(dx - 6 * s, iy - 6 * s); tg.lineTo(dx - 9 * s, iy - 10 * s); tg.stroke();
  var ex = dx + 22 * s;   // Esel mit Gepäck
  tg.beginPath(); tg.ellipse(ex, iy - 11 * s, 11 * s, 5.5 * s, 0, 0, 6.2832); tg.fill();
  tg.beginPath(); tg.moveTo(ex + 8 * s, iy - 14 * s); tg.lineTo(ex + 15 * s, iy - 22 * s); tg.lineTo(ex + 19 * s, iy - 19 * s); tg.lineTo(ex + 11 * s, iy - 10 * s); tg.fill();
  tg.beginPath(); tg.moveTo(ex + 15 * s, iy - 22 * s); tg.lineTo(ex + 14 * s, iy - 28 * s); tg.lineTo(ex + 16.5 * s, iy - 22 * s); tg.fill();
  [-8, -3, 4, 8].forEach(function (o) { tg.fillRect(ex + o * s, iy - 7 * s, 1.6 * s, 7 * s); });
  tg.fillRect(ex - 9 * s, iy - 25 * s, 14 * s, 9 * s); tg.fillRect(ex - 6 * s, iy - 31 * s, 8 * s, 6 * s); tg.beginPath(); tg.arc(ex + 6 * s, iy - 19 * s, 4 * s, 0, 6.2832); tg.fill();
}

/* =====================================================================
   START
   ===================================================================== */
resize(); tResize();
renderAll();
loadState().catch(function () { refreshPlayer(); });
requestAnimationFrame(frame);
requestAnimationFrame(templeLoop);
