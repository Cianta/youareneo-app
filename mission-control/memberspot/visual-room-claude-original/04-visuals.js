
/* =====================================================================
   GRAFIK
   ===================================================================== */
var ce = $('vr-energy'), cm = $('vr-mandala'), cf = $('vr-flora');
var ge = ce.getContext('2d'), gm = cm.getContext('2d'), gf = cf.getContext('2d');
var treeL = $('vr-treeL'), treeR = $('vr-treeR'), pwrap = $('vr-pwrap'), drumEl = $('vr-drum');
var TW = 100;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = bg.clientWidth; H = bg.clientHeight; TW = treeL.offsetWidth || 100;
  [ce, cm, cf, $('vr-over')].forEach(function (c) { c.width = W * DPR | 0; c.height = H * DPR | 0; });
  ge.setTransform(DPR, 0, 0, DPR, 0, 0); gm.setTransform(DPR, 0, 0, DPR, 0, 0); gf.setTransform(DPR, 0, 0, DPR, 0, 0);
  ge.fillStyle = '#03070D'; ge.fillRect(0, 0, W, H);
  pwrap.style.width = Math.max(280, Math.min(560, W - 2 * TW - 40)) + 'px';
}
function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* ---------- „Audio“: Atem-Puls oder Mikrofon ---------- */
var bands = { bass: 0, mid: 0, high: 0, level: 0 }, analyser = null, fbuf = null;
function sampleAudio(t) {
  var b, m, h;
  if (analyser) {
    analyser.getByteFrequencyData(fbuf);
    var n = fbuf.length, sb = 0, sm = 0, sh = 0;
    for (var i = 0; i < n; i++) { var v = fbuf[i] / 255; if (i < n * .08) sb += v; else if (i < n * .35) sm += v; else sh += v; }
    b = sb / (n * .08); m = sm / (n * .27); h = sh / (n * .65) * 1.6;
  } else {
    var beat = MIX.sync ? Math.pow(1 - beatPhase(), 4) : Math.pow(.5 + .5 * Math.sin(t * Math.PI * 2 * .75), 3), breath = .5 + .5 * Math.sin(t * Math.PI * 2 / 13);
    b = .25 + .45 * beat * (.6 + .4 * breath);
    m = .3 + .3 * breath + .1 * Math.sin(t * 1.7) * Math.sin(t * .37);
    h = .2 + .2 * Math.abs(Math.sin(t * 3.1 + Math.sin(t * .7)));
  }
  bands.bass += (b - bands.bass) * .12; bands.mid += (m - bands.mid) * .12; bands.high += (h - bands.high) * .12;
  bands.level = (bands.bass + bands.mid + bands.high) / 3;
}

/* ---------- Energien ---------- */
var goldAmt = 0;
var MIX = { vis: +(store('vr_vis') || .7), sync: store('vr_sync') === '1' };   // vis: 0 = sparsam … 1 = volle Pracht
function setVis(v) { MIX.vis = clamp(v, 0, 1); store('vr_vis', String(MIX.vis)); }
function setSync(on) { MIX.sync = !!on; store('vr_sync', on ? '1' : '0'); onTempo.forEach(function (f) { f(); }); }
var HUES = [187, 196, 28, 280, 320, 160, 45];
var orbs = HUES.map(function (hue, i) { return { hue: hue, ph: i * 1.7, sp: .05 + i * .013, r: .25 + (i % 3) * .08 }; });
var sparks = [];
for (var i = 0; i < 90; i++) sparks.push({ x: Math.random(), y: Math.random(), v: .0004 + Math.random() * .0012, s: Math.random() * 1.8 + .4, h: HUES[i % HUES.length] });
function drawEnergy(t) {
  ge.globalCompositeOperation = 'source-over';
  ge.fillStyle = 'rgba(3,7,13,0.24)'; ge.fillRect(0, 0, W, H);
  ge.globalCompositeOperation = 'lighter';
  var M = Math.max(W, H);
  orbs.forEach(function (o, i) {
    if (i >= Math.round(MIX.vis * 7)) return;
    var x = W * (.5 + .38 * Math.sin(t * o.sp * 2 + o.ph) * Math.cos(t * o.sp * .7));
    var y = H * (.5 + .36 * Math.cos(t * o.sp * 1.6 + o.ph * 1.3));
    var band = i % 3 === 0 ? bands.bass : i % 3 === 1 ? bands.mid : bands.high;
    var r = M * o.r * (.55 + band * .9);
    var hue = lerp((o.hue + Math.sin(t * .05 + i) * 18 + 360) % 360, 44, goldAmt);
    var g = ge.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'hsla(' + hue + ',90%,60%,' + (.03 + band * .055 + goldAmt * .05) + ')');
    g.addColorStop(.45, 'hsla(' + hue + ',85%,45%,' + (.01 + band * .018) + ')');
    g.addColorStop(1, 'hsla(' + hue + ',80%,30%,0)');
    ge.fillStyle = g; ge.beginPath(); ge.arc(x, y, r, 0, 6.2832); ge.fill();
  });
  sparks.forEach(function (p, si) {
    if (si > 20 + MIX.vis * 70) return;
    p.y -= p.v * (1 + bands.high * 4); if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
    ge.fillStyle = 'hsla(' + lerp(p.h, 46, goldAmt) + ',100%,75%,' + (.22 + bands.high * .35) + ')';
    ge.beginPath(); ge.arc((p.x + Math.sin(t * .3 + p.y * 8) * .01) * W, p.y * H, p.s * (1 + bands.high), 0, 6.2832); ge.fill();
  });
}
function drawAurora(t) {
  for (var k = 0; k < 1 + Math.round(MIX.vis * 3); k++) {
    gm.strokeStyle = 'hsla(' + [187, 28, 280, 160][k] + ',95%,65%,' + (.045 + bands.mid * .07) + ')';
    gm.lineWidth = 1 + bands.bass * 3;
    gm.beginPath();
    for (var x = 0; x <= W; x += 12) {
      var y = H * (.5 + (k - 1.5) * .12) + Math.sin(x * .004 + t * (.35 + k * .1) + k) * H * .12 * (.6 + bands.mid)
            + Math.sin(x * .011 - t * .8 + k * 2) * H * .03 * (1 + bands.high * 2);
      x ? gm.lineTo(x, y) : gm.moveTo(x, y);
    }
    gm.stroke();
  }
}


/* ---------- Himmel: echte Tageszeit & echte Mondphase ---------- */
function moonPhase(d) { var p = ((d - Date.UTC(2000, 0, 6, 18, 14)) / 86400000 / 29.530588853) % 1; return p < 0 ? p + 1 : p; }   // 0 Neumond · .5 Vollmond
function daylight() { var n = new Date(), h = n.getHours() + n.getMinutes() / 60; return smooth((h - 6) / 1.5) * (1 - smooth((h - 18.5) / 1.5)); }
var STARS = []; for (var si2 = 0; si2 < 260; si2++) STARS.push({ x: Math.random(), y: Math.random() * .8, s: Math.random() * 1.3 + .3, ph: Math.random() * 6.28 });
var SKY = { day: daylight(), moon: moonPhase(Date.now()), t: 0 };
function drawSky(t) {
  if (t - SKY.t > 30) { SKY.day = daylight(); SKY.moon = moonPhase(Date.now()); SKY.t = t; }
  var day = SKY.day, night = 1 - day;
  if (day > .02) {   // Sonne & erhellte Szene
    var sx = W * .78, sy = H * .16, sg = ge.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * .7);
    sg.addColorStop(0, 'rgba(255,236,190,' + .22 * day + ')'); sg.addColorStop(.25, 'rgba(255,190,120,' + .1 * day + ')'); sg.addColorStop(1, 'rgba(60,110,160,' + .06 * day + ')');
    ge.globalCompositeOperation = 'lighter'; ge.fillStyle = sg; ge.fillRect(0, 0, W, H);
    ge.fillStyle = 'rgba(255,245,220,' + .5 * day + ')'; ge.beginPath(); ge.arc(sx, sy, 16, 0, 6.2832); ge.fill();
  }
  if (night > .02) {
    ge.globalCompositeOperation = 'lighter';
    STARS.forEach(function (s) { var a = night * (.35 + .45 * Math.sin(t * 1.3 + s.ph)); ge.fillStyle = 'rgba(220,230,255,' + a + ')'; ge.fillRect(s.x * W, s.y * H, s.s, s.s); });
    // Mond in seiner echten Phase
    var p = SKY.moon, r = Math.min(W, H) * .045, mx = W * .82, my = H * .14, x = Math.cos(p * 6.2832);
    ge.globalCompositeOperation = 'source-over';
    var halo = ge.createRadialGradient(mx, my, r, mx, my, r * 4); halo.addColorStop(0, 'rgba(200,215,255,' + .12 * night * (1 - Math.abs(x) * .5) + ')'); halo.addColorStop(1, 'rgba(200,215,255,0)');
    ge.fillStyle = halo; ge.fillRect(mx - r * 4, my - r * 4, r * 8, r * 8);
    ge.save(); ge.translate(mx, my); if (p > .5) ge.scale(-1, 1);
    ge.fillStyle = 'rgba(30,34,46,' + night + ')'; ge.beginPath(); ge.arc(0, 0, r, 0, 6.2832); ge.fill();
    var mg = ge.createRadialGradient(-r * .3, -r * .3, 1, 0, 0, r); mg.addColorStop(0, '#fbfbf2'); mg.addColorStop(1, '#bfc4cf');
    ge.fillStyle = mg; ge.globalAlpha = night;
    ge.beginPath(); ge.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); ge.ellipse(0, 0, Math.abs(x) * r, r, 0, Math.PI / 2, -Math.PI / 2, x > 0); ge.fill();
    ge.globalAlpha = 1; ge.restore();
  }
  ge.globalCompositeOperation = 'source-over';
}
// Neumond: Feen, Einhörner, Meerjungfrauen · Vollmond: Gestaltwandler, Schneeleoparden, Werwölfe, Vampire
var MOONB = (window.VR_MOONBEINGS || []).map(function (a) { return { n: a.n, d: a.d, c: a.c, moon: a.moon, p: new Path2D(a.d), len: 0, pts: null, spr: null, glow: null }; });
function moonPool() { var p = SKY.moon, kind = p < .06 || p > .94 ? 'new' : Math.abs(p - .5) < .06 ? 'full' : null; return kind ? MOONB.filter(function (b) { return b.moon === kind; }) : []; }

