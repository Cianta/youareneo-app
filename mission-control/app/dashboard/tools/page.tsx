"use client";
import { useState } from "react";
import { Plus, Minus, Search, RotateCcw } from "lucide-react";
import { core, directoryLinks, categoriesFor, categoriesOf } from "@/lib/workspace/directory";
import { AppLogo } from "@/components/workspace/AppLogo";
import { usePersonal, safeLink, type Shortcut } from "@/lib/workspace/personal";
import { Modal } from "@/components/ui/Modal";
export default function ToolsPage() {
  const s = usePersonal(),
    [query, setQuery] = useState(""),
    [adding, setAdding] = useState<string | null>(null),
    [error, setError] = useState(""), [categorizing,setCategorizing]=useState<Shortcut|null>(null);
  const all = [...directoryLinks, ...s.customLinks],
    categories = categoriesOf(all,s.linkCategories);
  return (
    <div className="w-page">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">DEIN GANZER KOSMOS</span>
          <h1>Alles findet seinen Platz.</h1>
          <p>
            Deine Bereiche, Apps und Lieblingswerkzeuge. Gestalte jede Sammlung
            selbst.
          </p>
        </div>
        <button className="w-btn" onClick={() => s.set({ hiddenLinks: [] })}>
          <RotateCcw size={15} />
          Ausgeblendete zurückholen
        </button>
      </div>
      <div className="w-apps-search">
        <Search size={18} />
        <input
          aria-label="Alle Bereiche durchsuchen"
          placeholder="Mein Tag, Notizbuch, Musik …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="w-app-grid">
        {categories.map((category) => {
          const links = all.filter(
            (l) =>
              categoriesFor(l,s.linkCategories).includes(category) &&
              !s.hiddenLinks.includes(l.id) &&
              `${l.label} ${category}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          );
          if (query && !links.length) return null;
          return (
            <section id={encodeURIComponent(category)} className="w-card" key={category}>
              <div className="w-section-head">
                <span className="w-eyebrow">{category}</span>
                <button
                  className="w-icon"
                  aria-label={`Zu ${category} hinzufügen`}
                  onClick={() => setAdding(category)}
                >
                  <Plus size={17} />
                </button>
              </div>
              <div className="s-directory">
                {links.map((l) => (
                  <div key={l.id} className="s-directory-row">
                    <a
                      href={l.href}
                      {...(l.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <AppLogo label={l.label} href={l.href} fallback={l.icon}/>
                      {l.label}
                    </a>
                    <button className="w-icon" aria-label={`${l.label} zuordnen`} onClick={()=>setCategorizing(l)}>⋮</button><button
                      className="w-icon"
                      aria-label={`${l.label} ausblenden`}
                      onClick={() =>
                        s.set({ hiddenLinks: [...s.hiddenLinks, l.id] })
                      }
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
                {!links.length && (
                  <p className="w-muted">
                    Mit + deinen ersten Eintrag hinzufügen.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <Modal open={!!categorizing} onClose={()=>setCategorizing(null)} title="Mehreren Bereichen zuordnen">{categorizing&&<div className="s-form">{categories.map(category=><label key={category}><input type="checkbox" checked={categoriesFor(categorizing,s.linkCategories).includes(category)} onChange={e=>{const current=categoriesFor(categorizing,s.linkCategories); const next=e.target.checked?[...current,category]:current.filter(c=>c!==category); if(next.length)s.set({linkCategories:{...s.linkCategories,[categorizing.id]:next}});}}/> {category}</label>)}<p className="w-muted">Mindestens ein Bereich bleibt zugeordnet.</p></div>}</Modal>
      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title={`Zu ${adding ?? ""} hinzufügen`}
      >
        <form
          className="s-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              href = safeLink(String(f.get("href")));
            if (!href) {
              setError(
                "Bitte einen vollständigen http(s)-Link oder Trinity-Pfad verwenden.",
              );
              return;
            }
            s.set({
              customLinks: [
                ...s.customLinks,
                {
                  id: crypto.randomUUID(),
                  label: String(f.get("label")).trim(),
                  href,
                  icon: String(f.get("icon")) || "↗",
                  category: adding!,
                },
              ],
            });
            setAdding(null);
            setError("");
          }}
        >
          <label>
            Name
            <input className="w-input" name="label" required maxLength={80} />
          </label>
          <label>
            Weblink oder interne Seite
            <input
              className="w-input"
              name="href"
              required
              placeholder="https://… oder /dashboard/…"
              list="trinity-pages"
            />
            <datalist id="trinity-pages">
              {core.map((c) => (
                <option key={c.id} value={c.href}>
                  {c.label}
                </option>
              ))}
            </datalist>
          </label>
          <label>
            Logo / Symbol
            <input
              className="w-input"
              name="icon"
              defaultValue="✦"
              maxLength={8}
            />
          </label>
          <p className="w-muted">
            Für ein Desktop-Programm hier dessen Webversion verlinken. Lokale
            Programme werden nicht aus dem Browser gestartet.
          </p>
          {error && <p role="alert">{error}</p>}
          <button className="w-btn w-btn-primary">Hinzufügen</button>
        </form>
      </Modal>
    </div>
  );
}
