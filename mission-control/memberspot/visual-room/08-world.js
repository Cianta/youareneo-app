
/* =====================================================================
   BODENWELT: Pyramide · Lagerfeuer & Instrumente · Gong · Räucherwerk ·
   Schamanentrommeln · Berge mit Pagode, Kirschbäumen, Teich · Jahreszeiten ·
   versammelnde Krafttiere · Gargoyle · Gong-Show
   ===================================================================== */
var tSec = $('vr-temple'), tc = $('vr-tcanvas'), tg = tc.getContext('2d');
var TWd = 0, THd = 0, tDPR = 1, tVisible = false, tLast = performance.now(), tClock = 0;
var WS = { fire: true, incense: false, season: 0, seasonSpeed: 1 / 480, hits: [], hover: null, rainT: -99 };
var gongS = { amp: 0, swing: 0, sv: 0, ripples: [] }, tGlit = [], smoke = [], weather = [], drumHits = [0, 0, 0];
var mallet = { x: 0, y: 0, ang: -.2, held: false, rest: true, vx: 0, vy: 0, cool: 0 };
var G = {};   // Geometrie
var PHOTO = {}; window.VR_WPHOTO = window.VR_WPHOTO || {};
function loadWorldPhotos() {
if (PIXEL || PHOTO.requested) return; PHOTO.requested = true;
['gong','fire','drums'].forEach(function (k) { if (VR_WPHOTO[k]) { var im = new Image(); im.src = VR_WPHOTO[k]; PHOTO[k] = im; } });

(PIXEL ? [] : ['pyr:https://fvd-data.s3.amazonaws.com/apps/3708781/1789773229-H79GDd/vr-pyramide.jpg', 'pag:https://fvd-data.s3.amazonaws.com/apps/3708781/1789773232-KKcNYC/vr-pagode.jpg']).forEach(function (x) {
  var k = x.slice(0, 3), im = new Image(); im.src = x.slice(4); PHOTO[k] = im;
});
}
function ready(im) { return im && im.complete && im.naturalWidth; }
// Foto-Zyklus: steht als Foto, löst sich in Transparenz auf, wird aus Linien neu erschaffen, wird wieder zum Foto
function photoAlpha(t, off, show) {
  if (show) return 1 - smooth((show - 3) / 3) + smooth((show - 36) / 5);
  var c = ((t + off) % 70) / 70;
  return c < .55 ? 1 : c < .65 ? 1 - smooth((c - .55) / .1) : c < .85 ? 0 : smooth((c - .85) / .15);
}
function drawPhoto(im, x, y, w, h, a) {
  if (!ready(im) || a < .01) return;
  tg.save(); tg.globalAlpha = a; tg.globalCompositeOperation = 'screen';
  if (a < .98) tg.filter = 'blur(' + ((1 - a) * 6).toFixed(1) + 'px)';
  tg.drawImage(im, x, y, w, h); tg.restore();
}
function tResize() {
  tDPR = Math.min(window.devicePixelRatio || 1, PIXEL ? 1 : 1.5); TWd = tSec.clientWidth; THd = tSec.clientHeight;
  tc.width = TWd * tDPR | 0; tc.height = THd * tDPR | 0;
  var gy = THd * .8, S1 = Math.min(TWd / 1100, THd / 760);
  G = { gy: gy, s: clamp(S1, .55, 1.3),
    pyr: { x: TWd * .2, w: Math.max(TWd * .19, 150), h: Math.min(THd * .3, Math.max(TWd * .19, 150) * .78) },
    fire: { x: TWd * .37, y: gy + 26 },
    gong: { x: TWd * .525, y: gy - THd * .2, R: clamp(Math.min(TWd * .04, THd * .065), 22, 48) },
    inc: { x: TWd * .575, y: gy + 18 },
    drums: [0, 1, 2].map(function (i) { return { x: TWd * (.615 + i * .034), y: gy + 8 + (i % 2) * 14, r: 17 + (i === 1 ? 5 : 0) }; }),
    beat: { x: TWd * .455, y: gy + (THd - gy) * .62, r: 17 },
    mount: { x: TWd * .7, w: TWd * .2 },
    pond: { x: TWd * .79, y: gy + 30, rx: TWd * .055, ry: 11 },
    temple: { x: TWd * .8, y: gy - THd * .3 }
  };
  buildPyramid(); buildMountains(); buildCherries();
  if (mallet.rest) placeMallet();
  gatherSpots();
}
function placeMallet() { mallet.x = G.gong.x + G.gong.R * 2.1; mallet.y = G.gy + 22; mallet.ang = -.15; }

/* ---------- Pyramide aus einzelnen Steinen ---------- */
var blocks = [];
function buildPyramid() {
  blocks = []; var P = G.pyr, tiers = 6, th = P.h / tiers, r = rnd(5);
  for (var i = 0; i < tiers; i++) {
    var tw = P.w * (1 - i * .14), cols = Math.max(2, Math.round(tw / (th * 1.5))), bw = tw / cols, y = G.gy - (i + 1) * th;
    for (var c = 0; c < cols; c++) blocks.push({ hx: P.x - tw / 2 + c * bw, hy: y, w: bw, h: th, x: 0, y: 0, a: 1, moss: r() < .35, shade: .8 + r() * .35, ph: r() * 6.28, sx: (r() - .5) * 2, sy: -.3 - r() });
  }
  blocks.forEach(function (b) { b.x = b.hx; b.y = b.hy; });
}
function drawPyramid(t, show) {
  var P = G.pyr, pa = ready(PHOTO.pyr) ? photoAlpha(t, 0, show) : 0, sz = P.w * 1.9;
  drawPhoto(PHOTO.pyr, P.x - sz / 2, G.gy - sz * .93, sz, sz, pa);
  tg.save(); var baseA = 1 - pa * .96;
  blocks.forEach(function (b, i) {
    var k = i / blocks.length;
    if (show) {   // löst sich auf und baut sich mit herbeischwebenden Steinen neu auf
      var dis = smooth((show - 4 - k * 5) / 4), reb = smooth((show - 22 - (1 - k) * 12) / 5);
      if (reb > 0) { var sx = b.hx + Math.cos(b.ph) * TWd * .6, sy = -THd * .3 - Math.sin(b.ph) * 100; b.x = lerp(sx, b.hx, reb); b.y = lerp(sy, b.hy, reb); b.a = reb; }
      else { b.x = b.hx + b.sx * dis * 160 + Math.sin(t + b.ph) * dis * 20; b.y = b.hy + b.sy * dis * 220; b.a = 1 - dis; }
    } else { b.x += (b.hx - b.x) * .1; b.y += (b.hy - b.y) * .1; b.a += (1 - b.a) * .1; }
    if (b.a * baseA < .02) return;
    tg.globalAlpha = b.a * baseA;
    var l = 18 * b.shade, lg = tg.createLinearGradient(0, b.y, 0, b.y + b.h);
    lg.addColorStop(0, 'hsl(35,10%,' + (l + 10) + '%)'); lg.addColorStop(1, 'hsl(30,12%,' + l + '%)');
    tg.fillStyle = lg; tg.fillRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
    tg.strokeStyle = 'rgba(0,0,0,.45)'; tg.lineWidth = 1; tg.strokeRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
    if (b.moss) { tg.fillStyle = 'rgba(70,110,40,.45)'; tg.beginPath(); tg.ellipse(b.x + b.w * .5, b.y + 3, b.w * .35, 3, 0, 0, 6.2832); tg.fill(); }
  });
  tg.globalAlpha = 1;
  // Tempelchen oben & Lichtrune
  var topY = G.gy - P.h, a = show ? 1 - smooth((show - 4) / 3) + smooth((show - 32) / 3) : 1;
  if (a > .02) {
    tg.globalAlpha = Math.min(1, a) * baseA;
    tg.fillStyle = '#2a241c'; tg.fillRect(P.x - P.w * .1, topY - P.h * .12, P.w * .2, P.h * .12);
    tg.fillStyle = '#0b0906'; tg.fillRect(P.x - P.w * .03, topY - P.h * .08, P.w * .06, P.h * .08);
    tg.globalCompositeOperation = 'lighter';
    tg.strokeStyle = 'hsla(' + lerp(188, 44, goldAmt) + ',100%,65%,' + (.35 + .3 * Math.sin(t * 1.3)) + ')'; tg.lineWidth = 1.5;
    tg.beginPath(); tg.moveTo(P.x - 8, G.gy - P.h * .45); tg.lineTo(P.x, G.gy - P.h * .55); tg.lineTo(P.x + 8, G.gy - P.h * .45); tg.lineTo(P.x, G.gy - P.h * .35); tg.closePath(); tg.stroke();
    tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1;
  }
  tg.restore();
}

