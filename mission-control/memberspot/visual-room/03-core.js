/* ======================= VR_CONFIG =======================
   player:  Standard-Player für Gäste (Spotify/SoundCloud/YouTube-Link).
            Leer = Elfsight-Audioplayer aus dem Meditationsraum.
            Vorrang: angeklickter Künstler (nur Sitzung) > eigener Player
            des angemeldeten Mitglieds > Admin-Standard (Passwort) > dieser.
   standalone: Adresse der Vollbild-Fassung (eigener Tab).
   ========================================================= */
var VR_CONFIG = {
  player: "",
  playerHeight: 352,
  elfsightId: "5814598d-e2cd-4df1-aec3-d1e94af3e9d7",
  api: "https://emxqoahtipbmumghlixb.supabase.co",
  apiKey: "sb_publishable_LPbsKEws5DMQLcKix0X2AQ_VtYNbO-P",
  standalone: window.VR_STANDALONE_URL || ""
};

var root = document.getElementById('vr-root');
if (!root || root.dataset.ready) return;
root.dataset.ready = '1';
var IS_STANDALONE = !!window.VR_IS_STANDALONE;
var modeQuery = new URLSearchParams(location.search);
var PIXEL = modeQuery.has('pixel') ? modeQuery.get('pixel') === '1' : window.VR_MODE === 'pixel';
root.classList.add(PIXEL ? 'vr-pixel' : 'vr-cinematic');
var assetBase = window.VR_ASSET_BASE || new URL('visual-room-assets/', document.currentScript && document.currentScript.src || location.href).href;   // Pixel-Art-Fassung: alles gezeichnet, keine Fotos, weniger Last
// Sicherheitsnetz: negative Radien (z. B. in Übergängen) würden die ganze Zeichenschleife abbrechen
(function (P) { if (P.__vrSafe) return; P.__vrSafe = 1; var el = P.ellipse, ar = P.arc;
  P.ellipse = function (x, y, rx, ry, r, a, b, c) { return el.call(this, x, y, Math.max(0, rx), Math.max(0, ry), r, a, b, c); };
  P.arc = function (x, y, r, a, b, c) { return ar.call(this, x, y, Math.max(0, r), a, b, c); };
})(CanvasRenderingContext2D.prototype);
if (PIXEL) { window.VR_PHOTOS = {}; window.VR_WPHOTO = {}; }
var $ = function (id) { return document.getElementById(id); };
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, k) { return a + (b - a) * k; }
function smooth(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function safeUrl(u) { return typeof u === 'string' && /^https:\/\/[^\s"<>]+$/.test(u) ? u : ''; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function uuid() { return (crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2)); }

/* ---------- Supabase: ein Konto für das ganze NEO-Ökosystem ---------- */
var sb = null, user = null;
var sbReady = new Promise(function (res) {
  function make() {
    sb = window.supabase.createClient(VR_CONFIG.api, VR_CONFIG.apiKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'neo-auth' } });
    sb.auth.onAuthStateChange(function (ev, session) {
      var was = user && user.id; user = session ? session.user : null;
      if ((user && user.id) !== was && ev !== 'INITIAL_SESSION') loadState();
    });
    sb.auth.getSession().then(function (r) { user = r.data.session ? r.data.session.user : null; res(); });
  }
  if (window.supabase && window.supabase.createClient) return make();
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = make; s.onerror = function () { res(); };
  document.head.appendChild(s);
});

var S = { me: null, artists: [], albums: [], songs: [], playlists: [], samples: [], favorites: [], default_player: null };
var onState = [];
function rows(r) { return r && !r.error && r.data ? r.data : []; }
function loadState() {
  return sbReady.then(function () {
    if (!sb) throw new Error('offline');
    var uid = user && user.id;
    return Promise.all([
      sb.from('vr_artists').select('*').order('name'),
      sb.from('vr_albums').select('*').order('title'),
      sb.from('vr_songs').select('*').order('title'),
      sb.from('vr_playlists').select('*').order('updated_at', { ascending: false }),
      sb.from('vr_samples').select('*').order('created_at', { ascending: false }).limit(500),
      sb.rpc('vr_public_settings'),
      uid ? sb.from('vr_user_settings').select('*').eq('user_id', uid).maybeSingle() : null,
      uid ? sb.from('neo_profiles').select('*').eq('id', uid).maybeSingle() : null
    ]).then(function (r) {
      function mine(x) { x.mine = !!uid && (x.created_by === uid || x.owner === uid); return x; }
      S.artists = rows(r[0]).map(mine); S.albums = rows(r[1]).map(mine); S.songs = rows(r[2]).map(mine);
      S.playlists = rows(r[3]).map(mine); S.samples = rows(r[4]).map(mine);
      var pub = r[5] && r[5].data || {};
      S.default_player = pub.visual_room_player || null;
      if (pub.standalone_url && !VR_CONFIG.standalone) VR_CONFIG.standalone = pub.standalone_url;
      var set = r[6] && r[6].data, prof = r[7] && r[7].data;
      S.favorites = set && set.favorites || [];
      S.studioPrefs = set && set.studio || {};
      S.me = uid ? { id: uid, email: user.email, name: (prof && prof.display_name) || (user.user_metadata && user.user_metadata.display_name) || (user.email || '').split('@')[0],
                      avatar: prof && prof.avatar_url, player_url: set && set.player_url || null } : null;
      if (uid && !prof) sb.from('neo_profiles').insert({ id: uid, display_name: S.me.name }).then(function () {});
      var owners = {}; S.playlists.forEach(function (p) { owners[p.owner] = 1; });
      var ids = Object.keys(owners);
      return (ids.length ? sb.from('neo_profiles').select('id,display_name').in('id', ids) : Promise.resolve({ data: [] })).then(function (pr) {
        var nm = {}; rows(pr).forEach(function (p) { nm[p.id] = p.display_name; });
        S.playlists.forEach(function (p) { p.owner_name = nm[p.owner] || 'Mitglied'; });
        onState.forEach(function (f) { f(); });
      });
    });
  });
}
function saveSettings(patch) {
  if (!S.me) return Promise.resolve();
  patch.user_id = S.me.id; patch.updated_at = new Date().toISOString();
  return sb.from('vr_user_settings').upsert(patch);
}
function byId(kind, id) {
  var arr = kind === 'artist' ? S.artists : kind === 'album' ? S.albums : kind === 'song' ? S.songs : kind === 'sample' ? S.samples : S.playlists;
  for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
  return null;
}
function publicUrl(bucket, path) { return VR_CONFIG.api + '/storage/v1/object/public/' + bucket + '/' + path; }
function upload(bucket, file, ext, type, onProgress) {
  return sb.auth.getSession().then(function (r) {
    var s = r.data.session; if (!s) throw new Error('auth');
    var path = s.user.id + '/' + uuid() + '.' + ext;
    return new Promise(function (res, rej) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', VR_CONFIG.api + '/storage/v1/object/' + bucket + '/' + path);
      xhr.setRequestHeader('apikey', VR_CONFIG.apiKey); xhr.setRequestHeader('Authorization', 'Bearer ' + s.access_token);
      xhr.setRequestHeader('Content-Type', type || file.type || 'application/octet-stream');
      if (onProgress) xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      xhr.onload = function () { xhr.status < 300 ? res({ path: path, url: publicUrl(bucket, path) }) : rej(new Error('upload ' + xhr.status)); };
      xhr.onerror = function () { rej(new Error('net')); };
      xhr.send(file);
    });
  });
}

