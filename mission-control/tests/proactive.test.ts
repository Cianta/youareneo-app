import test from "node:test";
import assert from "node:assert/strict";
import {afterDismissed, afterShown, afterSnoozed, decideProactive, emptyMemory, memoryOf, type ProactiveContext} from "../lib/assistant/proactive";
import {preferencesOf} from "../lib/assistant/preferences";
const MIN = 60_000, at = (h: number, d = 5) => new Date(2026, 9, d, h, 0, 0).getTime();
const ctx = (o: Partial<ProactiveContext> = {}): ProactiveContext => ({mode: "gentle", name: "Trinity", hour: 10, path: "/dashboard", sessionMs: 5 * MIN, idleMs: 0, draftAgeMs: null, busy: false, ...o});
test("first quiet moment of the day greets once and asks how the person is", () => {
  const now = at(9), s = decideProactive(ctx({hour: 9}), emptyMemory, now)!;
  assert.equal(s.kind, "greet"); assert(s.text.startsWith("Guten Morgen")); assert(/Wie geht es dir/.test(s.text));
  assert.equal(decideProactive(ctx({hour: 9, sessionMs: 5_000}), emptyMemory, now), null, "not right after opening");
  const after = afterShown(emptyMemory, "greet", now);
  assert.equal(decideProactive(ctx({hour: 9}), after, now + 40 * MIN), null, "no second greeting the same day");
});
test("never interrupts a recording, an open panel or a disabled setting", () => {
  assert.equal(decideProactive(ctx({busy: true}), emptyMemory, at(9)), null);
  assert.equal(decideProactive(ctx({mode: "off"}), emptyMemory, at(9)), null);
});
test("idle check-in respects idle threshold, gap and daily limit", () => {
  const m = {...emptyMemory, greetedDay: "2026-10-05"}, now = at(14);
  assert.equal(decideProactive(ctx({idleMs: 2 * MIN}), m, now), null);
  const s = decideProactive(ctx({idleMs: 7 * MIN, path: "/notiz"}), m, now)!;
  assert.equal(s.kind, "checkin"); assert(/einzuordnen/.test(s.text));
  let mem = afterShown(m, "checkin", now);
  assert.equal(decideProactive(ctx({idleMs: 9 * MIN}), mem, now + 10 * MIN), null, "gap");
  mem = afterShown(mem, "checkin", now + 40 * MIN);
  assert.equal(decideProactive(ctx({idleMs: 9 * MIN}), mem, now + 90 * MIN), null, "2 per day in gentle mode");
  assert(decideProactive(ctx({idleMs: 9 * MIN}), mem, at(14, 6)), "new day starts fresh");
});
test("waiting draft beats greeting; late hour gets a gentler line", () => {
  assert.equal(decideProactive(ctx({draftAgeMs: 3 * MIN}), emptyMemory, at(9))!.kind, "draft");
  const late = decideProactive(ctx({hour: 23, idleMs: 7 * MIN}), {...emptyMemory, greetedDay: "2026-10-05"}, at(23))!;
  assert.equal(late.kind, "late");
});
test("dismissing backs off and snoozing silences the rest of the day", () => {
  const now = at(15), m = {...emptyMemory, greetedDay: "2026-10-05"};
  assert.equal(decideProactive(ctx({idleMs: 9 * MIN, mode: "active"}), afterDismissed(m, now), now + 5 * MIN), null);
  assert(decideProactive(ctx({idleMs: 9 * MIN, mode: "active"}), afterDismissed(m, now), now + 25 * MIN));
  assert.equal(decideProactive(ctx({idleMs: 9 * MIN, mode: "active"}), afterSnoozed(m, now), now + 300 * MIN), null);
});
test("stored memory and preferences reject malformed values", () => {
  const m = memoryOf({day: 5, shown: -3, lastShownAt: "x", snoozedDay: "2026-10-05".repeat(5), extra: "no"});
  assert.equal(m.day, ""); assert.equal(m.shown, 0); assert.equal(m.lastShownAt, 0); assert.equal(m.snoozedDay.length, 16); assert(!("extra" in m));
  assert.equal(preferencesOf({proactive: "loud"}).proactive, "gentle");
  assert.equal(preferencesOf({proactive: "off"}).proactive, "off");
});
