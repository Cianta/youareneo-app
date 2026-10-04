"use client";
import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import Link from 'next/link';
import {ChevronLeft,ChevronRight,X} from 'lucide-react';
import {useTemporalStore} from '@/lib/store';
import {monthCells} from '@/lib/workspace/day-plan';
import {shiftMonth} from '@/lib/workspace/planner';
import {localDate} from '@/lib/workspace/time';
export function HeaderCalendarWidget({anchor,onClose}:{anchor:RefObject<HTMLButtonElement>;onClose:()=>void}){
 const s=useTemporalStore(),[date,setDate]=useState(localDate()),ref=useRef<HTMLDialogElement>(null);
 const events=s.events.filter(e=>s.calendars.some(c=>c.id===e.calendarId&&c.visible));
 const color=(id:string)=>s.calendars.find(c=>c.id===id)?.color;
 useLayoutEffect(()=>{const d=ref.current!;const place=()=>{const r=anchor.current?.getBoundingClientRect();const width=Math.min(530,Math.max(370,innerWidth/3),innerWidth-24);d.style.width=width+'px';d.style.left=Math.max(12,Math.min((r?.right??innerWidth)-width,innerWidth-width-12))+'px';d.style.top=Math.min(r?.bottom??60,innerHeight-180)+8+'px';d.style.maxHeight=Math.max(100,innerHeight-(r?.bottom??60)-24)+'px';};place();d.showModal();window.addEventListener('resize',place);return()=>{window.removeEventListener('resize',place);d.close();anchor.current?.focus();};},[anchor]);
 useEffect(()=>{const nav=()=>onClose();window.addEventListener('popstate',nav);return()=>window.removeEventListener('popstate',nav);},[onClose]);
 const all=s.calendars.length>0&&s.calendars.every(c=>c.visible);
 return <dialog ref={ref} className="header-calendar" aria-label="Monatskalender" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}>
 <header><span className="w-eyebrow">DEIN MONAT · ÜBERALL DABEI</span><button className="w-icon" aria-label="Kalender schließen" onClick={onClose}><X size={17}/></button></header>
 <div className="header-month-nav"><button className="w-icon" aria-label="Vorheriger Widget-Monat" onClick={()=>setDate(shiftMonth(date,-1))}><ChevronLeft size={17}/></button><h2>{new Date(date+'T12:00:00').toLocaleDateString('de-AT',{month:'long',year:'numeric'})}</h2><button className="w-icon" aria-label="Nächster Widget-Monat" onClick={()=>setDate(shiftMonth(date,1))}><ChevronRight size={17}/></button></div>
 <div className="header-calendar-sources"><button className="w-btn" onClick={()=>useTemporalStore.setState(st=>({calendars:st.calendars.map(c=>({...c,visible:!all}))}))}>{all?'Alle aus':'Alle an'}</button>{s.calendars.map(c=><label key={c.id} style={{'--calendar-color':c.color} as React.CSSProperties}><input type="checkbox" checked={c.visible} onChange={()=>s.toggleCalendar(c.id)}/><i/>{c.name}</label>)}</div>
 <div className="header-month-days">{['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=><small key={d}>{d}</small>)}{monthCells(date).map(day=>{const list=events.filter(e=>e.date===day);return <button key={day} aria-label={new Date(day+'T12:00:00').toLocaleDateString('de-AT',{day:'numeric',month:'long'})+': '+list.length+' Termine'} aria-pressed={date===day} data-outside={!day.startsWith(date.slice(0,7))} data-today={day===localDate()} onClick={()=>setDate(day)}><strong>{Number(day.slice(8))}</strong>{list.slice(0,3).map(e=><span key={e.id} title={e.title} style={{borderColor:color(e.calendarId)}}>{e.title}</span>)}{list.length>3&&<small>+{list.length-3}</small>}</button>;})}</div>
 <section className="header-calendar-day"><h3>{new Date(date+'T12:00:00').toLocaleDateString('de-AT',{weekday:'long',day:'numeric',month:'long'})}</h3>{events.filter(e=>e.date===date).map(e=><Link key={e.id} href={'/dashboard/calendar?date='+date} onClick={onClose} style={{borderLeftColor:color(e.calendarId)}}><time>{e.startTime||'Ganztägig'}</time>{e.title}</Link>)}{!events.some(e=>e.date===date)&&<p>Raum für Neues. Keine sichtbaren Termine.</p>}</section>
 <footer><button className="w-btn" onClick={()=>setDate(localDate())}>Heute</button><Link className="w-btn" href={'/dashboard/calendar?date='+date} onClick={onClose}>Kalender & Tagesplan öffnen →</Link></footer>
 </dialog>;
}
