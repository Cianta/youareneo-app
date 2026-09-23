
/* =====================================================================
   KLANGWELTEN: Konten, Katalog, Meine Liste, Playlisten, Einreichen
   ===================================================================== */
var modal = $('vr-modal'), mbox = $('vr-mbox');
function openModal(html, bind) { mbox.innerHTML = html; modal.classList.add('open'); if (bind) bind(mbox); var f = mbox.querySelector('input,textarea'); if (f) setTimeout(function () { f.focus(); }, 30); }
function closeModal() { modal.classList.remove('open'); mbox.innerHTML = ''; }
modal.addEventListener('pointerdown', function (e) { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
function q(sel) { return mbox.querySelector(sel); }
function mmsg(t, ok) { var m = q('.vr-msg'); if (m) { m.textContent = t; m.classList.toggle('ok', !!ok); } }

var ICON = {
  website: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20zm0 2c.9 1.1 1.6 2.9 1.9 5h-3.8c.3-2.1 1-3.9 1.9-5zM9.4 4.5C8.8 5.8 8.3 7.3 8.1 9H4.9a8 8 0 0 1 4.5-4.5zm5.2 0A8 8 0 0 1 19.1 9h-3.2c-.2-1.7-.7-3.2-1.3-4.5zM4.3 11h3.7a19 19 0 0 0 0 2H4.3a8 8 0 0 1 0-2zm5.7 0h4a17 17 0 0 1 0 2h-4a17 17 0 0 1 0-2zm6 0h3.7a8 8 0 0 1 0 2H16a19 19 0 0 0 0-2zM4.9 15h3.2c.2 1.7.7 3.2 1.3 4.5A8 8 0 0 1 4.9 15zm5.2 0h3.8c-.3 2.1-1 3.9-1.9 5c-.9-1.1-1.6-2.9-1.9-5zm5.8 0h3.2a8 8 0 0 1-4.5 4.5c.6-1.3 1.1-2.8 1.3-4.5z',
  instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5zm5.5-4a1 1 0 1 1 0 2a1 1 0 0 1 0-2z',
  youtube: 'M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z',
  spotify: 'M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20zm4.6 14.4a.7.7 0 0 1-1 .2c-2.6-1.6-5.9-2-9.8-1.1a.7.7 0 1 1-.3-1.4c4.2-1 7.9-.6 10.8 1.2c.3.2.4.7.3 1.1zm1.2-2.7a.9.9 0 0 1-1.2.3c-3-1.8-7.5-2.4-11-1.3a.9.9 0 1 1-.5-1.7c4-1.2 9-.6 12.4 1.5c.4.2.6.8.3 1.2zm.1-2.8C14.3 8.8 8.4 8.6 5 9.6a1 1 0 1 1-.6-2c3.9-1.2 10.4-1 14.5 1.5a1 1 0 0 1-1 1.8z',
  soundcloud: 'M3 13h1v5H3zm2-2h1v7H5zm2-1h1v8H7zm2-1h1v9H9zm2-1.5c.8-.3 1.6-.5 2.5-.5a6 6 0 0 1 5.9 4.9A3.5 3.5 0 0 1 18.5 18H11z',
  bandcamp: 'M2 17L8 7h14l-6 10z',
  facebook: 'M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8.5c0-.3.2-.5.5-.5z',
  tiktok: 'M16 3c.3 2.3 1.7 3.8 4 4v3.2c-1.5 0-2.8-.4-4-1.2V15a6 6 0 1 1-6-6v3.2A2.8 2.8 0 1 0 12.8 15V3z'
};
var SOCIALS = [['instagram', 'Instagram'], ['youtube', 'YouTube'], ['spotify', 'Spotify'], ['soundcloud', 'SoundCloud'], ['bandcamp', 'Bandcamp'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']];
function svgIcon(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + ICON[k] + '"/></svg>'; }

/* ---------- Konto: ein NEO-Konto für Trinity OS, Archiv und Visual Room ---------- */
var ERR = { owner: 'Das darf nur ändern, wer es angelegt hat.', invalid: 'Bitte die Eingaben prüfen.', url: 'Links müssen mit https:// beginnen.' };
function authErr(m) {
  m = String(m || '');
  if (/Invalid login/i.test(m)) return 'E-Mail oder Passwort stimmt nicht.';
  if (/not confirmed/i.test(m)) return 'Bitte bestätige zuerst deine E-Mail (Postfach & Spam prüfen).';
  if (/already registered|already exists/i.test(m)) return 'Für diese E-Mail gibt es schon ein Konto — bitte anmelden.';
  if (/sending.*email|Email address not authorized|rate limit/i.test(m)) return 'Die Bestätigungs-Mail konnte gerade nicht verschickt werden. Bitte später erneut versuchen oder den Verein kontaktieren.';
  if (/Password should be/i.test(m)) return 'Passwort: mindestens 6 Zeichen.';
  if (/valid email|invalid format/i.test(m)) return 'Bitte eine gültige E-Mail eingeben.';
  return m || 'Das hat nicht geklappt.';
}
// Gastmodus (z. B. auf youareneo.com): alles nutzbar, eigenes Konto/Liste/Player führen zur Fördermitgliedschaft
var IS_GUEST = !!window.VR_GUEST, JOIN_URL = window.VR_JOIN_URL || 'https://youareneo.com/products/you-are-neo-community-access';
function openJoin() {
  openModal('<h4>Werde Teil von YOU ARE NEO</h4><p style="margin:8px 0 0;color:#cfd8e2;line-height:1.6">Den Visual Room darfst du hier frei genießen. 🌿<br>Deine eigene Herzensliste, eigene Player, Playlisten und das Einreichen von Songs gibt es für Mitglieder – schon ab <b style="color:#e8b94a">3,33 € im Monat</b> als Fördermitglied. Damit trägst du die Arbeit des Vereins und bekommst Zugang zur NEO Academy.</p>' +
    '<div class="vr-btns"><button data-x>Später</button><button class="pri" data-go>Mitglied werden</button></div>', function () {
      q('[data-x]').onclick = closeModal;
      q('[data-go]').onclick = function () { window.open(JOIN_URL, '_blank', 'noopener'); closeModal(); };
    });
}
function authModal(then, mode) {
  if (IS_GUEST) return openJoin();
  mode = mode || 'login';
  var reg = mode === 'reg', forgot = mode === 'forgot';
  openModal('<h4>' + (reg ? 'NEO-Konto anlegen' : forgot ? 'Passwort vergessen' : 'Anmelden') + '</h4>' +
    '<div class="vr-muted" style="font-size:12.5px">Ein Konto für alle NEO-Räume: Trinity OS, Freigeist-Archiv und Visual Room.</div>' +
    (forgot ? '' : '<div class="vr-seg"><button data-m="login" class="' + (!reg ? 'on' : '') + '">Anmelden</button><button data-m="reg" class="' + (reg ? 'on' : '') + '">Registrieren</button></div>') +
    (reg ? '<label>Anzeigename</label><input id="a-name" maxlength="40" autocomplete="nickname">' : '') +
    '<label>E-Mail</label><input id="a-mail" type="email" autocomplete="email">' +
    (forgot ? '' : '<label>Passwort</label><input id="a-pass" type="password" autocomplete="' + (reg ? 'new-password' : 'current-password') + '">') +
    (!reg && !forgot ? '<div style="margin-top:8px;font-size:12px"><a href="#" data-m="forgot">Passwort vergessen?</a></div>' : '') +
    '<div class="vr-msg"></div><div class="vr-btns"><button data-x>Abbrechen</button><button class="pri" data-go>' + (reg ? 'Konto anlegen' : forgot ? 'Link schicken' : 'Anmelden') + '</button></div>',
    function (b) {
      b.querySelectorAll('[data-m]').forEach(function (x) { x.onclick = function (e) { e.preventDefault(); authModal(then, x.dataset.m); }; });
      q('[data-x]').onclick = closeModal;
      function go() {
        var mail = q('#a-mail').value.trim(), p = q('#a-pass') && q('#a-pass').value;
        mmsg('…');
        sbReady.then(function () {
          if (!sb) return mmsg('Keine Verbindung zur Datenbank.');
          if (forgot) return sb.auth.resetPasswordForEmail(mail, { redirectTo: location.href }).then(function (r) { r.error ? mmsg(authErr(r.error.message)) : mmsg('Wenn es das Konto gibt, ist ein Link unterwegs.', true); });
          var call = reg ? sb.auth.signUp({ email: mail, password: p, options: { data: { display_name: q('#a-name').value.trim() } } })
                         : sb.auth.signInWithPassword({ email: mail, password: p });
          call.then(function (r) {
            if (r.error) return mmsg(authErr(r.error.message));
            if (reg && !r.data.session) return mmsg('Fast geschafft: Bitte bestätige den Link in deiner E-Mail, dann hier anmelden.', true);
            closeModal(); user = r.data.user;
            loadState().then(function () { if (then) then(); });
          });
        });
      }
      q('[data-go]').onclick = go;
      b.querySelectorAll('input').forEach(function (i) { i.onkeydown = function (e) { if (e.key === 'Enter') go(); }; });
    });
}
function needLogin(then) { if (S.me && !IS_GUEST) return true; authModal(then); return false; }
function renderAcct() {
  var a = $('vr-acct'), av = $('vr-avatar');
  if (IS_GUEST) { a.innerHTML = '<span class="vr-muted">Deine Herzensliste gibt es für Mitglieder.</span><button data-a="in">Mitglied werden</button>'; av.innerHTML = '<span>✦</span>'; av.title = 'Mitglied werden – ab 3,33 €'; return; }
  a.innerHTML = S.me ? '<span>Hallo <b style="color:#fff">' + esc(S.me.name) + '</b></span><button data-a="prof">Profil</button><button data-a="out">Abmelden</button>'
                     : '<span class="vr-muted">Melde dich an, um zu sammeln.</span><button data-a="in">Anmelden</button>';
  av.innerHTML = S.me ? (safeUrl(S.me.avatar) ? '<img src="' + esc(S.me.avatar) + '" alt="">' : '<span>' + esc((S.me.name || '?')[0].toUpperCase()) + '</span>') : '<span>◉</span>';
  av.title = S.me ? 'Angemeldet als ' + S.me.name : 'Anmelden — ein Konto für alle NEO-Räume';
}
function accountAction(act) {
  if (act === 'in') authModal();
  if (act === 'out') sb.auth.signOut().then(function () { user = null; session = null; loadState(); });
  if (act === 'prof') openModal('<h4>Profil</h4><label>Anzeigename</label><input id="p-name" maxlength="40" value="' + esc(S.me.name) + '">' + imgField('p-av', 'Avatar', S.me.avatar) +
    '<label>Neues Passwort (leer lassen = unverändert)</label><input id="p-new" type="password" autocomplete="new-password">' +
    '<div class="vr-msg"></div><div class="vr-btns"><button data-out style="margin-right:auto">Abmelden</button><button data-x>Abbrechen</button><button class="pri" data-go>Speichern</button></div>', function () {
      q('[data-x]').onclick = closeModal; q('[data-out]').onclick = function () { closeModal(); accountAction('out'); };
      q('[data-go]').onclick = function () {
        mmsg('Speichere …');
        withImage('p-av').then(function (av) {
          var jobs = [sb.from('neo_profiles').upsert({ id: S.me.id, display_name: q('#p-name').value.trim() || null, avatar_url: safeUrl(av) || null })];
          if (q('#p-new').value) jobs.push(sb.auth.updateUser({ password: q('#p-new').value }));
          return Promise.all(jobs).then(function (rs) {
            var bad = rs.filter(function (r) { return r.error; })[0];
            if (bad) return mmsg(authErr(bad.error.message));
            closeModal(); loadState();
          });
        }).catch(function () { mmsg('Bild-Upload hat nicht geklappt.'); });
      };
    });
}
$('vr-acct').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) accountAction(b.dataset.a); });
$('vr-avatar').onclick = function () { accountAction(S.me && !IS_GUEST ? 'prof' : 'in'); };
if (IS_GUEST) { $('vr-change').style.display = 'none'; }

/* ---------- Player wechseln ---------- */
$('vr-change').onclick = function () {
  openModal('<h4>Player</h4><div class="vr-muted" style="font-size:12.5px">Link von Spotify, SoundCloud, YouTube oder eine Embed-URL.</div>' +
    '<label>Link</label><input id="c-url" type="url" placeholder="https://open.spotify.com/playlist/…" value="' + esc(S.me && S.me.player_url || '') + '">' +
    '<div class="vr-btns" style="justify-content:flex-start"><button data-a="now">▶ Nur jetzt abspielen</button>' +
    (S.me ? '<button class="pri" data-a="mine">Als meinen Player speichern</button><button data-a="reset">Meinen zurücksetzen</button>' : '<button class="pri" data-a="login">Anmelden, um ihn zu speichern</button>') + '</div>' +
    '<details style="margin-top:16px"><summary style="cursor:pointer;color:#d9b47a;font-size:12.5px">Admin: Standard für alle Gäste</summary>' +
    '<label>Admin-Passwort</label><input id="c-pin" type="password" inputmode="numeric" autocomplete="off"><div class="vr-btns" style="justify-content:flex-start"><button data-a="default">Als Standard setzen</button></div></details>' +
    '<div class="vr-msg"></div><div class="vr-btns"><button data-x>Schließen</button></div>', function () {
      q('[data-x]').onclick = closeModal;
      mbox.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return;
        var u = q('#c-url').value.trim(), a = b.dataset.a;
        if (a !== 'reset' && a !== 'login' && !safeUrl(u)) return mmsg('Bitte einen vollständigen https-Link einfügen.');
        if (a === 'now') { session = { url: u, label: 'Eigener Link' }; refreshPlayer(); closeModal(); }
        if (a === 'login') authModal(function () { $('vr-change').click(); });
        if (a === 'mine' || a === 'reset') saveSettings({ player_url: a === 'reset' ? null : u }).then(function (r) {
          if (r && r.error) return mmsg('Hat nicht geklappt.');
          session = null; loadState(); closeModal();
        });
        if (a === 'default') sb.rpc('vr_set_player', { p_url: u, p_pass: q('#c-pin').value }).then(function (res) {
          var r = res.data;
          if (r === 'ok') { S.default_player = u; refreshPlayer(); mmsg('Standard gesetzt.', true); }
          else mmsg(r === 'wrong' ? 'Passwort falsch — nichts geändert.' : r === 'locked' ? 'Zu viele Fehlversuche, bitte 10 Minuten warten.' : 'Hat nicht geklappt.');
        });
      });
    });
};