/* ---------- 3D-Mandalas: Blume des Lebens, Blütenkränze, Sternpolygon ---------- */
var FORMS = [
  { petals: 8,  rings: 5, depth: .15, twist: 0,   hue: 187, star: 3 },
  { petals: 12, rings: 7, depth: .45, twist: .6,  hue: 28,  star: 5 },
  { petals: 6,  rings: 9, depth: .8,  twist: 1.4, hue: 280, star: 2 },
  { petals: 16, rings: 6, depth: .3,  twist: 2.2, hue: 160, star: 7 },
  { petals: 9,  rings: 8, depth: .6,  twist: .9,  hue: 320, star: 4 }
];
function mixForm(p) {
  var f = Math.min(clamp(p, 0, 1) * (FORMS.length - 1), FORMS.length - 1.0001), i = Math.floor(f), k = smooth(f - i), A = FORMS[i], B = FORMS[i + 1];
  return { petals: lerp(A.petals, B.petals, k), rings: lerp(A.rings, B.rings, k), depth: lerp(A.depth, B.depth, k),
           twist: lerp(A.twist, B.twist, k), hue: lerp(A.hue, B.hue, k), star: k < .5 ? A.star : B.star, k: k };
}
function drawMandala(t, prog, form, scale, alpha, spin, fine) {
  var cx = W / 2, cy = H * .5, R = Math.min(W, H) * .46 * scale;
  var rx = Math.sin(prog * Math.PI * 2) * .85 + Math.sin(t * .15) * .12, ry = Math.sin(prog * Math.PI * 3 + t * .1) * .45;
  var cX = Math.cos(rx), sX = Math.sin(rx), cY = Math.cos(ry), sY = Math.sin(ry), fov = 2.4;
  var hueG = lerp(form.hue, 44, goldAmt);
  function P(x, y, z) {
    var x1 = x * cY + z * sY, z1 = -x * sY + z * cY, y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX, s = fov / (fov + z2);
    return [cx + x1 * R * s, cy + y1 * R * s, s];
  }
  // Blume des Lebens im Hintergrund
  var fr = .27, cs = [[0, 0]], j, k, q;
  for (k = 0; k < 6; k++) cs.push([Math.cos(k * Math.PI / 3 + spin * .5) * fr, Math.sin(k * Math.PI / 3 + spin * .5) * fr]);
  if (fine) for (k = 0; k < 6; k++) cs.push([Math.cos(k * Math.PI / 3 + Math.PI / 6 + spin * .5) * fr * 1.732, Math.sin(k * Math.PI / 3 + Math.PI / 6 + spin * .5) * fr * 1.732]);
  gm.lineWidth = .8;
  gm.strokeStyle = 'hsla(' + hueG + ',70%,72%,' + alpha * .14 + ')';
  cs.forEach(function (c) {
    gm.beginPath();
    for (j = 0; j <= 40; j++) {
      var a = j / 40 * 6.2832, x = c[0] + Math.cos(a) * fr, y = c[1] + Math.sin(a) * fr;
      var p = P(x, y, Math.sin(x * 5 + t * .5) * form.depth * .08);
      j ? gm.lineTo(p[0], p[1]) : gm.moveTo(p[0], p[1]);
    }
    gm.stroke();
  });
  // Blütenkränze
  var rings = Math.round(form.rings);
  for (var r = 1; r <= rings; r++) {
    var rr = .22 + .78 * r / rings, r1 = rr - .9 / rings, pet = Math.round(form.petals * (1 + (r % 2) * .5));
    var hue = (hueG + r * 14 + t * 6) % 360, w = Math.PI / pet * .92, dir = r % 2 ? 1 : -1;
    var steps = fine ? 9 : 6;
    gm.lineWidth = 1;
    gm.strokeStyle = 'hsla(' + hue + ',90%,' + (58 + r * 2) + '%,' + alpha * (.28 + .4 * (1 - rr)) + ')';
    gm.fillStyle = 'hsla(' + hue + ',90%,55%,' + alpha * .045 + ')';
    for (q = 0; q < pet; q++) {
      var a0 = q / pet * 6.2832 + spin * dir + form.twist * rr;
      gm.beginPath();
      for (j = 0; j <= steps * 2; j++) {
        var tt = j <= steps ? j / steps : 2 - j / steps, side = j <= steps ? 1 : -1;
        var rad = r1 + (rr - r1) * tt, ang = a0 + side * w * Math.sin(Math.PI * tt) * (1 - .35 * tt) * (1 + bands.mid * .25);
        var z = Math.sin(ang * pet + t * .6) * form.depth * rr * .22 + (rr - .5) * form.depth * .6;
        var p = P(Math.cos(ang) * rad, Math.sin(ang) * rad, z);
        j ? gm.lineTo(p[0], p[1]) : gm.moveTo(p[0], p[1]);
      }
      gm.fill(); gm.stroke();
      // Lichtknoten an der Blattspitze
      var zt = Math.sin(a0 * pet + t * .6) * form.depth * rr * .22 + (rr - .5) * form.depth * .6, tp = P(Math.cos(a0) * rr, Math.sin(a0) * rr, zt);
      gm.fillStyle = 'hsla(' + ((hue + 180) % 360) + ',100%,78%,' + alpha * (.45 + bands.bass * .5) + ')';
      gm.beginPath(); gm.arc(tp[0], tp[1], (1.1 + bands.bass * 2.2) * tp[2], 0, 6.2832); gm.fill();
      gm.fillStyle = 'hsla(' + hue + ',90%,55%,' + alpha * .045 + ')';
    }
  }
  // Sternpolygon am Rand
  var n = Math.round(form.petals), st = form.star, sr = 1.04;
  gm.strokeStyle = 'hsla(' + hueG + ',85%,70%,' + alpha * .22 + ')'; gm.lineWidth = .9;
  gm.beginPath();
  for (j = 0; j <= n; j++) {
    var ai = (j * st % n) / n * 6.2832 - spin * .7, p2 = P(Math.cos(ai) * sr, Math.sin(ai) * sr, Math.sin(ai * 3 + t * .4) * form.depth * .2);
    j ? gm.lineTo(p2[0], p2[1]) : gm.moveTo(p2[0], p2[1]);
  }
  gm.stroke();
  // leuchtender Kern
  var c0 = P(0, 0, 0), cg = gm.createRadialGradient(c0[0], c0[1], 0, c0[0], c0[1], R * .14);
  cg.addColorStop(0, 'hsla(' + hueG + ',100%,80%,' + alpha * (.35 + bands.bass * .3) + ')'); cg.addColorStop(1, 'hsla(' + hueG + ',100%,60%,0)');
  gm.fillStyle = cg; gm.beginPath(); gm.arc(c0[0], c0[1], R * .14, 0, 6.2832); gm.fill();
}

