"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {HeaderBookmarks,HeaderFocus,HeaderSettings} from "./HeaderTools";
import {Atmosphere} from "./Atmosphere";
import {useNavAttention} from "./NavAttention";
import {Home,NotebookPen,CheckSquare,FolderOpen,Network,BookOpen,Lightbulb,CalendarDays,Orbit,Leaf,Grid2X2,FlaskConical,Settings,Mail,Search,LogOut,LogIn,Notebook as NotebookIcon} from "lucide-react";
import {TrinityLogo} from "@/components/sacred-geometry/TrinityLogo";
import { primary } from "@/lib/workspace/navigation";
import type { WorkspaceIdentity } from "@/lib/workspace/session";
import {
  useAuthStore,
  useUIExtStore,
  useFocusStore,
  useNotebookStore,
  useAgentStore,
} from "@/lib/store";
import { useBrand } from "@/components/voice/BrandProvider";
import { Dialog } from "./Dialog";
import { FocusRuntime } from "./FocusRuntime";
import { ErrorState, LoadingState } from "./States";
const FocusSpace = dynamic(()=>import("./FocusSpace").then(m=>m.FocusSpace),{ssr:false});
const CosmosMenu=dynamic(()=>import("./CosmosMenu").then(m=>m.CosmosMenu),{ssr:false});
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
const navIcons:Record<string,typeof Home>={home:Home,notes:NotebookPen,tasks:CheckSquare,projects:FolderOpen,brain:Network,notebooks:BookOpen,ideas:Lightbulb,planner:CalendarDays,calendar:CalendarDays,soul:Orbit,meditation:Leaf,"my-apps":Grid2X2,lab:FlaskConical,settings:Settings,inbox:Mail};
export function WorkspaceShell({
  identity,
  children,
  allowGuest = false,
}: {
  identity: WorkspaceIdentity | null;
  children: React.ReactNode;
  allowGuest?: boolean;
}) {
  const { appName } = useBrand();
  const path = usePathname();
  const attention=useNavAttention();
  const [notebook, setNotebook] = useState(false),
    [error, setError] = useState("");
  const [agentError,setAgentError] = useState("");
  const [authenticated, setAuthenticated] = useState(!!identity);
  const setUser = useAuthStore((s) => s.setUser);
  const user=useAuthStore(s=>s.user);
  const [notebookMounted, setNotebookMounted] = useState(false);
  const focusOpen = useFocusStore(s=>s.isOpen);
  const completion = useUIExtStore((s) => s.completionDialog);
  useEffect(() => {
    if (identity)
      setUser({ name: identity.name, role: "NEO Mitglied", avatar: "🔮" });
  }, [identity, setUser]);
  useEffect(() => {
    if (identity) return;
    const abort = new AbortController();
    void fetch("/api/auth/me", {signal: abort.signal, cache: "no-store"})
      .then((r) => r.json())
      .then((d) => {
        if (abort.signal.aborted) return;
        setAuthenticated(!!d.authenticated);
        if (d.authenticated)
          setUser({
            name: d.displayName || "Mitglied",
            role: "Mitglied",
            avatar: "🔮",
          });
        else if (!allowGuest) window.location.assign("/login");
      })
      .catch(() => {if (!abort.signal.aborted) setError("Die Anmeldung konnte nicht geprüft werden.");});
    return () => abort.abort();
  }, [identity, setUser, allowGuest]);
  useEffect(() => {
    if (!path.startsWith("/dashboard/agents") && path !== "/dashboard/eden")
      return;
    setAgentError("");
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
          setAgentError(
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
          <TrinityLogo size={36}/><span>{appName}</span>
        </Link>
        <p className="workspace-user">{identity?.name||user?.name||"Dein Raum"}</p>
        <CosmosMenu/>
        <nav aria-label="Hauptnavigation">
          {["Mein Raum","Arbeiten","Entdecken","Apps"].map(group=>{const links=primary.filter(p=>p.group===group);const render=links.map(p=>{const Icon=navIcons[p.id]||FolderOpen;const notice=attention[p.id as keyof typeof attention];return <Link prefetch={false} key={p.id} href={p.href} data-attention={!!notice?.count} title={notice?.label} aria-current={path===p.href||(p.id==="my-apps"&&path.startsWith("/dashboard/apps/"))?"page":undefined}><Icon className="workspace-nav-icon" aria-hidden="true"/><span>{p.label}</span>{!!notice?.count&&<span className="nav-attention" aria-label={notice.label}>{notice.count}</span>}</Link>;});return group==="Entdecken"?<details className="workspace-discover" key={group}><summary>{group}<span>⌄</span></summary>{render}</details>:<div className="workspace-nav-section" key={group}>{group!=="Apps"&&<span className="workspace-nav-group">{group}</span>}{render}</div>;})}
        </nav>
        <button
          className="workspace-button"
          onClick={() => window.dispatchEvent(new Event("neo-open-help"))}
        >
          Hilfe & Tastenkürzel
        </button>
      </aside>
      <div className="workspace-body"><Atmosphere/>
        <header className="workspace-topbar">
          <Link href="/dashboard" className="workspace-mobile-brand">
            <TrinityLogo size={28}/><span>{appName}</span>
          </Link>
          <HeaderBookmarks/>
          <button
            className="workspace-search-trigger" aria-label="Suchen & öffnen"
            onClick={() => window.dispatchEvent(new Event("neo-open-search"))}
          >
            <Search size={16} className="header-search-icon"/><span className="header-search-label">Suchen & öffnen</span> <kbd>⌘K / Ctrl+K</kbd>
          </button>
          <span className="header-spacer"/><HeaderFocus/>
          <button
            aria-label="Tagesnotizbuch öffnen"
            title="Tagesnotizbuch"
            onClick={() => {
              useNotebookStore.getState().setOpen(true);
              setNotebookMounted(true);
              setNotebook(true);
            }}
          >
            <NotebookIcon size={16} className="header-notebook-icon"/><span className="header-notebook-label">Notizbuch</span>
          </button>
          <HeaderSettings/>
          {authenticated ? <button aria-label="Abmelden" title="Abmelden" onClick={() => void logout()}><LogOut size={16} className="header-logout-icon"/><span className="header-logout-label">Abmelden</span></button> : <Link href="/login" className="header-icon" aria-label="Anmelden" title="Anmelden"><LogIn size={16}/></Link>}
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
            <>{agentError && <p role="status" className="workspace-muted">{agentError} Deine Inhalte bleiben verfügbar.</p>}{children}</>
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
      <FocusRuntime />{focusOpen && <FocusSpace/>}
      <Audio />
      {completion && <Completion />}
    </div>
  );
}