/* ---------- Berge, Pagode, Kirschbäume, Teich ---------- */
var ridges = [];
function buildMountains() {
  ridges = []; var r = rnd(11), M = G.mount;
  for (var L = 0; L < 3; L++) {
    var pts = [], x0 = M.x - M.w * (.3 - L * .05), x1 = TWd + 20, peak = G.gy - THd * (.46 - L * .1), n = 18;
    for (var i = 0; i <= n; i++) { var u = i / n, x = lerp(x0, x1, u), bell = Math.sin(Math.PI * clamp(u * 1.15, 0, 1)); pts.push([x, lerp(G.gy, peak, Math.pow(bell, .8)) + (r() - .5) * 18 * (1 - L * .3)]); }
    ridges.push(pts);
  }
}
function drawMountains(t) {
  var winter = seasonAmt(4), cols = [['#1b2230', '#0e131c'], ['#232a38', '#141922'], ['#2c3444', '#161b24']];
  ridges.forEach(function (pts, L) {
    tg.beginPath(); tg.moveTo(pts[0][0], G.gy);
    pts.forEach(function (p) { tg.lineTo(p[0], p[1]); }); tg.lineTo(TWd + 20, G.gy); tg.closePath();
    var lg = tg.createLinearGradient(0, G.gy - THd * .5, 0, G.gy); lg.addColorStop(0, cols[L][0]); lg.addColorStop(1, cols[L][1]);
    tg.fillStyle = lg; tg.fill();
    // Schneekappen im Winter
    if (winter > .02) {
      tg.save(); tg.clip();
      tg.fillStyle = 'rgba(235,240,250,' + winter * .8 + ')';
      var top = Math.min.apply(null, pts.map(function (p) { return p[1]; }));
      tg.fillRect(0, top - 5, TWd, (G.gy - top) * .28);
      tg.restore();
    }
  });
}
function drawTemple(t, show) {
  var T = G.temple, s = G.s * 1.1, winter = seasonAmt(4), pa = ready(PHOTO.pag) ? photoAlpha(t, 30, show) : 0, ph = THd * .62;
  drawPhoto(PHOTO.pag, T.x - ph * .5, G.gy - ph * .97, ph, ph, pa);
  if (pa > .97) return;
  tg.save(); tg.globalAlpha = 1 - pa;
  tg.save(); tg.translate(T.x, T.y);
  // Felsvorsprung
  tg.fillStyle = '#12161f'; tg.beginPath(); tg.moveTo(-70 * s, 0); tg.lineTo(70 * s, 0); tg.lineTo(50 * s, 18 * s); tg.lineTo(-55 * s, 20 * s); tg.closePath(); tg.fill();
  for (var i = 0; i < 3; i++) {
    var w = (56 - i * 13) * s, bh = 16 * s, y = -i * 30 * s - bh;
    tg.fillStyle = '#5a1510'; tg.fillRect(-w * .72, y, w * 1.44, bh);
    tg.fillStyle = 'rgba(255,170,90,' + (.35 + .2 * Math.sin(t * 2 + i)) + ')'; tg.fillRect(-w * .12, y + 4 * s, w * .24, bh - 6 * s);
    // geschwungenes Dach
    tg.fillStyle = '#16100c';
    tg.beginPath(); tg.moveTo(-w * 1.2, y + 2 * s); tg.quadraticCurveTo(-w * .9, y - 2 * s, -w * .75, y - 9 * s); tg.lineTo(w * .75, y - 9 * s); tg.quadraticCurveTo(w * .9, y - 2 * s, w * 1.2, y + 2 * s);
    tg.quadraticCurveTo(w * .95, y - 3 * s, w * .9, y - 4 * s); tg.lineTo(-w * .9, y - 4 * s); tg.quadraticCurveTo(-w * .95, y - 3 * s, -w * 1.2, y + 2 * s); tg.fill();
    tg.strokeStyle = '#c9a24a'; tg.lineWidth = 1.2; tg.beginPath(); tg.moveTo(-w * 1.2, y + 2 * s); tg.quadraticCurveTo(-w * .9, y - 2 * s, -w * .75, y - 9 * s); tg.lineTo(w * .75, y - 9 * s); tg.quadraticCurveTo(w * .9, y - 2 * s, w * 1.2, y + 2 * s); tg.stroke();
    if (winter > .05) { tg.fillStyle = 'rgba(240,244,252,' + winter * .9 + ')'; tg.fillRect(-w * .75, y - 11 * s, w * 1.5, 3 * s); }
  }
  tg.strokeStyle = '#c9a24a'; tg.lineWidth = 1.5; tg.beginPath(); tg.moveTo(0, -3 * 30 * s - 10 * s); tg.lineTo(0, -3 * 30 * s - 30 * s); tg.stroke();
  tg.restore(); tg.restore();
}
var cherries = [];
function buildCherries() {
  cherries = []; var r = rnd(21);
  [[TWd * .735, G.gy + 4, 1], [TWd * .865, G.gy + 6, .85]].forEach(function (c) {
    var segs = [], tips = [];
    (function br(x, y, a, len, d) {
      var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; segs.push([x, y, x2, y2, Math.max(1, 6 - d * 1.2) * c[2]]);
      if (d >= 4 || len < 8) { tips.push([x2, y2, r() * 6.28]); return; }
      br(x2, y2, a - .35 - r() * .3, len * (.7 + r() * .12), d + 1); br(x2, y2, a + .3 + r() * .3, len * (.68 + r() * .12), d + 1);
      if (r() < .3) br(x2, y2, a + (r() - .5) * .3, len * .6, d + 1);
    })(c[0], c[1], -Math.PI / 2 + (r() - .5) * .2, 46 * G.s * c[2], 0);
    cherries.push({ segs: segs, tips: tips });
  });
}
// Jahreszeit: 0 Frühling (rosa) · 1 Grün · 2 Kirschen · 3 Welk · 4 Winter
function seasonAmt(k) { var d = Math.abs(((WS.season - k) % 5 + 7.5) % 5 - 2.5); return clamp(1 - d, 0, 1); }
function blossomColor(tip, t, show) {
  var s = WS.season, pink = seasonAmt(0), green = seasonAmt(1) + seasonAmt(2) * .8, wilt = seasonAmt(3);
  var hue = 330 + (show ? Math.sin(t * 2 + tip[2]) * 40 : 0);
  return [pink, green, seasonAmt(2), wilt, hue];
}
function drawCherries(t, show) {
  var winter = seasonAmt(4);
  cherries.forEach(function (tr) {
    tg.strokeStyle = '#1e140e'; tg.lineCap = 'round';
    tr.segs.forEach(function (s) { tg.lineWidth = s[4]; tg.beginPath(); tg.moveTo(s[0], s[1]); tg.lineTo(s[2], s[3]); tg.stroke(); });
    if (winter > .1) { tg.strokeStyle = 'rgba(240,244,252,' + winter * .8 + ')'; tr.segs.forEach(function (s) { if (s[4] > 1.5) { tg.lineWidth = 1.5; tg.beginPath(); tg.moveTo(s[0], s[1] - s[4] * .4); tg.lineTo(s[2], s[3] - s[4] * .4); tg.stroke(); } }); }
    tr.tips.forEach(function (tip) {
      var c = blossomColor(tip, t, show), sz = 6 * G.s, n = 6;
      for (var i = 0; i < n; i++) {
        var a = tip[2] + i * 1.1, x = tip[0] + Math.cos(a) * sz * .8, y = tip[1] + Math.sin(a) * sz * .6;
        if (c[0] > .05) { tg.fillStyle = 'hsla(' + c[4] + ',75%,' + (78 - i * 2) + '%,' + c[0] * .9 + ')'; tg.beginPath(); tg.arc(x, y, sz * .5, 0, 6.2832); tg.fill(); }
        if (c[1] > .05) { tg.fillStyle = 'hsla(110,45%,' + (26 + i * 2) + '%,' + Math.min(1, c[1]) * .9 + ')'; tg.beginPath(); tg.ellipse(x, y, sz * .55, sz * .3, a, 0, 6.2832); tg.fill(); }
        if (c[2] > .05 && i % 3 === 0) { tg.fillStyle = 'rgba(200,20,40,' + c[2] + ')'; tg.beginPath(); tg.arc(x, y + 3, 1.8 * G.s, 0, 6.2832); tg.fill(); }
        if (c[3] > .05 && i % 2 === 0) { tg.fillStyle = 'hsla(' + (28 + i * 4) + ',70%,38%,' + c[3] * .8 + ')'; tg.beginPath(); tg.ellipse(x, y, sz * .4, sz * .25, a, 0, 6.2832); tg.fill(); }
      }
      var rate = (c[0] * .01 + c[3] * .02) * (show ? 6 : 1);   // fallende Blüten & Blätter
      if (Math.random() < rate) weather.push({ k: c[3] > c[0] ? 'leaf' : 'petal', x: tip[0], y: tip[1], vx: .3 + Math.random() * .6, vy: .3 + Math.random() * .4, ph: Math.random() * 6, hue: c[4], life: 1 });
    });
  });
}
function drawPond(t) {
  var P = G.pond, winter = seasonAmt(4);
  var wg = tg.createRadialGradient(P.x, P.y, 2, P.x, P.y, P.rx);
  wg.addColorStop(0, winter > .5 ? '#c8d4e4' : '#1c4a5a'); wg.addColorStop(1, winter > .5 ? '#8a9ab0' : '#0a2430');
  tg.fillStyle = wg; tg.beginPath(); tg.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, 6.2832); tg.fill();
  tg.strokeStyle = 'rgba(160,220,240,.25)'; tg.lineWidth = 1;
  for (var i = 0; i < 3; i++) { var rr = ((t * .3 + i / 3) % 1); tg.globalAlpha = 1 - rr; tg.beginPath(); tg.ellipse(P.x + P.rx * .2, P.y, P.rx * .5 * rr, P.ry * .5 * rr, 0, 0, 6.2832); tg.stroke(); }
  tg.globalAlpha = 1;
  // Schmelzwasser steigt als Energie auf (Frühlingsbeginn)
  var melt = seasonAmt(0) * (WS.season < .6 || WS.season > 4.4 ? 1 : .2);
  if (Math.random() < melt * .3) smoke.push({ x: P.x + (Math.random() - .5) * P.rx * 1.6, y: P.y, vx: 0, vy: -.6 - Math.random() * .5, life: 1, energy: 1, hue: 190 });
}

