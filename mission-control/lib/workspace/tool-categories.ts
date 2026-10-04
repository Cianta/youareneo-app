import {laboratory,type Destination} from './navigation';
export const TOOL_CATEGORIES=[{id:'audio',name:'Audio & Klang',color:'#527f9b',icon:'♫'},{id:'video',name:'Video & Film',color:'#8c689c',icon:'▷'},{id:'images',name:'Bilder & Design',color:'#ac7189',icon:'◇'},{id:'documents',name:'Dokumente & Wissen',color:'#6d8890',icon:'▤'},{id:'crm',name:'CRM & Menschen',color:'#ac8c56',icon:'◎'},{id:'communication',name:'Kommunikation',color:'#548b80',icon:'↗'},{id:'marketing',name:'Marketing & Veröffentlichung',color:'#a47a6a',icon:'✧'},{id:'data',name:'Daten & Automationen',color:'#647eb0',icon:'⌘'},{id:'self',name:'Leben & Entdecken',color:'#799266',icon:'☽'},{id:'system',name:'Guiding Space',color:'#7f6b98',icon:'⊙'}];
export function toolCategory(p:Destination){const h=p.href;if(h.includes('/media/audio'))return 'audio';if(h.includes('/media/video'))return 'video';if(/\/media\/(design|boards|higgsfield|magicfit)/.test(h))return 'images';if(/documents|opennotebook|world\/(gamma|miro|padlet|presenti|wakelet)|notiz/.test(h))return 'documents';if(/mitglieder|contacts|ninjas/.test(h))return 'crm';if(h.includes('/communication'))return 'communication';if(/seo|social|shopify/.test(h))return 'marketing';if(/data|matrix|agents|universe/.test(h))return 'data';if(/soul|vision\/hero|meditation|world\/arche/.test(h))return 'self';return 'system';}
export const toolCatalog=[...new Map(laboratory.map(p=>[p.href,p])).values(),{id:'outreach-blog',label:'Blogs & Inhalte',href:'/dashboard/social/marketing?collection=blogs',group:'Labor',keywords:'blog artikel texte content'},{id:'outreach-website',label:'Website & Publishing',href:'/dashboard/social/marketing?collection=websites',group:'Labor',keywords:'website web publishing homepage'}];
export const TOOL_GROUPS = [
  {id:'media',name:'Medien',color:'#7b6c9d',description:'Klang, Film, Bilder und Geschichten'},
  {id:'people',name:'Kunden · CRM · Kommunikation',color:'#497e87',description:'Menschen verbinden und Beziehungen pflegen'},
  {id:'outreach',name:'Outreach',color:'#a57383',description:'Social Media, Blogs, Website und Shop'},
] as const;
/** Cross-membership is intentional: one destination, several useful contexts. */
export function inToolGroup(p:Destination,group:string){
 const category=toolCategory(p),h=p.href;
 if(group==='media')return ['audio','video','images','documents'].includes(category)||/riverside/.test(h);
 if(group==='people')return ['crm','communication'].includes(category)||/seo\/apollo|social\/channels/.test(h);
 if(group==='outreach')return ['marketing','images','video'].includes(category)||/\/ghl|world\/(gamma|presenti)|media\/documents/.test(h);
 return false;
}

const BRANDS:Record<string,string>={elevenlabs:'elevenlabs',telegram:'telegram',whatsapp:'whatsapp',miro:'miro','gai-studio':'google',gemma:'google',shopify:'shopify',n8n:'n8n',immich:'immich',kchat:'infomaniak',kmeet:'infomaniak','cloud-drives':'googledrive'};
export function toolLogo(href:string){return BRANDS[href.split('/').pop()??''];}
