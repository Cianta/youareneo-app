import test from "node:test";
import assert from "node:assert/strict";
import {createClient} from "@supabase/supabase-js";
import {preferencesOf, themePalette, isCaptureShortcut} from "../lib/assistant/preferences";
import {ownProjectRules} from "../lib/voice/project-rules";
import {classify} from "../lib/voice/providers";
test("device preferences reject malformed values and never retain arbitrary data",()=>{
  const p=preferencesOf({brightness:Infinity,volume:-7,rate:90,pitch:NaN,provider:"bad",sound:false,microphone:false,session:"not-a-preference"});
  assert.equal(p.brightness,100);assert.equal(p.volume,0);assert.equal(p.rate,2);assert.equal(p.pitch,1);assert.equal(p.provider,"browser");
  assert.equal(p.sound,false);assert.equal(p.microphone,false);assert(!("session" in p));
});
test("continuous palette keeps foreground contrast against the main background",()=>{
  const lum=(hex:string)=>{
    const rgb=hex.startsWith("#") ? hex.slice(1).match(/../g)!.map(c=>parseInt(c,16)) : hex.match(/\d+/g)!.map(Number);
    return rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  };
  let previous="";
  for(let b=0;b<=100;b+=.5){const p=themePalette(b),a=lum(p['--theme-bg']),c=lum(p['--theme-text']);assert((Math.max(a,c)+.05)/(Math.min(a,c)+.05)>=4.5,`Contrast at ${b}`);if(b%10===0){assert.notEqual(p['--theme-bg'],previous);previous=p['--theme-bg'];}}
});
test("hold shortcut does not intercept the operating system app switcher or composition",()=>{
  const e={code:"Space",ctrlKey:true,shiftKey:true,altKey:false,metaKey:false,isComposing:false};
  assert(isCaptureShortcut(e));assert(!isCaptureShortcut({...e,isComposing:true}));
  assert(!isCaptureShortcut({...e,code:"Tab",ctrlKey:false,shiftKey:false,metaKey:true}));
  assert(!isCaptureShortcut({...e,code:"Tab",ctrlKey:false,shiftKey:false,altKey:true}));
});
test("place rules read only the newest rule note owned by this account and place",async()=>{
  let calls=0;
  const sb=createClient("https://example.supabase.co","fixture",{auth:{persistSession:false},global:{fetch:async(input,init)=>{
    calls++;const u=new URL(new Request(input,init).url);
    assert.equal(u.searchParams.get("user_id"),"eq.owner");assert.equal(u.searchParams.get("project"),"eq.Eden");
    assert.equal(u.searchParams.get("tags"),"cs.{projektregeln}");assert.equal(u.searchParams.get("order"),"created_at.desc");assert.equal(u.searchParams.get("limit"),"1");
    return new Response(JSON.stringify([{transcript:"a".repeat(5000)}]),{headers:{"Content-Type":"application/json"}});
  }}});
  assert.equal(await ownProjectRules(sb,"owner",null),"");assert.equal(calls,0);
  assert.equal((await ownProjectRules(sb,"owner","Eden")).length,2000);assert.equal(calls,1);
});
test("classification binds a selected place and bounds its own rules without enabling execution",async(t)=>{
  t.mock.method(globalThis,"fetch",async(input:RequestInfo | URL,init?:RequestInit)=>{
    const r=new Request(input,init),b=await r.json();
    assert.equal(new URL(r.url).hostname,"api.anthropic.com");assert(b.system.includes('Zielort ist verbindlich "Eden"'));assert(b.system.includes("keine Ausführung"));
    assert(b.system.length<5000);assert.deepEqual(b.tools[0].input_schema.properties.project.enum,["Eden"]);
    return new Response(JSON.stringify({id:"msg-fixture",type:"message",role:"assistant",model:"fixture",content:[{type:"tool_use",id:"tool-fixture",name:"classify_note",input:{title:"Gedanke",summary:"Kurz",type:"notiz",project:null,tags:[],due:null,assignee:null}}],stop_reason:"tool_use",usage:{input_tokens:1,output_tokens:1}}),{headers:{"Content-Type":"application/json"}});
  });
  const prior=process.env.ANTHROPIC_API_KEY;process.env.ANTHROPIC_API_KEY="local-fixture-only";
  try{const n=await classify("Mein Originaltext",["Eden"],"voice",{project:"Eden",rules:"a".repeat(5000)});assert.equal(n.project,"Eden");assert.equal(n.transcript,"Mein Originaltext");assert.equal(n.source,"voice");}
  finally{if(prior===undefined)delete process.env.ANTHROPIC_API_KEY;else process.env.ANTHROPIC_API_KEY=prior;}
});

test('widget keyboard layout and transcript insertion keep the user in control',async()=>{
 const {widgetShortcut,insertDictation}=await import('../lib/assistant/widget');
 const base={altKey:true,ctrlKey:false,metaKey:false,shiftKey:false,isComposing:false};
 assert.equal(widgetShortcut({...base,key:'y',code:'KeyZ'}),'open');
 assert.equal(widgetShortcut({...base,key:'¥',code:'KeyY'}),'open');
 assert.equal(widgetShortcut({...base,key:'x',code:'KeyX'}),'dictate');
 assert.equal(widgetShortcut({...base,key:'h',code:'KeyH'}),'append');
 assert.equal(widgetShortcut({...base,key:'c',code:'KeyC',ctrlKey:true}),null,'AltGr must not send');
 assert.equal(widgetShortcut({...base,key:'c',code:'KeyC',isComposing:true}),null);
 assert.equal(insertDictation('Meine Idee',' Ergänzung ',true),'Meine Idee\nErgänzung');
 assert.equal(insertDictation('Vorher nachher','Text',false,7,7),'Vorher Text nachher');
 assert.equal(insertDictation('Vorher falsch nachher','richtig',false,7,13),'Vorher richtig nachher');
 assert.equal(insertDictation('Bearbeitet','',false),'Bearbeitet');
 assert.equal(insertDictation('x'.repeat(4000),'Bleibt erhalten',true).length,4016,'No silent truncation of a transcript');
});
