import {NextResponse} from "next/server";
const cache=new Map<string,{until:number;value:unknown}>();
export async function GET(req:Request){
  try {
    const p=new URL(req.url).searchParams;let url:URL;const searching=p.has("q");
    if(searching){const q=p.get("q")!.trim();if(q.length<2||q.length>80)return NextResponse.json({error:"Bitte einen Ortsnamen mit 2–80 Zeichen eingeben."},{status:400});url=new URL("https://geocoding-api.open-meteo.com/v1/search");url.search=new URLSearchParams({name:q,count:"5",language:"de",format:"json"}).toString();}
    else {if(!p.has("lat")||!p.has("lon"))return NextResponse.json({error:"Ort fehlt."},{status:400});const lat=Number(p.get("lat")),lon=Number(p.get("lon"));if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return NextResponse.json({error:"Ungültiger Ort."},{status:400});url=new URL("https://api.open-meteo.com/v1/forecast");url.search=new URLSearchParams({latitude:lat.toFixed(2),longitude:lon.toFixed(2),current:"weather_code,temperature_2m",timezone:"auto",forecast_days:"1"}).toString();}
    const key=url.toString(),hit=cache.get(key);if(hit&&hit.until>Date.now())return NextResponse.json(hit.value);
    const r=await fetch(url,{signal:AbortSignal.timeout(6000),cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();
    const value=searching?{places:(d.results||[]).map((v:{name:string;admin1?:string;country?:string;latitude:number;longitude:number})=>({name:[v.name,v.admin1,v.country].filter(Boolean).join(", "),latitude:Math.round(v.latitude*100)/100,longitude:Math.round(v.longitude*100)/100}))}:{code:d.current?.weather_code,temperature:d.current?.temperature_2m,observedAt:d.current?.time};
    if(!searching && !Number.isInteger(d.current?.weather_code))throw Error();if(cache.size>=64)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+1800000,value});return NextResponse.json(value,{headers:{"Cache-Control":"private, max-age=900"}});
  }catch{return NextResponse.json({error:"Wetter gerade nicht erreichbar. Die ruhige Tageslicht-Ansicht bleibt verfügbar."},{status:503});}
}
