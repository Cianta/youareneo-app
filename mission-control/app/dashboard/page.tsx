'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, AlertTriangle, ShoppingBag, GraduationCap, TrendingUp, Users, Bell, Sparkles, Ghost, ChevronDown, Target, Bot, CheckSquare } from 'lucide-react';
import { useAgentStore, useUIExtStore, useNeuralNotebookStore, useFocusStore, useNinjasStore, useAuthStore, goalVisibleTo } from '@/lib/store';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { MetatronsCube } from '@/components/sacred-geometry/MetatronsCube';
import { Button } from '@/components/ui/Button';
import { cn, AGENT_COLORS } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { GoalFolder } from '@/lib/store';
import type { AgentConfig, SystemMetrics } from '@/types';

// ── Column 1: Daily Tasks + Ziele (linked to Notebooks) ───────────────────────
const MC_FOLDERS: { id: GoalFolder; label: string; color: string; dot: string }[] = [
  { id: 'tägliche',     label: 'Tägliche Ziele', color: 'text-mint-400',   dot: 'bg-mint-500'   },
  { id: 'lebensziele',  label: 'Lebensziele',    color: 'text-gold',       dot: 'bg-gold'       },
  { id: 'vereinsziele', label: 'Company-Ziele',   color: 'text-violet-300', dot: 'bg-violet-400' },
  { id: 'projekte',     label: 'Projekte',       color: 'text-sky-300',    dot: 'bg-sky-400'    },
];

