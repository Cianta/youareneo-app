'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, Globe2, FileText, RefreshCw, CheckCircle2, AlertTriangle, Eye, Edit3, Loader2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MemoryBrowser } from '@/components/memory/MemoryBrowser';
import { cn, formatDateTime } from '@/lib/utils';

type ActiveTab = 'obsidian' | 'notion' | 'docmost';

interface SyncLog {
  id: string;
  title: string;
  obsidianPath?: string;
  notionUrl?: string;
  status: 'syncing' | 'done' | 'error';
  error?: string;
  timestamp: string;
}

export function UniverseView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('obsidian');
  const [inputText, setInputText] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInputText(ev.target?.result as string ?? '');
      if (!inputTitle) setInputTitle(file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsText(file);
  }, [inputTitle]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInputText(ev.target?.result as string ?? '');
      if (!inputTitle) setInputTitle(file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsText(file);
  };

  const submit = async () => {
    if (!inputText.trim()) return;
    setSubmitting(true);
    const logId = Date.now().toString();
    const log: SyncLog = {
      id: logId,
      title: inputTitle || 'Untitled Entry',
      status: 'syncing',
      timestamp: new Date().toISOString(),
    };
    setSyncLogs(prev => [log, ...prev]);

    try {
      const res = await fetch('/api/universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inputTitle || 'Untitled Entry',
          content: inputText,
        }),
      });
      const data = await res.json();

      setSyncLogs(prev => prev.map(l =>
        l.id === logId
          ? {
              ...l,
              status: data.success ? 'done' : 'error',
              obsidianPath: data.data?.obsidianPath,
              notionUrl: data.data?.notionUrl,
              error: data.error,
            }
          : l
      ));

      if (data.success) {
        setInputText('');
        setInputTitle('');
      }
    } catch (err) {
      setSyncLogs(prev => prev.map(l =>
        l.id === logId ? { ...l, status: 'error', error: String(err) } : l
      ));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Universal Input ── */}
      <div className="glass rounded-2xl border border-border p-5 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Globe2 size={16} className="text-gold" />
          <h2 className="text-sm font-semibold text-forest-100">Universal Knowledge Input</h2>
          <Badge variant="gold">→ Obsidian + Notion</Badge>
        </div>

        {/* Title */}
        <input
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
          className="mc-input mb-3"
          placeholder="Entry title / filename (e.g. brand-strategy-2025)…"
        />

        {/* Drop zone + textarea */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-xl border-2 border-dashed transition-all duration-200',
            dragging ? 'border-gold/60 bg-gold/5' : 'border-border hover:border-forest-700'
          )}
        >
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full bg-transparent px-4 pt-4 pb-10 text-sm text-forest-100 placeholder-anth-600 outline-none resize-none leading-relaxed min-h-[140px]"
            placeholder="Paste text, drop a .md/.txt file, or type your knowledge entry here…"
            rows={5}
          />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-anth-500 hover:text-forest-400 transition-colors"
            >
              <Upload size={11} />
              Upload file
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-anth-600">{inputText.length} chars</span>
              <Button
                onClick={submit}
                loading={submitting}
                disabled={!inputText.trim()}
                size="sm"
                icon={<Send size={11} />}
              >
                Sync to Universe
              </Button>
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".md,.txt,.json" className="hidden" onChange={handleFileInput} />

        {/* Sync status */}
        {syncLogs.length > 0 && (
          <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
            {syncLogs.map(log => (
              <div key={log.id} className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs border',
                log.status === 'done'    ? 'bg-forest-900/30 border-forest-700/40 text-forest-300' :
                log.status === 'error'   ? 'bg-red-950/30 border-red-900/40 text-red-400' :
                'bg-anth-900/30 border-border text-anth-400'
              )}>
                {log.status === 'syncing' ? <Loader2 size={12} className="animate-spin shrink-0" /> :
                 log.status === 'done'    ? <CheckCircle2 size={12} className="shrink-0 text-forest-400" /> :
                 <AlertTriangle size={12} className="shrink-0" />}
                <span className="flex-1 truncate">{log.title}</span>
                {log.obsidianPath && <code className="text-[9px] text-anth-500 truncate max-w-[120px]">{log.obsidianPath}</code>}
                {log.status === 'done' && <span className="text-[10px] text-forest-500 shrink-0">✓ Synced</span>}
                {log.error && <span className="text-[10px] truncate">{log.error.slice(0, 40)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Vault Tabs ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex border-b border-border shrink-0">
          {([
            { id: 'obsidian', label: '🪨 Obsidian Core Vault',   icon: FileText },
            { id: 'notion',   label: '📖 Notion Encyclopedia',    icon: Globe2  },
            { id: 'docmost',  label: '📝 Docmost Core',           icon: Edit3   },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-5 py-3 text-sm transition-colors border-b-2',
                activeTab === t.id
                  ? 'text-forest-200 border-forest-500'
                  : 'text-anth-400 border-transparent hover:text-forest-400'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden pt-4">
          {/* Obsidian Tab → shows Shared Memory (same underlying data) */}
          {activeTab === 'obsidian' && (
            <div className="h-full flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
                <p className="text-xs text-anth-400">
                  Local vault · writes to <code className="text-gold bg-forest-900/60 px-1 py-0.5 rounded">OBSIDIAN_VAULT_PATH</code> on submit
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <MemoryBrowser />
              </div>
            </div>
          )}

          {/* Docmost Tab → iframe */}
          {activeTab === 'docmost' && (
            <div className="h-full flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <p className="text-xs text-anth-400">
                  Self-hosted docs · runs on{' '}
                  <code className="text-gold bg-forest-900/60 px-1 py-0.5 rounded">NEXT_PUBLIC_DOCMOST_URL</code>{' '}
                  (default: localhost:3001)
                </p>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden border border-border">
                {process.env.NEXT_PUBLIC_DOCMOST_URL ? (
                  <iframe
                    src={process.env.NEXT_PUBLIC_DOCMOST_URL}
                    className="w-full h-full"
                    title="Docmost Core"
                    allow="clipboard-read; clipboard-write"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <span className="text-3xl">📝</span>
                    <p className="text-sm text-anth-400">Docmost not configured.</p>
                    <p className="text-xs text-anth-600">Set <code className="text-gold">NEXT_PUBLIC_DOCMOST_URL</code> in .env.local</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notion Tab → sync logs */}
          {activeTab === 'notion' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-anth-600" />
                <p className="text-xs text-anth-400">
                  Live sync to Notion database · configure{' '}
                  <code className="text-gold bg-forest-900/60 px-1 py-0.5 rounded">NOTION_API_KEY</code> +{' '}
                  <code className="text-gold bg-forest-900/60 px-1 py-0.5 rounded">NOTION_DATABASE_ID</code>
                </p>
              </div>

              {syncLogs.filter(l => l.status === 'done').length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Brain size={32} className="text-anth-700 mb-3" />
                  <p className="text-sm text-anth-500">No syncs yet.</p>
                  <p className="text-xs text-anth-600 mt-1">Submit content above to push to Notion.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syncLogs.filter(l => l.status === 'done').map(log => (
                    <div key={log.id} className="glass rounded-xl p-4 border border-forest-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-forest-200">{log.title}</p>
                        <span className="text-[10px] text-anth-500">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        {log.obsidianPath && (
                          <span className="text-anth-400">📁 {log.obsidianPath}</span>
                        )}
                        {log.notionUrl && (
                          <a href={log.notionUrl} target="_blank" rel="noopener noreferrer" className="text-forest-400 hover:text-forest-300">
                            🔗 Notion →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
