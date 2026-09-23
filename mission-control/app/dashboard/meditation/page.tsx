'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, Upload, Music, Expand, X, Trash2,
  Volume2, VolumeX, Video, Check,
} from 'lucide-react';
import { useUIExtStore } from '@/lib/store';
import type { MusicTrack, VideoTrack } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { uploadToStorage } from '@/lib/storage';

const NATURE_LOOPS = [
  { key: 'forest',  label: 'Forest Rain',    emoji: '🌲', src: 'https://www.youtube.com/embed/xNN7iTA57jM?autoplay=1&mute=1&loop=1&controls=0&playlist=xNN7iTA57jM', color: 'border-green-700/40 bg-green-950/30' },
  { key: 'ocean',   label: 'Ocean Waves',    emoji: '🌊', src: 'https://www.youtube.com/embed/bn9F19Hi1Lk?autoplay=1&mute=1&loop=1&controls=0&playlist=bn9F19Hi1Lk', color: 'border-sky-700/40 bg-sky-950/30' },
  { key: 'rain',    label: 'Gentle Rain',    emoji: '🌧️', src: 'https://www.youtube.com/embed/mPZkdNFkNps?autoplay=1&mute=1&loop=1&controls=0&playlist=mPZkdNFkNps', color: 'border-blue-700/40 bg-blue-950/30' },
  { key: 'cosmos',  label: 'Cosmos & Stars', emoji: '🌌', src: 'https://www.youtube.com/embed/Xb7-VxD4Uag?autoplay=1&mute=1&loop=1&controls=0&playlist=Xb7-VxD4Uag', color: 'border-violet-700/40 bg-violet-950/30' },
  { key: 'fire',    label: 'Campfire',       emoji: '🔥', src: 'https://www.youtube.com/embed/L_LUpnjgPso?autoplay=1&mute=1&loop=1&controls=0&playlist=L_LUpnjgPso', color: 'border-orange-700/40 bg-orange-950/30' },
  { key: 'morning', label: 'Morning Meadow', emoji: '🌅', src: 'https://www.youtube.com/embed/V1RPi2MYptM?autoplay=1&mute=1&loop=1&controls=0&playlist=V1RPi2MYptM', color: 'border-amber-700/40 bg-amber-950/30' },
];

function fmt(s: number) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ── Mini Audio Player (compact) ────────────────────────────────────────────────
function MiniPlayer({ track }: { track: MusicTrack }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(0.8);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.src = track.dataUrl;
    el.load();
    el.pause();
    setPlaying(false);
    setCurrent(0);
  }, [track.id, track.dataUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = muted;
    }
  }, [vol, muted]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  }, [playing]);

  return (
    <div className="border-t border-border/40 pt-2 mt-1 space-y-1.5">
      <audio ref={audioRef}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
      />
      <div className="flex items-center gap-1.5">
        <button onClick={toggle}
          className="w-6 h-6 rounded-full bg-mint-500/20 border border-mint-500/30 text-mint-400 flex items-center justify-center hover:bg-mint-500/30 transition-colors shrink-0">
          {playing ? <Pause size={9} /> : <Play size={9} />}
        </button>
        <span className="text-[9px] text-anth-500 font-mono">{fmt(current)}/{fmt(duration)}</span>
        <button onClick={() => setMuted(v => !v)} className="text-anth-600 hover:text-anth-400 transition-colors ml-auto">
          {muted ? <VolumeX size={10} /> : <Volume2 size={10} />}
        </button>
        <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol}
          onChange={e => { setVol(Number(e.target.value)); setMuted(false); }}
          className="w-14 h-1 accent-mint-500" />
      </div>
      <input type="range" min={0} max={duration || 1} step={0.5} value={current}
        onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); setCurrent(Number(e.target.value)); }}
        className="w-full h-1 accent-mint-500 cursor-pointer" />
    </div>
  );
}

