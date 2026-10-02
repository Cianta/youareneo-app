"use client";
import { useState } from "react";
import { useNinjasStore } from "@/lib/store";
import { BirthProfile, useBirthProfiles } from "./BirthProfile";
import { ELEMENT_COLORS } from "@/lib/workspace/cosmos";
import { Modal } from "@/components/ui/Modal";
export function TeamFlow() {
  const members = useNinjasStore((s) => s.members),
    profiles = useBirthProfiles((s) => s.profiles);
  const [chosen, setChosen] = useState<string[]>([]),
    [system, setSystem] = useState("western"),
    [edit, setEdit] = useState<string | null>(null);
  const selected = members.filter((m) => chosen.includes(m.id));
  const entries = selected.map((m) => {
    const r = profiles[m.id]?.result;
    const value =
      system === "hd"
        ? r?.hd?.type
        : system === "maya"
          ? r?.maya.name
          : system === "celtic"
            ? r?.celtic.name
            : system === "chinese"
              ? r?.chinese.name
              : system === "vedic"
                ? r?.vedic.name
                : r?.western.name;
    const element =
      system === "western"
        ? r?.western.element
        : system === "vedic"
          ? r?.vedic.element
          : system === "chinese"
            ? r?.chinese.element
            : undefined;
    return { m, value, element };
  });
  return (
    <div className="s-stack">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">TEAM FLOW PLANER</span>
          <h2>Unterschiede bewusst verbinden.</h2>
          <p>
            Wähle zwei oder mehr Menschen. Die Muster geben Gesprächsimpulse –
            keine Eignungsnoten.
          </p>
        </div>
        <select
          className="w-input"
          aria-label="Astrologisches System"
          value={system}
          onChange={(e) => setSystem(e.target.value)}
        >
          {[
            ["western", "Westliche Astrologie"],
            ["vedic", "Vedische Astrologie"],
            ["chinese", "Chinesische Zeichen"],
            ["maya", "Maya · Dreamspell"],
            ["celtic", "Keltischer Baum"],
            ["hd", "Human Design"],
          ].map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="s-people-select">
        {members.map((m) => (
          <div className="s-person-picker" key={m.id}>
            <label>
              <input
                type="checkbox"
                checked={chosen.includes(m.id)}
                onChange={(e) =>
                  setChosen(
                    e.target.checked
                      ? [...chosen, m.id]
                      : chosen.filter((id) => id !== m.id),
                  )
                }
              />
              <span>
                {m.avatar} {m.name}
              </span>
            </label>
            <button
              className="w-icon"
              aria-label={`Geburtsprofil für ${m.name}`}
              onClick={() => setEdit(m.id)}
            >
              ✧
            </button>
          </div>
        ))}
      </div>
      {selected.length < 2 ? (
        <div className="s-empty">
          ◎<p>Wähle mindestens zwei Menschen für euer gemeinsames Bild.</p>
        </div>
      ) : (
        <>
          <section className="s-brain-panel">
            <svg
              viewBox="0 0 800 390"
              className="s-team-orbit"
              role="img"
              aria-label="Teammitglieder und ihre symbolischen Eigenschaften"
            >
              <circle
                cx="400"
                cy="185"
                r="135"
                fill="none"
                stroke="currentColor"
                opacity=".12"
                strokeDasharray="4 8"
              />
              <text
                x="400"
                y="180"
                textAnchor="middle"
                fill="currentColor"
                fontSize="21"
              >
                Gemeinsam
              </text>
              <text
                x="400"
                y="204"
                textAnchor="middle"
                fill="currentColor"
                fontSize="11"
              >
                {selected.length} Perspektiven
              </text>
              {entries.map(({ m, value, element }, i) => {
                const a = (2 * Math.PI * i) / entries.length - Math.PI / 2,
                  x = 400 + 230 * Math.cos(a),
                  y = 185 + 130 * Math.sin(a);
                return (
                  <g key={m.id}>
                    <line
                      x1="400"
                      y1="185"
                      x2={x}
                      y2={y}
                      stroke={ELEMENT_COLORS[element ?? ""] ?? "#b9a0d4"}
                      opacity=".4"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill="var(--w-surface)"
                      stroke={ELEMENT_COLORS[element ?? ""] ?? "#b9a0d4"}
                    />
                    <text x={x} y={y + 5} textAnchor="middle" fontSize="19">
                      {m.avatar}
                    </text>
                    <text
                      x={x}
                      y={y + 41}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="13"
                    >
                      {m.name}
                    </text>
                    <text
                      x={x}
                      y={y + 59}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="11"
                    >
                      {value ?? "Profil ergänzen"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </section>
          <div className="s-grid">
            {entries.flatMap((a, i) =>
              entries.slice(i + 1).map((b) => {
                const same = a.element && a.element === b.element;
                return (
                  <article className="w-card" key={`${a.m.id}-${b.m.id}`}>
                    <span className="w-eyebrow">
                      {a.m.name} × {b.m.name}
                    </span>
                    <h3>
                      {!a.value || !b.value
                        ? "Geburtsprofile fehlen"
                        : same
                          ? "Gemeinsame Ausdrucksweise"
                          : "Verschiedene Perspektiven"}
                    </h3>
                    <p className="w-muted">
                      {a.value ?? "Offen"} · {b.value ?? "Offen"}
                    </p>
                    <p>
                      {!a.value || !b.value
                        ? "Über das Sternsymbol bei der Person das Profil berechnen."
                        : same
                          ? `Beide tragen ${a.element}. Wo stärkt euch eure Ähnlichkeit – und welche Perspektive holt ihr bewusst von außen dazu?`
                          : `${a.m.name} und ${b.m.name}: Was braucht jede Person für konzentriertes Arbeiten? Vereinbart Rollen und Pausen anhand eurer eigenen Erfahrungen.`}
                    </p>
                  </article>
                );
              }),
            )}
          </div>
        </>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title="Geburtsprofil im Team"
        size="xl"
      >
        {edit && <BirthProfile key={edit} personId={edit} />}
      </Modal>
    </div>
  );
}
