'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, BookOpen, FileText, Users, Target, StickyNote, Timer, Trash2, Eye, Play, Pause, RotateCcw, SkipForward, ChevronDown, Folder, FolderOpen, MoveRight, ExternalLink, Bot, Send, Copy, LayoutTemplate, ListTodo, Tag, Volume2, VolumeX, Archive, Sparkles, Loader2, Share2 } from 'lucide-react';
import { useNotebookStore, useFocusStore, useNeuralNotebookStore, useUIExtStore, useAuthStore, goalVisibleTo, POMO_DURATIONS } from '@/lib/store';
import { playGong } from '@/lib/gong';
import { useT, useLocale } from '@/lib/i18n';
import { SharePicker } from '@/components/shared/SharePicker';
import { cn, formatTime as fmtDateTime, generateId, AGENT_COLORS } from '@/lib/utils';
import type { NotebookEntry, TeamLog } from '@/types';
import type { GoalFolder, JournalFolder, MainGoalFolder } from '@/lib/store';

// ── Notebook Clock (mini) ──────────────────────────────────────────────────────
function NotebookClock() {
  const locale = useLocale();
  const [time, setTime]    = useState('');
  const [dateStr, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
      setDate(now.toLocaleDateString(locale, { weekday:'long', day:'numeric', month:'long' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  return (
    <div className="px-4 py-2 border-b border-border/40 bg-anth-900/30 space-y-0.5 select-none">
      <p className="font-mono text-lg font-bold tabular-nums tracking-tight" style={{ color: '#e2ffe9' }}>{time}</p>
      <p className="text-xs text-anth-300 leading-snug font-medium">{dateStr}</p>
    </div>
  );
}


type Tab = 'goals' | 'journal' | 'logs' | 'notes' | 'archiv';

// Pomodoro helpers
function fmtSec(s: number) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
const POMO_STYLE = {
  'focus':         { color: 'text-mint-500',   bg: 'bg-mint-500/10 border-mint-500/30',     label: 'Focus 45m' },
  'break':         { color: 'text-gold',        bg: 'bg-gold/10 border-gold/30',              label: 'Break 10m' },
  'deep-recovery': { color: 'text-violet-400',  bg: 'bg-violet-900/20 border-violet-700/40', label: 'Deep Rest 30m' },
} as const;

interface StickyCard {
  id: string;
  content: string;
  imageUrl?: string;
  color: string;
  timerEnd?: string; // ISO
  createdAt: string;
}

const STICKY_COLORS = [
  'bg-yellow-900/40 border-yellow-700/50',
  'bg-violet-900/40 border-violet-700/50',
  'bg-teal-900/40  border-teal-700/50',
  'bg-rose-900/40  border-rose-700/50',
  'bg-sky-900/40   border-sky-700/50',
];

export function NotebookPanel() {
  const t = useT();
  const { isOpen, setOpen, entries, setEntries, addEntry } = useNotebookStore();
  const {
    dailyTasks, setDailyTask, dailyTaskDone, setDailyTaskDone,
    pomodoroMode, pomodoroRunning, pomodoroSeconds, pomodoroRound,
    togglePomodoro, resetPomodoro, advancePomodoro,
    todayNote, setTodayNote,
  } = useFocusStore();
  const {
    goals: neuralGoals, journal: neuralJournal, notes: neuralNotes,
    quickNotes, addQuickNote, updateQuickNoteLabel, deleteQuickNote,
    addGoal: addNeuralGoal, updateGoal: updateNeuralGoal, deleteGoal: deleteNeuralGoal,
    updateGoalContributions, setGoalSharing,
    addGoalNote, addJournalEntry, deleteJournalEntry, moveGoalToJournal,
    archivedGoals, archivedJournalEntries,
    archiveGoal: archiveNeuralGoal, restoreGoal,
    deleteArchivedGoal, deleteArchivedJournalEntry,
  } = useNeuralNotebookStore();
  const {
    musicMuted, setMusicMuted, musicVolume, setMusicVolume,
    workTracks, selectedWorkTrackId,
    completionDialog, setCompletionDialog,
  } = useUIExtStore();
  const selectedWorkTrack = workTracks.find(t => t.id === selectedWorkTrackId) ?? null;
  const meUser = useAuthStore(s => s.user?.name ?? null);

  const [tab, setTab] = useState<Tab>('goals');
  // Panel-Breite an die Bildschirmbreite anpassen (auf 2K schmaler, auf 4K breiter)
  const [panelW, setPanelW] = useState(300);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPanelW(w >= 2400 ? 340 : w >= 1800 ? 300 : w >= 1500 ? 272 : 248);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  const [today, setToday] = useState<NotebookEntry | null>(null);
  const [newGoal, setNewGoal] = useState('');
  const [journalText, setJournalText] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);

  // Neural folder state
  const [newNeuralGoal, setNewNeuralGoal]     = useState('');
  const [newNeuralFolder, setNewNeuralFolder] = useState<GoalFolder>('lebensziele');
  const [expandedFolders, setExpandedFolders] = useState<Record<string,boolean>>({ tägliche:true, lebensziele:true, vereinsziele:false, projekte:false });
  const [newIdeaText, setNewIdeaText]         = useState('');
  const toggleFolder = (f: string) => setExpandedFolders(p => ({ ...p, [f]: !p[f] }));
  // Sub-task state: maps goal index → sub-task list
  const [subTasks, setSubTasks] = useState<Record<number, string[]>>({});
  const [subDraft, setSubDraft] = useState<Record<number, string>>({});
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);

  // AI analysis state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(false);

  // Sticky Notes state
  const [stickies, setStickies] = useState<StickyCard[]>([]);
  const [stickyDraft, setStickyDraft] = useState('');
  const [stickyTimer, setStickyTimer] = useState(''); // minutes
  const [stickyColorIdx, setStickyColorIdx] = useState(0);

  // ⚠️ No interval here — TopBar.tsx owns the single tickPomodoro interval.
  // NotebookPanel only reads pomodoroSeconds from the store (no duplicate ticking).

  const pct = ((POMO_DURATIONS[pomodoroMode] - pomodoroSeconds) / POMO_DURATIONS[pomodoroMode]) * 100;
  const style = POMO_STYLE[pomodoroMode];

  const submitFocusNote = () => {
    if (!todayNote.trim()) return;
    const now = new Date().toISOString();
    addEntry({ id: `note-${Date.now()}`, date: now.split('T')[0], goals: [], journal: todayNote.trim(), teamLogs: [], createdAt: now, updatedAt: now });
    addQuickNote(todayNote.trim());
    setTodayNote('');
  };

  // Sync Focus daily tasks → Goals tab
  const syncTaskToGoal = (task: string) => {
    if (!task.trim()) return;
    setToday(prev => {
      if (!prev) return prev;
      const already = prev.goals.some(g => g.replace(/^[✅🔲]\s*/, '') === task.trim());
      if (already) return prev;
      return { ...prev, goals: [...prev.goals, `🔲 ${task.trim()}`] };
    });
  };

  const addSubTask = (goalIdx: number) => {
    const d = subDraft[goalIdx]?.trim();
    if (!d) return;
    setSubTasks(prev => ({ ...prev, [goalIdx]: [...(prev[goalIdx] ?? []), d] }));
    setSubDraft(prev => ({ ...prev, [goalIdx]: '' }));
  };

  useEffect(() => {
    fetch('/api/notebook')
      .then(r => r.json())
      .then(data => {
        setEntries(data.data ?? []);
        const todayStr = new Date().toISOString().slice(0, 10);
        const t = (data.data ?? []).find((e: NotebookEntry) => e.date === todayStr);
        setToday(t ?? null);
        setJournalText(t?.journal ?? '');
      })
      .catch(() => {});
  }, [setEntries]);

  // ── Sync FocusStore daily tasks → NeuralNotebook 'tägliche' folder ──────────
  useEffect(() => {
    // Repair legacy duplicate IDs/entries first (caused duplicate React keys)
    useNeuralNotebookStore.getState().dedupeGoals();
    const { goals, addGoal, deleteGoal, updateGoal } = useNeuralNotebookStore.getState();
    const activeTasks = dailyTasks.map((t, i) => ({ text: t.trim(), done: dailyTaskDone[i] }));

    // Add missing tägliche goals
    activeTasks.forEach(({ text, done }) => {
      if (!text) return;
      const match = goals.find(g => g.folder === 'tägliche' && g.text === text);
      if (!match) addGoal(text, 'tägliche');
      else if (match.completed !== done) updateGoal(match.id, { completed: done });
    });

    // Remove tägliche goals no longer in dailyTasks (task was cleared)
    goals.filter(g => g.folder === 'tägliche').forEach(g => {
      if (!activeTasks.some(t => t.text === g.text)) deleteGoal(g.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyTasks, dailyTaskDone]);

  const save = async (updates: Partial<NotebookEntry>) => {
    setSaving(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch('/api/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr, ...today, ...updates }),
      });
      const data = await res.json();
      setToday(data.data);
    } finally {
      setSaving(false);
    }
  };

  const addGoal = async () => {
    if (!newGoal.trim()) return;
    const goals = [...(today?.goals ?? []), `🔲 ${newGoal.trim()}`];
    await save({ goals });
    setNewGoal('');
  };

  const injectYoutubeTemplate = () => {
    const template = `---
### 🎥 YOUTUBE WORKSPACE: [Titel-Idee]
- **H - HOOK (3 Sek Rammbock):** 
- **E - EMOTION (Problem aufwerfen):** 
- **I - INSIGHT (Aha-Moment / Der Core-Trick):** 
- **G - GAIN (Nutzen für den Zuschauer):** 
- **H - HIGHLIGHT (VFX- & Edit-Anweisungen):** 
- **T - TAKEAWAY (CTA / DM "AI Business"):** 
---`;
    if (tab === 'journal') {
      const newText = journalText ? `${journalText}\n\n${template}` : template;
      setJournalText(newText);
      save({ journal: newText });
    } else if (tab === 'notes') {
      const newText = stickyDraft ? `${stickyDraft}\n\n${template}` : template;
      setStickyDraft(newText);
    }
  };

  const toggleGoal = async (i: number) => {
    const goals = [...(today?.goals ?? [])];
    goals[i] = goals[i].startsWith('✅') ? goals[i].replace('✅', '🔲') : goals[i].replace('🔲', '✅');
    await save({ goals });
  };

  const LOG_ICONS: Record<string, string> = {
    info: '💬', success: '✅', warning: '⚠️', error: '❌',
  };

  const addSticky = () => {
    if (!stickyDraft.trim()) return;
    const timerEnd = stickyTimer
      ? new Date(Date.now() + parseInt(stickyTimer) * 60000).toISOString()
      : undefined;
    setStickies(prev => [{
      id: generateId('sk'),
      content: stickyDraft.trim(),
      color: STICKY_COLORS[stickyColorIdx],
      timerEnd,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setStickyDraft('');
    setStickyTimer('');
  };

  const removeSticky = (id: string) => setStickies(prev => prev.filter(s => s.id !== id));

  // ── Eden Canvas helper ────────────────────────────────────────────────────────
  const sendToEden = (title: string, content: string) => {
    try {
      const raw = localStorage.getItem('trinity-eden-v1');
      const data = raw ? JSON.parse(raw) : { cards: [], connections: [] };
      const cards: unknown[] = Array.isArray(data.cards) ? data.cards : [];
      const newCard = {
        id: `ec-${Date.now()}`,
        type: 'note',
        title: title.slice(0, 60),
        content,
        x: 80 + Math.random() * 200,
        y: 80 + Math.random() * 200,
        w: 280, h: 140,
        color: '',
      };
      localStorage.setItem('trinity-eden-v1', JSON.stringify({ ...data, cards: [...cards, newCard] }));
    } catch { /* silently fail */ }
  };

  // ── Kanban Tasks helper ───────────────────────────────────────────────────────
  const sendToTasks = (title: string, content: string) => {
    try {
      const raw = localStorage.getItem('trinity-kanban-v2');
      const data = raw ? JSON.parse(raw) : { projects: [], activeProjectId: '', cards: {}, connections: [], groups: [] };
      const projects: unknown[] = Array.isArray(data.projects) ? data.projects : [];
      const cards: Record<string, unknown> = data.cards ?? {};
      // Find or create a "Notizen" column in the active project
      const projectIdx = projects.findIndex((p: unknown) => (p as { id: string }).id === data.activeProjectId);
      if (projectIdx === -1) return;
      const project = projects[projectIdx] as { id: string; name: string; columns: { id: string; label: string; color: string; cardIds: string[] }[] };
      let col = project.columns.find(c => c.label === 'Notizen' || c.label === 'Quick Notes');
      if (!col) {
        col = { id: `col-qn-${Date.now()}`, label: 'Notizen', color: 'text-amber-400', cardIds: [] };
        project.columns.push(col);
      }
      const cardId = `kqn-${Date.now()}`;
      cards[cardId] = { id: cardId, title: title.slice(0, 80), description: content, priority: 'medium', type: 'task', tags: ['notebook'], assignedAgent: '', attachments: [], subtasks: [], createdAt: new Date().toISOString() };
      col.cardIds.push(cardId);
      localStorage.setItem('trinity-kanban-v2', JSON.stringify({ ...data, projects, cards }));
    } catch { /* silently fail */ }
  };

  const StickyCountdown = ({ end }: { end: string }) => {
    const [left, setLeft] = useState(() => Math.max(0, Math.floor((new Date(end).getTime() - Date.now()) / 1000)));
    useEffect(() => {
      const id = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
      return () => clearInterval(id);
    }, []);
    const m = Math.floor(left / 60);
    const s = left % 60;
    return (
      <span className={cn('text-[10px] font-mono shrink-0', left === 0 ? 'text-red-400 animate-pulse' : 'text-anth-500')}>
        {left === 0 ? '⏰ Done' : `${m}:${s.toString().padStart(2, '0')}`}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="notebook"
          aria-label="Mein Notizbuch"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: panelW, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          className="w-notebook-drawer glass-dark border-l border-border flex flex-col overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-gold" />
              <span className="text-sm font-semibold text-forest-100">{t('Daily Notebook')}</span>
            </div>
            <button
              aria-label="Notizbuch schließen"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-anth-500 hover:text-forest-300 hover:bg-forest-800/50 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Clock + Date header */}
          <NotebookClock />

          {/* ── Focus Widget (collapsed by default) ── */}
          <div className="border-b border-border/40 shrink-0">
            <button
              onClick={() => setFocusOpen(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-anth-400 hover:text-mint-light hover:bg-forest-800/20 transition-colors"
            >
              <Eye size={11} className="text-mint-500" />
              <span className="flex-1 text-left font-medium">Fokus-Time</span>
              {pomodoroRunning && (
                <span className={cn('font-mono text-[10px] font-bold', style.color)}>{fmtSec(pomodoroSeconds)}</span>
              )}
              <ChevronDown size={10} className={cn('transition-transform', focusOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {focusOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 space-y-3">
                    {/* Daily Tasks */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] uppercase tracking-widest text-anth-600">Daily Tasks</p>
                      {[0, 1, 2].map(i => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="text-[10px] text-anth-600 w-4 shrink-0">{i + 1}.</span>
                          <input
                            value={dailyTasks[i] ?? ''}
                            onChange={e => setDailyTask(i as 0 | 1 | 2, e.target.value)}
                            onBlur={() => syncTaskToGoal(dailyTasks[i] ?? '')}
                            placeholder={`Task ${i + 1}…`}
                            className="flex-1 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-forest-100 placeholder-anth-600 outline-none focus:border-mint-500/40 transition-colors"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Pomodoro */}
                    <div className={cn('rounded-xl border p-3 space-y-2', style.bg)}>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-[9px] uppercase tracking-widest font-semibold', style.color)}>{style.label}</span>
                        <span className="text-[9px] text-anth-500">Round {pomodoroRound}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-anth-800 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pomodoroMode === 'focus' ? 'bg-mint-500' : pomodoroMode === 'break' ? 'bg-gold' : 'bg-violet-500')}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xl font-mono font-bold', style.color)}>{fmtSec(pomodoroSeconds)}</span>
                        <div className="flex gap-1">
                          <button onClick={togglePomodoro} className={cn('p-1.5 rounded-lg border transition-colors', style.bg)}>
                            {pomodoroRunning ? <Pause size={12} className={style.color} /> : <Play size={12} className={style.color} />}
                          </button>
                          <button onClick={resetPomodoro} className="p-1.5 rounded-lg border border-anth-700 text-anth-500 hover:text-anth-300 transition-colors">
                            <RotateCcw size={12} />
                          </button>
                          <button onClick={advancePomodoro} className="p-1.5 rounded-lg border border-anth-700 text-anth-500 hover:text-anth-300 transition-colors">
                            <SkipForward size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Musik Lautstärke & Mute */}
                    <div className="rounded-xl border border-border/60 bg-anth-900/30 px-3 py-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMusicMuted(!musicMuted)}
                          title={musicMuted ? t('Musik an') : t('Musik stumm')}
                          className="shrink-0 hover:opacity-80 transition-opacity"
                        >
                          {musicMuted
                            ? <VolumeX size={13} className="text-anth-500" />
                            : <Volume2 size={13} className={pomodoroRunning && pomodoroMode === 'focus' ? 'text-mint-400 animate-pulse' : 'text-anth-400'} />
                          }
                        </button>
                        {selectedWorkTrack
                          ? <span className="text-[10px] text-anth-300 truncate flex-1">{selectedWorkTrack.name}</span>
                          : <span className="text-[10px] text-anth-600 flex-1 italic">{t('Kein Track gewählt')}</span>
                        }
                        <span className="text-[9px] text-anth-600 tabular-nums shrink-0">
                          {musicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={musicMuted ? 0 : musicVolume}
                        onChange={e => { setMusicVolume(Number(e.target.value)); setMusicMuted(false); }}
                        className="w-full h-1 accent-mint-500 cursor-pointer"
                      />
                    </div>

                    {/* Today's Note */}
                    <div>
                      <div className="flex gap-1.5">
                        <textarea
                          value={todayNote}
                          onChange={e => setTodayNote(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitFocusNote(); } }}
                          placeholder="Quick note → Notebook…"
                          rows={2}
                          className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-forest-100 placeholder-anth-600 outline-none focus:border-mint-500/40 resize-none transition-colors"
                        />
                        <button onClick={submitFocusNote} className="px-2 rounded-lg bg-mint-500/15 border border-mint-500/30 text-mint-500 hover:bg-mint-500/25 transition-colors text-xs">
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/60">
            {([
              { id: 'goals',   label: 'Goals',   icon: Target   },
              { id: 'journal', label: 'Journal',  icon: FileText },
              { id: 'notes',   label: 'Notes',    icon: StickyNote },
              { id: 'logs',    label: 'Logs',     icon: Users    },
              { id: 'archiv',  label: 'Archiv',   icon: Archive  },
            ] as { id: Tab; label: string; icon: React.FC<{ size?: number; className?: string }> }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors',
                  tab === id
                    ? 'text-forest-300 border-b-2 border-forest-500 bg-forest-800/20'
                    : 'text-anth-400 hover:text-forest-400'
                )}
              >
                <Icon size={11} />
                {t(label)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Goals · Neural Folder Tree ── */}
            {tab === 'goals' && (() => {
              // Category config (including new 'tägliche')
              const FOLDERS = [
                { key: 'tägliche'   as GoalFolder, label: 'Tägliche Ziele', emoji: '⚡', color: 'text-mint-400',    bg: 'bg-forest-950/40',   border: 'border-forest-700/40',  hex: '#11CAA0' },
                { key: 'lebensziele' as GoalFolder, label: 'Lebensziele',    emoji: '🌟', color: 'text-gold',       bg: 'bg-yellow-950/30',   border: 'border-yellow-800/40',  hex: '#C9A84C' },
                { key: 'vereinsziele'as GoalFolder, label: 'Company-Ziele',   emoji: '🤝', color: 'text-violet-300', bg: 'bg-violet-950/30',   border: 'border-violet-800/40',  hex: '#a78bfa' },
                { key: 'projekte'    as GoalFolder, label: 'Projekte',       emoji: '🚀', color: 'text-sky-300',    bg: 'bg-sky-950/30',      border: 'border-sky-800/40',     hex: '#7dd3fc' },
              ] as const;
              const CAT_HEX: Record<MainGoalFolder, string> = { lebensziele:'#C9A84C', vereinsziele:'#a78bfa', projekte:'#7dd3fc' };
              const CAT_LABELS: Record<MainGoalFolder, string> = { lebensziele:'L', vereinsziele:'V', projekte:'P' };

              const toggleContribution = (goalId: string, cat: MainGoalFolder, current: MainGoalFolder[]) => {
                const next = current.includes(cat)
                  ? current.filter(c => c !== cat)
                  : [...current, cat];
                updateGoalContributions(goalId, next);
              };

              return (
              <div className="p-3 space-y-1.5">
                {/* KI-Analyse header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[9px] text-anth-600">Neural Goals</span>
                  <button
                    onClick={async () => {
                      setAiAnalyzing(true);
                      try {
                        const goalList = neuralGoals.map(g => `[${g.id}] (${g.folder}) ${g.text}`).join('\n');
                        const prompt = `Analysiere diese Ziele und bestimme für jedes, welche der Kategorien "lebensziele", "vereinsziele", "projekte" es beeinflusst.\nAntworte NUR als JSON-Array: [{"id": "g1", "contributesTo": ["lebensziele"]}, ...]\n\nZiele:\n${goalList}`;
                        const res = await fetch('/api/agents/advisor/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
                        });
                        if (!res.ok) throw new Error('API not available');
                        const data = await res.json();
                        const content = data.message?.content ?? data.content ?? '';
                        const match = content.match(/\[[\s\S]*\]/);
                        if (match) {
                          const parsed = JSON.parse(match[0]) as { id: string; contributesTo: MainGoalFolder[] }[];
                          parsed.forEach(({ id, contributesTo }) => updateGoalContributions(id, contributesTo));
                        }
                      } catch {
                        setAiError(true);
                        setTimeout(() => setAiError(false), 3000);
                      } finally {
                        setAiAnalyzing(false);
                      }
                    }}
                    disabled={aiAnalyzing}
                    className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg bg-anth-800/60 border border-border hover:border-mint-500/40 text-anth-400 hover:text-mint-400 transition-all disabled:opacity-50">
                    {aiAnalyzing ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                    {aiAnalyzing ? t('Analysiere…') : t('KI-Analyse')}
                  </button>
                </div>
                {aiError && <p className="text-[9px] text-amber-500 px-1 mb-2">{t('Berater-KI nicht verbunden. Bitte API-Key konfigurieren.')}</p>}
                {FOLDERS.map(({ key, label, emoji, color, bg, border }) => {
                  const folderGoals = neuralGoals.filter(g => g.folder === key && goalVisibleTo(g, meUser));
                  const isOpen      = expandedFolders[key];
                  const isDailyFolder = key === 'tägliche';
                  const doneCount = folderGoals.filter(g => g.completed).length;
                  return (
                    <div key={key} className={cn('rounded-xl border overflow-hidden', border)}>
                      {/* Folder header */}
                      <button onClick={() => toggleFolder(key)}
                        className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors', bg, color, 'hover:opacity-90')}>
                        {isOpen ? <FolderOpen size={11}/> : <Folder size={11}/>}
                        <span className="text-sm">{emoji}</span>
                        <span className="flex-1 text-left uppercase tracking-widest">{t(label)}</span>
                        {isDailyFolder && folderGoals.length > 0 && (
                          <span className="text-[8px] font-normal opacity-60">{doneCount}/{folderGoals.length}</span>
                        )}
                        {!isDailyFolder && <span className="text-anth-500 font-normal">{folderGoals.length}</span>}
                        <ChevronDown size={10} className={cn('transition-transform', isOpen && 'rotate-180')}/>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.18}} className="overflow-hidden">
                            <div className="px-3 py-2 space-y-1">
                              {folderGoals.length === 0 && (
                                <p className="text-[9px] text-anth-600 py-1">
                                  {isDailyFolder ? t('Trage deine 3 täglichen Aufgaben im Focus-Widget ein.') : t('Noch keine Einträge.')}
                                </p>
                              )}
                              {folderGoals.map(goal => {
                                const contribs = goal.contributesTo ?? [];
                                // Build gradient string for contribution bar
                                const gradientStops = contribs.length === 0 ? null
                                  : contribs.map((c, ci) => {
                                      const pct = 100 / contribs.length;
                                      return `${CAT_HEX[c as MainGoalFolder]} ${ci * pct}% ${(ci+1) * pct}%`;
                                    }).join(', ');
                                return (
                                  <div key={goal.id} className="group">
                                    {/* Main row */}
                                    <div className="flex items-start gap-2 py-0.5">
                                      <button
                                        onClick={() => {
                                          if (goal.completed) {
                                            // Un-check: directly toggle
                                            updateNeuralGoal(goal.id, { completed: false });
                                            if (isDailyFolder) {
                                              const { dailyTasks: dt, setDailyTaskDone: sdd } = useFocusStore.getState();
                                              const idx = dt.findIndex(t => t.trim() === goal.text) as 0|1|2;
                                              if (idx >= 0) sdd(idx, false);
                                            }
                                          } else {
                                            // Check: open completion dialog
                                            if (isDailyFolder) {
                                              const { dailyTasks: dt } = useFocusStore.getState();
                                              const idx = dt.findIndex(t => t.trim() === goal.text);
                                              setCompletionDialog({ goalId: goal.id, goalText: goal.text, source: 'daily', dailyIdx: idx >= 0 ? idx : undefined });
                                            } else {
                                              setCompletionDialog({ goalId: goal.id, goalText: goal.text, source: 'neural' });
                                            }
                                          }
                                        }}
                                        className={cn('mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors',
                                          goal.completed
                                            ? isDailyFolder ? 'bg-mint-600/40 border-mint-500' : 'bg-forest-600/60 border-forest-500'
                                            : 'border-anth-600 group-hover:border-forest-500'
                                        )}>
                                        {goal.completed && <Check size={9} className={isDailyFolder ? 'text-mint-300' : 'text-forest-300'}/>}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <span className={cn('text-xs leading-relaxed', goal.completed ? 'line-through text-anth-500' : 'text-anth-200')}>
                                          {goal.text}
                                        </span>
                                        {/* Contribution bar */}
                                        {gradientStops && (
                                          <div className="h-[2px] w-full rounded-full mt-0.5 overflow-hidden"
                                            style={{ background: `linear-gradient(to right, ${gradientStops})` }} />
                                        )}
                                        {/* Contribution chip toggles (visible on hover) */}
                                        <div className="flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-[7px] text-anth-600 mr-0.5 self-center">→</span>
                                          {(['lebensziele','vereinsziele','projekte'] as MainGoalFolder[]).map(cat => (
                                            <button key={cat} onClick={() => toggleContribution(goal.id, cat, contribs)}
                                              title={cat}
                                              className={cn(
                                                'text-[7px] w-4 h-4 rounded-full border flex items-center justify-center font-bold transition-all',
                                                contribs.includes(cat)
                                                  ? 'opacity-100 scale-110'
                                                  : 'opacity-30 hover:opacity-70'
                                              )}
                                              style={{
                                                borderColor: CAT_HEX[cat],
                                                color: CAT_HEX[cat],
                                                background: contribs.includes(cat) ? `${CAT_HEX[cat]}22` : 'transparent',
                                              }}>
                                              {CAT_LABELS[cat]}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Action buttons */}
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        {/* Share picker — project goals only */}
                                        {key === 'projekte' && (
                                          <SharePicker
                                            value={goal.sharedWith}
                                            onChange={v => setGoalSharing(goal.id, v ?? undefined)}
                                            iconSize={12}
                                          />
                                        )}
                                        {!isDailyFolder && (
                                          <>
                                            <button onClick={() => sendToEden(goal.text, `${t('Ziel')}: ${goal.text}`)} title={t('→ Eden Canvas senden')}
                                              className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-mint-400 hover:bg-anth-700/60 transition-colors"><LayoutTemplate size={12}/></button>
                                            <button onClick={() => sendToTasks(goal.text, `${t('Ziel')}: ${goal.text}`)} title={t('→ Aufgaben hinzufügen')}
                                              className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-sky-400 hover:bg-anth-700/60 transition-colors"><ListTodo size={12}/></button>
                                            <button onClick={() => moveGoalToJournal(goal.id, 'ideen')} title={t('→ Ins Ideen-Journal verschieben')}
                                              className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-violet-400 hover:bg-anth-700/60 transition-colors"><MoveRight size={12}/></button>
                                          </>
                                        )}
                                        <button onClick={() => deleteNeuralGoal(goal.id)} title={t('Ziel löschen')}
                                          className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={12}/></button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Add extra daily goals */}
                              {isDailyFolder && (
                                <div className="flex gap-1.5 mt-1.5">
                                  <input
                                    placeholder={t('Weiteres tägliches Ziel…')}
                                    className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1 text-[11px] text-forest-100 placeholder-anth-500 outline-none focus:border-mint-500/40 transition-colors"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                        addNeuralGoal((e.target as HTMLInputElement).value.trim(), 'tägliche');
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Add goal (non-daily folders) */}
                <div className="pt-2 flex gap-1.5">
                  <select value={newNeuralFolder} onChange={e => setNewNeuralFolder(e.target.value as GoalFolder)}
                    className="bg-surface border border-border rounded-lg px-2 text-[10px] text-forest-100 outline-none shrink-0">
                    <option value="tägliche">{t('Täglich')}</option>
                    <option value="lebensziele">{t('Leben')}</option>
                    <option value="vereinsziele">{t('Company')}</option>
                    <option value="projekte">{t('Projekt')}</option>
                  </select>
                  <input value={newNeuralGoal} onChange={e => setNewNeuralGoal(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter' && newNeuralGoal.trim()) { addNeuralGoal(newNeuralGoal.trim(), newNeuralFolder); setNewNeuralGoal(''); } }}
                    placeholder={t('Neues Ziel hinzufügen…')}
                    className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-forest-100 placeholder-anth-500 outline-none focus:border-forest-600 transition-colors" />
                  <button onClick={() => { if (newNeuralGoal.trim()) { addNeuralGoal(newNeuralGoal.trim(), newNeuralFolder); setNewNeuralGoal(''); } }}
                    className="p-1.5 rounded-lg bg-forest-700/60 text-forest-300 hover:bg-forest-600/60 transition-colors shrink-0">
                    <Plus size={13}/>
                  </button>
                </div>

                {/* Legacy daily goals from NotebookStore (kept for backward compat) */}
                {(today?.goals ?? []).length > 0 && (
                  <div className="pt-3 border-t border-border/40">
                    <p className="text-[8px] uppercase tracking-widest text-anth-600 mb-1.5">{t('Ältere Tages-Ziele')}</p>
                    {(today?.goals ?? []).map((goal, i) => (
                      <div key={i} className="flex items-start gap-2 group py-0.5">
                        <button onClick={() => toggleGoal(i)}
                          className={cn('mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center',
                            goal.startsWith('✅') ? 'bg-forest-600/50 border-forest-500' : 'border-border group-hover:border-forest-600'
                          )}>
                          {goal.startsWith('✅') && <Check size={9} className="text-forest-300"/>}
                        </button>
                        <span onClick={() => toggleGoal(i)}
                          className={cn('text-xs flex-1 leading-relaxed cursor-pointer', goal.startsWith('✅') ? 'line-through text-anth-500' : 'text-anth-200')}>
                          {goal.replace(/^[✅🔲]\s*/, '')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })()}

            {/* ── Journal ── */}
            {tab === 'journal' && (
              <div className="p-3 space-y-3">
                {/* Dedicated YouTube Studio Section */}
                <div className="rounded-xl border border-emerald-800/40 overflow-hidden bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-800/30 bg-emerald-900/10">
                    <Play size={11} className="text-emerald-400 shrink-0"/>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-semibold flex-1">🎬 YouTube Studio</span>
                  </div>
                  <div className="p-2.5">
                    <button
                      onClick={injectYoutubeTemplate}
                      className="w-full py-2 px-3 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-500/35 bg-emerald-950/45 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_18px_rgba(16,185,129,0.3)]"
                    >
                      {t('🎬 Neues YouTube-Skript (HEIGHT)')}
                    </button>
                  </div>
                </div>

                {/* Ideen folder from Neural Notebook */}
                <div className="rounded-xl border border-violet-800/40 overflow-hidden bg-violet-950/20">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-violet-800/30">
                    <FolderOpen size={11} className="text-violet-400 shrink-0"/>
                    <span className="text-[9px] uppercase tracking-widest text-violet-300 font-semibold flex-1">{t('Ideen')}</span>
                    <a href={process.env.NEXT_PUBLIC_JOURNALIT_URL ?? '#'} target="_blank" rel="noopener noreferrer"
                      title={t('In Journal It öffnen')}
                      className="text-[9px] text-anth-600 hover:text-violet-300 transition-colors flex items-center gap-1">
                      <ExternalLink size={9}/> JournalIt
                    </a>
                  </div>
                  <div className="p-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {neuralJournal.filter(j=>j.folder==='ideen').map(entry => (
                      <div key={entry.id} className="flex items-start gap-2 group p-1.5 rounded-lg hover:bg-violet-900/20 transition-colors">
                        <span className="text-xs flex-1 leading-relaxed" style={{ color: '#e2ffe9' }}>{entry.text}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => sendToEden(entry.text, entry.text)} title={t('→ Eden Canvas senden')}
                            className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-mint-400 hover:bg-anth-700/60 transition-colors">
                            <LayoutTemplate size={12}/>
                          </button>
                          <button onClick={() => sendToTasks(entry.text, entry.text)} title={t('→ Aufgaben hinzufügen')}
                            className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-sky-400 hover:bg-anth-700/60 transition-colors">
                            <ListTodo size={12}/>
                          </button>
                          <button onClick={() => navigator.clipboard.writeText(entry.text)}
                            title={t('Text kopieren')}
                            className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-violet-400 hover:bg-anth-700/60 transition-colors">
                            <Copy size={12}/>
                          </button>
                          <a href={process.env.NEXT_PUBLIC_JOURNALIT_URL ?? '#'} target="_blank" rel="noopener noreferrer"
                            title={t('In Journal It öffnen')}
                            className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-violet-400 hover:bg-anth-700/60 transition-colors">
                            <ExternalLink size={12}/>
                          </a>
                          <button onClick={() => deleteJournalEntry(entry.id)} title={t('Eintrag löschen')}
                            className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-red-400 hover:bg-red-900/20 transition-all">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </div>
                    ))}
                    {neuralJournal.filter(j=>j.folder==='ideen').length === 0 && (
                      <p className="text-[9px] text-anth-600 py-1 px-1">{t('Noch keine Ideen.')}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 p-2 border-t border-violet-800/30">
                    <input value={newIdeaText} onChange={e=>setNewIdeaText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&newIdeaText.trim()){addJournalEntry(newIdeaText.trim(),'ideen');setNewIdeaText('');} }}
                      placeholder={t('Neue Idee…')}
                      className="flex-1 bg-anth-900/50 border border-violet-800/40 rounded-lg px-2 py-1 text-[10px] placeholder-anth-600 outline-none focus:border-violet-600/60 transition-colors"
                      style={{ color: '#e2ffe9' }} />
                    <button onClick={()=>{ if(newIdeaText.trim()){addJournalEntry(newIdeaText.trim(),'ideen');setNewIdeaText('');} }}
                      className="p-1 rounded-lg bg-violet-700/30 border border-violet-600/30 text-violet-400 hover:bg-violet-700/50 transition-colors">
                      <Plus size={11}/>
                    </button>
                  </div>
                </div>

                {/* Daily journal text */}
                <div className="flex flex-col">
                  <p className="text-[9px] uppercase tracking-widest text-anth-600 mb-1.5">{t('Tages-Journal')}</p>
                  <textarea
                    value={journalText}
                    onChange={e => setJournalText(e.target.value)}
                    onBlur={() => save({ journal: journalText })}
                    placeholder={t('Gedanken, Siege, Reflektionen für heute…')}
                    className="w-full bg-transparent text-xs placeholder-anth-600 outline-none resize-none leading-relaxed min-h-[120px]"
                    style={{ color: '#e2ffe9' }}
                    rows={8}
                  />
                  {saving && <p className="text-[10px] text-anth-500 mt-1">Saving…</p>}
                </div>
              </div>
            )}

            {/* ── Sticky Notes ── */}
            {tab === 'notes' && (
              <div className="p-3 space-y-3">
                {/* Dedicated YouTube Studio Section inside Notes tab too */}
                <div className="rounded-xl border border-emerald-800/40 overflow-hidden bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-800/30 bg-emerald-900/10">
                    <Play size={11} className="text-emerald-400 shrink-0"/>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-semibold flex-1">🎬 YouTube Studio</span>
                  </div>
                  <div className="p-2.5">
                    <button
                      onClick={injectYoutubeTemplate}
                      className="w-full py-2 px-3 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-500/35 bg-emerald-950/45 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_18px_rgba(16,185,129,0.3)]"
                    >
                      {t('🎬 Neues YouTube-Skript (HEIGHT)')}
                    </button>
                  </div>
                </div>

                {/* ── Quick Notes (from Focus widget) ── */}
                {quickNotes.length > 0 && (
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-mint-500 mb-1.5 flex items-center gap-1">
                      <Tag size={9}/> Quick Notes
                    </p>
                    <div className="space-y-1.5">
                      {quickNotes.map(qn => (
                        <div key={qn.id} className="rounded-xl border border-mint-700/30 bg-mint-900/10 px-2.5 py-2 group">
                          <div className="flex items-start gap-2">
                            <p className="text-xs flex-1 leading-relaxed" style={{ color: '#e2ffe9' }}>{qn.text}</p>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => sendToEden(qn.text, qn.text)} title={t('→ Eden Canvas senden')}
                                className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-mint-400 hover:bg-anth-700/60 transition-colors">
                                <LayoutTemplate size={12}/>
                              </button>
                              <button onClick={() => sendToTasks(qn.text, qn.text)} title={t('→ Aufgaben hinzufügen')}
                                className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-sky-400 hover:bg-anth-700/60 transition-colors">
                                <ListTodo size={12}/>
                              </button>
                              <button onClick={() => deleteQuickNote(qn.id)} title={t('Notiz löschen')}
                                className="p-1 rounded-md bg-anth-800/60 text-anth-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          </div>
                          {/* Label field */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] text-anth-600">Label:</span>
                            <input
                              defaultValue={qn.label}
                              onBlur={e => updateQuickNoteLabel(qn.id, e.target.value || 'quick')}
                              className="flex-1 bg-anth-900/40 border border-mint-700/20 rounded px-1.5 py-0.5 text-[9px] text-mint-300 outline-none focus:border-mint-600/50 transition-colors"
                              placeholder="quick"
                            />
                            <span className="text-[8px] text-anth-700">{new Date(qn.createdAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Neural Notes: From Goals */}
                {neuralNotes.filter(n=>n.folder==='from-goals').length > 0 && (
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-gold mb-1">📁 {t('Von Zielen')}</p>
                    <div className="space-y-1">
                      {neuralNotes.filter(n=>n.folder==='from-goals').slice(0,5).map(n => (
                        <div key={n.id} className="rounded-lg border border-yellow-800/40 bg-yellow-950/20 px-2.5 py-1.5 text-[10px] leading-relaxed" style={{ color: '#e2ffe9' }}>
                          {n.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Neural Notes: From Journal */}
                {neuralNotes.filter(n=>n.folder==='from-journal').length > 0 && (
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-violet-400 mb-1">📁 {t('Von Journal')}</p>
                    <div className="space-y-1">
                      {neuralNotes.filter(n=>n.folder==='from-journal').slice(0,5).map(n => (
                        <div key={n.id} className="rounded-lg border border-violet-800/40 bg-violet-950/20 px-2.5 py-1.5 text-[10px] leading-relaxed" style={{ color: '#e2ffe9' }}>
                          {n.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New note composer */}
                <div className="glass rounded-xl border border-border p-3 space-y-2">
                  <textarea
                    value={stickyDraft}
                    onChange={e => setStickyDraft(e.target.value)}
                    placeholder="Write a note…"
                    rows={3}
                    className="w-full bg-transparent text-xs placeholder-anth-600 outline-none resize-none leading-relaxed"
                    style={{ color: '#e2ffe9' }}
                  />
                  <div className="flex items-center gap-2">
                    {/* Color picker dots */}
                    <div className="flex gap-1">
                      {STICKY_COLORS.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setStickyColorIdx(i)}
                          className={cn('w-3.5 h-3.5 rounded-full border', c,
                            i === stickyColorIdx ? 'ring-1 ring-white/50 ring-offset-1 ring-offset-bg' : ''
                          )}
                        />
                      ))}
                    </div>
                    {/* Timer input */}
                    <div className="flex items-center gap-1 ml-auto">
                      <Timer size={10} className="text-anth-500" />
                      <input
                        type="number"
                        min={1}
                        value={stickyTimer}
                        onChange={e => setStickyTimer(e.target.value)}
                        placeholder="min"
                        className="w-12 bg-surface border border-border rounded-md px-1.5 py-1 text-[10px] text-anth-300 outline-none"
                      />
                    </div>
                    <button
                      onClick={addSticky}
                      disabled={!stickyDraft.trim()}
                      className="p-1.5 rounded-lg bg-mint-500/15 border border-mint-500/30 text-mint-500 hover:bg-mint-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Sticky card grid */}
                {stickies.length === 0 ? (
                  <p className="text-xs text-anth-600 text-center py-4">No notes yet — add one above.</p>
                ) : (
                  <div className="space-y-2">
                    {stickies.map(card => (
                      <div key={card.id} className={cn('rounded-xl border p-3 space-y-1.5', card.color)}>
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#e2ffe9' }}>{card.content}</p>
                          <button onClick={() => removeSticky(card.id)} className="p-0.5 text-anth-600 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 size={10} />
                          </button>
                        </div>
                        {card.timerEnd && (
                          <div className="flex items-center gap-1 border-t border-white/10 pt-1.5">
                            <Timer size={9} className="text-anth-600" />
                            <StickyCountdown end={card.timerEnd} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Team Logs ── */}
            {tab === 'logs' && (
              <div className="p-4 space-y-2">
                {(today?.teamLogs ?? []).length === 0 ? (
                  <p className="text-xs text-anth-500 text-center py-8">No logs for today yet.</p>
                ) : (
                  [...(today?.teamLogs ?? [])].reverse().map((log: TeamLog) => {
                    const colors = AGENT_COLORS[log.agentId] ?? AGENT_COLORS.system;
                    return (
                      <div key={log.id} className="flex gap-2.5 p-2 rounded-lg hover:bg-forest-800/20">
                        <span className="text-sm shrink-0">{LOG_ICONS[log.type] ?? '💬'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn('text-[10px] font-medium', colors.text)}>
                              {log.agentId}
                            </span>
                            <span className="text-[10px] text-anth-600">
                              {fmtDateTime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-anth-300 leading-relaxed">{log.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Archiv ── */}
            {tab === 'archiv' && (
              <div className="p-3 space-y-3">
                {/* Archivierte Ziele */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-anth-500 mb-2 flex items-center gap-1">
                    <Archive size={9}/> {t('Archivierte Ziele')} ({archivedGoals.length})
                  </p>
                  {archivedGoals.length === 0 && <p className="text-[9px] text-anth-700">{t('Keine archivierten Ziele.')}</p>}
                  {archivedGoals.map(item => (
                    <div key={item.id} className="flex items-center gap-2 py-1 group border-b border-border/20">
                      <span className="flex-1 text-[10px] text-anth-400 line-through">{item.text}</span>
                      <span className="text-[8px] text-anth-600">{new Date(item.archivedAt).toLocaleDateString('de-AT')}</span>
                      <button onClick={() => restoreGoal(item.id)} title={t('Wiederherstellen')}
                        className="p-0.5 text-anth-600 hover:text-mint-400 opacity-0 group-hover:opacity-100"><RotateCcw size={9}/></button>
                      <button onClick={() => deleteArchivedGoal(item.id)} title={t('Löschen')}
                        className="p-0.5 text-anth-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={9}/></button>
                    </div>
                  ))}
                </div>
                {/* Archiviertes Journal */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-anth-500 mb-2 flex items-center gap-1">
                    <Archive size={9}/> {t('Archiviertes Journal')} ({archivedJournalEntries.length})
                  </p>
                  {archivedJournalEntries.length === 0 && <p className="text-[9px] text-anth-700">{t('Keine archivierten Journal-Einträge.')}</p>}
                  {archivedJournalEntries.map(item => (
                    <div key={item.id} className="flex items-center gap-2 py-1 group border-b border-border/20">
                      <span className="flex-1 text-[10px] text-anth-400 truncate">{item.text.slice(0,60)}…</span>
                      <span className="text-[8px] text-anth-600">{new Date(item.archivedAt).toLocaleDateString('de-AT')}</span>
                      <button onClick={() => deleteArchivedJournalEntry(item.id)}
                        className="p-0.5 text-anth-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={9}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
