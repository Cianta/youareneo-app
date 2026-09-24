import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chineseYear,
  chineseMonth,
  dreamspell,
  celticTree,
  skyNow,
  tzolkin,
} from "../lib/workspace/cosmos";
import { calculateBirth } from "../lib/workspace/birth";
import { youtubeId } from "../lib/workspace/media";
import {
  markdownFile,
  fileName,
  neighbors,
  type BrainNode,
} from "../lib/workspace/brain";
test("Chinese year follows lunar new year; solar month changes at jie", () => {
  assert.match(chineseYear(new Date("2024-02-09T12:00Z")).name, /Hase/);
  assert.match(chineseYear(new Date("2024-02-10T12:00Z")).name, /Drache/);
  assert.match(chineseMonth(new Date("2026-02-02T12:00Z")).name, /Ochse/);
  assert.match(chineseMonth(new Date("2026-02-06T12:00Z")).name, /Tiger/);
});
test("Dreamspell anchor, leap day and tree boundaries are explicit", () => {
  assert.equal(dreamspell(new Date("1987-07-26T12:00Z")).kin, 34);
  assert.equal(dreamspell(new Date("2013-07-26T12:00Z")).kin, 164);
  assert.equal(
    dreamspell(new Date("1984-02-28T12:00Z")).kin,
    dreamspell(new Date("1984-02-29T12:00Z")).kin,
  );
  assert.equal(celticTree(new Date("2000-01-20T12:00Z")).name, "Birke");
  assert.equal(celticTree(new Date("2000-01-21T12:00Z")).name, "Eberesche");
});
test("Astronomical moon phase near known 2024 total eclipse", () => {
  const m = skyNow(new Date("2024-04-08T18:21Z")).moon;
  assert.equal(m.name, "Neumond");
  assert.equal(m.illumination, 0);
});
test("Birth chart uses timezone, refuses impossible dates, and does not invent HD without time", () => {
  const r = calculateBirth({
    date: "1972-08-02",
    time: "14:30",
    timezone: "Asia/Bangkok",
    city: "Bangkok",
  });
  assert.equal(r.utc, "1972-08-02T07:30:00.000Z");
  assert.equal(r.hd?.type, "Manifesting Generator");
  assert.equal(r.hd?.profile, "3/5");
  assert.equal(r.western.name, "Löwe");
  assert.equal(r.ascendant, null);
  assert.equal(
    calculateBirth({
      date: "2000-01-01",
      time: "",
      timezone: "Europe/Vienna",
      city: "",
    }).hd,
    null,
  );
  assert.throws(() =>
    calculateBirth({
      date: "2000-02-31",
      time: "12:00",
      timezone: "UTC",
      city: "",
    }),
  );
});
test("YouTube parser rejects impersonating hosts and accepts standard formats", () => {
  assert.equal(youtubeId("https://youtu.be/EWrX250Zhko"), "EWrX250Zhko");
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=EWrX250Zhko&t=30"),
    "EWrX250Zhko",
  );
  assert.equal(
    youtubeId("https://youtube.com.evil.org/watch?v=EWrX250Zhko"),
    null,
  );
  assert.equal(youtubeId("javascript:alert(1)"), null);
});
test("Vault export uses stable unique filenames, real links and reverse neighborhood", () => {
  const a: BrainNode = {
      id: "a",
      title: "A/B",
      kind: "Notiz",
      area: "Leben",
      body: "Gedanke",
      links: ["b", "missing"],
    },
    b = { ...a, id: "b", title: "Ziel", links: [] };
  assert(!fileName(a).includes("/"));
  const md = markdownFile(a, [a, b]);
  assert(md.includes("[[Ziel--b|Ziel]]"));
  assert(!md.includes("[[missing"));
  assert.deepEqual([...neighbors([a, b], "b")].sort(), ["a", "b"]);
});

test("Maya systems match independent reference dates", () => {
  assert.equal(tzolkin(new Date("2012-12-21T12:00Z")).name, "4 Ajaw");
  assert.equal(dreamspell(new Date("2024-09-22T12:00Z")).kin, 77);
  assert.equal(dreamspell(new Date("2026-09-24T12:00Z")).kin, 29);
});

import { findBirthPlaces } from "../lib/workspace/places";
test("changing city queries returns independent coordinates and handles German names", () => {
  const vienna = findBirthPlaces("Wien")[0];
  const graz = findBirthPlaces("Graz")[0];
  assert.match(vienna.name, /Vienna/);
  assert.match(graz.name, /Graz/);
  assert.notEqual(vienna.lat, graz.lat);
  assert.equal(graz.timezone, "Europe/Vienna");
  assert.match(findBirthPlaces("München, Deutschland")[0].name, /Munich/);
  assert.match(findBirthPlaces(vienna.name)[0].name, /Vienna/);
  assert.deepEqual(findBirthPlaces("no-such-city-xyz"), []);
});
