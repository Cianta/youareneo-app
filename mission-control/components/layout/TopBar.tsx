'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Brain, FlaskConical, Eye, CalendarDays, Bell, RefreshCw, BookOpen,
  Play, Pause, RotateCcw, SkipForward, Plus, Trash2, EyeOff,
  Zap, CheckSquare, StickyNote, Timer, ChevronDown, X, ToggleLeft, ToggleRight,
  LogIn, LogOut, User, Check, ExternalLink, MoveRight,
  Wrench, Search, Square, CheckSquare2, Pin, Volume2, VolumeX,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  useBrainStore, useFocusStore, useTemporalStore, useNotebookStore,
  useAgentStore, POMO_DURATIONS,
  useNotificationStore, useAuthStore, useUIExtStore, EMPLOYEES,
  usePinnedItemsStore, useNeuralNotebookStore, useDataHubStore,
} from '@/lib/store';
import { SIDEBAR_NAV_LINKS } from '@/components/layout/Sidebar';
import { playGong } from '@/lib/gong';
import { FuseBaseAuth } from '@/components/auth/FuseBaseAuth';
import { useLangStore, useT } from '@/lib/i18n';
import type { PomodoroMode, NotificationType } from '@/lib/store';

// ── Language Switcher ──────────────────────────────────────────────────────────
function LangSwitcher() {
  const { lang, toggleLang } = useLangStore();
  return (
    <button onClick={toggleLang}
      title={lang === 'de' ? 'Switch to English' : 'Auf Deutsch umschalten'}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-anth-400 hover:text-mint-light hover:bg-forest-800/40 transition-colors text-xs font-medium">
      <span className="text-sm">{lang === 'de' ? '🇩🇪' : '🇬🇧'}</span>
      <span className="hidden md:inline">{lang === 'de' ? 'DE' : 'EN'}</span>
    </button>
  );
}

// ── Page title registry ────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':                        { title: 'Mission Control',      subtitle: 'Agent Operating System Overview' },
  '/dashboard/vision/verein':          { title: 'Company',              subtitle: 'Firmenprofil · Brand · Struktur · Ziele' },
  '/dashboard/vision/hero':            { title: 'Self',                 subtitle: 'Profil · Lebensziele · Visionboard · Brainstorm' },
  '/dashboard/vision/tasks':           { title: 'Tasks',                subtitle: 'Team Trello Board' },
  '/dashboard/ninjas':                 { title: 'Team',     subtitle: 'Human Team Dashboard & Workflow Hub' },
  '/dashboard/universe':               { title: 'Universe',             subtitle: 'Unified Memory Vault · Obsidian · Notion · Docmost' },
  '/dashboard/kanban':                 { title: 'Kanban & Notebooks',   subtitle: 'Agentic Tasks · Trello Sync · NotebookLM' },
  '/dashboard/kanban/notebooklm':      { title: 'NotebookLM',           subtitle: 'Google AI Notebook Research' },
  '/dashboard/kanban/opennotebook':    { title: 'Open-Notebook',        subtitle: 'AI-Powered Research Notebook' },
  '/dashboard/mitglieder/ghl':         { title: 'GHL CRM',              subtitle: 'GoHighLevel CRM Terminal' },
  '/dashboard/mitglieder/lunacal':     { title: 'Lunacal',              subtitle: 'Calendar & Appointment Booking' },
  '/dashboard/mitglieder/riverside':   { title: 'Riverside Studio',     subtitle: 'Video Podcast Recording' },
  '/dashboard/mitglieder/kmeet':       { title: 'kMeet',                subtitle: 'Team Video Conferencing' },
  '/dashboard/mitglieder/gobrunch':    { title: 'GoBrunch',             subtitle: 'Virtual Event Rooms' },
  '/dashboard/world/miro':             { title: 'Miro',                 subtitle: 'Collaborative Whiteboard' },
  '/dashboard/world/wakelet':          { title: 'Wakelet',              subtitle: 'Content Curation & Sharing' },
  '/dashboard/world/padlet':           { title: 'Padlet',               subtitle: 'Visual Collaboration Board' },
  '/dashboard/world/presenti':         { title: 'Presenti AI',          subtitle: 'AI Presentation Builder' },
  '/dashboard/world/gamma':            { title: 'Gamma',                subtitle: 'AI Document & Deck Creator' },
  '/dashboard/seo':                    { title: 'SEO Strategy',         subtitle: 'Keyword Research & Content Deployment' },
  '/dashboard/social/postiz':          { title: 'Postiz Hub',           subtitle: 'Self-Hosted Social Distribution Engine' },
  '/dashboard/social/channels':        { title: 'Channels Hub',         subtitle: 'YouTube · Instagram · TikTok · All Platforms' },
  '/dashboard/media':                  { title: 'Media Studio',         subtitle: 'Audio, Video & Design Production' },
  '/dashboard/media/gemini':           { title: 'GeminiGen Studio',     subtitle: 'AI Video & Image Generation' },
  '/dashboard/media/higgsfield':       { title: 'Higgsfield AI',        subtitle: 'Cinematic AI Video Generation' },
  '/dashboard/media/video/motionvid':  { title: 'Motion Vid',           subtitle: 'Motion Graphics & Animation' },
  '/dashboard/media/video/immich':     { title: 'Immich',               subtitle: 'Self-Hosted Media Cloud' },
  '/dashboard/media/audio/unmixr':     { title: 'Unmixr Studio',        subtitle: 'AI Audio Separation & Mastering' },
  '/dashboard/media/audio/elevenlabs': { title: 'ElevenLabs',           subtitle: 'AI Voice & Text-to-Speech' },
  '/dashboard/media/design/googledocs':{ title: 'Google Docs',          subtitle: 'Document & Design Workspace' },
  '/dashboard/media/magicfit':         { title: 'Magic Fit',            subtitle: 'Health & Fitness Platform' },
  '/dashboard/shopify':                { title: 'Shopify Hub',          subtitle: 'Automated Content & Product Publishing' },
  '/dashboard/settings':               { title: 'Settings',             subtitle: 'API Keys, Models & Configuration' },
  '/dashboard/memory':                 { title: 'Shared Memory',        subtitle: 'Cross-Agent Knowledge Base' },
  '/dashboard/communication/email':         { title: 'Email Core',           subtitle: 'Gmail · KMail Unified Inbox' },
  '/dashboard/communication/kchat':         { title: 'KChat Hub',            subtitle: 'Self-Hosted Team Messaging' },
  '/dashboard/communication/whatsapp':      { title: 'WhatsApp Business',    subtitle: 'Business Messaging Platform' },
  '/dashboard/communication/telegram':      { title: 'Telegram Messenger',   subtitle: 'Encrypted Messaging & Channels' },
  '/dashboard/communication/data-transfer': { title: 'Data Transfer',        subtitle: 'SwissTransfer · WeTransfer · Secure Sharing' },
  '/dashboard/data/cloud-drives':           { title: 'Cloud Drives',         subtitle: 'Google Drive · KDrive · Custom Storage Hubs' },
  '/dashboard/matrix/space-weather':        { title: 'Space Weather',        subtitle: 'NOAA Solar Storm & Frequency Analytics' },
  '/dashboard/matrix/morphreader':          { title: 'MorphReader',          subtitle: 'AI-Curated Technology Intelligence Feed' },
  '/dashboard/media/video/gai-studio':      { title: 'Google AI Studio',     subtitle: 'Gemini API Playground & Prompt Builder' },
  '/dashboard/media/video/antigravity':     { title: 'AntiGravity AI',       subtitle: 'Creative Video Generation Platform' },
  '/dashboard/media/video/gemma':           { title: 'Gemma AI',             subtitle: 'Google Gemma Open Model Workspace' },
  '/dashboard/media/audio/stitch':          { title: 'Google Stitch',        subtitle: 'AI-Powered Music & Audio Generation' },
  '/dashboard/media/audio/flowmusic':       { title: 'FlowMusic',            subtitle: 'Ambient & Focus Music Studio' },
  '/dashboard/seo/apollo':                  { title: 'Apollo.io',            subtitle: 'B2B Lead Intelligence & Outreach' },
  '/dashboard/matrix/n8n':                  { title: 'n8n Automation Hub',   subtitle: 'Workflow Orchestration · localhost:5678' },
  '/dashboard/world/arche':                 { title: 'Arche — Die Kunst des Lebens', subtitle: 'Memberspot Academy · Member Portal' },
  '/dashboard/updates':                     { title: 'Updates Center',       subtitle: 'Notifications · Alerts · System Events' },
  '/dashboard/meditation':                  { title: 'Meditation',           subtitle: 'Focus Backgrounds · Music · Pause Loops' },
  '/dashboard/vision/matrix-center':        { title: 'Matrix Center',        subtitle: 'NOAA Space Weather & MorphReader Intelligence' },
  '/dashboard/agents':                     { title: 'Digital Staff',   subtitle: 'AI Agent Grid · Chat Terminal · Voice Input' },
  '/dashboard/media/documents':            { title: 'Dokumente',            subtitle: 'Google Docs · Office 365 · Apple iCloud' },
};

