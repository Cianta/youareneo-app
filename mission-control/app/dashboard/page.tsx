import Link from "next/link";
import { workspaceIdentity } from "@/lib/workspace/session";
import { usesSupabase } from "@/lib/supabase/config";
import Onboarding from "@/components/workspace/Onboarding";
import { brandConfig } from "@/lib/brand";
export default async function Dashboard() {
  const identity = usesSupabase() ? await workspaceIdentity() : null;
  const { appName } = brandConfig();
  return (
    <section className="workspace-page">
      <p className="workspace-eyebrow">DEIN ARBEITSRAUM</p>
      <h1>
        {identity ? `Hallo, ${identity.name}.` : `Willkommen bei ${appName}.`}
      </h1>
      <p className="workspace-lead">
        Halte einen Gedanken fest, bring deine Aufgaben voran oder finde den
        nächsten Schritt in deinem Projekt.
      </p>
      <div className="workspace-grid">
        <Link className="workspace-card" href="/notiz?new=1">
          Einen Gedanken festhalten
          <small>Neue Notiz schreiben oder sprechen →</small>
        </Link>
        <Link className="workspace-card" href="/dashboard/vision/tasks">
          Aufgaben voranbringen
          <small>Deine bisherigen Boards und Trello →</small>
        </Link>
        <Link className="workspace-card" href="/dashboard/projekte">
          Projekte ordnen<small>Eigene Notizen in Projekten sammeln →</small>
        </Link>
        <Link className="workspace-card" href="/dashboard/kanban">
          Ziele & Journal<small>Deine Notebooks auf diesem Gerät →</small>
        </Link>
      </div>
      <h2>Alles hat seinen Platz.</h2>
      <p className="workspace-lead">
        Mit ⌘K oder Ctrl+K findest du Seiten, Aktionen und deine gespeicherten
        Inhalte. Werkzeuge und Experimente findest du im Labor.
      </p>
      <div className="workspace-grid">
        <Link className="workspace-card" href="/dashboard/apps" prefetch={false}>
          Meine Apps
          <small>Radio, Kochbuch und deine kreativen Räume →</small>
        </Link>
        <Link className="workspace-card" href="/dashboard/labor">
          Labor entdecken
          <small>Bisherige Arbeitsbereiche und externe Werkzeuge →</small>
        </Link>
        <a
          className="workspace-card"
          href="https://archiv.youareneo.com"
          target="_blank"
          rel="noreferrer"
        >
          Archiv der Lebenskünste
          <small>Wissen und Inhalte im Archiv öffnen ↗</small>
        </a>
        <Link className="workspace-card" href="/dashboard/labor/uebersicht">
          Bisherige Gesamtübersicht
          <small>Kennzahlen, Agenten und lokale Ziele →</small>
        </Link>
      </div>
      {identity && !identity.onboarded && (
        <Onboarding initialName={identity.name} />
      )}
    </section>
  );
}
