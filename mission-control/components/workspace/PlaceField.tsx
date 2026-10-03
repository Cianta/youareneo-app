"use client";
import {useState} from 'react';
import type {Place} from '@/lib/workspace/personal';
export function PlaceField({value,onChange}:{value?:Place;onChange:(place:Place|undefined)=>void}){
 const [q,setQ]=useState(''),[results,setResults]=useState<Place[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="place-field"><label>Ort · optional<input placeholder="Zum Beispiel Wien" value={q} onChange={e=>setQ(e.target.value)} maxLength={80}/></label><button className="w-btn" type="button" disabled={busy||q.trim().length<2} onClick={async()=>{setBusy(true);setError('');try{const r=await fetch('/api/ambience?q='+encodeURIComponent(q));const d=await r.json();if(!r.ok)throw Error(d.error);setResults(d.places);if(!d.places.length)setError('Kein Ort gefunden.');}catch{setError('Ortsuche gerade nicht verfügbar.');}finally{setBusy(false);}}}>{busy?'Sucht …':'Ort suchen'}</button>{results.map(p=><button type="button" className="w-btn" key={p.name} onClick={()=>{onChange(p);setResults([]);}}>{p.name}</button>)}{value&&<p>{value.name} <button type="button" className="w-icon" onClick={()=>onChange(undefined)} aria-label="Ort entfernen">×</button></p>}{error&&<p role="status">{error}</p>}<small>Ortsuche über Open-Meteo; kein GPS.</small></section>;
}