// ── All available tools for the header dropdown ──────────────────────────────
const ALL_TOOLS: { id: string; label: string; href: string; emoji: string; category: string }[] = [
  // AI
  { id: 't-gemini',      label: 'GeminiGen Studio',  href: '/dashboard/media/gemini',            emoji: '🧠', category: 'AI' },
  { id: 't-gai-studio',  label: 'Google AI Studio',  href: '/dashboard/media/video/gai-studio',  emoji: '🤖', category: 'AI' },
  { id: 't-antigravity', label: 'AntiGravity AI',    href: '/dashboard/media/video/antigravity', emoji: '🚀', category: 'AI' },
  { id: 't-higgsfield',  label: 'Higgsfield AI',     href: '/dashboard/media/higgsfield',        emoji: '🎬', category: 'AI' },
  // Audio
  { id: 't-elevenlabs',  label: 'ElevenLabs',        href: '/dashboard/media/audio/elevenlabs',  emoji: '🎤', category: 'Audio' },
  { id: 't-stitch',      label: 'Google Stitch',     href: '/dashboard/media/audio/stitch',      emoji: '🎵', category: 'Audio' },
  { id: 't-unmixr',      label: 'Unmixr Studio',     href: '/dashboard/media/audio/unmixr',      emoji: '🎧', category: 'Audio' },
  { id: 't-flowmusic',   label: 'FlowMusic',         href: '/dashboard/media/audio/flowmusic',   emoji: '🎶', category: 'Audio' },
  // Video & Design
  { id: 't-motionvid',   label: 'Motion Vid',        href: '/dashboard/media/video/motionvid',   emoji: '🎞️', category: 'Video' },
  { id: 't-immich',      label: 'Immich Cloud',      href: '/dashboard/media/video/immich',      emoji: '📷', category: 'Video' },
  { id: 't-googledocs',  label: 'Google Docs',       href: '/dashboard/media/design/googledocs', emoji: '📝', category: 'Design' },
  // Boards
  { id: 't-miro',        label: 'Miro',              href: '/dashboard/world/miro',              emoji: '🟡', category: 'Boards' },
  { id: 't-wakelet',     label: 'Wakelet',           href: '/dashboard/world/wakelet',           emoji: '📋', category: 'Boards' },
  { id: 't-padlet',      label: 'Padlet',            href: '/dashboard/world/padlet',            emoji: '📌', category: 'Boards' },
  { id: 't-presenti',    label: 'Presenti AI',       href: '/dashboard/world/presenti',          emoji: '📊', category: 'Boards' },
  { id: 't-gamma',       label: 'Gamma',             href: '/dashboard/world/gamma',             emoji: '✨', category: 'Boards' },
  // Communication
  { id: 't-email',       label: 'Gmail Native',      href: '/dashboard/communication/email',     emoji: '📧', category: 'Communication' },
  { id: 't-kchat',       label: 'KChat Hub',         href: '/dashboard/communication/kchat',     emoji: '💬', category: 'Communication' },
  { id: 't-whatsapp',    label: 'WhatsApp',          href: '/dashboard/communication/whatsapp',  emoji: '📱', category: 'Communication' },
  // CRM & Meetings
  { id: 't-ghl',         label: 'GHL CRM',           href: '/dashboard/mitglieder/ghl',          emoji: '📇', category: 'CRM' },
  { id: 't-lunacal',     label: 'Lunacal',           href: '/dashboard/mitglieder/lunacal',      emoji: '📅', category: 'CRM' },
  { id: 't-riverside',   label: 'Riverside',         href: '/dashboard/mitglieder/riverside',    emoji: '🎙️', category: 'CRM' },
  // Marketing
  { id: 't-apollo',      label: 'Apollo.io',         href: '/dashboard/seo/apollo',              emoji: '🎯', category: 'Marketing' },
  { id: 't-seo',         label: 'SEO Strategy',      href: '/dashboard/seo',                     emoji: '🔍', category: 'Marketing' },
  { id: 't-postiz',      label: 'Postiz Hub',        href: '/dashboard/social/postiz',           emoji: '📣', category: 'Marketing' },
  { id: 't-shopify',     label: 'Shopify Hub',       href: '/dashboard/shopify',                 emoji: '🛒', category: 'Marketing' },
  // Data
  { id: 't-drives',      label: 'Cloud Drives',      href: '/dashboard/data/cloud-drives',       emoji: '☁️', category: 'Data' },
  { id: 't-n8n',         label: 'n8n Automation',    href: '/dashboard/matrix/n8n',              emoji: '⚡', category: 'Data' },
  { id: 't-magicfit',    label: 'Magic Fit',         href: '/dashboard/media/magicfit',          emoji: '💪', category: 'Health' },
];

