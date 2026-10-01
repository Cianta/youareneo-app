"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { primary } from "@/lib/workspace/navigation";
import type { WorkspaceIdentity } from "@/lib/workspace/session";
import {
  useAuthStore,
  useUIExtStore,
  useGlobalAudioStore,
  useFocusStore,
  useNotebookStore,
  useAgentStore,
} from "@/lib/store";
import { useBrand } from "@/components/voice/BrandProvider";
import { Dialog } from "./Dialog";
import { FocusRuntime } from "./FocusRuntime";
import { ErrorState, LoadingState } from "./States";
const Notebook = dynamic(
  () =>
    import("@/components/layout/NotebookPanel").then((m) => m.NotebookPanel),
  { loading: () => <LoadingState />, ssr: false },
);
const Audio = dynamic(
  () =>
    import("@/components/layout/GlobalAudioPlayer").then(
      (m) => m.GlobalAudioPlayer,
    ),
  { ssr: false },
);
const Completion = dynamic(
  () =>
    import("@/components/layout/CompletionDialog").then(
      (m) => m.CompletionDialog,
    ),
  { ssr: false },
);
export function WorkspaceShell({
  identity,
  children,
}: {
  identity: WorkspaceIdentity | null;
  children: React.ReactNode;
}) {
  const { appName } = useBrand();
  const path = usePathname();
  const [notebook, setNotebook] = useState(false),
    [error, setError] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const [notebookMounted, setNotebookMounted] = useState(false);
  const running = useFocusStore((s) => s.pomodoroRunning);
  const playing = useGlobalAudioStore((s) => s.activeMode !== "off");
  const completion = useUIExtStore((s) => s.completionDialog);
  useEffect(() => {
    if (identity)
      setUser({ name: identity.name, role: "NEO Mitglied", avatar: "🔮" });
  }, [identity, setUser]);
  useEffect(() => {
    if (identity) return;
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated)
          setUser({
            name: d.displayName || "Mitglied",
            role: "Mitglied",
            avatar: "🔮",
          });
        else window.location.assign("/login");
      })
      .catch(() => setError("Die Anmeldung konnte nicht geprüft werden."));
  }, [identity, setUser]);
  useEffect(() => {
    if (!path.startsWith("/dashboard/agents") && path !== "/dashboard/eden")
      return;
    const abort = new AbortController();
    void fetch("/api/agents", { signal: abort.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const d = await r.json();
        if (!abort.signal.aborted)
          useAgentStore.getState().setAgents(d.data || []);
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setError(
            "Die Agenten konnten nicht geladen werden. Lade die Seite bitte erneut.",
          );
      });
    return () => abort.abort();
  }, [path]);
  async function logout() {
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw Error();
      window.location.assign("/login");
    } catch {
      setError("Abmelden ist gerade nicht möglich. Bitte erneut versuchen.");
    }
  }
  return (
    <div className="workspace-shell">
      <a className="workspace-skip" href="#workspace-content">
        Zum Inhalt
      </a>
      <aside className="workspace-sidebar">
        <Link href="/dashboard" className="workspace-brand">
          {appName}
        </Link>
        <p className="workspace-muted">Dein Arbeitsraum</p>
        <nav aria-label="Hauptnavigation">
          {primary.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              aria-current={path === p.href ? "page" : undefined}
            >
              {p.label}
            </Link>
          ))}
          <a
            href="https://archiv.youareneo.com"
            target="_blank"
            rel="noreferrer"
          >
            Archiv der Lebenskünste ↗
          </a>
        </nav>
        <button
          className="workspace-button"
          onClick={() => window.dispatchEvent(new Event("neo-open-help"))}
        >
          Hilfe & Tastenkürzel
        </button>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <Link href="/dashboard" className="workspace-mobile-brand">
            {appName}
          </Link>
          <button
            className="workspace-search-trigger"
            onClick={() => window.dispatchEvent(new Event("neo-open-search"))}
          >
            Suchen & öffnen <kbd>⌘K / Ctrl+K</kbd>
          </button>
          <button
            aria-label="Tagesnotizbuch öffnen"
            title="Tagesnotizbuch"
            onClick={() => {
              useNotebookStore.getState().setOpen(true);
              setNotebookMounted(true);
              setNotebook(true);
            }}
          >
            Notizbuch
          </button>
          <button onClick={() => void logout()}>Abmelden</button>
        </header>
        <main
          id="workspace-content"
          tabIndex={-1}
          className="workspace-content"
        >
          {error ? (
            <ErrorState
              message={error}
              retry={() => window.location.reload()}
            />
          ) : (
            children
          )}
        </main>
      </div>
      {notebookMounted && (
        <Dialog
          open={notebook}
          title="Tagesnotizbuch · auf diesem Gerät"
          onClose={() => setNotebook(false)}
        >
          <Notebook />
        </Dialog>
      )}
      <FocusRuntime />
      {(playing || running) && <Audio />}
      {completion && <Completion />}
    </div>
  );
}
