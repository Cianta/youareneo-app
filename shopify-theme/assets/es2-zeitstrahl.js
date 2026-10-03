"use strict";
(() => {
  const x = (w, S = 0, z = 1) => Math.min(z, Math.max(S, w)),
    C = (w, S, z) => x((w - S) / (z - S)),
    J = (w) => (w < 0.5 ? 4 * w * w * w : 1 - Math.pow(-2 * w + 2, 3) / 2),
    zt = (w) => 1 - Math.pow(1 - w, 3),
    D = (w, S, z) => w + (S - w) * z,
    I = Math.PI * 2;
  let nt = 7;
  const h = (w = 0, S = 1) => ((nt = (nt * 16807) % 2147483647), w + (nt / 2147483647) * (S - w)),
    ie = {
      156: {
        mountains: [
          [78, 98, 28, 36],
          [100, 104, 26, 33],
          [104, 111, 32, 34.5],
          [73, 90, 37, 43],
        ],
        cities: [
          ["Beijing", 116.4, 39.9],
          ["Shanghai", 121.5, 31.2],
          ["Chengdu", 104.07, 30.67],
          ["Qing Cheng Shan", 103.57, 30.9, 1],
        ],
      },
      392: {
        mountains: [
          [136.5, 138.6, 35, 37],
          [138.5, 138.9, 35.2, 35.5],
          [140, 142, 38.5, 40.5],
        ],
        cities: [
          ["Tokyo", 139.7, 35.68, 1],
          ["Kyoto", 135.77, 35.01],
          ["Osaka", 135.5, 34.69],
          ["Noda", 139.87, 35.95],
        ],
      },
      "040": {
        mountains: [[9.6, 15.5, 46.5, 47.5]],
        cities: [
          ["Innsbruck", 11.39, 47.27, 1],
          ["Wien", 16.37, 48.21],
          ["Salzburg", 13.04, 47.8],
          ["Aldrans", 11.45, 47.25],
        ],
      },
      380: {
        mountains: [
          [7, 13, 45.8, 46.8],
          [11, 16, 40.5, 44],
        ],
        cities: [
          ["Gardasee", 10.7, 45.6, 1],
          ["Rom", 12.5, 41.9],
          ["Mailand", 9.19, 45.46],
          ["Venedig", 12.33, 45.44],
        ],
      },
    };
  function se(w) {
    if (w.dataset.ready) return;
    w.dataset.ready = "1";
    const S = JSON.parse(document.getElementById("zs-daten-" + w.dataset.sid).textContent),
      z = S.length;
    (w.style.setProperty("--zs-n", z + 2),
      (w.style.background = "radial-gradient(ellipse at 50% 30%, #2f3441 0%, #242833 58%, #1e2129 100%)"));
    const F = (l) => w.querySelector(l),
      Gt = F(".zs__stage"),
      gt = F(".zs__map"),
      u = gt.getContext("2d"),
      at = F(".zs__tree"),
      n = at.getContext("2d"),
      pt = F(".zs__path"),
      m = pt.getContext("2d"),
      re = F(".zs__cards"),
      Nt = F(".zs__intro"),
      Ht = F(".zs__text"),
      _t = F(".zs__year"),
      le = F(".zs__title"),
      ce = F(".zs__body"),
      he = F(".zs__place"),
      V = F(".zs__globe"),
      St = V.querySelector("canvas"),
      k = St.getContext("2d"),
      Wt = V.querySelector(".zs__logo"),
      yt = F(".zs__line"),
      Dt = F(".zs__cta");
    document.body.appendChild(V);
    const it = document.createElement("div"),
      st = [],
      rt = [];
    ((it.className = "zs-spark"),
      (it.style.cssText =
        "position:fixed;left:0;top:0;width:10px;height:10px;border-radius:50%;z-index:2147483001;pointer-events:none;opacity:0;background:#fff8e6;box-shadow:0 0 6px 2px rgba(255,240,210,.95),0 0 18px 6px rgba(255,200,120,.55),0 0 40px 12px rgba(150,200,255,.25)"));
    for (let l = 0; l < 9; l++) {
      const e = document.createElement("div");
      ((e.style.cssText =
        "position:fixed;left:0;top:0;width:6px;height:6px;border-radius:50%;z-index:2147483001;pointer-events:none;opacity:0;background:rgba(255,226,170,.9);box-shadow:0 0 8px 2px rgba(255,210,140,.6)"),
        st.push(e));
    }
    document.body.append(...st, it);
    let v = 1;
    const kt = 3,
      Tt = 3,
      Et = [];
    (S.forEach((l, e) =>
      l.img.forEach((c, o) => {
        const g = document.createElement("div");
        g.className = "zs__card";
        const d = `${c}${c.includes("?") ? "&" : "?"}width=900`,
          a = [];
        for (let t = 0; t < Tt; t++)
          for (let r = 0; r < kt; r++) {
            const i = document.createElement("div");
            ((i.className = "zs__tile"),
              (i.style.cssText = `left:${(r * 100) / kt}%;top:${(t * 100) / Tt}%;width:${100 / kt}%;height:${100 / Tt}%`));
            const s = document.createElement("img");
            ((s.alt = ""),
              (s.decoding = "async"),
              (s.style.cssText = `width:${kt * 100}%;height:${Tt * 100}%;left:${-r * 100}%;top:${-t * 100}%`),
              i.appendChild(s),
              g.appendChild(i));
            const f = (r + t * 2 + o) % 4,
              p = [
                [-1, h(-0.5, 0.5)],
                [1, h(-0.5, 0.5)],
                [h(-0.5, 0.5), -1],
                [h(-0.5, 0.5), 1],
              ][f];
            a.push({
              el: i,
              im: s,
              fx: p[0] * h(0.6, 1),
              fy: p[1] * h(0.6, 1),
              fz: h(-700, 250),
              rx: h(-60, 60),
              ry: h(-70, 70),
              rz: h(-35, 35),
              d: h(0, 0.3),
            });
          }
        (re.appendChild(g),
          Et.push({
            el: g,
            src: d,
            loaded: !1,
            tiles: a,
            i: e,
            j: o,
            k: l.img.length,
            tilt: h(-4, 4),
            side: o % 2 ? 1 : -1,
          }));
      }),
    ),
      Et.length || w.querySelector(".zs__cards").remove());
    function de(l) {
      l.loaded ||
        ((l.loaded = !0),
        l.tiles.forEach((e) => {
          e.im.src = l.src;
        }));
    }
    let ut,
      Bt,
      Ot = [],
      xt = [];
    function fe() {
      const l = Gt.clientWidth,
        e = yt.clientHeight;
      xt = S.map((g, d) => l * (0.1 + (0.8 * d) / Math.max(1, z - 1)));
      const c = (g) => e * (0.55 + 0.25 * Math.sin((g / l) * 6.3 + 0.6));
      let o = `M0 ${c(0).toFixed(1)}`;
      for (let g = 8; g <= l; g += 8) o += ` L${g} ${c(g).toFixed(1)}`;
      (yt.setAttribute("viewBox", `0 0 ${l} ${e}`),
        (yt.innerHTML =
          `<path d="${o}" fill="none" stroke="rgba(241,234,216,.14)" stroke-width="1.2"/>
      <path class="zs-prog" d="${o}" fill="none" stroke="#ddb771" stroke-width="1.6" stroke-linecap="round"/>` +
          xt
            .map(
              (
                g,
                d,
              ) => `<g class="zs-dot" transform="translate(${g} ${c(g)})"><circle r="8" fill="rgba(221,183,113,.12)"/><circle r="3.5" fill="#0b0d16" stroke="#ddb771" stroke-width="1.3"/>
        <text y="-12" text-anchor="middle" font-size="9" fill="rgba(241,234,216,.65)" letter-spacing="1">${S[d].year.replace(/^.*?(\d{4}).*$/, "$1")}</text></g>`,
            )
            .join("")),
        (ut = yt.querySelector(".zs-prog")),
        (Bt = ut.getTotalLength()),
        (ut.style.strokeDasharray = Bt),
        (Ot = [...yt.querySelectorAll(".zs-dot")]));
    }
    let B = 0,
      M = 0,
      lt = null,
      Ft = [],
      Yt = [],
      T = 120,
      Rt = 30;
    const $t = (l) => -T * 0.32 + Math.sin((l / M) * 2.3 + 0.7) * T * 0.16,
      ge = (l) => T * (0.78 + (0.34 * l) / M) + Math.pow(x((l - M * 0.8) / (M * 0.2)), 2.2) * T * 1.1,
      R = (l) => $t(l) + ge(l),
      ct = (l, e) => {
        const c = 1 - e;
        return [
          c * c * c * l[0][0] + 3 * c * c * e * l[1][0] + 3 * c * e * e * l[2][0] + e * e * e * l[3][0],
          c * c * c * l[0][1] + 3 * c * c * e * l[1][1] + 3 * c * e * e * l[2][1] + e * e * e * l[3][1],
        ];
      },
      qt = (l, e) => {
        const c = ct(l, Math.max(0, e - 0.01)),
          o = ct(l, Math.min(1, e + 0.01));
        return Math.atan2(o[1] - c[1], o[0] - c[0]);
      };
    function pe() {
      const l = innerWidth < 750;
      (Object.assign(at.style, { width: l ? "100vw" : "min(66vw, 1000px)", height: "100%", opacity: l ? 0.55 : 1 }),
        (B = at.clientWidth),
        (M = at.clientHeight),
        (at.width = B * v),
        (at.height = M * v),
        n.setTransform(v, 0, 0, v, 0, 0),
        (T = x(B * 0.17, 64, 170)),
        (Rt = x(B / 26, 17, 34)),
        (lt = document.createElement("canvas")),
        (lt.width = B * v),
        (lt.height = M * v));
      const e = lt.getContext("2d");
      (e.setTransform(v, 0, 0, v, 0, 0), (nt = 77));
      const c = new Path2D();
      c.moveTo(-40, -20);
      for (let t = -20; t <= M + 4; t += 6) c.lineTo(R(t), t);
      (c.lineTo(-40, M + 4), c.closePath());
      const o = new Path2D();
      for (const [t, r, i] of [
        [M * 0.93, B * 0.26, T * 0.24],
        [M * 0.975, B * 0.36, T * 0.18],
        [M * 1, B * 0.2, T * 0.22],
      ]) {
        const s = R(t) - T * 0.5;
        (o.moveTo(s, t - i),
          o.bezierCurveTo(s + r * 0.3, t - i * 0.8, s + r * 0.55, t + i * 0.2, s + r, t + i * 0.9),
          o.bezierCurveTo(s + r * 0.5, t + i * 0.7, s + r * 0.25, t + i * 0.9, s, t + i));
      }
      const g = e.createLinearGradient(0, 0, R(M * 0.5), 0);
      (g.addColorStop(0, "#1d140f"),
        g.addColorStop(0.55, "#3b281c"),
        g.addColorStop(0.9, "#5e412b"),
        g.addColorStop(1, "#76553a"),
        (e.fillStyle = g),
        e.fill(c),
        (e.fillStyle = "#2c1e15"),
        e.fill(o),
        (e.strokeStyle = "rgba(236,190,130,.28)"),
        (e.lineWidth = 1.4),
        e.stroke(o),
        e.save(),
        e.clip(c));
      for (let t = 0.1; t < 0.98; t += 0.085 + h(0, 0.05)) {
        const r = h(0, 9),
          i = h(1.2, 3.2);
        e.beginPath();
        for (let s = -20; s <= M; s += 8) {
          const f = D($t(s), R(s), t) + Math.sin(s * 0.011 + r) * T * 0.05 + Math.sin(s * 0.043 + r * 2) * 2;
          s < -12 ? e.moveTo(f, s) : e.lineTo(f, s);
        }
        ((e.strokeStyle = `rgba(14,8,5,${0.25 + 0.3 * t})`),
          (e.lineWidth = i),
          e.stroke(),
          e.translate(i * 0.9, 0),
          (e.strokeStyle = `rgba(214,160,104,${0.05 + 0.12 * t})`),
          (e.lineWidth = i * 0.6),
          e.stroke(),
          e.translate(-i * 0.9, 0));
      }
      for (let t = 0; t < 900; t++) {
        const r = h(-10, M),
          i = h(0.2, 1),
          s = D($t(r), R(r), i),
          f = h(4, 14);
        ((e.strokeStyle = h() < 0.5 ? `rgba(12,7,4,${h(0.05, 0.18)})` : `rgba(230,180,120,${h(0.03, 0.1) * i})`),
          (e.lineWidth = h(0.6, 1.6)),
          e.beginPath(),
          e.moveTo(s, r),
          e.lineTo(s + h(-1.5, 1.5), r + f),
          e.stroke());
      }
      for (let t = 0; t < 7; t++) {
        const r = h(M * 0.1, M * 0.95),
          i = R(r) - h(T * 0.05, T * 0.4);
        e.fillStyle = `rgba(${h() < 0.5 ? "96,140,70" : "120,160,82"},${h(0.18, 0.32)})`;
        for (let s = 0; s < 14; s++)
          (e.beginPath(), e.ellipse(i + h(-8, 8), r + h(-20, 20), h(2, 6), h(5, 16), h(-0.3, 0.3), 0, I), e.fill());
      }
      for (let t = 0; t < 3; t++) {
        const r = h(M * 0.2, M * 0.8),
          i = D($t(r), R(r), h(0.55, 0.8));
        ((e.fillStyle = "rgba(10,6,4,.55)"),
          e.beginPath(),
          e.ellipse(i, r, T * 0.05, T * 0.11, 0, 0, I),
          e.fill(),
          (e.strokeStyle = "rgba(200,150,95,.25)"),
          (e.lineWidth = 1.2),
          e.beginPath(),
          e.ellipse(i + 1, r, T * 0.08, T * 0.16, 0, 0, I),
          e.stroke());
      }
      const d = e.createLinearGradient(R(M * 0.5) - T * 0.5, 0, R(M * 0.5), 0);
      (d.addColorStop(0, "rgba(255,200,130,0)"),
        d.addColorStop(1, "rgba(255,206,140,.22)"),
        (e.fillStyle = d),
        e.fillRect(0, -20, B, M + 40),
        e.restore(),
        e.save(),
        (e.shadowColor = "rgba(255,200,120,.5)"),
        (e.shadowBlur = 10),
        (e.strokeStyle = "rgba(255,214,150,.55)"),
        (e.lineWidth = 2),
        e.beginPath());
      for (let t = -20; t <= M * 0.86; t += 6) t < -14 ? e.moveTo(R(t) - 1, t) : e.lineTo(R(t) - 1, t);
      (e.stroke(), e.restore());
      // Baum des Lebens: Hauptäste = Meilensteine (steigen in die Krone), Unteräste wachsen aus ihrem Hauptast,
      // Blätter = Fotos. So bleibt der Baum auch mit vielen Ereignissen übersichtlich.
      const mains = S.map((t, r) => (t.parent == null || !S[t.parent] ? r : -1)).filter((r) => r >= 0),
        nm = mains.length;
      Ft = [];
      S.forEach((t, r) => {
        const par = t.parent != null && Ft[t.parent] ? Ft[t.parent] : null;
        let y, f, P;
        if (!par) {
          const q = mains.indexOf(r) / Math.max(1, nm - 1),
            i = M * (0.88 - 0.7 * q),
            s0 = R(i) - T * 0.15,
            up = 0.06 + 0.46 * q + h(-0.03, 0.03);
          ((f = B * (0.5 + 0.08 * Math.sin(r * 1.7)) * (1 - 0.16 * q)),
            (y = [
              [s0, i],
              [s0 + f * 0.28, i - f * up * 0.15],
              [s0 + f * 0.6, i - f * up * 0.85],
              [s0 + f, i - f * up * 1.25],
            ]),
            (P = T * h(0.34, 0.42) * (1 - 0.22 * q)));
        } else {
          const uu = (par.subN = (par.subN || 0) + 1),
            pu = Math.min(0.86, 0.4 + 0.17 * uu),
            [px, py] = ct(par.P, pu),
            pa = qt(par.P, pu),
            a0 = pa + (uu % 2 ? -h(0.6, 0.9) : h(0.3, 0.5)),
            bd = uu % 2 ? 0.28 : -0.2;
          ((f = par.L * h(0.4, 0.52)),
            (y = [
              [px, py],
              [px + Math.cos(a0) * f * 0.34, py + Math.sin(a0) * f * 0.34],
              [px + Math.cos(a0 + bd * 0.5) * f * 0.7, py + Math.sin(a0 + bd * 0.5) * f * 0.7],
              [px + Math.cos(a0 + bd) * f, py + Math.sin(a0 + bd) * f],
            ]),
            (P = par.w0 * h(0.44, 0.54)));
        }
        const W = t.img.length,
          bb = [],
          A = Math.max(2, W);
        for (let $ = 0; $ < A; $++) {
          const N = 0.32 + (0.6 * ($ + 0.5)) / A + h(-0.05, 0.05),
            U = ($ + r) % 2 ? 1 : -1;
          bb.push({
            u: N,
            side: U,
            len: f * h(0.2, 0.32) * (1 - N * 0.3),
            ang: U * h(0.5, 0.85),
            bend: -U * h(0.25, 0.55),
            wf: h(0.38, 0.5),
          });
        }
        bb.push({
          u: h(0.5, 0.62),
          side: -1,
          len: f * h(0.3, 0.4),
          ang: -h(0.35, 0.55),
          bend: h(0.15, 0.35),
          wf: 0.6,
          fork: 1,
        });
        const Y = bb.map(($, N) => ({ tw: N, at: 1 })).concat([{ tw: -1, at: 1 }]),
          q2 = t.img.map(($, N) => ({
            spot: Y[N % Y.length],
            extra: Math.floor(N / Y.length),
            rot: h(-0.5, 0.5),
            ph: h(0, I),
            flip: h() < 0.5 ? -1 : 1,
          }));
        Ft.push({ k: r, P: y, w0: P, L: f, twigs: bb, leaves: q2, g: 0, kc: W, main: !par, label: t.ast || "" });
      });
      // Krone: weiche Laubwolke oben und zwei Stark-Äste, die aus dem Stamm in die Krone führen
      {
        const cr = lt.getContext("2d");
        cr.save();
        for (let i2 = 0; i2 < 70; i2++) {
          const cx = h(0, B * 0.95),
            cy = h(-M * 0.04, M * 0.3) + Math.pow(cx / B, 2) * M * 0.08,
            rr = h(B * 0.05, B * 0.13),
            gg = cr.createRadialGradient(cx, cy, 0, cx, cy, rr);
          (gg.addColorStop(0, h() < 0.3 ? "rgba(214,190,120,.10)" : "rgba(110,150,80,.12)"),
            gg.addColorStop(1, "rgba(110,150,80,0)"),
            (cr.fillStyle = gg),
            cr.beginPath(),
            cr.arc(cx, cy, rr, 0, I),
            cr.fill());
        }
        for (const [k2, bw] of [
          [0.55, T * 0.34],
          [0.85, T * 0.24],
        ]) {
          const y0 = M * 0.2,
            x0 = R(y0) - T * 0.2;
          ((cr.strokeStyle = "#35241a"),
            (cr.lineCap = "round"),
            (cr.lineWidth = bw),
            cr.beginPath(),
            cr.moveTo(x0, y0),
            cr.bezierCurveTo(x0 + B * 0.1 * k2, y0 - M * 0.08, x0 + B * 0.22 * k2, y0 - M * 0.14, x0 + B * 0.36 * k2, y0 - M * 0.22),
            cr.stroke(),
            (cr.strokeStyle = "rgba(240,196,134,.25)"),
            (cr.lineWidth = Math.max(1, bw * 0.12)),
            cr.stroke());
        }
        cr.restore();
      }
        (Yt = Array.from({ length: 46 }, () => ({
          x: h(0, 0.75),
          y: h(0, 1),
          v: h(0.008, 0.03),
          s: h(0.6, 1.8),
          ph: h(0, I),
          gold: h() < 0.4,
        })));
    }
    function ye(l, e, c) {
      const g = [];
      for (let d = 0; d <= 22; d++) {
        const a = (e * d) / 22,
          [t, r] = ct(l.P, a),
          i = Math.sin(c * 0.7 + l.k * 1.3) * 5 * a * a + Math.sin(c * 1.9 + l.k) * 1.2 * a * a,
          s = 1 + 0.9 * Math.pow(Math.max(0, 1 - a / 0.12), 2);
        g.push({ x: t, y: r + i, u: a, w: l.w0 * Math.pow(1 - 0.93 * a, 0.85) * s, a: qt(l.P, a) });
      }
      return g;
    }
    function Xt(l, e, c) {
      const o = [],
        g = [];
      for (const a of l) {
        const t = Math.cos(a.a + Math.PI / 2),
          r = Math.sin(a.a + Math.PI / 2);
        (o.push([a.x - (t * a.w) / 2, a.y - (r * a.w) / 2]), g.push([a.x + (t * a.w) / 2, a.y + (r * a.w) / 2]));
      }
      (n.beginPath(), n.moveTo(o[0][0], o[0][1]), o.forEach((a) => n.lineTo(a[0], a[1])));
      const d = l[l.length - 1];
      n.lineTo(d.x + Math.cos(d.a) * d.w * 0.6, d.y + Math.sin(d.a) * d.w * 0.6);
      for (let a = g.length - 1; a >= 0; a--) n.lineTo(g[a][0], g[a][1]);
      (n.closePath(),
        (n.fillStyle = e),
        n.fill(),
        (n.lineCap = "round"),
        n.beginPath(),
        g.forEach((a, t) => (t ? n.lineTo(a[0], a[1]) : n.moveTo(a[0], a[1]))),
        (n.strokeStyle = "rgba(8,5,3,.45)"),
        (n.lineWidth = Math.max(0.8, l[0].w * 0.12)),
        n.stroke(),
        n.beginPath(),
        o.forEach((a, t) => (t ? n.lineTo(a[0], a[1]) : n.moveTo(a[0], a[1]))),
        (n.strokeStyle = c),
        (n.lineWidth = Math.max(0.7, l[0].w * 0.09)),
        n.stroke(),
        l[0].w > 14 &&
          (n.beginPath(),
          l.forEach((a, t) => {
            const r = Math.sin(t * 1.3 + a.u * 9) * a.w * 0.12;
            t ? n.lineTo(a.x, a.y + r) : n.moveTo(a.x, a.y + r);
          }),
          (n.strokeStyle = "rgba(16,10,6,.35)"),
          (n.lineWidth = 1.2),
          n.stroke()));
    }
    function ue(l, e, c, o, g, d, a, t) {
      (n.save(),
        n.translate(l, e),
        n.rotate(c + Math.sin(a * 1.4 + t) * 0.1),
        (n.strokeStyle = "#4b5a2c"),
        (n.lineWidth = o * 0.07),
        n.beginPath(),
        n.moveTo(-o * 0.3, 0),
        n.lineTo(0, 0),
        n.stroke(),
        n.scale(0.35 + 0.65 * g, Math.max(0.06, g)));
      const r = new Path2D();
      (r.moveTo(0, 0),
        r.bezierCurveTo(o * 0.35, -o * 0.56, o * 1.2, -o * 0.52, o * 1.85, -o * 0.06),
        r.bezierCurveTo(o * 1.25, o * 0.36, o * 0.42, o * 0.42, 0, 0),
        d > 0 && ((n.shadowColor = `rgba(255,214,130,${d})`), (n.shadowBlur = 22 * d)));
      const i = n.createLinearGradient(0, 0, o * 1.85, 0);
      (i.addColorStop(0, "#24552f"),
        i.addColorStop(0.45, "#4c9446"),
        i.addColorStop(1, "#a8d468"),
        (n.fillStyle = i),
        n.fill(r),
        (n.shadowBlur = 0),
        n.save(),
        n.clip(r),
        (n.fillStyle = "rgba(8,36,22,.28)"),
        n.fillRect(0, 0, o * 2, o),
        d > 0 && ((n.fillStyle = `rgba(255,222,140,${0.38 * d})`), n.fillRect(0, -o, o * 2, o * 2)),
        n.restore(),
        (n.strokeStyle = "rgba(232,248,196,.75)"),
        (n.lineWidth = o * 0.05),
        n.beginPath(),
        n.moveTo(o * 0.04, 0),
        n.quadraticCurveTo(o * 0.9, -o * 0.1, o * 1.78, -o * 0.06),
        n.stroke(),
        (n.strokeStyle = "rgba(220,242,180,.32)"),
        (n.lineWidth = o * 0.028));
      for (let s = 1; s <= 4; s++) {
        const f = s / 5.2,
          p = o * 1.75 * f,
          y = -o * 0.09 * Math.sin(f * Math.PI);
        (n.beginPath(),
          n.moveTo(p, y),
          n.quadraticCurveTo(p + o * 0.14, y - o * 0.2, p + o * 0.3, y - o * 0.32 * (1 - f * 0.5)),
          n.stroke(),
          n.beginPath(),
          n.moveTo(p, y),
          n.quadraticCurveTo(p + o * 0.14, y + o * 0.16, p + o * 0.3, y + o * 0.26 * (1 - f * 0.5)),
          n.stroke());
      }
      ((n.strokeStyle = "rgba(255,250,214,.35)"),
        (n.lineWidth = o * 0.03),
        n.beginPath(),
        n.moveTo(0, 0),
        n.bezierCurveTo(o * 0.35, -o * 0.56, o * 1.2, -o * 0.52, o * 1.85, -o * 0.06),
        n.stroke(),
        n.restore());
    }
    const vt = (l, e, c, o, g) => {
      const d = n.createRadialGradient(l, e, 0, l, e, c);
      (d.addColorStop(0, `rgba(${g},${o})`),
        d.addColorStop(1, `rgba(${g},0)`),
        (n.fillStyle = d),
        n.beginPath(),
        n.arc(l, e, c, 0, I),
        n.fill());
    };
    function xe(l, e, c, o, g) {
      if ((n.clearRect(0, 0, B, M), !lt)) return;
      const d = M * (1 - zt(e)) - 30;
      (vt(T * 0.4, M, B * 0.55, 0.16 * e, "255,196,120"),
        n.save(),
        n.beginPath(),
        n.rect(0, d, B, M - d + 10),
        n.clip(),
        n.drawImage(lt, 0, 0, B, M),
        n.restore());
      for (const t of Ft) {
        const r = J(x((l - t.k + 0.45) * 1.6));
        if (((t.g = r), r <= 0)) continue;
        const i = ye(t, r, c);
        (Xt(i, t.k % 2 ? "#3a281b" : "#412c1e", "rgba(240,196,134,.5)"),
          (t.tw = t.twigs.map((y) => {
            const P = zt(x(((r - y.u) / (1 - y.u + 0.1)) * 1.15));
            if (P <= 0) return null;
            const W = Math.round((y.u * 22) / Math.max(r, 0.001)),
              b = i[Math.min(i.length - 1, Math.max(0, Math.round((y.u / Math.max(r, 0.001)) * 22)))];
            if (!b || b.u + 0.001 < y.u - 0.05) return null;
            const A = b.a - y.ang,
              Y = y.len * P,
              q = 12,
              $ = [],
              N = Math.cos(b.a + Math.PI / 2),
              U = Math.sin(b.a + Math.PI / 2);
            let Pt = b.x - N * y.side * b.w * 0.28,
              Ct = b.y - U * y.side * b.w * 0.28;
            for (let Mt = 0; Mt <= q; Mt++) {
              const dt = Mt / q,
                tt = A + y.bend * dt + Math.sin(c * 1.1 + y.u * 9) * 0.03 * dt;
              ($.push({ x: Pt, y: Ct, u: dt, w: Math.max(0.8, b.w * y.wf * Math.pow(1 - 0.9 * dt, 0.9)), a: tt }),
                (Pt += (Math.cos(tt) * Y) / q),
                (Ct += (Math.sin(tt) * Y) / q));
            }
            return (Xt($, y.fork ? "#3d2a1d" : "#3a281c", "rgba(240,196,134,.42)"), $[$.length - 1]);
          })));
        const s = S[t.k].year.replace(/^.*?(\d{4}).*$/, "$1"),
          [f, p] = ct(t.P, 0.17);
        if (
          ((n.globalAlpha = x((r - 0.2) * 3) * 0.75),
          (n.fillStyle = "#f1dcb4"),
          (n.font = `500 ${x(t.w0 * 0.32, 9, 13)}px system-ui, sans-serif`),
          n.fillText(s, f, p - t.w0 * 0.55),
          t.main &&
            t.label &&
            r > 0.45 &&
            (() => {
              const [lx, ly] = ct(t.P, 0.72);
              (n.save(),
                (n.globalAlpha = x((r - 0.45) * 2.5)),
                (n.font = `600 ${x(t.w0 * 0.48, 13, 22)}px "Cormorant Garamond", Georgia, serif`),
                (n.textAlign = "center"),
                (n.shadowColor = "rgba(0,0,0,.6)"),
                (n.shadowBlur = 8),
                (n.fillStyle = "#f3d98e"),
                n.fillText(t.label, lx, ly - t.w0 * 0.9),
                n.restore());
            })(),
          (n.globalAlpha = 1),
          r > 0 && r < 1)
        ) {
          const y = x(r * 1.6),
            P = t.P[0][1];
          let W, b;
          if (y < 0.5) ((b = D(M, P, y / 0.5)), (W = R(b) - T * 0.35));
          else {
            const A = ((y - 0.5) / 0.5) * r;
            [W, b] = ct(t.P, A);
          }
          (vt(W, b, 46, 0.55 * Math.sin(Math.PI * r), "255,214,140"),
            vt(W, b, 10, 0.9 * Math.sin(Math.PI * r), "255,246,220"));
        }
      }
      const a = [];
      for (const t of Ft)
        t.g <= 0 ||
          t.leaves.forEach((r, i) => {
            const s = x((l - t.k - (i + 0.1) / t.kc) * t.kc * 3.2);
            if (s <= 0) return;
            let f, p;
            if (r.spot.tw >= 0 && t.tw && t.tw[r.spot.tw]) ((f = t.tw[r.spot.tw]), (p = f.a));
            else {
              const [W, b] = ct(t.P, t.g),
                A = Math.sin(c * 0.7 + t.k * 1.3) * 5 * t.g * t.g;
              ((f = { x: W, y: b + A }), (p = qt(t.P, t.g)));
            }
            if (!f) return;
            const y = Math.sin(s * Math.PI * 0.5) + Math.sin(s * Math.PI) * 0.12,
              P = o === t.k && g === i;
            a.push([
              f.x,
              f.y,
              p + r.rot * r.flip - (r.extra ? 0.9 : 0),
              Rt * (P ? 1.15 : 1),
              y,
              P ? 0.9 + 0.1 * Math.sin(c * 3) : 0,
              r.ph,
              s,
            ]);
          });
      for (const t of a)
        (t[7] < 1 && vt(t[0], t[1], Rt * 2, 0.5 * Math.sin(Math.PI * t[7]), "220,255,170"),
          ue(t[0], t[1], t[2], t[3], t[4], t[5], c, t[6]));
      for (const t of Yt) {
        ((t.y -= t.v * 0.016), t.y < -0.05 && ((t.y = 1.05), (t.x = h(0, 0.75))));
        const r = e * (0.35 + 0.35 * Math.sin(c * 1.3 * t.s + t.ph)),
          i = B * (t.x + 0.015 * Math.sin(c * 0.5 + t.ph)),
          s = M * t.y;
        ((n.fillStyle = t.gold ? `rgba(255,226,160,${r})` : `rgba(206,255,180,${r * 0.8})`),
          n.beginPath(),
          n.arc(i, s, 1.3 * t.s, 0, I),
          n.fill());
      }
    }
    let mt = 0,
      ht = 0,
      Zt = [];
    function me() {
      ((mt = pt.clientWidth),
        (ht = pt.clientHeight),
        (pt.width = mt * v),
        (pt.height = ht * v),
        m.setTransform(v, 0, 0, v, 0, 0),
        (nt = 99),
        (Zt = Array.from({ length: 90 }, () => ({
          s: h(-1, z + 6),
          x: h(-3.2, 3.2),
          y: h(-1.6, 1.1),
          r: h(0.6, 1.6),
        }))));
    }
    const At = (l) => Math.sin(l * 1.15 + 0.5) * 1.05,
      Jt = (l) => 0.85 - 0.22 * Math.sin(l * 0.7 + 1);
    function be(l, e, c) {
      if ((m.clearRect(0, 0, mt, ht), c <= 0)) return;
      const o = l - 0.55,
        g = ht * 0.4,
        d = mt * 0.34,
        a = ht * 0.36,
        t = 2.1,
        r = (i, s, f) => {
          const p = (i - o) * t;
          return p > 0.12 ? [mt / 2 + ((s - At(o + 0.3) * 0.6) * d) / p, g + (f * a) / p, p] : null;
        };
      for (const i of Zt) {
        const s = r(i.s, i.x, i.y);
        if (!s || s[2] > 14) continue;
        const f = c * x(1.2 - s[2] / 12) * x(s[2] * 2);
        ((m.fillStyle = `rgba(230,220,255,${f * 0.7})`),
          m.beginPath(),
          m.arc(s[0], s[1], i.r * x(3 / s[2], 0.4, 3), 0, I),
          m.fill());
      }
      for (let i = 0; i < 2; i++) {
        let s = null;
        for (let f = o + 0.38; f < o + 6.5; f += 0.025) {
          const p = r(f, At(f), Jt(f));
          if (!p) {
            s = null;
            continue;
          }
          if (s) {
            const y = c * x(1.15 - p[2] / 13) * (f <= l + 0.02 ? 1 : 0.55);
            ((m.strokeStyle = i ? `rgba(255,236,190,${y})` : `rgba(221,183,113,${y * 0.1})`),
              (m.lineWidth = i ? x(3.2 / p[2], 0.5, 3.5) : x(16 / p[2], 2, 18)),
              (m.lineCap = "butt"),
              m.beginPath(),
              m.moveTo(s[0], s[1]),
              m.lineTo(p[0], p[1]),
              m.stroke());
          }
          s = p;
        }
      }
      for (let i = 0; i < z; i++) {
        const s = r(i, At(i), Jt(i));
        if (!s || s[2] > 13) continue;
        const f = c * x(1.1 - s[2] / 12) * x((s[2] - 0.25) * 2.2),
          p = (ht * 0.2) / s[2];
        if (f <= 0.01) continue;
        const y = Math.abs(l - i - 0.5) < 0.5;
        (m.save(),
          (m.globalAlpha = f),
          (m.strokeStyle = y ? "#ffe7b0" : "rgba(221,183,113,.75)"),
          (m.lineWidth = x(2.4 / s[2], 0.5, 3)),
          (m.shadowColor = "rgba(255,214,140,.8)"),
          (m.shadowBlur = y ? 16 : 6),
          m.beginPath(),
          m.ellipse(s[0], s[1] - p, p * 0.72, p, 0, 0, I),
          m.stroke(),
          (m.shadowBlur = 0),
          (m.fillStyle = "#fff3cf"),
          m.beginPath(),
          m.arc(s[0], s[1], x(4 / s[2], 1, 6), 0, I),
          m.fill(),
          (m.font = `300 ${x(30 / s[2], 8, 40)}px system-ui, sans-serif`),
          (m.textAlign = "center"),
          (m.fillStyle = "rgba(241,234,216,.85)"),
          m.fillText(S[i].year.replace(/^.*?(\d{4}).*$/, "$1"), s[0], s[1] - p * 2.12),
          m.restore());
      }
    }
    let K = null,
      Vt = null,
      Q = {},
      L = 0,
      G = 0;
    const Me = () => window.d3 && window.topojson;
    function Kt() {
      if (!Me()) {
        setTimeout(Kt, 150);
        return;
      }
      const l = (e) => fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/" + e).then((c) => c.json());
      l("countries-110m.json")
        .then(
          (e) => (
            (K = { all: topojson.feature(e, e.objects.countries), land: topojson.feature(e, e.objects.land) }),
            It(),
            l("countries-50m.json")
          ),
        )
        .then((e) => {
          ((Vt = topojson.feature(e, e.objects.countries)), (Q = {}), It());
        })
        .catch(() => {});
    }
    Kt();
    const Qt = (l, e) => e.features.find((c) => String(c.id).padStart(3, "0") === l);
    function we(l) {
      const e = l + "x" + L + "x" + G;
      if (Q[e] !== void 0) return Q[e];
      const c = Qt(l, Vt || K.all);
      if (!c) return (Q[e] = null);
      const o = d3.geoMercator().fitExtent(
          [
            [L * 0.2, G * 0.1],
            [L * 0.9, G * 0.82],
          ],
          c,
        ),
        g = new Path2D(d3.geoPath(o)(c)),
        d = ie[l] || { mountains: [], cities: [] },
        a = d3.geoBounds(c),
        t = [],
        r = [],
        i = (f, p) => u.isPointInPath(g, f * v, p * v);
      nt = Number(l) + 11;
      for (const [f, p, y, P] of d.mountains)
        for (let W = 0; W < 60; W++) {
          const [b, A] = o([h(f, p), h(y, P)]);
          i(b, A) && t.push([b, A, h(6, 15)]);
        }
      for (let f = 0; f < 700 && r.length < 150; f++) {
        const [p, y] = o([h(a[0][0], a[1][0]), h(a[0][1], a[1][1])]);
        i(p, y) && r.push([p, y, h(1.4, 2.8)]);
      }
      const s = d.cities.map(([f, p, y, P]) => {
        const [W, b] = o([p, y]);
        return { nm: f, x: W, y: b, main: P };
      });
      return (Q[e] = { path: g, peaks: t, trees: r, cities: s });
    }
    function It() {
      const l = [...new Set(S.map((c) => c.iso))],
        e = () => {
          const c = l.shift();
          !c || !K || !L || (we(c), setTimeout(e, 30));
        };
      setTimeout(e, 30);
    }
    function Ut(l, e, c) {
      if (!K || e <= 0.01) return;
      const o = Q[l + "x" + L + "x" + G];
      if (!o) return;
      u.save();
      const g = Math.max(L, G) * J(x(e * 1.25));
      (u.beginPath(),
        u.arc(L * 0.55, G * 0.45, g, 0, I),
        u.clip(),
        (u.globalAlpha = 0.9 * e),
        (u.fillStyle = "rgba(80,110,160,.08)"),
        u.fill(o.path),
        (u.shadowColor = "rgba(221,183,113,.7)"),
        (u.shadowBlur = 12),
        (u.strokeStyle = "rgba(221,183,113,.75)"),
        (u.lineWidth = 1.6),
        u.stroke(o.path),
        (u.shadowBlur = 0),
        (u.fillStyle = "rgba(110,170,120,.45)"));
      for (const [d, a, t] of o.trees)
        (u.beginPath(), u.moveTo(d, a - t * 2), u.lineTo(d + t, a + t), u.lineTo(d - t, a + t), u.fill());
      ((u.strokeStyle = "rgba(220,228,240,.55)"), (u.lineWidth = 1));
      for (const [d, a, t] of o.peaks)
        (u.beginPath(),
          u.moveTo(d - t, a + t * 0.4),
          u.lineTo(d, a - t * 0.6),
          u.lineTo(d + t, a + t * 0.4),
          u.stroke());
      for (const d of o.cities) {
        const a = d.main ? 1 + 0.35 * Math.sin(c * 3) : 1,
          t = u.createRadialGradient(d.x, d.y, 0, d.x, d.y, 16 * a);
        (t.addColorStop(0, d.main ? "rgba(255,230,170,.95)" : "rgba(200,230,255,.7)"),
          t.addColorStop(1, "rgba(255,230,170,0)"),
          (u.fillStyle = t),
          u.beginPath(),
          u.arc(d.x, d.y, 16 * a, 0, I),
          u.fill(),
          (u.fillStyle = d.main ? "#fff3cf" : "rgba(241,234,216,.75)"),
          (u.font = `${d.main ? 600 : 400} ${d.main ? 15 : 12}px system-ui, sans-serif`),
          u.fillText(d.nm, d.x + 9, d.y - 7));
      }
      u.restore();
    }
    let bt = [-11, -47];
    function Se(l, e, c, o) {
      const g = St.width;
      if ((k.clearRect(0, 0, g, g), !K || o <= 0)) return;
      bt = [D(bt[0], -e[0], 0.05), D(bt[1], -e[1] * 0.8, 0.05)];
      const d = d3
          .geoOrthographic()
          .scale(g * 0.46)
          .translate([g / 2, g / 2])
          .rotate([bt[0] + Math.sin(c * 0.2) * 2, bt[1]])
          .clipAngle(90),
        a = d3.geoPath(d, k);
      k.globalAlpha = o;
      const t = k.createRadialGradient(g * 0.4, g * 0.35, g * 0.05, g / 2, g / 2, g * 0.48);
      (t.addColorStop(0, "#2c5f8a"),
        t.addColorStop(1, "#0a1a2c"),
        (k.fillStyle = t),
        k.beginPath(),
        a({ type: "Sphere" }),
        k.fill(),
        (k.strokeStyle = "rgba(255,255,255,.08)"),
        (k.lineWidth = 0.5),
        k.beginPath(),
        a(d3.geoGraticule10()),
        k.stroke(),
        (k.fillStyle = "rgba(120,170,120,.75)"),
        k.beginPath(),
        a(K.land),
        k.fill());
      const r = Qt(l, K.all);
      (r &&
        ((k.shadowColor = "rgba(255,214,140,.9)"),
        (k.shadowBlur = 10 + 4 * Math.sin(c * 3)),
        (k.fillStyle = "#f4d58a"),
        k.beginPath(),
        a(r),
        k.fill(),
        (k.shadowBlur = 0)),
        (k.strokeStyle = "rgba(160,210,255,.5)"),
        (k.lineWidth = 1.2),
        k.beginPath(),
        a({ type: "Sphere" }),
        k.stroke(),
        (k.globalAlpha = 1));
    }
    const te = document.querySelector("sticky-header, header.site-header, header, .header-wrapper"),
      H = document.querySelector('.header__heading-logo, header .logo img, header [class*="logo"] img');
    Wt.src = H ? H.currentSrc || H.src : w.dataset.logo;
    let O = 140,
      Lt = 90;
    function ke() {
      ((O = Math.round(Math.min(150, innerWidth * 0.26))),
        (V.style.width = V.style.height = O + "px"),
        (St.width = St.height = Math.round(O * v)));
    }
    const Te = () => (te ? Math.max(0, te.getBoundingClientRect().bottom) : 0);
    function ee() {
      ((v = Math.min(devicePixelRatio || 1, 2)),
        (L = gt.clientWidth),
        (G = gt.clientHeight),
        (gt.width = L * v),
        (gt.height = G * v),
        u.setTransform(v, 0, 0, v, 0, 0),
        (Q = {}),
        ke(),
        fe(),
        pe(),
        me(),
        It());
    }
    (addEventListener("resize", ee), ee());
    let _ = -1;
    function oe(l) {
      const e = l / 1e3,
        c = innerHeight,
        o = w.getBoundingClientRect(),
        g = x(-o.top / Math.max(1, o.height - c));
      _ = _ < 0 ? g : _ + (g - _) * 0.12;
      const d = o.bottom > -50 && o.top < c + 50;
      if (((V.style.visibility = d && o.bottom > c * 0.25 ? "visible" : "hidden"), d)) {
        const a = 1 / (z + 2),
          t = 1 - 0.6 / (z + 2),
          r = x((_ - a) / (t - a)) * z,
          i = Math.min(z - 1, Math.floor(r)),
          s = r - i,
          f = S[i],
          p = C(_, 0, a);
        ((Nt.style.opacity = 1 - C(p, 0.35, 0.9)),
          (Nt.style.transform = `translateY(${-p * 40}px) scale(${1 - p * 0.08})`));
        const y = J(C(p, 0, 0.3)),
          P = C(p, 0.26, 0.42),
          W = J(C(_, a * 0.45, a * 1.25)),
          b = C(W, 0.25, 0.85),
          A = Math.max(16, Te() - O * 0.12);
        Lt += (A - Lt) * 0.25;
        const Y = innerWidth - O - Math.max(14, innerWidth * 0.03),
          q = Lt,
          $ = H ? H.getBoundingClientRect() : null,
          N = $ && $.width > 0 ? Math.max($.width, $.height) : 52,
          U = D(Math.min(1, N / O), 1, W);
        ((Wt.style.opacity = (P * (1 - b)).toFixed(3)),
          (Wt.style.transform = `scale(${(0.55 + 0.45 * zt(P)).toFixed(3)}) rotate(${(W * 200).toFixed(1)}deg)`),
          (V.style.transform = `translate3d(${Y.toFixed(1)}px, ${q.toFixed(1)}px, 0) scale(${U.toFixed(4)})`));
        const Pt = Y + O / 2,
          Ct = q + O / 2;
        if ($ && p > 0.002 && P < 1) {
          const E = $.left + $.width / 2,
            et = $.top + $.height / 2,
            ft = D(E, Pt, y),
            X = D(et, Ct, y) + Math.sin(y * Math.PI) * O * 0.6;
          (rt.unshift([ft, X]),
            rt.length > 14 && (rt.length = 14),
            (it.style.opacity = (1 - P) * x(p * 60)),
            (it.style.transform = `translate3d(${(ft - 5).toFixed(1)}px, ${(X - 5).toFixed(1)}px, 0) scale(${(1 + 1.6 * Math.sin(Math.PI * P)).toFixed(3)})`),
            st.forEach((wt, Z) => {
              const j = rt[Math.min(rt.length - 1, Z + 1)] || [ft, X];
              ((wt.style.opacity = ((1 - P) * (1 - Z / st.length) * 0.7 * x(p * 60)).toFixed(3)),
                (wt.style.transform = `translate3d(${(j[0] - 3).toFixed(1)}px, ${(j[1] - 3).toFixed(1)}px, 0) scale(${(1 - Z / st.length).toFixed(3)})`));
            }));
        } else
          ((it.style.opacity = 0),
            st.forEach((E) => {
              E.style.opacity = 0;
            }),
            (rt.length = 0));
        (H && ((H.style.transition = "opacity .25s"), (H.style.opacity = p > 0.002 ? C(b, 0.7, 1) : 1)),
          Se(f.iso, f.ll, e, b),
          u.clearRect(0, 0, L, G));
        const Mt = J(C(s, 0, 0.35)),
          dt = C(s, 0.88, 1);
        (_ > a * 0.8 &&
          (i > 0 && s < 0.3 && S[i - 1].iso !== f.iso && Ut(S[i - 1].iso, 1 - C(s, 0, 0.3), e),
          Ut(
            f.iso,
            S[i - 1] && S[i - 1].iso === f.iso && i > 0 ? 1 : Mt * (1 - (S[i + 1] && S[i + 1].iso !== f.iso ? dt : 0)),
            e,
          )),
          be(_ > a * 0.5 ? r : 0, e, x(C(_, a * 0.4, a)) * (1 - C(_, t, 1) * 0.7)));
        const tt = _ > a ? Math.min(C(s, 0.05, 0.2), 1 - C(s, 0.85, 0.98)) : 0;
        (_t.dataset.i !== String(i) &&
          ((_t.dataset.i = i),
          (_t.textContent = f.year),
          (le.textContent = f.title),
          (ce.textContent = f.text),
          (he.textContent = f.place)),
          (Ht.style.opacity = i === z - 1 ? Math.max(tt, C(s, 0.05, 0.2)) * (1 - C(_, t, t + 0.03)) : tt),
          (Ht.style.transform = `translateY(${(1 - tt) * 24}px)`));
        for (const E of Et) {
          let et = !1;
          if ((Math.abs(E.i - r) < 1.6 && de(E), E.i === i && _ > a)) {
            const ft = 1 / E.k,
              X = (s - E.j * ft) / ft;
            if (X > -0.6 && X < 1.35) {
              et = !0;
              const wt = x((X + 0.6) / 0.75),
                Z = J(x((X - 0.85) / 0.5));
              ((E.el.style.opacity = (1 - Z) * (1 - C(_, t, t + 0.03))),
                (E.el.style.transform = `translate3d(${-Z * L * 0.12 * E.side}px, ${-Z * G * 0.08}px, ${-Z * 1300}px) rotateZ(${E.tilt * (1 - wt * 0.7)}deg)`));
              for (const j of E.tiles) {
                const ae = J(x((wt - j.d) / 0.7)),
                  ot = 1 - ae;
                ((j.el.style.opacity = x(ae * 2.5)),
                  (j.el.style.transform =
                    ot < 0.001
                      ? "none"
                      : `translate3d(${(j.fx * L * 0.7 * ot).toFixed(1)}px, ${(j.fy * G * 0.7 * ot).toFixed(1)}px, ${(j.fz * ot).toFixed(1)}px) rotateX(${j.rx * ot}deg) rotateY(${j.ry * ot}deg) rotateZ(${j.rz * ot}deg)`));
              }
            }
          }
          E.el.style.visibility = et ? "visible" : "hidden";
        }
        (ut &&
          (ut.style.strokeDashoffset =
            Bt * (1 - x((xt[i] + (xt[Math.min(z - 1, i + 1)] - xt[i]) * s) / Gt.clientWidth))),
          Ot.forEach((E, et) => {
            ((E.style.opacity = et <= i ? 1 : 0.4),
              E.firstChild.setAttribute("r", et === i ? 10 + 2 * Math.sin(e * 3) : 7));
          }));
        const $e = Math.min(S[i].img.length - 1, Math.floor(s * S[i].img.length));
        xe(_ > a * 0.9 ? r : -1, C(_, 0, a * 0.9), e, _ > a ? i : -1, $e);
        const ne = C(_, t + 0.02, 1);
        ((Dt.style.opacity = ne), (Dt.style.pointerEvents = ne > 0.5 ? "auto" : "none"));
      } else H && (H.style.opacity = 1);
      requestAnimationFrame(oe);
    }
    requestAnimationFrame(oe);
  }
  function jt() {
    document.querySelectorAll("section.zs[data-sid]").forEach(se);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", jt) : jt();
})();
