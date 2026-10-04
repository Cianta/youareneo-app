"use strict";
(() => {
  // Höchststand der Scroll-Position: beim Hochscrollen bleibt alles stehen, das Logo kehrt in den Header zurück,
  // erst wenn man wieder an der alten Stelle ist, geht die Animation weiter (gemeinsam mit es-zauber).
  const HW =
    window.ESHW ||
    (window.ESHW = (() => {
      const h = { max: scrollY, back: !1, off: 0 };
      h.tick = () => {
        const y = scrollY;
        h.back ? y >= h.max - 4 && (h.back = !1) : y < h.max - 48 && (h.back = !0);
        y > h.max && (h.max = y);
        h.off = Math.min(0, y - h.max);
        h.eff = Math.max(y, h.max);
        return h;
      };
      return h.tick(), h;
    })());
  function sa(X) {
    if (!X || X.dataset.ready) return;
    const po = document.querySelector('section.es[data-ready="1"]');
    if (po && po !== X) {
      ((X.dataset.ready = "skip"), (X.style.display = "none"));
      return;
    }
    X.dataset.ready = "1";
    const se = X.dataset.sid;
    X.dataset.end = "#242833";
    const zt = X.dataset,
      uo = zt.src,
      Ct = (parseInt(zt.intensity, 10) || 70) / 100,
      Kt = (e) => zt[e] !== "false",
      ia = matchMedia("(prefers-reduced-motion: reduce)").matches,
      te = (zt.art || "").split("|"),
      Z = {
        merge: [0, 0.08],
        stars: [0.04, 0.55],
        live: [0.03, 0.24],
        plants: [0.1, 0.46],
        water: [0.14, 0.62],
        fire: [0.08, 0.62],
        haze: [0.18, 0.6],
        cosmos: [0.54, 0.72],
        light: [0.62, 0.84],
        cta: [0.84, 0.95],
        page: [0.9, 1],
        hole: [0.04, 0.16],
        source: [0.74, 0.86],
        mist: [0.8, 0.9],
        dusk: [0.93, 1],
      },
      tt = (e, t = 0, o = 1) => Math.min(o, Math.max(t, e)),
      B = (e, [t, o]) => tt((e - t) / (o - t)),
      et = (e) => (e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2),
      Nt = (e) => 1 - Math.pow(1 - e, 3),
      L = (e, t, o) => e + (t - e) * o,
      c = (e, t) => e + Math.random() * (t - e),
      Pt = (e) => e[Math.floor(Math.random() * e.length)],
      Et = Math.PI / 180,
      E = Math.PI * 2,
      Oe = {
        water: ["#8fdcec", "#2a7fb3"],
        fire: ["#ffd08a", "#f0642a"],
        plants: ["#b6dc7c", "#3d8a3c"],
        gold: ["#f4dfb0", "#c49a4c"],
      },
      ra = X.querySelector(".es__stage"),
      Pe = X.querySelector(".es__orb"),
      ca = X.querySelector(".es__halo"),
      yo = X.querySelector(".es__ring"),
      mo = X.querySelector(".es__light"),
      Le = X.querySelector(".es__nebula"),
      bo = X.querySelector(".es__heading"),
      Ge = X.querySelector(".es__live"),
      Mo = X.querySelector(".es__flora"),
      Dt = X.querySelector(".es__cta"),
      Ye = (e) => {
        const t = X.querySelector(`#es${e}-${se}`);
        return t ? { turb: t.querySelector("feTurbulence"), disp: t.querySelector("feDisplacementMap") } : null;
      },
      Ne = Ye("w"),
      De = Ye("f"),
      je = Ye("p");
    if (ia) return;
    const Rt = document.createElement("canvas");
    ((Rt.className = "es__drip"),
      Rt.setAttribute("aria-hidden", "true"),
      (Rt.style.cssText =
        "position:absolute;left:0;top:0;width:100%;height:46vh;pointer-events:none;z-index:4;display:block"),
      X.prepend(Rt));
    const _ = Rt.getContext("2d");
    let Bt = 0,
      Ht = 0,
      Wt = "36,40,51";
    const Ve = [],
      xo = { x: 0 };
    function ha() {
      let t = (X.closest('[id^="shopify-section"]') || X).nextElementSibling;
      for (; t && t.getBoundingClientRect().height < 4;) t = t.nextElementSibling;
      if (!t) return null;
      const o = t.getBoundingClientRect(),
        l = (r) => r && !/^rgba\([^)]*,\s*0\)$/.test(r) && r !== "transparent";
      let a = null;
      for (const r of [t, ...t.querySelectorAll("*")]) {
        const d = r.getBoundingClientRect();
        if (d.width < innerWidth * 0.8 || Math.abs(d.top - o.top) > 6) continue;
        const s = getComputedStyle(r).backgroundColor;
        l(s) && (a = s);
      }
      return a || getComputedStyle(document.body).backgroundColor;
    }
    function da() {
      const t = (X.closest('[id^="shopify-section"]') || X).previousElementSibling;
      if (!t) return null;
      const o = t.getBoundingClientRect(),
        l = (r) => r && !/^rgba\([^)]*,\s*0\)$/.test(r) && r !== "transparent";
      let a = null;
      for (const r of [t, ...t.querySelectorAll("*")]) {
        const d = r.getBoundingClientRect();
        if (d.width < innerWidth * 0.8 || Math.abs(d.bottom - o.bottom) > 6) continue;
        const s = getComputedStyle(r).backgroundColor;
        l(s) && (a = s);
      }
      return a || getComputedStyle(document.body).backgroundColor;
    }
    function fa() {
      const e = Math.min(devicePixelRatio || 1, 1.5);
      ((Bt = Rt.clientWidth),
        (Ht = Rt.clientHeight),
        (Rt.width = Bt * e),
        (Rt.height = Ht * e),
        _.setTransform(e, 0, 0, e, 0, 0));
      const t = (da() || "").match(/\d+(\.\d+)?/g);
      t && t.length >= 3 && (Wt = t.slice(0, 3).join(","));
      const o = (ha() || "").match(/\d+(\.\d+)?/g);
      (pa(Wt, o && o.length >= 3 ? o.slice(0, 3).join(",") : null), (Ve.length = 0));
      let l = c(-10, 30);
      for (; l < Bt + 30;) {
        const a = Math.random() < 0.42,
          r = a ? c(20, 52) : 5 + 18 * Math.pow(Math.random(), 1.5);
        (Ve.push({
          x: l,
          w: r,
          mud: a,
          len: c(3, 14),
          max: (a ? c(30, 120) : c(70, 320)) * (r / 22) * c(0.6, 1.3),
          sp: a ? c(0.12, 0.4) : c(0.6, 1.5),
          ph: c(0, E),
          sk: c(-0.45, 0.45),
          nk: c(0.7, 1.35),
          lumps: Array.from({ length: 5 }, () => c(-0.18, 0.18)),
          drops: [],
        }),
          (l += r + c(26, 190)));
      }
      xo.x = Bt * 0.16;
    }
    function ga(e, t, o, l) {
      if (o.top > l + 10 || o.top < -Ht) return;
      ((_.shadowColor = "transparent"), _.clearRect(0, 0, Bt, Ht));
      const a = tt((l - o.top) / (l * 1.1)),
        r = _.createLinearGradient(0, 0, 0, Ht);
      (r.addColorStop(0, `rgba(${Wt},1)`),
        r.addColorStop(0.06, `rgba(${Wt},.8)`),
        r.addColorStop(0.3, `rgba(${Wt},.18)`),
        r.addColorStop(1, `rgba(${Wt},0)`),
        (_.fillStyle = r),
        _.fillRect(0, 0, Bt, Ht),
        (_.fillStyle = `rgb(${Wt})`),
        (_.shadowColor = "transparent"),
        (_.shadowBlur = 10),
        (_.shadowOffsetY = 4));
      const d = (s) => 5 + 3 * Math.sin(s * 0.013 + e * 0.35) + 2 * Math.sin(s * 0.041 - e * 0.2);
      (_.beginPath(), _.moveTo(0, 0));
      for (let s = 0; s <= Bt + 12; s += 12) _.lineTo(s, d(s));
      (_.lineTo(Bt, 0), _.closePath(), _.fill());
      for (const s of Ve) {
        const p = s.max * (0.12 + 1.1 * a);
        ((s.len += (p - s.len) * Math.min(1, t * 0.55 * s.sp) + Math.sin(e * 1.3 + s.ph) * 0.12),
          s.len > s.max * 1.02 &&
            Math.random() < t * (s.mud ? 0.25 : 0.9) &&
            (s.drops.push({ y: d(s.x) + s.len, vy: s.mud ? 12 : 34, r: s.w * (s.mud ? 0.4 : 0.32) }),
            (s.len *= c(0.35, 0.6))),
          (_.shadowColor = "rgba(0,0,0,.45)"));
        const f = d(s.x),
          i = Math.max(2, s.len),
          y = s.w,
          v = s.x,
          M = y * (s.mud ? 0.3 + 0.12 * Math.min(1, 30 / i) : 0.1 + 0.1 * Math.min(1, 30 / i)),
          n = y * (s.mud ? 0.5 : 0.4),
          u = M * s.nk,
          P = M / s.nk,
          T = v + s.sk * y * 0.5 * Math.min(1, i / 40),
          k = s.mud ? Math.sin(e * 0.7 + s.ph) * y * 0.05 : 0;
        if (
          (_.beginPath(),
          _.moveTo(v - y * (1.1 + s.sk * 0.3), f - 1),
          _.bezierCurveTo(v - y * 0.55, f, v - u, f + i * 0.25, v - u + k, f + i * 0.6),
          _.bezierCurveTo(v - u, f + i * 0.8, T - n, f + i * 0.85, T - n, f + i),
          s.mud)
        )
          for (let m = 1; m <= 5; m++) {
            const h = Math.PI + (m / 5) * Math.PI,
              S = n * (1 + s.lumps[m - 1]);
            _.lineTo(T + Math.cos(Math.PI - (h - Math.PI)) * S * -1, f + i + Math.sin(h - Math.PI) * S * 0.9);
          }
        else _.arc(T, f + i, n, Math.PI, 0, !0);
        (_.bezierCurveTo(T + n, f + i * 0.85, v + P, f + i * 0.8, v + P - k, f + i * 0.6),
          _.bezierCurveTo(v + P, f + i * 0.25, v + y * 0.55, f, v + y * (1.1 - s.sk * 0.3), f - 1),
          _.closePath(),
          _.fill(),
          s.mud &&
            (_.save(), (_.shadowColor = "transparent"), (_.fillStyle = "rgba(0,0,0,.14)"), _.fill(), _.restore()),
          _.save(),
          (_.shadowColor = "transparent"),
          (_.strokeStyle = `rgba(190,170,255,${s.mud ? 0.08 : 0.18})`),
          (_.lineWidth = 1),
          _.beginPath(),
          _.arc(T, f + i, n, Math.PI * 0.15, Math.PI * 0.85),
          _.stroke(),
          s.mud ||
            ((_.fillStyle = "rgba(255,255,255,.13)"),
            _.beginPath(),
            _.ellipse(T - n * 0.35, f + i - n * 0.2, n * 0.2, n * 0.32, -0.3, 0, E),
            _.fill()),
          _.restore(),
          (_.fillStyle = `rgb(${Wt})`));
        for (let m = s.drops.length - 1; m >= 0; m--) {
          const h = s.drops[m];
          if (((h.vy += 420 * t), (h.y += h.vy * t), h.y > Ht)) {
            s.drops.splice(m, 1);
            continue;
          }
          ((_.shadowColor = "transparent"),
            (_.globalAlpha = 1 - h.y / Ht),
            _.beginPath(),
            _.ellipse(v, h.y, h.r * 0.85, h.r * (1 + Math.min(0.6, h.vy / 900)), 0, 0, E),
            _.fill(),
            (_.globalAlpha = 1));
        }
      }
    }
    const kt = document.createElement("canvas");
    ((kt.className = "es__hole"),
      kt.setAttribute("aria-hidden", "true"),
      (kt.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2"));
    const jt = document.createElement("div");
    ((jt.className = "es__dusk"),
      jt.setAttribute("aria-hidden", "true"),
      (jt.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:2;opacity:0"));
    const wo = X.querySelector(".es__grade");
    wo ? wo.before(jt, kt) : ra.append(jt, kt);
    const x = kt.getContext("2d");
    let ie = 0,
      re = 0;
    function pa(e, t) {
      const o = Math.min(devicePixelRatio || 1, 1.5);
      ((ie = kt.clientWidth),
        (re = kt.clientHeight),
        (kt.width = ie * o),
        (kt.height = re * o),
        x.setTransform(o, 0, 0, o, 0, 0));
      const l = t || e;
      jt.style.background = `radial-gradient(circle at 50% 50%, rgba(52,48,62,.9) 0, rgba(36,40,51,.96) 26%, rgba(36,40,51,0) 64%),
      linear-gradient(to bottom, rgb(${e}) 0%, rgba(${e},.0) 40%, rgba(${l},.0) 60%, rgb(${l}) 100%), #242833`;
    }
    const vo = [
        [
          "Wissen",
          (e, t) => {
            (e.moveTo(0, -t * 0.5),
              e.quadraticCurveTo(-t * 0.5, -t * 0.8, -t, -t * 0.5),
              e.lineTo(-t, t * 0.55),
              e.quadraticCurveTo(-t * 0.5, t * 0.25, 0, t * 0.55),
              e.quadraticCurveTo(t * 0.5, t * 0.25, t, t * 0.55),
              e.lineTo(t, -t * 0.5),
              e.quadraticCurveTo(t * 0.5, -t * 0.8, 0, -t * 0.5),
              e.lineTo(0, t * 0.55));
          },
        ],
        [
          "Erfahrung",
          (e, t) => {
            for (let o = 0; o < 12; o += 0.3) {
              const l = (t * o) / 12;
              e.lineTo(Math.cos(o) * l, Math.sin(o) * l);
            }
          },
        ],
        [
          "Emotionen",
          (e, t) => {
            e.moveTo(-t, 0);
            for (let o = -t; o <= t; o += t / 8) e.lineTo(o, Math.sin((o / t) * 6.3) * t * 0.35);
          },
        ],
        [
          "Liebe",
          (e, t) => {
            (e.moveTo(0, t * 0.8),
              e.bezierCurveTo(-t * 1.3, -t * 0.1, -t * 0.6, -t * 1.1, 0, -t * 0.35),
              e.bezierCurveTo(t * 0.6, -t * 1.1, t * 1.3, -t * 0.1, 0, t * 0.8));
          },
        ],
        [
          "\xC4ngste",
          (e, t) => {
            e.moveTo(-t, 0);
            for (let o = 1; o <= 8; o++) e.lineTo(-t + (o * t) / 4, (o % 2 ? -1 : 1) * t * 0.45);
            (e.moveTo(t * 1.1, 0), e.arc(0, 0, t * 1.1, 0, E));
          },
        ],
        [
          "Gemeinschaft",
          (e, t) => {
            for (const [o, l] of [
              [0, -0.55],
              [-0.55, 0.4],
              [0.55, 0.4],
            ])
              (e.moveTo(o * t + t * 0.38, l * t), e.arc(o * t, l * t, t * 0.38, 0, E));
          },
        ],
        [
          "Babys",
          (e, t) => {
            (e.moveTo(t * 0.35, -t * 0.3),
              e.arc(0, -t * 0.3, t * 0.35, 0, E),
              e.moveTo(t * 0.55, 0),
              e.arc(0, t * 0.1, t * 0.55, -0.3, Math.PI + 0.9));
          },
        ],
        [
          "G\xF6tter",
          (e, t) => {
            for (const [o, l] of [
              [-0.6, 0.2],
              [0.6, 0.2],
              [0, -0.5],
            ])
              for (let a = 0; a < 4; a++) {
                const r = (a * Math.PI) / 4;
                (e.moveTo(o * t - Math.cos(r) * t * 0.32, l * t - Math.sin(r) * t * 0.32),
                  e.lineTo(o * t + Math.cos(r) * t * 0.32, l * t + Math.sin(r) * t * 0.32));
              }
          },
        ],
        [
          "Gott",
          (e, t) => {
            (e.moveTo(0, -t),
              e.lineTo(t * 0.95, t * 0.65),
              e.lineTo(-t * 0.95, t * 0.65),
              e.closePath(),
              e.moveTo(t * 0.16, t * 0.12),
              e.arc(0, t * 0.12, t * 0.16, 0, E));
          },
        ],
      ],
      ua = (e, t) => {
        (e.moveTo(t, 0), e.arc(0, 0, t, 0, E), e.moveTo(t * 0.22, 0), e.arc(0, 0, t * 0.22, 0, E));
      },
      ee = [],
      Te = [];
    let So = 0,
      ya = 0,
      Vt = 0,
      Co = 0;
    function Po(e, t, o, l, a, r, d) {
      (x.save(),
        x.translate(t, o),
        x.rotate(r),
        (x.globalAlpha = a),
        (x.strokeStyle = "rgba(236,228,255,1)"),
        (x.lineWidth = Math.max(0.7, l * 0.07)),
        (x.lineJoin = x.lineCap = "round"),
        x.beginPath(),
        e(x, l),
        x.stroke(),
        d &&
          l > 9 &&
          (x.rotate(-r),
          (x.globalAlpha = a * 0.7),
          (x.fillStyle = "rgba(236,228,255,1)"),
          (x.font = `300 ${Math.round(l * 0.55)}px system-ui, sans-serif`),
          (x.textAlign = "center"),
          x.fillText(d, 0, l * 1.75)),
        x.restore());
    }
    function ma(e, t, o, l, a) {
      const r = [[e, t]],
        d = 9;
      for (let s = 1; s < d; s++) {
        const p = s / d;
        r.push([L(e, o, p) + c(-a, a), L(t, l, p) + c(-a, a)]);
      }
      return (r.push([o, l]), r);
    }
    let ce = null;
    function ba() {
      const t = document.createElement("canvas");
      t.width = t.height = 256;
      const o = t.getContext("2d"),
        l = 256 / 2,
        a = o.createRadialGradient(l, l, l * 0.3, l, l, l);
      (a.addColorStop(0, "rgba(255,250,236,0)"),
        a.addColorStop(0.06, "rgba(255,244,214,.95)"),
        a.addColorStop(0.22, "rgba(255,214,150,.75)"),
        a.addColorStop(0.5, "rgba(232,140,70,.42)"),
        a.addColorStop(0.78, "rgba(150,60,30,.16)"),
        a.addColorStop(1, "rgba(90,30,20,0)"),
        (o.fillStyle = a),
        o.beginPath(),
        o.arc(l, l, l, 0, E),
        o.arc(l, l, l * 0.3, 0, E, !0),
        o.fill("evenodd"));
      for (let r = 0; r < 260; r++) {
        const d = l * (0.32 + 0.66 * Math.pow(Math.random(), 1.6)),
          s = Math.random() * E,
          p = 0.25 + Math.random() * 1.1,
          f = 1 - (d / l - 0.3) / 0.7;
        ((o.strokeStyle = `rgba(255,${(190 + 55 * f) | 0},${(120 + 110 * f) | 0},${(0.05 + 0.16 * Math.random()) * (0.4 + f)})`),
          (o.lineWidth = 0.5 + Math.random() * 1.6 * (1 - f * 0.5)),
          o.beginPath(),
          o.arc(l, l, d, s, s + p),
          o.stroke());
      }
      return t;
    }
    let vx = null;
    function mkVortex() {
      const N2 = 512,
        cv = document.createElement("canvas");
      cv.width = cv.height = N2;
      const g2 = cv.getContext("2d"),
        h = N2 / 2,
        arms = 3;
      g2.globalCompositeOperation = "lighter";
      for (let a2 = 0; a2 < arms; a2++)
        for (let i = 0; i < 900; i++) {
          const t2 = Math.random(),
            th = (a2 * E) / arms + t2 * E * 2.3 + c(-0.28, 0.28) * (1 - t2 * 0.6),
            rr = h * (0.15 + 0.83 * Math.pow(t2, 1.1)),
            x0 = h + Math.cos(th) * rr,
            y0 = h + Math.sin(th) * rr,
            sz = h * (0.012 + 0.055 * t2) * c(0.6, 1.4),
            kk = 1 - t2,
            col =
              kk > 0.78 ? "255,242,220" : kk > 0.55 ? "255,198,122" : kk > 0.35 ? "222,126,196" : t2 < 0.86 ? "126,96,226" : "70,176,196",
            gr = g2.createRadialGradient(x0, y0, 0, x0, y0, sz);
          (gr.addColorStop(0, `rgba(${col},${0.1 + 0.14 * kk})`),
            gr.addColorStop(1, `rgba(${col},0)`),
            (g2.fillStyle = gr),
            g2.beginPath(),
            g2.arc(x0, y0, sz, 0, E),
            g2.fill());
        }
      g2.globalCompositeOperation = "destination-out";
      for (let a2 = 0; a2 < arms; a2++)
        for (let i = 0; i < 280; i++) {
          const t2 = Math.random(),
            th = (a2 * E) / arms + 0.55 + t2 * E * 2.3,
            rr = h * (0.24 + 0.72 * t2);
          ((g2.fillStyle = "rgba(0,0,0,.2)"),
            g2.beginPath(),
            g2.arc(h + Math.cos(th) * rr, h + Math.sin(th) * rr, h * 0.022 * c(0.6, 1.6), 0, E),
            g2.fill());
        }
      g2.globalCompositeOperation = "destination-in";
      const fd = g2.createRadialGradient(h, h, h * 0.08, h, h, h);
      return (
        fd.addColorStop(0, "rgba(0,0,0,1)"),
        fd.addColorStop(0.7, "rgba(0,0,0,.8)"),
        fd.addColorStop(1, "rgba(0,0,0,0)"),
        (g2.fillStyle = fd),
        g2.fillRect(0, 0, N2, N2),
        cv
      );
    }
    function Ma(e, t, o, l, a) {
      x.clearRect(0, 0, ie, re);
      const r = ie,
        d = re,
        s = Math.min(r, d) * (r < 700 ? 0.085 : 0.075),
        p = r * (r < 700 ? 0.16 : 0.11),
        f = d * 0.83,
        i = r / 2,
        y = d / 2,
        v = tt((l - 0.45) / 0.55) * 0.72 + B(o, [0, Z.hole[0]]) * 0.28;
      if (v > 0 && v < 1) {
        const R = v * v,
          A = L(xo.x || r * 0.16, p, et(v)),
          G = L(18, f, R),
          j = 1 + Math.min(0.9, v * 1.6),
          O = 9;
        (x.save(),
          x.translate(A, G),
          (x.fillStyle = `rgb(${Wt})`),
          (x.shadowColor = "rgba(120,90,200,.45)"),
          (x.shadowBlur = 12),
          x.beginPath(),
          x.moveTo(0, -O * 2.2 * j),
          x.bezierCurveTo(O * 0.9, -O * 0.6, O, O * 0.2, 0, O),
          x.bezierCurveTo(-O, O * 0.2, -O * 0.9, -O * 0.6, 0, -O * 2.2 * j),
          x.fill(),
          (x.shadowBlur = 0),
          (x.fillStyle = "rgba(255,255,255,.16)"),
          x.beginPath(),
          x.ellipse(-O * 0.35, -O * 0.1, O * 0.18, O * 0.35, -0.3, 0, E),
          x.fill(),
          x.restore());
      }
      const M = et(B(o, Z.hole)),
        n = et(B(o, Z.mist)),
        u = B(o, [Z.cta[0] + 0.02, Z.cta[1]]),
        P = B(o, [Z.cta[1], Z.dusk[0] + 0.02]);
      if (M <= 0) {
        ee.length = 0;
        return;
      }
      (M > 0 && Co === 0 && (Vt = 1), (Co = e));
      const T = L(p, i, n),
        k = L(f, y, n),
        m = s * M * (1 - n * 0.3);
      if (
        ((Vt = Math.max(0, Vt - t * 1.4)),
        Vt > 0 &&
          ((x.strokeStyle = `rgba(255,226,180,${Vt * 0.28})`),
          (x.lineWidth = 1),
          x.beginPath(),
          x.ellipse(p, f, s * (3 - Vt * 2), s * (1.2 - Vt * 0.8), 0, 0, E),
          x.stroke()),
        o > Z.hole[1] * 0.7 && n < 0.3 && e > So && ee.length < 14)
      ) {
        So = e + c(0.35, 0.8);
        const [R, A] = vo[ya++ % vo.length];
        let G = 0,
          j = 0;
        for (
          let O = 0;
          O < 12 &&
          ((G = c(r * 0.02, r * 0.48)), (j = c(d * 0.52, d * 0.97)), !(Math.hypot(G - T, (j - k) / 0.82) > s * 2.6));
          O++
        );
        ee.push({
          label: R,
          fn: A,
          ang: Math.atan2((j - k) / 0.82, G - T),
          d: Math.hypot(G - T, (j - k) / 0.82),
          rot: c(-1, 1),
          vr: c(-0.8, 0.8),
          life: 0,
        });
      }
      for (let R = ee.length - 1; R >= 0; R--) {
        const A = ee[R];
        ((A.life += t),
          (A.d -= t * (40 + 9e3 / (A.d + 60))),
          (A.ang += t * (0.25 + 90 / (A.d + 40))),
          (A.rot += A.vr * t));
        const G = tt(A.d / (s * 7), 0.05, 1),
          j = T + Math.cos(A.ang) * A.d,
          O = k + Math.sin(A.ang) * A.d * 0.82;
        if (A.d < m * 0.35 || n > 0.6) {
          ee.splice(R, 1);
          continue;
        }
        const W = tt((r * 0.5 - j) / 60) * tt((O - d * 0.5) / 60);
        Po(
          A.fn,
          j,
          O,
          6 + 11 * G,
          W * tt(A.life * 1.2) * (0.14 + 0.26 * G) * (1 - n * 1.6),
          A.rot,
          G > 0.45 ? A.label : "",
        );
      }
      const S = (1 - u) * 0.9,
        w = m * 0.3,
        $ = e * 0.32;
      if (w > 0.6 && S > 0) {
        // Schwarzes Loch als Nebel-Strudel: Spiralarme aus Gas ziehen ins Zentrum, Lichtring, gekrümmtes Licht dahinter
        vx || (vx = mkVortex());
        const R = _t.width / Math.max(1, r),
          A = w * 4.2,
          G = S * (1 - et(B(o, Z.light)));
        if (G > 0.01) {
          (x.save(), x.beginPath(), x.arc(T, k, A, 0, E), x.arc(T, k, w * 1.05, 0, E, !0), x.clip("evenodd"));
          const W = x.createRadialGradient(T, k, w, T, k, A);
          (W.addColorStop(0, `rgba(2,2,6,${0.55 * G})`),
            W.addColorStop(1, "rgba(2,2,6,0)"),
            (x.fillStyle = W),
            x.fillRect(T - A, k - A, A * 2, A * 2),
            (x.globalAlpha = 0.6 * G),
            x.translate(T, k),
            x.rotate(0.18 + e * 0.02));
          const Y = A / 1.45;
          try {
            x.drawImage(_t, (T - Y) * R, (k - Y) * R, Y * 2 * R, Y * 2 * R, -A, -A, A * 2, A * 2);
          } catch {}
          x.restore();
        }
        const R1 = w * 5.4;
        (x.save(),
          x.translate(T, k),
          x.scale(1, 0.6),
          (x.globalCompositeOperation = "lighter"),
          x.rotate(-e * 0.34),
          (x.globalAlpha = 0.8 * S),
          x.drawImage(vx, -R1, -R1, R1 * 2, R1 * 2),
          x.rotate(e * 0.13 + 1.3),
          (x.globalAlpha = 0.42 * S),
          x.drawImage(vx, -R1 * 0.7, -R1 * 0.7, R1 * 1.4, R1 * 1.4),
          x.restore());
        const sh = x.createRadialGradient(T, k, w * 0.95, T, k, w * 2.3);
        (sh.addColorStop(0, `rgba(0,0,0,${0.9 * S})`),
          sh.addColorStop(1, "rgba(0,0,0,0)"),
          (x.fillStyle = sh),
          x.beginPath(),
          x.arc(T, k, w * 2.3, 0, E),
          x.fill(),
          x.save(),
          (x.globalCompositeOperation = "lighter"),
          (x.shadowColor = "rgba(255,190,120,.9)"),
          (x.shadowBlur = w * 0.5));
        for (const [rr, al, lw] of [
          [1.34, 0.5, w * 0.16],
          [1.18, 0.85, w * 0.06],
        ])
          ((x.strokeStyle = `rgba(255,214,160,${al * S})`),
            (x.lineWidth = Math.max(0.8, lw)),
            x.beginPath(),
            x.ellipse(T, k - w * 0.06, w * rr, w * rr * 0.9, 0, Math.PI * 1.03, Math.PI * 1.97),
            x.stroke());
        (x.restore(),
          (x.fillStyle = "#000"),
          x.beginPath(),
          x.arc(T, k, w, 0, E),
          x.fill(),
          x.save(),
          (x.strokeStyle = `rgba(255,244,224,${0.95 * S})`),
          (x.lineWidth = Math.max(0.9, w * 0.045)),
          (x.shadowColor = "rgba(255,220,170,1)"),
          (x.shadowBlur = w * 0.35),
          x.beginPath(),
          x.arc(T, k, w * 1.03, 0, E),
          x.stroke(),
          x.restore(),
          x.save(),
          x.beginPath(),
          x.rect(T - R1, k, R1 * 2, R1),
          x.clip(),
          x.translate(T, k),
          x.scale(1, 0.22),
          x.rotate(-e * 0.34),
          (x.globalCompositeOperation = "lighter"),
          (x.globalAlpha = 0.85 * S),
          x.drawImage(vx, -w * 3.2, -w * 3.2, w * 6.4, w * 6.4),
          x.restore(),
          (x.globalCompositeOperation = "lighter"));
        for (let i = 0; i < 24; i++) {
          const ph = (e * 0.2 + i / 24) % 1,
            an = i * 2.39 + ph * E * 1.7 - e * 0.5,
            rr = w * (1.1 + 4.4 * (1 - ph) * (1 - ph)),
            px = T + Math.cos(an) * rr,
            py = k + Math.sin(an) * rr * 0.6,
            zs = 3 + 5 * (1 - ph);
          ((x.globalAlpha = S * Math.sin(Math.PI * ph) * 0.85), x.drawImage(st.hot, px - zs / 2, py - zs / 2, zs, zs));
        }
        ((x.globalAlpha = 1), (x.globalCompositeOperation = "source-over"));
      }
      const F = et(B(o, Z.source));
      if (F > 0 && u < 1) {
        const R = L(p, i, F) + Math.sin(F * Math.PI) * r * 0.08,
          A = L(f, y, F) - Math.sin(F * Math.PI) * d * 0.12,
          G = 1 - u;
        x.save();
        const j = x.createLinearGradient(T, k, R, A);
        (j.addColorStop(0, `rgba(160,120,255,${0.5 * G})`),
          j.addColorStop(1, `rgba(255,226,160,${0.85 * G})`),
          (x.strokeStyle = j),
          (x.lineWidth = 1.4),
          (x.shadowColor = "rgba(255,214,140,.8)"),
          (x.shadowBlur = 10),
          x.beginPath(),
          x.moveTo(T, k),
          x.quadraticCurveTo(L(T, R, 0.5) + r * 0.05, L(k, A, 0.5) - d * 0.14, R, A),
          x.stroke(),
          x.restore(),
          Po(ua, R, A, 14 * (1 - F * 0.4), 0.85 * G, e * 0.5, F < 0.8 ? "die Quelle" : ""));
      }
      const H = n * (1 - u) + u * (1 - u) * 0.6;
      if (H > 0.01 && P < 1)
        for (let R = 0; R < 16; R++) {
          const A = R * 2.4 + e * (0.05 + (R % 3) * 0.02),
            G = s * (1.2 + 3.5 * n + 4 * u) * (0.5 + (R % 5) * 0.18),
            j = T + Math.cos(A) * G,
            O = k + Math.sin(A) * G * 0.7,
            W = s * (1.4 + (R % 4) * 0.5) * (1 + u),
            Y = x.createRadialGradient(j, O, 0, j, O, W),
            dt = R % 3 === 0;
          (Y.addColorStop(0, dt ? `rgba(14,8,26,${0.5 * H})` : `rgba(96,58,168,${0.42 * H})`),
            Y.addColorStop(1, "rgba(96,58,168,0)"),
            (x.fillStyle = Y),
            x.beginPath(),
            x.arc(j, O, W, 0, E),
            x.fill());
        }
      if (u > 0 && u < 1 && Math.random() < t * 9 * Math.sin(Math.PI * u)) {
        const R = Math.min(ie, re) * 0.34,
          A = c(0, E),
          G = A + c(-0.6, 0.6);
        Te.push({
          pts: ma(
            i + Math.cos(A) * R * 0.95,
            y + Math.sin(A) * R * 0.95,
            i + Math.cos(G) * R * c(1.4, 2.1),
            y + Math.sin(G) * R * c(1.4, 2.1),
            R * 0.09,
          ),
          life: 0,
          ttl: c(0.12, 0.26),
        });
      }
      for (let R = Te.length - 1; R >= 0; R--) {
        const A = Te[R];
        if (((A.life += t), A.life > A.ttl)) {
          Te.splice(R, 1);
          continue;
        }
        const G = 1 - A.life / A.ttl;
        (x.save(), (x.shadowColor = "rgba(170,120,255,.95)"), (x.shadowBlur = 14), (x.lineJoin = "round"));
        for (const [j, O] of [
          [3.2, `rgba(150,100,255,${0.45 * G})`],
          [1.1, `rgba(246,236,255,${0.95 * G})`],
        ])
          ((x.strokeStyle = O),
            (x.lineWidth = j),
            x.beginPath(),
            A.pts.forEach(([W, Y], dt) => (dt ? x.lineTo(W, Y) : x.moveTo(W, Y))),
            x.stroke());
        x.restore();
      }
    }
    function gt(e, t) {
      const o = document.createElement("canvas");
      o.width = o.height = e;
      const l = o.getContext("2d"),
        a = e / 2,
        r = l.createRadialGradient(a, a, 0, a, a, a);
      return (t.forEach(([d, s]) => r.addColorStop(d, s)), (l.fillStyle = r), l.fillRect(0, 0, e, e), o);
    }
    const st = {
      star: gt(48, [
        [0, "rgba(255,255,255,1)"],
        [0.18, "rgba(255,250,235,.8)"],
        [0.45, "rgba(200,190,255,.18)"],
        [1, "rgba(255,255,255,0)"],
      ]),
      hot: gt(64, [
        [0, "rgba(255,228,160,.85)"],
        [0.35, "rgba(255,170,70,.45)"],
        [0.75, "rgba(240,100,30,.1)"],
        [1, "rgba(255,120,30,0)"],
      ]),
      warm: gt(64, [
        [0, "rgba(255,160,70,.7)"],
        [0.4, "rgba(235,100,35,.32)"],
        [1, "rgba(200,50,20,0)"],
      ]),
      cool: gt(64, [
        [0, "rgba(210,70,25,.55)"],
        [0.5, "rgba(140,30,15,.2)"],
        [1, "rgba(80,20,10,0)"],
      ]),
      ember: gt(32, [
        [0, "rgba(255,250,220,1)"],
        [0.25, "rgba(255,190,90,.9)"],
        [0.6, "rgba(255,90,30,.25)"],
        [1, "rgba(255,60,20,0)"],
      ]),
      spore: gt(32, [
        [0, "rgba(250,255,220,1)"],
        [0.3, "rgba(214,236,150,.7)"],
        [0.7, "rgba(160,210,110,.15)"],
        [1, "rgba(160,210,110,0)"],
      ]),
      water: gt(64, [
        [0, "rgba(215,245,255,.75)"],
        [0.35, "rgba(110,195,235,.42)"],
        [0.7, "rgba(40,120,190,.12)"],
        [1, "rgba(30,90,160,0)"],
      ]),
      mistW: gt(128, [
        [0, "rgba(170,215,235,.5)"],
        [0.5, "rgba(120,180,215,.18)"],
        [1, "rgba(120,180,215,0)"],
      ]),
      mistF: gt(128, [
        [0, "rgba(235,170,120,.45)"],
        [0.5, "rgba(200,120,90,.15)"],
        [1, "rgba(200,120,90,0)"],
      ]),
      mistP: gt(128, [
        [0, "rgba(170,215,150,.45)"],
        [0.5, "rgba(120,180,120,.15)"],
        [1, "rgba(120,180,120,0)"],
      ]),
      etherV: gt(128, [
        [0, "rgba(150,95,230,.55)"],
        [0.45, "rgba(110,60,190,.2)"],
        [1, "rgba(90,40,170,0)"],
      ]),
      etherG: gt(128, [
        [0, "rgba(80,200,160,.5)"],
        [0.45, "rgba(50,150,130,.18)"],
        [1, "rgba(40,120,110,0)"],
      ]),
      glint: gt(32, [
        [0, "rgba(240,255,255,1)"],
        [0.3, "rgba(170,230,250,.7)"],
        [0.7, "rgba(90,180,230,.15)"],
        [1, "rgba(90,180,230,0)"],
      ]),
    };
    function xa(e, t, o, l, a, r) {
      ((e.globalAlpha = a), e.drawImage(st.star, t - l / 2, o - l / 2, l, l));
    }
    const Ue = [
      { a: -52, img: 0, s: 0.46, at: 0, tilt: -58, flip: 1 },
      { a: -84, img: 2, s: 0.2, at: 0.2, tilt: 70, hang: !0 },
      { a: 12, img: 3, s: 0.3, at: 0.34, tilt: -8, hang: !0 },
      { a: 44, img: 1, s: 0.26, at: 0.5, tilt: 62, flip: -1 },
      { a: -22, img: 5, s: 0.1, at: 0.58, tilt: -30, leaf: !0 },
      { a: 70, img: 4, s: 0.09, at: 0.66, tilt: 25, leaf: !0 },
      { a: -66, img: 6, s: 0.08, at: 0.74, tilt: -10, leaf: !0 },
    ]
      .filter((e) => te[e.img])
      .map((e, t) => {
        const o = document.createElement("div");
        o.className = "es-sprout";
        const l = new Image();
        ((l.alt = ""), (l.decoding = "async"), (l.src = te[e.img]), o.appendChild(l), Mo.appendChild(o));
        const a = e.leaf ? 0.46 : 0.41;
        return (
          (o.style.left = 50 + Math.cos(e.a * Et) * a * 100 + "%"),
          (o.style.top = 50 + Math.sin(e.a * Et) * a * 100 + "%"),
          (o.style.transform = `rotate(${(e.hang || e.leaf ? e.a - 90 : e.a) + e.tilt}deg)`),
          {
            ...e,
            w: o,
            img: l,
            ph: c(0, E),
            i: t,
            ax: e.hang ? 0.25 : e.leaf ? 0.5 : 0.03,
            ay: e.hang ? 0.02 : e.leaf ? 0.06 : e.img === 0 ? 0.7 : 0.55,
          }
        );
      });
    function To() {
      for (const e of Ue) {
        const t = e.s * bt,
          o = t * (e.img.naturalHeight / (e.img.naturalWidth || 1) || 0.8);
        ((e.pw = t),
          (e.ph2 = o),
          (e.img.style.width = t + "px"),
          (e.img.style.left = -e.ax * t + "px"),
          (e.img.style.top = -e.ay * o + "px"),
          (e.img.style.transformOrigin = `${e.ax * t}px ${e.ay * o}px`));
      }
    }
    Ue.forEach((e) => e.img.addEventListener("load", To));
    let rt = null,
      At = null;
    function ko(e, t) {
      if (!rt || rt.amp < 0.01) return;
      (At || (At = document.createElement("canvas")),
        (At.width !== t.width || At.height !== t.height) && ((At.width = t.width), (At.height = t.height)));
      const o = At.getContext("2d");
      (o.clearRect(0, 0, At.width, At.height), o.drawImage(t, 0, 0));
      const { x: l, y: a, r, w: d, amp: s } = rt;
      for (const [p, f, i] of [
        [r - d, r + d, 0.045],
        [r - d * 0.45, r + d * 0.45, 0.03],
      ]) {
        if (f <= 0) continue;
        (e.save(),
          e.beginPath(),
          e.arc(l, a, f, 0, E),
          e.arc(l, a, Math.max(0, p), 0, E, !0),
          e.clip(),
          e.clearRect(0, 0, Q, nt));
        const y = 1 + i * s;
        (e.translate(l, a), e.scale(y, y), e.translate(-l, -a), e.drawImage(At, 0, 0, Q, nt), e.restore());
      }
    }
    const ke = document.createElement("canvas");
    ((ke.className = "es__code"), X.querySelector(".es__stars").after(ke));
    const oe = ke.getContext("2d"),
      ae = [];
    let Ao = 4;
    const $o = "0101100110100111010",
      _t = X.querySelector(".es__stars"),
      q = _t.getContext("2d"),
      Ze = X.querySelector(".es__life"),
      g = Ze.getContext("2d");
    let Q = 0,
      nt = 0,
      he = [];
    function wa() {
      const e = Math.min(devicePixelRatio || 1, 1.5);
      ((Q = _t.clientWidth), (nt = _t.clientHeight));
      for (const [t, o] of [
        [_t, q],
        [ke, oe],
        [Ze, g],
      ])
        ((t.width = Q * e), (t.height = nt * e), o.setTransform(e, 0, 0, e, 0, 0));
      he = Array.from({ length: Math.min(520, Math.round((Q * nt) / 3400)) }, () => ({
        x: Math.random(),
        y: Math.random(),
        s: Math.pow(Math.random(), 3) * 1.8 + 0.3,
        a: 0.2 + Math.random() * 0.7,
        tw: c(0.4, 2),
        ph: c(0, 6.28),
        z: c(0.2, 1),
      }));
    }
    function va(e, t) {
      const o = et(B(e, Z.stars));
      (q.clearRect(0, 0, Q, nt), (q.globalCompositeOperation = "lighter"));
      for (const l of he) {
        const a = 0.6 + 0.4 * Math.sin(t * l.tw + l.ph),
          r = 1 + He * 0.22 * l.z;
        let d = Q / 2 + (((l.x + t * 0.002 * l.z) % 1) * Q - Q / 2) * r,
          s = nt / 2 + (((((l.y - e * 0.25 * l.z) % 1) + 1) % 1) * nt - nt / 2) * r,
          p = l.s * (5 + o * 4 * Ct) * (1 + He * 0.3 * l.z);
        if (rt && rt.amp > 0.01) {
          const f = d - rt.x,
            i = s - rt.y,
            y = Math.hypot(f, i) || 1,
            v = Math.exp(-(((y - rt.r) / rt.w) ** 2)) * rt.amp;
          v > 0.01 && ((d += (f / y) * v * 9), (s += (i / y) * v * 9), (p *= 1 + v * 1.2));
        }
        ((q.globalAlpha = tt(l.a * a * (1 + o * 1.3 * Ct))),
          q.drawImage(st.star, d - p / 2, s - p / 2, p, p),
          (l.sx = d),
          (l.sy = s),
          (l.ss = p));
      }
      ((q.globalAlpha = 1), (q.globalCompositeOperation = "source-over"));
    }
    const Je = [0.1, 0.34];
    let Xe = null;
    function Sa() {
      const t = document.createElement("canvas");
      t.width = t.height = 256;
      const o = t.getContext("2d"),
        l = 256 / 2;
      (o.save(), o.beginPath(), o.arc(l, l, l - 1, 0, E), o.clip());
      let a = o.createRadialGradient(l * 0.9, l * 0.85, 0, l, l, l);
      (a.addColorStop(0, "#ecebe4"),
        a.addColorStop(0.7, "#d6d3c8"),
        a.addColorStop(1, "#a9a69c"),
        (o.fillStyle = a),
        o.fillRect(0, 0, 256, 256),
        [
          [0.36, 0.3, 0.16],
          [0.58, 0.32, 0.11],
          [0.68, 0.45, 0.12],
          [0.73, 0.62, 0.09],
          [0.3, 0.52, 0.2],
          [0.22, 0.4, 0.13],
          [0.42, 0.68, 0.1],
          [0.55, 0.52, 0.07],
        ].forEach(([p, f, i]) => {
          for (let y = 0; y < 22; y++) {
            const v = (p + c(-1, 1) * i * 0.8) * 256,
              M = (f + c(-1, 1) * i * 0.7) * 256,
              n = i * 256 * c(0.2, 0.55),
              u = o.createRadialGradient(v, M, 0, v, M, n);
            (u.addColorStop(0, "rgba(100,100,98,.14)"),
              u.addColorStop(0.6, "rgba(108,107,103,.07)"),
              u.addColorStop(1, "rgba(110,108,104,0)"),
              (o.fillStyle = u),
              o.beginPath(),
              o.arc(v, M, n, 0, E),
              o.fill());
          }
        }));
      for (let p = 0; p < 140; p++) {
        const f = c(0, 256),
          i = c(0, 256),
          y = Math.pow(Math.random(), 3) * 8 + 0.8;
        ((o.fillStyle = "rgba(80,78,74,.12)"),
          o.beginPath(),
          o.arc(f, i, y, 0, E),
          o.fill(),
          (o.strokeStyle = "rgba(255,255,250,.16)"),
          (o.lineWidth = 0.7),
          o.beginPath(),
          o.arc(f - y * 0.12, i - y * 0.12, y, Math.PI * 0.9, Math.PI * 1.9),
          o.stroke());
      }
      const r = 256 * 0.47,
        d = 256 * 0.82;
      for (let p = 0; p < 14; p++) {
        const f = c(0, E),
          i = c(0.2, 0.55) * 256;
        ((o.strokeStyle = "rgba(255,255,250,.07)"),
          (o.lineWidth = c(1, 2.5)),
          o.beginPath(),
          o.moveTo(r, d),
          o.lineTo(r + Math.cos(f) * i, d + Math.sin(f) * i),
          o.stroke());
      }
      ((o.fillStyle = "rgba(255,255,250,.55)"), o.beginPath(), o.arc(r, d, 3.2, 0, E), o.fill());
      for (let p = 0; p < 1600; p++)
        ((o.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,250" : "60,58,55"},${c(0.03, 0.09)})`),
          o.fillRect(c(0, 256), c(0, 256), 1.2, 1.2));
      ((o.globalCompositeOperation = "multiply"),
        (o.fillStyle = "#6fc9cf"),
        o.fillRect(0, 0, 256, 256),
        (o.globalCompositeOperation = "screen"));
      const s = o.createRadialGradient(l * 0.8, l * 0.75, 0, l, l, l);
      return (
        s.addColorStop(0, "rgba(170,240,235,.35)"),
        s.addColorStop(1, "rgba(30,110,140,.1)"),
        (o.fillStyle = s),
        o.fillRect(0, 0, 256, 256),
        (o.globalCompositeOperation = "source-over"),
        o.restore(),
        t
      );
    }
    const Ca = gt(128, [
      [0, "rgba(110,225,215,.42)"],
      [0.3, "rgba(60,170,190,.16)"],
      [0.65, "rgba(40,110,160,.05)"],
      [1, "rgba(40,110,160,0)"],
    ]);
    function Pa(e, t) {
      const o = (e - Je[0]) / (Je[1] - Je[0]);
      if (o <= 0 || o >= 1 || t > 0.3) return;
      Xe || (Xe = Sa());
      const l = et(o),
        a = bt * 0.42 * (1 + He * 0.08),
        r = a / 2,
        d = L(Q * 0.1, Q * 0.9, l),
        s = nt * 0.3 - Math.sin(Math.PI * l) * nt * 0.14,
        p = Math.min(1, o * 6, (1 - o) * 6) * (1 - t * 3),
        f = L(0.27, 0.73, o),
        i = 1 - Math.abs(f - 0.5) * 2;
      ((q.globalCompositeOperation = "lighter"),
        (q.globalAlpha = p * (0.35 + 0.65 * i)),
        q.drawImage(Ca, d - a * 2, s - a * 2, a * 4, a * 4),
        (q.globalCompositeOperation = "source-over"),
        (q.globalAlpha = p * 0.92),
        q.drawImage(Xe, d - r, s - r, a, a));
      const y = f < 0.5 ? f : 1 - f,
        v = r * Math.cos(E * y);
      (Math.abs(y - 0.5) > 0.004 &&
        (q.save(),
        q.translate(d, s),
        f > 0.5 && q.scale(-1, 1),
        q.beginPath(),
        q.moveTo(0, -r),
        q.arc(0, 0, r + 0.5, -Math.PI / 2, Math.PI / 2, !0),
        q.ellipse(0, 0, Math.abs(v), r + 0.5, 0, Math.PI / 2, -Math.PI / 2, v > 0),
        q.closePath(),
        (q.globalAlpha = p * 0.86),
        (q.fillStyle = "rgb(7,22,30)"),
        q.fill(),
        q.restore()),
        (q.globalAlpha = 1));
    }
    let Ut = null;
    function Ta() {
      const l = document.createElement("canvas");
      ((l.width = 30 * 4), (l.height = 14 * 4));
      const a = l.getContext("2d");
      a.scale(4, 4);
      const r = 30 / 2,
        d = 14 / 2;
      for (const f of [-1, 1]) {
        const i = f < 0 ? 1 : r + 4.5,
          y = r - 5.5;
        ((a.fillStyle = "#1d2c4a"),
          a.fillRect(i, d - 3, y, 6),
          (a.strokeStyle = "rgba(140,180,230,.55)"),
          (a.lineWidth = 0.25));
        for (let v = 1; v < 5; v++)
          (a.beginPath(), a.moveTo(i + (y * v) / 5, d - 3), a.lineTo(i + (y * v) / 5, d + 3), a.stroke());
        (a.beginPath(),
          a.moveTo(i, d),
          a.lineTo(i + y, d),
          a.stroke(),
          (a.strokeStyle = "rgba(200,210,230,.7)"),
          (a.lineWidth = 0.4),
          a.strokeRect(i, d - 3, y, 6),
          (a.fillStyle = "#9aa0a8"),
          a.fillRect(f < 0 ? i + y : r + 3.2, d - 0.3, 1.3, 0.6));
      }
      const s = a.createLinearGradient(r - 3, d - 3, r + 3, d + 3);
      (s.addColorStop(0, "#f2d58a"),
        s.addColorStop(0.5, "#b8862f"),
        s.addColorStop(1, "#6e4f1c"),
        (a.fillStyle = s),
        a.beginPath(),
        a.roundRect ? a.roundRect(r - 3.2, d - 3.6, 6.4, 7.2, 1) : a.rect(r - 3.2, d - 3.6, 6.4, 7.2),
        a.fill(),
        (a.strokeStyle = "#c9ced6"),
        (a.lineWidth = 0.35),
        a.beginPath(),
        a.moveTo(r, d - 3.6),
        a.lineTo(r + 1.2, d - 6),
        a.stroke());
      const p = a.createRadialGradient(r, d, 0, r, d, 2.2);
      return (
        p.addColorStop(0, "#e6d2ff"),
        p.addColorStop(0.45, "#a46cff"),
        p.addColorStop(1, "#4b1d9a"),
        (a.fillStyle = p),
        a.beginPath(),
        a.arc(r, d, 2.2, 0, E),
        a.fill(),
        (a.fillStyle = "#0b0614"),
        a.beginPath(),
        a.ellipse(r, d, 0.42, 1.75, 0, 0, E),
        a.fill(),
        (a.fillStyle = "rgba(255,255,255,.85)"),
        a.beginPath(),
        a.arc(r - 0.8, d - 0.9, 0.35, 0, E),
        a.fill(),
        { c: l, w: 30, h: 14 }
      );
    }
    const Qe = gt(32, [
      [0, "rgba(200,150,255,.9)"],
      [0.4, "rgba(160,100,255,.3)"],
      [1, "rgba(140,80,255,0)"],
    ]);
    function ka(e, t) {
      const o = B(D, [0.5, 0.66]),
        l = B(D, [0.06, 0.12]) * (1 - B(o, [0.94, 1]));
      if (l <= 0) return;
      Ut || (Ut = Ta());
      const a = 0.5 + D * 1.15 * E + e * 0.015,
        r = t * 1.22,
        d = t * 0.3,
        s = -16 * Et,
        p = Math.cos(a) * r,
        f = Math.sin(a) * d;
      let i = Q / 2 + p * Math.cos(s) - f * Math.sin(s),
        y = nt / 2 + p * Math.sin(s) + f * Math.cos(s),
        v = s + Math.sin(e * 0.4) * 0.08,
        M = 1,
        n = 1;
      if (o > 0) {
        const k = Q * (Q < 700 ? 0.16 : 0.11),
          m = nt * 0.83,
          h = Math.hypot(i - k, (y - m) / 0.82),
          S = Math.atan2((y - m) / 0.82, i - k),
          w = o * o * (3 - 2 * o),
          b = h * Math.pow(1 - w, 1.4),
          C = S + w * E * 1.6;
        ((i = k + Math.cos(C) * b),
          (y = m + Math.sin(C) * b * 0.82),
          (v = C + Math.PI / 2),
          (M = 1 + 3.2 * Math.pow(w, 3)),
          (n = 1 / (1 + 1.4 * Math.pow(w, 3))));
      } else if (Math.hypot(i - Q / 2, y - nt / 2) < t * 1.02) return;
      const u = 0.75 + 0.25 * Math.sin(a),
        P = Math.max(0.55, bt / 270) * u * 0.9 * (1 - o * 0.45);
      ((q.globalAlpha = l),
        q.save(),
        q.translate(i, y),
        q.rotate(v),
        q.scale(M, n),
        q.drawImage(Ut.c, (-Ut.w / 2) * P, (-Ut.h / 2) * P, Ut.w * P, Ut.h * P),
        q.restore(),
        (q.globalCompositeOperation = "lighter"),
        (q.globalAlpha = l * (0.55 + 0.3 * Math.sin(e * 2.3))),
        q.drawImage(Qe, i - 5 * P, y - 5 * P, 10 * P, 10 * P));
      const T = Math.max(0, Math.sin(e * 0.9)) ** 3;
      if (T > 0.05) {
        const k = Q / 2 + Math.sin(e * 1.3) * t * 0.4,
          m = nt / 2 + Math.cos(e * 1.1) * t * 0.4,
          h = q.createLinearGradient(i, y, k, m);
        (h.addColorStop(0, `rgba(190,140,255,${0.35 * T * l})`),
          h.addColorStop(1, "rgba(190,140,255,0)"),
          (q.globalAlpha = 1),
          (q.strokeStyle = h),
          (q.lineWidth = 0.7),
          q.beginPath(),
          q.moveTo(i, y),
          q.lineTo(k, m),
          q.stroke());
      }
      (Math.sin(e * 5) > 0.92 &&
        ((q.globalAlpha = l), (q.fillStyle = "#ff6a6a"), q.fillRect(i + 7 * P, y - 3 * P, 1, 1)),
        (q.globalAlpha = 1),
        (q.globalCompositeOperation = "source-over"));
    }
    const Ae = [];
    let Io = 0,
      Eo = 0;
    function Ro(e, t, o, l, a) {
      let r = [
        [e, t],
        [o, l],
      ];
      for (let d = 0; d < 6; d++) {
        const s = [r[0]];
        for (let p = 1; p < r.length; p++) {
          const f = r[p - 1],
            i = r[p],
            y = i[0] - f[0],
            v = i[1] - f[1],
            M = Math.hypot(y, v) || 1,
            n = c(-1, 1) * a;
          s.push([(f[0] + i[0]) / 2 - (v / M) * n, (f[1] + i[1]) / 2 + (y / M) * n], i);
        }
        ((r = s), (a *= 0.55));
      }
      return r;
    }
    function Wo(e, t, o, l, a, r) {
      const d = Math.hypot(o - e, l - t),
        s = Ro(e, t, o, l, d * 0.22),
        p = [],
        f = a ? Math.floor(c(1, 4)) : Math.random() < 0.4 ? 1 : 0;
      for (let i = 0; i < f; i++) {
        const y = s[Math.floor(c(0.2, 0.7) * s.length)],
          v = Math.atan2(l - t, o - e) + c(-0.9, 0.9),
          M = d * c(0.15, 0.35);
        p.push(Ro(y[0], y[1], y[0] + Math.cos(v) * M, y[1] + Math.sin(v) * M, M * 0.25));
      }
      Ae.push({ main: s, br: p, life: 0, ttl: a ? c(0.28, 0.5) : c(0.12, 0.25), big: a, star: r, seed: c(0, 99) });
    }
    function Aa(e, t, o, l) {
      const a = B(D, [0.12, 0.24]) * (1 - B(D, [0.56, 0.64])) * Ct;
      if (a > 0) {
        const r = ([f, i]) => l(f, i),
          d = () => {
            const f = c(54, 126) * Et,
              i = c(14, 46);
            return r([50 + Math.cos(f) * i, 50 + Math.sin(f) * i]);
          },
          [s, p] = l(50 + c(-2, 2), 67 + c(-2, 2));
        if (e > Eo) {
          const [f, i] = d();
          (Wo(Math.random() < 0.6 ? s : d()[0], Math.random() < 0.6 ? p : d()[1], f, i, !1, null),
            (Eo = e + (Math.random() < 0.3 ? c(0.05, 0.15) : c(0.4, 1.6)) / Math.max(0.3, a)));
        }
        if (e > Io && he.length) {
          const f = Math.atan2(p - nt / 2, s - Q / 2);
          let i = null;
          for (let y = 0; y < 40; y++) {
            const v = he[Math.floor(Math.random() * he.length)];
            if (v.sx == null) continue;
            const M = v.sx - Q / 2,
              n = v.sy - nt / 2,
              u = Math.hypot(M, n);
            let P = Math.abs(Math.atan2(n, M) - f);
            if ((P > Math.PI && (P = E - P), u > o * 1.4 && u < o * 3.4 && P < 0.9 && v !== qo)) {
              i = v;
              break;
            }
          }
          (i && (Wo(s, p, i.sx, i.sy, !0, i), (qo = i)),
            (Io = e + (Math.random() < 0.25 ? c(0.25, 0.6) : c(1.8, 4.5)) / Math.max(0.3, a)));
        }
      }
      ((g.globalCompositeOperation = "lighter"), (g.lineCap = "round"), (g.lineJoin = "round"));
      for (let r = Ae.length - 1; r >= 0; r--) {
        const d = Ae[r];
        if (((d.life += t), d.life > d.ttl)) {
          Ae.splice(r, 1);
          continue;
        }
        const s = d.life / d.ttl,
          p = Math.floor(d.life * 38 + d.seed) % 4 === 1 ? 0.25 : 1,
          f = (1 - s) * p,
          i = (n) => {
            (g.beginPath(), g.moveTo(n[0][0], n[0][1]));
            for (let u = 1; u < n.length; u++) g.lineTo(n[u][0], n[u][1]);
          };
        for (const [n, u, P] of [
          [d.big ? 7 : 4, "150,100,255", 0.14],
          [d.big ? 2.6 : 1.6, "190,150,255", 0.4],
          [d.big ? 1 : 0.7, "245,235,255", 0.95],
        ]) {
          ((g.strokeStyle = `rgba(${u},${P * f})`), (g.lineWidth = n), i(d.main), g.stroke(), (g.lineWidth = n * 0.6));
          for (const T of d.br) (i(T), g.stroke());
        }
        const [y, v] = d.main[0],
          M = d.main[d.main.length - 1];
        if (((g.globalAlpha = f * (d.big ? 0.7 : 0.35)), g.drawImage(Qe, y - 12, v - 12, 24, 24), d.star)) {
          const n = (d.star.ss || 6) * 4;
          ((g.globalAlpha = f),
            g.drawImage(st.star, M[0] - n / 2, M[1] - n / 2, n, n),
            (g.globalAlpha = f * 0.8),
            g.drawImage(Qe, M[0] - n * 0.6, M[1] - n * 0.6, n * 1.2, n * 1.2));
        }
        g.globalAlpha = 1;
      }
      g.globalCompositeOperation = "source-over";
    }
    let qo = null;
    const Ke = [51.5, 24, 6.5];
    let wt = null,
      Fo = !1;
    function $a(e, t, o, l, a, r) {
      if ((!Fo && D > 0.3 && D < 0.5 && ((Fo = !0), (wt = { t0: e, ang: c(-2.4, -1.9) })), !wt)) {
        rt = null;
        return;
      }
      const d = e - wt.t0,
        [s, p] = a(Ke[0], Ke[1]),
        f = (Ke[2] / 100) * r;
      if (((g.globalCompositeOperation = "lighter"), d < 0.8)) {
        const y = et(Math.min(1, d / 0.8)),
          v = l * 1.7,
          M = s + Math.cos(wt.ang) * v * (1 - y),
          n = p + Math.sin(wt.ang) * v * (1 - y),
          u = l * 0.45 * Math.min(1, d * 4),
          P = g.createLinearGradient(M, n, M + Math.cos(wt.ang) * u, n + Math.sin(wt.ang) * u);
        (P.addColorStop(0, "rgba(255,250,235,.9)"),
          P.addColorStop(1, "rgba(170,220,255,0)"),
          (g.strokeStyle = P),
          (g.lineWidth = 1.4 * o),
          (g.lineCap = "round"),
          g.beginPath(),
          g.moveTo(M, n),
          g.lineTo(M + Math.cos(wt.ang) * u, n + Math.sin(wt.ang) * u),
          g.stroke());
        const T = bt * 0.07;
        ((g.globalAlpha = 1), g.drawImage(st.star, M - T / 2, n - T / 2, T, T));
      }
      const i = d - 0.8;
      if (i >= 0) {
        if (!wt.splash) {
          wt.splash = !0;
          for (let M = 0; M < 12; M++) {
            const n = -Math.PI / 2 + c(-0.9, 0.9),
              u = c(25, 60) * o;
            qt.push({
              x: s,
              y: p,
              vx: Math.cos(n) * u,
              vy: Math.sin(n) * u,
              life: 0,
              ttl: c(0.5, 0.9),
              r: c(0.5, 1.2) * o,
              ph: 0,
            });
          }
        }
        for (let M = 0; M < 4; M++) {
          const n = i - M * 0.32;
          if (n < 0 || n > 1.6) continue;
          const u = n / 1.6,
            P = f * (0.1 + 0.95 * Nt(u));
          ((g.globalAlpha = (1 - u) * 0.55),
            (g.strokeStyle = "rgb(200,240,255)"),
            (g.lineWidth = (1.2 - u * 0.7) * o),
            g.beginPath(),
            g.arc(s, p, P, 0, E),
            g.stroke());
        }
        if (i < 0.6) {
          const M = i < 0.08 ? i / 0.08 : Math.pow(1 - (i - 0.08) / 0.52, 2),
            n = l * 1.3 * (0.6 + 0.4 * M);
          ((g.globalAlpha = M), g.drawImage(st.star, s - n / 2, p - n / 2, n, n));
          const u = g.createLinearGradient(s - Q * 0.35, p, s + Q * 0.35, p);
          (u.addColorStop(0, "rgba(180,220,255,0)"),
            u.addColorStop(0.5, `rgba(255,255,255,${0.75 * M})`),
            u.addColorStop(1, "rgba(180,220,255,0)"),
            (g.globalAlpha = 1),
            (g.fillStyle = u),
            g.fillRect(s - Q * 0.35, p - 1, Q * 0.7, 2));
          const P = Q / 2 - s,
            T = nt / 2 - p;
          ([
            [0.6, 14, "150,220,255"],
            [1.25, 22, "190,150,255"],
            [1.7, 9, "255,220,160"],
          ].forEach(([k, m, h]) => {
            ((g.globalAlpha = M * 0.22),
              (g.fillStyle = `rgb(${h})`),
              g.beginPath(),
              g.arc(s + P * k, p + T * k, m * o, 0, E),
              g.fill());
          }),
            (g.globalAlpha = M * 0.07),
            (g.fillStyle = "#fff"),
            g.fillRect(0, 0, Q, nt));
        }
        const y = i - 0.15,
          v = Math.hypot(Q, nt);
        if (y > 0 && y < 3.6) {
          const M = (y / 3.6) * v;
          ((rt = {
            x: s,
            y: p,
            r: M,
            w: 26 + M * 0.05,
            amp: Math.sin(Math.PI * Math.min(1, y / 3.6)) * 0.9 + 0.1 * (1 - y / 3.6),
          }),
            (g.globalAlpha = 0.08 * rt.amp),
            (g.strokeStyle = "rgb(225,240,255)"),
            (g.lineWidth = 1.5),
            g.beginPath(),
            g.arc(s, p, M, 0, E),
            g.stroke(),
            (g.globalAlpha = 0.025 * rt.amp),
            (g.lineWidth = rt.w * 0.8),
            g.beginPath(),
            g.arc(s, p, M, 0, E),
            g.stroke());
        } else rt = null;
        i > 4 && (wt = null);
      }
      ((g.globalAlpha = 1), (g.globalCompositeOperation = "source-over"));
    }
    let ut = null,
      to = !1,
      zo = 0;
    function Ia(e) {
      const t = D > 0.08 && D < 0.6;
      if (!ut && t && ((!to && D > 0.215) || (to && e > zo))) {
        ((to = !0), (zo = e + c(7, 13)));
        const n = Math.random() < 0.5,
          u = nt * c(0.05, 0.2);
        ut = {
          t0: e,
          dur: c(1.6, 2.4),
          x0: Q * (n ? c(0.82, 0.95) : c(0.05, 0.18)),
          y0: u,
          x1: Q * (n ? c(0.38, 0.52) : c(0.48, 0.62)),
          y1: u + nt * c(0.12, 0.24),
        };
      }
      if (!ut) return;
      const o = (e - ut.t0) / ut.dur;
      if (o >= 1) {
        ut = null;
        return;
      }
      const l = Nt(o),
        a = L(ut.x0, ut.x1, l),
        r = L(ut.y0, ut.y1, l),
        d = ut.x1 - ut.x0,
        s = ut.y1 - ut.y0,
        p = Math.hypot(d, s),
        f = d / p,
        i = s / p,
        y = bt * 0.2,
        v = bt * 1.5 * Math.min(1, o * 4) * (1 - o * 0.4),
        M = Math.min(1, o * 8) * (1 - B(o, [0.7, 1]));
      q.globalCompositeOperation = "lighter";
      for (const [n, u] of [
        [y * 0.32, 0.12],
        [y * 0.12, 0.35],
        [2, 0.9],
      ]) {
        const P = q.createLinearGradient(a, r, a - f * v, r - i * v);
        (P.addColorStop(0, `rgba(255,248,230,${u * M})`),
          P.addColorStop(0.3, `rgba(190,200,255,${u * M * 0.5})`),
          P.addColorStop(1, "rgba(160,140,255,0)"),
          (q.strokeStyle = P),
          (q.lineWidth = n),
          (q.lineCap = "round"),
          q.beginPath(),
          q.moveTo(a, r),
          q.lineTo(a - f * v, r - i * v),
          q.stroke());
      }
      ((q.globalAlpha = M),
        q.drawImage(st.star, a - y / 2, r - y / 2, y, y),
        (q.globalAlpha = M * 0.8),
        q.drawImage(st.star, a - y * 0.15, r - y * 0.15, y * 0.3, y * 0.3),
        (q.globalAlpha = 1),
        (q.globalCompositeOperation = "source-over"));
    }
    function Ea(e, t, o) {
      if ((oe.clearRect(0, 0, Q, nt), o <= 0.01)) {
        ae.length = 0;
        return;
      }
      if (e > Ao && ae.length < 2) {
        let l = 0;
        for (
          let a = 0;
          a < 6 && ((l = Math.round((c(0.04, 0.96) * Q) / 16) * 16), !(Math.abs(l - Q / 2) > bt * 1.4));
          a++
        );
        (ae.push({
          x: l,
          y: c(-0.1, 0.4) * nt,
          v: c(18, 34),
          n: Math.floor(c(5, 10)),
          life: 0,
          ttl: c(4, 7),
          seed: Math.floor(c(0, 999)),
        }),
          (Ao = e + c(6, 13)));
      }
      ((oe.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"), (oe.textAlign = "center"));
      for (let l = ae.length - 1; l >= 0; l--) {
        const a = ae[l];
        if (((a.life += t), a.life > a.ttl)) {
          ae.splice(l, 1);
          continue;
        }
        a.y += a.v * t;
        const r = Math.sin((Math.PI * a.life) / a.ttl);
        for (let d = 0; d < a.n; d++) {
          const s = a.y - d * 14,
            p = $o[(a.seed + d * 7 + Math.floor(e * (d === 0 ? 5 : 1) + d)) % $o.length],
            f = o * r * (d === 0 ? 0.3 : 0.13 * (1 - d / a.n));
          ((oe.fillStyle = d === 0 ? `rgba(255,226,160,${f})` : `rgba(140,210,190,${f})`), oe.fillText(p, a.x, s));
        }
      }
    }
    const ne = [
        { a: 160, w: 20, thr: 0 },
        { a: 196, w: 15, thr: 0.15 },
        { a: 228, w: 17, thr: 0.32 },
      ].map((e) => ({ ...e, pts: [], on: !1, until: 0, acc: 0, lvl: 0 })),
      de = [];
    let $e = 0,
      Bo = !1,
      Ho = 0;
    const fe = [
      [
        [50, 70],
        [53, 62],
        [54, 55],
        [50, 49],
        [44, 45],
        [36, 42],
        [30, 37],
        [28, 30],
        [29, 22],
        [30, 14],
        [34, 7],
        [41, 3.5],
        [50, 2.5],
        [60, 3.5],
        [68, 7],
      ],
      [
        [50, 70],
        [54, 60],
        [61, 56],
        [68, 58],
        [74, 63],
        [77, 71],
        [78, 80],
        [75, 88],
        [69, 94],
        [62, 97.5],
      ],
    ].map((e, t) => {
      const o = [0];
      for (let l = 1; l < e.length; l++) o.push(o[l - 1] + Math.hypot(e[l][0] - e[l - 1][0], e[l][1] - e[l - 1][1]));
      return { pts: e, len: o, total: o[o.length - 1], ph1: c(0, E), ph2: c(0, E), bi: t };
    });
    function ge(e, t) {
      let o = 1;
      for (; o < e.len.length - 1 && e.len[o] < t;) o++;
      const l = e.pts[o - 1],
        a = e.pts[o],
        r = tt((t - e.len[o - 1]) / (e.len[o] - e.len[o - 1] || 1));
      return [L(l[0], a[0], r), L(l[1], a[1], r)];
    }
    const _o = (e, t) =>
        0.28 +
        0.5 * Math.pow(0.5 + 0.5 * Math.sin(t * 0.12 + e.ph1), 2) * (0.55 + 0.45 * Math.sin(t * 0.05 + e.ph2)) +
        0.95 * Math.exp(-t / 7) +
        (e.bi === 0 ? 0.5 * Math.exp(-((t - 42) ** 2) / 40) : 0),
      Zt = [],
      qt = [],
      pe = [];
    let Ie = 0,
      eo = 0,
      oo = 0;
    const ue = [];
    let ao = 0;
    const Oo = 520;
    function Jt(e, t) {
      const o = (e + we) * Et;
      return [Q / 2 + Math.cos(o) * t, nt / 2 + Math.sin(o) * t, Math.cos(o), Math.sin(o)];
    }
    function no(e, t, o, l, a, r, d, s) {
      pe.length < 260 &&
        pe.push({ x: e, y: t, vx: o, vy: l, kind: a, life: 0, ttl: r, s: d, star: s, ph: c(0, E), tw: c(2, 5) });
    }
    function Ra(e, t, o, l) {
      const a = B(D, Z.live),
        r = et(B(D, Z.water)),
        d = et(B(D, Z.fire)),
        s = et(B(D, Z.cosmos)),
        p = 1 - s;
      g.clearRect(0, 0, Q, nt);
      const f = 0.03 + 0.97 * et(B(D, [Z.fire[0] + 0.06, Z.fire[0] + 0.46])),
        i = et(B(D, [0.3, 0.58])) * p,
        y = et(B(D, [Z.fire[0], Z.fire[0] + 0.2])) * p,
        v = l / 0.47,
        M = (m, h) => {
          const S = we * Et,
            w = (m / 100 - 0.5) * v,
            b = (h / 100 - 0.5) * v;
          return [Q / 2 + w * Math.cos(S) - b * Math.sin(S), nt / 2 + w * Math.sin(S) + b * Math.cos(S)];
        };
      if (((g.globalCompositeOperation = "lighter"), y > 0.01)) {
        for (const h of fe) {
          const S = h.total * f;
          for (let w = 0; w < S; w += 3.2) {
            const [b, C] = M(...ge(h, w)),
              $ = _o(h, w),
              F = 0.7 + 0.3 * Math.sin(e * 3.3 + w * 0.7) * Math.sin(e * 1.7 + w * 0.3),
              H = (6 + 7 * $) * o;
            ((g.globalAlpha = 0.3 * y * F * Math.min(1, (S - w) / 4 + 0.3)),
              g.drawImage(st.warm, b - H, C - H, H * 2, H * 2));
          }
        }
        Ie += 120 * y * Ct * t;
        let m = 0;
        for (; Ie > 1 && Zt.length < Oo && m++ < 400;) {
          const h = fe[Math.random() < 0.55 ? 0 : 1],
            S = h.total * f;
          if (S < 0.5) {
            Ie = 0;
            break;
          }
          const w = Math.random() * S,
            b = _o(h, w) * (S - w < 6 ? 1.25 : 1);
          if (Math.random() > b / 1.9) continue;
          Ie--;
          const [C, $] = M(...ge(h, w));
          Zt.push({
            x: C + c(-2, 2) * o,
            y: $ + c(-2, 2) * o,
            vx: c(-4, 4) * o,
            vy: -c(18, 32) * o * (0.6 + 0.5 * b),
            life: 0,
            ttl: c(0.7, 1.2) * (0.6 + 0.6 * b),
            r: c(5.5, 10) * o * (0.6 + 0.6 * b),
            ph: c(0, E),
            wisp: !1,
          });
        }
        for (eo += 9 * i * Ct * t; eo > 1 && Zt.length < Oo;) {
          eo--;
          const h = Pt(fe),
            S = h.total * c(0.62, 1) * f,
            [w, b] = ge(h, S),
            [C, $] = M(w, b),
            F = C - Q / 2,
            H = $ - nt / 2,
            R = Math.hypot(F, H) || 1,
            A = c(14, 26) * o;
          (Zt.push({
            x: C,
            y: $,
            vx: (F / R) * A + c(-4, 4) * o,
            vy: (H / R) * A - c(10, 20) * o,
            life: 0,
            ttl: c(1.8, 3),
            r: c(9, 16) * o,
            ph: c(0, E),
            wisp: !0,
          }),
            Math.random() < 0.35 &&
              no(C, $, (F / R) * A * 0.8, (H / R) * A * 0.8 - 8 * o, "ember", c(5, 8), c(3.5, 6) * o, c(0.3, 0.5)));
        }
      }
      for (let m = Zt.length - 1; m >= 0; m--) {
        const h = Zt[m];
        if (((h.life += t), h.life > h.ttl)) {
          Zt.splice(m, 1);
          continue;
        }
        const S = h.life / h.ttl;
        ((h.vx += Math.sin(e * 2.6 + h.ph + h.life * 3) * (h.wisp ? 6 : 18) * o * t),
          (h.vy -= (h.wisp ? 3 : 10) * o * t),
          (h.x += h.vx * t),
          (h.y += h.vy * t));
        const w = h.wisp ? h.r * (0.6 + 0.8 * Math.sin(Math.PI * S)) : h.r * (1 - S * 0.7);
        ((g.globalAlpha = h.wisp
          ? Math.sin(Math.PI * S) * 0.2
          : Math.sin(Math.PI * Math.min(1, S * 1.25 + 0.1)) * 0.55),
          g.save(),
          g.translate(h.x, h.y),
          g.scale(0.72, 1.55),
          g.drawImage(
            h.wisp ? (S < 0.4 ? st.warm : st.cool) : S < 0.32 ? st.hot : S < 0.66 ? st.warm : st.cool,
            -w,
            -w,
            w * 2,
            w * 2,
          ),
          g.restore());
      }
      const n = 70 * o,
        u = ne.filter((m) => m.on).length;
      for (const m of ne) {
        const h = r > m.thr && p > 0.05;
        (m.temp
          ? e > m.until && (m.on = !1)
          : e > m.until &&
            ((m.on = h && (m.on ? Math.random() < 0.25 : u < 1 && Math.random() < 0.4)),
            (m.until = e + (m.on ? c(0.5, 1.1) : c(2, 5))),
            m.on && (m.wCur = m.w * (Math.random() < 0.35 ? c(1.4, 1.8) : c(0.85, 1.15)))),
          (m.lvl += ((m.on ? 1 : 0) * Math.min(1, r * 1.4) * p - m.lvl) * Math.min(1, t * 1.6)));
        const [, , S, w] = Jt(m.a, l),
          b = Math.abs(S) > 0.5 || w > 0.3;
        if ((!b && !m.temp && (m.on = !1), m.lvl > 0.03 && b))
          for (m.acc += 60 * t; m.acc > 1;) {
            m.acc--;
            const [I, U, J, ot] = Jt(m.a, l * 0.96),
              Yt = -ot,
              Se = J,
              Ce = (19 + 3 * Math.sin(e * 1.7 + m.a)) * o;
            m.pts.push({
              x: I,
              y: U,
              vx: J * Ce + Yt * 6 * o,
              vy: ot * Ce + Se * 6 * o,
              life: 0,
              w: (m.wCur || m.w) * o * m.lvl,
              ph: c(0, E),
              brk: c(2.2, 3.2),
            });
          }
        const C = m.pts;
        for (let I = C.length - 1; I >= 0; I--) {
          const U = C[I];
          ((U.life += t),
            (U.vy += n * t),
            (U.vx *= 0.995),
            (U.x += U.vx * t),
            (U.y += U.vy * t),
            U.life > U.brk &&
              (Math.random() < 0.1 &&
                qt.length < 40 &&
                qt.push({
                  x: U.x,
                  y: U.y,
                  vx: U.vx + c(-8, 8) * o,
                  vy: U.vy * c(0.8, 1),
                  life: 0,
                  ttl: c(1.2, 2.4),
                  r: c(0.5, 0.9) * U.w * 0.35,
                  ph: 0,
                }),
              C.splice(I, 1)));
        }
        if (C.length < 3) continue;
        const $ = C.length,
          F = [],
          H = [],
          R = [],
          A = [];
        let G = 0;
        for (let I = 0; I < $; I++) {
          const U = C[Math.max(0, I - 1)],
            J = C[Math.min($ - 1, I + 1)],
            ot = C[I];
          let Yt = J.x - U.x,
            Se = J.y - U.y;
          const Ce = Math.hypot(Yt, Se) || 1;
          ((Yt /= Ce), (Se /= Ce), I && (G += Math.hypot(ot.x - C[I - 1].x, ot.y - C[I - 1].y)));
          const go = ot.life / ot.brk,
            sn = 1 / Math.sqrt(1 + 1.8 * go),
            rn = go > 0.7 ? 1 + (0.16 * Math.sin(ot.life * 22 - e * 5) * (go - 0.7)) / 0.3 : 1,
            cn = ot.w * 0.7 * sn * rn * (1 + 0.06 * Math.sin(ot.life * 6 - e * 3));
          (F.push(ot.x, ot.y), H.push(-Se), R.push(Yt), A.push(cn));
        }
        const j = (I, U) => {
            const J = [];
            for (let ot = 0; ot < $; ot++)
              J.push(F[2 * ot] + H[ot] * A[ot] * I * U, F[2 * ot + 1] + R[ot] * A[ot] * I * U);
            return J;
          },
          O = (I) => I.map((U, J) => (J < 2 || J > I.length - 3 ? U : (I[J - 2] + 2 * U + I[J + 2]) / 4)),
          W = O(j(-1, 1)),
          Y = O(j(1, 1)),
          dt = (I, U = 0) => {
            (g.beginPath(), g.moveTo(I[U], I[U + 1]));
            for (let J = U + 2; J < I.length; J += 2) g.lineTo(I[J], I[J + 1]);
          },
          it = C[$ - 1],
          ht = C[0];
        (g.beginPath(), g.moveTo(W[0], W[1]));
        for (let I = 2; I < W.length; I += 2) g.lineTo(W[I], W[I + 1]);
        for (let I = Y.length - 2; I >= 0; I -= 2) g.lineTo(Y[I], Y[I + 1]);
        g.closePath();
        const V = (it.x + ht.x) / 2,
          pt = (it.y + ht.y) / 2;
        (g.save(),
          g.clip(),
          (g.globalAlpha = 0.7),
          g.translate(V, pt),
          g.scale(1.14, 1.14),
          g.translate(-V, -pt),
          g.drawImage(_t, 0, 0, Q, nt),
          g.restore(),
          g.beginPath(),
          g.moveTo(W[0], W[1]));
        for (let I = 2; I < W.length; I += 2) g.lineTo(W[I], W[I + 1]);
        for (let I = Y.length - 2; I >= 0; I -= 2) g.lineTo(Y[I], Y[I + 1]);
        g.closePath();
        const lt = g.createLinearGradient(it.x, it.y, ht.x, ht.y);
        (lt.addColorStop(0, "rgba(120,195,230,.24)"),
          lt.addColorStop(0.55, "rgba(60,145,200,.17)"),
          lt.addColorStop(1, "rgba(40,120,180,0)"),
          (g.globalAlpha = 1),
          (g.fillStyle = lt),
          g.fill(),
          (g.lineCap = "round"),
          (g.lineJoin = "round"));
        for (const [I, U] of [
          [W, 0.26],
          [Y, 0.14],
        ]) {
          dt(I);
          const J = g.createLinearGradient(it.x, it.y, ht.x, ht.y);
          (J.addColorStop(0, `rgba(225,248,255,${U})`),
            J.addColorStop(1, "rgba(225,248,255,0)"),
            (g.strokeStyle = J),
            (g.lineWidth = 0.7 * o),
            g.stroke());
        }
        g.globalCompositeOperation = "lighter";
        for (let I = 0; I < 3; I++) {
          const U = (e * 0.55 + I / 3 + m.a * 0.01) % 1,
            J = Math.floor((1 - U) * ($ - 1)),
            ot = A[J] * 2.2,
            Yt = (I - 1) * 0.35 * A[J];
          ((g.globalAlpha = 0.22 * Math.sin(Math.PI * U)),
            g.drawImage(st.glint, F[2 * J] + H[J] * Yt - ot / 2, F[2 * J + 1] + R[J] * Yt - ot / 2, ot, ot));
        }
        ((g.globalCompositeOperation = "source-over"), (g.globalCompositeOperation = "lighter"));
        const Gt = Math.min($, 10);
        for (let I = $ - 1; I >= $ - Gt; I--) {
          const U = ($ - 1 - I) / Gt,
            J = c(-1, 1) * A[I];
          g.globalAlpha = (1 - U) * 0.28 * (0.6 + 0.4 * Math.random());
          const ot = A[I] * (1.2 + Math.random());
          g.drawImage(st.water, F[2 * I] + H[I] * J - ot / 2, F[2 * I + 1] + R[I] * J - ot / 2, ot, ot);
        }
        const It = C[0];
        if (It.life / It.brk > 0.85 && Math.random() < 0.6) {
          g.globalAlpha = 0.12;
          const I = m.w * o * c(1.2, 2.4);
          g.drawImage(st.water, It.x - I / 2 + c(-3, 3), It.y - I / 2 + c(-3, 3), I, I);
        }
        ((g.globalCompositeOperation = "source-over"), (g.globalAlpha = 1));
      }
      for (let m = ne.length - 1; m >= 0; m--) {
        const h = ne[m];
        h.temp && !h.on && h.lvl < 0.02 && !h.pts.length && ne.splice(m, 1);
      }
      if (!Bo && r > 0.5 && p > 0.5) {
        let m = 150,
          h = -2;
        for (let S = 150; S <= 236; S += 4) {
          const w = Jt(S, l)[3];
          w > h && ((h = w), (m = S));
        }
        h > -0.55 &&
          ((Bo = !0),
          de.push({ a: m, span: 74, life: 0, ttl: 4.4, amp: 0.62, dir: Pt([-1, 1]), ph: c(0, E), spray: 0, big: !0 }),
          ($e = e + 6));
      }
      r > 0.06 &&
        p > 0.1 &&
        e > $e &&
        ($e > 0 &&
          de.push({
            a: c(148, 234),
            span: c(30, 52),
            life: 0,
            ttl: c(2.3, 3.4),
            amp: c(0.14, 0.3) * (0.6 + 0.4 * r),
            dir: Pt([-1, 1]),
            ph: c(0, E),
            spray: 0,
          }),
        ($e = e + (Math.random() < 0.3 ? c(6, 10) : c(2.2, 5))));
      for (let m = de.length - 1; m >= 0; m--) {
        const h = de[m];
        h.life += t;
        const S = h.life / h.ttl;
        if (S >= 1) {
          de.splice(m, 1);
          continue;
        }
        const w = S < 0.35 ? Nt(S / 0.35) : 1 - et((S - 0.35) / 0.65);
        h.big &&
          S > 0.4 &&
          !h.spilled &&
          ((h.spilled = !0),
          ne.push({ a: h.a, w: 44, wCur: 44, thr: 0, pts: [], on: !0, until: e + 1.6, acc: 0, lvl: 0, temp: !0 }));
        const b = 0.5 + h.dir * (S - 0.45) * 0.7,
          C = 30,
          $ = [],
          F = [];
        let H = 0,
          R = 0;
        for (let W = 0; W <= C; W++) {
          const Y = W / C,
            dt = h.a + (Y - 0.5) * h.span,
            it = Math.pow(Math.sin(Math.PI * Y), 1.4),
            ht = Math.exp(-((Y - b) ** 2) / 0.05),
            V = l * h.amp * w * it * (0.45 + 0.55 * ht) * (1 + 0.07 * Math.sin(Y * 15 + e * 4 + h.ph)),
            [pt, lt, Gt, It] = Jt(dt, l * 0.93),
            I = -It * h.dir,
            U = Gt * h.dir,
            J = V * 0.18 * w;
          ($.push([pt, lt]),
            F.push([pt + Gt * V + I * J, lt + It * V + U * J, Gt, It, I, U, V]),
            V > H && ((H = V), (R = W)));
        }
        if (H < 0.5) continue;
        const A = Math.floor(C / 2),
          G = $[A],
          j = F[R],
          O = g.createLinearGradient(G[0], G[1], j[0], j[1]);
        (O.addColorStop(0, "rgba(25,90,150,.22)"),
          O.addColorStop(0.7, "rgba(60,150,205,.2)"),
          O.addColorStop(1, "rgba(160,220,245,.22)"),
          (g.globalAlpha = 1),
          (g.fillStyle = O),
          g.beginPath(),
          g.moveTo($[0][0], $[0][1]));
        for (const W of $) g.lineTo(W[0], W[1]);
        for (let W = F.length - 1; W >= 0; W--) g.lineTo(F[W][0], F[W][1]);
        (g.closePath(),
          g.fill(),
          (g.lineCap = "round"),
          (g.lineJoin = "round"),
          g.beginPath(),
          F.forEach((W, Y) => {
            const dt = L($[Y][0], W[0], 0.6),
              it = L($[Y][1], W[1], 0.6);
            Y ? g.lineTo(dt, it) : g.moveTo(dt, it);
          }),
          (g.strokeStyle = "rgba(190,240,255,.25)"),
          (g.lineWidth = 1.2 * o),
          g.stroke(),
          g.beginPath(),
          F.forEach((W, Y) => (Y ? g.lineTo(W[0], W[1]) : g.moveTo(W[0], W[1]))),
          (g.strokeStyle = `rgba(235,250,255,${0.32 * w})`),
          (g.lineWidth = 1 * o),
          g.stroke(),
          (g.fillStyle = "#f4fdff"));
        for (let W = 0; W < F.length; W += 2) {
          const Y = F[W];
          Y[6] < H * 0.45 ||
            ((g.globalAlpha = 0.55 * w * Math.random()),
            g.beginPath(),
            g.arc(Y[0] + c(-2, 2) * o, Y[1] + c(-2, 2) * o, c(0.5, 1.5) * o, 0, E),
            g.fill());
        }
        if (S > 0.22 && S < 0.6)
          for (h.spray += 40 * h.amp * 4 * t; h.spray > 1 && qt.length < 60;) {
            h.spray--;
            const W = F[Math.max(0, Math.min(C, R + Math.round(c(-3, 3))))],
              Y = c(20, 50) * o;
            qt.push({
              x: W[0],
              y: W[1],
              vx: W[2] * Y + W[4] * c(10, 30) * o,
              vy: W[3] * Y + W[5] * c(10, 30) * o,
              life: 0,
              ttl: c(0.9, 1.8),
              r: c(0.7, 2) * o,
              ph: 0,
            });
          }
      }
      if (r > 0.04 && p > 0.1 && e > Ho) {
        Ho = e + (Math.random() < 0.3 ? c(0.25, 0.5) : c(0.8, 2.4));
        for (let m = 0; m < 6; m++) {
          const h = c(140, 245),
            [S, w, b, C] = Jt(h, l * 1);
          if (!(C < 0.25)) {
            qt.push({
              x: S,
              y: w,
              vx: b * 4 * o,
              vy: 0,
              life: 0,
              ttl: c(1.4, 2.2),
              r: c(1.8, 3.2) * o,
              ph: 0,
              hang: c(0.4, 0.8),
              r0: 0,
            });
            break;
          }
        }
      }
      for (let m = qt.length - 1; m >= 0; m--) {
        const h = qt[m];
        if (((h.life += t), h.life > h.ttl)) {
          qt.splice(m, 1);
          continue;
        }
        h.hang > 0
          ? ((h.hang -= t), (h.life = 0), (h.r0 = Math.min(1, h.r0 + t * 1.6)))
          : ((h.vy += n * t), (h.x += h.vx * t), (h.y += h.vy * t));
        const S = h.life / h.ttl,
          w = h.r * (h.r0 != null && h.hang != null ? Math.max(0.35, h.r0) : 1),
          b = 1 + Math.min(0.7, Math.hypot(h.vx, h.vy) / (160 * o)) + (h.hang > 0 ? 0.25 * h.r0 : 0);
        (g.save(),
          g.translate(h.x, h.y),
          g.rotate(h.hang > 0 ? Math.PI / 2 : Math.atan2(h.vy, h.vx)),
          (g.globalAlpha = 0.7 * (1 - S * S)));
        const C = g.createRadialGradient(-w * 0.3, -w * 0.35, 0, 0, 0, w * b);
        (C.addColorStop(0, "rgba(255,255,255,.95)"),
          C.addColorStop(0.18, "rgba(200,240,255,.35)"),
          C.addColorStop(0.75, "rgba(90,170,215,.16)"),
          C.addColorStop(1, "rgba(30,90,140,.45)"),
          (g.fillStyle = C),
          g.beginPath(),
          g.ellipse(0, 0, w * b, w, 0, 0, E),
          g.fill(),
          g.restore());
      }
      const P = et(B(D, Z.haze)),
        T = (m, h, S, w, b, C) => {
          const $ = 2 + Math.floor(Math.random() * 3);
          for (let F = 0; F < $ && ue.length < 110; F++)
            ue.push({
              x: m + c(-8, 8) * o,
              y: h + c(-8, 8) * o,
              vx: S + c(-4, 4) * o,
              vy: w + c(-4, 4) * o,
              life: 0,
              ttl: c(7, 13),
              el: b,
              warm: C,
              eth: Math.random() < 0.55 ? "etherV" : "etherG",
              s0: c(36, 78) * o,
              grow: c(2.2, 4.6),
              ph: c(0, E),
              m: c(0.5, 1.6),
              star: !1,
            });
        };
      for (
        oo +=
          (1.2 + 6 * P) *
          Ct *
          t *
          (P > 0 ? 1 : 0) *
          (0.6 + 0.8 * Math.max(0, Math.sin(e * 0.37) * Math.sin(e * 0.23 + 1)));
        oo > 1;
      ) {
        oo--;
        const m = Math.random();
        if (m < 0.6 && y > 0.05) {
          const h = Pt(fe),
            S = Math.random() < 0.35 ? c(0, 6) : h.total * f * Math.random(),
            [w, b] = M(...ge(h, S)),
            C = w - Q / 2,
            $ = b - nt / 2,
            F = Math.hypot(C, $) || 1;
          T(w, b, (C / F) * 6 * o, ($ / F) * 6 * o - 8 * o, "mistF", !0);
        } else if (m < 0.85) {
          const [h, S, w, b] = Jt(c(140, 245), l * c(0.95, 1.05));
          T(h, S, w * 8 * o, b * 8 * o, "mistW", !1);
        } else {
          const [h, S, w, b] = Jt(c(-80, 80), l * c(0.95, 1.05));
          T(h, S, w * 6 * o, b * 6 * o, "mistP", !1);
        }
      }
      const k = tt(fo, -2500, 2500);
      g.globalCompositeOperation = "lighter";
      for (let m = ue.length - 1; m >= 0; m--) {
        const h = ue[m];
        if (((h.life += t), h.life > h.ttl)) {
          ue.splice(m, 1);
          continue;
        }
        const S = h.life / h.ttl;
        ((h.vy -= ((k * 0.35) / h.m) * t),
          h.warm && (h.vy -= 5 * o * t),
          (h.vx += Math.sin(h.y * 0.012 + e * 0.4 + h.ph) * 4 * o * t),
          (h.vx *= 0.985),
          (h.vy *= 0.985),
          (h.x += h.vx * t),
          (h.y += h.vy * t));
        const w = h.s0 * (1 + (h.grow - 1) * Math.sqrt(S)),
          b = Math.pow(Math.sin(Math.PI * S), 1.4) * (1 - s * 0.3) * (1 - B(D, [0.7, 0.82])) * Ct,
          C = tt((S - 0.15) / 0.55);
        ((g.globalAlpha = b * 0.22 * (1 - C)),
          g.drawImage(st[h.el], h.x - w / 2, h.y - w / 2, w, w),
          (g.globalAlpha = b * 0.2 * C),
          g.drawImage(st[h.eth], h.x - w / 2, h.y - w / 2, w, w),
          !h.star &&
            S > 0.7 &&
            Math.random() < 0.5 &&
            ((h.star = !0),
            no(h.x + c(-0.3, 0.3) * w, h.y + c(-0.3, 0.3) * w, 0, 0, "ember", c(4, 7), c(3, 6) * o, 0)));
      }
      if (s > 0 && s < 1)
        for (ao += 14 * Math.sin(Math.PI * s) * t; ao > 1;) {
          ao--;
          const m = Pt(fe),
            [h, S] = M(...ge(m, m.total * c(0.5, 1))),
            w = h - Q / 2,
            b = S - nt / 2,
            C = Math.hypot(w, b) || 1,
            $ = c(16, 32) * o;
          no(h, S, (w / C) * $, (b / C) * $, "ember", c(5, 8), c(4, 7) * o, c(0.15, 0.3));
        }
      g.globalCompositeOperation = "lighter";
      for (let m = pe.length - 1; m >= 0; m--) {
        const h = pe[m];
        if (((h.life += t), h.life > h.ttl)) {
          pe.splice(m, 1);
          continue;
        }
        const S = h.life / h.ttl;
        if (((h.vx *= 0.99), (h.vy *= 0.99), (h.x += h.vx * t), (h.y += h.vy * t), S < h.star)) {
          const w = S / h.star,
            b = h.s * (1 - w * 0.4);
          ((g.globalAlpha = Math.min(1, S * 25) * (1 - w * 0.3) * 0.9),
            g.drawImage(st[h.kind] || st.ember, h.x - b / 2, h.y - b / 2, b, b));
        } else {
          const w = (S - h.star) / (1 - h.star),
            b = 0.55 + 0.45 * Math.sin(h.life * h.tw + h.ph);
          xa(g, h.x, h.y, h.s * (0.6 + 0.3 * b), Math.min(1, w * 4) * (1 - Math.pow(w, 3)) * b, b);
        }
      }
      return (
        (g.globalAlpha = 1),
        (g.globalCompositeOperation = "source-over"),
        Aa(e, t, l, M),
        $a(e, t, o, l, M, v),
        ko(g, Ze),
        a
      );
    }
    const Tt = document.createElement("div");
    ((Tt.className = "es-fx"), Tt.setAttribute("aria-hidden", "true"), document.body.appendChild(Tt));
    const Ee = document.createElement("canvas");
    Tt.appendChild(Ee);
    const z = Ee.getContext("2d"),
      lo = "http://www.w3.org/2000/svg",
      ye = document.createElementNS(lo, "svg");
    (ye.setAttribute("class", "es-decor"),
      (ye.innerHTML =
        "<defs>" +
        Object.entries(Oe)
          .map(
            ([e, [t, o]]) =>
              `<linearGradient id="es-g-${e}-${se}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t}" stop-opacity="0"/><stop offset=".18" stop-color="${t}"/><stop offset=".8" stop-color="${o}"/><stop offset="1" stop-color="${o}" stop-opacity="0"/></linearGradient><linearGradient id="es-f-${e}-${se}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="400"><stop offset="0" stop-color="${t}"/><stop offset="1" stop-color="${o}"/></linearGradient>`,
          )
          .join("") +
        "</defs>"),
      Tt.appendChild(ye));
    const Lo = (e, t) => `url(#es-${t ? "f" : "g"}-${e}-${se})`,
      Re = Kt("fxHeader");
    function Go() {
      const e = [
        zt.header,
        ".header__heading-logo",
        "header .logo img",
        'header [class*="logo"] img',
        '[class*="header"] [class*="logo"] img',
        "header img",
      ].filter(Boolean);
      for (const t of e) {
        let o;
        try {
          o = document.querySelectorAll(t);
        } catch {
          continue;
        }
        for (const l of o) {
          if (X.contains(l) || Tt.contains(l)) continue;
          const a = l.getBoundingClientRect();
          if (
            a.width > 14 &&
            a.height > 10 &&
            (a.top + scrollY < 300 || (a.top >= 0 && a.top < 220)) &&
            getComputedStyle(l).display !== "none"
          )
            return l;
        }
      }
      return null;
    }
    let K = Re ? Go() : null,
      Xt = null;
    function Wa() {
      if (((K = Re ? (K && K.isConnected && K.getBoundingClientRect().width > 14 ? K : Go()) : null), K)) {
        const e = K.getBoundingClientRect();
        Xt = { x: e.left + e.width / 2, y: e.top + scrollY + e.height / 2, w: Math.max(e.width, e.height) };
      }
    }
    function qa() {
      if (K) {
        const t = K.getBoundingClientRect();
        if (t.bottom > 0 && t.top < innerHeight && t.width > 0)
          return { x: t.left + t.width / 2, y: t.top + t.height / 2, w: Math.max(t.width, t.height), inView: !0 };
      }
      const e = Xt ? Math.min(Xt.w, 56) : 48;
      return { x: Xt ? Xt.x : 44, y: 14 + e / 2, w: e, inView: !1 };
    }
    const ft = document.createElement("div");
    ((ft.className = "es-ghost"), (ft.innerHTML = `<img alt="" src="${K ? K.currentSrc || K.src : uo}">`));
    const We = document.createElement("div");
    We.className = "es-dot";
    const vt = document.createElement("div");
    ((vt.className = "es-dock"),
      vt.setAttribute("role", "button"),
      vt.setAttribute("aria-label", "Nach oben"),
      (vt.innerHTML = `<img alt="" src="${K ? K.currentSrc || K.src : uo}">`),
      vt.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" })),
      Tt.append(ft, We, vt));
    const Yo = K ? { o: K.style.opacity, t: K.style.transition } : null;
    K && (K.style.transition = "filter .6s");
    function No(e) {
      St > 0.6 && location.pathname === "/" && (e.preventDefault(), scrollTo({ top: 0, behavior: "smooth" }));
    }
    K && (K.closest("a") || K).addEventListener("click", No);
    let yt = null;
    const N = { cur: 0, h: null, arr: -9, glit: null, twT: 0, tw: null, bk: null, rt: null },
      Gx = { x: 0, y: 0, w: 0 };
    let mt = null;
    const at = { t0: -1, done: !1, dust: [], lit: !1 },
      $t = [],
      me = (e, t) =>
        [...document.querySelectorAll(e)].find(
          (o) => t.test(o.textContent || "") && o.getBoundingClientRect().width > 0,
        );
    function be(e, t, o) {
      const l = e.getBoundingClientRect(),
        a = e.naturalWidth || l.width,
        r = e.naturalHeight || l.height,
        d = getComputedStyle(e).objectFit;
      let s = l.width,
        p = l.height,
        f = 0,
        i = 0;
      if (d === "cover" || d === "contain") {
        const n = d === "cover" ? Math.max(l.width / a, l.height / r) : Math.min(l.width / a, l.height / r);
        ((s = a * n), (p = r * n), (f = (l.width - s) / 2), (i = (l.height - p) / 2));
      }
      const y = l.left + f + t * s,
        v = l.top + i + o * p;
      return y > l.left + 8 && y < l.right - 8 && v > l.top + 8 && v < l.bottom - 8 ? { x: y, y: v + scrollY } : null;
    }
    function Do() {
      if (((yt = null), location.pathname !== "/" || !K)) return;
      const e = X.closest('[id^="shopify-section"]'),
        t = [],
        o = (b, C, $) => {
          b && isFinite(b.x) && isFinite(b.y) && t.push(Object.assign({ x: b.x, y: b.y, op: C }, $));
        },
        l = [...document.querySelectorAll("main img, #MainContent img")].filter(
          (b) => !X.contains(b) && b.getBoundingClientRect().width > 120,
        ),
        a = (b) => l.find((C) => b.test(C.currentSrc || C.src || "")),
        r = Xt ? Xt.w : 52,
        d = r * 0.42 * 0.5 + 16;
      if (
        ((mt = [...document.querySelectorAll("svg.es-sacred")].find((b) => b.querySelector('circle[r="30"]')) || null),
        mt)
      ) {
        const b = mt.getBoundingClientRect();
        b.width > 0 && o({ x: b.left + b.width / 2, y: b.top + b.height / 2 + scrollY }, 1, { sz: 0.3, flower: 1 });
      }
      const s = { sz: 0.42 },
        p = a(/DSC_0868/);
      p && (o(be(p, 0.142, 0.475), 0.85, { sz: 0.42, heart: 1 }), o(be(p, 0.781, 0.585), 0.74, { sz: 0.42, heart: 1 }));
      const f = me("a, button", /^\s*Mitglied werden\s*$/i),
        i = me("a, button", /Termin für Info/i);
      if (f) {
        const b = f.getBoundingClientRect();
        o({ x: b.left - r * 0.5, y: b.top + b.height / 2 + scrollY }, 0.6, { sz: 0.7 });
      }
      if (i) {
        const b = i.getBoundingClientRect();
        o({ x: b.right + r * 0.5, y: b.top + b.height / 2 + scrollY }, 0.48, { sz: 0.7 });
      }
      const y = a(/20180401_083535/);
      if (y) {
        const b = be(y, 0.256, 0.3);
        (b && o({ x: b.x, y: b.y - d }, 0.36, s), o(be(y, 0.787, 0.405), 1, { sz: 0.5, stay: 1 }));
      }
      const v = me("h1, h2, h3", /Von Herz zu Herz/i);
      if (v) {
        const b = co(v);
        o({ x: b.right + r * 0.75, y: b.top + b.height / 2 + scrollY }, 1, { sz: 0.9 });
      }
      const M = me("p, li, div, span, strong", /IBAN/);
      if (M) {
        let b = M;
        for (; b.children.length === 1 && /IBAN/.test(b.firstElementChild.textContent);) b = b.firstElementChild;
        const C = co(b);
        o({ x: Math.min(innerWidth - r * 0.7, C.right + r), y: C.top + C.height / 2 + scrollY }, 1, { sz: 0.9 });
      }
      const n = a(/das-geheimnis-der-selbstheilung/);
      n && o(be(n, 0.155, 0.55), 1, { shine: 1, sz: 1.35 });
      const cb = [...document.querySelectorAll('[id^="ProductSubmitButton-"][id*="featured_product"]')].find(
        (b) => b.getBoundingClientRect().width > 0,
      );
      if (cb) {
        const b = cb.getBoundingClientRect(),
          sd = b.right + r * 0.8 < innerWidth - r * 0.55;
        o({ x: sd ? b.right + r * 0.8 : b.left - r * 0.8, y: b.top + b.height / 2 + scrollY }, 1, { sz: 0.75 });
      }
      const u = me("h1, h2, h3", /Community Access/i),
        P = u && u.closest('[id^="shopify-section"]'),
        T = P && [...P.querySelectorAll("a, button")].find((b) => /Mehr erfahren/i.test(b.textContent));
      if (T) {
        const b = T.getBoundingClientRect();
        o({ x: b.left + b.width / 2, y: b.bottom + r * 0.9 + scrollY }, 1, { sz: 0.95 });
      }
      const k = e ? e.getBoundingClientRect().top + scrollY : X.getBoundingClientRect().top + scrollY,
        m = innerHeight,
        h = t.filter((b) => b.y < k);
      if (!h.length) return;
      const S = [];
      let w = 0;
      (h.forEach((b, C) => {
        const $ = h[C - 1];
        ((w = C ? Math.max(w + 150, b.y - m * 0.72, $.stay ? $.y - m * 0.4 : 0) : 4), S.push(w));
      }),
        S.push(Math.max(w + 160, k - m * 0.5)),
        (yt = { pts: h, trig: S }),
        (X._flug = { route: yt, hop: N, fl: at, endHop: ct }),
        (N.cur = Math.min(N.cur, h.length + 1)));
    }
    const Fa = (e) => (e >= 1 ? 1 : 1 - Math.pow(2, -9 * e) * Math.cos(e * 9.5));
    function le(e, t, o, l) {
      const a = yt.pts.length + 2;
      if (e <= 0) return { x: t.x, y: t.y, sz: 1, op: 1, hdr: 1 };
      if (e >= a - 1) return { x: o, y: l, sz: 0.3, op: 1, orb: 1 };
      const r = yt.pts[e - 1],
        d = t.y + t.w * 0.8 + 24;
      return {
        x: r.x,
        y: r.stay ? r.y - scrollY : Math.max(r.y - scrollY, d),
        sz: r.sz || 1,
        op: r.op,
        shine: r.shine,
        flower: r.flower,
        heart: r.heart || r.stay,
      };
    }
    function jo(e, t, o) {
      N.glit = {
        k: e,
        t0: t,
        big: o,
        stars: Array.from({ length: o > 1 ? 9 : 5 }, (l, a) => ({
          a: (a / (o > 1 ? 9 : 5)) * E + c(-0.3, 0.3),
          r: c(0.62, 1.05),
          s: c(0.7, 1.3),
          d: c(0, 0.25),
        })),
      };
    }
    function za(e, t, o, l) {
      const a = yt.pts.length + 2;
      let r = 0;
      (yt.trig.forEach((u, P) => {
        HW.eff >= u && (r = P + 1);
      }),
        N.init || ((N.init = !0), (N.cur = r), (N.arr = e - 5)));
      const d = le(N.cur, t, o, l);
      // Blume nicht warten lassen: scrollt man weiter, spielt sie ca. 3x schneller zu Ende
      d.flower && !N.h && !at.done && at.t0 >= 0 && r > N.cur && (at.t0 -= Math.min(0.1, e - (N.ft || e)) * 2.2);
      N.ft = e;
      const s = d.flower && !N.h && !at.done && r > N.cur,
        p = !N.h && d.heart && r === N.cur + 1 && e - N.arr < 0.35;
      if (!N.h && r !== N.cur && !s && !p) {
        let u = N.cur + Math.sign(r - N.cur);
        // Stationen, die schon aus dem Bild gescrollt sind, nicht im Eiltempo abfliegen
        if (r > N.cur)
          for (; u < r && u < a - 1; u++) {
            const q = yt.pts[u - 1],
              qy = q ? q.y - scrollY : 0;
            if (!q || q.flower || (qy > t.y + t.w * 0.6 && qy < innerHeight)) break;
          }
        const P = le(N.cur, t, o, l),
          T = le(u, t, o, l);
        N.sx !== undefined && !P.hdr && !P.orb && ((P.x = N.sx), (P.y = N.sy - scrollY));
        const k = Math.hypot(T.x - P.x, T.y - P.y);
        ((N.h = {
          k: u,
          fx: P.x,
          fy: P.y + scrollY,
          fsz: P.sz,
          fop: P.op,
          hdr: !!P.hdr || !!P.flower || N.cur === a - 1,
          t0: e,
          dur: tt(0.42 + k / 3000, 0.48, 0.85) * (Math.abs(r - u) > 0 ? 0.75 : 1),
          side: u % 2 ? 1 : -1,
        }),
          ($t.length = 0));
      }
      const f = { x: t.x, y: t.y, w: t.w, op: 0, rot: 0, filter: "", dot: 0, sp: null };
      if (N.h) {
        const u = N.h,
          P = tt((e - u.t0) / u.dur),
          T = le(u.k, t, o, l),
          k = u.fx,
          m = u.fy - scrollY,
          h = B(P, [0, 0.2]);
        !u.hdr &&
          h < 1 &&
          ((f.x = k),
          (f.y = m),
          (f.w = t.w * u.fsz * (1 - h * h * 0.92)),
          (f.op = u.fop),
          (f.filter = `brightness(${(1 + h * 2.2).toFixed(2)})`));
        const S = et(B(P, [0.1, 0.94])),
          w = T.x - k,
          b = T.y - m,
          C = Math.hypot(w, b) || 1,
          $ = Math.min(200, C * 0.3) * u.side,
          F = (k + T.x) / 2 - (b / C) * $,
          H = (m + T.y) / 2 + (w / C) * $ - C * 0.05,
          R = 1 - S,
          A = R * R * k + 2 * R * S * F + S * S * T.x,
          G = R * R * m + 2 * R * S * H + S * S * T.y;
        return (
          (f.sp = { x: A, y: G, a: tt(P * 7) * (1 - B(P, [0.93, 1])) }),
          $t.push({ x: A, y: G + scrollY, t: e }),
          T.orb && ((f.dot = B(P, [0.75, 1])), (f.x = T.x), (f.y = T.y)),
          P >= 1 &&
            ((N.cur = u.k),
            (N.h = null),
            (N.sx = T.x),
            (N.sy = T.y + scrollY),
            (N.arr = e),
            (N.twT = e + c(1.6, 2.6)),
            T.flower ? at.done || (at.t0 = e) : jo(u.k, e, T.shine ? 2 : T.orb ? 2.4 : T.hdr ? 1.4 : 1),
            T.hdr &&
              mt &&
              at.done &&
              ((mt.style.opacity = ""),
              (mt.style.transition = "opacity 1.2s"),
              (at.done = !1),
              (at.t0 = -1),
              (at.lit = !1))),
          f
        );
      }
      const i = le(N.cur, t, o, l),
        y = e - N.arr;
      if (i.hdr) return f;
      if (i.flower) return (Ha(e, i), (f.sp = { x: i.x, y: i.y, a: at.done ? 1 : Ba(e) }), f);
      if (i.orb) return ((f.x = i.x), (f.y = i.y), (f.dot = 1), f);
      const v = Fa(tt(y / 0.62)),
        M = i.shine ? Math.exp(-(((y - 0.3) / 0.32) ** 2)) : 0;
      // weich nachführen: Neuberechnungen und Header-Grenze lassen das Logo nicht mehr springen
      const dtS = Math.min(0.1, Math.max(0, e - (N.st || e)));
      N.st = e;
      const rq = yt.pts[N.cur - 1],
        clp = rq && !rq.stay && rq.y - scrollY < i.y - 0.5,
        ty = i.y + scrollY;
      N.sx === undefined || y < 0.03
        ? ((N.sx = i.x), (N.sy = ty))
        : ((N.sx += (i.x - N.sx) * Math.min(1, dtS * 9)), (N.sy = clp ? ty : N.sy + (ty - N.sy) * Math.min(1, dtS * 9)));
      ((f.x = N.sx),
        (f.y = N.sy - scrollY + Math.sin(e * 1.6 + N.cur) * 1.6),
        (f.w = t.w * i.sz * Math.max(0.02, v)),
        (f.op = i.op * tt(y / 0.16)),
        (f.rot = Math.sin(y * 10) * Math.exp(-y * 6) * 3));
      const n = Math.exp(-y * 3.2) * 0.7 + M * 1.4;
      return (
        (f.filter =
          n > 0.03
            ? `brightness(${(1 + n * 0.8).toFixed(2)}) drop-shadow(0 0 ${(4 + 12 * n).toFixed(1)}px rgba(255,216,150,${Math.min(0.95, 0.35 + n * 0.5).toFixed(2)}))`
            : "drop-shadow(0 0 4px rgba(255,216,150,.35))"),
        M > 0.3 &&
          Math.random() < M * 0.45 &&
          ze(f.x + c(-f.w * 0.6, f.w * 0.6), f.y + c(-f.w * 0.6, f.w * 0.6), "gold"),
        f
      );
    }
    function Ba(e) {
      if (at.t0 < 0) return 1;
      const t = e - at.t0;
      return t < 2.1 ? 0.75 + 0.25 * Math.sin(t * 9) : tt((t - 3.55) / 0.5);
    }
    function Ha(e, t) {
      if (!mt || at.t0 < 0 || at.done) return;
      const o = e - at.t0,
        l = [...mt.querySelectorAll("circle")];
      at.order ||
        ((at.order = l
          .map((a) => ({
            c: a,
            d: Math.hypot(+a.getAttribute("cx"), +a.getAttribute("cy")) + (+a.getAttribute("r") > 40 ? 200 : 0),
          }))
          .sort((a, r) => a.d - r.d)),
        at.order.forEach((a, r) => {
          a.k = r / Math.max(1, at.order.length - 1);
        }));
      for (const a of at.order) {
        const r = tt((o - 0.2 - a.k * 1.3) / 0.55),
          d = Math.sin(Math.PI * r);
        (a.c.setAttribute(
          "stroke",
          d > 0.02
            ? `rgba(255,${(226 + 26 * d) | 0},${(170 + 60 * d) | 0},${(0.42 + 0.58 * d).toFixed(2)})`
            : r >= 1
              ? "rgba(255,236,196,.62)"
              : "",
        ),
          a.c.setAttribute("stroke-width", (+a.c.getAttribute("r") > 40 ? 0.8 : 0.55) * (1 + 1.6 * d) + ""));
      }
      if (
        ((mt.style.filter = `drop-shadow(0 0 ${(4 + 10 * Math.sin(Math.PI * tt((o - 0.2) / 1.9))).toFixed(1)}px rgba(255,214,140,.75))`),
        o > 2.05 && !at.dust.length && mt.style.opacity !== "0")
      ) {
        const a = mt.getBoundingClientRect(),
          r = a.width / 200,
          d = a.left + a.width / 2,
          s = a.top + a.height / 2 + scrollY,
          p = mt.parentElement,
          f = p ? p.getBoundingClientRect() : { left: 0, top: a.top, width: innerWidth, height: innerHeight * 0.6 };
        for (const i of at.order) {
          const y = +i.c.getAttribute("r"),
            v = +i.c.getAttribute("cx"),
            M = +i.c.getAttribute("cy"),
            n = y > 40 ? 26 : 10;
          for (let u = 0; u < n; u++) {
            const P = (u / n) * E + c(-0.2, 0.2),
              T = d + (v + Math.cos(P) * y) * r,
              k = s + (M + Math.sin(P) * y) * r;
            at.dust.push({
              x0: T,
              y0: k,
              tx: f.left + c(0.02, 0.98) * f.width,
              ty: f.top + scrollY + c(0.04, 0.96) * f.height,
              s: c(0.8, 1.7),
              ph: c(0, E),
              home: Math.random() < 0.22,
            });
          }
        }
        ((at.cx = d), (at.cy = s), (mt.style.transition = "opacity .35s"), (mt.style.opacity = "0"));
      }
      o > 4.05 && ((at.done = !0), (at.dust.length = 0), jo(N.cur, e, 1.2));
    }
    function _a(e) {
      if (!at.dust.length || at.t0 < 0) return;
      const t = e - at.t0 - 2.05,
        o = Oa(tt(t / 0.9)),
        l = et(tt((t - 1.4) / 0.6));
      for (const a of at.dust) {
        let r = L(a.x0, a.tx, o),
          d = L(a.y0, a.ty, o);
        a.home && ((r = L(r, at.cx, l)), (d = L(d, at.cy, l)));
        const s = 0.55 + 0.45 * Math.sin(e * 7 + a.ph),
          p = tt(t * 6) * s * (a.home ? 1 - l * 0.3 : 1 - tt((t - 1.2) / 0.7)) * 0.9;
        p <= 0.01 ||
          ((z.globalAlpha = p),
          z.drawImage(st.star, r - 4.5 * a.s, d - scrollY - 4.5 * a.s, 9 * a.s, 9 * a.s),
          (z.globalAlpha = p * 0.9),
          (z.fillStyle = "rgba(255,246,222,1)"),
          z.fillRect(r - 0.6, d - scrollY - 0.6, 1.2, 1.2));
      }
      z.globalAlpha = 1;
    }
    const Oa = (e) => 1 - Math.pow(1 - e, 4);
    function qe(e, t, o, l, a) {
      (z.save(),
        z.translate(e, t),
        z.rotate(a),
        (z.globalAlpha = l),
        (z.fillStyle = "rgba(255,246,222,1)"),
        z.beginPath(),
        z.moveTo(0, -o),
        z.quadraticCurveTo(o * 0.12, -o * 0.12, o, 0),
        z.quadraticCurveTo(o * 0.12, o * 0.12, 0, o),
        z.quadraticCurveTo(-o * 0.12, o * 0.12, -o, 0),
        z.quadraticCurveTo(-o * 0.12, -o * 0.12, 0, -o),
        z.fill(),
        (z.globalAlpha = l * 0.6),
        z.drawImage(st.star, -o * 0.9, -o * 0.9, o * 1.8, o * 1.8),
        z.restore());
    }
    const ct = { stillT: -1, t0: -1, done: !1, link: null, sparks: [] },
      La = () =>
        [
          document.getElementById("HeaderMenu-ubersicht"),
          ...document.querySelectorAll('header a[href*="was-ist-you-are-neo"]'),
          document.querySelector(".header__icon--menu"),
        ].find((t) => t && t.getBoundingClientRect().width > 0) || null;
    function Ga(e, t, o, l, a) {
      const r = scrollY + l >= o - 4,
        d = a > 0.99 && (!window.ESZ || window.ESZ.arrived) && e - ve > 2.6;
      if (
        (r
          ? d &&
            !ct.done &&
            ct.t0 < 0 &&
            (ct.stillT < 0 && (ct.stillT = e), e - ct.stillT > 1.1 && ((ct.t0 = e), (ct.done = !0), (ct.link = La())))
          : (scrollY + l < o - 420 && (ct.done = !1), (ct.stillT = -1)),
        ct.t0 < 0)
      )
        return null;
      const s = e - ct.t0,
        p = ct.link,
        f = p && p.getBoundingClientRect(),
        i = f ? f.left + f.width / 2 : t.x - 160,
        y = f ? f.top - t.w * 0.35 : t.y;
      let v = t.x,
        M = t.y,
        n = 1;
      if (s < 0.45) {
        const u = s / 0.45;
        ((M -= Math.sin(Math.PI * u) * t.w * 0.32), (n = 1 + 0.12 * Math.sin(Math.PI * u)));
      } else if (s < 1.2) {
        const u = et(B(s, [0.45, 1.2]));
        ((v = L(t.x, i, u)),
          (M = L(t.y, y, u) - Math.sin(Math.PI * u) * t.w * 0.9),
          (n = L(1, 0.58, Math.min(1, u * 1.6))));
      } else if (s < 2.05) {
        const u = (s - 1.2) / 0.85;
        ((v = i), (M = y - Math.abs(Math.sin(u * E)) * t.w * 0.22), (n = 0.58));
      } else if (s < 2.9) {
        const u = et(B(s, [2.05, 2.9]));
        ((v = L(i, t.x, u)), (M = L(y, t.y, u) - Math.sin(Math.PI * u) * t.w * 0.75), (n = L(0.58, 1, u)));
      } else return ((ct.t0 = -1), (ve = e), p && p.classList.remove("es-hinweis"), null);
      return (
        p && p.classList.toggle("es-hinweis", s > 1.05 && s < 2.15),
        Math.random() < 0.35 && ct.sparks.push({ x: v, y: M + scrollY, t: e }),
        { x: v, y: M, w: t.w * n }
      );
    }
    function Ya(e) {
      for (let t = ct.sparks.length - 1; t >= 0; t--) {
        const o = ct.sparks[t],
          l = 1 - (e - o.t) / 0.7;
        if (l <= 0) {
          ct.sparks.splice(t, 1);
          continue;
        }
        qe(o.x, o.y - scrollY, 3.5 * l, l * 0.9, o.t * 3);
      }
    }
    function Na(e, t, o, l, a) {
      if (!yt) return;
      for (let s = $t.length - 1; s >= 0; s--) e - $t[s].t > 0.34 && $t.splice(s, 1);
      if ($t.length > 1) {
        z.lineCap = "round";
        for (let s = 1; s < $t.length; s++) {
          const p = $t[s - 1],
            f = $t[s],
            i = s / $t.length,
            y = 1 - (e - f.t) / 0.34;
          ((z.globalAlpha = i * y * 0.85),
            (z.strokeStyle = `rgba(255,${(205 + 45 * i) | 0},${(150 + 95 * i) | 0},1)`),
            (z.lineWidth = 0.6 + i * 3.4),
            z.beginPath(),
            z.moveTo(p.x, p.y - scrollY),
            z.lineTo(f.x, f.y - scrollY),
            z.stroke());
        }
        z.globalAlpha = 1;
      }
      if (t && t.sp && t.sp.a > 0.02) {
        const { x: s, y: p, a: f } = t.sp;
        ((z.globalAlpha = f * 0.9),
          z.drawImage(st.hot, s - 16, p - 16, 32, 32),
          qe(s, p, 7 + 2 * Math.sin(e * 30), f, e * 4),
          (z.globalAlpha = 1),
          Math.random() < 0.35 && ze(s + c(-3, 3), p + c(-3, 3), "gold"));
      }
      const r = N.glit;
      if (r) {
        const s = (e - r.t0) / 0.95;
        if (s >= 1) N.glit = null;
        else {
          const p = le(r.k, o, l, a),
            f = p.hdr ? o.w : p.orb ? Pe.offsetWidth * 0.5 : o.w * p.sz,
            i = f * (0.5 + s * (1 + 0.4 * r.big));
          ((z.globalAlpha = (1 - s) * 0.75),
            (z.strokeStyle = "rgba(240,204,120,1)"),
            (z.lineWidth = 0.8 + 1.6 * (1 - s)),
            z.beginPath(),
            z.arc(p.x, p.y, i, 0, E),
            z.stroke(),
            (z.globalAlpha = (1 - s) * 0.32 * r.big),
            z.drawImage(st.hot, p.x - i, p.y - i, i * 2, i * 2));
          for (const y of r.stars) {
            const v = tt((s - y.d) / 0.7),
              M = Math.sin(Math.PI * v);
            M <= 0 ||
              qe(
                p.x + Math.cos(y.a) * f * y.r * (1 + v * 0.25),
                p.y + Math.sin(y.a) * f * y.r * (1 + v * 0.25),
                (3 + 3.5 * y.s) * M * (r.big > 1 ? 1.2 : 1),
                M * 0.95,
                y.a,
              );
          }
          z.globalAlpha = 1;
        }
      }
      const d = yt.pts.length + 2;
      if (
        !N.h &&
        N.cur > 0 &&
        N.cur < d - 1 &&
        t &&
        t.op > 0.05 &&
        (!N.tw && e > N.twT && ((N.tw = { t0: e, a: c(0, E) }), (N.twT = e + c(2.2, 3.8))), N.tw)
      ) {
        const s = (e - N.tw.t0) / 0.7;
        s >= 1
          ? (N.tw = null)
          : qe(
              t.x + Math.cos(N.tw.a) * t.w * 0.58,
              t.y + Math.sin(N.tw.a) * t.w * 0.58,
              4.5 * Math.sin(Math.PI * s),
              Math.sin(Math.PI * s) * t.op,
              N.tw.a,
            );
      }
    }
    const Da = {
      adler: (e) =>
        e < 0.26
          ? [L(236, 120, e / 0.26), L(226, 86, e / 0.26), L(208, 54, e / 0.26)]
          : Math.sin(e * 26) > 0.55
            ? [52, 34, 22]
            : [98 - e * 40, 68 - e * 30, 44 - e * 20],
      eule: (e) => (Math.sin(e * 34 + 1) > 0.35 ? [124, 88, 54] : [218, 196, 160]),
      weiss: (e) =>
        e < 0.8
          ? [244, 240, 232]
          : [L(244, 128, (e - 0.8) / 0.2), L(240, 138, (e - 0.8) / 0.2), L(232, 150, (e - 0.8) / 0.2)],
    };
    function ja(e, t) {
      const l = Math.round(e * 0.44),
        a = Da[t],
        r = document.createElement("canvas");
      ((r.width = l * 2), (r.height = Math.round(e * 2)));
      const d = r.getContext("2d");
      (d.scale(2, 2), (d.lineCap = "round"));
      const s = e * c(0.03, 0.07) * Pt([-1, 1]),
        p = [l / 2, e - 1],
        f = [l / 2 + s * 2, e * 0.5],
        i = [l / 2 + s * 0.6, 1.5],
        y = (u) => [
          (1 - u) ** 2 * p[0] + 2 * (1 - u) * u * f[0] + u * u * i[0],
          (1 - u) ** 2 * p[1] + 2 * (1 - u) * u * f[1] + u * u * i[1],
        ],
        v = (u) => [
          2 * (1 - u) * (f[0] - p[0]) + 2 * u * (i[0] - f[0]),
          2 * (1 - u) * (f[1] - p[1]) + 2 * u * (i[1] - f[1]),
        ],
        M = c(0, 100),
        n = Math.round(e * 1.7);
      for (let u = 0; u < n; u++) {
        const P = 0.07 + (0.93 * u) / n,
          [T, k] = y(P),
          [m, h] = v(P),
          S = Math.hypot(m, h),
          w = m / S,
          b = h / S,
          C = P < 0.2,
          $ = Math.pow(Math.sin(Math.PI * Math.min(1, (P - 0.04) / 0.98)), 0.55) * (P < 0.2 ? 0.55 + P * 2.2 : 1);
        for (const F of [-1, 1]) {
          const H = (F > 0 ? 0.5 : 0.4) * l * $ * (C ? 1.15 : 1),
            R = Math.sin(P * 41 + M + F) > 0.9 ? 9 : 0,
            A = (58 - 26 * P + R + (C ? c(-25, 25) : c(-2, 2))) * Et * F,
            G = Math.cos(A),
            j = Math.sin(A),
            O = w * G - b * j,
            W = w * j + b * G,
            Y = T + O * H,
            dt = k + W * H,
            [it, ht, V] = a(P),
            pt = F > 0 ? 1 : 0.9,
            lt = c(0.9, 1.06);
          ((d.strokeStyle = `rgba(${(it * pt * lt) | 0},${(ht * pt * lt) | 0},${(V * pt * lt) | 0},${C ? 0.32 : 0.8})`),
            (d.lineWidth = C ? 0.45 : 0.55),
            d.beginPath(),
            d.moveTo(T, k),
            d.quadraticCurveTo(
              T + O * H * 0.55 + w * H * 0.12,
              k + W * H * 0.55 + b * H * 0.12,
              Y + w * H * 0.1,
              dt + b * H * 0.1,
            ),
            d.stroke());
        }
      }
      for (let u = 0; u < 40; u++) {
        const P = u / 40,
          T = (u + 1) / 40,
          [k, m] = y(P),
          [h, S] = y(T);
        ((d.strokeStyle = `rgba(245,236,214,${P < 0.07 ? 0.55 : 0.9})`),
          (d.lineWidth = L(1.7, 0.3, P)),
          d.beginPath(),
          d.moveTo(k, m),
          d.lineTo(h, S),
          d.stroke());
      }
      return { c: r, w: l, h: e };
    }
    const Fe = [],
      Vo = () => {
        Fe.length || ["adler", "eule", "weiss", "adler"].forEach((e, t) => Fe.push(ja(t < 2 ? 120 : 96, e)));
      };
    let Ot = null;
    function Va() {
      Vo();
      const e = 2,
        t = 36,
        o = 120,
        l = 270,
        a = o / 2,
        r = t + 10,
        d = document.createElement("canvas");
      ((d.width = o * e), (d.height = l * e));
      const s = d.getContext("2d");
      (s.scale(e, e),
        (s.lineCap = "round"),
        [
          [-38, 70, 0],
          [0, 100, 2],
          [38, 66, 1],
        ].forEach(([i, y, v]) => {
          const M = (90 + i) * Et,
            n = a + Math.cos(M) * t,
            u = r + Math.sin(M) * t,
            P = n,
            T = u + y;
          ((s.strokeStyle = "rgba(190,160,120,.9)"),
            (s.lineWidth = 0.8),
            s.beginPath(),
            s.moveTo(n, u),
            s.lineTo(P, T),
            s.stroke(),
            [
              [0.35, "#3fb5ad", 3.2],
              [0.55, "#8b5e34", 2.6],
            ].forEach(([h, S, w]) => {
              const b = s.createRadialGradient(n - w * 0.3, u + y * h - w * 0.3, 0, n, u + y * h, w);
              (b.addColorStop(0, "#fff"),
                b.addColorStop(0.25, S),
                b.addColorStop(1, "#1b1410"),
                (s.fillStyle = b),
                s.beginPath(),
                s.arc(n, u + y * h, w, 0, E),
                s.fill());
            }));
          const k = Fe[v],
            m = (v === 2 ? 62 : 54) / k.h;
          (s.save(),
            s.translate(P, T - 2),
            s.rotate(Math.PI + c(-0.06, 0.06)),
            s.scale(m, m),
            s.drawImage(k.c, -k.w / 2, -k.h, k.w, k.h),
            s.restore());
        }));
      const p = 9;
      let f = Array.from({ length: p }, (i, y) => {
        const v = (-90 + (y * 360) / p) * Et;
        return [a + Math.cos(v) * (t - 2), r + Math.sin(v) * (t - 2)];
      });
      ((s.strokeStyle = "rgba(150,118,84,.8)"), (s.lineWidth = 0.5));
      for (let i = 0; i < 6; i++) {
        const y = f.map((v, M) => {
          const n = f[(M + 1) % p],
            u = [(v[0] + n[0]) / 2, (v[1] + n[1]) / 2];
          return [L(u[0], a, 0.14), L(u[1], r, 0.14)];
        });
        (s.beginPath(),
          f.forEach((v, M) => {
            const n = y[M];
            (M === 0 ? s.moveTo(v[0], v[1]) : s.lineTo(v[0], v[1]), s.lineTo(n[0], n[1]));
          }),
          s.closePath(),
          s.stroke(),
          (f = y));
      }
      ([
        [a, r, 2.8, "#3fb5ad"],
        [a + 11, r - 8, 1.8, "#d9b25a"],
      ].forEach(([i, y, v, M]) => {
        const n = s.createRadialGradient(i - v * 0.3, y - v * 0.3, 0, i, y, v);
        (n.addColorStop(0, "#fff"),
          n.addColorStop(0.3, M),
          n.addColorStop(1, "#14100c"),
          (s.fillStyle = n),
          s.beginPath(),
          s.arc(i, y, v, 0, E),
          s.fill());
      }),
        (s.strokeStyle = "#5e3f27"),
        (s.lineWidth = 3.4),
        s.beginPath(),
        s.arc(a, r, t, 0, E),
        s.stroke());
      for (let i = 0; i < 90; i++) {
        const y = (i / 90) * E,
          v = a + Math.cos(y) * (t - 1.8),
          M = r + Math.sin(y) * (t - 1.8),
          n = y + 0.05,
          u = a + Math.cos(n) * (t + 1.8),
          P = r + Math.sin(n) * (t + 1.8);
        ((s.strokeStyle = `rgba(${150 + (i % 3) * 18},${108 + (i % 3) * 12},${70 + (i % 3) * 8},.85)`),
          (s.lineWidth = 0.9),
          s.beginPath(),
          s.moveTo(v, M),
          s.lineTo(u, P),
          s.stroke());
      }
      return (
        (s.strokeStyle = "rgba(230,200,150,.35)"),
        (s.lineWidth = 0.6),
        s.beginPath(),
        s.arc(a, r, t + 1.2, -2.4, -0.8),
        s.stroke(),
        (s.strokeStyle = "rgba(190,160,120,.9)"),
        (s.lineWidth = 0.8),
        s.beginPath(),
        s.ellipse(a, r - t - 4, 2.5, 4, 0, 0, E),
        s.stroke(),
        { c: d, w: o, h: l, top: r - t - 8 }
      );
    }
    const Mt = { v: 0, ang: 0, angV: 0 },
      Me = [];
    function Ua() {
      if ((Me.forEach((o) => o.el.remove()), (Me.length = 0), !Kt("fxVines") || innerWidth < 1100 || !te[2])) return;
      [
        [0, 0],
        [0, 1],
      ].forEach(([o, l]) => {
        const a = document.createElement("div");
        ((a.className = "es-vine"),
          (a.innerHTML = `<img alt="" src="${te[2]}">`),
          Tt.appendChild(a),
          Me.push({ el: a, side: o, part: l, ph: c(0, E), x: l ? 14 : 4 }));
      });
      const e = te[8] || "https://cdn.shopify.com/s/files/1/0797/8310/0743/files/es-roots.webp?v=1790929689",
        t = document.createElement("div");
      ((t.className = "es-vine es-vine--roots"),
        (t.innerHTML = `<img alt="" src="${e}">`),
        (t.style.width = "120px"),
        (t.style.transformOrigin = "70% 100%"),
        Tt.appendChild(t),
        Me.push({ el: t, roots: !0, ph: c(0, E), x: innerWidth - 124 }));
    }
    function Za(e, t, o, l) {
      for (const a of Me) {
        const r = a.el.offsetHeight || 200;
        if (a.roots) {
          const p = tt((e - 0.1) / 0.6);
          ((a.el.style.opacity = 0.55 * t * (1 - l) * (p > 0 ? 1 : 0)),
            (a.el.style.clipPath = `inset(${(1 - Nt(p)) * 100}% 0 0 0)`),
            (a.el.style.transform = `translate(${a.x}px, ${innerHeight - r + 6}px) rotate(${Math.sin(o * 0.35 + a.ph) * 0.6}deg)`));
          continue;
        }
        const d = tt((e - a.part * 0.42) / 0.45);
        ((a.el.style.opacity = 0.5 * t * (1 - l) * (d > 0 ? 1 : 0)),
          (a.el.style.clipPath = `inset(0 0 ${(1 - Nt(d)) * 100}% 0)`));
        const s = a.part ? r * 0.55 : -r * 0.06;
        a.el.style.transform = `translate(${a.x}px, ${s}px) scaleX(${a.side ? -1 : 1}) rotate(${Math.sin(o * 0.6 + a.ph) * 1.2}deg)`;
      }
    }
    const Uo = parseInt(zt.pieces, 10),
      Ja = isNaN(Uo) ? 3 : Math.max(0, Math.round(Uo / 3)),
      so = (parseInt(zt.size, 10) || 6) / 6,
      Zo = te
        .slice(4, 8)
        .filter(Boolean)
        .map((e) => {
          const t = new Image();
          return ((t.src = e), t);
        }),
      Ft = [];
    let Jo = 0;
    function Xa(e) {
      const t = innerWidth,
        o = innerHeight,
        l = Kt("fxFeathers"),
        a = Math.random();
      if (l && a < 0.26) {
        Vo();
        const r = Pt(Fe);
        Ft.push({
          kind: "feather",
          F: r,
          x0: c(0.08, 0.92) * t,
          x: 0,
          y: -60,
          ph: c(0, E),
          om: c(1.1, 1.6),
          A: c(28, 55),
          vf: c(26, 38),
          tilt: c(-0.3, 0.3),
          sc: c(0.55, 0.8) * so,
          wind: c(-6, 6),
          life: 0,
          ttl: 60,
          op: 0,
          depth: c(0.2, 0.5),
        });
      } else if (a < 0.52 && Zo.length)
        Ft.push({
          kind: "leaf",
          img: Pt(Zo),
          x0: c(0.05, 0.95) * t,
          x: 0,
          y: -40,
          ph: c(0, E),
          om: c(1.4, 2.1),
          A: c(20, 40),
          vf: c(34, 50),
          tilt: c(0, E),
          sc: c(0.45, 0.75) * so,
          wind: c(-10, 10),
          life: 0,
          ttl: 60,
          op: 0,
          depth: c(0.2, 0.5),
        });
      else if (a < 0.7) {
        const r = c(0.1, 0.9) * t,
          d = Math.floor(c(3, 6));
        for (let s = 0; s < d; s++)
          Ft.push({
            kind: "ember",
            x: r + c(-30, 30),
            y: o + c(0, 40),
            vx: c(-6, 6),
            vy: -c(28, 46),
            life: -s * c(0.2, 0.5),
            ttl: c(6, 9),
            s: c(4, 8),
            ph: c(0, E),
            tw: c(2, 5),
            star: c(0.45, 0.6),
            op: 1,
            depth: c(0.1, 0.3),
          });
      } else if (a < 0.86) {
        const r = Math.random() < 0.5;
        Ft.push({
          kind: "trickle",
          x: (r ? c(0.02, 0.1) : c(0.9, 0.98)) * t,
          y: c(-0.05, 0.2) * o,
          v: 0,
          go: !0,
          until: 0,
          trail: [],
          r: c(2.4, 4.2),
          life: 0,
          ttl: c(9, 14),
          op: 0,
          depth: 0,
        });
      } else
        Ft.push({
          kind: "wave",
          dir: Math.random() < 0.5 ? 1 : -1,
          life: 0,
          ttl: c(6, 8),
          amp: c(10, 18),
          op: 1,
          ph: c(0, E),
          depth: 0,
        });
      Jo = e + (Math.random() < 0.22 ? c(9, 15) : c(2.8, 7));
    }
    const xe = [];
    function ze(e, t, o) {
      if (xe.length > 60) return;
      const l = Pt(
        o === "fire"
          ? ["255,170,80", "255,120,50", "255,214,140"]
          : o === "water"
            ? ["150,220,240", "200,240,255"]
            : ["244,223,176", "190,225,130"],
      );
      xe.push({
        x: e,
        y: t,
        vx: c(-12, 12),
        vy: o === "fire" ? c(-40, -18) : o === "water" ? c(10, 30) : c(-10, 10),
        r: c(0.8, 2),
        life: 0,
        ttl: c(1, 2.2),
        c: l,
      });
    }
    function Qa() {
      const e = Math.min(devicePixelRatio || 1, 1.5);
      ((Ee.width = innerWidth * e), (Ee.height = innerHeight * e), z.setTransform(e, 0, 0, e, 0, 0));
    }
    function Ka(e, t, o, l, a, r, d, s) {
      const p = innerWidth,
        f = innerHeight,
        i = z;
      (i.clearRect(0, 0, p, f),
        l > 0 && a < 0.3 && e > Jo && Ft.filter((M) => M.kind !== "ember").length < Ja && Xa(e));
      const y = (M, n) => [L(M, r.x, a), L(n, r.y, a)],
        v = (M, n, u) => {
          for (const P of d)
            if (M + u > P.left - 14 && M - u < P.right + 14 && n + u > P.top - 14 && n - u < P.bottom + 14) return 0.12;
          return 1;
        };
      for (let M = Ft.length - 1; M >= 0; M--) {
        const n = Ft[M];
        if (((n.life += t), n.life < 0)) continue;
        const u = -o * n.depth;
        let P = n.life > n.ttl;
        if (n.kind === "feather" || n.kind === "leaf") {
          n.ph += n.om * t;
          const T = Math.sin(n.ph);
          ((n.x0 += n.wind * t),
            (n.x = n.x0 + n.A * T),
            (n.y += n.vf * (0.45 + 0.55 * Math.abs(Math.cos(n.ph))) * t + u),
            (P = P || n.y > f + 80 || n.y < -160),
            (n.op += (v(n.x, n.y, 30) - n.op) * 0.06));
          const [k, m] = y(n.x, n.y),
            h = 1 - a * 0.85;
          if (
            (i.save(),
            i.translate(k, m),
            (i.globalAlpha = n.op * Math.min(1, n.life / 1.5) * l * 0.92),
            n.kind === "feather")
          ) {
            const S = n.F,
              w = n.sc * h;
            (i.rotate(Math.PI / 2 + n.tilt + Math.cos(n.ph) * 0.55),
              i.scale(w * (0.75 + 0.25 * Math.abs(Math.cos(n.ph * 0.5))), w),
              (i.shadowColor = "rgba(40,30,20,.18)"),
              (i.shadowBlur = 6),
              (i.shadowOffsetY = 3),
              i.drawImage(S.c, -S.w / 2, -S.h / 2, S.w, S.h));
          } else {
            const S = n.img,
              w = n.sc * h;
            (i.rotate(n.tilt + Math.cos(n.ph) * 0.7),
              i.scale(w * Math.cos(n.ph * 0.8), w),
              S.complete && S.naturalWidth && i.drawImage(S, -S.naturalWidth / 2, -S.naturalHeight / 2));
          }
          i.restore();
        } else if (n.kind === "ember") {
          ((n.vx += Math.sin(e * 1.3 + n.ph) * 6 * t), (n.x += n.vx * t), (n.y += n.vy * t + u), (n.vy *= 0.997));
          const T = n.life / n.ttl,
            [k, m] = y(n.x, n.y);
          if (T < n.star) {
            i.globalAlpha = l * Math.min(1, T * 12) * 0.85 * v(k, m, 4);
            const h = n.s * (1 - (T / n.star) * 0.4);
            i.drawImage(st.ember, k - h / 2, m - h / 2, h, h);
          } else {
            const h = (T - n.star) / (1 - n.star),
              S = 0.55 + 0.45 * Math.sin(n.life * n.tw + n.ph);
            ((i.globalAlpha = l * Math.min(1, h * 4) * (1 - h * h) * S * 0.8 * v(k, m, 4)), (i.fillStyle = "#d9a440"));
            const w = n.s * 0.45;
            (i.beginPath(),
              i.moveTo(k, m - w * 2),
              i.lineTo(k + w * 0.35, m),
              i.lineTo(k, m + w * 2),
              i.lineTo(k - w * 0.35, m),
              i.closePath(),
              i.fill(),
              i.beginPath(),
              i.moveTo(k - w * 2, m),
              i.lineTo(k, m + w * 0.35),
              i.lineTo(k + w * 2, m),
              i.lineTo(k, m - w * 0.35),
              i.closePath(),
              i.fill());
          }
        } else if (n.kind === "trickle") {
          (e > n.until && ((n.go = !n.go), (n.until = e + (n.go ? c(0.5, 1.6) : c(0.4, 1.8)))),
            (n.v += ((n.go ? c(40, 70) : 0) - n.v) * Math.min(1, t * 5)),
            (n.y += n.v * t),
            (n.x += Math.sin(n.y * 0.03) * 0.15),
            n.v > 5 && n.trail.push(n.x, n.y),
            n.trail.length > 240 && n.trail.splice(0, 2),
            (P = P || n.y > f + 20),
            (n.op = Math.min(1, n.life / 0.8) * (1 - B(n.life, [n.ttl - 1.5, n.ttl]))));
          const T = n.op * l * (1 - a);
          if (n.trail.length > 4) {
            ((i.globalAlpha = T * 0.35),
              (i.strokeStyle = "rgba(90,170,210,.8)"),
              (i.lineWidth = 1.1),
              (i.lineCap = "round"),
              i.beginPath(),
              i.moveTo(n.trail[0], n.trail[1]));
            for (let h = 2; h < n.trail.length; h += 2) i.lineTo(n.trail[h], n.trail[h + 1]);
            i.stroke();
          }
          const k = 1 + Math.min(0.4, n.v / 150),
            m = i.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.4, 0, n.x, n.y, n.r * k);
          (m.addColorStop(0, "rgba(255,255,255,.95)"),
            m.addColorStop(0.35, "rgba(160,215,235,.55)"),
            m.addColorStop(0.85, "rgba(60,140,190,.45)"),
            m.addColorStop(1, "rgba(40,110,160,.15)"),
            (i.globalAlpha = T),
            (i.fillStyle = m),
            i.beginPath(),
            i.ellipse(n.x, n.y, n.r, n.r * k, 0, 0, E),
            i.fill());
        } else if (n.kind === "wave") {
          const T = n.life / n.ttl,
            k = n.dir > 0 ? L(-0.15, 1.15, T) * p : L(1.15, -0.15, T) * p,
            m = Math.sin(Math.PI * T) * l * (1 - a) * 0.5,
            h = f - 6;
          ((i.globalAlpha = m), (i.lineCap = "round"));
          for (const [b, C, $] of [
            ["rgba(47,134,184,.55)", 3, 0],
            ["rgba(201,242,255,.9)", 1, -2],
          ]) {
            ((i.strokeStyle = b), (i.lineWidth = C), i.beginPath());
            for (let F = 0; F <= 60; F++) {
              const H = F / 60,
                R = k - n.dir * H * p * 0.55,
                A = Math.pow(1 - H, 2) * (1 - Math.exp(-H * 18)),
                G = h - n.amp * A * 2.2 + Math.sin(H * 22 + e * 2 + n.ph) * 2 * (1 - H) + $;
              F ? i.lineTo(R, G) : i.moveTo(R, G);
            }
            i.stroke();
          }
          const S = k - n.dir * p * 0.02,
            w = h - n.amp * 0.9;
          ((i.strokeStyle = "rgba(201,242,255,.85)"), (i.lineWidth = 1.2), i.beginPath());
          for (let b = 0; b <= 24; b++) {
            const C = (b / 24) * 4.2,
              $ = n.amp * 0.55 * (1 - b / 30),
              F = S + n.dir * Math.sin(C) * $,
              H = w - Math.cos(C) * $;
            b ? i.lineTo(F, H) : i.moveTo(F, H);
          }
          (i.stroke(), (i.fillStyle = "#f2fdff"));
          for (let b = 0; b < 6; b++)
            ((i.globalAlpha = m * c(0.3, 0.9)),
              i.beginPath(),
              i.arc(S + c(-8, 8), w - n.amp * c(0.3, 0.9), c(0.5, 1.3), 0, E),
              i.fill());
        }
        P && Ft.splice(M, 1);
      }
      if (Kt("fxFeathers") && p >= 760) {
        const M = l * (1 - a) * (s > 0.18 && s < 0.62 ? 1 : 0);
        if (((Mt.v += (M - Mt.v) * Math.min(1, t * 0.9)), Mt.v > 0.01)) {
          (Ot || (Ot = Va()),
            (Mt.angV += (-Mt.ang * 2.2 - Mt.angV * 0.55 + o * 9e-4) * t * 4 + Math.sin(e * 0.7) * 0.002),
            (Mt.ang += Mt.angV * t));
          const n = 0.82 * so,
            u = p - (p >= 1100 ? 150 : 74),
            P = L(-Ot.h * n, 70, Nt(Mt.v));
          ((i.globalAlpha = 0.9 * Mt.v),
            (i.strokeStyle = "rgba(160,130,95,.6)"),
            (i.lineWidth = 0.7),
            i.beginPath(),
            i.moveTo(u, 0),
            i.lineTo(u + Math.sin(Mt.ang) * P, Math.max(0, P)),
            i.stroke(),
            i.save(),
            i.translate(u + Math.sin(Mt.ang) * P, P),
            i.rotate(Mt.ang),
            i.scale(n, n),
            i.drawImage(Ot.c, -Ot.w / 2, -Ot.top, Ot.w, Ot.h),
            i.restore());
        }
      }
      for (let M = xe.length - 1; M >= 0; M--) {
        const n = xe[M];
        if (((n.life += t), n.life > n.ttl)) {
          xe.splice(M, 1);
          continue;
        }
        (a > 0 && ((n.x = L(n.x, r.x, 0.06 * a)), (n.y = L(n.y, r.y, 0.06 * a))),
          (n.x += n.vx * t),
          (n.y += n.vy * t),
          (n.vx *= 0.99),
          (i.globalAlpha = Math.sin((Math.PI * n.life) / n.ttl) * l * 0.9),
          (i.fillStyle = `rgb(${n.c})`),
          i.beginPath(),
          i.arc(n.x, n.y, n.r, 0, E),
          i.fill());
      }
      i.globalAlpha = 1;
    }
    const Lt = new Map(),
      Be = new Set(),
      io = new IntersectionObserver(
        (e) => e.forEach((t) => (t.isIntersecting ? Be.add(t.target) : Be.delete(t.target))),
        { rootMargin: "60px" },
      ),
      Xo = (e) =>
        X.contains(e) || e.closest('header, footer, .header-wrapper, sticky-header, [role="dialog"], .drawer, .es-fx');
    let tn = 0;
    function ro() {
      const e = ["water", "fire", "plants", "gold"];
      (Kt("fxHeadings") &&
        document
          .querySelectorAll("main h1, main h2, main h3, #MainContent h1, #MainContent h2, #MainContent h3")
          .forEach((t) => {
            if (Lt.has(t) || Xo(t) || t.textContent.trim().length < 3) return;
            const o = e[Lt.size % 4],
              l = document.createElementNS(lo, "g");
            ((l.innerHTML = `<path fill="none" stroke="${Lo(o)}" stroke-width="2.2" stroke-linecap="round"/><circle r="2.6" fill="${Oe[o][0]}" opacity="0"/>`),
              ye.appendChild(l),
              Lt.set(t, { kind: o, g: l, path: l.firstChild, spot: l.lastChild, heading: !0, drawn: -1, w: 0 }),
              io.observe(t));
          }),
        Kt("fxImages") &&
          document.querySelectorAll("main img, #MainContent img").forEach((t) => {
            if (Lt.has(t) || Xo(t) || t.closest(".esz-tor, .es-team")) return;
            const o = t.getBoundingClientRect();
            if (o.width < 200 || o.height < 140) return;
            const l = e[(Lt.size + 1) % 4],
              a = document.createElementNS(lo, "g");
            ((a.innerHTML = `<rect fill="none" stroke="${Oe[l][1]}" stroke-opacity=".18" stroke-width="1"/><rect fill="none" stroke="${Lo(l, !0)}" stroke-width="1.6" stroke-linecap="round"/>`),
              ye.appendChild(a),
              Lt.set(t, {
                kind: l,
                g: a,
                faint: a.firstChild,
                run: a.lastChild,
                heading: !1,
                speed: c(0.06, 0.1),
                off: Math.random(),
              }),
              io.observe(t));
          }));
    }
    const co = (e) => {
      const t = document.createRange();
      t.selectNodeContents(e);
      const o = t.getBoundingClientRect();
      return o.width ? o : e.getBoundingClientRect();
    };
    function en(e, t, o) {
      for (const [l, a] of Lt) {
        if (!Be.has(l) || o <= 0) {
          a.g.style.display = "none";
          continue;
        }
        if (((a.g.style.display = ""), a.heading)) {
          const r = co(l),
            d = Math.min(r.width, innerWidth - 32),
            s = r.bottom + 7;
          (Math.abs(d - a.w) > 1 &&
            ((a.w = d),
            a.path.setAttribute("d", `M0 0 C ${d * 0.28} -5, ${d * 0.52} 6, ${d * 0.76} -1 S ${d * 0.95} -3, ${d} 1`),
            (a.len = (() => {
              try {
                return a.path.getTotalLength() || 300;
              } catch {
                return 300;
              }
            })()),
            (a.path.style.strokeDasharray = a.len)),
            a.g.setAttribute("transform", `translate(${r.left + (r.width - d) / 2} ${s})`),
            a.drawn < 0 && r.top < innerHeight * 0.85 && (a.drawn = t));
          const p = a.drawn < 0 ? 0 : Nt(tt((t - a.drawn) / 1600));
          if (((a.path.style.strokeDashoffset = a.len * (1 - p)), (a.g.style.opacity = o), p > 0 && p < 1)) {
            const f = a.path.getPointAtLength(a.len * p);
            (a.spot.setAttribute("cx", f.x),
              a.spot.setAttribute("cy", f.y),
              a.spot.setAttribute("opacity", Math.sin(Math.PI * p)),
              Math.random() < 0.3 &&
                ze(r.left + (r.width - d) / 2 + f.x, s + f.y, a.kind === "gold" ? "plants" : a.kind));
          } else a.spot.setAttribute("opacity", 0);
        } else {
          const r = l.getBoundingClientRect(),
            d = 7,
            s = (parseFloat(getComputedStyle(l).borderTopLeftRadius) || 0) + d,
            p = r.width + d * 2,
            f = r.height + d * 2,
            i = 2 * (p + f);
          for (const y of [a.faint, a.run])
            (y.setAttribute("x", r.left - d),
              y.setAttribute("y", r.top - d),
              y.setAttribute("width", p),
              y.setAttribute("height", f),
              y.setAttribute("rx", s));
          ((a.run.style.strokeDasharray = `${i * 0.14} ${i * 0.86}`),
            (a.run.style.strokeDashoffset = -((e * a.speed + a.off) % 1) * i),
            (a.g.style.opacity = o));
        }
      }
    }
    let bt = 200,
      we = 0,
      He = 0,
      Qo = -1;
    function ho() {
      ((bt = Pe.offsetWidth), wa(), Qa(), To(), Wa(), Ua(), fa(), Do());
    }
    const on = (zt.reunion || "Du bist Neo").toLowerCase();
    let Qt = null,
      an = 0;
    function nn() {
      let e = null;
      for (const t of document.querySelectorAll("h1,h2,h3,h4,h5,h6,p"))
        if (
          !(X.contains(t) || Tt.contains(t) || t.closest("header, footer")) &&
          t.textContent.trim().toLowerCase().startsWith(on)
        ) {
          e = t;
          break;
        }
      return e;
    }
    const xt = [];
    let ve = -9,
      Ko = !1,
      ta = "";
    const ea = {
        g: "drop-shadow(0 0 5px rgba(255,214,140,.9)) drop-shadow(0 0 14px rgba(232,176,72,.55)) drop-shadow(0 0 28px rgba(255,200,110,.25))",
        s: "drop-shadow(0 0 5px rgba(240,244,252,.95)) drop-shadow(0 0 14px rgba(196,208,228,.6)) drop-shadow(0 0 28px rgba(220,228,245,.25))",
      },
      oa = "gggsgggssggggsggsss gggg".replace(/ /g, "");
    let D = 0,
      aa = performance.now(),
      na = scrollY,
      St = 0,
      ln = 0,
      fo = 0;
    let laErr = 0;
    function la(e) {
      try {
        la0(e);
      } catch (err) {
        (laErr++ < 3 && console.warn("[es] frame", err), requestAnimationFrame(la));
      }
    }
    function la0(e) {
      const t = e / 1e3,
        o = Math.min(0.05, (e - aa) / 1e3);
      aa = e;
      const l = innerWidth,
        a = innerHeight,
        Hw = HW.tick(),
        r0 = X.getBoundingClientRect(),
        r = { top: r0.top + Hw.off, bottom: r0.bottom + Hw.off, height: r0.height, left: r0.left, width: r0.width },
        d = tt(-r.top / Math.max(1, r.height - a));
      ((D += (d - D) * 0.12), Math.abs(d - D) < 4e-4 && (D = d));
      const s = tt((a - r.top) / a),
        p = scrollY - na;
      ((na = scrollY), (fo += ((o > 0 ? p / o : 0) - fo) * 0.25));
      const f = document.documentElement.scrollHeight;
      ++an % 90 === 1 && (!Qt || !Qt.isConnected) && (Qt = nn());
      let i = null;
      if (Qt && r.bottom < a * 0.6) {
        const C = Qt.getBoundingClientRect(),
          $ = C.left + C.width / 2,
          F = C.bottom + Math.max(14, Math.min(34, a * 0.035)),
          H = f - a;
        let A = F + scrollY - a * 0.62;
        (H - A < 160 && (A = H - 160),
          (St = tt((Hw.eff - A) / Math.max(1, H - A))),
          (i = { x: $, y: F, appear: tt((a * 0.98 - F) / (a * 0.22)) }));
      } else St = et(tt((Hw.eff + a - (f - a * 1.1)) / (a * 0.9)));
      const y = r.bottom < a * 0.6,
        v = (y ? 1 : B(D, Z.page)) * (1 - B(St, [0.85, 1]));
      if ((ga(t, o, r, a), r.bottom > -50 && r.top < a + 50)) {
        const C = et(B(D, Z.light)),
          $ = B(D, Z.merge),
          F = et(B(D, Z.cosmos)),
          H = B(D, Z.plants);
        (va(D, t),
          Pa(D, et(B(D, Z.light))),
          Ia(t),
          ko(q, _t),
          Ea(t, o, Ct * 0.8 * (1 - C)),
          (mo.style.transform = `scale(${C * C})`),
          (Le.style.opacity = 1 - C),
          Le.style.setProperty("--es-neb", (1 + 1.1 * et(B(D, Z.haze)) * (1 - B(D, Z.cosmos))).toFixed(3)),
          bo && (bo.style.opacity = 1 - B(D, [0, 0.08])),
          (we = t * 3 + D * 70));
        const R = et(B(D, [0.02, 0.52])) * (1 - et(B(D, [0.6, 0.8])) * 0.4),
          A =
            (1 + 0.38 * R) *
            (1 + 0.01 * Math.sin(t * 0.8)) *
            (1 + (rt ? Math.exp(-(((rt.r - bt * 0.5) / (bt * 0.35)) ** 2)) * rt.amp * 0.025 : 0));
        ((He = R), (Pe.style.transform = `rotate(${we}deg) scale(${A})`));
        const G = 1 - B(D, [0.66, 0.8]);
        Ge.style.opacity = G;
        const j = et(B(D, Z.haze));
        if (Math.abs(j - Qo) > 0.002) {
          Qo = j;
          const V =
            j < 0.005
              ? "none"
              : `radial-gradient(circle closest-side, #000 ${(99 - 24 * j).toFixed(1)}%, transparent ${(100.5 + 3 * j).toFixed(1)}%)`;
          ((Ge.style.webkitMaskImage = Ge.style.maskImage = V), (Mo.style.opacity = 1 - j * 0.25));
        }
        ((ca.style.opacity =
          (0.3 + 0.4 * Math.sin(Math.PI * $) + 0.2 * B(D, Z.stars) + 0.5 * Math.sin(Math.PI * F)) * G),
          (yo.style.opacity = Math.sin(Math.PI * $) * 0.6),
          (yo.style.transform = `scale(${1 + $ * 0.25})`));
        const O = rt ? Math.exp(-(((rt.r - bt * 0.3) / (bt * 0.5)) ** 2)) * rt.amp : 0,
          W = et(B(D, Z.live)) * (1 - F * 0.6) + O * 1.6;
        ((Le.style.filter = rt ? `hue-rotate(${(Math.sin(rt.r * 0.01) * 14 * rt.amp).toFixed(1)}deg)` : ""),
          ++ln % 3 === 0 &&
            Ne &&
            De &&
            je &&
            (Ne.turb.setAttribute(
              "baseFrequency",
              `${(0.034 + 0.006 * Math.sin(t * 0.42)).toFixed(4)} ${(0.078 + 0.014 * Math.sin(t * 0.31 + 1)).toFixed(4)}`,
            ),
            Ne.disp.setAttribute("scale", (W * 2.3 * Ct + 0.4).toFixed(2)),
            De.turb.setAttribute(
              "baseFrequency",
              `${(0.06 + 0.012 * Math.sin(t * 1.9)).toFixed(4)} ${(0.03 + 0.01 * Math.sin(t * 2.6 + 2)).toFixed(4)}`,
            ),
            De.disp.setAttribute("scale", (W * 1.7 * Ct + 0.3).toFixed(2)),
            je.turb.setAttribute(
              "baseFrequency",
              `${(0.02 + 0.004 * Math.sin(t * 0.27)).toFixed(4)} ${(0.022 + 0.004 * Math.sin(t * 0.23 + 3)).toFixed(4)}`,
            ),
            je.disp.setAttribute("scale", (W * 1.1 * Ct).toFixed(2))));
        const Y = (V) => Math.sin(V * 0.33) * 0.6 + Math.sin(V * 0.81 + 1.3) * 0.28 + Math.sin(V * 1.9 + 0.4) * 0.08;
        for (const V of Ue) {
          const pt = tt((H - V.at * 0.7) / 0.3),
            lt = 1 - Math.pow(1 - pt, 2.2),
            Gt = V.leaf ? 9 : V.hang ? 6 : 4,
            It = Y(t - V.i * 0.35) * Gt * lt,
            I = (1 - lt) * -50 * (V.flip || 1),
            U = V.flip === -1 ? -1 : 1,
            J = 0.05 + 0.95 * lt;
          V.img.style.opacity = tt(pt * 4) * (1 - F) * G;
          const ot = V.hang ? -(we + V.a - 90 + V.tilt) : 0;
          V.img.style.transform = `rotate(${I + It + ot}deg) scale(${J}, ${J * U})`;
        }
        const dt = Math.max(0.6, bt / 270),
          it = bt * A * 0.47;
        (ka(t, it), Ra(t, o, dt, it), Ma(t, o, D, s, a));
        const ht = Math.max(et(B(D, Z.dusk)), B(d, [Z.dusk[0] + 0.01, Z.dusk[1] - 0.015]), r.bottom < a * 1.04 ? 1 : 0);
        if (((jt.style.opacity = ht.toFixed(3)), ht > 0.995 && (mo.style.transform = "scale(0)"), Dt)) {
          const V = et(B(D, Z.cta));
          ((Dt.style.opacity = V),
            (Dt.style.transform = `scale(${0.9 + 0.1 * V})`),
            (Dt.style.pointerEvents = V > 0.6 ? "auto" : "none"));
        }
      }
      const M = qa();
      let n = null;
      const u = et(B(s, [0.3, 1])),
        P = Pe.getBoundingClientRect(),
        T = P.left + P.width / 2,
        k = P.top + P.height / 2;
      if (K || Re) {
        let C = null;
        if (yt)
          if (Hw.back) {
            (N.h = null), ($t.length = 0);
            N.bk || (N.bk = { t0: t, x: Gx.x || M.x, y: Gx.y || M.y, w: Gx.w || M.w });
            const u2 = et(tt((t - N.bk.t0) / 0.5)),
              ar = Math.sin(Math.PI * u2);
            ((N.bk.done = u2 >= 1),
              (C = {
                x: L(N.bk.x, M.x, u2),
                y: L(N.bk.y, M.y, u2) - ar * Math.min(70, M.w),
                w: L(N.bk.w, M.w, u2),
                op: u2 >= 1 ? 0 : 1,
                rot: 0,
                filter: ea.g,
                dot: 0,
                sp: { x: L(N.bk.x, M.x, u2), y: L(N.bk.y, M.y, u2) - ar * Math.min(70, M.w), a: ar },
              }));
          } else {
            N.bk && ((N.rt = { t0: t }), (N.bk = null));
            C = za(t, M, T, k);
            if (C && N.rt) {
              const u3 = et(tt((t - N.rt.t0) / 0.5));
              u3 >= 1
                ? (N.rt = null)
                : ((C.x = L(M.x, C.x, u3)),
                  (C.y = L(M.y, C.y, u3) - Math.sin(Math.PI * u3) * Math.min(70, M.w)),
                  (C.w = L(M.w, Math.max(C.w, M.w * 0.5), u3)),
                  (C.op = 1),
                  (C.dot = C.dot * u3));
            }
          }
        n = C;
        let $ = u > 0 && D < Z.merge[1] + 0.02,
          F = L(M.x, T, u),
          H = L(M.y, k, u),
          R = L(M.w, 6, Math.pow(u, 0.6)),
          A = $ ? 1 - B(u, [0.55, 0.85]) : 0,
          G = $ ? B(u, [0.35, 0.7]) * (1 - B(D, Z.merge)) : 0;
        (C &&
          (($ = !0),
          (F = C.x),
          (H = C.y),
          (R = Math.max(1, C.w)),
          (A = C.op),
          (G = C.dot * (r.top <= 0 ? 1 - B(D, Z.merge) : 1)),
          ft.firstChild.style.filter !== C.filter && (ft.firstChild.style.filter = C.filter)),
          (ft.style.opacity = A),
          A > 0.05 && ((Gx.x = F), (Gx.y = H), (Gx.w = R)),
          (ft.style.width = ft.style.height = R.toFixed(1) + "px"),
          (ft.style.transform = `translate3d(${(F - R / 2).toFixed(1)}px, ${(H - R / 2).toFixed(1)}px, 0)`),
          (ft.firstChild.style.transform = `rotate(${(C ? C.rot : u * 220).toFixed(2)}deg)`));
        let j = F,
          O = H,
          W = G,
          Y = 1 + 0.15 * Math.sin(t * 3);
        if (i && i.appear > 0 && !window.ESZ) {
          const lt = Math.pow(St, 2.2);
          ((j = L(i.x, M.x, lt) + Math.sin(Math.PI * lt) * Math.min(90, l * 0.12)),
            (O = L(i.y, M.y, lt)),
            (W = i.appear * (1 - B(St, [0.94, 1]))),
            (Y = (1 + 0.25 * Math.sin(t * 4.2) * (1 - lt)) * (1 + lt * 0.6)),
            lt > 0.02 && lt < 0.98 ? (xt.push(j, O), xt.length > 36 && xt.splice(0, 2)) : (xt.length = 0),
            Math.random() < 0.12 * (1 - lt) && ze(j + c(-4, 4), O + c(-4, 4), "plants"));
        } else if (y && !Qt && !window.ESZ) {
          const lt = 1 - B(St, [0.7, 0.95]);
          (lt > G && ((j = M.x), (O = M.y), (W = lt * (0.75 + 0.25 * Math.sin(t * 2.2)))), (xt.length = 0));
        } else xt.length = 0;
        ((We.style.opacity = Hw.back ? 0 : W), (We.style.transform = `translate(${j}px, ${O}px) scale(${Y})`));
        const dt = (yt ? N.cur > 0 || !!N.h : u > 0) && (r.bottom > 0 || y),
          it = B(St, Qt ? [0.93, 1] : [0.75, 1]);
        (it > 0.5 && !Ko && (ve = t), (Ko = it > 0.5));
        const ht = it > 0.5 ? oa[Math.floor((t - ve) / 0.42) % oa.length] : "";
        if (ht !== ta) {
          ta = ht;
          for (const lt of [K, vt.firstChild])
            lt && ((lt.style.transition = "filter .14s, opacity .5s"), (lt.style.filter = ht ? ea[ht] : ""));
        }
        K && (K.style.opacity = dt ? (yt ? it : Math.max(it, 1 - B(u, [0, 0.12]))) : "");
        yt && K && (Hw.back ? (K.style.opacity = N.bk && N.bk.done ? 1 : 0) : N.rt && (K.style.opacity = 0));
        Hw.back && (W = 0);
        const V = yt && !Hw.back ? Ga(t, M, f, a, it) : null;
        V &&
          ((ft.style.opacity = 1),
          (ft.style.width = ft.style.height = V.w.toFixed(1) + "px"),
          (ft.style.transform = `translate3d(${(V.x - V.w / 2).toFixed(1)}px, ${(V.y - V.w / 2).toFixed(1)}px, 0)`),
          (ft.firstChild.style.transform = "none"),
          (ft.firstChild.style.filter = ea.g),
          K && (K.style.opacity = 0));
        const pt = !M.inView && it > 0 && !V;
        ((vt.style.opacity = pt ? it : 0),
          (vt.style.pointerEvents = pt && it > 0.5 ? "auto" : "none"),
          (vt.style.width = vt.style.height = M.w + "px"),
          (vt.style.transform = `translate(${M.x - M.w / 2}px, ${M.y - M.w / 2}px)`));
      }
      const m = et(St),
        h = [];
      for (const C of Be) {
        const $ = Lt.get(C);
        $ && $.heading && h.push(C.getBoundingClientRect());
      }
      Dt && parseFloat(Dt.style.opacity) > 0.05 && h.push(Dt.getBoundingClientRect());
      const S = r0.bottom + scrollY,
        w = tt((Hw.eff + a - S) / Math.max(1, f - S));
      if (
        (Ka(t, o, p, Math.max(v, St > 0 && St < 1 ? 1 - B(St, [0.85, 1]) : 0), m, M, h, w),
        yt && (K || Re) && (Na(t, n, M, T, k), _a(t), Ya(t)),
        xt.length > 4)
      ) {
        z.lineCap = "round";
        for (let C = 2; C < xt.length; C += 2) {
          const $ = C / xt.length;
          ((z.globalAlpha = $ * 0.8),
            (z.strokeStyle = `rgba(255,${(200 + 40 * $) | 0},${(140 + 90 * $) | 0},1)`),
            (z.lineWidth = 1 + $ * 3),
            z.beginPath(),
            z.moveTo(xt[C - 2], xt[C - 1]),
            z.lineTo(xt[C], xt[C + 1]),
            z.stroke());
        }
        z.globalAlpha = 1;
      }
      const b = t - ve;
      if (b >= 0 && b < 0.9) {
        const C = 1 - b / 0.9,
          $ = M.w * (0.55 + b * 1.3);
        ((z.globalAlpha = C),
          (z.strokeStyle = "rgba(240,200,110,.9)"),
          (z.lineWidth = 1.5 + 2 * C),
          z.beginPath(),
          z.arc(M.x, M.y, $, 0, E),
          z.stroke(),
          (z.globalAlpha = C * 0.5),
          z.drawImage(st.hot, M.x - $, M.y - $, $ * 2, $ * 2),
          (z.globalAlpha = 1));
      }
      (Za(w, v, t, m),
        en(t, e, v > 0 || r.bottom < a ? 1 : 0),
        ++tn % 600 === 0 && !N.h && (ro(), Do()),
        requestAnimationFrame(la));
    }
    (addEventListener("resize", ho, { passive: !0 }),
      addEventListener("load", () => {
        (ho(), ro());
      }),
      ho(),
      ro(),
      requestAnimationFrame(la),
      document.addEventListener("shopify:section:unload", (e) => {
        !e.detail ||
          e.detail.sectionId !== se ||
          (Tt.remove(),
          io.disconnect(),
          K &&
            ((K.style.opacity = Yo.o),
            (K.style.transition = Yo.t),
            (K.style.filter = ""),
            (K.closest("a") || K).removeEventListener("click", No)));
      }));
  }
  function _e() {
    document.querySelectorAll("section.es[data-sid]").forEach(sa);
  }
  (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", _e) : _e(),
    document.addEventListener("shopify:section:load", _e));
})();
