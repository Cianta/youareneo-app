"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Columns3,
  CalendarDays,
  Orbit,
  Users,
  Grid2X2,
  Settings2,
  Search,
  BookOpen,
  Menu,
  X,
  Sparkles,
  ArrowUpRight,
  LogOut,
  Leaf,
  Compass,
} from "lucide-react";
import {
  useAuthStore,
  useNotebookStore,
  useFloatingAgentStore,
  useFocusStore,
} from "@/lib/store";
import { FocusAudio, FocusEngine, FocusSpace } from "./FocusSpace";
import { formatCountdown } from "@/lib/workspace/time";
import { Appearance } from "./Appearance";
import { Modal } from "@/components/ui/Modal";
import { TrinityLogo } from "@/components/sacred-geometry/TrinityLogo";
import { CosmosMenu } from "./CosmosMenu";
import { Bookmarks } from "./Bookmarks";
import { usePersonal } from "@/lib/workspace/personal";
export const workspaceLinks = [
  { href: "/dashboard", label: "Mein Tag", icon: Home, hint: "Dein Überblick" },
  {
    href: "/dashboard/vision/tasks",
    label: "Aufgaben & Projekte",
    icon: Columns3,
    hint: "Ideen in Bewegung",
  },
  {
    href: "/dashboard/calendar",
    label: "Kalender & Liveplan",
    icon: CalendarDays,
    hint: "Zeit bewusst gestalten",
  },
  {
    href: "/dashboard/eden",
    label: "Ideenraum",
    icon: Orbit,
    hint: "Freiraum zum Denken",
  },
  {
    href: "/dashboard/ninjas",
    label: "Mein Team",
    icon: Users,
    hint: "Gemeinsam wachsen",
  },
  {
    href: "/dashboard/apps",
    label: "Meine Apps",
    icon: Grid2X2,
    hint: "Deine Arbeitswelt",
  },
  {
    href: "/dashboard/meditation",
    label: "Meditation & Musik",
    icon: Leaf,
    hint: "Kraft schöpfen",
  },
  {
    href: "/dashboard/tools",
    label: "Alle Bereiche",
    icon: Compass,
    hint: "Den ganzen Kosmos entdecken",
  },
  { href: "/dashboard/soul", label: "Mein Geburtsprofil", icon: Orbit, hint: "Identität & Seele" },
  { href: "/dashboard/goals", label: "Ziele & Warum", icon: Compass, hint: "Was dir wirklich wichtig ist" },
  { href: "/dashboard/second-brain", label: "Second Brain", icon: Orbit, hint: "Dein vernetztes Wissen" },
  {
    href: "/dashboard/settings",
    label: "Einstellungen",
    icon: Settings2,
    hint: "Dein persönlicher Raum",
  },
];
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const personal = usePersonal();
  const motion = personal.motion;
  useEffect(()=>{document.documentElement.dataset.motion=motion?"on":"off";},[motion]);
  const path = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const user = useAuthStore((s) => s.user);
  const focus = useFocusStore();
  const label =
    workspaceLinks.find((l) => l.href === path)?.label ?? "Dein Arbeitsraum";
  useEffect(() => {
    setMobile(false);
    setSearch(false);
  }, [path]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const signOut = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      useAuthStore.getState().logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Abmelden fehlgeschlagen. Bitte erneut versuchen.");
    }
  };
  return (
    <div className="workspace-shell">
      <a className="w-skip" href="#workspace-content">
        Zum Inhalt springen
      </a>
      {mobile && (
        <button
          className="w-mobile-backdrop"
          aria-label="Menü schließen"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`w-sidebar ${mobile ? "is-open" : ""}`}
        aria-label="Hauptnavigation"
      >
        <Link className="w-brand" href="/dashboard">
          <TrinityLogo size={48} />
          <div>
            trinity<span>BY YOU ARE NEO</span>
          </div>

        </Link>
        <div className="w-workspace-pill">
          <span className="w-workspace-symbol">N</span>
          <div>
            Mein Workspace<small>Raum für deine Möglichkeiten</small>
          </div>
        </div>
        <CosmosMenu />
        <details className="w-nav-group" open={personal.navOpen.work??true} onToggle={e=>{const open=e.currentTarget.open;if(open!==(personal.navOpen.work??true))personal.set({navOpen:{...personal.navOpen,work:open}});}}><summary className="w-nav-caption">DEIN ARBEITSRAUM</summary>
        <nav>
          {workspaceLinks.slice(0, 6).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={`w-nav-link ${path === href ? "active" : ""}`}
            >
              <Icon size={18} />
              {label}
              {path === href && <span className="w-active-dot" />}
            </Link>
          ))}
        </nav>
        </details><div className="w-nav-divider" />
        <details className="w-nav-group" open={personal.navOpen.more??true} onToggle={e=>{const open=e.currentTarget.open;if(open!==(personal.navOpen.more??true))personal.set({navOpen:{...personal.navOpen,more:open}});}}><summary className="w-nav-caption">RAUM FÜR MEHR</summary>
        <nav>
          {workspaceLinks.slice(6, 8).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={`w-nav-link ${path === href ? "active" : ""}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <button
            className="w-nav-link"
            onClick={() => useNotebookStore.getState().toggle()}
          >
            <BookOpen size={18} />
            Mein Notizbuch
          </button>
        </nav>
        </details><div className="w-nav-divider"/><details className="w-nav-group" open={personal.navOpen.soul??false} onToggle={e=>{const open=e.currentTarget.open;if(open!==(personal.navOpen.soul??false))personal.set({navOpen:{...personal.navOpen,soul:open}});}}><summary className="w-nav-caption">IDENTITÄT & SEELE</summary><nav>{workspaceLinks.slice(8,11).map(({href,label,icon:Icon})=><Link className={`w-nav-link ${path===href?"active":""}`} href={href} key={href}><Icon size={18}/>{label}</Link>)}</nav></details><Bookmarks />
        <div className="w-sidebar-bottom">
          <Link className="w-nav-link" href="/dashboard/settings">
            <Settings2 size={18} />
            Einstellungen
          </Link>
          <div className="w-account">
            <span className="w-avatar">
              {user?.name?.slice(0, 2).toUpperCase() || "DU"}
            </span>
            <div>
              <strong>{user?.name || "Dein Raum"}</strong>
              <small>FuseBase Konto</small>
            </div>
            <button
              aria-label="Abmelden"
              title="Abmelden"
              className="w-icon"
              onClick={signOut}
            >
              <LogOut size={16} />
            </button>
          </div>
          {logoutError && (
            <p role="alert" className="w-error">
              {logoutError}
            </p>
          )}
        </div>
      </aside>
      <div className="w-main-column">
        <header className="w-topbar">
          <div className="w-breadcrumb">
            <button
              className="w-icon w-mobile-menu"
              aria-label="Navigation öffnen"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={19} /> : <Menu size={19} />}
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{label}</strong>
          </div>
          <div className="w-top-actions">
            <Appearance />
            <button
              aria-label="Bereiche suchen"
              className="w-search-trigger"
              onClick={() => setSearch(true)}
            >
              <Search size={16} />
              <span>Suchen & entdecken</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className={`w-timer-pill ${focus.pomodoroRunning ? "running" : ""}`}
              onClick={() => useFocusStore.setState({ isOpen: true })}
            >
              <span />
              {formatCountdown(focus.pomodoroSeconds)}
              <small>Fokus</small>
            </button>
            <button
              aria-label="Trinity AI öffnen"
              className="w-ai-trigger"
              onClick={() => useFloatingAgentStore.getState().toggle()}
            >
              <Sparkles size={16} />
              <span>Trinity AI</span>
            </button>
          </div>
        </header>
        <main id="workspace-content" className="w-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <FocusEngine />
      <FocusSpace />
      <FocusAudio />
      <Modal
        open={search}
        onClose={() => setSearch(false)}
        title="Wohin möchtest du?"
      >
        <input
          className="w-input"
          autoFocus
          aria-label="Bereiche suchen"
          placeholder="Kalender, Aufgaben, Musik …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="w-command-results">
          {workspaceLinks
            .filter((l) =>
              `${l.label} ${l.hint}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map(({ href, label, hint, icon: Icon }) => (
              <Link href={href} key={href} onClick={() => setSearch(false)}>
                <Icon size={19} />
                <div>
                  {label}
                  <small>{hint}</small>
                </div>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          {!workspaceLinks.some((l) =>
            `${l.label} ${l.hint}`.toLowerCase().includes(query.toLowerCase()),
          ) && (
            <p className="w-muted">
              Kein Bereich gefunden. Probiere einen anderen Begriff.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
