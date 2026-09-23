
/* =====================================================================
   TROMMEL-UHR mit Drehregler (1 min … 3 h, ∞)
   ===================================================================== */
var total = 600, remain = 600, elapsed = 0, endAt = 0, startAt = 0, running = false, tick = null, infinite = false;
var tEl = $('vr-time'), tState = $('vr-tstate'), arc = $('vr-arc'), knob = $('vr-knob'), face = $('vr-drumface'), svgD = $('vr-drumsvg');
var ARC = 552.9, SWEEP = 330;   // Grad, die der Regler abdeckt; die letzten 8 % sind ∞
function uToMin(u) { if (u >= .92) return Infinity; var m = Math.pow(180, u / .92); return m < 60 ? Math.max(1, Math.round(m)) : Math.round(m / 5) * 5; }
function minToU(m) { return m === Infinity ? .96 : clamp(Math.log(m) / Math.log(180) * .92, 0, .92); }
(function ticks() {
  var g = $('vr-ticks'), ns = 'http://www.w3.org/2000/svg', html = '';
  [[1, ''], [5, '5'], [10, '10'], [20, '20'], [30, '30'], [60, '1h'], [120, '2h'], [180, '3h'], [Infinity, '∞']].forEach(function (tk) {
    var a = (minToU(tk[0]) * SWEEP - 90) * Math.PI / 180, x1 = 100 + Math.cos(a) * 93, y1 = 100 + Math.sin(a) * 93, x2 = 100 + Math.cos(a) * 97, y2 = 100 + Math.sin(a) * 97;
    html += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#8a7aa8" stroke-width="1.2"/>';
    if (tk[1]) { var lx = 100 + Math.cos(a) * 71, ly = 100 + Math.sin(a) * 71 + 3; html += '<text x="' + lx + '" y="' + ly + '" fill="#6f5f8f" font-size="' + (tk[1] === '∞' ? 12 : 7.5) + '" text-anchor="middle" font-family="Orbitron,sans-serif">' + tk[1] + '</text>'; }
  });
  g.innerHTML = html;
})();
function fmt(s) {
  s = Math.max(0, Math.round(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return (h ? h + ':' + (m < 10 ? '0' : '') : '') + (m < 10 && !h ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x;
}
function paint() {
  if (infinite) {
    tEl.textContent = running || elapsed > 0 ? fmt(elapsed) : '∞';
    arc.style.strokeDasharray = running ? '40 30' : ARC; arc.style.strokeDashoffset = running ? -elapsed * 12 : 0;
  } else {
    tEl.textContent = fmt(remain); arc.style.strokeDasharray = ARC; arc.style.strokeDashoffset = ARC * (1 - remain / total);
  }
  tState.textContent = running ? (infinite ? 'offen' : 'läuft') : (infinite ? (elapsed ? 'Pause' : 'Start') : remain < total && remain > 0 ? 'Pause' : 'Start');
  var u = minToU(infinite ? Infinity : total / 60), a = (u * SWEEP - 90) * Math.PI / 180;
  knob.setAttribute('cx', 100 + Math.cos(a) * 88); knob.setAttribute('cy', 100 + Math.sin(a) * 88);
  knob.style.opacity = running ? 0 : 1;
}
function setMinutes(m) { stopT(); infinite = m === Infinity; if (!infinite) { total = remain = m * 60; } elapsed = 0; store('vr_min', infinite ? 'inf' : String(m)); paint(); }
function stopT() { running = false; clearInterval(tick); paint(); }
function gong() {
  var c = ctx(), now = c.currentTime + .05;
  strike(now, .5); strike(now + 5, .34); strike(now + 10, .22);   // drei Schläge, leiser werdend
  var fl = $('vr-flash'); fl.style.opacity = 1; setTimeout(function () { fl.style.opacity = 0; }, 1600);
  drumEl.classList.add('shake'); setTimeout(function () { drumEl.classList.remove('shake'); }, 1100);
}
function loopT() {
  if (infinite) { elapsed = (Date.now() - startAt) / 1000; paint(); return; }
  remain = (endAt - Date.now()) / 1000;   // uhrzeitbasiert: bleibt genau, auch im Hintergrund-Tab
  if (remain <= 0) { remain = 0; stopT(); gong(); return; }
  paint();
}
function toggleT() {
  ctx();                                   // Audio beim Klick freischalten, sonst blockt der Browser den Gong später
  if (running) { stopT(); return; }
  if (infinite) startAt = Date.now() - elapsed * 1000;
  else { if (remain <= 0) remain = total; endAt = Date.now() + remain * 1000; }
  running = true; tick = setInterval(loopT, 250); loopT();
}
// Drehen am Rand stellt die Zeit, Tippen in die Mitte startet/pausiert
var dialDrag = null;
function angleU(e) {
  var r = svgD.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
  var a = Math.atan2(y, x) * 180 / Math.PI + 90; if (a < 0) a += 360;
  return { u: clamp(a / SWEEP, 0, 1), d: Math.hypot(x, y) / (r.width / 2) };
}
face.addEventListener('pointerdown', function (e) {
  var p = angleU(e);
  dialDrag = { rim: p.d > .62 && !running, moved: false };
  if (dialDrag.rim) { face.setPointerCapture(e.pointerId); knob.style.cursor = 'grabbing'; }
});
face.addEventListener('pointermove', function (e) {
  if (!dialDrag || !dialDrag.rim) return;
  dialDrag.moved = true; var p = angleU(e); if (p.u > .995) return;
  var m = uToMin(p.u); if (m !== (infinite ? Infinity : total / 60)) setMinutes(m);
});
face.addEventListener('pointerup', function () {
  if (dialDrag && !dialDrag.moved) toggleT();
  dialDrag = null; knob.style.cursor = 'grab';
});
$('vr-reset').onclick = function () { stopT(); remain = total; elapsed = 0; paint(); };
$('vr-test').onclick = function () { var c = ctx(); strike(c.currentTime + .05, .5); };
(function () { var m = store('vr_min'); setMinutes(m === 'inf' ? Infinity : +(m || 10)); })();

/* ---------- Werkzeuge ---------- */
setSound(soundOn);
$('vr-mute').onclick = function () { ctx(); setSound(!soundOn); };
var micStream = null, micOn = [];
$('vr-mic').onclick = function () {
  var btn = this;
  if (micStream) { micStream.getTracks().forEach(function (x) { x.stop(); }); micStream = null; analyser = null; btn.classList.remove('on'); return; }
  if (!navigator.mediaDevices) { btn.title = 'Mikrofon nicht verfügbar'; return; }
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (st) {
    micStream = st; var c = ctx();
    analyser = c.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = .8;
    fbuf = new Uint8Array(analyser.frequencyBinCount);
    c.createMediaStreamSource(st).connect(analyser);
    btn.classList.add('on');
  }).catch(function () { btn.title = 'Kein Mikrofon-Zugriff'; });
};
window.addEventListener('resize', resize);

/* ---------- Mikrofon-Takterkennung: Tempo des laufenden Songs hören ---------- */
var onsets = [], lastBass = 0, lastOnset = 0;
function detectBeat() {
  if (!analyser || TEMPO.chief !== 'main' || !MIX.detect) return;
  var n = performance.now(), b = bands.bass;
  if (b > lastBass * 1.35 && b > .35 && n - lastOnset > 280) {
    lastOnset = n; onsets.push(n); if (onsets.length > 24) onsets.shift();
    if (onsets.length > 8) {
      var iv = []; for (var i = 1; i < onsets.length; i++) { var d = onsets[i] - onsets[i - 1]; while (d > 1100) d /= 2; while (d < 380) d *= 2; iv.push(d); }
      iv.sort(function (a, b) { return a - b; });
      var med = iv[iv.length >> 1], bpm = 60000 / med;
      if (Math.abs(bpm - TEMPO.bpm) > .5) setBpm(TEMPO.bpm * .8 + bpm * .2, true);
    }
  }
  lastBass = b;
}

afterFrame.push(detectBeat);

/* ---------- Mischpult: Hauptplayer · Studio · Klänge · Visuals · Tempo ---------- */
MIX.detect = store('vr_detect') === '1';
var mixEl = document.createElement('div'); mixEl.id = 'vr-mix'; bg.appendChild(mixEl);
var VOL = { main: +(store('vr_vmain') || 1), studio: +(store('vr_vstudio') || .8), fx: +(store('vr_vfx') || .8) };
function strip(id, ico, title, extra) {
  return '<div class="vr-strip" title="' + title + '"><div class="vr-ico">' + ico + '</div>' +
    '<input type="range" class="vr-fader" min="0" max="1" step=".01" value="' + (VOL[id] != null ? VOL[id] : MIX.vis) + '" data-f="' + id + '">' +
    (extra || '') + '</div>';
}
mixEl.innerHTML =
  strip('main', '🎧', 'Hauptplayer', '<button data-m="main-play" title="Start">▶</button><button data-m="main-stop" title="Stop">■</button><button data-m="main-restart" title="Neu starten">↻</button>') +
  strip('studio', '🥁', 'Studio', '<button data-m="studio-play" title="Start">▶</button><button data-m="studio-stop" title="Stop">■</button><button data-m="studio-restart" title="Neu starten">↻</button>') +
  strip('fx', '🔔', 'Glockenspiel & Klänge', '<button data-m="fx-toggle" title="An/Aus">⏻</button>') +
  strip('vis', '✺', 'Visuals: weniger ↔ mehr', '<button data-m="vis-calm" title="Ganz ruhig">☾</button>') +
  '<div class="vr-strip wide" title="Tempo"><div class="vr-ico">♩</div><div class="vr-bpm" id="vr-bpmshow"></div>' +
  '<input class="vr-bpmin" id="vr-bpmin" type="number" step="0.001" min="20" max="300">' +
  '<button data-m="tap" title="Im Takt tippen">👆</button><button data-m="sync" title="Visuals im Takt">⟲</button><button data-m="detect" title="Tempo per Mikrofon hören">👂</button></div>';
function mixPaint() {
  $('vr-bpmshow').textContent = TEMPO.bpm.toFixed(3);
  if (document.activeElement !== $('vr-bpmin')) $('vr-bpmin').value = TEMPO.bpm.toFixed(3);
  mixEl.querySelector('[data-m="sync"]').classList.toggle('on', MIX.sync);
  mixEl.querySelector('[data-m="detect"]').classList.toggle('on', !!MIX.detect);
  mixEl.querySelector('[data-m="fx-toggle"]').classList.toggle('on', soundOn);
}
onTempo.push(mixPaint);
$('vr-mixbtn').onclick = function () { mixEl.classList.toggle('open'); this.classList.toggle('on', mixEl.classList.contains('open')); mixPaint(); };
mixEl.addEventListener('input', function (e) {
  var f = e.target.dataset.f; if (!f) return; var v = +e.target.value;
  if (f === 'vis') setVis(v);
  else { VOL[f] = v; store('vr_v' + f, String(v)); applyVolume(f); }
});
$('vr-bpmin').addEventListener('change', function () { setBpm(this.value, true); });
mixEl.addEventListener('click', function (e) {
  var b = e.target.closest('[data-m]'); if (!b) return; var m = b.dataset.m;
  if (m === 'main-stop') { playerStopped = true; pl.innerHTML = ''; currentUrl = null; }
  if (m === 'main-play') { playerStopped = false; refreshPlayer(); }
  if (m === 'main-restart') { playerStopped = false; currentUrl = null; refreshPlayer(); }
  if (m.indexOf('studio-') === 0 && window.vrStudio) window.vrStudio[m.slice(7)]();
  if (m === 'fx-toggle') { ctx(); setSound(!soundOn); }
  if (m === 'vis-calm') { setVis(.15); mixEl.querySelector('[data-f="vis"]').value = .15; }
  if (m === 'tap') tapTempo();
  if (m === 'sync') setSync(!MIX.sync);
  if (m === 'detect') { MIX.detect = !MIX.detect; store('vr_detect', MIX.detect ? '1' : '0'); if (MIX.detect && !micStream) $('vr-mic').click(); TEMPO.chief = MIX.detect ? 'main' : TEMPO.chief; }
  mixPaint();
});
var playerStopped = false;
// Lautstärke: nur Einbettungen mit Steuerschnittstelle (YouTube, SoundCloud) lassen sich regeln – Spotify nicht
function applyVolume(f) {
  if (f === 'fx' && fxOut) fxOut.gain.setTargetAtTime(soundOn ? VOL.fx : 0, actx.currentTime, .05);
  if (f === 'studio' && window.vrStudio) window.vrStudio.volume(VOL.studio);
  if (f === 'main') {
    var fr = pl.querySelector('iframe'); if (!fr) return;
    if (embedKind === 'youtube') fr.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(VOL.main * 100)] }), '*');
    if (embedKind === 'soundcloud') fr.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: Math.round(VOL.main * 100) }), '*');
  }
}
mixPaint();

