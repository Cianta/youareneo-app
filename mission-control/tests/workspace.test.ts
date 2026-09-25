import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyBoard,
  createTask,
  moveTask,
  boardTasks,
  parseBoard,
} from "../lib/workspace/board";
import {
  remainingSeconds,
  formatCountdown,
  localDate,
  overlaps,
  validWebUrl,
} from "../lib/workspace/time";
import { readAgentStream } from "../lib/workspace/stream";

test("task creation and completion share the existing board document without dropping metadata", () => {
  const initial = emptyBoard();
  initial.groups = [
    { id: "group", name: "Keep me", color: "#fff", cardIds: [] },
  ];
  const added = createTask(initial, "  Prepare workshop  ", "Alice");
  assert.equal(Object.keys(initial.cards).length, 0);
  const [task] = boardTasks(added, "Alice");
  assert.equal(task.title, "Prepare workshop");
  assert.equal(task.done, false);
  const completed = moveTask(added, task.projectId, task.id, "col-erledigt");
  assert.equal(boardTasks(completed, "Alice")[0].done, true);
  assert.equal(
    completed.projects[0].columns.reduce(
      (sum, c) => sum + c.cardIds.filter((id) => id === task.id).length,
      0,
    ),
    1,
  );
  assert.deepEqual(completed.groups, initial.groups);
  assert.equal(boardTasks(completed, "Bob").length, 0);
});
test("invalid stored documents are rejected rather than overwritten with an empty board", () => {
  assert.throws(() => parseBoard("{broken"));
  assert.throws(() => parseBoard("null"));
  const legacy = { ...emptyBoard(), connections: undefined };
  assert.deepEqual(parseBoard(JSON.stringify(legacy)).connections, []);
  assert.throws(() => parseBoard('{"projects":[{}],"cards":{}}'));
  assert.throws(() => parseBoard('{"projects":{},"cards":{}}'));
});
test("task creation respects custom columns and visible projects", () => {
  const b = emptyBoard();
  b.projects[0].ownerId = "Bob";
  assert.throws(() => createTask(b, "Not mine", "Alice"));
  b.projects[0].sharedWith = "all";
  b.projects[0].columns = [
    { id: "custom", label: "Waiting", color: "", cardIds: [] },
    { id: "finished", label: "Done", color: "", cardIds: [] },
  ];
  const next = createTask(b, "A task", "Alice");
  assert.equal(next.projects[0].columns[0].cardIds.length, 1);
  assert.throws(() => moveTask(next, "proj-default", "missing", "finished"));
});
test("clock catches up after suspension and never becomes negative", () => {
  const now = 1_000_000;
  assert.equal(remainingSeconds(now + 45_000, 45, now + 32_500), 13);
  assert.equal(remainingSeconds(now + 45_000, 45, now + 90_000), 0);
  assert.equal(remainingSeconds(null, 180, now), 180);
  assert.equal(formatCountdown(2700), "45:00");
});
test("focus store starts, pauses, resumes and completes without duplicate ticks", async () => {
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); },
    removeItem: (key: string) => { memory.delete(key); },
  } });
  const { useFocusStore, POMO_DURATIONS } = await import('../lib/store');
  const originalNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    useFocusStore.setState({
      pomodoroMode: "focus",
      pomodoroSeconds: 45,
      pomodoroRunning: false,
      pomodoroDeadline: null,
      pomodoroRound: 0,
    });
    useFocusStore.getState().togglePomodoro();
    now += 20_000;
    useFocusStore.getState().tickPomodoro();
    useFocusStore.getState().tickPomodoro();
    assert.equal(useFocusStore.getState().pomodoroSeconds, 25);
    useFocusStore.getState().togglePomodoro();
    now += 200_000;
    useFocusStore.getState().tickPomodoro();
    assert.equal(useFocusStore.getState().pomodoroSeconds, 25);
    useFocusStore.getState().togglePomodoro();
    now += 30_000;
    useFocusStore.getState().tickPomodoro();
    assert.equal(useFocusStore.getState().pomodoroSeconds, 0);
    assert.equal(useFocusStore.getState().pomodoroRunning, false);
    useFocusStore.getState().advancePomodoro();
    assert.equal(useFocusStore.getState().pomodoroMode, "break");
    assert.equal(
      useFocusStore.getState().pomodoroSeconds,
      POMO_DURATIONS.break,
    );
    assert.equal(useFocusStore.getState().pomodoroDeadline, null);
    useFocusStore.getState().advancePomodoro();
    useFocusStore.getState().advancePomodoro();
    assert.equal(useFocusStore.getState().pomodoroMode, "deep-recovery");
  } finally {
    Date.now = originalNow;
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
test("calendar local dates and overlap boundaries", () => {
  assert.equal(localDate(new Date(2026, 8, 24, 0, 10)), "2026-09-24");
  assert.equal(
    overlaps(
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "09:30", endTime: "10:30" },
    ),
    true,
  );
  assert.equal(
    overlaps(
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "10:00", endTime: "11:00" },
    ),
    false,
  );
  assert.equal(overlaps({}, { startTime: "10:00", endTime: "11:00" }), false);
});
test("launcher permits web URLs, rejects scripts and embedded credentials", () => {
  assert.equal(validWebUrl("javascript:alert(1)"), null);
  assert.equal(validWebUrl("data:text/html,hello"), null);
  assert.equal(validWebUrl("https://user:password@example.com"), null);
  assert.equal(validWebUrl("not a url"), null);
  assert.equal(validWebUrl("https://example.com"), "https://example.com/");
});
function chunks(parts: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(c) {
      for (const p of parts) c.enqueue(p);
      c.close();
    },
  });
}
test("AI streaming preserves text across arbitrary byte boundaries, including umlauts", async () => {
  const bytes = new TextEncoder().encode(
    'data: {"text":"Grüße 🌿"}\r\n\r\ndata: {"delta":" aus Trinity"}\n\ndata: [DONE]\n\n',
  );
  const result = await readAgentStream(
    chunks([...bytes].map((b) => Uint8Array.of(b))),
    () => {},
  );
  assert.equal(result, "Grüße 🌿 aus Trinity");
});
test("AI provider errors and truncated responses reach the user instead of appearing successful", async () => {
  const encoder = new TextEncoder();
  await assert.rejects(
    readAgentStream(
      chunks([encoder.encode('data: {"error":"Provider unavailable"}\n\n')]),
      () => {},
    ),
    /Provider unavailable/,
  );
  await assert.rejects(
    readAgentStream(
      chunks([encoder.encode('data: {"text":"partial"}\n\n')]),
      () => {},
    ),
    /unterbrochen/,
  );
});
