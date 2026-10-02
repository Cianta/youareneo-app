"use client";
import {useState} from "react";
import {useAssistantPreferences} from "./Preferences";
import type {WeatherPlace} from "@/lib/assistant/ambience";
export function AppearanceSettings(){
  const {preferences:p,update}=useAssistantPreferences();const [query,setQuery]=useState(""),[places,setPlaces]=useState<WeatherPlace[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function search(){setBusy(true);setError("");setPlaces([]);try{const r=await fetch("/api/ambience?q="+encodeURIComponent(query.trim()));const d=await r.json();if(!r.ok)throw Error(d.error);setPlaces(d.places);if(!d.places.length)setError("Kein Ort gefunden. Bitte den Namen genauer eingeben.");}catch(e){setError(e instanceof Error?e.message:"Suche nicht verfügbar.");}finally{setBusy(false);}}
  return <section className="appearance-settings">
    <label>Dunkel · Hell<input aria-label="Helligkeit" type="range" min={0} max={100} step={.1} value={p.brightness} onChange={e=>update({brightness:Number(e.target.value)})}/></label>
    <label><input type="checkbox" checked={p.daylight} onChange={e=>update({daylight:e.target.checked})}/>Tageslicht im Inhaltsbereich</label><p>Morgen, Tag, Abend und Nacht folgen der Uhr dieses Geräts. Deine linke Navigation bleibt unverändert.</p>
    <label>Atmosphäre · kaum sichtbar bis sanft<input aria-label="Stärke der Atmosphäre" type="range" min={0} max={15} step={1} value={p.atmosphere} onChange={e=>update({atmosphere:Number(e.target.value)})}/></label>
    <label><input type="checkbox" checked={p.weatherEnabled} onChange={e=>update({weatherEnabled:e.target.checked})}/>Wetter am gewählten Ort einblenden</label>
    {p.weatherEnabled&&<><p>Ein Nebelschleier oder einzelne Regentropfen am rechten Rand. Die Ortsuche und ungefähre Ortskoordinaten gehen über unseren Server an <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> (CC BY 4.0). Kein GPS-Zugriff.</p><label>Ort<input maxLength={80} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zum Beispiel Wien"/></label><button disabled={busy||query.trim().length<2} onClick={()=>void search()}>{busy?"Suche …":"Ort suchen"}</button>{places.map(place=><button key={place.name+place.latitude} onClick={()=>{update({weatherPlace:place});setPlaces([]);setError("");}}>{place.name}</button>)}{p.weatherPlace&&<p>Gewählt: {p.weatherPlace.name} <button onClick={()=>update({weatherPlace:null})}>Ort entfernen</button></p>}{error&&<p role="status">{error}</p>}</>}
    <p>Bewegung folgt „Sanfte Bewegung“ unter Begleiter & Stimme und der Einstellung „Bewegung reduzieren“ deines Geräts.</p>
  </section>;
}
