"use client";
import { useId, useState } from "react";
import Image from "next/image";
import { GLYPHS, SIGNS } from "@/lib/workspace/cosmos";
import type { BirthResult } from "@/lib/workspace/birth";
import { HumanDesignDetails } from "./HumanDesignDetails";

const systems=[
  {id:"western",label:"Westlich",image:"soul",intro:"Der tropische Tierkreis betrachtet Sonne, Mond und Aszendent als unterschiedliche Perspektiven: Ausdruck, inneres Erleben und Auftreten."},
  {id:"vedic",label:"Vedisch",image:"vedic",intro:"Der siderische Tierkreis mit Lahiri-Näherung verschiebt die Zeichen gegenüber dem westlichen System. Diese Ansicht zeigt Sonnen- und Mondzeichen, keine vollständige Jyotish-Analyse."},
  {id:"chinese",label:"Chinesisch",image:"chinese",intro:"Das Tierzeichen des chinesischen Mondjahres wird zusammen mit dem Jahreselement betrachtet. Es lädt dazu ein, über eigene Rhythmen und Qualitäten nachzudenken."},
  {id:"maya",label:"Maya · Kin",image:"maya",intro:"Dein Kin verbindet ein Siegel mit einem galaktischen Ton. Hier wird der moderne Dreamspell-Kalender verwendet; er unterscheidet sich vom traditionellen Maya-Tzolk’in."},
  {id:"celtic",label:"Keltisch",image:"celtic",intro:"Der moderne Baumkalender verbindet Geburtszeiten mit Baumqualitäten. Nutze deinen Baum als Bild für Wachstum, Verwurzelung und Wandel."},
  {id:"hd",label:"Human Design",image:"human-design",intro:"Typ, Profil und Autorität sowie definierte Zentren, Kanäle und Toraktivierungen aus deinen Geburtsdaten. Eine bekannte Geburtszeit ist dafür erforderlich."},
] as const;

function ZodiacWheel({longitude,sign}:{longitude:number;sign:BirthResult["western"]}) {
  const id=useId(), at=(degrees:number,r:number)=>{const angle=(degrees-90)*Math.PI/180;return [180+Math.cos(angle)*r,180+Math.sin(angle)*r];};
  const [sunX,sunY]=at(longitude,111);
  return <svg className="birth-zodiac-wheel" viewBox="0 0 360 360" role="img" aria-label={`Tierkreis mit berechneter Sonne in ${sign.name}`}>
    <defs><radialGradient id={id}><stop stopColor="#997cae" stopOpacity=".2"/><stop offset="1" stopColor="#b58d63" stopOpacity=".04"/></radialGradient></defs>
    <circle cx="180" cy="180" r="159" fill={`url(#${id})`} stroke="currentColor" strokeOpacity=".2"/><circle cx="180" cy="180" r="121" fill="none" stroke="currentColor" strokeOpacity=".16"/>
    {SIGNS.map((name,i)=>{const [x,y]=at(i*30,158),[gx,gy]=at(i*30+15,139);return <g key={name}><line x1="180" y1="180" x2={x} y2={y} stroke="currentColor" strokeOpacity=".1"/><text x={gx} y={gy+6} textAnchor="middle" fontSize="23" fill="currentColor"><title>{name}</title>{GLYPHS[i]}</text></g>;})}
    <circle cx="180" cy="180" r="83" fill="var(--theme-surface)"/><text x="180" y="165" textAnchor="middle" fontSize="44" fill="var(--theme-purple)">{sign.icon}</text><text x="180" y="197" textAnchor="middle" fontSize="18" fill="currentColor">{sign.name}</text><text x="180" y="217" textAnchor="middle" fontSize="10" fill="currentColor">SONNE · {sign.element.toUpperCase()}</text>
    <circle cx={sunX} cy={sunY} r="9" fill="#bb975f"/><circle cx={sunX} cy={sunY} r="15" fill="none" stroke="#bb975f" strokeOpacity=".4"/>
  </svg>;
}

