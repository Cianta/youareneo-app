"use client";
import {useEffect,useState,type CSSProperties} from "react";
import {useAssistantPreferences} from "@/components/assistant/Preferences";
import {dayPhase,weatherMood} from "@/lib/assistant/ambience";
export function Atmosphere(){
  const {preferences:p}=useAssistantPreferences(),[hour,setHour]=useState(12),[weather,setWeather]=useState<ReturnType<typeof weatherMood>>("clear"),[visible,setVisible]=useState(true);
  const lat=p.weatherPlace?.latitude,lon=p.weatherPlace?.longitude;
  useEffect(()=>{const tick=()=>setHour(new Date().getHours()+new Date().getMinutes()/60);tick();const timer=setInterval(tick,60000);const visibility=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",visibility);return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",visibility);};},[]);
  useEffect(()=>{setWeather("clear");if(!p.weatherEnabled||lat===undefined||lon===undefined||!visible)return;const abort=new AbortController();const refresh=async()=>{try{const r=await fetch(`/api/ambience?lat=${lat}&lon=${lon}`,{signal:abort.signal});if(!r.ok)throw Error();const d=await r.json();if(!abort.signal.aborted)setWeather(weatherMood(d.code));}catch{if(!abort.signal.aborted)setWeather("clear");}};void refresh();const timer=setInterval(refresh,1800000);return()=>{abort.abort();clearInterval(timer);};},[p.weatherEnabled,lat,lon,visible]);
  return <div aria-hidden="true" className="workspace-atmosphere" data-phase={p.daylight?dayPhase(hour):"off"} data-weather={weather} data-motion={p.companionMotion&&visible} style={{"--atmosphere":p.atmosphere/100} as CSSProperties}><div className="atmosphere-light"/><div className="atmosphere-fog"/>{weather==="rain"&&<div className="atmosphere-rain"><i/><i/><i/></div>}</div>;
}
