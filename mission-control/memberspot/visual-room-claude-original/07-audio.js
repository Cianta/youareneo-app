
/* =====================================================================
   KLANG-MASCHINE: Taktgeber, Instrumente, Trommeln, Samples, MIDI
   Alle Standardklänge werden live erzeugt (keine Dateien nötig);
   hochgeladene Samples (mp3/wav) ersetzen sie pro Instrument.
   ===================================================================== */
var studioOut = null, reverbSend = null;
function studioBus() {
  var c = ctx();
  if (!studioOut) {
    studioOut = c.createGain(); studioOut.gain.value = VOL.studio;
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    studioOut.connect(comp); comp.connect(master);
    // weicher Hall aus erzeugter Impulsantwort
    var conv = c.createConvolver(), len = c.sampleRate * 2.8 | 0, ir = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    conv.buffer = ir; reverbSend = c.createGain(); reverbSend.gain.value = .32; reverbSend.connect(conv); conv.connect(studioOut);
  }
  return studioOut;
}
function voiceOut(dry, wet) {
  var c = ctx(), g = c.createGain(); g.gain.value = dry == null ? 1 : dry; g.connect(studioBus());
  if (wet) { var w = c.createGain(); w.gain.value = wet; g.connect(w); w.connect(reverbSend); }
  return g;
}
var ROOT = 73.42;                               // D2 – ruhige Grundstimmung
var PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34, 36];   // d-Moll-Pentatonik
function hz(deg, oct) { return ROOT * Math.pow(2, (PENTA[((deg % 5) + 5) % 5] + 12 * (Math.floor(deg / 5) + (oct || 0))) / 12); }
function midiHz(n) { return 440 * Math.pow(2, (n - 69) / 12); }
function noiseBuf(sec) {
  var c = ctx(), len = c.sampleRate * sec | 0, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; return b;
}
var NOISE = null;
function noise(t, dur, dest, f, q, type, gain) {
  var c = ctx(); if (!NOISE) NOISE = noiseBuf(2);
  var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = NOISE; fl.type = type || 'bandpass'; fl.frequency.value = f || 1000; fl.Q.value = q || 1;
  g.gain.setValueAtTime(gain || .3, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + .05);
}
function env(g, t, a, peak, rel, dur) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + dur, rel); }

