import test from "node:test";
import assert from "node:assert/strict";
import {
  weekDates,
  shiftMonth,
  monthStats,
  emptyDay,
} from "../lib/workspace/planner";
import { insertTranscript } from "../lib/voice/text";
import { seal, unseal, sameOrigin } from "../lib/voice/credentials";
import {
  allowedShortcut,
  matches,
  defaultRecord,
} from "../lib/voice/preferences";
test("Monday weeks cross year, leap day and daylight-saving boundaries", () => {
  assert.deepEqual(weekDates("2026-01-01"), [
    "2025-12-29",
    "2025-12-30",
    "2025-12-31",
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
    "2026-01-04",
  ]);
  assert.equal(weekDates("2026-03-29")[6], "2026-03-29");
  assert.equal(shiftMonth("2024-01-31", 1), "2024-02-01");
});
test("monthly totals exclude other workspace/month and blank checked rows", () => {
  const days = {
    "private:2026-09-01": {
      ...emptyDay(),
      top: ["One", "", "Three"],
      completed: [true, true, false],
      energy: 4,
      gratitude: "A good moment",
    },
    "organization:2026-09-01": {
      ...emptyDay(),
      top: ["No"],
      completed: [true],
    },
    "private:2026-08-31": { ...emptyDay(), top: ["No"], completed: [true] },
  };
  assert.deepEqual(monthStats(days, "private", "2026-09"), {
    active: 1,
    planned: 2,
    completed: 1,
    energy: 4,
    gratitude: 1,
  });
  assert.equal(monthStats({}, "private", "2026-09").energy, null);
});
test("dictation replaces selected text but preserves edits made during transcription", () => {
  assert.equal(
    insertTranscript("Hello world", "Hello world", 6, 11, "Trinity").value,
    "Hello Trinity",
  );
  assert.equal(
    insertTranscript("Hello, edited", "Hello", 5, 5, "Trinity").value,
    "Hello, edited Trinity",
  );
  assert.equal(
    insertTranscript("", "", 0, 0, "  A thought  ").value,
    "A thought",
  );
});
test("voice secrets are encrypted and bound to account and provider", () => {
  process.env.APP_SECRET = "local-test-only-not-a-production-secret";
  const cipher = seal("test-api-key", "one@example.test", "openai");
  assert.ok(!cipher.includes("test-api-key"));
  assert.equal(unseal(cipher, "one@example.test", "openai"), "test-api-key");
  assert.throws(() => unseal(cipher, "two@example.test", "openai"));
  assert.throws(() => unseal(cipher, "one@example.test", "groq"));
});
test("shortcuts reject destructive/browser shortcuts and match modifiers exactly", () => {
  assert.equal(
    allowedShortcut({ ...defaultRecord, code: "KeyQ", meta: true }),
    false,
  );
  assert.equal(
    allowedShortcut({
      ...defaultRecord,
      code: "KeyA",
      ctrl: false,
      shift: false,
    }),
    false,
  );
  assert.ok(
    matches(
      {
        code: "Space",
        ctrlKey: true,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      },
      defaultRecord,
    ),
  );
  assert.ok(
    !matches(
      {
        code: "Space",
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        metaKey: false,
      },
      defaultRecord,
    ),
  );
});
test("voice settings reject cross-origin requests", () => {
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3000/api/voice/settings", {
        headers: { origin: "https://evil.example" },
      }),
    ),
    false,
  );
});
