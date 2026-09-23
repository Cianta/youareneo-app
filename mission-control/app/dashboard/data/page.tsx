'use client';
import { useState } from 'react';
import { Check, ExternalLink, Folder, HardDrive, Pencil, Plus, Server, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useDataHubStore, type HubColumn } from '@/lib/store';

// ─────────────────────────────────────────────────────────────────────────────
// DATA HUB — Spalten mit verknüpften Drives, Servern, lokalen Ordnern und
// eigenen Spalten. Links öffnen wahlweise in neuem Tab oder Popup; lokale
// Ordner öffnen sich im Finder (/api/launch).
// Spaltenbreite passt sich automatisch der Anzahl der Spalten an.
// Store liegt in lib/store.ts (wird auch vom Tools-Dropdown im Header gelesen).
// ─────────────────────────────────────────────────────────────────────────────

const COL_ICONS: Record<string, React.ElementType> = {
  'col-drives': HardDrive, 'col-server': Server, 'col-local': Folder,
};

export default function DataHubPage() {
  const t = useT();
  const { columns, addColumn, removeColumn, renameColumn, addEntry, removeEntry } = useDataHubStore();
  const [addingCol, setAddingCol]   = useState(false);
  const [newColName, setNewColName] = useState('');
  const [addingIn, setAddingIn]     = useState<string | null>(null);
  const [entryName, setEntryName]   = useState('');
  const [entryTarget, setEntryTarget] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editColId, setEditColId]   = useState<string | null>(null);
  const [editColName, setEditColName] = useState('');

  const openLink = (target: string, mode: 'tab' | 'popup') => {
    const url = /^https?:\/\//i.test(target) ? target : `https://${target}`;
    if (mode === 'tab') window.open(url, '_blank');
    else window.open(url, '_blank', 'popup=yes,width=1200,height=800');
    setOpenMenuId(null);
  };

  const openLocal = (path: string) => {
    fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  };

  const submitEntry = (col: HubColumn) => {
    const target = entryTarget.trim();
    if (!target) return;
    const fallback = col.kind === 'local'
      ? target.split('/').filter(Boolean).pop() ?? target
      : (() => { try { return new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`).hostname; } catch { return target; } })();
    addEntry(col.id, entryName.trim() || fallback, target);
    setEntryName(''); setEntryTarget(''); setAddingIn(null);
  };

  return (
    <div className="h-full flex flex-col fade-in overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-border/40">
        <HardDrive size={16} className="text-forest-400" />
        <div className="flex-1">
          <h1 className="text-base font-bold text-forest-50">Data Hub</h1>
          <p className="text-[11px] text-anth-400">{t('Drives, Server & lokale Ordner — alles an einem Ort.')}</p>
        </div>
        <a href="/dashboard/universe"
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-600/40 bg-violet-900/20 text-xs text-violet-300 hover:bg-violet-800/30 hover:text-violet-200 transition-all">
          🧠 Universal Brain
        </a>
        {/* Neue Spalte */}
        {addingCol ? (
          <div className="flex items-center gap-1">
            <input value={newColName} onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newColName.trim()) { addColumn(newColName.trim()); setNewColName(''); setAddingCol(false); }
                if (e.key === 'Escape') setAddingCol(false);
              }}
              placeholder={t('Spaltenname…')} autoFocus
              className="bg-surface border border-forest-700/40 rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-500 outline-none w-40" />
            <button onClick={() => { if (newColName.trim()) { addColumn(newColName.trim()); setNewColName(''); setAddingCol(false); } }}
              className="p-1.5 text-forest-400"><Check size={13} /></button>
            <button onClick={() => setAddingCol(false)} className="p-1.5 text-anth-500"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setAddingCol(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-forest-600/50 bg-forest-900/20 text-xs text-forest-300 hover:text-forest-100 hover:border-forest-500/70 transition-all">
            <Plus size={13} strokeWidth={3} /> {t('Spalte hinzufügen')}
          </button>
        )}
      </div>

      {/* Spalten — Breite passt sich der Anzahl an */}
      <div className="flex-1 min-h-0 overflow-x-auto p-4">
        <div className="h-full grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))` }}>
          {columns.map(col => {
            const Icon = COL_ICONS[col.id] ?? Folder;
            return (
              <div key={col.id}
                className="flex flex-col rounded-2xl border border-border/60 bg-anth-900/40 overflow-hidden"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 28px rgba(0,0,0,0.35)' }}>
                {/* Spaltenkopf */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 bg-anth-950/50">
                  <Icon size={13} className="text-forest-400 shrink-0" />
                  {editColId === col.id ? (
                    <input value={editColName} onChange={e => setEditColName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { if (editColName.trim()) renameColumn(col.id, editColName.trim()); setEditColId(null); }
                        if (e.key === 'Escape') setEditColId(null);
                      }} autoFocus
                      className="flex-1 min-w-0 bg-surface border border-forest-700/50 rounded-lg px-2 py-0.5 text-xs text-forest-100 outline-none" />
                  ) : (
                    <p className="flex-1 text-xs font-semibold text-forest-100 uppercase tracking-wider truncate">{t(col.name)}</p>
                  )}
                  <span className="text-[10px] text-anth-500">{col.entries.length}</span>
                  <button onClick={() => { setEditColId(col.id); setEditColName(col.name); }}
                    className="p-0.5 text-anth-500 hover:text-forest-300 transition-colors"><Pencil size={10} /></button>
                  {!col.builtin && (
                    <button onClick={() => removeColumn(col.id)}
                      className="p-0.5 text-anth-500 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                  )}
                </div>

                {/* Einträge */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                  {col.entries.length === 0 && (
                    <p className="text-[10px] text-anth-500 px-2 py-3 text-center">
                      {col.kind === 'local' ? t('Noch keine Ordner verknüpft.') : t('Noch keine Links verknüpft.')}
                    </p>
                  )}
                  {col.entries.map(e => (
                    <div key={e.id} className="relative group">
                      <button
                        onClick={() => col.kind === 'local' ? openLocal(e.target) : setOpenMenuId(openMenuId === e.id ? null : e.id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-anth-800/40 hover:border-forest-600/50 hover:bg-forest-900/30 transition-all text-left">
                        <span className="text-sm shrink-0">{col.kind === 'local' ? '📁' : '🔗'}</span>
                        <span className="flex-1 min-w-0 text-xs text-anth-200 truncate">{e.name}</span>
                        <ExternalLink size={10} className="text-anth-500 shrink-0" />
                      </button>
                      <button onClick={() => removeEntry(col.id, e.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-anth-800 border border-border flex items-center justify-center text-anth-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <X size={8} />
                      </button>
                      {/* Öffnen: Tab oder Popup */}
                      {openMenuId === e.id && col.kind !== 'local' && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 glass-dark border border-border rounded-xl shadow-panel p-1.5 space-y-0.5">
                            <button onClick={() => openLink(e.target, 'tab')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] text-anth-300 hover:bg-forest-800/40 hover:text-forest-200 transition-colors">
                              🌐 {t('Neuer Tab')}
                            </button>
                            <button onClick={() => openLink(e.target, 'popup')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] text-anth-300 hover:bg-forest-800/40 hover:text-forest-200 transition-colors">
                              🗔 {t('Popup')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Eintrag hinzufügen */}
                  {addingIn === col.id ? (
                    <div className="p-2 rounded-xl border border-mint-500/30 bg-forest-900/30 space-y-1.5">
                      <input value={entryName} onChange={e => setEntryName(e.target.value)}
                        placeholder={t('Name…')} autoFocus
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-500 outline-none" />
                      <input value={entryTarget} onChange={e => setEntryTarget(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submitEntry(col); if (e.key === 'Escape') setAddingIn(null); }}
                        placeholder={col.kind === 'local' ? '/Users/…/Ordner' : 'https://…'}
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-500 outline-none" />
                      <div className="flex gap-1">
                        <button onClick={() => submitEntry(col)}
                          className="flex-1 py-1.5 rounded-lg bg-mint-500/15 border border-mint-500/30 text-[10px] text-mint-300 hover:bg-mint-500/25 transition-colors">
                          {t('Hinzufügen')}
                        </button>
                        <button onClick={() => setAddingIn(null)} className="p-1 text-anth-500 hover:text-anth-300"><X size={11} /></button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingIn(col.id); setEntryName(''); setEntryTarget(''); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-anth-600/50 text-[10px] text-anth-400 hover:text-forest-300 hover:border-forest-600/50 transition-all">
                      <Plus size={10} /> {col.kind === 'local' ? t('Ordner verknüpfen') : t('Link verknüpfen')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
