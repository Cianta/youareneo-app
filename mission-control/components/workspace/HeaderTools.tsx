"use client";
import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {Settings,Moon,Bookmark,CalendarDays} from 'lucide-react';
import {FocusMini,FocusControls} from './FocusControls';
import {Dialog} from './Dialog';
const FocusPicker=dynamic(()=>import('./DayPlan').then(m=>m.FocusPicker),{ssr:false});
const Appearance=dynamic(()=>import('@/components/assistant/AppearanceSettings').then(m=>m.AppearanceSettings),{ssr:false});
const Bookmarks=dynamic(()=>import('./Bookmarks').then(m=>m.Bookmarks),{ssr:false});
export function HeaderBookmarks(){const [open,setOpen]=useState(false);return <><button aria-label="Lesezeichen öffnen" title="Lesezeichen" onClick={()=>setOpen(true)}><Bookmark size={17}/></button>{open&&<Dialog title="Meine Lesezeichen" onClose={()=>setOpen(false)}><Bookmarks/></Dialog>}</>;}
export function HeaderFocus(){const [panel,setPanel]=useState<'timer'|'plan'|null>(null);useEffect(()=>{const show=()=>setPanel('timer');window.addEventListener('neo-focus-controls',show);return()=>window.removeEventListener('neo-focus-controls',show);},[]);return <><FocusMini/><button className="header-focus-label" onClick={()=>setPanel('plan')}>Fokus</button>{panel==='timer'&&<Dialog title="Fokustimer & Musik" onClose={()=>setPanel(null)}><FocusControls/><button className="w-btn" onClick={()=>setPanel('plan')}>Ziele & Projekte auswählen</button></Dialog>}{panel==='plan'&&<FocusPicker onClose={()=>setPanel(null)}/>}</>;}
export function HeaderSettings(){const [open,setOpen]=useState(false);return <><Link className="header-icon" href="/dashboard/settings" aria-label="Einstellungen" title="Einstellungen"><Settings size={18}/></Link><button aria-label="Darkmode & Darstellung öffnen" title="Darkmode & Darstellung" onClick={()=>setOpen(true)}><Moon size={18}/></button>{open&&<Dialog title="Hell, dunkel & Atmosphäre" onClose={()=>setOpen(false)}><Appearance/></Dialog>}</>;}

const CalendarWidget=dynamic(()=>import('./HeaderCalendar').then(m=>m.HeaderCalendarWidget),{ssr:false});
export function HeaderCalendar(){const [open,setOpen]=useState(false);const anchor=useRef<HTMLButtonElement>(null);return <><button ref={anchor} aria-label="Monatskalender öffnen" title="Monatskalender" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><CalendarDays size={17}/></button>{open&&<CalendarWidget anchor={anchor} onClose={()=>setOpen(false)}/>}</>;}
