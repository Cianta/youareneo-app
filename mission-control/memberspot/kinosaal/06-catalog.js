/* ---------- Katalog: Suche, Filter, Favoriten, Merkliste, Playlisten ---------- */
var filter = 'alle', query = '';
function vid(id) { for (var i = 0; i < S.videos.length; i++) if (S.videos[i].id === id) return S.videos[i]; return null; }
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

function renderFilters() {
  var cats = {}; S.videos.forEach(function (v) { if (v.category) cats[v.category] = 1; });
  var fx = [['alle', 'Alle'], ['weiter', '▶ Weiterschauen'], ['fav', '♥ Favoriten'], ['wish', '☆ Merkliste'], ['academy', 'Academy'], ['eigen', 'Eigene Filme']]
    .concat(S.playlists.map(function (p) { return ['pl:' + p.id, '≡ ' + p.name]; }))
    .concat(Object.keys(cats).sort().map(function (c) { return ['cat:' + c, c]; }));
  $('ks-filters').innerHTML = fx.map(function (f) { return '<button data-f="' + esc(f[0]) + '"' + (filter === f[0] ? ' class="on"' : '') + '>' + esc(f[1]) + '</button>'; }).join('') +
    '<button data-newpl>＋ Neue Playlist</button>';
  qa('[data-f]', $('ks-filters')).forEach(function (b) { b.onclick = function () { filter = b.dataset.f; renderFilters(); renderCatalog(); }; });
  $('ks-filters').querySelector('[data-newpl]').onclick = function () { newPlaylist(); };
}

function visible() {
  var q = norm(query).split(/\s+/).filter(Boolean), list = S.videos.slice();
  if (filter === 'weiter') list = list.filter(function (v) { var p = S.progress[v.id]; return p && !p.done && p.sec > 15; })
    .sort(function (a, b) { return String(S.progress[b.id].updated_at || '').localeCompare(String(S.progress[a.id].updated_at || '')); });
  else if (filter === 'fav') list = list.filter(function (v) { return S.fav[v.id]; });
  else if (filter === 'wish') list = list.filter(function (v) { return S.wish[v.id]; });
  else if (filter === 'academy') list = list.filter(function (v) { return v.source === 'memberspot'; });
  else if (filter === 'eigen') list = list.filter(function (v) { return v.source !== 'memberspot'; });
  else if (filter.indexOf('pl:') === 0) { var ids = S.plItems[filter.slice(3)] || []; list = ids.map(vid).filter(Boolean); }
  else if (filter.indexOf('cat:') === 0) { var c = filter.slice(4); list = list.filter(function (v) { return v.category === c; }); }
  if (q.length) list = list.filter(function (v) {
    var hay = norm([v.title, v.description, v.course_name, v.chapter_name, v.category, (v.tags || []).join(' ')].join(' '));
    return q.every(function (w) { return hay.indexOf(w) >= 0; });
  });
  return list;
}

function renderCatalog() {
  var list = visible(), grid = $('ks-grid');
  if (!list.length) {
    grid.innerHTML = '<div class="ks-empty">' + (S.videos.length ? (filter === 'fav' || filter === 'wish' ? (S.me ? 'Hier ist noch nichts gesammelt.' : 'Melde dich an, um Favoriten und deine Merkliste zu sehen.') : 'Nichts gefunden.') : 'Der Saal wird gerade bestückt – bald laufen hier die ersten Filme.') + '</div>';
    return;
  }
  grid.innerHTML = list.map(function (v) {
    var p = S.progress[v.id], pct = p && v.duration_sec ? Math.min(100, p.sec / v.duration_sec * 100) : p && p.done ? 100 : 0;
    var th = safeUrl(v.thumb) || (v.source === 'youtube' && ytId(v.url) ? 'https://i.ytimg.com/vi/' + ytId(v.url) + '/hqdefault.jpg' : '');
    return '<div class="ks-card" tabindex="0" data-v="' + esc(v.id) + '"><div class="th"' + (th ? ' style="background-image:url(\'' + esc(th) + '\')"' : '') + '>' +
      '<span class="badge' + (v.source === 'memberspot' ? ' ms">ACADEMY' : '">' + (v.duration_sec ? fmt(v.duration_sec) : 'FILM')) + '</span>' +
      (S.fav[v.id] ? '<span class="fav">♥</span>' : S.wish[v.id] ? '<span class="fav">☆</span>' : '') +
      (pct ? '<div class="prog" style="width:' + pct + '%"></div>' : '') + '</div>' +
      '<div class="in"><b>' + esc(v.title) + '</b><small>' + esc(v.course_name || v.category || '') + '</small></div></div>';
  }).join('');
  qa('.ks-card', grid).forEach(function (c) {
    function go() { openVideo(vid(c.dataset.v), { autoplay: true }); }
    c.onclick = go; c.onkeydown = function (e) { if (e.key === 'Enter') go(); };
  });
}
$('ks-q').addEventListener('input', function () { query = this.value; renderCatalog(); });

