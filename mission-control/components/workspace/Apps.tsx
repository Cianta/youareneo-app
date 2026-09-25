"use client";
import { FormEvent, useState } from "react";
import {
  Plus,
  ArrowUpRight,
  Link2,
  Search,
  Pencil,
  Trash2,
  Globe2,
} from "lucide-react";
import { useLauncherStore } from "@/lib/store";
import { validWebUrl } from "@/lib/workspace/time";
import { Modal } from "@/components/ui/Modal";
import { usePersonal, inWorkspace, type Workspace } from '@/lib/workspace/personal';
import { WorkspaceChoice } from './WorkspaceChoice';
import { EcosystemApps } from './EcosystemApps';
import { AppLogo } from './AppLogo';
export function Apps() {
  const store = useLauncherStore();
  const personal=usePersonal();
  const [scope,setScope]=useState<Workspace>(personal.workspace);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<{ key: string; id: string } | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const apps = Object.entries(store.apps)
    .flatMap(([key, items]) => items.map((app) => ({ ...app, key })))
    .filter((a) => a.kind === "webapp" && inWorkspace(a,personal.workspace));
  function save(e: FormEvent) {
    e.preventDefault();
    const safe = validWebUrl(url);
    if (!safe) {
      setError("Bitte eine vollständige Webadresse mit https:// eingeben.");
      return;
    }
    const data = {
      workspace: new FormData(e.currentTarget as HTMLFormElement).get("workspace") as Workspace,
      name: name.trim(),
      url: safe,
      description: description.trim(),
      kind: "webapp" as const,
      openMode: "tab" as const,
    };
    if (!data.name) return;
    try {
      if (edit) store.updateApp(edit.key, edit.id, data);
      else store.addApp("workspace", data);
      setOpen(false);
    } catch {
      setError(
        "Speichern fehlgeschlagen. Bitte prüfe den freien Browserspeicher.",
      );
    }
  }
  return (
    <div className="w-page">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">DEINE WELT, VERBUNDEN</span>
          <h1>Ein Zuhause für deine Apps.</h1>
          <p>
            Deine wichtigsten Werkzeuge und Websites. Einen bewussten Klick
            entfernt.
          </p>
        </div>
        <button
          className="w-btn w-btn-primary"
          onClick={() => {
            setEdit(null); setScope(personal.workspace);
            setName("");
            setUrl("");
            setDescription("");
            setError("");
            setOpen(true);
          }}
        >
          <Plus size={17} />
          App hinzufügen
        </button>
      </div>
      <EcosystemApps/><div className="w-apps-search">
        <Search size={18} />
        <input
          aria-label="Apps suchen"
          placeholder="Deine Arbeitswelt durchsuchen …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span>{apps.length} Apps</span>
      </div>
      <div className="w-app-grid">
        {apps
          .filter((a) =>
            `${a.name} ${a.description}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((app) => (
            <article className="w-card w-app-tile" key={app.id}>
              <div className="w-section-head">
                <span className="w-app-letter">
                  <AppLogo label={app.name} href={app.url} />
                </span>
                <span className="w-tag">
                  <Link2 size={12} />
                  Weblink
                </span>
              </div>
              <h2>{app.name}</h2>
              <p>
                {app.description ||
                  new URL(validWebUrl(app.url) || "https://invalid.local")
                    .hostname}
              </p>
              <div className="w-section-head">
                {validWebUrl(app.url) ? (
                  <a
                    className="w-text-link"
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    App öffnen <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <span className="w-error">Webadresse prüfen</span>
                )}
                <button
                  className="w-icon"
                  aria-label={`${app.name} bearbeiten`}
                  onClick={() => {
                    setEdit({ key: app.key, id: app.id }); setScope(app.workspace??"organization");
                    setName(app.name);
                    setUrl(app.url);
                    setDescription(app.description);
                    setError("");
                    setOpen(true);
                  }}
                >
                  <Pencil size={15} />
                </button>
              </div>
            </article>
          ))}
      </div>
      {!apps.length && (
        <div className="w-card w-empty w-empty-large">
          <Globe2 size={36} />
          <h2>Alles, womit du gerne arbeitest.</h2>
          <p>
            Füge zum Beispiel dein Notion, Canva, E-Mail-Postfach oder eine
            Projektwebsite hinzu.
          </p>
        </div>
      )}
      {!!apps.length &&
        !apps.some((a) =>
          `${a.name} ${a.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ) && <p className="w-muted">Keine passende App gefunden.</p>}
      <p className="w-storage-note">
        Weblinks öffnen deine Tools in einem neuen Tab. Sie gewähren Trinity
        keinen Zugriff auf deren Daten. Deine Liste wird derzeit in diesem
        Browser gespeichert.
      </p>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? "App bearbeiten" : "Deine Arbeitswelt erweitern"}
      >
        <form className="w-form" onSubmit={save}>
          <label>
            Name
            <input
              autoFocus
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zum Beispiel Notion"
            />
          </label>
          <label>
            Webadresse
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <WorkspaceChoice key={String(open)+scope} value={scope}/><label>
            Wofür nutzt du sie?
            <input
              maxLength={240}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Projekte, Ideen und Wissen"
            />
          </label>
          {error && (
            <p role="alert" className="w-error">
              {error}
            </p>
          )}
          <div className="w-form-actions">
            {edit && (
              <button
                type="button"
                className="w-btn"
                onClick={() => {
                  store.removeApp(edit.key, edit.id);
                  setOpen(false);
                }}
              >
                <Trash2 size={15} />
                Entfernen
              </button>
            )}
            <button className="w-btn w-btn-primary">Speichern</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