/* ---------- Vollbild: eigener Tab, der hier pausiert bis er wieder zu ist ---------- */
var fsWin = null, fsPoll = null;
function pauseHere(on) {
  visualsPaused = on; playerPaused = on;
  if (on) { currentUrl = null; renderPlayer(''); if (window.vrStudio) window.vrStudio.stop(); }
  else { refreshPlayer(); }
  root.classList.toggle('vr-sleeping', on);
}
$('vr-full').onclick = function () {
  if (IS_STANDALONE) { if (document.fullscreenElement) document.exitFullscreen(); else (root.requestFullscreen || root.webkitRequestFullscreen || function () {}).call(root); return; }
  if (!VR_CONFIG.standalone) { (root.requestFullscreen || root.webkitRequestFullscreen || function () {}).call(root); return; }
  var fullUrl = new URL(VR_CONFIG.standalone); fullUrl.searchParams.set('pixel', PIXEL ? '1' : '0');
  fsWin = window.open(fullUrl.href, 'neo-visual-room');
  if (!fsWin) { (root.requestFullscreen || function () {}).call(root); return; }
  pauseHere(true);
  clearInterval(fsPoll);
  fsPoll = setInterval(function () { if (!fsWin || fsWin.closed) { clearInterval(fsPoll); fsWin = null; pauseHere(false); } }, 800);
};
// Übergabe: der neue Tab bekommt Anmeldung und aktuellen Player
window.addEventListener('message', function (e) {
  var d = e.data;
  if (!d || typeof d !== 'object' || !d.vr) return;
  if (d.vr === 'ready' && fsWin && e.source === fsWin) {
    sb.auth.getSession().then(function (r) {
      var s = r.data.session;
      fsWin.postMessage({ vr: 'handoff', player: playerUrlNow(), label: session && session.label, bpm: TEMPO.bpm, vis: MIX.vis, sync: MIX.sync,
        tokens: s ? { access_token: s.access_token, refresh_token: s.refresh_token } : null }, e.origin);
    });
  }
  if (d.vr === 'handoff' && IS_STANDALONE && e.source === window.opener) {
    if (d.tokens && sb && !user) sb.auth.setSession(d.tokens);
    if (safeUrl(d.player)) { session = { url: d.player, label: d.label || 'aus dem Raum' }; refreshPlayer(); }
    if (d.bpm) setBpm(d.bpm); if (d.vis != null) setVis(d.vis); setSync(!!d.sync);
  }
});
if (IS_STANDALONE && window.opener) window.opener.postMessage({ vr: 'ready' }, '*');

