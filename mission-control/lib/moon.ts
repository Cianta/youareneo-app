// ─────────────────────────────────────────────────────────────────────────────
// Gemeinsame Mondphasen-Berechnung — wird von Sidebar UND Daily Notebook
// verwendet, damit beide Anzeigen immer identisch sind.
//
// Referenz: verifizierter Neumond 2000-01-06 18:14:00 UTC (JD 2451550.26).
// Synodischer Monat: 29.530588853 Tage.
// ─────────────────────────────────────────────────────────────────────────────

export interface MoonInfo {
  phase: string;        // deutscher Phasenname (i18n-Key)
  emoji: string;
  age: number;          // Mondalter in Tagen
  illumination: number; // 0–100 %
  daysToFull: number;
  daysToNew: number;
}

const LUNAR  = 29.530588853;
const REF_MS = Date.UTC(2000, 0, 6, 18, 14, 0); // 2000-01-06T18:14Z

export function getMoonPhase(date: Date): MoonInfo {
  const elapsed = date.getTime() - REF_MS;
  const cycles  = elapsed / (LUNAR * 86_400_000);
  const age     = ((cycles % 1) + 1) % 1;           // 0 = Neumond, 0.5 = Vollmond
  const dayAge  = age * LUNAR;

  // Beleuchtungsgrad (0 % Neumond → 100 % Vollmond → 0 %)
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * age)) / 2 * 100);

  const FULL_AGE = LUNAR / 2; // ≈ 14.765
  const daysToFull = dayAge < FULL_AGE ? FULL_AGE - dayAge : LUNAR - dayAge + FULL_AGE;
  const daysToNew  = LUNAR - dayAge;

  const mk = (phase: string, emoji: string): MoonInfo => ({
    phase, emoji, age: dayAge, illumination,
    daysToFull: Math.round(daysToFull * 10) / 10,
    daysToNew:  Math.round(daysToNew  * 10) / 10,
  });

  if (dayAge <  1.5) return mk('Neumond',           '🌑');
  if (dayAge <  7.0) return mk('Zunehmende Sichel', '🌒');
  if (dayAge <  8.5) return mk('Erstes Viertel',    '🌓');
  if (dayAge < 14.0) return mk('Zunehmender Mond',  '🌔');
  if (dayAge < 16.5) return mk('Vollmond',          '🌕');
  if (dayAge < 22.0) return mk('Abnehmender Mond',  '🌖');
  if (dayAge < 23.5) return mk('Letztes Viertel',   '🌗');
  if (dayAge < 28.5) return mk('Abnehmende Sichel', '🌘');
  return mk('Neumond', '🌑');
}
