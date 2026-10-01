export type Destination = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords?: string;
};
export const primary: Destination[] = [
  { id: "home", label: "Übersicht", href: "/dashboard", group: "Arbeiten" },
  {
    id: "notes",
    label: "Notizen",
    href: "/notiz",
    group: "Arbeiten",
    keywords: "sprache mikrofon aufnehmen gedanken hermes",
  },
  {
    id: "tasks",
    label: "Aufgaben",
    href: "/dashboard/vision/tasks",
    group: "Arbeiten",
    keywords: "kanban trello",
  },
  {
    id: "projects",
    label: "Projekte",
    href: "/dashboard/projekte",
    group: "Arbeiten",
  },
  { id: "brain", label: "Gehirn", href: "/gehirn", group: "Arbeiten", keywords: "wissen graph second brain verbindungen" },
  {
    id: "notebooks",
    label: "Notebooks & Ziele",
    href: "/dashboard/kanban",
    group: "Arbeiten",
    keywords: "journal tagebuch fokus",
  },
  {
    id: "lab",
    label: "Labor",
    href: "/dashboard/labor",
    group: "Entdecken",
    keywords: "tools integrationen",
  },
  {
    id: "settings",
    label: "Einstellungen",
    href: "/dashboard/settings",
    group: "Verwalten",
  },
];
export const mobileTabs = [
  primary[0],
  primary[1],
  primary[2],
  { id: "more", label: "Mehr", href: "/dashboard/labor", group: "Entdecken" },
];