/* ---------- Uhr-Designs (im Studio umschaltbar) ---------- */
var DRUM_THEMES = [
  { n: 'Schamanentrommel', skin: ['#3a2a1e', '#22160e', '#110a05'], rim: ['#2a180c', '#140b05', '#24140a'], prog: ['#2FD3E8', '#b86bff', '#F2913C'], txt: '#d9c7ff', glyph: '#5a2a1a' },
  { n: 'Mondstein', skin: ['#2a3040', '#161a26', '#0a0c14'], rim: ['#3a4254', '#1a1e2a', '#2e3444'], prog: ['#cfe2ff', '#8fb0ff', '#e8f0ff'], txt: '#e6eeff', glyph: '#4a5a7a' },
  { n: 'Neon-Ninja', skin: ['#14061c', '#0a0410', '#050208'], rim: ['#1a0a24', '#08040c', '#1a0a24'], prog: ['#ff2fb3', '#b86bff', '#2FD3E8'], txt: '#ff9ae0', glyph: '#6a1a5a' },
  { n: 'Holz & Gold', skin: ['#4a3018', '#2e1c0c', '#1a0e06'], rim: ['#5a3a1a', '#2a180a', '#4a2e14'], prog: ['#f6d27a', '#e8b94a', '#b5542a'], txt: '#f3dca0', glyph: '#7a4a1a' },
  { n: 'Jade', skin: ['#12302a', '#0a1e1a', '#04100c'], rim: ['#1a4038', '#0a201a', '#163a30'], prog: ['#7affc8', '#2FD3E8', '#e8f0a0'], txt: '#b8ffe0', glyph: '#1e5a44' }
];
var drumTheme = +(store('vr_drumtheme') || 0);
function applyDrumTheme(i) {
  drumTheme = (i + DRUM_THEMES.length) % DRUM_THEMES.length; store('vr_drumtheme', String(drumTheme));
  var th = DRUM_THEMES[drumTheme], q2 = function (sel) { return svgD.querySelectorAll(sel); };
  ['vrSkin', 'vrRim', 'vrProg'].forEach(function (id, k) { var st = svgD.querySelectorAll('#' + id + ' stop'), cols = [th.skin, th.rim, th.prog][k]; st.forEach(function (x, j) { x.setAttribute('stop-color', cols[Math.min(j, cols.length - 1)]); }); });
  $('vr-drumtime').style.color = th.txt; $('vr-drumtime').style.textShadow = '0 0 12px ' + th.prog[1];
  q2('#vr-glyphs')[0].setAttribute('stroke', th.glyph); knob.setAttribute('stroke', th.prog[2]);
}
applyDrumTheme(drumTheme);