/* ---------- Bilder hochladen ---------- */
function shrink(file, max) {
  return new Promise(function (res, rej) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var k = Math.min(1, max / Math.max(img.width, img.height)), c = mk(Math.round(img.width * k), Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(function (b) { b ? res(b) : rej(); }, 'image/jpeg', .86);
    };
    img.onerror = rej; img.src = url;
  });
}
function uploadImage(file) {
  return shrink(file, 900).then(function (blob) { return upload('vr-bilder', blob, 'jpg', 'image/jpeg').then(function (r) { return r.url; }); });
}

/* ---------- Formulare ---------- */
function artistOptions(sel) { return '<option value="">— ohne —</option>' + S.artists.map(function (a) { return '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join(''); }
function albumOptions(artist, sel) { return '<option value="">— ohne —</option>' + S.albums.filter(function (b) { return !artist || b.artist_id === artist; }).map(function (b) { return '<option value="' + b.id + '"' + (b.id === sel ? ' selected' : '') + '>' + esc(b.title) + '</option>'; }).join(''); }
function allStyles() { var m = {}; S.artists.forEach(function (a) { (a.styles || []).forEach(function (s) { m[s] = (m[s] || 0) + 1; }); }); return Object.keys(m).sort(function (a, b) { return m[b] - m[a] || a.localeCompare(b); }); }
function imgField(id, label, val) {
  return '<label>' + label + '</label><div style="display:flex;gap:8px;align-items:center"><input id="' + id + '" type="url" placeholder="https://… oder Datei wählen" value="' + esc(val || '') + '">' +
    '<input id="' + id + '-f" type="file" accept="image/*" style="width:auto;max-width:44%;font-size:11px;padding:6px"></div>';
}
function withImage(fieldId) {
  var f = q('#' + fieldId + '-f'); if (f && f.files && f.files[0]) return uploadImage(f.files[0]);
  return Promise.resolve(q('#' + fieldId).value.trim());
}
var TABLE = { artist: 'vr_artists', album: 'vr_albums', song: 'vr_songs', playlist: 'vr_playlists', sample: 'vr_samples' };
function clean(o) { var r = {}; for (var k in o) { var v = o[k]; if (k === 'id') continue; r[k] = (v === '' || v === undefined) ? null : v; } return r; }
function saveKind(kind, data, done) {
  mmsg('Speichere …');
  var row = clean(data), qy = data.id ? sb.from(TABLE[kind]).update(row).eq('id', data.id).select('id').single() : sb.from(TABLE[kind]).insert(row).select('id').single();
  qy.then(function (r) {
    if (r.error) return mmsg(/check constraint/.test(r.error.message) ? 'Bitte Eingaben prüfen — Links müssen mit https:// beginnen.' : 'Speichern hat nicht geklappt: ' + r.error.message);
    closeModal(); loadState().then(function () { if (done) done(r.data.id); });
  });
}
function delBtn(it) { return it && it.mine ? '<button data-del style="margin-right:auto;color:#ff8a7a;border-color:rgba(255,138,122,.4)">Löschen</button>' : ''; }
function bindDel(kind, it) {
  var d = q('[data-del]'); if (!d) return;
  d.onclick = function () {
    if (!confirm('„' + (it.name || it.title) + '“ wirklich löschen?')) return;
    sb.from(TABLE[kind]).delete().eq('id', it.id).then(function (r) { if (!r.error) { closeModal(); loadState(); } else mmsg('Löschen ging nicht.'); });
  };
}
function artistForm(it) {
  if (!needLogin(function () { artistForm(it); })) return;
  it = it || { socials: {}, styles: [] };
  var soc = SOCIALS.map(function (s) { return svgIcon(s[0]) + '<input data-soc="' + s[0] + '" type="url" placeholder="' + s[1] + '-Link" value="' + esc(it.socials && it.socials[s[0]] || '') + '">'; }).join('');
  openModal('<h4>' + (it.id ? 'Künstler bearbeiten' : 'Neuer Künstler') + '</h4>' +
    '<label>Name *</label><input id="f-name" maxlength="80" value="' + esc(it.name || '') + '">' +
    imgField('f-photo', 'Foto', it.photo_url) +
    '<label>Kurze Beschreibung</label><textarea id="f-desc" maxlength="600">' + esc(it.description || '') + '</textarea>' +
    '<label>Stile (mit Komma trennen)</label><input id="f-styles" value="' + esc((it.styles || []).join(', ')) + '" placeholder="Ambient, Handpan, Mantra">' +
    '<div class="vr-chips" id="f-sugg">' + allStyles().slice(0, 16).map(function (s) { return '<span class="vr-chip" data-s="' + esc(s) + '">' + esc(s) + '</span>'; }).join('') + '</div>' +
    '<label>Website</label><input id="f-web" type="url" value="' + esc(it.website || '') + '" placeholder="https://…">' +
    '<label>Social Media</label><div class="vr-soc-in">' + soc + '</div>' +
    '<label>Player-Link (Spotify / SoundCloud / YouTube)</label><input id="f-player" type="url" value="' + esc(it.player_url || '') + '" placeholder="https://open.spotify.com/artist/…">' +
    '<div class="vr-msg"></div><div class="vr-btns">' + delBtn(it) + '<button data-x>Abbrechen</button><button class="pri" data-go>Speichern</button></div>', function () {
      q('[data-x]').onclick = closeModal; bindDel('artist', it);
      q('#f-sugg').onclick = function (e) {
        var c = e.target.closest('[data-s]'); if (!c) return;
        var cur = q('#f-styles').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (cur.indexOf(c.dataset.s) < 0) cur.push(c.dataset.s); q('#f-styles').value = cur.join(', ');
      };
      q('[data-go]').onclick = function () {
        var name = q('#f-name').value.trim(); if (!name) return mmsg('Bitte einen Namen eingeben.');
        var socials = {}; mbox.querySelectorAll('[data-soc]').forEach(function (i) { var v = i.value.trim(); if (v) socials[i.dataset.soc] = v; });
        for (var k in socials) if (!safeUrl(socials[k])) return mmsg(ERR.url);
        mmsg('Lade Foto …');
        withImage('f-photo').then(function (photo) {
          saveKind('artist', { id: it.id, name: name, photo_url: photo, description: q('#f-desc').value, website: q('#f-web').value.trim(),
            styles: q('#f-styles').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 12), socials: socials, player_url: q('#f-player').value.trim() });
        }).catch(function () { mmsg('Foto-Upload hat nicht geklappt.'); });
      };
    });
}
function albumForm(it) {
  if (!needLogin(function () { albumForm(it); })) return;
  it = it || { artist_id: filt.artist || '' };
  openModal('<h4>' + (it.id ? 'Album bearbeiten' : 'Neues Album') + '</h4>' +
    '<label>Titel *</label><input id="f-title" maxlength="120" value="' + esc(it.title || '') + '">' +
    '<label>Künstler</label><select id="f-artist">' + artistOptions(it.artist_id) + '</select>' +
    '<label>Jahr</label><input id="f-year" type="number" min="1900" max="2100" value="' + esc(it.year || '') + '">' +
    imgField('f-cover', 'Cover', it.cover_url) +
    '<label>Player-Link</label><input id="f-player" type="url" value="' + esc(it.player_url || '') + '" placeholder="https://open.spotify.com/album/…">' +
    '<div class="vr-msg"></div><div class="vr-btns">' + delBtn(it) + '<button data-x>Abbrechen</button><button class="pri" data-go>Speichern</button></div>', function () {
      q('[data-x]').onclick = closeModal; bindDel('album', it);
      q('[data-go]').onclick = function () {
        var title = q('#f-title').value.trim(); if (!title) return mmsg('Bitte einen Titel eingeben.');
        withImage('f-cover').then(function (cover) {
          saveKind('album', { id: it.id, title: title, artist_id: q('#f-artist').value, year: q('#f-year').value, cover_url: cover, player_url: q('#f-player').value.trim() });
        }).catch(function () { mmsg('Cover-Upload hat nicht geklappt.'); });
      };
    });
}
function songForm(it) {
  if (!needLogin(function () { songForm(it); })) return;
  it = it || { artist_id: filt.artist || '' };
  openModal('<h4>' + (it.id ? 'Song bearbeiten' : 'Neuer Song') + '</h4>' +
    '<label>Titel *</label><input id="f-title" maxlength="120" value="' + esc(it.title || '') + '">' +
    '<label>Künstler</label><select id="f-artist">' + artistOptions(it.artist_id) + '</select>' +
    '<label>Album</label><select id="f-album">' + albumOptions(it.artist_id, it.album_id) + '</select>' +
    '<label>Player-Link</label><input id="f-player" type="url" value="' + esc(it.player_url || '') + '" placeholder="https://open.spotify.com/track/…">' +
    '<div class="vr-msg"></div><div class="vr-btns">' + delBtn(it) + '<button data-x>Abbrechen</button><button class="pri" data-go>Speichern</button></div>', function () {
      q('[data-x]').onclick = closeModal; bindDel('song', it);
      q('#f-artist').onchange = function () { q('#f-album').innerHTML = albumOptions(this.value, ''); };
      q('[data-go]').onclick = function () {
        var title = q('#f-title').value.trim(); if (!title) return mmsg('Bitte einen Titel eingeben.');
        saveKind('song', { id: it.id, title: title, artist_id: q('#f-artist').value, album_id: q('#f-album').value, player_url: q('#f-player').value.trim() });
      };
    });
}
function playlistForm(it, then) {
  if (!needLogin(function () { playlistForm(it, then); })) return;
  it = it || { items: [] };
  openModal('<h4>' + (it.id ? 'Playlist bearbeiten' : 'Neue Playlist') + '</h4>' +
    '<label>Name *</label><input id="f-title" maxlength="80" value="' + esc(it.title || '') + '">' +
    '<label>Beschreibung</label><textarea id="f-desc" maxlength="400">' + esc(it.description || '') + '</textarea>' +
    '<label style="display:flex;gap:8px;align-items:center;color:#aab8c4"><input id="f-pub" type="checkbox" style="width:auto"' + (it.is_public ? ' checked' : '') + '> Für alle sichtbar</label>' +
    '<div class="vr-msg"></div><div class="vr-btns">' + delBtn(it) + '<button data-x>Abbrechen</button><button class="pri" data-go>Speichern</button></div>', function () {
      q('[data-x]').onclick = closeModal; bindDel('playlist', it);
      q('[data-go]').onclick = function () {
        var title = q('#f-title').value.trim(); if (!title) return mmsg('Bitte einen Namen eingeben.');
        saveKind('playlist', { id: it.id, title: title, description: q('#f-desc').value, is_public: q('#f-pub').checked, items: it.items || [] }, function (id) { openPl = id; filt.tab = 'playlist'; renderCatalog(); if (then) then(id); });
      };
    });
}
function savePlaylist(p) {
  renderAll();
  return sb.from('vr_playlists').update({ items: p.items, updated_at: new Date().toISOString() }).eq('id', p.id).then(function (r) { if (r.error) toast('Playlist nicht gespeichert.'); });
}
function addToPlaylist(pid, item, at) {
  var p = byId('playlist', pid); if (!p || !p.mine) return;
  if (item.t === 'playlist') return;
  p.items = p.items.slice();
  if (at == null || at > p.items.length) at = p.items.length;
  p.items.splice(at, 0, { t: item.t, id: item.id });
  savePlaylist(p); toast('Zu „' + p.title + '“ hinzugefügt.');
}
function pickPlaylist(item) {
  if (!needLogin(function () { pickPlaylist(item); })) return;
  var mine = S.playlists.filter(function (p) { return p.mine; });
  openModal('<h4>Zu Playlist hinzufügen</h4><div class="vr-rows">' + mine.map(function (p) { return '<button data-p="' + p.id + '" style="text-align:left;border-radius:10px">' + esc(p.title) + ' <span class="vr-muted">· ' + p.items.length + '</span></button>'; }).join('') +
    '</div><div class="vr-btns"><button data-x>Abbrechen</button><button class="pri" data-new>＋ Neue Playlist</button></div>', function () {
      q('[data-x]').onclick = closeModal;
      q('[data-new]').onclick = function () { playlistForm(null, function (id) { addToPlaylist(id, item); }); };
      mbox.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { closeModal(); addToPlaylist(b.dataset.p, item); }; });
    });
}

