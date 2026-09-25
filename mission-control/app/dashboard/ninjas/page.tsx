"use client";
import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Orbit, Bot, Users } from "lucide-react";
import { NinjasView } from "@/components/ninjas/NinjasView";
import { TeamFlow } from "@/components/workspace/TeamFlow";
import { useAgentStore } from "@/lib/store";
export default function NinjasPage() {
  const [tab, setTab] = useState("people"),
    agents = useAgentStore((s) => s.agents);
  return (
    <div className="w-page">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">GEMEINSAM WÄCHST MEHR</span>
          <h1>Menschen. Ideen. Möglichkeiten.</h1>
          <p>Dein Team, seine Stärken und eure digitalen Begleiter.</p>
        </div>
        <div className="s-actions">
          <Link className="w-btn" href="/dashboard/communication/kchat">
            <MessageCircle size={16} />
            Team-Kommunikation
          </Link>
          <button className="w-btn" onClick={() => setTab("flow")}>
            <Orbit size={16} />
            Team Flow Planer
          </button>
        </div>
      </div>
      <div className="s-tabs" role="tablist" aria-label="Team-Bereiche">
        {[
          ["people", "Mein Team", Users],
          ["flow", "Team Flow Planer", Orbit],
          ["friends", "Digital Friends", Bot],
        ].map(([id, label, Icon]) => {
          const I = Icon as typeof Users;
          return (
            <button
              key={String(id)}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(String(id))}
            >
              <I size={16} />
              {String(label)}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {tab === "people" ? (
          <NinjasView />
        ) : tab === "flow" ? (
          <TeamFlow />
        ) : (
          <div className="s-stack">
            <div className="w-page-heading">
              <div>
                <h2>Digital Friends</h2>
                <p>
                  Deine konfigurierten AI-Begleiter. Jeder mit einer klaren
                  Aufgabe.
                </p>
              </div>
              <Link className="w-btn" href="/dashboard/agents/agent-overview">
                Begleiter verwalten →
              </Link>
            </div>
            <div className="s-grid">
              {agents.map((a) => (
                <Link
                  href={`/dashboard/agents/${a.id}`}
                  className="w-card"
                  key={a.id}
                >
                  <span className="w-eyebrow">AI-BEGLEITER</span>
                  <h2>{a.name}</h2>
                  <p>{a.capabilities.join(" · ")}</p>
                </Link>
              ))}
            </div>
            {!agents.length && (
              <div className="s-empty">
                ✦<p>Noch keine digitalen Begleiter konfiguriert.</p>
                <Link className="w-btn" href="/dashboard/agents/agent-overview">
                  Digital Friend einrichten
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
