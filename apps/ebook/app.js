(() => {
'use strict';
const C = window.NEO_CONFIG;
const $ = (id) => document.getElementById(id);
const qs = new URLSearchParams(location.search);
if (qs.get('embed')) document.body.classList.add('embed');
let view = qs.get('view') || 'all';
const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true } });
let user = null, owned = new Set(), progress = {};

const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* privater Modus */ } };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Auth ---------- */
async function init() {
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  sb.auth.onAuthStateChange((_e, s) => { const u = s?.user || null; if ((u?.id) !== (user?.id)) { user = u; render(); } });
  render();
}
async function render() {
  $('login').hidden = !!user; $('lib').hidden = !user; $('logout').hidden = !user;
  $('who').textContent = user?.email || '';
  if (!user) return;
  const { data } = await sb.from('neo_access').select('product').is('revoked_at', null);
  owned = new Set((data || []).map((r) => r.product));
  const pr = await sb.from('book_progress').select('product,kind,percent,position');
  progress = {};
  (pr.data || []).forEach((r) => { progress[r.product + ':' + r.kind] = r; });
  drawGrid();
}
const setMsg = (t) => { $('msg').textContent = t; };
$('doLogin').onclick = async () => {
  setMsg('Einen Moment …');
  const { error } = await sb.auth.signInWithPassword({ email: $('em').value.trim(), password: $('pw').value });
  setMsg(error ? 'Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.' : '');
};
$('doMagic').onclick = async () => {
  const email = $('em').value.trim();
  if (!email) return setMsg('Bitte E-Mail eingeben.');
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  setMsg(error ? 'Link konnte nicht gesendet werden.' : 'Link gesendet – bitte Postfach prüfen.');
};
$('logout').onclick = () => sb.auth.signOut();
document.querySelectorAll('#tabs button').forEach((b) => {
  b.onclick = () => { view = b.dataset.v; document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('on', x === b)); drawGrid(); };
});

/* ---------- Bibliothek ---------- */
function drawGrid() {
  const list = C.books.filter((b) => view === 'all' || b.kind === view);
  $('grid').innerHTML = list.length ? '' : '<p class="lead">Hier erscheint bald etwas Neues.</p>';
  list.forEach((b) => {
    const has = owned.has(b.product);
    const pg = progress[b.product + ':' + b.kind];
    const pct = Math.round(pg?.percent || 0);
    const el = document.createElement('div');
    el.className = 'card' + (has ? '' : ' lock');
    el.innerHTML = `<div class="cover" data-cover="${esc(b.product)}">${esc(b.title)}</div>
      <div class="meta"><span class="badge">${b.kind === 'ebook' ? 'E-Book' : 'Hörbuch'}</span>
      <h3>${esc(b.title)}</h3><p>${esc(b.author)}</p>
      ${has ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
      <div class="act">${has
        ? `<button class="primary" data-open>${b.kind === 'ebook' ? 'Lesen' : 'Hören'}</button><button data-dl>Download</button>`
        : `<a href="${esc(b.buy)}" target="_top" rel="noopener"><button class="primary">Im Shop kaufen</button></a>`}</div></div>`;
    $('grid').appendChild(el);
    if (has && b.cover) signedUrl(b, b.cover).then((u) => { if (u) { const c = el.querySelector('.cover'); c.style.backgroundImage = `url(${u})`; c.textContent = ''; } });
    if (has) {
      el.querySelector('[data-open]').onclick = () => (b.kind === 'ebook' ? openBook(b) : openAudio(b));
      el.querySelector('[data-dl]').onclick = () => download(b);
    }
  });
}
async function signedUrl(b, file, dl) {
  const { data, error } = await sb.storage.from(C.bucket).createSignedUrl(`${b.product}/${file}`, 3600, dl ? { download: file } : undefined);
  return error ? null : data.signedUrl;
}
async function download(b) {
  const f = b.kind === 'ebook' ? b.file : b.files[0];
  const u = await signedUrl(b, f, true);
  if (u) location.href = u; else alert('Download gerade nicht möglich.');
}