// ── Compact Track Widget ───────────────────────────────────────────────────────
interface TrackWidgetProps {
  tracks: MusicTrack[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (t: MusicTrack) => void;
  label: string;
  emoji: string;
  accent: 'mint' | 'violet';
}

function TrackWidget({ tracks, selectedId, onSelect, onRemove, onAdd, label, emoji, accent }: TrackWidgetProps) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const selectedTrack = tracks.find(t => t.id === selectedId) ?? null;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    Array.from(files).forEach(async file => {
      // Cloud-Stub (FuseBase Store später); Fallback: lokale DataURL
      const cloudUrl = await uploadToStorage(file, 'meditation/music');
      if (cloudUrl) {
        onAdd({ id: `track-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name.replace(/\.[^.]+$/, ''), dataUrl: cloudUrl, size: file.size });
        setUploading(false);
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        onAdd({ id: `track-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name.replace(/\.[^.]+$/, ''), dataUrl, size: file.size });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const ringColor = accent === 'mint' ? 'ring-mint-500/50' : 'ring-violet-500/50';
  const dotColor  = accent === 'mint' ? 'bg-mint-500'      : 'bg-violet-400';
  const selBg     = accent === 'mint' ? 'bg-mint-500/10 border-mint-500/30'   : 'bg-violet-500/10 border-violet-500/30';
  const borderSel = accent === 'mint' ? 'border-mint-500'   : 'border-violet-400';
  const iconColor = accent === 'mint' ? 'text-mint-600'     : 'text-violet-500';
  const uploadBtn = accent === 'mint'
    ? 'bg-forest-800/40 border border-forest-700/40 text-forest-300 hover:bg-forest-700/40'
    : 'bg-violet-900/40 border border-violet-700/40 text-violet-300 hover:bg-violet-800/40';

  return (
    <div className={cn('glass rounded-2xl border border-border flex flex-col', 'w-64 shrink-0')} style={{ minHeight: '240px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{emoji}</span>
          <p className="text-[10px] font-medium text-forest-200">{t(label)}</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors', uploadBtn)}>
          <Upload size={9} /> {uploading ? '…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5" style={{ maxHeight: '132px' }}>
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-16 gap-1 text-center">
            <Music size={16} className="text-anth-600" />
            <p className="text-[9px] text-anth-500">{t('Keine Tracks')}</p>
          </div>
        ) : (
          tracks.map(t => (
            <div key={t.id}
              className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer',
                t.id === selectedId ? selBg : 'border-transparent hover:bg-anth-800/30'
              )}
              onClick={() => onSelect(t.id)}>
              <div className={cn('w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0',
                t.id === selectedId ? `${borderSel} bg-opacity-20` : 'border-anth-600'
              )}>
                {t.id === selectedId && <div className={cn('w-1 h-1 rounded-full', dotColor)} />}
              </div>
              <Music size={9} className={iconColor} />
              <span className="text-[9px] text-anth-200 flex-1 truncate">{t.name}</span>
              <button onClick={e => { e.stopPropagation(); onRemove(t.id); }}
                className="p-0.5 text-anth-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={8} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mini player */}
      <div className="px-3 pb-3">
        {selectedTrack
          ? <MiniPlayer key={selectedTrack.id} track={selectedTrack} />
          : <p className="text-[9px] text-anth-600 text-center mt-1">{t('Wähle einen Track')}</p>
        }
      </div>
    </div>
  );
}

// ── Compact Video Widget ───────────────────────────────────────────────────────
interface VideoWidgetProps {
  videos: VideoTrack[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onAdd: (v: VideoTrack) => void;
}

function VideoWidget({ videos, selectedId, onSelect, onRemove, onAdd }: VideoWidgetProps) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    Array.from(files).forEach(file => {
      void (async () => {
        const cloudUrl = await uploadToStorage(file, 'meditation/videos');
        if (cloudUrl) {
          onAdd({ id: `vid-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name.replace(/\.[^.]+$/, ''), dataUrl: cloudUrl, size: file.size });
          setUploading(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
          const dataUrl = ev.target?.result as string;
          onAdd({ id: `vid-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name.replace(/\.[^.]+$/, ''), dataUrl, size: file.size });
          setUploading(false);
        };
        reader.readAsDataURL(file);
      })();
    });
    e.target.value = '';
  };

  return (
    <div className="glass rounded-2xl border border-border flex flex-col w-64 shrink-0" style={{ minHeight: '240px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🎬</span>
          <p className="text-[10px] font-medium text-forest-200">{t('Eigene Videos')}</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-sky-900/40 border border-sky-700/40 text-sky-300 hover:bg-sky-800/40 transition-colors">
          <Upload size={9} /> {uploading ? '…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="video/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {/* Video list */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5" style={{ maxHeight: '132px' }}>
        {/* "None" option = use nature loops */}
        <div
          className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer',
            !selectedId ? 'bg-sky-500/10 border-sky-500/30' : 'border-transparent hover:bg-anth-800/30'
          )}
          onClick={() => onSelect(null)}>
          <div className={cn('w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0',
            !selectedId ? 'border-sky-400' : 'border-anth-600'
          )}>
            {!selectedId && <div className="w-1 h-1 rounded-full bg-sky-400" />}
          </div>
          <span className="text-[9px] text-anth-300 flex-1">{t('Nature-Loop (Standard)')}</span>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-12 gap-1 text-center">
            <Video size={14} className="text-anth-600" />
            <p className="text-[9px] text-anth-500">{t('Kein Video hochgeladen')}</p>
          </div>
        ) : (
          videos.map(v => (
            <div key={v.id}
              className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer',
                v.id === selectedId ? 'bg-sky-500/10 border-sky-500/30' : 'border-transparent hover:bg-anth-800/30'
              )}
              onClick={() => onSelect(v.id)}>
              <div className={cn('w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0',
                v.id === selectedId ? 'border-sky-400' : 'border-anth-600'
              )}>
                {v.id === selectedId && <div className="w-1 h-1 rounded-full bg-sky-400" />}
              </div>
              <Video size={9} className="text-sky-500" />
              <span className="text-[9px] text-anth-200 flex-1 truncate">{v.name}</span>
              <span className="text-[9px] text-anth-600 shrink-0">{(v.size / 1024 / 1024).toFixed(1)}MB</span>
              <button onClick={e => { e.stopPropagation(); onRemove(v.id); }}
                className="p-0.5 text-anth-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={8} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Preview thumbnail */}
      <div className="px-3 pb-3 mt-auto">
        {selectedId ? (
          <div className="rounded-lg overflow-hidden border border-border/40 mt-2" style={{ height: '64px' }}>
            <video src={videos.find(v => v.id === selectedId)?.dataUrl} muted className="w-full h-full object-cover" />
          </div>
        ) : (
          <p className="text-[9px] text-anth-600 text-center mt-2">{t('Nature-Loop wird verwendet')}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MeditationPage() {
  const t = useT();
  const {
    meditationBg, setMeditationBg,
    workTracks, breakTracks,
    selectedWorkTrackId, selectedBreakTrackId,
    addWorkTrack, removeWorkTrack, setSelectedWorkTrackId,
    addBreakTrack, removeBreakTrack, setSelectedBreakTrackId,
    customVideos, selectedCustomVideoId,
    addCustomVideo, removeCustomVideo, setSelectedCustomVideoId,
  } = useUIExtStore();

  const [fullscreen, setFullscreen] = useState(false);
  const selectedNature = NATURE_LOOPS.find(l => l.key === meditationBg) ?? NATURE_LOOPS[0];
  const selectedCustom  = customVideos.find(v => v.id === selectedCustomVideoId) ?? null;

  // Preview src: custom video dataUrl (rendered as <video>), or nature loop iframe
  const useCustomVideo = !!selectedCustom;

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-xl font-bold text-gold-gradient mb-1">Meditation</h1>
        <p className="text-xs text-anth-500">Focus backgrounds · Healing frequencies · Pause loops</p>
      </div>

      {/* ── 4K Nature Loop Selector ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-3">4K Nature Pause Loops</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {NATURE_LOOPS.map((loop, i) => (
            <motion.button key={loop.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => { setMeditationBg(loop.key); setSelectedCustomVideoId(null); }}
              className={cn('glass rounded-2xl border p-4 flex items-center gap-3 transition-all hover:scale-[1.02]',
                loop.color, !useCustomVideo && meditationBg === loop.key ? 'ring-2 ring-mint-500/50' : ''
              )}>
              <span className="text-2xl">{loop.emoji}</span>
              <div className="text-left">
                <p className="text-xs font-medium text-forest-100">{loop.label}</p>
                <p className="text-[10px] text-anth-500 mt-0.5">{!useCustomVideo && meditationBg === loop.key ? t('✓ Aktiv') : t('Auswählen')}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Preview frame */}
        <div className="relative glass rounded-2xl border border-border overflow-hidden" style={{ paddingTop: '40%' }}>
          {useCustomVideo ? (
            <video
              src={selectedCustom!.dataUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay loop muted
            />
          ) : (
            <iframe src={selectedNature.src} className="absolute inset-0 w-full h-full" allow="autoplay" title={selectedNature.label} />
          )}
          <div className="absolute inset-0 flex items-end justify-between p-4 bg-gradient-to-t from-anth-950/80 via-transparent to-transparent pointer-events-none">
            <div>
              <p className="text-xs text-anth-400">{t('Wird angezeigt')}</p>
              <p className="text-sm font-semibold text-mint-light">
                {useCustomVideo ? `🎬 ${selectedCustom!.name}` : `${selectedNature.emoji} ${selectedNature.label}`}
              </p>
            </div>
          </div>
          <button onClick={() => setFullscreen(true)}
            className="absolute top-3 right-3 p-2 rounded-lg bg-anth-900/60 border border-anth-700/50 text-anth-300 hover:text-mint-light hover:bg-anth-800/60 transition-colors z-10 pointer-events-auto">
            <Expand size={14} />
          </button>
        </div>
      </section>

      {/* ── 3 Compact Music / Video Widgets ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-3">{t('Musik & Hintergrund')}</h2>
        <div className="flex gap-4 flex-wrap">
          {/* Widget 1: Pause Musik */}
          <TrackWidget
            tracks={breakTracks}
            selectedId={selectedBreakTrackId}
            onSelect={setSelectedBreakTrackId}
            onRemove={removeBreakTrack}
            onAdd={addBreakTrack}
            label={t('Pause-Musik')}
            emoji="🧘"
            accent="violet"
          />
          {/* Widget 2: Arbeits-Musik */}
          <TrackWidget
            tracks={workTracks}
            selectedId={selectedWorkTrackId}
            onSelect={setSelectedWorkTrackId}
            onRemove={removeWorkTrack}
            onAdd={addWorkTrack}
            label={t('Arbeits-Musik')}
            emoji="🎯"
            accent="mint"
          />
          {/* Widget 3: Custom Video */}
          <VideoWidget
            videos={customVideos}
            selectedId={selectedCustomVideoId}
            onSelect={setSelectedCustomVideoId}
            onRemove={removeCustomVideo}
            onAdd={addCustomVideo}
          />
        </div>
      </section>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-[200] bg-anth-950 flex items-center justify-center">
          {useCustomVideo ? (
            <video src={selectedCustom!.dataUrl} className="w-full h-full object-cover" autoPlay loop muted />
          ) : (
            <iframe src={selectedNature.src} className="w-full h-full" allow="autoplay" title={selectedNature.label} />
          )}
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-anth-900/80 border border-anth-700/60 text-anth-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
