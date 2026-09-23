'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, Wand2, Send, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ShopifyDraft } from '@/types';

type ContentType = 'product' | 'blog' | 'page';

export function ShopifyHub() {
  const [drafts, setDrafts] = useState<ShopifyDraft[]>([]);
  const [tab, setTab] = useState<'generate' | 'drafts' | 'published'>('generate');
  const [form, setForm] = useState({
    type: 'product' as ContentType,
    title: '',
    brief: '',
    agent: 'claude',
    tone: 'professional',
  });
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shopify');
      const data = await res.json();
      setDrafts(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!form.title.trim() || !form.brief.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', ...form }),
      });
      const data = await res.json();
      if (data.data) {
        setDrafts(prev => [data.data, ...prev]);
        setTab('drafts');
      }
    } finally {
      setGenerating(false);
    }
  };

  const publish = async (draft: ShopifyDraft) => {
    setPublishing(draft.id);
    try {
      const res = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', draftId: draft.id }),
      });
      const data = await res.json();
      if (data.success) {
        setDrafts(prev => prev.map(d =>
          d.id === draft.id ? { ...d, status: 'published', shopifyId: data.data?.shopifyId } : d
        ));
      }
    } finally {
      setPublishing(null);
    }
  };

  const pending = drafts.filter(d => d.status === 'draft');
  const published = drafts.filter(d => d.status === 'published');

  const STATUS_ICON = {
    draft: <AlertCircle size={13} className="text-gold" />,
    publishing: <Loader2 size={13} className="animate-spin text-blue-400" />,
    published: <CheckCircle size={13} className="text-forest-400" />,
    failed: <AlertCircle size={13} className="text-red-400" />,
  };

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Drafts', value: drafts.length, color: 'text-forest-400' },
          { label: 'Ready to Publish', value: pending.length, color: 'text-gold' },
          { label: 'Published', value: published.length, color: 'text-forest-300' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-3 border border-border text-center">
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-anth-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { id: 'generate', label: '✍️ Generate Content' },
          { id: 'drafts',   label: `📋 Drafts${pending.length ? ` (${pending.length})` : ''}` },
          { id: 'published', label: `✅ Published` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-5 py-3 text-sm transition-colors border-b-2',
              tab === t.id
                ? 'text-forest-200 border-forest-500'
                : 'text-anth-400 border-transparent hover:text-forest-400'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Generate Tab ── */}
      {tab === 'generate' && (
        <div className="flex flex-col gap-5 flex-1">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-anth-400 mb-1.5 block">Content Type</label>
                <div className="flex gap-2">
                  {(['product', 'blog', 'page'] as ContentType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium border transition-all',
                        form.type === t
                          ? 'bg-forest-700/60 border-forest-500 text-forest-200'
                          : 'border-border text-anth-400 hover:border-forest-700'
                      )}
                    >
                      {t === 'product' ? '🛍️ Product' : t === 'blog' ? '📝 Blog Post' : '📄 Page'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-anth-400 mb-1.5 block">Title / Product Name *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="mc-input"
                  placeholder={
                    form.type === 'product' ? 'e.g. Ultimate Mindset Masterclass Bundle' :
                    form.type === 'blog' ? 'e.g. 5 Mindset Shifts That Transformed My Business' :
                    'e.g. About NEO Academy'
                  }
                />
              </div>

              <div>
                <label className="text-xs text-anth-400 mb-1.5 block">Brief / Key Points *</label>
                <textarea
                  value={form.brief}
                  onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                  className="mc-input resize-none min-h-[120px]"
                  placeholder="Describe the product, target audience, key benefits, price point, keywords to include…"
                  rows={5}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-anth-400 mb-1.5 block">AI Agent</label>
                <select
                  value={form.agent}
                  onChange={e => setForm(f => ({ ...f, agent: e.target.value }))}
                  className="mc-input"
                >
                  <option value="claude">🧠 Claude — Best for long-form copy</option>
                  <option value="hermes">⚡ Hermes — SEO-optimised content</option>
                  <option value="gemini">💎 Gemini — Creative angles</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-anth-400 mb-1.5 block">Tone of Voice</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'professional', label: 'Professional' },
                    { id: 'conversational', label: 'Conversational' },
                    { id: 'inspiring', label: 'Inspiring' },
                    { id: 'urgent', label: 'Urgent / CTA-driven' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm(f => ({ ...f, tone: t.id }))}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs border text-left transition-all',
                        form.tone === t.id
                          ? 'bg-forest-800/60 border-forest-500 text-forest-200'
                          : 'border-border text-anth-400 hover:border-forest-700'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generate}
                loading={generating}
                disabled={!form.title.trim() || !form.brief.trim()}
                icon={<Wand2 size={13} />}
                className="mt-auto"
                size="lg"
              >
                Generate with {form.agent === 'claude' ? 'Claude' : form.agent === 'hermes' ? 'Hermes' : 'Gemini'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drafts Tab ── */}
      {tab === 'drafts' && (
        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-forest-500" />
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ShoppingBag size={32} className="text-anth-700 mb-3" />
              <p className="text-sm text-anth-500">No drafts waiting.</p>
              <p className="text-xs text-anth-600 mt-1">Generate content and it'll appear here.</p>
            </div>
          ) : (
            <AnimatePresence>
              {pending.map((draft, i) => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-5 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span>{STATUS_ICON[draft.status]}</span>
                        <p className="text-sm font-semibold text-forest-100">{draft.title}</p>
                        <Badge variant={draft.type === 'product' ? 'gold' : 'info'}>{draft.type}</Badge>
                      </div>
                      <p className="text-xs text-anth-300 leading-relaxed line-clamp-3 mt-2">{draft.content}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {draft.tags.map(tag => <span key={tag} className="tag text-[9px]">{tag}</span>)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      loading={publishing === draft.id}
                      onClick={() => publish(draft)}
                      icon={<Send size={11} />}
                      className="shrink-0 ml-auto"
                    >
                      Publish
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ── Published Tab ── */}
      {tab === 'published' && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {published.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle size={32} className="text-anth-700 mb-3" />
              <p className="text-sm text-anth-500">Nothing published yet.</p>
            </div>
          ) : (
            <AnimatePresence>
              {published.map(draft => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 glass rounded-xl p-4 border border-forest-700/30"
                >
                  <CheckCircle size={16} className="text-forest-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-forest-200 truncate">{draft.title}</p>
                    <p className="text-[10px] text-anth-500">Published · {draft.publishedAt ? new Date(draft.publishedAt).toLocaleDateString() : 'recently'}</p>
                  </div>
                  {draft.shopifyId && (
                    <a
                      href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? 'your-store.myshopify.com'}/admin/products/${draft.shopifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-anth-400 hover:text-forest-300 transition-colors"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