/* ---------- Stimmen ---------- */
var VOICES = {
  // gezupfte Saite (Karplus-Strong mit Rückkopplungs-Delay)
  pluck: function (t, f, vel, dest) {
    var c = ctx(), d = c.createDelay(.05), fb = c.createGain(), lp = c.createBiquadFilter(), out = c.createGain();
    d.delayTime.value = 1 / f; fb.gain.value = .985; lp.type = 'lowpass'; lp.frequency.value = 3200;
    d.connect(lp); lp.connect(fb); fb.connect(d); d.connect(out);
    out.gain.setValueAtTime(.5 * vel, t); out.gain.setTargetAtTime(0, t + 1.2, .6); out.connect(dest);
    var s = c.createBufferSource(); if (!NOISE) NOISE = noiseBuf(2); s.buffer = NOISE;
    var bg = c.createGain(); bg.gain.setValueAtTime(.6, t); bg.gain.setValueAtTime(0, t + 1 / f * 2);
    s.connect(bg); bg.connect(d); s.start(t, Math.random()); s.stop(t + .05);
    setTimeout(function () { try { fb.disconnect(); } catch (e) {} }, (t - c.currentTime + 4) * 1000);
  },
  flute: function (t, f, vel, dest, dur) {
    var c = ctx(), o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2;
    lfo.frequency.value = 5.2; lg.gain.value = f * .006; lfo.connect(lg); lg.connect(o.frequency);
    var g2 = c.createGain(); g2.gain.value = .12; o2.connect(g2); g2.connect(g); o.connect(g);
    env(g, t, .09, .22 * vel, .25, dur || .6); g.connect(dest);
    noise(t, .25, dest, f * 2, 3, 'bandpass', .05 * vel);
    [o, o2, lfo].forEach(function (x) { x.start(t); x.stop(t + (dur || .6) + 1.4); });
  },
  bow: function (t, f, vel, dest, dur, dark) {   // Geige / Cello
    var c = ctx(), o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.003;
    lfo.frequency.value = 5.5; lg.gain.value = f * .008; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    lp.type = 'lowpass'; lp.frequency.value = dark ? 900 : 2600; lp.Q.value = .7;
    o.connect(lp); o2.connect(lp); lp.connect(g); env(g, t, dark ? .35 : .22, (dark ? .16 : .1) * vel, .5, dur || 1.4); g.connect(dest);
    [o, o2, lfo].forEach(function (x) { x.start(t); x.stop(t + (dur || 1.4) + 3); });
  },
  pad: function (t, f, vel, dest, dur) {
    var c = ctx(), lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(1600, t + (dur || 3) * .6); lp.Q.value = 2;
    [0, 7, 12, 15].forEach(function (semi, i) {
      [-.006, .006].forEach(function (det) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * Math.pow(2, semi / 12) * (1 + det); o.connect(lp); o.start(t); o.stop(t + (dur || 3) + 4); });
    });
    lp.connect(g); env(g, t, 1.2, .045 * vel, 1.5, dur || 3); g.connect(dest);
  },
  keys: function (t, f, vel, dest, dur) {   // weiches E-Piano mit Tremolo
    var c = ctx(), g = c.createGain(), trem = c.createOscillator(), tg = c.createGain();
    trem.frequency.value = 4.5; tg.gain.value = .25; trem.connect(tg); tg.connect(g.gain);
    [f, f * 1.5, f * 2].forEach(function (x, i) { var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = x; var og = c.createGain(); og.gain.value = [1, .25, .35][i]; o.connect(og); og.connect(g); o.start(t); o.stop(t + (dur || 2) + 2); });
    env(g, t, .01, .16 * vel, .7, dur || 2); g.connect(dest); trem.start(t); trem.stop(t + (dur || 2) + 2);
  },
  sub: function (t, f, vel, dest) { var c = ctx(), o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f * 2, t); o.frequency.exponentialRampToValueAtTime(f, t + .08); env(g, t, .005, .5 * vel, .12, .15); o.connect(g); g.connect(dest); o.start(t); o.stop(t + .8); },
  hat: function (t, f, vel, dest) { noise(t, .06, dest, 8000, .8, 'highpass', .12 * vel); },
  crackle: function (t, f, vel, dest) { for (var i = 0; i < 6; i++) noise(t + Math.random() * .4, .012, dest, 2500 + Math.random() * 3000, 4, 'bandpass', .05 * vel); },
  frame: function (t, f, vel, dest) {   // Rahmentrommel: Tonhöhe fällt, Fell-Rauschen
    var c = ctx(), o = c.createOscillator(), g = c.createGain(); f = f || 110;
    o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f * .55, t + .35);
    env(g, t, .003, .7 * vel, .22, .05); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 1.2);
    noise(t, .18, dest, 380, 1.2, 'bandpass', .35 * vel);
  },
  rim: function (t, f, vel, dest) { noise(t, .05, dest, 2200, 6, 'bandpass', .35 * vel); VOICES.sub(t, 330, .2 * vel, dest); },
  shaker: function (t, f, vel, dest) { noise(t, .09, dest, 6500, 1.5, 'highpass', .14 * vel); },
  bowl: function (t, f, vel, dest) {   // Klangschale
    var c = ctx(); f = f || 220;
    [[1, .5, 6], [2.71, .22, 4], [5.1, .1, 2.4]].forEach(function (p) { var o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * p[0]; env(g, t, .01, p[1] * vel * .3, p[2] / 3, .02); o.connect(g); g.connect(dest); o.start(t); o.stop(t + p[2] + 1); });
  },
  chime: function (t, f, vel, dest) { chimeNote(Math.random() * 6 | 0, vel, dest, t); },
  gong: function (t, f, vel, dest) { strike(t, .3 * vel, 98, .8, dest); }
};