/* ---------- Sprites: Blätter, Farn, Federn, Traumfänger, Federschmuck ---------- */
function leafPath(g) { g.beginPath(); g.moveTo(2, 20); g.quadraticCurveTo(38, -5, 94, 20); g.quadraticCurveTo(38, 45, 2, 20); g.closePath(); }
var LEAVES = [[98, 16], [118, 13], [136, 17]].map(function (hl) {
  var c = mk(96, 40), g = c.getContext('2d'), h = hl[0], l = hl[1];
  leafPath(g);
  var lg = g.createLinearGradient(0, 0, 96, 0);
  lg.addColorStop(0, 'hsl(' + h + ',40%,' + (l - 5) + '%)'); lg.addColorStop(.55, 'hsl(' + h + ',48%,' + (l + 9) + '%)'); lg.addColorStop(1, 'hsl(' + (h + 8) + ',42%,' + (l + 2) + '%)');
  g.fillStyle = lg; g.fill();
  g.strokeStyle = 'hsla(' + h + ',40%,' + (l - 8) + '%,.9)'; g.lineWidth = 1; g.stroke();
  g.strokeStyle = 'hsla(' + h + ',35%,' + (l + 26) + '%,.6)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(4, 20); g.lineTo(90, 20); g.stroke();
  g.lineWidth = .7; g.strokeStyle = 'hsla(' + h + ',35%,' + (l + 20) + '%,.35)';
  for (var i = 1; i <= 6; i++) { var x = 8 + i * 12, d = 10 - i * 1.1; g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 10, 20 - d); g.moveTo(x, 20); g.lineTo(x + 10, 20 + d); g.stroke(); }
  var hl2 = g.createRadialGradient(34, 13, 0, 34, 13, 28); hl2.addColorStop(0, 'rgba(255,255,255,.10)'); hl2.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl2; leafPath(g); g.fill();
  return c;
});
var glowCache = {};
function leafGlow(hue) {
  var key = Math.round(hue / 20) * 20 % 360; if (glowCache[key]) return glowCache[key];
  var c = mk(104, 48), g = c.getContext('2d'); g.translate(4, 4);
  g.shadowColor = 'hsl(' + key + ',100%,60%)'; g.shadowBlur = 6;
  g.strokeStyle = 'hsla(' + key + ',100%,70%,.9)'; g.lineWidth = 1.1; leafPath(g); g.stroke();
  g.beginPath(); g.moveTo(4, 20); g.lineTo(90, 20); g.stroke();
  return (glowCache[key] = c);
}
var FERN = (function () {
  var c = mk(130, 400), g = c.getContext('2d');
  function st(t) { var u = 1 - t; return [u * u * 65 + 2 * u * t * 88 + t * t * 62, u * u * 396 + 2 * u * t * 200 + t * t * 8]; }
  g.strokeStyle = '#2c3a1c'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); for (var j = 0; j <= 40; j++) { var p = st(j / 40); j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
  for (var t = .06; t < .97; t += .033) {
    var p0 = st(t), p1 = st(t + .01), tx = p1[0] - p0[0], ty = p1[1] - p0[1], tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
    var L = 52 * Math.pow(1 - t, .75) + 5;
    [-1, 1].forEach(function (s) {
      var nx = -ty * s, ny = tx * s, ang = Math.atan2(ny + ty * .55, nx + tx * .55);
      g.save(); g.translate(p0[0], p0[1]); g.rotate(ang);
      var lg = g.createLinearGradient(0, 0, L, 0); lg.addColorStop(0, '#1d3413'); lg.addColorStop(.6, '#3d6326'); lg.addColorStop(1, '#2c4a1b');
      g.fillStyle = lg; g.beginPath(); g.moveTo(0, 0);
      for (var k = 0; k <= 6; k++) { var x = L * k / 6, w = L * .16 * Math.sin(Math.PI * Math.min(1, k / 6 + .08)); g.lineTo(x, -w - (k % 2) * 1.5); }
      for (k = 6; k >= 0; k--) { var x2 = L * k / 6, w2 = L * .16 * Math.sin(Math.PI * Math.min(1, k / 6 + .08)); g.lineTo(x2, w2 + (k % 2) * 1.5); }
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160,210,120,.25)'; g.lineWidth = .6; g.beginPath(); g.moveTo(0, 0); g.lineTo(L * .92, 0); g.stroke();
      g.restore();
    });
  }
  return c;
})();
function feather(g, x, y, len, ang, pal) {
  g.save(); g.translate(x, y); g.rotate(ang);
  var n = len / 1.4;
  for (var s = -1; s <= 1; s += 2) for (var i = 0; i < n; i++) {
    var t = i / n, half = len * .17 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08 + .04)), .7) * (t < .1 ? t / .1 : 1);
    if (t < .14) half *= .75;
    var yy = t * len, col = t > pal.band ? pal.tip : pal.base;
    if (t < .14) col = pal.fluff || pal.base;
    g.strokeStyle = col; g.globalAlpha = t < .14 ? .55 : .92; g.lineWidth = .9;
    g.beginPath(); g.moveTo(0, yy); g.quadraticCurveTo(s * half * .5, yy + half * .1, s * half, yy + half * .42 + Math.sin(i * 1.7) * .8); g.stroke();
  }
  g.globalAlpha = 1; g.strokeStyle = pal.shaft; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, -len * .06); g.lineTo(0, len * .98); g.stroke();
  g.restore();
}
var PAL_EAGLE = { base: '#efe7d8', tip: '#2b1a10', band: .72, shaft: '#d8ccb8', fluff: '#e9dccb' };
var PAL_HAWK = { base: '#8a5a33', tip: '#3a2414', band: .8, shaft: '#c9ad86', fluff: '#b98e62' };
var PAL_RED = { base: '#efe7d8', tip: '#2b1a10', band: .74, shaft: '#d8ccb8', fluff: '#b3261e' };
function beads(g, x0, y0, x1, y1, cols) {
  g.strokeStyle = '#6b4a2e'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  cols.forEach(function (c, i) {
    var t = (i + 1) / (cols.length + 1), x = lerp(x0, x1, t), y = lerp(y0, y1, t);
    var bg2 = g.createRadialGradient(x - 1, y - 1, 0, x, y, 3.4); bg2.addColorStop(0, '#fff'); bg2.addColorStop(.25, c); bg2.addColorStop(1, c);
    g.fillStyle = bg2; g.beginPath(); g.arc(x, y, 3.2, 0, 6.2832); g.fill();
  });
}
var SPR = {};
SPR.dream = (function () {
  var c = mk(160, 360), g = c.getContext('2d'), cx = 80, cy = 78, R = 58, i, k;
  g.strokeStyle = '#6b4a2e'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy - R); g.stroke();
  // Netz
  var lv = [], n = 9; lv[0] = [];
  for (i = 0; i < n; i++) { var a = i / n * 6.2832 - Math.PI / 2; lv[0].push([cx + Math.cos(a) * (R - 3), cy + Math.sin(a) * (R - 3)]); }
  for (k = 1; k < 7; k++) { lv[k] = []; for (i = 0; i < n; i++) { var A = lv[k - 1][i], B = lv[k - 1][(i + 1) % n], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2; lv[k].push([cx + (mx - cx) * .9, cy + (my - cy) * .9]); } }
  g.strokeStyle = 'rgba(236,224,200,.85)'; g.lineWidth = .8;
  for (k = 1; k < 7; k++) for (i = 0; i < n; i++) { var p = lv[k][i], a1 = lv[k - 1][i], b1 = lv[k - 1][(i + 1) % n]; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(p[0], p[1]); g.lineTo(b1[0], b1[1]); g.stroke(); }
  [[3, 2], [5, 6], [2, 7]].forEach(function (b) { var p = lv[b[0]][b[1]]; g.fillStyle = '#2fb3a8'; g.beginPath(); g.arc(p[0], p[1], 2.6, 0, 6.2832); g.fill(); });
  g.fillStyle = '#b3261e'; g.beginPath(); g.arc(cx, cy, 3.4, 0, 6.2832); g.fill();
  // Leder-Ring
  g.strokeStyle = '#6b4224'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.stroke();
  g.strokeStyle = '#3a2212'; g.lineWidth = 1.4;
  for (i = 0; i < 52; i++) { var aa = i / 52 * 6.2832; g.beginPath(); g.moveTo(cx + Math.cos(aa) * (R - 3.5), cy + Math.sin(aa) * (R - 3.5)); g.lineTo(cx + Math.cos(aa + .07) * (R + 3.5), cy + Math.sin(aa + .07) * (R + 3.5)); g.stroke(); }
  // Hänger
  [[-.55, 70, PAL_EAGLE, ['#b3261e', '#e8dcc0', '#2fb3a8']], [0, 104, PAL_HAWK, ['#2fb3a8', '#111', '#e8dcc0', '#b3261e']], [.55, 70, PAL_EAGLE, ['#e8dcc0', '#b3261e', '#2fb3a8']]].forEach(function (h) {
    var a = Math.PI / 2 + h[0], x0 = cx + Math.cos(a) * R, y0 = cy + Math.sin(a) * R, x1 = x0 + h[0] * 14, y1 = y0 + h[1];
    beads(g, x0, y0, x1, y1, h[3]);
    feather(g, x1, y1 - 2, 78, h[0] * -.12, h[2]);
  });
  return { c: c, px: 80, py: 0 };
})();
SPR.bonnet = (function () {
  var c = mk(300, 250), g = c.getContext('2d'), cx = 150, cy = 214, i;
  g.strokeStyle = '#6b4a2e'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy - 30); g.stroke();
  for (i = 0; i < 17; i++) {
    var th = Math.PI + (i + .5) / 17 * Math.PI, bx = cx + Math.cos(th) * 34, by = cy + Math.sin(th) * 30;
    feather(g, bx, by, 112, th - Math.PI / 2, PAL_RED);
  }
  g.lineWidth = 11; g.lineCap = 'butt';
  var cols = ['#b3261e', '#efe7d8', '#2fb3a8', '#111', '#efe7d8'];
  for (i = 0; i < 20; i++) { g.strokeStyle = cols[i % cols.length]; g.beginPath(); g.ellipse(cx, cy, 36, 31, 0, Math.PI + i / 20 * Math.PI, Math.PI + (i + 1) / 20 * Math.PI); g.stroke(); }
  [-1, 1].forEach(function (s) {
    var x = cx + s * 36, y = cy;
    g.fillStyle = '#f4efe6'; g.beginPath(); g.ellipse(x, y + 18, 5, 18, 0, 0, 6.2832); g.fill();
    g.fillStyle = '#1a1410'; g.beginPath(); g.ellipse(x, y + 34, 3, 4, 0, 0, 6.2832); g.fill();
  });
  return { c: c, px: 150, py: 0 };
})();
SPR.fstring = (function () {
  var c = mk(90, 260), g = c.getContext('2d');
  beads(g, 45, 0, 45, 120, ['#e8dcc0', '#b3261e', '#2fb3a8', '#e8dcc0', '#111', '#b3261e']);
  feather(g, 45, 118, 104, .28, PAL_HAWK); feather(g, 45, 118, 116, 0, PAL_EAGLE); feather(g, 45, 118, 98, -.3, PAL_HAWK);
  return { c: c, px: 45, py: 0 };
})();
SPR.crystal = (function () {
  var c = mk(50, 150), g = c.getContext('2d');
  g.strokeStyle = '#8a8f98'; g.lineWidth = 1; g.beginPath(); g.moveTo(25, 0); g.lineTo(25, 50); g.stroke();
  var lg = g.createLinearGradient(12, 0, 38, 0); lg.addColorStop(0, '#5b2c8f'); lg.addColorStop(.45, '#c9a6ff'); lg.addColorStop(.55, '#8ee6f2'); lg.addColorStop(1, '#3b2a78');
  g.fillStyle = lg; g.beginPath(); g.moveTo(25, 46); g.lineTo(37, 60); g.lineTo(37, 116); g.lineTo(25, 142); g.lineTo(13, 116); g.lineTo(13, 60); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .8; g.beginPath(); g.moveTo(25, 46); g.lineTo(25, 142); g.moveTo(13, 60); g.lineTo(37, 60); g.stroke();
  g.strokeStyle = '#c9b27a'; g.lineWidth = 1.5; for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(12, 52 + i * 4); g.lineTo(38, 55 + i * 4); g.stroke(); }
  return { c: c, px: 25, py: 0, glow: 1 };
})();
SPR.feather = (function () { var c = mk(60, 170), g = c.getContext('2d'); beads(g, 30, 0, 30, 40, ['#b3261e', '#2fb3a8']); feather(g, 30, 38, 124, 0, PAL_EAGLE); return { c: c, px: 30, py: 0 }; })();
var PENDANTS = [
  { s: SPR.feather, x: .58, len: .02, k: .8, ph: .7, spin: .25, keep: 1 },
  { s: SPR.dream,   x: .25, len: .10, k: .62, ph: 0,   spin: .35 },
  { s: SPR.fstring, x: -1,  len: .07, k: .72, ph: 2.1, spin: .5 },
  { s: SPR.bonnet,  x: .77, len: .03, k: .46, ph: 4.2, spin: .22 },
  { s: SPR.crystal, x: .38, len: .20, k: .62, ph: 1.3, spin: .7 },
  { s: SPR.dream,   x: .64, len: .22, k: .42, ph: 3.3, spin: .45 },
  { s: SPR.fstring, x: .5,  len: .02, k: .5,  ph: 5.1, spin: .3 }
];
function drawPendants(t, grow, sway, awake) {
  PENDANTS.forEach(function (p, pi) {
    if (!p.keep && pi > 1 + Math.round(MIX.vis * 5)) return;
    var vis = p.keep ? 1 : smooth((grow - .5) * 4) * smooth((Math.sin(t * .045 + p.ph) + .55) / .8) * awake;   // tauchen manchmal auf; in der Ruhe bleibt nur die Feder
    if (vis < .02) return;
    var x = p.x < 0 ? W - TW - 40 : p.x * W, ly = p.len * H + 12 * Math.sin(t * .3 + p.ph);
    var sw = Math.sin(t * .8 + p.ph) * .08 * sway + Math.sin(t * .37 + p.ph * 2) * .04 * sway;
    var rot = Math.cos(t * p.spin + p.ph), sx = Math.sign(rot || 1) * Math.max(.14, Math.abs(rot));
    gf.globalAlpha = vis;
    gf.strokeStyle = 'rgba(120,90,60,.8)'; gf.lineWidth = 1;
    gf.beginPath(); gf.moveTo(x, 0); gf.lineTo(x + Math.sin(sw) * ly * .2, ly); gf.stroke();
    gf.save(); gf.translate(x + Math.sin(sw) * ly * .2, ly); gf.rotate(sw); gf.scale(sx * p.k, p.k);
    if (rot < 0) gf.filter = 'brightness(.75)';
    gf.drawImage(p.s.c, -p.s.px, -p.s.py);
    gf.filter = 'none';
    if (p.s.glow) { gf.globalCompositeOperation = 'lighter'; var cg = gf.createRadialGradient(0, 95, 0, 0, 95, 60); cg.addColorStop(0, 'rgba(180,140,255,' + (.25 + bands.high * .3) + ')'); cg.addColorStop(1, 'rgba(120,80,255,0)'); gf.fillStyle = cg; gf.fillRect(-60, 35, 120, 120); gf.globalCompositeOperation = 'source-over'; }
    gf.restore();
  });
  gf.globalAlpha = 1;
}

