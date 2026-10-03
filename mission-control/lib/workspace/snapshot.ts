import {parseBoard} from "./board";
export const SNAPSHOT_KEYS = ["trinity-personal-v1","trinity-kanban-v2","trinity-notebook","trinity-birth-profiles-v1","trinity-temporal-v2"] as const;
export type Snapshot = {version:1;stores:Partial<Record<typeof SNAPSHOT_KEYS[number],string>>};
export const SNAPSHOT_LABELS:Record<typeof SNAPSHOT_KEYS[number],string> = {
  "trinity-personal-v1":"Tagesplanung, Ziele, persönliche Notizen & Verknüpfungen",
  "trinity-kanban-v2":"Aufgaben & Projektboards",
  "trinity-notebook":"Tagesnotizbuch",
  "trinity-birth-profiles-v1":"Eigene Geburtsprofile",
  "trinity-temporal-v2":"Kalender & Termine · ohne Abonnementlinks",
};
export const MAX_SNAPSHOT_BYTES = 2_000_000;
export function snapshotOf(value:unknown):Snapshot {
  if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Ungültige Sicherung.");
  const v=value as {version?:number;stores?:Record<string,unknown>};
  if(v.version!==1||!v.stores||typeof v.stores!=="object"||Array.isArray(v.stores))throw Error("Unbekanntes Sicherungsformat.");
  const stores:Snapshot["stores"]={};
  for(const [key,raw] of Object.entries(v.stores)){
    if(!SNAPSHOT_KEYS.includes(key as typeof SNAPSHOT_KEYS[number])||typeof raw!=="string")throw Error("Diese Sicherung enthält einen nicht unterstützten Speicher.");
    const data=JSON.parse(raw);
    if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Beschädigter Arbeitsbereich.");
    if(key==="trinity-kanban-v2")parseBoard(raw);
    else if(!data.state||typeof data.state!=="object"||Array.isArray(data.state))throw Error("Beschädigter lokaler Speicher.");
    if(key!=="trinity-kanban-v2") {
      if(data.version!==0)throw Error("Unbekannte Speicherversion.");
      const schema:Record<string,string> = key==="trinity-personal-v1" ? {workspace:"string",aiContext:"boolean",linkCategories:"object",reasons:"object",planItems:"array",years:"object",days:"object",weeks:"object",months:"object",bookmarks:"array",customLinks:"array",hiddenLinks:"array",goals:"array",notes:"array",relations:"array",navOpen:"object",cosmosVisible:"boolean",mission:"string",values:"string",astroPin:"string",motion:"boolean"} : key==="trinity-notebook" ? {entries:"array",isOpen:"boolean"} : key==="trinity-temporal-v2" ? {isOpen:"boolean",synergy:"boolean",calendars:"array",events:"array",quickInput:"string",quickAlarm:"boolean"} : {profiles:"object"};
      for(const [field,v] of Object.entries(data.state)){
        const type=Array.isArray(v)?"array":v===null?"null":typeof v;
        if(!schema[field]||schema[field]!==type)throw Error("Beschädigter oder unbekannter Inhalt im Arbeitsbereich.");
      }
      if(key==="trinity-notebook"&&!Array.isArray(data.state.entries)||key==="trinity-birth-profiles-v1"&&!data.state.profiles)throw Error("Sicherung unvollständig.");
    }
    if(key==='trinity-temporal-v2'){
      if(!Array.isArray(data.state.calendars)||!Array.isArray(data.state.events))throw Error('Kalendersicherung unvollständig.');
      if(data.state.calendars.some((c:any)=>!c||typeof c.id!=='string'||typeof c.name!=='string'||c.url!==''||!/^#[0-9a-f]{6}$/i.test(c.color)||typeof c.visible!=='boolean'))throw Error('Ungültige Kalendersicherung oder enthaltene Abonnementlinks.');
      if(data.state.events.some((e:any)=>!e||typeof e.id!=='string'||typeof e.title!=='string'||typeof e.calendarId!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)))throw Error('Ungültige Termine in der Sicherung.');
    }
    // Never accept prototype mutation keys or credential fields from imports.
    const reject=(x:unknown,depth=0)=>{if(depth>30)throw Error("Sicherung zu tief verschachtelt.");if(x&&typeof x==="object")for(const [k,v] of Object.entries(x)){if(["__proto__","constructor","prototype"].includes(k)||/^(access_token|refresh_token|password|api_?key|secret|authorization)$/i.test(k))throw Error("Zugangsdaten gehören nicht in eine Arbeitsbereich-Sicherung.");if(["href","url","src"].includes(k.toLowerCase())&&typeof v==="string"&&/^(javascript|vbscript):/i.test(v.replace(/[\u0000-\u0020]/g,"")))throw Error("Unsicherer Link in der Sicherung.");reject(v,depth+1);}};reject(data);
    stores[key as keyof Snapshot["stores"]]=raw;
  }
  const result:Snapshot={version:1,stores};
  if(new TextEncoder().encode(JSON.stringify(result)).length>MAX_SNAPSHOT_BYTES)throw Error("Die Sicherung ist größer als 2 MB. Wähle weniger Bereiche.");
  return result;
}
export function collectSnapshot(storage:Pick<Storage,"getItem">,keys:readonly string[]):Snapshot {
  const stores:Record<string,string>={};
  for(const key of keys){if(!SNAPSHOT_KEYS.includes(key as typeof SNAPSHOT_KEYS[number]))throw Error("Unbekannter Bereich.");const raw=storage.getItem(key);if(raw!==null){if(key==='trinity-temporal-v2'){const d=JSON.parse(raw);d.state.calendars=d.state.calendars.map((c:any)=>({...c,url:''}));stores[key]=JSON.stringify(d);}else stores[key]=raw;}}
  return snapshotOf({version:1,stores});
}
/** Keep a rollback copy before replacing anything. Failure restores every touched key. */
export function restoreSnapshot(storage:Pick<Storage,"getItem"|"setItem"|"removeItem">,snapshot:Snapshot) {
  const clean=snapshotOf(snapshot), backup:Record<string,string|null>={};
  for(const key of Object.keys(clean.stores))backup[key]=storage.getItem(key);
  storage.setItem("guiding-workspace-before-restore",JSON.stringify({createdAt:new Date().toISOString(),stores:backup}));
  try {for(const [key,value] of Object.entries(clean.stores))storage.setItem(key,value!);}
  catch(e){for(const [key,value] of Object.entries(backup)){if(value===null)storage.removeItem(key);else storage.setItem(key,value);}throw e;}
}
