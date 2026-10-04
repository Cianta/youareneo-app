"use client";
import Image from 'next/image';
import './refinement.css';
const art:Record<string,{image:string;second?:string;kind:string;caption:string}>={
 '/dashboard/kanban':{image:'kanban-v2',kind:'slim',caption:'Aus Gedanken werden Schritte.'},
 '/dashboard/goals':{image:'journal',kind:'journal',caption:'Ein guter Ort für deine Möglichkeiten.'},
 '/dashboard/calendar':{image:'calendar-v2',kind:'compact',caption:'Zeit für das, was dir wichtig ist.'},
 '/gehirn':{image:'brain',kind:'compact',caption:'Gedanken finden ihren Zusammenhang.'},
 '/dashboard/eden':{image:'ideas-v2',kind:'panorama',caption:'Ideen dürfen wachsen.'},
 '/dashboard/labor':{image:'labor',kind:'compact',caption:'Dein Atelier für Mensch, Natur und Technik.'},
 '/dashboard/communication/email':{image:'mail-v2',kind:'panorama',caption:'Im Austausch bleiben.'},
 '/dashboard/communication/meeting':{image:'meeting-v2',kind:'slim',caption:'Raum für echte Begegnung.'},
 '/dashboard/communication/phone':{image:'phone-v2',kind:'slim',caption:'Ein guter Draht zu deinen Menschen.'},
 '/dashboard/contacts':{image:'contacts-v2',kind:'panorama',caption:'Beziehungen sind ein lebendiges Netz.'},
 '/dashboard/soul':{image:'soul-v2',kind:'slim',caption:'Die Sterne als Einladung zum Entdecken.'},
 '/dashboard/meditation':{image:'courtyard',kind:'journal',caption:'Ein Atemzug. Ein neuer Anfang.'},
 '/dashboard/apps':{image:'apps-v2',kind:'panorama',caption:'Deine kleinen Welten, ein gemeinsamer Raum.'},
 '/notiz':{image:'notes-v2',kind:'slim',caption:'Ein Gedanke kann etwas verändern.'},
};
/** Existing overview temple and project observatory remain the heroes of their pages. */
export function WorkspaceArtwork({path}:{path:string}){const a=art[path];if(!a)return null;const source=(name:string)=>'/images/world-'+name+(name.endsWith('-v2')?'':'-v1')+'.webp';return <div className={'workspace-artwork artwork-'+a.kind} aria-hidden="true"><div><Image src={source(a.image)} alt="" fill sizes={a.second?'(max-width: 767px) 50vw, 40vw':'(max-width: 767px) 100vw, 80vw'} quality={60} preload fetchPriority="high"/></div>{a.second&&<div><Image src={source(a.second)} alt="" fill sizes="(max-width: 767px) 50vw, 40vw" quality={60} loading="eager"/></div>}<span>{a.caption}</span></div>;}