/* ---------- Meine Liste ---------- */
function isFav(t, id) { return S.favorites.some(function (f) { return f.t === t && f.id === id; }); }
function saveFav() { renderAside(); renderCatalog(); return saveSettings({ favorites: S.favorites }); }
function toggleFav(t, id) {
  if (!needLogin(function () { toggleFav(t, id); })) return;
  if (isFav(t, id)) S.favorites = S.favorites.filter(function (f) { return !(f.t === t && f.id === id); });
  else S.favorites = S.favorites.concat([{ t: t, id: id }]);
  saveFav();
}
var KIND = { artist: 'Künstler', album: 'Album', song: 'Song', playlist: 'Playlist' };
function itemImg(t, it) {
  var src = t === 'artist' ? it.photo_url : t === 'album' ? it.cover_url : null;
  if (t === 'song') { var al = byId('album', it.album_id), ar = byId('artist', it.artist_id); src = (al && al.cover_url) || (ar && ar.photo_url); }
  return safeUrl(src);
}
function rowHtml(t, it, extra, drag, idx) {
  var img = itemImg(t, it), name = it.name || it.title, sub = KIND[t];
  if (t === 'album' || t === 'song') { var a = byId('artist', it.artist_id); if (a) sub += ' · ' + a.name; }
  if (t === 'playlist') sub += ' · ' + it.items.length + ' Titel';
  return '<div class="vr-row" data-drag="' + drag + '" data-label="' + esc(name) + '" data-idx="' + (idx == null ? '' : idx) + '">' +
    (img ? '<img class="vr-thumb" src="' + esc(img) + '" alt="" loading="lazy">' : '<div class="vr-thumb" style="background:linear-gradient(135deg,#5a3418,#0b1a2b)">' + esc((name || '?')[0]) + '</div>') +
    '<div class="vr-rt"><b>' + esc(name) + '</b><span>' + esc(sub) + '</span></div>' + extra +
    '<span class="vr-drag" title="Ziehen">⠿</span></div>';
}
function renderAside() {
  var fav = $('vr-fav'), html = '';
  if (!S.me) html = '<div class="vr-empty">Melde dich an und sammle hier mit ♡ deine Künstler, Alben und Songs.<br><br>Ziehe Karten einfach hierher.</div>';
  else {
    S.favorites.forEach(function (f, i) {
      var it = byId(f.t, f.id); if (!it) return;
      html += rowHtml(f.t, it, '<button data-play="' + f.t + ':' + f.id + '" title="Abspielen">▶</button><button data-unfav="' + i + '" title="Entfernen">✕</button>', 'fav:' + i, i);
    });
    if (!html) html = '<div class="vr-empty">Noch leer. Tippe ♡ an einer Karte oder ziehe sie hierher.</div>';
  }
  fav.innerHTML = html;
  var mine = S.playlists.filter(function (p) { return p.mine; });
  $('vr-mypl').innerHTML = mine.length ? mine.map(function (p) {
    return '<div data-drop="pl:' + p.id + '">' + rowHtml('playlist', p, '<button data-openpl="' + p.id + '" title="Öffnen">☰</button>', 'playlist:' + p.id) + '</div>';
  }).join('') : '<div class="vr-muted" style="font-size:12px;padding:4px">Noch keine. Ziehe Songs auf eine Playlist, um sie zu füllen.</div>';
}
$('vr-aside').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  if (b.dataset.play) { var p = b.dataset.play.split(':'); playItem(p[0], p[1]); }
  if (b.dataset.unfav != null && b.dataset.unfav !== undefined && b.hasAttribute('data-unfav')) { S.favorites.splice(+b.dataset.unfav, 1); saveFav(); }
  if (b.dataset.openpl) { filt.tab = 'playlist'; openPl = b.dataset.openpl; renderCatalog(); $('vr-catalog').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('vr-aside').classList.remove('open'); }
  if (b.id === 'vr-newpl') playlistForm();
});
$('vr-aside-toggle').onclick = function () { $('vr-aside').classList.toggle('open'); };

