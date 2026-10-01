import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  rankItems,
  moveSelection,
  recentIds,
  noteItems,
} from "../lib/workspace/search";
import { actions, destinations, mobileTabs } from "../lib/workspace/navigation";
import { searchOwnContent } from "../lib/workspace/server-search";
import { GET, POST } from "../app/api/settings/env/route";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
test("palette finds German words, actions and route aliases with multiple words", () => {
  assert.equal(rankItems(actions, "SPRaCHNOTIZ aufneh")[0].id, "record");
  assert.equal(rankItems(destinations, "ubersicht")[0].id, "home");
  assert.equal(rankItems(destinations, "trello")[0].id, "tasks");
  assert.equal(rankItems(actions, "nicht vorhanden").length, 0);
});
test("recency changes order but never overrides the query or introduces stale destinations", () => {
  const recent = ["removed-id", "new-project", "record"];
  assert.deepEqual(
    rankItems(actions, "", recent).map((i) => i.id),
    ["new-project", "record", "new-note"],
  );
  assert.equal(
    rankItems(actions, "notiz", recent).some((i) => i.id === "new-project"),
    false,
  );
  assert.deepEqual(recentIds("{broken"), []);
  assert.deepEqual(recentIds('[2,"notes"]'), ["notes"]);
});
test("keyboard selection wraps and is safe for empty/changing results", () => {
  assert.equal(moveSelection(2, "ArrowDown", 3), 0);
  assert.equal(moveSelection(0, "ArrowUp", 3), 2);
  assert.equal(moveSelection(0, "End", 3), 2);
  assert.equal(moveSelection(2, "Home", 3), 0);
  assert.equal(moveSelection(0, "ArrowDown", 0), -1);
  assert.equal(moveSelection(9, "Enter", 2), 1);
});
test("mobile has four distinct working destinations; all palette routes exist", () => {
  assert.equal(mobileTabs.length, 4);
  assert.equal(new Set(mobileTabs.map((x) => x.href)).size, 4);
  for (const d of [...destinations, ...actions, ...mobileTabs])
    assert.ok(existsSync("app" + d.href.split("?")[0] + "/page.tsx"), d.href);
  assert.equal(
    new Set(destinations.map((x) => x.id)).size,
    destinations.length,
  );
});
test("own tasks link to exact notes, while tags cannot inject routes", () => {
  const item = noteItems([
    { id: "id", title: "Aufgabe", type: "aufgabe", tags: ["a"] },
  ])[0];
  assert.equal(item.group, "Eigene Aufgaben");
  assert.equal(item.href, "/notiz?note=id");
});
test("private search always scopes all three queries by the verified owner, escapes filters and never reads shared legacy sources", async () => {
  const owner = randomUUID();
  const calls: URL[] = [];
  const sb = createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const u = new URL(new Request(input, init).url);
        calls.push(u);
        assert.equal(u.searchParams.get("user_id"), `eq.${owner}`);
        assert.equal(u.searchParams.get("limit"), "20");
        let data: unknown = [];
        if (u.pathname.endsWith("/trinity_notes"))
          data = [
            { id: "own", title: "Eigen", type: "aufgabe", tags: ["eigen"] },
          ];
        else if (u.pathname.endsWith("/trinity_projects"))
          data = [{ name: "A & B" }];
        else assert.fail("unexpected table");
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  const items = await searchOwnContent(sb, owner, "100%_");
  assert.equal(calls.length, 3);
  assert.equal(
    calls
      .find((u) => u.pathname.endsWith("trinity_projects"))!
      .searchParams.get("name"),
    "ilike.%100\\%\\_%",
  );
  assert.equal(items.filter((i) => i.id === "note-own").length, 1);
  assert.ok(items.some((i) => i.href === "/notiz?project=A%20%26%20B"));
});
test("search fails visibly if a data source fails rather than reporting an empty library", async () => {
  const sb = createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false },
    global: {
      fetch: async () =>
        new Response(JSON.stringify({ message: "unavailable" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
    },
  });
  await assert.rejects(() => searchOwnContent(sb, randomUUID(), "test"));
});
test("configuration endpoint neither exposes nor changes environment data", async () => {
  const marker = randomUUID();
  process.env.WORKSPACE_TEST_SECRET = marker;
  for (const fn of [GET, POST]) {
    const res = fn();
    assert.equal(res.status, 410);
    assert.ok(!(await res.text()).includes(marker));
  }
  assert.equal(process.env.WORKSPACE_TEST_SECRET, marker);
  delete process.env.WORKSPACE_TEST_SECRET;
});
