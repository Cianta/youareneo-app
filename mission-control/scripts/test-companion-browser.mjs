// Synthetic microphone and account fixtures. No physical recording or provider calls.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3310';assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await puppeteer.launch({executablePath:process.env.TEST_BROWSER_PATH,headless:true});const page=await browser.newPage();
const errors=[];let transcriptions=0,chatCalls=0,revision=1,owner='fixture-owner',saves=0,weatherCalls=0,mailAvailable=true;
const notebook=JSON.stringify({state:{entries:[],isOpen:false},version:0});
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.evaluateOnNewDocument(()=>{
  window.micFixture={active:0,starts:0,fail:'',device:'',requests:0};
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{enumerateDevices:async()=>[{kind:'audioinput',deviceId:'fixture-mic',label:'USB Testmikrofon'}],addEventListener(){},removeEventListener(){},getUserMedia:async constraints=>{
    const f=window.micFixture;f.requests++;if(f.fail){const name=f.fail;f.fail='';throw new DOMException('fixture',name);}f.device=constraints.audio.deviceId?.exact||'';f.active++;let ended=false;const track={label:'USB Testmikrofon',stop(){if(!ended){ended=true;f.active--;}},addEventListener(){}};return {getTracks:()=>[track],getAudioTracks:()=>[track]};
  }}});
  window.AudioContext=class{resume(){return Promise.resolve()}close(){return Promise.resolve()}createMediaStreamSource(){return{connect(){}}}createAnalyser(){return{fftSize:256,getFloatTimeDomainData(v){v.fill(.08)},getByteTimeDomainData(v){v.fill(135)}}}};
  window.MediaRecorder=class{static isTypeSupported(){return true}constructor(stream,o){this.mimeType=o.mimeType;this.state='inactive'}start(){this.state='recording';window.micFixture.starts++}stop(){if(this.state==='inactive')return;this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['fixture-audio'],{type:this.mimeType})});this.onstop?.()})}};
  localStorage.setItem('trinity-notebook',JSON.stringify({state:{entries:[],isOpen:true},version:0}));
});
await page.setRequestInterception(true);page.on('request',async r=>{try{const u=new URL(r.url());if(u.origin!==base)return r.abort();if(!u.pathname.startsWith('/api/'))return r.continue();let status=200,d={};
 if(u.pathname==='/api/auth/me')d={authenticated:true,userId:owner,hasTrinityAccess:true,products:['foerder'],displayName:'Testmitglied'};
 else if(u.pathname==='/api/voice/config')d={userId:owner,canSave:true,provider:'infomaniak',transcriptionReady:true,classificationReady:true,limits:{minutes:60,requests:100},usage:{voice_seconds:0,requests:0}};
 else if(u.pathname==='/api/gmail/threads'){if(!mailAvailable){status=401;d={error:'unauthorized'};}else d={ok:true,userScoped:true,userId:owner,available:true,totalUnread:1,threads:[{id:'fixture-thread',subject:'Privater Kontotest',snippet:'Testvorschau',lastDate:'2026-10-02',isUnread:true,isStarred:false,isImportant:false,labels:['INBOX'],messages:[{id:'fixture-message',threadId:'fixture-thread',date:'2026-10-02',senderName:'Testperson',senderEmail:'test@example.invalid',subject:'Privater Kontotest',snippet:'Testvorschau',body:'Nur für das Testkonto sichtbar',toRecipients:[],labelIds:[]}]}]};}
 else if(u.pathname==='/api/notes/projects')d={projects:[]};
 else if(u.pathname==='/api/notes/queue')d={queue:[]};
 else if(u.pathname==='/api/notes')d={notes:[]};
 else if(u.pathname==='/api/voice/speech/voices')d={ready:false,voices:[]};
 else if(u.pathname==='/api/voice/transcribe'){transcriptions++;d={transcript:'Ein eigener Gedanke für Eden.'};}
 else if(u.pathname==='/api/voice/chat'){chatCalls++;d={error:'Unexpected send'};status=500;}
 else if(u.pathname==='/api/workspace/snapshot'){if(r.method()==='PUT'){const b=JSON.parse(r.postData());assert.equal(b.userId,owner);assert.equal(b.revision,revision);assert(!('session' in b.payload.stores));revision++;saves++;d={userId:owner,revision,updated_at:new Date().toISOString()};}else d={userId:owner,canSave:true,snapshot:{revision,payload:{version:1,stores:{'trinity-notebook':notebook}},updated_at:'2026-10-02T12:00:00Z'}};}
 else if(u.pathname==='/api/ambience'){weatherCalls++;d=u.searchParams.has('q')?{places:[{name:'Wien, Österreich',latitude:48.21,longitude:16.37}]}:{code:61,temperature:12,observedAt:'2026-10-02T16:00'};}
 await r.respond({status,contentType:'application/json',body:JSON.stringify(d)});
}catch(e){errors.push(e.message);if(!r.isInterceptResolutionHandled())await r.abort();}});
const click=async text=>{await page.waitForFunction(t=>[...document.querySelectorAll('button')].some(e=>e.textContent.trim()===t&&e.getBoundingClientRect().height>0),{},text);const handle=await page.evaluateHandle(t=>[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===t&&e.getBoundingClientRect().height>0),text);assert(await handle.asElement(),text);await handle.asElement().click();};
const text=async value=>page.waitForFunction(t=>document.body.innerText.includes(t),{},value);
const close=async()=>page.click('.assistant-panel:not([hidden]) [aria-label="Trinity schließen"]');
try{
 await page.setViewport({width:1440,height:1000});await page.goto(base+'/notiz',{waitUntil:'networkidle0'});
 assert.equal(await page.$$('svg .tl-body').then(a=>a.length),2,'Logo exists in responsive brand variants');
 assert.equal(await page.$$eval('svg [id]',es=>{const ids=es.map(e=>e.id);return ids.length===new Set(ids).size}),true);
 assert.equal(weatherCalls,0,'Weather must stay off until opted in');
 await page.click('[aria-label="Trinity Einstellungen öffnen"]');await page.waitForSelector('.microphone-settings');
 await page.select('[aria-label="Mikrofon auswählen"]','fixture-mic');await click('Mikrofon testen & freigeben');await text('verbunden. Sprich kurz');
 assert.equal(await page.evaluate(()=>window.micFixture.device),'fixture-mic');assert.equal(transcriptions,0);assert.equal(await page.evaluate(()=>window.micFixture.starts),0,'Meter test never records');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Test-Mikrofonpegel"]').value>0);await close();assert.equal(await page.evaluate(()=>window.micFixture.active),0,'Closing settings stops the device');
 await page.click('[aria-label="Trinity Menü öffnen"]');await page.waitForSelector('#assistant-chat-text');await page.evaluate(()=>window.micFixture.fail='NotFoundError');await click('Klick statt Halten');await text('Kein Mikrofon gefunden');
 await page.click('.chat-feedback button');await page.waitForSelector('.microphone-settings');await close();await page.click('[aria-label="Trinity Menü öffnen"]');
 await click('Klick statt Halten');await page.waitForFunction(()=>window.micFixture.active===1);await click('Stopp');await text('Transkription bereit');assert.equal(transcriptions,1);assert.equal(chatCalls,0);assert.equal(await page.$eval('#assistant-chat-text',e=>e.value),'Ein eigener Gedanke für Eden.');
 assert.equal(await page.$eval('.energy-companion',e=>e.dataset.form),'dragon');await page.screenshot({path:'/tmp/guiding-companion-desktop.png'});
 await click('Begleiter gestalten');await page.select('.assistant-settings label:has(select) select','tree');await page.click('.assistant-panel:not([hidden]) [type=checkbox]');await close();await page.click('[aria-label="Trinity Menü öffnen"]');
 assert.equal(await page.$eval('.energy-companion',e=>e.dataset.form),'tree');assert.equal(await page.$eval('.energy-being',e=>getComputedStyle(e).animationName),'none');await close();
 await page.click('[aria-label="Trinity Einstellungen öffnen"]');await click('Darstellung');await page.waitForSelector('.appearance-settings');const leftBefore=await page.$eval('.workspace-sidebar',e=>getComputedStyle(e).backgroundColor);
 await page.$$eval('.appearance-settings label',es=>es.find(e=>e.textContent.includes('Wetter am gewählten Ort')).querySelector('input').click());await page.type('.appearance-settings input[placeholder]','Wien');await click('Ort suchen');await text('Wien, Österreich');await click('Wien, Österreich');await page.waitForFunction(()=>document.querySelector('.workspace-atmosphere').dataset.weather==='rain');
 assert.equal(await page.$eval('.workspace-sidebar',e=>getComputedStyle(e).backgroundColor),leftBefore);assert.equal(await page.$$('.atmosphere-rain i').then(a=>a.length),3);assert.equal(await page.$eval('.workspace-atmosphere',e=>getComputedStyle(e).pointerEvents),'none');
 await click('Geräte & Sync');await click('Serverstand prüfen');await text('Version 1');await page.click('.workspace-sync > label input[type=checkbox]');revision=2;await click('Auswahl auf Server sichern');await text('neueren Stand');assert.equal(saves,0);
 await click('Serverstand prüfen');await text('Version 2');await page.click('.workspace-sync > label input[type=checkbox]');await click('Auswahl auf Server sichern');await text('privat gesichert');assert.equal(saves,1);
 await page.click('.workspace-sync > label input[type=checkbox]');owner='another-owner';await click('Auswahl auf Server sichern');await text('Konto hat gewechselt');assert.equal(saves,1,'Account switch cannot publish old local data');owner='fixture-owner';await close();
 for(const width of [390,320]){await page.setViewport({width,height:844});await page.click('[aria-label="Trinity Menü öffnen"]');await page.waitForSelector('#assistant-chat-text');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const box=await page.$eval('#assistant-chat-text',e=>{e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}});assert(box.x>=0&&box.x+box.w<=width);assert(await page.evaluate(({x,y,w,h})=>document.elementFromPoint(x+w/2,y+h/2)?.id==='assistant-chat-text',box),'Prompt is not covered by companion');await page.screenshot({path:`/tmp/guiding-companion-mobile-${width}.png`});await close();}
 await page.setViewport({width:1440,height:1000});await page.goto(base+'/dashboard/communication/email',{waitUntil:'networkidle0'});await text('Privater Kontotest');await page.evaluate(()=>[...document.querySelectorAll('p')].find(e=>e.textContent==='Privater Kontotest').click());await text('Nur für das Testkonto sichtbar');mailAvailable=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await text('Bitte melde dich für dein Postfach an.');assert.equal(await page.evaluate(()=>document.body.innerText.includes('Nur für das Testkonto sichtbar')),false,'Session loss removes open mail detail');
 await page.goto(base+'/notiz',{waitUntil:'networkidle0'});
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);assert.equal(await page.$eval('.atmosphere-rain i',e=>getComputedStyle(e).animationName),'none');
 await page.goto(base+'/offline.html',{waitUntil:'networkidle0'});await page.type('#draft','Offline-Idee: einen Gemeinschaftsgarten planen.');await page.click('#save');await text('Auf diesem Gerät gesichert');await page.goto(base+'/notiz',{waitUntil:'networkidle0'});await text('Offline-Entwürfe auf diesem Gerät');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,fixture:true,transcriptions,chatCalls,saves,weatherCalls,checks:['local microphone meter','selected input','retry after NotFoundError','no automatic chat send','avatar choice and motion','weather consent/sidebar isolation','snapshot conflict/account switch','mobile composer','offline draft recovery','mail detail cleared on lost session'],screenshots:['/tmp/guiding-companion-desktop.png','/tmp/guiding-companion-mobile-390.png']}));
}catch(e){console.error(await page.evaluate(()=>({text:document.body.innerText.slice(-7000),media:window.micFixture})));await page.screenshot({path:'/tmp/guiding-companion-failure.png'});throw e;}finally{await browser.close()}
