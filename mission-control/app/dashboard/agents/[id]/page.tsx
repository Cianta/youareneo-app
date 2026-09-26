/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { requestDictation, useVoiceRuntime } from '@/lib/voice/preferences';
import { useEffect, useRef, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, Trash2, ChevronDown, Settings2, Bot,
  FolderOpen, Globe, Monitor, X, Plus, Check,
} from 'lucide-react';
import { cn, generateId, AGENT_COLORS, STATUS_COLORS } from '@/lib/utils';
import { useAgentStore, withSelfContext } from '@/lib/store';
import type { AgentConfig, ChatMessage } from '@/types';

// ── Ollama model options for Hermes 3 / OpenClaw ──────────────────────────────
const OLLAMA_MODELS = [
  'hermes3:latest', 'mistral:latest', 'llama3.1:8b', 'llama3.1:70b',
  'phi3:mini', 'gemma2:9b', 'deepseek-coder:6.7b', 'codellama:7b',
];

// ── OpenRouter model options ──────────────────────────────────────────────────
const OPENROUTER_MODELS = [
  'anthropic/claude-3.5-sonnet', 'anthropic/claude-opus-4', 'anthropic/claude-3-haiku',
  'openai/gpt-4o', 'openai/gpt-4o-mini', 'google/gemini-pro-1.5',
  'meta-llama/llama-3.1-70b-instruct', 'mistralai/mistral-7b-instruct',
  'qwen/qwen3-235b-a22b', 'google/gemma-3-27b-it', 'openrouter/auto',
];

