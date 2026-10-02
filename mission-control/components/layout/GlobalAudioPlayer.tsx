'use client';
import { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalAudioStore, useFocusStore, useUIExtStore } from '@/lib/store';
import {useAssistantPreferences} from '@/components/assistant/Preferences';

/**
 * GlobalAudioPlayer — lives in DashboardLayout so it persists across route changes.
 * Plays "Arbeits-Sound" during focus blocks and "Pausen-Sound" during break blocks.
 * Audio state (URL, mute, volume) survives navigation and F5 via Zustand persist.
 */
export function GlobalAudioPlayer() {
  const {preferences,update} = useAssistantPreferences();
  const ui = useUIExtStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    workSoundUrl, breakSoundUrl, workMuted, breakMuted,
    activeMode, volume, toggleWorkMute, toggleBreakMute, setActiveMode,
  } = useGlobalAudioStore();
  const { pomodoroMode, pomodoroRunning } = useFocusStore();

  const workUrl=ui.workTracks.find(t=>t.id===ui.selectedWorkTrackId)?.dataUrl || workSoundUrl;
  const breakUrl=ui.breakTracks.find(t=>t.id===ui.selectedBreakTrackId)?.dataUrl || breakSoundUrl;

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

    const url = activeMode === 'work' ? workUrl : activeMode === 'break' ? breakUrl : '';
    const isMuted = !preferences.sound || (activeMode === 'work' ? workMuted : activeMode === 'break' ? breakMuted : true);

    if (!url || activeMode === 'off') {
      audio.pause();
      audio.src = '';
      return;
    }

    if (audio.src !== url) {
      audio.src = url;
      audio.loop = true;
      audio.volume = volume * preferences.volume;
    }
    audio.muted = isMuted;
    audio.volume = volume * preferences.volume;
    audio.play().catch(() => {}); // browsers block autoplay until user gesture
  }, [activeMode, workUrl, breakUrl, workMuted, breakMuted, volume, preferences.sound, preferences.volume]);

  const isMuted = !preferences.sound || (activeMode === 'work' ? workMuted : breakMuted);
  const toggleMute = activeMode === 'work' ? toggleWorkMute : toggleBreakMute;
  const hasSound = activeMode === 'work' ? !!workUrl : !!breakUrl;

  if (activeMode === 'off' || !hasSound) return null;

  return (
    <>
      <audio ref={audioRef} />
      <div className="focus-audio-status fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl glass border border-border shadow-lg">
        <Music size={12} className="text-forest-400" />
        <span className="text-[10px] text-anth-400">
          {activeMode === 'work' ? 'Arbeits-Sound' : 'Pausen-Sound'}
        </span>
        <button
          aria-label={isMuted ? "Fokusmusik einschalten" : "Fokusmusik ausschalten"}
          onClick={()=>{if(!preferences.sound){update({sound:true});if(activeMode === "work" ? workMuted : breakMuted)toggleMute();}else toggleMute();}}
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
