'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, Bot, X, Image as ImageIcon, FileText, Film, Music, File } from 'lucide-react';
import { cn, AGENT_COLORS, STATUS_COLORS, generateId } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAgentStore, withSelfContext } from '@/lib/store';
import type { AgentConfig, ChatMessage } from '@/types';

interface FileAttachment {
  id: string;
  name: string;
  mime: string;
  dataUrl: string;
  size: number;
}

function AttachmentThumb({ att, onRemove }: { att: FileAttachment; onRemove: () => void }) {
  const isImage = att.mime.startsWith('image/');
  const isVideo = att.mime.startsWith('video/');
  const isAudio = att.mime.startsWith('audio/');
  const isPdf   = att.mime === 'application/pdf' || att.name.endsWith('.pdf');

  const Icon = isImage ? ImageIcon : isVideo ? Film : isAudio ? Music : isPdf ? FileText : File;

  return (
    <div className="relative group shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-border/60 bg-anth-900/60">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
          <Icon size={18} className="text-anth-400" />
          <span className="text-[8px] text-anth-500 truncate w-full text-center">{att.name.split('.').pop()?.toUpperCase()}</span>
        </div>
      )}
      <button onClick={onRemove}
        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full bg-anth-900/80 text-anth-300 hover:text-red-400 flex items-center justify-center transition-all">
        <X size={8} />
      </button>
      <span className="absolute bottom-0 left-0 right-0 bg-anth-900/80 text-[7px] text-anth-400 text-center truncate px-1 py-0.5">
        {att.name.split('.')[0].slice(0, 8)}
      </span>
    </div>
  );
}

// Chat message with optional attachments
interface RichChatMessage extends ChatMessage {
  attachments?: FileAttachment[];
}

