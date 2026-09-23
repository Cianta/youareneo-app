/* ---------- Meditationsklang ----------
   Vorrang: eigene Meditationsmusik aus ks_settings.meditation_audio.
   Sonst ein erzeugter Klangteppich (Grundton + Quinte + sanftes Rauschen) – läuft ohne Datei. */
var actx = null, drone = null, medAudio = null, soundOn = store('ks_medsound') !== 'off';
function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function bowl(delay) {
  // Klangschale: ein paar unharmonische Obertöne mit langem Ausklang
  var c = ctx(), t0 = c.currentTime + (delay || 0), out = c.createGain(); out.gain.value = .22; out.connect(c.destination);
  [[220, 1], [528, .5], [843, .3], [1204, .16]].forEach(function (p) {
    var o = c.createOscillator(), gn = c.createGain(); o.frequency.value = p[0]; o.connect(gn); gn.connect(out);
    gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(p[1], t0 + .02); gn.gain.exponentialRampToValueAtTime(.0001, t0 + 7);
    o.start(t0); o.stop(t0 + 7.2);
  });
}
function startSound() {
  if (!soundOn) return;
  var url = safeUrl(S.settings.meditation_audio);
  if (url) {
    medAudio = medAudio || new Audio(url); medAudio.loop = true; medAudio.volume = 0; medAudio.play().catch(function () {});
    var k = 0, iv = setInterval(function () { k += .05; medAudio.volume = Math.min(.7, k); if (k >= .7) clearInterval(iv); }, 150);
    return;
  }
  var c = ctx(), out = c.createGain(); out.gain.value = 0; out.connect(c.destination);
  out.gain.linearRampToValueAtTime(.18, c.currentTime + 4);
  var nodes = [];
  [136.1, 204.15, 272.2].forEach(function (f, i) {
    var o = c.createOscillator(), gn = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; gn.gain.value = i ? .25 : .5;
    l.frequency.value = .05 + i * .03; lg.gain.value = .15; l.connect(lg); lg.connect(gn.gain);
    o.connect(gn); gn.connect(out); o.start(); l.start(); nodes.push(o, l);
  });
  // Meeresrauschen: gefiltertes Rauschen mit langsamer Welle (10 s = ein Atemzug)
  var buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  var n = c.createBufferSource(); n.buffer = buf; n.loop = true;
  var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
  var ng = c.createGain(); ng.gain.value = .05; var w = c.createOscillator(), wg = c.createGain(); w.frequency.value = .1; wg.gain.value = .04; w.connect(wg); wg.connect(ng.gain);
  n.connect(lp); lp.connect(ng); ng.connect(out); n.start(); w.start(); nodes.push(n, w);
  drone = { out: out, nodes: nodes };
  bowl(.3);
}
function stopSound() {
  if (medAudio) { var a = medAudio, iv = setInterval(function () { a.volume = Math.max(0, a.volume - .05); if (a.volume <= 0) { clearInterval(iv); a.pause(); } }, 120); }
  if (drone) {
    var c = ctx(), dn = drone; drone = null;
    dn.out.gain.cancelScheduledValues(c.currentTime); dn.out.gain.setValueAtTime(dn.out.gain.value, c.currentTime); dn.out.gain.linearRampToValueAtTime(0, c.currentTime + 3);
    setTimeout(function () { dn.nodes.forEach(function (x) { try { x.stop(); } catch (e) {} }); dn.out.disconnect(); }, 3200);
  }
}
$('ks-med-snd').onclick = function () {
  soundOn = !soundOn; store('ks_medsound', soundOn ? 'on' : 'off');
  this.textContent = soundOn ? '♫ Klang an' : '♫ Klang aus'; this.classList.toggle('on', soundOn);
  soundOn ? startSound() : stopSound();
};

