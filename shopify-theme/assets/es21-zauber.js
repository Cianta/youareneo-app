"use strict";
(() => {
  if (window.ESZ || ((window.ESZ = { version: 1, arrived: 0 }), location.pathname !== "/")) return;
  const F = ($, t = 0, w = 1) => Math.min(w, Math.max(t, $)),
    C = ($, t, w) => F(($ - t) / (w - t)),
    Ht = ($) => ($ < 0.5 ? 4 * $ * $ * $ : 1 - Math.pow(-2 * $ + 2, 3) / 2),
    Q = ($) => 1 - Math.pow(1 - $, 3),
    N = ($, t, w) => $ + (t - $) * w,
    O = Math.PI * 2,
    $t = matchMedia("(prefers-reduced-motion: reduce)").matches,
    jt = "https://cdn.shopify.com/s/files/1/0797/8310/0743/files/",
    Nt = "http://www.w3.org/2000/svg";
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
  let V = 11;
  const k = ($ = 0, t = 1) => ((V = (V * 16807) % 2147483647), $ + (V / 2147483647) * (t - $)),
    H = ($) => document.querySelector(`[id*="__${$}"].shopify-section, [id*="__${$}"]`),
    I = ($) => {
      const t = $.getBoundingClientRect();
      return {
        l: t.left,
        r: t.right,
        t: t.top + scrollY,
        b: t.bottom + scrollY,
        w: t.width,
        h: t.height,
        cx: t.left + t.width / 2,
        cy: t.top + scrollY + t.height / 2,
      };
    };
  function Mt() {
    (document.documentElement.classList.add("esz-on"),
      document.querySelectorAll("main a, #MainContent a").forEach((e) => {
        const o = e.textContent.trim();
        /^news$/i.test(o)
          ? e.classList.add("es-btn-news")
          : /^blog-beitr(ä|ae)ge$/i.test(o) && e.classList.add("es-btn-blog");
      }));
    const $ = document.createElement("canvas");
    (($.className = "esz-fx"),
      $.setAttribute("aria-hidden", "true"),
      ($.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147482990"),
      document.body.appendChild($));
    const t = $.getContext("2d");
    let w = 0,
      _ = 0,
      Y = 1;
    const wt = () => {
      ((Y = Math.min(devicePixelRatio || 1, 2)),
        (w = innerWidth),
        (_ = innerHeight),
        ($.width = w * Y),
        ($.height = _ * Y),
        t.setTransform(Y, 0, 0, Y, 0, 0));
    };
    wt();
    const ft = (e, o) => {
        const r = e.textContent.trim().split(/\s+/);
        return (
          (e.innerHTML = r.map((n) => `<span class="esz-word">${n}</span>`).join(" ")),
          (V = o),
          [...e.querySelectorAll(".esz-word")].map((n, s, A) => ({
            el: n,
            dx: (s % 2 ? 1 : -1) * k(8, 26),
            dy: k(14, 30),
            s: 1.6,
            r: k(-4, 4),
            d: s * (0.66 / Math.max(1, A.length - 1)),
            ox: k(-20, 20),
            oy: k(-40, -20),
          }))
        );
      },
      ut = (e, o, r = 0) => {
        for (const n of e) {
          const s = $t ? 1 : F((o - n.d) / 0.2),
            h = Q(F((r - n.d * 0.4) / 0.5)),
            q = Q(F(s / 0.45)),
            sc = s >= 1 ? 1 : s < 0.45 ? N(0.5, n.s, q) : N(n.s, 1, Ht(F((s - 0.45) / 0.55))),
            m = Q(F(s * 1.6)),
            gl = s > 0 && s < 1 ? Math.sin(Math.PI * s) : 0;
          ((n.el.style.opacity = (F(s * 3) * (1 - h)).toFixed(3)),
            (n.el.style.filter = h > 0.01 ? `blur(${(h * 4).toFixed(1)}px)` : ""),
            (n.el.style.textShadow = gl > 0.02 ? `0 0 ${(26 * gl).toFixed(0)}px rgba(255,214,140,${(0.9 * gl).toFixed(2)})` : ""),
            (n.el.style.transform =
              s >= 1 && h <= 0
                ? "none"
                : `translate(${(n.dx * (1 - m) + n.ox * h).toFixed(1)}px, ${(n.dy * (1 - m) + n.oy * h).toFixed(1)}px) scale(${(sc * (1 - h * 0.12)).toFixed(3)}) rotate(${(n.r * (1 - m)).toFixed(1)}deg)`));
        }
      },
      bt = [],
      pt = (e, o) => {
        const r = H(e);
        if (!r) return;
        const n = r.querySelector("h1, h2, h3, h4, .h1, .h2, .title");
        n && (o && (n.textContent = o), bt.push({ h: n, spans: ft(n, e.length * 97) }));
      };
    function Dt() {
      for (const e of bt) {
        const o = e.h.getBoundingClientRect();
        ut(e.spans, C(_ - (o.top + HW.off), _ * 0.02, _ * 0.42));
      }
    }
    // Dornenranken um den Bildrahmen (Koordinaten: Rahmen 1600x900, Ränder ±60)
    function Vn(sv) {
      if (!sv) return;
      V = 77;
      const P = [],
        T = [],
        Lf = [];
      const side = (pts) => {
        let d = "";
        pts.forEach(([x0, y0], i) => (d += (i ? "L" : "M") + x0.toFixed(1) + " " + y0.toFixed(1)));
        return d;
      };
      // vier Ranken: starten unten und oben in der Mitte, laufen beidseitig um den Rahmen bis zu den Seitenmitten
      const route = (sx, sy, dir, top) => {
        const pts = [];
        const L1 = 800,
          L2 = 450,
          tot = L1 + L2,
          n = 140;
        for (let i = 0; i <= n; i++) {
          const u = (i / n) * tot;
          let x0, y0;
          u < L1 ? ((x0 = sx + dir * u), (y0 = sy)) : ((x0 = sx + dir * L1), (y0 = sy + (top ? 1 : -1) * (u - L1)));
          const wv = Math.sin(u * 0.045 + (top ? 1.3 : 0) + dir) * 14 + Math.sin(u * 0.013) * 9;
          u < L1 ? (y0 += wv) : (x0 += wv);
          pts.push([x0, y0]);
        }
        return pts;
      };
      for (const [sx, sy, dir, top] of [
        [800, 900, -1, !1],
        [800, 900, 1, !1],
        [800, 0, -1, !0],
        [800, 0, 1, !0],
      ]) {
        const pts = route(sx, sy, dir, top);
        P.push(side(pts));
        for (let i = 6; i < pts.length - 2; i += 5) {
          const [x0, y0] = pts[i],
            [x1, y1] = pts[i + 1],
            an = Math.atan2(y1 - y0, x1 - x0) + (i % 10 < 5 ? 1 : -1) * k(1, 1.5),
            ln = k(14, 26),
            bw = 5;
          T.push({
            u: i / pts.length,
            d: `M${(x0 + Math.cos(an + 1.57) * bw).toFixed(1)} ${(y0 + Math.sin(an + 1.57) * bw).toFixed(1)}L${(x0 + Math.cos(an) * ln).toFixed(1)} ${(y0 + Math.sin(an) * ln).toFixed(1)}L${(x0 - Math.cos(an + 1.57) * bw).toFixed(1)} ${(y0 - Math.sin(an + 1.57) * bw).toFixed(1)}Z`,
          });
          if (i % 15 === 1) {
            const la = an + 0.4,
              lx = x0 + Math.cos(la) * 34,
              ly = y0 + Math.sin(la) * 34;
            Lf.push({
              u: i / pts.length,
              d: `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${(x0 + Math.cos(la - 0.6) * 26).toFixed(1)} ${(y0 + Math.sin(la - 0.6) * 26).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)}Q${(x0 + Math.cos(la + 0.6) * 26).toFixed(1)} ${(y0 + Math.sin(la + 0.6) * 26).toFixed(1)} ${x0.toFixed(1)} ${y0.toFixed(1)}Z`,
            });
          }
        }
      }
      sv.innerHTML = `<defs><linearGradient id="eszVine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b5a2c"/><stop offset=".5" stop-color="#5e7f3a"/><stop offset="1" stop-color="#2f4a26"/></linearGradient>
        <filter id="eszVglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <g class="esz-vines__g" filter="url(#eszVglow)" fill="none" stroke-linecap="round" stroke-linejoin="round">
        ${P.map((d) => `<path class="esz-vine" d="${d}" stroke="#20301a" stroke-width="15"/><path class="esz-vine" d="${d}" stroke="url(#eszVine)" stroke-width="10"/><path class="esz-vine" d="${d}" stroke="rgba(214,190,120,.45)" stroke-width="2"/>`).join("")}
        ${T.map((t) => `<path class="esz-thorn" data-u="${t.u.toFixed(3)}" d="${t.d}" fill="#c9b27a" stroke="#3a2e1a" stroke-width="1.2" opacity="0"/>`).join("")}
        ${Lf.map((t) => `<path class="esz-leaf" data-u="${t.u.toFixed(3)}" d="${t.d}" fill="#6f9a42" stroke="#2e4a1e" stroke-width="1.2" opacity="0"/>`).join("")}
        </g>`;
      sv._v = [...sv.querySelectorAll(".esz-vine")].map((pp) => {
        const ln = pp.getTotalLength();
        return ((pp.style.strokeDasharray = ln + " " + ln), (pp.style.strokeDashoffset = ln), { el: pp, ln });
      });
      sv._t = [...sv.querySelectorAll(".esz-thorn, .esz-leaf")].map((pp) => ({ el: pp, u: +pp.dataset.u }));
    }
    function Vg(sv, g) {
      if (sv && sv.tagName === "IMG") {
        // wächst von der Mitte oben/unten nach außen
        if (sv._g !== undefined && Math.abs(sv._g - g) < 0.002) return;
        sv._g = g;
        const q = (50 - 50 * F(g * 1.05)).toFixed(2);
        ((sv.style.clipPath = `inset(0 ${q}% 0 ${q}%)`), (sv.style.opacity = F(g * 3).toFixed(3)));
        return;
      }
      if (!sv || !sv._v) return;
      if (sv._g !== undefined && Math.abs(sv._g - g) < 0.002) return;
      sv._g = g;
      for (const v of sv._v) v.el.style.strokeDashoffset = (v.ln * (1 - g)).toFixed(1);
      for (const t of sv._t) {
        const a = F((g - t.u) / 0.06);
        (t.el.setAttribute("opacity", a.toFixed(2)),
          (t.el.style.transform = a < 1 ? `scale(${(0.3 + 0.7 * a).toFixed(2)})` : ""),
          (t.el.style.transformBox = "fill-box"),
          (t.el.style.transformOrigin = "50% 50%"));
      }
    }
    const ot = H("video_");
    let E = null;
    if (ot) {
      ot.classList.add("esz-tor-host");
      const e = ot.querySelector(".page-width, section") || ot,
        o = H("rich_text_XUxRzP"),
        r = H("rich_text_VRCUCT"),
        n = o && o.querySelector("h1, h2, h3, h4, .title"),
        s = (n && n.textContent.trim()) || "Gehe jetzt durch die T\xFCr, die wir f\xFCr dich \xF6ffnen",
        h = "Du hast es in der Hand.";
      [o, r].forEach((f) => {
        f && (f.style.display = "none");
      });
      const c = document.createElement("div");
      ((c.className = "esz-tor"),
        (c.innerHTML = `<div class="esz-tor__stage"><div class="esz-tor__frame"><canvas class="esz-tor__cv" aria-label="Ein Mensch geht durch ein Tor aus Licht"></canvas><img class="esz-vines esz-vines--png" src="${jt}es21-dornen.webp" alt="" aria-hidden="true" decoding="async"></div>
      <h2 class="esz-tor__txt esz-tor__txt--1"></h2><h2 class="esz-tor__txt esz-tor__txt--2"></h2></div>`),
        e.appendChild(c));
      const p = c.querySelector(".esz-tor__txt--1"),
        g = c.querySelector(".esz-tor__txt--2");
      ((p.textContent = s), (g.textContent = h));
      const y = c.querySelector("canvas"),
        a = y.getContext("2d"),
        i = [1, 2, 3, 4].map((f) => {
          const M = new Image();
          return ((M.decoding = "async"), (M.dataset.src = `${jt}es-tor-${f}.webp`), M);
        }),
        m = () =>
          i.forEach((f) => {
            f.src || (f.src = f.dataset.src);
          });
      (new IntersectionObserver(
        (f, M) => {
          f.some((u) => u.isIntersecting) && (m(), M.disconnect());
        },
        { rootMargin: "150% 0px" },
      ).observe(c),
        (E = { wrap: c, tcv: y, tg: a, sheets: i, N: 92, last: -1, w1: ft(p, 301), w2: ft(g, 517), t2: g, vines: c.querySelector(".esz-vines") }));
    } else (pt("rich_text_XUxRzP"), pt("rich_text_VRCUCT", "Du hast es in der Hand."));
    pt("rich_text_gtNpir");
    function Wt(e) {
      if (!E) return;
      const { tcv: o, tg: r, sheets: n } = E,
        s = o.getBoundingClientRect(),
        h = Math.round(s.width * Y),
        c = Math.round(s.height * Y);
      (o.width !== h || o.height !== c) && ((o.width = h), (o.height = c), (E.last = -1));
      const p = Math.round(F(C(e, 0.1, 0.84)) * (E.N - 1)),
        g = n[Math.floor(p / 24)],
        y = p % 24;
      if (p !== E.last && g && g.complete && g.naturalWidth) {
        const f = Math.max(h / 800, c / 450),
          M = 800 * f,
          u = 450 * f;
        (r.clearRect(0, 0, h, c),
          r.drawImage(g, (y % 6) * 800, Math.floor(y / 6) * 450, 800, 450, (h - M) / 2, (c - u) / 2, M, u),
          (E.last = p));
      }
      o.style.opacity = (C(e, 0.03, 0.08) * (1 - C(e, 0.9, 0.97))).toFixed(3);
      const a = performance.now() / 1e3,
        i = Q(C(e, 0.03, 0.17)),
        m = C(e, 0.78, 0.9);
      (o.style.setProperty("--mx", (N(3, 70, i) + 2.5 * Math.sin(a * 0.7) * i + 70 * m).toFixed(1) + "%"),
        o.style.setProperty("--my", (N(3, 62, i) + 2 * Math.cos(a * 0.9) * i + 70 * m).toFixed(1) + "%"),
        Vg(E.vines, Q(C(e, 0.05, 0.2)) * (1 - C(e, 0.9, 0.98))),
        ut(E.w1, C(e, 0.2, 0.34), C(e, 0.55, 0.64)),
        ut(E.w2, C(e, 0.64, 0.77), C(e, 0.9, 0.97)),
        E.t2.style.setProperty("--orn", (C(e, 0.72, 0.8) * (1 - C(e, 0.9, 0.96))).toFixed(3)));
    }
    const vt = document.querySelector('.shopify-section[id*="footer"]'),
      X = H("dbtfy_ugc_carousel_");
    let z = null;
    function Ot() {
      if (!vt) return;
      const e = I(vt),
        fz = [...document.querySelectorAll('.shopify-section[id*="footer"]')].pop() || vt,
        eb = I(fz).b;
      // Schneeflocke unten links: hinter „Gemeinnütziger Verein“ und „Wir haben uns auf Bildung …“, links/unten angeschnitten
      const s = F(w * 0.3, 240, 470),
        n = eb - s * 0.55,
        r = Math.max(s * 0.32, w * 0.12);
      const h = [w, n, s, eb, r].map(Math.round).join("|");
      if (z && z.key === h) return;
      z && z.box.remove();
      const c = document.createElement("div");
      c.className = "esz-flake";
      const p = n - s * 1.08,
        g = Math.max(50, Math.min(s * 2.16, eb - p - 2));
      c.style.cssText = `position:absolute;left:0;top:${p}px;width:100%;height:${g}px;overflow:hidden;pointer-events:none;z-index:1`;
      const y = document.createElementNS(Nt, "svg");
      (y.setAttribute("viewBox", `${-r} ${-s * 1.08} ${w} ${s * 2.16}`),
        y.setAttribute("width", "100%"),
        y.setAttribute("height", s * 2.16),
        (y.style.cssText = "position:absolute;left:0;top:0"),
        y.setAttribute("preserveAspectRatio", "xMidYMid slice"));
      const a = (l) => l.toFixed(1),
        i = 0.16;
      V = 2026;
      const m = [...Array(6)].map(() => ({ len: k(0.97, 1.03), sw: k(-0.025, 0.025), sp: k(0.94, 1.06) })),
        f = (l, d) => {
          const v = -Math.PI / 2 + (l * Math.PI) / 3 + (i + m[l].sw) * Math.pow(d / s, 1.5);
          return [d * Math.cos(v), d * Math.sin(v)];
        },
        M = (l, d) => {
          const v = f(l, d - 2),
            q = f(l, d + 2);
          return Math.atan2(q[1] - v[1], q[0] - v[0]);
        },
        u = (l, d, v) => [l[0] + d[0] * v, l[1] + d[1] * v],
        S = (l) => l.map((d, v) => (v ? "L" : "M") + a(d[0]) + " " + a(d[1])).join(""),
        b = F(s * 0.026, 9, 24),
        P = [],
        D = [],
        xt = [],
        U = (l, d, v) => {
          (P.push([l, d]), v && xt.push(l));
        };
      for (let l = 0; l < 6; l++) {
        const d = s * m[l].len,
          v = d * 0.78,
          q = [];
        for (let R = 0; R <= 26; R++) q.push(f(l, s * 0.1 + ((v - s * 0.1) * R) / 26));
        U(S(q), b, 1);
        const A = f(l, v),
          J = f(l, d),
          At = M(l, (v + d) / 2),
          j = [Math.cos(At), Math.sin(At)],
          Rt = [-j[1], j[0]],
          W = d - v,
          Z = W * 0.78;
        for (const R of [-1, 1]) {
          const T = [Rt[0] * R, Rt[1] * R],
            L = u(u(A, T, Z * 0.95), j, W * 0.06),
            lt = `M${a(A[0])} ${a(A[1])}C${a(u(u(A, j, -W * 0.38), T, Z * 0.3)[0])} ${a(u(u(A, j, -W * 0.38), T, Z * 0.3)[1])} ${a(u(u(A, j, -W * 0.28), T, Z * 1.15)[0])} ${a(u(u(A, j, -W * 0.28), T, Z * 1.15)[1])} ${a(L[0])} ${a(L[1])}C${a(u(u(A, j, W * 0.3), T, Z * 0.82)[0])} ${a(u(u(A, j, W * 0.3), T, Z * 0.82)[1])} ${a(u(u(J, j, -W * 0.3), T, Z * 0.25)[0])} ${a(u(u(J, j, -W * 0.3), T, Z * 0.25)[1])} ${a(J[0])} ${a(J[1])}`;
          U(lt, b * 0.62, 1);
        }
        D.push([J[0], J[1], b * 0.95], [A[0], A[1], b * 0.6]);
        const qt = d * 0.42,
          ee = f(l, qt),
          oe = M(l, qt);
        for (const R of [-1, 1]) {
          let T = oe + R * 1.05,
            L = ee.slice();
          const lt = [L.slice()],
            Bt = s * 0.2 * m[l].sp,
            ht = 44;
          for (let yt = 0; yt < ht; yt++) {
            const dt = yt / ht;
            ((T += R * (0.012 + 0.2 * dt * dt)),
              (L = [
                L[0] + ((Math.cos(T) * Bt) / ht) * (1 - dt * 0.55),
                L[1] + ((Math.sin(T) * Bt) / ht) * (1 - dt * 0.55),
              ]),
              lt.push(L.slice()));
          }
          (U(S(lt), b * 0.5, 1), D.push([L[0], L[1], b * 0.42]));
        }
        const nt = f(l, d * 0.57),
          Lt = f(l, d * 0.7),
          Ft = f(l, d * 0.635),
          It = M(l, d * 0.635),
          K = [-Math.sin(It), Math.cos(It)],
          rt = u(Ft, K, s * 0.055),
          it = u(Ft, K, -s * 0.055);
        (U(
          `M${a(nt[0])} ${a(nt[1])}Q${a(u(rt, K, s * 0.01)[0])} ${a(u(rt, K, s * 0.01)[1])} ${a(Lt[0])} ${a(Lt[1])}Q${a(u(it, K, -s * 0.01)[0])} ${a(u(it, K, -s * 0.01)[1])} ${a(nt[0])} ${a(nt[1])}`,
          b * 0.42,
        ),
          D.push([rt[0], rt[1], b * 0.35], [it[0], it[1], b * 0.35]));
        const at = f(l, d * 0.24),
          ct = M(l, d * 0.24);
        for (const R of [-1, 1]) {
          const T = u(at, [Math.cos(ct + R * 0.8), Math.sin(ct + R * 0.8)], s * 0.06),
            L = u(at, [Math.cos(ct + R * 0.5), Math.sin(ct + R * 0.5)], s * 0.04);
          U(`M${a(at[0])} ${a(at[1])}Q${a(L[0])} ${a(L[1])} ${a(T[0])} ${a(T[1])}`, b * 0.36);
        }
      }
      for (const l of [0.31, 0.585])
        for (let d = 0; d < 6; d++) {
          const v = f(d, s * l),
            q = f((d + 1) % 6, s * l),
            A = [((v[0] + q[0]) / 2) * 0.8, ((v[1] + q[1]) / 2) * 0.8];
          U(`M${a(v[0])} ${a(v[1])}Q${a(A[0])} ${a(A[1])} ${a(q[0])} ${a(q[1])}`, b * 0.24);
        }
      const Pt = (l) =>
        [...Array(3)].map((d, v) => {
          const q = -Math.PI / 2 + l + (v * O) / 3;
          return [s * 0.13 * Math.cos(q), s * 0.13 * Math.sin(q)];
        });
      (U(S(Pt(0)) + "Z", b * 0.4), U(S(Pt(Math.PI / 3)) + "Z", b * 0.4), D.push([0, 0, b * 1.1]));
      const te = (l, d) => `<path d="${l}" stroke="rgba(170,205,255,.08)" stroke-width="${a(d * 1.7)}"/>
      <path d="${l}" stroke="rgba(228,240,255,.24)" stroke-width="${a(d)}"/>
      <path d="${l}" stroke="rgba(20,26,40,.5)" stroke-width="${a(d * 0.58)}"/>
      <path d="${l}" stroke="rgba(255,255,255,.55)" stroke-width="${a(Math.max(0.6, d * 0.11))}" transform="translate(${a(-d * 0.2)} ${a(-d * 0.22)})"/>
      <path d="${l}" stroke="rgba(190,225,255,.2)" stroke-width="${a(Math.max(0.5, d * 0.07))}" transform="translate(${a(d * 0.22)} ${a(d * 0.18)})"/>`;
      ((y.innerHTML = `<defs><radialGradient id="eszDrop" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="#e6f3ff" stop-opacity=".4"/><stop offset=".7" stop-color="#7fb4ff" stop-opacity=".1"/><stop offset="1" stop-color="#cfe6ff" stop-opacity=".45"/></radialGradient>
      <filter id="eszGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
      <g class="esz-flake-body" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85">
        ${P.map(([l, d]) => te(l, d)).join("")}
        ${D.map(([l, d, v]) => `<circle cx="${a(l)}" cy="${a(d)}" r="${a(v)}" fill="url(#eszDrop)" stroke="rgba(255,255,255,.3)" stroke-width=".8"/>`).join("")}
        <g class="esz-current" filter="url(#eszGlow)" opacity="0">${xt.map((l) => `<path d="${l}" stroke="#bfe9ff" stroke-width="${a(b * 0.45)}"/>`).join("")}</g>
        <g class="esz-current2" opacity="0">${xt.map((l) => `<path d="${l}" stroke="#ffffff" stroke-width="1.2"/>`).join("")}</g>
      </g>`),
        (y.style.cssText +=
          ";transform-origin:" + a(r) + "px " + a(s * 1.08) + "px;animation:esz-breathe 22s ease-in-out infinite alternate"),
        c.appendChild(y),
        document.body.appendChild(c));
      const Et = [...y.querySelectorAll(".esz-current path, .esz-current2 path")];
      (Et.forEach((l) => {
        let d = 400;
        try {
          d = l.getTotalLength() || 400;
        } catch {}
        ((l.style.strokeDasharray = `${d * 0.18} ${d}`), (l.dataset.l = d));
      }),
        (z = {
          key: h,
          box: c,
          svg: y,
          cx: r,
          cy: n,
          R: s,
          tipOff: f(0, s * m[0].len),
          tipB: f(3, s * m[3].len * 0.93),
          cur: Et,
          g1: y.querySelector(".esz-current"),
          g2: y.querySelector(".esz-current2"),
          tip: [r, n - s],
        }));
    }
    let x = [];
    const gt = () => _ * 0.45;
    function Zt() {
      x = [];
      const e = [];
      let o = null;
      const r = () => {
          ((o = []), e.push(o));
        },
        n = (i, m, f = 1, M, u) => o.push(Object.assign({ x: i, y: m, op: f, s: M === void 0 ? m - gt() : M }, u));
      // Team: Logo erscheint groß über der Überschrift, leuchtet, wird zum Funken und fällt unter „Kontakt Seite“
      const tH = document.getElementById("es-team-h"),
        tB = document.querySelector(".es-team__btn");
      if (tH && tH.getBoundingClientRect().width > 0) {
        r();
        const i = I(tH),
          lw = Math.max(90, Math.min(150, Jt().w * 1.75)),
          ly = i.t - lw * 0.62;
        n(w / 2, ly, 0, ly - gt(), { logo: 1, lw });
        if (tB) {
          const q = I(tB);
          n(q.cx, q.b + 46, 1);
        }
      }
      const s = H("dbtfy_testimonials_");
      if (s) {
        r();
        const i = I(s);
        n(i.l + Math.min(60, w * 0.06), i.t + 30, 1);
        const f = [...s.querySelectorAll("h3, h4, h5, h6, strong, .h4, .h5")].filter((M) => {
          const u = M.textContent.trim(),
            S = M.getBoundingClientRect();
          return u.length > 1 && u.length < 26 && !/mitglieder/i.test(u) && S.width > 0 && S.left >= 0 && S.right <= w;
        })[0];
        if (f) {
          const M = I(f);
          n(Math.min(w - 30, M.r + 34), M.cy, 1);
        } else n(i.cx, i.cy, 1);
      }
      const c = H("rich_text_XUxRzP");
      if (c && c.offsetParent) {
        r();
        const i = I(c);
        n(w / 2, i.b - 8, 1);
      }
      if (E) {
        r();
        const i = I(E.wrap);
        (n(w / 2, i.t + _ * 0.5, 1, i.t, { torIn: 1 }), n(w / 2, i.b - _ * 0.5, 1, i.b - _, { torOut: 1 }));
      }
      const p = H("rich_text_VRCUCT");
      if (p && p.offsetParent) {
        r();
        const i = I(p);
        n(w * 0.5, i.b + 4, 1);
      }
      const g = H("rich_text_gtNpir");
      if (g) {
        r();
        const i = I(g);
        n(w * 0.5, i.b + 10, 1);
      }
      if (X) {
        r();
        const i = I(X.querySelector(".splide") || X),
          m = Math.min(w / 2 - 14, i.w / 2 + 26),
          f = i.h / 2 + 30,
          M = i.t - 30 - gt(),
          u = Math.max(260, i.h + 120);
        for (let S = 0; S <= 16; S++) {
          const b = -Math.PI / 2 + (O * S) / 16;
          n(i.cx + Math.cos(b) * m, i.cy + Math.sin(b) * f, 1, M + (u * S) / 16);
        }
      }
      e.filter((i) => i.length)
        .sort((i, m) => i[0].s - m[0].s)
        .forEach((i) => x.push(...i));
      x[0] && (x[0].op = 0);
      for (let i = 1; i < x.length; i++) x[i].s = Math.max(x[i].s, x[i - 1].s + 12);
      // Schluss: Garantie 1-2-3 → neben „Die Plattform ist ein Projekt …“ (groß) → Mitte der Schneeflocke
      o = x;
      const yMax = document.documentElement.scrollHeight - _ - 30,
        lastS = x.length ? x[x.length - 1].s : 0,
        hG = H("dbtfy_guarantee_"),
        ic = hG ? [...hG.querySelectorAll(".heading--icon")].map(I).filter((f) => f.w > 0).sort((a, b) => a.cx - b.cx) : [],
        foot = H("dbtfy-footer") || vt,
        pe = foot && [...foot.querySelectorAll("p, div, span")].filter((q) => /Die Plattform ist ein Projekt/i.test(q.textContent)).pop(),
        tail = [];
      ic.slice(0, 3).forEach((q) => tail.push([q.cx, q.cy, {}]));
      if (pe) {
        const q = I(pe);
        tail.push([q.l > w * 0.35 ? Math.max(30, q.l - 46) : Math.min(w - 30, q.r + 46), q.cy, { big: 1 }]);
      }
      z && tail.push([z.cx, z.cy, { flake: 1 }]);
      if (tail.length) {
        const s0 = Math.max(lastS + 80, Math.min(tail[0][1] - gt(), yMax - 120 * tail.length)),
          st0 = Math.max(70, (yMax - s0) / Math.max(1, tail.length - 1));
        tail.forEach(([tx, ty, ex], k) => n(tx, ty, 1, k === tail.length - 1 ? Math.max(s0 + k * 70, yMax) : s0 + k * st0, ex));
      }
      for (let i = 1; i < x.length; i++) x[i].s = Math.max(x[i].s, x[i - 1].s + 12);
      // Sicherheitsnetz: alles muss vor dem Seitenende erreichbar sein (nur das letzte Stück stauchen)
      if (x.length > 1 && x[x.length - 1].s > yMax) {
        let j0 = x.findIndex((q) => q.s > yMax - 900);
        j0 = Math.max(1, j0);
        const a0 = Math.min(x[j0 - 1].s + 12, yMax - 200),
          b0 = x[x.length - 1].s,
          f0 = x[j0].s;
        for (let i = j0; i < x.length; i++) x[i].s = a0 + ((x[i].s - f0) / Math.max(1, b0 - f0)) * (yMax - a0);
      }
    }
    const St = (e, o, r, n, s) =>
      0.5 * (2 * o + (-e + r) * s + (2 * e - 5 * o + 4 * r - n) * s * s + (-e + 3 * o - 3 * r + n) * s * s * s);
    function Gt(e) {
      if (x.length < 2 || e < x[0].s) return null;
      const o = x[x.length - 1];
      if (e >= o.s) return { x: o.x, y: o.y - e, op: 1, at: x.length - 1, u: 1 };
      let r = 0;
      for (; r < x.length - 2 && e > x[r + 1].s;) r++;
      const n = x[Math.max(0, r - 1)],
        s = x[r],
        h = x[r + 1],
        c = x[Math.min(x.length - 1, r + 2)],
        p = F((e - s.s) / Math.max(1, h.s - s.s)),
        g = p * p * (3 - 2 * p);
      return {
        x: St(n.x, s.x, h.x, c.x, g),
        y: St(n.y, s.y, h.y, c.y, g) - e,
        op: N(s.op, h.op, g),
        at: r,
        u: g,
        b: s,
        c: h,
      };
    }
    const B = [];
    function zt(e, o, r, n = 1, s) {
      if (r <= 0.01) return;
      const h = 9 * n,
        c = t.createRadialGradient(e, o, 0, e, o, h * 4);
      (c.addColorStop(0, `rgba(255,250,235,${r})`),
        c.addColorStop(0.2, `rgba(255,214,140,${0.75 * r})`),
        c.addColorStop(0.55, `rgba(150,200,255,${0.18 * r})`),
        c.addColorStop(1, "rgba(150,200,255,0)"),
        (t.fillStyle = c),
        t.beginPath(),
        t.arc(e, o, h * 4, 0, O),
        t.fill(),
        (t.strokeStyle = `rgba(255,244,220,${0.7 * r})`),
        (t.lineWidth = 1));
      const p = h * (2.6 + 0.5 * Math.sin(s * 6));
      (t.beginPath(), t.moveTo(e - p, o), t.lineTo(e + p, o), t.moveTo(e, o - p), t.lineTo(e, o + p), t.stroke());
    }
    function Ut(e) {
      if (!(B.length < 4)) {
        t.lineCap = "round";
        for (let o = 2; o < B.length; o += 2) {
          const r = o / B.length;
          ((t.strokeStyle = `rgba(255,${(200 + 40 * r) | 0},${(150 + 80 * r) | 0},${r * 0.7 * e})`),
            (t.lineWidth = 0.8 + r * 2.6),
            t.beginPath(),
            t.moveTo(B[o - 2], B[o - 1]),
            t.lineTo(B[o], B[o + 1]),
            t.stroke());
        }
      }
    }
    const st = (e, o, r, n, s = "255,240,210") => {
        const h = t.createRadialGradient(e, o, 0, e, o, r);
        (h.addColorStop(0, `rgba(255,255,255,${n})`),
          h.addColorStop(0.35, `rgba(${s},${n * 0.7})`),
          h.addColorStop(1, `rgba(${s},0)`),
          (t.fillStyle = h),
          t.beginPath(),
          t.arc(e, o, r, 0, O),
          t.fill());
      },
      kt = H("dbtfy_custom_code_QqhM7p"),
      Qt = [
        [221, 183, 113],
        [143, 220, 236],
        [255, 160, 96],
        [160, 224, 122],
        [196, 166, 255],
      ];
    let mt = [],
      tt = [],
      _t = !1;
    function Yt() {
      ((_t = !0),
        (V = 5),
        (mt = Qt.map((e, o) => ({
          c: e,
          x: -40 - o * 50,
          y: _ * k(0.35, 0.8),
          vx: k(55, 80),
          ph: k(0, O),
          amp: k(18, 34),
          life: 0,
          ttl: k(3.6, 5.2) + o * 0.3,
          sz: k(9, 13),
          gone: !1,
        }))));
    }
    function Vt(e, o) {
      const r = Math.abs(Math.sin(o * 9 + e.ph)),
        n = F(e.life * 2) * (1 - C(e.life, e.ttl - 0.6, e.ttl)) * 0.55,
        [s, h, c] = e.c;
      (t.save(), t.translate(e.x, e.y), t.rotate(Math.sin(o * 2 + e.ph) * 0.25 - 0.3));
      for (const p of [-1, 1])
        (t.save(),
          t.scale(p * (0.25 + 0.75 * r), 1),
          (t.fillStyle = `rgba(${s},${h},${c},${n})`),
          (t.strokeStyle = `rgba(255,255,255,${n * 0.7})`),
          (t.lineWidth = 0.6),
          t.beginPath(),
          t.moveTo(0, 0),
          t.bezierCurveTo(e.sz * 0.9, -e.sz * 1.3, e.sz * 1.7, -e.sz * 0.4, e.sz * 0.9, e.sz * 0.1),
          t.closePath(),
          t.fill(),
          t.stroke(),
          t.beginPath(),
          t.moveTo(0, 0),
          t.bezierCurveTo(e.sz * 0.8, e.sz * 0.3, e.sz * 1.1, e.sz * 1.1, e.sz * 0.3, e.sz * 0.95),
          t.closePath(),
          t.fill(),
          t.stroke(),
          t.restore());
      ((t.fillStyle = `rgba(255,248,230,${n})`), t.fillRect(-0.6, -e.sz * 0.5, 1.2, e.sz), t.restore());
    }
    function Xt(e, o) {
      for (const r of mt)
        if (!r.gone) {
          if (
            ((r.life += o),
            (r.x += r.vx * o),
            (r.y += Math.sin(e * 1.6 + r.ph) * r.amp * o - 12 * o),
            r.life > r.ttl - 0.6 && !r.dusted)
          ) {
            r.dusted = !0;
            for (let n = 0; n < 26; n++)
              tt.push({
                x: r.x,
                y: r.y,
                vx: k(-30, 50),
                vy: k(-55, -10),
                life: 0,
                ttl: k(1.6, 3.2),
                c: r.c,
                rot: k(0, O),
              });
          }
          if (r.life > r.ttl) {
            r.gone = !0;
            continue;
          }
          Vt(r, e);
        }
      for (let r = tt.length - 1; r >= 0; r--) {
        const n = tt[r];
        if (((n.life += o), n.life > n.ttl)) {
          tt.splice(r, 1);
          continue;
        }
        ((n.vx *= 0.985), (n.vy = n.vy * 0.985 - 4 * o), (n.x += n.vx * o), (n.y += n.vy * o), (n.rot += o * 0.6));
        const s = (1 - n.life / n.ttl) * 0.55,
          [h, c, p] = n.c;
        ((t.strokeStyle = `rgba(${h},${c},${p},${s * 0.7})`), (t.lineWidth = 0.5));
        for (let g = 0; g < 5; g++) {
          const y = n.rot + (g * O) / 5;
          (t.beginPath(), t.moveTo(n.x, n.y), t.lineTo(n.x + Math.cos(y) * 3.2, n.y + Math.sin(y) * 3.2), t.stroke());
        }
        ((t.fillStyle = `rgba(255,250,235,${s})`), t.beginPath(), t.arc(n.x, n.y, 0.9, 0, O), t.fill());
      }
    }
    let G = -1,
      Bk = null,
      Rt0 = 0;
    const Lx = { x: 0, y: 0 };
    const Jt = () => {
      const e = document.querySelector('.header__heading-logo, header .logo img, header [class*="logo"] img'),
        o = e && e.getBoundingClientRect();
      return o && o.width > 0 && o.bottom > 0
        ? { x: o.left + o.width / 2, y: o.top + o.height / 2, w: o.width }
        : { x: w / 2, y: 40, w: 50 };
    };
    function Kt(e, o) {
      if (!z) return;
      const r = z.cx,
        n = z.cy - o,
        s = e - G;
      ((window.ESZ.e = s),
        s < 0.6 && st(r, n, 30 + 160 * Q(s / 0.6), 0.9 * (1 - s / 0.6)),
        s > 0.15 && s < 1.1 && st(r, n, 40 + 220 * Q(F((s - 0.15) / 0.9)), 0.55 * Math.sin(Math.PI * F((s - 0.15) / 0.95))));
      const h = F((s - 0.25) / 1.6);
      (z.g1.setAttribute("opacity", (Math.sin(Math.PI * h) * 0.95).toFixed(3)),
        z.g2.setAttribute("opacity", (Math.sin(Math.PI * h) * (0.6 + 0.4 * Math.sin(e * 40))).toFixed(3)));
      for (const i of z.cur) {
        const m = +i.dataset.l;
        i.style.strokeDashoffset = (m * (1 - h * 1.2)).toFixed(1);
      }
      const c = Jt(),
        p = r + z.tipOff[0],
        g = n + z.tipOff[1] * 0.93,
        y = Q(F((s - 1.4) / 0.9));
      if (y > 0) {
        const i = N(p, c.x, y),
          m = N(g, c.y, y),
          f = (p + i) / 2 + Math.sin(s * 3) * 6,
          M = (g + m) / 2;
        (t.save(),
          (t.shadowColor = "rgba(190,230,255,.9)"),
          (t.shadowBlur = 12),
          (t.strokeStyle = `rgba(210,238,255,${0.75 * (1 - C(s, 3.6, 4.4))})`),
          (t.lineWidth = 1.6),
          t.beginPath(),
          t.moveTo(p, g),
          t.quadraticCurveTo(f + 18, M, i, m),
          t.stroke());
        for (let u = 1; u < 7; u++) {
          const S = u / 7;
          if (S > y) break;
          const b = N(p, i, S),
            P = N(g, m, S),
            D = 14 * (1 - S * 0.5);
          (t.beginPath(),
            t.moveTo(b, P),
            t.lineTo(b - D, P + D * 0.6),
            t.moveTo(b, P),
            t.lineTo(b + D, P + D * 0.6),
            t.stroke());
        }
        t.restore();
      }
      const a = Ht(F((s - 2.3) / 1)),
        ub = (() => {
          const el = [...document.querySelectorAll("header a, .header a")].find((q) => /^\s*übersicht\s*$/i.test(q.textContent)),
            rr = el && el.getBoundingClientRect();
          return rr && rr.width > 0 && rr.bottom > 0 ? { x: rr.left + rr.width / 2, y: rr.top + rr.height * 0.15 } : null;
        })(),
        tA = ub ? 4.5 : 3.3;
      if (s > 2.2 && a < 1) zt(N(p, c.x, a), N(g, c.y, a), 1, 1.2 - 0.4 * a, e);
      else if (a >= 1) {
        const hp = F((s - 3.3) / 1.2);
        if (ub && hp > 0 && hp < 1) {
          // einmal über „Übersicht“ hüpfen und zurück in die Mitte
          const q = hp < 0.5 ? Ht(hp * 2) : Ht((1 - hp) * 2),
            lift = Math.sin(Math.PI * (hp < 0.5 ? hp * 2 : (hp - 0.5) * 2)) * 30;
          zt(N(c.x, ub.x, q), N(c.y, ub.y, q) - lift, 1, 0.85, e);
        } else if (s >= tA) {
          const i = F((s - tA) / 0.9),
            pu = 0.5 + 0.5 * Math.sin(e * 2.1);
          (i < 1 &&
            ((t.strokeStyle = `rgba(240,200,110,${1 - i})`),
            (t.lineWidth = 2 * (1 - i) + 0.5),
            t.beginPath(),
            t.arc(c.x, c.y, c.w * (0.55 + i * 1.4), 0, O),
            t.stroke(),
            st(c.x, c.y, c.w * 1.6, 0.6 * (1 - i))),
            // bleibt in der Mitte und leuchtet ruhig weiter
            st(c.x, c.y, c.w * (0.95 + 0.12 * pu), (0.2 + 0.12 * pu) * F((s - tA) / 0.6)),
            window.ESZ.arrived || ((window.ESZ.arrived = 1), dispatchEvent(new CustomEvent("esz:angekommen"))));
        } else zt(c.x, c.y, 1, 0.85, e);
      }
    }
    // Team-Logo: erscheint groß über der Überschrift und leuchtet einmal auf
    let LGt = -1,
      LGim = null;
    function Lg(P, la, o, ry) {
      LGim || (LGim = document.querySelector('.header__heading-logo, header .logo img, header [class*="logo"] img'));
      const X0 = P.x,
        Y0 = P.y - ry,
        W0 = P.lw * (0.72 + 0.28 * Q(la)),
        ar = LGim && LGim.naturalWidth ? LGim.naturalHeight / LGim.naturalWidth : 1;
      la > 0.82 && LGt < 0 && (LGt = o);
      const k = LGt < 0 ? 0 : F((o - LGt) / 1.6),
        gl = LGt < 0 || k >= 1 ? 0 : Math.sin(Math.PI * k);
      st(X0, Y0, W0 * (1.05 + 0.1 * Math.sin(o * 2)), 0.32 * la);
      if (gl > 0.01) {
        st(X0, Y0, W0 * (0.8 + 1.7 * Q(k)), 0.85 * gl);
        ((t.strokeStyle = `rgba(240,200,110,${(0.9 * (1 - k)).toFixed(3)})`),
          (t.lineWidth = 2.2 * (1 - k) + 0.4),
          t.beginPath(),
          t.arc(X0, Y0, W0 * (0.56 + k * 0.9), 0, O),
          t.stroke());
      }
      if (LGim && LGim.complete && LGim.naturalWidth)
        (t.save(),
          (t.globalAlpha = F(la)),
          (t.shadowColor = "rgba(255,214,140,.85)"),
          (t.shadowBlur = 16 + 26 * gl),
          t.drawImage(LGim, X0 - W0 / 2, Y0 - (W0 * ar) / 2, W0, W0 * ar),
          t.restore());
    }
    let Ct = performance.now();
    const et = () => {
      (wt(), Ot(), Zt());
    };
    (addEventListener("resize", et, { passive: !0 }),
      addEventListener("load", et),
      et(),
      setTimeout(et, 1500),
      setInterval(et, 6e3));
    function Tt(e) {
      try {
        Tt0(e);
      } catch (c) {
        ((window.ESZ.err = String((c && c.stack) || c)), requestAnimationFrame(Tt));
      }
    }
    function Tt0(e) {
      const o = e / 1e3,
        r = Math.min(0.05, (e - Ct) / 1e3);
      Ct = e;
      const Hw = HW.tick(),
        n = Hw.eff,
        ry = scrollY;
      (t.clearRect(0, 0, w, _), Dt());
      let s = -1;
      if (E) {
        const c = E.wrap.getBoundingClientRect();
        ((s = F(-(c.top + Hw.off) / Math.max(1, c.height - _))), c.bottom > -50 && c.top < _ + 50 && Wt(s));
      }
      if (kt && !_t) {
        const c = kt.getBoundingClientRect();
        c.top < _ * 0.7 && c.bottom > 0 && Yt();
      }
      (mt.length || tt.length) && Xt(o, r);
      let h = $t ? null : Gt(n);
      h && (h.y += n - ry);
      const LP = x.length && x[0].logo ? x[0] : null;
      let la = 0;
      LP && !Hw.back && !$t && ((la = F(1 - Math.abs(n - LP.s) / 230)), la < 0.04 && n < LP.s - 300 && (LGt = -1), la > 0.01 && Lg(LP, la, o, ry));
      if (h && Hw.back) {
        Bk || (Bk = { t0: o, x: Lx.x || h.x, y: Lx.y || h.y });
        const u = Ht(F((o - Bk.t0) / 0.45)),
          hd = Jt();
        (u < 1 && zt(N(Bk.x, hd.x, u), N(Bk.y, hd.y, u) - Math.sin(Math.PI * u) * 40, 1, 1, o), (B.length = 0), (h = null));
      } else if (h) {
        if (Bk) ((Rt0 = o), (Bk = null));
      }
      if (h) {
        let c = h.op * (1 - la),
          p = h.x,
          g = h.y,
          y = 1 + 1.3 * ((h.b && h.b.big ? 1 - h.u : 0) + (h.c && h.c.big ? h.u : 0));
        if (E && s > 0 && s < 1) {
          const i = C(s, 0, 0.1),
            m = C(s, 0.88, 1);
          ((c = 1 - C(s, 0.02, 0.06) + C(s, 0.97, 1)),
            (p = w / 2),
            (g = _ / 2),
            i > 0 && i < 1 && st(p, g, 40 + Math.max(w, _) * 0.7 * Q(i), 0.95 * Math.sin(Math.PI * i)),
            m > 0 && m < 1 && st(p, g, Math.max(w, _) * 0.75 * (1 - Q(m)) + 30, 0.9 * Math.sin(Math.PI * m)),
            (B.length = 0));
        } else G < 0 && (B.push(p, g), B.length > 40 && B.splice(0, 2));
        const a = x.length && h.at === x.length - 1 && h.u >= 1;
        (a && G < 0 && (G = o),
          !a &&
            G >= 0 &&
            n < x[x.length - 1].s - 120 &&
            ((G = -1),
            (window.ESZ.arrived = 0),
            z && (z.g1.setAttribute("opacity", 0), z.g2.setAttribute("opacity", 0))),
          G < 0 &&
            (Rt0 > 0 && o - Rt0 < 0.45
              ? (() => {
                  const u = Ht(F((o - Rt0) / 0.45)),
                    hd = Jt();
                  zt(N(hd.x, p, u), N(hd.y, g, u) - Math.sin(Math.PI * u) * 40, 1, y, o);
                })()
              : (Ut(c), zt(p, g, c, y, o), (Lx.x = p), (Lx.y = g))));
      } else B.length = 0;
      if (G >= 0)
        try {
          Kt(o, ry);
        } catch (c) {
          window.ESZ.err = String((c && c.stack) || c);
        }
      requestAnimationFrame(Tt);
    }
    requestAnimationFrame(Tt);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", Mt) : Mt();
})();