// ── Model Switcher Dropdown ───────────────────────────────────────────────────
function ModelSwitcher({ agent, onSwitch }: { agent: AgentConfig; onSwitch: (model: string) => void }) {
  const [open, setOpen] = useState(false);
  const isOllama = agent.baseUrl?.includes('11434');
  const models = isOllama ? OLLAMA_MODELS : OPENROUTER_MODELS;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border text-xs text-anth-400 hover:text-anth-200 hover:border-forest-700 transition-all"
      >
        <Settings2 size={12} />
        <span className="max-w-[120px] truncate">{agent.model}</span>
        <ChevronDown size={10} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-1.5 w-64 glass-dark border border-border rounded-xl shadow-panel z-50 py-1 overflow-hidden"
          >
            <p className="text-[9px] uppercase tracking-widest text-anth-600 px-3 py-1.5">Switch Model</p>
            {models.map(m => (
              <button
                key={m}
                onClick={() => { onSwitch(m); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors text-left',
                  agent.model === m ? 'text-mint-light bg-forest-800/40' : 'text-anth-400 hover:text-mint-light hover:bg-forest-900/30'
                )}
              >
                {agent.model === m && <Check size={10} className="text-mint-500 shrink-0" />}
                <span className="truncate">{m}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Workspace Path Panel ──────────────────────────────────────────────────────
function WorkspacePanel({ agentId }: { agentId: string }) {
  const [paths, setPaths] = useState<string[]>([]);
  const [scope, setScope] = useState<'global' | 'local'>('global');
  const [draft, setDraft] = useState('');

  const showPanel = agentId === 'claude-cowork' || agentId === 'claude-free-scope';
  if (!showPanel) return null;

  const addPath = () => {
    if (draft.trim()) { setPaths(p => [...p, draft.trim()]); setDraft(''); }
  };

  return (
    <div className="border-t border-border/40 px-4 py-3 space-y-2 bg-anth-900/20">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-anth-600 flex items-center gap-1">
          <FolderOpen size={10} /> Workspace Scope
        </p>
        <div className="flex rounded-lg overflow-hidden border border-border text-[10px]">
          {(['global', 'local'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 transition-colors',
                scope === s ? 'bg-mint-500/15 text-mint-500' : 'text-anth-500 hover:text-anth-300'
              )}
            >
              {s === 'global' ? <Globe size={9} /> : <Monitor size={9} />}
              {s === 'global' ? 'Global' : 'Local Folder'}
            </button>
          ))}
        </div>
      </div>
      {scope === 'local' && (
        <div className="space-y-1.5">
          {paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1 bg-surface rounded-lg border border-border">
              <code className="text-[10px] text-forest-300 flex-1 truncate">{p}</code>
              <button onClick={() => setPaths(ps => ps.filter((_, j) => j !== i))} className="text-anth-600 hover:text-red-400">
                <X size={10} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPath()}
              placeholder="/path/to/project"
              className="flex-1 mc-input text-[11px] py-1.5 px-2"
            />
            <button onClick={addPath} className="p-1.5 rounded-lg bg-mint-500/10 border border-mint-500/30 text-mint-500 hover:bg-mint-500/20">
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────────────────────────────
export default function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { agents, setAgentStatus } = useAgentStore();
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isRecording = useVoiceRuntime(s=>s.phase==='recording');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const found = agents.find(a => a.id === id);
    if (found) setAgent(found);
  }, [agents, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const switchModel = (model: string) => {
    if (!agent) return;
    setAgent({ ...agent, model });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !agent) return;
    const text = input.trim();
    setInput('');
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: generateId('ac'),
      role: 'user',
      content: text,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    const asstMsg: ChatMessage = {
      id: generateId('ac'),
      role: 'assistant',
      content: '',
      agentId: agent.id,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withSelfContext([...messages, userMsg]), model: agent.model }),
      });

      if (res.body) {
        setMessages(prev => [...prev, asstMsg]);
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                full += parsed.text;
                setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: full } : m));
              }
            } catch { /* skip */ }
          }
        }
      } else {
        const data = await res.json();
        setMessages(prev => [...prev, { ...asstMsg, content: data.data?.content ?? 'No response.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { ...asstMsg, content: `⚠️ ${err instanceof Error ? err.message : 'Error'}` }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleRecording = () => requestDictation(inputRef.current);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Bot size={32} className="text-anth-600 mx-auto" />
          <p className="text-sm text-anth-400">Agent not found: <code className="text-gold">{id}</code></p>
        </div>
      </div>
    );
  }

  const colors = AGENT_COLORS[agent.id] ?? AGENT_COLORS.system;

  return (
    <div className="h-full flex flex-col fade-in">
      {/* ── Agent Header ── */}
      <div className={cn('shrink-0 px-5 py-3 border-b border-border/60 flex items-center gap-3', colors.bg)}>
        <div className="relative shrink-0">
          <span className="text-2xl leading-none">{agent.icon}</span>
          <span className={cn('absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-bg', STATUS_COLORS[agent.status])} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className={cn('text-sm font-bold truncate', colors.text)}>{agent.displayName}</h1>
          <p className="text-[10px] text-anth-500 truncate">{agent.version}</p>
        </div>
        <ModelSwitcher agent={agent} onSwitch={switchModel} />
        <button
          onClick={() => setMessages([])}
          title="Clear chat"
          className="p-1.5 text-anth-500 hover:text-anth-300 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* ── Workspace scope panel (Claude Free / Co-Work only) ── */}
      <WorkspacePanel agentId={agent.id} />

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border', colors.bg, colors.border)}>
              {agent.icon}
            </div>
            <div>
              <p className={cn('text-base font-semibold', colors.text)}>{agent.displayName}</p>
              <p className="text-xs text-anth-500 mt-1 max-w-xs">{agent.systemPrompt?.slice(0, 120)}…</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {(agent.capabilities ?? []).map(cap => (
                <span key={cap} className={cn('text-[10px] px-2.5 py-1 rounded-full border font-medium', colors.bg, colors.border, colors.text)}>
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <span className="text-xl shrink-0 mt-0.5 leading-none">{agent.icon}</span>
              )}
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-forest-700/50 text-mint-light rounded-br-sm'
                  : cn(colors.bg, 'border', colors.border, colors.text, 'rounded-bl-sm')
              )}>
                {msg.content || (isLoading ? (
                  <span className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className={cn('w-1.5 h-1.5 rounded-full animate-bounce', colors.text.replace('text-','bg-'))}
                        style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </span>
                ) : '')}
              </div>
            </div>
          ))
        )}
        {isLoading && messages.length > 0 && messages.at(-1)?.role === 'user' && (
          <div className="flex gap-3">
            <span className="text-xl shrink-0">{agent.icon}</span>
            <div className={cn('rounded-2xl rounded-bl-sm px-4 py-3 border flex gap-1.5 items-center', colors.bg, colors.border)}>
              {[0,1,2].map(i => (
                <span key={i} className={cn('w-1.5 h-1.5 rounded-full animate-bounce', colors.text.replace('text-','bg-').replace('-300','-500'))}
                  style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border/60 px-4 py-3 flex gap-2 items-center">
        <button
          onClick={toggleRecording}
          className={cn(
            'p-2.5 rounded-xl border transition-all shrink-0',
            isRecording
              ? 'bg-red-900/30 border-red-700/50 text-red-400 animate-pulse'
              : 'bg-surface border-border text-anth-500 hover:text-mint-light hover:border-mint-500/30'
          )}
        >
          {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={`Message ${agent.displayName}…`}
          className="flex-1 mc-input py-2.5"
          disabled={isLoading}
          autoFocus
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className={cn(
            'p-2.5 rounded-xl border shrink-0 transition-all',
            input.trim() && !isLoading
              ? 'bg-mint-500/15 border-mint-500/40 text-mint-500 hover:bg-mint-500/25'
              : 'text-anth-600 border-anth-700 cursor-not-allowed'
          )}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
