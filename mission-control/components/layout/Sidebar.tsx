'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark, ShieldCheck, ListTodo, UsersRound, Globe, ContactRound,
  Network, ClipboardList, Layers, Share2, Clapperboard, ShoppingCart,
  SlidersHorizontal, Bot, ChevronDown, ChevronLeft, ChevronRight,
  Activity, Video, Music, FileText, Folder, Inbox, Mail,
  HardDrive, Atom, GraduationCap, Dumbbell, Plus, X, Bell,
  Leaf, Tv2, EyeOff, Pin, PinOff, Wrench, LayoutGrid, Users, Pencil, Sparkles,
} from 'lucide-react';
import { TrinityOrb } from '@/components/sacred-geometry/TrinityLogo';
import { useAgentStore, useUIStore, usePinnedItemsStore, useNotificationStore, useUIExtStore } from '@/lib/store';
import { useT, useLocale } from '@/lib/i18n';
import { getMoonPhase, type MoonInfo } from '@/lib/moon';
import { createPortal } from 'react-dom';
import {
  getWesternZodiac, getNakshatra, upcomingPortalDays, isPortalDay,
  SEAL_MEANINGS, TONE_MEANINGS, CH_ELEMENT_MEANINGS, CH_ANIMAL_MEANINGS,
  ZODIAC_MEANINGS, MOON_PHASE_MEANINGS,
  type ZodiacInfo, type NakshatraInfo,
} from '@/lib/astroNow';

import { cn, STATUS_COLORS, AGENT_COLORS } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ── Type System ────────────────────────────────────────────────────────────────
type NavLeaf = { id: string; label: string; href: string; emoji?: string };
type NavSubGroup = { id: string; label: string; icon?: LucideIcon; items: NavLeaf[] };
type NavChild = NavLeaf | NavSubGroup;
function isSubGroup(c: NavChild): c is NavSubGroup { return 'items' in c; }
type NavItem = {
  id: string; label: string; icon: LucideIcon;
  href?: string; badge?: string; emoji?: string;
  children?: NavChild[];
  isAgentList?: boolean;
};

// ── Accordion Categories ─────────────────────────────────────────────────────
type AccordionCategory = {
  id: string; label: string;
  items: NavItem[];
  bottom?: boolean;
  defaultOpen?: boolean;
  /** Direkter Link — Kategorie ohne Dropdown, Klick öffnet die Seite */
  href?: string;
  /** + / Bearbeiten im Kategorie-Kopf (eigene Links verknüpfen, löschen, sortieren) */
  customizable?: boolean;
};

const ACCORDION_CATS: AccordionCategory[] = [
  // ── VISION & FOCUS ────────────────────────────────────────────────────────
  {
    id: 'vision-focus', label: 'FOKUS', defaultOpen: true,
    items: [
      { id: 'mission-control', label: 'Mission Control', icon: Network,    href: '/dashboard' },
      { id: 'eden-canvas',     label: 'Eden Canvas',     icon: LayoutGrid, href: '/dashboard/eden' },
      { id: 'tasks',           label: 'Tasks',           icon: ListTodo,   href: '/dashboard/vision/tasks' },
    ],
  },
  // ── IDENTITÄT ─────────────────────────────────────────────────────────────
  {
    id: 'identitaet', label: 'IDENTITÄT', defaultOpen: true,
    items: [
      { id: 'hero',      label: 'Hero',      icon: ShieldCheck,   href: '/dashboard/vision/hero' },
      { id: 'notebooks', label: 'Notebooks', icon: ClipboardList, href: '/dashboard/kanban' },
    ],
  },
  // ── ORGANISATION ─────────────────────────────────────────────────────────
  {
    id: 'organization', label: 'ORGANISATION', defaultOpen: false,
    items: [
      { id: 'verein', label: 'Verein', icon: Landmark, href: '/dashboard/vision/verein' },
      { id: 'ninjas', label: 'Team',   icon: UsersRound, href: '/dashboard/ninjas' },
      {
        id: 'digital-staff', label: 'Digital Staff', icon: Bot, href: '/dashboard/agents/agent-overview',
      },
    ],
  },
  // ── WORLD VISION — direkt unter Organisation ──────────────────────────────
  {
    id: 'world', label: 'WORLD VISION', defaultOpen: false, customizable: true,
    items: [
      { id: 'arche',   label: 'Arche · Die Kunst des Lebens', icon: GraduationCap, href: '/dashboard/world/arche' },
      { id: 'shopify', label: 'Shopify Hub',                  icon: ShoppingCart,  href: '/dashboard/shopify' },
      {
        id: 'social', label: 'Social Media', icon: Share2,
        children: [
          { id: 'marketing', label: 'Marketing',    href: '/dashboard/social/marketing' },
          { id: 'channels',  label: 'Channels Hub', href: '/dashboard/social/channels' },
          { id: 'strategie', label: 'Strategie',    href: '/dashboard/social/strategie' },
        ],
      },
    ],
  },
  // ── CONTACTS — eigener Oberpunkt ─────────────────────────────────────────
  {
    id: 'contacts-cat', label: 'CONTACTS', defaultOpen: false, customizable: true,
    items: [
      { id: 'ghl',       label: 'GHL CRM',           icon: ContactRound, href: '/dashboard/mitglieder/ghl' },
      { id: 'lunacal',   label: 'Lunacal Scheduler', icon: ContactRound, href: '/dashboard/mitglieder/lunacal' },
      { id: 'riverside', label: 'Riverside Studio',  icon: ContactRound, href: '/dashboard/mitglieder/riverside' },
      { id: 'kmeet',     label: 'kMeet',             icon: ContactRound, href: '/dashboard/mitglieder/kmeet' },
      { id: 'gobrunch',  label: 'GoBrunch',          icon: ContactRound, href: '/dashboard/mitglieder/gobrunch' },
    ],
  },
  // ── COMMUNICATION ─────────────────────────────────────────────────────────
  {
    id: 'communication', label: 'COMMUNICATION', defaultOpen: false, customizable: true,
    items: [
      {
        id: 'universal-inbox', label: 'Universal Inbox', icon: Inbox,
        children: [
          { id: 'email-core',    label: 'Gmail Native',              href: '/dashboard/communication/email' },
          { id: 'kchat-hub',     label: 'KChat Hub',                 href: '/dashboard/communication/kchat' },
          { id: 'whatsapp',      label: 'WhatsApp Business',         href: '/dashboard/communication/whatsapp' },
          { id: 'telegram',      label: 'Telegram Messenger',        href: '/dashboard/communication/telegram' },
          { id: 'data-transfer', label: 'SwissTransfer / WeTransfer', href: '/dashboard/communication/data-transfer' },
        ],
      },
    ],
  },
  // ── MEDIA STUDIO — flat launcher pages, users add their own tools ─────────
  {
    id: 'media-studio', label: 'MEDIA STUDIO', defaultOpen: false,
    items: [
      { id: 'boards',      label: 'Boards & Visuals', icon: Layers,       href: '/dashboard/media/boards' },
      { id: 'media-video', label: 'Video & Bilder',   icon: Video,        href: '/dashboard/media/video' },
      { id: 'media-audio', label: 'Audio',            icon: Music,        href: '/dashboard/media/audio' },
      { id: 'design',      label: 'Design',           icon: Clapperboard, href: '/dashboard/media/design' },
      { id: 'dokumente',   label: 'Dokumente',        icon: FileText,     href: '/dashboard/media/documents' },
    ],
  },
  // ── DATA ──────────────────────────────────────────────────────────────────
  {
    id: 'data', label: 'DATA', defaultOpen: false, href: '/dashboard/data',
    items: [],
  },
  // ── MATRIX ────────────────────────────────────────────────────────────────
  {
    id: 'matrix', label: 'MATRIX', defaultOpen: false, href: '/dashboard/matrix',
    items: [],
  },
  // ── MEDITATION ────────────────────────────────────────────────────────────
  {
    id: 'meditation-cat', label: 'MEDITATION', defaultOpen: false, href: '/dashboard/meditation',
    items: [],
  },
  // ── SYSTEM CONTROL (bottom-pinned) ────────────────────────────────────────
  {
    id: 'system-control', label: 'SYSTEM CONTROL', bottom: true, defaultOpen: false,
    items: [
      { id: 'updates',  label: 'Updates',  icon: Bell,              href: '/dashboard/updates' },
      { id: 'settings', label: 'Settings', icon: SlidersHorizontal, href: '/dashboard/settings' },
    ],
  },
];