/* ---------- Glockenspiel ---------- */
var CH = { tubes: [], x: 0, y: 0, k: 1, box: null };
for (var ti = 0; ti < 6; ti++) CH.tubes.push({ len: [118, 104, 94, 84, 76, 66][ti], th: 0, w: 0, last: 0 });
var ptr = { x: -1, y: -1, px: -1 };
var chimeAlpha = 1;
function hitTube(i, v) {
  var tb = CH.tubes[i], now = performance.now(); tb.w += v;
  if (now - tb.last > 130 && chimeAlpha > .3) { tb.last = now; chimeNote(i, Math.abs(v) / 4); }
}
function drawChime(t, dt, dream, alpha) {
  if (alpha < .02) { CH.box = null; return; }
  gf.globalAlpha = alpha;
  var k = CH.k = clamp(H / 900, .6, 1), x = CH.x = TW + 64 * k, y = CH.y = 70 * k;
  // Wind, Scroll-Impulse
  CH.tubes.forEach(function (tb, i) {
    tb.w += (-tb.th * 20 - tb.w * 1.1) * dt + (Math.random() - .5) * (.4 + dream * 2.5) * dt * 8;
    tb.th += tb.w * dt; tb.th = clamp(tb.th, -.6, .6);
  });
  if (Math.abs(svVel) > .12 && Math.random() < Math.min(.3, Math.abs(svVel) * .22)) hitTube(Math.random() * 6 | 0, (Math.random() < .5 ? -1 : 1) * (1.2 + Math.abs(svVel) * 2));
  
  gf.strokeStyle = 'rgba(120,90,60,.8)'; gf.lineWidth = 1;
  gf.beginPath(); gf.moveTo(x, 0); gf.lineTo(x, y - 6 * k); gf.stroke();
  // Holzscheibe
  var dg = gf.createLinearGradient(x - 60 * k, 0, x + 60 * k, 0); dg.addColorStop(0, '#3a2212'); dg.addColorStop(.5, '#7a4a26'); dg.addColorStop(1, '#3a2212');
  gf.fillStyle = dg; gf.beginPath(); gf.ellipse(x, y, 58 * k, 9 * k, 0, 0, 6.2832); gf.fill();
  var minX = x, maxX = x, maxY = y;
  CH.tubes.forEach(function (tb, i) {
    var ax = x + (i - 2.5) * 19 * k, ay = y + 4 * k, sl = (18 + i * 2) * k, L = tb.len * k;
    gf.save(); gf.translate(ax, ay); gf.rotate(tb.th);
    gf.strokeStyle = 'rgba(200,190,170,.6)'; gf.lineWidth = .8; gf.beginPath(); gf.moveTo(0, 0); gf.lineTo(0, sl); gf.stroke();
    var mg = gf.createLinearGradient(-4 * k, 0, 4 * k, 0);
    mg.addColorStop(0, '#5f6a76'); mg.addColorStop(.35, '#eef2f6'); mg.addColorStop(.6, '#9aa6b2'); mg.addColorStop(1, '#4c5661');
    gf.fillStyle = mg; gf.fillRect(-3.6 * k, sl, 7.2 * k, L);
    gf.fillStyle = 'rgba(255,255,255,.55)'; gf.fillRect(-1.2 * k, sl + 2, 1.1 * k, L - 4);
    if (goldAmt > .05) { gf.globalCompositeOperation = 'lighter'; gf.fillStyle = 'rgba(232,185,74,' + goldAmt * .5 + ')'; gf.fillRect(-3.6 * k, sl, 7.2 * k, L); gf.globalCompositeOperation = 'source-over'; }
    gf.restore();
    var ex = ax + Math.sin(tb.th) * (sl + L); minX = Math.min(minX, ex - 6); maxX = Math.max(maxX, ex + 6); maxY = Math.max(maxY, ay + sl + L);
  });
  // Klöppel & Windfeder
  var cs = Math.sin(t * .9) * .15;
  gf.save(); gf.translate(x, y + 4 * k); gf.rotate(cs);
  gf.strokeStyle = 'rgba(200,190,170,.6)'; gf.beginPath(); gf.moveTo(0, 0); gf.lineTo(0, 150 * k); gf.stroke();
  gf.fillStyle = '#6b4224'; gf.beginPath(); gf.ellipse(0, 78 * k, 13 * k, 4 * k, 0, 0, 6.2832); gf.fill();
  feather(gf, 0, 150 * k, 60 * k, 0, PAL_EAGLE);
  gf.restore();
  CH.box = { x0: Math.min(minX, x - 62 * k), x1: Math.max(maxX, x + 62 * k), y0: y - 14 * k, y1: Math.max(maxY, y + 210 * k) };
  gf.font = (14 * k | 0) + 'px system-ui'; gf.globalAlpha = .75 * alpha; gf.fillText(soundOn ? '🔔' : '🔕', x + 64 * k, y + 5 * k); gf.globalAlpha = 1;
}
window.addEventListener('pointermove', function (e) {
  if (!CH.box) return;
  var r = bg.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, b = CH.box;
  if (ptr.x >= 0 && y > b.y0 && y < b.y1 && x > b.x0 - 20 && x < b.x1 + 20) {
    CH.tubes.forEach(function (tb, i) {
      var tx = CH.x + (i - 2.5) * 19 * CH.k + Math.sin(tb.th) * 60 * CH.k;
      if ((ptr.x - tx) * (x - tx) <= 0 && ptr.x !== x) hitTube(i, clamp((x - ptr.x) * .12, -4, 4));
    });
  }
  ptr.x = x; ptr.y = y;
}, { passive: true, capture: true });
window.addEventListener('click', function (e) {
  if (!CH.box || e.target.closest('button,a,input,textarea,select,.vr-card,.vr-row,.vr-glass,#vr-aside,.vr-modal,#vr-temple')) return;
  var r = bg.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, b = CH.box;
  if (x > b.x0 && x < b.x1 + 30 && y > b.y0 && y < b.y1 && e.clientY < r.bottom) setSound(!soundOn);
}, true);

