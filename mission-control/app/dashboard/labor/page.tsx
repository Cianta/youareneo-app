import Link from "next/link";
import { laboratory, primary } from "@/lib/workspace/navigation";
export default function Laboratory() {
  return (
    <section className="workspace-page">
      <p className="workspace-eyebrow">ENTDECKEN</p>
      <h1>Labor & weitere Bereiche</h1>
      <p className="workspace-lead">
        Deine Werkzeuge und bisherigen Arbeitsbereiche. Externe Dienste und
        Experimente können eine eigene Anmeldung oder Einrichtung brauchen.
      </p>
      <nav aria-label="Weitere Arbeitsbereiche" className="workspace-grid">
        {primary
          .filter((p) => p.id !== "lab")
          .map((p) => (
            <Link className="workspace-card" key={p.id} href={p.href}>
              {p.label}
            </Link>
          ))}
        <a
          className="workspace-card"
          href="https://archiv.youareneo.com"
          target="_blank"
          rel="noreferrer"
        >
          Archiv der Lebenskünste ↗
        </a>
      </nav>
      <h2>Werkzeuge & Experimente</h2>
      <p className="workspace-muted">
        Bestehende Daten bleiben erhalten. Manche Bereiche speichern nur auf
        diesem Gerät oder verwenden gemeinsame Altbestände; sie sind nicht Teil
        deiner privaten Inhaltssuche.
      </p>
      <div className="workspace-grid">
        {laboratory.map((p) => (
          <Link className="workspace-card" key={p.id} href={p.href}>
            {p.label}
            <small>Öffnen →</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
