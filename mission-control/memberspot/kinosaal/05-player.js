/* ---------- Player: eine Oberfläche, viele Quellen ----------
   Jeder Adapter liefert dieselben Methoden. Alles Weitere (Vorladen, Lesezeichen,
   Fokus-Timer, Meditation) spricht nur mit dieser Oberfläche. */
var player = null, current = null, preloading = null;
var frameEl = $('ks-frame');

function loadScript(src, ready) {
  return new Promise(function (res, rej) {
    if (ready()) return res();
    var s = document.createElement('script'); s.src = src; s.onload = function () { res(); }; s.onerror = rej; document.head.appendChild(s);
  });
}
function ytId(u) { var m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; }
function driveId(u) { var m = String(u || '').match(/(?:\/d\/|id=)([\w-]{20,})/); return m ? m[1] : null; }

/* MP4 / Supabase-Speicher / beliebige direkte Datei */
function mp4Player(v) {
  var el = document.createElement('video'), p = { kind: 'mp4', canShot: true };
  el.playsInline = true; el.preload = 'metadata'; el.crossOrigin = 'anonymous'; el.src = v.url;
  el.addEventListener('error', function retry() {
    // Ohne CORS-Freigabe lädt die Datei nur ohne crossOrigin – dann ist kein direktes Foto möglich
    if (el.crossOrigin) { el.removeEventListener('error', retry); el.removeAttribute('crossorigin'); p.canShot = false; el.src = v.url; el.load(); if (p.want) el.play().catch(function () {}); }
  });
  el.addEventListener('ended', function () { onEnded(); });
  el.addEventListener('play', function () { onPlayState(true); });
  el.addEventListener('pause', function () { onPlayState(false); });
  frameEl.appendChild(el);
  p.el = el;
  p.play = function () { p.want = true; return el.play().catch(function () {}); };
  p.pause = function () { p.want = false; el.pause(); };
  p.paused = function () { return el.paused; };
  p.time = function () { return el.currentTime || 0; };
  p.dur = function () { return isFinite(el.duration) ? el.duration : (v.duration_sec || 0); };
  p.seek = function (s) { el.currentTime = clamp(s, 0, p.dur() || s); };
  p.buffered = function () {
    var d = p.dur(); if (!d || !el.buffered.length) return 0;
    for (var i = 0; i < el.buffered.length; i++) if (el.buffered.start(i) <= el.currentTime + .5) var end = el.buffered.end(i);
    return clamp((end || 0) / d, 0, 1);
  };
  p.startBuffer = function () { el.preload = 'auto'; el.load(); };
  p.rate = function (r) { el.playbackRate = r; };
  p.vol = function (x) { el.volume = x; el.muted = x === 0; };
  p.shot = function () {
    if (!p.canShot || !el.videoWidth) return null;
    try {
      var c = document.createElement('canvas'); c.width = el.videoWidth; c.height = el.videoHeight;
      c.getContext('2d').drawImage(el, 0, 0);
      return new Promise(function (res) { c.toBlob(res, 'image/jpeg', .9); });
    } catch (e) { return null; }
  };
  p.destroy = function () { el.pause(); el.removeAttribute('src'); el.load(); el.remove(); };
  return p;
}

/* YouTube über die IFrame-API (eigene Steuerleiste, kein Fremd-Chrome) */
function ytPlayer(v) {
  var p = { kind: 'youtube', canShot: false, _t: 0, _d: v.duration_sec || 0 }, yt = null, ready = false, queue = [];
  var host = document.createElement('div'); frameEl.appendChild(host);
  function when(f) { ready ? f() : queue.push(f); }
  loadScript('https://www.youtube.com/iframe_api', function () { return window.YT && YT.Player; }).then(function () {
    return new Promise(function (res) { if (YT.Player && YT.loaded) return res(); var o = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = function () { if (o) o(); res(); }; });
  }).then(function () {
    yt = new YT.Player(host, { videoId: ytId(v.url), playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 0, disablekb: 1, iv_load_policy: 3 },
      events: {
        onReady: function () { ready = true; p._d = yt.getDuration() || p._d; queue.splice(0).forEach(function (f) { f(); }); },
        onStateChange: function (e) {
          if (e.data === 0) onEnded();
          onPlayState(e.data === 1);
          if (p._onPlaying && e.data === 1) p._onPlaying();
        }
      } });
  }).catch(function () { toast('YouTube lässt sich gerade nicht laden'); });
  p.play = function () { when(function () { yt.playVideo(); }); };
  p.pause = function () { when(function () { yt.pauseVideo(); }); };
  p.paused = function () { return !ready || yt.getPlayerState() !== 1; };
  p.time = function () { return ready ? yt.getCurrentTime() : 0; };
  p.dur = function () { return ready ? (yt.getDuration() || p._d) : p._d; };
  p.seek = function (s) { when(function () { yt.seekTo(s, true); }); };
  p.buffered = function () { return ready ? yt.getVideoLoadedFraction() || 0 : 0; };
  // YouTube puffert erst nach dem ersten Abspielen: kurz stumm anspielen, dann anhalten
  p.startBuffer = function () {
    when(function () {
      var vol = yt.getVolume(), at = yt.getCurrentTime();
      yt.mute(); p._onPlaying = function () { p._onPlaying = null; yt.pauseVideo(); yt.seekTo(at, true); yt.unMute(); yt.setVolume(vol); };
      yt.playVideo();
    });
  };
  p.rate = function (r) { when(function () { yt.setPlaybackRate(r); }); };
  p.vol = function (x) { when(function () { yt.setVolume(Math.round(x * 100)); x ? yt.unMute() : yt.mute(); }); };
  p.shot = function () { return null; };
  p.destroy = function () { try { yt && yt.destroy(); } catch (e) {} frameEl.innerHTML = ''; };
  return p;
}

