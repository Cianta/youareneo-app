'use client';
import { useState } from 'react';
import { Mic2, Film, Play, Download, Loader2, AudioLines, Music, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type StudioTab = 'tts' | 'podcast' | 'video';

interface TTSJob {
  id: string;
  text: string;
  voice: string;
  status: 'processing' | 'done' | 'error';
  audioUrl?: string;
  duration?: number;
  createdAt: string;
}

const VOICES = [
  { id: 'alloy',   label: 'Alloy',   desc: 'Neutral, versatile' },
  { id: 'echo',    label: 'Echo',    desc: 'Deep, authoritative' },
  { id: 'fable',   label: 'Fable',   desc: 'Warm, storytelling' },
  { id: 'onyx',    label: 'Onyx',    desc: 'Rich, broadcast' },
  { id: 'nova',    label: 'Nova',    desc: 'Bright, energetic' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Soft, clear' },
];

export function MediaStudio() {
  const [tab, setTab] = useState<StudioTab>('tts');
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('nova');
  const [jobs, setJobs] = useState<TTSJob[]>([]);
  const [generating, setGenerating] = useState(false);
  const [podcastScript, setPodcastScript] = useState('');
  const [podcastTopic, setPodcastTopic] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);

  const generateTTS = async () => {
    if (!text.trim()) return;
    setGenerating(true);
    const job: TTSJob = {
      id: Date.now().toString(),
      text: text.trim(),
      voice,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setJobs(prev => [job, ...prev]);

    try {
      const res = await fetch('/api/media/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), voice }),
      });
      const data = await res.json();
      setJobs(prev => prev.map(j => j.id === job.id
        ? { ...j, status: data.success ? 'done' : 'error', audioUrl: data.data?.url, duration: data.data?.duration }
        : j
      ));
    } catch {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error' } : j));
    } finally {
      setGenerating(false);
      setText('');
    }
  };

  const generatePodcastScript = async () => {
    if (!podcastTopic.trim()) return;
    setScriptLoading(true);
    try {
      const res = await fetch('/api/media/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'podcast-script', topic: podcastTopic }),
      });
      const data = await res.json();
      setPodcastScript(data.data?.script ?? '');
    } finally {
      setScriptLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Tab Bar */}
      <div className="flex border-b border-border">
        {([
          { id: 'tts',     label: '🎙️ Text to Speech', icon: Mic2 },
          { id: 'podcast', label: '🎧 Podcast Studio',  icon: Music },
          { id: 'video',   label: '🎬 Video Processing', icon: Film },
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

      {/* ── TTS Tab ── */}
      {tab === 'tts' && (
        <div className="flex flex-col gap-5 flex-1">
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Input */}
            <div className="flex flex-col gap-3">
              <label className="text-xs text-anth-400">Script / Text</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="mc-input resize-none flex-1 min-h-[180px]"
                placeholder="Enter the text you want to convert to speech…"
                rows={8}
              />
              <div className="flex items-center gap-3">
                <span className="text-xs text-anth-500">{text.length} chars</span>
                <Button
                  onClick={generateTTS}
                  loading={generating}
                  disabled={!text.trim()}
                  icon={<Mic2 size={13} />}
                  className="ml-auto"
                >
                  Generate Audio
                </Button>
              </div>
            </div>

            {/* Voice selector */}
            <div className="flex flex-col gap-3">
              <label className="text-xs text-anth-400">Voice</label>
              <div className="grid grid-cols-2 gap-2">
                {VOICES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all duration-200',
                      voice === v.id
                        ? 'border-forest-500 bg-forest-800/50 shadow-glow-sm'
                        : 'border-border hover:border-forest-700 bg-surface/30'
                    )}
                  >
                    <p className={cn('text-xs font-semibold', voice === v.id ? 'text-forest-200' : 'text-anth-200')}>{v.label}</p>
                    <p className="text-[10px] text-anth-500 mt-0.5">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Job Queue */}
          {jobs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-anth-400 uppercase tracking-widest">Recent Generations</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {jobs.map(job => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 glass rounded-xl p-3 border border-border"
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                        job.status === 'done' ? 'bg-forest-800/60 text-forest-400' :
                        job.status === 'error' ? 'bg-red-950/60 text-red-400' :
                        'bg-anth-800 text-anth-400'
                      )}>
                        {job.status === 'processing' ? <Loader2 size={14} className="animate-spin" /> : <Mic2 size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-forest-200 truncate">{job.text.slice(0, 60)}…</p>
                        <p className="text-[10px] text-anth-500">{job.voice} · {new Date(job.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <Badge variant={job.status === 'done' ? 'success' : job.status === 'error' ? 'danger' : 'default'}>
                        {job.status}
                      </Badge>
                      {job.audioUrl && (
                        <a
                          href={job.audioUrl}
                          download
                          className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-800/50 transition-colors"
                        >
                          <Download size={12} />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Podcast Studio Tab ── */}
      {tab === 'podcast' && (
        <div className="flex flex-col gap-5 flex-1">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <label className="text-xs text-anth-400">Episode Topic / Brief</label>
              <textarea
                value={podcastTopic}
                onChange={e => setPodcastTopic(e.target.value)}
                className="mc-input resize-none min-h-[100px]"
                placeholder="What's this episode about? Target audience, key points, tone…"
                rows={4}
              />
              <Button
                onClick={generatePodcastScript}
                loading={scriptLoading}
                disabled={!podcastTopic.trim()}
                icon={<Music size={13} />}
              >
                Generate Script
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs text-anth-400">Generated Script</label>
              <textarea
                value={podcastScript}
                onChange={e => setPodcastScript(e.target.value)}
                className="mc-input resize-none flex-1 min-h-[200px] font-mono text-[11px]"
                placeholder="Your AI-generated podcast script will appear here…"
                rows={10}
              />
              <div className="flex gap-2">
                <Button
                  disabled={!podcastScript.trim()}
                  variant="outline"
                  icon={<Mic2 size={13} />}
                  onClick={() => setText(podcastScript)}
                  className="flex-1"
                >
                  → Convert to Audio
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Tab ── */}
      {tab === 'video' && (
        <div className="flex flex-col items-center justify-center flex-1 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-forest-800/40 border border-forest-700/50 flex items-center justify-center">
            <Film size={28} className="text-forest-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-forest-200 mb-1">Video Processing</p>
            <p className="text-xs text-anth-400 max-w-sm">
              Video processing is handled by the Video Editor module. Use the Video Use skill from your main Claude Code session to cut, grade, and render footage.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <div className="glass rounded-xl p-4 border border-border text-left max-w-xs">
              <p className="text-xs font-semibold text-forest-300 mb-1">🎬 Cut & Edit</p>
              <p className="text-[10px] text-anth-400">Use /video-use in Claude Code for transcription, cutting, and motion graphics</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border text-left max-w-xs">
              <p className="text-xs font-semibold text-forest-300 mb-1">✨ Motion Graphics</p>
              <p className="text-[10px] text-anth-400">Use /hyperframes to build title cards, overlays, and animations</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
