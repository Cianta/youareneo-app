"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {Today} from "./Today";
import {useState} from "react";
import type {skyNow} from "@/lib/workspace/cosmos";
import {usePersonal} from "@/lib/workspace/personal";
const Cosmos = dynamic(() => import("./CosmosMenu").then(m => m.CosmosMenu), {ssr:false});
export function RestoredHome({sky}:{sky:ReturnType<typeof skyNow>}) {
 const p=usePersonal(); const [compass,setCompass]=useState(false);
 return <section className="restored-area"><Today/><div className="restored-compass"><div className="restored-sky"><span aria-label={sky.moon.name}>{sky.moon.icon} {sky.moon.name} · {sky.moon.illumination}%</span><button className="w-btn" onClick={()=>setCompass(true)}>Himmelskompass öffnen →</button>{compass && <Cosmos initialOpen onClose={()=>setCompass(false)}/>}</div><Link prefetch={false} className="w-btn" href="/dashboard/soul">Alle Astrologieansichten →</Link></div>
 <div className="w-card restored-entrypoints"><h2>Deine Räume sind wieder da.</h2><div className="s-actions">
 {[["/dashboard/eden","Ideenboard"],["/dashboard/goals","Tagesplan & Ziele"],["/dashboard/calendar","Kalender"],["/gehirn","Gehirn im Konto"],["/dashboard/second-brain","Lokales Wissensarchiv"],["/dashboard/contacts","Kontakte"],["/dashboard/tools","Werkzeuge & eigene Links"],["/dashboard/ninjas","Team & Flow"],["/dashboard/labor/uebersicht","Frühere Gesamtübersicht"]].map(([href,label])=><Link prefetch={false} className="w-btn" key={href} href={href}>{label}</Link>)}
 </div><p className="w-muted">Tagesplan, Ideenboard, Kalender, Geburtsprofile und Wissensarchiv verwenden die vorhandenen Daten auf diesem Gerät. Notizen und Gehirn sind mit deinem NEO-Konto verbunden.</p>
 <label className="restored-workspace">Lokaler Bereich <select value={p.workspace} onChange={e=>p.set({workspace:e.target.value as "private"|"organization"})}><option value="organization">Organisation</option><option value="private">Privat</option></select></label></div></section>;
}