/* Vimeo über player.js (Werte kommen asynchron, deshalb zwischengespeichert) */
function vimeoPlayer(v) {
  var p = { kind: 'vimeo', canShot: false, _t: 0, _d: v.duration_sec || 0, _b: 0, _paused: true }, vp = null, queue = [];
  var host = document.createElement('div'); frameEl.appendChild(host);
  function when(f) { vp ? f() : queue.push(f); }
  loadScript('https://player.vimeo.com/api/player.js', function () { return window.Vimeo && Vimeo.Player; }).then(function () {
    vp = new Vimeo.Player(host, { url: v.url, responsive: false, dnt: true, title: false, byline: false, portrait: false });
    vp.on('timeupdate', function (d) { p._t = d.seconds; p._d = d.duration; });
    vp.on('progress', function (d) { p._b = d.percent; });
    vp.on('play', function () { p._paused = false; onPlayState(true); if (p._onPlaying) p._onPlaying(); });
    vp.on('pause', function () { p._paused = true; onPlayState(false); });
    vp.on('ended', function () { p._paused = true; onEnded(); });
    vp.getDuration().then(function (d) { p._d = d; });
    host.querySelector('iframe') && (host.querySelector('iframe').style.cssText = 'position:absolute;inset:0;width:100%;height:100%');
    queue.splice(0).forEach(function (f) { f(); });
  }).catch(function () { toast('Vimeo lässt sich gerade nicht laden'); });
  p.play = function () { when(function () { vp.play().catch(function () {}); }); };
  p.pause = function () { when(function () { vp.pause(); }); };
  p.paused = function () { return p._paused; };
  p.time = function () { return p._t; };
  p.dur = function () { return p._d; };
  p.seek = function (s) { p._t = s; when(function () { vp.setCurrentTime(s).catch(function () {}); }); };
  p.buffered = function () { return p._b; };
  p.startBuffer = function () {
    when(function () { vp.getVolume().then(function (vol) { vp.setVolume(0); p._onPlaying = function () { p._onPlaying = null; vp.pause(); vp.setCurrentTime(p._t); vp.setVolume(vol); }; vp.play(); }); });
  };
  p.rate = function (r) { when(function () { vp.setPlaybackRate(r).catch(function () {}); }); };
  p.vol = function (x) { when(function () { vp.setVolume(x); }); };
  p.shot = function () { return null; };
  p.destroy = function () { try { vp && vp.destroy(); } catch (e) {} frameEl.innerHTML = ''; };
  return p;
}

/* Google Drive: nur als Vorschau-Einbettung (keine Steuerung von außen möglich) */
function drivePlayer(v) {
  var f = document.createElement('iframe'); f.allow = 'autoplay; fullscreen'; f.src = 'https://drive.google.com/file/d/' + driveId(v.url) + '/preview';
  frameEl.appendChild(f);
  var noop = function () {};
  return { kind: 'drive', canShot: false, limited: true, play: noop, pause: noop, paused: function () { return true; }, time: function () { return 0; }, dur: function () { return v.duration_sec || 0; },
    seek: noop, buffered: function () { return 0; }, startBuffer: noop, rate: noop, vol: noop, shot: function () { return null; }, destroy: function () { f.remove(); } };
}