/* ---------- Instrumente am Lagerfeuer + Studio-Spuren ---------- */
// pat: Schrittmuster (16tel); n: Tonstufe der Pentatonik; hochgeladene Samples ersetzen die Stimme
var INSTR = [
  { id: 'guitar',  name: 'Gitarre',      ico: '🎸', voice: 'pluck', oct: 1, wet: .3, pat: [0, null, 2, null, 4, null, 2, null, 1, null, 3, null, 5, null, 3, null] },
  { id: 'flute',   name: 'Flöte',        ico: '🪈', voice: 'flute', oct: 3, wet: .5, pat: [4, null, null, null, null, null, 3, null, 2, null, null, null, null, null, null, null], dur: .9 },
  { id: 'violin',  name: 'Geige',        ico: '🎻', voice: 'bow',   oct: 3, wet: .5, pat: [2, null, null, null, null, null, null, null, 4, null, null, null, null, null, null, null], dur: 1.6 },
  { id: 'cello',   name: 'Cello',        ico: '🎼', voice: 'bow',   oct: 0, wet: .4, dark: 1, pat: [0, null, null, null, null, null, null, null, null, null, null, null, -1, null, null, null], dur: 2.4 },
  { id: 'dj',      name: 'DJ-Pult',      ico: '🎛', voice: 'sub',   oct: -1, wet: 0, pat: [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null], hat: 1 },
  { id: 'vinyl',   name: 'Plattenspieler', ico: '💿', voice: 'keys', oct: 2, wet: .3, pat: [0, null, null, null, null, null, null, null, 3, null, null, null, null, null, null, null], dur: 2, crackle: 1 },
  { id: 'synth',   name: 'Synthesizer',  ico: '🎹', voice: 'pad',   oct: 1, wet: .5, pat: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], dur: 3.6, everyBar: 2 },
  { id: 'chimes',  name: 'Glockenspiel', ico: '🔔', voice: 'chime', oct: 3, wet: .4, pat: [null, null, 1, null, null, null, null, null, null, null, 3, null, null, null, 4, null] }
];
INSTR.forEach(function (it) { it.on = false; it.vol = .8; it.sample = null; it.buffer = null; });
var DRUMS = [
  { id: 'low',    name: 'Trommel tief', ico: '⬤', voice: 'frame',  f: 78 },
  { id: 'high',   name: 'Trommel hoch', ico: '●', voice: 'frame',  f: 150 },
  { id: 'rim',    name: 'Rand',         ico: '◌', voice: 'rim' },
  { id: 'shaker', name: 'Rassel',       ico: '∴', voice: 'shaker' },
  { id: 'bowl',   name: 'Klangschale',  ico: '◡', voice: 'bowl', f: 220 },
  { id: 'gong',   name: 'Gong',         ico: '◎', voice: 'gong' }
];
var SEQ = { on: false, drumsOn: true, meter: [4, 4], steps: 16, grid: {}, step: 0, nextTime: 0, timer: null, bar: 0 };
function stepsFor(m) { return m[0] * (16 / m[1]); }
function resetGrid() {
  SEQ.steps = stepsFor(SEQ.meter);
  DRUMS.forEach(function (d) { var old = SEQ.grid[d.id] || []; SEQ.grid[d.id] = []; for (var i = 0; i < SEQ.steps; i++) SEQ.grid[d.id][i] = !!old[i]; d.on = d.on !== false; });
}
resetGrid();
// ruhiger Grundschlag als Startmuster
(function () { var g = SEQ.grid; g.low[0] = true; g.low[8] = true; g.high[12] = true; g.shaker[4] = g.shaker[12] = true; })();

/* ---------- Samples laden ---------- */
var bufCache = {};
function loadBuffer(url) {
  if (bufCache[url]) return bufCache[url];
  return (bufCache[url] = fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (ab) { return new Promise(function (res, rej) { ctx().decodeAudioData(ab, res, rej); }); }));
}
function playBuffer(buf, t, vel, dest, rate) {
  var c = ctx(), s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; s.playbackRate.value = rate || 1;
  g.gain.value = vel; s.connect(g); g.connect(dest); s.start(t); return s;
}
function assignSample(inst, sample) {
  inst.sample = sample || null; inst.buffer = null;
  if (!sample) return Promise.resolve();
  return loadBuffer(sample.wav_url || sample.mp3_url).then(function (b) { inst.buffer = b; }).catch(function () { inst.sample = null; toast('Sample konnte nicht geladen werden.'); });
}

