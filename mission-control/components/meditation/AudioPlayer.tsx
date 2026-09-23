'use client';
import { useT } from '@/lib/i18n';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Upload, Music2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AudioTrack {
  id: string;
  label: string;
  emoji: string;
  /** Either a full URL or a filename served via /api/meditation/stream/[filename] */
  src: string;
  streamLocal?: boolean; // true → use /api/meditation/stream/
}

interface AudioPlayerProps {
  tracks: AudioTrack[];
  compact?: boolean;       // compact = inline Notebook style
  autoPlay?: boolean;
  className?: string;
  onUpload?: (track: AudioTrack) => void;
}

function fmt(s: number) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function AudioPlayer({ tracks, compact = false, autoPlay = false, className, onUpload }: AudioPlayerProps) {
  const t = useT();
  const audioRef                  = useRef<HTMLAudioElement>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);
  const [trackIdx, setTrackIdx]   = useState(0);
  const [playing, setPlaying]     = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [volume, setVolume]       = useState(0.8);
  const [muted, setMuted]         = useState(false);
  const [localTracks, setLocal]   = useState<AudioTrack[]>(tracks);

  const allTracks = localTracks;
  const track     = allTracks[trackIdx];

  const resolvedSrc = track
    ? (track.streamLocal ? `/api/meditation/stream/${encodeURIComponent(track.src)}` : track.src)
    : '';

  // Sync audio element with player state
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted  = muted;
  }, [volume, muted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !resolvedSrc) return;
    el.src  = resolvedSrc;
    el.load();
    if (autoPlay || playing) { el.play().catch(()=>{}); setPlaying(true); }
    else { el.pause(); setPlaying(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx, resolvedSrc]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(()=>{}); setPlaying(true); }
  }, [playing]);

  const skip = (dir: 1 | -1) => {
    const next = (trackIdx + dir + allTracks.length) % allTracks.length;
    setTrackIdx(next);
    setPlaying(true);
  };

  const seek = (v: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = v;
    setCurrent(v);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url   = URL.createObjectURL(file);
    const newTrack: AudioTrack = {
      id:    `upload-${Date.now()}`,
      label: file.name.replace(/\.[^.]+$/, ''),
      emoji: '🎵',
      src:   url,
    };
    setLocal(prev => [...prev, newTrack]);
    setTrackIdx(allTracks.length); // will point to new track after state update
    onUpload?.(newTrack);
  };

  if (!track) return (
    <div className={cn('flex items-center justify-center text-anth-600 text-xs p-4', className)}>
      {t('Keine Tracks vorhanden.')}
    </div>
  );

  // ── COMPACT mode (Notebook / Pomodoro widget) ───────────────────────────────
  if (compact) {
    return (
      <div className={cn('rounded-xl border border-border/60 bg-anth-900/40 p-2.5 space-y-2', className)}>
        <audio ref={audioRef}
          onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => skip(1)}
        />

        {/* Track name */}
        <div className="flex items-center gap-2">
          <span className="text-base shrink-0">{track.emoji}</span>
          <p className="text-[10px] text-anth-300 truncate flex-1">{track.label}</p>
          <span className="text-[9px] text-anth-600 font-mono">{fmt(currentTime)}/{fmt(duration)}</span>
        </div>

        {/* Seekbar */}
        <input type="range" min={0} max={duration||1} step={0.5} value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="w-full h-1 accent-mint-500 cursor-pointer"/>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => skip(-1)} className="p-1 text-anth-500 hover:text-anth-300 transition-colors"><SkipBack size={11}/></button>
            <button onClick={togglePlay}
              className="w-7 h-7 rounded-full bg-mint-500/20 border border-mint-500/30 text-mint-400 flex items-center justify-center hover:bg-mint-500/30 transition-colors">
              {playing ? <Pause size={11}/> : <Play size={11}/>}
            </button>
            <button onClick={() => skip(1)} className="p-1 text-anth-500 hover:text-anth-300 transition-colors"><SkipForward size={11}/></button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMuted(v=>!v)} className="p-1 text-anth-600 hover:text-anth-400 transition-colors">
              {muted ? <VolumeX size={10}/> : <Volume2 size={10}/>}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
              className="w-14 h-1 accent-mint-500"/>
          </div>
        </div>
      </div>
    );
  }

  // ── FULL mode (Meditation page) ─────────────────────────────────────────────
  return (
    <div className={cn('glass rounded-2xl border border-border p-5 space-y-4', className)}>
      <audio ref={audioRef}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => skip(1)}
      />

      {/* Track list */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {allTracks.map((t, i) => (
          <button key={t.id} onClick={() => { setTrackIdx(i); setPlaying(true); }}
            className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all',
              i === trackIdx ? 'bg-mint-500/10 border border-mint-500/30' : 'hover:bg-forest-900/30 border border-transparent'
            )}>
            <span className="text-base shrink-0">{t.emoji}</span>
            <span className="text-xs text-anth-200 flex-1 truncate">{t.label}</span>
            {i === trackIdx && playing && (
              <span className="flex gap-0.5 shrink-0">
                {[1,2,3].map(b=>(
                  <span key={b} className="w-0.5 rounded-full bg-mint-500 animate-pulse"
                    style={{height:`${8+b*3}px`, animationDelay:`${b*0.1}s`}}/>
                ))}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current track display */}
      <div className="text-center py-2">
        <p className="text-3xl mb-2">{track.emoji}</p>
        <p className="text-sm font-semibold text-forest-100 truncate">{track.label}</p>
      </div>

      {/* Seekbar */}
      <div className="space-y-1">
        <input type="range" min={0} max={duration||1} step={0.5} value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="w-full h-1.5 accent-mint-500 cursor-pointer"/>
        <div className="flex justify-between text-[10px] text-anth-600 font-mono">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => skip(-1)} className="p-2 text-anth-500 hover:text-anth-300 transition-colors"><SkipBack size={18}/></button>
        <button onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-mint-500/20 border border-mint-500/40 text-mint-400 flex items-center justify-center hover:bg-mint-500/30 transition-all hover:scale-105">
          {playing ? <Pause size={20}/> : <Play size={20}/>}
        </button>
        <button onClick={() => skip(1)} className="p-2 text-anth-500 hover:text-anth-300 transition-colors"><SkipForward size={18}/></button>
      </div>

      {/* Volume + Upload */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMuted(v=>!v)} className="text-anth-500 hover:text-anth-300 transition-colors shrink-0">
          {muted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
        </button>
        <input type="range" min={0} max={1} step={0.05} value={muted?0:volume}
          onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
          className="flex-1 h-1 accent-mint-500"/>
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-forest-800/40 border border-forest-700/40 text-xs text-forest-300 hover:bg-forest-700/40 transition-colors shrink-0">
          <Upload size={11}/> Upload
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload}/>
      </div>
    </div>
  );
}
