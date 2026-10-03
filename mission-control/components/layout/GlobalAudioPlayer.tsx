"use client";
import {useEffect,useRef} from 'react';
import {useFocusStore,useGlobalAudioStore,useUIExtStore} from '@/lib/store';
import {useFocusMedia} from '@/lib/workspace/focus-media';
import {DEFAULT_WORK,DEFAULT_REST} from '@/lib/workspace/media';
import {useAssistantPreferences} from '@/components/assistant/Preferences';
/** One audio element across all routes. Playback progress stays out of persisted media. */
export function GlobalAudioPlayer(){
 const ref=useRef<HTMLAudioElement>(null),f=useFocusStore(),a=useGlobalAudioStore(),ui=useUIExtStore(),{preferences:p}=useAssistantPreferences(),seek=useFocusMedia(s=>s.seek);
 const work=ui.workTracks.find(t=>t.id===ui.selectedWorkTrackId)?.dataUrl||a.workSoundUrl||DEFAULT_WORK.dataUrl;
 const rest=ui.breakTracks.find(t=>t.id===ui.selectedBreakTrackId)?.dataUrl||a.breakSoundUrl||DEFAULT_REST.dataUrl;
 const url=f.pomodoroMode==='focus'?work:rest,muted=!p.sound||(f.pomodoroMode==='focus'?a.workMuted:a.breakMuted);
 useEffect(()=>{const el=ref.current;if(!el)return;const absolute=new URL(url,location.href).href;if(el.src!==absolute){el.src=url;useFocusMedia.getState().set({current:0,duration:0});}el.muted=muted;el.volume=a.volume*p.volume;if(f.pomodoroRunning){a.setActiveMode(f.pomodoroMode==='focus'?'work':'break');void el.play().then(()=>useFocusMedia.getState().set({blocked:false})).catch(()=>useFocusMedia.getState().set({blocked:true}));}else{el.pause();a.setActiveMode('off');}},[url,muted,a.volume,p.volume,f.pomodoroRunning,f.pomodoroMode,a.setActiveMode]);
 useEffect(()=>{const play=()=>{if(!useFocusStore.getState().pomodoroRunning)return;const el=ref.current;if(el)void el.play().then(()=>useFocusMedia.getState().set({blocked:false})).catch(()=>useFocusMedia.getState().set({blocked:true}));};window.addEventListener('neo-focus-play',play);return()=>window.removeEventListener('neo-focus-play',play);},[]);
 useEffect(()=>{const el=ref.current;if(seek===null||!el)return;if(Number.isFinite(el.duration))el.currentTime=Math.max(0,Math.min(el.duration,seek));useFocusMedia.getState().set({seek:null});},[seek]);
 return <audio ref={ref} loop preload="none" data-focus-audio onTimeUpdate={e=>{const el=e.currentTarget;useFocusMedia.getState().set({current:el.currentTime,duration:Number.isFinite(el.duration)?el.duration:0});}} onLoadedMetadata={e=>useFocusMedia.getState().set({duration:Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0})}/>;
}
