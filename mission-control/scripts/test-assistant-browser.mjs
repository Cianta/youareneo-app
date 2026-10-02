// Local synthetic media and HTTP fixtures: never uses a real microphone, account or provider.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {mkdir} from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3310';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));assert(process.env.TEST_BROWSER_PATH);
const browser=await puppeteer.launch({executablePath:process.env.TEST_BROWSER_PATH,headless:true});
const page=await browser.newPage();const errors=[],requests=[],writes=[];
let owner='fixture-owner',failSave=true,failClassify=false,delayConfig=false;
await mkdir('/tmp/trinity-assistant-screens',{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.evaluateOnNewDocument(()=>{
  window.fixtureMedia={requests:0,starts:0,active:0,stopped:0,wait:false,resolve:null};window.fixtureWrites=[];
  const get=async()=>{
    const stats=window.fixtureMedia;stats.requests++;
    if(stats.wait)await new Promise(resolve=>stats.resolve=resolve);
    stats.active++;let stopped=false;
    return {getTracks:()=>[{stop:()=>{if(!stopped){stopped=true;stats.active--;stats.stopped++;}}}]};
  };
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:get},configurable:true});
  window.MediaRecorder=class {
    static isTypeSupported(){return true;}
    constructor(stream,options){this.stream=stream;this.mimeType=options.mimeType;this.state='inactive';}
    start(){this.state='recording';window.fixtureMedia.starts++;}
    stop(){if(this.state==='inactive')return;this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['fixture-audio'],{type:this.mimeType})});this.onstop?.();});}
    pause(){this.state='paused';}resume(){this.state='recording';}
  };
  window.AudioContext=class{
    resume(){return Promise.resolve();}close(){return Promise.resolve();}
    createMediaStreamSource(){return{connect(){}};}
    createAnalyser(){return{fftSize:512,getFloatTimeDomainData(v){v.fill(.01);},getByteTimeDomainData(v){v.fill(128);}};}
  };
  const original=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    if(init?.body instanceof FormData && String(input)==='/api/notes')window.fixtureWrites.push({id:init.body.get('id'),note:JSON.parse(init.body.get('note'))});
    return original(input,init);
  };
});
await page.setRequestInterception(true);
page.on('request',async r=>{
  try{
    const u=new URL(r.url());if(u.origin!==base)return r.abort('blockedbyclient');
    if(!u.pathname.startsWith('/api/'))return r.continue();requests.push({path:u.pathname,method:r.method()});
    let d={success:true},status=200;
    if(u.pathname==='/api/auth/me')d={authenticated:true,userId:owner,products:['foerder'],displayName:'Testmitglied',hasTrinityAccess:true};
    else if(u.pathname==='/api/voice/config'){
      if(delayConfig)await new Promise(resolve=>setTimeout(resolve,500));
      d={userId:owner,canSave:true,provider:'infomaniak',transcriptionReady:true,classificationReady:true,limits:{minutes:60,requests:200},usage:{voice_seconds:0,requests:0}};
    } else if(u.pathname==='/api/notes/projects')d={projects:['Eden','Werkstatt'],...(u.searchParams.has('rulesFor')?{rules:'Rezepte als Notiz mit Zutaten und Zubereitung.'}:{})};
    else if(u.pathname==='/api/notes/queue')d={queue:[]};
    else if(u.pathname==='/api/notes'&&r.method()==='GET')d={notes:[]};
    else if(u.pathname==='/api/brain')d={graph:{nodes:[],links:[],truncated:false,counts:{notes:0,projects:0,queue:0},total:0}};
    else if(u.pathname==='/api/voice/speech/voices')d={ready:false,voices:[]};
    else if(u.pathname==='/api/voice/transcribe')d={transcript:'Bitte ordne meine Gartenidee bei Eden ein.',provider:'Infomaniak'};
    else if(u.pathname==='/api/voice/classify'){
      if(failClassify){status=503;d={error:'Einordnung vorübergehend unterbrochen.'};}
      else {const b=JSON.parse(r.postData());d={note:{title:'Gartenidee',transcript:b.transcript,summary:'Garten planen',type:'idee',project:b.project||'Eden',tags:['garten'],due:null,assignee:null,source:'voice'},rulesApplied:!!b.project};}
    } else if(u.pathname==='/api/notes'&&r.method()==='POST'){
      const w=await page.evaluate(()=>window.fixtureWrites.at(-1));writes.push(w);
      if(failSave){failSave=false;status=503;d={error:'Speichern unterbrochen. Entwurf bleibt erhalten.'};}
      else d={success:true,id:w.id,created:true};
    } else if(u.pathname==='/api/search')d={items:[],userId:owner};
    else if(u.pathname==='/api/voice/chat'){
      assert.equal(r.method(),'POST');return r.respond({status:200,contentType:'application/x-ndjson',body:'{"type":"text","text":"Hallo aus dem Test."}\n{"type":"done"}\n'});
    } else assert.equal(r.method(),'GET','Unknown writes are blocked');
    return r.respond({status,contentType:'application/json',body:JSON.stringify(d)});
  }catch{/* canceled requests */}
});
async function clickText(text){await page.evaluate(t=>{const b=[...document.querySelectorAll('.assistant-panel button')].find(e=>e.textContent.trim()===t);if(!b)throw Error('Missing button '+t);b.click();},text);}
async function text(text){await page.waitForFunction(t=>document.querySelector('.assistant-panel')?.textContent.includes(t),{},text);}
async function hold(expected='Vorschlag bereit'){const b=await page.$('[aria-label="Sprachnotiz aufnehmen: gedrückt halten"]'),p=await b.boundingBox();await page.mouse.move(p.x+p.width/2,p.y+p.height/2);await page.mouse.down();await page.waitForFunction(()=>window.fixtureMedia.active===1);await page.waitForFunction(()=>document.querySelector('.assistant-panel')?.textContent.includes('Ich höre zu'));await page.mouse.up();await text(expected);}
try{
  await page.setViewport({width:1360,height:940});await page.goto(base+'/notiz',{waitUntil:'networkidle0'});
  assert(await page.$('.workspace-sidebar'));assert.equal(await page.$$('.workspace-shell').then(e=>e.length),1);
  await page.evaluate(()=>{window.sidebarOriginal=document.querySelector('.workspace-sidebar');});
  await page.click('.workspace-sidebar a[href="/gehirn"]');await page.waitForSelector('.brain-workspace');
  assert.equal(await page.evaluate(()=>window.sidebarOriginal===document.querySelector('.workspace-sidebar')),true,'Sidebar must persist between routes');
  assert.equal(await page.$$('.assistant-avatar').then(e=>e.length),1,'Exactly one global avatar');
  await page.screenshot({path:'/tmp/trinity-assistant-screens/brain-dark.png'});
  await page.click('[aria-label="Trinity Einstellungen öffnen"]');await text('Stimme & Erscheinungsbild');
  await page.$eval('input[aria-label="Helligkeit"]',e=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(e,'100');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').includes('244'));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('trinity-display-voice')).brightness),100);
  await page.screenshot({path:'/tmp/trinity-assistant-screens/settings-light.png'});
  await page.click('[aria-label="Trinity schließen"]');
  // Releasing before permission resolves must not start recording or send audio.
  await page.evaluate(()=>window.fixtureMedia.wait=true);
  const mic=await page.$('[aria-label="Sprachnotiz aufnehmen: gedrückt halten"]'),box=await mic.boundingBox();
  await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.waitForFunction(()=>window.fixtureMedia.resolve!==null);await page.mouse.up();
  await page.evaluate(()=>{window.fixtureMedia.resolve();window.fixtureMedia.wait=false;window.fixtureMedia.resolve=null;});
  await page.waitForFunction(()=>window.fixtureMedia.active===0);assert.equal(await page.evaluate(()=>window.fixtureMedia.starts),0);
  assert.equal(requests.filter(r=>r.path==='/api/voice/transcribe').length,0);
  await hold();assert.equal(await page.evaluate(()=>window.fixtureMedia.active),0);
  assert.equal(writes.length,0,'Classification must never save automatically');
  assert.equal(await page.$eval('.assistant-draft select',e=>e.value),'Eden');
  await clickText('Mit Ortsregeln neu einordnen');await text('Vorschlag mit deinen Ortsregeln');
  await clickText('Am gewählten Ort speichern');await text('Speichern unterbrochen');
  assert(await page.$('.assistant-draft'));await clickText('Am gewählten Ort speichern');await text('Gespeichert am gewählten Ort');
  assert.equal(writes[0].id,writes[1].id,'Retry must reuse the exact submission id');assert.equal(writes[1].note.project,'Eden');
  await page.click('[aria-label="Trinity schließen"]');
  // The global hold chord also works without switching route.
  await page.keyboard.down('Control');await page.keyboard.down('Shift');await page.keyboard.down('Space');
  await page.waitForFunction(()=>document.querySelector('.assistant-panel')?.textContent.includes('Ich höre zu'));
  await page.evaluate(()=>document.querySelector('.workspace-sidebar a[href="/notiz"]').click());await page.waitForSelector('.voice-page');
  assert.equal(await page.evaluate(()=>window.sidebarOriginal===document.querySelector('.workspace-sidebar')),true);
  await page.keyboard.up('Space');await page.keyboard.up('Shift');await page.keyboard.up('Control');await text('Vorschlag bereit');
  assert.equal(new URL(page.url()).pathname,'/notiz');
  const writesBeforeOwnerChange=writes.length;owner='second-fixture-owner';
  await clickText('Am gewählten Ort speichern');await text('Das Konto hat gewechselt');
  assert.equal(writes.length,writesBeforeOwnerChange,'An old draft must never be saved by another account');assert.equal(await page.$('.assistant-draft'),null);
  owner='fixture-owner';await page.click('[aria-label="Trinity schließen"]');
  await page.click('[aria-label="Trinity Einstellungen öffnen"]');await text('Das Konto hat gewechselt');await page.click('[aria-label="Trinity schließen"]');
  // Starting the dock recording stops the note recorder without submitting its audio.
  await page.click('.voice-recorder [aria-label="Aufnahme starten"]');await page.waitForFunction(()=>!!document.querySelector('.voice-recorder .is-recording'));
  const transcriptionsBeforeClaim=requests.filter(r=>r.path==='/api/voice/transcribe').length;
  await hold();assert.equal(requests.filter(r=>r.path==='/api/voice/transcribe').length,transcriptionsBeforeClaim+1);
  assert.equal(await page.$('.voice-recorder .is-recording'),null);assert.equal(await page.evaluate(()=>window.fixtureMedia.active),0);
  await clickText('Entwurf verwerfen');await page.click('[aria-label="Trinity schließen"]');
  failClassify=true;await hold('Einordnung vorübergehend');
  assert.equal(await page.$eval('.assistant-draft textarea',e=>e.value),'Bitte ordne meine Gartenidee bei Eden ein.');
  await clickText('Entwurf verwerfen');failClassify=false;
  await page.click('[aria-label="Trinity schließen"]');await page.click('[aria-label="Trinity Einstellungen öffnen"]');
  await page.click('.assistant-settings details summary');await page.select('.assistant-settings details select','Eden');await text('Die neueste Version');
  await page.waitForFunction(()=>document.querySelector('.assistant-settings details textarea')?.value.startsWith('Rezepte'));
  await clickText('Ortsregeln speichern');await text('Ortsregeln als private Projektnotiz');
  assert.deepEqual(writes.at(-1).note.tags,['projektregeln']);assert.equal(writes.at(-1).note.project,'Eden');
  await clickText('Sprachchat starten');await page.waitForSelector('#chat-text');
  await page.click('[aria-label="Ton ausschalten"]');await page.type('#chat-text','Hallo');
  await page.evaluate(()=>document.querySelector('#chat-text').closest('form').requestSubmit());await text('Hallo aus dem Test.');
  await page.click('[aria-label="Trinity schließen"]');
  await page.setViewport({width:390,height:844});await page.goto(base+'/notiz',{waitUntil:'networkidle0'});
  assert(await page.$('.workspace-mobile-tabs'));const dock=await page.$eval('.assistant-dock',e=>({y:e.getBoundingClientRect().bottom,w:e.getBoundingClientRect().width}));
  const tabs=await page.$eval('.workspace-mobile-tabs',e=>e.getBoundingClientRect().top);assert(dock.y<tabs,'Dock must not cover mobile navigation');assert(dock.w<390);
  await page.click('[aria-label="Trinity Einstellungen öffnen"]');await page.screenshot({path:'/tmp/trinity-assistant-screens/mobile-settings.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.evaluate(()=>window.fixtureMedia.active),0);assert.deepEqual(errors,[]);
  await page.goto(base+'/login',{waitUntil:'networkidle0'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('trinity-display-voice')).brightness),100);
  const loginContrast=await page.$eval('[aria-label="E-Mail"]',e=>{
    const s=getComputedStyle(e),lum=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    const a=lum(s.backgroundColor),b=lum(s.color);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
  assert(loginContrast>=4.5,'A saved light workspace preference must keep login fields readable');
  console.log(JSON.stringify({passed:true,fixture:true,simulatedWrites:writes.length,transcriptions:requests.filter(r=>r.path==='/api/voice/transcribe').length,screenshots:'/tmp/trinity-assistant-screens',errors}));
}finally{await browser.close();}
