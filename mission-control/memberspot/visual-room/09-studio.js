
/* =====================================================================
   FREQUENCY-STUDIO: wächst aus dem rechten Baum
   Step-Sequencer · Instrumente & Samples · Upload · Sync-Ast · MIDI
   Bedienung ohne Schrift – Symbole mit Tooltips.
   ===================================================================== */
var studio = document.createElement('div'); studio.id = 'vr-studio'; bg.appendChild(studio);
var syncBtn = document.createElement('button'); syncBtn.id = 'vr-syncbtn'; syncBtn.title = 'SYNC: Hauptplayer, Studio und Visuals in einen Takt bringen';
syncBtn.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 40c6-4 8-12 16-14s10 6 18 2 10-12 16-10" fill="none" stroke="#4a6a2a" stroke-width="3" stroke-linecap="round"/><path d="M10 22c8 2 10 10 18 10s12-8 20-6 8 10 8 10" fill="none" stroke="#3a2412" stroke-width="4" stroke-linecap="round"/><ellipse cx="18" cy="24" rx="5" ry="2.6" transform="rotate(-30 18 24)" fill="#3f6a26"/><ellipse cx="46" cy="42" rx="5" ry="2.6" transform="rotate(25 46 42)" fill="#3f6a26"/></svg><span>⟲</span>';
$('vr-pwrap').appendChild(syncBtn);
var ST = { open: false, sel: 'guitar', lib: false };
function ico(t, title, attrs, cls) { return '<button class="' + (cls || '') + '" title="' + title + '" ' + (attrs || '') + '>' + t + '</button>'; }
var METERS = [[4, 4], [3, 4], [6, 8], [5, 4], [7, 8]];
function studioHtml() {
  var chief = TEMPO.chief, playing = !!SEQ.timer;
  var h = '<div class="vr-st-vines"></div>' +
    // Kopfzeile: Transport · Tempo · Takt · Schließen
    '<div class="vr-st-row">' +
      ico(playing && SEQ.on ? '❚❚' : '▶', 'Start / Pause', 'data-s="play"', playing && SEQ.on ? 'on' : '') + ico('■', 'Stop – alles', 'data-s="stop"') + ico('↻', 'Von vorn', 'data-s="restart"') +
      '<span class="vr-st-gap"></span>' +
      ico('−', 'Tempo −0,1', 'data-s="bpm-"') + '<input class="vr-st-bpm" id="vr-st-bpm" type="number" step="0.001" min="20" max="300" value="' + TEMPO.bpm.toFixed(3) + '" title="Tempo (BPM)">' + ico('+', 'Tempo +0,1', 'data-s="bpm+"') + ico('👆', 'Tempo tippen', 'data-s="tap"') +
      '<span class="vr-st-gap"></span>' +
      METERS.map(function (m) { return ico('<small>' + m[0] + '</small><i>' + m[1] + '</i>', m[0] + '/' + m[1] + '-Takt', 'data-meter="' + m.join('/') + '"', 'vr-meterbtn' + (SEQ.meter[0] === m[0] && SEQ.meter[1] === m[1] ? ' on' : '')); }).join('') +
      '<span class="vr-st-gap"></span>' + ico('◷', 'Uhr-Design wechseln: ' + DRUM_THEMES[drumTheme].n, 'data-s="drumtheme"') + ico('🌈', 'Visualizer oben an/aus', 'data-s="viz"', VIZ.on ? 'on' : '') + ico('🖥', 'Hauptplayer mithören (Tab-Ton teilen, Chrome/Edge)', 'data-s="tabaudio"', tabStream ? 'on' : '') + ico('💾', 'Beat speichern', 'data-s="save"') + ico('📂', 'Meine Beats', 'data-s="load"') + ico('✕', 'Studio schließen', 'data-s="close"') +
    '</div>' +
    // Der Ast: Hauptplayer ← Tempo → Studio, selbst steuern
    '<div class="vr-branch" title="Menge der Visuals: ganz links nur Sternenhimmel"><span style="font-size:15px">✧</span><div class="vr-branch-mid"><input type="range" id="vr-st-vis" min="0" max="1" step=".01" value="' + MIX.vis + '"></div><span style="font-size:15px">✺</span></div>' +
    '<div class="vr-branch" title="Sync-Ast: wer gibt den Takt vor?">' +
      ico('🎧', 'Hauptplayer gibt den Takt vor (Tempo tippen, eintippen oder per Mikrofon hören)', 'data-chief="main"', 'vr-leaf' + (chief === 'main' ? ' on' : '')) +
      '<div class="vr-branch-mid"><input type="range" id="vr-st-bpmr" min="40" max="180" step="0.001" value="' + TEMPO.bpm + '"><b id="vr-st-bpmv">' + TEMPO.bpm.toFixed(3) + '</b></div>' +
      ico('🥁', 'Studio gibt den Takt vor', 'data-chief="studio"', 'vr-leaf' + (chief === 'studio' ? ' on' : '')) +
      ico('✋', 'Ich steuere selbst (nur Regler)', 'data-chief="hand"', 'vr-leaf' + (chief === 'hand' ? ' on' : '')) +
      ico('👂', 'Tempo des Hauptplayers per Mikrofon hören', 'data-s="detect"', 'vr-leaf' + (MIX.detect ? ' on' : '')) +
      ico('⟲', 'Visuals im Takt', 'data-s="vsync"', 'vr-leaf' + (MIX.sync ? ' on' : '')) +
    '</div>';
  // Trommeln
  h += '<div class="vr-st-sec"><div class="vr-st-head">' + ico('🥁', 'Trommeln an/aus', 'data-s="drums"', SEQ.drumsOn ? 'on' : '') + ico('⌫', 'Muster leeren', 'data-s="clear"') + ico('🎲', 'Zufallsmuster', 'data-s="rand"') + '</div><div class="vr-grid-steps" style="--n:' + SEQ.steps + ';--beat:' + (16 / SEQ.meter[1]) + '">';
  DRUMS.forEach(function (d) {
    h += '<div class="vr-steprow">' + ico(d.ico, d.name + ' an/aus', 'data-drumon="' + d.id + '"', 'vr-rowbtn' + (d.on !== false ? ' on' : '')) +
      ico('⬆', 'Eigenes Sample für ' + d.name, 'data-upfor="drum:' + d.id + '"', 'vr-mini') + '<div class="vr-cells">';
    for (var i = 0; i < SEQ.steps; i++) h += '<i data-cell="' + d.id + ':' + i + '" class="' + (SEQ.grid[d.id][i] ? 'on' : '') + (i % (16 / SEQ.meter[1] * (SEQ.meter[1] === 8 ? 3 : 1)) === 0 ? ' beat' : '') + '"></i>';
    h += '</div></div>';
  });
  h += '</div></div>';
  // Instrumente
  h += '<div class="vr-st-sec"><div class="vr-st-head">' + ico('🎼', 'Instrumente', '', 'vr-deco') + ico('📚', 'Sample-Bibliothek', 'data-s="lib"', ST.lib ? 'on' : '') + ico('⬆', 'Sample / Song hochladen', 'data-s="upload"') + ico('🎹', 'MIDI-Gerät verbinden', 'data-s="midi"', MIDI.access ? 'on' : '') + '</div>';
  INSTR.forEach(function (it) {
    h += '<div class="vr-instrow" data-inst="' + it.id + '">' + ico(it.ico, it.name + ': Schleife an/aus', 'data-ion="' + it.id + '"', 'vr-rowbtn' + (it.on ? ' on' : '')) +
      '<input type="range" min="0" max="1" step=".01" value="' + it.vol + '" data-ivol="' + it.id + '" title="Lautstärke ' + it.name + '">' +
      ico('▸', 'Anspielen', 'data-iplay="' + it.id + '"', 'vr-mini') +
      '<span class="vr-samplechip" title="' + (it.sample ? esc(it.sample.name) : 'eingebauter Klang') + '">' + (it.sample && safeUrl(it.sample.thumb_url) ? '<img src="' + esc(it.sample.thumb_url) + '" alt="">' : '◌') + '</span>' +
      ico('⇄', 'Sample wählen', 'data-ipick="' + it.id + '"', 'vr-mini') + ico('⬆', 'Sample für ' + it.name + ' hochladen', 'data-upfor="inst:' + it.id + '"', 'vr-mini') +
      ico('🎹', 'Mit dem MIDI-Keyboard spielen', 'data-imidi="' + it.id + '"', 'vr-mini' + (MIDI.inst === it.id ? ' on' : '')) + '</div>';
  });
  h += '</div>';
  if (ST.lib) h += libHtml();
  if (MIDI.access) h += midiHtml();
  return h;
}
function libHtml() {
  var list = S.samples.slice(0, 120);
  return '<div class="vr-st-sec"><div class="vr-lib">' + (list.length ? list.map(function (s) {
    return '<div class="vr-libitem" data-drag="sample:' + s.id + '" data-label="' + esc(s.name) + '" title="' + esc(s.name + (s.artist ? ' · ' + s.artist : '') + ' · ' + s.instrument) + '">' +
      (safeUrl(s.thumb_url) ? '<img src="' + esc(s.thumb_url) + '" alt="">' : '<span>♪</span>') + '<button data-lplay="' + s.id + '" title="Anhören">▸</button></div>';
  }).join('') : '<div class="vr-empty" style="margin:0">⬆</div>') + '</div></div>';
}
function midiHtml() {
  return '<div class="vr-st-sec"><div class="vr-st-head">' + ico('⏱', 'MIDI-Clock senden', 'data-s="clock"', MIDI.clockOut ? 'on' : '') + ico('▶', 'MIDI-Start senden', 'data-s="mstart"') + ico('■', 'MIDI-Stop senden', 'data-s="mstop"') + '</div>' +
    '<div class="vr-midilist">' + MIDI.inputs.map(function (i) { return '<span class="vr-dev" title="Eingang">⇢ ' + esc(i.name || 'MIDI') + '</span>'; }).join('') +
    MIDI.outputs.map(function (o) { return '<button class="vr-dev' + (MIDI.outOn[o.id] ? ' on' : '') + '" data-mout="' + o.id + '" title="Ausgang an/aus">⇠ ' + esc(o.name || 'MIDI') + '</button>'; }).join('') +
    (MIDI.inputs.length + MIDI.outputs.length ? '' : '<span class="vr-dev">⚠︎</span>') + '</div></div>';
}
window.vrStudioPaint = function () {
  if (!ST.open) return;
  var sc = studio.scrollTop; studio.innerHTML = studioHtml(); studio.scrollTop = sc;
};
window.vrOpenStudio = function () {
  ST.open = true; studio.classList.add('open'); window.vrStudioPaint(); ctx(); document.dispatchEvent(new Event('vr-studio'));
  if (sv < 1.2) return;
  bg.scrollIntoView && null;
};
function closeStudio() { ST.open = false; studio.classList.remove('open'); document.dispatchEvent(new Event('vr-studio')); }
window.vrCloseStudio = closeStudio;
window.vrToggleStudio = function () { if (ST.open) closeStudio(); else window.vrOpenStudio(); };
window.vrStudioOpen = function () { return ST.open; };
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ST.open) closeStudio(); });
syncBtn.onclick = function () {
  ctx(); var on = !(MIX.sync && TEMPO.chief === 'main');
  setSync(on); TEMPO.chief = on ? 'main' : 'studio'; store('vr_chief', TEMPO.chief);
  syncBtn.classList.toggle('on', on); window.vrOpenStudio(); BR.t0 = performance.now();
};
syncBtn.classList.toggle('on', MIX.sync && TEMPO.chief === 'main');
onTempo.push(function () { var v = $('vr-st-bpmv'); if (v) { v.textContent = TEMPO.bpm.toFixed(3); var r = $('vr-st-bpmr'); if (r && document.activeElement !== r) r.value = TEMPO.bpm; var n = $('vr-st-bpm'); if (n && document.activeElement !== n) n.value = TEMPO.bpm.toFixed(3); } });

