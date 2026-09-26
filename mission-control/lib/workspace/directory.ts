import { SIDEBAR_NAV_LINKS } from "@/components/layout/Sidebar";
import type { Shortcut } from "./personal";
export const core: Shortcut[] = [
  ["today", "Mein Tag", "/dashboard", "☀", "Fokus"],
  ["tasks", "Aufgaben & Projekte", "/dashboard/vision/tasks", "▤", "Fokus"],
  ["calendar", "Kalender & Liveplan", "/dashboard/calendar", "▦", "Fokus"],
  ["ideas", "Ideenraum", "/dashboard/eden", "✧", "Fokus"],
  ["soul", "Mein Geburtsprofil", "/dashboard/soul", "☾", "Identität & Seele"],
  ["goals", "Chancenplaner", "/dashboard/goals", "◎", "Identität & Seele"],
  [
    "brain",
    "Second Brain",
    "/dashboard/second-brain",
    "⌘",
    "Identität & Seele",
  ],
  ["notes", "Mein Notizbuch", "/dashboard/kanban", "▱", "Identität & Seele"],
  ["team", "Mein Team", "/dashboard/ninjas", "♧", "Gemeinsam"],
  [
    "friends",
    "Digital Friends",
    "/dashboard/agents/agent-overview",
    "✦",
    "Gemeinsam",
  ],
  [
    "chat",
    "Team-Kommunikation",
    "/dashboard/communication/kchat",
    "◌",
    "Gemeinsam",
  ],
  ["apps", "Meine Apps", "/dashboard/apps", "▦", "Meine Welt"],
  ["music", "Meditation & Musik", "/dashboard/meditation", "♫", "Meine Welt"],
].map(([id, label, href, icon, category]) => ({
  id,
  label,
  href,
  icon,
  category,
}));

const groups: Record<string, string[]> = {
  "nav-ghl": [
    "CRM & Vertrieb",
    "Kommunikation",
    "Websites & Design",
    "Marketing & Automation",
  ],
  "nav-shopify": ["Commerce", "Websites & Design", "Marketing & Automation"],
  "nav-lunacal": ["Kalender & Termine"],
  "nav-riverside": ["Video & Audio", "Kommunikation"],
  "nav-kmeet": ["Kommunikation"],
  "nav-gobrunch": ["Kommunikation", "Lernen & Gemeinschaft"],
  "nav-email-core": ["Kommunikation"],
  "nav-kchat-hub": ["Kommunikation"],
  "nav-whatsapp": ["Kommunikation"],
  "nav-telegram": ["Kommunikation"],
  "nav-data-transfer": ["Dateien & Wissen"],
  "nav-boards": ["Websites & Design", "Dateien & Wissen"],
  "nav-media-video": ["Video & Audio", "Websites & Design"],
  "nav-media-audio": ["Video & Audio"],
  "nav-design": ["Websites & Design"],
  "nav-dokumente": ["Dateien & Wissen"],
  "nav-marketing": ["Marketing & Automation"],
  "nav-channels": ["Marketing & Automation"],
  "nav-strategie": ["Marketing & Automation"],
  "nav-arche": ["Lernen & Gemeinschaft"],
  "nav-verein": ["Lernen & Gemeinschaft"],
  "nav-updates": ["Einstellungen"],
  "nav-settings": ["Einstellungen"],
};
const old = SIDEBAR_NAV_LINKS.filter(
  (l) => !core.some((c) => c.href === l.href) && l.id !== "nav-hero",
).map((l) => ({
  ...l,
  icon: "↗",
  category:
    groups[l.id]?.[0] ??
    (l.category === "DATA" ? "Dateien & Wissen" : "Weitere Werkzeuge"),
}));
export const directoryLinks: Shortcut[] = [
  ...core,
  ...old,
  {
    id: "hubspot",
    label: "HubSpot",
    href: "/dashboard/contacts",
    icon: "◉",
    category: "CRM & Vertrieb",
  },
];
export function categoriesFor(
  link: Shortcut,
  overrides: Record<string, string[]>,
) {
  return overrides[link.id] ?? groups[link.id] ?? [link.category];
}
export function categoriesOf(
  links: Shortcut[],
  overrides: Record<string, string[]>,
) {
  return Array.from(new Set(links.flatMap((l) => categoriesFor(l, overrides))));
}
