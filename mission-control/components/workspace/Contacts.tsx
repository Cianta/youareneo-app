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
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState("");
  return (
    <div className="w-page">
      <span className="w-eyebrow">MENSCHEN & VERBINDUNGEN</span>
      <h1>Deine Kontakte.</h1>
      <p>Verwende Kontakte im Ideenraum und verknüpfe sie mit Dokumenten.</p>
      <button
        className="w-btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          let after = "",
            count = 0;
          try {
            do {
              const r = await fetch(
                "/api/hubspot/contacts" +
                  (after ? "?after=" + encodeURIComponent(after) : ""),
                { signal: AbortSignal.timeout(15000) },
              );
              const data = await r.json();
              if (!r.ok) throw new Error(data.error);
              s.merge(data.contacts);
              count += data.contacts.length;
              after = data.after ?? "";
            } while (after && count < 2000);
            setStatus(
              `${count} Kontakte aktualisiert.${after ? " Limit von 2000 erreicht." : " Abgleich abgeschlossen."}`,
            );
          } catch (e) {
            setStatus(
              e instanceof Error ? e.message : "Abgleich fehlgeschlagen",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "HubSpot wird gelesen …" : "Mit HubSpot abgleichen"}
      </button>
      <p role="status">{status}</p>
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
        Der Abgleich liest HubSpot-Kontakte und aktualisiert vorhandene IDs. Er
        schreibt keine CRM-Daten zurück und löscht keine lokalen Einträge.
      </p>
    </div>
  );
}
