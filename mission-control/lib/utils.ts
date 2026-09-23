import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function truncate(str: string, n: number): string {
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return prefix ? `${prefix}-${ts}${rand}` : `${ts}${rand}`;
}

export const PRIORITY_COLORS: Record<string, string> = {
  urgent:  'text-red-400 bg-red-950/40 border-red-900',
  high:    'text-orange-400 bg-orange-950/40 border-orange-900',
  medium:  'text-gold bg-yellow-950/30 border-yellow-900',
  low:     'text-forest-400 bg-forest-950/40 border-forest-800',
};

export const STATUS_COLORS: Record<string, string> = {
  online:  'bg-forest-400',
  offline: 'bg-anth-500',
  busy:    'bg-gold',
  error:   'bg-red-500',
  idle:    'bg-forest-700',
};

export const TASK_TYPE_ICONS: Record<string, string> = {
  content:   '✍️',
  technical: '⚙️',
  seo:       '🔍',
  media:     '🎙️',
  shopify:   '🛍️',
  research:  '🔬',
};

export const AGENT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  // Legacy IDs
  claude:          { bg: 'bg-purple-950/50',   text: 'text-purple-300',   border: 'border-purple-800',   glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]' },
  hermes:          { bg: 'bg-blue-950/50',     text: 'text-blue-300',     border: 'border-blue-800',     glow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]' },
  gemini:          { bg: 'bg-teal-950/50',     text: 'text-teal-300',     border: 'border-teal-800',     glow: 'shadow-[0_0_20px_rgba(20,184,166,0.25)]' },
  'openclaw-legacy': { bg: 'bg-orange-950/50',   text: 'text-orange-300',   border: 'border-orange-800',   glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]' },
  system:          { bg: 'bg-forest-950/50',   text: 'text-forest-300',   border: 'border-forest-700',   glow: 'shadow-glow-green' },
  // TRINITY OS agent IDs
  'claude-free':   { bg: 'bg-purple-950/50',   text: 'text-purple-300',   border: 'border-purple-800',   glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]' },
  'hermes3':       { bg: 'bg-blue-950/50',     text: 'text-blue-300',     border: 'border-blue-800',     glow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]' },
  'gemini-core':   { bg: 'bg-teal-950/50',     text: 'text-teal-300',     border: 'border-teal-800',     glow: 'shadow-[0_0_20px_rgba(20,184,166,0.25)]' },
  'abacus':        { bg: 'bg-cyan-950/50',     text: 'text-cyan-300',     border: 'border-cyan-800',     glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]' },
  'grok':          { bg: 'bg-rose-950/50',     text: 'text-rose-300',     border: 'border-rose-800',     glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]' },
  'chatgpt':       { bg: 'bg-emerald-950/50',  text: 'text-emerald-300',  border: 'border-emerald-800',  glow: 'shadow-[0_0_20px_rgba(52,211,153,0.25)]' },
  'ollama-manager':{ bg: 'bg-amber-950/50',    text: 'text-amber-300',    border: 'border-amber-800',    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.25)]' },
  'qwen3-tts':     { bg: 'bg-sky-950/50',      text: 'text-sky-300',      border: 'border-sky-800',      glow: 'shadow-[0_0_20px_rgba(14,165,233,0.25)]' },
  'kimi-ai':       { bg: 'bg-indigo-950/50',   text: 'text-indigo-300',   border: 'border-indigo-800',   glow: 'shadow-[0_0_20px_rgba(99,102,241,0.25)]' },
  'swarm-ai':      { bg: 'bg-violet-950/50',   text: 'text-violet-300',   border: 'border-violet-800',   glow: 'shadow-[0_0_20px_rgba(139,92,246,0.25)]' },
  'n8n-manager':      { bg: 'bg-orange-950/50',   text: 'text-orange-300',   border: 'border-orange-800',   glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]' },
  'claude-cowork':    { bg: 'bg-indigo-950/50',   text: 'text-indigo-300',   border: 'border-indigo-800',   glow: 'shadow-[0_0_20px_rgba(99,102,241,0.25)]'  },
  'claude-code-agent':    { bg: 'bg-emerald-950/50',  text: 'text-emerald-300',  border: 'border-emerald-800',  glow: 'shadow-[0_0_20px_rgba(52,211,153,0.25)]'  },
  'claude-free-scope':    { bg: 'bg-slate-900/50',    text: 'text-slate-300',    border: 'border-slate-700',    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]'  },
  'gemma':                { bg: 'bg-lime-950/50',     text: 'text-lime-300',     border: 'border-lime-800',     glow: 'shadow-[0_0_20px_rgba(163,230,53,0.2)]'   },
  'openrouter-endpoint':  { bg: 'bg-fuchsia-950/50',  text: 'text-fuchsia-300',  border: 'border-fuchsia-800',  glow: 'shadow-[0_0_20px_rgba(217,70,239,0.25)]'  },
  'antigravity-agent':    { bg: 'bg-orange-950/50',   text: 'text-orange-300',   border: 'border-orange-800',   glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]'  },
  'openclaw':             { bg: 'bg-amber-950/50',    text: 'text-amber-300',    border: 'border-amber-800',    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.25)]'  },
  'paperclip-bot':        { bg: 'bg-pink-950/50',     text: 'text-pink-300',     border: 'border-pink-800',     glow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]'  },
};
