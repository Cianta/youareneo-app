import { SunPosition, EclipticGeoMoon } from "astronomy-engine";
import { computeChart, parseBirthToUtc } from "free-human-design";
import { signAt, chineseYear, dreamspell, celticTree } from "./cosmos";
export type BirthInput = {
  date: string;
  time: string;
  timezone: string;
  city: string;
  lat?: number;
  lng?: number;
};
export function calculateBirth(input: BirthInput) {
  if ((input.lat !== undefined || input.lng !== undefined) &&
    (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || Math.abs(input.lat!) >= 90 || Math.abs(input.lng!) > 180))
    throw new Error("Bitte gültige Breiten- und Längengrade gemeinsam eingeben.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    throw new Error("Bitte ein gültiges Geburtsdatum eingeben.");
  const civil = new Date(`${input.date}T12:00:00Z`);
  if (
    !Number.isFinite(civil.getTime()) ||
    civil.toISOString().slice(0, 10) !== input.date
  )
    throw new Error("Dieses Datum existiert nicht.");
  if (civil.getUTCFullYear() < 1900 || civil.getUTCFullYear() > 2100)
    throw new Error("Unterstützter Zeitraum: 1900–2100.");
  const args = {
    birthdate: input.date,
    birthtime: input.time || "12:00",
    timezone: input.timezone,
  };
  const utc = parseBirthToUtc(args),
    sl = SunPosition(utc).elon,
    ml = EclipticGeoMoon(utc).lon,
    years = (utc.getTime() - Date.UTC(2000, 0, 1, 12)) / 31557600000,
    aya = 23.85 + 0.013972 * years;
  const chart = input.time
    ? computeChart({
        ...args,
        ...(Number.isFinite(input.lat) && Number.isFinite(input.lng)
          ? { location: { lat: input.lat!, lng: input.lng! } }
          : {}),
      })
    : null;
  return {
    western: signAt(sl),
    moon: signAt(ml),
    vedic: signAt(sl - aya),
    vedicMoon: signAt(ml - aya),
    chinese: chineseYear(civil),
    maya: dreamspell(civil),
    celtic: celticTree(civil),
    hd: chart?.humanDesign ?? null,
    utc: utc.toISOString(),
    meta: { sunLonDeg: sl, sunLonVedic: ((sl - aya) % 360 + 360) % 360, JD: utc.getTime() / 86400000 + 2440587.5 },
    ascendantVedic: chart?.astrology && Number.isFinite(input.lat) && Number.isFinite(input.lng)
      ? signAt(chart.astrology.angles.ascendant.longitude - aya) : null,
    ascendant:
      chart?.astrology &&
      Number.isFinite(input.lat) &&
      Number.isFinite(input.lng)
        ? signAt(chart.astrology.angles.ascendant.longitude)
        : null,
  };
}
export type BirthResult = ReturnType<typeof calculateBirth>;
