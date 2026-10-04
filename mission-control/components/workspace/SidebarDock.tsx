import Link from "next/link";
import { ContactRound, Grid2X2, HelpCircle, Mail, Phone, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { primary } from "@/lib/workspace/navigation";
import "./sidebar-dock.css";

const icons: Record<string, typeof Mail> = { inbox: Mail, meeting: Video, contacts: ContactRound, phone: Phone };

export function SidebarDock({ path, unread, collapsed, onToggle }: {
  path: string;
  unread: { count: number; label: string };
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="sidebar-dock">
      <nav className="sidebar-communication" aria-label="Kommunikation">
        {primary.filter(p => p.group === "Kommunikation").map(p => {
          const Icon = icons[p.id];
          const notice = p.id === "inbox" && unread.count > 0;
          return (
            <Link key={p.id} prefetch={false} href={p.href} data-nav-id={p.id}
              aria-label={p.label} title={notice ? `${p.label} · ${unread.label}` : p.label}
              aria-current={path === p.href ? "page" : undefined} data-attention={notice}>
              <Icon aria-hidden="true" />
              <span className="sidebar-dock-label">{p.id === "contacts" ? "Kontakte" : p.label}</span>
              {notice && <span className="nav-attention" aria-label={unread.label}>{unread.count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-dock-bottom">
        <Link className="sidebar-apps" prefetch={false} href="/dashboard/apps" data-nav-id="my-apps"
          aria-label="Meine Apps" title="Meine Apps" aria-current={path.startsWith("/dashboard/apps") ? "page" : undefined}>
          <Grid2X2 aria-hidden="true" /><span>Meine Apps</span>
        </Link>
        <button className="sidebar-help" aria-label="Hilfe & Tastenkürzel" title="Hilfe & Tastenkürzel"
          onClick={() => window.dispatchEvent(new Event("neo-open-help"))}>
          <HelpCircle aria-hidden="true" />
        </button>
        <button className="sidebar-collapse" aria-label={collapsed ? "Menü ausklappen" : "Menü einklappen"}
          title={collapsed ? "Menü ausklappen" : "Menü einklappen"}
          aria-expanded={!collapsed} aria-controls="workspace-navigation" onClick={onToggle}>
          {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
