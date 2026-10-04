"use client";
import Image from 'next/image';
const art:Record<string,{image:string;second?:string;kind:string;caption:string}>={
 '/dashboard/kanban':{image:'courtyard',kind:'slim',caption:'Aus Gedanken werden Schritte.'},
 '/dashboard/goals':{image:'journal',kind:'journal',caption:'Ein guter Ort für deine Möglichkeiten.'},
 '/dashboard/calendar':{image:'journal',kind:'panorama',caption:'Zeit für das, was dir wichtig ist.'},
 '/gehirn':{image:'brain',kind:'compact',caption:'Gedanken finden ihren Zusammenhang.'},
 '/dashboard/eden':{image:'labor',second:'courtyard',kind:'duo',caption:'Ideen dürfen wachsen.'},
 '/dashboard/labor':{image:'labor',kind:'compact',caption:'Dein Atelier für Mensch, Natur und Technik.'},
 '/dashboard/communication/email':{image:'courtyard',kind:'panorama',caption:'Im Austausch bleiben.'},
 '/dashboard/communication/meeting':{image:'courtyard',kind:'slim',caption:'Raum für echte Begegnung.'},
 '/dashboard/communication/phone':{image:'courtyard',kind:'slim',caption:'Ein guter Draht zu deinen Menschen.'},
 '/dashboard/contacts':{image:'courtyard',second:'journal',kind:'duo',caption:'Beziehungen sind ein lebendiges Netz.'},
 '/dashboard/soul':{image:'brain',kind:'journal',caption:'Die Sterne als Einladung zum Entdecken.'},
 '/dashboard/meditation':{image:'courtyard',kind:'journal',caption:'Ein Atemzug. Ein neuer Anfang.'},
 '/dashboard/apps':{image:'labor',second:'courtyard',kind:'duo',caption:'Deine kleinen Welten, ein gemeinsamer Raum.'},
 '/notiz':{image:'journal',kind:'slim',caption:'Ein Gedanke kann etwas verändern.'},
};
/** Existing overview temple and project observatory remain the heroes of their pages. */
export function WorkspaceArtwork({path}:{path:string}){const a=art[path];if(!a)return null;return <div className={'workspace-artwork artwork-'+a.kind} aria-hidden="true"><div><Image src={'/images/world-'+a.image+'-v1.webp'} alt="" fill sizes={a.second?'(max-width: 767px) 50vw, 40vw':'(max-width: 767px) 100vw, 80vw'} quality={60} preload/></div>{a.second&&<div><Image src={'/images/world-'+a.second+'-v1.webp'} alt="" fill sizes="(max-width: 767px) 50vw, 40vw" quality={60} loading="eager"/></div>}<span>{a.caption}</span></div>;}