/* ---------- Film öffnen ---------- */
function openVideo(v, opts) {
  opts = opts || {};
  stopPreload();
  if (player) { saveProgress(true); player.destroy(); player = null; }
  frameEl.innerHTML = ''; current = v; onPlayState(false);
  $('ks-welcome').classList.add('ks-hide'); $('ks-ms').classList.add('ks-hide');
  $('ks-meta').classList.remove('ks-hide');
  $('ks-title').textContent = v.title;
  $('ks-sub').textContent = [v.course_name, v.chapter_name, v.category, v.duration_sec ? fmt(v.duration_sec) : ''].filter(Boolean).join(' · ');
  if (v.source === 'memberspot') {
    $('ks-ms-t').textContent = v.title; $('ks-ms').classList.remove('ks-hide');
  } else {
    player = v.source === 'youtube' ? ytPlayer(v) : v.source === 'vimeo' ? vimeoPlayer(v) : v.source === 'drive' ? drivePlayer(v) : mp4Player(v);
    player.rate(parseFloat($('ks-rate').value)); player.vol(parseFloat($('ks-vol').value));
    var pr = S.progress[v.id];
    if (pr && !pr.done && pr.sec > 15 && !opts.fromStart) { player.seek(pr.sec); toast('Weiter bei ' + fmt(pr.sec)); }
    if (player.limited) toast('Drive-Filme laufen in der Vorschau – Vorladen & Lesezeichen gehen hier nicht');
  }
  qa('#ks-controls button, #ks-controls select, #ks-controls input').forEach(function (b) { b.disabled = !player || (player.limited && !/ks-(fs|sidebtn)/.test(b.id)); });
  $('ks-shot').disabled = !player || player.limited;
  renderMeta(); renderSide(); renderMarks();
  store('ks_last', v.id);
  if (opts.autoplay && player) (S.prefs.autoPreload ? preload : function () { player.play(); })();
  if (!opts.noScroll) $('ks-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('ks-ms-go').onclick = function () { if (current && safeUrl(current.deep_link)) window.open(current.deep_link, '_blank', 'noopener'); else toast('Für diesen Film fehlt noch der Kurs-Link'); };
$('ks-ms-note').onclick = function () { $('ks-note-in').focus(); if (root.dataset.mode === 'kino') root.dataset.side = 'on'; };

/* ---------- Abspielen, Zeit, Leiste ---------- */
function onPlayState(on) { playing = on; $('ks-play').textContent = on ? '❚❚' : '▶'; if (on) focusTick(); }
function togglePlay() { if (!player) return; player.paused() ? player.play() : player.pause(); }
$('ks-play').onclick = togglePlay;
$('ks-back').onclick = function () { player && player.seek(player.time() - 10); };
$('ks-fwd').onclick = function () { player && player.seek(player.time() + 10); };
$('ks-rate').onchange = function () { player && player.rate(parseFloat(this.value)); };
$('ks-vol').oninput = function () { player && player.vol(parseFloat(this.value)); };
$('ks-fs').onclick = function () {
  var el = root.dataset.mode === 'kino' ? root : $('ks-screen');
  document.fullscreenElement ? document.exitFullscreen() : (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen && el.webkitRequestFullscreen());
};
$('ks-seek').addEventListener('click', function (e) {
  if (!player || !player.dur()) return;
  var r = this.getBoundingClientRect(); player.seek((e.clientX - r.left) / r.width * player.dur());
});
setInterval(function () {
  if (!player) return;
  var d = player.dur(), tm = player.time();
  $('ks-time').textContent = fmt(tm) + ' / ' + fmt(d);
  qa('#ks-seek .pos')[0].style.width = (d ? tm / d * 100 : 0) + '%';
  qa('#ks-seek .buf')[0].style.width = (player.buffered() * 100) + '%';
}, 250);

/* ---------- Vorladen: erst puffern, dann ruckelfrei starten ---------- */
function stopPreload() { if (preloading) { clearInterval(preloading.iv); preloading = null; } $('ks-buf').classList.add('ks-hide'); }
function preload() {
  if (!player || player.limited) return;
  if (player.buffered() >= KS_CONFIG.preloadTarget) return player.play();
  $('ks-buf').classList.remove('ks-hide'); player.startBuffer();
  var best = 0, still = 0;
  preloading = { iv: setInterval(function () {
    var b = player.buffered(), goal = KS_CONFIG.preloadTarget, pct = Math.min(100, Math.round(b / goal * 100));
    $('ks-buf-p').textContent = pct + ' %'; qa('#ks-buf .ks-ring')[0].style.setProperty('--p', pct + '%');
    if (b > best + .002) { best = b; still = 0; } else still++;
    $('ks-buf-t').textContent = still > 20 ? 'Die Quelle liefert gerade nichts nach – du kannst trotzdem starten.' : 'Film wird vorgeladen … (' + Math.round(b * 100) + ' % des Films im Speicher)';
    if (b >= goal) { stopPreload(); player.play(); }
  }, 250) };
}
$('ks-pre').onclick = preload;
$('ks-buf-go').onclick = function () { stopPreload(); player && player.play(); };
$('ks-buf-x').onclick = stopPreload;

/* ---------- Fortschritt ---------- */
var lastSave = 0;
function saveProgress(force) {
  if (!player || !current || player.limited) return;
  var tm = player.time(), d = player.dur(); if (!tm) return;
  if (!force && Date.now() - lastSave < 10000) return; lastSave = Date.now();
  var row = { video_id: current.id, sec: Math.round(tm), done: d ? tm / d > .95 : false, updated_at: new Date().toISOString() };
  S.progress[current.id] = row;
  if (S.me && !/^demo/.test(current.id)) sb.from('ks_progress').upsert(Object.assign({ user_id: S.me.id }, row)).then(function () {});
  else store('ks_progress', JSON.stringify(S.progress));
}
setInterval(function () { if (playing) saveProgress(); }, 2000);
window.addEventListener('pagehide', function () { saveProgress(true); });

function onEnded() {
  onPlayState(false);
  if (current) { S.progress[current.id] = Object.assign({}, S.progress[current.id], { video_id: current.id, sec: 0, done: true }); saveProgress(true); }
  renderCatalog();
  if ($('ks-aftermed').checked) startMeditation('film');
}

/* ---------- Lesezeichen mit einem Klick ---------- */
function addBookmark() {
  if (!player || !current || player.limited) return;
  var sec = Math.round(player.time() * 10) / 10, row = { id: uuid(), video_id: current.id, sec: sec, label: 'Moment bei ' + fmt(sec), created_at: new Date().toISOString() };
  if (!/^demo/.test(current.id)) { if (needLogin('Lesezeichen')) return; sb.from('ks_bookmarks').insert({ id: row.id, video_id: row.video_id, sec: row.sec, label: row.label }).then(function (r) { if (r.error) toast('Lesezeichen nicht gespeichert'); }); }
  S.bookmarks.push(row); S.bookmarks.sort(function (a, b) { return a.sec - b.sec; });
  toast('🔖 ' + row.label); renderMarks(); renderSide();
}
$('ks-bm').onclick = addBookmark;
function renderMarks() {
  var d = player && player.dur(), box = $('ks-marks');
  box.innerHTML = !current || !d ? '' : S.bookmarks.filter(function (b) { return b.video_id === current.id; })
    .map(function (b) { return '<div class="mk" style="left:' + (b.sec / d * 100) + '%" title="' + esc(b.label) + '"></div>'; }).join('');
}
setInterval(function () { if (player && player.dur() && !$('ks-marks').children.length) renderMarks(); }, 2000);

/* ---------- Bildschirmfoto → Notiz ---------- */
function grabTab() {
  // Fallback für YouTube/Vimeo: einmal den Tab freigeben, ein Einzelbild nehmen, Freigabe sofort beenden
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return Promise.reject(new Error('nosupport'));
  return navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: false, preferCurrentTab: true }).then(function (stream) {
    var v = document.createElement('video'); v.srcObject = stream; v.muted = true;
    return v.play().then(function () { return new Promise(function (r) { setTimeout(r, 300); }); }).then(function () {
      var c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
      stream.getTracks().forEach(function (t) { t.stop(); });
      return new Promise(function (res) { c.toBlob(res, 'image/jpeg', .9); });
    });
  });
}
function screenshot() {
  if (!player || !current) return;
  if (needLogin('Bildschirmfotos')) return;
  var sec = player.time(), p = player.shot();
  (p || grabTab()).then(function (blob) {
    if (!blob) throw new Error('leer');
    return uploadImage(blob, 'jpg').then(function (path) { return saveNote({ body: '📷 Bild bei ' + fmt(sec), sec: sec, images: [path] }); });
  }).then(function () { toast('📷 In deinen Notizen'); })
    .catch(function (e) { toast(e && e.message === 'nosupport' ? 'Dieser Browser kann hier kein Bildschirmfoto machen' : 'Bildschirmfoto abgebrochen'); });
}
$('ks-shot').onclick = screenshot;