/* ---------- Klang ---------- */
var actx = null, fxOut = null, master = null, vizAn = null;
function MASTER() { ctx(); return master; }
var soundOn = store('vr_sound') !== 'off';
function ctx() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.connect(actx.destination);
    vizAn = actx.createAnalyser(); vizAn.fftSize = 1024; vizAn.smoothingTimeConstant = .75; master.connect(vizAn);
    fxOut = actx.createGain(); fxOut.gain.value = soundOn ? 1 : 0; fxOut.connect(master);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
var audioReady = false;
['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
  window.addEventListener(ev, function () { ctx(); audioReady = true; }, { passive: true, capture: true });
});
function setSound(on) {
  soundOn = on; store('vr_sound', on ? 'on' : 'off');
  if (fxOut) fxOut.gain.setTargetAtTime(on ? 1 : 0, actx.currentTime, .05);
  var b = $('vr-mute'); if (b) { b.innerHTML = on ? '🔔' : '🔕'; b.title = on ? 'Klänge an — klicken zum Ausschalten' : 'Klänge aus — klicken zum Einschalten'; b.classList.toggle('on', !on); }
}
// Gong: unharmonische Teiltöne einer Bronzescheibe, Ton sinkt nach dem Schlag leicht ab
function strike(when, vol, f0, long, dest) {
  var c = ctx(), t = when; f0 = f0 || 98; var L = long || 1;
  var out = c.createGain(); out.gain.value = vol;
  var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(900, t + 6 * L);
  out.connect(lp); lp.connect(dest || master);
  [[1, .55, 9], [1.004, .35, 9.5], [1.51, .28, 7], [2.02, .2, 6], [2.74, .16, 4.5], [3.41, .1, 3.5], [4.19, .07, 2.5], [5.43, .05, 1.8], [6.8, .03, 1.2]].forEach(function (p) {
    var o = c.createOscillator(), g = c.createGain(), d = p[2] * L;
    o.frequency.setValueAtTime(f0 * p[0] * 1.012, t);
    o.frequency.exponentialRampToValueAtTime(f0 * p[0], t + 1.8);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(p[1], t + .02 + p[0] * .004);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .1);
  });
  var len = c.sampleRate * .25 | 0, buf = c.createBuffer(1, len, c.sampleRate), dd = buf.getChannelData(0);
  for (var i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  var n = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
  bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .8; ng.gain.value = .25;
  n.buffer = buf; n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t);
}
// Klangrohr: Biegeschwinger-Teiltöne 1 : 2.76 : 5.40 : 8.93
var CHIME_NOTES = [587.3, 659.3, 740, 880, 987.8, 1174.7];
function chimeNote(i, vel, dest, when) {
  if (!dest && (!audioReady || !soundOn)) return;
  var c = ctx(), t = when || c.currentTime + .01, f = CHIME_NOTES[i % CHIME_NOTES.length];
  var out = c.createGain(); out.gain.value = .07 * clamp(vel, .15, 1); out.connect(dest || fxOut);
  [[1, 1, 4.5], [2.76, .45, 2.4], [5.4, .22, 1.2], [8.93, .08, .6]].forEach(function (p) {
    var o = c.createOscillator(), g = c.createGain();
    o.frequency.value = f * p[0] * (1 + (Math.random() - .5) * .002);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(p[1], t + .004);
    g.gain.exponentialRampToValueAtTime(.0001, t + p[2]);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + p[2] + .05);
  });
}