/* ---------- Meditation: nach dem Film (10 Min) und in der Fokus-Pause (5 Min) ---------- */
var med = null;
function startMeditation(reason) {
  if (med) return;
  var min = reason === 'focus' ? KS_CONFIG.focusBreak : KS_CONFIG.medMinutes, end = Date.now() + min * 60000;
  var lightBefore = S.prefs.light;
  if (!lightBefore || lightBefore === 'aus') setLight(reason === 'focus' ? 'wald' : 'kristall');
  $('ks-med-k').textContent = reason === 'focus' ? 'FOKUS-PAUSE · 5 MINUTEN' : 'NACH DEM FILM · ' + min + ' MINUTEN STILLE';
  $('ks-med-hint').textContent = reason === 'focus'
    ? 'Steh kurz auf, trink einen Schluck Wasser, schau in die Ferne. Der Film wartet auf dich.'
    : 'Einatmen, wenn der Kreis wächst. Ausatmen, wenn er kleiner wird. Lass die Bilder nachklingen.';
  $('ks-med-snd').textContent = soundOn ? '♫ Klang an' : '♫ Klang aus'; $('ks-med-snd').classList.toggle('on', soundOn);
  $('ks-med').classList.remove('ks-hide');
  startSound();
  med = { reason: reason, lightBefore: lightBefore, iv: setInterval(function () {
    var left = (end - Date.now()) / 1000;
    $('ks-med-t').textContent = fmt(Math.max(0, left));
    if (left <= 0) endMeditation(true);
  }, 500) };
  $('ks-med-t').textContent = fmt(min * 60);
}
function endMeditation(done) {
  if (!med) return;
  var m = med; med = null; clearInterval(m.iv);
  if (done && soundOn) bowl(0);
  stopSound(); $('ks-med').classList.add('ks-hide');
  setLight(m.lightBefore || 'aus');
  if (m.reason === 'focus') { focusPhase('work'); if (focus.resume && player) player.play(); }
  else {
    var nx = nextInPlaylist();
    if (nx) { toast('Weiter in der Playlist: ' + nx.title); openVideo(nx, { autoplay: true }); }
  }
}
$('ks-med-x').onclick = function () { endMeditation(false); };
$('ks-med-room').onclick = function () { endMeditation(false); openRoom('meditationsraum_url', 'Der Meditationsraum'); };

/* ---------- Fokus-Timer 45/5 ---------- */
var focus = { on: false, phase: 'work', until: 0, iv: 0, resume: false };
function focusPhase(ph) {
  focus.phase = ph; focus.until = Date.now() + (ph === 'work' ? KS_CONFIG.focusWork : KS_CONFIG.focusBreak) * 60000;
}
function focusTick() {
  if (!focus.on) { $('ks-focus').textContent = '⏱ Fokus'; return; }
  var left = (focus.until - Date.now()) / 1000;
  $('ks-focus').textContent = (focus.phase === 'work' ? '⏱ ' : '☾ ') + fmt(Math.max(0, left));
  if (left > 0 || focus.phase !== 'work') return;
  focus.resume = !!(player && !player.paused());
  if (player) player.pause();
  focusPhase('break'); startMeditation('focus');
}
$('ks-focus').onclick = function () {
  focus.on = !focus.on; this.classList.toggle('on', focus.on);
  clearInterval(focus.iv);
  if (focus.on) { focusPhase('work'); focus.iv = setInterval(focusTick, 1000); toast('Fokus an: 45 Minuten Film, dann 5 Minuten Pause'); }
  else toast('Fokus-Timer aus');
  focusTick(); savePrefs({ focus: focus.on });
};

/* ---------- Tastatur ---------- */
document.addEventListener('keydown', function (e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
  if (!root.isConnected) return;
  var k = e.key.toLowerCase(), hit = true;
  if (k === ' ' && player) togglePlay();
  else if (k === 'arrowleft' && player) player.seek(player.time() - 10);
  else if (k === 'arrowright' && player) player.seek(player.time() + 10);
  else if (k === 'b') addBookmark();
  else if (k === 's') screenshot();
  else if (k === 'n') { if (root.dataset.mode === 'kino') root.dataset.side = 'on'; $('ks-note-in').focus(); }
  else if (k === 'k') setMode(root.dataset.mode === 'kino' ? 'lern' : 'kino');
  else if (k === 'h') setHub(root.dataset.hub !== 'on');
  else if (k === 'f') $('ks-fs').click();
  else if (k === 'm') { var v = $('ks-vol'); v.value = v.value > 0 ? 0 : 1; v.oninput(); }
  else if (k === 'escape' && med) endMeditation(false);
  else hit = false;
  if (hit) e.preventDefault();
});
// Im Kinosaal mit ausgeblendetem Hub: Maus an den oberen Rand holt ihn kurz zurück
root.addEventListener('mousemove', function (e) {
  if (root.dataset.hub === 'off' && e.clientY - root.getBoundingClientRect().top < 12) setHub(true);
});

/* ---------- Start ---------- */
if (S.prefs.mode === 'kino') setMode('kino', true);
if (S.prefs.light && S.prefs.light !== 'aus') setLight(S.prefs.light);
loadAll().then(function () {
  var last = store('ks_last'), v = last && vid(last);
  if (v) openVideo(v, { noScroll: true });
});
