'use client';
import { useState, useEffect, useRef } from 'react';
import { ExternalLink, RefreshCw, AlertTriangle, ShieldCheck, Zap, Loader2, LogIn, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IframeViewProps {
  src: string;
  title: string;
  fallbackMessage?: string;
  className?: string;
  configKey?: string;
  /** Optional description shown in blocked-state card */
  description?: string;
}

type LoadMode = 'direct' | 'proxy' | 'blocked';

interface FrameTestResult {
  frameable: 'direct' | 'proxy' | 'tunnel' | 'blocked';
  recommendation: string;
  xFrameOptions: string | null;
  latencyMs: number;
}

// ── Domain intelligence ────────────────────────────────────────────────────────

/** Service metadata for rich blocked-state cards */
const SERVICE_INFO: Record<string, { desc: string; category: string }> = {
  'mail.google.com':        { desc: 'Google Email — read, compose & organise your inbox', category: 'Communication' },
  'drive.google.com':       { desc: 'Cloud storage & file collaboration by Google', category: 'Cloud Storage' },
  'docs.google.com':        { desc: 'Collaborative document editing by Google', category: 'Productivity' },
  'aistudio.google.com':    { desc: 'Google AI Studio — experiment with Gemini models', category: 'AI Tools' },
  'stitch.withgoogle.com':  { desc: 'Google Audio AI — music generation & remixing', category: 'Audio' },
  'ai.google.dev':          { desc: 'Google AI developer platform — Gemma models', category: 'AI Tools' },
  'notebooklm.google.com':  { desc: 'AI-powered notebook by Google — research & summarise', category: 'Productivity' },
  'web.whatsapp.com':       { desc: 'WhatsApp Business — messaging & customer communication', category: 'Communication' },
  'web.telegram.org':       { desc: 'Telegram Messenger — channels, groups & bots', category: 'Communication' },
  'unmixr.com':             { desc: 'AI audio stem separation — isolate vocals, drums & more', category: 'Audio' },
  'app.memberspot.de':      { desc: 'Memberspot Academy — courses, communities & content', category: 'Education' },
  'www.swisstransfer.com':  { desc: 'Secure file transfer — send large files up to 50 GB', category: 'File Transfer' },
  'gamma.app':              { desc: 'AI-powered presentations, documents & websites', category: 'Productivity' },
  'padlet.com':             { desc: 'Collaborative boards — brainstorm, collect & share', category: 'Collaboration' },
};

/**
 * Sites that cannot be embedded at all — DENY XFO, Cloudflare blocks proxy,
 * or Google OAuth that fails even after proxy header-stripping.
 * Shows a rich service card with "Open in new tab" button.
 */
const HARD_BLOCKED_HOSTS = [
  // X-Frame-Options: DENY
  'web.whatsapp.com',
  'web.telegram.org',
  'unmixr.com',
  'app.memberspot.de',
  'notebooklm.google.com',
  'www.swisstransfer.com',
  // Google-owned domains — DENY XFO + Google OAuth not possible in iframe
  'mail.google.com',
  'accounts.google.com',
  'stitch.withgoogle.com',
  'aistudio.google.com',
  'docs.google.com',
  'drive.google.com',
  'ai.google.dev',
  // Cloudflare bot protection blocks proxy AND SAMEORIGIN blocks direct
  'gamma.app',
  'padlet.com',
];

/**
 * Sites that need Google OAuth on first visit but have NO X-Frame-Options.
 * Strategy: direct iframe → user logs in via breakout button → refresh → works.
 */
const NEEDS_LOGIN_HOSTS = [
  'journalit.app',     // Google OAuth login, but no XFO → works after auth
  'trello.com',        // Atlassian login, no XFO → works after auth
];

/**
 * Sites with X-Frame-Options: SAMEORIGIN/DENY (on initial page or auth redirect)
 * or restrictive CSP. Skip the direct attempt — start immediately in proxy mode
 * which strips those headers server-side.
 */
const PROXY_FIRST_HOSTS = [
  'www.swpc.noaa.gov',
  'riverside.fm',
  'wetransfer.com',
  'app.gohighlevel.com',
  'app.ideabuddy.com',
  'mail.infomaniak.com',
  'gobrunch.com',
  'app.lunacal.ai',
  'miro.com',
  'presenti.ai',
  'meet.kde.org',
  'kmeet.infomaniak.com',
  'app.apollo.io',
  'elevenlabs.io',
];

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

function isHardBlocked(url: string): boolean {
  const h = getHostname(url);
  return HARD_BLOCKED_HOSTS.some(p => h === p || h.endsWith('.' + p));
}

function needsLogin(url: string): boolean {
  const h = getHostname(url);
  return NEEDS_LOGIN_HOSTS.some(p => h === p || h.endsWith('.' + p));
}

function needsProxy(url: string): boolean {
  const h = getHostname(url);
  return PROXY_FIRST_HOSTS.some(p => h === p || h.endsWith('.' + p));
}

function isGoogleDomain(url: string): boolean {
  const h = getHostname(url);
  return h.includes('google.com') || h.includes('google.dev');
}

function getServiceInfo(url: string): { desc: string; category: string } | null {
  const h = getHostname(url);
  return SERVICE_INFO[h] ?? null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function IframeView({ src, title, fallbackMessage, className, configKey, description }: IframeViewProps) {
  const initialMode = (): LoadMode => {
    if (!src) return 'direct';
    if (isHardBlocked(src)) return 'blocked';
    if (needsProxy(src)) return 'proxy';
    return 'direct';
  };

  const [loading, setLoading]         = useState(true);
  const [key, setKey]                 = useState(0);
  const [mode, setMode]               = useState<LoadMode>(initialMode);
  const [testing, setTesting]         = useState(false);
  const [testResult, setTestResult]   = useState<FrameTestResult | null>(null);
  const [userOverride, setUserOverride] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const loadTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isConfigured = src && !src.includes('YOUR_') && !src.includes('undefined');
  const _needsLogin = isConfigured && needsLogin(src);

  const effectiveSrc = mode === 'proxy'
    ? `/api/proxy?url=${encodeURIComponent(src)}`
    : src;

  // Reset mode when src changes
  useEffect(() => {
    setMode(initialMode());
    setKey(k => k + 1);
    setLoading(true);
    setTestResult(null);
    setShowLoginHint(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Show login hint after 4 seconds for sites that need login
  useEffect(() => {
    if (!_needsLogin) return;
    const t = setTimeout(() => setShowLoginHint(true), 4000);
    return () => clearTimeout(t);
  }, [_needsLogin, key]);

  const runTest = async () => {
    setTesting(true);
    try {
      const res = await fetch(`/api/proxy/test?url=${encodeURIComponent(src)}`);
      const data = await res.json();
      if (data.ok) {
        const r: FrameTestResult = data.result;
        setTestResult(r);
        if (r.frameable === 'proxy') {
          setMode('proxy');
          setKey(k => k + 1);
          setLoading(true);
        } else if (r.frameable === 'tunnel') {
          setMode('blocked');
        }
      }
    } catch {
      // silently ignore
    } finally {
      setTesting(false);
    }
  };

  // Auto proxy-test after 3s for direct mode (not for login-hint sites or user-overridden)
  useEffect(() => {
    if (!isConfigured || mode !== 'direct' || userOverride || _needsLogin) return;
    setLoading(true);
    loadTimerRef.current = setTimeout(() => {
      runTest();
    }, 3000);
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mode, isConfigured]);

  // ── Not configured ─────────────────────────────────────────────────────────
  if (!isConfigured) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-center gap-5', className)}>
        <div className="w-16 h-16 rounded-2xl bg-anth-800/60 border border-border flex items-center justify-center">
          <AlertTriangle size={24} className="text-gold" />
        </div>
        <div>
          <p className="text-sm font-semibold text-forest-200 mb-1">{title} — Not Configured</p>
          <p className="text-xs text-anth-400 max-w-sm">
            {fallbackMessage ?? `Set the URL in your .env.local to enable this integration.`}
          </p>
          {configKey && (
            <code className="inline-block mt-3 text-xs text-gold bg-forest-900/60 px-3 py-1.5 rounded-lg">
              {configKey}=https://your-url.com
            </code>
          )}
        </div>
      </div>
    );
  }

  // ── Blocked state — Rich service card ─────────────────────────────────────
  if (mode === 'blocked') {
    const isGoogle = isGoogleDomain(src);
    const hostname = getHostname(src);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    const info = getServiceInfo(src);
    const cardDesc = description ?? info?.desc;
    const cardCategory = info?.category ?? (isGoogle ? 'Google Service' : 'External Service');

    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-center gap-6 p-8', className)}>
        {/* Service card */}
        <div className="w-full max-w-md rounded-2xl bg-anth-800/40 border border-anth-700/30 p-6 backdrop-blur-sm">
          {/* Category badge */}
          <div className="flex justify-center mb-4">
            <span className={cn('text-[9px] px-2.5 py-1 rounded-full border font-medium uppercase tracking-wider',
              isGoogle
                ? 'bg-sky-900/30 border-sky-700/40 text-sky-400'
                : 'bg-anth-800/60 border-anth-600/40 text-anth-400'
            )}>
              {cardCategory}
            </span>
          </div>

          {/* Favicon + Title */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-anth-900/60 border border-anth-700/40 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={faviconUrl} alt={title} className="w-7 h-7 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <p className="text-base font-semibold text-forest-100">{title}</p>
              <p className="text-[10px] text-anth-500 font-mono">{hostname}</p>
            </div>
          </div>

          {/* Description */}
          {cardDesc && (
            <p className="text-xs text-anth-400 mb-5 leading-relaxed">{cardDesc}</p>
          )}

          {/* Reason */}
          <div className="flex items-center justify-center gap-2 mb-5 px-3 py-2 rounded-lg bg-anth-900/40 border border-anth-700/20">
            <Lock size={10} className="text-anth-500 shrink-0" />
            <p className="text-[10px] text-anth-500">
              {isGoogle
                ? 'Google blocks sign-in inside embedded frames for security.'
                : testResult?.recommendation ?? 'This site blocks embedding in third-party apps.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-center flex-wrap">
            <a href={src} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700/40 border border-forest-600/40 text-sm text-forest-100 hover:bg-forest-600/40 transition-colors font-medium">
              <ExternalLink size={13} /> Open {title}
            </a>
            {!isGoogle && (
              <button onClick={() => { setUserOverride(true); setMode('proxy'); setKey(k => k + 1); setLoading(true); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-anth-800/60 border border-anth-700/40 text-xs text-anth-300 hover:bg-anth-700/60 transition-colors">
                <Zap size={12} /> Try Proxy
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Normal iframe with breakout login handler ─────────────────────────────
  return (
    <div className={cn('flex flex-col h-full rounded-xl overflow-hidden border border-border', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface/80 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-forest-500/70" />
          </div>
          <span className="text-xs text-anth-400 ml-2 font-mono truncate max-w-[200px]">
            {mode === 'proxy' ? `proxy → ${src.slice(0, 55)}` : src.slice(0, 65)}
          </span>
          {mode === 'proxy' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-900/40 border border-violet-700/40 text-violet-300">
              PROXY
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Frame test */}
          <button onClick={runTest} disabled={testing} title="Test frame compatibility"
            className="flex items-center gap-1 p-1.5 rounded-lg text-anth-500 hover:text-gold hover:bg-gold/10 disabled:opacity-50 transition-colors text-[10px]">
            {testing ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
          </button>

          {/* 🔒 Breakout Login — opens src in new tab for authentication */}
          <a href={src} target="_blank" rel="noopener noreferrer" title="Login in new tab (then refresh)"
            className="p-1.5 rounded-lg text-anth-500 hover:text-amber-400 hover:bg-amber-900/20 transition-colors">
            <LogIn size={11} />
          </a>

          {/* Mode toggle */}
          {mode === 'direct' ? (
            <button onClick={() => { setUserOverride(true); setMode('proxy'); setKey(k => k + 1); setLoading(true); }}
              title="Load via TRINITY proxy (strips X-Frame headers)"
              className="p-1.5 rounded-lg text-anth-500 hover:text-violet-400 hover:bg-violet-900/20 transition-colors">
              <Zap size={11} />
            </button>
          ) : (
            <button onClick={() => { setUserOverride(true); setMode('direct'); setKey(k => k + 1); setLoading(true); }}
              title="Load directly (no proxy)"
              className="p-1.5 rounded-lg text-violet-400 hover:text-anth-400 hover:bg-anth-800/40 transition-colors">
              <Zap size={11} />
            </button>
          )}

          <button onClick={() => { setKey(k => k + 1); setLoading(true); setShowLoginHint(false); }}
            className="p-1.5 rounded-lg text-anth-500 hover:text-forest-300 hover:bg-forest-800/50 transition-colors" title="Reload">
            <RefreshCw size={12} />
          </button>
          <a href={src} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-anth-500 hover:text-forest-300 hover:bg-forest-800/50 transition-colors" title="Open in new tab">
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Test result banner */}
      {testResult && (
        <div className={cn('flex items-center justify-between px-4 py-1.5 text-[10px] border-b border-border/60 shrink-0',
          testResult.frameable === 'direct' ? 'bg-mint-900/20 text-mint-400' :
          testResult.frameable === 'proxy'  ? 'bg-violet-900/20 text-violet-300' :
          'bg-red-900/20 text-red-400'
        )}>
          <span className="truncate flex-1">{testResult.recommendation}</span>
          <button onClick={() => setTestResult(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* iFrame */}
      <div className="relative flex-1">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg z-10">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={20} className="animate-spin text-forest-500" />
              <p className="text-xs text-anth-400">
                {mode === 'proxy' ? `Proxying ${title}…` : `Loading ${title}…`}
              </p>
              {mode === 'direct' && !_needsLogin && (
                <button onClick={() => { setUserOverride(true); setMode('proxy'); setKey(k => k + 1); }}
                  className="text-[10px] text-violet-400 hover:text-violet-300 underline transition-colors mt-1">
                  Taking too long? Try proxy mode →
                </button>
              )}
            </div>
          </div>
        )}

        {/* 🔒 Breakout Login Overlay — shown for sites that need authentication */}
        {showLoginHint && !loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-anth-900/95 border border-amber-700/40 backdrop-blur-md shadow-xl">
              <Lock size={14} className="text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs text-forest-100 font-medium">Stuck on login?</p>
                <p className="text-[10px] text-anth-400">Sign in on a separate tab, then refresh here.</p>
              </div>
              <a href={src} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/30 border border-amber-600/40 text-xs text-amber-200 hover:bg-amber-600/40 transition-colors whitespace-nowrap font-medium">
                <LogIn size={11} /> Login
              </a>
              <button onClick={() => { setKey(k => k + 1); setLoading(true); setShowLoginHint(false); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest-700/30 border border-forest-600/40 text-xs text-forest-200 hover:bg-forest-600/40 transition-colors whitespace-nowrap">
                <RefreshCw size={10} /> Refresh
              </button>
              <button onClick={() => setShowLoginHint(false)} className="text-anth-500 hover:text-anth-300 transition-colors ml-1">✕</button>
            </div>
          </div>
        )}

        <iframe
          key={key}
          src={effectiveSrc}
          title={title}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          allow="camera; microphone; fullscreen; clipboard-read; clipboard-write; autoplay"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-modals"
        />
      </div>
    </div>
  );
}
