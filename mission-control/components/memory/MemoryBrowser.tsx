'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Pin, Brain, RefreshCw, Tag } from 'lucide-react';
import { useMemoryStore } from '@/lib/store';
import { cn, AGENT_COLORS, formatDateTime, generateId } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { MemoryEntry, MemoryType } from '@/types';

const TYPE_LABELS: Record<MemoryType, string> = {
  fact: '📌 Fact', conversation: '💬 Conv.', task: '📋 Task',
  insight: '💡 Insight', context: '🌐 Context',
};

export function MemoryBrowser() {
  const { entries, setEntries, addEntry, removeEntry, searchQuery, setSearchQuery } = useMemoryStore();
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ key: '', value: '', type: 'fact' as MemoryType, tags: '', sharedWith: '*' });

  const load = async () => {
    setLoading(true);
    try {
      const url = searchQuery ? `/api/memory?q=${encodeURIComponent(searchQuery)}` : '/api/memory';
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [searchQuery]);

  const create = async () => {
    if (!form.key.trim() || !form.value.trim()) return;
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: form.key.trim(),
        value: form.value.trim(),
        type: form.type,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        sourceAgent: 'user',
        sharedWith: form.sharedWith === '*' ? ['*'] : form.sharedWith.split(',').map(s => s.trim()),
      }),
    });
    const data = await res.json();
    if (data.data) {
      addEntry(data.data);
      setShowNew(false);
      setForm({ key: '', value: '', type: 'fact', tags: '', sharedWith: '*' });
    }
  };

  const del = async (id: string) => {
    await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
    removeEntry(id);
  };

  const pinned = entries.filter(e => e.pinned);
  const regular = entries.filter(e => !e.pinned);
  const sorted = [...pinned, ...regular];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-anth-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mc-input pl-9"
            placeholder="Search memory by key, value, or tag…"
          />
        </div>
        <Button onClick={load} variant="ghost" icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}>
          Sync
        </Button>
        <Button onClick={() => setShowNew(true)} icon={<Plus size={13} />}>
          New Entry
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-xs text-anth-400">
        <span className="flex items-center gap-1.5"><Brain size={11} className="text-forest-400" /> {entries.length} total entries</span>
        <span>{pinned.length} pinned</span>
        <span>{entries.filter(e => e.type === 'insight').length} insights</span>
      </div>

      {/* Entry Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={20} className="animate-spin text-forest-500" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Brain size={32} className="text-anth-700 mb-3" />
            <p className="text-sm text-anth-500">No memory entries yet.</p>
            <p className="text-xs text-anth-600 mt-1">Agents will save insights here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence>
              {sorted.map((entry, i) => {
                const agentColors = AGENT_COLORS[entry.sourceAgent] ?? AGENT_COLORS.system;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'glass rounded-xl p-4 border transition-all duration-200 group',
                      entry.pinned ? 'border-gold/30 shadow-glow-gold' : 'border-border hover:border-forest-600/50'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-sm shrink-0">{TYPE_LABELS[entry.type]?.split(' ')[0] ?? '📝'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-forest-200 truncate font-mono">{entry.key}</p>
                        <p className={cn('text-[10px] mt-0.5', agentColors.text)}>by {entry.sourceAgent}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => del(entry.id)}
                          className="p-1 rounded text-anth-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Value */}
                    <p className="text-xs text-anth-300 leading-relaxed line-clamp-3 mb-2">{entry.value}</p>

                    {/* Tags */}
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {entry.tags.map(tag => (
                          <span key={tag} className="tag text-[9px] px-1.5">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Badge variant={entry.type === 'insight' ? 'gold' : 'default'}>
                        {TYPE_LABELS[entry.type]?.replace(/^\S+\s/, '') ?? entry.type}
                      </Badge>
                      <span className="text-[10px] text-anth-600 ml-auto">
                        {formatDateTime(entry.updatedAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* New Entry Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Memory Entry" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">Key *</label>
            <input
              value={form.key}
              onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
              className="mc-input font-mono"
              placeholder="e.g. academy:brand:tone"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">Value *</label>
            <textarea
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              className="mc-input min-h-[100px] resize-none"
              placeholder="The information to remember…"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-anth-400 mb-1.5 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MemoryType }))} className="mc-input">
                <option value="fact">Fact</option>
                <option value="insight">Insight</option>
                <option value="context">Context</option>
                <option value="task">Task</option>
                <option value="conversation">Conversation</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-anth-400 mb-1.5 block">Shared With (* = all)</label>
              <input
                value={form.sharedWith}
                onChange={e => setForm(f => ({ ...f, sharedWith: e.target.value }))}
                className="mc-input"
                placeholder="* or claude,hermes"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">Tags</label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="mc-input"
              placeholder="brand, seo, course"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={create} className="flex-1">Save to Memory</Button>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
