import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { neoApps } from "../lib/apps/catalog";
import { recipeNote, radioNote, savedStation, secureUrl, stationOf } from "../lib/apps/collections";
import { noteOf } from "../lib/voice/validation";
import { searchStations } from "../lib/apps/radio";

test("all nine apps have one stable entry, a local thumbnail and no fictitious account migration", () => {
  assert.equal(neoApps.length,9); assert.equal(new Set(neoApps.map(a => a.slug)).size,9);
  for (const app of neoApps) {
    assert(existsSync(`public/apps/${app.slug}.svg`));
    assert(!readFileSync(`public/apps/${app.slug}.svg`,"utf8").includes("https://"));
    if (app.state === "trinity") assert(existsSync("app" + app.href + "/page.tsx"));
    else { assert.equal(app.href,`/dashboard/apps/${app.slug}`); assert(existsSync("app/dashboard/apps/[slug]/page.tsx")); }
    if (app.state === "legacy") assert(app.legacyUrl?.endsWith(".youareneo.com/"));
  }
});
test("recipes use existing private note contracts, fit limits and remain readable in the normal notes UI", () => {
  const recipe = recipeNote(" Suppe ","Kürbis\n200 g Kartoffeln","Kochen\nPürieren","Herbst");
  assert.deepEqual(noteOf(recipe),recipe); assert.equal(recipe.title,"Suppe");
  assert(recipe.transcript.includes("Zutaten\nKürbis")); assert.deepEqual(recipe.tags,["kochbuch","herbst"]);
  assert.doesNotThrow(() => noteOf(recipeNote("A".repeat(200),"B".repeat(8000),"C".repeat(10000),"Ganzjährig")));
});
test("station inputs reject unsafe or credential-bearing URLs and corrupt saved favorites", () => {
  for (const url of ["javascript:alert(1)","http://stream.test/a","https://u:p@stream.test/a", "//stream.test/a"]) assert.equal(secureUrl(url),"");
  assert.equal(stationOf({ id:"s", name:"Radio", stream:"javascript:alert(1)" }),null);
  const station = stationOf({ stationuuid:"uuid-1", name:"Radio", url_resolved:"https://stream.test/a", country:"AT", tags:"jazz" })!;
  const note = radioNote(station); assert.deepEqual(noteOf(note),note);
  assert.deepEqual(savedStation({ ...note,id:"note",created_at:"",audio_path:null }),station);
  assert.equal(savedStation({ ...note,transcript:"broken",id:"note",created_at:"",audio_path:null }),null);
});
test("directory search retries mirrors, excludes unsafe streams, deduplicates and caches without credentials", async () => {
  const original = globalThis.fetch; const calls: URL[] = [];
  globalThis.fetch = async (input,init) => {
    const url = new URL(String(input)); calls.push(url);
    assert.equal(init?.credentials,"omit"); assert.equal(url.searchParams.get("countrycode"),"AT");
    if (url.hostname.startsWith("de1")) return new Response("unavailable",{ status:503 });
    return Response.json([{ stationuuid:"same",name:"Sender",url_resolved:"https://stream.test/live" },{ stationuuid:"same",name:"Duplikat",url_resolved:"https://stream.test/live" },{ stationuuid:"http",name:"Unsicher",url_resolved:"http://stream.test/live" }]);
  };
  try {
    const controller = new AbortController();
    const result = await searchStations("fixture-cache",[],"AT",controller.signal);
    assert.equal(result.length,1); assert.equal(result[0].name,"Sender"); assert.equal(calls.length,4);
    await searchStations("fixture-cache",[],"AT",controller.signal); assert.equal(calls.length,4);
  } finally { globalThis.fetch = original; }
});
test("aborting an obsolete directory request stops fallback and never caches its results", async () => {
  const original = globalThis.fetch; const controller = new AbortController(); let calls = 0;
  globalThis.fetch = async () => { calls++; controller.abort(); throw new DOMException("Aborted","AbortError"); };
  try { await assert.rejects(searchStations("",["obsolete"],"",controller.signal),{name:"AbortError"}); assert.equal(calls,1); }
  finally { globalThis.fetch = original; }
});
