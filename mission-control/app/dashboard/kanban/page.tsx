'use client';
import { useState, useEffect } from 'react';
import { AppLauncher } from '@/components/launcher/AppLauncher';
import { useNotebookStore, useNeuralNotebookStore, useFocusStore, useUIExtStore, useLauncherStore, useAuthStore, goalVisibleTo } from '@/lib/store';
import { Plus, Trash2, BookOpen, StickyNote, Target, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import type { GoalFolder, JournalFolder } from '@/lib/store';

const GOAL_FOLDERS: { id: GoalFolder; label: string; color: string }[] = [
  { id: 'tägliche',     label: 'Tägliche Ziele', color: 'text-mint-400' },
  { id: 'lebensziele',  label: 'Lebensziele',    color: 'text-gold' },
  { id: 'vereinsziele', label: 'Company-Ziele',   color: 'text-violet-400' },
  { id: 'projekte',     label: 'Projekte',       color: 'text-sky-400' },
];

export default function NotebooksPage() {
  const t = useT();
  const { entries, addEntry } = useNotebookStore();
  const { goals, journal, addGoal, updateGoal, deleteGoal, addJournalEntry, archiveJournalEntry } = useNeuralNotebookStore();
  const { setDailyTask, dailyTasks } = useFocusStore();
  const { setCompletionDialog } = useUIExtStore();
  const me = useAuthStore(s => s.user?.name ?? null);

  const [journalInput, setJournalInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [goalFolder, setGoalFolder] = useState<GoalFolder>('projekte');
  const [activeTab, setActiveTab] = useState<'goals' | 'journal'>('goals');
  const [focusMenu, setFocusMenu] = useState<string | null>(null);

  // Seed NotebookLM as the first launcher entry (only on very first visit —
  // once the key exists, user deletions are respected).
  // Read via getState() inside the effect: StrictMode double-invokes effects,
  // and a stale closure snapshot would seed twice.
  useEffect(() => {
    const { apps, addApp, removeApp } = useLauncherStore.getState();
    const list = apps['notebooks'];
    if (list === undefined) {
      addApp('notebooks', {
        name: 'NotebookLM',
        url: 'https://notebooklm.google.com',
        kind: 'webapp',
        openMode: 'tab',
        description: 'KI-Notizbuch von Google — Quellen hochladen, Fragen stellen, Audio-Overviews generieren.',
        imageUrl: 'https://www.google.com/s2/favicons?domain=notebooklm.google.com&sz=128',
      });
    } else {
      // Repair accidental duplicate seeds (same URL more than once)
      const seen = new Set<string>();
      list.forEach(a => {
        if (seen.has(a.url)) removeApp('notebooks', a.id);
        else seen.add(a.url);
      });
    }
  }, []);

  const addJournal = () => {
    if (!journalInput.trim()) return;
    const now = new Date().toISOString();
    addEntry({ id: `note-${Date.now()}`, date: now.split('T')[0], goals: [], journal: journalInput.trim(), teamLogs: [], createdAt: now, updatedAt: now });
    addJournalEntry(journalInput.trim(), 'general');
    setJournalInput('');
  };

  const addNewGoal = () => {
    if (!goalInput.trim()) return;
    addGoal(goalInput.trim(), goalFolder);
    setGoalInput('');
  };

  const setAsFocusTask = (text: string, slot: 0 | 1 | 2) => {
    setDailyTask(slot, text);
    setFocusMenu(null);
  };

  return (
    <div className="h-full flex gap-3 fade-in">
      {/* ── Column 1: Rich Daily Notebook ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden">
        <div className="shrink-0">
          <p className="text-xs uppercase tracking-widest text-anth-500 mb-1">{t('Daily Notebook')}</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 shrink-0">
          {([{ id: 'goals' as const, label: 'Goals', icon: Target }, { id: 'journal' as const, label: 'Journal', icon: StickyNote }]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                activeTab === t.id ? 'bg-forest-700/50 text-mint-light border border-forest-600/50' : 'text-anth-400 hover:text-anth-200 border border-transparent'
              )}>
              <t.icon size={11} /> {t.label}
            </button>
          ))}
        </div>

        {/* Goals */}
        {activeTab === 'goals' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            {/* Add Goal */}
            <div className="flex gap-2">
              <input value={goalInput} onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNewGoal()}
                placeholder="New goal..." className="flex-1 mc-input py-2 text-xs" />
              <select value={goalFolder} onChange={e => setGoalFolder(e.target.value as GoalFolder)}
                className="bg-surface border border-border rounded-xl px-2 text-[10px] text-forest-100 outline-none">
                {GOAL_FOLDERS.map(f => <option key={f.id} value={f.id}>{t(f.label)}</option>)}
              </select>
              <button onClick={addNewGoal} className="p-2 rounded-xl bg-mint-500/15 border border-mint-500/30 text-mint-500 hover:bg-mint-500/25 transition-colors">
                <Plus size={12} />
              </button>
            </div>

            {/* Goal Folders */}
            {GOAL_FOLDERS.map(folder => {
              const folderGoals = goals.filter(g => g.folder === folder.id && goalVisibleTo(g, me));
              if (folderGoals.length === 0) return null;
              return (
                <div key={folder.id}>
                  <p className={cn('text-[9px] uppercase tracking-widest font-semibold mb-1.5', folder.color)}>{t(folder.label)}</p>
                  <div className="space-y-1">
                    {folderGoals.map(goal => (
                      <div key={goal.id} className="relative group flex items-start gap-2 px-3 py-2 rounded-xl bg-surface/40 border border-border/50 hover:border-forest-700/50 transition-all">
                        <input type="checkbox" checked={goal.completed}
                          onChange={() => {
                            if (!goal.completed) {
                              // Checking off → show "erledigt / archivieren / löschen" dialog
                              setCompletionDialog({ goalId: goal.id, goalText: goal.text, source: 'neural' });
                            } else {
                              updateGoal(goal.id, { completed: false });
                            }
                          }}
                          className="mt-0.5 accent-mint-500 shrink-0" />
                        <p className={cn('text-xs flex-1', goal.completed && 'line-through text-anth-600')}>{goal.text}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Focus Task Menu */}
                          <div className="relative">
                            <button onClick={() => setFocusMenu(focusMenu === goal.id ? null : goal.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-anth-600 hover:text-gold transition-all" title={t('Als Fokus-Task setzen')}>
                              <Target size={10} />
                            </button>
                            {focusMenu === goal.id && (
                              <div className="absolute right-0 top-full mt-1 w-56 glass-dark border border-border rounded-xl shadow-panel z-50 p-2 space-y-0.5">
                                <p className="text-[9px] uppercase tracking-widest text-anth-600 px-2 py-1">{t('Als Fokus-Task festlegen')}</p>
                                {([0, 1, 2] as const).map(i => (
                                  <button key={i} onClick={() => setAsFocusTask(goal.text, i)}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-anth-300 hover:bg-forest-900/30 hover:text-forest-100 transition-colors flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-md bg-anth-800 border border-border flex items-center justify-center text-[8px] font-bold text-anth-500">{i + 1}</span>
                                    <span className="truncate">{dailyTasks[i] || t('(leer)')}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteGoal(goal.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-anth-600 hover:text-red-400 transition-all">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Journal */}
        {activeTab === 'journal' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="flex gap-2">
              <textarea value={journalInput} onChange={e => setJournalInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addJournal(); } }}
                placeholder="Quick thought..." rows={2} className="flex-1 mc-input py-2 text-xs resize-none" />
              <button onClick={addJournal} className="p-2 rounded-xl bg-mint-500/15 border border-mint-500/30 text-mint-500 hover:bg-mint-500/25 transition-colors self-end">
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-1.5">
              {journal.map(entry => (
                <div key={entry.id} className="group flex items-start gap-2 px-3 py-2 rounded-xl bg-surface/40 border border-border/50 hover:border-forest-700/50 transition-all">
                  <BookOpen size={11} className="text-anth-600 mt-0.5 shrink-0" />
                  <p className="text-xs flex-1">{entry.text}</p>
                  <button onClick={() => archiveJournalEntry(entry.id)} title={t('Ins Archiv verschieben')}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-anth-600 hover:text-red-400 transition-all shrink-0">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Column 2: Verknüpfte Programme (NotebookLM & eigene) ── */}
      <div className="w-[38%] min-w-[320px] min-h-0">
        <AppLauncher pageKey="notebooks" title="Programme" subtitle="Notebook-Tools & Web-Apps verknüpfen." />
      </div>
    </div>
  );
}
