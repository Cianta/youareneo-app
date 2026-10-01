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
    window.fixtureContexts = [];
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor(...args) {
        super(...args);
        window.fixtureContexts.push(this);
      }
    };
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
        u.onstart?.();
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
  let denyChat = false,
    vocalReady = false,
    delayChat = 0;
  // A real, locally generated PCM tone with a silent interval; never a provider call.
  const rate = 16000,
    samples = rate * 5,
    wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) {
    const t = i / rate,
      amp = t >= 1 && t < 2 ? 0 : 0.1;
    wav.writeInt16LE(
      Math.round(Math.sin(2 * Math.PI * 440 * t) * amp * 32767),
      44 + i * 2,
    );
  }
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
      if (u.pathname === "/api/auth/me")
        body = {
          authenticated: true,
          hasTrinityAccess: true,
          displayName: "Fixture",
          userId: "fixture",
        };
      else if (u.pathname === "/api/voice/config")
        body = {
          success: true,
          canSave,
          provider: "infomaniak",
          limits: { minutes: 120, requests: 600 },
          usage: { voice_seconds: 0, requests: 0 },
          transcriptionReady: true,
          classificationReady: true,
          userId: "fixture",
        };
      else if (u.pathname === "/api/voice/speech/voices")
        body = {
          success: true,
          ready: vocalReady,
          voices: vocalReady
            ? [{ id: "fixture", name: "Teststimme", languages: ["de"] }]
            : [],
        };
      else if (u.pathname === "/api/voice/speech") {
        await new Promise((r) => setTimeout(r, 300));
        return await r.respond({
          status: 200,
          contentType: "audio/wav",
          body: wav,
        });
      } else if (u.pathname === "/api/voice/transcribe") {
        transcriptions++;
        body = { success: true, transcript: "Satz aus Testaufnahme" };
      } else if (u.pathname === "/api/voice/chat") {
        chatCalls++;
        if (delayChat) await new Promise((r) => setTimeout(r, delayChat));
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
      } else if (u.pathname === "/api/brain") {
        body = {
          success: true,
          graph: { nodes: [], links: [], truncated: false },
        };
      } else if (u.pathname === "/api/notes/projects") {
        body = { success: true, projects: [] };
      } else if (u.pathname === "/api/notes/queue") {
        body = { success: true, queue: [] };
      } else if (u.pathname === "/api/notes" && r.method() === "GET") {
        body = { success: true, notes: [] };
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
  const submit = async () => {
    // Center the composer action clear of the fixed mobile tabs before a real click.
    await page.$eval("button[type=submit]", (e) =>
      e.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await page.locator("button[type=submit]").click();
  };
  const avatarState = async (state) =>
    page.waitForSelector(`.assistant-avatar[data-state="${state}"]`);
  await avatarState("idle");
  delayChat = 400;
  await page.evaluate(() => {
    window.fixtureHoldSpeech = true;
  });
  await page.type("#chat-text", "Hallo");
  await submit();
  await avatarState("thinking");
  await page.waitForFunction(() =>
    document
      .querySelector(".chat-conversation")
      .innerText.includes("Eine kurze Antwort."),
  );
  await avatarState("speaking");
  await page.click(".assistant-avatar");
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "chat-text",
  );
  assert(
    await page.$(".chat-conversation article"),
    "avatar click must preserve conversation",
  );
  await page.$$eval(".chat-mic button", (es) =>
    es.find((e) => e.innerText === "Alles stoppen").click(),
  );
  await avatarState("idle");
  delayChat = 0;
  await page.evaluate(() => {
    window.fixtureHoldSpeech = false;
  });
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
  await avatarState("listening");
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector(".assistant-avatar")
          .style.getPropertyValue("--voice-level"),
      ) > 0,
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
  await avatarState("speaking");
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
  await submit();
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
  // VocalLab-shaped response, actual audio playback + AnalyserNode, all local.
  denyChat = false;
  vocalReady = true;
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => document.querySelector(".chat-settings select").value === "vocallab",
  );
  await page.type("#chat-text", "Lautstärke testen");
  await submit();
  await avatarState("thinking");
  await avatarState("speaking");
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector(".assistant-avatar")
          .style.getPropertyValue("--voice-level"),
      ) > 0.1,
  );
  await page.waitForFunction(
    () =>
      document.querySelector(".assistant-avatar").dataset.state ===
        "speaking" &&
      Number(
        document
          .querySelector(".assistant-avatar")
          .style.getPropertyValue("--voice-level"),
      ) === 0,
  );
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector(".assistant-avatar")
          .style.getPropertyValue("--voice-level"),
      ) > 0.1,
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  assert.equal(
    await page.$eval(".avatar-energy", (e) => getComputedStyle(e).transform),
    "none",
  );
  assert.equal(
    await page.$eval(".avatar-orbit", (e) => getComputedStyle(e).animationName),
    "none",
  );
  await avatarState("idle"); // Natural audio completion cleans up its context.
  assert(
    await page.evaluate(() =>
      window.fixtureContexts.every((c) => c.state === "closed"),
    ),
  );
  await page.type("#chat-text", "Abbrechen");
  await submit();
  await avatarState("thinking");
  assert.equal(
    await page.$eval(".avatar-orbit", (e) => getComputedStyle(e).animationName),
    "none",
  );
  await avatarState("speaking");
  await page.$$eval(".chat-mic button", (es) =>
    es.find((e) => e.innerText === "Alles stoppen").click(),
  );
  await avatarState("idle");
  assert(
    await page.evaluate(() =>
      window.fixtureContexts.every((c) => c.state === "closed"),
    ),
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  // Unavailable Web Audio must leave ordinary output playing through to completion.
  await page.evaluate(() => {
    window.AudioContext = class {
      constructor() {
        throw Error("Fixture: no analyser");
      }
    };
  });
  await page.type("#chat-text", "Ohne Pegelmessung");
  await submit();
  await avatarState("speaking");
  assert.equal(
    await page.$eval(".assistant-avatar", (e) =>
      Number(e.style.getPropertyValue("--voice-level")),
    ),
    0,
  );
  await avatarState("idle");
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => document.querySelector(".chat-settings select").value === "vocallab",
  );
  await page.type("#chat-text", "Seite verlassen");
  await submit();
  await avatarState("speaking");
  await page.$eval('header a[href="/dashboard"]', (e) => e.click());
  await page.waitForFunction(() => location.pathname === "/dashboard");
  await avatarState("idle");
  assert(
    await page.evaluate(() =>
      window.fixtureContexts.every((c) => c.state === "closed"),
    ),
  );
  await page.goto(base + "/notiz", { waitUntil: "networkidle0" });
  await avatarState("idle");
  await page.click('button[aria-label="Aufnahme starten"]');
  await avatarState("listening");
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector(".assistant-avatar")
          .style.getPropertyValue("--voice-level"),
      ) > 0,
  );
  await page.$$eval(".voice-recorder button", (es) =>
    es.find((e) => e.textContent.trim() === "Pause").click(),
  );
  await avatarState("idle");
  await page.$$eval(".voice-recorder button", (es) =>
    es.find((e) => e.textContent.trim() === "Weiter").click(),
  );
  await avatarState("listening");
  await page.click('button[aria-label="Aufnahme stoppen"]');
  await avatarState("idle");
  await page.click(".assistant-avatar");
  await page.waitForFunction(() => location.pathname === "/sprechen");
  // Narrow/mobile and desktop: no controls overlap, avatar remains in the header.
  for (const width of [320, 390, 1280]) {
    await page.setViewport({ width, height: 844 });
    for (const route of ["/dashboard", "/notiz", "/gehirn", "/sprechen"]) {
      await page.goto(base + route, { waitUntil: "networkidle0" });
      const layout = await page.evaluate(() => {
        const avatar = document.querySelector(".assistant-avatar"),
          a = avatar.getBoundingClientRect();
        const siblings = [...avatar.parentElement.children]
          .filter((e) => e !== avatar && getComputedStyle(e).display !== "none")
          .map((e) => e.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          overlap: siblings.some(
            (b) =>
              a.left < b.right &&
              a.right > b.left &&
              a.top < b.bottom &&
              a.bottom > b.top,
          ),
          touch: a.width >= 44 && a.height >= 44,
          right: a.right <= innerWidth,
        };
      });
      assert.deepEqual(
        layout,
        { overflow: false, overlap: false, touch: true, right: true },
        `${route} at ${width}px`,
      );
    }
  }
  await page.setViewport({ width: 390, height: 844 });

  await page.evaluate(() =>
    document.querySelector(".chat-workspace").scrollTo(0, 0),
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
        "avatar states and microphone level",
        "avatar click preserves conversation",
        "real output level with silent interval",
        "reduced motion including audio-driven transforms",
        "output context cleanup on completion, interruption and navigation",
        "native audio fallback without Web Audio",
        "note recording pause/resume avatar",
        "four headers at 320/390/1280px without overlap",
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
} catch (error) {
  const page = (await browser.pages()).at(-1);
  console.error(
    await page.evaluate(() => ({
      url: location.pathname,
      state: document.querySelector(".assistant-avatar")?.dataset.state,
      alerts: [...document.querySelectorAll('[role="alert"]')].map(
        (e) => e.textContent,
      ),
      composer: document.querySelector("#chat-text")?.value,
      submit: document.querySelector('button[type="submit"]')?.disabled,
      turns: document.querySelector(".chat-conversation")?.textContent,
    })),
  );
  await page.screenshot({
    path: "/tmp/trinity-avatar-failure.png",
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
