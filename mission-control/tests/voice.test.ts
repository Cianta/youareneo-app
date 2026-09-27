import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { maySave, emptyDraft } from "../lib/voice/contracts";
import { noteOf, limitedBody } from "../lib/voice/validation";
import {
  authorizeHermes,
  ownerDecision,
  hermesDecision,
} from "../lib/voice/hermes";
import { limits, reserveUsage } from "../lib/voice/server";
import { inspectAudio } from "../lib/voice/audio";
import { GET, PATCH } from "../app/api/hermes/queue/route";
import { transcriptionProvider } from "../lib/voice/providers";
import { PROJECT_URL } from "../lib/supabase/config";
import { HttpError } from "../lib/auth/http";
const base = "https://trinity-stg.youareneo.com";
function env() {
  process.env.SUPABASE_URL = PROJECT_URL;
  process.env.SUPABASE_ANON_KEY = randomUUID();
  process.env.SUPABASE_SERVICE_ROLE_KEY = randomUUID();
  process.env.HERMES_API_TOKEN = randomUUID();
  process.env.AUTH_APP_URL = base;
}
const reply = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
test("storage access list: free and archiv denied; foerder/app allowed", () => {
  assert.equal(maySave([]), false);
  assert.equal(maySave(["archiv"]), false);
  assert.equal(maySave(["foerder"]), true);
  assert.equal(maySave(["app"]), true);
  assert.equal(maySave(["app"], ["foerder"]), false);
});
test("note contract validates tags, dates and forbids arbitrary types", () => {
  const note = {
    ...emptyDraft(),
    title: "Test",
    transcript: "Meine Worte",
    tags: [" Hermes ", "hermes"],
  };
  assert.deepEqual(noteOf(note).tags, ["hermes"]);
  assert.throws(() => noteOf({ ...note, type: "execute" }), HttpError);
  assert.throws(() => noteOf({ ...note, due: "tomorrow" }), HttpError);
  assert.throws(
    () => noteOf({ ...note, tags: Array(21).fill("x") }),
    HttpError,
  );
  assert.throws(
    () => noteOf({ ...note, transcript: "x".repeat(20001) }),
    HttpError,
  );
});
test("bounded upload rejects streamed oversized bodies without trusting content-length", async () => {
  const req = new Request(base, { method: "POST", body: "x".repeat(200) });
  await assert.rejects(
    () => limitedBody(req, 100),
    (e: unknown) => e instanceof HttpError && e.status === 413,
  );
});
test("Hermes token and separate decision roles cannot auto-approve", () => {
  env();
  assert.throws(() => authorizeHermes(new Request(base)), HttpError);
  assert.throws(
    () =>
      authorizeHermes(
        new Request(base, {
          headers: { Authorization: "Bearer " + randomUUID() },
        }),
      ),
    HttpError,
  );
  authorizeHermes(
    new Request(base, {
      headers: { Authorization: "Bearer " + process.env.HERMES_API_TOKEN },
    }),
  );
  assert.equal(ownerDecision("freigegeben"), "freigegeben");
  assert.throws(() => ownerDecision("erledigt"), HttpError);
  assert.equal(hermesDecision("erledigt"), "erledigt");
  assert.throws(() => hermesDecision("freigegeben"), HttpError);
});
test("Hermes HTTP API exposes only approved active orders and rejects privilege changes", async (t) => {
  env();
  const a = randomUUID(),
    b = randomUUID(),
    note = randomUUID();
  let updates = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init),
        url = new URL(request.url);
      if (url.pathname === "/rest/v1/trinity_hermes_pending") {
        assert.equal(url.searchParams.get("status"), "eq.freigegeben");
        if (request.method === "PATCH") {
          updates++;
          return reply({ note_id: note });
        }
        if (url.searchParams.get("note_id")) return reply({ user_id: a });
        return reply([
          {
            note_id: note,
            user_id: a,
            instruction: "Test",
            status: "freigegeben",
          },
        ]);
      }
      if (url.pathname === "/rest/v1/neo_access") {
        assert.equal(url.searchParams.get("revoked_at"), "is.null");
        return reply(
          url.searchParams.get("user_id") === "eq." + a
            ? [{ product: "foerder" }]
            : [],
        );
      }
      throw new Error("Unexpected test request");
    },
  );
  const headers = {
    Authorization: "Bearer " + process.env.HERMES_API_TOKEN,
    "Content-Type": "application/json",
  };
  assert.equal((await GET(new Request(base))).status, 401);
  const read = await GET(new Request(base, { headers }));
  assert.equal(read.status, 200);
  assert.equal((await read.json()).queue.length, 1);
  assert.equal(
    (
      await PATCH(
        new Request(base, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            note_id: note,
            status: "freigegeben",
            result: "x",
          }),
        }),
      )
    ).status,
    400,
  );
  assert.equal(updates, 0);
  assert.equal(
    (
      await PATCH(
        new Request(base, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            note_id: note,
            status: "erledigt",
            result: "Test abgeschlossen",
          }),
        }),
      )
    ).status,
    200,
  );
  assert.equal(updates, 1);
});
test("usage exhaustion fails closed before provider calls; invalid environment fails closed", async (t) => {
  env();
  process.env.VOICE_MINUTES_PER_MONTH = "5";
  process.env.VOICE_REQUESTS_PER_MONTH = "3";
  t.mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input, init);
      assert.ok(req.url.endsWith("/rpc/trinity_reserve_usage"));
      const body = await req.json();
      assert.equal(body.p_seconds, 2);
      assert.equal(body.p_minutes_limit, 5);
      return reply(false);
    },
  );
  await assert.rejects(
    () => reserveUsage(randomUUID(), 1.5),
    (e: unknown) => e instanceof HttpError && e.status === 429,
  );
  process.env.VOICE_MINUTES_PER_MONTH = "invalid";
  assert.throws(() => limits(), HttpError);
  delete process.env.VOICE_MINUTES_PER_MONTH;
  delete process.env.VOICE_REQUESTS_PER_MONTH;
});
test("provider selection does not invent an Amical endpoint or silently switch vendors", () => {
  process.env.TRANSCRIBE_PROVIDER = "amical";
  assert.throws(() => transcriptionProvider(), /Dokumentation/);
  process.env.TRANSCRIBE_PROVIDER = "invalid";
  assert.throws(() => transcriptionProvider(), HttpError);
  process.env.TRANSCRIBE_PROVIDER = "openai";
  delete process.env.OPENAI_API_KEY;
  assert.throws(() => transcriptionProvider(), /eingerichtet/);
  delete process.env.TRANSCRIBE_PROVIDER;
});
test("actual WebM/Opus and MP4/AAC duration is measured; temporary audio is removed even on error", async () => {
  const before = (await readdir(tmpdir()))
    .filter((n) => n.startsWith("neo-audio-"))
    .sort();
  const run = promisify(execFile);
  for (const [mime, codec, format, extra] of [
    ["audio/webm", "libopus", "webm", []],
    ["audio/mp4", "aac", "mp4", ["-movflags", "frag_keyframe+empty_moov"]],
  ] as const) {
    const { stdout } = await run(
      "ffmpeg",
      [
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=1",
        "-c:a",
        codec,
        ...extra,
        "-f",
        format,
        "pipe:1",
      ],
      { encoding: "buffer" },
    );
    const audio = await inspectAudio(
      new File([new Uint8Array(stdout)], "recording", { type: mime }),
    );
    assert.ok(audio.seconds >= 1 && audio.seconds <= 2);
  }
  await assert.rejects(
    () => inspectAudio(new File(["not audio"], "bad", { type: "audio/webm" })),
    HttpError,
  );
  assert.deepEqual(
    (await readdir(tmpdir())).filter((n) => n.startsWith("neo-audio-")).sort(),
    before,
  );
});