/* ---------- Wald: Äste, Blätter, Farne ---------- */
function rnd(seed) { return function () { seed = seed + 0x6D2B79F5 | 0; var q = Math.imul(seed ^ seed >>> 15, 1 | seed); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; }
function makeBranch(r, d, max, len, ang, vine) {
  var n = { len: len, ang: ang, d: d, ph: r() * 6.28, bend: (r() - .5) * .5, kids: [], leaf: vine ? d > 1 : d >= max - 3, lv: r() * 3 | 0 };
  if (d < max) {
    if (vine) {
      n.kids.push(makeBranch(r, d + 1, max, len * (.9 + r() * .12), (r() - .5) * .35, true));
      if (r() < .35) n.kids.push(makeBranch(r, d + 1, Math.min(max, d + 3), len * .55, (r() < .5 ? -1 : 1) * (.6 + r() * .4), false));
    } else {
      var k = r() < .3 ? 3 : 2;
      for (var i = 0; i < k; i++) n.kids.push(makeBranch(r, d + 1, max, len * (.66 + r() * .14), (i - (k - 1) / 2) * (.45 + r() * .35) + (r() - .5) * .2, false));
    }
  }
  return n;
}
var seedR = rnd(7);
var TREES = [
  { side: -1, x: 0, y: .96, ang: -1.0, max: 7, len: .17 },
  { side: -1, x: 0, y: .46, ang: -.3, max: 6, len: .12 },
  { side: 1, x: 1, y: .92, ang: Math.PI + 1.0, max: 7, len: .16 },
  { side: 1, x: 1, y: .62, ang: Math.PI + .35, max: 6, len: .12 },
  { side: -1, x: .16, y: 0, ang: Math.PI / 2, max: 9, len: .07, vine: true },
  { side: 1, x: .86, y: 0, ang: Math.PI / 2, max: 8, len: .075, vine: true }
].map(function (T) { T.root = makeBranch(seedR, 0, T.max, 1, 0, !!T.vine); return T; });
var tips = [];
function drawBranch(T, n, x, y, a, grow, t, sway, curl, hue, S) {
  var g = clamp(grow * (T.max + 1) - n.d, 0, 1); if (g <= 0) return;
  var aa = a + n.ang + Math.sin(t * .55 + n.ph + n.d * .5) * .03 * (n.d + 1) * sway + curl * .04 * n.d * T.side;
  var L = n.len * S * g, x2 = x + Math.cos(aa) * L, y2 = y + Math.sin(aa) * L;
  var mx = (x + x2) / 2 - Math.sin(aa) * L * n.bend * .3, my = (y + y2) / 2 + Math.cos(aa) * L * n.bend * .3;
  var w = Math.max(.8, (T.max - n.d + 1) * (T.vine ? .75 : 2.1));
  gf.lineCap = 'round';
  gf.strokeStyle = (n.d < 3 && !T.vine) ? 'rgb(' + (34 + n.d * 7) + ',' + (22 + n.d * 5) + ',' + (13 + n.d * 3) + ')' : 'hsl(' + (32 + n.d * 11) + ',30%,' + (11 + n.d * 2) + '%)';
  gf.lineWidth = w; gf.beginPath(); gf.moveTo(x, y); gf.quadraticCurveTo(mx, my, x2, y2); gf.stroke();
  if (w > 4) {   // Rindenstruktur
    gf.lineWidth = .8; gf.strokeStyle = 'rgba(120,84,52,.45)'; var o = w * .22;
    gf.beginPath(); gf.moveTo(x - Math.sin(aa) * o, y + Math.cos(aa) * o); gf.quadraticCurveTo(mx - Math.sin(aa) * o, my + Math.cos(aa) * o, x2 - Math.sin(aa) * o, y2 + Math.cos(aa) * o); gf.stroke();
    gf.strokeStyle = 'rgba(0,0,0,.35)';
    gf.beginPath(); gf.moveTo(x + Math.sin(aa) * o, y - Math.cos(aa) * o); gf.quadraticCurveTo(mx + Math.sin(aa) * o, my - Math.cos(aa) * o, x2 + Math.sin(aa) * o, y2 - Math.cos(aa) * o); gf.stroke();
  }
  if (n.d >= 2) {
    gf.globalCompositeOperation = 'lighter';
    gf.strokeStyle = 'hsla(' + hue + ',90%,60%,' + (.035 + .05 * n.d / T.max + bands.bass * .06) + ')'; gf.lineWidth = Math.max(.5, w * .3);
    gf.beginPath(); gf.moveTo(x, y); gf.quadraticCurveTo(mx, my, x2, y2); gf.stroke();
    gf.globalCompositeOperation = 'source-over';
  }
  if (n.leaf && g > .5) {
    var ls = S * (T.vine ? .011 : .008) * smooth((g - .5) * 2), la = aa + (n.ph > 3 ? .7 : -.7) + Math.sin(t * .9 + n.ph) * .15 * sway;
    leafAt(x2, y2, la, ls, n.lv, hue, n.ph);
    if (!T.vine && n.d > T.max - 2 && n.ph > 2.5) leafAt(x2, y2, aa - (n.ph > 3 ? .7 : -.7) + Math.sin(t * .8 + n.ph) * .12 * sway, ls * .8, (n.lv + 1) % 3, hue, n.ph + 1);
  }
  if (!n.kids.length) tips.push([x2, y2]);
  for (var i = 0; i < n.kids.length; i++) drawBranch(T, n.kids[i], x2, y2, aa, grow, t, sway, curl, hue, S);
}
function leafAt(x, y, a, s, v, hue, ph) {
  if (s < .05) return;
  gf.save(); gf.translate(x, y); gf.rotate(a); gf.scale(s, s);
  gf.drawImage(LEAVES[v], 0, -20);
  gf.globalCompositeOperation = 'lighter'; gf.globalAlpha = .18 + bands.mid * .22 + goldAmt * .3;
  gf.drawImage(leafGlow(lerp(hue, 44, goldAmt)), -4, -24);
  gf.restore(); gf.globalAlpha = 1; gf.globalCompositeOperation = 'source-over';
}
function drawFerns(t, grow, sway) {
  var g = smooth((grow - .35) * 2); if (g <= 0) return;
  var sc = clamp(H / 900, .55, 1) * g;
  [[-1, TW * .6, [-.2, .25, .6]], [1, W - TW * .6, [.2, -.25, -.6]]].forEach(function (side) {
    side[2].forEach(function (base, i) {
      gf.save(); gf.translate(side[1] + side[0] * -i * 14, H + 6);
      gf.rotate(base + Math.sin(t * .6 + i * 1.3 + side[0]) * .05 * sway);
      gf.scale(sc * (1 - i * .12), sc * (1 - i * .12));
      gf.drawImage(FERN, -65, -400);
      gf.restore();
    });
  });
}

/* ---------- Krafttiere aus Energielinien ---------- */
var svgNS = 'http://www.w3.org/2000/svg', meas = document.createElementNS(svgNS, 'svg');
meas.setAttribute('width', '0'); meas.setAttribute('height', '0'); meas.style.position = 'absolute'; meas.style.visibility = 'hidden';
root.appendChild(meas);
var ANIMALS = VR_ANIMALS.map(function (a) { return { n: a.n, d: a.d, c: a.c, p: new Path2D(a.d), len: 0, pts: null, spr: null, glow: null }; });
function prepAnimal(A) {
  if (!A.photo && window.VR_PHOTOS !== undefined && VR_PHOTOS[A.n]) { A.photo = new Image(); A.photo.src = VR_PHOTOS[A.n]; }
  if (A.spr) return;
  var el = document.createElementNS(svgNS, 'path'); el.setAttribute('d', A.d); meas.appendChild(el);
  try { A.len = el.getTotalLength(); A.pts = []; for (var i = 0; i < 44; i++) { var q = el.getPointAtLength(A.len * i / 44); A.pts.push([q.x, q.y]); } }
  catch (e) { A.len = 3000; A.pts = []; }
  meas.removeChild(el);
  var c = mk(384, 384), g = c.getContext('2d'); g.scale(.75, .75);
  var lg = g.createLinearGradient(0, 40, 0, 480); lg.addColorStop(0, A.c[1]); lg.addColorStop(.6, A.c[1]); lg.addColorStop(1, A.c[0]);
  g.fillStyle = lg; g.fill(A.p);
  g.save(); g.clip(A.p);
  var rr = rnd(A.n.length * 131);
  for (var k = 0; k < 2200; k++) {   // Fell / Gefieder
    var x = rr() * 512, y = rr() * 512, a = -.9 + (rr() - .5) * .8, l = 5 + rr() * 11;
    g.strokeStyle = A.c[rr() < .5 ? 0 : rr() < .6 ? 1 : 2]; g.globalAlpha = .28; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.globalAlpha = 1;
  var hl = g.createRadialGradient(230, 150, 0, 230, 150, 280); hl.addColorStop(0, A.c[2] + '99'); hl.addColorStop(1, A.c[2] + '00');
  g.fillStyle = hl; g.fillRect(0, 0, 512, 512);
  var sh = g.createLinearGradient(0, 260, 0, 512); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)');
  g.fillStyle = sh; g.fillRect(0, 0, 512, 512);
  g.restore();
  g.strokeStyle = A.c[0]; g.lineWidth = 3; g.stroke(A.p);
  A.spr = c;
  var c2 = mk(384, 384), g2 = c2.getContext('2d'); g2.scale(.75, .75);
  g2.shadowColor = A.c[2]; g2.shadowBlur = 30; g2.fillStyle = A.c[2] + '88'; g2.fill(A.p);
  A.glow = c2;
}
var spirit = null, nextSpirit = 6, lastAnimal = -1;
var seeds = [], sprouts = [];
function drawSpirit(t, dream, hue) {
  if (!spirit && t > nextSpirit && W > 360) {
    var mp = moonPool(), A;
    if (mp.length && Math.random() < .6) A = mp[Math.random() * mp.length | 0];
    else { var i; do { i = Math.random() * ANIMALS.length | 0; } while (i === lastAnimal && ANIMALS.length > 1); lastAnimal = i; A = ANIMALS[i]; }
    prepAnimal(A);
    var left = Math.random() < .5, sz = Math.min(W * .3, H * .42, 340);
    spirit = { A: A, t0: t, sz: sz, x: left ? Math.max(TW + sz * .55, W * .24) : Math.min(W - TW - sz * .55, W * .76), y: H * (.32 + Math.random() * .3), flip: left ? 1 : -1, seeded: false };
  }
  if (!spirit) return;
  var s = spirit, A = s.A, tau = t - s.t0, k = s.sz / 512;
  if (tau > 10.5) { spirit = null; nextSpirit = t + (dream > .5 ? 3 : 5 + Math.random() * 5) * (1.6 - MIX.vis); return; }
  var drawP = smooth(tau / 2.5), colorA = smooth((tau - 2.4) / 1.4) * (1 - smooth((tau - 6) / 1.5)),
      glowA = smooth((tau - 3.6) / .8) * (1 - smooth((tau - 5.6) / .8)) * (.6 + .4 * Math.sin(tau * 4)), eraseP = smooth((tau - 7.4) / 2.6);
  var L = A.len || 3000;
  gm.save(); gm.translate(s.x, s.y); gm.scale(k * s.flip, k); gm.translate(-256, -256);
  gm.globalCompositeOperation = 'lighter';
  gm.setLineDash([L, L]); gm.lineDashOffset = eraseP > 0 ? -L * eraseP : L * (1 - drawP);
  gm.lineWidth = 8 / k; gm.strokeStyle = 'hsla(' + hue + ',90%,60%,.14)'; gm.stroke(A.p);
  gm.lineWidth = 1.7 / k; gm.strokeStyle = 'hsla(' + hue + ',100%,80%,.9)'; gm.stroke(A.p);
  gm.setLineDash([]);
  if (colorA > .01) {
    if (A.photo && A.photo.complete && A.photo.naturalWidth) { gm.globalCompositeOperation = 'screen'; gm.globalAlpha = colorA; gm.drawImage(A.photo, -110, -110, 732, 732); }
    else { gm.globalCompositeOperation = 'source-over'; gm.globalAlpha = colorA * .93; gm.drawImage(A.spr, 0, 0, 512, 512); }
  }
  if (glowA > .01) { gm.globalCompositeOperation = 'lighter'; gm.globalAlpha = glowA * .6; gm.drawImage(A.glow, 0, 0, 512, 512); }
  gm.restore(); gm.globalAlpha = 1; gm.globalCompositeOperation = 'lighter';
  if (tau > 7.4 && !s.seeded) {   // Linien werden zu Samen, die zum Waldrand fliegen und dort keimen
    s.seeded = true;
    A.pts.forEach(function (p, i) {
      var sx = s.x + (p[0] - 256) * k * s.flip, sy = s.y + (p[1] - 256) * k;
      seeds.push({ x: sx, y: sy, vx: (Math.random() - .5) * 1.5, vy: (Math.random() - .5) * 1.5, tx: sx < W / 2 ? TW * .8 : W - TW * .8, hue: hue + (Math.random() - .5) * 40, trail: [], ph: i });
    });
  }
}
function drawSeeds(t, dt) {
  gf.globalCompositeOperation = 'lighter'; gf.lineCap = 'round';
  for (var i = seeds.length - 1; i >= 0; i--) {
    var p = seeds[i];
    p.vx += Math.sign(p.tx - p.x) * .16; p.vy += Math.sin(t * 2 + p.ph) * .08 + .015;
    p.vx *= .95; p.vy *= .95; p.x += p.vx; p.y += p.vy;
    p.trail.push(p.x, p.y); if (p.trail.length > 16) p.trail.splice(0, 2);
    gf.strokeStyle = 'hsla(' + p.hue + ',95%,68%,.5)'; gf.lineWidth = 1.4;
    gf.beginPath(); for (var j = 0; j < p.trail.length; j += 2) j ? gf.lineTo(p.trail[j], p.trail[j + 1]) : gf.moveTo(p.trail[j], p.trail[j + 1]); gf.stroke();
    if (Math.abs(p.x - p.tx) < 14 || p.y > H || p.y < 0) {
      if (p.y > 0 && p.y < H) sprouts.push({ x: p.tx, y: p.y, dir: p.tx < W / 2 ? 1 : -1, t0: t, hue: p.hue, len: 26 + Math.random() * 34, ph: Math.random() * 6 });
      seeds.splice(i, 1);
    }
  }
  gf.globalCompositeOperation = 'source-over';
  for (i = sprouts.length - 1; i >= 0; i--) {
    var s = sprouts[i], a = t - s.t0; if (a > 12) { sprouts.splice(i, 1); continue; }
    var g = smooth(a / 2.2), f = 1 - smooth((a - 8.5) / 3.5), L = s.len * g;
    var ex = s.x + s.dir * L, ey = s.y - L * .55 + Math.sin(t + s.ph) * 3;
    gf.globalAlpha = f; gf.strokeStyle = '#2c3a1c'; gf.lineWidth = 1.6;
    gf.beginPath(); gf.moveTo(s.x, s.y); gf.quadraticCurveTo(s.x + s.dir * L * .15, s.y - L * .9, ex, ey); gf.stroke();
    gf.globalCompositeOperation = 'lighter'; gf.strokeStyle = 'hsla(' + s.hue + ',90%,65%,' + .35 * f + ')'; gf.lineWidth = .8; gf.stroke(); gf.globalCompositeOperation = 'source-over';
    leafAt(ex, ey, s.dir > 0 ? -.4 : Math.PI + .4, .38 * g, (s.ph * 10 | 0) % 3, s.hue, s.ph);
    leafAt(s.x + s.dir * L * .45, s.y - L * .5, s.dir > 0 ? -1.1 : Math.PI + 1.1, .3 * g, 1, s.hue, s.ph);
    gf.globalAlpha = 1;
  }
}

/* ---------- Zauberschlange ---------- */
var PR = { x: 0, y: 0, w: 0, h: 0, s: 1 };
function playTarget() {
  var s = PR.s, x = PR.x, y = PR.y, w = PR.w, h = PR.h;
  if (embedKind === 'spotify') return [x + w - 55 * s, y + (9 + .45 * 352) * s];
  if (embedKind === 'soundcloud') return [x + 45 * s, y + 45 * s];
  if (embedKind === 'youtube') return [x + w / 2, y + h / 2];
  return [x + 60 * s, y + h / 2];
}
function catmull(pts, per) {
  var out = [];
  for (var i = 0; i < pts.length - 1; i++) {
    var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (var j = 0; j < per; j++) {
      var t = j / per, t2 = t * t, t3 = t2 * t;
      out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function resample(poly, step) {
  var out = [poly[0]], acc = 0;
  for (var i = 1; i < poly.length; i++) {
    var a = poly[i - 1], b = poly[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), pos = step - acc;
    while (pos <= d) { var k = pos / d; out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); pos += step; }
    acc = d - (pos - step);
  }
  return out;
}
function drawSnake(t, u) {
  if (u <= 0 || W < 420) return;
  var tg = playTarget(), cxT = W - TW * .5, holeX = W - TW + 16, holeY = tg[1];
  var bx = Math.min(PR.x + PR.w + 28, holeX - 34);
  var pts = [[cxT + 10, -70], [cxT - 20, H * .1], [cxT + 18, H * .22], [cxT - 22, H * .34], [cxT + 14, Math.min(H * .46, holeY - 160)],
             [cxT - 26, holeY - 80], [bx - 26, holeY + 58], [bx - 16, holeY + 16], [bx, holeY + 1], [holeX, holeY - 2]];
  var U = resample(catmull(pts, 14), 3), n = U.length, Ls = Math.min(150, n * .55) | 0, tailVis = 17;
  var head = Math.round(u * (n - 1 + Ls - tailVis)), tail = head - Ls, i0 = Math.max(0, tail), i1 = Math.min(n - 1, head);
  // Loch im Baum
  var hg = gf.createRadialGradient(holeX + 3, holeY, 0, holeX + 3, holeY, 18);
  hg.addColorStop(0, '#000'); hg.addColorStop(.7, '#0d0703'); hg.addColorStop(1, 'rgba(40,22,10,.9)');
  gf.fillStyle = hg; gf.beginPath(); gf.ellipse(holeX + 3, holeY, 15, 11, -.2, 0, 6.2832); gf.fill();
  gf.strokeStyle = '#5a3a20'; gf.lineWidth = 3; gf.beginPath(); gf.ellipse(holeX + 3, holeY, 16, 12, -.2, 0, 6.2832); gf.stroke();
  if (i1 <= i0) return;
  function pt(i) {
    var p = U[i], q = U[Math.min(n - 1, i + 1)], r = U[Math.max(0, i - 1)], tx = q[0] - r[0], ty = q[1] - r[1], tl = Math.hypot(tx, ty) || 1;
    var tn = (i - tail) / Ls, wig = Math.sin(t * 3 + i * .22) * Math.pow(1 - clamp(tn, 0, 1), 2) * 4 + Math.sin(t * 1.6 + i * .08) * 1.5;
    return [p[0] - ty / tl * wig, p[1] + tx / tl * wig, tx / tl, ty / tl, tn];
  }
  function wid(tn) { return 1.4 + 12 * Math.pow(Math.sin(Math.min(tn, .9) / .9 * Math.PI * .5), .75); }
  var P = []; for (var i = i0; i <= i1; i++) P.push(pt(i));
  gf.lineCap = 'round';
  gf.globalCompositeOperation = 'lighter';
  for (i = 1; i < P.length; i += 2) { gf.strokeStyle = 'hsla(285,100%,62%,.09)'; gf.lineWidth = wid(P[i][4]) + 12; gf.beginPath(); gf.moveTo(P[i - 1][0], P[i - 1][1]); gf.lineTo(P[i][0], P[i][1]); gf.stroke(); }
  gf.globalCompositeOperation = 'source-over';
  for (i = 1; i < P.length; i++) {
    var a = P[i - 1], b = P[i], w = wid(b[4]), band = Math.sin((i0 + i) * .35);
    gf.strokeStyle = 'hsl(' + (274 + band * 10) + ',62%,' + (26 + band * 7) + '%)'; gf.lineWidth = w;
    gf.beginPath(); gf.moveTo(a[0], a[1]); gf.lineTo(b[0], b[1]); gf.stroke();
  }
  for (i = 1; i < P.length; i++) {   // Glanz & Schuppen
    var c = P[i - 1], d = P[i], w2 = wid(d[4]), ox = -d[3] * w2 * .22, oy = d[2] * w2 * .22;
    gf.strokeStyle = 'hsla(292,90%,72%,.32)'; gf.lineWidth = w2 * .3;
    gf.beginPath(); gf.moveTo(c[0] + ox, c[1] + oy); gf.lineTo(d[0] + ox, d[1] + oy); gf.stroke();
    if ((i0 + i) % 5 === 0 && w2 > 4) {
      gf.save(); gf.translate(d[0], d[1]); gf.rotate(Math.atan2(d[3], d[2]) + .785);
      gf.fillStyle = 'hsla(' + (300 + goldAmt * -250) + ',95%,78%,.35)'; gf.fillRect(-w2 * .17, -w2 * .17, w2 * .34, w2 * .34); gf.restore();
    }
  }
  if (head <= n - 1) {   // Kopf
    var h = P[P.length - 1], ang = Math.atan2(h[3], h[2]), hw = wid(.9);
    gf.save(); gf.translate(h[0], h[1]); gf.rotate(ang);
    if (Math.sin(t * 6.5) > .35) { gf.strokeStyle = '#d0213a'; gf.lineWidth = 1.3; gf.beginPath(); gf.moveTo(hw * 1.1, 0); gf.lineTo(hw * 2.1, 0); gf.lineTo(hw * 2.6, -3); gf.moveTo(hw * 2.1, 0); gf.lineTo(hw * 2.6, 3); gf.stroke(); }
    var hgd = gf.createRadialGradient(-2, -3, 0, 0, 0, hw * 1.4); hgd.addColorStop(0, '#9b5ad6'); hgd.addColorStop(1, '#3d1466');
    gf.fillStyle = hgd; gf.beginPath(); gf.ellipse(0, 0, hw * 1.3, hw * .85, 0, 0, 6.2832); gf.fill();
    [-1, 1].forEach(function (s) {
      gf.fillStyle = '#f2c14e'; gf.beginPath(); gf.ellipse(hw * .45, s * hw * .42, 2.8, 2.2, 0, 0, 6.2832); gf.fill();
      gf.fillStyle = '#120a02'; gf.beginPath(); gf.ellipse(hw * .45, s * hw * .42, .7, 2, 0, 0, 6.2832); gf.fill();
    });
    gf.restore();
  }
  // Vorderer Rand des Lochs über dem Körper
  gf.strokeStyle = '#6b4424'; gf.lineWidth = 3.5; gf.beginPath(); gf.ellipse(holeX + 3, holeY, 16, 12, -.2, Math.PI * .55, Math.PI * 1.45); gf.stroke();
  if (Math.random() < .5) { var sp = P[Math.random() * P.length | 0]; spores.push({ x: sp[0], y: sp[1], vx: (Math.random() - .5) * .6, vy: -.4 - Math.random() * .6, life: 1, h: 285 + Math.random() * 30, s: Math.random() * 1.4 + .5 }); }
}

/* ---------- Sporen & Goldregen ---------- */
var spores = [], glitter = [];
function drawSpores() {
  if (tips.length && Math.random() < .35 + bands.high) {
    var tp = tips[Math.random() * tips.length | 0];
    var dx = W / 2 - tp[0], dy = H / 2 - tp[1], d = Math.hypot(dx, dy) || 1;
    spores.push({ x: tp[0], y: tp[1], vx: dx / d * .6, vy: dy / d * .6, life: 1, h: mandHue + Math.random() * 60 - 30, s: Math.random() * 1.5 + .6, center: 1 });
  }
  if (spores.length > 220) spores.splice(0, spores.length - 220);
  gf.globalCompositeOperation = 'lighter';
  for (var i = spores.length - 1; i >= 0; i--) {
    var p = spores[i];
    if (p.center) { var dx = W / 2 - p.x, dy = H / 2 - p.y, d = Math.hypot(dx, dy) + 1; p.vx = dx / d * .8 - dy / d * .6; p.vy = dy / d * .8 + dx / d * .6; if (d < 20) p.life = 0; }
    p.x += p.vx; p.y += p.vy; p.life -= .005;
    if (p.life <= 0) { spores.splice(i, 1); continue; }
    gf.fillStyle = 'hsla(' + p.h + ',95%,70%,' + p.life * .6 + ')';
    gf.beginPath(); gf.arc(p.x, p.y, p.s * (1 + bands.high), 0, 6.2832); gf.fill();
  }
  gf.globalCompositeOperation = 'source-over';
}
function goldBurst() {
  goldAmt = 1;
  for (var i = 0; i < 520; i++) glitter.push({ x: Math.random() * W, y: -Math.random() * H * 1.2, vy: 1.2 + Math.random() * 3.2, vx: (Math.random() - .5) * .6, s: .6 + Math.random() * 2.2, ph: Math.random() * 6.28, h: 38 + Math.random() * 16 });
}
function drawGlitter(t) {
  if (!glitter.length) return;
  gf.globalCompositeOperation = 'lighter';
  for (var i = glitter.length - 1; i >= 0; i--) {
    var p = glitter[i]; p.y += p.vy; p.x += p.vx + Math.sin(t * 2 + p.ph) * .3;
    if (p.y > H + 10) { glitter.splice(i, 1); continue; }
    if (p.y < 0) continue;
    var tw = .45 + .55 * Math.abs(Math.sin(t * 7 + p.ph));
    gf.fillStyle = 'hsla(' + p.h + ',100%,' + (62 + tw * 20) + '%,' + (.35 + tw * .55) + ')';
    gf.beginPath(); gf.arc(p.x, p.y, p.s * tw, 0, 6.2832); gf.fill();
    if (p.s > 2) { gf.strokeStyle = 'hsla(' + p.h + ',100%,85%,' + tw * .5 + ')'; gf.lineWidth = .7; gf.beginPath(); gf.moveTo(p.x - p.s * 3, p.y); gf.lineTo(p.x + p.s * 3, p.y); gf.moveTo(p.x, p.y - p.s * 3); gf.lineTo(p.x, p.y + p.s * 3); gf.stroke(); }
  }
  gf.globalCompositeOperation = 'source-over';
}

/* ---------- Dschungel: Bananenblätter oben in den Ecken ---------- */
var BANANA = (function () {
  var c = mk(200, 560), g = c.getContext('2d');
  function mid(t) { return [100 + Math.sin(t * 2.6) * 26 * t, 8 + t * 540]; }
  g.save();
  for (var side = -1; side <= 1; side += 2) {
    g.beginPath(); var p0 = mid(0); g.moveTo(p0[0], p0[1]);
    for (var i = 0; i <= 40; i++) { var t = i / 40, p = mid(t), w = 78 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05 + .02)), .8); g.lineTo(p[0] + side * w, p[1] + w * .25); }
    for (i = 40; i >= 0; i--) { var q = mid(i / 40); g.lineTo(q[0], q[1]); }
    var lg = g.createLinearGradient(100 + side * 80, 0, 100, 0); lg.addColorStop(0, '#16300f'); lg.addColorStop(1, '#2f5a1c');
    g.fillStyle = lg; g.fill();
  }
  g.globalCompositeOperation = 'destination-out'; g.lineWidth = 2.4;
  for (var k = 0; k < 16; k++) {   // eingerissene Blattränder
    var tt = .12 + k * .053, pp = mid(tt), sd = k % 2 ? 1 : -1;
    g.beginPath(); g.moveTo(pp[0] + sd * 14, pp[1] + 4); g.lineTo(pp[0] + sd * 90, pp[1] + 30); g.stroke();
  }
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = '#5c7f3a'; g.lineWidth = 3; g.beginPath();
  for (i = 0; i <= 40; i++) { var m2 = mid(i / 40); i ? g.lineTo(m2[0], m2[1]) : g.moveTo(m2[0], m2[1]); } g.stroke();
  g.strokeStyle = 'rgba(160,200,120,.18)'; g.lineWidth = .8;
  for (i = 2; i < 40; i += 2) { var m3 = mid(i / 40); [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(m3[0], m3[1]); g.lineTo(m3[0] + sd * 70, m3[1] + 26); g.stroke(); }); }
  g.restore();
  return c;
})();
function drawJungle(t, grow, sway) {
  var g = smooth((grow - .3) * 2) * (.4 + MIX.vis * .6); if (g <= 0) return;
  var k = clamp(H / 900, .55, 1);
  [[TW * .3, 1, -.55], [W - TW * .3, -1, .55]].forEach(function (c, i) {
    gf.save(); gf.translate(c[0], -10); gf.scale(c[1] * k * g, k * g);
    gf.rotate(c[2] * c[1] + Math.sin(t * .35 + i * 2) * .04 * sway);
    gf.globalAlpha = .9; gf.drawImage(BANANA, -100, 0); gf.restore();
  });
  gf.globalAlpha = 1;
}