// Existing tools retain their routes and data; experiments live behind Labor.
export const laboratory: Destination[] = [
  {
    id: "legacy-overview",
    label: "Bisherige Gesamtübersicht",
    href: "/dashboard/labor/uebersicht",
    group: "Labor",
  },
  {
    id: "lab-eden",
    label: "Eden Canvas",
    href: "/dashboard/eden",
    group: "Labor",
  },
  {
    id: "lab-vision-hero",
    label: "Self",
    href: "/dashboard/vision/hero",
    group: "Labor",
  },
  {
    id: "lab-vision-verein",
    label: "Verein/Company",
    href: "/dashboard/vision/verein",
    group: "Labor",
  },
  {
    id: "lab-ninjas",
    label: "Team/Ninjas, Personenprofile und Astro-Berechnung",
    href: "/dashboard/ninjas",
    group: "Labor",
  },
  {
    id: "lab-agents-agent-overview",
    label: "Digital Staff",
    href: "/dashboard/agents/agent-overview",
    group: "Labor",
  },
  {
    id: "lab-data",
    label: "Data Hub",
    href: "/dashboard/data",
    group: "Labor",
  },
  {
    id: "lab-data-cloud-drives",
    label: "Cloud Drives",
    href: "/dashboard/data/cloud-drives",
    group: "Labor",
  },
  {
    id: "lab-universe",
    label: "Universe",
    href: "/dashboard/universe",
    group: "Labor",
  },
  {
    id: "lab-matrix",
    label: "Matrix",
    href: "/dashboard/matrix",
    group: "Labor",
  },
  {
    id: "lab-matrix-space-weather",
    label: "Space Weather",
    href: "/dashboard/matrix/space-weather",
    group: "Labor",
  },
  {
    id: "lab-matrix-morphreader",
    label: "Morphreader (Demo)",
    href: "/dashboard/matrix/morphreader",
    group: "Labor",
  },
  {
    id: "lab-matrix-n8n",
    label: "n8n-Einstieg",
    href: "/dashboard/matrix/n8n",
    group: "Labor",
  },
  {
    id: "lab-meditation",
    label: "Meditation",
    href: "/dashboard/meditation",
    group: "Labor",
  },
  {
    id: "lab-updates",
    label: "Benachrichtigungen/Updates",
    href: "/dashboard/updates",
    group: "Labor",
  },
  {
    id: "lab-communication-email",
    label: "Universal Inbox / E-Mail",
    href: "/dashboard/communication/email",
    group: "Labor",
  },
  {
    id: "lab-communication-kchat",
    label: "kChat",
    href: "/dashboard/communication/kchat",
    group: "Labor",
  },
  {
    id: "lab-communication-telegram",
    label: "Telegram",
    href: "/dashboard/communication/telegram",
    group: "Labor",
  },
  {
    id: "lab-communication-whatsapp",
    label: "WhatsApp",
    href: "/dashboard/communication/whatsapp",
    group: "Labor",
  },
  {
    id: "lab-communication-data-transfer",
    label: "Dateitransfer",
    href: "/dashboard/communication/data-transfer",
    group: "Labor",
  },
  {
    id: "lab-mitglieder-ghl",
    label: "GoHighLevel",
    href: "/dashboard/mitglieder/ghl",
    group: "Labor",
  },
  {
    id: "lab-mitglieder-lunacal",
    label: "Lunacal",
    href: "/dashboard/mitglieder/lunacal",
    group: "Labor",
  },
  {
    id: "lab-mitglieder-riverside",
    label: "Riverside",
    href: "/dashboard/mitglieder/riverside",
    group: "Labor",
  },
  {
    id: "lab-mitglieder-kmeet",
    label: "kMeet",
    href: "/dashboard/mitglieder/kmeet",
    group: "Labor",
  },
  {
    id: "lab-mitglieder-gobrunch",
    label: "GoBrunch",
    href: "/dashboard/mitglieder/gobrunch",
    group: "Labor",
  },
  {
    id: "lab-world-arche",
    label: "Arche/Memberspot",
    href: "/dashboard/world/arche",
    group: "Labor",
  },
  {
    id: "lab-seo-apollo",
    label: "Apollo",
    href: "/dashboard/seo/apollo",
    group: "Labor",
  },
  {
    id: "lab-social-postiz",
    label: "Postiz",
    href: "/dashboard/social/postiz",
    group: "Labor",
  },
  {
    id: "lab-media-video-gemma",
    label: "Gemma",
    href: "/dashboard/media/video/gemma",
    group: "Labor",
  },
  {
    id: "lab-kanban-opennotebook",
    label: "Open Notebook",
    href: "/dashboard/kanban/opennotebook",
    group: "Labor",
  },
  {
    id: "lab-media-audio",
    label: "Audio",
    href: "/dashboard/media/audio",
    group: "Labor",
  },
  {
    id: "lab-media-audio-elevenlabs",
    label: "ElevenLabs",
    href: "/dashboard/media/audio/elevenlabs",
    group: "Labor",
  },
  {
    id: "lab-media-audio-flowmusic",
    label: "Flow Music",
    href: "/dashboard/media/audio/flowmusic",
    group: "Labor",
  },
  {
    id: "lab-media-audio-stitch",
    label: "Stitch",
    href: "/dashboard/media/audio/stitch",
    group: "Labor",
  },
  {
    id: "lab-media-audio-unmixr",
    label: "Unmixr",
    href: "/dashboard/media/audio/unmixr",
    group: "Labor",
  },
  {
    id: "lab-media-boards",
    label: "Boards",
    href: "/dashboard/media/boards",
    group: "Labor",
  },
  {
    id: "lab-media-design",
    label: "Design",
    href: "/dashboard/media/design",
    group: "Labor",
  },
  {
    id: "lab-media-design-googledocs",
    label: "Google Docs / Design",
    href: "/dashboard/media/design/googledocs",
    group: "Labor",
  },
  {
    id: "lab-media-documents",
    label: "Documents",
    href: "/dashboard/media/documents",
    group: "Labor",
  },
  {
    id: "lab-media-gemini",
    label: "Gemini",
    href: "/dashboard/media/gemini",
    group: "Labor",
  },
  {
    id: "lab-media-higgsfield",
    label: "Higgsfield",
    href: "/dashboard/media/higgsfield",
    group: "Labor",
  },
  {
    id: "lab-media-magicfit",
    label: "Magicfit",
    href: "/dashboard/media/magicfit",
    group: "Labor",
  },
  {
    id: "lab-media-video",
    label: "Video",
    href: "/dashboard/media/video",
    group: "Labor",
  },
  {
    id: "lab-media-video-antigravity",
    label: "Antigravity",
    href: "/dashboard/media/video/antigravity",
    group: "Labor",
  },
  {
    id: "lab-media-video-gai-studio",
    label: "Google AI Studio",
    href: "/dashboard/media/video/gai-studio",
    group: "Labor",
  },
  {
    id: "lab-media-video-immich",
    label: "Immich",
    href: "/dashboard/media/video/immich",
    group: "Labor",
  },
  {
    id: "lab-media-video-motionvid",
    label: "Motionvid",
    href: "/dashboard/media/video/motionvid",
    group: "Labor",
  },
  {
    id: "lab-world-gamma",
    label: "Gamma",
    href: "/dashboard/world/gamma",
    group: "Labor",
  },
  {
    id: "lab-world-miro",
    label: "Miro",
    href: "/dashboard/world/miro",
    group: "Labor",
  },
  {
    id: "lab-world-padlet",
    label: "Padlet",
    href: "/dashboard/world/padlet",
    group: "Labor",
  },
  {
    id: "lab-world-presenti",
    label: "Presenti",
    href: "/dashboard/world/presenti",
    group: "Labor",
  },
  {
    id: "lab-world-wakelet",
    label: "Wakelet",
    href: "/dashboard/world/wakelet",
    group: "Labor",
  },
  {
    id: "lab-social-marketing",
    label: "Marketing",
    href: "/dashboard/social/marketing",
    group: "Labor",
  },
  {
    id: "lab-social-strategie",
    label: "Strategie und Tool-Sammlung",
    href: "/dashboard/social/strategie",
    group: "Labor",
  },
  {
    id: "lab-social-channels",
    label: "Channels Hub",
    href: "/dashboard/social/channels",
    group: "Labor",
  },
  {
    id: "lab-seo",
    label: "SEO",
    href: "/dashboard/seo",
    group: "Labor",
  },
  {
    id: "lab-shopify",
    label: "Shopify",
    href: "/dashboard/shopify",
    group: "Labor",
  },
];

export const destinations = [...primary, ...laboratory];
export const actions: Destination[] = [
  {
    id: "new-note",
    label: "Neue Notiz",
    href: "/notiz?new=1",
    group: "Aktionen",
  },
  {
    id: "record",
    label: "Sprachnotiz aufnehmen",
    href: "/notiz?rec=1",
    group: "Aktionen",
  },
  {
    id: "new-project",
    label: "Projekt anlegen",
    href: "/dashboard/projekte?new=1",
    group: "Aktionen",
  },
];
