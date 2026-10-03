"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  RefreshCw,
  Star,
  Mail,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import { useContacts, type Contact } from "@/lib/workspace/contacts";
import {
  usePersonal,
  inWorkspace,
  type Workspace,
} from "@/lib/workspace/personal";
import {
  CONTACT_STAGES,
  STAGE_LABELS,
  type ContactStage,
  type CrmProvider,
} from "@/lib/crm/contracts";
import { useContactDirectory } from "./ContactDirectory";
import { WorkspaceChoice } from "./WorkspaceChoice";
import { Dialog } from "./Dialog";
import { localDate } from "@/lib/workspace/time";
const sourceLabel = (source: string) =>
  source === "hubspot"
    ? "HubSpot"
    : source === "ghl"
      ? "HighLevel"
      : "Eigener Kontakt";
function ContactForm({
  contact,
  onSave,
  busy = false,
}: {
  contact?: Contact;
  onSave: (contact: Contact) => Promise<void> | void;
  busy?: boolean;
}) {
  const remote = contact && contact.source !== "local";
  return (
    <form
      className="crm-contact-form s-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void onSave({
          ...contact,
          id: contact?.id ?? crypto.randomUUID(),
          name: String(f.get("name")).trim(),
          email: String(f.get("email") || "").trim(),
          company: String(f.get("company") || "").trim(),
          phone: String(f.get("phone") || "").trim(),
          workspace: (f.get("workspace") ||
            contact?.workspace ||
            "organization") as Workspace,
          source: contact?.source ?? "local",
          stage: String(f.get("stage")) as ContactStage,
          note: String(f.get("note") || "").trim(),
          nextContact: String(f.get("nextContact") || ""),
          favorite: contact?.favorite ?? false,
          updatedAt: new Date().toISOString(),
        });
        if (!contact) e.currentTarget.reset();
      }}
    >
      <label>
        Name
        <input
          name="name"
          className="w-input"
          required
          maxLength={250}
          defaultValue={contact?.name}
          readOnly={!!remote}
        />
      </label>
      <label>
        E-Mail
        <input
          name="email"
          type="email"
          className="w-input"
          maxLength={254}
          defaultValue={contact?.email}
          readOnly={!!remote}
        />
      </label>
      <label>
        Organisation / Firma
        <input
          name="company"
          className="w-input"
          maxLength={250}
          defaultValue={contact?.company}
          readOnly={!!remote}
        />
      </label>
      <label>
        Telefon
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          className="w-input"
          maxLength={40}
          defaultValue={contact?.phone}
          readOnly={!!remote}
        />
      </label>
      <label>
        Verbindung
        <select
          className="w-input"
          name="stage"
          defaultValue={contact?.stage ?? "neu"}
        >
          {CONTACT_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Nächster Kontakt
        <input
          className="w-input"
          type="date"
          name="nextContact"
          defaultValue={contact?.nextContact}
        />
      </label>
      <label>
        Was verbindet euch?
        <textarea
          className="w-input"
          name="note"
          rows={3}
          maxLength={4000}
          defaultValue={contact?.note}
          placeholder="Gemeinsame Ideen, Gesprächsnotizen, nächste Schritte …"
        />
      </label>
      {!remote && <WorkspaceChoice />}
      {remote && (
        <small className="w-muted">
          Stammdaten kommen aus deinem CRM. Gesprächsnotizen und Wiedervorlagen
          bleiben in guiding.space.
        </small>
      )}
      <button className="w-btn" disabled={busy}>
        {busy ? "Wird gespeichert …" : "Speichern"}
      </button>
    </form>
  );
}
export function Contacts() {
  const store = useContacts(),
    personal = usePersonal(),
    directory = useContactDirectory();
  const [query, setQuery] = useState(""),
    [stage, setStage] = useState("all"),
    [favorites, setFavorites] = useState(false),
    [editing, setEditing] = useState<Contact | null>(null),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [syncing, setSyncing] = useState<CrmProvider | null>(null),
    [preview, setPreview] = useState<{
      provider: CrmProvider;
      userId: string;
      contacts: Contact[];
      truncated: boolean;
    } | null>(null);
  useEffect(() => {
    if (directory.userId && preview && preview.userId !== directory.userId)
      setPreview(null);
  }, [directory.userId, preview]);
  const directoryOwner = useRef("");
  useEffect(() => {
    if (directory.userId) {
      if (
        directoryOwner.current &&
        directoryOwner.current !== directory.userId
      ) {
        setEditing(null);
        setPreview(null);
        setStatus(
          "Das Konto hat gewechselt. Bitte Kontakte und Abgleich neu öffnen.",
        );
      }
      directoryOwner.current = directory.userId;
    }
  }, [directory.userId]);
  const contacts = directory.contacts.filter((c) =>
    inWorkspace(c, personal.workspace),
  );
  const filtered = contacts
    .filter(
      (c) =>
        `${c.name} ${c.email} ${c.company} ${c.note ?? ""} ${(c.tags ?? []).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (stage === "all" || (c.stage ?? "neu") === stage) &&
        (!favorites || c.favorite),
    )
    .sort(
      (a, b) =>
        Number(b.favorite ?? false) - Number(a.favorite ?? false) ||
        a.name.localeCompare(b.name, "de"),
    );
  const followups = contacts
    .filter((c) => c.nextContact && c.nextContact <= localDate())
    .sort((a, b) => a.nextContact!.localeCompare(b.nextContact!));
  async function save(c: Contact) {
    setBusy(true);
    setStatus("");
    try {
      if (!directory.local.some((r) => r.id === c.id) && c.source !== "local") {
        const r = await fetch("/api/crm/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: c.id,
            userId: directory.userId,
            stage: c.stage ?? "neu",
            note: c.note ?? "",
            nextContact: c.nextContact ?? "",
            favorite: !!c.favorite,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        window.dispatchEvent(new Event("neo-contacts-changed"));
      } else store.merge([c]);
      setEditing(null);
      setStatus("Kontakt gespeichert.");
    } catch (e) {
      setStatus(
        e instanceof Error
          ? e.message
          : "Kontakt konnte nicht gespeichert werden.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function sync(provider: CrmProvider, commit = false) {
    if (syncing) return;
    if (commit && preview?.userId !== directory.userId) {
      setPreview(null);
      setStatus(
        "Dein Konto hat gewechselt. Bitte den Abgleich erneut vorbereiten.",
      );
      return;
    }
    setSyncing(provider);
    setStatus("");
    try {
      const r = await fetch("/api/crm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, commit, userId: directory.userId }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (commit) {
        setPreview(null);
        window.dispatchEvent(new Event("neo-contacts-changed"));
        setStatus(
          `${sourceLabel(provider)}: ${d.contacts.length} Kontakte abgeglichen. Deine Notizen und Wiedervorlagen bleiben erhalten.`,
        );
      } else setPreview(d);
    } catch (e) {
      setStatus(
        e instanceof Error
          ? e.message
          : "Abgleich konnte nicht vorbereitet werden.",
      );
    } finally {
      setSyncing(null);
    }
  }
  return (
    <div className="w-page crm-space">
      <header className="w-page-heading">
        <div>
          <span className="w-eyebrow">
            KOMMUNIKATION · MENSCHEN & VERBINDUNGEN
          </span>
          <h1>Kontakte CRM.</h1>
          <p>Beziehungen pflegen. Gemeinsam Möglichkeiten schaffen.</p>
        </div>
        <a className="w-btn" href="#new-contact">
          <Users size={16} /> Neuer Kontakt
        </a>
      </header>
      <div className="crm-stats">
        {[
          [contacts.length, "Menschen"],
          [
            new Set(contacts.map((c) => c.company).filter(Boolean)).size,
            "Organisationen",
          ],
          [
            contacts.filter((c) => c.stage === "verbunden").length,
            "Verbindungen",
          ],
          [followups.length, "Wiedervorlagen fällig"],
        ].map(([n, label]) => (
          <div className="crm-stat" key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="crm-studio-layout">
        <div className="crm-main">
          <div className="crm-controls">
            <label className="studio-search">
              <Search size={16} />
              <input
                type="search"
                aria-label="Kontakte suchen"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, E-Mail, Thema …"
              />
            </label>
            <select
              aria-label="Kontakte nach Verbindung filtern"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="all">Alle Verbindungen</option>
              {CONTACT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              className="w-btn"
              aria-pressed={favorites}
              onClick={() => setFavorites(!favorites)}
            >
              <Star size={14} /> Merkliste
            </button>
          </div>
          <div className="crm-contact-grid s-grid">
            {filtered.map((c) => (
              <article className="crm-contact-card" key={c.id}>
                <div className="crm-contact-heading">
                  <span className="crm-contact-avatar" aria-hidden="true">
                    {c.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <h2>{c.name}</h2>
                    <p>{c.company || "Deine Verbindung"}</p>
                  </div>
                </div>
                <div className="crm-contact-meta">
                  <span
                    className="crm-status-pill"
                    data-stage={c.stage ?? "neu"}
                  >
                    {STAGE_LABELS[c.stage ?? "neu"]}
                  </span>
                  <span>{sourceLabel(c.source)}</span>
                </div>
                {c.email && (
                  <a href={"mailto:" + encodeURIComponent(c.email)}>
                    <Mail size={12} /> {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={"tel:" + c.phone.replace(/[^+0-9]/g, "")}>
                    <Phone size={12} /> {c.phone}
                  </a>
                )}
                {c.note && <p className="crm-contact-note">{c.note}</p>}
                {c.nextContact && (
                  <p
                    className="crm-followup"
                    data-due={c.nextContact <= localDate()}
                  >
                    Nächster Kontakt ·{" "}
                    {new Date(c.nextContact + "T12:00:00").toLocaleDateString(
                      "de-AT",
                    )}
                  </p>
                )}
                <div className="crm-contact-actions">
                  <button className="w-btn" onClick={() => setEditing(c)}>
                    Details & Notizen
                  </button>
                  <button
                    className="w-btn"
                    aria-label={c.name + " merken"}
                    aria-pressed={!!c.favorite}
                    disabled={busy}
                    onClick={() => void save({ ...c, favorite: !c.favorite })}
                  >
                    <Star
                      size={13}
                      fill={c.favorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <section className="studio-widget">
              <h2>
                {contacts.length
                  ? "Keine passenden Kontakte."
                  : "Ein Mensch macht den Anfang."}
              </h2>
              <p>
                {contacts.length
                  ? "Ändere deine Suche oder Filter."
                  : "Füge einen Kontakt hinzu oder verbinde dein CRM rechts."}
              </p>
            </section>
          )}
          <details id="new-contact" className="w-card">
            <summary>Kontakt hinzufügen</summary>
            <ContactForm onSave={save} busy={busy} />
          </details>
          <p className="w-storage-note">
            Eigene Kontakte bleiben auf diesem Gerät. Importierte Kontakte und
            ihre Gesprächsnotizen liegen in deinem privaten Kontospeicher.
          </p>
        </div>
        <aside className="crm-aside" aria-label="Beziehungen pflegen">
          <section className="studio-widget" data-color="rose">
            <h2>Zeit für Verbindung</h2>
            <p>Menschen, bei denen du dich wieder melden wolltest.</p>
            {followups.slice(0, 5).map((c) => (
              <button
                className="w-btn"
                key={c.id}
                onClick={() => setEditing(c)}
              >
                {c.name} · {c.nextContact}
              </button>
            ))}
            {!followups.length && (
              <small>
                Gerade keine fälligen Wiedervorlagen. Öffne einen Kontakt und
                plane den nächsten Austausch.
              </small>
            )}
            <Link href="/dashboard/communication/meeting">
              Ein Gespräch einladen <ArrowUpRight size={14} />
            </Link>
          </section>
          <section className="studio-widget" data-color="teal">
            <RefreshCw size={21} />
            <h2>Deine CRM-Verbindungen</h2>
            <p>
              Manueller Import mit Vorschau. Kontakte werden ergänzt und
              aktualisiert; Gesprächsnotizen bleiben erhalten.
            </p>
            {(["hubspot", "ghl"] as const).map((provider) => {
              const ready = directory.providers.find(
                (p) => p.id === provider,
              )?.ready;
              return (
                <section className="crm-sync-provider" key={provider}>
                  <header>
                    <span
                      className="crm-provider-mark"
                      aria-hidden="true"
                      data-provider={provider}
                    >
                      {provider === "hubspot" ? "H" : "G"}
                    </span>
                    <strong>{sourceLabel(provider)}</strong>
                  </header>
                  <small>
                    {ready
                      ? "Für dein Konto eingerichtet"
                      : "Noch nicht verbunden"}
                  </small>
                  <button
                    className="w-btn"
                    disabled={!ready || !!syncing}
                    onClick={() => void sync(provider)}
                  >
                    {syncing === provider
                      ? "Kontakte werden gelesen …"
                      : "Abgleich vorbereiten"}
                  </button>
                  {!ready && (
                    <small>
                      Server-Anbindung mit privatem Token und deiner
                      NEO-Nutzer-ID erforderlich.
                    </small>
                  )}
                </section>
              );
            })}
            <p>
              Import nach guiding.space. Dieser Abgleich sendet keine Änderungen
              an das externe CRM.
            </p>
            {directory.error && (
              <p role="status">
                {directory.error} Deine lokalen Kontakte bleiben verfügbar.
              </p>
            )}
          </section>
          <section className="studio-widget" data-color="gold">
            <h2>Mehr als ein Adressbuch.</h2>
            <p>
              Notiere gemeinsame Themen, markiere wichtige Verbindungen und lege
              Wiedervorlagen an. Deine Kontakte sind auch im Ideenboard und im
              Meeting verfügbar.
            </p>
            <Link href="/dashboard/eden">
              Verbindungen ins Ideenboard bringen →
            </Link>
          </section>
        </aside>
      </div>
      {status && (
        <p role="status" className="workspace-notice">
          {status}
        </p>
      )}
      {editing &&
        (directory.local.some((c) => c.id === editing.id) ||
          !!directory.userId) && (
          <Dialog title={editing.name} onClose={() => setEditing(null)}>
            <ContactForm
              key={editing.id}
              contact={editing}
              onSave={save}
              busy={busy}
            />
          </Dialog>
        )}
      {preview && preview.userId === directory.userId && (
        <Dialog
          title={sourceLabel(preview.provider) + " · Importvorschau"}
          onClose={() => {
            if (!syncing) setPreview(null);
          }}
        >
          <div className="crm-sync-preview">
            <p>
              {preview.contacts.length} Kontakte gelesen.{" "}
              {preview.truncated &&
                "Ausschnitt: maximal 2.000 Kontakte pro Abgleich."}
            </p>
            <p>
              Vorhandene Einträge derselben Quelle werden aktualisiert. Lokale
              Kontakte, Notizen, Merkliste und Wiedervorlagen bleiben erhalten.
              Gleiche E-Mail-Adressen aus verschiedenen Quellen werden zur
              Prüfung getrennt angezeigt.
            </p>
            <ul>
              {preview.contacts.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> ·{" "}
                  {c.email || c.company || "Keine E-Mail"}
                </li>
              ))}
            </ul>
            <button
              className="w-btn"
              disabled={!!syncing}
              onClick={() => void sync(preview.provider, true)}
            >
              {syncing ? "Wird abgeglichen …" : "Kontakte übernehmen"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
