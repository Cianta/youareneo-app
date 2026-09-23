'use client';
import { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalAudioStore, useFocusStore } from '@/lib/store';
import type { AudioMode } from '@/lib/store';

/**
 * GlobalAudioPlayer — lives in DashboardLayout so it persists across route changes.
 * Plays "Arbeits-Sound" during focus blocks and "Pausen-Sound" during break blocks.
 * Audio state (URL, mute, volume) survives navigation and F5 via Zustand persist.
 */
export function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    workSoundUrl, breakSoundUrl, workMuted, breakMuted,
    activeMode, volume, toggleWorkMute, toggleBreakMute, setActiveMode,
  } = useGlobalAudioStore();
  const { pomodoroMode, pomodoroRunning } = useFocusStore();

  // Sync audio mode with pomodoro state
  useEffect(() => {
    if (!pomodoroRunning) {
      setActiveMode('off');
      return;
    }
    if (pomodoroMode === 'focus') setActiveMode('work');
    else if (pomodoroMode === 'break') setActiveMode('break');
    else setActiveMode('off');
  }, [pomodoroMode, pomodoroRunning, setActiveMode]);

  // Manage audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = activeMode === 'work' ? workSoundUrl : activeMode === 'break' ? breakSoundUrl : '';
    const isMuted = activeMode === 'work' ? workMuted : activeMode === 'break' ? breakMuted : true;

    if (!url || activeMode === 'off') {
      audio.pause();
      audio.src = '';
      return;
    }

    if (audio.src !== url) {
      audio.src = url;
      audio.loop = true;
      audio.volume = volume;
    }
    audio.muted = isMuted;
    audio.volume = volume;
    audio.play().catch(() => {}); // browsers block autoplay until user gesture
  }, [activeMode, workSoundUrl, breakSoundUrl, workMuted, breakMuted, volume]);

  const isMuted = activeMode === 'work' ? workMuted : breakMuted;
  const toggleMute = activeMode === 'work' ? toggleWorkMute : toggleBreakMute;
  const hasSound = activeMode === 'work' ? !!workSoundUrl : !!breakSoundUrl;

  if (activeMode === 'off' || !hasSound) return null;

  return (
    <>
      <audio ref={audioRef} />
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl glass border border-border shadow-lg">
        <Music size={12} className="text-forest-400" />
        <span className="text-[10px] text-anth-400">
          {activeMode === 'work' ? 'Arbeits-Sound' : 'Pausen-Sound'}
        </span>
        <button
          onClick={toggleMute}
          className={cn(
            'p-1.5 rounded-lg border transition-colors',
            isMuted
              ? 'border-anth-700 text-anth-500 hover:text-anth-300'
              : 'border-forest-700/50 text-forest-400 bg-forest-900/30 hover:bg-forest-900/50'
          )}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
      </div>
    </>
  );
}
