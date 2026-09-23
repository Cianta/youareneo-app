/* Shared navigation and distinct rendering profiles. Cinematic assets are never
   requested by Pixel. All scene coordinates remain in the existing hit system. */
(function () {
  var nav = document.createElement('nav');
  nav.id = 'vr-navigation'; nav.setAttribute('aria-label', 'Raum und Bereiche');
  nav.innerHTML = '<div class="vr-mode-switch" aria-label="Darstellung"><button data-mode="0">Cinematic</button><button data-mode="1">Pixel <small>· spart Daten</small></button></div><div class="vr-jumps"><button data-section="vr-catalog">Klangwelten</button><button data-section="vr-temple">Tempelgarten</button><button data-studio>Studio</button><button data-player hidden>Player</button></div>';
  ($('vr-ui') || bg).appendChild(nav);
  afterFrame.push(function () { nav.classList.toggle('vr-nav-scrolled', svS > .15); });
  nav.querySelectorAll('[data-mode]').forEach(function (b) {
    var active = (b.dataset.mode === '1') === PIXEL;
    b.classList.toggle('on', active); b.setAttribute('aria-pressed', String(active));
    b.onclick = function () {
      if (active) return;
      var u = new URL(location.href); u.searchParams.set('pixel', b.dataset.mode);
      location.assign(u.href);
    };
  });
  nav.querySelectorAll('[data-section]').forEach(function (b) { b.onclick = function () { $(b.dataset.section).scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }); }; });
  var mobilePlayerOpen = false, mobilePlayerButton = nav.querySelector('[data-player]');
  mobilePlayerButton.onclick = function () { mobilePlayerOpen = !mobilePlayerOpen; mobilePlayerButton.setAttribute('aria-expanded', String(mobilePlayerOpen)); };
  afterFrame.push(function () { var compact = W < 640 && svS > .6; mobilePlayerButton.hidden = !compact; root.classList.toggle('vr-compact-player', compact && !mobilePlayerOpen); });
  nav.querySelector('[data-studio]').onclick = function () { if (window.vrOpenStudio) window.vrOpenStudio(); };
  var pause = document.createElement('button'); pause.id = 'vr-motion'; pause.textContent = 'Ⅱ'; pause.title = 'Animationen pausieren'; pause.setAttribute('aria-label', pause.title); pause.setAttribute('aria-pressed','false');
  $('vr-tools').appendChild(pause);
  ($('vr-ui') || bg).appendChild($('vr-tools'));
  ($('vr-ui') || bg).appendChild($('vr-avatar'));
  pause.onclick = function () { visualsPaused = !visualsPaused; root.classList.toggle('vr-motion-paused', visualsPaused); pause.textContent = visualsPaused ? '▷' : 'Ⅱ'; pause.setAttribute('aria-pressed', String(visualsPaused)); pause.title = visualsPaused ? 'Animationen fortsetzen' : 'Animationen pausieren'; pause.setAttribute('aria-label', pause.title); };
  root.querySelectorAll('button[title]').forEach(function (b) { if (!b.hasAttribute('aria-label')) b.setAttribute('aria-label', b.title); });
  var dial = $('vr-drumface'); dial.tabIndex = 0; dial.setAttribute('role', 'button'); dial.setAttribute('aria-label', 'Meditationsuhr starten oder pausieren. Pfeiltasten ändern die Dauer.');
  dial.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleT(); } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setMinutes(clamp((infinite ? 10 : total / 60) + (e.key === 'ArrowUp' ? 1 : -1), 1, 180)); } });
  $('vr-s-msg').setAttribute('role','status');
  // Keyboard/touch equivalents for canvas instruments.
  var actions = document.createElement('div'); actions.className = 'vr-garden-actions';
  actions.innerHTML = '<span>TEMPELGARTEN</span><h3>Ein Klang. Ganz hier.</h3><p>Berühre den Gong oder spiele mit den Klängen im Garten.</p><div><button data-gong>Gong spielen</button><button data-fire>Feuer</button><button data-incense>Räucherwerk</button><button data-drums>Trommel</button><a href="https://youareneo.com/collections/musik" target="_blank" rel="noopener">Musik entdecken ↗</a></div>';
  tSec.appendChild(actions);
  actions.querySelector('[data-gong]').onclick = function () { ctx(); audioReady = true; templeStrike(8); };
  var fireButton = actions.querySelector('[data-fire]'), incenseButton = actions.querySelector('[data-incense]');
  function paintActions() { fireButton.setAttribute('aria-pressed', String(WS.fire)); incenseButton.setAttribute('aria-pressed', String(WS.incense)); }
  fireButton.onclick = function () { WS.fire = !WS.fire; paintActions(); if (WS.fire) VOICES.crackle(ctx().currentTime, 0, 1, fxOut); };
  incenseButton.onclick = function () { WS.incense = !WS.incense; paintActions(); };
  tc.addEventListener('pointerup', paintActions); paintActions();
  actions.querySelector('[data-drums]').onclick = function () { drumHits[1] = 1; playDrum({voice:'frame',f:110,vol:.9},ctx().currentTime+.005,1); beatImpulse(); };
  // Modal focus stays inside; Escape restores the opener.
  var opener = null, openOriginal = openModal, closeOriginal = closeModal;
  mbox.setAttribute('role','dialog'); mbox.setAttribute('aria-modal','true'); mbox.setAttribute('aria-label','Visual Room'); mbox.tabIndex = -1;
  openModal = function (html, bind) { if (!modal.classList.contains('open')) opener = document.activeElement; openOriginal(html, bind); var heading = mbox.querySelector('h2,h3,h4'); if (heading) mbox.setAttribute('aria-label', heading.textContent); var first = mbox.querySelector('button,input,select,textarea,a[href]'); (first || mbox).focus(); };
  closeModal = function () { closeOriginal(); if (opener && opener.isConnected) opener.focus(); };
  modal.addEventListener('keydown', function (e) { if (e.key !== 'Tab') return; var nodes = Array.from(mbox.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')).filter(function (x) { return x.getClientRects().length; }); if (!nodes.length) { e.preventDefault(); mbox.focus(); return; } var first = nodes[0], last = nodes[nodes.length-1]; if (e.shiftKey && (document.activeElement === first || document.activeElement === mbox)) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } });
  if (PIXEL) { document.title = 'Visual Room · Pixel · YOU ARE NEO'; return; }
  document.title = 'Visual Room · Cinematic · YOU ARE NEO';
  function asset(name) { return window.VR_ASSETS && window.VR_ASSETS[name] || assetBase + name; }
  var scene = new Image(); scene.decoding = 'async'; scene.src = asset('sanctuary.png');
  var foliage = new Image(); foliage.decoding = 'async'; foliage.src = asset('forest-foreground.png');
  scene.onerror = function () { root.classList.add('vr-scene-unavailable'); };
  function cover(g, im, w, h, t) {
    if (!ready(im) || !w || !h) return false;
    var scale = Math.max(w / im.naturalWidth, h / im.naturalHeight) * 1.04, iw = im.naturalWidth * scale, ih = im.naturalHeight * scale;
    var drift = reduced ? 0 : Math.sin(t * .06) * Math.min(12, w * .012);
    g.drawImage(im, (w-iw)/2 + drift, (h-ih)/2, iw, ih); return true;
  }
  function mist(g, w, h, t, alpha) {
    g.save(); g.globalCompositeOperation = 'screen';
    for (var j=0;j<3;j++) { var x = w * (.3 + j*.2 + Math.sin(t*.07+j)*.1), y=h*(.55+j*.07), r=w*.42; var gradient=g.createRadialGradient(x,y,0,x,y,r); gradient.addColorStop(0,'rgba(143,188,194,'+alpha+')'); gradient.addColorStop(1,'rgba(143,188,194,0)'); g.fillStyle=gradient; g.save(); g.translate(0,y*.8); g.scale(1,.2); g.fillRect(0,-h,w,h*4); g.restore(); }
    g.restore();
  }
  // Retain audio-reactive mandalas, light particles, timer and instruments.
  // Nature is now photographic throughout, independently swaying in the foreground.

  // === CINEMATIC COSMOS (Sterne + astronomischer Mond) =================
  // Eigene Canvas 'vr-cosmos' (zwischen vr-energy und vr-mandala).
  // Sternenfeld als deterministische Punktwolke; Mond mit astronomischer
  // Lunation (cos-basiert), Halbmond-Sichelung über arc + ellipse.
  // Hemisphere-Settings via localStorage('vr_hemisphere'): north|south|equator.
  // Default 'north'. Profil-UI + IP-Default folgen in einer späteren Iteration.

  var HEMISPHERE = (function () {
    try {
      var v = localStorage.getItem('vr_hemisphere');
      if (v === 'north' || v === 'south' || v === 'equator') return v;
    } catch (e) {}
    return 'north';
  })();

  function cosmosMoonPhase(d) {
    var p = ((d - Date.UTC(2000, 0, 6, 18, 14)) / 86400000 / 29.530588853) % 1;
    return p < 0 ? p + 1 : p;
  }

  var cosmosCanvas = document.getElementById('vr-cosmos');
  var cosmosCtx = cosmosCanvas ? cosmosCanvas.getContext('2d') : null;

  // Mulberry32 — seedbare Pseudo-Random-Funktion. Sterne bleiben über Reloads stabil.
  function vrSeed(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var starRng = vrSeed(424242);
  var stars = [];
  for (var sIdx = 0; sIdx < 320; sIdx++) {
    stars.push({
      x: starRng(),
      y: starRng() * 0.6,
      r: 0.35 + starRng() * 1.4,
      hue: starRng() < 0.07 ? 200 : (starRng() < 0.04 ? 35 : 220),
      phase: starRng() * Math.PI * 2,
      rate: 0.4 + starRng() * 1.3,
      big: starRng() > 0.93
    });
  }

  function cosmosResize() {
    if (!cosmosCtx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cosmosCanvas.clientWidth || W;
    var h = cosmosCanvas.clientHeight || H;
    var tw = Math.round(w * dpr), th = Math.round(h * dpr);
    if (cosmosCanvas.width !== tw || cosmosCanvas.height !== th) {
      cosmosCanvas.width = tw; cosmosCanvas.height = th;
    }
    cosmosCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCosmos(t) {
    if (!cosmosCtx) return;
    cosmosResize();
    var Wc = cosmosCanvas.clientWidth || W;
    var Hc = cosmosCanvas.clientHeight || H;
    cosmosCtx.clearRect(0, 0, Wc, Hc);

    // 1. Milchstraßen-Band — sehr leichter Gradient im oberen Bereich.
    cosmosCtx.save();
    cosmosCtx.globalCompositeOperation = 'screen';
    var mwAngle = HEMISPHERE === 'south' ? 0.18 : -0.18;
    var bandG = cosmosCtx.createLinearGradient(0, 0, Wc, Hc * 0.4);
    bandG.addColorStop(0, 'rgba(50, 60, 110, 0)');
    bandG.addColorStop(0.5, 'rgba(110, 130, 200, 0.05)');
    bandG.addColorStop(1, 'rgba(60, 80, 130, 0)');
    cosmosCtx.save();
    cosmosCtx.translate(Wc * 0.5, Hc * 0.18);
    cosmosCtx.rotate(mwAngle);
    cosmosCtx.translate(-Wc * 0.5, -Hc * 0.18);
    cosmosCtx.fillStyle = bandG;
    cosmosCtx.fillRect(0, 0, Wc, Hc * 0.4);
    cosmosCtx.restore();
    cosmosCtx.restore();

    // 2. Sternenfeld
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var twinkle = 0.45 + 0.55 * Math.sin(t * s.rate + s.phase);
      var color = s.hue === 200 ? '190, 220, 255' : (s.hue === 35 ? '255, 220, 180' : '255, 255, 255');
      cosmosCtx.fillStyle = 'rgba(' + color + ',' + (0.4 + twinkle * 0.55) + ')';
      cosmosCtx.beginPath();
      cosmosCtx.arc(s.x * Wc, s.y * Hc, s.r, 0, Math.PI * 2);
      cosmosCtx.fill();
      if (s.big) {
        cosmosCtx.fillStyle = 'rgba(' + color + ',' + (twinkle * 0.18) + ')';
        cosmosCtx.beginPath();
        cosmosCtx.arc(s.x * Wc, s.y * Hc, s.r * 4, 0, Math.PI * 2);
        cosmosCtx.fill();
      }
    }

    // 3. Mond mit astronomischer Phase
    var now = Date.now();
    var p = cosmosMoonPhase(now);
    var x = Math.cos(p * 6.2832);
    var isFullMoon = Math.abs(p - 0.5) < 0.06;
    var isNewMoon = p < 0.04 || p > 0.96;

    var r = Math.min(Wc, Hc) * 0.045;
    // Hemisphären-Position: Nord sieht Mond eher oben-links steigen, Süd eher rechts,
    // Äquator direkt über uns.
    var mx, my;
    if (HEMISPHERE === 'south') {
      mx = Wc * 0.78; my = Hc * 0.16;
    } else if (HEMISPHERE === 'equator') {
      mx = Wc * 0.5; my = Hc * 0.08;
    } else {
      mx = Wc * 0.18; my = Hc * 0.16;
    }
    // Subtile Mond-Wanderung (deaktiviert bei reduced motion).
    mx += (reduced ? 0 : Math.sin(t * 0.08) * 4);
    my += (reduced ? 0 : Math.cos(t * 0.06) * 2);

    // Halo / Glow
    cosmosCtx.save();
    cosmosCtx.globalCompositeOperation = 'screen';
    var haloR = r * (isFullMoon ? 5.5 : 3.5);
    var halo = cosmosCtx.createRadialGradient(mx, my, r * 0.5, mx, my, haloR);
    halo.addColorStop(0, 'rgba(200, 215, 255, ' + (isFullMoon ? 0.32 : 0.18) + ')');
    halo.addColorStop(0.45, 'rgba(180, 200, 240, ' + (isFullMoon ? 0.12 : 0.06) + ')');
    halo.addColorStop(1, 'rgba(150, 180, 230, 0)');
    cosmosCtx.fillStyle = halo;
    cosmosCtx.fillRect(mx - haloR, my - haloR, haloR * 2, haloR * 2);
    cosmosCtx.restore();

    if (isNewMoon) {
      // Neumond: nur ein sehr leichter Silhouetten-Rest als atmosphärisches Signal.
      cosmosCtx.save();
      cosmosCtx.globalAlpha = 0.22;
      cosmosCtx.fillStyle = '#1a2030';
      cosmosCtx.beginPath();
      cosmosCtx.arc(mx, my, r * 0.92, 0, Math.PI * 2);
      cosmosCtx.fill();
      cosmosCtx.restore();
      return;
    }

    // Mond-Scheibe + illuminierter Anteil (Logik aus visuellem Original übernommen:
    // arc = Halbkreis der beleuchteten Hemisphäre, ellipse = Terminator).
    cosmosCtx.save();
    cosmosCtx.translate(mx, my);
    if (p > 0.5) cosmosCtx.scale(-1, 1); // abnehmend → spiegeln

    // Dunkler Hintergrundkreis (damit der Mond opak wirkt, nicht als Loch)
    cosmosCtx.fillStyle = 'rgba(20, 24, 32, 0.85)';
    cosmosCtx.beginPath();
    cosmosCtx.arc(0, 0, r, 0, Math.PI * 2);
    cosmosCtx.fill();

    // Illuminierter Mondpfad
    var mg = cosmosCtx.createRadialGradient(-r * 0.25, -r * 0.3, 1, 0, 0, r);
    mg.addColorStop(0, '#fdf8e8');
    mg.addColorStop(0.7, '#d8d6c8');
    mg.addColorStop(1, '#9aa0a8');
    cosmosCtx.fillStyle = mg;
    cosmosCtx.beginPath();
    cosmosCtx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    cosmosCtx.ellipse(0, 0, Math.abs(x) * r, r, 0, Math.PI / 2, -Math.PI / 2, x > 0);
    cosmosCtx.fill();

    // Bei Vollmond / stark beleuchtetem Mond: kleine Krater-Schimmer für Realismus.
    if (isFullMoon || Math.abs(x) > 0.7) {
      cosmosCtx.fillStyle = 'rgba(140, 130, 115, 0.32)';
      cosmosCtx.beginPath();
      cosmosCtx.arc(-r * 0.22, -r * 0.05, r * 0.11, 0, Math.PI * 2);
      cosmosCtx.fill();
      cosmosCtx.beginPath();
      cosmosCtx.arc(r * 0.18, r * 0.22, r * 0.07, 0, Math.PI * 2);
      cosmosCtx.fill();
      cosmosCtx.beginPath();
      cosmosCtx.arc(r * 0.08, -r * 0.28, r * 0.05, 0, Math.PI * 2);
      cosmosCtx.fill();
    }
    cosmosCtx.restore();
  }

  afterFrame.push(drawCosmos);

  // Globale Bridge für Profil-UI / Studio-Panel (Iteration 2).
  window.VR_HEMISPHERE = HEMISPHERE;
  window.VR_SET_HEMISPHERE = function (h) {
    if (h !== 'north' && h !== 'south' && h !== 'equator') return;
    try { localStorage.setItem('vr_hemisphere', h); } catch (e) {}
    HEMISPHERE = h;
  };
  // === /CINEMATIC COSMOS ==============================================
  var energyOriginal = drawEnergy;
  drawEnergy = function (t) { ge.setTransform(DPR,0,0,DPR,0,0); ge.globalCompositeOperation='source-over'; ge.clearRect(0,0,W,H); if (!cover(ge,scene,W,H,t)) { energyOriginal(t); return; } ge.fillStyle='rgba(2,9,13,.28)'; ge.fillRect(0,0,W,H); mist(ge,W,H,t,.06); };
  drawSky = function () {};
  drawJungle = drawBranch = drawTrunks = function () {};
  var snakePhoto = null;
  drawSnake = function (t, u) {
    if (u <= 0 || W < 420) return;
    if (!snakePhoto) { snakePhoto = new Image(); snakePhoto.src = asset('forest-snake.png'); }
    if (!ready(snakePhoto)) return;
    var size = Math.min(W*.27, 260), x = W - TW*.7 - size*.45, y = lerp(-size*.6, H*.42, smooth(u));
    gf.save(); gf.globalCompositeOperation='screen'; gf.globalAlpha=smooth(u*4)*.85;
    gf.translate(x,y); gf.rotate(reduced ? 0 : Math.sin(t*.4)*.035);
    gf.drawImage(snakePhoto,-size/2,-size/2,size,size); gf.restore();
  };
  drawFerns = function (t) {
    if (!ready(foliage)) return;
    var fh = H*.92, fw=fh*foliage.naturalWidth/foliage.naturalHeight;
    [-1,1].forEach(function (side) { gf.save(); gf.translate(side===-1 ? -fw*.2 : W+fw*.2,H); gf.scale(side===-1 ? 1 : -1,1); gf.rotate(reduced ? 0 : Math.sin(t*.22+side)*.009); gf.globalAlpha=.78; gf.drawImage(foliage,0,-fh,fw,fh); gf.restore(); });
  };
  var groundOriginal = drawGround;
  drawGround = function (t) {
    // Cinematic: Tempel-Boden ist EIGENE Komposition. NICHT mehr das Sanctuary-Bild
    // — das lebt oben im Hintergrund (vr-energy). Wenn das Sanctuary-Asset nicht lädt,
    // fallen wir auf den ursprünglichen Tempel-Render zurück.
    if (!ready(scene)) { groundOriginal(t); return; }
    var g = tg.createLinearGradient(0, 0, 0, THd);
    g.addColorStop(0, 'rgba(7, 14, 22, 0.92)');
    g.addColorStop(0.45, 'rgba(15, 26, 30, 0.92)');
    g.addColorStop(0.75, 'rgba(24, 36, 30, 0.92)');
    g.addColorStop(1, 'rgba(42, 52, 34, 0.95)');
    tg.fillStyle = g;
    tg.fillRect(0, 0, TWd, THd);
    mist(tg, TWd, THd, t, 0.11);
  };
  // Landscape is one coherent photographic environment; keep all interactive objects.
  var landscape = [drawMountains,drawTemple,drawCherries,drawPond,drawPyramid];
  drawMountains=function(t){if(!ready(scene))landscape[0](t);};
  drawTemple=function(t,s){if(!ready(scene))landscape[1](t,s);};
  drawCherries=function(t,s){if(!ready(scene))landscape[2](t,s);};
  drawPond=function(t){if(!ready(scene))landscape[3](t);};
  drawPyramid=function(t,s){if(!ready(scene))landscape[4](t,s);};
  // The real lake in the background receives moving silver reflections.
  var lakeOriginal=drawLake;
  drawLake=function(t){ if(!ready(scene))return lakeOriginal(t); tg.save(); tg.globalCompositeOperation='screen'; for(var i=0;i<15;i++){var y=THd*(.50+i*.008), x=TWd*(.55+Math.sin(t*.4+i)*.015);tg.strokeStyle='rgba(186,213,219,'+(.025+.025*Math.sin(t+i))+')';tg.lineWidth=1;tg.beginPath();tg.moveTo(x-TWd*.05,y);tg.lineTo(x+TWd*.05,y);tg.stroke();}tg.restore(); };
})();