/* ---------- Katalog ---------- */
var filt = { tab: 'artist', q: '', style: null, artist: null }, openPl = null;
$('vr-tabs').addEventListener('click', function (e) {
  var b = e.target.closest('[data-tab]'); if (!b) return;
  filt.tab = b.dataset.tab; filt.style = null; if (filt.tab === 'artist') filt.artist = null; renderCatalog();
});
$('vr-search').addEventListener('input', function () { filt.q = this.value.trim().toLowerCase(); renderCatalog(); });
$('vr-new').onclick = function () { ({ artist: artistForm, album: albumForm, song: songForm, playlist: playlistForm })[filt.tab](); };
$('vr-styles').addEventListener('click', function (e) {
  var c = e.target.closest('[data-style]'); if (c) { filt.style = filt.style === c.dataset.style ? null : c.dataset.style; renderCatalog(); }
  if (e.target.closest('[data-clear-artist]')) { filt.artist = null; renderCatalog(); }
});
function match(txt) { return !filt.q || (txt || '').toLowerCase().indexOf(filt.q) >= 0; }
function actBtns(t, it) {
  return '<div class="vr-acts"><button class="vr-heart' + (isFav(t, it.id) ? ' on' : '') + '" data-fav="' + t + ':' + it.id + '" title="Meine Liste">' + (isFav(t, it.id) ? '♥' : '♡') + '</button>' +
    '<button data-play="' + t + ':' + it.id + '" title="In meinem Player abspielen">▶</button>' +
    (t !== 'playlist' ? '<button data-addpl="' + t + ':' + it.id + '" title="Zu Playlist">＋</button>' : '') +
    (it.mine ? '<button data-edit="' + t + ':' + it.id + '" title="Bearbeiten">✎</button>' : '') + '</div>';
}
function artistCard(a) {
  var img = safeUrl(a.photo_url), soc = '';
  if (safeUrl(a.website)) soc += '<a href="' + esc(a.website) + '" target="_blank" rel="noopener" title="Website">' + svgIcon('website') + '</a>';
  SOCIALS.forEach(function (s) { var u = a.socials && safeUrl(a.socials[s[0]]); if (u) soc += '<a href="' + esc(u) + '" target="_blank" rel="noopener" title="' + s[1] + '">' + svgIcon(s[0]) + '</a>'; });
  var nAl = S.albums.filter(function (b) { return b.artist_id === a.id; }).length, nSo = S.songs.filter(function (s) { return s.artist_id === a.id; }).length;
  return '<div class="vr-card" data-drag="artist:' + a.id + '" data-label="' + esc(a.name) + '">' +
    (img ? '<img class="vr-ph" src="' + esc(img) + '" alt="' + esc(a.name) + '" loading="lazy">' : '<div class="vr-ini">' + esc(a.name[0] || '?') + '</div>') +
    '<h4>' + esc(a.name) + '</h4>' + (a.description ? '<p>' + esc(a.description) + '</p>' : '') +
    ((a.styles || []).length ? '<div class="vr-chips" style="margin:8px 0 0">' + a.styles.map(function (s) { return '<span class="vr-chip' + (filt.style === s ? ' on' : '') + '" data-style="' + esc(s) + '">' + esc(s) + '</span>'; }).join('') + '</div>' : '') +
    (soc ? '<div class="vr-soc">' + soc + '</div>' : '') +
    ((nAl || nSo) ? '<div class="vr-meta"><a href="#" data-artistview="' + a.id + '">' + (nAl ? nAl + ' Alben' : '') + (nAl && nSo ? ' · ' : '') + (nSo ? nSo + ' Songs' : '') + '</a></div>' : '') +
    actBtns('artist', a) + '<span class="vr-drag" title="Ziehen">⠿</span></div>';
}
function albumCard(b) {
  var img = safeUrl(b.cover_url), a = byId('artist', b.artist_id);
  return '<div class="vr-card" data-drag="album:' + b.id + '" data-label="' + esc(b.title) + '">' +
    (img ? '<img class="vr-ph" src="' + esc(img) + '" alt="" loading="lazy">' : '<div class="vr-ini">' + esc(b.title[0] || '?') + '</div>') +
    '<h4>' + esc(b.title) + '</h4><div class="vr-meta">' + esc(a ? a.name : '') + (b.year ? ' · ' + b.year : '') + '</div>' + actBtns('album', b) + '<span class="vr-drag" title="Ziehen">⠿</span></div>';
}
function plDetail(p) {
  var rows = p.items.map(function (x, i) {
    var it = byId(x.t, x.id); if (!it) return '';
    return rowHtml(x.t, it, '<button data-plplay="' + i + '" title="Abspielen">▶</button>' + (p.mine ? '<button data-plrm="' + i + '" title="Entfernen">✕</button>' : ''), 'plitem:' + p.id + ':' + i, i);
  }).join('');
  return '<div class="vr-pldetail"><div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap"><div style="flex:1;min-width:180px"><h4 style="font-size:18px">' + esc(p.title) + '</h4>' +
    '<div class="vr-meta">' + (p.mine ? 'Deine Playlist' : 'von ' + esc(p.owner_name || '')) + ' · ' + p.items.length + ' Titel' + (p.is_public ? ' · öffentlich' : ' · privat') + '</div>' +
    (p.description ? '<p style="margin:6px 0 0;color:#aab8c4">' + esc(p.description) + '</p>' : '') + '</div>' +
    '<div class="vr-acts" style="margin:0"><button data-plstart="' + p.id + '">▶ Abspielen</button><button data-fav="playlist:' + p.id + '" class="vr-heart' + (isFav('playlist', p.id) ? ' on' : '') + '">' + (isFav('playlist', p.id) ? '♥' : '♡') + '</button>' +
    (p.mine ? '<button data-edit="playlist:' + p.id + '">✎</button>' : '') + '<button data-plclose>✕</button></div></div>' +
    '<div class="vr-rows" data-drop="' + (p.mine ? 'plpos:' + p.id : 'none') + '" style="min-height:50px">' + (rows || '<div class="vr-empty" style="margin:0">Ziehe Songs, Alben oder Künstler hierher.</div>') + '</div></div>';
}
function renderCatalog() {
  [].forEach.call($('vr-tabs').children, function (b) { b.classList.toggle('on', b.dataset.tab === filt.tab); });
  $('vr-new').textContent = '＋ ' + { artist: 'Künstler', album: 'Album', song: 'Song', playlist: 'Playlist' }[filt.tab];
  var chips = '';
  if (filt.tab === 'artist') chips = allStyles().map(function (s) { return '<span class="vr-chip' + (filt.style === s ? ' on' : '') + '" data-style="' + esc(s) + '">' + esc(s) + '</span>'; }).join('');
  if (filt.artist && (filt.tab === 'album' || filt.tab === 'song')) { var fa = byId('artist', filt.artist); if (fa) chips = '<span class="vr-chip on" data-clear-artist>Künstler: ' + esc(fa.name) + ' ✕</span>'; }
  $('vr-styles').innerHTML = chips;
  var out = '';
  if (filt.tab === 'artist') {
    var as = S.artists.filter(function (a) { return (!filt.style || (a.styles || []).indexOf(filt.style) >= 0) && match(a.name + ' ' + (a.description || '') + ' ' + (a.styles || []).join(' ')); });
    out = as.length ? '<div class="vr-grid">' + as.map(artistCard).join('') + '</div>' : '<div class="vr-empty">Noch keine Künstler' + (filt.q || filt.style ? ' für diese Suche' : '') + '. Lege den ersten mit „＋ Künstler“ an.</div>';
  } else if (filt.tab === 'album') {
    var bs = S.albums.filter(function (b) { var a = byId('artist', b.artist_id); return (!filt.artist || b.artist_id === filt.artist) && match(b.title + ' ' + (a ? a.name : '')); });
    out = bs.length ? '<div class="vr-grid">' + bs.map(albumCard).join('') + '</div>' : '<div class="vr-empty">Noch keine Alben. „＋ Album“ legt eines an.</div>';
  } else if (filt.tab === 'song') {
    var ss = S.songs.filter(function (s) { var a = byId('artist', s.artist_id); return (!filt.artist || s.artist_id === filt.artist) && match(s.title + ' ' + (a ? a.name : '')); });
    out = ss.length ? '<div class="vr-rows">' + ss.map(function (s) { return rowHtml('song', s, actBtns('song', s).replace('class="vr-acts"', 'class="vr-acts" style="margin:0"'), 'song:' + s.id); }).join('') + '</div>' : '<div class="vr-empty">Noch keine Songs. „＋ Song“ legt einen an.</div>';
  } else {
    var ps = S.playlists.filter(function (p) { return match(p.title + ' ' + (p.description || '') + ' ' + (p.owner_name || '')); });
    var op = openPl && byId('playlist', openPl);
    out = (op ? plDetail(op) : '') + (ps.length ? '<div class="vr-grid">' + ps.map(function (p) {
      var first = p.items[0] && byId(p.items[0].t, p.items[0].id), img = first && itemImg(p.items[0].t, first);
      return '<div class="vr-card" data-drag="playlist:' + p.id + '" data-label="' + esc(p.title) + '" data-drop="' + (p.mine ? 'pl:' + p.id : 'none') + '">' +
        (img ? '<img class="vr-ph" src="' + esc(img) + '" alt="" loading="lazy">' : '<div class="vr-ini">☰</div>') +
        '<h4>' + esc(p.title) + '</h4><div class="vr-meta">' + (p.mine ? 'Deine' : 'von ' + esc(p.owner_name || '')) + ' · ' + p.items.length + ' Titel</div>' +
        '<div class="vr-acts"><button data-openpl="' + p.id + '">☰ Öffnen</button><button data-plstart="' + p.id + '">▶</button><button class="vr-heart' + (isFav('playlist', p.id) ? ' on' : '') + '" data-fav="playlist:' + p.id + '">' + (isFav('playlist', p.id) ? '♥' : '♡') + '</button></div>' +
        '<span class="vr-drag">⠿</span></div>';
    }).join('') + '</div>' : '<div class="vr-empty">Noch keine Playlisten. „＋ Playlist“ erstellt eine.</div>');
  }
  $('vr-list').innerHTML = out;
}
$('vr-list').addEventListener('click', function (e) {
  var b = e.target.closest('[data-fav],[data-play],[data-edit],[data-addpl],[data-openpl],[data-plstart],[data-plplay],[data-plrm],[data-plclose],[data-style],[data-artistview]');
  if (!b) return;
  var d = b.dataset, p;
  if (d.style) { filt.style = filt.style === d.style ? null : d.style; renderCatalog(); return; }
  if (d.artistview) { e.preventDefault(); filt.artist = d.artistview; filt.tab = S.albums.some(function (x) { return x.artist_id === d.artistview; }) ? 'album' : 'song'; renderCatalog(); return; }
  if (d.fav) { p = d.fav.split(':'); toggleFav(p[0], p[1]); }
  if (d.play) { p = d.play.split(':'); playItem(p[0], p[1]); }
  if (d.addpl) { p = d.addpl.split(':'); pickPlaylist({ t: p[0], id: p[1] }); }
  if (d.edit) { p = d.edit.split(':'); ({ artist: artistForm, album: albumForm, song: songForm, playlist: playlistForm })[p[0]](byId(p[0], p[1])); }
  if (d.openpl) { openPl = d.openpl; renderCatalog(); }
  if (d.plclose !== undefined && b.hasAttribute('data-plclose')) { openPl = null; renderCatalog(); }
  if (d.plstart) { var pl0 = byId('playlist', d.plstart); if (pl0 && pl0.items.length) playItem(pl0.items[0].t, pl0.items[0].id, pl0, 0); else toast('Die Playlist ist noch leer.'); }
  if (d.plplay) { var op = byId('playlist', openPl), x = op.items[+d.plplay]; playItem(x.t, x.id, op, +d.plplay); }
  if (d.plrm) { var op2 = byId('playlist', openPl); op2.items = op2.items.slice(); op2.items.splice(+d.plrm, 1); savePlaylist(op2); }
});

