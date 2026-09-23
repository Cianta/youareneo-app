/**
 * /api/astro — Server-side astronomical calculations
 *
 * Implements Jean Meeus "Astronomical Algorithms" (2nd edition):
 *   • Sun apparent longitude  (ch.25) — ±0.01°
 *   • Moon longitude          (ch.47 simplified) — ±0.3°
 *   • Obliquity of ecliptic   (ch.22)
 *   • Greenwich Sidereal Time (ch.12)
 *   • Tropical Ascendant      (ch.14)
 *   • Lahiri Ayanamsa — ±0.1°
 *   • Chinese zodiac with lunation-based New Year correction
 *   • Maya Dreamspell Kin (1987-07-26 epoch)
 *   • Human Design I-Ching Gate Wheel (Ra Uru Hu standard)
 *     Profile = Personality-Sun-Line / Design-Sun-Line (Design = Sun 88° before natal)
 *
 * Geocoding: OpenStreetMap Nominatim (free, no key required)
 */

import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
//  Math helpers
// ─────────────────────────────────────────────────────────────────────────────
const DEG  = Math.PI / 180;
const RAD  = 180 / Math.PI;
const mod360 = (x: number) => ((x % 360) + 360) % 360;

// ─────────────────────────────────────────────────────────────────────────────
//  Julian Day Number  (Meeus ch.7)
// ─────────────────────────────────────────────────────────────────────────────
function jdn(year: number, month: number, day: number, hourUT = 12): number {
  let Y = year, M = month;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716))
       + Math.floor(30.6001 * (M + 1))
       + day + B - 1524.5 + hourUT / 24;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sun apparent longitude  (Meeus ch.25, ±0.01°)