/* Favorit / Merkliste */
function toggleMark(kind) {
  if (!current || needLogin(kind === 'fav' ? 'Favoriten' : 'die Merkliste')) return;
  var set = kind === 'fav' ? S.fav : S.wish, id = current.id, on = !set[id];
  if (on) set[id] = 1; else delete set[id];
  var q = on ? sb.from('ks_favorites').insert({ user_id: S.me.id, video_id: id, kind: kind })
             : sb.from('ks_favorites').delete().match({ user_id: S.me.id, video_id: id, kind: kind });
  q.then(function (r) { if (r.error) toast('Konnte nicht speichern'); });
  toast(on ? (kind === 'fav' ? '♥ Zu Favoriten' : '☆ Gemerkt') : 'Entfernt');
  renderMeta(); renderCatalog();
}
$('ks-fav').onclick = function () { toggleMark('fav'); };
$('ks-wish').onclick = function () { toggleMark('wish'); };
function renderMeta() {
  if (!current) return;
  $('ks-fav').textContent = S.fav[current.id] ? '♥ Favorit' : '♡ Favorit'; $('ks-fav').classList.toggle('on', !!S.fav[current.id]);
  $('ks-wish').textContent = S.wish[current.id] ? '★ Gemerkt' : '☆ Merken'; $('ks-wish').classList.toggle('on', !!S.wish[current.id]);
}

/* Playlisten */
function newPlaylist(thenAdd) {
  if (needLogin('Playlisten')) return;
  var b = modal('<h3>Neue Playlist</h3><label>Name</label><input id="pl-n" maxlength="60" placeholder="z. B. Abendprogramm"><div class="ks-row" style="justify-content:flex-start;margin-top:10px"><button id="pl-ok" class="on">Anlegen</button></div>');
  b.querySelector('#pl-ok').onclick = function () {
    var n = b.querySelector('#pl-n').value.trim(); if (!n) return;
    sb.from('ks_playlists').insert({ name: n }).select().single().then(function (r) {
      if (r.error) return toast('Playlist nicht angelegt');
      S.playlists.push(r.data); closeModal(); renderFilters();
      if (thenAdd) addToPlaylist(r.data.id); else toast('Playlist „' + n + '“ angelegt');
    });
  };
}
function addToPlaylist(pid) {
  var items = S.plItems[pid] = S.plItems[pid] || [];
  if (items.indexOf(current.id) >= 0) return toast('Schon in der Playlist');
  items.push(current.id);
  sb.from('ks_playlist_items').insert({ playlist_id: pid, video_id: current.id, pos: items.length }).then(function (r) { if (r.error) toast('Nicht hinzugefügt'); });
  toast('＋ In der Playlist'); renderSide();
}
$('ks-addpl').onclick = function () {
  if (!current || needLogin('Playlisten')) return;
  if (!S.playlists.length) return newPlaylist(true);
  var b = modal('<h3>Zu Playlist hinzufügen</h3><div class="ks-row" style="justify-content:flex-start">' +
    S.playlists.map(function (p) { return '<button data-p="' + p.id + '">' + esc(p.name) + '</button>'; }).join('') + '<button data-new>＋ Neue</button></div>');
  qa('[data-p]', b).forEach(function (x) { x.onclick = function () { closeModal(); addToPlaylist(x.dataset.p); }; });
  b.querySelector('[data-new]').onclick = function () { newPlaylist(true); };
};
function nextInPlaylist() {
  // Läuft ein Film aus einer Playlist, geht es nach der Meditation dort weiter
  if (!current || filter.indexOf('pl:') !== 0) return null;
  var ids = S.plItems[filter.slice(3)] || [], i = ids.indexOf(current.id);
  return i >= 0 && i < ids.length - 1 ? vid(ids[i + 1]) : null;
}

