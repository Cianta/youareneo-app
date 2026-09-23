/* ---------- Notizfenster: mitschreiben, anheften, Bilder, Bildschirmfotos ---------- */
var NOTE_COLORS = ['#2FD3E8', '#F2913C', '#E8B94A', '#A878FF', '#5AC878'];
var withTime = true;

function saveNote(n) {
  var row = Object.assign({ id: uuid(), video_id: current && !/^demo/.test(current.id) ? current.id : null, body: '', images: [], pinned: false, color: null }, n);
  row.sec = n.sec != null ? Math.round(n.sec * 10) / 10 : null;
  row.created_at = row.updated_at = new Date().toISOString();
  S.notes.unshift(row); renderNotes();
  return sb.from('ks_notes').insert({ id: row.id, video_id: row.video_id, sec: row.sec, body: row.body, images: row.images, pinned: row.pinned, color: row.color })
    .then(function (r) { if (r.error) { toast('Notiz nicht gespeichert'); throw r.error; } return row; });
}
function patchNote(id, patch) {
  S.notes.forEach(function (n) { if (n.id === id) Object.assign(n, patch); });
  patch.updated_at = new Date().toISOString();
  sb.from('ks_notes').update(patch).eq('id', id).then(function (r) { if (r.error) toast('Änderung nicht gespeichert'); });
  renderNotes();
}

$('ks-note-time').onclick = function () { withTime = !withTime; this.classList.toggle('on', withTime); };
$('ks-note-add').onclick = function () {
  var t = $('ks-note-in').value.trim(); if (!t) return;
  if (needLogin('Notizen')) return;
  saveNote({ body: t, sec: withTime && player && !player.limited ? player.time() : null }).then(function () { $('ks-note-in').value = ''; });
};
$('ks-note-in').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('ks-note-add').click(); });
$('ks-note-img').onclick = function () { if (!needLogin('Bilder')) $('ks-note-file').click(); };
$('ks-note-file').onchange = function () {
  var f = this.files[0]; this.value = ''; if (!f) return;
  if (f.size > 8 * 1024 * 1024) return toast('Bild ist größer als 8 MB');
  var ext = (f.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  toast('Bild wird hochgeladen …');
  uploadImage(f, ext).then(function (path) {
    return saveNote({ body: $('ks-note-in').value.trim() || '🖼 ' + f.name, sec: withTime && player && !player.limited ? player.time() : null, images: [path] });
  }).then(function () { $('ks-note-in').value = ''; toast('Bild in deinen Notizen'); }).catch(function () { toast('Hochladen hat nicht geklappt'); });
};
// Bild aus der Zwischenablage direkt ins Notizfeld einfügen
$('ks-note-in').addEventListener('paste', function (e) {
  var it = Array.prototype.filter.call((e.clipboardData || {}).items || [], function (i) { return i.type.indexOf('image') === 0; })[0];
  if (!it || needLogin('Bilder')) return;
  e.preventDefault();
  uploadImage(it.getAsFile(), 'png').then(function (path) { return saveNote({ body: $('ks-note-in').value.trim() || '🖼 Eingefügtes Bild', sec: player && !player.limited ? player.time() : null, images: [path] }); })
    .then(function () { $('ks-note-in').value = ''; });
});

function renderNotes() {
  var box = $('ks-notes');
  if (!S.me) { box.innerHTML = '<p class="ks-muted">Melde dich an – dann bleiben Notizen, Bilder und Bildschirmfotos in deinem Konto, auf jedem Gerät.</p>'; return; }
  // Angeheftete immer oben, dann die zum laufenden Film, dann der Rest
  var cid = current && current.id;
  var list = S.notes.slice().sort(function (a, b) {
    var pa = (a.pinned ? 2 : 0) + (a.video_id === cid ? 1 : 0), pb = (b.pinned ? 2 : 0) + (b.video_id === cid ? 1 : 0);
    return pb - pa || String(b.updated_at).localeCompare(String(a.updated_at));
  }).slice(0, 80);
  if (!list.length) { box.innerHTML = '<p class="ks-muted">Noch keine Notizen. Schreib los – mit ⏲ merkt sich jede Notiz die Filmsekunde.</p>'; return; }
  box.innerHTML = list.map(function (n) {
    var v = n.video_id && vid(n.video_id);
    return '<div class="ks-note' + (n.pinned ? ' pin' : '') + '" data-id="' + n.id + '" style="--nc:' + esc(n.color || NOTE_COLORS[0]) + '">' +
      '<div class="t"><span>' + (n.sec != null && n.video_id ? '<a href="#" data-seek="' + n.sec + '" data-v="' + n.video_id + '">⏲ ' + fmt(n.sec) + '</a> · ' : '') + esc(v && v.id !== cid ? v.title : '') + '</span>' +
      '<span><button class="ks-mini" data-pin title="Anheften">' + (n.pinned ? '📌' : '📍') + '</button><button class="ks-mini" data-col title="Farbe">●</button><button class="ks-mini" data-edit title="Bearbeiten">✎</button><button class="ks-mini" data-del title="Löschen">✕</button></span></div>' +
      '<div class="body">' + esc(n.body) + '</div>' +
      (n.images || []).map(function (p) { return '<img data-img="' + esc(p) + '" alt="Notizbild" loading="lazy">'; }).join('') + '</div>';
  }).join('');
  qa('img[data-img]', box).forEach(function (im) {
    imageUrl(im.dataset.img).then(function (u) { im.src = u; }).catch(function () { im.alt = 'Bild nicht verfügbar'; });
    im.onclick = function () { window.open(im.src, '_blank', 'noopener'); };
  });
  qa('.ks-note', box).forEach(function (el) {
    var id = el.dataset.id, n = S.notes.filter(function (x) { return x.id === id; })[0];
    el.querySelector('[data-pin]').onclick = function () { patchNote(id, { pinned: !n.pinned }); };
    el.querySelector('[data-col]').onclick = function () { patchNote(id, { color: NOTE_COLORS[(NOTE_COLORS.indexOf(n.color || NOTE_COLORS[0]) + 1) % NOTE_COLORS.length] }); };
    el.querySelector('[data-edit]').onclick = function () {
      var b = modal('<h3>Notiz bearbeiten</h3><textarea id="ne-t" rows="6">' + esc(n.body) + '</textarea><div class="ks-row" style="justify-content:flex-start;margin-top:10px"><button id="ne-ok" class="on">Speichern</button></div>');
      b.querySelector('#ne-ok').onclick = function () { patchNote(id, { body: b.querySelector('#ne-t').value }); closeModal(); };
    };
    el.querySelector('[data-del]').onclick = function () {
      if (!confirm('Notiz löschen?')) return;
      S.notes = S.notes.filter(function (x) { return x.id !== id; });
      sb.from('ks_notes').delete().eq('id', id).then(function () {});
      if ((n.images || []).length) sb.storage.from('ks-media').remove(n.images).then(function () {});
      renderNotes();
    };
    var sk = el.querySelector('[data-seek]');
    if (sk) sk.onclick = function (e) {
      e.preventDefault();
      var s = parseFloat(sk.dataset.seek);
      if (!current || current.id !== sk.dataset.v) { var v = vid(sk.dataset.v); if (!v) return; openVideo(v, { fromStart: true }); }
      setTimeout(function () { if (player) { player.seek(s); player.play(); } }, 400);
    };
  });
}