/* ---------- Ziehen & Ablegen (Maus und Touch) ---------- */
var drag = null, ghost = null, dropEl = null, insertEl = null;
function itemFromDrag(data) {
  var p = data.split(':');
  if (p[0] === 'fav') return S.favorites[+p[1]];
  if (p[0] === 'plitem') { var pl0 = byId('playlist', p[1]); return pl0 && pl0.items[+p[2]]; }
  return { t: p[0], id: p[1] };
}
function insertIndex(zone, y) {
  var rows = [].filter.call(zone.children, function (c) { return c.classList && c.classList.contains('vr-row'); }), i;
  for (i = 0; i < rows.length; i++) { var r = rows[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return { i: i, el: rows[i] }; }
  return { i: rows.length, el: null };
}
function clearDrop() { if (dropEl) dropEl.classList.remove('vr-dropok'); dropEl = null; if (insertEl) { insertEl.remove(); insertEl = null; } }
root.addEventListener('pointerdown', function (e) {
  var src = e.target.closest('[data-drag]'); if (!src || e.button > 0) return;
  if (e.target.closest('button,a,input,textarea,select,.vr-chip')) return;
  var handle = e.target.closest('.vr-drag');
  if (e.pointerType !== 'mouse' && !handle) return;   // auf Touch nur über den Griff, damit Scrollen frei bleibt
  drag = { src: src, data: src.dataset.drag, label: src.dataset.label || '', x0: e.clientX, y0: e.clientY, on: false };
});
window.addEventListener('pointermove', function (e) {
  if (!drag) return;
  if (!drag.on) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7) return;
    drag.on = true; ghost = document.createElement('div'); ghost.className = 'vr-ghost'; ghost.textContent = '♪ ' + drag.label; root.appendChild(ghost);
    root.style.userSelect = 'none'; drag.src.style.opacity = '.45';
  }
  e.preventDefault();
  ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
  var el = document.elementFromPoint(e.clientX, e.clientY), z = el && el.closest('[data-drop]');
  if (z && z.dataset.drop === 'none') z = null;
  if (z !== dropEl) { clearDrop(); dropEl = z; if (z) z.classList.add('vr-dropok'); }
  if (z && (z.dataset.drop === 'fav' || z.dataset.drop.indexOf('plpos:') === 0)) {
    var ins = insertIndex(z, e.clientY);
    if (!insertEl) { insertEl = document.createElement('div'); insertEl.className = 'vr-insert'; }
    z.insertBefore(insertEl, ins.el); drag.at = ins.i;
  } else if (insertEl) { insertEl.remove(); insertEl = null; }
}, { passive: false });
window.addEventListener('pointerup', function () {
  if (!drag) return;
  var d = drag; drag = null;
  if (!d.on) return;
  ghost.remove(); ghost = null; root.style.userSelect = ''; d.src.style.opacity = '';
  var z = dropEl, at = d.at; clearDrop();
  if (!z) return;
  var target = z.dataset.drop, it = itemFromDrag(d.data), from = d.data.split(':');
  if (!it) return;
  if (!needLogin()) return;
  if (target === 'fav') {
    var old = from[0] === 'fav' ? +from[1] : S.favorites.findIndex(function (f) { return f.t === it.t && f.id === it.id; });
    var list = S.favorites.slice();
    if (old >= 0) { list.splice(old, 1); if (at > old) at--; }
    list.splice(at == null ? list.length : at, 0, { t: it.t, id: it.id });
    S.favorites = list; saveFav();
  } else if (target.indexOf('plpos:') === 0) {
    var pid = target.slice(6), pl1 = byId('playlist', pid);
    if (from[0] === 'plitem' && from[1] === pid) {
      var oi = +from[2]; pl1.items = pl1.items.slice(); var mv = pl1.items.splice(oi, 1)[0]; if (at > oi) at--; pl1.items.splice(at, 0, mv); savePlaylist(pl1);
    } else addToPlaylist(pid, it, at);
  } else if (target.indexOf('pl:') === 0) {
    addToPlaylist(target.slice(3), it);
  } else if (target === 'catalog') {
    if (from[0] === 'fav') { S.favorites.splice(+from[1], 1); saveFav(); }
    if (from[0] === 'plitem') { var pl2 = byId('playlist', from[1]); pl2.items = pl2.items.slice(); pl2.items.splice(+from[2], 1); savePlaylist(pl2); }
  }
});
window.addEventListener('pointercancel', function () { if (drag && drag.on) { ghost.remove(); ghost = null; root.style.userSelect = ''; drag.src.style.opacity = ''; clearDrop(); } drag = null; });

