import ICAL from 'ical.js';
import {localDate} from './time';
import type {CalendarEvent} from '@/lib/store';
export const MAX_ICAL_BYTES=2_000_000;
export function calendarFeedUrl(input:string){
 try{const u=new URL(input.replace(/^webcal:/,'https:'));if(u.protocol!=='https:'||u.port&&u.port!=='443'||u.username||u.password||u.hash)return null;
 const google=['calendar.google.com','www.google.com'].includes(u.hostname)&&u.pathname.startsWith('/calendar/ical/');
 const apple=/^p\d{2,3}-caldav\.icloud\.com$/.test(u.hostname)&&u.pathname.startsWith('/published/');
 return google||apple?u.href:null;}catch{return null;}
}
/** Expand a bounded calendar window, including exceptions and all-day spans. */
export function importCalendar(text:string,calendarId:string,year:number):{events:CalendarEvent[];warnings:string[]}{
 if(new TextEncoder().encode(text).length>MAX_ICAL_BYTES)throw Error('Die Kalenderdatei ist größer als 2 MB.');
 if(!Number.isInteger(year)||year<1900||year>2200)throw Error('Ungültiges Kalenderjahr.');
 const root=new ICAL.Component(ICAL.parse(text)),warnings:string[]=[];
 if(root.name!=='vcalendar')throw Error('Bitte eine gültige ICS-Kalenderdatei wählen.');
 ICAL.TimezoneService.reset();for(const tz of root.getAllSubcomponents('vtimezone')){const id=String(tz.getFirstPropertyValue('tzid'));ICAL.TimezoneService.register(new ICAL.Timezone({component:tz,tzid:id}),id);}
 const components=root.getAllSubcomponents('vevent');if(components.length>5000)throw Error('Zu viele Termine. Bitte einen kleineren Kalenderexport wählen.');
 const events:CalendarEvent[]=[],from=new Date(year,0,1).getTime(),until=new Date(year+1,0,1).getTime();let steps=0;
 const originals=components.filter(c=>!c.hasProperty('recurrence-id'));
 for(const component of originals){
  if(component.getFirstPropertyValue('status')==='CANCELLED')continue;
  const e=new ICAL.Event(component);if(!e.startDate)continue;
  const tzid=component.getFirstProperty('dtstart')?.getParameter('tzid');
  if(tzid&&!ICAL.TimezoneService.has(String(tzid))){warnings.push('Ein Termin verwendet eine fehlende Zeitzonendefinition ('+String(tzid).slice(0,80)+') und wurde ausgelassen.');continue;}
  for(const ex of components.filter(c=>c.hasProperty('recurrence-id')&&c.getFirstPropertyValue('uid')===e.uid))e.relateException(new ICAL.Event(ex));
  const rule=component.getFirstPropertyValue('rrule') as {freq?:string}|null;if(rule&&['SECONDLY','MINUTELY','HOURLY'].includes(rule.freq??'')){warnings.push('Sehr häufige Wiederholungen wurden ausgelassen.');continue;}
  const add=(start:ICAL.Time,end:ICAL.Time,item:ICAL.Event,occurrence:string)=>{
   if(item.component.getFirstPropertyValue('status')==='CANCELLED')return;
   const a=start.toJSDate(),b=end.toJSDate();if(a.getTime()>=until||b.getTime()<from)return;
   let cursor=new Date(a);cursor.setHours(12,0,0,0);let days=0;
   while(days++<366&&events.length<5000){const key=start.isDate?`${start.year}-${String(start.month).padStart(2,'0')}-${String(start.day).padStart(2,'0')}`:localDate(cursor);const day=new Date(key+'T12:00:00');day.setDate(day.getDate()+days-1);const date=localDate(day);if(new Date(date+'T00:00:00').getTime()>=Math.max(a.getTime()+1,b.getTime())&&days>1)break;
    if(day.getTime()>=from&&day.getTime()<until){const first=days===1,last=localDate(b)===date;events.push({id:calendarId+':'+encodeURIComponent(e.uid||String(originals.indexOf(component)))+':'+occurrence+':'+date,calendarId,title:(item.summary||'Ohne Titel').slice(0,200),date,startTime:start.isDate?undefined:first?a.toTimeString().slice(0,5):'00:00',endTime:end.isDate?undefined:last?b.toTimeString().slice(0,5):'23:59',notes:[item.description,item.location].filter(Boolean).join('\n').slice(0,20000),imported:true,importedUid:e.uid});}
    if(b.getTime()<=a.getTime()||localDate(b)===date)break;
   }
  };
  if(e.isRecurring()){const iterator=e.iterator();let next;while((next=iterator.next())){if(++steps>20000){warnings.push('Wiederholungsgrenze erreicht; nicht alle Termine importiert.');break;}if(next.toJSDate().getTime()>=until)break;const d=e.getOccurrenceDetails(next);add(d.startDate,d.endDate,d.item,next.toString());}}else add(e.startDate,e.endDate,e,e.startDate.toString());
  if(steps>20000||events.length>=5000)break;
 }
 if(events.length>=5000)warnings.push('Maximal 5000 Termine je Import.');
 return {events:[...new Map(events.map(e=>[e.id,e])).values()],warnings:[...new Set(warnings)]};
}
