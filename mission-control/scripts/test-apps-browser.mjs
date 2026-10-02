// Local synthetic fixtures only. No live accounts, streams, provider calls or writes.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3308";
assert(["127.0.0.1","localhost"].includes(new URL(base).hostname));
assert(process.env.TEST_BROWSER_PATH,"Set TEST_BROWSER_PATH.");
const browser = await puppeteer.launch({ executablePath:process.env.TEST_BROWSER_PATH, headless:true, args:["--disable-extensions"] });
const page = await browser.newPage();
const errors = [], apiCalls = [], writes = [], stationCalls = [], unexpectedWrites = [];
let failSave = true, failList = false, failDirectory = false, owner = "00000000-0000-4000-8000-000000000001";
let notes = [];
const oldOwner = owner;
await mkdir("/tmp/trinity-apps-screens",{recursive:true});
page.on("pageerror",e => errors.push(e.message));
await page.evaluateOnNewDocument(() => {
  window.__appWrites = []; window.__audio = { plays:0, pauses:0 };
  const original = window.fetch;
  window.fetch = (input,init) => {
    if (init?.body instanceof FormData) window.__appWrites.push({ id:init.body.get("id"),note:JSON.parse(init.body.get("note")) });
    return original(input,init);
  };
  HTMLMediaElement.prototype.play = async function() { window.__audio.plays++; this.dispatchEvent(new Event("playing")); };
  HTMLMediaElement.prototype.pause = function() { window.__audio.pauses++; this.dispatchEvent(new Event("pause")); };
  HTMLMediaElement.prototype.load = function() {};
});
await page.setRequestInterception(true);
page.on("request",async request => {
  try {
    const url = new URL(request.url());
    if (url.hostname.endsWith("api.radio-browser.info")) {
      stationCalls.push(url.search);
      const search = url.searchParams.get("name") || url.searchParams.get("tag");
      if (search === "langsam") await new Promise(resolve => setTimeout(resolve,650));
      if (failDirectory) return request.respond({status:503,headers:{"Access-Control-Allow-Origin":"*"},body:"unavailable"});
      const station = { stationuuid: search === "langsam" ? "old" : "station-1",name:search === "langsam" ? "Alter Sender" : "Salon Jazz",url_resolved:"https://stream.example.test/live",country:"Österreich",tags:"jazz,soul" };
      return request.respond({status:200,headers:{"Access-Control-Allow-Origin":"*"},contentType:"application/json",body:JSON.stringify([station,station,{ ...station,stationuuid:"unsafe",url_resolved:"http://stream.example.test/live" }])});
    }
    if (url.origin !== base) return request.abort("blockedbyclient");
    if (!url.pathname.startsWith("/api/")) return request.continue();
    apiCalls.push(url.pathname + url.search);
    if (request.method() !== "GET" && !(url.pathname === "/api/notes" && request.method() === "POST")) { unexpectedWrites.push(url.pathname); return request.abort("blockedbyclient"); }
    let data = {success:true},status = 200;
    if (url.pathname === "/api/auth/me") data = { authenticated:true,hasTrinityAccess:true,userId:owner,products:["foerder"],displayName:"Testmitglied" };
    else if (url.pathname === "/api/notes" && request.method() === "POST") {
      const submission = await page.evaluate(() => window.__appWrites.at(-1));
      writes.push(submission);
      if (failSave) { failSave = false; status = 503; data = {error:"Speichern unterbrochen. Entwurf bleibt erhalten."}; }
      else {
        if (!notes.some(n => n.id === submission.id)) notes.unshift({ ...submission.note,id:submission.id,user_id:owner,created_at:new Date().toISOString(),audio_path:null });
        data = { success:true,id:submission.id,created:true };
      }
    } else if (url.pathname === "/api/notes") {
      if (failList) { status = 503; data = {error:"Buch vorübergehend nicht erreichbar."}; }
      else data = { success:true,notes:notes.filter(n => n.user_id === owner && n.tags.includes(url.searchParams.get("tag")) && (!url.searchParams.get("before") || n.created_at < url.searchParams.get("before"))).slice(0,50) };
    } else if (url.pathname === "/api/search") data = { success:true,userId:owner,items:[] };
    else assert.equal(request.method(),"GET","Unexpected write blocked");
    await request.respond({status,contentType:"application/json",body:JSON.stringify(data)});
  } catch { /* deliberately obsolete browser requests may have been canceled */ }
});
async function textContains(text) { await page.waitForFunction(t => document.querySelector("#workspace-content")?.textContent.includes(t),{},text); }
async function clickText(text) {
  await page.evaluate(t => {
    const button = [...document.querySelectorAll("#workspace-content button")].find(b => b.textContent.trim() === t);
    if (!button) throw Error("Missing button: " + t); button.scrollIntoView({block:"center",behavior:"instant"}); button.click();
  },text);
}
async function checkLayout() {
  assert.equal(await page.evaluate(() => document.querySelector("#workspace-content").scrollWidth > document.querySelector("#workspace-content").clientWidth + 1),false,"Content overflow");
  const undersized = await page.$$eval("#workspace-content button:not(:disabled), #workspace-content input:not([type=range]), #workspace-content select",els => els.filter(e => e.getBoundingClientRect().height < 43).map(e => e.outerHTML.slice(0,130)));
  assert.deepEqual(undersized,[]);
}
try {
  await page.setViewport({width:1280,height:950});
  await page.goto(base + "/dashboard/apps",{waitUntil:"networkidle0"});
  assert.equal(await page.$$eval(".app-card",es => es.length),9);
  assert.equal(await page.$$eval(".app-card img",es => es.every(e => e.complete && e.naturalWidth > 0)),true);
  await page.screenshot({path:"/tmp/trinity-apps-screens/catalog.png"});
  await page.setViewport({width:390,height:844}); await checkLayout();
  for (const slug of ["visual-room","frequency-room","art-atelier","good-news","living-arts-room","kinoraum"]) {
    await page.goto(base + "/dashboard/apps/" + slug,{waitUntil:"networkidle0"}); await checkLayout();
    if (slug !== "kinoraum") assert.equal(await page.$eval(".app-action",a => a.target),"_blank");
    else await textContains("Filmprogramm");
  }
  await page.goto(base + "/dashboard/apps/kochbuch",{waitUntil:"networkidle0"});
  await textContains("Die erste Seite wartet"); await checkLayout();
  await page.type("#recipe-title","Gartensuppe"); await page.type("#recipe-ingredients","1 Kürbis\n2 Kartoffeln"); await page.type("#recipe-method","Kochen und pürieren."); await page.select("#recipe-season","Herbst");
  await clickText("In meinem Buch speichern"); await textContains("Speichern unterbrochen");
  assert.equal(await page.$eval("#recipe-title",e => e.value),"Gartensuppe");
  await clickText("In meinem Buch speichern"); await textContains("Dein Rezept liegt jetzt");
  await page.waitForSelector(".recipe-entry"); assert.equal(writes[0].id,writes[1].id,"Retry must reuse idempotent note id");
  assert.equal(await page.$eval("#recipe-title",e => e.value),"");
  await page.click(".recipe-entry summary"); await textContains("2 Kartoffeln");
  await page.type("#recipe-search","unauffindbar"); await textContains("Kein passendes Rezept"); await clickText("Filter zurücksetzen"); await page.waitForSelector(".recipe-entry");
  await page.screenshot({path:"/tmp/trinity-apps-screens/cookbook-mobile.png"});
  failList = true; await page.reload({waitUntil:"networkidle0"}); await textContains("Buch vorübergehend");
  assert.equal(await page.$$(".recipe-entry").then(es => es.length),0); failList = false; await clickText("Buch erneut öffnen"); await page.waitForSelector(".recipe-entry");
  // Verify a new owner never receives old-owner fixtures or old list append.
  owner = "00000000-0000-4000-8000-000000000099"; await page.reload({waitUntil:"networkidle0"}); await textContains("Die erste Seite wartet");
  assert.equal(await page.$$(".recipe-entry").then(es => es.length),0); owner = oldOwner;
  const recipe = notes[0];
  notes = Array.from({length:51},(_,i) => ({ ...recipe,id:`00000000-0000-4000-8000-${String(i+100).padStart(12,"0")}`,title:`Buchseite ${i+1}`,created_at:new Date(Date.UTC(2026,0,1) - i*1000).toISOString() }));
  await page.reload({waitUntil:"networkidle0"}); await page.waitForFunction(() => document.querySelectorAll(".recipe-entry").length === 50);
  failList = true; await clickText("Weitere Buchseiten laden"); await textContains("Buch vorübergehend");
  assert.equal(await page.$$(".recipe-entry").then(es => es.length),50,"A page error must preserve previous pages");
  failList = false; await clickText("Buch erneut öffnen"); await page.waitForFunction(() => document.querySelectorAll(".recipe-entry").length === 51);
  const retried = apiCalls.filter(u => u.startsWith("/api/notes?") && u.includes("before="));
  assert.equal(retried.at(-1),retried.at(-2),"Retry must retain the failed page cursor");
  // A changed owner while paging must reset the library before a first-page read.
  await page.reload({waitUntil:"networkidle0"});
  await page.type("#recipe-title","Neues Rezept"); await page.type("#recipe-ingredients","Karotten"); await page.type("#recipe-method","Kochen.");
  failSave = true; await clickText("In meinem Buch speichern"); await textContains("Speichern unterbrochen"); const previousOwnerId = writes.at(-1).id;
  owner = "00000000-0000-4000-8000-000000000099";
  await clickText("Weitere Buchseiten laden"); await textContains("Die erste Seite wartet");
  assert.equal(await page.$$(".recipe-entry").then(es => es.length),0); assert(!apiCalls.at(-1).includes("before="));
  await clickText("In meinem Buch speichern"); await textContains("Dein Rezept liegt jetzt");
  assert.notEqual(writes.at(-1).id,previousOwnerId,"A different owner must never reuse a previous account's retry id");
  owner = oldOwner;
  await page.goto(base + "/dashboard/apps/radio",{waitUntil:"networkidle0"});
  await page.waitForSelector(".radio-stations .radio-tune"); await checkLayout();
  assert.equal(await page.$$eval(".radio-stations .radio-tune",es => es.length),1,"Unsafe streams and duplicate stations must be excluded");
  assert.equal(await page.evaluate(() => window.__audio.plays),0,"No autoplay on entry");
  await page.click(".radio-tune"); await page.waitForSelector(".radio-lamp.is-on");
  await page.click(".radio-remember"); await textContains("Salon Jazz wurde");
  assert.equal(writes.at(-1).note.tags[0],"radiofavorit");
  await page.waitForFunction(() => [...document.querySelectorAll(".radio-remember")].every(b => b.disabled));
  await page.screenshot({path:"/tmp/trinity-apps-screens/radio-mobile.png"});
  await page.type("#radio-search","langsam"); await clickText("Suchen");
  await page.$eval("#radio-search",e => { e.setSelectionRange(0,e.value.length); }); await page.focus("#radio-search"); await page.keyboard.press("Backspace"); await page.type("#radio-search","neu"); await clickText("Suchen");
  await page.waitForFunction(() => document.querySelector("#radio-results").textContent.includes("neu") && document.querySelector("#radio-results").parentElement.querySelector(".radio-tune")?.textContent.includes("Salon Jazz"));
  await new Promise(resolve => setTimeout(resolve,750));
  assert.equal(await page.$eval("#radio-results",e => e.parentElement.textContent.includes("Alter Sender")),false);
  failDirectory = true; await clickText("Reggae & Dub"); await textContains("Senderverzeichnis antwortet"); failDirectory = false; await clickText("Erneut suchen"); await page.waitForSelector("#radio-results + .radio-stations");
  await page.setViewport({width:1280,height:950}); await page.$eval("#workspace-content",e => { e.scrollTop = 0; }); await page.screenshot({path:"/tmp/trinity-apps-screens/radio-desktop.png"});
  const beforePause = await page.evaluate(() => window.__audio.pauses);
  await page.click(".radio-room > .app-back"); await page.waitForSelector(".apps-catalog");
  assert((await page.evaluate(() => window.__audio.pauses)) > beforePause,"Radio cleanup on SPA navigation");
  assert.deepEqual(errors,[]);
  assert.deepEqual(unexpectedWrites,[]);
  console.log(JSON.stringify({passed:true,cards:9,details:6,simulatedWrites:writes.length,stationRequests:stationCalls.length,consoleErrors:errors,privateReads:apiCalls.filter(s => s.startsWith("/api/notes?")).length,screenshots:"/tmp/trinity-apps-screens",fixture:true}));
} catch(error) {
  await page.screenshot({path:"/tmp/trinity-apps-screens/failure.png"}).catch(() => {});
  console.error(JSON.stringify({url:page.url(),errors,body:await page.$eval("#workspace-content",e => e.innerText).catch(() => "")})); throw error;
} finally { await browser.close(); }
