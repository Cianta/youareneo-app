"use client";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { usePlanCandidates } from "./DayPlan";
import { usePersonal, inWorkspace } from "@/lib/workspace/personal";
import { materializeDayPlan } from "@/lib/workspace/day-plan";

export function PlanArrangement({date}:{date:string}) {
  const personal=usePersonal(), candidates=usePlanCandidates(date);
  const [kind,setKind]=useState("all"), [query,setQuery]=useState("");
  const items=materializeDayPlan(personal,date).filter(i=>i.date===date&&inWorkspace(i,personal.workspace));
  const matches=candidates.filter(c=>(kind==="all"||c.kind===kind)&&c.title.toLocaleLowerCase("de").includes(query.trim().toLocaleLowerCase("de")));
  return <section className="w-card plan-arrangement" aria-label="Deinen Tag zusammenstellen">
    <header><span className="w-eyebrow">AUS MÖGLICHKEITEN WIRD DEIN TAG</span><h2>Was bekommt heute Raum?</h2></header>
    <label className="studio-search"><Search size={14}/><input aria-label="Tagesplan-Auswahl durchsuchen" type="search" placeholder="Etwas für heute finden …" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="arrangement-filters" aria-label="Tagesplan-Auswahl filtern">{[["all","Alles"],["goal","Ziele"],["note","Notizen"],["event","Termine"],["project","Projekte"],["task","Aufgaben"]].map(([id,label])=><button key={id} aria-pressed={kind===id} onClick={()=>setKind(id)}>{label}</button>)}</div>
    <div className="arrangement-items">{matches.map(c=>{const added=items.some(i=>i.sourceKind===c.kind&&i.sourceId===c.sourceId);return <button key={c.id} disabled={added} onClick={()=>window.dispatchEvent(new CustomEvent("neo-plan-add",{detail:{kind:c.kind,sourceId:c.sourceId,date}}))}><span><small>{{goal:"Ziel",note:"Notiz",event:"Termin",project:"Projekt",task:"Aufgabe",free:"Schritt"}[c.kind]}</small><strong>{c.title}</strong></span><span>{c.minutes} min {added?"✓":<Plus size={14}/>}</span></button>;})}</div>
    {!matches.length&&<p className="w-muted">{candidates.length?"Kein Treffer. Wähle einen anderen Bereich oder Suchbegriff.":"Deine Ziele, Notizen und Termine erscheinen hier, sobald du sie anlegst."}</p>}
  </section>;
}
