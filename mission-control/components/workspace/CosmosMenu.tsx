"use client";
import { useEffect, useState } from "react";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { skyNow, COSMOS_SYSTEMS, ELEMENT_COLORS } from "@/lib/workspace/cosmos";
import { usePersonal } from "@/lib/workspace/personal";
import { Modal } from "@/components/ui/Modal";
export function CosmosMenu() {
  const [now, setNow] = useState<Date | null>(null),
    [open, setOpen] = useState(false);
  const p = usePersonal();
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <div className="s-cosmos-mini">Dein Himmelskompass …</div>;
  const sky = skyNow(now),
    key = COSMOS_SYSTEMS.find(([k]) => k === p.astroPin)?.[0] ?? "chinese",
    pin = sky[key];
  return (
    <>
      <div className="s-cosmos-frame">
        <div className="s-cosmos-head">
          <small>HIMMELSKOMPASS</small>
          <button
            className="w-icon"
            aria-label={
              p.cosmosVisible
                ? "Himmelskompass ausblenden"
                : "Himmelskompass einblenden"
            }
            onClick={() => p.set({ cosmosVisible: !p.cosmosVisible })}
          >
            {p.cosmosVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
        {p.cosmosVisible && (
          <div className="s-cosmos-mini">
            <span
              className="s-blue-moon"
              title={`${sky.moon.name} · ${sky.moon.illumination}% beleuchtet`}
              aria-label={sky.moon.name}
            >
              {sky.moon.icon}
            </span>
            <button
              className="w-icon"
              aria-label="Aktuelle astrologische Gegebenheiten öffnen"
              onClick={() => setOpen(true)}
            >
              <ChevronRight size={17} />
            </button>
            <span
              style={{
                color:
                  "element" in pin ? ELEMENT_COLORS[pin.element] : undefined,
              }}
            >
              {pin.icon} {pin.name}
            </span>
          </div>
        )}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Dein Himmelskompass"
      >
        <p className="w-muted">
          {now.toLocaleString("de-AT")} · {sky.moon.icon} {sky.moon.name} ·{" "}
          {sky.moon.illumination}% beleuchtet
        </p>
        <div className="s-stack">
          {COSMOS_SYSTEMS.map(([k, label]) => (
            <label className="s-cosmos-row" key={k}>
              <span>
                <small>{label}</small>
                <strong
                  style={{
                    color:
                      "element" in sky[k]
                        ? ELEMENT_COLORS[
                            (sky[k] as { element: string }).element
                          ]
                        : undefined,
                  }}
                >
                  {sky[k].icon} {sky[k].name}
                </strong>
              </span>
              <input
                type="radio"
                name="astro-pin"
                checked={key === k}
                onChange={() => p.set({ astroPin: k })}
                aria-label={`${label} im Menü anzeigen`}
              />
            </label>
          ))}
        </div>
        <p className="w-muted">
          Auswahl = dauerhafte Anzeige neben dem Mond. Symbolische Deutungen
          dienen der Reflexion, nicht der Bewertung von Menschen. Dreamspell und
          Baumkalender sind moderne Traditionen.
        </p>
        <Link
          className="w-btn"
          href="/dashboard/soul"
          onClick={() => setOpen(false)}
        >
          Mein Geburtsprofil öffnen →
        </Link>
      </Modal>
    </>
  );
}
