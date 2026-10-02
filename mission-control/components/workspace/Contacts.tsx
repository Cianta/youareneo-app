"use client";
import { useState } from "react";
import { useContacts } from "@/lib/workspace/contacts";
import {
  usePersonal,
  inWorkspace,
  type Workspace,
} from "@/lib/workspace/personal";
import { WorkspaceChoice } from "./WorkspaceChoice";
export function Contacts() {
  const s = useContacts(),
    p = usePersonal(),
    [query, setQuery] = useState("");
  return (
    <div className="w-page">
      <span className="w-eyebrow">MENSCHEN & VERBINDUNGEN</span>
      <h1>Deine Kontakte.</h1>
      <p>Verwende Kontakte im Ideenraum und verknüpfe sie mit Dokumenten.</p>
      <p className="w-muted">Lokale Kontakte auf diesem Gerät. Ein CRM-Abgleich ist derzeit nicht verbunden.</p>
      <input
        className="w-input"
        aria-label="Kontakte suchen"
        placeholder="Name, E-Mail oder Firma"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="s-grid">
        {s.contacts
          .filter(
            (c) =>
              inWorkspace(c, p.workspace) &&
              `${c.name} ${c.email} ${c.company}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((c) => (
            <article className="w-card" key={c.id}>
              <h2>{c.name}</h2>
              <p>{c.company}</p>
              <p>{c.email}</p>
              <small>
                {c.source === "hubspot" ? "HubSpot" : "Eigener Kontakt"}
              </small>
            </article>
          ))}
      </div>
      <details className="w-card">
        <summary>Kontakt hinzufügen</summary>
        <form
          className="s-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            s.merge([
              {
                id: crypto.randomUUID(),
                name: String(f.get("name")),
                email: String(f.get("email")),
                company: String(f.get("company")),
                workspace: String(f.get("workspace")) as Workspace,
                source: "local",
                updatedAt: new Date().toISOString(),
              },
            ]);
            e.currentTarget.reset();
          }}
        >
          <label>
            Name
            <input name="name" className="w-input" required />
          </label>
          <label>
            E-Mail
            <input name="email" type="email" className="w-input" />
          </label>
          <label>
            Firma
            <input name="company" className="w-input" />
          </label>
          <WorkspaceChoice />
          <button className="w-btn">Speichern</button>
        </form>
      </details>
      <p className="w-muted">
        Vorhandene lokale Kontakte bleiben erhalten. Diese Sammlung ist kein gemeinsames Adressbuch im NEO-Konto.
      </p>
    </div>
  );
}
