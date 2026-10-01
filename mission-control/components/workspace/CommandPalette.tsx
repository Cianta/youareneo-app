"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { actions, destinations } from "@/lib/workspace/navigation";
import {
  rankItems,
  moveSelection,
  recentIds,
  type SearchItem,
} from "@/lib/workspace/search";
import { Dialog } from "./Dialog";
import { LoadingState } from "./States";
export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState(""),
    [remote, setRemote] = useState<SearchItem[]>([]),
    [recent, setRecent] = useState<string[]>([]),
    [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    setRemote([]);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const r = await fetch("/api/search?q=" + encodeURIComponent(q), {
            signal: controller.signal,
            cache: "no-store",
          });
          const data = await r.json();
          if (!r.ok)
            throw Error(
              r.status === 401
                ? "Melde dich an, um deine Inhalte zu durchsuchen."
                : "Deine Inhalte konnten nicht geladen werden.",
            );
          if (controller.signal.aborted) return;
          setRemote(data.items);
          setOwner(data.userId);
          try {
            setRecent(
              recentIds(
                localStorage.getItem(`neo-command-recent:${data.userId}`),
              ),
            );
          } catch {
            setRecent([]);
          }
        } catch (e) {
          if (!controller.signal.aborted)
            setError(
              e instanceof Error ? e.message : "Bitte versuche es erneut.",
            );
        } finally {
          if (!controller.signal.aborted) setBusy(false);
        }
      })();
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, retry]);
  // Server full-text results already match German word stems; do not filter them again.
  const local = rankItems([...actions, ...destinations], q, recent);
  const items = [...local, ...remote].sort((a, b) => {
    const rank = (id: string) => {
      const i = recent.indexOf(id);
      return i < 0 ? 10000 : i;
    };
    const group = (item: SearchItem) =>
      item.group === "Aktionen"
        ? 0
        : item.group === "Arbeiten"
          ? 1
          : item.group.startsWith("Eigene")
            ? 2
            : item.group === "Labor"
              ? 4
              : 3;
    return rank(a.id) - rank(b.id) || (!q.trim() ? group(a) - group(b) : 0);
  });
  const selected = Math.min(index, Math.max(0, items.length - 1));
  useEffect(() => {
    setIndex(0);
  }, [q]);
  useEffect(() => {
    document
      .getElementById(`command-${selected}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  function choose(item: SearchItem) {
    if (owner) {
      try {
        localStorage.setItem(
          `neo-command-recent:${owner}`,
          JSON.stringify(
            [item.id, ...recent.filter((id) => id !== item.id)].slice(0, 12),
          ),
        );
      } catch {}
    }
    onClose();
    router.push(item.href);
  }
  return (
    <Dialog title="Suchen & öffnen" onClose={onClose}>
      <label className="sr-only" htmlFor="command-query">
        Seiten, Aktionen und eigene Inhalte suchen
      </label>
      <input
        ref={input}
        id="command-query"
        role="combobox"
        aria-expanded="true"
        aria-controls="command-results"
        aria-autocomplete="list"
        aria-activedescendant={items.length ? `command-${selected}` : undefined}
        autoComplete="off"
        placeholder="Was möchtest du tun oder finden?"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            setIndex(moveSelection(selected, e.key, items.length));
          }
          if (e.key === "Enter" && items[selected]) {
            e.preventDefault();
            choose(items[selected]);
          }
        }}
      />
      <p className="workspace-muted">
        ↑ ↓ auswählen · Enter öffnen · Esc schließen · zuletzt verwendet zuerst
      </p>
      {busy && <LoadingState label="Eigene Inhalte werden gesucht …" />}
      {error && (
        <div role="alert" className="workspace-notice">
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>
            Erneut versuchen
          </button>
        </div>
      )}
      <p role="status" className="sr-only">
        {items.length} Treffer
      </p>
      <ul
        id="command-results"
        role="listbox"
        aria-label="Suchergebnisse"
        className="command-results"
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            id={`command-${i}`}
            role="option"
            aria-selected={i === selected}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(item)}
            className={i === selected ? "selected" : ""}
          >
            <span>{item.label}</span>
            <small>{item.group}</small>
          </li>
        ))}
      </ul>
      {!busy && !items.length && (
        <p role="status">
          Keine Treffer. Probiere einen anderen Begriff oder „Neue Notiz“.
        </p>
      )}
      <p className="workspace-muted">
        Eigene Inhalte aus deinem Konto. Lokale Boards und gemeinsame
        Altbestände werden hier nicht durchsucht.
      </p>
    </Dialog>
  );
}