// ── Flache Nav-Liste für das Tools-Dropdown im Header ──────────────────────────
// Wird aus ACCORDION_CATS abgeleitet — neue Menüpunkte erscheinen automatisch.
export type SidebarNavLink = { id: string; label: string; href: string; category: string };
export const SIDEBAR_NAV_LINKS: SidebarNavLink[] = ACCORDION_CATS.flatMap(cat => {
  const out: SidebarNavLink[] = [];
  if (cat.href) out.push({ id: `nav-${cat.id}`, label: cat.label, href: cat.href, category: cat.label });
  for (const item of cat.items) {
    if (item.href) out.push({ id: `nav-${item.id}`, label: item.label, href: item.href, category: cat.label });
    for (const child of item.children ?? []) {
      if (isSubGroup(child)) {
        for (const leaf of child.items) out.push({ id: `nav-${leaf.id}`, label: leaf.label, href: leaf.href, category: cat.label });
      } else {
        out.push({ id: `nav-${child.id}`, label: child.label, href: child.href, category: cat.label });
      }
    }
  }
  return out;
});

// ── Chinese Calendar Helpers ───────────────────────────────────────────────────
const STEM_ELEMENTS_DE  = ['Holz','Holz','Feuer','Feuer','Erde','Erde','Metall','Metall','Wasser','Wasser'];
const STEM_ELEMENTS_EN  = ['Wood','Wood','Fire','Fire','Earth','Earth','Metal','Metal','Water','Water'];
const BRANCH_ANIMALS_DE = ['Ratte','Ochse','Tiger','Hase','Drache','Schlange','Pferd','Ziege','Affe','Hahn','Hund','Schwein'];
const BRANCH_ANIMALS_EN = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const BRANCH_EMOJI      = ['🐀','🐂','🐯','🐰','🐉','🐍','🐴','🐑','🐒','🐓','🐕','🐷'];