/* ---------- Spielen ---------- */
function playInst(inst, t, deg, vel) {
  var dest = voiceOut(inst.vol, inst.wet);
  if (inst.buffer) { playBuffer(inst.buffer, t, vel * .9, dest, deg == null ? 1 : Math.pow(2, (PENTA[((deg % 5) + 5) % 5]) / 12)); return; }
  var f = hz(deg || 0, inst.oct), v = VOICES[inst.voice];
  v(t, f, vel, dest, inst.dur, inst.dark);
}
function playDrum(d, t, vel) {
  var dest = voiceOut(d.vol == null ? .9 : d.vol, .15);
  if (d.buffer) { playBuffer(d.buffer, t, vel, dest); return; }
  VOICES[d.voice](t, d.f, vel, dest);
}
function scheduleStep(step, t) {
  var spb = 60 / TEMPO.bpm / 4;
  INSTR.forEach(function (inst) {
    if (!inst.on) return;
    var p = inst.pat, idx = step % p.length, deg = p[idx];
    if (inst.everyBar && (SEQ.bar % inst.everyBar) !== 0) deg = null;
    if (deg != null) playInst(inst, t, deg + (SEQ.bar % 4 === 3 && inst.id === 'guitar' ? 1 : 0), .8);
    if (inst.hat && idx % 4 === 2) VOICES.hat(t, 0, .7, voiceOut(inst.vol * .6));
    if (inst.crackle && idx % 8 === 0) VOICES.crackle(t, 0, .6, voiceOut(inst.vol * .5));
  });
  if (SEQ.on && SEQ.drumsOn) DRUMS.forEach(function (d) { if (d.on !== false && SEQ.grid[d.id][step]) playDrum(d, t, step % 4 === 0 ? 1 : .7); });
  var delay = Math.max(0, (t - ctx().currentTime) * 1000);
  setTimeout(function () { onStep.forEach(function (f) { f(step); }); }, delay);
  midiClock(t, spb);
}
var onStep = [];
function anyPlaying() { return SEQ.on || INSTR.some(function (i) { return i.on; }); }
function schedTick() {
  var c = ctx(), spb = 60 / TEMPO.bpm / 4;
  while (SEQ.nextTime < c.currentTime + .12) {
    scheduleStep(SEQ.step, SEQ.nextTime);
    SEQ.nextTime += spb; SEQ.step = (SEQ.step + 1) % SEQ.steps; if (SEQ.step === 0) SEQ.bar++;
  }
}
function ensureClock() {
  if (anyPlaying()) {
    if (!SEQ.timer) {
      var c = ctx(); SEQ.nextTime = c.currentTime + .06; SEQ.step = 0; SEQ.bar = 0;
      TEMPO.origin = performance.now() + 60;   // Beat-Anzeige & Visuals auf den Studio-Takt legen
      SEQ.timer = setInterval(schedTick, 25); midiStart();
    }
  } else if (SEQ.timer) { clearInterval(SEQ.timer); SEQ.timer = null; midiStop(); }
}
window.vrStudio = {
  play: function () { SEQ.on = true; ensureClock(); studioPaint(); },
  stop: function () { SEQ.on = false; INSTR.forEach(function (i) { i.on = false; }); ensureClock(); studioPaint(); worldPaint(); },
  restart: function () { if (SEQ.timer) { clearInterval(SEQ.timer); SEQ.timer = null; } SEQ.on = true; ensureClock(); studioPaint(); },
  volume: function (v) { if (studioOut) studioOut.gain.setTargetAtTime(v, actx.currentTime, .05); }
};
function studioPaint() { if (window.vrStudioPaint) window.vrStudioPaint(); }
function worldPaint() { if (window.vrWorldPaint) window.vrWorldPaint(); }

/* ---------- MIDI: Keyboard spielen, Clock & Start/Stop senden ---------- */
var MIDI = { access: null, inputs: [], outputs: [], outOn: {}, inst: 'synth', clockOut: true };
function midiInit() {
  if (!navigator.requestMIDIAccess) return Promise.reject(new Error('Dein Browser kann kein MIDI (Chrome oder Edge nutzen).'));
  return navigator.requestMIDIAccess({ sysex: false }).then(function (acc) {
    MIDI.access = acc;
    function scan() {
      MIDI.inputs = []; MIDI.outputs = [];
      acc.inputs.forEach(function (inp) { MIDI.inputs.push(inp); inp.onmidimessage = midiIn; });
      acc.outputs.forEach(function (o) { MIDI.outputs.push(o); if (MIDI.outOn[o.id] == null) MIDI.outOn[o.id] = true; });
      studioPaint();
    }
    acc.onstatechange = scan; scan();
  });
}
function midiIn(e) {
  var d = e.data, cmd = d[0] & 0xf0, note = d[1], vel = d[2];
  if (d[0] === 0xFA) { window.vrStudio.play(); return; }         // Start von außen
  if (d[0] === 0xFC) { window.vrStudio.stop(); return; }
  if (cmd === 0x90 && vel > 0) {
    var inst = INSTR.filter(function (i) { return i.id === MIDI.inst; })[0] || INSTR[6], c = ctx(), dest = voiceOut(inst.vol, inst.wet);
    if (inst.buffer) playBuffer(inst.buffer, c.currentTime, vel / 127, dest, Math.pow(2, (note - 62) / 12));
    else VOICES[inst.voice](c.currentTime, midiHz(note), vel / 127, dest, inst.dur, inst.dark);
    beatImpulse();
  }
}
var midiTick = 0;
function midiSend(bytes, t) {
  if (!MIDI.access) return;
  var ts = performance.now() + Math.max(0, (t - ctx().currentTime) * 1000);
  MIDI.outputs.forEach(function (o) { if (MIDI.outOn[o.id]) try { o.send(bytes, t == null ? undefined : ts); } catch (e) {} });
}
function midiClock(t, spb) {           // 24 Takte je Viertel = 6 je 16tel
  if (!MIDI.access || !MIDI.clockOut) return;
  for (var i = 0; i < 6; i++) midiSend([0xF8], t + spb * i / 6);
}
function midiStart() { if (MIDI.access && MIDI.clockOut) midiSend([0xFA]); }
function midiStop() { if (MIDI.access && MIDI.clockOut) midiSend([0xFC]); }
