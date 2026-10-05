'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Vorlese-Player (GSpeech-Ersatz) — Lautsprecher-Symbol über dem Chat-Symbol.
 *  Alt+A  → Start in Sprache 1      Alt+S → Start in Sprache 2      Alt+D → Pause/Stop
 * Liest Absatz für Absatz den Hauptinhalt der Seite, hebt den aktuellen hervor,
 * und läuft automatisch weiter. Alle Texte werden (serverseitig, gecacht) in die
 * gewählte Sprache übersetzt und gesprochen.
 */

const MINT = '#11CAA0';
const BLOCK_SEL = 'h1,h2,h3,h4,p,li,blockquote,figcaption';
const HL = 'site-reader-active';

interface Cfg { voices: { id: string; label: string }[]; langs: { code: string; name: string; locale: string }[] }
const LS = 'siteReader.v1';

function collectBlocks(): HTMLElement[] {
  const root = (document.querySelector('main') as HTMLElement) ?? document.body;
  return Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SEL)).filter(el => {
    if (el.closest('[data-no-read],nav,aside,button,select,textarea,input,script,style')) return false;
    if (el.querySelector(BLOCK_SEL)) return false;            // nur Blätter
    const text = (el.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (text.length < 3) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;                        // sichtbar
  });
}

export function SiteReader() {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [lang1, setLang1] = useState('de');
  const [lang2, setLang2] = useState('en');
  const [voice, setVoice] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [pos, setPos] = useState({ i: 0, n: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blocksRef = useRef<HTMLElement[]>([]);
  const idxRef = useRef(0);
  const langRef = useRef('de');
  const runRef = useRef(0);          // Abbruch-Token
  const urlRef = useRef<string | null>(null);

  // Konfiguration + gespeicherte Auswahl
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS) ?? '{}');
      if (s.lang1) setLang1(s.lang1); if (s.lang2) setLang2(s.lang2); if (s.voice) setVoice(s.voice);
    } catch { /* ignore */ }
    fetch('/api/speech/tts').then(r => r.json()).then((c: Cfg) => {
      setCfg(c); setVoice(v => v || c.voices[0]?.id || '');
    }).catch(() => setCfg({ voices: [], langs: [{ code: 'de', name: 'Deutsch', locale: 'de-DE' }, { code: 'en', name: 'English', locale: 'en-US' }] }));
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS, JSON.stringify({ lang1, lang2, voice })); } catch { /* ignore */ }
  }, [lang1, lang2, voice]);

  const clearHl = () => document.querySelectorAll('.' + HL).forEach(e => e.classList.remove(HL));

  const stop = useCallback(() => {
    runRef.current++;
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    clearHl();
    setState('idle');
  }, []);

  const playBlock = useCallback(async (i: number, run: number) => {
    const blocks = blocksRef.current;
    if (run !== runRef.current) return;
    if (i >= blocks.length) { stop(); return; }
    idxRef.current = i;
    const el = blocks[i];
    clearHl(); el.classList.add(HL);
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setPos({ i: i + 1, n: blocks.length });
    setState('loading');

    const text = (el.innerText ?? '').replace(/\s+/g, ' ').trim();
    const next = () => { if (run === runRef.current) playBlock(i + 1, run); };

    const useBrowser = () => {
      const loc = cfg?.langs.find(l => l.code === langRef.current)?.locale ?? 'de-DE';
      const u = new SpeechSynthesisUtterance(text); u.lang = loc;
      u.onend = next; u.onerror = next;
      setState('playing'); window.speechSynthesis.speak(u);
    };

    if (!cfg?.voices.length) { if ('speechSynthesis' in window) useBrowser(); else stop(); return; }

    try {
      const res = await fetch('/api/speech/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: langRef.current, voice }),
      });
      if (run !== runRef.current) return;
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      if (run !== runRef.current) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      const a = audioRef.current ?? (audioRef.current = new Audio());
      a.src = urlRef.current;
      a.onended = next;
      a.onerror = next;
      await a.play();
      setState('playing');
    } catch {
      if (run === runRef.current && 'speechSynthesis' in window) useBrowser(); else next();
    }
  }, [cfg, voice, stop]);

  /** Start in Sprache `code` – ab erstem im Sichtfenster liegenden Absatz. */
  const start = useCallback((code: string) => {
    stop();
    langRef.current = code;
    const blocks = collectBlocks();
    if (!blocks.length) return;
    blocksRef.current = blocks;
    const vh = window.innerHeight;
    let i = blocks.findIndex(b => b.getBoundingClientRect().bottom > 80 && b.getBoundingClientRect().top < vh);
    if (i < 0) i = 0;
    const run = ++runRef.current;
    playBlock(i, run);
  }, [stop, playBlock]);

  const togglePause = useCallback(() => {
    const a = audioRef.current;
    if (state === 'playing') {
      if (a && !a.paused) a.pause(); else window.speechSynthesis?.pause();
      setState('paused');
    } else if (state === 'paused') {
      if (a && a.src && a.paused) a.play(); else window.speechSynthesis?.resume();
      setState('playing');
    } else start(lang1);
  }, [state, start, lang1]);

  const skip = (d: number) => {
    if (state === 'idle') return;
    audioRef.current?.pause(); window.speechSynthesis?.cancel();
    const run = ++runRef.current;
    playBlock(Math.max(0, idxRef.current + d), run);
  };

  // Tastenkürzel (e.code, damit Alt+A auf Mac nicht „å“ ist)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code === 'KeyA') { e.preventDefault(); start(lang1); setOpen(true); }
      else if (e.code === 'KeyS') { e.preventDefault(); start(lang2); setOpen(true); }
      else if (e.code === 'KeyD') { e.preventDefault(); if (state === 'idle') return; (state === 'playing' ? togglePause() : stop()); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [start, stop, togglePause, lang1, lang2, state]);

  useEffect(() => () => { runRef.current++; audioRef.current?.pause(); window.speechSynthesis?.cancel(); clearHl(); }, []);

  const active = state !== 'idle';
  const langName = (c: string) => cfg?.langs.find(l => l.code === c)?.name ?? c;
  const sel = 'w-full bg-bg/60 border border-anth-800 rounded-md px-2 py-1 text-[11px] text-anth-200 focus:outline-none focus:border-mint-500/60';

  return (
    <div data-no-read className="fixed bottom-[88px] right-5 z-50 flex flex-col items-end gap-2">
      <style>{`.${HL}{background:rgba(17,202,160,.14)!important;outline:2px solid rgba(17,202,160,.55);outline-offset:3px;border-radius:6px;transition:background .2s}`}</style>

      {open && (
        <div className="w-72 rounded-xl border border-anth-800 bg-surface/95 backdrop-blur p-3 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-anth-100">Vorlesen</span>
            <button onClick={() => setOpen(false)} className="text-anth-500 hover:text-anth-300"><X size={13} /></button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-anth-500">Sprache 1 · Alt+A
              <select className={sel} value={lang1} onChange={e => setLang1(e.target.value)}>
                {cfg?.langs.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </label>
            <label className="text-[10px] text-anth-500">Sprache 2 · Alt+S
              <select className={sel} value={lang2} onChange={e => setLang2(e.target.value)}>
                {cfg?.langs.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </label>
          </div>

          <label className="block text-[10px] text-anth-500">Stimme
            {cfg?.voices.length ? (
              <select className={sel} value={voice} onChange={e => setVoice(e.target.value)}>
                {cfg.voices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            ) : <div className="text-[11px] text-anth-400 mt-1">Browser-Stimme (kein TTS-Key – ELEVENLABS_API_KEY oder OPENAI_API_KEY setzen)</div>}
          </label>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <button onClick={() => skip(-1)} disabled={!active} className="p-1.5 text-anth-400 hover:text-mint-400 disabled:opacity-30"><SkipBack size={14} /></button>
              <button onClick={togglePause} className="p-2 rounded-full text-bg" style={{ background: MINT }}>
                {state === 'loading' ? <Loader2 size={14} className="animate-spin" /> : state === 'playing' ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button onClick={() => skip(1)} disabled={!active} className="p-1.5 text-anth-400 hover:text-mint-400 disabled:opacity-30"><SkipForward size={14} /></button>
              <button onClick={stop} disabled={!active} className="p-1.5 text-anth-400 hover:text-red-400 disabled:opacity-30" title="Stop · Alt+D"><VolumeX size={14} /></button>
            </div>
            <span className="text-[10px] text-anth-500">
              {active ? `Absatz ${pos.i}/${pos.n} · ${langName(langRef.current)}` : 'Alt+D: Pause/Stop'}
            </span>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} title="Vorlesen (Alt+A / Alt+S / Alt+D)"
        className={cn('w-11 h-11 rounded-full border flex items-center justify-center shadow-lg transition-colors',
          active ? 'border-mint-500 text-mint-400 bg-mint-500/10' : 'border-anth-800 text-anth-300 bg-surface hover:text-mint-400')}>
        <Volume2 size={18} />
      </button>
    </div>
  );
}