/* ---------- Lagerfeuer, Instrumente, Räucherwerk, Trommeln, Gong, Beat-Stein ---------- */
function hit(kind, x, y, r, data) { WS.hits.push({ k: kind, x: x, y: y, r: r, d: data }); }
function drawFire(t) {
  var F = G.fire, s = G.s;
  if (ready(PHOTO.fire)) { var fw = TWd * .3, fh = fw * 9 / 16; tg.save(); tg.globalCompositeOperation = 'screen'; tg.globalAlpha = WS.fire ? .9 + .1 * Math.sin(t * 13) * Math.sin(t * 7) : .35; tg.drawImage(PHOTO.fire, F.x - fw * .5, F.y - fh * .62, fw, fh); tg.restore(); }
  tg.fillStyle = '#2a241c'; for (var i = 0; i < 9; i++) { var a = i / 9 * 6.2832; tg.beginPath(); tg.ellipse(F.x + Math.cos(a) * 20 * s, F.y + Math.sin(a) * 6 * s, 6 * s, 4 * s, 0, 0, 6.2832); tg.fill(); }
  tg.strokeStyle = '#3a2412'; tg.lineWidth = 5 * s; tg.lineCap = 'round';
  tg.beginPath(); tg.moveTo(F.x - 16 * s, F.y + 3); tg.lineTo(F.x + 14 * s, F.y - 6 * s); tg.moveTo(F.x + 16 * s, F.y + 3); tg.lineTo(F.x - 12 * s, F.y - 7 * s); tg.stroke();
  if (WS.fire) {
    var gl = tg.createRadialGradient(F.x, F.y - 10, 2, F.x, F.y - 10, 120 * s); gl.addColorStop(0, 'rgba(255,140,50,.35)'); gl.addColorStop(1, 'rgba(255,90,20,0)');
    tg.fillStyle = gl; tg.fillRect(F.x - 120 * s, F.y - 130 * s, 240 * s, 240 * s);
    tg.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 5; k++) {
      var fh = (28 + k * 4) * s * (.8 + .3 * Math.sin(t * 9 + k * 2)), fw = (9 - k) * s, ox = Math.sin(t * 5 + k) * 3;
      var fg = tg.createLinearGradient(0, F.y, 0, F.y - fh); fg.addColorStop(0, 'rgba(255,' + (120 + k * 20) + ',40,.6)'); fg.addColorStop(1, 'rgba(255,220,120,0)');
      tg.fillStyle = fg; tg.beginPath(); tg.moveTo(F.x - fw + ox, F.y - 2); tg.quadraticCurveTo(F.x - fw * .4 + ox, F.y - fh * .6, F.x + ox * 1.5, F.y - fh); tg.quadraticCurveTo(F.x + fw * .4 + ox, F.y - fh * .6, F.x + fw + ox, F.y - 2); tg.fill();
    }
    tg.globalCompositeOperation = 'source-over';
    if (Math.random() < .5) smoke.push({ x: F.x + (Math.random() - .5) * 8, y: F.y - 30 * s, vx: (Math.random() - .5) * .3, vy: -.7 - Math.random() * .5, life: 1, spark: Math.random() < .3 });
  }
  hit('fire', F.x, F.y - 10, 28 * s);
}
var INST_POS = [[-.105, .0], [-.08, .045], [-.05, .07], [.05, .07], [.08, .045], [.105, 0], [.0, .085], [-.13, -.03]];
function instPos(i) { var p = INST_POS[i]; return { x: G.fire.x + p[0] * TWd, y: G.fire.y + p[1] * THd }; }
function drawInstrument(i, t) {
  var it = INSTR[i], p = instPos(i), s = G.s, on = it.on, beat = on ? Math.pow(1 - beatPhase(), 5) : 0;
  if (ready(PHOTO.fire)) { tg.save(); tg.scale(1, 1); tg.translate(-99999, 0); } else tg.save();
  tg.translate(p.x, p.y); tg.scale(s, s);
  tg.fillStyle = 'rgba(0,0,0,.35)'; tg.beginPath(); tg.ellipse(0, 12, 22, 5, 0, 0, 6.2832); tg.fill();
  var wood = '#6b3f1e', dark = '#2a160b';
  tg.lineWidth = 1.2; tg.strokeStyle = dark;
  if (it.id === 'guitar') { tg.rotate(-.5); tg.fillStyle = wood; tg.beginPath(); tg.ellipse(0, 4, 9, 11, 0, 0, 6.2832); tg.ellipse(0, -10, 7, 8, 0, 0, 6.2832); tg.fill(); tg.fillStyle = dark; tg.fillRect(-1.5, -38, 3, 30); tg.beginPath(); tg.arc(0, -2, 3, 0, 6.2832); tg.fill(); }
  if (it.id === 'flute') { tg.rotate(-.2); tg.fillStyle = '#b08a52'; tg.fillRect(-20, -2, 40, 4); tg.fillStyle = dark; for (var h = 0; h < 5; h++) { tg.beginPath(); tg.arc(-10 + h * 5, 0, 1, 0, 6.2832); tg.fill(); } }
  if (it.id === 'violin' || it.id === 'cello') {
    var k = it.id === 'cello' ? 1.6 : 1; tg.scale(k, k); tg.fillStyle = it.id === 'cello' ? '#5a2e14' : '#8a4a1e';
    tg.beginPath(); tg.ellipse(0, 5, 8, 8, 0, 0, 6.2832); tg.ellipse(0, -7, 6.5, 6.5, 0, 0, 6.2832); tg.fill();
    tg.fillStyle = dark; tg.fillRect(-1.2, -26, 2.4, 20); tg.beginPath(); tg.arc(0, -27, 2.4, 0, 6.2832); tg.fill();
    tg.strokeStyle = '#c9a24a'; tg.lineWidth = .5; tg.beginPath(); tg.moveTo(0, -24); tg.lineTo(0, 10); tg.stroke();
  }
  if (it.id === 'dj' || it.id === 'synth' || it.id === 'vinyl') {
    tg.fillStyle = '#16161c'; tg.fillRect(-20, -6, 40, 14); tg.strokeStyle = 'rgba(184,107,255,.6)'; tg.strokeRect(-20, -6, 40, 14);
    if (it.id === 'synth') { tg.fillStyle = '#e8e8ec'; for (var kk = 0; kk < 9; kk++) tg.fillRect(-18 + kk * 4.2, 0, 3.4, 6); tg.fillStyle = '#111'; for (kk = 0; kk < 8; kk++) if (kk % 7 !== 2 && kk % 7 !== 6) tg.fillRect(-15.5 + kk * 4.2, 0, 2, 3.5); }
    if (it.id === 'dj') { for (var f = 0; f < 3; f++) { tg.fillStyle = 'hsl(' + (190 + f * 50) + ',90%,' + (50 + beat * 30) + '%)'; tg.fillRect(-14 + f * 11, -3, 6, 2); tg.beginPath(); tg.arc(-11 + f * 11, 3, 1.8, 0, 6.2832); tg.fill(); } }
    if (it.id === 'vinyl') { tg.save(); tg.translate(-4, 1); tg.rotate(on ? t * 3.5 : 0); tg.fillStyle = '#050505'; tg.beginPath(); tg.arc(0, 0, 8, 0, 6.2832); tg.fill(); tg.fillStyle = '#b3261e'; tg.beginPath(); tg.arc(0, 0, 2.5, 0, 6.2832); tg.fill(); tg.strokeStyle = 'rgba(255,255,255,.12)'; tg.beginPath(); tg.arc(0, 0, 5.5, 0, 3); tg.stroke(); tg.restore(); tg.strokeStyle = '#aaa'; tg.beginPath(); tg.moveTo(14, -4); tg.lineTo(4, 2); tg.stroke(); }
  }
  if (it.id === 'chimes') { tg.fillStyle = '#6b4224'; tg.fillRect(-12, -20, 24, 3); for (var c2 = 0; c2 < 5; c2++) { tg.fillStyle = '#c8d0d8'; tg.fillRect(-10 + c2 * 5, -17, 2, 14 - c2 * 2); } }
  tg.restore();
  // Schalter-Kugel
  var oy = p.y - 30 * s, glow = on ? .6 + beat * .4 : .15;
  var og = tg.createRadialGradient(p.x, oy, 0, p.x, oy, 10 * s); og.addColorStop(0, on ? 'rgba(255,220,140,' + glow + ')' : 'rgba(160,140,200,.35)'); og.addColorStop(1, 'rgba(255,180,80,0)');
  tg.fillStyle = og; tg.beginPath(); tg.arc(p.x, oy, 10 * s, 0, 6.2832); tg.fill();
  tg.strokeStyle = on ? '#e8b94a' : 'rgba(184,107,255,.6)'; tg.lineWidth = 1.2; tg.beginPath(); tg.arc(p.x, oy, 5 * s, 0, 6.2832); tg.stroke();
  if (on) { tg.fillStyle = '#e8b94a'; tg.beginPath(); tg.arc(p.x, oy, 2.4 * s, 0, 6.2832); tg.fill(); }
  hit('inst', p.x, oy, 10 * s, i); hit('instplay', p.x, p.y, 20 * s, i);
}
function drawIncense(t) {
  var I = G.inc, s = G.s;
  tg.fillStyle = '#5a4630'; tg.beginPath(); tg.ellipse(I.x, I.y, 14 * s, 5 * s, 0, 0, 6.2832); tg.fill();
  tg.fillStyle = '#7a5e3c'; tg.fillRect(I.x - 13 * s, I.y - 7 * s, 26 * s, 7 * s);
  [-4, 0, 4].forEach(function (o, k) {
    var tx = I.x + o * 1.8 * s, ty = I.y - 40 * s;
    tg.strokeStyle = '#8a3a20'; tg.lineWidth = 1.2; tg.beginPath(); tg.moveTo(I.x + o * s, I.y - 6 * s); tg.lineTo(tx, ty); tg.stroke();
    if (WS.incense) {
      tg.fillStyle = 'rgba(255,' + (100 + Math.random() * 60 | 0) + ',40,1)'; tg.beginPath(); tg.arc(tx, ty, 1.5, 0, 6.2832); tg.fill();
      if (Math.random() < .12) smoke.push({ x: tx, y: ty, vx: 0, vy: -.35, life: 1, curl: k, thin: 1 });
    }
  });
  hit('incense', I.x, I.y - 16 * s, 22 * s);
}
function drawDrums(t) {
  var dp = ready(PHOTO.drums);
  if (dp) { var dw = TWd * .15, dh = dw * 9 / 16, cx = G.drums[1].x; tg.save(); tg.globalCompositeOperation = 'screen'; tg.drawImage(PHOTO.drums, cx - dw / 2, G.gy + 30 - dh * .92, dw, dh); tg.restore();
    G.drums.forEach(function (d, i) { d.x = cx + (i - 1) * dw * .31; d.y = G.gy + 30 - dh * .56; d.r = dw * .1 / G.s; var h = drumHits[i]; drumHits[i] = Math.max(0, h - .05); if (h > .05) { tg.strokeStyle = 'rgba(255,220,160,' + h * .8 + ')'; tg.beginPath(); tg.arc(d.x, d.y, d.r * G.s * (1.1 + (1 - h) * .8), 0, 6.2832); tg.stroke(); } hit('drum', d.x, d.y, d.r * G.s, i); });
    return; }
  G.drums.forEach(function (d, i) {
    var r = d.r * G.s, h = drumHits[i]; drumHits[i] = Math.max(0, h - .05);
    tg.strokeStyle = '#3a2212'; tg.lineWidth = 2; tg.beginPath(); tg.moveTo(d.x - r * .6, d.y + r * 1.9); tg.lineTo(d.x, d.y + r * .4); tg.lineTo(d.x + r * .6, d.y + r * 1.9); tg.moveTo(d.x, d.y + r * .4); tg.lineTo(d.x, d.y + r * 2); tg.stroke();
    tg.save(); tg.translate(d.x, d.y); tg.scale(1 + h * .04, 1 - h * .03);
    tg.fillStyle = '#4a2a14'; tg.beginPath(); tg.ellipse(0, 0, r, r * .95, 0, 0, 6.2832); tg.fill();
    var sk = tg.createRadialGradient(-r * .2, -r * .25, 1, 0, 0, r * .88); sk.addColorStop(0, '#d8b88a'); sk.addColorStop(1, '#8a6238');
    tg.fillStyle = sk; tg.beginPath(); tg.ellipse(0, 0, r * .86, r * .82, 0, 0, 6.2832); tg.fill();
    tg.strokeStyle = '#7a1e10'; tg.lineWidth = 1.4; tg.beginPath(); tg.arc(0, 0, r * .35, 0, 6.2832); for (var k = 0; k < 6; k++) { var a = k / 6 * 6.2832; tg.moveTo(Math.cos(a) * r * .45, Math.sin(a) * r * .45); tg.lineTo(Math.cos(a) * r * .7, Math.sin(a) * r * .7); } tg.stroke();
    if (h > .05) { tg.strokeStyle = 'rgba(255,220,160,' + h * .8 + ')'; tg.beginPath(); tg.arc(0, 0, r * (1.1 + (1 - h) * .8), 0, 6.2832); tg.stroke(); }
    tg.restore();
    hit('drum', d.x, d.y, r, i);
  });
}
function drawGong(t, dt) {
  if (ready(PHOTO.gong)) {
    var g0 = G.gong, ih = THd * .21, iw = ih * 16 / 9; g0.R = ih * .267; g0.y = G.gy + 4 - ih * .444;
    gongS.sv += (-gongS.swing * 3 - gongS.sv * .6) * dt; gongS.swing += gongS.sv * dt * 8; gongS.amp = Math.max(0, gongS.amp - dt * .18);
    tg.save(); tg.globalCompositeOperation = 'screen'; tg.translate(g0.x + Math.sin(t * 70) * gongS.amp, g0.y - g0.R); tg.rotate(gongS.swing * .05); tg.drawImage(PHOTO.gong, -iw / 2, -(ih * .511 - g0.R), iw, ih); tg.restore();
    gongS.ripples = gongS.ripples.filter(function (r) { r.r += dt * 180; r.a -= dt * .5; return r.a > 0; });
    tg.globalCompositeOperation = 'lighter'; gongS.ripples.forEach(function (r) { if (r.r <= 0) return; tg.strokeStyle = 'rgba(255,210,120,' + r.a * .5 + ')'; tg.lineWidth = 1.5; tg.beginPath(); tg.arc(g0.x, g0.y, g0.R + r.r, 0, 6.2832); tg.stroke(); }); tg.globalCompositeOperation = 'source-over';
    return;
  }
  var g = G.gong, bar = g.y - g.R - 26 * G.s, fy = G.gy + 4, fx0 = g.x - g.R - 16 * G.s, fx1 = g.x + g.R + 16 * G.s;
  tg.fillStyle = '#2a160b'; tg.fillRect(fx0 - 4, bar, 8, fy - bar); tg.fillRect(fx1 - 4, bar, 8, fy - bar);
  tg.fillStyle = '#3a1f0f'; tg.beginPath(); tg.moveTo(fx0 - 14, bar - 4); tg.quadraticCurveTo(fx0 - 16, bar - 12, fx0 - 20, bar - 13); tg.lineTo(fx0 - 8, bar + 4); tg.lineTo(fx1 + 8, bar + 4); tg.lineTo(fx1 + 20, bar - 13); tg.quadraticCurveTo(fx1 + 16, bar - 12, fx1 + 14, bar - 4); tg.closePath(); tg.fill();
  gongS.sv += (-gongS.swing * 3 - gongS.sv * .6) * dt; gongS.swing += gongS.sv * dt * 8; gongS.amp = Math.max(0, gongS.amp - dt * .18);
  tg.save(); tg.translate(g.x, bar + 4); tg.rotate(gongS.swing * .2);
  var gy = g.y - bar - 4; tg.strokeStyle = '#8a6a40'; tg.lineWidth = 1.2;
  tg.beginPath(); tg.moveTo(-g.R * .4, 0); tg.lineTo(-g.R * .3, gy - g.R * .9); tg.moveTo(g.R * .4, 0); tg.lineTo(g.R * .3, gy - g.R * .9); tg.stroke();
  tg.translate(Math.sin(t * 70) * gongS.amp, gy);
  var gd = tg.createRadialGradient(-g.R * .3, -g.R * .35, g.R * .05, 0, 0, g.R);
  gd.addColorStop(0, '#f6d27a'); gd.addColorStop(.35, '#c98a2e'); gd.addColorStop(.75, '#8a5718'); gd.addColorStop(1, '#4e2f0c');
  tg.fillStyle = gd; tg.beginPath(); tg.arc(0, 0, g.R, 0, 6.2832); tg.fill(); tg.strokeStyle = '#3a2208'; tg.lineWidth = 2; tg.stroke();
  for (var i = 1; i < 5; i++) { tg.strokeStyle = 'rgba(' + (i % 2 ? '255,220,150' : '60,35,10') + ',.25)'; tg.lineWidth = .8; tg.beginPath(); tg.arc(0, 0, g.R * (.2 + i * .17), 0, 6.2832); tg.stroke(); }
  tg.fillStyle = 'rgba(70,40,8,.75)'; tg.font = (g.R * .5 | 0) + 'px serif'; tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.fillText('道', 0, 1);
  tg.restore();
  gongS.ripples = gongS.ripples.filter(function (r) { r.r += dt * 180; r.a -= dt * .5; return r.a > 0; });
  tg.globalCompositeOperation = 'lighter';
  gongS.ripples.forEach(function (r) { if (r.r <= 0) return; tg.strokeStyle = 'rgba(255,210,120,' + r.a * .5 + ')'; tg.lineWidth = 1.5; tg.beginPath(); tg.arc(g.x, g.y, g.R + r.r, 0, 6.2832); tg.stroke(); });
  tg.globalCompositeOperation = 'source-over';
}
function drawBeatStone(t) {
  var B = G.beat, r = B.r * G.s, glow = .35 + .35 * Math.pow(1 - beatPhase(), 4) + (WS.hover === 'beat' ? .3 : 0);
  var sg = tg.createRadialGradient(B.x - r * .3, B.y - r * .3, 1, B.x, B.y, r); sg.addColorStop(0, '#5a5448'); sg.addColorStop(1, '#23201a');
  tg.fillStyle = sg; tg.beginPath(); tg.ellipse(B.x, B.y, r, r * .55, 0, 0, 6.2832); tg.fill();
  tg.globalCompositeOperation = 'lighter'; tg.strokeStyle = 'rgba(184,107,255,' + glow + ')'; tg.lineWidth = 1.6;
  tg.beginPath(); for (var i = 0; i <= 40; i++) { var a = i / 40 * 9, rr = r * .12 + i / 40 * r * .7; var x = B.x + Math.cos(a) * rr, y = B.y + Math.sin(a) * rr * .55; i ? tg.lineTo(x, y) : tg.moveTo(x, y); } tg.stroke();
  tg.globalCompositeOperation = 'source-over';
  hit('beat', B.x, B.y, r * 1.1);
}
function drawMallet() {
  var h = malletHead(), g = G.gong, L = MLEN * G.s * .7;
  if (mallet.rest) { tg.fillStyle = 'rgba(0,0,0,.35)'; tg.beginPath(); tg.ellipse(mallet.x, mallet.y + 7, L * .5, 3, mallet.ang, 0, 6.2832); tg.fill(); }
  tg.save(); tg.translate(mallet.x, mallet.y); tg.rotate(mallet.ang);
  tg.fillStyle = '#9a6a3a'; tg.fillRect(-L * .5, -2.5, L * .85, 5);
  var bh = tg.createRadialGradient(L * .5 - 3, -3, 1, L * .5, 0, 11); bh.addColorStop(0, '#ff8a70'); bh.addColorStop(.6, '#b3261e'); bh.addColorStop(1, '#5a0f0a');
  tg.fillStyle = bh; tg.beginPath(); tg.ellipse(L * .5, 0, 10, 9, 0, 0, 6.2832); tg.fill(); tg.restore();
  if (mallet.rest && !SHOW.on) { tg.strokeStyle = 'rgba(232,185,74,' + (.25 + .25 * Math.sin(tClock * 3)) + ')'; tg.lineWidth = 1; tg.beginPath(); tg.ellipse(mallet.x, mallet.y, L * .62, 16, mallet.ang, 0, 6.2832); tg.stroke(); }
}
var MLEN = 150;
function malletHead() { var L = MLEN * G.s * .7; return [mallet.x + Math.cos(mallet.ang) * L * .5, mallet.y + Math.sin(mallet.ang) * L * .5]; }
function malletHit(px, py) {
  var L = MLEN * G.s * .7, hx = mallet.x + Math.cos(mallet.ang) * L * .5, hy = mallet.y + Math.sin(mallet.ang) * L * .5, ex = mallet.x - Math.cos(mallet.ang) * L * .5, ey = mallet.y - Math.sin(mallet.ang) * L * .5;
  var dx = hx - ex, dy = hy - ey, u = clamp(((px - ex) * dx + (py - ey) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(px - (ex + dx * u), py - (ey + dy * u)) < 16 || Math.hypot(px - hx, py - hy) < 18;
}

/* ---------- Rauch wird zu Energie, Wetter ---------- */
function drawSmoke(t) {
  tg.globalCompositeOperation = 'lighter';
  smoke = smoke.filter(function (p) {
    p.x += p.vx + (p.curl != null ? Math.sin(t * 1.2 + p.y * .04 + p.curl) * .35 : Math.sin(t + p.y * .02) * .2); p.y += p.vy; p.life -= p.thin ? .004 : .006;
    if (p.life <= 0) return false;
    var rise = clamp((G.gy - p.y) / (THd * .5), 0, 1), e = p.energy ? 1 : smooth((rise - .35) / .4);
    if (p.spark && rise < .3) { tg.fillStyle = 'rgba(255,170,60,' + p.life + ')'; tg.beginPath(); tg.arc(p.x, p.y, 1.1, 0, 6.2832); tg.fill(); return true; }
    var hue = lerp(p.hue || 270, 44, goldAmt);
    tg.fillStyle = e < .5 ? 'rgba(150,140,140,' + p.life * .09 * (1 - e) + ')' : 'hsla(' + (hue + rise * 60) + ',100%,68%,' + p.life * .5 * e + ')';
    tg.beginPath(); tg.arc(p.x, p.y, e < .5 ? (p.thin ? 3 : 7) + (1 - p.life) * 10 : 1.4, 0, 6.2832); tg.fill();
    return true;
  });
  tg.globalCompositeOperation = 'source-over';
  if (smoke.length > 500) smoke.splice(0, smoke.length - 500);
}
function drawWeather(t, show) {
  var winter = seasonAmt(4), raining = t - WS.rainT < 7;
  if (winter > .3 && Math.random() < winter * .6) weather.push({ k: 'snow', x: Math.random() * TWd, y: -5, vx: (Math.random() - .5) * .4, vy: .6 + Math.random() * .8, life: 1 });
  if (raining) for (var i = 0; i < 6; i++) weather.push({ k: 'rain', x: Math.random() * TWd, y: -10, vx: -1, vy: 9 + Math.random() * 4, life: 1 });
  weather = weather.filter(function (p) {
    p.x += p.vx + (p.k === 'petal' || p.k === 'leaf' ? Math.sin(t * 2 + p.ph) * .6 : 0); p.y += p.vy;
    if (p.y > G.gy + 30 || p.x > TWd + 20) return false;
    if (p.k === 'snow') { tg.fillStyle = 'rgba(245,248,255,.85)'; tg.beginPath(); tg.arc(p.x, p.y, 1.6, 0, 6.2832); tg.fill(); }
    else if (p.k === 'rain') { tg.strokeStyle = 'rgba(160,200,230,.45)'; tg.lineWidth = 1; tg.beginPath(); tg.moveTo(p.x, p.y); tg.lineTo(p.x - 2, p.y + 9); tg.stroke(); }
    else { tg.fillStyle = p.k === 'petal' ? 'hsla(' + p.hue + ',80%,80%,.9)' : 'hsla(28,70%,38%,.85)'; tg.beginPath(); tg.ellipse(p.x, p.y, 2.6, 1.5, t * 2 + p.ph, 0, 6.2832); tg.fill(); }
    return true;
  });
  if (weather.length > 700) weather.splice(0, weather.length - 700);
  // Wolken entstehen aus dem Schmelzwasser und lösen sich wieder auf
  var cl = seasonAmt(0) * .8 + (raining ? 1 : 0);
  if (cl > .05) {
    for (var c = 0; c < 4; c++) {
      var cx = TWd * (.62 + c * .09) + Math.sin(t * .05 + c) * 30, cy = THd * (.1 + (c % 2) * .06), a = cl * (.18 + .1 * Math.sin(t * .2 + c));
      var cg = tg.createRadialGradient(cx, cy, 2, cx, cy, 70 * G.s); cg.addColorStop(0, 'rgba(200,210,230,' + a + ')'); cg.addColorStop(1, 'rgba(200,210,230,0)');
      tg.fillStyle = cg; tg.fillRect(cx - 80 * G.s, cy - 40 * G.s, 160 * G.s, 80 * G.s);
    }
  }
}

/* ---------- Die 33 Krafttiere versammeln sich ---------- */
var gathered = [], gatherNext = 0, spots = { fly: [], ground: [], water: [], climb: [] };
function gatherSpots() {
  var P = G.pyr, T = G.temple, g = G.gong, F = G.fire, pd = G.pond, s = G.s;
  spots.fly = [[P.x, G.gy - P.h * 1.12], [T.x, T.y - 100 * s], [T.x - 50 * s, T.y - 20 * s], [T.x + 52 * s, T.y - 18 * s], [g.x, g.y - g.R - 36 * s], [TWd * .74, G.gy - 70 * s], [TWd * .86, G.gy - 62 * s], [P.x - P.w * .3, G.gy - P.h * .55], [TWd * .9, THd * .3], [TWd * .64, THd * .2]];
  spots.ground = [[F.x - 55 * s, F.y + 22], [F.x + 55 * s, F.y + 22], [F.x - 30 * s, F.y + 42], [F.x + 30 * s, F.y + 44], [g.x - 60 * s, G.gy + 34], [g.x + 58 * s, G.gy + 40], [TWd * .48, G.gy + 56], [TWd * .3, G.gy + 58], [TWd * .41, G.gy + 70], [TWd * .56, G.gy + 72], [TWd * .67, G.gy + 60], [TWd * .25, G.gy + 40], [TWd * .6, G.gy + 88], [TWd * .44, G.gy + 92], [TWd * .34, G.gy + 88], [TWd * .52, G.gy + 100], [TWd * .7, G.gy + 90]];
  spots.water = [[pd.x - pd.rx * .5, pd.y], [pd.x + pd.rx * .45, pd.y + 2], [pd.x, pd.y + 8], [pd.x - pd.rx * .9, pd.y + 6], [pd.x + pd.rx * .95, pd.y - 2], [pd.x + pd.rx * .1, pd.y - 5], [pd.x - pd.rx * .2, pd.y + 14]];
  spots.climb = [[P.x - P.w * .22, G.gy - P.h * .35], [P.x + P.w * .25, G.gy - P.h * .3], [P.x + P.w * .1, G.gy - P.h * .75], [TWd * .76, G.gy - THd * .2], [TWd * .83, G.gy - THd * .26], [P.x - P.w * .05, G.gy - P.h * .15]];
}
var SIZE = { 'Elefant': 1.5, 'Bison': 1.35, 'Bär': 1.3, 'Gorilla': 1.2, 'Stier': 1.1, 'Tiger': 1.15, 'Löwe': 1.15, 'Hirsch': 1.2, 'Biene': .45, 'Libelle': .55, 'Kolibri': .5, 'Frosch': .5, 'Krabbe': .5, 'Hase': .6, 'Fledermaus': .6, 'Katze': .7, 'Pinguin': .7 };
function gatherTick(t, atBottom) {
  if (!atBottom || gathered.length >= ANIMALS.length || SHOW.on) return;
  if (t < gatherNext) return;
  gatherNext = t + (dreamAmt > .5 ? 3 : 6);
  var used = {}; gathered.forEach(function (g) { used[g.A.n] = 1; });
  var free = ANIMALS.filter(function (a) { return !used[a.n]; }); if (!free.length) return;
  var A = free[Math.random() * free.length | 0]; prepAnimal(A);
  var kind = VR_ANIMALS.filter(function (x) { return x.n === A.n; })[0].h, list = spots[kind];
  var taken = gathered.filter(function (g) { return g.kind === kind; }).length, sp = list[taken % list.length];
  var from = Math.random() < .5 ? -80 : TWd + 80, sz = 46 * G.s * (SIZE[A.n] || 1) * (kind === 'fly' ? .8 : 1);
  gathered.push({ A: A, kind: kind, x: from, y: kind === 'fly' ? THd * .15 : G.gy + 40, tx: sp[0] + (Math.random() - .5) * 10 * (taken >= list.length ? 3 : 0), ty: sp[1] - sz * .35, sz: sz, t0: t, ph: Math.random() * 6, flip: from < 0 ? 1 : -1 });
}
function drawGathered(t) {
  gathered.forEach(function (g) {
    var age = t - g.t0, arr = smooth(age / 4.5);
    var x = lerp(g.x, g.tx, arr), y = lerp(g.y, g.ty, arr) - (g.kind === 'fly' ? Math.sin(arr * Math.PI) * 60 : Math.abs(Math.sin(age * 6)) * 4 * (1 - arr));
    var breathe = 1 + Math.sin(t * 1.5 + g.ph) * .02, k = g.sz / 512 * breathe, color = smooth((age - 2.5) / 2);
    if (arr >= 1) g.flip = g.tx < TWd / 2 ? 1 : -1;
    tg.save(); tg.translate(x, y); tg.scale(k * g.flip, k); tg.translate(-256, -256);
    if (color < 1) { tg.globalCompositeOperation = 'lighter'; tg.lineWidth = 3 / k * .5; tg.strokeStyle = 'hsla(' + mandHue + ',100%,75%,' + (1 - color) * .9 + ')'; tg.stroke(g.A.p); tg.globalCompositeOperation = 'source-over'; }
    // Foto-Zyklus auch hier: wird zum Foto, löst sich ab und zu wieder in Energielinien auf
    var cyc = ((t + g.ph * 11) % 50) / 50, photoA = color * (cyc < .8 ? 1 : cyc < .88 ? 1 - smooth((cyc - .8) / .08) : smooth((cyc - .88) / .12));
    if (g.A.photo && g.A.photo.complete && g.A.photo.naturalWidth) {
      if (photoA < .98) { tg.globalCompositeOperation = 'lighter'; tg.lineWidth = 3 / k * .5; tg.strokeStyle = 'hsla(' + mandHue + ',100%,75%,' + (1 - photoA) * .8 + ')'; tg.stroke(g.A.p); }
      tg.globalCompositeOperation = 'screen'; tg.globalAlpha = photoA; tg.drawImage(g.A.photo, -140, -140, 792, 792); tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-over';
    } else if (color > 0) { tg.globalAlpha = color; tg.drawImage(g.A.spr, 0, 0, 512, 512); tg.globalAlpha = 1; }
    var pulse = Math.pow(Math.max(0, Math.sin(t * .7 + g.ph)), 20);
    if (pulse > .02) { tg.globalCompositeOperation = 'lighter'; tg.globalAlpha = pulse * .5; tg.drawImage(g.A.glow, 0, 0, 512, 512); tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-over'; }
    tg.restore();
  });
}

/* ---------- Gargoyle: klettert über die Uhr, wenn man unten ist ---------- */
var GARG = { n: 'Gargoyle', d: VR_GARGOYLE, c: ['#1e1e24', '#55555e', '#9a9aa4'], p: new Path2D(VR_GARGOYLE) };
var DRAGON = { n: 'Drache', d: VR_WYVERN, c: ['#1a0a2a', '#5a2a8a', '#c9a0ff'], p: new Path2D(VR_WYVERN) };
var gargP = 0;
function drawGargoyle(t) {
  if (!GARG.spr) prepAnimal(GARG);
  var target = SHOW.on ? gargP : smooth((svS - (svMax - .9)) / .8);
  gargP += (target - gargP) * .03;
  if (gargP < .01 || SHOW.on) return;
  var r = 100 * DR.s, cx = DR.x + r, cy = DR.y + r, sz = r * 1.1;
  var a = lerp(Math.PI * .85, Math.PI * 1.5, smooth(gargP / .85)), rr = r * 1.02 + sz * .3;
  var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr - (gargP > .85 ? smooth((gargP - .85) / .15) * sz * .05 : 0);
  var climbWob = gargP < .9 ? Math.sin(t * 8) * .08 : 0, rot = gargP < .9 ? a + Math.PI / 2 + climbWob : 0;
  var k = sz / 512;
  go.save(); go.translate(x, y); go.rotate(gargP >= .9 ? Math.sin(t * .5) * .03 : rot * (1 - smooth((gargP - .8) / .1)));
  go.scale(k, k); go.translate(-256, -330);
  go.drawImage(GARG.spr, 0, 0, 512, 512);
  var eye = .4 + .4 * Math.sin(t * 2);
  go.globalCompositeOperation = 'lighter'; go.fillStyle = 'rgba(255,60,40,' + eye + ')';
  go.beginPath(); go.arc(232, 150, 7, 0, 6.2832); go.arc(280, 150, 7, 0, 6.2832); go.fill(); go.globalCompositeOperation = 'source-over';
  go.restore();
  GARG.pos = [x, y - sz * .15]; GARG.sz = sz;
}

/* ---------- Gong-Show ---------- */
var SHOW = { on: false, t0: 0, stars: [], parts: [], earth: null, earthPx: null, logo: null, done: {} };
function loadShowAssets() {
  if (SHOW.logo) return;
  SHOW.logo = new Image(); SHOW.logo.crossOrigin = 'anonymous';
  SHOW.logo.src = 'https://youareneo.com/cdn/shop/files/icon_256x256_d6d224f7-9410-4b53-9c80-cf1ca806d537.png?v=1769090427&width=512';
  if (PIXEL) { if (!DRAGON.spr) prepAnimal(DRAGON); return; }
  var img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = function () { var c = mk(512, 256), g = c.getContext('2d'); g.drawImage(img, 0, 0, 512, 256); try { SHOW.earthPx = g.getImageData(0, 0, 512, 256).data; } catch (e) {} };
  img.src = 'https://cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-blue-marble.jpg';
  if (!DRAGON.spr) prepAnimal(DRAGON);
}
function startShow() {
  if (SHOW.on) return;
  loadShowAssets(); prepAnimal(DRAGON);
  SHOW.words = !store('vr_words_seen') || Math.random() < .25;   // die Worte kommen nur selten
  if (SHOW.words) store('vr_words_seen', '1');
  SHOW.on = true; SHOW.t0 = performance.now() / 1000; SHOW.parts = []; SHOW.done = {};
  SHOW.from = GARG.pos ? GARG.pos.slice() : [W * .7, H * .7];
  SHOW.stars = []; for (var i = 0; i < 340; i++) SHOW.stars.push({ x: Math.random() * W, y: Math.random() * H * .7, s: Math.random() * 1.6 + .3, f: 0, a: Math.random() * 6.28 });
  root.classList.add('vr-show'); WS.seasonSpeed = 1 / 7;
  showDrone();
}
function showDrone() {
  var c = ctx(), t = c.currentTime, out = c.createGain(); out.connect(master);
  out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(.08, t + 4); out.gain.setValueAtTime(.08, t + 38); out.gain.linearRampToValueAtTime(0, t + 46);
  [55, 82.4, 110, 164.8].forEach(function (f, i) { var o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f * (1 + (i - 1.5) * .002); o.connect(out); o.start(t); o.stop(t + 47); });
}
function whoosh(t, dur, f0, f1, vol) {
  var c = ctx(), s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); if (!NOISE) NOISE = noiseBuf(2);
  s.buffer = NOISE; s.loop = true; fl.type = 'bandpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .2); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .1);
}
function once(key, fn) { if (!SHOW.done[key]) { SHOW.done[key] = 1; fn(); } }
function earthSprite(R, rot) {
  var n = Math.max(40, Math.min(220, R | 0)), c = SHOW.eC || (SHOW.eC = mk(440, 440)), g = c.getContext('2d'), size = n * 2;
  if (!SHOW.earthPx) return null;
  var img = g.createImageData(size, size), d = img.data, px = SHOW.earthPx;
  for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
    var nx = (x - n) / n, ny = (y - n) / n, r2 = nx * nx + ny * ny; if (r2 > 1) continue;
    var nz = Math.sqrt(1 - r2), lat = Math.asin(-ny), lon = Math.atan2(nx, nz) + rot;
    var u = ((lon / 6.2832 + .5) % 1 + 1) % 1, v = .5 - lat / Math.PI, si = ((v * 255 | 0) * 512 + (u * 511 | 0)) * 4, i = (y * size + x) * 4;
    var light = clamp(.25 + .9 * (nx * -.4 + ny * -.3 + nz * .85), .15, 1.15);
    d[i] = px[si] * light; d[i + 1] = px[si + 1] * light; d[i + 2] = px[si + 2] * light; d[i + 3] = r2 > .97 ? (1 - r2) / .03 * 255 : 255;
  }
  c.width = size; c.height = size; g.putImageData(img, 0, 0); return c;
}
function drawShow(t, dt) {
  if (!SHOW.on) return;
  var T = performance.now() / 1000 - SHOW.t0, c = go, cx = W * .5, cy = H * .36, skyA = smooth(T / 1.5) * (1 - smooth((T - 45) / 2));
  if (T > 47.5) { SHOW.on = false; root.classList.remove('vr-show'); WS.seasonSpeed = 1 / 480; gargP = 0; return; }
  // Nachthimmel über der Welt
  var sk = c.createLinearGradient(0, 0, 0, H * .78); sk.addColorStop(0, 'rgba(1,2,8,' + .96 * skyA + ')'); sk.addColorStop(.8, 'rgba(1,2,8,' + .8 * skyA + ')'); sk.addColorStop(1, 'rgba(1,2,8,0)');
  c.fillStyle = sk; c.fillRect(0, 0, W, H * .78);
  var warp = smooth((T - 12) / 1.5) * (1 - smooth((T - 17) / 1.5));
  c.globalCompositeOperation = 'lighter';
  SHOW.stars.forEach(function (s) {
    s.f = Math.max(0, s.f - dt * 1.5);
    var a = (.4 + .4 * Math.sin(t * 2 + s.a)) * skyA + s.f;
    if (warp > .01) {   // Lichtgeschwindigkeit
      var dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy) || 1, len = warp * d * .5;
      s.x += dx / d * warp * 14; s.y += dy / d * warp * 14;
      if (s.x < 0 || s.x > W || s.y < 0 || s.y > H * .75) { s.x = cx + (Math.random() - .5) * 40; s.y = cy + (Math.random() - .5) * 40; }
      c.strokeStyle = 'rgba(200,220,255,' + Math.min(1, a + warp * .5) + ')'; c.lineWidth = s.s; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - dx / d * len, s.y - dy / d * len); c.stroke();
    } else { c.fillStyle = 'rgba(220,230,255,' + Math.min(1, a) + ')'; c.beginPath(); c.arc(s.x, s.y, s.s + s.f * 2, 0, 6.2832); c.fill(); }
  });
  c.globalCompositeOperation = 'source-over';
  // 1–2: Gargoyle fliegt los und wird zum Drachen
  if (T < 9) {
    var p = smooth(T / 5), fx = lerp(SHOW.from[0], cx + Math.sin(T * .9) * W * .18, p), fy = lerp(SHOW.from[1], cy + Math.cos(T * 1.1) * H * .08, p);
    var sc = lerp(GARG.sz || 80, Math.min(W, H) * .42, smooth(T / 6)) / 512, flap = 1 + Math.sin(T * 11) * .12 * smooth(T / 1);
    var morph = smooth((T - 2.8) / 2.4), lines = smooth((T - 5.8) / 1.8), fade = 1 - smooth((T - 7.8) / 1);
    c.save(); c.translate(fx, fy); c.scale(sc, sc * flap); c.translate(-256, -256);
    if (morph < 1) { c.globalAlpha = (1 - morph) * (1 - lines); c.drawImage(GARG.spr, 0, 0, 512, 512); }
    if (morph > 0) { c.globalAlpha = morph * (1 - lines); c.drawImage(DRAGON.spr, 0, 0, 512, 512); }
    c.globalAlpha = 1;
    if (lines > 0) {   // wird zu Licht-Energielinien
      c.globalCompositeOperation = 'lighter'; c.lineWidth = 3 / sc; c.strokeStyle = 'hsla(' + (270 - lines * 80) + ',100%,72%,' + fade + ')'; c.stroke(DRAGON.p);
      c.lineWidth = 12 / sc; c.strokeStyle = 'hsla(280,100%,60%,' + .15 * fade + ')'; c.stroke(DRAGON.p); c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    if (T > 8.4) once('burst', function () {   // Linien zerfallen zu Lichtern …
      if (!DRAGON.pts) prepAnimal(DRAGON);
      (DRAGON.pts || []).forEach(function (q, i) {
        var s = SHOW.stars[(i * 7) % SHOW.stars.length];
        SHOW.parts.push({ x: fx + (q[0] - 256) * sc, y: fy + (q[1] - 256) * sc, tx: s.x, ty: s.y, star: s, d: .2 + i * .045, trail: [] });
      });
    });
  }
  // 3: … die zu den Sternen schießen – tschtschtsch
  if (T > 8.4 && T < 13) {
    once('ch', function () { var a = ctx().currentTime; for (var i = 0; i < 14; i++) whoosh(a + i * .16, .35, 800, 7000, .06); });
    c.globalCompositeOperation = 'lighter';
    SHOW.parts.forEach(function (p, i) {
      var u = smooth((T - 8.4 - p.d) / .6); if (u <= 0) return;
      var x = lerp(p.x, p.tx, u), y = lerp(p.y, p.ty, u); p.trail.push(x, y); if (p.trail.length > 20) p.trail.splice(0, 2);
      if (u >= 1 && !p.hit) { p.hit = 1; p.star.f = 1.2; }
      c.strokeStyle = 'rgba(210,170,255,.7)'; c.lineWidth = 1.6; c.beginPath(); for (var j = 0; j < p.trail.length; j += 2) j ? c.lineTo(p.trail[j], p.trail[j + 1]) : c.moveTo(p.trail[j], p.trail[j + 1]); c.stroke();
    });
    c.globalCompositeOperation = 'source-over';
    once('warpSound', function () { whoosh(ctx().currentTime + 3.4, 5, 200, 4000, .12); });
  }
  // 4: Flug durchs Universum – Nebel
  if (T > 11 && T < 20) {
    var nb = smooth((T - 11) / 2) * (1 - smooth((T - 18) / 2));
    [[.3, .3, 280], [.7, .45, 190], [.5, .2, 320]].forEach(function (n, i) {
      var nx = W * n[0] + Math.sin(T * .3 + i) * 60, ny = H * n[1], ng = c.createRadialGradient(nx, ny, 2, nx, ny, W * .3);
      ng.addColorStop(0, 'hsla(' + n[2] + ',90%,55%,' + .16 * nb + ')'); ng.addColorStop(1, 'hsla(' + n[2] + ',90%,40%,0)');
      c.fillStyle = ng; c.fillRect(0, 0, W, H * .78);
    });
    c.fillStyle = 'rgba(255,255,255,' + nb + ')'; c.beginPath(); c.arc(cx, cy, 2 + nb * 3, 0, 6.2832); c.fill();
  }
  // 5: Ankunft an der Erde, alles dreht sich und wächst
  var R = Math.min(W, H) * .17;
  if (T > 17 && T < 29.5) {
    var eg = smooth((T - 17) / 3), er = R * (.05 + .95 * eg) * (1 + smooth((T - 24) / 4) * .35), blur = smooth((T - 25.5) / 2.5);   // langsamer Zoom in die Erde
    var es = earthSprite(Math.min(er, 200), T * .35);
    c.save(); c.globalAlpha = 1 - smooth((T - 27) / 2);
    if (blur > 0) c.filter = 'blur(' + (blur * 10).toFixed(1) + 'px)';
    if (es) c.drawImage(es, cx - er, cy - er, er * 2, er * 2);
    else { var fb = c.createRadialGradient(cx - er * .3, cy - er * .3, 2, cx, cy, er); fb.addColorStop(0, '#6ab0ff'); fb.addColorStop(.6, '#1a5aa8'); fb.addColorStop(1, '#0a2a5a'); c.fillStyle = fb; c.beginPath(); c.arc(cx, cy, er, 0, 6.2832); c.fill(); }
    c.filter = 'none'; c.restore();
    var gr = smooth((T - 20) / 4) * (1 - blur);   // wachsende Lichtlinien auf der Erde
    if (gr > 0) {
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(120,255,160,' + .5 * gr + ')'; c.lineWidth = 1.2;
      for (var k = 0; k < 7; k++) { c.beginPath(); for (var j = 0; j <= 24 * gr; j++) { var a = k * .9 + j * .12 + T * .35, rr = er * (.3 + j / 24 * .65); c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a * 1.3) * rr * .8); } c.stroke(); }
      c.globalCompositeOperation = 'source-over';
    }
  }
  // Lichtblitz: die Erde wird zu reinem Licht, daraus tritt das Logo
  if (T > 26 && T < 29.5) {
    var fl = Math.sin(clamp((T - 26) / 3.5, 0, 1) * Math.PI), fg = c.createRadialGradient(cx, cy, 0, cx, cy, R * (1.2 + fl * 2.5));
    fg.addColorStop(0, 'rgba(255,255,245,' + fl * .95 + ')'); fg.addColorStop(.4, 'rgba(200,240,255,' + fl * .45 + ')'); fg.addColorStop(1, 'rgba(120,180,255,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = fg; c.fillRect(0, 0, W, H);
    for (var ray = 0; ray < 18; ray++) { var ra = ray / 18 * 6.2832 + T * .2; c.strokeStyle = 'rgba(255,250,230,' + fl * .25 + ')'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ra) * R * 4 * fl, cy + Math.sin(ra) * R * 4 * fl); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
  }
  // 6: verschwimmt zum NEO-Logo, Pflanzen wachsen, löst sich in Licht auf
  if (T > 26 && T < 35) {
    var lg = smooth((T - 27.2) / 2.4), dis = smooth((T - 32.5) / 2), lr = R * (1 + dis * .4);
    if (SHOW.logo && SHOW.logo.complete && SHOW.logo.naturalWidth) {
      var lz = lr * (1 + (1 - lg) * .35);
      c.save(); c.globalAlpha = lg * (1 - dis); c.translate(cx, cy); c.rotate((1 - lg) * -.5); if (lg < .95) c.filter = 'blur(' + ((1 - lg) * 8).toFixed(1) + 'px)'; c.drawImage(SHOW.logo, -lz, -lz, lz * 2, lz * 2); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lg * (1 - dis) * .35; c.filter = 'blur(18px)'; c.drawImage(SHOW.logo, -lz * 1.15 + cx, -lz * 1.15 + cy, lz * 2.3, lz * 2.3); c.restore();
    }
    var pg = smooth((T - 28.5) / 3) * (1 - dis);
    if (pg > 0) {
      c.lineCap = 'round';
      for (var v = 0; v < 4; v++) {
        c.strokeStyle = 'rgba(40,70,30,' + (1 - dis) + ')'; c.lineWidth = 2.5; c.beginPath();
        for (var s2 = 0; s2 <= 30 * pg; s2++) { var aa = v * 1.57 + s2 * .09, rr2 = lr * (1.03 + Math.sin(s2 * .7 + v) * .04); c.lineTo(cx + Math.cos(aa) * rr2, cy + Math.sin(aa) * rr2); } c.stroke();
        for (s2 = 4; s2 <= 30 * pg; s2 += 5) { var ab = v * 1.57 + s2 * .09; c.save(); c.translate(cx + Math.cos(ab) * lr * 1.05, cy + Math.sin(ab) * lr * 1.05); c.rotate(ab + 1); c.globalAlpha = 1 - dis; c.scale(.35, .35); c.drawImage(LEAVES[s2 % 3], 0, -20); c.restore(); }
      }
    }
    if (T > 32.5) once('light', function () { for (var i = 0; i < 220; i++) { var a = Math.random() * 6.2832, r = R * Math.random(); tGlit.length; SHOW.parts.push({ lx: cx + Math.cos(a) * r, ly: cy + Math.sin(a) * r, vx: Math.cos(a) * (1 + Math.random() * 3), vy: Math.sin(a) * (1 + Math.random() * 3) - 1.5, life: 1, light: 1 }); } });
  }
  c.globalCompositeOperation = 'lighter';
  SHOW.parts.forEach(function (p) {
    if (!p.light) return; p.lx += p.vx; p.ly += p.vy; p.vy -= .02; p.life -= .008; if (p.life <= 0) return;
    c.fillStyle = 'hsla(' + (100 + p.life * 100) + ',100%,75%,' + p.life + ')'; c.beginPath(); c.arc(p.lx, p.ly, 1.6, 0, 6.2832); c.fill();
  });
  c.globalCompositeOperation = 'source-over';
  // 7: Schrift rechts unten im freien Himmel – kollidiert mit nichts
  function words(lines, t0, t1) {
    var a = smooth((T - t0) / 1.2) * (1 - smooth((T - t1 + 1.2) / 1.2)); if (a <= 0) return;
    if (!SHOW.words) return;
    var fs = clamp(W * .038, 18, 44), x = W / 2, y = H * .3 - (lines.length - 1) * fs * .6;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = '900 ' + fs + 'px Orbitron, sans-serif';
    if (a < 1 && T > t1 - 1.2) c.filter = 'blur(' + ((1 - a) * 12).toFixed(1) + 'px)';
    lines.forEach(function (ln, i) {
      var gg = c.createLinearGradient(x - fs * ln.length * .7, 0, x, 0); gg.addColorStop(0, '#2FD3E8'); gg.addColorStop(.5, '#b86bff'); gg.addColorStop(1, '#e8b94a');
      c.globalAlpha = a; c.shadowColor = 'rgba(184,107,255,.8)'; c.shadowBlur = 18; c.fillStyle = gg;
      c.font = (i === 0 ? '900 ' : '600 ') + (i === 0 ? fs : fs * .72) + 'px Orbitron, sans-serif';
      c.fillText(ln, x, y + i * fs * 1.25);
    });
    c.restore();
  }
  words(['YOU ARE NEO'], 34, 38.6);
  words(['DU BIST AUSERWÄHLT.', 'GEMEINSAM BRINGEN WIR', 'DER WELT FRIEDEN.'], 38.8, 46);
}

