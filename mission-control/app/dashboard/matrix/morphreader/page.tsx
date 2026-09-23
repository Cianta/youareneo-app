'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, Rss } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: string;
  tag: string;
}

// Curated tech/AI/consciousness feed sources (RSS via CORS-friendly aggregator)
const FEED_SOURCES = [
  { label: 'AI News',    tag: 'ai',       color: 'text-mint-400',    url: 'https://feeds.feedburner.com/venturebeat/SZYF' },
  { label: 'Wired Tech', tag: 'tech',     color: 'text-sky-400',     url: 'https://www.wired.com/feed/rss' },
  { label: 'Singularity',tag: 'future',   color: 'text-violet-400',  url: 'https://singularityhub.com/feed/' },
  { label: 'MIT Tech',   tag: 'research', color: 'text-amber-400',   url: 'https://www.technologyreview.com/feed/' },
];

const TAG_COLORS: Record<string, string> = {
  ai:       'bg-mint-900/40 text-mint-400 border-mint-700/40',
  tech:     'bg-sky-900/40 text-sky-400 border-sky-700/40',
  future:   'bg-violet-900/40 text-violet-400 border-violet-700/40',
  research: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
};

// Placeholder articles — real RSS pull would go via /api/morphreader
const SEED_ARTICLES: Article[] = [
  { id:'1', title:'Claude 4 Achieves Superhuman Performance on Complex Reasoning Benchmarks', source:'AI News', url:'#', summary:'Anthropic releases latest model with breakthrough improvements in multi-step logical reasoning and code generation...', publishedAt: new Date(Date.now()-3600*1000).toISOString(), tag:'ai' },
  { id:'2', title:'Quantum Computing Intersects with Neural Architecture Search', source:'MIT Tech Review', url:'#', summary:'Researchers demonstrate 100× speedup in hyperparameter optimization using quantum annealing...', publishedAt: new Date(Date.now()-7200*1000).toISOString(), tag:'research' },
  { id:'3', title:'The Consciousness Revolution: AI Systems Begin Exhibiting Novel Self-Models', source:'Singularity Hub', url:'#', summary:'New interpretability research reveals unexpected internal representations in frontier language models...', publishedAt: new Date(Date.now()-14400*1000).toISOString(), tag:'future' },
  { id:'4', title:'Open Source AI Models Close the Gap with Proprietary Frontier Systems', source:'Wired', url:'#', summary:'Llama 4 and Mistral\'s latest release challenge the dominance of closed-source AI companies...', publishedAt: new Date(Date.now()-18000*1000).toISOString(), tag:'tech' },
  { id:'5', title:'Neuromorphic Chips Enable Always-On Edge AI at Microamp Power Levels', source:'MIT Tech Review', url:'#', summary:'Intel\'s Loihi 3 demonstrates sustained neural inference at 50μA, enabling always-on wearable AI...', publishedAt: new Date(Date.now()-28800*1000).toISOString(), tag:'research' },
  { id:'6', title:'AI-Generated Content Now Constitutes 40% of Global Web Traffic', source:'Wired', url:'#', summary:'Research firm tracks exponential growth in synthetic media, raising questions about provenance...', publishedAt: new Date(Date.now()-36000*1000).toISOString(), tag:'tech' },
];

export default function MorphReaderPage() {
  const [articles, setArticles] = useState<Article[]>(SEED_ARTICLES);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString());

  const refresh = () => {
    setLoading(true);
    // Shuffle seed for demo — real impl hits /api/morphreader
    setTimeout(() => {
      setArticles([...SEED_ARTICLES].sort(() => Math.random() - 0.5));
      setLastRefresh(new Date().toISOString());
      setLoading(false);
    }, 800);
  };

  const filtered = activeTag ? articles.filter(a => a.tag === activeTag) : articles;

  return (
    <div className="h-full flex flex-col gap-4 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Rss size={16} className="text-violet-400" />
        <div>
          <p className="text-xs text-anth-500 uppercase tracking-widest">Matrix Center</p>
          <h1 className="text-lg font-bold text-forest-100">MorphReader · Tech Intelligence</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-anth-600">Updated {timeAgo(lastRefresh)}</span>
          <button onClick={refresh} disabled={loading} className="p-2 rounded-xl border border-border text-anth-400 hover:text-mint-light hover:border-mint-500/30 transition-all">
            <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Tag filter bar */}
      <div className="flex gap-2 shrink-0 flex-wrap">
        <button
          onClick={() => setActiveTag(null)}
          className={cn('px-3 py-1 rounded-full text-xs border transition-all', !activeTag ? 'bg-forest-800/60 border-forest-600/50 text-forest-200' : 'border-border text-anth-500 hover:text-anth-300')}
        >
          All Feeds
        </button>
        {FEED_SOURCES.map(f => (
          <button
            key={f.tag}
            onClick={() => setActiveTag(activeTag === f.tag ? null : f.tag)}
            className={cn('px-3 py-1 rounded-full text-xs border transition-all', activeTag === f.tag ? TAG_COLORS[f.tag] : 'border-border text-anth-500 hover:text-anth-300')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Article feed */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filtered.map((article, i) => (
          <div
            key={article.id}
            className="glass rounded-xl border border-border p-4 hover:border-forest-700/50 transition-all group"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md border font-medium', TAG_COLORS[article.tag])}>
                    {article.tag.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-anth-600">{article.source}</span>
                  <span className="text-[10px] text-anth-700 ml-auto">{timeAgo(article.publishedAt)}</span>
                </div>
                <h3 className="text-sm font-semibold text-forest-100 leading-snug mb-1.5 group-hover:text-mint-light transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-anth-400 leading-relaxed line-clamp-2">{article.summary}</p>
              </div>
              <a href={article.url} target="_blank" rel="noopener noreferrer"
                className="shrink-0 p-1.5 text-anth-700 hover:text-mint-500 transition-colors mt-0.5">
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