/* ---------- Baumstämme: Federn, Traumfänger, Neon-Runen ---------- */
var RUNES = (function () {
  var r = rnd(99), out = [];
  for (var i = 0; i < 9; i++) { var pts = [], x = 0, y = 0; for (var j = 0; j < 5; j++) { x += (r() - .5) * 18; y += 6 + r() * 12; pts.push([clamp(x, -12, 12), y]); } out.push({ y: .08 + i * .1 + r() * .04, pts: pts, side: i % 2, hue: r() < .5 ? 188 : 312 }); }
  return out;
})();
function drawTrunks(t, awake) {
  var xs = [TW * .42, W - TW * .42];
  // Neon-Runen (Cyber-Ninja), eine Lichtwelle wandert den Stamm hoch
  gf.globalCompositeOperation = 'lighter'; gf.lineWidth = 1.3; gf.lineCap = 'round';
  RUNES.forEach(function (rn) {
    var x = xs[rn.side], y = rn.y * H, wave = Math.max(0, 1 - Math.abs(((t * .12 + rn.y) % 1.2) - .6) * 5);
    var a = (.12 + wave * .7 + bands.bass * .15) * (.4 + MIX.vis * .6);
    gf.strokeStyle = 'hsla(' + lerp(rn.hue, 44, goldAmt) + ',100%,65%,' + a + ')';
    gf.beginPath(); rn.pts.forEach(function (p, j) { j ? gf.lineTo(x + p[0], y + p[1]) : gf.moveTo(x + p[0], y + p[1]); }); gf.stroke();
  });
  gf.globalCompositeOperation = 'source-over';
  // festgebundene Federn und ein kleiner Traumfänger am Stamm
  [[0, .31, SPR.feather, .55], [1, .5, SPR.feather, .5], [0, .66, SPR.feather, .45], [1, .22, SPR.dream, .32], [0, .44, SPR.dream, .28]].forEach(function (d, i) {
    if (i > 1 && awake < .05) return;
    var x = xs[d[0]] + (d[0] ? -8 : 8), y = d[1] * H, sw = Math.sin(t * .7 + i * 1.9) * .12, rot = Math.cos(t * .3 + i);
    gf.globalAlpha = i > 1 ? awake : 1;
    gf.strokeStyle = '#8a6a40'; gf.lineWidth = 2;
    for (var w = 0; w < 3; w++) { gf.beginPath(); gf.moveTo(xs[d[0]] - 12, y - 4 + w * 3); gf.lineTo(xs[d[0]] + 12, y - 2 + w * 3); gf.stroke(); }
    gf.save(); gf.translate(x, y); gf.rotate(sw); gf.scale(Math.sign(rot || 1) * Math.max(.2, Math.abs(rot)) * d[3], d[3]);
    gf.drawImage(d[2].c, -d[2].px, -d[2].py); gf.restore();
  });
  gf.globalAlpha = 1;
}

