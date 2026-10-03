"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Expand } from "lucide-react";
import {
  TOOL_CATEGORIES,
  toolCatalog,
  toolCategory,
  toolLogo,
} from "@/lib/workspace/tool-categories";
import type { Destination } from "@/lib/workspace/navigation";
import { Dialog } from "./Dialog";
function Tool({ tool }: { tool: Destination }) {
  const logo = toolLogo(tool.href);
  const initials = tool.label
    .split(/[ /]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <Link
      prefetch={false}
      href={tool.href}
      title={tool.label}
      aria-label={logo ? tool.label : `${initials} · ${tool.label}`}
    >
      <span className="tool-logo" aria-hidden="true" role="presentation">
        {logo ? (
          <img
            src={"/tool-logos/" + logo + ".svg"}
            width={23}
            height={23}
            alt=""
            loading="lazy"
          />
        ) : (
          tool.label
            .split(/[ /]/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
        )}
      </span>
      <strong>{tool.label}</strong>
      <ArrowUpRight size={11} />
    </Link>
  );
}
export function ToolLaboratory() {
  const [selected, setSelected] = useState<string | null>(null),
    [query, setQuery] = useState("");
  const category = TOOL_CATEGORIES.find((c) => c.id === selected);
  const matches = (p: Destination) =>
    `${p.label} ${p.keywords ?? ""}`
      .toLocaleLowerCase("de")
      .includes(query.toLocaleLowerCase("de").trim());
  const entries = selected
    ? toolCatalog.filter((p) => toolCategory(p) === selected && matches(p))
    : [];
  return (
    <section className="w-page tool-laboratory lab-compact">
      <header className="w-page-heading">
        <div>
          <span className="w-eyebrow">ARBEITEN · DEINE WERKZEUGE</span>
          <h1>Daten-Labor.</h1>
          <p>Dein Werkzeugkasten. Alle Bereiche auf einen Blick.</p>
        </div>
        <label className="studio-search">
          <Search size={16} />
          <input
            type="search"
            aria-label="Werkzeuge suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Werkzeug finden …"
          />
        </label>
      </header>
      <div className="lab-category-grid">
        {TOOL_CATEGORIES.map((c) => {
          const all = toolCatalog.filter((p) => toolCategory(p) === c.id),
            tools = all.filter(matches);
          return (
            <section
              className="lab-category-card"
              key={c.id}
              style={{ "--tool-color": c.color } as React.CSSProperties}
            >
              <button
                className="lab-category-open"
                onClick={() => setSelected(c.id)}
                title={`${c.name} öffnen`}
              >
                <span className="lab-category-symbol" aria-hidden="true">
                  {c.icon}
                </span>
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {tools.length} {query ? "Treffer" : "Werkzeuge"}
                  </small>
                </span>
                <Expand size={13} />
              </button>
              <div className="lab-preview tool-tiles">
                {tools.slice(0, 9).map((p) => (
                  <Tool key={p.id} tool={p} />
                ))}
              </div>
              {!tools.length && (
                <p className="lab-no-results">
                  Keine Treffer in diesem Bereich.
                </p>
              )}
              <button className="lab-more" onClick={() => setSelected(c.id)}>
                {tools.length > 9
                  ? `+ ${tools.length - 9} weitere entdecken`
                  : "Bereich öffnen"}{" "}
                <span aria-hidden="true">↗</span>
              </button>
            </section>
          );
        })}
      </div>
      <p className="w-storage-note">
        Wähle eine Bereichskarte für die große Ansicht. Externe Werkzeuge können
        eine eigene Anmeldung benötigen.
      </p>
      {category && (
        <Dialog title={category.name} onClose={() => setSelected(null)}>
          <p>
            {entries.length} Werkzeuge{query && " für deine Suche"}
          </p>
          <div
            className="tool-tiles lab-expanded"
            style={{ "--tool-color": category.color } as React.CSSProperties}
          >
            {entries.map((p) => (
              <Tool key={p.id} tool={p} />
            ))}
          </div>
          {!entries.length && (
            <p>Keine Treffer. Schließe die Ansicht und ändere deine Suche.</p>
          )}
        </Dialog>
      )}
    </section>
  );
}
