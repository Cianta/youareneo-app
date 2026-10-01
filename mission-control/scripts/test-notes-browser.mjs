// Local-only fixtures. No real accounts, secrets, notes, audio or providers.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const base = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:3308');
assert(['127.0.0.1', 'localhost'].includes(base.hostname), 'Local fixtures only.');
assert(process.env.TEST_BROWSER_PATH, 'TEST_BROWSER_PATH required.');
const browser = await puppeteer.launch({ executablePath: process.env.TEST_BROWSER_PATH, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const errors = [], requests = [], releases = new Map();
  let failList = true, failMore = true, delayConfig = false, writes = 0;
  page.on('dialog', dialog => dialog.accept());
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluateOnNewDocument(() => {
    const original = window.fetch.bind(window);
    window.fixtureAborted = 0;
    window.fetch = (input, options) => {
      const url = String(input);
      if (url.startsWith('/api/notes?')) {
        options?.signal?.addEventListener('abort', () => window.fixtureAborted++, { once: true });
        // Model a transport whose already-started response ignores cancellation.
        if (url.includes('q=ignoriert')) return original(input, { ...options, signal: undefined });
      }
      return original(input, options);
    };
  });
  const note = (index, title = 'Gedanke ' + index) => ({
    id: '00000000-0000-4000-8000-' + String(index).padStart(12, '0'), title,
    transcript: 'Lokaler Testtext', summary: '', tags: [], type: 'notiz', project: null,
    source: 'text', audio_path: null, created_at: new Date(Date.UTC(2026, 8, 30, 12, 0, -index)).toISOString(),
  });
  const initial = note(1, 'Erster Gedanke');
  await page.setRequestInterception(true);
  page.on('request', async request => {
    try {
      const url = new URL(request.url());
      if (url.origin !== base.origin) return await request.abort('blockedbyclient');
      if (!url.pathname.startsWith('/api/')) return await request.continue();
      if (request.method() !== 'GET') { writes++; return await request.abort('blockedbyclient'); }
      let body = { success: true }, status = 200;
      if (url.pathname === '/api/voice/config') {
        if (delayConfig) await new Promise(resolve => releases.set('config', resolve));
        body = { canSave: true, userId: 'local-fixture',
        provider: 'infomaniak', transcriptionReady: false, classificationReady: false,
        limits: { minutes: 60, requests: 100 }, usage: { voice_seconds: 0, requests: 0 } };
      }
      else if (url.pathname === '/api/notes/projects') body = { success: true, projects: ['Atelier'] };
      else if (url.pathname === '/api/notes/queue') body = { success: true, queue: [] };
      else if (url.pathname === '/api/notes') {
        requests.push(url.search);
        const q = url.searchParams.get('q'), before = url.searchParams.get('before');
        if (['langsam', 'ignoriert', 'ignoriert-fehler', 'seiten'].includes(q) && (q !== 'seiten' || before)) {
          await new Promise(resolve => releases.set(q, resolve));
        }
        if (q === 'ignoriert-fehler' || (q === 'fehler' && failList) || (q === 'mehr' && before && failMore)) {
          status = 503; body = { success: false, error: 'Die Notizen sind vorübergehend nicht verfügbar.' };
        } else body = { success: true, notes:
          q === 'leer' || url.searchParams.has('id') ? [] : q === 'seiten' || q === 'mehr'
            ? before ? [...(q === 'mehr' ? [note(50)] : []), note(51, 'Weitere Notiz')] : Array.from({ length: 50 }, (_, i) => note(i + 1))
            : ['langsam', 'ignoriert'].includes(q) ? [note(99, 'Veralteter Treffer')]
            : q ? [note(2, 'Aktueller Treffer')] : [initial] };
      } else body = { success: true, data: [] };
      await request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) });
    } catch { /* Responses to intentionally cancelled requests may no longer be delivered. */ }
  });
  async function search(value) {
    const input = await page.$('[aria-label="Notizen durchsuchen"]');
    await input.evaluate(e => { e.focus(); e.setSelectionRange(0, e.value.length); });
    await page.keyboard.press('Backspace');
    await input.type(value);
  }
  async function noteTitle(title) {
    try {
      await page.waitForFunction(title => [...document.querySelectorAll('.voice-library .voice-note h2')]
        .some(e => e.textContent === title), { timeout: 10000 }, title);
    } catch (error) {
      console.error(JSON.stringify({ waitingFor: title, url: page.url(), requests,
        view: await page.evaluate(() => ({
          query: document.querySelector('[aria-label="Notizen durchsuchen"]')?.value,
          titles: [...document.querySelectorAll('.voice-library .voice-note h2')].map(e => e.textContent),
          alerts: [...document.querySelectorAll('[role=alert]')].map(e => e.textContent) })) }));
      await page.screenshot({ path: '/tmp/trinity-notes-failure.png' });
      throw error;
    }
  }
  async function click(selector) {
    await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.locator(selector).click();
  }
  async function waitRequest(q, before = false) {
    const start = Date.now();
    while (!requests.some(search => {
      const params = new URLSearchParams(search);
      return params.get('q') === q && !!params.get('before') === before &&
        (!['langsam', 'ignoriert', 'ignoriert-fehler', 'seiten'].includes(q) || (q === 'seiten' && !before) || releases.has(q));
    })) {
      if (Date.now() - start > 5000) throw Error('Request did not start: ' + JSON.stringify({ q,
        value: await page.$eval('[aria-label="Notizen durchsuchen"]', e => e.value), requests }));
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  async function release(q) {
    assert(releases.has(q), 'No delayed response: ' + q);
    releases.get(q)(); releases.delete(q);
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  await page.goto(base.origin + '/notiz', { waitUntil: 'networkidle0' });
  await noteTitle('Erster Gedanke');
  await page.type('.voice-compose textarea', 'Mein Entwurf bleibt erhalten.');
  for (const query of ['langsam', 'ignoriert', 'ignoriert-fehler']) {
    await search(query); await waitRequest(query);
    await search('schnell'); await noteTitle('Aktueller Treffer');
    await release(query);
    assert.equal(await page.$$eval('.voice-library .voice-note h2', es => es.map(e => e.textContent).join(',')), 'Aktueller Treffer');
    assert.equal(await page.$('.voice-library [role=alert]'), null, 'An old failure must not replace the new result.');
  }
  assert(await page.evaluate(() => window.fixtureAborted >= 2), 'Obsolete requests must be cancelled.');
  // Refresh started under the previous filters must not issue an old search later.
  const previousQueries = requests.length;
  delayConfig = true;
  await page.locator('[aria-label="Notizen und Hermes aktualisieren"]').click();
  for (let i = 0; !releases.has('config'); i++) {
    assert(i < 200, 'Refresh did not start'); await new Promise(resolve => setTimeout(resolve, 25));
  }
  await search('neu'); await waitRequest('neu'); await noteTitle('Aktueller Treffer');
  delayConfig = false; await release('config');
  assert(requests.slice(previousQueries).every(query => new URLSearchParams(query).get('q') === 'neu'), 'Refresh must respect the current filters.');
  assert.equal(requests.slice(previousQueries).length, 2, 'Refresh must reload the current search after it finishes.');
  await noteTitle('Aktueller Treffer');
  await search('fehler');
  await page.waitForSelector('.voice-library [role=alert]');
  assert.equal(await page.$('.voice-compose [role=alert]'), null, 'Read errors belong to the list.');
  assert.equal(await page.$('.voice-library .voice-empty'), null, 'Failure must not look like an empty library.');
  failList = false;
  await click('.voice-library [role=alert] button');
  await noteTitle('Aktueller Treffer');
  assert.equal(await page.$('.voice-library [role=alert]'), null);
  await search('leer');
  await page.waitForSelector('.voice-library .voice-empty');
  assert.match(await page.$eval('.voice-library .voice-empty', e => e.textContent), /Keine passenden Notizen/);
  await click('.voice-library .voice-empty button');
  await noteTitle('Erster Gedanke');
  assert.equal(await page.$eval('[aria-label="Notizen durchsuchen"]', e => e.value), '');

  await search('mehr'); await noteTitle('Gedanke 50');
  await page.$$eval('.voice-library button', es => es.find(e => e.textContent.trim() === 'Weitere laden').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.locator('::-p-text(Weitere laden)').click();
  await page.waitForSelector('.voice-library [role=alert]');
  assert.equal(await page.$$eval('.voice-library .voice-note', es => es.length), 50, 'Keep loaded pages after a pagination error.');
  failMore = false;
  await click('.voice-library [role=alert] button');
  await noteTitle('Weitere Notiz');
  assert.equal(await page.$$eval('.voice-library .voice-note', es => es.length), 51, 'Retry must append, not replace.');

  await search('seiten'); await noteTitle('Gedanke 50');
  await page.locator('::-p-text(Weitere laden)').click(); await waitRequest('seiten', true);
  await search('schnell'); await noteTitle('Aktueller Treffer'); await release('seiten');
  assert.equal(await page.$$eval('.voice-library .voice-note', es => es.length), 1, 'An old page must not append to a new search.');
  assert.equal(await page.$eval('.voice-compose textarea', e => e.value), 'Mein Entwurf bleibt erhalten.');
  await page.goto(base.origin + '/notiz?note=00000000-0000-4000-8000-000000000404', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.voice-library .voice-empty');
  assert.match(await page.$eval('.voice-library .voice-empty', e => e.textContent), /Diese Notiz ist nicht verfügbar/);
  await page.type('.voice-compose textarea', 'Mein neuer Entwurf.');
  await click('.voice-library .voice-empty button');
  await noteTitle('Erster Gedanke');
  assert.equal(new URL(page.url()).search, '');
  assert.equal(await page.$eval('.voice-compose textarea', e => e.value), 'Mein neuer Entwurf.');
  await search('langsam'); await waitRequest('langsam');
  await page.locator('.voice-header a[href="/notiz/hilfe"]').click();
  await page.waitForFunction(() => location.pathname === '/notiz/hilfe');
  await release('langsam');
  await page.goto(base.origin + '/notiz', { waitUntil: 'networkidle0' });
  await noteTitle('Erster Gedanke');
  delayConfig = true;
  await page.locator('[aria-label="Notizen und Hermes aktualisieren"]').click();
  for (let i = 0; !releases.has('config'); i++) {
    assert(i < 200, 'Refresh did not start'); await new Promise(resolve => setTimeout(resolve, 25));
  }
  await page.locator('.voice-header a[href="/notiz/hilfe"]').click();
  await page.waitForFunction(() => location.pathname === '/notiz/hilfe');
  const requestsAfterLeave = requests.length;
  delayConfig = false; await release('config');
  assert.equal(requests.length, requestsAfterLeave, 'An unmounted workspace must not start a new list request.');
  assert.deepEqual(errors, []); assert.equal(writes, 0);
  console.log('PASS: cancelled/late note searches and errors, stale refresh, scoped error/retry, filtered/deep-link empty state, pagination error/retry/race, draft preservation and navigation cleanup; no remote writes.');
} finally { await browser.close(); }