/* ---------- Über der Trommel: gelegentlich rankt eine Pflanze drüber ---------- */
var co = $('vr-over'), go = co.getContext('2d'), DR = { x: 0, y: 0, s: 1 }, drumVines = [];
function drawOver(t, dt) {
  go.setTransform(DPR, 0, 0, DPR, 0, 0); go.clearRect(0, 0, W, H);
  var r = 100 * DR.s, cx = DR.x + r, cy = DR.y + r;
  if (Math.abs(svVel) > .3 && drumVines.length < 2 && Math.random() < .01 * MIX.vis) drumVines.push({ t0: t, a0: Math.random() * 6.28, dir: Math.random() < .5 ? 1 : -1, hue: mandHue });
  drumVines = drumVines.filter(function (v) {
    var age = t - v.t0; if (age > 14) return false;
    var g = smooth(age / 4) * (1 - smooth((age - 10) / 4)), n = 26, L = g * 1.6;
    go.lineCap = 'round'; go.strokeStyle = '#2c3a1c'; go.lineWidth = 2.2 * DR.s + .6;
    go.beginPath();
    for (var i = 0; i <= n; i++) { var a = v.a0 + v.dir * L * i / n * 3.2, rr = r * (1.02 + Math.sin(i * .9 + age) * .04); var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? go.lineTo(x, y) : go.moveTo(x, y); }
    go.stroke();
    for (i = 3; i <= n * g; i += 4) {
      var aa = v.a0 + v.dir * L * i / n * 3.2, lx = cx + Math.cos(aa) * r * 1.03, ly = cy + Math.sin(aa) * r * 1.03;
      go.save(); go.translate(lx, ly); go.rotate(aa + v.dir * 1.2); go.scale(.22 * DR.s + .08, .22 * DR.s + .08); go.drawImage(LEAVES[i % 3], 0, -20); go.restore();
    }
    return true;
  });
}

