import Link from "next/link";
import { neoApps } from "@/lib/apps/catalog";
import "@/components/apps/apps.css";

export default function MyApps() {
  return <section className="neo-apps workspace-page">
    <header className="apps-intro">
      <p className="workspace-eyebrow">DEINE RÄUME</p>
      <h1>Meine Apps</h1>
      <p>Ein Gedanke, ein Klang, ein kleines Abenteuer. Hier findest du alle Räume an einem festen Platz.</p>
    </header>
    <nav className="apps-catalog" aria-label="Meine Apps">
      {neoApps.map(app => <Link key={app.slug} href={app.href} prefetch={false} className="app-card">
        <img src={`/apps/${app.slug}.svg`} alt="" width={360} height={220} loading="lazy" decoding="async" />
        <div><p className="app-category">{app.category}</p><h2>{app.name}</h2><p>{app.description}</p>
          <span className="app-status">{app.state === "portal" ? "Buzz-Zugang öffnen" : app.state === "trinity" ? "In guiding.space öffnen" : app.state === "legacy" ? "Bisherige App & Ausblick" : "Ausblick & Stand"} <span aria-hidden="true">↗</span></span>
        </div>
      </Link>)}
    </nav>
    <aside className="apps-account-note"><h2>Eine Anmeldung, persönliche Inhalte</h2>
      <p>Radio-Merkliste, Küchenschatzbuch und Trinity verwenden deinen Trinity-Zugang. Bestehende externe Apps nutzen teilweise noch ihre bisherige Anmeldung. Ihre Konten und Sammlungen sind noch nicht vollständig zusammengeführt.</p>
      <Link href="/dashboard/labor" prefetch={false}>Weitere Werkzeuge im Labor →</Link>
    </aside>
  </section>;
}
