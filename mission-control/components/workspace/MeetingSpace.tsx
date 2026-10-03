"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Video,Phone,Copy,ExternalLink,Trash2} from "lucide-react";
import {usePersonal} from "@/lib/workspace/personal";

// Room URLs stay in the existing personal shortcuts store; nothing joins a call automatically.
function roomUrl(raw:string){
  try{const url=new URL(raw.trim());return url.protocol==="https:"&&!url.username&&!url.password?url.href:null;}
  catch{return null;}
}
export function MeetingSpace(){
  const links=usePersonal(s=>s.customLinks),[ready,setReady]=useState(false),[status,setStatus]=useState("");
  const [phone,setPhone]=useState("");
  useEffect(()=>setReady(true),[]);
  const rooms=ready?links.filter(l=>l.category==="meeting"&&roomUrl(l.href)):[];
  const number=phone.replace(/[^+0-9]/g,"");
  return <div className="w-page meeting-space">
    <span className="w-eyebrow">KOMMUNIKATION · ZUSAMMENKOMMEN</span>
    <h1>Dein Meeting-Raum.</h1>
    <p>Ein Ort für Gespräche. Speichere deinen eigenen Raum und öffne ihn, wenn du bereit bist.</p>
    <div className="meeting-rooms">
      {rooms.map(room=><article className="w-card" key={room.id}>
        <Video size={24} aria-hidden="true"/><h2>{room.label}</h2>
        <p className="w-muted">{new URL(room.href).hostname}</p>
        <div className="meeting-actions">
          <a className="w-btn" href={roomUrl(room.href)!} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Raum öffnen</a>
          <button className="w-btn" onClick={()=>void navigator.clipboard.writeText(room.href).then(()=>setStatus("Einladungslink kopiert.")).catch(()=>setStatus("Kopieren ist nicht verfügbar. Wähle den Link unten aus."))}><Copy size={15}/> Link kopieren</button>
          <button className="w-btn" aria-label={`${room.label} entfernen`} onClick={()=>{const current=usePersonal.getState();current.set({customLinks:current.customLinks.filter(l=>l.id!==room.id)});setStatus("Raumlink entfernt. Der Raum beim Anbieter bleibt bestehen.");}}><Trash2 size={15}/></button>
        </div>
        <details><summary>Einladungslink anzeigen</summary><input className="w-input" aria-label={`${room.label}: Einladungslink`} readOnly value={room.href} onFocus={e=>e.target.select()}/></details>
      </article>)}
      {!rooms.length&&<article className="w-card"><Video size={24} aria-hidden="true"/><h2>Dein Raum wartet.</h2><p>Füge den Einladungslink deines Meeting-Anbieters hinzu. Raum, Mikrofon und Kamera öffnest du anschließend bewusst.</p></article>}
    </div>
    <form className="w-card s-form" onSubmit={e=>{
      e.preventDefault();const form=e.currentTarget,values=new FormData(form),href=roomUrl(String(values.get("url")||""));
      if(!href){setStatus("Bitte einen vollständigen HTTPS-Raumlink ohne Zugangsdaten eingeben.");return;}
      const current=usePersonal.getState();
      if(current.customLinks.some(l=>l.category==="meeting"&&l.href===href)){setStatus("Dieser Raum ist schon gespeichert.");return;}
      current.set({customLinks:[...current.customLinks,{id:crypto.randomUUID(),label:String(values.get("name")||"").trim()||"Mein Meeting-Raum",href,category:"meeting",icon:"video"}]});
      form.reset();setStatus("Dein Raumlink ist gespeichert.");
    }}>
      <h2>Eigener Raum</h2>
      <label>Name<input className="w-input" name="name" placeholder="Mein Meeting-Raum" maxLength={100}/></label>
      <label>Einladungslink<input className="w-input" name="url" type="url" placeholder="https://…" required maxLength={2000}/></label>
      <button className="w-btn" type="submit">Raumlink speichern</button>
      <small className="w-muted">Auf diesem Gerät gespeichert; Teil deiner freiwilligen Arbeitsbereich-Sicherung. Die Videokonferenz läuft beim gewählten Anbieter.</small>
    </form>
    <div className="meeting-rooms">
      <section className="w-card"><Phone size={24} aria-hidden="true"/><h2>Telefon</h2>
        <label>Telefonnummer<input className="w-input" type="tel" autoComplete="tel" value={phone} maxLength={40} onChange={e=>setPhone(e.target.value)} placeholder="+43 …"/></label>
        {/^\+?\d{3,20}$/.test(number)?<a className="w-btn" href={`tel:${number}`}><Phone size={15}/> Telefonprogramm öffnen</a>:<p className="w-muted">Nummer eingeben oder einen Kontakt auswählen.</p>}
        <Link className="w-btn" href="/dashboard/contacts">Kontakte CRM öffnen</Link>
        <small className="w-muted">Anrufe starten über das Telefonprogramm deines Geräts.</small>
      </section>
      <section className="w-card"><h2>Deine bisherigen Gesprächsräume</h2><p>Die vorhandenen Anbieter bleiben erreichbar.</p>
        <div className="meeting-actions">{[["kMeet","kmeet"],["GoBrunch","gobrunch"],["Riverside","riverside"],["Termin buchen","lunacal"]].map(([name,route])=><Link prefetch={false} className="w-btn" key={route} href={`/dashboard/mitglieder/${route}`}>{name}</Link>)}</div>
      </section>
    </div>
    {status&&<p role="status">{status}</p>}
  </div>;
}