/* ---------- Fortschritt ---------- */
let saveT;
function saveProgress(b, position, percent) {
  lsSet('neo.pos.' + b.product, JSON.stringify({ position, percent }));
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    if (!user) return;
    sb.from('book_progress').upsert({ user_id: user.id, product: b.product, kind: b.kind, position: String(position), percent, updated_at: new Date().toISOString() })
      .then(() => {}, () => {});
  }, 1500);
}
function loadProgress(b) {
  const remote = progress[b.product + ':' + b.kind];
  if (remote?.position) return { position: remote.position, percent: remote.percent };
  try { return JSON.parse(lsGet('neo.pos.' + b.product) || 'null'); } catch { return null; }
}

/* ---------- E-Book-Reader ---------- */
const THEMES = { night: ['#0D1A12', '#E8F7EF'], sepia: ['#F3E9D2', '#3B2F1E'], light: ['#FFFFFF', '#1A1A1A'] };
let book, rendition, curBook, fontPct = Number(lsGet('neo.font')) || 110, theme = lsGet('neo.theme') || 'night';
function applyTheme() {
  const [bg, fg] = THEMES[theme] || THEMES.night;
  $('reader').style.setProperty('--rbg', bg); $('reader').style.setProperty('--rfg', fg);
  if (rendition) {
    rendition.themes.register('neo', { body: { background: bg, color: fg, 'font-family': "Georgia, 'Cormorant Garamond', serif", 'line-height': '1.6' }, 'a': { color: '#C9A84C' } });
    rendition.themes.select('neo'); rendition.themes.fontSize(fontPct + '%');
  }
  lsSet('neo.theme', theme); lsSet('neo.font', String(fontPct));
}
async function openBook(b, buffer) {
  curBook = b;
  $('reader').hidden = false; $('rtitle').textContent = b.title; $('toc').hidden = true;
  if (!buffer) {
    const u = await signedUrl(b, b.file);
    if (!u) { alert('E-Book konnte nicht geladen werden.'); $('reader').hidden = true; return; }
    buffer = await (await fetch(u)).arrayBuffer();
  }
  book = ePub(buffer);
  $('viewer').innerHTML = '';
  rendition = book.renderTo('viewer', { width: '100%', height: '100%', flow: 'paginated', spread: 'auto' });
  applyTheme();
  const nav = await book.loaded.navigation;
  $('toc').innerHTML = nav.toc.map((t, i) => `<a data-i="${i}">${esc(t.label.trim())}</a>`).join('');
  $('toc').querySelectorAll('a').forEach((a) => { a.onclick = () => { rendition.display(nav.toc[a.dataset.i].href); $('toc').hidden = true; }; });
  const pos = loadProgress(b);
  await rendition.display(pos?.position && pos.position.startsWith('epubcfi') ? pos.position : undefined);
  book.ready.then(() => book.locations.generate(1200)).then(() => { /* Prozent verfügbar */ });
  rendition.on('relocated', (loc) => {
    const pct = book.locations.length() ? Math.round(book.locations.percentageFromCfi(loc.start.cfi) * 100) : Math.round((loc.start.percentage || 0) * 100);
    $('pct').textContent = pct + ' %'; $('pbar').style.width = pct + '%';
    saveProgress(b, loc.start.cfi, pct);
  });
  rendition.on('keyup', keyNav);
}
function keyNav(e) { if (e.key === 'ArrowRight') rendition?.next(); if (e.key === 'ArrowLeft') rendition?.prev(); if (e.key === 'Escape') $('rclose').click(); }
document.addEventListener('keyup', keyNav);
$('next').onclick = () => rendition?.next(); $('prev').onclick = () => rendition?.prev();
$('tocBtn').onclick = () => { $('toc').hidden = !$('toc').hidden; };
$('fPlus').onclick = () => { fontPct = Math.min(200, fontPct + 10); applyTheme(); };
$('fMinus').onclick = () => { fontPct = Math.max(70, fontPct - 10); applyTheme(); };
document.querySelectorAll('.themes button').forEach((b) => { b.onclick = () => { theme = b.dataset.t; applyTheme(); }; });
$('rclose').onclick = () => { $('reader').hidden = true; try { rendition?.destroy(); book?.destroy(); } catch { /* egal */ } rendition = book = null; drawGrid(); };

