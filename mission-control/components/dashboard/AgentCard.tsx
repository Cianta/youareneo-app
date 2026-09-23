'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, RefreshCw, Zap, Activity, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useChatStore, withSelfContext } from '@/lib/store';
import { cn, AGENT_COLORS, STATUS_COLORS, generateId, timeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { AgentConfig, ChatMessage } from '@/types';

interface Props {
  agent: AgentConfig;
  onPing: (id: string) => void;
  pinging?: boolean;
}

export function AgentCard({ agent, onPing, pinging }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addMessage, getMessages, clearConversation } = useChatStore();
  const messages = getMessages(agent.id);
  const colors = AGENT_COLORS[agent.id] ?? AGENT_COLORS.system;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: generateId('msg'),
      role: 'user',
      content: text,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
    };
    addMessage(agent.id, userMsg);

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withSelfContext([...messages, userMsg]) }),
      });

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        const assistantMsg: ChatMessage = {
          id: generateId('msg'),
          role: 'assistant',
          content: '',
          agentId: agent.id,
          timestamp: new Date().toISOString(),
        };

        // Add empty message first
        addMessage(agent.id, assistantMsg);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                // Update last message
                useChatStore.getState().conversations[agent.id].at(-1)!.content = fullText;
              }
            } catch { /* skip */ }
          }
        }
      } else {
        const data = await res.json();
        addMessage(agent.id, {
          id: generateId('msg'),
          role: 'assistant',
          content: data.data?.content ?? 'No response.',
          agentId: agent.id,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      addMessage(agent.id, {
        id: generateId('msg'),
        role: 'assistant',
        content: `⚠️ Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        agentId: agent.id,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        'glass rounded-2xl border overflow-hidden transition-all duration-300',
        colors.border,
        agent.status === 'online' && colors.glow
      )}
    >
      {/* ── Card Header ── */}
      <div className={cn('p-5', colors.bg)}>
        <div className="flex items-start justify-between gap-3">
          {/* Agent Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl border',
                colors.bg, colors.border
              )}>
                {agent.icon}
              </div>
              <span className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface',
                STATUS_COLORS[agent.status]
              )} />
            </div>
            <div className="min-w-0">
              <h3 className={cn('font-bold text-sm leading-none', colors.text)}>{agent.displayName}</h3>
              <p className="text-xs text-anth-400 mt-1 font-mono">{agent.model}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant={
                agent.status === 'online' ? 'success' :
                agent.status === 'error' ? 'danger' :
                agent.status === 'busy' ? 'gold' : 'default'
              }
              dot
            >
              {agent.status}
            </Badge>
            <button
              onClick={() => onPing(agent.id)}
              disabled={pinging}
              title="Ping agent"
              className="p-1.5 rounded-lg text-anth-400 hover:text-forest-300 hover:bg-forest-800/50 transition-colors"
            >
              <RefreshCw size={12} className={pinging ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-anth-400 hover:text-forest-300 hover:bg-forest-800/50 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mt-3">
          {agent.capabilities.map(cap => (
            <span key={cap} className="tag text-[10px]">{cap}</span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-anth-400">
            <Activity size={11} />
            <span>{messages.length} msgs</span>
          </div>
          {agent.lastSeen && (
            <span className="text-xs text-anth-500">Last seen {timeAgo(agent.lastSeen)}</span>
          )}
          <span className="text-xs text-anth-500 ml-auto">T={agent.temperature}</span>
        </div>
      </div>

      {/* ── Expanded Chat Panel ── */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="overflow-hidden"
      >
        <div className="border-t border-border/60">
          {/* Messages */}
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-xs text-anth-500 text-center py-4">
                Start a conversation with {agent.displayName}
              </p>
            ) : (
              messages.slice(-10).map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <span className="text-sm shrink-0 mt-0.5">{agent.icon}</span>
                  )}
                  <div className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-forest-700/60 text-forest-100'
                      : cn(colors.bg, 'border', colors.border, colors.text)
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-2">
                <span className="text-sm">{agent.icon}</span>
                <div className={cn('rounded-xl px-3 py-2 border', colors.bg, colors.border)}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className={cn('w-1.5 h-1.5 rounded-full animate-bounce', colors.text.replace('text-', 'bg-'))}
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Message ${agent.displayName}…`}
              className="flex-1 mc-input text-xs py-2"
              disabled={agent.status === 'offline' || loading}
            />
            {messages.length > 0 && (
              <button
                onClick={() => clearConversation(agent.id)}
                className="p-2 rounded-xl text-anth-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <X size={12} />
              </button>
            )}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || agent.status === 'offline'}
              className={cn(
                'p-2 rounded-xl transition-colors',
                input.trim() && agent.status === 'online'
                  ? cn(colors.bg, colors.text, 'hover:opacity-80 border', colors.border)
                  : 'text-anth-600 cursor-not-allowed'
              )}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
