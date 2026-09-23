
/* =====================================================================
   MIKROFON-EINGANG · AUFNAHME · MEINE CREATIONS
   Aufnahmen landen automatisch in „Meine Creations“ (Supabase-Speicher),
   Veröffentlichtes erscheint in der Mediathek im Freigeist-Archiv.
   ===================================================================== */
var MICIN = { stream: null, src: null, gain: null, monitor: false, deviceId: store('vr_micdev') || '' };
var REC = { on: false, rec: null, chunks: [], dest: null, t0: 0 };
function micInput(deviceId) {
  var c = ctx();
  return navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (st) {
    if (MICIN.stream) MICIN.stream.getTracks().forEach(function (x) { x.stop(); });
    MICIN.stream = st; MICIN.src = c.createMediaStreamSource(st);
    MICIN.gain = MICIN.gain || c.createGain(); MICIN.gain.gain.value = 1;
    MICIN.src.connect(MICIN.gain);
    MICIN.gain.connect(vizAn);                                         // Visualizer & Visuals hören mit
    if (!analyser) { analyser = c.createAnalyser(); analyser.fftSize = 512; fbuf = new Uint8Array(analyser.frequencyBinCount); }
    MICIN.src.connect(analyser);
    if (REC.dest) MICIN.gain.connect(REC.dest);
    setMonitor(MICIN.monitor);
    MICIN.deviceId = deviceId || ''; store('vr_micdev', MICIN.deviceId);
    studioPaint();
  });
}
var monOut = null;
function setMonitor(on) {   // Mithören über Lautsprecher (Vorsicht: Rückkopplung ohne Kopfhörer)
  MICIN.monitor = on; if (!MICIN.gain) return;
  if (!monOut) { monOut = ctx().createGain(); monOut.connect(master); }
  try { MICIN.gain.disconnect(monOut); } catch (e) {}
  if (on) MICIN.gain.connect(monOut);
}
function micPicker() {
  if (!navigator.mediaDevices) return toast('Kein Mikrofonzugriff in diesem Browser.');
  // Gerätenamen gibt der Browser erst nach der Erlaubnis heraus
  (MICIN.stream ? Promise.resolve() : micInput(MICIN.deviceId)).then(function () { return navigator.mediaDevices.enumerateDevices(); }).then(function (devs) {
    var ins = devs.filter(function (d) { return d.kind === 'audioinput'; });
    openModal('<h4>🎙 Eingang</h4><div class="vr-rows">' + ins.map(function (d, i) {
      return '<button data-dev="' + esc(d.deviceId) + '" style="text-align:left;border-radius:10px' + (d.deviceId === MICIN.deviceId ? ';border-color:#9dff7a' : '') + '">' + esc(d.label || ('Eingang ' + (i + 1))) + '</button>';
    }).join('') + '</div><label style="display:flex;gap:8px;align-items:center;color:#aab8c4;margin-top:12px"><input id="m-mon" type="checkbox" style="width:auto"' + (MICIN.monitor ? ' checked' : '') + '> Mithören (nur mit Kopfhörern)</label>' +
      '<div class="vr-btns"><button data-off>Mikrofon aus</button><button class="pri" data-x>Fertig</button></div>', function () {
        q('[data-x]').onclick = closeModal;
        q('#m-mon').onchange = function () { setMonitor(this.checked); };
        q('[data-off]').onclick = function () { if (MICIN.stream) MICIN.stream.getTracks().forEach(function (x) { x.stop(); }); MICIN.stream = null; try { MICIN.gain.disconnect(); } catch (e) {} closeModal(); studioPaint(); };
        mbox.querySelectorAll('[data-dev]').forEach(function (b) { b.onclick = function () { micInput(b.dataset.dev).then(closeModal).catch(function () { mmsg('Dieser Eingang ließ sich nicht öffnen.'); }); }; });
      });
  }).catch(function () { toast('Mikrofon wurde nicht erlaubt.'); });
}
function recToggle() {
  var c = ctx();
  if (REC.on) { REC.rec.stop(); return; }
  if (!window.MediaRecorder) return toast('Aufnehmen kann dieser Browser leider nicht.');
  REC.dest = REC.dest || c.createMediaStreamDestination();
  try { master.disconnect(REC.dest); } catch (e) {}
  master.connect(REC.dest);                                                  // alles, was die Seite erklingen lässt
  if (MICIN.gain) MICIN.gain.connect(REC.dest);                              // + Mikrofon
  if (tabStream) c.createMediaStreamSource(new MediaStream(tabStream.getAudioTracks())).connect(REC.dest);   // + Hauptplayer (geteilter Tab)
  var type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0] || '';
  REC.rec = new MediaRecorder(REC.dest.stream, type ? { mimeType: type, audioBitsPerSecond: 256000 } : undefined);
  REC.chunks = []; REC.t0 = Date.now();
  REC.rec.ondataavailable = function (e) { if (e.data.size) REC.chunks.push(e.data); };
  REC.rec.onstop = function () {
    REC.on = false; studioPaint(); root.classList.remove('vr-recording');
    var mime = (REC.rec.mimeType || type || 'audio/webm').split(';')[0], blob = new Blob(REC.chunks, { type: mime }), dur = (Date.now() - REC.t0) / 1000;
    saveRecording(blob, mime, dur);
  };
  REC.rec.start(1000); REC.on = true; root.classList.add('vr-recording'); studioPaint();
}
function saveRecording(blob, mime, dur) {
  var ext = /mp4/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm', title = 'Aufnahme ' + new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
  if (!S.me || IS_GUEST) {   // Gäste: Datei zum Mitnehmen, Speichern gibt es für Mitglieder
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = title.replace(/[^\w\- ]+/g, '-') + '.' + ext; a.click();
    toast('Aufnahme heruntergeladen. Mitglieder finden sie automatisch unter „Meine Creations“.'); return;
  }
  toast('Speichere Aufnahme …');
  upload('vr-creations', blob, ext, mime).then(function (up) {
    return sb.from('vr_creations').insert({ kind: 'audio', title: title, file_url: up.url, mime: mime, duration: Math.round(dur), source: 'recording' });
  }).then(function (r) { toast(r.error ? 'Speichern hat nicht geklappt.' : '⏺ In „Meine Creations“ gespeichert.'); })
    .catch(function () { toast('Upload fehlgeschlagen – bitte erneut versuchen.'); });
}
window.vrRec = { toggle: recToggle, mic: micPicker };