/* ---------- Tempo: gemeinsamer Takt für Beat-Anzeige, Studio, MIDI ---------- */
var TEMPO = { bpm: +(store('vr_bpm') || 72), chief: store('vr_chief') || 'studio', origin: performance.now(), taps: [] };
function setBpm(b, keepPhase) {
  b = clamp(+b || 72, 20, 300);
  if (keepPhase) { var ph = beatPhase(); TEMPO.bpm = b; TEMPO.origin = performance.now() - ph * 60000 / b; }
  else TEMPO.bpm = b;
  store('vr_bpm', String(b)); onTempo.forEach(function (f) { f(); });
}
var onTempo = [], afterFrame = [];
function beatPhase(now) { var p = ((now || performance.now()) - TEMPO.origin) / (60000 / TEMPO.bpm); return p - Math.floor(p); }
function tapTempo() {
  var n = performance.now(), T = TEMPO.taps;
  if (T.length && n - T[T.length - 1] > 2500) T.length = 0;
  T.push(n); if (T.length > 8) T.shift();
  if (T.length >= 3) { var d = (T[T.length - 1] - T[0]) / (T.length - 1); setBpm(60000 / d); TEMPO.origin = n; }
}

/* ---------- Player ---------- */
var pl = $('vr-player'), nowEl = $('vr-now');
var session = null;            // { url, label, list, idx }  — nur diese Sitzung
var embedKind = 'elfsight', currentUrl = null, playerPaused = false;
function toEmbed(u) {
  var m;
  if ((m = u.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/)))
    return { src: 'https://open.spotify.com/embed/' + m[1] + '/' + m[2], h: 352, kind: 'spotify' };
  if ((m = u.match(/[?&]list=([\w-]+)/)) && /youtu/.test(u)) return { src: 'https://www.youtube.com/embed/videoseries?enablejsapi=1&list=' + m[1], ratio: true, kind: 'youtube' };
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/))) return { src: 'https://www.youtube.com/embed/' + m[1] + '?enablejsapi=1', ratio: true, kind: 'youtube' };
  if (/soundcloud\.com/.test(u) && !/w\.soundcloud\.com/.test(u))
    return { src: 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u) + '&color=%23b5542a&visual=true', h: 300, kind: 'soundcloud' };
  if (/bandcamp\.com\/EmbeddedPlayer/.test(u)) return { src: u, h: 120, kind: 'bandcamp' };
  return { src: u, h: VR_CONFIG.playerHeight, kind: /spotify/.test(u) ? 'spotify' : 'other' };
}
var externalPlayerAllowed = !PIXEL;
function renderPlayer(u) {
  if (!externalPlayerAllowed) {
    if (!pl.querySelector('[data-load-player]')) {
      pl.innerHTML = '<div class="vr-player-consent"><span>KLANGWELTEN</span><h3>Dein Moment der Ruhe.</h3><p>Der Pixel-Raum spart Daten. Musik wird erst geladen, wenn du bereit bist. Gong und Studio funktionieren auch ohne externen Player.</p><button data-load-player>Musikplayer laden</button></div>';
      pl.querySelector('button').onclick = function () { externalPlayerAllowed = true; currentUrl = null; refreshPlayer(); };
    }
    return;
  }
  if (playerStopped && !playerPaused) return;
  if (playerPaused) { if (pl.firstChild) { pl.innerHTML = '<div class="vr-paused">▶ läuft gerade im Vollbild-Tab</div>'; currentUrl = null; } return; }
  if (u === currentUrl && pl.firstChild) return;
  currentUrl = u; pl.innerHTML = '';
  if (u) {
    var e = toEmbed(u), f = document.createElement('iframe');
    f.src = e.src; embedKind = e.kind;
    if (e.ratio) f.style.aspectRatio = '16/9'; else f.height = e.h;
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    pl.appendChild(f);
  } else {
    embedKind = 'elfsight';
    pl.innerHTML = '<div class="elfsight-app-' + VR_CONFIG.elfsightId + '" data-elfsight-app-lazy></div>';
    if (!document.querySelector('script[src*="elfsight.com/platform"]')) {
      var s = document.createElement('script'); s.src = 'https://static.elfsight.com/platform/platform.js'; s.async = true; document.body.appendChild(s);
    }
  }
}
function basePlayer() { return (S.me && S.me.player_url) || S.default_player || VR_CONFIG.player || ''; }
function playerUrlNow() { return session ? session.url : basePlayer(); }
function refreshPlayer() {
  renderPlayer(playerUrlNow());
  if (session && !playerPaused) {
    nowEl.innerHTML = '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">▶ ' + esc(session.label) + '</span>' +
      (session.list ? '<button data-n="-1" title="Zurück">⏮</button><button data-n="1" title="Weiter">⏭</button>' : '') +
      '<button data-n="0" title="Zurück zu deinem Player">✕</button>';
  } else nowEl.innerHTML = '';
}
nowEl.addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  var n = +b.dataset.n;
  if (!n) { session = null; refreshPlayer(); return; }
  stepList(n);
});
function playItem(kind, id, list, idx) {
  var it = byId(kind, id); if (!it) return false;
  var url = it.player_url, label = it.name || it.title;
  if (kind === 'album' || kind === 'song') { var a = byId('artist', it.artist_id); if (a) label += ' · ' + a.name; if (!url && a) url = a.player_url; }
  if (kind === 'playlist') { if (!it.items.length) return false; return playItem(it.items[0].t, it.items[0].id, it, 0); }
  if (!safeUrl(url)) { toast('Für „' + label + '“ ist noch kein Player-Link hinterlegt.'); return false; }
  session = { url: url, label: label, list: list || null, idx: idx || 0 };
  refreshPlayer(); return true;
}
function stepList(n) {
  if (!session || !session.list) return;
  var items = session.list.items, i = session.idx;
  for (var k = 0; k < items.length; k++) {
    i = (i + n + items.length) % items.length;
    if (playItem(items[i].t, items[i].id, session.list, i)) return;
  }
}
var toastT = null;
function toast(msg) {
  nowEl.innerHTML = '<span>' + esc(msg) + '</span>';
  clearTimeout(toastT); toastT = setTimeout(refreshPlayer, 3500);
}

/* ---------- Bühne: Scroll & Ruhe ---------- */
var bg = $('vr-bg'), main = $('vr-main');
var W = 0, H = 0, DPR = 1, sv = 0, svS = 0, svVel = 0, svMax = 1;
function readScroll() {
  var bh = Math.max(1, bg.offsetHeight), d = bg.getBoundingClientRect().top - main.getBoundingClientRect().top;
  sv = Math.max(0, d / bh); svMax = Math.max(1, (main.offsetHeight - bh) / bh);
}
window.addEventListener('scroll', readScroll, { passive: true, capture: true });
var IDLE_MS = 5000, lastInput = performance.now();
['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach(function (ev) {
  window.addEventListener(ev, function () { lastInput = performance.now(); }, { passive: true, capture: true });
});