/* ---------- Eingaben in der Bodenwelt ---------- */
function tPos(e) { var r = tc.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function hitAt(x, y) { for (var i = WS.hits.length - 1; i >= 0; i--) { var h = WS.hits[i]; if (Math.hypot(x - h.x, y - h.y) < h.r) return h; } return null; }
tc.addEventListener('pointerdown', function (e) {
  var p = tPos(e); ctx();
  if (!SHOW.on && malletHit(p[0], p[1])) { mallet.held = true; mallet.rest = false; mallet.gx = p[0] - mallet.x; mallet.gy = p[1] - mallet.y; tc.setPointerCapture(e.pointerId); tc.style.cursor = 'grabbing'; return; }
  var h = hitAt(p[0], p[1]); if (!h) return;
  if (h.k === 'fire') { WS.fire = !WS.fire; if (WS.fire) VOICES.crackle(ctx().currentTime, 0, 1, fxOut); }
  if (h.k === 'incense') WS.incense = !WS.incense;
  if (h.k === 'inst') { INSTR[h.d].on = !INSTR[h.d].on; ensureClock(); studioPaint(); }
  if (h.k === 'instplay') playInst(INSTR[h.d], ctx().currentTime + .01, Math.random() * 6 | 0, .9);
  if (h.k === 'drum') { var d = G.drums[h.d]; drumHits[h.d] = 1; playDrum({ voice: 'frame', f: [78, 110, 150][h.d], vol: .9 }, ctx().currentTime + .005, 1); beatImpulse(); }
  if (h.k === 'beat' && window.vrOpenStudio) window.vrOpenStudio();
  if (h.k === 'portal') { goldBurst(); window.open('https://youareneo.com/collections/musik', '_blank', 'noopener'); }
});
tc.addEventListener('touchstart', function (e) {   // am Klöppel und an Bedienelementen nicht scrollen
  var t = e.touches[0], r = tc.getBoundingClientRect(), x = t.clientX - r.left, y = t.clientY - r.top;
  if (malletHit(x, y) || hitAt(x, y)) e.preventDefault();
}, { passive: false });
tc.addEventListener('pointermove', function (e) {
  var p = tPos(e);
  if (!mallet.held) { var h = hitAt(p[0], p[1]); WS.hover = h ? h.k : null; tc.style.cursor = malletHit(p[0], p[1]) ? 'grab' : h ? 'pointer' : 'default'; return; }
  var nx = p[0] - mallet.gx, ny = p[1] - mallet.gy;
  mallet.vx = nx - mallet.x; mallet.vy = ny - mallet.y; mallet.x = nx; mallet.y = ny;
  mallet.ang += (-1.9 + clamp(mallet.vx * .02, -.5, .5) - mallet.ang) * .25;
});
function dropMallet() { mallet.held = false; tc.style.cursor = 'default'; }
tc.addEventListener('pointerup', dropMallet); tc.addEventListener('pointercancel', dropMallet);
function templeStrike(speed) {
  var v = clamp(speed / 25, .25, 1), c = ctx(), now = c.currentTime + .02;
  strike(now, .5 * v + .15, 110, 1.3); strike(now + .01, .14 * v, 220, .9);
  gongS.amp = Math.min(1.2, gongS.amp + v); gongS.sv += v * .08; gongS.ripples.push({ r: 0, a: 1 }, { r: -24, a: .8 });
  var g = G.gong;
  for (var i = 0; i < 160; i++) { var a = Math.random() * 6.2832, sp = 1.5 + Math.random() * 6 * v; tGlit.push({ x: g.x, y: g.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, s: .8 + Math.random() * 2, h: 38 + Math.random() * 18 }); }
  goldBurst(); beatImpulse();
  if (!SHOW.on) { WS.rainT = tClock + 20; startShow(); }
}

/* ---------- Schleife ---------- */
function drawGround(t) {
  var gy = G.gy, sky = tg.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, 'rgba(3,7,13,0)'); sky.addColorStop(.6, 'rgba(3,7,13,.25)'); sky.addColorStop(1, 'rgba(6,10,14,.7)');
  tg.fillStyle = sky; tg.fillRect(0, 0, TWd, gy);
  var gr = tg.createLinearGradient(0, gy, 0, THd); gr.addColorStop(0, '#1a2214'); gr.addColorStop(.4, '#11160c'); gr.addColorStop(1, '#070805');
  tg.fillStyle = gr; tg.fillRect(0, gy, TWd, THd - gy);
  var winter = seasonAmt(4); if (winter > .05) { tg.fillStyle = 'rgba(230,236,246,' + winter * .55 + ')'; tg.fillRect(0, gy, TWd, 10); }
  tg.strokeStyle = 'rgba(80,110,50,.5)'; tg.lineWidth = 1;
  for (var i = 0; i < 70; i++) { var x = (i * 97.3) % TWd, y = gy + 4 + (i * 37) % (THd - gy - 10); tg.beginPath(); tg.moveTo(x, y); tg.lineTo(x - 2, y - 6); tg.moveTo(x, y); tg.lineTo(x + 2, y - 7); tg.stroke(); }
}
var lastTemplePaint = 0;
function templeLoop(now) {
  requestAnimationFrame(templeLoop);
  if ((PIXEL || reduced) && now - lastTemplePaint < 32) return; lastTemplePaint = now;
  if (!tVisible || document.hidden || visualsPaused) { tLast = now; return; }
  var dt = Math.min(.05, (now - tLast) / 1000); tLast = now; tClock += dt;
  var t = tClock, show = SHOW.on ? performance.now() / 1000 - SHOW.t0 : 0;
  WS.season = (WS.season + dt * WS.seasonSpeed * 5) % 5;
  WS.hits = [];
  tg.setTransform(tDPR, 0, 0, tDPR, 0, 0); tg.clearRect(0, 0, TWd, THd);
  drawGround(t);
  drawMountains(t); drawTemple(t, show); drawCherries(t, show); drawPond(t);
  drawPyramid(t, show);
  drawLake(t);
  drawFire(t); for (var i = 0; i < INSTR.length; i++) drawInstrument(i, t);
  drawGong(t, dt); drawIncense(t); drawDrums(t); drawBeatStone(t);
  gatherTick(t, svS > svMax - .7); drawGathered(t);
  drawMallet();
  mallet.cool = Math.max(0, mallet.cool - dt);
  if (!mallet.held && !mallet.rest) {
    var rx = G.gong.x + G.gong.R * 2.1, ry = G.gy + 22;
    mallet.x += (rx - mallet.x) * .08; mallet.y += (ry - mallet.y) * .08; mallet.ang += (-.15 - mallet.ang) * .08;
    if (Math.hypot(rx - mallet.x, ry - mallet.y) < 1) mallet.rest = true;
  }
  if (mallet.held && mallet.cool <= 0) {
    var hh = malletHead(), sp = Math.hypot(mallet.vx, mallet.vy);
    if (Math.hypot(hh[0] - G.gong.x, hh[1] - G.gong.y) < G.gong.R * 1.05 && sp > 2) { templeStrike(sp); mallet.cool = .45; mallet.x -= mallet.vx * 1.5; mallet.y -= mallet.vy * 1.5; }
  }
  mallet.vx *= .8; mallet.vy *= .8;
  drawSmoke(t); drawWeather(t, show);
  tg.globalCompositeOperation = 'lighter';
  tGlit = tGlit.filter(function (p) { p.x += p.vx; p.y += p.vy; p.vx *= .97; p.vy = p.vy * .97 + .06; p.life -= .01; if (p.life <= 0) return false;
    var tw = .45 + .55 * Math.abs(Math.sin(t * 8 + p.x)); tg.fillStyle = 'hsla(' + p.h + ',100%,' + (60 + tw * 22) + '%,' + p.life * (.4 + tw * .5) + ')'; tg.beginPath(); tg.arc(p.x, p.y, p.s * tw, 0, 6.2832); tg.fill(); return true; });
  tg.globalCompositeOperation = 'source-over';
}
afterFrame.push(function (t, dt) { drawGargoyle(t); drawShow(t, dt); });
if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { tVisible = e[0].isIntersecting; if (tVisible) { tResize(); loadWorldPhotos(); } }).observe(tSec);
else { tVisible = true; loadWorldPhotos(); }
window.addEventListener('resize', tResize);
window.vrWorldPaint = function () {};
