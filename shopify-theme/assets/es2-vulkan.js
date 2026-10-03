"use strict";
(() => {
  function it(h) {
    if (!h || h.dataset.vulkan || h.dataset.ready === "skip" || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    h.dataset.vulkan = "1";
    const V = h.querySelector(".es__stage"),
      X = h.querySelector(".es__orb"),
      A = h.querySelector(".es__erupt");
    if (!V || !X || !A) return;
    const e = A.getContext("2d"),
      S = (parseInt(h.dataset.intensity, 10) || 70) / 100,
      I = { u: 0.505, v: 0.7 },
      j = (a, i = 0, c = 1) => Math.min(c, Math.max(i, a)),
      C = (a, i, c) => j((a - i) / (c - i)),
      lt = (a) => (a < 0.5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2),
      s = (a, i) => a + Math.random() * (i - a),
      rt = (a) => a[Math.floor(Math.random() * a.length)];
    function R(a, i) {
      const c = document.createElement("canvas");
      c.width = c.height = a;
      const g = c.getContext("2d"),
        f = a / 2,
        G = g.createRadialGradient(f, f, 0, f, f, f);
      return (i.forEach(([J, P]) => G.addColorStop(J, P)), (g.fillStyle = G), g.fillRect(0, 0, a, a), c);
    }
    const q = {
        ember: R(32, [
          [0, "rgba(255,250,220,1)"],
          [0.25, "rgba(255,190,90,.9)"],
          [0.6, "rgba(255,90,30,.25)"],
          [1, "rgba(255,60,20,0)"],
        ]),
        star: R(32, [
          [0, "rgba(255,255,255,1)"],
          [0.2, "rgba(255,248,230,.85)"],
          [0.5, "rgba(200,190,255,.2)"],
          [1, "rgba(255,255,255,0)"],
        ]),
        glow: R(128, [
          [0, "rgba(255,240,200,1)"],
          [0.2, "rgba(255,170,80,.7)"],
          [0.55, "rgba(255,90,40,.18)"],
          [1, "rgba(255,80,40,0)"],
        ]),
      },
      K = ["255,120,60", "255,180,110", "170,120,255", "120,190,255", "255,140,190"],
      Q = {};
    K.forEach((a) => {
      Q[a] = R(128, [
        [0, `rgba(${a},.55)`],
        [0.45, `rgba(${a},.18)`],
        [1, `rgba(${a},0)`],
      ]);
    });
    let m = 0,
      u = 0;
    function U() {
      const a = Math.min(devicePixelRatio || 1, 2);
      ((m = V.clientWidth),
        (u = V.clientHeight),
        (A.width = m * a),
        (A.height = u * a),
        e.setTransform(a, 0, 0, a, 0, 0));
    }
    const d = [],
      ct = 420;
    function E(a) {
      d.length < ct && d.push(a);
    }
    let p = 0,
      Z = performance.now(),
      B = { lava: 0, spark: 0, crackle: 0, mist: 0 };
    function D(a) {
      const i = Math.min(0.05, (a - Z) / 1e3);
      Z = a;
      const c = a / 1e3,
        g = h.getBoundingClientRect(),
        f = innerHeight;
      if (!(g.bottom > -50 && g.top < f + 50)) {
        (d.length && ((d.length = 0), e.clearRect(0, 0, m, u)), requestAnimationFrame(D));
        return;
      }
      const J = j(-g.top / Math.max(1, g.height - f));
      p += (J - p) * 0.14;
      const P = X.style.transform || "",
        ht = parseFloat((P.match(/rotate\(([-\d.e]+)deg\)/) || [0, 0])[1]) || 0,
        dt = parseFloat((P.match(/scale\(([-\d.e]+)\)/) || [0, 1])[1]) || 1,
        v = X.offsetWidth * dt,
        b = Math.max(0.75, v / 270),
        tt = (ht * Math.PI) / 180,
        x = Math.cos(tt),
        k = Math.sin(tt),
        at = (I.u - 0.5) * v,
        et = (I.v - 0.5) * v,
        T = m / 2 + at * x - et * k,
        _ = u / 2 + at * k + et * x,
        F = k,
        L = -x,
        nt = -L,
        st = F,
        w = Math.max(0.25, lt(C(p, 0.01, 0.1))) * (1 - C(p, 0.34, 0.5)),
        O = Math.sin(Math.PI * C(p, 0.01, 0.3)),
        N = (n, t) => m / 2 + ((n - 0.5) * x - (t - 0.5) * k) * v,
        Y = (n, t) => u / 2 + ((n - 0.5) * k + (t - 0.5) * x) * v,
        W = (n, t) => {
          B[n] += t * i;
          const o = Math.floor(B[n]);
          return ((B[n] -= o), o);
        },
        gt = d.reduce((n, t) => n + (t.kind === "lava"), 0);
      for (let n = W("lava", (0.35 + 1.1 * O) * w * S); n-- && !(gt > 6);)
        E({
          kind: "lava",
          u: I.u + s(-0.01, 0.01),
          v: I.v + s(-0.005, 0.005),
          du: s(-0.016, 0.016),
          dv: s(0.008, 0.016),
          life: 0,
          ttl: s(5, 8),
          s: s(2.2, 3.6) * b,
          trail: [],
        });
      for (let n = W("spark", (0.25 + 0.8 * O) * w * S); n--;) {
        const t = s(22, 55) * b,
          o = s(-0.7, 0.7);
        E({
          kind: "spark",
          x: T,
          y: _,
          vx: (F + nt * o) * t,
          vy: (L + st * o) * t,
          life: 0,
          ttl: s(6, 10),
          s: s(4, 8) * b,
          ph: s(0, 6.28),
          tw: s(2, 5),
          star: s(0.25, 0.45),
        });
      }
      for (let n = W("crackle", 0); n--;) {
        const t = Math.atan2(L, F) + s(-1.4, 1.4),
          o = s(3, 9) * b;
        E({
          kind: "crackle",
          x: T + s(-2, 2),
          y: _ + s(-2, 2),
          ax: Math.cos(t),
          ay: Math.sin(t),
          len: o,
          life: 0,
          ttl: s(0.08, 0.2),
        });
      }
      for (let n = W("mist", (0.4 + 0.8 * O) * w * S); n--;) {
        const t = s(12, 34) * b,
          o = s(-1.3, 1.3);
        E({
          kind: "mist",
          x: T,
          y: _,
          vx: (F + nt * o) * t,
          vy: (L + st * o) * t,
          life: 0,
          ttl: s(8, 13),
          s: s(60, 120) * b,
          grow: s(3, 5),
          c: rt(K),
        });
      }
      (e.clearRect(0, 0, m, u), (e.globalCompositeOperation = "lighter"));
      const ot =
        (0.4 + 0.6 * w) * (0.88 + 0.08 * Math.sin(c * 2.3) + 0.04 * Math.sin(c * 5.1)) * (1 - C(p, 0.42, 0.52));
      if (ot > 0.02) {
        const n = v * (0.16 + 0.12 * w + 0.1 * O);
        ((e.globalAlpha = j(ot * 0.6)), e.drawImage(q.glow, T - n / 2, _ - n / 2, n, n));
      }
      for (let n = d.length - 1; n >= 0; n--) {
        const t = d[n];
        if (((t.life += i), t.life > t.ttl)) {
          d.splice(n, 1);
          continue;
        }
        const o = t.life / t.ttl;
        if (t.kind === "lava") {
          const r = Math.max(0.08, 1 - o * 1.1);
          ((t.u += t.du * r * i),
            (t.v += t.dv * r * i),
            t.trail.push(t.u, t.v),
            t.trail.length > 60 && t.trail.splice(0, 2));
          const l = 1 - o,
            y = l > 0.6 ? "255,210,120" : l > 0.3 ? "255,140,60" : "200,60,30";
          ((e.lineCap = "round"),
            (e.lineJoin = "round"),
            (e.strokeStyle = `rgba(${y},${0.55 * Math.min(1, l * 1.6)})`),
            (e.lineWidth = t.s * (0.6 + 0.6 * l)),
            (e.globalAlpha = 1),
            e.beginPath(),
            e.moveTo(N(t.trail[0], t.trail[1]), Y(t.trail[0], t.trail[1])));
          for (let M = 2; M < t.trail.length; M += 2)
            e.lineTo(N(t.trail[M], t.trail[M + 1]), Y(t.trail[M], t.trail[M + 1]));
          e.stroke();
          const z = N(t.u, t.v),
            ft = Y(t.u, t.v),
            $ = t.s * 3.2 * (0.5 + l);
          ((e.globalAlpha = 0.8 * l), e.drawImage(q.ember, z - $ / 2, ft - $ / 2, $, $));
        } else if (t.kind === "spark")
          if (((t.vx *= 0.992), (t.vy *= 0.992), (t.vy -= 2 * i), (t.x += t.vx * i), (t.y += t.vy * i), o < t.star)) {
            const r = o / t.star,
              l = t.s * (1 - r * 0.5);
            ((e.globalAlpha = Math.min(1, o * 20) * (1 - r * 0.35)),
              e.drawImage(q.ember, t.x - l / 2, t.y - l / 2, l, l));
          } else {
            const r = (o - t.star) / (1 - t.star),
              l = 0.55 + 0.45 * Math.sin(t.life * t.tw + t.ph),
              y = t.s * (0.55 + 0.35 * l),
              z = Math.min(1, r * 4) * (1 - Math.pow(r, 3)) * l;
            ((e.globalAlpha = z), e.drawImage(q.star, t.x - y / 2, t.y - y / 2, y, y));
          }
        else if (t.kind === "crackle")
          ((e.globalAlpha = 1 - o),
            (e.strokeStyle = "rgba(255,236,190,.9)"),
            (e.lineWidth = 0.8),
            e.beginPath(),
            e.moveTo(t.x, t.y),
            e.lineTo(t.x + t.ax * t.len, t.y + t.ay * t.len),
            e.stroke());
        else {
          ((t.vx *= 0.996), (t.vy *= 0.996), (t.vy -= 1.5 * i), (t.x += t.vx * i), (t.y += t.vy * i));
          const r = t.s * (1 + (t.grow - 1) * Math.sqrt(o));
          ((e.globalAlpha = Math.pow(Math.sin(Math.PI * o), 1.5) * (0.04 + 0.16 * o) * S),
            e.drawImage(Q[t.c], t.x - r / 2, t.y - r / 2, r, r));
        }
      }
      ((e.globalAlpha = 1), (e.globalCompositeOperation = "source-over"), requestAnimationFrame(D));
    }
    (addEventListener("resize", U, { passive: !0 }), U(), requestAnimationFrame(D));
  }
  function H() {
    document.querySelectorAll("section.es[data-sid]").forEach(it);
  }
  (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", H) : H(),
    document.addEventListener("shopify:section:load", H));
})();
