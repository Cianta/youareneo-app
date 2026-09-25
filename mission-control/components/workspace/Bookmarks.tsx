"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Minus, Bookmark } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { usePersonal, safeLink } from "@/lib/workspace/personal";
export function Bookmarks() {
  const s = usePersonal(),
    path = usePathname();
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  return (
    <details
      className="w-bookmarks"
      open={s.navOpen.bookmarks ?? false}
      onToggle={(e) => {
        const open = e.currentTarget.open;
        if (open !== (s.navOpen.bookmarks ?? false))
          s.set({ navOpen: { ...s.navOpen, bookmarks: open } });
      }}
    >
      <summary className="w-nav-caption">FOKUS · LESEZEICHEN</summary>
      <div className="w-bookmark-items">
        {s.bookmarks.map((b) => (
          <div className="w-bookmark-row" key={b.id}>
            <a
              className="w-nav-link"
              href={b.href}
              {...(b.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span>{b.icon || "↗"}</span>
              {b.label}
            </a>
            <button
              className="w-icon"
              aria-label={`${b.label} entfernen`}
              onClick={() =>
                s.set({ bookmarks: s.bookmarks.filter((x) => x.id !== b.id) })
              }
            >
              <Minus size={13} />
            </button>
          </div>
        ))}
        <button className="w-nav-link" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Lesezeichen hinzufügen
        </button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Dein direkter Weg"
      >
        <form
          className="s-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              href = safeLink(String(f.get("href")));
            if (!href) {
              setError(
                "Bitte einen Trinity-Pfad oder vollständigen Weblink eingeben.",
              );
              return;
            }
            s.set({
              bookmarks: [
                ...s.bookmarks,
                {
                  id: crypto.randomUUID(),
                  label: String(f.get("label")).trim(),
                  href,
                  icon: String(f.get("icon")) || "↗",
                  category: "Fokus",
                },
              ],
            });
            setError("");
            setOpen(false);
          }}
        >
          <label>
            Name
            <input className="w-input" name="label" required maxLength={60} />
          </label>
          <label>
            Seite oder Weblink
            <input
              className="w-input"
              name="href"
              defaultValue={path}
              required
            />
          </label>
          <label>
            Symbol
            <input
              className="w-input"
              name="icon"
              defaultValue="✦"
              maxLength={8}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="w-btn w-btn-primary">
            <Bookmark size={16} />
            Speichern
          </button>
        </form>
      </Modal>
    </details>
  );
}
