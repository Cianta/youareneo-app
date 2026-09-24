import { NextResponse } from "next/server";
import { calculateBirth } from "@/lib/workspace/birth";
import { findBirthPlaces } from "@/lib/workspace/places";
import { chineseYear, dreamspell } from "@/lib/workspace/cosmos";
/** Compatibility adapter for existing team profiles. UTC input is already converted by the client. */
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const places = findBirthPlaces(b.birthCity || "");
    const place = places.length === 1 ? places[0] : null;
    const r = calculateBirth({
      date: b.birthDate,
      time: b.birthTime ?? "",
      timezone: "UTC",
      city: b.birthCity ?? "",
      ...(place ? { lat: place.lat, lng: place.lng } : {}),
    });
    const civil = b.birthDateLocal
      ? new Date(`${b.birthDateLocal}T12:00:00Z`)
      : new Date(`${b.birthDate}T12:00:00Z`);
    if (!Number.isFinite(civil.getTime()))
      throw new Error("Ungültiges lokales Geburtsdatum");
    const ch = chineseYear(civil),
      maya = dreamspell(civil),
      hd = r.hd;
    return NextResponse.json({
      sunTropical: r.western.name,
      sunTropGlyph: r.western.icon,
      sunVedic: r.vedic.name,
      sunVedGlyph: r.vedic.icon,
      moonTropical: r.moon.name,
      moonTropGlyph: r.moon.icon,
      ascTropical: r.ascendant?.name ?? null,
      ascTropGlyph: r.ascendant?.icon ?? null,
      ascVedic: r.ascendantVedic?.name ?? null,
      ascVedGlyph: r.ascendantVedic?.icon ?? null,
      chinese: ch.name,
      chineseEmoji: ch.icon,
      maya: { ...maya, toneName: `Ton ${maya.tone}`, glyph: maya.icon },
      hd: hd
        ? {
            ...hd,
            gateConscious: hd.p_.sun.gate,
            lineConscious: hd.p_.sun.line,
            gateDesign: hd.d_.sun.gate,
            lineDesign: hd.d_.sun.line,
            designSunLon: hd.d_.sun.longitude,
          }
        : null,
      meta: {
        ...r.meta,
        geocoded: !!r.ascendant,
        birthDateUsed: b.birthDate,
        birthTimeUsed: b.birthTime || "12:00 (Mittagsnäherung)",
        engine: "astronomy-engine 2.1.19 / free-human-design 1.0.1",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Berechnung fehlgeschlagen" },
      { status: 400 },
    );
  }
}
