import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { providerConfig, importContacts } from "../lib/crm/providers";
import { mergeImported, type MemberContact } from "../lib/crm/contracts";
import { readMemberContacts, updateMemberContacts } from "../lib/crm/cache";
import {
  invitationOf,
  sendInvitation,
  meetingConfigured,
} from "../lib/meeting/mail";
import { roomUrl } from "../lib/meeting/room";
import { brainInsights } from "../lib/brain/insights";
import type { BrainGraph } from "../lib/brain/graph";
const owner = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
const env = {
  CRM_HUBSPOT_OWNER_USER_ID: owner,
  CRM_HUBSPOT_TOKEN: "fixture-only",
  CRM_GHL_OWNER_USER_ID: owner,
  CRM_GHL_TOKEN: "fixture-only",
  CRM_GHL_LOCATION_ID: "fixture-location",
};
const contact: MemberContact = {
  id: "hubspot:1",
  name: "Ada",
  email: "ada@example.test",
  company: "Atelier",
  source: "hubspot",
  workspace: "organization",
  updatedAt: "2026-10-04T10:00:00Z",
};
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("CRM credentials require an explicitly matching verified owner", async () => {
  assert.equal(providerConfig("hubspot", other, env), null);
  assert.equal(providerConfig("ghl", other, env), null);
  assert.equal(
    providerConfig("ghl", owner, { ...env, CRM_GHL_LOCATION_ID: undefined }),
    null,
  );
  assert.equal(
    providerConfig("hubspot", owner, {
      ...env,
      CRM_HUBSPOT_OWNER_USER_ID: undefined,
    }),
    null,
  );
  let calls = 0;
  await assert.rejects(
    importContacts(
      "hubspot",
      other,
      async () => {
        calls++;
        return response({});
      },
      env,
    ),
    /nicht eingerichtet/,
  );
  assert.equal(calls, 0);
});
test("HubSpot follows only validated cursor values, never the returned URL", async () => {
  const calls: URL[] = [];
  const result = await importContacts(
    "hubspot",
    owner,
    async (input, init) => {
      const url = new URL(String(input));
      calls.push(url);
      assert.equal(url.origin, "https://api.hubapi.com");
      assert.equal(init?.redirect, "error");
      return calls.length === 1
        ? response({
            results: [
              {
                id: "1",
                properties: {
                  firstname: "Ada",
                  lastname: "Lovelace",
                  email: "ada@example.test",
                },
              },
            ],
            paging: {
              next: { after: "2", link: "https://untrusted.example.test" },
            },
          })
        : response({
            results: [
              {
                id: "2",
                properties: { firstname: "Grace", company: "Atelier" },
              },
            ],
          });
    },
    env,
  );
  assert.equal(calls[1].searchParams.get("after"), "2");
  assert.deepEqual(
    result.contacts.map((c) => c.name),
    ["Ada Lovelace", "Grace"],
  );
  assert.equal(result.truncated, false);
});
test("GHL uses the supported read-only search and paginates, retaining only its location", async () => {
  let calls = 0;
  const result = await importContacts(
    "ghl",
    owner,
    async (input, init) => {
      calls++;
      assert.equal(
        String(input),
        "https://services.leadconnectorhq.com/contacts/search",
      );
      const body = JSON.parse(String(init?.body));
      assert.equal(body.locationId, "fixture-location");
      assert.equal(body.page, calls);
      assert.equal(body.pageLimit, 100);
      assert.equal(init?.method, "POST");
      return response({
        contacts:
          calls === 1
            ? Array.from({ length: 100 }, (_, i) => ({
                id: String(i),
                locationId: "fixture-location",
                firstNameLowerCase: "ada",
                lastNameLowerCase: String(i),
                companyName: "Atelier",
              }))
            : [
                {
                  id: "100",
                  locationId: "fixture-location",
                  firstNameLowerCase: "grace",
                },
                {
                  id: "foreign",
                  locationId: "another-location",
                  email: "never@example.test",
                },
              ],
        total: 102,
      });
    },
    env,
  );
  assert.equal(calls, 2);
  assert.equal(result.contacts.length, 101);
  assert.equal(result.contacts[100].name, "grace");
  assert(!result.contacts.some((c) => c.id === "ghl:foreign"));
});
test("CRM refuses repeated pages and redacts provider error bodies", async () => {
  await assert.rejects(
    importContacts(
      "hubspot",
      owner,
      async () =>
        response({ results: [], paging: { next: { after: "same" } } }),
      env,
    ),
    /wiederholte Seiten/,
  );
  await assert.rejects(
    importContacts(
      "hubspot",
      owner,
      async () => response({ error: "fixture-only" }, 401),
      env,
    ),
    (e) => e instanceof Error && !e.message.includes("fixture-only"),
  );
  await assert.rejects(
    importContacts("ghl", owner, async () => response({ contacts: {} }), env),
    /unerwartetes Format/,
  );
});
test("CRM repeated imports preserve relationship metadata and other sources", () => {
  const old = {
    ...contact,
    note: "Gemeinsame Idee",
    stage: "verbunden" as const,
    nextContact: "2026-10-06",
    favorite: true,
    tags: ["garten"],
    workspace: "private" as const,
  };
  const ghl = { ...contact, id: "ghl:1", source: "ghl" as const };
  const merged = mergeImported(
    [old, ghl],
    [{ ...contact, name: "Ada neu", tags: ["kunst"] }],
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[0].name, "Ada neu");
  assert.equal(merged[0].note, "Gemeinsame Idee");
  assert.equal(merged[0].workspace, "private");
  assert.equal(merged[0].favorite, true);
  assert.deepEqual(merged[0].tags, ["garten", "kunst"]);
  assert.equal(mergeImported(merged, [contact]).length, 2);
});
test("CRM private cache isolates users and serializes concurrent updates", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "guiding-studio-fixture-"));
  try {
    await Promise.all([
      updateMemberContacts(root, owner, (c) => [...c, contact]),
      updateMemberContacts(root, owner, (c) => [
        ...c,
        { ...contact, id: "ghl:2", source: "ghl" },
      ]),
    ]);
    assert.equal((await readMemberContacts(root, owner)).length, 2);
    assert.deepEqual(await readMemberContacts(root, other), []);
    await assert.rejects(readMemberContacts(root, "../another"));
    assert.equal(
      (await stat(path.join(root, "crm-users", owner + ".json"))).mode & 0o777,
      0o600,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
const invite = invitationOf({
  id: "33333333-3333-4333-8333-333333333333",
  to: "ada@example.test",
  room: "https://meet.example.test/atelier",
  subject: "Ein Gespräch",
  message: "Hallo Ada",
});
const smtp = {
  MEETING_MAIL_OWNER_USER_ID: owner,
  MEETING_SMTP_USER: "fixture",
  MEETING_SMTP_PASSWORD: "fixture",
  MEETING_SMTP_FROM: "noreply@example.test",
};
test("invitation rejects invalid links, header injection and recipients", () => {
  assert.equal(roomUrl("https://person:fixture@example.test/room"), null);
  assert.equal(roomUrl("javascript:alert(1)"), null);
  assert.throws(() =>
    invitationOf({
      ...invite,
      subject: "Einladung\r\nBcc: elsewhere@example.test",
    }),
  );
  assert.throws(() => invitationOf({ ...invite, to: "bad-address" }));
});
test("SMTP is denied before any transport call for a different account", async () => {
  assert.equal(meetingConfigured(other, smtp), false);
  let calls = 0;
  await assert.rejects(
    sendInvitation(other, invite, smtp, async () => {
      calls++;
    }),
    /nicht eingerichtet/,
  );
  assert.equal(calls, 0);
});
test("SMTP fixture sends once, includes chosen room and rejects changed retries", async () => {
  let calls = 0;
  const deliver = async (mail: { text: string; to: string }) => {
    calls++;
    assert.equal(mail.to, "ada@example.test");
    assert(mail.text.includes("https://meet.example.test/atelier"));
  };
  assert.deepEqual(await sendInvitation(owner, invite, smtp, deliver), {
    sent: true,
    duplicate: false,
  });
  assert.deepEqual(await sendInvitation(owner, invite, smtp, deliver), {
    sent: true,
    duplicate: true,
  });
  assert.equal(calls, 1);
  await assert.rejects(
    sendInvitation(owner, { ...invite, message: "changed" }, smtp, deliver),
    /anderem Inhalt/,
  );
});
test("uncertain delivery is never automatically resent", async () => {
  const another = { ...invite, id: "44444444-4444-4444-8444-444444444444" };
  let calls = 0;
  const fail = async () => {
    calls++;
    throw Error("fixture SMTP credentials must not leak");
  };
  await assert.rejects(
    sendInvitation(owner, another, smtp, fail),
    (e) => e instanceof Error && !e.message.includes("credentials"),
  );
  await assert.rejects(sendInvitation(owner, another, smtp, fail), /unklar/);
  assert.equal(calls, 1);
});
test("brain charts count only the selected nodes and their visible links", () => {
  const graph: BrainGraph = {
    truncated: true,
    nodes: [
      {
        id: "1",
        label: "Idee",
        type: "notiz",
        summary: "",
        href: "/notiz",
        degree: 2,
        createdAt: "2026-10-04T10:00:00Z",
      },
      {
        id: "2",
        label: "#garten",
        type: "tag",
        summary: "",
        href: "/notiz",
        degree: 1,
        createdAt: "2026-10-04T10:00:00Z",
      },
      {
        id: "3",
        label: "Freier Gedanke",
        type: "aufgabe",
        summary: "",
        href: "/notiz",
        degree: 0,
        createdAt: "2026-10-04T10:00:00Z",
      },
    ],
    links: [{ source: "1", target: "2", kind: "tag" }],
  };
  const insights = brainInsights(
    graph,
    graph.nodes,
    new Date("2026-10-04T12:00:00"),
  );
  assert.equal(insights.links, 1);
  assert.equal(insights.connected, 2);
  assert.equal(insights.days.at(-1)?.count, 2);
  assert.equal(insights.unlinked[0].id, "3");
  assert.equal(brainInsights(graph, [graph.nodes[0]]).links, 0);
});

test("large CRM imports stop at 2,000 contacts and explicitly report an excerpt", async () => {
  let calls = 0;
  const result = await importContacts(
    "hubspot",
    owner,
    async () => {
      calls++;
      return response({
        results: Array.from({ length: 100 }, (_, i) => ({
          id: String(calls * 100 + i),
          properties: { firstname: "Fixture" },
        })),
        paging: { next: { after: String(calls) } },
      });
    },
    env,
  );
  assert.equal(calls, 20);
  assert.equal(result.contacts.length, 2000);
  assert.equal(result.truncated, true);
});