/* ---------- Song einreichen ---------- */
$('vr-s-send').onclick = function () {
  var msg = $('vr-s-msg'), btn = this;
  function say(t, ok) { msg.textContent = t; msg.classList.toggle('ok', !!ok); }
  if (!needLogin(function () { $('vr-s-send').click(); })) return;
  var title = $('vr-s-title').value.trim(), f = $('vr-s-file').files[0];
  if (!title) return say('Bitte einen Titel eingeben.');
  if (!f) return say('Bitte eine Audiodatei wählen.');
  if (f.size > 50 * 1024 * 1024) return say('Die Datei ist größer als 50 MB.');
  if (!$('vr-s-ok').checked) return say('Bitte bestätige die Rechte am Song.');
  var ext = (f.name.split('.').pop() || '').toLowerCase();
  if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'aiff', 'aif'].indexOf(ext) < 0) return say('Dieses Format geht leider nicht (mp3, wav, m4a, flac, ogg, aiff).');
  btn.disabled = true; say('Lade hoch …');
  upload('song-einreichungen', f, ext, f.type || 'audio/mpeg', function (p) { $('vr-s-bar').style.width = (p * 100) + '%'; say('Lade hoch … ' + Math.round(p * 100) + ' %'); })
    .then(function (up) {
      return sb.from('vr_submissions').insert({ title: title, artist_name: $('vr-s-artist').value.trim() || null, note: $('vr-s-note').value.trim() || null, storage_path: up.path, file_name: f.name.slice(0, 200) });
    }).then(function (r) {
      btn.disabled = false;
      if (r.error) return say('Eintragen hat nicht geklappt.');
      say('Danke! „' + title + '“ ist eingereicht und wandert in den Vereins-Drive.', true);
      ['vr-s-title', 'vr-s-artist', 'vr-s-note', 'vr-s-file'].forEach(function (id) { $(id).value = ''; }); $('vr-s-ok').checked = false;
      goldBurst();
    }).catch(function () { btn.disabled = false; say('Upload fehlgeschlagen — bitte erneut versuchen.'); });
};

function renderAll() { renderAcct(); renderCatalog(); renderAside(); refreshPlayer(); }
onState.push(renderAll);
