// Lighthouse against local fixtures only: no accounts, secrets, mail or provider calls.
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';

const base = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:3308');
assert(['127.0.0.1', 'localhost'].includes(base.hostname), 'Only localhost is allowed.');
assert(process.env.TEST_BROWSER_PATH, 'Set TEST_BROWSER_PATH to a local Chromium browser.');
const runs = Number(process.env.AUDIT_RUNS || 3);
assert(Number.isInteger(runs) && runs >= 1 && runs <= 5, 'Use 1–5 runs.');
const appsSuite = process.env.AUDIT_SUITE === 'apps';
const output = resolve(process.env.AUDIT_OUTPUT_DIR || (appsSuite ? '/tmp/trinity-apps-audit' : '/tmp/trinity-workspace-audit'));
const suiteRoutes = appsSuite ? ['/dashboard/apps', '/dashboard/apps/radio', '/dashboard/apps/kochbuch'] : ['/login', '/notiz', '/dashboard', '/dashboard/vision/tasks', '/dashboard/kanban', '/dashboard/goals', '/dashboard/calendar', '/dashboard/labor', '/dashboard/projekte', '/dashboard/communication/meeting', '/dashboard/contacts'];
const routes = process.env.AUDIT_ROUTES ? process.env.AUDIT_ROUTES.split(',') : suiteRoutes;
assert(routes.length > 0 && routes.every(route => suiteRoutes.includes(route)), 'Select only routes from this audit suite.');
const userId = '00000000-0000-4000-8000-000000000001';
const note = { id: '00000000-0000-4000-8000-000000000002', title: 'Testgedanke',
  transcript: 'Ein rein lokaler Testgedanke.', summary: 'Lokale Beispielnotiz',
  type: 'notiz', project: null, tags: [], source: 'text', audio_path: null,
  created_at: '2026-10-01T10:00:00Z' };
const chunkDir = resolve('.next/static/chunks');
const graphChunks = [];
for (const name of await readdir(chunkDir)) {
  if (name.endsWith('.js') && (await readFile(resolve(chunkDir, name), 'utf8')).includes('WebGLRenderer'))
    graphChunks.push('/_next/static/chunks/' + name);
}
assert(graphChunks.length > 0, 'Build first: expected a separately built 3D chunk.');
const browser = await puppeteer.launch({ executablePath: process.env.TEST_BROWSER_PATH,
  headless: true, defaultViewport: null, ignoreDefaultArgs: ['--enable-automation'],
  args: ['--disable-extensions'] });
