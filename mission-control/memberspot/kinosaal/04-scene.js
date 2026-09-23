/* ---------- Szene: Zukunft trifft Schamanismus ----------
   Ein Canvas für beide Welten. mode 0 = Lernraum (klares Nachtblau, feines Raster),
   mode 1 = Kinosaal (Sternendunkel, Feuerkreis, Waldsilhouette, goldenes Mandala).
   Die Überblendung läuft über einen weichen Faktor, nicht über zwei Bilder. */
var sky = $('ks-sky'), g = sky.getContext('2d');
var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 1.5);
var modeK = 0, modeTarget = 0, glowColor = [232, 185, 74], playing = false;
var stars = [], threads = [], sparks = [], trees = [];

function resize() {
  var r = root.getBoundingClientRect();
  W = Math.max(320, r.width); H = Math.max(400, Math.min(r.height, 4000));
  sky.width = W * DPR; sky.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0);
  var n = Math.round(W * H / 5000);
  stars = []; for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .2, p: Math.random() * 6.28, s: .4 + Math.random() * 1.6 });
  threads = []; for (i = 0; i < 7; i++) threads.push({ y: Math.random() * H * .7, a: 20 + Math.random() * 60, f: .002 + Math.random() * .004, sp: .1 + Math.random() * .3, ph: Math.random() * 6.28, hue: Math.random() < .5 ? 0 : 1 });
  trees = []; var x = -20; while (x < W + 40) { trees.push({ x: x, h: 60 + Math.random() * 120, w: 26 + Math.random() * 30 }); x += 18 + Math.random() * 34; }
}
if (window.ResizeObserver) new ResizeObserver(resize).observe(root); else window.addEventListener('resize', resize);
resize();

function mix(a, b, k) { return a + (b - a) * k; }
function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }

var last = 0, t = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  // Während der Film läuft genügt ein ruhiger Takt – schont Akku und Lüfter
  var minDt = playing ? 66 : 33;
  if (now - last < minDt) return;
  var dt = Math.min(100, now - last); last = now; t += dt / 1000;
  modeK += (modeTarget - modeK) * Math.min(1, dt / 500);
  var k = modeK;

  // Himmel
  var top = [mix(10, 2, k), mix(22, 3, k), mix(36, 6, k)], bot = [mix(14, 12, k), mix(30, 5, k), mix(48, 8, k)];
  var sg = g.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, rgba(top, 1)); sg.addColorStop(1, rgba(bot, 1));
  g.fillStyle = sg; g.fillRect(0, 0, W, H);

  // Zukunft: feines Raster im Lernraum
  if (k < .98) {
    g.strokeStyle = 'rgba(127,217,232,' + (0.05 * (1 - k)) + ')'; g.lineWidth = 1; g.beginPath();
    for (var gx = (t * 6) % 48; gx < W; gx += 48) { g.moveTo(gx, 0); g.lineTo(gx, H); }
    for (var gy = 0; gy < H; gy += 48) { g.moveTo(0, gy); g.lineTo(W, gy); }
    g.stroke();
  }

  // Sterne (im Kinosaal mehr und heller)
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i]; if (i % 3 && k < .3) continue;
    var tw = .5 + .5 * Math.sin(t * s.s + s.p);
    g.fillStyle = 'rgba(255,248,235,' + ((.15 + .6 * tw) * (.35 + .65 * k)) + ')';
    g.fillRect(s.x, s.y, s.r, s.r);
  }

  // Lichtfäden: Datenströme / Ahnenfäden
  g.lineWidth = 1.2;
  for (i = 0; i < threads.length; i++) {
    var th = threads[i], c = th.hue ? [47, 211, 232] : [242, 145, 60];
    if (k > .5) c = th.hue ? [232, 185, 74] : [200, 80, 42];
    g.strokeStyle = rgba(c, .10 + .08 * Math.sin(t * .7 + th.ph)); g.beginPath();
    for (var x = 0; x <= W; x += 16) { var y = th.y + Math.sin(x * th.f + t * th.sp + th.ph) * th.a; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }

  // Goldenes Mandala hinter der Leinwand (Kinosaal)
  if (k > .02) {
    var cx = W / 2, cy = Math.min(H * .32, 420), R = Math.min(W, 900) * .42;
    g.save(); g.translate(cx, cy); g.rotate(t * .02); g.strokeStyle = rgba(glowColor, .07 * k); g.lineWidth = 1;
    for (i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.arc(R * .5, 0, R * .5, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke();
    g.restore();
  }

  // Feuerkreis am Boden + Funken (Kinosaal)
  var fy = Math.min(H, window.innerHeight + 200) - 10;
  if (k > .02) {
    var fg = g.createRadialGradient(W / 2, fy, 0, W / 2, fy, W * .55);
    var flick = .8 + .2 * Math.sin(t * 7) * Math.sin(t * 3.3);
    fg.addColorStop(0, rgba([242, 120, 40], .35 * k * flick)); fg.addColorStop(.4, rgba([200, 60, 30], .12 * k)); fg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fg; g.fillRect(0, fy - W * .55, W, W * .55 + 20);
    if (!reduced && sparks.length < 70 && Math.random() < .5 * k) sparks.push({ x: W / 2 + (Math.random() - .5) * W * .3, y: fy, vx: (Math.random() - .5) * 20, vy: -30 - Math.random() * 60, l: 1 });
  }
  for (i = sparks.length - 1; i >= 0; i--) {
    var p = sparks[i]; p.x += p.vx * dt / 1000 + Math.sin(t * 3 + i) * .3; p.y += p.vy * dt / 1000; p.l -= dt / 3500;
    if (p.l <= 0) { sparks.splice(i, 1); continue; }
    g.fillStyle = rgba([255, 180, 90], p.l * .8 * k); g.fillRect(p.x, p.y, 2, 2);
  }

  // Waldsilhouette
  g.fillStyle = rgba([mix(8, 1, k), mix(18, 2, k), mix(28, 4, k)], .9);
  g.beginPath(); g.moveTo(0, fy + 20);
  for (i = 0; i < trees.length; i++) { var tr = trees[i]; g.lineTo(tr.x - tr.w / 2, fy); g.lineTo(tr.x, fy - tr.h * (.55 + .45 * k)); g.lineTo(tr.x + tr.w / 2, fy); }
  g.lineTo(W, fy + 20); g.closePath(); g.fill();
}
requestAnimationFrame(frame);

/* ---------- Moduswechsel: Licht dimmt, Vorhang fällt, Welt wechselt ---------- */
var shifting = false;
function setMode(m, instant) {
  if (m === root.dataset.mode || shifting) return;
  qa('.ks-mode button').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); });
  if (instant || reduced) { root.dataset.mode = m; modeTarget = modeK = m === 'kino' ? 1 : 0; afterMode(); return; }
  shifting = true; root.classList.add('ks-shift');
  setTimeout(function () {
    root.dataset.mode = m; modeTarget = m === 'kino' ? 1 : 0; afterMode();
    setTimeout(function () { root.classList.remove('ks-shift'); shifting = false; }, 250);
  }, 1000);
}
function afterMode() {
  var kino = root.dataset.mode === 'kino';
  $('ks-cat-h').textContent = kino ? 'Heute im Saal' : 'Programm';
  if (!kino) root.dataset.side = 'off';
  savePrefs({ mode: root.dataset.mode });
}
qa('.ks-mode button').forEach(function (b) { b.onclick = function () { setMode(b.dataset.mode); }; });

