// Local-only regression. Synthetic microphone; API and speech output are simulated.
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3308";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Local fixture only");
if (!process.env.TEST_BROWSER_PATH) throw Error("TEST_BROWSER_PATH required");
const browser = await puppeteer.launch({
  executablePath: process.env.TEST_BROWSER_PATH,
  headless: true,
  args: ["--disable-extensions", "--autoplay-policy=no-user-gesture-required"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.evaluateOnNewDocument(() => {
    window.fixtureMicDelay = 0;
    window.fixtureTracks = [];
    window.fixtureSynthCanceled = 0;
    window.fixtureSpeakCount = 0;
    window.fixtureHoldSpeech = false;
    const synth = {
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
      cancel() {
        window.fixtureSynthCanceled++;
      },
      speak(u) {
        window.fixtureSpeakCount++;
        if (!window.fixtureHoldSpeech) setTimeout(() => u.onend?.(), 20);
      },
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: synth,
      configurable: true,
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        await new Promise((r) => setTimeout(r, window.fixtureMicDelay));
        const ctx = new AudioContext(),
          osc = ctx.createOscillator(),
          gain = ctx.createGain(),
          dest = ctx.createMediaStreamDestination();
        osc.frequency.value = 440;
        gain.gain.value = 0.08;
        window.fixtureGain = gain;
        osc.connect(gain).connect(dest);
        osc.start();
        await ctx.resume();
        const track = dest.stream.getAudioTracks()[0],
          stop = track.stop.bind(track);
        track.stop = () => {
          stop();
          void ctx.close();
        };
        window.fixtureTracks.push(track);
        return dest.stream;
      },
    });
  });
  let denyChat = false;
  let canSave = false,
    transcriptions = 0,
    chatCalls = 0;
  const bodies = [];
  let noteSaves = 0;
  await page.setRequestInterception(true);
  page.on("request", async (r) => {
    try {
      const u = new URL(r.url());
      if (u.origin !== base) return await r.respond({ status: 200, body: "" });
      if (!u.pathname.startsWith("/api/")) return await r.continue();
      let body = { success: true };
      if (u.pathname === "/api/voice/config")
        body = {
          success: true,
          canSave,
          transcriptionReady: true,
          classificationReady: true,
          userId: "fixture",
        };
      else if (u.pathname === "/api/voice/speech/voices")
        body = { success: true, ready: false, voices: [] };
      else if (u.pathname === "/api/voice/transcribe") {
        transcriptions++;
        body = { success: true, transcript: "Satz aus Testaufnahme" };
      } else if (u.pathname === "/api/voice/chat") {
        chatCalls++;
        if (denyChat)
          return await r.respond({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({ error: "Monatskontingent erreicht" }),
          });
        bodies.push(JSON.parse(r.postData()));
        return await r.respond({
          status: 200,
          contentType: "application/x-ndjson",
          body:
            [
              {
                type: "sources",
                notes: bodies.at(-1).includeNotes
                  ? [{ id: "own", title: "Eigene Testnotiz" }]
                  : [],
              },
              { type: "text", text: "Eine kurze " },
              { type: "text", text: "Antwort." },
              { type: "done" },
            ]
              .map((x) => JSON.stringify(x))
              .join("\n") + "\n",
        });
      } else if (u.pathname === "/api/notes") {
        noteSaves++;
        body = { success: true, id: "fixture-note" };
      }
      await r.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    } catch {}
  });
  await page.goto(base + "/sprechen", { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => !document.querySelector(".chat-record").disabled,
  );
  await page.type("#chat-text", "Hallo");
  await page.click("button[type=submit]");
  await page.waitForFunction(() =>
    document
      .querySelector(".chat-conversation")
      .innerText.includes("Eine kurze Antwort."),
  );
  assert.equal(bodies[0].includeNotes, false);
  assert.equal(
    await page.$$eval(
      ".chat-actions button",
      (es) => es.find((e) => e.innerText.includes("speichern")).disabled,
    ),
    true,
  );
  // Release while browser permission is still pending: no upload, track is stopped.
  await page.evaluate(() => {
    window.fixtureMicDelay = 300;
  });
  const button = await page.$(".chat-record");
  await button.scrollIntoView();
  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForFunction(
    () =>
      window.fixtureTracks.length === 1 &&
      window.fixtureTracks[0].readyState === "ended",
  );
  assert.equal(transcriptions, 0);
  // Real MediaRecorder over synthetic input, no physical microphone.
  await page.evaluate(() => {
    window.fixtureMicDelay = 0;
  });
  await button.scrollIntoView();
  const secondBox = await button.boundingBox();
  await page.mouse.move(
    secondBox.x + secondBox.width / 2,
    secondBox.y + secondBox.height / 2,
  );
  await page.mouse.down();
  await page.waitForFunction(() =>
    document.querySelector(".chat-mic").innerText.includes("Hört zu"),
  );
  await new Promise((r) => setTimeout(r, 400));
  await page.mouse.up();
  await page.waitForFunction(() =>
    document
      .querySelector(".chat-conversation")
      .innerText.includes("Satz aus Testaufnahme"),
  );
  assert.equal(transcriptions, 1);
  await page.waitForFunction(() =>
    window.fixtureTracks.every((t) => t.readyState === "ended"),
  );
  // Hands-free: sustained signal, silence -> one turn; new speech cancels playback.
  await page.click(".chat-mic input[type=checkbox]");
  await page.evaluate(() => {
    window.fixtureHoldSpeech = true;
  });
  await page.click(".chat-record");
  await page.waitForFunction(() =>
    document.querySelector(".chat-mic").innerText.includes("Hört zu"),
  );
  await page.evaluate(() => {
    window.fixtureGain.gain.value = 0;
  });
  await page.waitForFunction(() => window.fixtureSpeakCount >= 3, {
    timeout: 10000,
  });
  assert.equal(transcriptions, 2);
  const before = await page.evaluate(() => window.fixtureSynthCanceled);
  await page.evaluate(() => {
    window.fixtureGain.gain.value = 0.08;
  });
  await page.waitForFunction(
    (n) => window.fixtureSynthCanceled > n,
    {},
    before,
  );
  await page.$$eval(".chat-mic button", (es) =>
    es.find((e) => e.innerText === "Alles stoppen").click(),
  );
  await page.waitForFunction(() =>
    window.fixtureTracks.every((t) => t.readyState === "ended"),
  );
  await page.click(".chat-settings input[type=checkbox]");
  await page.type("#chat-text", "Nutze meine Notizen");
  await page.click("button[type=submit]");
  await page.waitForSelector(".chat-conversation details a");
  assert.equal(bodies.at(-1).includeNotes, true);
  assert.equal(
    await page.$eval(".chat-conversation details a", (e) =>
      e.getAttribute("href"),
    ),
    "/notiz?note=own",
  );
  await page.$$eval(".chat-mic button", (es) =>
    es.find((e) => e.innerText === "Alles stoppen").click(),
  );
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  denyChat = true;
  await page.click(".chat-record");
  await page.waitForFunction(() =>
    document.querySelector(".chat-mic").innerText.includes("Hört zu"),
  );
  await page.evaluate(() => {
    window.fixtureGain.gain.value = 0;
  });
  await page.waitForFunction(() =>
    document.body.innerText.includes("Monatskontingent erreicht"),
  );
  await page.waitForFunction(() =>
    window.fixtureTracks.every((t) => t.readyState === "ended"),
  );
  await page.screenshot({
    path: "/tmp/trinity-chat-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      pass: true,
      transcriptions,
      chatCalls,
      noteSaves,
      checks: [
        "text stream",
        "optional own context",
        "free save disabled",
        "permission race cleanup",
        "push to talk",
        "silence detection",
        "speech interrupts playback",
        "stop releases tracks",
        "quota failure stops microphone",
        "mobile no overflow",
        "no page errors",
      ],
    }),
  );
} finally {
  await browser.close();
}
