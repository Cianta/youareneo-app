// Local regression fixture. No real account, mail, provider or remote write.
// Start a local production build with AUTH_PROVIDER=fusebase, then run this script.
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3308";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Fixture tests are restricted to localhost.");
if (!process.env.TEST_BROWSER_PATH)
  throw Error("Set TEST_BROWSER_PATH to a local Chromium/Chrome executable.");
const browser = await puppeteer.launch({
  executablePath: process.env.TEST_BROWSER_PATH,
  headless: true,
  args: ["--disable-extensions"],
});
const page = await browser.newPage();
const errors = [];
let failSearch = true;
const authRequests = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.setRequestInterception(true);
const userId = "00000000-0000-4000-8000-000000000001";
const note = {
  id: "00000000-0000-4000-8000-000000000002",
  title: "Atelier",
  transcript: "Ein Testgedanke",
  summary: "",
  tags: ["atelier"],
  type: "aufgabe",
  source: "text",
  project: "Atelier",
  created_at: "2026-10-01T10:00:00Z",
  audio_path: null,
};
const item = {
  id: "note-" + note.id,
  label: "Atelier",
  href: "/notiz?note=" + note.id,
  group: "Eigene Aufgaben",
};
page.on("request", async (r) => {
  try {
    const u = new URL(r.url());
    if (u.origin !== base) {
      await r.respond({ status: 200, body: "" });
      return;
    }
    if (!u.pathname.startsWith("/api/")) {
      await r.continue();
      return;
    }
    let body = { success: true },
      status = 200;
    if (["/api/auth/login", "/api/auth/magic-link", "/api/auth/password-restore"].includes(u.pathname)) {
      authRequests.push({ path: u.pathname, body: JSON.parse(r.postData()) });
      // An opaque failed password response exercises the translated fallback.
      if (u.pathname === "/api/auth/login") { status = 401; body = {}; }
      else body = { success: true };
    } else if (u.pathname === "/api/auth/me")
      body = {
        authenticated: true,
        hasTrinityAccess: true,
        displayName: "Test Mitglied",
        userId,
      };
    else if (u.pathname === "/api/search") {
      const q = u.searchParams.get("q");
      if (q === "fehler" && failSearch) {
        status = 503;
        body = { success: false };
      } else {
        if (q === "langsam")
          await new Promise((resolve) => setTimeout(resolve, 400));
        body = {
          success: true,
          userId,
          items:
            q === "atelier" || q === "fehler"
              ? [item]
              : q === "langsam"
                ? [{ ...item, label: "Veralteter Treffer" }]
                : [],
        };
      }
    } else if (u.pathname === "/api/voice/config")
      body = {
        canSave: true,
        userId,
        provider: "infomaniak",
        transcriptionReady: false,
        classificationReady: false,
        limits: { minutes: 0, requests: 0 },
        usage: { voice_seconds: 0, requests: 0 },
      };
    else if (u.pathname === "/api/notes/projects")
      body = { success: true, projects: ["Atelier"] };
    else if (u.pathname === "/api/notes")
      body = { success: true, notes: [note] };
    else if (u.pathname === "/api/notes/queue")
      body = { success: true, queue: [] };
    else body = { success: true, data: [] };
    await r.respond({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  } catch {
    /* An intentionally aborted old search cannot receive a response. */
  }
});
async function key(k) {
  await page.keyboard.down("Control");
  await page.keyboard.press(k);
  await page.keyboard.up("Control");
}
async function query(text) {
  const input = await page.waitForSelector("#command-query");
  await input.click({ clickCount: 3 });
  await page.keyboard.press("Backspace");
  await input.type(text);
}
try {
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(base + "/dashboard", { waitUntil: "networkidle0" });
  await key("k");
  await page.waitForSelector("dialog[open] #command-query");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "command-query",
  );
  await query("Projekt anlegen");
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll("#command-results [role=option] span"),
    ).some((e) => e.textContent === "Projekt anlegen"),
  );
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.pathname === "/dashboard/projekte");
  await page.waitForSelector("#project-name");
  await key("k");
  await query("atelier");
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("#command-results li")).some((e) =>
      e.textContent.includes("Eigene Aufgaben"),
    ),
  );
  // The graph-search action is also present; choose the own-note result by label.
  const noteIndex = await page.$$eval("#command-results [role=option]", (es) =>
    es.findIndex((e) => e.querySelector("span").textContent === "Atelier"),
  );
  assert(noteIndex >= 0);
  await page.keyboard.press("Home");
  for (let i = 0; i < noteIndex; i++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => location.pathname === "/notiz" && location.search.includes("note="),
  );
  await page.waitForSelector("#note-" + note.id);
  assert.equal(
    await page.$eval("#note-" + note.id, (e) =>
      e.textContent.includes("Atelier"),
    ),
    true,
  );
  await key("k");
  await query("fehler");
  await page.waitForSelector("dialog [role=alert]");
  failSearch = false;
  await page.evaluate(() =>
    Array.from(document.querySelectorAll("dialog button"))
      .find((e) => e.textContent === "Erneut versuchen")
      .click(),
  );
  await page.waitForFunction(
    () => !document.querySelector("dialog [role=alert]"),
  );
  await query("langsam");
  await new Promise((resolve) => setTimeout(resolve, 240));
  await query("atelier");
  await new Promise((resolve) => setTimeout(resolve, 650));
  assert.equal(
    await page.$eval("#command-results", (e) =>
      e.textContent.includes("Veralteter Treffer"),
    ),
    false,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.$("dialog[open]"), null);
  await page.goto(base + "/dashboard", { waitUntil: "networkidle0" });
  await page.keyboard.press("?");
  await page.waitForSelector("dialog[open]");
  await page.keyboard.press("Escape");
  await page.setViewport({ width: 390, height: 844 });
  const tabs = await page.$$eval(".workspace-mobile-tabs a", (els) =>
    els.map((e) => ({
      text: e.textContent,
      w: e.getBoundingClientRect().width,
      h: e.getBoundingClientRect().height,
    })),
  );
  assert.equal(tabs.length, 4);
  assert.ok(tabs.every((t) => t.w >= 44 && t.h >= 44));
  for (const route of [
    "/dashboard",
    "/dashboard/vision/tasks",
    "/dashboard/kanban",
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle0" });
    assert.ok(
      await page.$eval(
        "#workspace-content",
        (e) => e.getBoundingClientRect().width >= 360,
      ),
      route + " main content width",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route + " horizontal viewport overflow",
    );
  }
  await page.screenshot({
    path: "/tmp/trinity-part2-mobile.png",
    fullPage: false,
  });
  await page.$eval('[aria-label="Neues Ziel"]', e => { e.focus(); });
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Neues Ziel');
  await page.locator('::-p-text(Journal)').click();
  await page.waitForSelector('[aria-label="Journaleintrag"]');

  // Small landscape / keyboard-sized viewport: the complete login remains scrollable.
  await page.setViewport({ width: 390, height: 360 });
  await page.goto(base + '/login', { waitUntil: 'networkidle0' });
  assert.equal(await page.$$eval('main', es => es.length), 1);
  const reachable = await page.$eval('main a[target="_blank"]', e => {
    e.scrollIntoView({ block: 'end', behavior: 'instant' });
    const rect = e.getBoundingClientRect();
    return rect.top >= -1 && rect.bottom <= innerHeight + 1 && e.closest('main').scrollTop > 0;
  });
  assert(reachable, 'Bottom of login must be reachable in a short viewport.');
  assert(await page.$$eval('main button', es => es.every(e => e.getBoundingClientRect().height >= 44)), 'Login touch targets');
  await page.type('[aria-label="E-Mail"]', 'fixture@example.invalid');
  await page.type('[aria-label="Passwort"]', 'local-fixture-only');
  await page.locator('button[type=submit]').click();
  await page.waitForSelector('[role=alert]');
  assert.match(await page.$eval('[role=alert]', e => e.textContent), /Die Anmeldung/);
  await page.locator('::-p-text(Magic Link)').click();
  assert.equal(await page.$eval('button[aria-pressed=true]', e => e.textContent.trim()), 'Magic Link');
  await page.locator('button[type=submit]').click();
  await page.waitForSelector('[role=status]');
  assert.match(await page.$eval('[role=status]', e => e.textContent), /Bitte prüfe dein Postfach/);
  await page.locator('button::-p-text(Passwort)').click();
  await page.locator('::-p-text(Passwort vergessen?)').click();
  await page.locator('button[type=submit]').click();
  await page.waitForSelector('[role=status]');
  assert.match(await page.$eval('[role=status]', e => e.textContent), /Zurücksetzen/);
  assert.deepEqual(authRequests.map(r => r.path), ['/api/auth/login', '/api/auth/magic-link', '/api/auth/password-restore']);
  assert.deepEqual(authRequests[1].body, { email: 'fixture@example.invalid', redirectPath: '/dashboard' });
  assert.deepEqual(authRequests[2].body, { email: 'fixture@example.invalid' });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: palette/search/retry/race, note deep link, help, mobile navigation, notebook labels, scrollable login and three local auth-form fixtures; no page errors.",
  );
} finally {
  await browser.close();
}
