// Local fixtures only. No live calls, meeting creation, mail or private CRM writes.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3310';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
assert(process.env.TEST_BROWSER_PATH);
const browser=await puppeteer.launch({executablePath:process.env.TEST_BROWSER_PATH,headless:true});
const page=await browser.newPage(),errors=[],writes=[],external=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).pathname.startsWith('/_next/image'))errors.push(`Image HTTP ${r.status()}`);});
await page.evaluateOnNewDocument(()=>{
  localStorage.setItem('trinity-display-voice',JSON.stringify({sound:false,companionMotion:true}));
});
await page.setRequestInterception(true);
page.on('request',async request=>{
  if(request.isInterceptResolutionHandled())return;
  const url=new URL(request.url());if(['data:','blob:'].includes(url.protocol))return request.continue();
  if(url.origin!==base){external.push(url.hostname);return request.abort();}
  if(!url.pathname.startsWith('/api/'))return request.continue();
  if(request.method()!=='GET'){writes.push(url.pathname);return request.abort();}
  const body=url.pathname==='/api/auth/me'?{authenticated:true,hasTrinityAccess:true,displayName:'Testmitglied',userId:'fixture'}:{success:true,notes:[],data:[],queue:[],projects:[],canSave:false,userId:'fixture',limits:{minutes:60,requests:100},usage:{voice_seconds:0,requests:0}};
  return request.respond({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
async function go(path){await page.goto(base+path,{waitUntil:'networkidle0'});await page.waitForSelector('.workspace-sidebar');}
try{
  await page.setViewport({width:1440,height:1000});await go('/notiz');
  assert.deepEqual(await page.$$eval('.workspace-nav-section',nodes=>nodes.map(n=>({group:n.querySelector('.workspace-nav-group')?.textContent,items:[...n.querySelectorAll('a')].map(a=>a.dataset.navId)})).filter(n=>['Arbeiten','Kommunikation'].includes(n.group))),[
    {group:'Arbeiten',items:['ideas','lab','projects']}
  ]);
  assert.deepEqual(await page.$$eval('.sidebar-communication a',nodes=>nodes.map(n=>n.dataset.navId)),['inbox','meeting','contacts','phone']);
  assert(await page.$eval('[data-nav-id="projects"]',e=>parseFloat(getComputedStyle(e).marginTop)>=10));
  assert.equal(await page.$$('.tl-sun-stage .tl-sun-prominence').then(n=>n.length),12); // desktop + mobile marks
  assert.equal(await page.$$('.tl-gold,.tl-gold-rays').then(n=>n.length),0);
  const animation=await page.evaluate(()=>{
    const logo=document.querySelector('.workspace-brand svg');
    const frames=logo.getAnimations({subtree:true});
    const sample=time=>{for(const frame of frames){frame.pause();frame.currentTime=time;}const sun=logo.querySelector('.tl-sun-stage'),surface=logo.querySelector('.tl-sun-surface'),flow=logo.querySelector('.tl-sun-filament');return {opacity:Number(getComputedStyle(sun).opacity),surface:getComputedStyle(surface).transform,flow:getComputedStyle(flow).strokeDashoffset};};
    return {rest:sample(0),sun:sample(12200),later:sample(13300)};
  });
  assert.equal(animation.rest.opacity,0);assert(animation.sun.opacity>.9);assert.notEqual(animation.sun.surface,animation.later.surface);assert.notEqual(animation.sun.flow,animation.later.flow);
  // A larger, frozen storyboard of the actual component, on two backgrounds.
  await page.evaluate(()=>{
    const original=document.querySelector('.workspace-brand svg'),sheet=document.createElement('section');sheet.id='logo-proof';sheet.style.cssText='position:fixed;inset:0;z-index:10000;background:#f4f3f0;padding:40px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:20px;font-family:system-ui;';
    for(const [row,bg] of ['#f4f3f0','#161226'].entries())for(const [i,label] of ['Ruhe','Verdichtung','Trinity-Sonne','Rückkehr'].entries()){
      const card=document.createElement('div');card.dataset.time=[0,10700,12200,16200][i];card.style.cssText=`background:${bg};border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:25px;color:${row?'#eadcf7':'#544168'};`;
      const svg=original.cloneNode(true);svg.setAttribute('width','180');svg.setAttribute('height','180');svg.querySelector('.tl-sun-stage image').setAttribute('href',svg.querySelector('.tl-sun-stage image').getAttribute('href').replace('w=96','w=384'));card.append(svg);const caption=document.createElement('span');caption.textContent=label;card.append(caption);sheet.append(card);
    }document.body.append(sheet);
    for(const card of sheet.children)for(const a of card.querySelector('svg').getAnimations({subtree:true})){a.pause();a.currentTime=Number(card.dataset.time);}
  });
  await page.waitForNetworkIdle();await page.screenshot({path:'/tmp/guiding-trinity-sun-animation.png'});
  await page.evaluate(()=>document.getElementById('logo-proof').remove());
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  assert(await page.$eval('.workspace-brand .tl-sun-stage',e=>getComputedStyle(e).opacity==='0'&&getComputedStyle(e).animationName==='none'));
  assert(await page.$eval('.workspace-brand .tl-body',e=>getComputedStyle(e).opacity==='1'&&getComputedStyle(e).animationName==='none'));
  await page.emulateMediaFeatures([]);await page.evaluate(()=>document.documentElement.dataset.guidingMotion='false');
  assert(await page.$eval('.workspace-brand .tl-sun-stage',e=>getComputedStyle(e).opacity==='0'&&getComputedStyle(e).animationName==='none'));
  await go('/dashboard/communication/meeting');await page.waitForSelector('.meeting-space');
  await page.type('input[name="name"]','Unser Gartenraum');await page.type('input[name="url"]','https://meet.example.test/garten');await page.click('button[type="submit"]');
  await page.waitForFunction(()=>document.body.innerText.includes('Dein Raumlink ist gespeichert.'));
  assert.equal(await page.$eval('.meeting-rooms a[target="_blank"]',e=>e.href),'https://meet.example.test/garten');
  await page.type('input[name="url"]','https://meet.example.test/garten');await page.click('button[type="submit"]');await page.waitForFunction(()=>document.body.innerText.includes('schon gespeichert'));
  assert.equal(await page.$$eval('.meeting-rooms a[target="_blank"]',es=>es.length),1);
  await page.$eval('input[name="url"]',e=>{e.value='https://person:secret@example.test/raum';});await page.click('button[type="submit"]');await page.waitForFunction(()=>document.body.innerText.includes('ohne Zugangsdaten'));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('trinity-personal-v1')).state.customLinks.length),1);
  await go('/dashboard/communication/phone');await page.waitForSelector('.phone-space');
  await page.type('input[type="tel"]','+43 (1) 234 567');assert.equal(await page.$eval('a[href^="tel:"]',e=>e.getAttribute('href')),'tel:+431234567');
  await go('/dashboard/communication/meeting');assert.equal(await page.$$eval('.meeting-rooms a[target="_blank"]',es=>es.length),1);
  await page.screenshot({path:'/tmp/guiding-communication-desktop.png'});
  for(const width of [320,390]){await page.setViewport({width,height:844});await go('/dashboard/communication/meeting');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`/tmp/guiding-meeting-${width}.png`});}
  await page.click('[aria-label="Unser Gartenraum entfernen"]');await page.waitForFunction(()=>document.body.innerText.includes('Dein Raum wartet.'));
  await go('/dashboard/contacts');await page.click('.workspace-content details summary');await page.type('.workspace-content input[name="name"]','Testkontakt');await page.type('.workspace-content input[name="phone"]','+43 123456');await page.type('.workspace-content input[name="email"]','fixture@example.test');await page.$eval('.workspace-content details form button',e=>e.scrollIntoView({block:'center',behavior:'instant'}));assert(await page.$eval('.workspace-content details form button',e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e;}),'Contact save must be reachable above mobile navigation');await page.click('.workspace-content details form button');await page.waitForSelector('.s-grid a[href="tel:+43123456"]');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);
  console.log(JSON.stringify({passed:true,layeredSun:true,transparentAsset:true,motionPreferences:true,communicationNavigation:true,meetingPersistence:true,duplicateAndCredentialRejection:true,telephone:true,mobile:[320,390],realProviderCalls:false,errors}));
}catch(e){console.error(await page.evaluate(()=>({text:document.querySelector('.workspace-content')?.innerText,form:[...document.querySelectorAll('.workspace-content input')].map(e=>({name:e.name,value:e.value,valid:e.checkValidity()})),contacts:localStorage.getItem('trinity-contacts-v1')})));await page.screenshot({path:'/tmp/guiding-logo-communication-failure.png'});throw e;}finally{await browser.close();}