export default function DigitaleBegleiterPage() {
  const t = useT();
  const { agents } = useAgentStore();
  const [selectedId, setSelectedId] = useState<string>(agents[0]?.id ?? '');
  const [messages, setMessages] = useState<RichChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agent = agents.find(a => a.id === selectedId) ?? agents[0];
  const colors = agent ? (AGENT_COLORS[agent.id] ?? AGENT_COLORS.system) : AGENT_COLORS.system;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = false; recog.interimResults = false; recog.lang = 'de-DE';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = (e: any) => {
      const t: string = e.results[0]?.[0]?.transcript ?? '';
      if (t) setInput(prev => prev + (prev ? ' ' : '') + t);
    };
    recog.onend = () => setIsRecording(false);
    recognRef.current = recog;
  }, []);

  // ── File upload handler ──────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setPendingFiles(prev => [...prev, {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          dataUrl,
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading || !agent) return;
    const text = input.trim();
    const files = [...pendingFiles];
    setInput('');
    setPendingFiles([]);
    setIsLoading(true);

    const userMsg: RichChatMessage = {
      id: generateId('ac'),
      role: 'user',
      content: text || (files.length > 0 ? `[${files.length} Datei(en) angehängt]` : ''),
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      attachments: files.length > 0 ? files : undefined,
    };
    setMessages(prev => [...prev, userMsg]);

    const asstMsg: RichChatMessage = {
      id: generateId('ac'),
      role: 'assistant',
      content: '',
      agentId: agent.id,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withSelfContext([...messages, userMsg]), model: agent.model }),
      });
      if (res.body) {
        setMessages(prev => [...prev, asstMsg]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try { const p = JSON.parse(data); if (p.text) { full += p.text; setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: full } : m)); } } catch { /* skip */ }
          }
        }
      } else {
        const data = await res.json();
        setMessages(prev => [...prev, { ...asstMsg, content: data.data?.content ?? 'No response.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { ...asstMsg, content: `Error: ${err instanceof Error ? err.message : 'Unknown'}` }]);
    } finally { setIsLoading(false); inputRef.current?.focus(); }
  };

  const toggleRecording = () => {
    if (!recognRef.current) return;
    if (isRecording) { recognRef.current.stop(); setIsRecording(false); }
    else { recognRef.current.start(); setIsRecording(true); }
  };

  return (
    <div className="h-full flex gap-2 fade-in overflow-hidden">

      {/* ── Left: Agent Sidebar (narrow squares) ── */}
      <div className="w-[180px] shrink-0 flex flex-col gap-1 overflow-y-auto pr-0.5 border-r border-border/40 bg-anth-950/40 rounded-2xl">
        <div className="px-3 py-2.5 shrink-0 border-b border-border/30">
          <p className="text-[9px] uppercase tracking-widest text-anth-600 font-semibold">Begleiter</p>
          <p className="text-[10px] text-anth-700 mt-0.5">{agents.filter(a => a.status === 'online').length} online</p>
        </div>
        <div className="flex flex-col gap-1 p-2">
          {agents.map(a => {
            const c = AGENT_COLORS[a.id] ?? AGENT_COLORS.system;
            const isSelected = a.id === selectedId;
            return (
              <button key={a.id}
                onClick={() => { setSelectedId(a.id); setMessages([]); setPendingFiles([]); }}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all text-left w-full',
                  isSelected ? cn(c.bg, c.border, 'shadow-md') : 'border-transparent hover:bg-forest-900/20 hover:border-forest-800/40'
                )}>
                {/* Avatar square */}
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 border relative',
                  isSelected ? cn(c.border, c.bg) : 'border-anth-700/50 bg-anth-900/50')}>
                  {a.icon}
                  <span className={cn('absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-anth-950', STATUS_COLORS[a.status])} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[11px] font-medium truncate', isSelected ? c.text : 'text-anth-400')}>{a.displayName}</p>
                  <p className="text-[8px] text-anth-600 truncate">{a.status}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Chat Terminal ── */}
      <div className="flex-1 flex flex-col min-w-0 glass rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        {agent && (
          <div className={cn('shrink-0 px-4 py-2.5 border-b border-border/60 flex items-center gap-2.5', colors.bg)}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xl border shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {agent.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-bold truncate', colors.text)}>{agent.displayName}</p>
              <p className="text-[9px] text-anth-500 truncate">{agent.model} · {agent.status}</p>
            </div>
            <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_COLORS[agent.status])} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 && agent ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-8 opacity-60">
              <Bot size={28} className="text-anth-600" />
              <p className="text-xs text-anth-500">Gespräch mit {agent.displayName} starten</p>
              <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
                {(agent.capabilities ?? []).slice(0, 5).map(cap => (
                  <span key={cap} className="text-[9px] px-2 py-0.5 rounded-full border border-border text-anth-500">{cap}</span>
                ))}
              </div>
              <p className="text-[10px] text-anth-600 mt-2">📎 Bilder · Audio · Video · PDF · Dokumente</p>
            </div>
          ) : messages.map(msg => (
            <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && agent && <span className="text-lg shrink-0 mt-0.5">{agent.icon}</span>}
              <div className="max-w-[80%] flex flex-col gap-1.5">
                {/* File attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.attachments.map(att => (
                      <div key={att.id} className="w-16 h-16 rounded-xl overflow-hidden border border-border/60 shrink-0">
                        {att.mime.startsWith('image/') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-anth-900/60 p-1">
                            <FileText size={16} className="text-anth-400" />
                            <span className="text-[7px] text-anth-500 truncate">{att.name.split('.').pop()?.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Text content */}
                {msg.content && (
                  <div className={cn('rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed',
                    msg.role === 'user' ? 'bg-forest-700/50 text-mint-light rounded-br-sm' : cn(colors.bg, 'border', colors.border, colors.text, 'rounded-bl-sm')
                  )}>
                    {msg.content || (isLoading ? (
                      <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-anth-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</span>
                    ) : '')}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Pending file attachments row */}
        {pendingFiles.length > 0 && (
          <div className="shrink-0 flex gap-2 px-3 py-2 border-t border-border/40 overflow-x-auto">
            {pendingFiles.map(f => (
              <AttachmentThumb key={f.id} att={f} onRemove={() => setPendingFiles(prev => prev.filter(x => x.id !== f.id))} />
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-border/60 px-3 py-2.5 flex gap-2 items-end">
          {/* Voice input */}
          <button onClick={toggleRecording}
            className={cn('p-2 rounded-xl border transition-all shrink-0',
              isRecording ? 'bg-red-900/30 border-red-700/50 text-red-400 animate-pulse' : 'bg-surface border-border text-anth-500 hover:text-mint-light hover:border-mint-500/30'
            )}>
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          {/* File upload */}
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl border border-border bg-surface text-anth-500 hover:text-forest-300 hover:border-forest-700/50 transition-all shrink-0 relative">
            <Paperclip size={14} />
            {pendingFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-mint-500 text-[8px] text-anth-950 font-bold flex items-center justify-center">
                {pendingFiles.length}
              </span>
            )}
          </button>
          <input ref={fileInputRef} type="file" multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
            className="hidden" onChange={handleFileChange} />

          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={agent ? `${t('Nachricht an')} ${agent.displayName}…` : t('Agent auswählen…')}
            rows={1} className="flex-1 mc-input py-2 text-xs resize-none min-h-[36px] max-h-[120px]" disabled={isLoading} autoFocus />

          <button onClick={sendMessage} disabled={(!input.trim() && pendingFiles.length === 0) || isLoading}
            className={cn('p-2 rounded-xl border shrink-0 transition-all',
              (input.trim() || pendingFiles.length > 0) && !isLoading ? 'bg-mint-500/15 border-mint-500/40 text-mint-500 hover:bg-mint-500/25' : 'text-anth-600 border-anth-700 cursor-not-allowed'
            )}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