/* ---------- Beat-Anzeige: wie sehr man im Takt scrollt ---------- */
var BEAT = { score: 0, lastImp: 0, flash: 0 };
function beatImpulse() {
  var n = performance.now(); if (n - BEAT.lastImp < 140) return; BEAT.lastImp = n;
  var ph = beatPhase(n), err = Math.min(ph, 1 - ph) * 2;       // 0 = genau auf dem Schlag, 1 = genau dazwischen
  BEAT.score = BEAT.score * .82 + (1 - err) * .18; BEAT.flash = 1;
}
window.addEventListener('wheel', beatImpulse, { passive: true, capture: true });
window.addEventListener('touchmove', beatImpulse, { passive: true, capture: true });
var meterEl = $('vr-meter'), meterSegs = [];
for (var mi = 0; mi < 14; mi++) { var sg = document.createElement('i'); meterEl.appendChild(sg); meterSegs.push(sg); }
var meterDot = document.createElement('b'); meterEl.appendChild(meterDot);
function drawMeter(dt) {
  BEAT.score = Math.max(0, BEAT.score - dt * .03); BEAT.flash = Math.max(0, BEAT.flash - dt * 3);
  var lit = Math.round(BEAT.score * meterSegs.length);
  meterSegs.forEach(function (sg, i) { var on = (meterSegs.length - 1 - i) < lit; sg.className = on ? (i < 3 ? 'hot' : i < 7 ? 'warm' : 'on') : ''; });
  var ph = beatPhase(); meterDot.style.opacity = .25 + Math.pow(1 - ph, 6) * .75; meterDot.style.transform = 'scale(' + (1 + Math.pow(1 - ph, 8) * .6 + BEAT.flash * .3) + ')';
}

/* ---------- Player & Trommel andocken ---------- */
var titleEl = $('vr-title'), hintEl = $('vr-hint'), drumCtl = $('vr-drumctl');
function layoutDock() {
  var pw = pwrap.offsetWidth, ph = pwrap.offsetHeight || 380, DW = 200, DH = drumEl.offsetHeight || 290, narrow = W < 640, s = svS;
  var sA = clamp((H - 150 - DH * .85) / ph, .5, 1);
  var A = { px: (W - pw * sA) / 2, py: 92, ps: sA, dx: (W - DW * .85) / 2, dy: 92 + ph * sA + 12, ds: .85 };
  var sB = clamp((W - 2 * TW - 90 - DW * .8) / pw, .45, .85);
  var tot = DW * .8 + 20 + pw * sB, l0 = (W - tot) / 2;
  var B = narrow ? A : { px: l0 + DW * .8 + 20, py: H * .5 - ph * sB / 2, ps: sB, dx: l0, dy: H * .5 - DW * .8 / 2, ds: .8 };
  var sC = Math.min(narrow ? clamp((W - 24) / pw, .4, .62) : clamp(330 / pw, .4, .6), (H * .4) / ph), cw = pw * sC, chh = ph * sC;
  var C = narrow ? { px: (W - cw) / 2, py: H - chh - 12, ps: sC, dx: 12, dy: H - chh - 12 - 92 * .5 - 8, ds: .46 }
                 : { px: W - TW - 120 - cw, py: H - chh - 14, ps: sC, dx: W - TW - 120 - cw - 92 * .96 - 10, dy: H - 92 * .96 - 14, ds: .46 };
  if (window.vrDockC) C = window.vrDockC(pw, ph, C) || C;   // breite Ansicht: Player wandert unten in „Meine Liste“
  var k1 = smooth(s / .7), k2 = smooth((s - .7) / .65), F = {};
  ['px', 'py', 'ps', 'dx', 'dy', 'ds'].forEach(function (key) { F[key] = s < .7 ? lerp(A[key], B[key], k1) : lerp(B[key], C[key], k2); });
  pwrap.style.transform = 'translate(' + F.px + 'px,' + F.py + 'px) scale(' + F.ps + ')';
  drumEl.style.transform = 'translate(' + F.dx + 'px,' + F.dy + 'px) scale(' + F.ds + ')';
  var ctlA = 1 - smooth((s - .85) / .3);
  drumCtl.style.opacity = ctlA; drumCtl.style.pointerEvents = ctlA < .5 ? 'none' : 'auto';
  PR = { x: F.px, y: F.py, w: pw * F.ps, h: ph * F.ps, s: F.ps }; DR = { x: F.dx, y: F.dy, s: F.ds };
  titleEl.style.opacity = (1 - smooth(s / .3)) * titleAwake;
  titleEl.style.filter = titleAwake < .98 ? 'blur(' + ((1 - titleAwake) * 14).toFixed(1) + 'px)' : 'none';
  titleEl.style.letterSpacing = titleAwake < .98 ? (1 - titleAwake) * .4 + 'em' : '';
  hintEl.style.display = s > .08 ? 'none' : '';
  treeL.style.backgroundPositionY = (-s * 70) + 'px'; treeR.style.backgroundPositionY = (-s * 50) + 'px';
}

/* ---------- Hauptschleife ---------- */
var dreamAmt = 0, dreamT = 0, phi0 = 0, clock = 0, spinAcc = 0, last = performance.now(), svPrev = 0, visible = true, mandHue = 187, titleAwake = 1, awake = 1;
if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(root);
var visualsPaused = false;
function frame(now) {
  requestAnimationFrame(frame);
  if (!visible || document.hidden || visualsPaused) { last = now; return; }
  var dt = Math.min(.05, (now - last) / 1000); last = now;
  readScroll();
  svVel = svVel * .8 + ((sv - svPrev) / Math.max(dt, .001)) * .2; svPrev = sv;
  svS += (sv - svS) * .1;
  var idleS = (now - lastInput) / 1000, idle = idleS > IDLE_MS / 1000;
  dreamAmt += ((idle ? 1 : 0) - dreamAmt) * (idle ? .01 : .05);
  titleAwake = 1 - smooth((idleS - 8) / 3);                  // Überschrift löst sich in der Ruhe auf
  awake += ((idleS > 10 ? 0 : 1) - awake) * .02;              // Glockenspiel & Anhänger ziehen sich zurück
  chimeAlpha = Math.max(awake, clamp(Math.abs(svVel) * 3, 0, 1), svS > .05 ? .85 : 0);
  var jp = clamp(svS / Math.max(2.5, svMax * .8), 0, 1);
  if (!idle && dreamAmt < .01) { dreamT = 0; phi0 = Math.acos(1 - 2 * jp); }
  dreamT += dt * dreamAmt;
  // ruhig und langsam – außer Tempo-Sync ist an, dann atmet alles im Takt des Songs
  var speed = MIX.sync ? clamp(TEMPO.bpm / 90, .5, 1.6) : .55;
  clock += dt * (reduced ? .3 : 1) * speed * (1 + dreamAmt * .4);
  var t = clock, pv = jp * (1 - dreamAmt) + dreamAmt * (.5 - .5 * Math.cos(dreamT * .08 + phi0));
  goldAmt = Math.max(0, goldAmt - dt / 9); $('vr-goldwash').style.opacity = goldAmt * .9;
  sampleAudio(t);
  drawEnergy(t);
  drawSky(t);
  var only = MIX.vis < .06;   // Regler ganz unten: nur Universum / Himmel
  gm.setTransform(DPR, 0, 0, DPR, 0, 0); gm.clearRect(0, 0, W, H);
  gm.globalCompositeOperation = 'lighter';
  if (!only) drawAurora(t);
  spinAcc += dt * (MIX.sync ? TEMPO.bpm / 60 * .025 : .018 + bands.level * .03 + dreamAmt * .02) * (reduced ? .3 : 1);
  var form = mixForm(pv), base = .5 + pv * .35; mandHue = form.hue;
  if (!only) drawMandala(t, pv, form, .75 + pv * .5 + bands.bass * .05, base, spinAcc, MIX.vis > .35);
  if (MIX.vis > .4) drawMandala(t, pv + .5, mixForm(Math.min(1, pv + .18)), .42 + pv * .8, base * (.25 + form.k * .45), -spinAcc * 1.4, false);
  if (MIX.vis > .75) drawMandala(t, pv + .25, mixForm(Math.max(0, pv - .2)), .2 + pv * .3, base * .5, spinAcc * 2.2, false);
  if (!only) drawSpirit(t, dreamAmt, lerp(form.hue, 44, goldAmt));
  layoutDock();
  gf.setTransform(DPR, 0, 0, DPR, 0, 0); gf.globalCompositeOperation = 'source-over'; gf.clearRect(0, 0, W, H);
  var vg = gf.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75);
  vg.addColorStop(0, 'rgba(2,5,9,0)'); vg.addColorStop(1, 'rgba(2,5,9,.72)'); gf.fillStyle = vg; gf.fillRect(0, 0, W, H);
  var grow = (.45 + pv * .55) * (.7 + MIX.vis * .3), sway = 1 + dreamAmt * 1.2, S2 = Math.min(W, H), hue = lerp(form.hue, 44, goldAmt);
  tips.length = 0;
  drawJungle(t, grow, sway);
  if (!only) TREES.forEach(function (T) { drawBranch(T, T.root, T.x ? (T.x === 1 ? W - TW * .55 : T.x * W) : TW * .55, T.y * H, T.ang, grow, t, sway, (pv - .5) * 2, hue, S2 * T.len); });
  drawTrunks(t, awake);
  drawFerns(t, grow, sway);
  drawPendants(t, grow, sway, awake);
  drawChime(t, dt, dreamAmt, chimeAlpha);
  drawSnake(t, smooth((svS - 1.3) / 1.2));
  drawSeeds(t, dt);
  drawSpores();
  drawGlitter(t);
  drawOver(t, dt);
  drawMeter(dt);
  afterFrame.forEach(function (f) { f(t, dt); });
}
