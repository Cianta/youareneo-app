// Local browser fixtures; no live account, provider calls or mail.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3310';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
assert(process.env.TEST_BROWSER_PATH);
const output=process.env.TEST_OUTPUT_DIR||'/tmp/guiding-wordmark-proof';
await fs.mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.TEST_BROWSER_PATH,headless:true});
const page=await browser.newPage(),errors=[],external=[],writes=[];
page.on('pageerror',e=>errors.push(e.message));
await page.setRequestInterception(true);
page.on('request',async r=>{
  const url=new URL(r.url());
  if(['data:','blob:'].includes(url.protocol))return r.continue();
  if(url.origin!==base){external.push(url.hostname);return r.abort();}
  if(!url.pathname.startsWith('/api/'))return r.continue();
  if(r.method()!=='GET'){writes.push(url.pathname);return r.abort();}
  const body=url.pathname==='/api/auth/me'?{authenticated:true,hasTrinityAccess:true,displayName:'Testmitglied',userId:'fixture'}:{success:true,notes:[],nodes:[],links:[],truncated:false,data:[],queue:[],projects:[],canSave:false,userId:'fixture',limits:{minutes:60,requests:100},usage:{voice_seconds:0,requests:0}};
  return r.respond({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
const go=async route=>{await page.goto(base+route,{waitUntil:'networkidle0'});await page.waitForSelector('.workspace-sidebar .s-cosmos-frame');};
const shot=async name=>page.screenshot({path:path.join(output,name+'.png')});
async function bottomRow(){
  return page.$$eval('.sidebar-dock-bottom > *',es=>es.map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height,reachable:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a,button')===e};}));
}
try{
  await page.setViewport({width:1440,height:900});await go('/notiz');
  assert.equal(await page.$eval('.workspace-shell',e=>e.dataset.sidebarCollapsed),'false');
  assert.equal(await page.$$('.sidebar-collapse').then(es=>es.length),1);
  assert(await page.$eval('.workspace-brand',e=>e.getAttribute('aria-label')==='guiding.space'));
  assert(await page.$eval('.workspace-brand .ivory-wordmark svg',e=>e.getAttribute('aria-hidden')==='true'));
  const offset=await page.$eval('.sidebar-cosmos',e=>parseFloat(getComputedStyle(e).marginTop));
  assert(Math.abs(offset-75.59)<1,'Astro offset is 2 cm');
  const row=await bottomRow();assert.deepEqual(row.map(e=>e.label),['Meine Apps','Hilfe & Tastenkürzel','Menü einklappen']);
  assert(row.every(e=>e.reachable&&e.h>=24&&e.w>=24));
  await shot('wordmark-desktop');
  await page.click('.sidebar-collapse');await page.waitForFunction(()=>document.querySelector('.workspace-shell').dataset.sidebarCollapsed==='true');
  const compact=await bottomRow();assert(compact.every(e=>e.reachable&&e.w>=24&&e.h>=24));
  const sidebarRight=await page.$eval('.workspace-sidebar',e=>e.getBoundingClientRect().right);
  assert(compact.every(e=>e.x+e.w<=sidebarRight),'Compact controls must stay inside the sidebar');
  assert(Math.max(...compact.map(e=>e.y))-Math.min(...compact.map(e=>e.y))<2,'All three compact icons share one row');
  assert(compact[0].x+compact[0].w<=compact[1].x&&compact[1].x+compact[1].w<=compact[2].x);
  await shot('wordmark-collapsed');
  await page.click('.sidebar-help');await page.waitForSelector('dialog[open]');
  assert((await page.$eval('dialog[open]',e=>e.innerText)).includes('Tastenkürzel'));
  await page.keyboard.press('Escape');
  await go('/gehirn');assert.equal(await page.$eval('.workspace-shell',e=>e.dataset.sidebarCollapsed),'true');
  await page.reload({waitUntil:'networkidle0'});assert.equal(await page.$eval('.workspace-shell',e=>e.dataset.sidebarCollapsed),'true');
  await page.click('.sidebar-collapse');await page.waitForFunction(()=>document.querySelector('.workspace-shell').dataset.sidebarCollapsed==='false');
  await page.setViewport({width:1280,height:600});await go('/notiz');
  assert((await bottomRow()).every(e=>e.reachable));
  assert(await page.$eval('#workspace-navigation',e=>e.clientHeight>80));
  await shot('wordmark-short-screen');
  await page.setViewport({width:1440,height:900});
  await page.evaluate(()=>{localStorage.setItem('trinity-display-voice',JSON.stringify({appearanceVersion:2,brightness:0,sound:false}));});
  await page.reload({waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.documentElement.style.colorScheme==='dark');
  await shot('wordmark-dark');
  const cdp=await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'}]});
  assert(await page.$eval('.ivory-wordmark svg',e=>getComputedStyle(e).display==='none'));
  assert(await page.$eval('.ivory-wordmark-text',e=>getComputedStyle(e).position==='static'));
  await cdp.send('Emulation.setEmulatedMedia',{features:[]});
  await page.evaluate(()=>{localStorage.setItem('trinity-display-voice',JSON.stringify({appearanceVersion:2,brightness:100,sound:false}));});
  for(const width of [320,390]){
    await page.setViewport({width,height:844});await go('/notiz');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert(await page.$eval('.workspace-mobile-brand .ivory-wordmark',e=>e.getBoundingClientRect().width>100));
    await shot('wordmark-mobile-'+width);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);
  console.log(JSON.stringify({passed:true,astroOffsetCm:2,compactIcons:compact,manualCollapsePersistsAcrossRoutesAndReload:true,helpWorksCollapsed:true,shortScreenHeight:600,mobile:[320,390],forcedColors:true,realProviderCalls:0,errors}));
}catch(e){await shot('wordmark-failure');throw e;}finally{await browser.close();}
