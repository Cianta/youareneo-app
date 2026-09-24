import { SunPosition, EclipticGeoMoon, MoonPhase } from "astronomy-engine";
export const mod = (n: number, m: number) => ((n % m) + m) % m;
export const SIGNS = [
  "Widder",
  "Stier",
  "Zwillinge",
  "Krebs",
  "Löwe",
  "Jungfrau",
  "Waage",
  "Skorpion",
  "Schütze",
  "Steinbock",
  "Wassermann",
  "Fische",
];
export const GLYPHS = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];
export const ELEMENTS = ["Feuer", "Erde", "Luft", "Wasser"];
export const ANIMALS = [
  "Ratte",
  "Ochse",
  "Tiger",
  "Hase",
  "Drache",
  "Schlange",
  "Pferd",
  "Ziege",
  "Affe",
  "Hahn",
  "Hund",
  "Schwein",
];
export const ANIMAL_ICONS = [
  "🐀",
  "🐂",
  "🐯",
  "🐰",
  "🐉",
  "🐍",
  "🐴",
  "🐑",
  "🐒",
  "🐓",
  "🐕",
  "🐷",
];
export const STEMS = [
  "Holz",
  "Holz",
  "Feuer",
  "Feuer",
  "Erde",
  "Erde",
  "Metall",
  "Metall",
  "Wasser",
  "Wasser",
];
export const ELEMENT_COLORS: Record<string, string> = {
  Holz: "#72b88e",
  Feuer: "#e69278",
  Erde: "#c8aa69",
  Metall: "#aebfcd",
  Wasser: "#71abdf",
  Luft: "#ba9ce0",
};
export function signAt(lon: number) {
  const i = Math.floor(mod(lon, 360) / 30);
  return { name: SIGNS[i], icon: GLYPHS[i], element: ELEMENTS[i % 4] };
}
export function chineseYear(date: Date) {
  const parts = new Intl.DateTimeFormat("en-u-ca-chinese", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const year = Number(
    parts.find((p) => String(p.type) === "relatedYear")?.value,
  );
  if (!Number.isFinite(year))
    throw new Error("Chinesischer Kalender auf diesem Gerät nicht verfügbar.");
  const animal = mod(year - 4, 12),
    element = STEMS[mod(year - 4, 10)];
  return {
    name: `${element}-${ANIMALS[animal]}`,
    icon: ANIMAL_ICONS[animal],
    element,
  };
}
/** BaZi solar month begins at jie (315°, 345°, 15°…), not on Gregorian month day 1. */
export function chineseMonth(date: Date) {
  const lon = SunPosition(date).elon;
  const index = Math.floor(mod(lon - 315, 360) / 30);
  const y =
    date.getUTCFullYear() -
    (date.getUTCMonth() < 2 && lon < 315 && lon > 270 ? 1 : 0);
  const stem = mod((mod(y - 4, 10) % 5) * 2 + 2 + index, 10),
    branch = (index + 2) % 12,
    element = STEMS[stem];
  return {
    name: `${element}-${ANIMALS[branch]}`,
    icon: ANIMAL_ICONS[branch],
    element,
  };
}
export function dreamspell(date: Date) {
  const y = date.getUTCFullYear(),
    target = Date.UTC(y, date.getUTCMonth(), date.getUTCDate()),
    origin = Date.UTC(1987, 6, 26);
  let days = Math.round((target - origin) / 86400000);
  for (let yr = Math.min(y, 1987); yr <= Math.max(y, 1987); yr++) {
    if (yr % 4 === 0 && (yr % 100 !== 0 || yr % 400 === 0)) {
      const leap = Date.UTC(yr, 1, 29);
      if (target >= origin && leap > origin && leap <= target) days--;
      else if (target < origin && leap > target && leap <= origin) days++;
    }
  }
  const kin = mod(days + 33, 260) + 1;
  const seals = [
    "Drache",
    "Wind",
    "Nacht",
    "Samen",
    "Schlange",
    "Weltbrücke",
    "Hand",
    "Stern",
    "Mond",
    "Hund",
    "Affe",
    "Mensch",
    "Wanderer",
    "Zauberer",
    "Adler",
    "Krieger",
    "Erde",
    "Spiegel",
    "Sturm",
    "Sonne",
  ];
  return {
    kin,
    tone: ((kin - 1) % 13) + 1,
    seal: seals[(kin - 1) % 20],
    name: `Kin ${kin} · ${seals[(kin - 1) % 20]}`,
    icon: "✧",
  };
}
// Contemporary 13-tree calendar; a modern symbolic tradition, not ancient astronomical ephemeris.
export function celticTree(date: Date) {
  const md = (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  const ranges: [[number, number], string][] = [
    [[121, 217], "Eberesche"],
    [[218, 317], "Esche"],
    [[318, 414], "Erle"],
    [[415, 512], "Weide"],
    [[513, 609], "Weißdorn"],
    [[610, 707], "Eiche"],
    [[708, 804], "Stechpalme"],
    [[805, 901], "Hasel"],
    [[902, 929], "Weinrebe"],
    [[930, 1027], "Efeu"],
    [[1028, 1124], "Schilf"],
    [[1125, 1223], "Holunder"],
  ];
  return {
    name: ranges.find(([r]) => md >= r[0] && md <= r[1])?.[1] ?? "Birke",
    icon: "♧",
  };
}
export function tzolkin(date: Date) {
  const days = Math.round(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(2012, 11, 21)) /
      86400000,
  );
  const names = [
    "Imix",
    "Ik’",
    "Ak’bal",
    "K’an",
    "Chikchan",
    "Kimi",
    "Manik’",
    "Lamat",
    "Muluk",
    "Ok",
    "Chuwen",
    "Eb’",
    "B’en",
    "Ix",
    "Men",
    "K’ib’",
    "Kab’an",
    "Etz’nab’",
    "Kawak",
    "Ajaw",
  ];
  const tone = mod(days + 3, 13) + 1,
    seal = names[mod(days + 19, 20)];
  return { name: `${tone} ${seal}`, tone, seal, icon: "✧" };
}
export function skyNow(date: Date) {
  const lon = SunPosition(date).elon,
    years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 31557600000,
    ayanamsa = 23.85 + 0.013972 * years;
  const phase = MoonPhase(date);
  const phases = [
      "Neumond",
      "Zunehmende Sichel",
      "Erstes Viertel",
      "Zunehmender Mond",
      "Vollmond",
      "Abnehmender Mond",
      "Letztes Viertel",
      "Abnehmende Sichel",
    ],
    icons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const pi = Math.floor((phase + 22.5) / 45) % 8;
  return {
    moon: {
      name: phases[pi],
      icon: icons[pi],
      illumination: Math.round((1 - Math.cos((phase * Math.PI) / 180)) * 50),
    },
    western: signAt(lon),
    vedic: signAt(EclipticGeoMoon(date).lon - ayanamsa),
    chinese: chineseMonth(date),
    maya: dreamspell(
      new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
    ),
    tzolkin: tzolkin(
      new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
    ),
    celtic: celticTree(date),
  };
}
export const COSMOS_SYSTEMS = [
  ["western", "Westliche Sonne"],
  ["vedic", "Vedischer Mond · Lahiri"],
  ["chinese", "Chinesischer Sonnenmonat"],
  ["maya", "Maya · Dreamspell"],
  ["tzolkin", "Maya · traditioneller Tzolk’in (GMT)"],
  ["celtic", "Keltischer Baumkalender"],
] as const;
