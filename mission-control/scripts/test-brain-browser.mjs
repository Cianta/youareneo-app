// Local UI regression using synthetic data only, never a real account/provider.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3308';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Local fixture only');
if(!process.env.TEST_BROWSER_PATH)throw Error('TEST_BROWSER_PATH required');
const browser=await puppeteer.launch({executablePath:process.env.TEST_BROWSER_PATH,headless:true,args:['--disable-extensions']});
try{
 const page=await browser.newPage();await page.setViewport({width:390,height:844});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let fail=false,empty=false;
 const nodes=Array.from({length:2000},(_,i)=>({id:'note:'+i,label:i===0?'Atelier Gedanke':'Gedanke '+i,type:i%2?'aufgabe':'notiz',summary:'Fiktiver Testinhalt',href:'/notiz?note='+i,createdAt:'2026-10-01T00:00:00Z',degree:2}));
 const graph={nodes,links:nodes.slice(1).map((n,i)=>({source:'note:'+i,target:n.id,kind:'tag'})),truncated:false};
 await page.setRequestInterception(true);page.on('request',async r=>{try{const u=new URL(r.url());if(u.origin!==base)return await r.respond({status:200,body:''});if(!u.pathname.startsWith('/api/'))return await r.continue();if(u.pathname==='/api/brain')return await r.respond({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Testfehler'}:{success:true,graph:empty?{nodes:[],links:[],truncated:false}:graph})});await r.respond({status:200,contentType:'application/json',body:JSON.stringify({success:true,items:[],userId:'fixture'})});}catch{}});
 const start=performance.now();await page.goto(base+'/gehirn',{waitUntil:'networkidle0'});await page.waitForSelector('.brain-canvas canvas',{timeout:30000});
 assert.equal(await page.$eval('.brain-toolbar select',e=>e.value),'2d');assert.equal(await page.$eval('.brain-toolbar option[value="3d"]',e=>e.disabled),true);
 assert.equal(await page.$$eval('.brain-results button',es=>es.length),2000);
 await page.type('input[type=search]','Atelier');await page.waitForFunction(()=>document.querySelectorAll('.brain-results button').length===1);
 await page.click('.brain-results button');assert.equal(await page.$eval('.brain-preview a',e=>e.getAttribute('href')),'/notiz?note=0');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/trinity-brain-mobile.png',fullPage:true});
 fail=true;await page.click('.brain-toolbar button');await page.waitForSelector('[role=alert]');fail=false;empty=true;await page.click('[role=alert] button');await page.waitForFunction(()=>document.body.innerText.includes('Dein Wissensraum ist noch leer'));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,fixtureNodes:2000,elapsedMs:Math.round(performance.now()-start),mobile:'390px',mode:'2d',checks:['search','preview','retry','empty','no overflow','no page errors']}));
}finally{await browser.close();}