function getChineseYear(year: number) {
  const stemIdx   = ((year - 1984) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  return {
    element_de: STEM_ELEMENTS_DE[stemIdx],
    element_en: STEM_ELEMENTS_EN[stemIdx],
    animal_de:  BRANCH_ANIMALS_DE[branchIdx],
    animal_en:  BRANCH_ANIMALS_EN[branchIdx],
    emoji:      BRANCH_EMOJI[branchIdx],
  };
}

function getChineseMonth(year: number, westernMonth: number) {
  const yearStemIdx = ((year - 1984) % 10 + 10) % 10;
  const START_STEMS = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
  const startStem   = START_STEMS[yearStemIdx];
  const chMonIdx  = ((westernMonth - 2) % 12 + 12) % 12;
  const stemIdx   = (startStem + chMonIdx) % 10;
  const branchIdx = (2 + chMonIdx) % 12;
  return { element_de: STEM_ELEMENTS_DE[stemIdx], animal_de: BRANCH_ANIMALS_DE[branchIdx], emoji: BRANCH_EMOJI[branchIdx] };
}

// Dreamspell / Argüelles tradition: origin = 1987-07-26 (Harmonic Convergence)
const MAYAN_SEALS  = ['Drache','Wind','Nacht','Samen','Schlange','Weltbrücke','Hand','Stern','Mond','Hund','Affe','Mensch','Wanderer','Zauberer','Adler','Krieger','Erde','Spiegel','Sturm','Sonne'];
const MAYAN_TONES  = ['Magnetisch','Lunar','Elektrisch','Selbst-existierend','Überton','Rhythmisch','Resonant','Galaktisch','Solar','Planetar','Spektral','Kristall','Kosmisch'];
const MAYAN_EMOJIS = ['🐉','💨','🌙','🌱','🐍','🌉','✋','⭐','🌊','🐕','🐒','👤','🚶','🧙','🦅','⚔️','🌍','🪞','⛈️','☀️'];
// Anchor: 1987-07-26 = Kin 34 (verified: 2013-07-26 = Kin 164 "Galactic Seed").
// Dreamspell skips Feb 29 — it carries the same Kin as Feb 28.
function getMayanKin(date: Date) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const origin = Date.UTC(1987, 6, 26);
  const target = Date.UTC(y, m - 1, d);
  let days = Math.round((target - origin) / 86_400_000);
  const isLeap = (yr: number) => (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
  for (let yr = 1988; yr <= y; yr++) {
    if (!isLeap(yr)) continue;
    const feb29 = Date.UTC(yr, 1, 29);
    if (feb29 > origin && feb29 <= target) days--;
  }
  const kin    = ((((days + 33) % 260) + 260) % 260) + 1;
  const tone   = ((kin - 1) % 13) + 1;
  const seal   = MAYAN_SEALS[(kin - 1) % 20];
  const emoji  = MAYAN_EMOJIS[(kin - 1) % 20];
  return { kin, tone, seal, emoji, label: `Kin ${kin} · ${MAYAN_TONES[tone-1]} ${seal}` };
}

// ── Sidebar Clock ──────────────────────────────────────────────────────────────
// ── Energie-Popup: alle aktuellen Energien als Element-Karten ─────────────────
const MAYA_COLOR = ['#f87171', '#e2e8f0', '#60a5fa', '#facc15']; // Rot/Weiß/Blau/Gelb
const CH_ELEMENT_COLOR: Record<string, string> = {
  'Holz': '#4ade80', 'Feuer': '#f87171', 'Erde': '#facc15', 'Metall': '#e2e8f0', 'Wasser': '#60a5fa',
};
const ZODIAC_ELEMENT_COLOR: Record<string, string> = {
  'Feuer': '#f87171', 'Erde': '#a3e635', 'Luft': '#22d3ee', 'Wasser': '#60a5fa',
};

function EnergyCard({ color, emoji, title, sub, children }: {
  color: string; emoji: string; title: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-3.5 space-y-1.5"
      style={{ borderColor: `${color}55`, background: `linear-gradient(135deg, ${color}14 0%, rgba(10,14,20,0.6) 70%)` }}>
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{emoji}</span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-tight" style={{ color }}>{title}</p>
          {sub && <p className="text-[10px] text-anth-400 leading-tight">{sub}</p>}
        </div>
      </div>
      <div className="text-[11px] text-anth-200 leading-relaxed">{children}</div>
    </div>
  );
}

function EnergyPopup({ onClose, now, mayan, cy, cm, moon, zodiac, nak }: {
  onClose: () => void;
  now: Date;
  mayan: { kin: number; tone: number; seal: string; emoji: string };
  cy: ReturnType<typeof getChineseYear>;
  cm: { element_de: string; animal_de: string; emoji: string };
  moon: MoonInfo;
  zodiac: ZodiacInfo;
  nak: NakshatraInfo;
}) {
  const t = useT();
  const locale = useLocale();
  const kinColor = MAYA_COLOR[(mayan.kin - 1) % 4];
  const portals = upcomingPortalDays(now, 5);
  const todayPortal = isPortalDay(now);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[125] w-[min(92vw,620px)] max-h-[86vh] overflow-y-auto scrollbar-thin rounded-3xl border border-border/70 p-5 space-y-3"
        style={{ background: 'rgba(10,14,20,0.97)', boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-forest-50">✨ {t('Aktuelle Energien')}</h2>
            <p className="text-[11px] text-anth-400">{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl text-anth-400 hover:text-white hover:bg-anth-700/50 transition-all flex items-center justify-center">
            <X size={15} />
          </button>
        </div>

        {todayPortal && (
          <div className="rounded-2xl border border-mint-500/50 bg-mint-500/10 px-3.5 py-2.5 text-[12px] text-mint-300 font-medium">
            🌀 {t('Heute ist ein Portaltag — galaktisches Aktivierungsportal! Energien sind verstärkt.')}
          </div>
        )}

        {/* Maya-Kin */}
        <EnergyCard color={kinColor} emoji={mayan.emoji}
          title={`Kin ${mayan.kin} · ${t(MAYAN_TONES[mayan.tone - 1])} ${t(mayan.seal)}`}
          sub={t('Dreamspell · Maya-Kalender')}>
          <p><span className="font-semibold">{t(mayan.seal)}:</span> {t(SEAL_MEANINGS[mayan.seal] ?? '')}</p>
          <p className="mt-1"><span className="font-semibold">{t('Ton')} {mayan.tone}:</span> {t(TONE_MEANINGS[mayan.tone] ?? '')}</p>
        </EnergyCard>

        {/* Chinesisches Jahr + Monat */}
        <EnergyCard color={CH_ELEMENT_COLOR[cy.element_de] ?? '#facc15'} emoji={cy.emoji}
          title={`${t('Jahr des')} ${t(cy.element_de)}-${t(cy.animal_de)}`}
          sub={`${cm.emoji} ${t('Monat der')} ${t(cm.element_de)}-${t(cm.animal_de)}`}>
          <p><span className="font-semibold">{t(cy.element_de)}:</span> {t(CH_ELEMENT_MEANINGS[cy.element_de] ?? '')}</p>
          <p className="mt-1"><span className="font-semibold">{t(cy.animal_de)}:</span> {t(CH_ANIMAL_MEANINGS[cy.animal_de] ?? '')} · <span className="text-anth-400">{t('Monat')}:</span> {t(CH_ANIMAL_MEANINGS[cm.animal_de] ?? '')}</p>
        </EnergyCard>

        {/* Westliches Sternzeichen */}
        <EnergyCard color={ZODIAC_ELEMENT_COLOR[zodiac.element]} emoji={zodiac.emoji}
          title={`${t('Sonne im')} ${t(zodiac.name)}`}
          sub={`${t('Westliche Astrologie')} · ${t('Element')}: ${t(zodiac.element)}`}>
          {t(ZODIAC_MEANINGS[zodiac.name] ?? '')}
        </EnergyCard>

        {/* Vedisches Mondhaus */}
        <EnergyCard color="#c084fc" emoji="🌙"
          title={`${t('Mondhaus')} ${nak.name}`}
          sub={`${t('Vedische Astrologie')} · Nakshatra ${nak.index + 1}/27 · ${nak.pada}. Pada`}>
          {t(nak.keyword)} — {t('der Mond färbt heute Gefühl und Intuition mit dieser Qualität.')}
        </EnergyCard>

        {/* Mondphase */}
        <EnergyCard color="#94a3b8" emoji={moon.emoji}
          title={t(moon.phase)}
          sub={`${moon.illumination}% ${t('beleuchtet')} · ${moon.daysToFull <= moon.daysToNew ? `🌕 in ${moon.daysToFull}T` : `🌑 in ${moon.daysToNew}T`}`}>
          {t(MOON_PHASE_MEANINGS[moon.phase] ?? '')}
        </EnergyCard>

        {/* Kommende Portaltage */}
        <div className="rounded-2xl border border-mint-500/30 bg-forest-900/20 p-3.5 space-y-1.5">
          <p className="text-[13px] font-bold text-mint-300">🌀 {t('Kommende Portaltage')}</p>
          <p className="text-[10px] text-anth-400 leading-snug">{t('Galaktische Aktivierungsportale — Tage mit verstärkter Energie, ideal für Meditation, Intention & Transformation.')}</p>
          <div className="space-y-1 pt-1">
            {portals.map(p => (
              <div key={p.kin + p.date.toISOString()} className="flex items-center gap-2 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500 shrink-0" />
                <span className="text-anth-200 flex-1">
                  {p.date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })}
                </span>
                <span className="text-anth-400">Kin {p.kin}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

function SidebarClock({ collapsed }: { collapsed: boolean }) {
  const t = useT();
  const locale = useLocale();
  const { clockVisible, toggleClock, astroExpanded, toggleAstro } = useUIExtStore();
  const [time, setTime]       = useState('');
  const [dateStr, setDateStr] = useState('');
  const [now, setNow]         = useState(new Date());
  const [showMoonCal, setShowMoonCal] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d);
      setTime(d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  const cy   = getChineseYear(now.getFullYear());
  const cm   = getChineseMonth(now.getFullYear(), now.getMonth() + 1);
  const moon = getMoonPhase(now);
  const mayan = getMayanKin(now);
  const zodiac = getWesternZodiac(now);
  const nak    = getNakshatra(now);
  const [showEnergy, setShowEnergy] = useState(false);

  if (collapsed) {
    return (
      <button onClick={toggleClock}
        title={`${time} · ${t(moon.phase)} · ${cy.animal_en}`}
        className="mx-auto flex items-center justify-center w-9 h-9 rounded-xl bg-anth-900/50 border border-border/50 text-sm select-none hover:border-forest-700/50 transition-colors">
        {moon.emoji}
      </button>
    );
  }

  if (!clockVisible) {
    return (
      <button onClick={toggleClock}
        className="mx-2 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-anth-700/40 text-anth-600 hover:text-anth-300 hover:border-anth-600/50 transition-colors text-[10px]">
        <span className="text-sm">{moon.emoji}</span>
        <span className="flex-1 truncate">{t('Uhr einblenden')}</span>
      </button>
    );
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const moonCalDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    return { day: i + 1, ...getMoonPhase(d) };
  });

  return (
    <div className="mx-2 px-3 py-3 rounded-xl bg-anth-900/50 border border-border/50 space-y-1.5 select-none">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xl font-bold tabular-nums tracking-tight" style={{ color: '#11CAA0' }}>{time}</span>
        <button onClick={toggleClock} className="text-anth-700 hover:text-anth-400 transition-colors" title={t('Uhr verstecken')}>
          <EyeOff size={11} />
        </button>
      </div>
      <p className="text-[13px] text-anth-300 tracking-wide leading-snug font-medium">{dateStr}</p>
      <div className="pt-1.5 border-t border-border/40">
        {/* Ein-/ausklappbarer Kopf für alle astrologischen Anzeigen (gespeichert) */}
        <button onClick={toggleAstro} className="w-full flex items-center justify-between py-0.5 group">
          <span className="text-[9px] uppercase tracking-widest text-anth-500 group-hover:text-anth-300 transition-colors">{t('Energien')}</span>
          <span className="flex items-center gap-1.5">
            {!astroExpanded && <span className="text-[11px] leading-none">{moon.emoji} {mayan.emoji} {zodiac.emoji}</span>}
            <ChevronDown size={12} className={cn('text-anth-500 group-hover:text-anth-300 transition-transform', astroExpanded && 'rotate-180')} />
          </span>
        </button>
        {astroExpanded && (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMoonCal(v => !v)} className="text-xl hover:scale-110 transition-transform" title={`${t(moon.phase)} · ${moon.illumination}%`}>
                {moon.emoji}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-anth-300 leading-snug">
                  {t(moon.phase)}
                  <span className="text-anth-300 ml-1">{moon.illumination}%</span>
                </p>
                <p className="text-[11px] text-anth-300 leading-snug">
                  {moon.phase === 'Vollmond' || moon.phase === 'Neumond'
                    ? `→ ${t(moon.phase === 'Vollmond' ? 'Neumond' : 'Vollmond')} in ${moon.phase === 'Vollmond' ? moon.daysToNew : moon.daysToFull}T`
                    : moon.daysToFull <= moon.daysToNew
                      ? `🌕 in ${moon.daysToFull}T`
                      : `🌑 in ${moon.daysToNew}T`
                  }
                </p>
              </div>
            </div>
            <p className="text-[12px] text-amber-400/80 leading-snug">{mayan.emoji} Kin {mayan.kin} · {t(MAYAN_TONES[mayan.tone-1])} {t(mayan.seal)}</p>
            <p className="text-[13px] leading-snug font-medium" style={{ color: '#9b7aff' }}>
              {cy.emoji} {t('Jahr des')} {t(cy.element_de)}-{t(cy.animal_de)}
            </p>
            <p className="text-[13px] leading-snug text-anth-400">
              {cm.emoji} {t('Monat der')} {t(cm.element_de)}-{t(cm.animal_de)}
            </p>
            {/* Westliches Sternzeichen + vedisches Mondhaus */}
            <p className="text-[13px] leading-snug" style={{ color: '#f0abfc' }}>
              {zodiac.emoji} {t(zodiac.name)} <span className="text-anth-400">· {t(zodiac.element)}</span>
            </p>
            <p className="text-[13px] leading-snug" style={{ color: '#7dd3fc' }}>
              🌙 {t('Mondhaus')} {nak.name} <span className="text-anth-400">· {nak.pada}. Pada</span>
            </p>
            <button onClick={() => setShowEnergy(true)}
              className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-mint-500/30 bg-gradient-to-r from-mint-500/10 via-violet-500/10 to-amber-500/10 text-[11px] font-medium text-mint-300 hover:text-mint-200 hover:border-mint-400/50 hover:from-mint-500/20 hover:via-violet-500/20 hover:to-amber-500/20 transition-all">
              <Sparkles size={11} /> {t('Aktuelle Energien')}
            </button>
          </div>
        )}
      </div>
      {showEnergy && <EnergyPopup onClose={() => setShowEnergy(false)} now={now}
        mayan={mayan} cy={cy} cm={cm} moon={moon} zodiac={zodiac} nak={nak} />}
      {showMoonCal && (
        <div className="pt-1.5 border-t border-border/40">
          <p className="text-[9px] uppercase tracking-widest text-anth-400 mb-1">{t('Mondphasen')}</p>
          <div className="grid grid-cols-7 gap-px">
            {moonCalDays.map(d => (
              <div key={d.day} className={cn('text-center py-0.5 rounded-sm',
                d.day === now.getDate() && 'bg-forest-700/40',
                d.phase === 'Vollmond' && 'bg-gold/10',
                d.phase === 'Neumond' && 'bg-violet-900/20',
              )}>
                <span className="text-[8px] block leading-none">{d.emoji}</span>
                <span className="text-[8px] text-anth-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Custom Iframe Modal ────────────────────────────────────────────────────
function AddIframeModal({ categoryId, onClose }: { categoryId: string; onClose: () => void }) {
  const { addItem } = usePinnedItemsStore();
  const [label, setLabel] = useState('');
  const [url, setUrl]     = useState('');
  const [icon, setIcon]   = useState('🔗');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-anth-950/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-dark border border-border rounded-2xl p-5 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-forest-100">Add Custom Tool</p>
          <button onClick={onClose} className="text-anth-500 hover:text-anth-300 transition-colors"><X size={14} /></button>
        </div>
        {[
          { key: 'icon',  label: 'Icon (emoji)', val: icon,  set: setIcon },
          { key: 'label', label: 'Label',        val: label, set: setLabel },
          { key: 'url',   label: 'URL',          val: url,   set: setUrl },
        ].map(f => (
          <div key={f.key}>
            <label className="text-[10px] uppercase tracking-widest text-anth-600 mb-1 block">{f.label}</label>
            <input value={f.val} onChange={e => f.set(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors" />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-anth-700/50 text-xs text-anth-400 hover:text-anth-200 transition-colors">Cancel</button>
          <button
            onClick={() => { if (!label.trim() || !url.trim()) return; addItem({ label: label.trim(), url: url.trim(), icon: icon || '🔗', categoryId: 'tools' }); onClose(); }}
            className="flex-1 py-2 rounded-xl bg-mint-500/15 border border-mint-500/30 text-xs text-mint-400 font-medium hover:bg-mint-500/25 transition-colors">
            Add to Tools
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sidebar Component ──────────────────────────────────────────────────────────
export function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, expandedSections, toggleSection, expandedSubFolders, toggleSubFolder } = useUIStore();
  const { agents } = useAgentStore();
  const { items: pinnedItems, addItem: pinItem, removeItem: removePinned, moveItem: movePinned } = usePinnedItemsStore();

  // Sidebar-Breite an die Bildschirmbreite anpassen (auf 2K schmaler)
  const [expandedW, setExpandedW] = useState(240);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setExpandedW(w >= 2400 ? 260 : w >= 1500 ? 240 : 212);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // ── Eigene Links pro Kategorie (＋ verknüpfen / Stift bearbeiten) ──
  const [addLinkCatId, setAddLinkCatId] = useState<string | null>(null);
  const [editCatId, setEditCatId]       = useState<string | null>(null);
  const [newLinkName, setNewLinkName]   = useState('');
  const [newLinkUrl, setNewLinkUrl]     = useState('');
  const submitCatLink = (catId: string) => {
    const url = newLinkUrl.trim();
    if (!url) return;
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    pinItem({
      label: newLinkName.trim() || (() => { try { return new URL(withProto).hostname; } catch { return withProto; } })(),
      url: withProto, icon: '🔗', categoryId: catId,
    });
    setNewLinkName(''); setNewLinkUrl(''); setAddLinkCatId(null);
  };
  const { notifications } = useNotificationStore();
  const {
    identityVereinType, identityHeroLabel,
    setIdentityVereinType, setIdentityHeroLabel,
    onlineMemberIds,
  } = useUIExtStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const onlineCount = agents.filter(a => a.status === 'online').length;
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [openRename, setOpenRename] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');

  const vereinLabel = identityVereinType || 'Company';
  const heroLabel   = identityHeroLabel  || 'Self';

  // ── Category-level open/close state ─────────────────────────────────────
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ACCORDION_CATS.forEach(c => { initial[c.id] = c.defaultOpen ?? false; });
    return initial;
  });
  const toggleCat = (id: string) => setOpenCats(s => ({ ...s, [id]: !s[id] }));

  const pinnedHrefs = new Set(pinnedItems.filter(p => p.categoryId === 'tools').map(p => p.url));

  const togglePin = (item: { id: string; label: string; href: string; emoji?: string }) => {
    if (pinnedHrefs.has(item.href)) {
      const existing = pinnedItems.find(p => p.url === item.href && p.categoryId === 'tools');
      if (existing) removePinned(existing.id);
    } else {
      pinItem({ label: item.label, url: item.href, icon: item.emoji ?? '📌', categoryId: 'tools' });
    }
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isChildActive = (children: NavChild[]): boolean =>
    children.some(c => isSubGroup(c) ? c.items.some(l => isActive(l.href)) : isActive(c.href));

  // ── Render a NavItem row (leaf or expandable) ──────────────────────────
  const renderNavItem = (item: NavItem) => {
    const hasChildren = !!(item.children?.length);
    const expanded    = expandedSections[item.id] ?? false;
    const active      = isActive(item.href);
    const childActive = item.children ? isChildActive(item.children) : false;
    const Icon        = item.icon;
    const isPinned    = item.href ? pinnedHrefs.has(item.href) : false;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleSection(item.id)}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl sidebar-nav-text transition-all duration-200 group',
              expanded || childActive
                ? 'text-mint-light bg-forest-800/40'
                : 'text-anth-400 hover:text-mint-light hover:bg-forest-900/40',
              sidebarCollapsed && 'justify-center px-2'
            )}
            title={sidebarCollapsed ? t(item.label) : undefined}
          >
            <Icon size={14} className="shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left font-medium truncate">{t(item.label)}</span>
                <ChevronDown size={11} className={cn('shrink-0 transition-transform duration-200 text-anth-600', expanded && 'rotate-180')} />
              </>
            )}
          </button>

          <AnimatePresence>
            {expanded && !sidebarCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {item.children && (
                  <div className="ml-3 mt-0.5 mb-1 pl-3 border-l border-border/50 space-y-0.5">
                    {item.children.map((child) => {
                      if (isSubGroup(child)) {
                        const sfExpanded = expandedSubFolders[child.id] ?? false;
                        const SubIcon = child.icon ?? Folder;
                        return (
                          <div key={child.id}>
                            <button
                              onClick={() => toggleSubFolder(child.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg sidebar-leaf-text text-anth-500 hover:text-mint-light hover:bg-forest-900/30 transition-all"
                            >
                              <SubIcon size={11} className="shrink-0" />
                              <span className="flex-1 text-left truncate">{t(child.label)}</span>
                              <ChevronDown size={10} className={cn('shrink-0 transition-transform duration-150', sfExpanded && 'rotate-180')} />
                            </button>
                            <AnimatePresence>
                              {sfExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.14 }}
                                  className="overflow-hidden ml-3 pl-2 border-l border-border/40"
                                >
                                  {child.items.map(leaf => {
                                    const leafActive = isActive(leaf.href);
                                    const leafPinned = pinnedHrefs.has(leaf.href);
                                    return (
                                      <div key={leaf.id} className="flex items-center group">
                                        <Link href={leaf.href}
                                          className={cn('flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md sidebar-leaf-text transition-all duration-150',
                                            leafActive ? 'text-mint-light bg-forest-800/50' : 'text-anth-500 hover:text-mint-light hover:bg-forest-900/30'
                                          )}>
                                          <span className={cn('w-1 h-1 rounded-full shrink-0', leafActive ? 'bg-mint-500' : 'bg-anth-600')} />
                                          {t(leaf.label)}
                                        </Link>
                                        <button onClick={() => togglePin(leaf)}
                                          title={leafPinned ? 'Unpin' : 'Pin'}
                                          className={cn('opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all shrink-0',
                                            leafPinned ? 'text-gold opacity-100' : 'text-anth-700 hover:text-gold'
                                          )}>
                                          <Pin size={8} className={leafPinned ? 'fill-current' : ''} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      const leafActive = pathname === child.href || (child.href !== '/dashboard' && pathname.startsWith(child.href));
                      const leafPinned = pinnedHrefs.has(child.href);
                      return (
                        <div key={child.id} className="flex items-center group">
                          <Link href={child.href}
                            className={cn('flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg sidebar-leaf-text transition-all duration-150',
                              leafActive ? 'text-mint-light bg-forest-800/50' : 'text-anth-500 hover:text-mint-light hover:bg-forest-900/30'
                            )}>
                            <span className={cn('w-1 h-1 rounded-full shrink-0', leafActive ? 'bg-mint-500' : 'bg-anth-600')} />
                            {t(child.label)}
                          </Link>
                          <button onClick={() => togglePin(child)}
                            title={leafPinned ? 'Unpin' : 'Pin'}
                            className={cn('opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all shrink-0',
                              leafPinned ? 'text-gold opacity-100' : 'text-anth-700 hover:text-gold'
                            )}>
                            <Pin size={8} className={leafPinned ? 'fill-current' : ''} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Agent sub-items removed — use Agent Overview page directly */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Special: verein / hero with rename dropdown
    const isRenameItem = item.id === 'verein' || item.id === 'hero';
    const displayLabel = item.id === 'verein' ? vereinLabel : item.id === 'hero' ? heroLabel : item.label;
    const renameOptions = item.id === 'verein'
      ? ['Company', 'Verein', 'Firma', 'Eigenes Gewerbe']
      : item.id === 'hero'
      ? ['Self', 'Hero', 'True Self']
      : [];

    if (isRenameItem) {
      return (
        <div key={item.id} className="relative">
          <div className="flex items-center group">
            <Link
              href={item.href!}
              className={cn(
                'flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl sidebar-nav-text transition-all duration-200',
                active ? 'bg-forest-700/50 border border-forest-600/50 shadow-sm' : 'text-anth-400 hover:bg-forest-900/40',
                sidebarCollapsed && 'justify-center px-2'
              )}
              style={active ? { color: '#d1ffdf' } : {}}
              title={sidebarCollapsed ? t(displayLabel) : undefined}
            >
              <Icon size={14} className={cn('shrink-0', active ? '' : 'text-anth-500 group-hover:text-mint-light')}
                style={active ? { color: '#11CAA0' } : {}} />
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium truncate flex-1">{t(displayLabel)}</span>
                  {active && <motion.div layoutId="sidebar-active-sub" className="w-1 h-3.5 rounded-full" style={{ backgroundColor: '#11CAA0' }} />}
                </>
              )}
            </Link>
            {!sidebarCollapsed && (
              <button
                onClick={(e) => { e.stopPropagation(); setOpenRename(openRename === item.id ? null : item.id); setCustomInput(''); }}
                title={t('Umbenennen')}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-anth-700 hover:text-anth-300 transition-all shrink-0"
              >
                <ChevronDown size={10} className={cn('transition-transform', openRename === item.id && 'rotate-180')} />
              </button>
            )}
          </div>
          {/* Rename dropdown */}
          <AnimatePresence>
            {openRename === item.id && !sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}
                className="absolute left-0 right-0 z-50 mt-1 bg-anth-900 border border-border rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  {renameOptions.map(opt => (
                    <button key={opt}
                      onClick={() => {
                        if (item.id === 'verein') setIdentityVereinType(opt);
                        else setIdentityHeroLabel(opt);
                        setOpenRename(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-anth-300 hover:bg-forest-900/40 hover:text-mint-light transition-colors"
                    >
                      {t(opt)}
                    </button>
                  ))}
                  <div className="flex gap-1 pt-1 border-t border-border/40">
                    <input
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customInput.trim()) {
                          if (item.id === 'verein') setIdentityVereinType(customInput.trim());
                          else setIdentityHeroLabel(customInput.trim());
                          setOpenRename(null);
                          setCustomInput('');
                        }
                      }}
                      placeholder={t('Eigener Name…')}
                      className="flex-1 bg-surface border border-border rounded-lg px-2 py-1 text-[10px] text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors"
                    />
                    <button
                      onClick={() => {
                        if (customInput.trim()) {
                          if (item.id === 'verein') setIdentityVereinType(customInput.trim());
                          else setIdentityHeroLabel(customInput.trim());
                          setOpenRename(null);
                          setCustomInput('');
                        }
                      }}
                      className="px-2 rounded-lg bg-forest-700/40 text-forest-300 text-xs hover:bg-forest-600/40 transition-colors"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Simple leaf
    return (
      <div key={item.id} className="flex items-center group">
        <Link
          href={item.href!}
          className={cn(
            'flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl sidebar-nav-text transition-all duration-200',
            active ? 'bg-forest-700/50 border border-forest-600/50 shadow-sm' : 'text-anth-400 hover:bg-forest-900/40',
            sidebarCollapsed && 'justify-center px-2'
          )}
          style={active ? { color: '#d1ffdf' } : {}}
          title={sidebarCollapsed ? t(item.label) : undefined}
        >
          <Icon size={14} className={cn('shrink-0', active ? '' : 'text-anth-500 group-hover:text-mint-light')}
            style={active ? { color: '#11CAA0' } : {}} />
          {!sidebarCollapsed && (
            <>
              <span className="font-medium truncate flex-1">{t(item.label)}</span>
              {active && <motion.div layoutId="sidebar-active-sub" className="w-1 h-3.5 rounded-full" style={{ backgroundColor: '#11CAA0' }} />}
            </>
          )}
        </Link>
        {item.href && !sidebarCollapsed && (
          <button
            onClick={() => togglePin({ id: item.id, label: item.label, href: item.href!, emoji: item.emoji })}
            title={isPinned ? 'Unpin from Tools' : 'Pin to Tools'}
            className={cn('opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all shrink-0',
              isPinned ? 'text-gold opacity-100' : 'text-anth-700 hover:text-gold hover:bg-forest-900/30'
            )}>
            <Pin size={10} className={isPinned ? 'fill-current' : ''} />
          </button>
        )}
      </div>
    );
  };

  // ── Render solo top item (no accordion wrapper) ────────────────────────
  const renderSoloItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const isPinned = item.href ? pinnedHrefs.has(item.href) : false;
    return (
      <div key={item.id} className="flex items-center group">
        <Link
          href={item.href!}
          className={cn(
            'flex-1 flex items-center gap-2 px-2.5 py-2.5 rounded-xl transition-all duration-200',
            active
              ? 'bg-forest-700/60 border border-forest-500/60 shadow-[0_0_18px_rgba(17,202,160,0.18)]'
              : 'text-anth-300 hover:bg-forest-900/50 hover:text-forest-100 border border-transparent',
            sidebarCollapsed && 'justify-center px-2'
          )}
          style={active ? { color: '#d1ffdf' } : {}}
          title={sidebarCollapsed ? t(item.label) : undefined}
        >
          <Icon size={15} className="shrink-0" style={active ? { color: '#11CAA0' } : {}} />
          {!sidebarCollapsed && (
            <>
              <span className="font-semibold truncate flex-1 text-sm">{t(item.label)}</span>
              {active && <motion.div layoutId="sidebar-active" className="w-1 h-4 rounded-full" style={{ backgroundColor: '#11CAA0' }} />}
            </>
          )}
        </Link>
        {item.href && !sidebarCollapsed && (
          <button
            onClick={() => togglePin({ id: item.id, label: item.label, href: item.href!, emoji: item.emoji })}
            title={isPinned ? 'Unpin' : 'Pin'}
            className={cn('opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all shrink-0',
              isPinned ? 'text-gold opacity-100' : 'text-anth-700 hover:text-gold hover:bg-forest-900/30'
            )}>
            <Pin size={10} className={isPinned ? 'fill-current' : ''} />
          </button>
        )}
      </div>
    );
  };

  // ── Render accordion category ─────────────────────────────────────────
  const renderAccordionCat = (cat: AccordionCategory) => {
    const isOpen = openCats[cat.id] ?? false;
    const catPinned = pinnedItems.filter(p => p.categoryId === cat.id);

    // Auto-open if a child is active
    const hasActiveChild = cat.items.some(item => {
      if (item.href && isActive(item.href)) return true;
      if (item.children && isChildActive(item.children)) return true;
      return false;
    });

    const effectiveOpen = isOpen || hasActiveChild;

    return (
      <div key={cat.id} className="space-y-0.5">
        {/* Category accordion header */}
        {!sidebarCollapsed ? (
          cat.href ? (
            /* Direktlink-Kategorie (DATA, MATRIX, MEDITATION) — kein Dropdown */
            <Link href={cat.href}
              className={cn(
                'w-full flex items-center justify-between px-1 py-1 rounded-lg transition-all duration-200 group',
                pathname.startsWith(cat.href) ? 'text-forest-300' : 'text-anth-600 hover:text-anth-300'
              )}>
              <span className="sidebar-category-label uppercase font-semibold tracking-wider text-[10px]">{t(cat.label)}</span>
              {pathname.startsWith(cat.href) && <span className="w-1 h-3 rounded-full bg-mint-500 shrink-0" />}
            </Link>
          ) : (
          <div className={cn(
            'w-full flex items-center gap-1 px-1 py-1 rounded-lg transition-all duration-200 group',
            effectiveOpen ? 'text-forest-300' : 'text-anth-600 hover:text-anth-400'
          )}>
            <button onClick={() => toggleCat(cat.id)} className="flex-1 flex items-center justify-between min-w-0">
              <span className="sidebar-category-label uppercase font-semibold tracking-wider text-[10px]">{t(cat.label)}</span>
            </button>
            {cat.customizable && (
              <>
                <button
                  onClick={() => { setAddLinkCatId(addLinkCatId === cat.id ? null : cat.id); setEditCatId(null); if (!effectiveOpen) toggleCat(cat.id); }}
                  title={t('Link verknüpfen')}
                  className={cn('p-0.5 rounded transition-all shrink-0',
                    addLinkCatId === cat.id ? 'text-mint-400 opacity-100' : 'text-anth-600 hover:text-mint-400 opacity-0 group-hover:opacity-100')}>
                  <Plus size={10} strokeWidth={3} />
                </button>
                <button
                  onClick={() => { setEditCatId(editCatId === cat.id ? null : cat.id); setAddLinkCatId(null); if (!effectiveOpen) toggleCat(cat.id); }}
                  title={t('Bearbeiten')}
                  className={cn('p-0.5 rounded transition-all shrink-0',
                    editCatId === cat.id ? 'text-gold opacity-100' : 'text-anth-600 hover:text-gold opacity-0 group-hover:opacity-100')}>
                  <Pencil size={9} />
                </button>
              </>
            )}
            <button onClick={() => toggleCat(cat.id)} className="shrink-0">
              <ChevronDown
                size={11}
                className={cn('shrink-0 transition-transform duration-250', effectiveOpen ? 'rotate-0 text-forest-500' : '-rotate-90 text-anth-700')}
              />
            </button>
          </div>
          )
        ) : (
          <div className="border-t border-border/40 my-1.5" />
        )}

        {/* ── Link-verknüpfen-Formular ── */}
        {addLinkCatId === cat.id && !sidebarCollapsed && (
          <div className="mx-1 my-1 p-2 rounded-xl border border-mint-500/30 bg-forest-900/30 space-y-1.5">
            <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)}
              placeholder={t('Name…')} autoFocus
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-500 outline-none focus:border-mint-500/50" />
            <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitCatLink(cat.id); if (e.key === 'Escape') setAddLinkCatId(null); }}
              placeholder="https://…"
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-500 outline-none focus:border-mint-500/50" />
            <div className="flex gap-1">
              <button onClick={() => submitCatLink(cat.id)}
                className="flex-1 py-1.5 rounded-lg bg-mint-500/15 border border-mint-500/30 text-[10px] text-mint-300 hover:bg-mint-500/25 transition-colors">
                {t('Hinzufügen')}
              </button>
              <button onClick={() => setAddLinkCatId(null)} className="p-1 text-anth-500 hover:text-anth-300"><X size={11} /></button>
            </div>
          </div>
        )}

        {/* Category items — animated slide */}
        <AnimatePresence initial={false}>
          {(effectiveOpen || sidebarCollapsed) && (
            <motion.div
              key="cat-items"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pb-1">
                {cat.items.map(renderNavItem)}
              </div>

              {/* Per-category pinned items */}
              {catPinned.length > 0 && !sidebarCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {catPinned.map(pin => (
                    <div key={pin.id} className="flex items-center gap-1 group">
                      {editCatId === cat.id && (
                        <span className="flex flex-col shrink-0">
                          <button onClick={() => movePinned(pin.id, -1)} title="↑"
                            className="p-0 text-anth-500 hover:text-mint-400 leading-none text-[9px]">▲</button>
                          <button onClick={() => movePinned(pin.id, 1)} title="↓"
                            className="p-0 text-anth-500 hover:text-mint-400 leading-none text-[9px]">▼</button>
                        </span>
                      )}
                      {pin.url.startsWith('/') ? (
                        <Link href={pin.url}
                          className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl sidebar-nav-text text-anth-400 hover:text-mint-light hover:bg-forest-900/30 transition-all">
                          <span className="text-sm">{pin.icon}</span>
                          <span className="truncate">{pin.label}</span>
                        </Link>
                      ) : (
                        <a href={pin.url} target="_blank" rel="noreferrer"
                          className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl sidebar-nav-text text-anth-400 hover:text-mint-light hover:bg-forest-900/30 transition-all">
                          <span className="text-sm">{pin.icon}</span>
                          <span className="truncate">{pin.label}</span>
                        </a>
                      )}
                      <button onClick={() => removePinned(pin.id)}
                        className={cn('p-1 rounded-md text-anth-600 hover:text-red-400 transition-all',
                          editCatId === cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const mainCats   = ACCORDION_CATS.filter(c => !c.bottom);
  const bottomCats = ACCORDION_CATS.filter(c =>  c.bottom);

  return (
    <>
      {addingTo && <AddIframeModal categoryId={addingTo} onClose={() => setAddingTo(null)} />}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : expandedW }}
        transition={{ type: 'spring', stiffness: 380, damping: 35 }}
        className="relative flex flex-col h-full glass-dark overflow-hidden shrink-0 z-20"
        style={{ borderRight: '1px solid rgba(255,255,255,0.10)', boxShadow: '3px 0 20px rgba(0,0,0,0.5), inset -1px 0 0 rgba(17,202,160,0.07)' }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-2.5 px-3 py-3.5 border-b border-border/60 shrink-0">
          <TrinityOrb size={34} className="shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.16 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-[11px] font-extrabold leading-tight tracking-wide whitespace-nowrap" style={{ color: '#11CAA0' }}>TRINITY OS</p>
                <p className="text-[9px] text-anth-500 tracking-widest whitespace-nowrap mt-0.5">Powered by YOU ARE NEO</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Clock ── */}
        <div className="py-1.5 shrink-0">
          <SidebarClock collapsed={sidebarCollapsed} />
        </div>

        {/* ── Online pill ── */}
        <div className={cn(
          'mx-2 mt-2 flex items-center gap-2 rounded-lg border border-forest-800/60 bg-forest-900/30 shrink-0',
          sidebarCollapsed ? 'justify-center p-1.5' : 'px-2.5 py-1.5'
        )}>
          <div className="relative shrink-0">
            <Activity size={11} style={{ color: '#11CAA0' }} />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#11CAA0' }} />
          </div>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-medium truncate" style={{ color: '#11CAA0' }}>
              {onlineCount}/{agents.length} online
            </span>
          )}
        </div>

        {/* ── Team online (synced with Mission Control team panel) ── */}
        <Link href="/dashboard" className={cn('mx-2 mb-1 flex items-center gap-2 rounded-lg border border-sky-800/50 bg-sky-900/20 shrink-0 hover:bg-sky-900/35 transition-colors',
          sidebarCollapsed ? 'justify-center p-1.5' : 'px-2.5 py-1')}>
          <Users size={10} style={{ color: '#38bdf8' }} />
          {!sidebarCollapsed && (
            <span className="text-[10px] font-medium flex-1" style={{ color: '#38bdf8' }}>
              {onlineMemberIds.length} {t('Team online')}
            </span>
          )}
        </Link>

        {/* ── Main Nav (scrollable) ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin min-h-0">
          {/* ── Accordion categories ── */}
          <div className="space-y-1">
            {mainCats.map(renderAccordionCat)}
          </div>
        </nav>

        {/* ── Bottom-pinned: SYSTEM CONTROL ── */}
        <div className="px-2 py-2 border-t border-border/40 space-y-1 shrink-0">
          {bottomCats.map(renderAccordionCat)}
        </div>

        {/* ── Collapse toggle ── */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-anth-400 hover:text-mint-light hover:border-mint-500/40 transition-colors z-30 shadow-md"
        >
          {sidebarCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </motion.aside>
    </>
  );
}
