"use client";
import { useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { youtubeId, DEFAULT_WORK, DEFAULT_REST } from "@/lib/workspace/media";
import { useUIExtStore } from "@/lib/store";
type Clip = { id: string; title: string; url: string; mode: "work" | "break" };
const useClips = create<{ clips: Clip[]; set: (clips: Clip[]) => void }>()(
  persist(
    (set) => ({
      clips: [
        {
          id: "lofi-girl",
          title: "Lofi Girl · Beats zum Arbeiten",
          url: "https://www.youtube.com/watch?v=EWrX250Zhko",
          mode: "work",
        },
        {
          id: "nature",
          title: "Healing Nature · Wiese im Frühlingswind",
          url: "https://www.youtube.com/watch?v=B-1Ug5tCA6I",
          mode: "break",
        },
      ],
      set: (clips) => set({ clips }),
    }),
    { name: "trinity-video-links-v1" },
  ),
);
export function MediaLibrary() {
  const ui = useUIExtStore(),
    s = useClips();
  const [add, setAdd] = useState(false),
    [active, setActive] = useState<Clip | null>(null),
    [scene, setScene] = useState<string | null>(null),
    [error, setError] = useState("");
  return (
    <div className="s-stack">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">DEIN RUHEPOL</span>
          <h1>Einatmen. Ankommen. Weiterwachsen.</h1>
          <p>Klang für deinen Arbeitsfluss. Weite für deine Pause.</p>
        </div>
        <button className="w-btn" onClick={() => setAdd(true)}>
          <Plus size={16} />
          YouTube verlinken
        </button>
      </div>
      <div className="s-grid">
        {[DEFAULT_WORK, DEFAULT_REST].map((track, i) => (
          <section className="w-card" key={track.id}>
            <span className="w-eyebrow">
              {i ? "PAUSE · ABENDSTILLE" : "ARBEITEN · WALDLICHT"}
            </span>
            <h3 className="my-3">{track.name}</h3>
            <audio
              className="w-full"
              src={track.dataUrl}
              controls
              preload="none"
              loop
            />
            <p className="w-muted">
              Eigene synthetische Klangfläche · 48 Sekunden · wiederholbar
            </p>
            <button
              className="w-btn"
              onClick={() => {
                if (i) {
                  if (!ui.breakTracks.some((t) => t.id === track.id))
                    ui.addBreakTrack(track);
                  ui.setSelectedBreakTrackId(track.id);
                } else {
                  if (!ui.workTracks.some((t) => t.id === track.id))
                    ui.addWorkTrack(track);
                  ui.setSelectedWorkTrackId(track.id);
                }
              }}
            >
              {(i ? ui.selectedBreakTrackId : ui.selectedWorkTrackId) ===
              track.id
                ? "✓ Für den Timer ausgewählt"
                : "Im Fokus-Timer verwenden"}
            </button>
          </section>
        ))}
      </div>
      <div className="w-app-grid">
        {[
          ["water", "Blauer Atemraum", "◌"],
          ["aurora", "Polarlicht", "✧"],
          ["rain", "Waldregen", "♧"],
        ].map(([key, label, icon]) => (
          <button
            className="w-card s-media-card text-left"
            key={key}
            onClick={() => setScene(key)}
          >
            <div className={`s-clip ${key}`}>
              <span>{icon}</span>
            </div>
            <h3>{label}</h3>
            <p className="w-muted">
              Animierter Ruheclip · ohne externe Verbindung
            </p>
          </button>
        ))}
      </div>
      <div className="w-app-grid">
        {s.clips.map((c) => (
          <section className="w-card" key={c.id}>
            <span className="w-eyebrow">
              {c.mode === "work" ? "ARBEITEN" : "PAUSE"} · YOUTUBE
            </span>
            <h3 className="my-3">{c.title}</h3>
            <div className="s-actions">
              <button className="w-btn" onClick={() => setActive(c)}>
                ▶ Video laden
              </button>
              <a
                className="w-icon"
                aria-label={`${c.title} auf YouTube öffnen`}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} />
              </a>
              <button
                className="w-icon"
                aria-label={`${c.title} entfernen`}
                onClick={() => s.set(s.clips.filter((x) => x.id !== c.id))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </section>
        ))}
      </div>
      <p className="w-muted">
        YouTube wird erst nach „Video laden“ kontaktiert. Falls ein Clip extern
        nicht eingebettet werden darf, öffne ihn direkt auf YouTube.
      </p>
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title}
        size="xl"
      >
        {active && (
          <iframe
            className="s-video-frame"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId(active.url)}?autoplay=1`}
            title={active.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </Modal>
      <Modal
        open={!!scene}
        onClose={() => setScene(null)}
        title="Ein Moment für dich"
        size="xl"
      >
        <div className={`s-clip ${scene}`} style={{ height: "55vh" }}>
          <span>Atme in deinem eigenen Rhythmus.</span>
        </div>
      </Modal>
      <Modal
        open={add}
        onClose={() => setAdd(false)}
        title="YouTube-Video hinzufügen"
      >
        <form
          className="s-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              url = String(f.get("url"));
            if (!youtubeId(url)) {
              setError("Bitte einen gültigen YouTube-Video-Link eingeben.");
              return;
            }
            s.set([
              ...s.clips,
              {
                id: crypto.randomUUID(),
                title: String(f.get("title")).trim(),
                url: `https://www.youtube.com/watch?v=${youtubeId(url)}`,
                mode: String(f.get("mode")) as "work" | "break",
              },
            ]);
            setAdd(false);
            setError("");
          }}
        >
          <label>
            Titel
            <input className="w-input" name="title" required />
          </label>
          <label>
            YouTube-Link
            <input className="w-input" name="url" required type="url" />
          </label>
          <label>
            Verwendung
            <select className="w-input" name="mode">
              <option value="work">Arbeiten</option>
              <option value="break">Pause</option>
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="w-btn w-btn-primary">Speichern</button>
        </form>
      </Modal>
    </div>
  );
}
