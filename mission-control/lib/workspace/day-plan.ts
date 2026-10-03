import {emptyDay} from './planner';
import type {PlanItem,PersonalState} from './personal';
export function focusEstimate(items:{minutes:number}[]) {
  const minutes=items.reduce((sum,item)=>sum+Math.max(1,Math.min(1440,Math.round(item.minutes)||45)),0);
  const units=items.reduce((sum,item)=>sum+Math.ceil(Math.max(1,Math.min(1440,Math.round(item.minutes)||45))/45),0);
  return {minutes,units,breaks:Math.max(0,units-1),scheduled:units*45+Math.max(0,units-1)*10};
}
export function focusBlocks(items:{id:string;title:string;minutes:number}[]) {
  return items.flatMap(item=>Array.from({length:Math.ceil(Math.max(1,Math.min(1440,item.minutes||45))/45)},(_,i)=>({id:item.id+':'+i,title:item.title,part:i+1})));
}
/** The old three priorities remain in the same PlannerDay document. */
export function syncPriorities(state:Pick<PersonalState,'days'|'workspace'>,items:PlanItem[],date:string) {
  const key=state.workspace+':'+date,day=state.days[key]??emptyDay();
  const chosen=items.filter(i=>i.date===date&&(i.workspace===state.workspace||i.workspace==='both')).slice(0,3);
  return {...state.days,[key]:{...day,top:[0,1,2].map(i=>chosen[i]?.title??''),completed:[0,1,2].map(i=>chosen[i]?.done??false)}};
}
export function monthCells(date:string) {
  const d=new Date(date+'T12:00:00');d.setDate(1);d.setDate(1-((d.getDay()+6)%7));
  return Array.from({length:42},(_,i)=>{const n=new Date(d);n.setDate(d.getDate()+i);return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;});
}
export function minutesBetween(start?:string,end?:string){if(!start||!end)return 45;const n=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));return Math.max(1,n(end)-n(start));}

/** Bring existing priorities into the shared plan without losing their completion state. */
export function materializeDayPlan(state:Pick<PersonalState,'days'|'workspace'|'planItems'>,date:string):PlanItem[] {
  const existing=state.planItems??[];
  if(existing.some(i=>i.date===date&&(i.workspace===state.workspace||i.workspace==='both')))return existing;
  const day=state.days[state.workspace+':'+date];
  return [...existing,...(day?.top??[]).flatMap((title,index)=>title.trim()?[{id:`legacy:${state.workspace}:${date}:${index}`,sourceKind:'free' as const,sourceId:'legacy:'+index,title,date,workspace:state.workspace,minutes:45,done:day?.completed?.[index]??false}]:[])];
}