function GoalsColumn() {
  const t = useT();
  const { dailyTasks, dailyTaskDone, setDailyTaskDone } = useFocusStore();
  const { goals, updateGoal, addGoal } = useNeuralNotebookStore();
  const { setCompletionDialog } = useUIExtStore();
  const me = useAuthStore(s => s.user?.name ?? null);
  const [open, setOpen] = useState<Record<string, boolean>>({ tägliche: true, lebensziele: true });
  const [newGoal, setNewGoal] = useState('');
  const [newFolder, setNewFolder] = useState<GoalFolder>('lebensziele');

  const submitGoal = () => {
    if (!newGoal.trim()) return;
    addGoal(newGoal.trim(), newFolder);
    setNewGoal('');
    setOpen(o => ({ ...o, [newFolder]: true }));
  };

  return (
    <div className="glass rounded-2xl border border-border p-4 flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Target size={14} className="text-gold" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-anth-600">{t('Daily Tasks & Ziele')}</p>
          <p className="text-xs font-semibold text-forest-100">{t('Verbunden mit Notebooks')}</p>
        </div>
      </div>

      {/* Daily Focus Tasks */}
      <div className="space-y-1 mb-3 shrink-0">
        {([0,1,2] as const).map(i => dailyTasks[i].trim() && (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface/50 border border-border/50">
            <button onClick={() => setDailyTaskDone(i, !dailyTaskDone[i])}
              className={cn('w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors',
                dailyTaskDone[i] ? 'bg-mint-500/30 border-mint-500' : 'border-anth-600 hover:border-mint-500/50')}>
              {dailyTaskDone[i] && <CheckSquare size={9} className="text-mint-400" />}
            </button>
            <span className={cn('text-xs truncate', dailyTaskDone[i] ? 'line-through text-anth-500' : 'text-anth-200')}>
              {dailyTasks[i]}
            </span>
          </div>
        ))}
        {!dailyTasks.some(t => t.trim()) && (
          <p className="text-[10px] text-anth-600 px-1">{t('Daily Tasks im Focus-Widget eintragen ↗')}</p>
        )}
      </div>

      {/* Goal folders (collapsible, live from NeuralNotebook) */}
      <div className="space-y-1.5 overflow-y-auto min-h-0 flex-1">
        {MC_FOLDERS.map(f => {
          const fGoals = goals.filter(g => g.folder === f.id && goalVisibleTo(g, me));
          const done   = fGoals.filter(g => g.completed).length;
          const isOpen = open[f.id];
          return (
            <div key={f.id} className="rounded-xl border border-border/50 overflow-hidden">
              <button onClick={() => setOpen(o => ({ ...o, [f.id]: !o[f.id] }))}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-surface/40 hover:bg-surface/70 transition-colors">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', f.dot)} />
                <span className={cn('flex-1 text-left text-[11px] font-semibold uppercase tracking-wider', f.color)}>{t(f.label)}</span>
                <span className="text-[9px] text-anth-600">{done}/{fGoals.length}</span>
                <ChevronDown size={10} className={cn('text-anth-600 transition-transform', isOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.15}} className="overflow-hidden">
                    <div className="px-2.5 py-1.5 space-y-1">
                      {fGoals.length === 0 && <p className="text-[10px] text-anth-700">{t('Keine Einträge.')}</p>}
                      {fGoals.map(g => (
                        <div key={g.id} className="flex items-center gap-2">
                          <button onClick={() => {
                              if (!g.completed) setCompletionDialog({ goalId: g.id, goalText: g.text, source: 'neural' });
                              else updateGoal(g.id, { completed: false });
                            }}
                            className={cn('w-3 h-3 rounded border shrink-0 transition-colors',
                              g.completed ? 'bg-forest-600/60 border-forest-500' : 'border-anth-600 hover:border-forest-500')} />
                          <span className={cn('text-[11px] truncate', g.completed ? 'line-through text-anth-500' : 'text-anth-300')}>{g.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Add goal — same as Notebooks */}
      <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/40 shrink-0">
        <select value={newFolder} onChange={e => setNewFolder(e.target.value as GoalFolder)}
          className="bg-surface border border-border rounded-lg px-1.5 text-[9px] text-forest-100 outline-none shrink-0">
          <option value="tägliche">{t('Täglich')}</option>
          <option value="lebensziele">{t('Leben')}</option>
          <option value="vereinsziele">{t('Company')}</option>
          <option value="projekte">{t('Projekt')}</option>
        </select>
        <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitGoal()}
          placeholder={t('Neues Ziel…')}
          className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors" />
        <button onClick={submitGoal} disabled={!newGoal.trim()}
          className="p-1.5 rounded-lg bg-mint-500/15 border border-mint-500/30 text-mint-500 hover:bg-mint-500/25 disabled:opacity-40 transition-colors shrink-0">
          <Target size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Column 2: Idea Correlation Engine ──────────────────────────────────────────
function IdeasColumn() {
  const t = useT();
  const { neuralGhostEnabled, toggleNeuralGhost } = useUIExtStore();
  const { journal, addJournalEntry, addJournalNote } = useNeuralNotebookStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [newIdea, setNewIdea] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const ideas = journal.filter(j => j.folder === 'ideen');
  const others = journal.filter(j => j.folder !== 'ideen');

  const submitIdea = () => {
    if (!newIdea.trim()) return;
    addJournalEntry(newIdea.trim(), 'ideen');
    setNewIdea('');
  };

  const attachImage = (entryId: string, file: File) => {
    if (file.size > 2_000_000) { alert('Bild zu groß (max 2 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => addJournalNote(entryId, `img:${reader.result as string}`);
    reader.readAsDataURL(file);
  };

  const renderEntry = (entry: typeof journal[number]) => {
    const isOpen = openId === entry.id;
    return (
      <div key={entry.id} className="rounded-xl border border-violet-800/30 bg-violet-900/10 overflow-hidden">
        <button onClick={() => { setOpenId(isOpen ? null : entry.id); setNoteDraft(''); }}
          className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-violet-900/20 transition-colors text-left">
          <span className="text-[10px] shrink-0">💡</span>
          <span className="flex-1 text-[11px] text-anth-300 truncate">{entry.text.slice(0, 60)}{entry.text.length > 60 ? '…' : ''}</span>
          <ChevronDown size={10} className={cn('text-anth-600 shrink-0 transition-transform', isOpen && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.15}} className="overflow-hidden">
              <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-violet-800/20 pt-2">
                <p className="text-[11px] text-anth-300 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                {entry.notes.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[8px] uppercase tracking-widest text-anth-600">{t('Notizen')}</p>
                    {entry.notes.map(n => n.text.startsWith('img:') ? (
                      <img key={n.id} src={n.text.slice(4)} alt="Anhang"
                        className="rounded-lg border border-violet-800/30 max-h-32 object-cover" />
                    ) : (
                      <p key={n.id} className="text-[10px] text-anth-500 pl-2 border-l border-violet-800/30">{n.text}</p>
                    ))}
                  </div>
                )}
                {/* Add note / attach image */}
                <div className="flex gap-1 pt-1">
                  <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && noteDraft.trim()) { addJournalNote(entry.id, noteDraft.trim()); setNoteDraft(''); } }}
                    placeholder={t('Notiz hinzufügen…')}
                    className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-2 py-1 text-[10px] text-forest-100 placeholder-anth-600 outline-none focus:border-violet-600/50 transition-colors" />
                  <label className="p-1.5 rounded-lg border border-border text-anth-500 hover:text-violet-400 hover:border-violet-600/40 cursor-pointer transition-colors" title={t('Bild anhängen')}>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) attachImage(entry.id, f); e.target.value = ''; }} />
                    📎
                  </label>
                </div>
                <p className="text-[9px] text-anth-700">{new Date(entry.createdAt).toLocaleDateString('de-AT')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="glass rounded-2xl border border-border p-4 flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-violet-900/30 border border-violet-700/40 flex items-center justify-center">
          <Ghost size={14} className="text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-anth-600">Neural Ghost</p>
          <p className="text-xs font-semibold text-forest-100">Idea Correlation Engine</p>
        </div>
        <button onClick={toggleNeuralGhost}
          className={cn('px-2 py-0.5 rounded-lg border text-[9px] font-bold transition-all',
            neuralGhostEnabled ? 'bg-violet-900/30 border-violet-700/40 text-violet-300' : 'bg-anth-800/50 border-anth-700/40 text-anth-500')}>
          {neuralGhostEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      {neuralGhostEnabled ? (
        <>
          <div className="space-y-1.5 overflow-y-auto min-h-0 flex-1">
            {ideas.length === 0 && others.length === 0 && (
              <p className="text-[10px] text-anth-600">{t('Noch keine Ideen — lege unten deine erste an.')}</p>
            )}
            {ideas.map(renderEntry)}
            {others.map(renderEntry)}
          </div>
          {/* Add new idea */}
          <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/40 shrink-0">
            <input value={newIdea} onChange={e => setNewIdea(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitIdea()}
              placeholder={t('Neue Idee…')}
              className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-600 outline-none focus:border-violet-600/50 transition-colors" />
            <button onClick={submitIdea} disabled={!newIdea.trim()}
              className="p-1.5 rounded-lg bg-violet-900/30 border border-violet-700/40 text-violet-400 hover:bg-violet-900/50 disabled:opacity-40 transition-colors shrink-0">
              💡
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 text-center py-6">
          <p className="text-xs text-anth-600">{t('Neural Ghost aktivieren, um Ideen')}<br/>{t('und Korrelationen zu sehen')}</p>
        </div>
      )}
    </div>
  );
}

// ── Column 3: Team online ──────────────────────────────────────────────────────
function TeamColumn() {
  const t = useT();
  const { members } = useNinjasStore();
  const { onlineMemberIds, toggleMemberOnline } = useUIExtStore();

  return (
    <div className="glass rounded-2xl border border-border p-4 flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-sky-900/30 border border-sky-700/40 flex items-center justify-center">
          <Users size={14} className="text-sky-400" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-anth-600">Team</p>
          <p className="text-xs font-semibold text-forest-100">{onlineMemberIds.length} {t('von')} {members.length} online</p>
        </div>
        <Link href="/dashboard/ninjas" className="text-[9px] text-anth-600 hover:text-sky-400 transition-colors">{t('Alle ↗')}</Link>
      </div>
      <div className="space-y-1 overflow-y-auto min-h-0 flex-1">
        {members.length === 0 && <p className="text-[10px] text-anth-600">{t('Keine Team-Mitglieder angelegt.')}</p>}
        {members.map(m => {
          const online = onlineMemberIds.includes(m.id);
          return (
            <button key={m.id} onClick={() => toggleMemberOnline(m.id)}
              title={online ? t('Als offline markieren') : t('Als online markieren')}
              className={cn('w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl border transition-all text-left',
                online ? 'border-sky-700/40 bg-sky-900/15' : 'border-border/40 bg-surface/30 opacity-60 hover:opacity-90')}>
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm border"
                  style={{ borderColor: m.color, background: `${m.color}18` }}>
                  {m.imageUrl
                    ? <img src={m.imageUrl} alt={m.name} className="w-full h-full rounded-full object-cover" />
                    : m.avatar}
                </div>
                <span className={cn('absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-anth-900',
                  online ? 'bg-mint-500' : 'bg-anth-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-anth-200 truncate">{m.name}</p>
                <p className="text-[9px] text-anth-500 truncate">{m.title}</p>
              </div>
              <span className={cn('text-[8px] font-bold uppercase tracking-wider', online ? 'text-mint-500' : 'text-anth-600')}>
                {online ? 'online' : 'offline'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Column 4: Agents (compact cards) ───────────────────────────────────────────
function AgentsColumn({ agents, onPing, pinging, onRefresh }: {
  agents: AgentConfig[];
  onPing: (id: string) => void;
  pinging: string | null;
  onRefresh: () => void;
}) {
  const t = useT();
  return (
    <div className="glass rounded-2xl border border-border p-4 flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-mint-500/10 border border-mint-500/30 flex items-center justify-center">
          <Bot size={14} className="text-mint-500" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-anth-600">Digital Staff</p>
          <p className="text-xs font-semibold text-forest-100">{agents.filter(a => a.status === 'online').length} {t('von')} {agents.length} online</p>
        </div>
        <button onClick={onRefresh} className="text-anth-600 hover:text-mint-400 transition-colors"><RefreshCw size={11} /></button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 overflow-y-auto min-h-0 flex-1 content-start">
        {agents.map(agent => {
          const colors = AGENT_COLORS[agent.id] ?? AGENT_COLORS.system;
          const online = agent.status === 'online';
          return (
            <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}
              className={cn('rounded-xl border p-2 transition-all hover:scale-[1.02] flex flex-col gap-1',
                online ? 'border-border bg-surface/50' : 'border-border/40 bg-surface/25 opacity-70')}>
              <div className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full shrink-0 border', colors.bg, colors.border)} />
                <p className="text-[10px] font-semibold text-anth-200 truncate flex-1">{agent.displayName}</p>
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', online ? 'bg-mint-500 animate-pulse' : 'bg-anth-600')} />
              </div>
              <p className="text-[8px] text-anth-500 truncate">{agent.model}</p>
              <button
                onClick={e => { e.preventDefault(); onPing(agent.id); }}
                className="mt-auto flex items-center justify-center gap-1 py-0.5 rounded-lg border border-border/60 text-[8px] text-anth-500 hover:text-mint-400 hover:border-mint-500/40 transition-all">
                {pinging === agent.id ? <RefreshCw size={7} className="animate-spin" /> : <Zap size={7} />}
                Ping
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useT();
  const { agents, setAgents, setAgentStatus } = useAgentStore();
  const [pinging, setPinging] = useState<string | null>(null);
  const [pingingAll, setPingingAll] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalAgents: 4, onlineAgents: 0, memoryEntries: 0,
    kanbanTasks: 0, completedTasks: 0, todayMessages: 0,
    mediaJobs: 0, shopifyDrafts: 0,
  });

  // Load metrics
  const loadMetrics = useCallback(async () => {
    try {
      const [memRes, kanRes, mediaRes, shopRes] = await Promise.allSettled([
        fetch('/api/memory').then(r => r.json()),
        fetch('/api/kanban').then(r => r.json()),
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/shopify').then(r => r.json()),
      ]);

      const memData   = memRes.status   === 'fulfilled' ? memRes.value   : null;
      const kanData   = kanRes.status   === 'fulfilled' ? kanRes.value   : null;
      const agentData = mediaRes.status === 'fulfilled' ? mediaRes.value : null;
      const shopData  = shopRes.status  === 'fulfilled' ? shopRes.value  : null;

      if (agentData?.data) setAgents(agentData.data as AgentConfig[]);

      setMetrics(m => ({
        ...m,
        memoryEntries:  (memData?.data ?? []).length,
        kanbanTasks:    (kanData?.data?.tasks ?? []).filter((t: { status: string }) => t.status !== 'done').length,
        completedTasks: (kanData?.data?.tasks ?? []).filter((t: { status: string }) => t.status === 'done').length,
        shopifyDrafts:  (shopData?.data ?? []).length,
        totalAgents:    agents.length || 4,
        onlineAgents:   agents.filter(a => a.status === 'online').length,
      }));
    } catch { /* silent */ }
  }, [agents, setAgents]);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  const pingAgent = async (id: string) => {
    setPinging(id);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping-one', agentId: id }),
      });
      const data = await res.json();
      setAgentStatus(id, data.data?.online ? 'online' : 'offline');
      setMetrics(m => ({ ...m, onlineAgents: agents.filter(a => a.status === 'online').length }));
    } finally {
      setPinging(null);
    }
  };

  const pingAll = async () => {
    setPingingAll(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      });
      const data = await res.json();
      if (data.data) {
        Object.entries(data.data).forEach(([id, online]) => {
          setAgentStatus(id, online ? 'online' : 'offline');
        });
        const onlineCount = Object.values(data.data).filter(Boolean).length;
        setMetrics(m => ({ ...m, onlineAgents: onlineCount }));
      }
    } finally {
      setPingingAll(false);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      {/* ── Hero Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <MetatronsCube size={64} opacity={0.7} />
            <div className="absolute inset-0 rounded-full bg-forest-500/10 animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">TRINITY OS · Mission Control</h1>
            <p className="text-sm text-anth-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <Button
          onClick={pingAll}
          loading={pingingAll}
          variant="gold"
          icon={<Zap size={14} />}
          size="lg"
        >
          Ping All Agents
        </Button>
      </div>

      {/* ── Integration Hub Telemetry (3 widgets) ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-3">Integration Hub · Live Telemetry</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Widget 1: Global Tasks Aggregator */}
          <div className="glass rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-mint-500/10 border border-mint-500/30 flex items-center justify-center">
                <AlertTriangle size={14} className="text-mint-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-anth-600">Tasks Aggregator</p>
                <p className="text-xs font-semibold text-forest-100">Global Kanban</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border text-center">
                <p className="text-xl font-bold text-mint-500">{metrics.kanbanTasks}</p>
                <p className="text-[9px] text-anth-600 mt-0.5">Active</p>
              </div>
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border text-center">
                <p className="text-xl font-bold text-forest-400">{metrics.completedTasks}</p>
                <p className="text-[9px] text-anth-600 mt-0.5">Done</p>
              </div>
            </div>
            <div className="space-y-1">
              {[
                { label: 'High Priority', count: Math.floor(metrics.kanbanTasks * 0.3), color: 'text-red-400' },
                { label: 'In Progress',   count: Math.floor(metrics.kanbanTasks * 0.5), color: 'text-gold' },
                { label: 'Backlog',       count: Math.floor(metrics.kanbanTasks * 0.2), color: 'text-anth-400' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-anth-500">{row.label}</span>
                  <span className={cn('font-semibold', row.color)}>{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Shopify Telemetry */}
          <div className="glass rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center">
                <ShoppingBag size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-anth-600">Shopify Telemetry</p>
                <p className="text-xs font-semibold text-forest-100">Store Revenue</p>
              </div>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border text-center">
                <p className="text-base font-bold text-emerald-300">—</p>
                <p className="text-[9px] text-anth-600 mt-0.5">Revenue</p>
              </div>
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border text-center">
                <p className="text-xl font-bold text-gold">{metrics.shopifyDrafts}</p>
                <p className="text-[9px] text-anth-600 mt-0.5">Drafts</p>
              </div>
            </div>
            <div className="space-y-1">
              {[
                { label: 'Active Orders', value: '—', icon: <TrendingUp size={10} /> },
                { label: 'Products Live', value: `${metrics.shopifyDrafts}`, icon: <ShoppingBag size={10} /> },
                { label: 'Alerts',        value: '0', icon: <Bell size={10} className="text-gold" /> },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-anth-500">{row.icon} {row.label}</span>
                  <span className="font-semibold text-forest-300">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Arche - Die Kunst des Lebens */}
          <div className="glass rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-900/40 border border-violet-700/40 flex items-center justify-center">
                <GraduationCap size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-anth-600">Memberspot</p>
                <p className="text-xs font-semibold text-forest-100">Arche · Academy</p>
              </div>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border text-center">
                <p className="text-xl font-bold text-violet-300">—</p>
                <p className="text-[9px] text-anth-600 mt-0.5">Members</p>
              </div>
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border text-center">
                <p className="text-xl font-bold text-violet-400">—</p>
                <p className="text-[9px] text-anth-600 mt-0.5">New Today</p>
              </div>
            </div>
            <div className="space-y-1">
              {[
                { label: 'Pending Verify', value: '—', icon: <Users size={10} /> },
                { label: 'Activity Feed',  value: '—', icon: <TrendingUp size={10} /> },
                { label: 'Revenue',        value: '—', icon: <Bell size={10} className="text-violet-400" /> },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-anth-500">{row.icon} {row.label}</span>
                  <span className="font-semibold text-violet-300">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-anth-700">Connect <code className="text-violet-400">MEMBERSPOT_API_KEY</code> to enable live data</p>
          </div>
        </div>
      </section>

      {/* ── Metrics ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-3">{t('System Overview')}</h2>
        <MetricsGrid metrics={{ ...metrics, onlineAgents: agents.filter(a => a.status === 'online').length }} />
      </section>

      {/* ── Command Deck: Ziele · Ideen · Team · Digital Staff ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-3">{t('Command Deck')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          <GoalsColumn />
          <IdeasColumn />
          <TeamColumn />
          <AgentsColumn agents={agents} onPing={pingAgent} pinging={pinging} onRefresh={loadMetrics} />
        </div>
      </section>

      {/* ── Shared Memory Status ── */}
      <section className="glass rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse-slow" />
          <h2 className="text-xs uppercase tracking-widest text-anth-500">Shared Knowledge Base</h2>
        </div>
        <p className="text-sm text-anth-300 leading-relaxed">
          All agents share a unified memory database. When any agent learns or discovers something important,
          it is automatically tagged with{' '}
          <code className="text-gold text-xs bg-forest-900/60 px-1.5 py-0.5 rounded">[MEMORY]</code>,{' '}
          <code className="text-gold text-xs bg-forest-900/60 px-1.5 py-0.5 rounded">KEY INSIGHT:</code>, or{' '}
          <code className="text-gold text-xs bg-forest-900/60 px-1.5 py-0.5 rounded">IMPORTANT FACT:</code>{' '}
          and synced to the shared knowledge base. Navigate to{' '}
          <span className="text-forest-300 font-medium">Shared Memory</span> to browse, search, and manage all entries.
        </p>
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-2 text-xs text-anth-400">
            <span className="w-2 h-2 rounded-full bg-forest-500" />
            {metrics.memoryEntries} total entries
          </div>
          <div className="flex items-center gap-2 text-xs text-anth-400">
            <span className="w-2 h-2 rounded-full bg-gold" />
            Shared across all {metrics.totalAgents} agents
          </div>
        </div>
      </section>
    </div>
  );
}
