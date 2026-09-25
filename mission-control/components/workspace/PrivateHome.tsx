"use client";
import Link from "next/link";
import { usePersonal, inWorkspace } from "@/lib/workspace/personal";
import { Today } from "./Today";
import { Apps } from "./Apps";
export function WorkspaceHome() {
  const s = usePersonal();
  if (s.workspace === "organization") return <Today />;
  return (
    <div className="w-page">
      <span className="w-eyebrow">DEIN PRIVATER RAUM</span>
      <h1>Zeit für dein Leben.</h1>
      <p className="w-muted">
        Deine Lieblingsapps, Spiele, Ideen und persönlichen Ziele.
      </p>
      <div className="s-grid">
        {[
          ["Mein Tagesplan", "/dashboard/goals"],
          ["Ideen & Erinnerungen", "/dashboard/eden"],
          ["Mein Wissen", "/dashboard/second-brain"],
          ["Kraft schöpfen", "/dashboard/meditation"],
        ].map(([label, href]) => (
          <Link key={href} className="w-card" href={href}>
            <h2>{label} ↗</h2>
          </Link>
        ))}
      </div>
      <section className="w-card">
        <h2>Was dir gerade wichtig ist</h2>
        {s.goals
          .filter((g) => inWorkspace(g, "private") && !g.done)
          .map((g) => (
            <p key={g.id}>
              ◎ {g.title} <small>{g.step}</small>
            </p>
          ))}
      </section>
      <Apps />
    </div>
  );
}