studio.addEventListener('click', function (e) {
  var b = e.target.closest('button,[data-cell]'); if (!b) return; ctx();
  var d = b.dataset, s = d.s;
  if (d.cell) { var p = d.cell.split(':'); SEQ.grid[p[0]][+p[1]] = !SEQ.grid[p[0]][+p[1]]; b.classList.toggle('on'); if (SEQ.grid[p[0]][+p[1]]) playDrum(DRUMS.filter(function (x) { return x.id === p[0]; })[0], ctx().currentTime, .7); return; }
  if (s === 'play') { if (SEQ.on) { SEQ.on = false; ensureClock(); } else window.vrStudio.play(); }
  if (s === 'stop') window.vrStudio.stop();
  if (s === 'restart') window.vrStudio.restart();
  if (s === 'bpm-' || s === 'bpm+') setBpm(TEMPO.bpm + (s === 'bpm+' ? .1 : -.1), true);
  if (s === 'tap') tapTempo();
  if (s === 'close') closeStudio();
  if (s === 'drums') SEQ.drumsOn = !SEQ.drumsOn;
  if (s === 'clear') DRUMS.forEach(function (x) { for (var i = 0; i < SEQ.steps; i++) SEQ.grid[x.id][i] = false; });
  if (s === 'rand') DRUMS.forEach(function (x, k) { for (var i = 0; i < SEQ.steps; i++) SEQ.grid[x.id][i] = Math.random() < [.18, .12, .1, .25, .05, .02][k] && (k > 1 || i % 2 === 0); });
  if (s === 'lib') ST.lib = !ST.lib;
  if (s === 'upload') uploadSample(null);
  if (s === 'midi') midiInit().then(function () { toast('MIDI verbunden.'); }).catch(function (err) { toast(err.message); });
  if (s === 'clock') MIDI.clockOut = !MIDI.clockOut;
  if (s === 'mstart') midiSend([0xFA]);
  if (s === 'mstop') midiSend([0xFC]);
  if (s === 'detect') { MIX.detect = !MIX.detect; store('vr_detect', MIX.detect ? '1' : '0'); if (MIX.detect && !micStream) $('vr-mic').click(); if (MIX.detect) TEMPO.chief = 'main'; }
  if (s === 'vsync') setSync(!MIX.sync);
  if (s === 'viz') vizToggle();
  if (s === 'rec') recToggle();
  if (s === 'micin') micPicker();
  if (s === 'tabaudio') shareTabAudio();
  if (s === 'drumtheme') applyDrumTheme(drumTheme + 1);
  if (s === 'save') savePattern();
  if (s === 'load') loadPatterns();
  if (d.chief) { TEMPO.chief = d.chief; store('vr_chief', d.chief); if (d.chief === 'main') setSync(true); BR.t0 = performance.now(); syncBtn.classList.toggle('on', d.chief === 'main' && MIX.sync); }
  if (d.meter) { SEQ.meter = d.meter.split('/').map(Number); resetGrid(); }
  if (d.drumon) { var dr = DRUMS.filter(function (x) { return x.id === d.drumon; })[0]; dr.on = dr.on === false; }
  if (d.ion) { var it = INSTR.filter(function (x) { return x.id === d.ion; })[0]; it.on = !it.on; ensureClock(); }
  if (d.iplay) playInst(INSTR.filter(function (x) { return x.id === d.iplay; })[0], ctx().currentTime + .01, Math.random() * 6 | 0, .9);
  if (d.ipick) pickSample(d.ipick);
  if (d.imidi) { MIDI.inst = d.imidi; if (!MIDI.access) midiInit().catch(function (err) { toast(err.message); }); }
  if (d.upfor) uploadSample(d.upfor);
  if (d.lplay) previewSample(d.lplay);
  if (d.mout) MIDI.outOn[d.mout] = !MIDI.outOn[d.mout];
  window.vrStudioPaint();
});
studio.addEventListener('input', function (e) {
  var d = e.target.dataset;
  if (e.target.id === 'vr-st-vis') setVis(+e.target.value);
  if (e.target.id === 'vr-st-bpmr') { setBpm(+e.target.value, true); if (TEMPO.chief === 'main') {} }
  if (d.ivol) INSTR.filter(function (x) { return x.id === d.ivol; })[0].vol = +e.target.value;
});
studio.addEventListener('change', function (e) { if (e.target.id === 'vr-st-bpm') setBpm(e.target.value, true); });
// Samples aus der Bibliothek per Drag & Drop auf eine Instrument-Zeile ziehen
studio.addEventListener('pointerup', function () {});
var prevSrc = null;
function previewSample(id) {
  var s = byId('sample', id); if (!s) return;
  if (prevSrc) try { prevSrc.stop(); } catch (e) {}
  loadBuffer(s.mp3_url || s.wav_url).then(function (b) { prevSrc = playBuffer(b, ctx().currentTime, .9, voiceOut(1, .1)); });
}
function pickSample(instId) {
  var it = INSTR.filter(function (x) { return x.id === instId; })[0];
  var list = S.samples.filter(function (s) { return s.kind !== 'song'; });
  openModal('<h4>' + it.ico + '</h4><div class="vr-lib" style="max-height:50vh;overflow:auto">' +
    '<div class="vr-libitem" data-pick="" title="eingebauter Klang"><span>◌</span></div>' +
    list.map(function (s) { return '<div class="vr-libitem' + (it.sample && it.sample.id === s.id ? ' on' : '') + '" data-pick="' + s.id + '" title="' + esc(s.name + ' · ' + s.instrument) + '">' + (safeUrl(s.thumb_url) ? '<img src="' + esc(s.thumb_url) + '" alt="">' : '<span>♪</span>') + '</div>'; }).join('') +
    '</div><div class="vr-btns"><button data-x>✕</button><button class="pri" data-up>⬆</button></div>', function () {
      q('[data-x]').onclick = closeModal; q('[data-up]').onclick = function () { uploadSample('inst:' + instId); };
      mbox.querySelectorAll('[data-pick]').forEach(function (el) { el.onclick = function () { assignSample(it, el.dataset.pick ? byId('sample', el.dataset.pick) : null).then(window.vrStudioPaint); closeModal(); }; });
    });
}
function uploadSample(target) {
  if (!needLogin(function () { uploadSample(target); })) return;
  var instName = '';
  if (target) { var p = target.split(':'); instName = p[0] === 'inst' ? INSTR.filter(function (x) { return x.id === p[1]; })[0].name : DRUMS.filter(function (x) { return x.id === p[1]; })[0].name; }
  var names = {}; INSTR.forEach(function (i) { names[i.name] = 1; }); DRUMS.forEach(function (d) { names[d.name] = 1; }); S.samples.forEach(function (s) { names[s.instrument] = 1; });
  openModal('<h4>⬆ Sample · Song</h4>' +
    '<div class="vr-seg"><button data-k="sample" class="on">Sample</button><button data-k="loop">Loop</button><button data-k="song">Song</button></div>' +
    '<label>Name *</label><input id="u-name" maxlength="120">' +
    '<label>Instrument</label><input id="u-inst" list="u-insts" maxlength="40" value="' + esc(instName) + '" placeholder="z. B. Gitarre – oder ein neues"><datalist id="u-insts">' + Object.keys(names).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
    '<div class="vr-form2"><div><label>Künstler</label><input id="u-artist" maxlength="120"></div><div><label>Album</label><input id="u-album" maxlength="120"></div>' +
    '<div><label>BPM</label><input id="u-bpm" type="number" step="0.001" min="20" max="300"></div><div><label>Tonart</label><input id="u-key" maxlength="12" placeholder="z. B. D-Moll"></div></div>' +
    '<label>Bild (Thumbnail)</label><input id="u-thumb" type="file" accept="image/*">' +
    '<div class="vr-form2"><div><label>MP3</label><input id="u-mp3" type="file" accept=".mp3,audio/mpeg"></div><div><label>WAV</label><input id="u-wav" type="file" accept=".wav,audio/wav"></div></div>' +
    '<div class="vr-muted" style="font-size:12px;margin-top:6px">Am besten beides hochladen – MP3 zum schnellen Anhören, WAV für beste Qualität. Max. 50 MB je Datei.</div>' +
    '<label style="display:flex;gap:8px;align-items:center;color:#aab8c4"><input id="u-pub" type="checkbox" checked style="width:auto"> Für alle im Studio nutzbar</label>' +
    '<div class="vr-progress"><i id="u-bar"></i></div><div class="vr-msg"></div><div class="vr-btns"><button data-x>Abbrechen</button><button class="pri" data-go>⬆ Hochladen</button></div>', function (b) {
      var kind = 'sample';
      b.querySelectorAll('[data-k]').forEach(function (x) { x.onclick = function () { kind = x.dataset.k; b.querySelectorAll('[data-k]').forEach(function (y) { y.classList.toggle('on', y === x); }); }; });
      q('[data-x]').onclick = closeModal;
      q('[data-go]').onclick = function () {
        var name = q('#u-name').value.trim(), mp3 = q('#u-mp3').files[0], wav = q('#u-wav').files[0], th = q('#u-thumb').files[0];
        if (!name) return mmsg('Bitte einen Namen eingeben.');
        if (!mp3 && !wav) return mmsg('Bitte eine MP3- oder WAV-Datei wählen.');
        if ((mp3 && mp3.size > 52428800) || (wav && wav.size > 52428800)) return mmsg('Eine Datei ist größer als 50 MB.');
        var total = (mp3 ? mp3.size : 0) + (wav ? wav.size : 0), done = 0, bar = q('#u-bar');
        function prog(size) { return function (p) { bar.style.width = ((done + p * size) / total * 100) + '%'; }; }
        mmsg('Lade hoch …');
        var row = { kind: kind, name: name, instrument: q('#u-inst').value.trim() || 'Sonstiges', artist: q('#u-artist').value.trim() || null, album: q('#u-album').value.trim() || null,
          bpm: q('#u-bpm').value ? +q('#u-bpm').value : null, music_key: q('#u-key').value.trim() || null, is_public: q('#u-pub').checked, source: 'upload' };
        var chain = th ? shrink(th, 600).then(function (bl) { return upload('vr-bilder', bl, 'jpg', 'image/jpeg'); }).then(function (r) { row.thumb_url = r.url; }) : Promise.resolve();
        chain.then(function () { return mp3 ? upload('vr-audio', mp3, 'mp3', 'audio/mpeg', prog(mp3.size)).then(function (r) { row.mp3_url = r.url; done += mp3.size; }) : null; })
          .then(function () { return wav ? upload('vr-audio', wav, 'wav', 'audio/wav', prog(wav.size)).then(function (r) { row.wav_url = r.url; done += wav.size; }) : null; })
          .then(function () { return sb.from('vr_samples').insert(row).select('*').single(); })
          .then(function (r) {
            if (r.error) return mmsg('Eintragen hat nicht geklappt: ' + r.error.message);
            mmsg('Fertig – ist in der Bibliothek.', true);
            var s = r.data; s.mine = true; S.samples.unshift(s);
            if (target) { var p = target.split(':'), obj = (p[0] === 'inst' ? INSTR : DRUMS).filter(function (x) { return x.id === p[1]; })[0]; if (obj) assignSample(obj, s).then(window.vrStudioPaint); }
            setTimeout(closeModal, 900); ST.lib = true; window.vrStudioPaint();
          }).catch(function (err) { mmsg('Upload fehlgeschlagen (' + (err && err.message || 'Netz') + ').'); });
      };
    });
}
function patternData() {
  return { meter: SEQ.meter, grid: SEQ.grid, drumsOn: SEQ.drumsOn, instr: INSTR.map(function (i) { return { id: i.id, on: i.on, vol: i.vol, sample: i.sample && i.sample.id }; }), drums: DRUMS.map(function (d) { return { id: d.id, on: d.on, sample: d.sample && d.sample.id }; }) };
}
function applyPattern(p) {
  var d = p.data || {}; SEQ.meter = d.meter || [4, 4]; resetGrid();
  for (var k in (d.grid || {})) if (SEQ.grid[k]) SEQ.grid[k] = d.grid[k].slice(0, SEQ.steps);
  SEQ.drumsOn = d.drumsOn !== false; setBpm(p.bpm);
  (d.instr || []).forEach(function (x) { var it = INSTR.filter(function (i) { return i.id === x.id; })[0]; if (!it) return; it.on = x.on; it.vol = x.vol; assignSample(it, x.sample ? byId('sample', x.sample) : null); });
  (d.drums || []).forEach(function (x) { var dr = DRUMS.filter(function (i) { return i.id === x.id; })[0]; if (!dr) return; dr.on = x.on; assignSample(dr, x.sample ? byId('sample', x.sample) : null); });
  ensureClock(); window.vrStudioPaint();
}
function savePattern() {
  if (!needLogin(savePattern)) return;
  openModal('<h4>💾</h4><label>Name</label><input id="b-name" maxlength="80" value="Beat ' + new Date().toLocaleDateString('de-DE') + '"><label style="display:flex;gap:8px;align-items:center;color:#aab8c4"><input id="b-pub" type="checkbox" style="width:auto"> Für alle sichtbar</label><div class="vr-msg"></div><div class="vr-btns"><button data-x>✕</button><button class="pri" data-go>💾</button></div>', function () {
    q('[data-x]').onclick = closeModal;
    q('[data-go]').onclick = function () {
      sb.from('vr_patterns').insert({ title: q('#b-name').value.trim() || 'Beat', bpm: TEMPO.bpm, meter: SEQ.meter.join('/'), data: patternData(), is_public: q('#b-pub').checked })
        .then(function (r) { if (r.error) mmsg('Speichern ging nicht.'); else { mmsg('Gespeichert.', true); setTimeout(closeModal, 700); } });
    };
  });
}
function loadPatterns() {
  sbReady.then(function () { return sb.from('vr_patterns').select('*').order('updated_at', { ascending: false }).limit(60); }).then(function (r) {
    var list = r.data || [];
    openModal('<h4>📂</h4><div class="vr-rows">' + (list.length ? list.map(function (p) { return '<button data-p="' + p.id + '" style="text-align:left;border-radius:10px">' + esc(p.title) + ' <span class="vr-muted">· ' + (+p.bpm).toFixed(3) + ' · ' + esc(p.meter) + '</span></button>'; }).join('') : '<div class="vr-empty">—</div>') +
      '</div><div class="vr-btns"><button data-x>✕</button></div>', function () {
        q('[data-x]').onclick = closeModal;
        mbox.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { applyPattern(list.filter(function (p) { return p.id === b.dataset.p; })[0]); closeModal(); }; });
      });
  });
}
// Drag & Drop: Sample aus der Bibliothek auf eine Instrumentzeile
var libDrag = null;
studio.addEventListener('pointerdown', function (e) { var it = e.target.closest('.vr-libitem'); if (it && !e.target.closest('button')) libDrag = { id: it.dataset.drag.split(':')[1], x: e.clientX, y: e.clientY }; });
window.addEventListener('pointerup', function (e) {
  if (!libDrag) return; var d = libDrag; libDrag = null;
  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
  var el = document.elementFromPoint(e.clientX, e.clientY), row = el && el.closest('[data-inst]');
  if (row) { var it = INSTR.filter(function (x) { return x.id === row.dataset.inst; })[0]; assignSample(it, byId('sample', d.id)).then(window.vrStudioPaint); }
});

