"use client";
import {useState} from 'react';
import {Plus,X,ImagePlus,Link2} from 'lucide-react';
import {safeLink,type Attachment} from '@/lib/workspace/personal';
import {youtubeId} from '@/lib/workspace/media';
export function Attachments({items=[],onChange}:{items?:Attachment[];onChange:(items:Attachment[])=>void}) {
 const [url,setUrl]=useState(''),[kind,setKind]=useState<Attachment['kind']>('link'),[error,setError]=useState('');
 return <section className="journal-attachments"><div className="attachment-list">{items.map(a=><div key={a.id}>
 {a.kind==='image'&&<img src={a.url} alt={a.name} loading="lazy" referrerPolicy="no-referrer"/>}
 {a.kind==='embed'&&youtubeId(a.url)?<details><summary>Video einbetten</summary><p>Beim Öffnen wird YouTube geladen.</p><iframe title={a.name} src={'https://www.youtube-nocookie.com/embed/'+youtubeId(a.url)} loading="lazy" allow="fullscreen" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation"/></details>:<a href={safeLink(a.url)??'#'} target="_blank" rel="noopener noreferrer">{a.name||a.url}</a>}
 <button type="button" className="w-icon" aria-label="Anhang entfernen" onClick={()=>onChange(items.filter(i=>i.id!==a.id))}><X size={14}/></button></div>)}</div>
 <div className="attachment-add"><select aria-label="Art des Anhangs" value={kind} onChange={e=>setKind(e.target.value as Attachment['kind'])}><option value="link">Link</option><option value="image">Bildlink</option><option value="embed">Video / Einbettung</option></select><input aria-label="Anhang-URL" placeholder="https://…" value={url} onChange={e=>setUrl(e.target.value)} maxLength={2048}/><button type="button" className="w-icon" aria-label="Anhang hinzufügen" onClick={()=>{const clean=safeLink(url);if(!clean||!clean.startsWith('https://'))return setError('Bitte einen HTTPS-Link eingeben.');onChange([...items,{id:crypto.randomUUID(),kind,url:clean,name:new URL(clean).hostname}]);setUrl('');setError('');}}><Plus size={16}/></button></div>
 <label className="attachment-upload"><ImagePlus size={15}/> Bild vom Gerät <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>500_000)return setError('Bitte ein Bild unter 500 KB wählen.');if(!/^image\/(jpeg|png|webp)$/.test(file.type))return setError('Bitte JPEG, PNG oder WebP wählen.');const reader=new FileReader();reader.onload=()=>onChange([...items,{id:crypto.randomUUID(),kind:'image',name:file.name,url:String(reader.result)}]);reader.onerror=()=>setError('Das Bild konnte nicht gelesen werden.');reader.readAsDataURL(file);e.target.value='';}}/></label>{error&&<p role="alert">{error}</p>}
 </section>;
}
