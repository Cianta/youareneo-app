'use client';
/**
 * Channels Hub — social channels grouped by platform.
 * Each platform section can hold multiple channels, each with its own
 * "Öffnen" button (new tab or popup, chosen when adding).
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ExternalLink, Trash2, ChevronDown } from 'lucide-react';
import { useChannelsStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const PLATFORMS: { id: string; label: string; emoji: string; color: string }[] = [
  { id: 'youtube',   label: 'YouTube',     emoji: '▶️', color: '#ff5555' },
  { id: 'instagram', label: 'Instagram',   emoji: '📸', color: '#e1306c' },
  { id: 'tiktok',    label: 'TikTok',      emoji: '🎵', color: '#69c9d0' },
  { id: 'facebook',  label: 'Facebook',    emoji: '👥', color: '#4a90f2' },
  { id: 'x',         label: 'X / Twitter', emoji: '✖️', color: '#e7e9ea' },
  { id: 'linkedin',  label: 'LinkedIn',    emoji: '💼', color: '#4a9cd6' },
  { id: 'pinterest', label: 'Pinterest',   emoji: '📌', color: '#e64a5b' },
  { id: 'telegram',  label: 'Telegram',    emoji: '✈️', color: '#26a5e4' },
  { id: 'other',     label: 'Weitere',     emoji: '🌐', color: '#11CAA0' },
];

export default function ChannelsHubPage() {
  const t = useT();
  const { channels, addChannel, removeChannel } = useChannelsStore();
  const [addFor, setAddFor] = useState<string | null>(null);
  const [fName, setFName] = useState('');
  const [fUrl, setFUrl] = useState('');
  const [fMode, setFMode] = useState<'tab' | 'popup'>('tab');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const openChannel = (url: string, name: string, mode: 'tab' | 'popup') => {
    if (mode === 'popup') window.open(url, name, 'width=1280,height=860,menubar=no,toolbar=no');
    else window.open(url, '_blank');
  };

  const submit = () => {
    const url = fUrl.trim();
    if (!url || !addFor) return;
    const norm = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    addChannel({ platform: addFor, name: fName.trim() || norm, url: norm, openMode: fMode });
    setFName(''); setFUrl(''); setFMode('tab'); setAddFor(null);
  };

  return (
    <div className="h-full overflow-y-auto fade-in">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-forest-100">Channels Hub</h1>
        <p className="text-xs text-anth-500">{t('Alle Social-Media-Kanäle an einem Ort — pro Plattform beliebig viele Kanäle.')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        {PLATFORMS.map(pf => {
          const pfChannels = channels.filter(c => c.platform === pf.id);
          const isCollapsed = collapsed[pf.id];
          return (
            <div key={pf.id} className="glass rounded-2xl border border-border overflow-hidden">
              {/* Platform header */}
              <button onClick={() => setCollapsed(c => ({ ...c, [pf.id]: !c[pf.id] }))}
                className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-surface/50 transition-colors">
                <span className="text-lg">{pf.emoji}</span>
                <span className="flex-1 text-left text-sm font-semibold" style={{ color: pf.color }}>{t(pf.label)}</span>
                <span className="text-[10px] text-anth-600">{pfChannels.length}</span>
                <ChevronDown size={12} className={cn('text-anth-600 transition-transform', !isCollapsed && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    transition={{ duration: 0.15 }} className="overflow-hidden">
                    <div className="px-3 pb-3 space-y-1.5">
                      {pfChannels.map(ch => (
                        <div key={ch.id} className="group flex items-center gap-2 px-2.5 py-2 rounded-xl bg-surface/50 border border-border/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-anth-200 truncate">{ch.name}</p>
                            <p className="text-[9px] text-anth-600 truncate">{ch.url}</p>
                          </div>
                          <button onClick={() => removeChannel(ch.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-anth-600 hover:text-red-400 transition-all">
                            <Trash2 size={10} />
                          </button>
                          <button onClick={() => openChannel(ch.url, ch.name, ch.openMode)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-mint-500/15 border border-mint-500/30 text-mint-400 text-[10px] font-semibold hover:bg-mint-500/25 transition-colors shrink-0">
                            <ExternalLink size={9} /> {t('Öffnen')}
                          </button>
                        </div>
                      ))}
                      {/* Add channel */}
                      {addFor === pf.id ? (
                        <div className="rounded-xl border border-mint-500/30 bg-mint-500/5 p-2.5 space-y-2">
                          <input autoFocus value={fName} onChange={e => setFName(e.target.value)}
                            placeholder={t('Kanal-Name…')}
                            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-forest-100 outline-none focus:border-mint-500/40" />
                          <input value={fUrl} onChange={e => setFUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                            placeholder="https://…"
                            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-forest-100 outline-none focus:border-mint-500/40 font-mono" />
                          <div className="flex gap-1.5">
                            {([{ id: 'tab', label: 'Neuer Tab' }, { id: 'popup', label: 'Popup' }] as const).map(m => (
                              <button key={m.id} onClick={() => setFMode(m.id)}
                                className={cn('flex-1 py-1 rounded-lg border text-[9px] font-medium transition-all',
                                  fMode === m.id ? 'border-mint-500/50 bg-mint-500/10 text-mint-400' : 'border-border text-anth-500')}>
                                {t(m.label)}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={submit} disabled={!fUrl.trim()}
                              className="flex-1 py-1.5 rounded-lg bg-mint-500/25 border border-mint-500/50 text-mint-300 text-[10px] font-semibold disabled:opacity-40">
                              {t('Hinzufügen')}
                            </button>
                            <button onClick={() => setAddFor(null)}
                              className="px-3 py-1.5 rounded-lg border border-border text-anth-500 text-[10px]"><X size={10} /></button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setAddFor(pf.id); setFName(''); setFUrl(''); }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border text-anth-600 hover:text-mint-400 hover:border-mint-500/40 text-[10px] transition-all">
                          <Plus size={10} /> {t('Kanal verknüpfen')}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
