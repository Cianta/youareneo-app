import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGraph,
  filterGraph,
  matchesNode,
  type Snapshot,
} from "../lib/brain/graph";
import { ownGraph } from "../lib/brain/server";
import { tooltip } from "../components/brain/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
const note = (id: string, user_id = "a") => ({
  id,
  user_id,
  title: id,
  summary: "",
  transcript: "Hallo @Atelier #gemeinsam",
  type: "notiz",
  project: null,
  tags: ["gemeinsam"],
  assignee: "Ada",
  created_at: "2026-10-01T00:00:00Z",
});
const raw: Snapshot = {
  notes: [
    note("a"),
    { ...note("b"), type: "aufgabe", project: "Atelier" },
    note("foreign", "b"),
  ],
  projects: [
    { name: "Atelier", user_id: "a", created_at: "2025-01-01T00:00:00Z" },
    { name: "Privat", user_id: "b", created_at: "" },
  ],
  queue: [
    {
      note_id: "a",
      user_id: "a",
      status: "wartet_auf_bestaetigung",
      created_at: "2026-10-01",
    },
    { note_id: "foreign", user_id: "b", status: "freigegeben", created_at: "" },
    { note_id: "b", user_id: "b", status: "freigegeben", created_at: "" },
  ],
};
test("graph contains only owner records; all links have own endpoints", () => {
  const g = buildGraph(raw, "a");
  assert(!JSON.stringify(g).includes("foreign"));
  assert(!JSON.stringify(g).includes("Privat"));
  assert(!g.nodes.some((n) => n.id === "hermes:b"));
  const ids = new Set(g.nodes.map((n) => n.id));
  assert(g.links.every((l) => ids.has(l.source) && ids.has(l.target)));
  assert.equal(g.nodes.find((n) => n.id === "note:b")?.type, "aufgabe");
  assert(
    g.links.some(
      (l) => l.kind === "erwaehnung" && l.target === "project:Atelier",
    ),
  );
  assert.equal(g.nodes.filter((n) => n.id === "tag:gemeinsam").length, 1);
  assert.equal(g.links.filter((l) => l.kind === "tag").length, 2);
  assert(g.links.some((l) => l.kind === "hermes"));
  assert(g.links.some((l) => l.kind === "zustaendig"));
});
test("project mentions escape regex and support spaces, do not invent foreign projects", () => {
  const s: Snapshot = {
    notes: [
      {
        ...note("a"),
        transcript: "@[A+B (Plan)] #Idee @Unknown",
        assignee: null,
        tags: [],
      },
    ],
    projects: [{ name: "A+B (Plan)", user_id: "a", created_at: "" }],
    queue: [],
  };
  const g = buildGraph(s, "a");
  assert(g.links.some((l) => l.kind === "erwaehnung"));
  assert(g.nodes.some((n) => n.id === "tag:idee"));
  assert(!g.nodes.some((n) => n.label === "Unknown"));
});
test("hard cap has no dangling edges and reports truncation", () => {
  const s = {
    ...raw,
    notes: Array.from({ length: 1000 }, (_, i) => ({
      ...note(String(i)),
      tags: ["tag" + i],
      assignee: "Person " + i,
    })),
  };
  const start = performance.now();
  const g = buildGraph(s, "a");
  assert.equal(g.nodes.length, 2000);
  assert(g.truncated);
  const ids = new Set(g.nodes.map((n) => n.id));
  assert(g.links.every((l) => ids.has(l.source) && ids.has(l.target)));
  assert(performance.now() - start < 2000);
});
test("time filter preserves related old projects; types and searches apply", () => {
  const g = buildGraph(raw, "a");
  const f = filterGraph(g, ["notiz", "projekt"], "2026-09-01");
  assert(f.nodes.some((n) => n.id === "project:Atelier"));
  assert(f.nodes.every((n) => ["notiz", "projekt"].includes(n.type)));
  assert.equal(filterGraph(g, ["notiz"], "2027-01-01").nodes.length, 0);
  assert(
    matchesNode(
      g.nodes.find((n) => n.type === "projekt")!,
      "ATELIER",
    ),
  );
});
test("cache isolates owners, reuses one RPC and refresh bypasses it", async () => {
  let calls = 0;
  const sb = {
    rpc: async (name: string) => {
      assert.equal(name, "trinity_brain_snapshot");
      calls++;
      return { data: raw, error: null };
    },
  } as unknown as SupabaseClient;
  await ownGraph(sb, "a", true);
  await ownGraph(sb, "a");
  assert.equal(calls, 1);
  const other = await ownGraph(sb, "b");
  assert.equal(calls, 2);
  assert(!other.nodes.some((n) => n.id === "note:a"));
  await ownGraph(sb, "a", true);
  assert.equal(calls, 3);
});
test("tooltip escapes user HTML and links encode note IDs", () => {
  const g = buildGraph(
    {
      ...raw,
      notes: [{ ...note("a"), title: "<img src=x onerror=alert(1)>" }],
    },
    "a",
  );
  assert(!tooltip(g.nodes[0]).includes("<img"));
  assert.equal(g.nodes[0].href, "/notiz?note=a");
});
