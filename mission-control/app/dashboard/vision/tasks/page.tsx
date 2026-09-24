'use client';
import { useEffect, useState } from 'react';
import { useAuthStore, useLauncherStore } from '@/lib/store';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { IframeView } from '@/components/iframe/IframeView';
import { ExternalLink, Loader2, Archive, RotateCcw, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useBoard } from '@/lib/workspace/useBoard';
import { boardTasks } from '@/lib/workspace/board';
import { useNeuralNotebookStore } from '@/lib/store';

type TaskTab = 'kanban' | 'trello' | 'archiv';

// ── Trello Workspaces — add multiple boards, click a card to embed it below ──
function TrelloWorkspaces() {
  const t = useT();
  const { apps, addApp, removeApp } = useLauncherStore();
  const workspaces = apps['trello'] ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(workspaces[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [fName, setFName] = useState('');
  const [fUrl, setFUrl] = useState('');
  const [openMenu, setOpenMenu] = useState(false);

  const selected = workspaces.find(w => w.id === selectedId) ?? workspaces[0] ?? null;

  const submit = () => {
    const url = fUrl.trim();
    if (!url) return;
    const norm = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    addApp('trello', { name: fName.trim() || 'Trello Board', url: norm, kind: 'webapp', openMode: 'tab', description: '' });
    setFName(''); setFUrl(''); setAdding(false);
  };

  const openTrello = (mode: 'tab' | 'popup') => {
    const url = selected?.url ?? 'https://trello.com';
    if (mode === 'popup') window.open(url, 'trello', 'width=1400,height=900,menubar=no,toolbar=no');
    else window.open(url, '_blank');
    setOpenMenu(false);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ── Top bar: workspace cards + open button ── */}
      <div className="shrink-0 flex items-start gap-2 flex-wrap">
        {workspaces.map(ws => (
          <div key={ws.id}
            className={cn('group relative flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all',
              selected?.id === ws.id
                ? 'border-mint-500/50 bg-mint-500/10 text-mint-300 shadow-[0_0_14px_rgba(17,202,160,0.15)]'
                : 'border-border bg-surface/50 text-anth-400 hover:text-anth-200 hover:border-forest-600/40')}
            onClick={() => setSelectedId(ws.id)}>
            <span className="text-sm">🗂️</span>
            <span className="text-xs font-medium">{ws.name}</span>
            <button onClick={e => { e.stopPropagation(); removeApp('trello', ws.id); if (selectedId === ws.id) setSelectedId(null); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-anth-600 hover:text-red-400 transition-all">
              <X size={10} />
            </button>
          </div>
        ))}

        {/* + Add workspace */}
        {adding ? (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-mint-500/30 bg-mint-500/5">
            <input autoFocus value={fName} onChange={e => setFName(e.target.value)} placeholder="Name…"
              className="w-28 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-forest-100 outline-none" />
            <input value={fUrl} onChange={e => setFUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="https://trello.com/b/…"
              className="w-52 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-forest-100 outline-none font-mono" />
            <button onClick={submit} disabled={!fUrl.trim()}
              className="px-2 py-1 rounded-lg bg-mint-500/20 border border-mint-500/40 text-mint-400 text-xs disabled:opacity-40">✓</button>
            <button onClick={() => setAdding(false)} className="p-1 text-anth-500"><X size={11} /></button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-anth-600 hover:text-mint-400 hover:border-mint-500/40 text-xs transition-all">
            <Plus size={12} /> {t('Workspace einbinden')}
          </button>
        )}

        {/* Open Trello — tab/popup choice */}
        <div className="relative ml-auto">
          <button onClick={() => setOpenMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-900/30 border border-sky-700/40 text-sky-300 text-xs font-semibold hover:bg-sky-900/50 transition-all">
            <ExternalLink size={12} /> Open Trello
          </button>
          {openMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 glass-dark border border-border rounded-xl shadow-panel p-1.5 w-40 space-y-0.5">
                <button onClick={() => openTrello('tab')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-anth-300 hover:bg-forest-900/40 hover:text-forest-100 transition-colors">
                  🗔 {t('Neuer Tab')}
                </button>
                <button onClick={() => openTrello('popup')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-anth-300 hover:bg-forest-900/40 hover:text-forest-100 transition-colors">
                  🪟 {t('Popup')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Selected workspace embed ── */}
      <div className="flex-1 min-h-0">
        {selected ? (
          <IframeView
            key={selected.id}
            src={selected.url}
            title={selected.name}
            description={`Trello — ${selected.name}`}
            fallbackMessage={t('Dieses Board lässt sich nicht einbetten — nutze den Open-Trello-Button.')}
          />
        ) : (
          <div className="h-full flex items-center justify-center glass rounded-2xl border border-border">
            <div className="text-center space-y-2">
              <p className="text-3xl opacity-30">🗂️</p>
              <p className="text-xs text-anth-500">{t('Füge oben per ＋ deinen ersten Trello-Workspace hinzu.')}<br/>
                <span className="text-anth-600">{t('Tipp: Board in Trello öffnen → URL kopieren.')}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const t = useT();
  const { board, ready } = useBoard();
  const user = useAuthStore(s => s.user);
  const tasks = boardTasks(board, user?.name ?? null);
  const { archivedGoals, archivedJournalEntries, restoreGoal, deleteArchivedGoal, deleteArchivedJournalEntry } = useNeuralNotebookStore();
  const loading = !ready;
  const [activeTab, setActiveTab] = useState<TaskTab>('kanban');

  const tabs: { id: TaskTab; label: string; emoji: string }[] = [
    { id: 'kanban', label: 'Eigenes Kanban', emoji: '📋' },
    { id: 'trello', label: 'Trello Workspace', emoji: '🗂️' },
    { id: 'archiv', label: 'Archiv', emoji: '📦' },
  ];

  return (
    <div className="w-tasks-page h-full flex flex-col fade-in">
      <div className="w-page-heading"><div><span className="w-eyebrow">AUS IDEEN WIRD WIRKLICHKEIT</span><h1>Ein Schritt nach dem anderen.</h1><p>Deine Projekte. Dein Tempo. Alles in Bewegung.</p></div></div>

      {/* ── Sub-Navigation Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 mb-3 p-1 rounded-2xl bg-anth-900/60 border border-anth-700/30 backdrop-blur-sm"
        style={{ boxShadow: '0 0 20px rgba(17,202,160,0.06)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300',
              activeTab === tab.id
                ? 'bg-forest-800/70 border border-forest-600/50 text-forest-100 shadow-[0_0_18px_rgba(17,202,160,0.18)]'
                : 'text-anth-400 hover:text-anth-200 hover:bg-anth-800/40 border border-transparent'
            )}
          >
            <span className="text-base leading-none">{tab.emoji}</span>
            <span>{t(tab.label)}</span>
            {tab.id === 'kanban' && (
              <span className={cn(
                'ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors',
                activeTab === 'kanban'
                  ? 'bg-mint-500/20 text-mint-light'
                  : 'bg-anth-700/50 text-anth-500'
              )}>
                {tasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Full-Screen Content Area ── */}
      <div className="flex-1 min-h-0">

        {/* Tab 1: Internal Kanban — full-screen */}
        {activeTab === 'kanban' && (
          <div className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-forest-500" />
              </div>
            ) : (
              <KanbanBoard />
            )}
          </div>
        )}

        {/* Tab 3: Archiv */}
        {activeTab === 'archiv' && (
          <div className="p-4">
            <h2 className="text-sm font-semibold text-anth-300 mb-3 flex items-center gap-2">
              <Archive size={14}/> {t('Archiv')}
            </h2>
            <p className="text-xs text-anth-500 mb-4">{t('Archivierte Ziele und Aufgaben werden hier gesammelt.')}</p>
            {archivedGoals.length === 0 && archivedJournalEntries.length === 0 ? (
              <p className="text-xs text-anth-600">{t('Keine archivierten Einträge vorhanden.')}</p>
            ) : (
              <div className="space-y-4">
                {/* Archived goals — grouped by category */}
                {([
                  { id: 'tägliche',     label: '⚡ Tägliche Ziele',  color: 'text-mint-400' },
                  { id: 'lebensziele',  label: '🌟 Lebensziele',     color: 'text-gold' },
                  { id: 'vereinsziele', label: '🤝 Company-Ziele',   color: 'text-violet-300' },
                  { id: 'projekte',     label: '🚀 Projekte',        color: 'text-sky-300' },
                ] as const).map(cat => {
                  const catGoals = archivedGoals.filter(g => g.folder === cat.id);
                  if (catGoals.length === 0) return null;
                  return (
                    <div key={cat.id} className="space-y-2">
                      <p className={cn('text-[10px] uppercase tracking-widest font-semibold', cat.color)}>
                        {t(cat.label)} ({catGoals.length})
                      </p>
                      {catGoals.map(goal => (
                        <div key={goal.id} className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-anth-900/30">
                          <Archive size={12} className="text-anth-600 shrink-0"/>
                          <span className="flex-1 text-xs text-anth-400 line-through">{goal.text}</span>
                          <span className="text-[10px] text-anth-600">{new Date(goal.archivedAt).toLocaleDateString('de-AT')}</span>
                          <button onClick={() => restoreGoal(goal.id)} title={t('Wiederherstellen')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-anth-500 hover:text-mint-400 hover:bg-mint-500/10 transition-all">
                            <RotateCcw size={11}/>
                          </button>
                          <button onClick={() => deleteArchivedGoal(goal.id)} title={t('Endgültig löschen')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-anth-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {/* Legacy: archived goals with unknown folder */}
                {archivedGoals.filter(g => !['tägliche','lebensziele','vereinsziele','projekte'].includes(g.folder)).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-anth-500">{t('Sonstige')}</p>
                    {archivedGoals.filter(g => !['tägliche','lebensziele','vereinsziele','projekte'].includes(g.folder)).map(goal => (
                      <div key={goal.id} className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-anth-900/30">
                        <Archive size={12} className="text-anth-600 shrink-0"/>
                        <span className="flex-1 text-xs text-anth-400 line-through">{goal.text}</span>
                        <span className="text-[10px] text-anth-600">{new Date(goal.archivedAt).toLocaleDateString('de-AT')}</span>
                        <button onClick={() => restoreGoal(goal.id)} title={t('Wiederherstellen')}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-anth-500 hover:text-mint-400 hover:bg-mint-500/10 transition-all">
                          <RotateCcw size={11}/>
                        </button>
                        <button onClick={() => deleteArchivedGoal(goal.id)} title={t('Endgültig löschen')}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-anth-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {archivedJournalEntries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-anth-500">{t('Journal')} ({archivedJournalEntries.length})</p>
                    {archivedJournalEntries.map(entry => (
                      <div key={entry.id} className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-anth-900/30">
                        <Archive size={12} className="text-anth-600 shrink-0"/>
                        <span className="flex-1 text-xs text-anth-400 truncate">{entry.text}</span>
                        <span className="text-[10px] text-anth-600">{new Date(entry.archivedAt).toLocaleDateString('de-AT')}</span>
                        <button onClick={() => deleteArchivedJournalEntry(entry.id)} title={t('Endgültig löschen')}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-anth-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Trello Workspaces — user-managed iframe embeds */}
        {activeTab === 'trello' && <TrelloWorkspaces />}

      </div>
    </div>
  );
}