/* ---------- Meine Creations ---------- */
var KINDS = [['audio', '🎵', 'Audio'], ['image', '🖼', 'Bilder'], ['video', '🎬', 'Video'], ['document', '📄', 'Dokumente'], ['design', '✦', 'Designs']];
function kindOf(file) {
  var t = file.type || '';
  if (/^audio/.test(t)) return 'audio'; if (/^image/.test(t)) return 'image'; if (/^video/.test(t)) return 'video';
  if (/pdf|word|text|sheet|presentation|document/.test(t)) return 'document'; return 'design';
}
function creationsModal(kind) {
  if (!needLogin(function () { creationsModal(kind); })) return;
  kind = kind || 'audio';
  sb.from('vr_creations').select('*').eq('user_id', S.me.id).eq('kind', kind).order('created_at', { ascending: false }).then(function (r) {
    var list = r.data || [];
    function preview(c) {
      var u = esc(c.file_url);
      if (c.kind === 'audio') return '<audio controls preload="none" src="' + u + '" style="width:100%;height:34px"></audio>';
      if (c.kind === 'image') return '<img src="' + u + '" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px">';
      if (c.kind === 'video') return '<video controls preload="none" src="' + u + '" style="width:100%;max-height:180px;border-radius:10px"></video>';
      return '<a href="' + u + '" target="_blank" rel="noopener">Öffnen ↗</a>';
    }
    openModal('<h4>✦ Meine Creations</h4><div class="vr-seg" style="flex-wrap:wrap">' + KINDS.map(function (k) { return '<button data-k="' + k[0] + '" class="' + (k[0] === kind ? 'on' : '') + '">' + k[1] + ' ' + k[2] + '</button>'; }).join('') + '</div>' +
      '<div class="vr-rows" style="margin-top:10px">' + (list.length ? list.map(function (c) {
        return '<div style="padding:10px;border-radius:12px;border:1px solid rgba(184,107,255,.25);background:rgba(255,255,255,.03)">' +
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><b style="flex:1;color:#fff">' + esc(c.title) + '</b>' +
          '<button data-pub="' + c.id + '" class="' + (c.is_published ? '' : 'pri') + '" style="padding:4px 12px">' + (c.is_published ? '✓ Veröffentlicht · zurückziehen' : '⇪ Veröffentlichen') + '</button>' +
          '<button data-ren="' + c.id + '" title="Umbenennen" style="padding:4px 9px">✎</button><button data-del="' + c.id + '" title="Löschen" style="padding:4px 9px">🗑</button></div>' + preview(c) + '</div>';
      }).join('') : '<div class="vr-empty">Noch nichts hier. Nimm im Studio mit ⏺ auf oder lade etwas hoch.</div>') + '</div>' +
      '<label>Hochladen</label><input id="c-file" type="file" multiple>' +
      '<div class="vr-progress"><i id="c-bar"></i></div><div class="vr-msg"></div><div class="vr-btns"><button data-x>Schließen</button></div>', function (b) {
        q('[data-x]').onclick = closeModal;
        b.querySelectorAll('[data-k]').forEach(function (x) { x.onclick = function () { creationsModal(x.dataset.k); }; });
        b.querySelectorAll('[data-pub]').forEach(function (x) { x.onclick = function () {
          var c = list.filter(function (i) { return i.id === x.dataset.pub; })[0], on = !c.is_published;
          sb.from('vr_creations').update({ is_published: on, published_at: on ? new Date().toISOString() : null }).eq('id', c.id).then(function () { if (on) goldBurst(); creationsModal(kind); });
        }; });
        b.querySelectorAll('[data-ren]').forEach(function (x) { x.onclick = function () {
          var c = list.filter(function (i) { return i.id === x.dataset.ren; })[0], t = prompt('Neuer Name', c.title);
          if (t && t.trim()) sb.from('vr_creations').update({ title: t.trim().slice(0, 120) }).eq('id', c.id).then(function () { creationsModal(kind); });
        }; });
        b.querySelectorAll('[data-del]').forEach(function (x) { x.onclick = function () {
          if (confirm('Wirklich löschen?')) sb.from('vr_creations').delete().eq('id', x.dataset.del).then(function () { creationsModal(kind); });
        }; });
        q('#c-file').onchange = function () {
          var files = [].slice.call(this.files), done = 0; if (!files.length) return;
          mmsg('Lade hoch …');
          files.reduce(function (p, f) {
            return p.then(function () {
              if (f.size > 52428800) { mmsg(f.name + ' ist größer als 50 MB.'); return; }
              var ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
              return upload('vr-creations', f, ext, f.type, function (pp) { q('#c-bar').style.width = ((done + pp) / files.length * 100) + '%'; }).then(function (up) {
                done++; var k = kindOf(f);
                return sb.from('vr_creations').insert({ kind: k, title: f.name.replace(/\.[^.]+$/, '').slice(0, 120), file_url: up.url, thumb_url: k === 'image' ? up.url : null, mime: f.type || null });
              });
            });
          }, Promise.resolve()).then(function () { creationsModal(kind); }).catch(function () { mmsg('Upload fehlgeschlagen.'); });
        };
      });
  });
}
window.vrCreations = creationsModal;
(function () {   // Knopf in „Meine Liste“
  var b = document.createElement('button'); b.id = 'vr-mycre'; b.textContent = '✦ Meine Creations'; b.style.cssText = 'margin:8px 0 0 8px;font-size:12px';
  $('vr-newpl').parentNode.insertBefore(b, $('vr-newpl').nextSibling);
  b.onclick = function () { creationsModal('audio'); };
})();
