'use client';
/**
 * AppLauncher — reusable bookmark/program launcher page.
 *
 * Every Media-Studio subpage (and Marketing etc.) renders this with its own
 * `pageKey`. Users add their own tools via the + card:
 *   • webapp  → URL, opens in a new tab or popup (user's choice)
 *   • program → absolute path on the Mac, launched via /api/launch (`open`)
 * Descriptions are auto-fetched from the target page (/api/meta) and editable.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ExternalLink, AppWindow, Globe, FolderOpen, Trash2, FileText, Loader2, Save } from 'lucide-react';
import { useLauncherStore } from '@/lib/store';
import type { LauncherApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface Props {
  pageKey: string;
  title: string;
  subtitle?: string;
}

export function openApp(app: LauncherApp) {
  if (app.kind === 'program') {
    fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: app.url }),
    }).then(async r => {
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        alert(d?.error ?? 'Programm konnte nicht gestartet werden.');
      }
    }).catch(() => alert('Programm konnte nicht gestartet werden.'));
    return;
  }
  if (app.openMode === 'popup') {
    window.open(app.url, app.name, 'width=1280,height=860,menubar=no,toolbar=no');
  } else {
    window.open(app.url, '_blank');
  }
}

export function AppLauncher({ pageKey, title, subtitle }: Props) {
  const t = useT();
  const { apps: allApps, addApp, updateApp, removeApp } = useLauncherStore();
  const apps = allApps[pageKey] ?? [];

  const [showAdd, setShowAdd]   = useState(false);
  const [descId, setDescId]     = useState<string | null>(null);  // app shown in description column
  const [descDraft, setDescDraft] = useState('');
  const [descDirty, setDescDirty] = useState(false);

  // Add form state
  const [fName, setFName]       = useState('');
  const [fUrl, setFUrl]         = useState('');
  const [fKind, setFKind]       = useState<'webapp' | 'program'>('webapp');
  const [fOpenMode, setFOpenMode] = useState<'tab' | 'popup'>('tab');
  const [saving, setSaving]     = useState(false);

  const descApp = apps.find(a => a.id === descId) ?? null;

  const resetForm = () => { setFName(''); setFUrl(''); setFKind('webapp'); setFOpenMode('tab'); setShowAdd(false); };

  const submitAdd = async () => {
    const url = fUrl.trim();
    if (!url) return;
    setSaving(true);
    let name = fName.trim();
    let description = '';
    let imageUrl: string | undefined;

    if (fKind === 'webapp') {
      const normUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      // Auto-fetch metadata from the target page
      try {
        const res = await fetch(`/api/meta?url=${encodeURIComponent(normUrl)}`);
        if (res.ok) {
          const meta = await res.json();
          if (!name) name = meta.title ?? normUrl;
          description = meta.description ?? '';
          imageUrl = meta.image ?? meta.favicon ?? undefined;
        }
      } catch { /* offline — keep manual values */ }
      addApp(pageKey, { name: name || normUrl, url: normUrl, kind: 'webapp', openMode: fOpenMode, description, imageUrl });
    } else {
      const base = url.split('/').pop()?.replace(/\.(app|exe)$/i, '') ?? url;
      addApp(pageKey, { name: name || base, url, kind: 'program', openMode: 'tab', description: '', imageUrl: undefined });
    }
    setSaving(false);
    resetForm();
  };

  const openDescription = (app: LauncherApp) => {
    setDescId(app.id);
    setDescDraft(app.description);
    setDescDirty(false);
  };

  return (
    <div className="h-full flex gap-4 fade-in">
      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="shrink-0 mb-4">
          <h1 className="text-lg font-bold text-forest-100">{t(title)}</h1>
          <p className="text-xs text-anth-500">{t(subtitle ?? 'Verknüpfe deine Programme & Web-Apps — sie öffnen sich per Klick.')}</p>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {apps.map(app => (
              <div key={app.id}
                className={cn('group relative rounded-2xl border p-3 flex flex-col gap-2 transition-all',
                  descId === app.id ? 'border-mint-500/50 bg-mint-500/5' : 'border-border bg-surface/40 hover:border-forest-600/50')}>
                {/* Delete */}
                <button onClick={() => { removeApp(pageKey, app.id); if (descId === app.id) setDescId(null); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-anth-600 hover:text-red-400 transition-all">
                  <Trash2 size={11} />
                </button>
                {/* Image + name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-anth-800/60 border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {app.imageUrl
                      ? <img src={app.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : app.kind === 'program' ? <AppWindow size={16} className="text-anth-400" /> : <Globe size={16} className="text-anth-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-anth-200 truncate">{app.name}</p>
                    <p className="text-[9px] text-anth-600 truncate">
                      {app.kind === 'program' ? `💻 ${t('Programm')}` : `🌐 ${app.openMode === 'popup' ? t('Popup') : t('Neuer Tab')}`}
                    </p>
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex gap-1.5 mt-auto">
                  <button onClick={() => openApp(app)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-mint-500/15 border border-mint-500/30 text-mint-400 text-[10px] font-semibold hover:bg-mint-500/25 transition-colors">
                    <ExternalLink size={9} /> {t('Öffnen')}
                  </button>
                  <button onClick={() => descId === app.id ? setDescId(null) : openDescription(app)}
                    className={cn('flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border text-[10px] font-medium transition-colors',
                      descId === app.id
                        ? 'bg-gold/15 border-gold/40 text-gold'
                        : 'bg-anth-800/40 border-border text-anth-400 hover:text-anth-200')}>
                    <FileText size={9} /> {t('Beschreibung')}
                  </button>
                </div>
              </div>
            ))}

            {/* + Add card */}
            <button onClick={() => setShowAdd(true)}
              className="rounded-2xl border-2 border-dashed border-border hover:border-mint-500/40 min-h-[104px] flex flex-col items-center justify-center gap-1.5 text-anth-600 hover:text-mint-400 transition-all">
              <Plus size={20} />
              <span className="text-[10px] font-medium">{t('Programm verknüpfen')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Description column ── */}
      <AnimatePresence>
        {descApp && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="shrink-0 overflow-hidden">
            <div className="w-80 h-full glass rounded-2xl border border-border p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 shrink-0">
                {descApp.imageUrl && <img src={descApp.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest-100 truncate">{descApp.name}</p>
                  <p className="text-[9px] text-anth-600 truncate">{descApp.url}</p>
                </div>
                <button onClick={() => setDescId(null)} className="p-1 text-anth-600 hover:text-anth-300"><X size={13} /></button>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-anth-600 shrink-0">{t('Beschreibung · automatisch geladen, editierbar')}</p>
              <textarea
                value={descDraft}
                onChange={e => { setDescDraft(e.target.value); setDescDirty(true); }}
                placeholder={t('Beschreibung des Programms…')}
                className="flex-1 bg-surface border border-border rounded-xl p-3 text-xs text-anth-200 leading-relaxed resize-none outline-none focus:border-forest-600 transition-colors"
              />
              {descDirty && (
                <button onClick={() => { updateApp(pageKey, descApp.id, { description: descDraft }); setDescDirty(false); }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-mint-500/20 border border-mint-500/40 text-mint-400 text-xs font-semibold hover:bg-mint-500/30 transition-colors shrink-0">
                  <Save size={11} /> {t('Speichern')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add dialog ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={resetForm}>
            <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 8 }}
              onClick={e => e.stopPropagation()}
              className="w-[420px] glass-dark rounded-3xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-forest-100">{t('Programm verknüpfen')}</h3>
                <button onClick={resetForm} className="p-1 text-anth-600 hover:text-anth-300"><X size={14} /></button>
              </div>

              {/* Kind toggle */}
              <div className="flex gap-2">
                {([
                  { id: 'webapp',  label: 'Web-App',  icon: Globe,      hint: 'Link einfügen' },
                  { id: 'program', label: 'Programm', icon: FolderOpen, hint: 'Pfad am Mac' },
                ] as const).map(k => (
                  <button key={k.id} onClick={() => setFKind(k.id)}
                    className={cn('flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all',
                      fKind === k.id ? 'border-mint-500/50 bg-mint-500/10 text-mint-400' : 'border-border text-anth-500 hover:text-anth-300')}>
                    <k.icon size={16} />
                    <span className="text-[11px] font-semibold">{t(k.label)}</span>
                    <span className="text-[8px] opacity-60">{t(k.hint)}</span>
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-1 block">{t('Name (optional — wird sonst automatisch geladen)')}</label>
                <input value={fName} onChange={e => setFName(e.target.value)}
                  placeholder={fKind === 'webapp' ? t('z.B. Canva') : t('z.B. Figma')}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-mint-500/40 transition-colors" />
              </div>

              {/* URL / Path */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-1 block">
                  {fKind === 'webapp' ? t('Link') : t('Pfad zur App (z.B. /Applications/Figma.app)')}
                </label>
                <input value={fUrl} onChange={e => setFUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitAdd()}
                  placeholder={fKind === 'webapp' ? 'https://…' : '/Applications/…'}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-mint-500/40 transition-colors font-mono" />
                {fKind === 'program' && (
                  <p className="text-[9px] text-anth-600 mt-1">
                    {t('Tipp: App im Finder auswählen →')} <kbd className="text-anth-400">⌥⌘C</kbd> {t('kopiert den Pfad.')}
                  </p>
                )}
              </div>

              {/* Open mode (webapp only) */}
              {fKind === 'webapp' && (
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-1 block">{t('Öffnen in')}</label>
                  <div className="flex gap-2">
                    {([{ id: 'tab', label: 'Neuer Tab' }, { id: 'popup', label: 'Popup-Fenster' }] as const).map(m => (
                      <button key={m.id} onClick={() => setFOpenMode(m.id)}
                        className={cn('flex-1 py-2 rounded-xl border text-[11px] font-medium transition-all',
                          fOpenMode === m.id ? 'border-mint-500/50 bg-mint-500/10 text-mint-400' : 'border-border text-anth-500 hover:text-anth-300')}>
                        {t(m.label)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={submitAdd} disabled={!fUrl.trim() || saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-mint-500/25 border border-mint-500/50 text-mint-300 text-sm font-semibold hover:bg-mint-500/35 disabled:opacity-40 transition-all">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {saving ? t('Lade Infos…') : t('Hinzufügen')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
