import Link from "next/link";
import { notFound } from "next/navigation";
import { appFor } from "@/lib/apps/catalog";
import "@/components/apps/apps.css";

export default async function AppDetail({ params }: { params: Promise<{ slug: string }> }) {
  const app = appFor((await params).slug);
  if (!app || app.state === "trinity") notFound();
  return <section className="neo-apps workspace-page app-detail">
    <Link href="/dashboard/apps" className="app-back">← Meine Apps</Link>
    <img className="app-detail-art" src={`/apps/${app.slug}.svg`} width={360} height={220} alt="" />
    <p className="app-category">{app.category}</p><h1>{app.name}</h1><p className="app-detail-lead">{app.description}</p>
    <h2>Der neue Raum</h2><p>{app.vision}</p>
    {app.legacyUrl ? <>
      <a className="app-action" href={app.legacyUrl} target="_blank" rel="noopener noreferrer">Bisherige App öffnen ↗</a>
      <p className="app-hint">Öffnet einen neuen Tab. Die bisherige Domain führt derzeit zur FuseBase-Anmeldung. Dein Trinity-Zugang meldet dich dort noch nicht automatisch an.</p>
    </> : <p className="app-hint">Der vorhandene Entwurf enthält noch kein Filmprogramm. Sobald die aktuelle Quelle und ihr Ziel bestätigt sind, kommt hier der feste Einstieg zu deiner Sammlung hinzu.</p>}
    <p className="app-hint">Die Gestaltung oben ist der Ausblick für diesen Raum. Die bestehende App und ihre Daten bleiben erhalten.</p>
  </section>;
}
