"use strict";
(() => {
  function L() {
    if (window.__esPolish) return;
    window.__esPolish = !0;
    const _ = matchMedia("(prefers-reduced-motion: reduce)").matches,
      N = (n, o = 0, e = 1) => Math.min(e, Math.max(o, n)),
      h = (n, o) => n + Math.random() * (o - n),
      $ = "http://www.w3.org/2000/svg",
      q = document.querySelector('section.es[data-ready="1"], section.es'),
      R = (q && q.dataset.end) || "#ffffff",
      S = document.createElement("style");
    ((S.id = "es-polish"),
      (S.textContent = `
    .dbtfy_ugc_slider .splide__slide { height: auto !important; }
    .dbtfy_ugc_slider iframe.js-youtube { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; display: block; border-radius: 10px; }
    a.es-earth, button.es-earth {
      background: linear-gradient(135deg, #d2ae74 0%, #a88152 52%, #7d5b35 100%) !important;
      color: #fff8ec !important; border: 1px solid rgba(255, 236, 200, .6) !important;
      font-weight: 600 !important; letter-spacing: .08em !important; min-height: 54px; padding: 0 40px !important;
      text-shadow: 0 1px 2px rgba(60, 38, 14, .35);
      box-shadow: 0 10px 28px rgba(125, 91, 53, .45), inset 0 1px 0 rgba(255, 255, 255, .28) !important;
      animation: es-earth 3.8s ease-in-out infinite; transition: transform .3s, filter .3s;
    }
    a.es-earth:hover, button.es-earth:hover { transform: translateY(-2px); filter: brightness(1.08); }
    a.es-earth::before, a.es-earth::after { display: none !important; }
    @keyframes es-earth {
      0%, 100% { box-shadow: 0 10px 28px rgba(125, 91, 53, .42), 0 0 0 0 rgba(210, 174, 116, 0), inset 0 1px 0 rgba(255, 255, 255, .28); }
      50%      { box-shadow: 0 12px 34px rgba(125, 91, 53, .55), 0 0 0 9px rgba(210, 174, 116, .13), inset 0 1px 0 rgba(255, 255, 255, .28); }
    }
    html.es-home #MainContent, html.es-home main.content-for-layout { background-color: #242833; }     /* Startseite: keine hellen Haarspalten zwischen dunklen Bl\xF6cken */

    /* ===== Fu\xDF: Texte als eigene, leicht hellere Karten mit geschwungenen Ecken ===== */
    .dbtfy-footer { background: linear-gradient(180deg, #242833 0%, #1e222d 100%) !important; position: relative; }
    .dbtfy-footer .page-width > .d-grid { gap: 22px !important; align-items: stretch; }
    .dbtfy-footer .dbtfy-footer-block > .description-block {
      background: linear-gradient(160deg, rgba(70, 86, 116, .34), rgba(44, 52, 72, .62));
      border: 1px solid rgba(221, 183, 113, .16);
      border-radius: 34px 16px 30px 20px / 20px 30px 16px 34px;
      padding: 24px 24px 20px !important; height: 100%;
      box-shadow: 0 16px 36px rgba(0, 0, 0, .28), inset 0 1px 0 rgba(255, 255, 255, .06);
      line-height: 1.75; transition: transform .5s, box-shadow .5s;
    }
    .dbtfy-footer .dbtfy-footer-block + .dbtfy-footer-block > .description-block {
      background: linear-gradient(160deg, rgba(62, 96, 104, .32), rgba(38, 56, 66, .62));
      border-radius: 18px 36px 20px 30px / 30px 16px 34px 20px;
    }
    .dbtfy-footer .dbtfy-footer-block > .description-block:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255, 255, 255, .08); }
    .dbtfy-footer .dbtfy-footer-block > .description-block .description-block { background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
    .dbtfy-footer .description-block a { color: #ddb771; text-underline-offset: 3px; }
    .dbtfy-footer .dbtfy-footer-block__payment-business-registration {
      background: linear-gradient(160deg, rgba(92, 78, 120, .26), rgba(46, 46, 70, .55));
      border: 1px solid rgba(190, 150, 255, .14); padding: 16px 18px; margin-top: 8px;
      border-radius: 26px 14px 28px 16px / 16px 26px 14px 28px;
    }
    .dbtfy-footer .dbtfy-footer-block__list-payment { gap: 8px; justify-content: center; }
    .dbtfy-footer .dbtfy-footer-block__list-payment__item { opacity: .88; filter: saturate(.85); transition: opacity .3s, transform .3s; }
    .dbtfy-footer .dbtfy-footer-block__list-payment__item:hover { opacity: 1; transform: translateY(-2px); }
    .dbtfy-footer .list-social { gap: 12px; justify-content: center; }
    .dbtfy-footer .list-social__link {
      width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%;
      border: 1px solid rgba(221, 183, 113, .35); background: rgba(255, 255, 255, .03);
      transition: background .35s, transform .35s, box-shadow .35s;
    }
    .dbtfy-footer .list-social__link:hover { background: rgba(221, 183, 113, .18); transform: translateY(-2px); box-shadow: 0 0 18px rgba(221, 183, 113, .3); }
    .dbtfy-footer .dbtfy-footer-copyright { text-align: center; }
    .dbtfy-footer .dbtfy-footer-block__policies { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 0; margin-top: 10px; }
    .dbtfy-footer .dbtfy-footer-block__policies li { display: inline-flex; align-items: center; }
    .dbtfy-footer .dbtfy-footer-block__policies li + li::before { content: '\xB7'; margin: 0 10px; color: rgba(221, 183, 113, .55); }
    .dbtfy-footer .dbtfy-footer-block__policies a, .dbtfy-footer .dbtfy-footer-copyright__content a { text-decoration: none; opacity: .78; transition: opacity .3s, color .3s; }
    .dbtfy-footer .dbtfy-footer-block__policies a:hover, .dbtfy-footer .dbtfy-footer-copyright__content a:hover { opacity: 1; color: #ddb771; }

    .es-seam { position: absolute; left: 0; width: 100%; pointer-events: none; z-index: 3; display: block; overflow: visible; }
    .es-sacred { position: absolute; left: 50%; pointer-events: none; z-index: 3; overflow: visible; }
    /* Silber mit einem Hauch Farbe, der langsam durch den Knopf wandert */
    a.es-silver, button.es-silver {
      background: linear-gradient(115deg, #eceef3 0%, #c5cad4 22%, #f6f7fa 42%, var(--es-tint, #ddd5ee) 58%, #bcc1cc 78%, #eef0f5 100%) !important;
      background-size: 260% 100% !important;
      color: #262b38 !important; border: 1px solid rgba(255, 255, 255, .75) !important;
      font-weight: 600 !important; letter-spacing: .08em !important; min-height: 52px; padding: 0 38px !important;
      text-shadow: 0 1px 0 rgba(255, 255, 255, .6);
      box-shadow: 0 10px 26px var(--es-glow, rgba(150, 135, 200, .32)), inset 0 1px 0 rgba(255, 255, 255, .9), inset 0 -1px 0 rgba(120, 125, 140, .25) !important;
      animation: es-sheen 7s ease-in-out infinite alternate; transition: transform .3s, filter .3s;
    }
    a.es-silver:hover, button.es-silver:hover { transform: translateY(-2px); filter: brightness(1.04); }
    a.es-silver::before, a.es-silver::after { display: none !important; }
    .es-silver--lila  { --es-tint: #dcd2ef; --es-glow: rgba(150, 130, 205, .34); }
    .es-silver--tuerkis { --es-tint: #c9dcdc; --es-glow: rgba(60, 120, 125, .3); }
    @keyframes es-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
    @media (prefers-reduced-motion: reduce) { a.es-earth, button.es-earth, a.es-silver, button.es-silver { animation: none; } }
  `),
      document.head.appendChild(S),
      location.pathname === "/" && document.documentElement.classList.add("es-home"),
      document.querySelectorAll("main a, main button, #MainContent a, #MainContent button").forEach((n) => {
        if (!/button|btn/i.test(n.className)) return;
        const o = n.textContent.trim();
        /^termine\s*(&|und)\s*events$/i.test(o)
          ? n.classList.add("es-silver", "es-silver--lila")
          : /^(news|blog-beitr(ä|ae)ge)$/i.test(o) && n.classList.add("es-silver", "es-silver--tuerkis");
      }));
    const T = (n) => n && n !== "transparent" && !/^rgba\([^)]*,\s*0\)$/.test(n),
      H = () => document.documentElement.clientWidth || innerWidth;
    function F(n, o) {
      const e = n.getBoundingClientRect();
      let s = null,
        i = !1;
      for (const c of [n, ...n.querySelectorAll("*")]) {
        const t = c.getBoundingClientRect();
        if (t.width < H() * 0.8 || t.height < 2 || Math.abs(o ? t.top - e.top : t.bottom - e.bottom) > 8) continue;
        const l = getComputedStyle(c);
        ((/IMG|VIDEO|PICTURE|IFRAME/.test(c.tagName) || /url\(/.test(l.backgroundImage)) &&
          t.width >= H() * 0.97 &&
          (i = !0),
          T(l.backgroundColor) &&
            (+(l.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\)/) || [0, 1])[1] > 0.9
              ? ((s = l.backgroundColor), (i = !1))
              : (i = !0)));
      }
      return { col: s, img: i };
    }
    const E = (n) => {
        n = (n || "").trim();
        const o = n.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (o) {
          let e = o[1];
          return (
            e.length === 3 && (e = e.replace(/./g, (s) => s + s)),
            [0, 2, 4].map((s) => parseInt(e.substr(s, 2), 16)).join(",")
          );
        }
        return (n.match(/\d+(\.\d+)?/g) || [36, 40, 51]).slice(0, 3).join(",");
      },
      v = [];
    function C() {
      (v.forEach((o) => o.svg.remove()), (v.length = 0));
      const n = [...document.querySelectorAll('[id^="shopify-section-"]')].filter(
        (o) =>
          o.offsetHeight > 30 &&
          !o.closest("header") &&
          !/announcement|header|drawer|widgets|cart|wishlist|compare/i.test(o.id),
      );
      for (let o = 0; o < n.length - 1; o++) {
        const e = n[o],
          s = n[o + 1];
        if (s.querySelector("section.es")) continue;
        const i = e.querySelector("section.es") ? { col: R, img: !1 } : F(e, !1),
          c = F(s, !0);
        if (!i.img && !c.img && (!i.col || !c.col || E(i.col) === E(c.col))) continue;
        let t, l, p;
        if (!i.img && i.col) ((t = s), (l = i.col), (p = !0));
        else if (!c.img && c.col) ((t = e), (l = c.col), (p = !1));
        else continue;
        getComputedStyle(t).position === "static" && (t.style.position = "relative");
        const d = h(7, 22),
          f = h(30, 60),
          a = document.createElementNS($, "svg");
        (a.setAttribute("class", "es-seam"),
          a.setAttribute("aria-hidden", "true"),
          a.setAttribute("preserveAspectRatio", "none"));
        const g = d * 2 + f;
        a.style.height = g + "px";
        const b = Math.max(0, Math.round(s.getBoundingClientRect().top - e.getBoundingClientRect().bottom));
        p ? (a.style.top = -(b + 2) + "px") : ((a.style.bottom = -(b + 2) + "px"), (a.style.transform = "scaleY(-1)"));
        const r = "esg" + o + Math.floor(h(0, 1e6)),
          m = E(l);
        ((a.innerHTML = `<defs><linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgb(${m})" stop-opacity=".38"/><stop offset="1" stop-color="rgb(${m})" stop-opacity="0"/></linearGradient></defs>
        <path class="g" fill="url(#${r})"/><path class="w" fill="rgb(${m})"/>`),
          t.appendChild(a),
          v.push({
            svg: a,
            host: t,
            amp: d,
            fade: f,
            H: g,
            w: a.querySelector(".w"),
            g: a.querySelector(".g"),
            f1: h(0.004, 0.009),
            f2: h(0.011, 0.02),
            f3: h(0.025, 0.04),
            p1: h(0, 6.28),
            p2: h(0, 6.28),
            p3: h(0, 6.28),
            dir: Math.random() < 0.5 ? 1 : -1,
            last: -1,
          }));
      }
    }
    function k(n) {
      const o = document.documentElement.clientWidth,
        e = scrollY,
        s = innerHeight;
      for (const i of v) {
        const c = i.host.getBoundingClientRect();
        if (!n && (c.bottom < -200 || c.top > s + 200)) continue;
        const t = e * 0.0016 * i.dir;
        if (!n && Math.abs(t - i.last) < 0.002) continue;
        i.last = t;
        const l = (a) =>
          i.amp *
          (0.95 +
            0.55 * Math.sin(a * i.f1 + i.p1 + t) +
            0.3 * Math.sin(a * i.f2 + i.p2 - t * 1.3) +
            0.12 * Math.sin(a * i.f3 + i.p3 + t * 2));
        let p = `M0 0 L0 ${l(0).toFixed(1)}`,
          d = "";
        const f = [];
        for (let a = 0; a <= o + 16; a += 16) {
          const g = Math.max(1, l(a));
          (f.push([a, g]), (p += ` L${a} ${g.toFixed(1)}`));
        }
        ((p += ` L${o + 16} 0 Z`),
          (d =
            `M0 ${f[0][1].toFixed(1)}` +
            f.map(([a, g]) => ` L${a} ${g.toFixed(1)}`).join("") +
            ` L${o + 16} ${(f[f.length - 1][1] + i.fade).toFixed(1)}` +
            f
              .slice()
              .reverse()
              .map(([a, g]) => ` L${a} ${(g + i.fade).toFixed(1)}`)
              .join("") +
            " Z"),
          i.svg.setAttribute("viewBox", `0 0 ${o} ${i.H}`),
          i.w.setAttribute("d", p),
          i.g.setAttribute("d", d));
      }
    }
    function W(n, o, e, s) {
      o.forEach((t, l) => {
        let p = 600;
        try {
          p = t.getTotalLength() || 600;
        } catch {}
        ((t.style.strokeDasharray = p),
          (t.style.strokeDashoffset = _ ? 0 : p),
          (t.style.transition = _
            ? "none"
            : `stroke-dashoffset ${e * 0.55}s cubic-bezier(.4,.1,.2,1) ${(t.dataset.d || l / o.length) * e * 0.5}s`));
      });
      const i = () =>
        o.forEach((t) => {
          t.style.strokeDashoffset = 0;
        });
      if (!s) {
        requestAnimationFrame(() => requestAnimationFrame(i));
        return;
      }
      const c = new IntersectionObserver(
        (t) => {
          t.some((l) => l.isIntersecting) && (i(), c.disconnect());
        },
        { threshold: 0.2 },
      );
      c.observe(n);
    }
    function B() {
      const n = [...document.querySelectorAll('[id^="shopify-section-"]')].find(
        (t) =>
          t.offsetHeight > 120 &&
          !t.closest("header") &&
          !/announcement|header|drawer|widgets|cart|wishlist|compare/i.test(t.id),
      );
      if (!n) return;
      getComputedStyle(n).position === "static" && (n.style.position = "relative");
      const o = 30,
        e = document.createElementNS($, "svg");
      (e.setAttribute("class", "es-sacred"),
        e.setAttribute("aria-hidden", "true"),
        e.setAttribute("viewBox", "-100 -100 200 200"));
      const s = Math.min(380, innerWidth * 0.8);
      ((e.style.width = e.style.height = s + "px"),
        (e.style.top = -s * 0.42 + "px"),
        (e.style.marginLeft = -s / 2 + "px"));
      const i = [];
      for (let t = -2; t <= 2; t++)
        for (let l = -2; l <= 2; l++) {
          const p = -t - l;
          Math.max(Math.abs(t), Math.abs(l), Math.abs(p)) > 2 || i.push([o * (t + l / 2), (o * l * Math.sqrt(3)) / 2]);
        }
      i.sort((t, l) => t[1] - l[1]);
      let c = '<g fill="none" stroke="rgba(221,183,113,.42)" stroke-width=".55">';
      (i.forEach(([t, l], p) => {
        c += `<circle data-d="${((l + 2 * o) / (4 * o)).toFixed(2)}" cx="${t.toFixed(2)}" cy="${l.toFixed(2)}" r="${o}"/>`;
      }),
        (c += `<circle data-d="1" cx="0" cy="0" r="${o * 3}" stroke-width=".8"/><circle data-d="1" cx="0" cy="0" r="${o * 3 + 3}" stroke-width=".35"/></g>`),
        (e.innerHTML = c),
        (e.style.filter = "drop-shadow(0 0 4px rgba(221,183,113,.35))"),
        n.appendChild(e),
        W(e, [...e.querySelectorAll("circle")], 4.5, !1));
    }
    function Y() {
      const n = document.querySelector('[id*="footer"].shopify-section, footer, [id$="dbtfy-footer"]');
      if (!n) return;
      const o = n.closest('[id^="shopify-section-"]') || n;
      getComputedStyle(o).position === "static" && (o.style.position = "relative");
      const e = 90,
        s = document.createElementNS($, "svg");
      (s.setAttribute("class", "es-sacred"),
        s.setAttribute("aria-hidden", "true"),
        s.setAttribute("viewBox", "-100 -100 200 200"));
      const i = Math.min(240, innerWidth * 0.55);
      ((s.style.width = s.style.height = i + "px"),
        (s.style.top = -i * 0.5 + "px"),
        (s.style.marginLeft = -i / 2 + "px"));
      const c = (p) => {
        const d = Math.cos(p),
          f = Math.sin(p),
          a = (b, r) => `${(b * d - r * f).toFixed(1)} ${(b * f + r * d).toFixed(1)}`;
        let g = `M${a(8, 0)} L${a(e, 0)}`;
        return (
          [
            [0.32, 0.3],
            [0.52, 0.24],
            [0.72, 0.17],
            [0.88, 0.09],
          ].forEach(([b, r]) => {
            const m = e * b,
              u = e * r,
              x = u * Math.cos(Math.PI / 3),
              y = u * Math.sin(Math.PI / 3);
            g += ` M${a(m, 0)} L${a(m + x, y)} M${a(m, 0)} L${a(m + x, -y)}`;
          }),
          (g += ` M${a(e * 0.94, 0)} L${a(e, 0)}`),
          g
        );
      };
      let t = '<g fill="none" stroke="rgba(226,232,244,.45)" stroke-width="1" stroke-linecap="round">';
      for (let p = 0; p < 6; p++)
        t += `<path data-d="${(p / 6).toFixed(2)}" d="${c((p * Math.PI) / 3 - Math.PI / 2)}"/>`;
      const l = [...Array(6)].map((p, d) => {
        const f = (d * Math.PI) / 3;
        return `${(14 * Math.cos(f)).toFixed(1)} ${(14 * Math.sin(f)).toFixed(1)}`;
      });
      ((t += `<path data-d="0" d="M${l.join(" L")} Z"/><circle data-d=".9" cx="0" cy="0" r="3" stroke="rgba(221,183,113,.6)"/></g>`),
        (s.innerHTML = t),
        (s.style.filter = "drop-shadow(0 0 5px rgba(200,215,240,.35))"),
        o.appendChild(s),
        W(s, [...s.querySelectorAll("path,circle")], 5, !0));
    }
    const M = (() => {
      try {
        return JSON.parse(document.getElementById("es-feinschliff-daten").textContent);
      } catch {
        return {};
      }
    })();
    function j() {
      const n = document.querySelector(".blog-articles");
      if (!n || !/^\/blogs\/[^/]+\/?$/.test(location.pathname)) return;
      const o = document.createElement("style");
      ((o.textContent = `
      .blog-articles { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important; gap: 26px !important; }
      .blog-articles > .blog-articles__article { width: auto !important; max-width: none !important; }
      .blog-articles .article-card { border-radius: 22px 12px 22px 14px / 14px 22px 12px 22px; overflow: hidden; box-shadow: 0 10px 26px rgba(36,40,51,.12); transition: transform .4s, box-shadow .4s; }
      .blog-articles .article-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(36,40,51,.2); }
      .blog-articles .article-card .card__information { padding: 14px 16px 16px !important; }
      .blog-articles .article-card .card__heading { font-size: clamp(1.02rem, 1.2vw, 1.22rem) !important; line-height: 1.32; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .blog-articles .article-card__info { font-size: .7rem !important; opacity: .7; }
      .blog-articles .article-card__excerpt { font-size: .88rem; line-height: 1.55; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      @media (max-width: 749px) {
        .blog-articles { grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
        .blog-articles .article-card .card__heading { font-size: .95rem !important; }
        .blog-articles .article-card__excerpt { display: none; }
        .blog-articles .article-card .card__information { padding: 10px 12px 12px !important; }
      }
      .es-blogkopf { max-width: 760px; margin: 52px auto 10px; padding: 0 16px; text-align: center; }
      .es-blogkopf form { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; justify-content: center; }
      .es-blogkopf .es-such { flex: 1 1 340px; position: relative; }
      .es-blogkopf input[type=search] {
        width: 100%; height: 62px; padding: 0 22px 0 56px; font-size: 1.15rem; border-radius: 999px;
        border: 1px solid rgba(36,40,51,.18); background: #fff; color: #242833;
        box-shadow: 0 12px 30px rgba(36,40,51,.12), inset 0 1px 0 rgba(255,255,255,.9); outline: none; transition: box-shadow .3s, border-color .3s;
      }
      .es-blogkopf input[type=search]:focus { border-color: #ddb771; box-shadow: 0 12px 34px rgba(221,183,113,.35); }
      .es-blogkopf .es-such svg { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; opacity: .55; }
      .es-blogkopf select {
        height: 62px; padding: 0 44px 0 22px; border-radius: 999px; font-size: 1rem; cursor: pointer; appearance: none; -webkit-appearance: none;
        border: 1px solid rgba(255,255,255,.75); color: #262b38;
        background: linear-gradient(115deg, #eceef3, #c5cad4 30%, #f6f7fa 55%, #c9dcdc 75%, #eef0f5) 0 0 / 260% 100%,
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23262b38' stroke-width='1.6'/%3E%3C/svg%3E") no-repeat right 20px center;
        box-shadow: 0 10px 26px rgba(60,120,125,.25), inset 0 1px 0 rgba(255,255,255,.9);
        animation: es-sheen 7s ease-in-out infinite alternate;
      }`),
        document.head.appendChild(o));
      const e = document.createElement("div");
      e.className = "es-blogkopf";
      const s = M.blogs || [],
        i = location.pathname.replace(/\/$/, "");
      e.innerHTML = `<form action="${M.searchUrl || "/search"}" method="get" role="search">
        <input type="hidden" name="type" value="article"><input type="hidden" name="options[prefix]" value="last">
        <label class="es-such"><span class="visually-hidden">Suche</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
          <input type="search" name="q" placeholder="${(M.searchLabel || "Beitr\xE4ge durchsuchen \u2026").replace(/"/g, "&quot;")}" autocomplete="off"></label>
        ${s.length ? `<select aria-label="Blog w\xE4hlen"><option value="">${M.blogLabel || "Alle Blogs"}</option>${s.map((l) => `<option value="${l.url}"${l.url.replace(/\/$/, "") === i ? " selected" : ""}>${l.title}</option>`).join("")}</select>` : ""}
      </form>`;
      const c = e.querySelector("select");
      c &&
        c.addEventListener("change", () => {
          c.value && (location.href = c.value);
        });
      const t = document.querySelector("main h1, #MainContent h1");
      (t && t.closest(".page-width, .container")
        ? t.closest(".page-width, .container")
        : n.parentElement
      ).insertAdjacentElement(t ? "beforebegin" : "afterbegin", e);
    }
    function P() {
      if (
        (document.querySelectorAll('iframe[src*="portal.youareneo.com/widget/"]').forEach((d) => {
          ((d.src = d.src.replace("portal.youareneo.com", "link.msgsndr.com")),
            d.style.minHeight || (d.style.minHeight = "420px"));
        }),
        document.querySelector('iframe[src*="link.msgsndr.com/widget/form"]') &&
          !document.querySelector('script[src*="msgsndr.com/js/form_embed"]'))
      ) {
        const d = document.createElement("script");
        ((d.src = "https://link.msgsndr.com/js/form_embed.js"), (d.defer = !0), document.body.appendChild(d));
      }
      if (!/\/pages\/news|\/blogs\/news/.test(location.pathname) || _) return;
      const n = [0, 1, 2].map((d) => {
          const b = document.createElement("canvas");
          ((b.width = 150 * 2), (b.height = 200 * 2));
          const r = b.getContext("2d");
          r.scale(2, 2);
          const m = r.createLinearGradient(0, 0, 150, 200);
          (m.addColorStop(0, "#f3ecdc"),
            m.addColorStop(1, "#e2d6bc"),
            (r.fillStyle = m),
            r.fillRect(0, 0, 150, 200),
            (r.strokeStyle = "rgba(120,100,70,.25)"),
            r.strokeRect(0.5, 0.5, 149, 199),
            (r.fillStyle = "#2b2620"),
            (r.font = "bold 15px Georgia, serif"),
            (r.textAlign = "center"),
            r.fillText(["YOU ARE NEO", "DIE NEUE ZEIT", "GEMEINSCHAFT"][d], 150 / 2, 22),
            (r.fillStyle = "rgba(43,38,32,.75)"),
            r.fillRect(10, 28, 130, 1.2),
            r.fillRect(10, 31, 130, 0.5),
            (r.font = "bold 9px Georgia, serif"),
            r.fillText(["Freiheit beginnt in dir", "Das goldene Zeitalter?", "Von Herz zu Herz"][d], 150 / 2, 44));
          const u = 3,
            x = (130 - (u - 1) * 6) / u;
          for (let y = 0; y < u; y++) {
            const I = 10 + y * (x + 6);
            let w = 52;
            for (
              y === d % u && ((r.fillStyle = "rgba(90,80,65,.35)"), r.fillRect(I, w, x, 38), (w += 44));
              w < 190;
              w += 4.2
            )
              ((r.fillStyle = `rgba(60,52,42,${0.22 + Math.random() * 0.18})`),
                r.fillRect(I, w, x * (0.7 + Math.random() * 0.3), 1.3),
                Math.random() < 0.08 && (w += 4));
          }
          return (
            (r.fillStyle = "rgba(120,90,50,.08)"),
            r.beginPath(),
            r.ellipse(150 * 0.7, 200 * 0.8, 26, 18, 0.4, 0, 6.28),
            r.fill(),
            b
          );
        }),
        o = document.createElement("canvas");
      (o.setAttribute("aria-hidden", "true"),
        (o.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5"),
        document.body.appendChild(o));
      const e = o.getContext("2d"),
        s = () => {
          const d = Math.min(devicePixelRatio || 1, 2);
          ((o.width = innerWidth * d), (o.height = innerHeight * d), e.setTransform(d, 0, 0, d, 0, 0));
        };
      (s(), addEventListener("resize", s));
      const i = [];
      let c = scrollY,
        t = 0,
        l = 0,
        p = performance.now();
      (addEventListener(
        "scroll",
        () => {
          ((t += Math.abs(scrollY - c)), (c = scrollY));
        },
        { passive: !0 },
      ),
        (function d(f) {
          const a = Math.min(0.05, (f - p) / 1e3),
            g = f / 1e3;
          ((p = f),
            t > 900 &&
              g > l &&
              i.length < 2 &&
              ((t = 0),
              (l = g + h(2.5, 6)),
              i.push({
                img: n[Math.floor(Math.random() * 3)],
                x0: h(0.1, 0.9) * innerWidth,
                y: -140,
                ph: h(0, 6.28),
                om: h(0.9, 1.4),
                A: h(40, 90),
                vf: h(55, 80),
                tilt: h(-0.4, 0.4),
                sc: h(0.45, 0.7),
                spin: h(0.6, 1.1) * (Math.random() < 0.5 ? -1 : 1),
                life: 0,
              })),
            (t *= 0.985),
            e.clearRect(0, 0, innerWidth, innerHeight));
          for (let b = i.length - 1; b >= 0; b--) {
            const r = i[b];
            ((r.life += a), (r.ph += r.om * a), (r.x0 += Math.sin(g * 0.3 + r.ph) * 6 * a));
            const m = Math.sin(r.ph),
              u = r.x0 + r.A * m;
            if (((r.y += r.vf * (0.5 + 0.5 * Math.abs(Math.cos(r.ph))) * a), r.y > innerHeight + 160)) {
              i.splice(b, 1);
              continue;
            }
            const x = Math.cos(r.ph * r.spin * 1.3);
            (e.save(),
              e.translate(u, r.y),
              e.rotate(r.tilt + Math.cos(r.ph) * 0.5),
              e.scale(r.sc * Math.max(0.08, Math.abs(x)), r.sc * (0.85 + 0.15 * Math.abs(Math.sin(r.ph)))),
              (e.globalAlpha = Math.min(1, r.life * 2) * 0.92),
              (e.shadowColor = "rgba(30,25,15,.25)"),
              (e.shadowBlur = 14),
              (e.shadowOffsetY = 8),
              e.drawImage(r.img, -75, -100, 150, 200),
              x < 0 &&
                ((e.shadowColor = "transparent"),
                (e.fillStyle = "rgba(226,214,188,.85)"),
                e.fillRect(-75, -100, 150, 200)),
              e.restore());
          }
          requestAnimationFrame(d);
        })(performance.now()));
    }
    (C(), k(!0), location.pathname === "/" && B(), Y(), j(), P());
    let A = !1;
    addEventListener(
      "scroll",
      () => {
        A ||
          ((A = !0),
          requestAnimationFrame(() => {
            ((A = !1), k(!1));
          }));
      },
      { passive: !0 },
    );
    let z;
    (addEventListener("resize", () => {
      (clearTimeout(z),
        (z = setTimeout(() => {
          (C(), k(!0));
        }, 250)));
    }),
      addEventListener("load", () => {
        (C(), k(!0));
      }));
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", L) : L();
})();
