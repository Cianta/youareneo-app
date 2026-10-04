"use client";
import { usePersonal, inWorkspace } from "@/lib/workspace/personal";
import { emptyDay, emptyMonth } from "@/lib/workspace/planner";

/** The overview edits the same monthly goals and daily priorities as the planner. */
export function JournalCompass({date,onAddGoal,onViewChange}:{date:string;onAddGoal:()=>void;onViewChange:(view:string)=>void}) {
  const s=usePersonal(), monthKey=`${s.workspace}:${date.slice(0,7)}`, dayKey=`${s.workspace}:${date}`;
  const month=s.months[monthKey]??emptyMonth(), day=s.days[dayKey]??emptyDay();
  const goals=s.goals.filter(g=>inWorkspace(g,s.workspace));
  const latest=s.notes.filter(n=>inWorkspace(n,s.workspace)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
  function goalSelection(index:number,value:string) {
    const state=usePersonal.getState(), current=state.months[monthKey]??emptyMonth();
    state.set({months:{...state.months,[monthKey]:{...current,goalIds:[0,1,2].map(i=>i===index?value:current.goalIds?.[i]??"")}}});
  }
  function priority(index:number,title:string) {
    const state=usePersonal.getState(), current=state.days[dayKey]??emptyDay(), top=[0,1,2].map(i=>i===index?title:current.top[i]??"");
    const items=state.planItems.filter(i=>i.date===date&&inWorkspace(i,state.workspace));
    state.set({days:{...state.days,[dayKey]:{...current,top}},planItems:state.planItems.map(item=>{
      if(items[index]?.id!==item.id||item.title===title)return item;
      return {...item,title,sourceKind:"free",sourceId:"priority:"+item.id};
    })});
  }
  const options=(chosen:string)=>goals.filter(g=>!g.done||g.id===chosen).map(g=><option key={g.id} value={g.id}>{g.title}{g.done?" · erreicht":""}</option>);
  return <aside className="journal-compass" aria-label="Dein Zielüberblick">
    <section className="compass-note"><header><span className="w-eyebrow">DEIN LETZTER GEDANKE</span><button onClick={()=>onViewChange("notepad")}>Alle Notizen ↗</button></header><h3>{latest?.title||"Platz für deine Hauptnotiz"}</h3><p>{latest?.body||"Ein Gedanke, der dich heute begleiten darf. Neue Notizen legst du im Notizbuch oder rechts bei den Notizzetteln an."}</p></section>
    <section className="compass-main"><span className="w-eyebrow">MEIN HAUPTZIEL · DIESER MONAT</span><select aria-label="Mein Hauptziel" value={month.mainGoalId??""} onChange={e=>s.set({months:{...s.months,[monthKey]:{...month,mainGoalId:e.target.value}}})}><option value="">Ein Ziel auswählen …</option>{options(month.mainGoalId??"")}</select><button onClick={onAddGoal}>+ Ziel anlegen</button></section>
    <section className="compass-month"><h3>Meine 3 Monatsziele</h3>{[0,1,2].map(i=><label key={i}><span>{i+1}</span><select aria-label={`Monatsziel ${i+1}`} value={month.goalIds?.[i]??""} onChange={e=>goalSelection(i,e.target.value)}><option value="">Ziel auswählen …</option>{options(month.goalIds?.[i]??"")}</select></label>)}</section>
    <section className="compass-day"><h3>Meine 3 Tagesziele</h3>{[0,1,2].map(i=><label key={i}><span>{i+1}</span><input aria-label={`Tagesziel ${i+1}`} maxLength={500} value={day.top[i]??""} onChange={e=>priority(i,e.target.value)} placeholder="Ein kleiner Schritt …"/></label>)}</section>
  </aside>;
}