// ── Tools Dropdown ────────────────────────────────────────────────────────────
function ToolsDropdown() {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { items: pinnedItems, addItem, removeItem } = usePinnedItemsStore();
  const { columns: hubColumns } = useDataHubStore();
  const t = useT();

  const pinnedTools = pinnedItems.filter(p => p.categoryId === 'tools');
  const pinnedHrefs = new Set(pinnedTools.map(p => p.url));

  // Live-Liste: kuratierte Tools + alle Sidebar-Menüpunkte + eigene Links
  // (Sidebar-＋) + Data-Hub-Links. Aktualisiert sich automatisch, sobald
  // irgendwo ein Punkt oder Link hinzukommt.
  const allTools = useMemo(() => {
    const seen = new Set<string>();
    const list: typeof ALL_TOOLS = [];
    const push = (tool: typeof ALL_TOOLS[0]) => {
      if (!tool.href || seen.has(tool.href)) return;
      seen.add(tool.href);
      list.push(tool);
    };
    ALL_TOOLS.forEach(push);
    SIDEBAR_NAV_LINKS.forEach(l => push({ id: l.id, label: l.label, href: l.href, emoji: '🧭', category: l.category }));
    pinnedItems.filter(p => p.categoryId !== 'tools').forEach(p =>
      push({ id: p.id, label: p.label, href: p.url, emoji: p.icon || '🔗', category: t('Eigene Links') }));
    hubColumns.filter(c => c.kind === 'links').forEach(col =>
      col.entries.forEach(e =>
        push({ id: e.id, label: e.name, href: e.target, emoji: '☁️', category: `Data · ${col.name}` })));
    return list;
  }, [pinnedItems, hubColumns, t]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowAll(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggleTool = (tool: typeof ALL_TOOLS[0]) => {
    if (pinnedHrefs.has(tool.href)) {
      const existing = pinnedTools.find(p => p.url === tool.href);
      if (existing) removeItem(existing.id);
    } else {
      addItem({ label: tool.label, url: tool.href, icon: tool.emoji, categoryId: 'tools' });
    }
  };

  const filteredTools = search
    ? allTools.filter(t => t.label.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    : allTools;

  // Group by category
  const grouped = filteredTools.reduce<Record<string, typeof ALL_TOOLS>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const showPinned = pinnedTools.length > 0 && !showAll;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(v => !v); setShowAll(false); setSearch(''); }}
        className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all',
          open ? 'bg-amber-900/20 border-amber-700/40 text-amber-300' : 'bg-anth-800/60 border-anth-700/50 text-anth-400 hover:text-amber-300 hover:border-amber-700/30'
        )}>
        <Wrench size={12} />
        <span className="hidden sm:inline">Tools</span>
        {pinnedTools.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-amber-900/40 text-amber-400 text-[9px] flex items-center justify-center font-bold">{pinnedTools.length}</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 glass-dark border border-border rounded-2xl shadow-panel z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/60">
            <p className="text-[10px] uppercase tracking-widest text-anth-500 mb-2">
              {showAll || pinnedTools.length === 0 ? 'All Tools' : 'Quick Access'}
            </p>
            {/* Search */}
            {(showAll || pinnedTools.length === 0) && (
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-anth-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-anth-900/40 border border-anth-700/30 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-forest-600/50 transition-colors" />
              </div>
            )}
          </div>

          {/* Pinned quick-access view */}
          {showPinned && (
            <div className="p-2 max-h-64 overflow-y-auto">
              <div className="space-y-0.5">
                {pinnedTools.map(pin => {
                  const external = /^https?:\/\//i.test(pin.url);
                  const inner = (<>
                    <span className="text-sm">{pin.icon}</span>
                    <span className="flex-1 truncate">{pin.label}</span>
                    <ExternalLink size={10} className="text-anth-600" />
                  </>);
                  const cls = 'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-anth-300 hover:text-forest-100 hover:bg-forest-900/30 transition-colors';
                  return external
                    ? <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className={cls}>{inner}</a>
                    : <Link key={pin.id} href={pin.url} onClick={() => setOpen(false)} className={cls}>{inner}</Link>;
                })}
              </div>
              <button onClick={() => setShowAll(true)}
                className="w-full mt-2 py-2 rounded-xl border border-dashed border-anth-700/40 text-xs text-anth-500 hover:text-amber-300 hover:border-amber-700/40 transition-colors flex items-center justify-center gap-1.5">
                <Plus size={11} /> Add more tools
              </button>
            </div>
          )}

          {/* Full checkbox list */}
          {(showAll || pinnedTools.length === 0) && (
            <div className="max-h-72 overflow-y-auto p-2">
              {Object.entries(grouped).map(([cat, tools]) => (
                <div key={cat} className="mb-2 last:mb-0">
                  <p className="text-[9px] uppercase tracking-widest text-anth-600 px-3 py-1 font-semibold">{cat}</p>
                  {tools.map(tool => {
                    const checked = pinnedHrefs.has(tool.href);
                    return (
                      <button key={tool.id} onClick={() => toggleTool(tool)}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs hover:bg-forest-900/30 transition-colors">
                        <span className={cn('w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                          checked ? 'bg-amber-600/30 border-amber-600/50 text-amber-300' : 'border-anth-600/50 text-transparent'
                        )}>
                          {checked && <Check size={10} />}
                        </span>
                        <span className="text-sm">{tool.emoji}</span>
                        <span className={cn('flex-1 text-left truncate', checked ? 'text-forest-100' : 'text-anth-400')}>{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {pinnedTools.length > 0 && (
                <button onClick={() => setShowAll(false)}
                  className="w-full mt-1 py-2 rounded-xl text-[10px] text-forest-500 hover:text-forest-300 transition-colors flex items-center justify-center gap-1">
                  <MoveRight size={10} /> Back to quick access
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pomodoro mode colours ──────────────────────────────────────────────────────
const POMO_STYLES: Record<PomodoroMode, { label: string; color: string; bg: string }> = {
  'focus':         { label: 'Focus',    color: 'text-mint-500',   bg: 'bg-mint-500/10 border-mint-500/30' },
  'break':         { label: 'Break',   color: 'text-gold',       bg: 'bg-gold/10 border-gold/30' },
  'deep-recovery': { label: 'Deep Rest',color: 'text-violet-400', bg: 'bg-violet-900/20 border-violet-700/40' },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Notification type metadata ─────────────────────────────────────────────────
const NOTIF_META: Record<NotificationType, { icon: string; color: string }> = {
  goal:     { icon: '🎯', color: 'text-gold' },
  mail:     { icon: '📧', color: 'text-sky-400' },
  system:   { icon: '⚙️', color: 'text-anth-400' },
  agent:    { icon: '🤖', color: 'text-mint-400' },
  calendar: { icon: '📅', color: 'text-violet-400' },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Brain Toggle ───────────────────────────────────────────────────────────────
function BrainToggle() {
  const { syncMode, toggleSync } = useBrainStore();
  return (
    <button onClick={toggleSync}
      title={syncMode ? 'Sync ON' : 'Practice Mode'}
      className={cn('flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-medium transition-all duration-300',
        syncMode ? 'bg-mint-500/15 border-mint-500/40 text-mint-500' : 'bg-anth-800/60 border-anth-700/50 text-anth-400 hover:border-anth-600'
      )}>
      {syncMode ? <Brain size={12} /> : <FlaskConical size={12} />}
      <span className="hidden lg:inline">{syncMode ? 'Sync' : 'Practice'}</span>
    </button>
  );
}

// ── Login Button ───────────────────────────────────────────────────────────────
function LoginButton() {
  const { user, login, logout, setUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [authTab, setAuthTab] = useState<'fusebase' | 'team'>('fusebase');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Restore FuseBase MC session cookie → local auth store
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data?.authenticated && data.email) {
          setUser({
            name: String(data.email).split('@')[0] || 'Member',
            role: 'FuseBase',
            avatar: '🔮',
          });
        }
      })
      .catch(() => {});
  }, [setUser]);

  const doLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    logout();
  };

  const submit = () => {
    if (login(name, pw)) { setOpen(false); setError(''); setName(''); setPw(''); }
    else setError('Invalid credentials');
  };

  if (user) {
    return (
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-forest-700/50 bg-forest-800/30 text-xs text-forest-200 hover:border-forest-600 transition-all">
          <span>{user.avatar}</span>
          <span className="hidden md:inline">{user.name}</span>
          <ChevronDown size={10} />
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-2 w-48 glass-dark border border-border rounded-2xl shadow-panel z-50 p-3 space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <span className="text-xl">{user.avatar}</span>
              <div>
                <p className="text-xs font-semibold text-forest-100">{user.name}</p>
                <p className="text-[10px] text-anth-500">{user.role}</p>
              </div>
            </div>
            <button onClick={doLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-900/20 transition-colors">
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all',
          open ? 'bg-forest-800/40 border-forest-600/50 text-forest-200' : 'bg-anth-800/60 border-anth-700/50 text-anth-400 hover:text-forest-300 hover:border-forest-700/40'
        )}>
        <LogIn size={12} /> <span className="hidden sm:inline">Login</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 glass-dark border border-border rounded-2xl shadow-panel z-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-widest text-anth-500 flex items-center gap-1.5"><User size={10} /> {authTab === 'fusebase' ? 'FuseBase' : 'Team Login'}</p>
            <button onClick={() => setAuthTab(v => v === 'fusebase' ? 'team' : 'fusebase')}
              className="text-[9px] text-anth-500 hover:text-mint-400 transition-colors underline underline-offset-2">
              {authTab === 'fusebase' ? 'Team Login' : 'FuseBase'}
            </button>
          </div>
          {authTab === 'fusebase' ? (
            <FuseBaseAuth onSuccess={() => setOpen(false)} />
          ) : (<>
          <select value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors">
            <option value="">Select your name…</option>
            {EMPLOYEES.map(e => <option key={e.name} value={e.name}>{e.avatar} {e.name}</option>)}
          </select>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Password (default: 0595)"
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors" />
          {error && <p className="text-[10px] text-red-400">{error}</p>}
          <button onClick={submit}
            className="w-full py-2 rounded-xl bg-forest-700/40 border border-forest-600/40 text-xs text-forest-200 font-medium hover:bg-forest-600/40 transition-colors">
            Sign In
          </button>
          </>)}
        </div>
      )}
    </div>
  );
}

// ── Notification Bell ──────────────────────────────────────────────────────────
function NotificationBell() {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;
  const latest = notifications.slice(0, 5);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className={cn('relative p-2 rounded-lg border text-xs transition-all duration-200',
          open ? 'bg-gold/10 border-gold/40 text-gold' : 'bg-anth-800/60 border-anth-700/50 text-anth-400 hover:text-gold hover:border-gold/30'
        )}>
        <Bell size={13} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-anth-900 text-[9px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 glass-dark border border-border rounded-2xl shadow-panel z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-[10px] uppercase tracking-widest text-anth-500">Notifications</span>
            <button onClick={markAllRead} className="text-[10px] text-forest-500 hover:text-forest-300 transition-colors flex items-center gap-1">
              <Check size={10} /> Mark all read
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
            {latest.map(n => {
              const meta = NOTIF_META[n.type];
              return (
                <button key={n.id} onClick={() => markRead(n.id)}
                  className={cn('w-full text-left px-4 py-3 hover:bg-forest-900/20 transition-colors flex gap-3',
                    !n.read && 'bg-forest-900/10'
                  )}>
                  <span className="text-base shrink-0 mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs font-medium truncate', n.read ? 'text-anth-400' : 'text-forest-100')}>{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
                    </div>
                    <p className="text-[10px] text-anth-500 truncate mt-0.5">{n.body}</p>
                    <p className={cn('text-[9px] mt-1', meta.color)}>{timeAgo(n.timestamp)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 p-2">
            <button onClick={() => { router.push('/dashboard/updates'); setOpen(false); }}
              className="w-full py-2 rounded-xl text-[10px] text-forest-400 hover:text-forest-200 hover:bg-forest-800/30 transition-colors flex items-center justify-center gap-1.5">
              <ExternalLink size={10} /> View All Updates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Focus Popover ──────────────────────────────────────────────────────────────
function FocusPopover() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { dailyTasks, setDailyTask, dailyTaskDone, setDailyTaskDone,
    pomodoroMode, pomodoroRunning, pomodoroSeconds, pomodoroRound,
    togglePomodoro, tickPomodoro, resetPomodoro, advancePomodoro, todayNote, setTodayNote } = useFocusStore();
  const { addEntry } = useNotebookStore();
  const { addQuickNote } = useNeuralNotebookStore();
  const {
    setPauseFullscreen,
    breakAccepted, setBreakEndedPrompt,
    workTracks, selectedWorkTrackId,
    breakTracks, selectedBreakTrackId,
    musicMuted, setMusicMuted, musicVolume, setMusicVolume,
    musicCurrentTime, musicDuration, setSeekTarget,
  } = useUIExtStore();

  const selectedWorkTrack  = workTracks.find(t => t.id === selectedWorkTrackId)   ?? null;
  const selectedBreakTrack = breakTracks.find(t => t.id === selectedBreakTrackId) ?? null;
  // Show context-appropriate track name
  const activeTrack = (pomodoroMode === 'focus') ? selectedWorkTrack : selectedBreakTrack;

  const prevModeRef = useRef(pomodoroMode);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const id = setInterval(() => {
      useFocusStore.getState().tickPomodoro();
    }, 1000);
    return () => clearInterval(id);
  }, [pomodoroRunning]);

  useEffect(() => {
    if (pomodoroSeconds !== 0 || pomodoroRunning) return;
    playGong();

    if (pomodoroMode === 'focus') {
      // ── Focus ended → open pause overlay, advance to break phase ──
      setPauseFullscreen(true);
      advancePomodoro();
      // Break timer does NOT auto-start — user must click "Pause annehmen" first
    } else {
      // ── Break / deep-recovery ended ──
      // If the user "accepted" the break (full-screen overlay is open),
      // show the "Weiter / Genießen" choice instead of auto-advancing.
      const uiSnap = useUIExtStore.getState();
      if (uiSnap.breakAccepted && uiSnap.pauseFullscreen) {
        uiSnap.setBreakEndedPrompt(true);
        // Music/video keep playing — handled by break audio effect in TopBar
      } else {
        // Overlay wasn't open (user had dismissed it early) → just advance silently
        advancePomodoro();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroSeconds, pomodoroRunning, pomodoroMode]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const style = POMO_STYLES[pomodoroMode];
  const pct = ((POMO_DURATIONS[pomodoroMode] - pomodoroSeconds) / POMO_DURATIONS[pomodoroMode]) * 100;

  const submitNote = () => {
    if (!todayNote.trim()) return;
    const now = new Date().toISOString();
    addEntry({ id:`note-${Date.now()}`, date:now.split('T')[0], goals:[], journal:todayNote.trim(), teamLogs:[], createdAt:now, updatedAt:now });
    addQuickNote(todayNote.trim());
    setTodayNote('');
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200',
          open ? 'bg-mint-500/10 border-mint-500/40 text-mint-500' : 'bg-anth-800/60 border-anth-700/50 text-anth-400 hover:text-mint-500 hover:border-mint-500/30'
        )}>
        <Eye size={13} />
        <span className="hidden sm:inline">Fokus-Time</span>
        {pomodoroRunning && <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 glass-dark border border-border rounded-2xl shadow-panel z-50 p-4 space-y-4">
          {/* Tasks */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-anth-500 mb-2 flex items-center gap-1.5">
              <CheckSquare size={10} /> Daily Focus Tasks
            </p>
            <div className="space-y-1.5">
              {([0,1,2] as const).map((i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* Checkbox */}
                  <button
                    onClick={() => {
                      const newVal = !dailyTaskDone[i];
                      setDailyTaskDone(i, newVal);
                      // Also sync to NeuralNotebook if task text exists
                      if (dailyTasks[i].trim()) {
                        const { goals, updateGoal } = useNeuralNotebookStore.getState();
                        const match = goals.find(g => g.folder === 'tägliche' && g.text === dailyTasks[i].trim());
                        if (match) updateGoal(match.id, { completed: newVal });
                      }
                    }}
                    className={cn(
                      'w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all',
                      dailyTaskDone[i]
                        ? 'bg-mint-500/30 border-mint-500'
                        : 'border-anth-600 hover:border-mint-500/50'
                    )}>
                    {dailyTaskDone[i] && <Check size={10} className="text-mint-400" />}
                  </button>
                  {/* Input */}
                  <input
                    value={dailyTasks[i]}
                    onChange={e => {
                      setDailyTask(i, e.target.value);
                      if (dailyTaskDone[i]) setDailyTaskDone(i, false); // uncheck when editing
                    }}
                    onBlur={() => {
                      // Sync to NeuralNotebook on blur
                      const text = dailyTasks[i].trim();
                      if (!text) return;
                      const { goals, addGoal } = useNeuralNotebookStore.getState();
                      const exists = goals.some(g => g.folder === 'tägliche' && g.text === text);
                      if (!exists) addGoal(text, 'tägliche');
                    }}
                    placeholder={`${t('Aufgabe')} ${i+1}…`}
                    className={cn(
                      'flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs placeholder-anth-500 outline-none focus:border-mint-500/50 transition-colors',
                      dailyTaskDone[i] ? 'line-through text-anth-500' : 'text-forest-100'
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pomodoro */}
          <div className={cn('rounded-xl border p-3', style.bg)}>
            <div className="flex items-center justify-between mb-2">
              <p className={cn('text-[9px] uppercase tracking-widest font-semibold flex items-center gap-1', style.color)}>
                <Timer size={10} /> Pomodoro · R{pomodoroRound+1}/2
              </p>
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md border', style.bg, style.color)}>{style.label}</span>
            </div>
            <div className="h-1 bg-anth-700/50 rounded-full mb-2 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-1000',
                pomodoroMode==='focus'?'bg-mint-500':pomodoroMode==='break'?'bg-gold':'bg-violet-500')}
                style={{ width:`${pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className={cn('text-2xl font-mono font-bold tabular-nums', style.color)}>{formatTime(pomodoroSeconds)}</span>
              <div className="flex gap-1">
                <button onClick={togglePomodoro} className={cn('p-1.5 rounded-lg border transition-colors', style.bg, style.color, 'hover:opacity-80')}>
                  {pomodoroRunning ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button onClick={resetPomodoro} className="p-1.5 rounded-lg text-anth-500 hover:text-anth-300 transition-colors"><RotateCcw size={12} /></button>
                <button onClick={() => { playGong(); advancePomodoro(); }} className="p-1.5 rounded-lg text-anth-500 hover:text-anth-300 transition-colors"><SkipForward size={12} /></button>
              </div>
            </div>
          </div>

          {/* Musik — Lautstärke, Mute & Progress */}
          <div className="rounded-xl border border-border/60 bg-anth-900/40 p-2.5 space-y-2">
            {/* Track name row */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMusicMuted(!musicMuted)}
                className="shrink-0 hover:opacity-80 transition-opacity"
                title={musicMuted ? t('Musik an') : t('Musik stumm')}
              >
                {musicMuted
                  ? <VolumeX size={13} className="text-anth-500" />
                  : <Volume2 size={13} className={pomodoroRunning ? 'text-mint-400 animate-pulse' : 'text-anth-400'} />
                }
              </button>
              {activeTrack
                ? <p className="text-[10px] text-anth-300 truncate flex-1">{activeTrack.name}</p>
                : <p className="text-[10px] text-anth-600 flex-1 italic">
                    {pomodoroMode === 'focus' ? t('Kein Fokus-Track') : t('Kein Pause-Track')}
                  </p>
              }
              {activeTrack && (
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md border shrink-0',
                  pomodoroRunning
                    ? pomodoroMode === 'focus'
                      ? 'bg-mint-500/10 border-mint-500/30 text-mint-400'
                      : 'bg-gold/10 border-gold/30 text-gold'
                    : 'bg-anth-800/50 border-anth-700/40 text-anth-600'
                )}>
                  {pomodoroRunning ? t('▶ läuft') : t('⏸ pausiert')}
                </span>
              )}
            </div>
            {/* Volume slider */}
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={1} step={0.05}
                value={musicMuted ? 0 : musicVolume}
                onChange={e => { setMusicVolume(Number(e.target.value)); setMusicMuted(false); }}
                className="flex-1 h-1 accent-mint-500 cursor-pointer"
              />
              <span className="text-[9px] text-anth-600 tabular-nums w-7 text-right">
                {musicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}
              </span>
            </div>
            {/* Progress + seek bar */}
            {musicDuration > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={musicDuration} step={0.5}
                  value={musicCurrentTime}
                  onChange={e => setSeekTarget(Number(e.target.value))}
                  className="flex-1 h-1 accent-mint-400/70 cursor-pointer"
                />
                <span className="text-[9px] text-anth-700 tabular-nums shrink-0">
                  {formatTime(Math.floor(musicCurrentTime))}/{formatTime(Math.floor(musicDuration))}
                </span>
              </div>
            )}
          </div>

          {/* Today's Note */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-anth-500 mb-1.5 flex items-center gap-1.5"><StickyNote size={10} /> Today's Note → Notebook</p>
            <div className="flex gap-1.5">
              <textarea value={todayNote} onChange={e => setTodayNote(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); submitNote(); } }}
                placeholder="Quick thought…" rows={2}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs text-forest-100 placeholder-anth-500 outline-none focus:border-mint-500/50 resize-none transition-colors" />
              <button onClick={submitNote} className="px-2 py-1 rounded-lg bg-mint-500/15 border border-mint-500/30 text-mint-500 hover:bg-mint-500/25 transition-colors text-xs">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Temporal Hub ───────────────────────────────────────────────────────────────
const CAL_PALETTE = ['#8b5cf6','#11CAA0','#f59e0b','#ef4444','#3b82f6','#ec4899','#f97316','#14b8a6','#84cc16','#06b6d4'];
const PROVIDER_ICONS: Record<string, string> = { google: '🔵', apple: '🍎', outlook: '🟦', ical: '📅', local: '📍' };

/** Einfacher ICS-Parser: liefert {date:'YYYY-MM-DD', title, startTime?} pro VEVENT. */
function parseIcs(text: string): { date: string; title: string; startTime?: string }[] {
  // Zeilen-Unfolding (RFC 5545): Fortsetzungszeilen beginnen mit Space/Tab
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const out: { date: string; title: string; startTime?: string }[] = [];
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0];
    const dt = body.match(/DTSTART[^:]*:(\d{8})(T(\d{2})(\d{2})\d{2}Z?)?/);
    const sm = body.match(/SUMMARY[^:]*:(.*)/);
    if (!dt) continue;
    const d = dt[1];
    const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const title = (sm?.[1] ?? 'Termin').replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
    out.push({ date, title, startTime: dt[3] ? `${dt[3]}:${dt[4]}` : undefined });
  }
  return out;
}

function TemporalHub() {
  const t = useT();
  const [open, setOpen]               = useState(false);
  const [showCalMgr, setShowCalMgr]   = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showAddCal, setShowAddCal]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ── New-event form state ─────────────────────────────────────────────────────
  const _todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [evTitle, setEvTitle] = useState('');
  const [evDate,  setEvDate]  = useState(_todayStr);
  const [evStart, setEvStart] = useState('');
  const [evEnd,   setEvEnd]   = useState('');
  const [evCalId, setEvCalId] = useState('');
  const [evNotes, setEvNotes] = useState('');

  // ── New-calendar form state ──────────────────────────────────────────────────
  const [newProvider, setNewProvider] = useState<'google'|'apple'|'outlook'|'ical'|'local'>('local');
  const [newCalName,  setNewCalName]  = useState('');
  const [newCalUrl,   setNewCalUrl]   = useState('');
  const [newCalColor, setNewCalColor] = useState('#8b5cf6');
  const [newCalType,  setNewCalType]  = useState<'private'|'association'>('private');

  const {
    calendars, events: calEvents, quickInput,
    addCalendar, removeCalendar, toggleCalendar,
    addEvent, removeEvent, setQuickInput,
  } = useTemporalStore();

  // Termine aus verknüpften externen Kalendern (ICS-Feeds), pro Kalender-ID
  const [remoteEvents, setRemoteEvents] = useState<Record<string, { date: string; title: string; startTime?: string }[]>>({});
  useEffect(() => {
    if (!open) return;
    const withUrl = calendars.filter(c => c.url && c.url.trim());
    withUrl.forEach(cal => {
      fetch(`/api/ical?url=${encodeURIComponent(cal.url)}`)
        .then(r => (r.ok ? r.text() : Promise.reject()))
        .then(text => setRemoteEvents(prev => ({ ...prev, [cal.id]: parseIcs(text) })))
        .catch(() => { /* Feed nicht erreichbar — lokale Termine bleiben */ });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, calendars.map(c => c.id + c.url).join('|')]);

  const MONTH_NAMES_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

  // ── Month navigation ─────────────────────────────────────────────────────────
  const prevMonth = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };
  const goToday   = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  // Outside-click close
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Reset add-cal form when sidebar closes
  useEffect(() => { if (!showCalMgr) { setShowAddCal(false); setNewCalName(''); setNewCalUrl(''); } }, [showCalMgr]);

  // ── Grid calculations (Mon-first) ────────────────────────────────────────────
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMon = new Date(viewYear, viewMonth, 0).getDate();
  const rawFirstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const moOffset      = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

  type Cell = { day: number; month: 'prev'|'cur'|'next' };
  const cells: Cell[] = [];
  for (let i = 0; i < moOffset; i++) cells.push({ day: daysInPrevMon - moOffset + 1 + i, month: 'prev' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: 'cur' });
  let _nd = 1;
  while (cells.length < 42) cells.push({ day: _nd++, month: 'next' });

  // ── Events lookup from store ─────────────────────────────────────────────────
  const getEventsForDay = (year: number, month: number, day: number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const activeCals = new Set(calendars.filter(c => c.visible).map(c => c.id));
    const local = (calEvents ?? [])
      .filter(ev => ev.date === ds && activeCals.has(ev.calendarId))
      .map(ev => ({ ...ev, color: calendars.find(c => c.id === ev.calendarId)?.color ?? '#8b5cf6', remote: false }));
    const remote = calendars
      .filter(c => c.visible && remoteEvents[c.id])
      .flatMap(c => remoteEvents[c.id]
        .filter(ev => ev.date === ds)
        .map((ev, i) => ({
          id: `remote-${c.id}-${ds}-${i}`,
          title: ev.title, calendarId: c.id, date: ev.date, startTime: ev.startTime,
          color: c.color, remote: true,
        })));
    return [...local, ...remote];
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openNewEvent = (dateStr?: string) => {
    setEvDate(dateStr ?? _todayStr);
    setEvCalId('');
    setEvTitle(''); setEvStart(''); setEvEnd(''); setEvNotes('');
    setShowNewEvent(true);
    setShowCalMgr(false);
  };

  const submitEvent = () => {
    if (!evTitle.trim()) return;
    addEvent({
      title: evTitle.trim(),
      calendarId: evCalId || calendars[0]?.id || 'priv-default',
      date: evDate || _todayStr,
      startTime: evStart || undefined,
      endTime:   evEnd   || undefined,
      notes:     evNotes || undefined,
    });
    setEvTitle(''); setEvStart(''); setEvEnd(''); setEvNotes('');
    setShowNewEvent(false);
  };

  const submitQuickAdd = () => {
    if (!quickInput.trim()) return;
    addEvent({ title: quickInput.trim(), calendarId: calendars[0]?.id || 'priv-default', date: _todayStr });
    setQuickInput('');
  };

  const submitAddCal = () => {
    if (!newCalName.trim()) return;
    addCalendar({ name: newCalName.trim(), url: newCalUrl.trim(), provider: newProvider, type: newCalType, color: newCalColor });
    setNewCalName(''); setNewCalUrl(''); setShowAddCal(false);
  };

  return (
    <div className="relative" ref={ref}>
      {/* ── Trigger ── */}
      <button onClick={() => setOpen(v => !v)} title={t('Kalender')}
        className={cn('p-2 rounded-lg border text-xs transition-all duration-200',
          open ? 'bg-violet-900/20 border-violet-700/40 text-violet-300'
               : 'bg-anth-800/60 border-anth-700/50 text-anth-400 hover:text-violet-300 hover:border-violet-700/30'
        )}>
        <CalendarDays size={13} />
      </button>

      {open && (
        <div className="fixed right-3 top-[52px] z-50 flex flex-col rounded-2xl border border-border/70 overflow-hidden"
          style={{
            width: 'min(92vw, 1760px)', minWidth: 760,
            height: 'calc(100vh - 68px)',
            maxHeight: 'calc(100vh - 68px)',
            background: 'rgba(10,16,12,0.97)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.8)',
          }}>

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50 shrink-0"
            style={{ background: 'rgba(10,18,13,0.9)' }}>
            <h2 className="text-xl font-bold text-white tracking-tight" style={{ minWidth: 185 }}>
              {t(MONTH_NAMES_DE[viewMonth])} {viewYear}
            </h2>
            <div className="flex items-center gap-0.5">
              <button onClick={prevMonth} className="w-7 h-7 rounded-lg text-anth-300 hover:text-white hover:bg-anth-700/60 transition-all flex items-center justify-center text-lg">‹</button>
              <button onClick={nextMonth} className="w-7 h-7 rounded-lg text-anth-300 hover:text-white hover:bg-anth-700/60 transition-all flex items-center justify-center text-lg">›</button>
            </div>
            <button onClick={goToday} className="px-3 py-1 rounded-xl border border-anth-600/50 text-xs text-anth-300 hover:text-white hover:border-anth-400 transition-all">
              {t('Heute')}
            </button>
            <div className="flex-1" />

            {/* + Termin */}
            <button onClick={() => openNewEvent()}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all',
                showNewEvent
                  ? 'border-forest-600/50 bg-forest-900/30 text-forest-200'
                  : 'border-anth-700/40 text-anth-400 hover:text-forest-200 hover:border-forest-700/40'
              )}>
              <Plus size={12} /> {t('Termin')}
            </button>

            {/* Kalender Manager */}
            <button onClick={() => { setShowCalMgr(v => !v); setShowNewEvent(false); }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all',
                showCalMgr
                  ? 'border-violet-600/50 bg-violet-900/20 text-violet-300'
                  : 'border-anth-700/40 text-anth-400 hover:text-violet-300 hover:border-violet-700/40'
              )}>
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              {t('Kalender')}
            </button>

            {/* Close */}
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-xl text-anth-500 hover:text-white hover:bg-anth-700/50 transition-all flex items-center justify-center">
              <X size={14} />
            </button>
          </div>

          {/* ── Main area ── */}
          <div className="flex flex-1 min-h-0 relative">

            {/* Calendar grid column */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border/40 shrink-0" style={{ background: 'rgba(8,14,10,0.8)' }}>
                {['Mo','Di','Mi','Do','Fr','Sa','So'].map((d, i) => (
                  <div key={d} className={cn('py-2 text-center text-xs font-semibold tracking-wide', i >= 5 ? 'text-anth-600' : 'text-anth-400')}>{t(d)}</div>
                ))}
              </div>

              {/* Grid 6×7 */}
              <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-6 gap-1 p-1.5 overflow-hidden">
                {cells.map((cell, idx) => {
                  const isCur = cell.month === 'cur';
                  const isToday = isCur && cell.day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                  const evs = isCur ? getEventsForDay(viewYear, viewMonth, cell.day) : [];
                  const isWeekend = idx % 7 >= 5;
                  const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;

                  return (
                    <div key={idx}
                      onClick={() => isCur && openNewEvent(dateStr)}
                      className={cn(
                        'flex flex-col p-1.5 overflow-hidden transition-colors select-none rounded-xl border',
                        isToday
                          ? 'border-violet-500/70 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                          : isCur ? 'border-forest-600/60 hover:border-mint-500/70' : 'border-forest-800/30',
                        isCur
                          ? isWeekend ? 'bg-anth-950/40 hover:bg-anth-800/30 cursor-pointer' : 'bg-anth-900/20 hover:bg-anth-900/50 cursor-pointer'
                          : 'bg-anth-950/70 cursor-default',
                      )}>
                      {/* Day number */}
                      <div className="flex items-start justify-end mb-0.5 shrink-0">
                        {isToday ? (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6d28d9' }}>{cell.day}</span>
                        ) : (
                          <span className={cn('text-xs font-semibold px-0.5', isCur ? isWeekend ? 'text-anth-500' : 'text-anth-200' : 'text-anth-700')}>{cell.day}</span>
                        )}
                      </div>
                      {/* Event pills */}
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {evs.slice(0, 3).map((ev, ei) => (
                          <div key={ei} onClick={e => { e.stopPropagation(); if (!(ev as { remote?: boolean }).remote) removeEvent(ev.id); }}
                            title={`${ev.title}${ev.startTime ? ' · ' + ev.startTime : ''}${(ev as { remote?: boolean }).remote ? '' : ' — ' + t('klicken zum Löschen')}`}
                            className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium truncate leading-tight cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ background: ev.color+'28', color: ev.color, border: `1px solid ${ev.color}50` }}>
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: ev.color }} />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <span className="text-[9px] text-anth-500 pl-0.5">+{evs.length - 3} {t('mehr')}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Calendar Manager sidebar ── */}
            {showCalMgr && (
              <div className="w-60 border-l border-border/40 flex flex-col overflow-hidden shrink-0"
                style={{ background: 'rgba(8,14,10,0.95)' }}>
                <div className="px-4 py-3 border-b border-border/40">
                  <p className="text-[10px] uppercase tracking-widest text-anth-500 font-semibold">{t('Meine Kalender')}</p>
                </div>

                {/* Calendar list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {calendars.map(cal => (
                    <div key={cal.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 hover:border-border/70 bg-surface/30 group transition-colors">
                      <button onClick={() => toggleCalendar(cal.id)} className="shrink-0" title={cal.visible ? t('Ausblenden') : t('Einblenden')}>
                        <div className={cn('w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all',
                          cal.visible ? '' : 'opacity-30'
                        )} style={{ borderColor: cal.color, backgroundColor: cal.visible ? cal.color : 'transparent' }}>
                          {cal.visible && <Check size={8} className="text-black" />}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-anth-200 truncate">{cal.name}</p>
                        <p className="text-[9px] text-anth-600">{PROVIDER_ICONS[cal.provider ?? 'local']} {cal.provider ?? 'local'}</p>
                      </div>
                      {!['assoc-default','priv-default'].includes(cal.id) && (
                        <button onClick={() => removeCalendar(cal.id)}
                          className="opacity-0 group-hover:opacity-100 text-anth-600 hover:text-red-400 transition-all shrink-0">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add calendar */}
                <div className="border-t border-border/40 p-3 space-y-2">
                  {!showAddCal ? (
                    <button onClick={() => setShowAddCal(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-anth-700/50 text-xs text-anth-500 hover:text-forest-300 hover:border-forest-700/50 transition-colors">
                      <Plus size={12} /> {t('Kalender verbinden')}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {/* Provider selector */}
                      <div className="grid grid-cols-4 gap-1">
                        {(['google','apple','outlook','ical','local'] as const).map(p => (
                          <button key={p} onClick={() => setNewProvider(p)}
                            className={cn('flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[10px] transition-all',
                              newProvider === p
                                ? 'border-forest-600/50 bg-forest-900/30 text-forest-200'
                                : 'border-anth-700/40 text-anth-500 hover:border-anth-600/40 hover:text-anth-300'
                            )}>
                            <span className="text-sm">{PROVIDER_ICONS[p]}</span>
                            <span>{p === 'ical' ? 'iCal' : p === 'local' ? t('Lokal') : p === 'google' ? 'Google' : p === 'outlook' ? 'Outlook' : 'Apple'}</span>
                          </button>
                        ))}
                      </div>

                      {/* Google instructions */}
                      {newProvider === 'google' && (
                        <div className="space-y-1.5 p-2 rounded-lg bg-blue-950/30 border border-blue-800/30">
                          <button onClick={() => window.open('https://calendar.google.com/calendar/r/settings', '_blank')}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-700/40 bg-blue-900/20 text-blue-300 text-[11px] hover:bg-blue-900/30 transition-colors">
                            <ExternalLink size={10} /> {t('Google Kalender Einstellungen öffnen')}
                          </button>
                          <p className="text-[10px] text-anth-600 leading-snug">{t('Einstellungen → Kalender wählen → Abschnitt «Kalenderadresse» → iCal-Symbol → URL kopieren')}</p>
                        </div>
                      )}

                      {/* Apple instructions */}
                      {newProvider === 'apple' && (
                        <div className="space-y-1.5 p-2 rounded-lg bg-anth-900/30 border border-anth-700/30">
                          <button onClick={() => window.open('https://www.icloud.com/calendar', '_blank')}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-anth-600/40 bg-anth-800/30 text-anth-300 text-[11px] hover:bg-anth-700/30 transition-colors">
                            <ExternalLink size={10} /> {t('iCloud Kalender öffnen')}
                          </button>
                          <p className="text-[10px] text-anth-600 leading-snug">{t('Kalender → ··· → "Kalender teilen" → "Öffentlicher Kalender" → URL kopieren')}</p>
                        </div>
                      )}

                      {/* iCal URL field */}
                      {newProvider !== 'local' && (
                        <input value={newCalUrl} onChange={e => setNewCalUrl(e.target.value)}
                          placeholder={newProvider === 'google' ? 'https://calendar.google.com/calendar/ical/…' : newProvider === 'apple' ? 'webcal://p…' : newProvider === 'outlook' ? 'https://outlook.live.com/owa/calendar/…/calendar.ics' : 'https://…'}
                          className="w-full bg-anth-900/60 border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors" />
                      )}

                      {/* Name */}
                      <input value={newCalName} onChange={e => setNewCalName(e.target.value)}
                        placeholder={t('Kalender-Name…')}
                        className="w-full bg-anth-900/60 border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors" />

                      {/* Color picker */}
                      <div className="flex gap-1 flex-wrap">
                        {CAL_PALETTE.map(col => (
                          <button key={col} onClick={() => setNewCalColor(col)}
                            className={cn('w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                              newCalColor === col ? 'border-white scale-110' : 'border-transparent'
                            )} style={{ background: col }} />
                        ))}
                      </div>

                      {/* Type */}
                      <select value={newCalType} onChange={e => setNewCalType(e.target.value as 'private'|'association')}
                        className="w-full bg-anth-900/60 border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 outline-none">
                        <option value="private">{t('Privat')}</option>
                        <option value="association">{t('Verein')}</option>
                      </select>

                      <div className="flex gap-1.5">
                        <button onClick={submitAddCal}
                          className="flex-1 py-1.5 rounded-lg bg-forest-700/40 border border-forest-600/40 text-[11px] text-forest-200 hover:bg-forest-600/40 transition-colors">
                          {t('Hinzufügen')}
                        </button>
                        <button onClick={() => setShowAddCal(false)}
                          className="px-3 py-1.5 rounded-lg text-[11px] text-anth-500 hover:text-anth-300 transition-colors">
                          {t('Abbrechen')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── New Event overlay ── */}
            {showNewEvent && (
              <div className="absolute inset-0 z-10 flex flex-col p-5 overflow-y-auto"
                style={{ background: 'rgba(8,12,10,0.98)', backdropFilter: 'blur(4px)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Plus size={16} className="text-forest-400" /> {t('Neuer Termin')}
                  </h3>
                  <button onClick={() => setShowNewEvent(false)}
                    className="w-7 h-7 rounded-xl text-anth-500 hover:text-white hover:bg-anth-700/50 transition-all flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3 max-w-xl mx-auto w-full">
                  {/* Title */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-anth-500 mb-1 block">{t('Titel *')}</label>
                    <input value={evTitle} onChange={e => setEvTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitEvent()}
                      placeholder={t('Terminname…')} autoFocus
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors" />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-anth-500 mb-1 block">{t('Datum')}</label>
                    <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-forest-100 outline-none focus:border-forest-600 transition-colors" />
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-anth-500 mb-1 block">{t('Von')}</label>
                      <input type="time" value={evStart} onChange={e => setEvStart(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-forest-100 outline-none focus:border-forest-600 transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-anth-500 mb-1 block">{t('Bis')}</label>
                      <input type="time" value={evEnd} onChange={e => setEvEnd(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-forest-100 outline-none focus:border-forest-600 transition-colors" />
                    </div>
                  </div>

                  {/* Calendar */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-anth-500 mb-1 block">{t('Kalender')}</label>
                    <select value={evCalId || calendars[0]?.id || ''} onChange={e => setEvCalId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-forest-100 outline-none focus:border-forest-600 transition-colors">
                      {calendars.map(cal => (
                        <option key={cal.id} value={cal.id}>{cal.name}</option>
                      ))}
                    </select>
                    {/* Calendar color preview */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {calendars.map(cal => (
                        <button key={cal.id} onClick={() => setEvCalId(cal.id)}
                          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all',
                            (evCalId === cal.id || (!evCalId && calendars[0]?.id === cal.id))
                              ? 'border-white/30 bg-white/10'
                              : 'border-transparent hover:border-white/10'
                          )}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cal.color }} />
                          <span className="text-anth-200">{cal.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-anth-500 mb-1 block">{t('Notizen')}</label>
                    <textarea value={evNotes} onChange={e => setEvNotes(e.target.value)}
                      placeholder={t('Optionale Notizen…')} rows={3}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 resize-none transition-colors" />
                  </div>

                  {/* Submit */}
                  <button onClick={submitEvent}
                    disabled={!evTitle.trim()}
                    className="w-full py-3 rounded-xl bg-forest-700/50 border border-forest-600/50 text-sm text-forest-100 font-medium hover:bg-forest-600/50 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {t('Termin speichern')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Quick-Add footer ── */}
          <div className="border-t border-border/40 px-5 py-3 shrink-0 flex gap-3"
            style={{ background: 'rgba(8,14,10,0.9)' }}>
            <input value={quickInput} onChange={e => setQuickInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitQuickAdd()}
              placeholder={t('Schnell-Termin: z.B. Meeting morgen 10 Uhr…')}
              className="flex-1 bg-anth-900/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-anth-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors" />
            <button onClick={submitQuickAdd}
              className="px-5 py-2.5 rounded-xl bg-forest-700/40 border border-forest-600/40 text-sm text-forest-200 hover:bg-forest-600/40 hover:text-white transition-all">
              + {t('Termin')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TopBar ─────────────────────────────────────────────────────────────────────
export function TopBar() {
  const t = useT();
  const pathname = usePathname();
  const { toggle } = useNotebookStore();
  const { agents } = useAgentStore();
  const { pomodoroRunning, pomodoroMode, pomodoroSeconds, togglePomodoro } = useFocusStore();
  const {
    pauseFullscreen, setPauseFullscreen,
    breakAccepted, setBreakAccepted,
    breakEndedPrompt, setBreakEndedPrompt,
    meditationBg,
    breakTracks, selectedBreakTrackId,
    workTracks, selectedWorkTrackId,
    musicMuted, setMusicMuted,
    musicVolume, setMusicVolume,
    customVideos, selectedCustomVideoId,
    musicCurrentTime, musicDuration,
    seekTarget, setMusicProgress, setSeekTarget,
  } = useUIExtStore();

  const breakAudioRef = useRef<HTMLAudioElement>(null);
  const workAudioRef  = useRef<HTMLAudioElement>(null);
  const selectedBreakTrack  = breakTracks.find(t => t.id === selectedBreakTrackId)     ?? null;
  const selectedWorkTrack   = workTracks.find(t => t.id === selectedWorkTrackId)        ?? null;
  const selectedCustomVideo = customVideos.find(v => v.id === selectedCustomVideoId)    ?? null;

  // ── Load work track when selection changes ────────────────────────────────
  useEffect(() => {
    const el = workAudioRef.current;
    if (!el) return;
    if (selectedWorkTrack) {
      el.src = selectedWorkTrack.dataUrl;
      el.load();
    } else {
      el.pause();
      el.src = '';
    }
  }, [selectedWorkTrack?.id]);

  // ── Apply mute/volume to both audio elements whenever store values change ──
  useEffect(() => {
    [workAudioRef.current, breakAudioRef.current].forEach(el => {
      if (!el) return;
      el.muted  = musicMuted;
      el.volume = musicMuted ? 0 : musicVolume;
    });
  }, [musicMuted, musicVolume]);

  // ── Auto-play work music when focus timer is running ──────────────────────
  useEffect(() => {
    const el = workAudioRef.current;
    if (!el) return;
    if (pomodoroRunning && pomodoroMode === 'focus' && selectedWorkTrack) {
      el.loop   = true;
      el.muted  = musicMuted;
      el.volume = musicMuted ? 0 : musicVolume;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [pomodoroRunning, pomodoroMode, selectedWorkTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-play break/deep-recovery music ──────────────────────────────────
  useEffect(() => {
    const el = breakAudioRef.current;
    if (!el) return;
    const isPauseMode = pomodoroMode === 'break' || pomodoroMode === 'deep-recovery';
    if (pomodoroRunning && isPauseMode && selectedBreakTrack) {
      // Timer running → start/continue break music
      el.src    = selectedBreakTrack.dataUrl;
      el.load();
      el.loop   = true;
      el.muted  = musicMuted;
      el.volume = musicMuted ? 0 : musicVolume;
      el.play().catch(() => {});
    } else if (!pomodoroRunning && breakEndedPrompt) {
      // Timer just ended, showing "Weiter/Genießen" buttons → keep music playing (don't pause)
      el.muted  = musicMuted;
      el.volume = musicMuted ? 0 : musicVolume;
      // el is already playing from the previous running phase — leave it as-is
    } else if (!isPauseMode) {
      // Switched to focus mode → stop break music
      el.pause();
      el.src = '';
    }
    // else: pomodoroRunning=false, no breakEndedPrompt, isPauseMode → timer was reset/stopped by user → pause
    else {
      el.pause();
    }
  }, [pomodoroRunning, pomodoroMode, selectedBreakTrack?.id, breakEndedPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Music progress tracking (timeupdate → store, throttled to 1 Hz) ────────
  // timeupdate fires up to 10×/sec; throttle to avoid excessive React re-renders.
  useEffect(() => {
    const workEl  = workAudioRef.current;
    const breakEl = breakAudioRef.current;
    let lastTick = 0;
    const throttle = (fn: () => void) => {
      const now = Date.now();
      if (now - lastTick >= 1000) { lastTick = now; fn(); }
    };
    const onWork  = () => throttle(() => { if (workEl)  setMusicProgress(workEl.currentTime,  workEl.duration  || 0); });
    const onBreak = () => throttle(() => { if (breakEl) setMusicProgress(breakEl.currentTime, breakEl.duration || 0); });
    workEl?.addEventListener('timeupdate',  onWork);
    breakEl?.addEventListener('timeupdate', onBreak);
    return () => {
      workEl?.removeEventListener('timeupdate',  onWork);
      breakEl?.removeEventListener('timeupdate', onBreak);
    };
  }, [setMusicProgress]);

  // ── Seek: apply seekTarget to the active audio element ───────────────────
  useEffect(() => {
    if (seekTarget === null) return;
    const el = pomodoroMode === 'focus' ? workAudioRef.current : breakAudioRef.current;
    if (el) el.currentTime = seekTarget;
    setSeekTarget(null);
  }, [seekTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start break/deep-rest timer the moment user clicks "Pause annehmen" ──
  // Guard: don't auto-start when breakEndedPrompt is active (timer reset for snooze handled elsewhere)
  useEffect(() => {
    const isPause = pomodoroMode === 'break' || pomodoroMode === 'deep-recovery';
    if (breakAccepted && pauseFullscreen && isPause && !pomodoroRunning && !breakEndedPrompt) {
      togglePomodoro();
    }
  }, [breakAccepted, pauseFullscreen, pomodoroMode, breakEndedPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  let page = PAGE_TITLES[pathname];
  if (!page && pathname.startsWith('/dashboard/agents/')) {
    const agentId = pathname.split('/').pop() ?? '';
    const agent = agents.find(a => a.id === agentId);
    page = { title: agent?.displayName ?? 'Agent Chat', subtitle: `${agent?.model ?? 'AI'} · Direct Interface` };
  }
  page ??= { title: 'TRINITY OS', subtitle: 'Powered by YOU ARE NEO' };
  const onlineAgents = agents.filter(a => a.status === 'online');

  // Meditation BG videos
  const BG_SOURCES: Record<string, string> = {
    forest:  'https://www.youtube.com/embed/xNN7iTA57jM?autoplay=1&mute=1&loop=1&controls=0&playlist=xNN7iTA57jM',
    ocean:   'https://www.youtube.com/embed/bn9F19Hi1Lk?autoplay=1&mute=1&loop=1&controls=0&playlist=bn9F19Hi1Lk',
    rain:    'https://www.youtube.com/embed/mPZkdNFkNps?autoplay=1&mute=1&loop=1&controls=0&playlist=mPZkdNFkNps',
    cosmos:  'https://www.youtube.com/embed/Xb7-VxD4Uag?autoplay=1&mute=1&loop=1&controls=0&playlist=Xb7-VxD4Uag',
    fire:    'https://www.youtube.com/embed/L_LUpnjgPso?autoplay=1&mute=1&loop=1&controls=0&playlist=L_LUpnjgPso',
    morning: 'https://www.youtube.com/embed/V1RPi2MYptM?autoplay=1&mute=1&loop=1&controls=0&playlist=V1RPi2MYptM',
  };

  return (
    <>
      {/* Hidden audio elements — managed by timer logic */}
      <audio ref={breakAudioRef} />
      <audio ref={workAudioRef} />

      {pauseFullscreen && (
        <div className="fixed inset-0 z-[200] overflow-hidden bg-black">
          {/* ── Full-screen background video (custom upload takes priority) ── */}
          {selectedCustomVideo ? (
            <video
              key={selectedCustomVideo.id}
              src={selectedCustomVideo.dataUrl}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scale(1.05)' }}
              autoPlay loop muted playsInline
            />
          ) : (
            <iframe
              src={BG_SOURCES[meditationBg] ?? BG_SOURCES.forest}
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'scale(1.05)', objectFit: 'cover' }}
              allow="autoplay"
            />
          )}

          {/* Subtle dark vignette so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* X close button — top-right */}
          <button onClick={() => setPauseFullscreen(false)}
            className="absolute top-5 right-5 p-2.5 rounded-xl bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-all z-20 backdrop-blur-sm">
            <X size={18} />
          </button>

          {/* ── Pre-acceptance prompt — centered over video ── */}
          {!breakAccepted && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center space-y-6 px-8 py-10 rounded-3xl bg-black/50 backdrop-blur-md border border-white/10 shadow-2xl">
                <p className="text-6xl">{pomodoroMode === 'deep-recovery' ? '🌙' : '🌿'}</p>
                <h2 className="text-3xl font-bold text-white">
                  {pomodoroMode === 'deep-recovery' ? t('Deep Rest annehmen?') : t('Pause annehmen?')}
                </h2>
                <p className="text-sm text-white/60">
                  {pomodoroMode === 'deep-recovery'
                    ? t('Dein vollständiger Zyklus ist abgeschlossen. Zeit für echte Erholung.')
                    : t('Dein 45-Minuten Fokusblock ist abgeschlossen.')}
                </p>
                <div className="flex gap-4 justify-center mt-2">
                  <button
                    onClick={() => {
                      setBreakAccepted(true);
                      // Ensure break/deep-rest timer starts immediately
                      const store = useFocusStore.getState();
                      const isPause = store.pomodoroMode === 'break' || store.pomodoroMode === 'deep-recovery';
                      if (isPause && !store.pomodoroRunning) {
                        store.togglePomodoro();
                      }
                    }}
                    className="px-8 py-3 rounded-2xl bg-mint-500/30 border border-mint-500/50 text-mint-light font-semibold hover:bg-mint-500/40 transition-all">
                    ✓ {t('Pause annehmen')}
                  </button>
                  <button
                    onClick={() => setPauseFullscreen(false)}
                    className="px-8 py-3 rounded-2xl bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 transition-all">
                    {t('Weiterarbeiten')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Accepted: controls at bottom-right ── */}
          {breakAccepted && (
            <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3">

              {/* ── CASE A: Break ended → show "Weiter / Genießen" choice ── */}
              {breakEndedPrompt ? (
                <div className="flex flex-col items-center gap-5 px-8 py-8 rounded-3xl bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl min-w-[320px] text-center">
                  <p className="text-4xl">🌸</p>
                  <p className="text-xl font-bold text-white leading-snug">
                    {pomodoroMode === 'deep-recovery' ? t('Deep Rest abgeschlossen') : t('Pause abgeschlossen')}
                  </p>
                  <p className="text-[12px] text-white/50 leading-snug">
                    {t('Musik & Video laufen weiter. Was möchtest du tun?')}
                  </p>
                  <div className="flex flex-col gap-3 w-full mt-1">
                    {/* Primary: back to work */}
                    <button
                      onClick={() => {
                        setBreakEndedPrompt(false);
                        setPauseFullscreen(false); // also resets breakAccepted
                        const fs = useFocusStore.getState();
                        fs.advancePomodoro();
                        setTimeout(() => {
                          const fs2 = useFocusStore.getState();
                          if (fs2.pomodoroMode === 'focus' && !fs2.pomodoroRunning) {
                            fs2.togglePomodoro();
                          }
                        }, 80);
                      }}
                      className="w-full px-6 py-4 rounded-2xl bg-mint-500/30 border border-mint-500/50 text-mint-light font-semibold text-sm hover:bg-mint-500/40 transition-all">
                      ✨ {t('Weiter deine Träume verwirklichen')}
                    </button>
                    {/* Secondary: snooze 10 more minutes */}
                    <button
                      onClick={() => {
                        setBreakEndedPrompt(false);
                        useFocusStore.getState().snoozeBreak(10 * 60);
                      }}
                      className="w-full px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white/70 font-medium text-sm hover:bg-white/20 transition-all">
                      🌿 {t('Noch kurz die Ruhe genießen (+10 min)')}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── CASE B: Break running → countdown panel ── */
                <div className="flex flex-col items-end gap-3 px-7 py-5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl min-w-[280px]">

                  {/* Header */}
                  <div className="flex items-center gap-2 w-full">
                    <p className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">
                      {pomodoroMode === 'deep-recovery' ? t('🌙 Deep Rest') : t('🧘 Pause')}
                    </p>
                  </div>

                  {/* Motivational text */}
                  <p className="text-[11px] text-white/40 leading-snug w-full">
                    {t('Komm in die Ruhe · Atme · Dann mit voller Energie weiter!')}
                  </p>

                  {/* Big countdown */}
                  <span className="font-mono text-6xl font-bold tabular-nums text-gold drop-shadow-lg leading-none w-full text-right">
                    {formatTime(pomodoroSeconds)}
                  </span>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-mint-500 to-gold rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(0, (pomodoroSeconds / POMO_DURATIONS[pomodoroMode]) * 100)}%` }}
                    />
                  </div>

                  {/* Music controls */}
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMusicMuted(!musicMuted)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all shrink-0"
                        title={musicMuted ? t('Musik an') : t('Musik stumm')}
                      >
                        {musicMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={musicMuted ? 0 : musicVolume}
                        onChange={e => { setMusicVolume(Number(e.target.value)); setMusicMuted(false); }}
                        className="flex-1 h-1 accent-gold cursor-pointer"
                      />
                      {selectedBreakTrack && (
                        <p className="text-[9px] text-white/40 truncate max-w-[100px]">{selectedBreakTrack.name}</p>
                      )}
                    </div>
                    {(musicDuration > 0) && (
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min={0} max={musicDuration} step={0.5}
                          value={musicCurrentTime}
                          onChange={e => setSeekTarget(Number(e.target.value))}
                          className="flex-1 h-1 accent-gold/70 cursor-pointer"
                        />
                        <span className="text-[9px] text-white/30 tabular-nums shrink-0">
                          {formatTime(Math.floor(musicCurrentTime))}/{formatTime(Math.floor(musicDuration))}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}

      <header className="h-14 flex items-center justify-between px-3 glass-dark shrink-0 relative z-30 gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 2px 20px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(17,202,160,0.06)' }}>
        {/* Left: page title + brain toggle */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-mint-light leading-none truncate">{page.title}</h1>
            <p className="text-[10px] text-anth-500 mt-0.5 tracking-wide truncate hidden md:block">{page.subtitle}</p>
          </div>
          <ToolsDropdown />
          <BrainToggle />
          {onlineAgents.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-forest-800/40 border border-forest-700/50">
              <Zap size={10} className="text-mint-500" />
              <span className="text-[9px] text-mint-light font-medium">{onlineAgents.length} online</span>
            </div>
          )}
        </div>

        {/* Right: utilities */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          {pomodoroRunning && (
            <div className={cn('hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold',
              POMO_STYLES[pomodoroMode].bg, POMO_STYLES[pomodoroMode].color)}>
              <Timer size={10} />{formatTime(pomodoroSeconds)}
            </div>
          )}
          <LangSwitcher />
          <LoginButton />
          <TemporalHub />
          <NotificationBell />
          <FocusPopover />
          <button onClick={() => window.location.reload()}
            className="p-2 rounded-lg text-anth-500 hover:text-mint-light hover:bg-forest-800/40 transition-colors">
            <RefreshCw size={13} />
          </button>
          <button onClick={toggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-anth-400 hover:text-mint-light hover:bg-forest-800/40 transition-colors text-xs">
            <BookOpen size={12} /><span className="hidden sm:inline">Notebook</span>
          </button>
        </div>
      </header>
    </>
  );
}
