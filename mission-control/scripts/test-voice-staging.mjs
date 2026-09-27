/** Opt-in, mail-free HTTP test. Temporary fixture IDs are removed in finally.
 * Uses native fetch so it also runs inside the minimal Next standalone image.
 * Tokens remain in memory; no payloads, credentials or mail links are logged.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
if (!process.argv.includes("--run"))
  throw new Error("Use --run for the staging test.");
const origin = process.env.AUTH_APP_URL,
  url = process.env.SUPABASE_URL,
  secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (
  origin !== "https://trinity-stg.youareneo.com" ||
  url !== "https://emxqoahtipbmumghlixb.supabase.co" ||
  !secret
)
  throw new Error("Staging configuration required.");
const users = [];
let checks = 0;
async function supa(path, method = "GET", body) {
  const r = await fetch(url + path, {
    method,
    headers: {
      apikey: secret,
      Authorization: "Bearer " + secret,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error("Fixture API failed");
  const value = await r.text();
  return value ? JSON.parse(value) : null;
}
async function fixture() {
  const email = `voice-test-${randomUUID()}@example.test`;
  const user = await supa("/auth/v1/admin/users", "POST", {
    email,
    email_confirm: true,
    user_metadata: { purpose: "temporary-voice-smoke-test" },
  });
  const id = user.id;
  assert.ok(id);
  users.push(id);
  const link = await supa("/auth/v1/admin/generate_link", "POST", {
    type: "magiclink",
    email,
  });
  const r = await fetch(origin + "/api/auth/magic", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ token_hash: link.hashed_token, type: "email" }),
  });
  assert.equal(r.status, 200);
  const cookie = r.headers
    .getSetCookie()
    .map((item) => item.split(";")[0])
    .join("; ");
  assert.ok(cookie);
  return { id, cookie: () => cookie };
}
async function call(user, path, method = "GET", body) {
  checks++;
  const form = body instanceof FormData;
  const r = await fetch(origin + path, {
    method,
    headers: {
      Cookie: user.cookie(),
      Origin: origin,
      ...(body && !form ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
    redirect: "manual",
  });
  const data = await r.json();
  console.log(
    JSON.stringify({
      step: checks,
      path: path.split("?")[0],
      status: r.status,
    }),
  );
  return { status: r.status, data };
}
function noteForm(id, project = null) {
  const f = new FormData();
  f.set("id", id);
  f.set(
    "note",
    JSON.stringify({
      title: "Testgedanke",
      transcript: "Ein Testauftrag ohne Außenwirkung.",
      summary: "Nur ein Test.",
      type: "notiz",
      project,
      tags: ["hermes"],
      due: null,
      assignee: null,
      source: "text",
    }),
  );
  return f;
}
let passed = false;
try {
  const a = await fixture(),
    b = await fixture();
  const reservations = await Promise.all(
    Array.from({ length: 8 }, () =>
      supa("/rest/v1/rpc/trinity_reserve_usage", "POST", {
        p_user: a.id,
        p_seconds: 30,
        p_minutes_limit: 1,
        p_requests_limit: 100,
      }),
    ),
  );
  assert.equal(reservations.filter(Boolean).length, 2);
  let r = await call(a, "/api/voice/config");
  assert.equal(r.status, 200);
  assert.equal(r.data.canSave, false);
  assert.equal(
    (await call(a, "/api/notes", "POST", noteForm(randomUUID()))).status,
    403,
  );
  await supa("/rest/v1/neo_access", "POST", {
    user_id: a.id,
    product: "foerder",
    source: "manual",
  });
  assert.equal(
    (await call(a, "/api/notes/projects", "POST", { name: "Testprojekt" }))
      .status,
    200,
  );
  const id = randomUUID();
  r = await call(a, "/api/notes", "POST", noteForm(id, "Testprojekt"));
  assert.equal(r.status, 200);
  assert.equal(r.data.created, true);
  r = await call(a, "/api/notes", "POST", noteForm(id, "Testprojekt"));
  assert.equal(r.status, 200);
  assert.equal(r.data.created, false);
  r = await call(
    a,
    "/api/notes?q=Testgedanke&type=notiz&project=Testprojekt&tag=hermes",
  );
  assert.equal(r.status, 200);
  assert.equal(r.data.notes.length, 1);
  const audioId = randomUUID();
  const { stdout: audioBytes } = await promisify(execFile)(
    "ffmpeg",
    [
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=1",
      "-c:a",
      "libopus",
      "-f",
      "webm",
      "pipe:1",
    ],
    { encoding: "buffer" },
  );
  const audioForm = noteForm(audioId),
    audioNote = JSON.parse(audioForm.get("note"));
  audioForm.set(
    "note",
    JSON.stringify({
      ...audioNote,
      title: "Audio-Test",
      source: "voice",
      tags: [],
    }),
  );
  audioForm.set(
    "audio",
    new File([new Uint8Array(audioBytes)], "recording.webm", {
      type: "audio/webm",
    }),
  );
  assert.equal((await call(a, "/api/notes", "POST", audioForm)).status, 200);
  const playback = await fetch(origin + `/api/notes/${audioId}/audio`, {
    headers: { Cookie: a.cookie() },
  });
  assert.equal(playback.status, 200);
  assert.ok((await playback.arrayBuffer()).byteLength > 0);
  assert.equal((await call(b, `/api/notes/${audioId}/audio`)).status, 404);
  r = await call(b, "/api/notes");
  assert.equal(r.status, 200);
  assert.equal(r.data.notes.length, 0);
  await supa("/rest/v1/neo_access", "POST", {
    user_id: b.id,
    product: "app",
    source: "manual",
  });
  r = await call(a, "/api/notes/queue");
  assert.equal(r.data.queue.length, 1);
  assert.equal(r.data.queue[0].status, "wartet_auf_bestaetigung");
  assert.equal(
    (
      await call(b, "/api/notes/queue", "PATCH", {
        note_id: id,
        status: "freigegeben",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(a, "/api/notes/queue", "PATCH", {
        note_id: id,
        status: "freigegeben",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await call(a, "/api/notes/queue", "PATCH", {
        note_id: id,
        status: "freigegeben",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(a, "/api/notes/queue", "PATCH", {
        note_id: id,
        status: "erledigt",
      })
    ).status,
    400,
  );
  await supa("/rest/v1/neo_access?user_id=eq." + a.id, "PATCH", {
    revoked_at: new Date().toISOString(),
  });
  assert.equal(
    (await call(a, "/api/notes", "POST", noteForm(randomUUID()))).status,
    403,
  );
  assert.equal((await call(a, "/api/notes")).data.notes.length, 2);
  await call(a, "/api/auth/logout", "POST", {});
  await call(b, "/api/auth/logout", "POST", {});
  passed = true;
} catch (error) {
  process.exitCode = 1;
  console.error(
    JSON.stringify({
      failedAfter: checks,
      code: error?.code,
      actual: ["number", "boolean"].includes(typeof error?.actual)
        ? error.actual
        : undefined,
      expected: ["number", "boolean"].includes(typeof error?.expected)
        ? error.expected
        : undefined,
    }),
  );
} finally {
  let cleaned = 0;
  for (const id of users) {
    try {
      const objects = await supa(
        "/storage/v1/object/list/trinity-audio",
        "POST",
        { prefix: id, limit: 100 },
      );
      if (objects?.length)
        await supa("/storage/v1/object/trinity-audio", "DELETE", {
          prefixes: objects.map((o) => id + "/" + o.name),
        });
      await supa("/auth/v1/admin/users/" + id, "DELETE");
      cleaned++;
    } catch {
      process.exitCode = 1;
    }
  }
  console.log(
    JSON.stringify({
      passed,
      checks,
      fixturesCreated: users.length,
      fixturesRemoved: cleaned,
      noMailSent: true,
    }),
  );
  if (cleaned !== users.length) process.exitCode = 1;
}
