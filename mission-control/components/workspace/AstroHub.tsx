'use client';
import {useState} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {BirthProfile} from './BirthProfile';
import {CosmosMenu} from './CosmosMenu';
const Legacy=dynamic(()=>import('./AstroLegacyPanel').then(m=>m.AstroLegacyPanel));
const People=dynamic(()=>import('@/components/ninjas/NinjasView').then(m=>m.NinjasView));
const Team=dynamic(()=>import('./TeamFlow').then(m=>m.TeamFlow));
const tabs=[['profile','Mein Geburtsprofil'],['sky','Tagesenergien & Kalender'],['people','Menschen & Team']] as const;
export function AstroHub(){const [tab,setTab]=useState<typeof tabs[number][0]>('profile');return <div className="w-page chart-page"><div className="w-page-heading"><div><span className="w-eyebrow">ASTROLOGIE & HUMAN DESIGN</span><h1>Dein Chart.</h1><p>Geburtsprofil, Human Design, Tagesenergien und gemeinsame Perspektiven.</p></div></div><p className="w-muted">Frühere Profile bleiben in den vorhandenen lokalen Speichern dieses Browsers. Symbolische Systeme zur Reflexion.</p><div className="astro-tabs" role="tablist" aria-label="Astrologie-Bereiche">{tabs.map(([id,label])=><button key={id} id={'astro-tab-'+id} role="tab" aria-selected={tab===id} tabIndex={tab===id?0:-1} onKeyDown={e=>{const index=tabs.findIndex(t=>t[0]===id);const next=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next!==null){e.preventDefault();setTab(tabs[next][0]);document.getElementById('astro-tab-'+tabs[next][0])?.focus()}}} aria-controls="astro-panel" className="w-btn" onClick={()=>setTab(id)}>{label}</button>)}</div><section id="astro-panel" role="tabpanel" aria-labelledby={'astro-tab-'+tab}>{tab==='profile'?<BirthProfile/>:tab==='sky'?<><CosmosMenu/><Legacy/><div className="restored-entrypoints"><Link className="w-btn" href="/dashboard/matrix/space-weather">Weltraumwetter</Link><Link className="w-btn" href="/dashboard/matrix">Matrix</Link></div></>:<><Team/><People/></>}</section></div>}