// ─────────────────────────────────────────────────────────────────────────────
function sunLon(JD: number): number {
  const T  = (JD - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M  = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
           + 0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * DEG;
  return mod360(L0 + C - 0.00569 - 0.00478 * Math.sin(omega));
}

// ─────────────────────────────────────────────────────────────────────────────
//  Moon longitude  (Meeus ch.47 abridged, ±0.3°)
// ─────────────────────────────────────────────────────────────────────────────
function moonLon(JD: number): number {
  const T  = (JD - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D  = (297.8501921 + 445267.1114034 * T) * DEG;
  const M  = (357.5291092 + 35999.0502909  * T) * DEG;
  const Mp = (134.9633964 + 477198.8675055 * T) * DEG;
  const F  = (93.2720950  + 483202.0175233 * T) * DEG;
  const Σl = 6288774 * Math.sin(Mp)
    + 1274027 * Math.sin(2*D - Mp) + 658314 * Math.sin(2*D)
    +  213618 * Math.sin(2*Mp)     - 185116 * Math.sin(M)
    -  114332 * Math.sin(2*F)      +  58793 * Math.sin(2*D - 2*Mp)
    +   57066 * Math.sin(2*D-M-Mp) +  53322 * Math.sin(2*D + Mp)
    +   45758 * Math.sin(2*D - M)  -  40923 * Math.sin(M - Mp)
    -   34720 * Math.sin(D)        -  30383 * Math.sin(M + Mp)
    +   15327 * Math.sin(2*F)      -  12528 * Math.sin(Mp + 2*F)
    +   10980 * Math.sin(Mp - 2*F) +  10675 * Math.sin(4*D - Mp)
    +   10034 * Math.sin(3*Mp)     +   8548 * Math.sin(4*D - 2*Mp);
  return mod360(Lp + Σl / 1000000);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Obliquity of ecliptic  (Meeus ch.22)
// ─────────────────────────────────────────────────────────────────────────────
function obliquity(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  return 23.439291111 - 0.013004167*T - 0.000000164*T*T + 0.000000504*T*T*T;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Greenwich Apparent Sidereal Time  (Meeus ch.12)
// ─────────────────────────────────────────────────────────────────────────────
function gast(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  return mod360(280.46061837 + 360.98564736629*(JD-2451545)
              + 0.000387933*T*T - T*T*T/38710000);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tropical Ascendant  (Meeus ch.14 — horizon/ecliptic intersection)
// ─────────────────────────────────────────────────────────────────────────────
function tropAsc(JD: number, lat: number, lon: number): number {
  const eps  = obliquity(JD) * DEG;
  const ramc = mod360(gast(JD) + lon) * DEG;   // local sidereal time → radians
  const φ    = lat * DEG;
  const y    = -Math.cos(ramc);
  const x    = Math.sin(eps) * Math.tan(φ) + Math.cos(eps) * Math.sin(ramc);
  let asc = Math.atan2(y, x) * RAD;
  if (Math.cos(ramc) < 0) asc += 180;
  return mod360(asc);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Lahiri Ayanamsa  (±0.1° over 20th/21st century)
//  Reference value: 23°51′ at 2000-Jan-1
// ─────────────────────────────────────────────────────────────────────────────
function lahiri(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  return 23.85 + 1.3972 * T;       // degrees
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sign lookup tables
// ─────────────────────────────────────────────────────────────────────────────
const TROP_NAMES   = ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau',
                      'Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'];
const TROP_GLYPHS  = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const VEDIC_NAMES  = ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau',
                      'Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'];

function sign(lon: number) {
  const i = Math.floor(mod360(lon) / 30);
  return { tropical: TROP_NAMES[i], vedic: VEDIC_NAMES[i], glyph: TROP_GLYPHS[i] };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Chinese Zodiac — corrected for Chinese New Year via mean lunation
// ─────────────────────────────────────────────────────────────────────────────
const CZ_ANIMALS  = ['Ratte','Ochse','Tiger','Hase','Drache','Schlange',
                     'Pferd','Ziege','Affe','Hahn','Hund','Schwein'];
const CZ_EMOJI    = ['🐀','🐂','🐯','🐰','🐉','🐍','🐴','🐑','🐒','🐓','🐕','🐷'];
// Heavenly Stems, indexed by (year − 4) mod 10 (year 4 CE = Jiǎ = Holz):
// 0,1=Holz(Jiǎ/Yǐ) | 2,3=Feuer | 4,5=Erde | 6,7=Metall | 8,9=Wasser
// Verification: 1984 → (1984−4)%10 = 0 → Holz-Ratte ✓
const CZ_ELEMENTS = ['Holz','Holz','Feuer','Feuer','Erde','Erde',
                     'Metall','Metall','Wasser','Wasser'];

/** Approximate JD of Chinese New Year (2nd new moon after winter solstice). */
function cnYear(year: number): number {
  // k = lunation index for new moon closest to start of the year
  const k = Math.round(((year - 2000) + 1/24) * 12.3685);
  const T = k / 1236.85;
  return 2451550.09766 + 29.530588861*k + 0.00015437*T*T - 0.000000150*T*T*T;
}

function chineseZodiac(birthDate: string) {
  const [y, m, d] = birthDate.split('-').map(Number);
  const birthJD = jdn(y, m, d, 12);
  // Chinese New Year of same Gregorian year; if birth is before CNY, use prior year
  const cny = cnYear(y);
  const chYear = birthJD >= cny ? y : y - 1;
  const ai = ((chYear - 4) % 12 + 12) % 12;
  const ei = ((chYear - 4) % 10 + 10) % 10;
  return {
    animal:  CZ_ANIMALS[ai],
    element: CZ_ELEMENTS[ei],
    emoji:   CZ_EMOJI[ai],
    label:   `${CZ_ELEMENTS[ei]}-${CZ_ANIMALS[ai]}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Maya Dreamspell Kin  (epoch 1987-07-26)
// ─────────────────────────────────────────────────────────────────────────────
const MAYA_SEALS  = ['Dragon','Wind','Night','Seed','Serpent','Worldbridger',
                     'Hand','Star','Moon','Dog','Monkey','Human','Skywalker',
                     'Wizard','Eagle','Warrior','Earth','Mirror','Storm','Sun'];
const MAYA_GLYPHS = ['🐉','💨','🌙','🌱','🐍','🌉','✋','⭐','🌊','🐕',
                     '🐒','👤','🚶','🧙','🦅','⚔️','🌍','🪞','⛈️','☀️'];
const MAYA_TONES  = ['Magnetic','Lunar','Electric','Self-Existing','Overtone',
                     'Rhythmic','Resonant','Galactic','Solar','Planetary',
                     'Spectral','Crystal','Cosmic'];

function mayaKin(birthDate: string) {
  const [y, m, d] = birthDate.split('-').map(Number);
  const kin  = dreamspellKin(y, m, d);
  const tone = ((kin - 1) % 13) + 1;
  return { kin, tone, toneName: MAYA_TONES[tone-1], seal: MAYA_SEALS[(kin-1)%20], glyph: MAYA_GLYPHS[(kin-1)%20] };
}

/**
 * Dreamspell Kin (José Argüelles).
 * Anchor: 1987-07-26 = Kin 34 (verified against 2013-07-26 = Kin 164, "Galactic Seed").
 * Dreamspell skips Feb 29 ("Hunab Ku 0.0" — no Kin of its own; same Kin as Feb 28).
 */
function dreamspellKin(y: number, m: number, d: number): number {
  const origin = Date.UTC(1987, 6, 26);
  const target = Date.UTC(y, m - 1, d);
  let days = Math.round((target - origin) / 86400000);
  const isLeap = (yr: number) => (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
  if (target >= origin) {
    for (let yr = 1988; yr <= y; yr++) {
      if (!isLeap(yr)) continue;
      const feb29 = Date.UTC(yr, 1, 29);
      if (feb29 > origin && feb29 <= target) days--;
    }
  } else {
    for (let yr = y; yr <= 1987; yr++) {
      if (!isLeap(yr)) continue;
      const feb29 = Date.UTC(yr, 1, 29);
      if (feb29 > target && feb29 <= origin) days++;
    }
  }
  return ((((days + 33) % 260) + 260) % 260) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Human Design — I-Ching Gate Wheel  (Ra Uru Hu / Jovian Archive standard)
//
//  64 gates distributed around the ecliptic starting at tropical Aries 0°.
//  Each gate spans 360/64 = 5.625°; each gate has 6 lines (0.9375° per line).
//  Gate sequence (index 0 = Aries 0°, counterclockwise = increasing longitude):
// ─────────────────────────────────────────────────────────────────────────────
const HD_GATE_WHEEL: readonly number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42,  3,
  27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48, 57, 32, 50,
  28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38, 54, 61, 60,
];

const GATE_SIZE = 360 / 64;   // 5.625°
const LINE_SIZE = GATE_SIZE / 6; // 0.9375°

function hdGateAndLine(lon: number): { gate: number; line: number } {
  const l   = mod360(lon);
  const idx = Math.floor(l / GATE_SIZE);
  const rem = l - idx * GATE_SIZE;
  const line = Math.min(6, Math.floor(rem / LINE_SIZE) + 1); // 1–6
  return { gate: HD_GATE_WHEEL[idx], line };
}

/**
 * Find JD when the Sun was at `targetLon` (binary search, converges in ~50 iter).
 * Searches the interval [approxJD-5, approxJD+5] around the seed estimate.
 */
function findJDForSunLon(targetLon: number, seedJD: number): number {
  // Widen window to ±5 days to handle near-360° wraparound safely
  let lo = seedJD - 5, hi = seedJD + 5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const diff = mod360(sunLon(mid) - targetLon);
    if (diff > 180) lo = mid; else hi = mid;
    if (hi - lo < 1e-6) break;
  }
  return (lo + hi) / 2;
}

/**
 * Compute Human Design Profile from birth JD.
 * Profile = Personality-Sun-Line / Design-Sun-Line
 * Design Sun is the position where the Sun was exactly 88° of arc before natal.
 */
function hdProfile(birthJD: number): {
  profile:         string;   // e.g. "2/4"
  gateConscious:   number;   // I-Ching gate (1-64) of Personality Sun
  lineConscious:   number;   // Line (1-6) of Personality Sun
  gateDesign:      number;   // I-Ching gate of Design Sun
  lineDesign:      number;   // Line of Design Sun
  designSunLon:    number;   // tropical longitude used for Design
  designJD:        number;   // JD of Design date
} {
  const natalSunLon  = sunLon(birthJD);
  const designSunLon = mod360(natalSunLon - 88);

  // Seed estimate: ~88 days before (Sun moves ~1°/day, so 88° ≈ 88 days)
  const designJD = findJDForSunLon(designSunLon, birthJD - 88);

  const con = hdGateAndLine(natalSunLon);
  const des = hdGateAndLine(sunLon(designJD));

  return {
    profile:       `${con.line}/${des.line}`,
    gateConscious: con.gate,
    lineConscious: con.line,
    gateDesign:    des.gate,
    lineDesign:    des.line,
    designSunLon:  +designSunLon.toFixed(4),
    designJD:      +designJD.toFixed(4),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Geocode via Nominatim (free, OSM-based)
// ─────────────────────────────────────────────────────────────────────────────
async function geocode(city: string, country = ''): Promise<{ lat: number; lon: number } | null> {
  try {
    const q = encodeURIComponent(`${city}${country ? ', ' + country : ''}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TRINITY-OS/1.0 (you-are-neo.com)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { lat: string; lon: string }[];
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/astro
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // birthDate/birthTime: UTC date+time for the ephemeris (client converts local→UTC,
    //   which can roll the date to the previous/next day).
    // birthDateLocal: the civil (local) birth date — used for Chinese zodiac & Maya Kin,
    //   which are calendar-day systems tied to local date, not UTC.
    const { birthDate, birthTime, birthDateLocal, birthCity, birthCountry } = await req.json() as {
      birthDate: string;
      birthTime?: string;
      birthDateLocal?: string;
      birthCity?: string;
      birthCountry?: string;
    };

    if (!birthDate) {
      return NextResponse.json({ error: 'birthDate required' }, { status: 400 });
    }

    const [y, m, d] = birthDate.split('-').map(Number);

    // Birth hour in UT (birthTime is stored as UTC HH:MM)
    let hourUT = 12; // noon default when time unknown
    if (birthTime) {
      const [h, min] = birthTime.split(':').map(Number);
      hourUT = h + (min ?? 0) / 60;
    }

    const JD        = jdn(y, m, d, hourUT);
    const ayanamsa  = lahiri(JD);
    const sl        = sunLon(JD);
    const ml        = moonLon(JD);

    // ── Sun sign ──
    const sunTrop = sign(sl);
    const sunVed  = sign(mod360(sl - ayanamsa));

    // ── Moon sign ──
    const moonTrop = sign(ml);

    // ── Ascendant (needs time + location) ──
    let ascTrop: ReturnType<typeof sign> | null = null;
    let ascVed:  ReturnType<typeof sign> | null = null;
    let geocoded = false;

    if (birthTime && birthCity) {
      const geo = await geocode(birthCity, birthCountry ?? '');
      if (geo) {
        geocoded = true;
        const aLon = tropAsc(JD, geo.lat, geo.lon);
        ascTrop = sign(aLon);
        ascVed  = sign(mod360(aLon - ayanamsa));
      }
    }

    // ── Chinese zodiac & Maya Kin — use the LOCAL calendar date ──
    const civilDate = birthDateLocal ?? birthDate;
    const cz = chineseZodiac(civilDate);
    const mk = mayaKin(civilDate);

    // ── Human Design (Profile + gate numbers from I-Ching wheel) ──
    const hd = hdProfile(JD);

    return NextResponse.json({
      sunTropical:    sunTrop.tropical,
      sunTropGlyph:   sunTrop.glyph,
      sunVedic:       sunVed.vedic,
      sunVedGlyph:    sunVed.glyph,
      moonTropical:   moonTrop.tropical,
      moonTropGlyph:  moonTrop.glyph,
      ascTropical:    ascTrop?.tropical ?? null,
      ascTropGlyph:   ascTrop?.glyph   ?? null,
      ascVedic:       ascVed?.vedic    ?? null,
      ascVedGlyph:    ascVed?.glyph    ?? null,
      chinese:        cz.label,
      chineseEmoji:   cz.emoji,
      maya:           mk,
      hd,            // { profile, gateConscious, lineConscious, gateDesign, lineDesign, designSunLon, designJD }
      meta: {
        geocoded,
        ayanamsa:     +ayanamsa.toFixed(3),
        JD:           +JD.toFixed(4),
        sunLonDeg:    +sl.toFixed(3),           // transparency: raw sun longitude used
        sunLonVedic:  +mod360(sl-ayanamsa).toFixed(3),
        birthDateUsed: birthDate,               // confirms which date the ephemeris used
        birthTimeUsed: birthTime ?? '12:00 (noon default)',
      },
    });

  } catch (err) {
    console.error('[/api/astro]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