/* ---------- Der Sync-Ast: wächst vom Hauptplayer zum Studio ---------- */
var BR = { t0: 0 };
afterFrame.push(function (t) {
  syncBtn.classList.toggle('on', MIX.sync && TEMPO.chief === 'main');
  if (!ST.open || !MIX.sync) return;
  var r = studio.getBoundingClientRect(), b = bg.getBoundingClientRect();
  var x0 = PR.x + PR.w - 20, y0 = PR.y + PR.h - 20, x1 = r.left - b.left + 10, y1 = r.top - b.top + 70;
  var g = smooth((performance.now() - BR.t0) / 1400), n = 40, beat = Math.pow(1 - beatPhase(), 5);
  go.lineCap = 'round';
  for (var pass = 0; pass < 2; pass++) {
    go.strokeStyle = pass ? 'hsla(' + (TEMPO.chief === 'main' ? 188 : 44) + ',100%,65%,' + (.25 + beat * .6) + ')' : '#2a1a0e';
    go.lineWidth = pass ? 1.4 : 6;
    go.beginPath();
    for (var i = 0; i <= n * g; i++) { var u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * 60 + Math.sin(u * 14 + t) * 3; i ? go.lineTo(x, y) : go.moveTo(x, y); }
    go.stroke();
  }
  for (var k = 1; k < 6 && k / 6 < g; k++) { var u2 = k / 6, lx = lerp(x0, x1, u2), ly = lerp(y0, y1, u2) - Math.sin(u2 * Math.PI) * 60; go.save(); go.translate(lx, ly); go.rotate(k % 2 ? -.8 : 2.4); go.scale(.3, .3); go.drawImage(LEAVES[k % 3], 0, -20); go.restore(); }
});
