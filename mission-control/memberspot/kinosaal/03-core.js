/* ======================= KS_CONFIG =======================
   Einstellungen, die ohne neuen Build änderbar sind, liegen in
   Supabase-Tabelle ks_settings (lesbar über rpc ks_public_settings):
     meditation_audio   – Adresse der Meditationsmusik (mp3)
     meditationsraum_url, visual_room_url, standalone_url
   ========================================================= */
var KS_CONFIG = {
  api: "https://emxqoahtipbmumghlixb.supabase.co",
  apiKey: "sb_publishable_LPbsKEws5DMQLcKix0X2AQ_VtYNbO-P",
  preloadTarget: 0.25,     // Anteil, bis zu dem „Vorladen“ puffert
  medMinutes: 10,          // Meditation nach dem Film
  focusWork: 45, focusBreak: 5
};

var root = document.getElementById('ks-root');
if (!root || root.dataset.ready) return;
root.dataset.ready = '1';
var $ = function (id) { return document.getElementById(id); };
var qa = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function safeUrl(u) { return typeof u === 'string' && /^https:\/\/[^\s"<>]+$/.test(u) ? u : ''; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2); }
function fmt(s) { s = Math.max(0, Math.floor(s || 0)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); }
var toastT = 0;
function toast(msg) { var t = $('ks-toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600); }

/* ---------- Supabase: dasselbe NEO-Konto wie Visual Room & Studio ---------- */
var sb = null, user = null;
var sbReady = new Promise(function (res) {
  function make() {
    sb = window.supabase.createClient(KS_CONFIG.api, KS_CONFIG.apiKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'neo-auth' } });
    sb.auth.onAuthStateChange(function (ev, session) {
      var was = user && user.id; user = session ? session.user : null;
      if ((user && user.id) !== was && ev !== 'INITIAL_SESSION') loadMine();
    });
    sb.auth.getSession().then(function (r) { user = r.data.session ? r.data.session.user : null; res(); });
  }
  if (window.supabase && window.supabase.createClient) return make();
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = make; s.onerror = function () { res(); };
  document.head.appendChild(s);
});

/* Gesamtzustand. Persönliches nur mit Anmeldung (RLS: nur eigene Zeilen). */
var S = { videos: [], settings: {}, me: null, fav: {}, wish: {}, playlists: [], plItems: {}, bookmarks: [], notes: [], progress: {}, prefs: {} };
var onState = [];
function emit() { onState.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
function rows(r) { return r && !r.error && r.data ? r.data : []; }

function loadAll() {
  return sbReady.then(function () {
    if (!sb) { toast('Keine Verbindung – Kinosaal läuft eingeschränkt'); emit(); return; }
    return Promise.all([
      sb.from('ks_videos').select('*').order('sort').order('created_at', { ascending: false }).limit(2000),
      sb.rpc('ks_public_settings'),
      sb.rpc('vr_public_settings')
    ]).then(function (r) {
      S.videos = rows(r[0]);
      S.settings = (r[1] && r[1].data) || {};
      var vr = (r[2] && r[2].data) || {};
      if (!S.settings.visual_room_url && vr.standalone_url) S.settings.visual_room_url = vr.standalone_url;
      if (!S.videos.length && /[?&]ks-demo/.test(location.search)) S.videos = DEMO;
      return loadMine();
    });
  });
}

function loadMine() {
  var uid = user && user.id;
  if (!sb || !uid) {
    S.me = null; S.fav = {}; S.wish = {}; S.playlists = []; S.plItems = {}; S.bookmarks = []; S.notes = [];
    try { S.progress = JSON.parse(store('ks_progress') || '{}'); } catch (e) { S.progress = {}; }
    emit(); return Promise.resolve();
  }
  return Promise.all([
    sb.from('ks_favorites').select('video_id,kind'),
    sb.from('ks_playlists').select('*').order('created_at'),
    sb.from('ks_playlist_items').select('*').order('pos'),
    sb.from('ks_bookmarks').select('*').order('sec'),
    sb.from('ks_notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(500),
    sb.from('ks_progress').select('*'),
    sb.from('ks_user_settings').select('prefs').maybeSingle(),
    sb.from('neo_profiles').select('display_name').eq('id', uid).maybeSingle()
  ]).then(function (r) {
    S.fav = {}; S.wish = {};
    rows(r[0]).forEach(function (f) { (f.kind === 'wish' ? S.wish : S.fav)[f.video_id] = 1; });
    S.playlists = rows(r[1]);
    S.plItems = {}; rows(r[2]).forEach(function (i) { (S.plItems[i.playlist_id] = S.plItems[i.playlist_id] || []).push(i.video_id); });
    S.bookmarks = rows(r[3]); S.notes = rows(r[4]);
    S.progress = {}; rows(r[5]).forEach(function (p) { S.progress[p.video_id] = p; });
    S.prefs = (r[6] && r[6].data && r[6].data.prefs) || {};
    var prof = r[7] && r[7].data;
    S.me = { id: uid, email: user.email, name: (prof && prof.display_name) || (user.user_metadata && user.user_metadata.display_name) || (user.email || '').split('@')[0] };
    if (!prof) sb.from('neo_profiles').insert({ id: uid, display_name: S.me.name }).then(function () {});
    emit();
  });
}

function needLogin(what) { if (S.me) return false; toast('Bitte anmelden, um ' + (what || 'das') + ' zu speichern'); openAuth(); return true; }
function savePrefs(patch) {
  Object.assign(S.prefs, patch);
  store('ks_prefs', JSON.stringify(S.prefs));
  if (S.me) sb.from('ks_user_settings').upsert({ user_id: S.me.id, prefs: S.prefs, updated_at: new Date().toISOString() }).then(function () {});
}
try { S.prefs = JSON.parse(store('ks_prefs') || '{}'); } catch (e) {}

/* Private Bilder (Notizen/Screenshots) im Bucket ks-media, Ordner = eigene ID */
function uploadImage(blob, ext) {
  var path = S.me.id + '/' + uuid() + '.' + (ext || 'png');
  return sb.storage.from('ks-media').upload(path, blob, { contentType: blob.type || 'image/png' }).then(function (r) {
    if (r.error) throw r.error; return path;
  });
}
var signed = {};
function imageUrl(path) {
  if (signed[path] && signed[path].until > Date.now()) return Promise.resolve(signed[path].url);
  return sb.storage.from('ks-media').createSignedUrl(path, 3600).then(function (r) {
    if (r.error) throw r.error; signed[path] = { url: r.data.signedUrl, until: Date.now() + 3000e3 }; return r.data.signedUrl;
  });
}

/* ---------- Modal & Anmeldung ---------- */
function modal(html) {
  $('ks-modal-box').innerHTML = html + '<div class="ks-row" style="justify-content:flex-end;margin-top:14px"><button data-close>Schließen</button></div>';
  $('ks-modal').classList.remove('ks-hide');
  var f = $('ks-modal-box').querySelector('input,textarea,select'); if (f) f.focus();
  return $('ks-modal-box');
}
function closeModal() { $('ks-modal').classList.add('ks-hide'); }
$('ks-modal').addEventListener('click', function (e) { if (e.target.id === 'ks-modal' || e.target.hasAttribute('data-close')) closeModal(); });

function authErr(m) {
  if (/invalid login/i.test(m)) return 'E-Mail oder Passwort stimmt nicht.';
  if (/already registered/i.test(m)) return 'Diese E-Mail hat schon ein Konto – bitte anmelden.';
  if (/password/i.test(m)) return 'Das Passwort braucht mindestens 6 Zeichen.';
  return m;
}
function openAuth() {
  if (S.me) {
    var b = modal('<h3>Dein NEO-Konto</h3><p class="ks-muted">Angemeldet als ' + esc(S.me.name) + ' (' + esc(S.me.email) + '). Dasselbe Konto gilt für Visual Room, Studio und Kinosaal.</p><button id="ks-out">Abmelden</button>');
    b.querySelector('#ks-out').onclick = function () { sb.auth.signOut().then(closeModal); };
    return;
  }
  var reg = false;
  var b = modal('<h3 id="a-h">Anmelden</h3><p class="ks-muted">Ein Konto für das ganze NEO-Universum: Visual Room, Studio, Kinosaal.</p>' +
    '<div id="a-nw" class="ks-hide"><label>Name</label><input id="a-name" autocomplete="name"></div>' +
    '<label>E-Mail</label><input id="a-mail" type="email" autocomplete="email"><label>Passwort</label><input id="a-pw" type="password" autocomplete="current-password">' +
    '<p id="a-msg" class="ks-muted" style="min-height:1.4em"></p>' +
    '<div class="ks-row" style="justify-content:flex-start"><button id="a-go" class="on">Anmelden</button><button id="a-sw">Neues Konto</button><button id="a-fg">Passwort vergessen</button></div>');
  function msg(t) { b.querySelector('#a-msg').textContent = t; }
  b.querySelector('#a-sw').onclick = function () {
    reg = !reg; b.querySelector('#a-nw').classList.toggle('ks-hide', !reg);
    b.querySelector('#a-h').textContent = reg ? 'Konto anlegen' : 'Anmelden';
    b.querySelector('#a-go').textContent = reg ? 'Konto anlegen' : 'Anmelden';
    this.textContent = reg ? 'Ich habe ein Konto' : 'Neues Konto';
  };
  b.querySelector('#a-fg').onclick = function () {
    var mail = b.querySelector('#a-mail').value.trim(); if (!mail) return msg('Bitte E-Mail eintragen.');
    sb.auth.resetPasswordForEmail(mail, { redirectTo: location.href }).then(function () { msg('Wenn es das Konto gibt, ist ein Link unterwegs.'); });
  };
  b.querySelector('#a-go').onclick = function () {
    var mail = b.querySelector('#a-mail').value.trim(), p = b.querySelector('#a-pw').value;
    if (!mail || !p) return msg('Bitte E-Mail und Passwort eintragen.');
    var call = reg ? sb.auth.signUp({ email: mail, password: p, options: { data: { display_name: b.querySelector('#a-name').value.trim() } } })
                   : sb.auth.signInWithPassword({ email: mail, password: p });
    call.then(function (r) {
      if (r.error) return msg(authErr(r.error.message));
      if (reg && !r.data.session) return msg('Fast geschafft: Bitte bestätige die E-Mail.');
      closeModal(); toast('Willkommen im Kinosaal');
    });
  };
}
$('ks-account').onclick = function () { sbReady.then(openAuth); };
onState.push(function () { $('ks-account').textContent = S.me ? '◉ ' + S.me.name : 'Anmelden'; });

/* Beispielfilme nur mit ?ks-demo, solange der Katalog leer ist */
var DEMO = [
  { id: 'demo-1', source: 'mp4', title: 'Sintel (Blender Open Movie)', category: 'Demo', url: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4', thumb: 'https://durian.blender.org/wp-content/uploads/2010/06/05.8b_comp_000272.jpg', duration_sec: 52, tags: ['demo'] },
  { id: 'demo-2', source: 'youtube', title: 'Big Buck Bunny', category: 'Demo', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', duration_sec: 635, tags: ['demo'] },
  { id: 'demo-3', source: 'memberspot', title: 'Qi-Gong Level 1 – Einführung', category: 'Academy', course_name: 'Qi-Gong', deep_link: 'https://example.org', tags: ['demo'] }
];
