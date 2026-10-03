"use client";
import {useEffect,useRef,useState} from 'react';
import {useFocusStore,useUIExtStore} from '@/lib/store';
import {useAssistantPreferences} from '@/components/assistant/Preferences';
import {formatCountdown} from '@/lib/workspace/time';
import {Dialog} from './Dialog';
import {FocusControls} from './FocusControls';
const VIDEOS:Record<string,string>={forest:'xNN7iTA57jM',ocean:'bn9F19Hi1Lk',rain:'mPZkdNFkNps',cosmos:'Xb7-VxD4Uag',fire:'L_LUpnjgPso',morning:'V1RPi2MYptM'};
export function FocusRuntime(){
 const f=useFocusStore(),ui=useUIExtStore(),{preferences:p}=useAssistantPreferences(),[ended,setEnded]=useState(''),[videoEnabled,setVideoEnabled]=useState(true),overlay=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(!f.pomodoroRunning)return;const tick=()=>useFocusStore.getState().tickPomodoro();const id=setInterval(tick,1000);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',tick);};},[f.pomodoroRunning]);
 useEffect(()=>{if(f.pomodoroSeconds!==0||f.pomodoroRunning)return;const state=useFocusStore.getState();if(state.pomodoroSeconds!==0)return;
 if(p.sound)void import('@/lib/gong').then(m=>m.playGong());
 if(state.pomodoroMode==='focus'){state.advancePomodoro();useFocusStore.getState().togglePomodoro();useUIExtStore.getState().setPauseFullscreen(true);setEnded('');}
 else {const more=state.planQueue.length>0&&state.planIndex<state.planQueue.length-1;state.advancePomodoro();useUIExtStore.getState().setPauseFullscreen(false);if(more)useFocusStore.getState().togglePomodoro();else{setEnded(state.planQueue.length?'Dein Fokusplan ist abgeschlossen.':'Deine Pause ist vorbei. Bereit für den nächsten Schritt?');useFocusStore.setState({planQueue:[],planIndex:0});}}
 },[f.pomodoroSeconds,f.pomodoroRunning,f.pomodoroMode,p.sound]);
 useEffect(()=>{if(!ui.pauseFullscreen)setVideoEnabled(true);},[ui.pauseFullscreen]);
 useEffect(()=>{const dialog=overlay.current;if(!ui.pauseFullscreen||!dialog)return;const before=document.activeElement as HTMLElement|null;dialog.showModal();return()=>{dialog.close();if(before?.isConnected)before.focus();};},[ui.pauseFullscreen]);
 const custom=ui.customVideos.find(v=>v.id===ui.selectedCustomVideoId);
 return <>{ui.pauseFullscreen&&<dialog ref={overlay} className="focus-break-screen" aria-label="Bewusste Pause" onCancel={e=>{e.preventDefault();ui.setPauseFullscreen(false);}}><div className="focus-break-landscape"/>{custom?<video src={custom.dataUrl} autoPlay loop muted playsInline/>:videoEnabled?<iframe title="Beruhigungsvideo" src={`https://www.youtube-nocookie.com/embed/${VIDEOS[ui.meditationBg]??VIDEOS.forest}?autoplay=1&mute=1&loop=1&playlist=${VIDEOS[ui.meditationBg]??VIDEOS.forest}`} allow="autoplay; fullscreen" referrerPolicy="no-referrer"/>:null}<section><span className="w-eyebrow">10 MINUTEN FÜR DICH</span><h2>Durchatmen. Es darf leicht sein.</h2><strong className="focus-large-time">{formatCountdown(f.pomodoroSeconds)}</strong><p>Dein Plan wartet. Die Pause läuft {f.pomodoroRunning?'weiter':'gerade nicht'}.</p><div className="focus-actions"><button autoFocus className="w-btn" onClick={()=>ui.setPauseFullscreen(false)}>Zur App · Pause läuft weiter</button><button className="w-btn" onClick={()=>void overlay.current?.requestFullscreen?.().catch(()=>{})}>Bildschirmfüllend</button>{!custom&&!videoEnabled&&<button className="w-btn" onClick={()=>setVideoEnabled(true)}>Pausenvideo laden · YouTube</button>}</div><FocusControls/></section></dialog>}{ended&&<Dialog title="Dein Rhythmus" onClose={()=>setEnded('')}><p>{ended}</p><button className="w-btn" onClick={()=>{useFocusStore.getState().togglePomodoro();window.dispatchEvent(new Event('neo-focus-play'));setEnded('');}}>Neue Fokuszeit starten</button></Dialog>}</>;
}