/* Hub ein-/ausblenden */
function setHub(on) { root.dataset.hub = on ? 'on' : 'off'; }
$('ks-hubhide').onclick = function () { setHub(false); toast('Hub ausgeblendet – H oder ▾ holt ihn zurück'); };
$('ks-reveal').onclick = function () { setHub(true); };
$('ks-sidebtn').onclick = function () {
  if (root.dataset.mode === 'kino') root.dataset.side = root.dataset.side === 'on' ? 'off' : 'on';
  else $('ks-side').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

/* ---------- Meditationslicht ---------- */
var LIGHTS = [
  { id: 'feuer', name: 'Feuer', c: [242, 130, 50] },
  { id: 'wasser', name: 'Wasser', c: [47, 211, 232] },
  { id: 'kristall', name: 'Kristall', c: [170, 120, 255] },
  { id: 'wald', name: 'Wald', c: [90, 200, 120] },
  { id: 'mond', name: 'Mond', c: [210, 220, 255] },
  { id: 'aus', name: 'Aus', c: null }
];
function setLight(id) {
  var L = LIGHTS.filter(function (x) { return x.id === id; })[0] || LIGHTS[5], el = $('ks-light');
  if (!L.c) { el.classList.remove('on'); $('ks-lightbtn').classList.remove('on'); }
  else {
    el.style.background = 'radial-gradient(ellipse at 50% 0%,' + rgba(L.c, .28) + ',transparent 55%),radial-gradient(ellipse at 0% 100%,' + rgba(L.c, .22) + ',transparent 50%),radial-gradient(ellipse at 100% 100%,' + rgba(L.c, .22) + ',transparent 50%)';
    el.classList.add('on'); $('ks-lightbtn').classList.add('on');
    glowColor = L.c; root.style.setProperty('--glow', 'rgb(' + L.c.join(',') + ')');
  }
  savePrefs({ light: L.id });
}
$('ks-lightbtn').onclick = function () {
  var b = modal('<h3>Meditationslicht</h3><p class="ks-muted">Ein sanftes Licht, das im Atemrhythmus pulsiert (6 Atemzüge pro Minute).</p><div class="ks-lights">' +
    LIGHTS.map(function (L) { return '<button data-l="' + L.id + '"><i style="color:' + (L.c ? 'rgb(' + L.c.join(',') + ')' : '#333') + '"></i>' + L.name + '</button>'; }).join('') + '</div>');
  qa('[data-l]', b).forEach(function (x) { x.onclick = function () { setLight(x.dataset.l); closeModal(); }; });
};

/* ---------- Brücken zu den anderen Räumen ---------- */
function roomUrl(v) {
  // Relative Pfade ("/dashboard/…") gelten auf der Memberspot-Domain, auf der der Lader läuft
  if (typeof v === 'string' && /^\/[\w\/-]+$/.test(v) && !/amazonaws\.com$|^localhost$/.test(location.hostname)) return location.origin + v;
  return safeUrl(v);
}
function openRoom(key, name) {
  var u = roomUrl(S.settings[key]);
  if (!u) return toast(name + ' ist noch nicht verknüpft');
  if (player && player.pause) player.pause();
  window.open(u, '_blank', 'noopener');
}
$('ks-medroom').onclick = function () { openRoom('meditationsraum_url', 'Der Meditationsraum'); };
$('ks-vr').onclick = function () { openRoom('visual_room_url', 'Der Visual Room'); };
