"use strict";
// Header: die letzten zwei Menüpunkte stehen fest rechts neben dem Logo.
// Position wird nur beim Laden und bei Größenänderung berechnet (nicht beim Scrollen),
// damit sie stehen bleiben, auch wenn das Logo beim Scrollen kleiner wird.
(() => {
  const RIGHT = 2;
  let box = null,
    moved = [],
    logoW = 0;
  function setup() {
    if (innerWidth < 990) return undo();
    const header = document.querySelector("header.header--middle-center");
    const ul = header && header.querySelector(".header__inline-menu .list-menu--inline");
    const logo = header && header.querySelector(".header__heading-logo-wrapper, .header__heading-link, .header__heading");
    if (!ul || !logo) return;
    if (!box) {
      const items = [...ul.children].filter((li) => li.tagName === "LI");
      if (items.length <= RIGHT + 1) return;
      moved = items.slice(-RIGHT);
      box = document.createElement("ul");
      box.className = ul.className + " es-menu-right";
      box.setAttribute("role", "list");
      moved.forEach((li) => box.appendChild(li));
      header.appendChild(box);
    }
    // Logo-Breite im unverkleinerten Zustand merken
    const lr = logo.getBoundingClientRect();
    if (!document.querySelector(".scrolled-past-header") || !logoW) logoW = Math.max(logoW, lr.width);
    const hr = header.getBoundingClientRect();
    const cx = lr.left + lr.width / 2 - hr.left;
    // Abstand = Abstand zwischen zwei Menüpunkten links (gleiche Lücke)
    const left = [...ul.children].filter((li) => li.tagName === "LI");
    let gap = 0;
    const a = left[left.length - 1] && left[left.length - 1].querySelector(".header__menu-item");
    if (a) gap = parseFloat(getComputedStyle(a).paddingLeft) || 12;
    box.style.left = Math.round(cx + logoW / 2 + Math.max(10, gap)) + "px";
    // Platz zu den Icons prüfen
    const icons = header.querySelector(".header__icons");
    box.style.visibility = "hidden";
    box.style.display = "";
    requestAnimationFrame(() => {
      const br = box.getBoundingClientRect(),
        ir = icons ? icons.getBoundingClientRect() : { left: innerWidth };
      if (br.right > ir.left - 10) return undo();
      box.style.visibility = "";
    });
  }
  function undo() {
    if (!box) return;
    const header = box.parentElement;
    const ul = header && header.querySelector(".header__inline-menu .list-menu--inline");
    if (ul) moved.forEach((li) => ul.appendChild(li));
    box.remove();
    box = null;
    moved = [];
  }
  let t = 0;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      undo();
      logoW = 0;
      setup();
    }, 150);
  });
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", setup) : setup();
  addEventListener("load", setup);
})();
