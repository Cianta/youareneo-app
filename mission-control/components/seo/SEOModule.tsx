'use client';
import { useState } from 'react';
import { Search, TrendingUp, Send, Loader2, ExternalLink, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface KeywordResult {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent: string;
  suggestions: string[];
}

interface ContentDraft {
  id: string;
  title: string;
  content: string;
  keyword: string;
}

export function SEOModule() {
  const [tab, setTab] = useState<'research' | 'deploy'>('research');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [domains, setDomains] = useState('');
  const [deploying, setDeploying] = useState<string | null>(null);

  const research = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), action: 'research' }),
      });
      const data = await res.json();
      setResults(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (keyword: string) => {
    setGeneratingFor(keyword);
    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keyword, action: 'generate' }),
      });
      const data = await res.json();
      if (data.data) {
        setDrafts(prev => [...prev, { id: Date.now().toString(), keyword, ...data.data }]);
        setTab('deploy');
      }
    } finally {
      setGeneratingFor(null);
    }
  };

  const deploy = async (draft: ContentDraft) => {
    setDeploying(draft.id);
    try {
      await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy', draft, domains: domains.split(',').map(d => d.trim()).filter(Boolean) }),
      });
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
    } finally {
      setDeploying(null);
    }
  };

  const getDifficultyColor = (d?: number) => {
    if (!d) return 'text-anth-400';
    if (d < 30) return 'text-forest-400';
    if (d < 60) return 'text-gold';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { id: 'research', label: '🔍 Keyword Research' },
          { id: 'deploy',   label: `🚀 Content Deploy${drafts.length ? ` (${drafts.length})` : ''}` },
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

      {/* ── Research Tab ── */}
      {tab === 'research' && (
        <div className="flex flex-col gap-5 flex-1">
          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-anth-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && research()}
                className="mc-input pl-9"
                placeholder="Enter keyword or topic to research…"
              />
            </div>
            <Button onClick={research} loading={loading} icon={<TrendingUp size={13} />}>
              Research
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Loader2 size={24} className="animate-spin text-forest-500 mx-auto mb-3" />
                  <p className="text-sm text-anth-400">Researching with Hermes…</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Search size={32} className="text-anth-700 mb-3" />
                <p className="text-sm text-anth-500">Enter a topic to discover keyword opportunities</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((r, i) => (
                  <motion.div
                    key={r.keyword}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl p-4 border border-border hover:border-forest-600/50 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p className="text-sm font-semibold text-forest-100">{r.keyword}</p>
                          <Badge variant="info">{r.intent}</Badge>
                        </div>
                        <div className="flex gap-4 text-xs">
                          {r.volume && (
                            <span className="flex items-center gap-1 text-anth-300">
                              <BarChart2 size={11} />
                              <span className="font-mono">{r.volume.toLocaleString()}/mo</span>
                            </span>
                          )}
                          {r.difficulty !== undefined && (
                            <span className={cn('font-medium', getDifficultyColor(r.difficulty))}>
                              KD: {r.difficulty}
                            </span>
                          )}
                        </div>
                        {r.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.suggestions.map(s => (
                              <span
                                key={s}
                                onClick={() => { setQuery(s); research(); }}
                                className="tag text-[10px] cursor-pointer hover:border-forest-500 hover:text-forest-300 transition-colors"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={generatingFor === r.keyword}
                        onClick={() => generateContent(r.keyword)}
                        icon={<Send size={11} />}
                      >
                        Generate
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deploy Tab ── */}
      {tab === 'deploy' && (
        <div className="flex flex-col gap-5 flex-1">
          {/* Domain targets */}
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">Target Domains (comma-separated)</label>
            <input
              value={domains}
              onChange={e => setDomains(e.target.value)}
              className="mc-input"
              placeholder="youracademy.com, blog.yourdomain.com, partner-site.io"
            />
          </div>

          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Send size={32} className="text-anth-700 mb-3" />
              <p className="text-sm text-anth-500">No content ready to deploy.</p>
              <p className="text-xs text-anth-600 mt-1">Generate content from the Research tab.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              {drafts.map(draft => (
                <div key={draft.id} className="glass rounded-xl p-5 border border-border">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-forest-100">{draft.title}</p>
                      <span className="tag text-[10px] mt-1">{draft.keyword}</span>
                    </div>
                    <Button
                      size="sm"
                      loading={deploying === draft.id}
                      onClick={() => deploy(draft)}
                      icon={<Send size={11} />}
                    >
                      Deploy to {domains.split(',').length || 0} domain{domains.split(',').length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                  <p className="text-xs text-anth-300 leading-relaxed line-clamp-4">{draft.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