/* Seitenleiste: Tabs, Lesezeichen, Playlist */
qa('.ks-tabs button').forEach(function (b) {
  b.onclick = function () {
    qa('.ks-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
    qa('.ks-pane').forEach(function (p) { p.classList.toggle('ks-hide', p.dataset.pane !== b.dataset.tab); });
  };
});
function renderSide() {
  renderNotes();
  var bms = current ? S.bookmarks.filter(function (b) { return b.video_id === current.id; }) : [];
  $('ks-bms').innerHTML = bms.length ? bms.map(function (b) {
    return '<div class="ks-bm" data-s="' + b.sec + '"><b>' + fmt(b.sec) + '</b><span>' + esc(b.label) + '</span><button class="ks-mini" data-del="' + b.id + '" title="Löschen">✕</button></div>';
  }).join('') : '<p class="ks-muted">Drück 🔖 oder B, um dir eine Sekunde zu merken.</p>';
  qa('.ks-bm', $('ks-bms')).forEach(function (r) {
    r.onclick = function (e) {
      var del = e.target.getAttribute('data-del');
      if (del) { e.stopPropagation(); S.bookmarks = S.bookmarks.filter(function (x) { return x.id !== del; }); if (S.me) sb.from('ks_bookmarks').delete().eq('id', del).then(function () {}); renderSide(); renderMarks(); return; }
      if (player) { player.seek(parseFloat(r.dataset.s)); player.play(); }
    };
  });
  $('ks-pls').innerHTML = !S.me ? '<p class="ks-muted">Melde dich an, um Playlisten zu bauen.</p>' :
    (S.playlists.length ? S.playlists.map(function (p) {
      var ids = S.plItems[p.id] || [];
      return '<div class="ks-note"><div class="t"><b style="color:#fff">' + esc(p.name) + '</b><span>' + ids.length + ' Filme</span></div>' +
        ids.map(function (id, i) { var v = vid(id); return v ? '<div class="ks-bm" data-v="' + v.id + '"><b>' + (i + 1) + '</b><span>' + esc(v.title) + '</span></div>' : ''; }).join('') +
        '<div class="ks-row" style="justify-content:flex-start"><button class="ks-mini" data-play="' + p.id + '">▶ Abspielen</button><button class="ks-mini" data-drop="' + p.id + '">Löschen</button></div></div>';
    }).join('') : '<p class="ks-muted">Noch keine Playlist. Über „＋ Playlist“ unter dem Film legst du eine an.</p>');
  qa('[data-v]', $('ks-pls')).forEach(function (r) { r.onclick = function () { openVideo(vid(r.dataset.v), { autoplay: true }); }; });
  qa('[data-play]', $('ks-pls')).forEach(function (b) { b.onclick = function () { filter = 'pl:' + b.dataset.play; renderFilters(); renderCatalog(); var v = vid((S.plItems[b.dataset.play] || [])[0]); if (v) openVideo(v, { autoplay: true }); }; });
  qa('[data-drop]', $('ks-pls')).forEach(function (b) {
    b.onclick = function () {
      if (!confirm('Playlist löschen? Die Filme selbst bleiben erhalten.')) return;
      sb.from('ks_playlists').delete().eq('id', b.dataset.drop).then(function () {});
      S.playlists = S.playlists.filter(function (p) { return p.id !== b.dataset.drop; }); delete S.plItems[b.dataset.drop];
      if (filter === 'pl:' + b.dataset.drop) filter = 'alle';
      renderFilters(); renderCatalog(); renderSide();
    };
  });
}

/* Film einreichen: Link zum eigenen Video in Drive (Vereinsmitglieder-Medien) */
$('ks-upload').onclick = function () {
  if (needLogin('Einreichungen')) return;
  var folder = safeUrl(S.settings.upload_folder_url);
  var b = modal('<h3>Film einreichen</h3><p class="ks-muted">Lade deinen Film in den Drive-Ordner <b>Vereinsmitglieder Medien → Videos</b>' +
    (folder ? ' (<a href="' + esc(folder) + '" target="_blank" rel="noopener">Ordner öffnen</a>)' : '') + ' und schick uns hier den Link. Wir schauen ihn an und nehmen ihn ins Programm.</p>' +
    '<label>Titel</label><input id="sb-t" maxlength="120"><label>Link zum Film</label><input id="sb-l" type="url" placeholder="https://drive.google.com/…"><label>Worum geht es? (optional)</label><textarea id="sb-n" maxlength="1000"></textarea>' +
    '<div class="ks-row" style="justify-content:flex-start;margin-top:10px"><button id="sb-ok" class="on">Einreichen</button></div>');
  b.querySelector('#sb-ok').onclick = function () {
    var t = b.querySelector('#sb-t').value.trim(), l = b.querySelector('#sb-l').value.trim();
    if (!t || !safeUrl(l)) return toast('Bitte Titel und einen https-Link angeben');
    sb.from('ks_submissions').insert({ title: t, link: l, note: b.querySelector('#sb-n').value.trim() }).then(function (r) {
      if (r.error) return toast('Einreichen hat nicht geklappt'); closeModal(); toast('Danke! Dein Film ist eingereicht.');
    });
  };
};

onState.push(function () { renderFilters(); renderCatalog(); renderMeta(); renderSide(); });
