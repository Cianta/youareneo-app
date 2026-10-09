(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const qs = new URLSearchParams(location.search);
if (qs.get('embed')) document.body.classList.add('embed');
let view = qs.get('view') || 'all';
let user = null, books = [];

const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* privater Modus */ } };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fileUrl = (b, f, dl) => `/api/file?product=${encodeURIComponent(b.product)}&file=${encodeURIComponent(f)}${dl ? '&dl=1' : ''}`;

/* ---------- Sitzung + Bibliothek (Server liest das gemeinsame Supabase-Cookie) ---------- */
async function render() {
  const r = await fetch('/api/library', { credentials: 'same-origin' });
  if (r.status === 401) {
    const j = await r.json().catch(() => ({}));
    user = null; $('help').href = j.loginHelpUrl || '#';
  } else if (r.ok) {
    const j = await r.json(); user = j.email; books = j.books;
  }
  $('login').hidden = !!user; $('lib').hidden = !user; $('logout').hidden = !user;
  $('who').textContent = user || '';
  if (user) drawGrid();
}
const setMsg = (t) => { $('msg').textContent = t; };
$('doLogin').onclick = async () => {
  setMsg('Einen Moment …');
  const r = await fetch('/api/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('em').value, password: $('pw').value }) });
  if (r.ok) { setMsg(''); render(); } else setMsg('Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.');
};
$('logout').onclick = async () => { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); user = null; render(); };
document.querySelectorAll('#tabs button').forEach((b) => {
  b.onclick = () => { view = b.dataset.v; document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('on', x === b)); drawGrid(); };
});

function drawGrid() {
  const list = books.filter((b) => view === 'all' || b.kind === view);
  $('grid').innerHTML = list.length ? '' : '<p class="lead">Hier erscheint bald etwas Neues.</p>';
  list.forEach((b) => {
    const pct = Math.round(b.progress?.percent || 0);
    const el = document.createElement('div');
    el.className = 'card' + (b.owned ? '' : ' lock');
    el.innerHTML = `<div class="cover">${esc(b.title)}</div>
      <div class="meta"><span class="badge">${b.kind === 'ebook' ? 'E-Book' : 'Hörbuch'}</span>
      <h3>${esc(b.title)}</h3><p>${esc(b.author)}</p>
      ${b.owned ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
      <div class="act">${b.owned
        ? `<button class="primary" data-open>${b.kind === 'ebook' ? 'Lesen' : 'Hören'}</button><button data-dl>Download</button>`
        : `<a href="${esc(b.buy)}" target="_top" rel="noopener"><button class="primary">Im Shop kaufen</button></a>`}</div></div>`;
    $('grid').appendChild(el);
    if (b.owned && b.hasCover) {
      const img = new Image(); img.onload = () => { const c = el.querySelector('.cover'); c.style.backgroundImage = `url(${img.src})`; c.textContent = ''; };
      img.src = fileUrl(b, 'cover.jpg');
    }
    if (b.owned) {
      el.querySelector('[data-open]').onclick = () => (b.kind === 'ebook' ? openBook(b) : openAudio(b));
      el.querySelector('[data-dl]').onclick = () => { location.href = fileUrl(b, b.files[0], true); };
    }
  });
}

/* ---------- Fortschritt ---------- */
let saveT;
function saveProgress(b, position, percent) {
  lsSet('neo.pos.' + b.product, JSON.stringify({ position, percent }));
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    fetch('/api/progress', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: b.product, kind: b.kind, position, percent }) }).catch(() => {});
  }, 1500);
}
function loadProgress(b) {
  if (b.progress?.position) return { position: b.progress.position, percent: b.progress.percent };
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
    const r = await fetch(fileUrl(b, b.file), { credentials: 'same-origin' });
    if (!r.ok) { alert('E-Book konnte nicht geladen werden.'); $('reader').hidden = true; return; }
    buffer = await r.arrayBuffer();
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
  rendition.on('relocated', (loc) => {
    // Fortschritt aus Kapitelnummer + Seite im Kapitel (kein Vorab-Scan aller Kapitel – das hat große Bücher blockiert)
    const n = book.spine.length || 1, d = loc.start.displayed || { page: 1, total: 1 };
    const pct = Math.min(100, Math.round(((loc.start.index + (d.page - 1) / Math.max(1, d.total)) / n) * 100));
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
$('rclose').onclick = () => { $('reader').hidden = true; try { rendition?.destroy(); book?.destroy(); } catch { /* egal */ } rendition = book = null; render(); };

/* ---------- Hörbuch-Player ---------- */
const au = new Audio(); au.preload = 'metadata';
let aBook, aIdx = 0, speeds = [1, 1.15, 1.3, 1.5, 0.85], sp = 0, sleepT;
const fmt = (s) => { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
async function loadTrack(i, startAt) {
  aIdx = i;
  au.src = fileUrl(aBook, aBook.files[i]); au.playbackRate = speeds[sp];
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

render();
})();