try {
  await mkdir(output, { recursive: true });
  const results = [];
  for (const route of routes) {
    for (let run = 1; run <= runs; run++) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      let writes = 0, external = 0;
      await page.setRequestInterception(true);
      page.on('request', async request => {
        if (request.isInterceptResolutionHandled()) return;
        const url = new URL(request.url());
        if (['data:', 'blob:'].includes(url.protocol)) return request.continue();
        if (url.origin !== base.origin) {
          if (appsSuite && url.hostname.endsWith('api.radio-browser.info') && request.method() === 'GET') return request.respond({ status:200, headers:{'Access-Control-Allow-Origin':'*'}, contentType:'application/json', body:JSON.stringify([{ stationuuid:'fixture-radio', name:'Salon Jazz', url_resolved:'https://stream.example.test/live', country:'Österreich', tags:'jazz' }]) });
          external++;
          // A local transparent image keeps fixture favicons independent of providers.
          if (request.resourceType() === 'image') return request.respond({ status: 200,
            contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64') });
          return request.abort('blockedbyclient');
        }
        if (!url.pathname.startsWith('/api/')) return request.continue();
        if (request.method() !== 'GET') { writes++; return request.abort('blockedbyclient'); }
        const bodies = {
          '/api/auth/me': { authenticated: true, hasTrinityAccess: true, displayName: 'Testmitglied', userId, products:['foerder'] },
          '/api/voice/config': { success: true, canSave: true, userId, provider: 'infomaniak',
            transcriptionReady: false, classificationReady: false,
            limits: { minutes: 60, requests: 100 }, usage: { voice_seconds: 0, requests: 0 } },
          '/api/notes': { success: true, notes: appsSuite ? (url.searchParams.get('tag') === 'kochbuch' ? [{ ...note, title:'Gartensuppe', transcript:'Zutaten\nKürbis\n\nZubereitung\nKochen\n\nJahreszeit: Herbst', tags:['kochbuch','herbst'] }] : []) : [note] },
          '/api/notes/projects': { success: true, projects: ['Atelier'] },
          '/api/brain': {success:true,graph:{truncated:false,nodes:[{id:'project:Atelier',label:'Atelier',type:'projekt',summary:'Lokales Beispielprojekt',href:'/notiz?project=Atelier',createdAt:'2026-10-01T10:00:00Z',degree:1},{id:'note:'+note.id,label:note.title,type:'notiz',summary:note.summary,href:'/notiz?note='+note.id,createdAt:note.created_at,degree:1}],links:[{source:'note:'+note.id,target:'project:Atelier',kind:'projekt'}]}},
          '/api/crm/contacts': {success:true,userId,contacts:[{id:'hubspot:fixture',name:'Beispielkontakt',email:'fixture@example.test',company:'Atelier',workspace:'organization',source:'hubspot',updatedAt:'2026-10-01T10:00:00Z'}],providers:[{id:'hubspot',ready:false},{id:'ghl',ready:false}],mailReady:false},
          '/api/notes/queue': { success: true, queue: [] },
          '/api/search': { success: true, userId, items: [] },
          '/api/kanban': { success: true, data: [] },
        };
        await request.respond({ status: 200, contentType: 'application/json',
          body: JSON.stringify(bodies[url.pathname] || { success: true, data: [] }) });
      });
      const cdp = await page.createCDPSession();
      await cdp.send('Network.clearBrowserCache');
      await cdp.detach();
      const { lhr } = await lighthouse(base.origin + route, { logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        disableStorageReset: true }, { extends: 'lighthouse:default', settings: {
          formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823,
            deviceScaleFactor: 1.75, disabled: false } } }, page);
      assert(!lhr.runtimeError, 'Lighthouse failed: ' + lhr.runtimeError?.code);
      assert.equal(new URL(lhr.finalDisplayedUrl).pathname, route, 'Unexpected redirect.');
      assert.equal(writes, 0, 'An unexpected write was blocked.');
      const scripts = lhr.audits['network-requests'].details.items.filter(item => item.resourceType === 'Script');
      const loadedGraphChunks = scripts.filter(item => graphChunks.includes(new URL(item.url).pathname)).map(item => new URL(item.url).pathname);
      if (route !== '/dashboard/calendar') assert.equal(loadedGraphChunks.length, 0, 'A core route loaded the 3D renderer.');
      const entry = { route, run, fixture: true, source: 'local production build',
        fetchTime: lhr.fetchTime, lighthouseVersion: lhr.lighthouseVersion,
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        metrics: Object.fromEntries(['largest-contentful-paint', 'total-blocking-time',
          'cumulative-layout-shift', 'speed-index'].map(key => [key, lhr.audits[key].numericValue])),
        console: lhr.audits['errors-in-console'].details?.items || [],
        lcpDetails: lhr.audits['lcp-breakdown-insight']?.details,
        js: scripts
          .map(({ url, transferSize, resourceSize }) => ({ path: new URL(url).pathname, transferSize, resourceSize })),
        findings: Object.entries(lhr.audits).filter(([, value]) => value.score !== null && value.score < 1)
          .map(([id, value]) => ({ id, title: value.title, score: value.score,
            displayValue: value.displayValue, details: value.details })),
        settings: { throttling: lhr.configSettings.throttling, screenEmulation: lhr.configSettings.screenEmulation },
        graphChunksNotLoaded: graphChunks.filter(path => !loadedGraphChunks.includes(path)),
        loadedGraphChunks,
        blockedExternalRequests: external, blockedWrites: writes, warnings: lhr.runWarnings };
      await writeFile(resolve(output, route.slice(1).replaceAll('/', '-') + '-' + run + '.json'), JSON.stringify(entry, null, 2));
      results.push(entry);
      console.log(JSON.stringify({ route, run, performance: entry.performance,
        accessibility: entry.accessibility, errors: entry.console.length, external }));
      await context.close();
    }
  }
  const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const summary = routes.map(route => {
    const entries = results.filter(entry => entry.route === route);
    return { route, runs, performance: median(entries.map(entry => entry.performance)),
      accessibility: median(entries.map(entry => entry.accessibility)),
      lcp: median(entries.map(entry => entry.metrics['largest-contentful-paint'])),
      cls: median(entries.map(entry => entry.metrics['cumulative-layout-shift'])),
      tbt: median(entries.map(entry => entry.metrics['total-blocking-time'])),
      consoleErrors: Math.max(...entries.map(entry => entry.console.length)),
      jsBytes: median(entries.map(entry => entry.js.reduce((total, item) => total + item.resourceSize, 0))) };
  });
  await writeFile(resolve(output, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ summary, fixture: true }));
} finally { await browser.close(); }