/* ---------- Hörbuch-Player ---------- */
const au = new Audio(); au.preload = 'metadata';
let aBook, aIdx = 0, speeds = [1, 1.15, 1.3, 1.5, 0.85], sp = 0, sleepT;
const fmt = (s) => { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
async function loadTrack(i, startAt) {
  aIdx = i;
  const u = await signedUrl(aBook, aBook.files[i]);
  if (!u) { alert('Audio konnte nicht geladen werden.'); return; }
  au.src = u; au.playbackRate = speeds[sp];
  if (startAt) au.addEventListener('loadedmetadata', () => { au.currentTime = startAt; }, { once: true });
  $('a-title').textContent = `${aBook.title} · Teil ${i + 1}/${aBook.files.length}`;
}
async function openAudio(b) {
  aBook = b; $('audio').hidden = false;
  const pos = loadProgress(b)?.position || '0:0';
  const [i, t] = String(pos).split(':').map(Number);
  await loadTrack(i || 0, t || 0);
  au.play().catch(() => {});
}
au.onplay = () => { $('a-pp').textContent = '❚❚'; }; au.onpause = () => { $('a-pp').textContent = '▶'; };
au.ontimeupdate = () => {
  $('a-seek').value = au.duration ? (au.currentTime / au.duration) * 1000 : 0;
  $('a-time').textContent = fmt(au.currentTime) + ' / ' + fmt(au.duration);
  if (aBook) saveProgress(aBook, `${aIdx}:${Math.floor(au.currentTime)}`, ((aIdx + (au.duration ? au.currentTime / au.duration : 0)) / aBook.files.length) * 100);
};
au.onended = () => { if (aIdx + 1 < aBook.files.length) loadTrack(aIdx + 1).then(() => au.play()); };
$('a-pp').onclick = () => (au.paused ? au.play() : au.pause());
$('a-b').onclick = () => { au.currentTime = Math.max(0, au.currentTime - 15); };
$('a-f').onclick = () => { au.currentTime = Math.min(au.duration || 1e9, au.currentTime + 30); };
$('a-seek').oninput = (e) => { if (au.duration) au.currentTime = (e.target.value / 1000) * au.duration; };
$('a-prev').onclick = () => aIdx > 0 && loadTrack(aIdx - 1).then(() => au.play());
$('a-next').onclick = () => aIdx + 1 < aBook.files.length && loadTrack(aIdx + 1).then(() => au.play());
$('a-speed').onclick = () => { sp = (sp + 1) % speeds.length; au.playbackRate = speeds[sp]; $('a-speed').textContent = speeds[sp] + '×'; };
$('a-sleep').onclick = () => {
  clearTimeout(sleepT);
  if ($('a-sleep').dataset.on) { delete $('a-sleep').dataset.on; $('a-sleep').textContent = 'Schlaf'; return; }
  $('a-sleep').dataset.on = 1; $('a-sleep').textContent = 'Aus in 30′';
  sleepT = setTimeout(() => { au.pause(); delete $('a-sleep').dataset.on; $('a-sleep').textContent = 'Schlaf'; }, 30 * 60 * 1000);
};
$('a-close').onclick = () => { au.pause(); $('audio').hidden = true; };

/* Entwicklungs-Hilfe: ?dev=1 erlaubt, eine lokale EPUB-Datei zu öffnen (kein Server-Zugriff). */
if (qs.get('dev')) {
  const f = document.createElement('input'); f.type = 'file'; f.accept = '.epub'; f.id = 'devfile';
  f.style.cssText = 'position:fixed;bottom:8px;left:8px;width:auto;z-index:50';
  f.onchange = async () => openBook({ product: 'dev-local', title: f.files[0].name, kind: 'ebook' }, await f.files[0].arrayBuffer());
  document.body.appendChild(f);
  window.__neoOpen = openBook;
}

init();
})();
