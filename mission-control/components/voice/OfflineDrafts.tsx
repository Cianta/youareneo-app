"use client";
import {useEffect,useState} from "react";
const KEY="guiding-offline-drafts-v1";
type Draft={id:string;text:string;createdAt:string};
export function OfflineDrafts({onChoose,disabled}:{onChoose:(text:string)=>void;disabled:boolean}){
 const [drafts,setDrafts]=useState<Draft[]>([]),[error,setError]=useState("");
 useEffect(()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(d))setDrafts(d.filter(v=>v&&typeof v.id==="string"&&typeof v.text==="string"&&v.text.length<=20000&&typeof v.createdAt==="string"));}catch{setError("Lokale Offline-Entwürfe konnten nicht gelesen werden.");}},[]);
 if(!drafts.length&&!error)return null;
 return <details className="voice-card"><summary>{drafts.length} Offline-Entwürfe auf diesem Gerät</summary><p>Übernimm einen Text in die Eingabe und speichere ihn nach der Anmeldung. Die lokale Kopie bleibt erhalten.</p>{drafts.map(d=><div key={d.id}><p>{d.text.slice(0,100)}{d.text.length>100?" …":""}</p><button className="voice-secondary" disabled={disabled} onClick={()=>onChoose(d.text)}>In Eingabe übernehmen</button><button className="voice-secondary" onClick={()=>{try{const current=JSON.parse(localStorage.getItem(KEY)||"[]") as Draft[];const next=current.filter(v=>v.id!==d.id);localStorage.setItem(KEY,JSON.stringify(next));setDrafts(next);}catch{setError("Entwurf konnte nicht entfernt werden.");}}}>Lokale Kopie entfernen</button></div>)}{error&&<p role="alert">{error}</p>}</details>;
}