export function BirthChartPanels({result}:{result:BirthResult}) {
  const [index,setIndex]=useState(0), prefix=useId(), system=systems[index];
  const main=index===0?result.western:index===1?result.vedic:index===2?result.chinese:index===3?result.maya:index===4?result.celtic:null;
  return <section className="birth-chart-results" aria-label="Dein berechnetes Chart">
    <header className="birth-results-heading"><div><span className="w-eyebrow">DEIN CHART · SECHS PERSPEKTIVEN</span><h2>Entdecke deinen Blueprint.</h2></div><small>Auf diesem Gerät gespeichert</small></header>
    <div className="birth-system-tabs" role="tablist" aria-label="Chart-Systeme">{systems.map((s,i)=><button key={s.id} role="tab" id={prefix+"-"+s.id} aria-controls={prefix+"-panel"} aria-selected={index===i} tabIndex={index===i?0:-1} onClick={()=>setIndex(i)} onKeyDown={e=>{const next=e.key==="ArrowRight"?(i+1)%systems.length:e.key==="ArrowLeft"?(i+systems.length-1)%systems.length:e.key==="Home"?0:e.key==="End"?systems.length-1:-1;if(next>=0){e.preventDefault();setIndex(next);document.getElementById(prefix+"-"+systems[next].id)?.focus();}}}>{s.label}</button>)}</div>
    <div id={prefix+"-panel"} role="tabpanel" aria-labelledby={prefix+"-"+system.id} className="birth-system-panel">
      <div className="birth-system-art"><Image key={system.id} src={`/images/world-${system.image}-v2.webp`} alt="" fill sizes="(max-width:767px) 100vw, 80vw" quality={60}/><div><span>{system.label}</span><h2>{main?.name??result.hd?.type??"Dein Energiebild"}</h2></div><small>Dekorative Bildwelt</small></div>
      <div className="birth-system-content">
        {index<2?<ZodiacWheel longitude={index===0?result.meta.sunLonDeg:result.meta.sunLonVedic} sign={index===0?result.western:result.vedic}/>:index!==5?<div className="birth-symbol-medallion" aria-label={main?.name}>{index===2?<span>{result.chinese.icon}</span>:index===3?<><small>KIN {result.maya.kin}</small><div className="kin-tone" aria-label={`Galaktischer Ton ${result.maya.tone}`}><span>{Array.from({length:result.maya.tone%5},(_,i)=><i key={i}/>)}</span>{Array.from({length:Math.floor(result.maya.tone/5)},(_,i)=><b key={i}/>)}</div><strong>{result.maya.name}</strong></>:<><span>♧</span><strong>{result.celtic.name}</strong></>}</div>:null}
        <div className="birth-explanation"><span className="w-eyebrow">DEINE PERSPEKTIVE</span><h3>{system.label}</h3><p>{system.intro}</p>
          {index<2?<dl><div><dt>Sonne</dt><dd>{main?.name}</dd></div><div><dt>Mond</dt><dd>{index===0?result.moon.name:result.vedicMoon.name}</dd></div><div><dt>Aszendent</dt><dd>{(index===0?result.ascendant:result.ascendantVedic)?.name??"Geburtszeit und Koordinaten ergänzen"}</dd></div><div><dt>Sonnenposition</dt><dd>{(index===0?result.meta.sunLonDeg:result.meta.sunLonVedic).toFixed(2)}°</dd></div></dl>:index===2?<dl><div><dt>Tierzeichen</dt><dd>{result.chinese.name}</dd></div><div><dt>Jahreselement</dt><dd>{result.chinese.element}</dd></div></dl>:index===3?<dl><div><dt>Kin</dt><dd>{result.maya.kin}</dd></div><div><dt>Galaktischer Ton</dt><dd>{result.maya.tone}</dd></div><div><dt>Siegel</dt><dd>{result.maya.name}</dd></div></dl>:index===4?<p>Welche Eigenschaften dieses Baumes möchtest du in deinem Alltag wachsen lassen?</p>:<p>{result.hd?`Profil ${result.hd.profile} · Autorität ${result.hd.authority}`:"Ergänze deine Geburtszeit im Profil und berechne erneut. Dein gespeichertes Profil bleibt erhalten."}</p>}
          <details><summary>Ein Impuls für dein Journal</summary><p>Was erkennst du wieder? Welche Beschreibung passt gerade nicht? Halte beides als eigene Beobachtung fest und wähle daraus einen kleinen nächsten Schritt.</p><a href="/dashboard/goals">Journal öffnen ↗</a></details>
        </div>
      </div>
      {index===5&&result.hd&&<HumanDesignDetails hd={result.hd}/>}
    </div>
    <p className="w-storage-note">Symbolische Selbstreflexion. Sonnenzeichen ohne Uhrzeit als Mittagsnäherung. Das Tierkreisbild zeigt die berechnete Sonne und Zeichen; keine vollständige Häuser- oder Aspektanalyse. Human Design: rechnerische Näherung mit free-human-design 1.0.1; Grenzfälle mit einem Referenzchart vergleichen. Dreamspell ist nicht der traditionelle Maya-Tzolk’in.</p>
  </section>;
}
