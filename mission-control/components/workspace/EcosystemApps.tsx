"use client";
import { usePersonal } from '@/lib/workspace/personal';
const apps=[
 ['Visual Room','visual-room.youareneo.com','Fokus, Musik und lebendige Räume','◉'],
 ['Hook Book','hook-book.youareneo.com','Ideen, Hooks und Inspiration sammeln','✎'],
 ['Cinema','cinema.youareneo.com','Filme, Geschichten und gemeinsame Erlebnisse','▷'],
 ['Radio','radio.youareneo.com','Musik entdecken und Klangwelten genießen','♫'],
 ['Good News','good-news.youareneo.com','Positive Nachrichten und neue Perspektiven','☀'],
 ['Frequenzy','frequenzy.youareneo.com','Frequenzen, Klänge und Resonanz erkunden','≋'],
 ['Art Atelier','art.youareneo.com','Raum für Kunst und kreative Gestaltung','✧'],
 ['Living Arts Room','living-arts-romm.youareneo.com','Bilder, Licht und Geschichten erleben','❋'],
];
export function EcosystemApps(){const s=usePersonal();return <section className="s-neo-apps"><div className="w-section-head"><h2>YOU ARE NEO · Unsere Räume</h2><button className="w-btn" onClick={()=>s.set({hiddenLinks:s.hiddenLinks.filter(x=>!x.startsWith('ecosystem:'))})}>Alle anzeigen</button></div><div className="s-neo-grid">{apps.filter(([name])=>!s.hiddenLinks.includes('ecosystem:'+name)).map(([name,domain,description,symbol],i)=><article className="s-neo-card" key={domain} style={{'--app-hue':`${i*36}deg`} as React.CSSProperties}><a href={`https://${domain}/`} target="_blank" rel="noopener noreferrer"><img src="/images/sanctuary.png" alt=""/><div className="s-neo-art" aria-hidden>{symbol}</div><div className="s-neo-copy"><span>YOU ARE NEO ↗</span><h3>{name}</h3><p>{description}</p></div></a><button className="w-icon s-neo-remove" aria-label={`${name} aus Apps entfernen`} onClick={()=>s.set({hiddenLinks:[...s.hiddenLinks,'ecosystem:'+name]})}>−</button></article>)}</div></section>}
