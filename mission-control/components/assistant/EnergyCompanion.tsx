"use client";
import {useEffect,useId,useRef,useState,type CSSProperties} from "react";
import {usePersonal} from "@/lib/workspace/personal";
import {useBoard} from "@/lib/workspace/useBoard";
import {isDone} from "@/lib/workspace/board";
import {companionMood} from "@/lib/assistant/companion";
import {useAssistantPreferences} from "./Preferences";
import type {AvatarState} from "@/components/chat/AssistantAvatar";

export function EnergyCompanion({state,level,onSettings}:{state:AvatarState;level:number;onSettings:()=>void}) {
  const {preferences}=useAssistantPreferences(), id=useId().replace(/:/g,"");
  const goals=usePersonal(s=>s.goals), {board,ready}=useBoard();
  const [minutes,setMinutes]=useState(0), [completed,setCompleted]=useState(0), [unread,setUnread]=useState<number|null>(null);
  const baseline=useRef<Set<string>|null>(null), awarded=useRef(new Set<string>());
  useEffect(()=>{if(!ready)return;const done=new Set([...goals.filter(g=>g.done).map(g=>`goal:${g.id}`),...board.projects.flatMap(p=>p.columns.filter(c=>isDone(c.label)).flatMap(c=>c.cardIds.map(id=>`card:${id}`)))]);
    if(baseline.current){for(const id of done)if(!baseline.current.has(id)&&!awarded.current.has(id))awarded.current.add(id);setCompleted(awarded.current.size);}baseline.current=done;
  },[goals,board,ready]);
  useEffect(()=>{let lastInput=Date.now(),seconds=0;const input=()=>{lastInput=Date.now();};let expiry:ReturnType<typeof setTimeout>;const mail=(e:Event)=>{const n=(e as CustomEvent).detail?.unread;setUnread(Number.isSafeInteger(n)&&n>=0&&n<=100000?n:null);clearTimeout(expiry);expiry=setTimeout(()=>setUnread(null),120000);};
    const timer=setInterval(()=>{if(!document.hidden&&Date.now()-lastInput<90000){seconds+=15;setMinutes(Math.floor(seconds/60));}},15000);
    window.addEventListener("keydown",input);window.addEventListener("pointerdown",input);window.addEventListener("neo-mail-activity",mail);
    return()=>{clearInterval(timer);clearTimeout(expiry);window.removeEventListener("keydown",input);window.removeEventListener("pointerdown",input);window.removeEventListener("neo-mail-activity",mail);};
  },[]);
  const mood=companionMood({completed,activeMinutes:minutes,unreadMail:unread,adaptive:preferences.adaptiveMood});
  if(preferences.companion==="off")return null;
  return <section className="energy-companion" aria-label="Trinity Begleiter" data-form={preferences.companion} data-color={preferences.energyColor} data-mood={mood.mood} data-state={state} data-motion={preferences.companionMotion} style={{"--energy-level":Math.max(0,Math.min(1,level||0))} as CSSProperties}>
    <div className="energy-stage" aria-hidden="true"><svg viewBox="0 0 300 320" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <defs><radialGradient id={`${id}-halo`}><stop stopColor="currentColor" stopOpacity=".18"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs>
      <circle cx="150" cy="154" r="138" fill={`url(#${id}-halo)`} stroke="none"/>
      <g className="energy-orbits" strokeWidth=".55" opacity=".4"><ellipse cx="150" cy="180" rx="116" ry="43" transform="rotate(-28 150 180)"/><ellipse cx="150" cy="180" rx="116" ry="43" transform="rotate(28 150 180)"/><circle cx="150" cy="151" r="117" strokeDasharray="1 12"/></g>
      <g className="energy-being" strokeWidth="1.4">
        {preferences.companion==="dragon"?<>
          <path className="energy-wing left" d="M141 174C106 94 70 85 26 71L48 119 26 153 63 158 76 195 108 177 127 208M141 174L48 119M141 174L63 158M141 174L76 195"/>
          <path className="energy-wing right" d="M161 174C195 94 231 85 275 71L253 119 275 153 238 158 225 195 193 177 174 208M161 174L253 119M161 174L238 158M161 174L225 195"/>
          <path d="M138 111L128 78 144 91 154 87 169 72 166 101 183 116 171 121 167 138 154 149C187 171 188 202 167 224C148 245 177 273 209 249C223 238 236 238 248 244C213 239 225 275 191 284C143 296 116 258 137 227C151 204 127 179 130 160L143 138 130 126 128 116Z"/>
          <path d="M146 156C170 172 172 200 154 222C129 255 157 282 192 271M138 174L162 178M140 190L166 194M143 206L159 210M139 231L156 240M140 250L155 254M157 272L162 262M177 277L178 268" opacity=".65"/>
          <path d="M161 108l7 4-8 2M139 109l-5-2M150 129l10 1M140 188L116 218 125 222 133 216M175 187L187 220 178 223 176 215M150 91L151 66 156 89"/>
          <circle cx="163" cy="112" r="1.6" fill="currentColor" stroke="none"/>
        </>:preferences.companion==="tree"?<>
          <path d="M148 249C155 205 140 173 151 136M152 203L115 163 103 117M148 179L185 151 199 111M151 156L131 116 147 89M154 224L189 194 218 185M140 219L99 190 79 155M149 244L116 269 97 277M151 246L180 269 202 275M148 254L146 283M169 149L191 134M117 165L86 144"/>
          <path d="M102 130C66 130 56 94 77 75C94 47 121 61 132 74C148 43 186 52 190 80C223 64 250 94 228 120C252 141 229 171 206 162C194 195 158 178 153 157C124 183 82 164 102 130Z"/>
          <path d="M97 101Q77 83 77 75M120 98Q113 80 102 70M152 120Q175 102 180 72M190 152Q215 149 228 120M81 110L104 117M158 143L214 100" opacity=".55"/>
        </>:<>
          <path d="M126 87C117 61 176 55 180 85L172 120C161 146 142 146 131 120ZM137 143C119 147 95 165 85 190L66 226 91 237 112 200M166 143C190 147 203 170 214 190L235 226 208 236 188 200M116 174C104 198 120 219 137 224L111 253 64 260 85 277 149 264 213 277 238 260 189 253 164 225C185 217 198 197 182 174M129 186Q151 201 172 184M136 221L164 225M136 91L143 94M164 91L158 94M145 112L157 112"/>
          <path d="M150 72V129M127 83Q150 96 178 81M131 112Q152 103 174 111M117 159Q150 174 184 158M137 249L149 237 164 248M86 274L116 261M207 273L189 260" opacity=".55"/>
        </>}
        <path className="energy-breath" d="M128 301h9l6-5 8 8 8-7 6 4h10" strokeWidth="1"/>
      </g>
      <g className="energy-particles" fill="currentColor" stroke="none"><circle cx="61" cy="59" r="1.8"/><circle cx="238" cy="47" r="1.2"/><circle cx="54" cy="234" r="2"/><circle cx="251" cy="209" r="1.4"/><circle cx="183" cy="36" r="1.5"/></g>
    </svg></div>
    <p className="energy-caption">{state==="listening"?"Ich höre dir zu":state==="thinking"?"Ich verbinde deine Gedanken":state==="speaking"?"Ich bin bei dir":mood.label}</p>
    <button className="energy-customize" title={mood.reason} onClick={onSettings}>Begleiter gestalten</button>
    <span className="energy-reason">{mood.reason}</span>
  </section>;
}
