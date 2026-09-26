'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { requestDictation, useVoiceRuntime } from '@/lib/voice/preferences';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Mic, MicOff, ChevronDown, Trash2, Bot, Sparkles,
  ListTodo, LayoutGrid, Maximize2, Minimize2, Users,
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import {
  useFloatingAgentStore, useAgentStore, useAiCompanyStore, withSelfContext,
} from '@/lib/store';
import {
  buildAssistantSystemPrompt, parseAssistantActions, executeAssistantActions,
} from '@/lib/assistantActions';
import { assistantAddKanbanCard, assistantAddEdenCard } from '@/lib/crossPublish';
import { readAgentStream } from '@/lib/workspace/stream';
import type { ChatMessage } from '@/types';

const MINT = 'var(--w-accent)';

// SSE-Stream eines Agenten lesen und inkrementell in eine Nachricht schreiben.
async function streamAgent(
  agentId: string, userText: string, systemPrompt: string,
  history: { role: string; content: string }[],
  onChunk: (full: string) => void,
): Promise<string> {
  const messages = withSelfContext([
    ...history,
    { role: 'user', content: `[ANWEISUNG]\n${systemPrompt}\n[/ANWEISUNG]\n\n${userText}` },
  ]);
  const res = await fetch(`/api/agents/${agentId}/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  return readAgentStream(res.body, onChunk);
}

export function FloatingAgentWidget() {
  const {
    isOpen, toggle, expanded, setExpanded,
    target, setTarget,
    messages, addMessage, updateMessage, input, setInput,
    isLoading, setLoading, clearMessages,
  } = useFloatingAgentStore();

  const { agents } = useAgentStore();
  const { roles, pa, templates } = useAiCompanyStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [targetOpen, setTargetOpen] = useState(false);
  const [addMenuFor, setAddMenuFor] = useState<string | null>(null);

  const agentById = useMemo(() => Object.fromEntries(agents.map(a => [a.id, a])), [agents]);

  // Aktuelles Ziel auflösen → Label + Rolle
  const resolved = useMemo(() => {
    if (target.kind === 'pa') {
      return { label: (!pa.name || pa.name === 'Persönliche Assistenz') ? 'Trinity' : pa.name, sub: 'PA', icon: '🎧', roleName: 'Persönliche Assistenz' };
    }
    if (target.kind === 'team') {
      const tpl = templates.find(t => t.id === target.templateId);
      return { label: tpl?.name ?? 'Projekt-Team', sub: `${tpl?.roles.length ?? 0} Rollen`, icon: '🏢', roleName: undefined };
    }
    const a = agentById[target.id];
    const role = roles.find(r => r.assignedAgentId === target.id);
    return { label: a?.displayName ?? 'Agent', sub: a?.model ?? '—', icon: a?.icon ?? '🤖', roleName: role?.name };
  }, [target, pa, templates, agentById, roles]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const isRecording = useVoiceRuntime(s=>s.phase==='recording');
  const toggleRecording = () => requestDictation(inputRef.current);

  // Antwort eines Agenten in eigener Nachricht streamen + Aktionen ausführen
  const runOne = async (
    agentId: string, systemPrompt: string, userText: string,
    history: { role: string; content: string }[], roleName?: string,
  ) => {
    const msgId = generateId('fw');
    addMessage({ id: msgId, role: 'assistant', content: '', agentId, timestamp: new Date().toISOString(), roleName });
    let full = '';
    try {
      full = await streamAgent(agentId, userText, systemPrompt, history, (f) => {
        const { clean } = parseAssistantActions(f);
        updateMessage(msgId, { content: clean || '…' });
      });
    } catch (e) {
      updateMessage(msgId, { content: `⚠️ ${e instanceof Error ? e.message : 'Agent nicht erreichbar'}` });
      return;
    }
    const { actions, clean } = parseAssistantActions(full);
    const log = actions.length ? executeAssistantActions(actions) : [];
    updateMessage(msgId, { content: clean || (log.length ? '✦ Erledigt.' : '…'), actionLog: log.length ? log : undefined });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setLoading(true);
    addMessage({ id: generateId('fw'), role: 'user', content: text, agentId: '', timestamp: new Date().toISOString() });

    // History (nur echte Chat-Turns, ohne Systemnotizen)
    const history = messages.filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-8).map(m => ({ role: m.role, content: m.content }));

    try {
      if (target.kind === 'team') {
        const tpl = templates.find(t => t.id === target.templateId);
        const active = (tpl?.roles ?? []).filter(r => r.assignedAgentId);
        if (!active.length) {
          addMessage({ id: generateId('fw'), role: 'assistant', content: '⚠️ Diesem Team sind noch keine Agenten zugewiesen. Weise auf der Digital-Staff-Seite jeder Rolle einen Agenten zu.', agentId: '', timestamp: new Date().toISOString() });
        } else {
          for (const role of active) {
            const sys = buildAssistantSystemPrompt(`${role.name} — ${role.description}${role.background ? ` | Hintergrund: ${role.background}` : ''}`);
            await runOne(role.assignedAgentId, sys, text, history, role.name);
          }
        }
      } else {
        const agentId = target.kind === 'pa' ? (pa.agentId || 'claude-free') : target.id;
        const roleCtx = target.kind === 'pa'
          ? `${pa.name} (Persönliche Assistenz) — ${pa.personality}. ${pa.description}`
          : resolved.roleName;
        await runOne(agentId, buildAssistantSystemPrompt(roleCtx), text, history, target.kind === 'pa' ? undefined : resolved.roleName);
      }
    } finally {
      setLoading(false);
    }
  };

  // 1-Klick: Antwort als Task / Canvas-Karte übernehmen
  const addAnswerToTask = (content: string) => {
    const title = content.split('\n')[0].slice(0, 80) || 'Notiz';
    assistantAddKanbanCard({ title, description: content });
    setAddMenuFor(null);
  };
  const addAnswerToCanvas = (content: string) => {
    const title = content.split('\n')[0].slice(0, 80) || 'Notiz';
    assistantAddEdenCard({ type: 'note', title, content });
    setAddMenuFor(null);
  };

  const dims = expanded ? { width: 'min(560px, 92vw)', height: 'min(720px, 82vh)' } : { width: 'min(384px, 92vw)', height: 'min(520px, 78dvh)' };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="glass-dark border border-border rounded-2xl shadow-panel overflow-hidden flex flex-col"
            style={dims}
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border/60 flex items-center gap-2" style={{ background: 'var(--w-soft)' }}>
              <div className="relative flex-1 min-w-0">
                <button onClick={() => setTargetOpen(v => !v)}
                  className="flex items-center gap-2 text-xs font-semibold text-mint-300 min-w-0">
                  <span className="text-base shrink-0">{resolved.icon}</span>
                  <span className="flex flex-col items-start min-w-0">
                    <span className="truncate max-w-[180px] flex items-center gap-1">
                      {resolved.label}
                      <ChevronDown size={11} className={cn('shrink-0 transition-transform', targetOpen && 'rotate-180')} />
                    </span>
                    {resolved.roleName && target.kind !== 'pa' && (
                      <span className="text-[9px] text-amber-400/90 font-normal leading-none">Rolle: {resolved.roleName}</span>
                    )}
                  </span>
                </button>
                <AnimatePresence>
                  {targetOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="absolute top-full left-0 mt-2 w-64 glass-dark border border-border rounded-xl shadow-panel z-20 py-1.5 max-h-80 overflow-y-auto scrollbar-thin"
                    >
                      {/* PA */}
                      <TargetRow icon="🎧" label={(!pa.name || pa.name === 'Persönliche Assistenz') ? 'Trinity' : pa.name} hint="PA"
                        active={target.kind === 'pa'} onClick={() => { setTarget({ kind: 'pa' }); setTargetOpen(false); }} />
                      {/* Teams */}
                      {templates.length > 0 && <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-anth-600 flex items-center gap-1"><Users size={9} /> Projekt-Teams</p>}
                      {templates.map(tpl => (
                        <TargetRow key={tpl.id} icon="🏢" label={tpl.name} hint={`${tpl.roles.length} Rollen`}
                          active={target.kind === 'team' && target.templateId === tpl.id}
                          onClick={() => { setTarget({ kind: 'team', templateId: tpl.id }); setTargetOpen(false); }} />
                      ))}
                      {/* Einzelagenten */}
                      <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-anth-600 flex items-center gap-1"><Bot size={9} /> Einzelne Agenten</p>
                      {agents.map(a => {
                        const role = roles.find(r => r.assignedAgentId === a.id);
                        return (
                          <TargetRow key={a.id} icon={a.icon} label={a.displayName} hint={role?.name}
                            active={target.kind === 'agent' && target.id === a.id}
                            onClick={() => { setTarget({ kind: 'agent', id: a.id }); setTargetOpen(false); }} />
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => setExpanded(!expanded)} title={expanded ? 'Verkleinern' : 'Vergrößern'} className="p-1 text-anth-500 hover:text-anth-300 transition-colors">
                {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <button onClick={clearMessages} title="Verlauf leeren" className="p-1 text-anth-500 hover:text-anth-300 transition-colors">
                <Trash2 size={12} />
              </button>
              <button aria-label="Assistent schließen" onClick={toggle} className="p-1 text-anth-500 hover:text-anth-300 transition-colors"><X size={13} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-8">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border border-mint-500/30" style={{ background: 'var(--w-soft)' }}>
                    <Sparkles size={18} className="text-mint-400" />
                  </div>
                  <p className="text-xs text-anth-400 max-w-[220px]">Ich bin Trinity. Hier finden deine Gedanken, dein Wissen und deine nächsten Schritte zusammen. Was möchtest du festhalten?</p>
                </div>
              ) : (
                messages.slice(-24).map((msg) => (
                  <div key={msg.id} className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
                    <div className={cn(
                      'max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words',
                      msg.role === 'user' ? 'bg-forest-700/50 text-mint-light'
                        : 'bg-anth-800/60 border border-anth-700/50 text-anth-100'
                    )}>
                      {msg.roleName && msg.role === 'assistant' && (
                        <span className="block text-[9px] font-semibold text-amber-400/90 mb-0.5">{agentById[msg.agentId]?.icon} {msg.roleName}</span>
                      )}
                      {msg.content || (isLoading ? '…' : '')}
                    </div>
                    {msg.actionLog && msg.actionLog.length > 0 && (
                      <div className="max-w-[88%] rounded-lg px-2.5 py-1.5 text-[10px] bg-mint-500/10 border border-mint-500/25 text-mint-300 space-y-0.5">
                        {msg.actionLog.map((l, i) => <div key={i}>{l}</div>)}
                      </div>
                    )}
                    {msg.role === 'assistant' && msg.content && (
                      <div className="relative flex items-center gap-1.5">
                        <button onClick={() => addAnswerToTask(msg.content)} title="Als Aufgabe hinzufügen"
                          className="flex items-center gap-1 text-[9px] text-anth-500 hover:text-mint-300 transition-colors">
                          <ListTodo size={10} /> Task
                        </button>
                        <button onClick={() => addAnswerToCanvas(msg.content)} title="Als Canvas-Karte hinzufügen"
                          className="flex items-center gap-1 text-[9px] text-anth-500 hover:text-mint-300 transition-colors">
                          <LayoutGrid size={10} /> Canvas
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-1 px-1">
                  {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 flex gap-2 items-center border-t border-border/60">
              <button aria-label="Spracheingabe" onClick={toggleRecording} title={isRecording ? 'Aufnahme stoppen' : 'Spracheingabe'}
                className={cn('p-2 rounded-xl border transition-colors shrink-0',
                  isRecording ? 'bg-red-900/30 border-red-700/50 text-red-400 animate-pulse'
                    : 'bg-surface border-border text-anth-500 hover:text-mint-light hover:border-mint-500/30')}>
                {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Nachricht an ${resolved.label}…`}
                className="flex-1 mc-input text-xs py-2" disabled={isLoading} />
              <button aria-label="Nachricht senden" onClick={sendMessage} disabled={!input.trim() || isLoading}
                className={cn('p-2 rounded-xl border shrink-0 transition-colors',
                  input.trim() && !isLoading ? 'bg-mint-500/15 border-mint-500/40 text-mint-500 hover:bg-mint-500/25'
                    : 'text-anth-600 border-anth-700 cursor-not-allowed')}>
                <Send size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button onClick={toggle} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="rounded-2xl border-2 flex items-center justify-center shadow-lg transition-all duration-300"
        style={{
          width: 52, height: 52,
          background: 'var(--w-surface)',
          borderColor: 'var(--w-border)', color: MINT,
          boxShadow: 'var(--w-shadow)',
        }}
        title={isOpen ? 'Assistent schließen' : 'Assistent öffnen'}>
        <AnimatePresence mode="wait">
          <motion.div key={isOpen ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
            {isOpen ? <X size={20} /> : <Bot size={20} />}
          </motion.div>
        </AnimatePresence>
        {!isOpen && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-bg bg-mint-500 animate-pulse" />}
      </motion.button>
    </div>
  );
}

function TargetRow({ icon, label, hint, active, onClick }: {
  icon: string; label: string; hint?: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left',
        active ? 'bg-forest-700/50 text-mint-light' : 'text-anth-300 hover:bg-forest-900/40 hover:text-mint-light')}>
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-[9px] text-amber-400/80 shrink-0">{hint}</span>}
    </button>
  );
}
