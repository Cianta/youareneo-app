// ─────────────────────────────────────────────────────────────────────────────
// Aktuelle Energien: westliches Sternzeichen, vedisches Mondhaus (Nakshatra),
// Dreamspell-Portaltage (GAP) und kurze Energie-Beschreibungen für das Popup.
// ─────────────────────────────────────────────────────────────────────────────

// ── Westliches Sternzeichen (Sonne, tropisch, nach Datum) ────────────────────
export interface ZodiacInfo { name: string; emoji: string; element: 'Feuer' | 'Erde' | 'Luft' | 'Wasser' }

const ZODIAC: { name: string; emoji: string; element: ZodiacInfo['element']; from: [number, number] }[] = [
  { name: 'Steinbock',  emoji: '♑', element: 'Erde',   from: [12, 22] },
  { name: 'Wassermann', emoji: '♒', element: 'Luft',   from: [1, 20] },
  { name: 'Fische',     emoji: '♓', element: 'Wasser', from: [2, 19] },
  { name: 'Widder',     emoji: '♈', element: 'Feuer',  from: [3, 21] },
  { name: 'Stier',      emoji: '♉', element: 'Erde',   from: [4, 20] },
  { name: 'Zwillinge',  emoji: '♊', element: 'Luft',   from: [5, 21] },
  { name: 'Krebs',      emoji: '♋', element: 'Wasser', from: [6, 21] },
  { name: 'Löwe',       emoji: '♌', element: 'Feuer',  from: [7, 23] },
  { name: 'Jungfrau',   emoji: '♍', element: 'Erde',   from: [8, 23] },
  { name: 'Waage',      emoji: '♎', element: 'Luft',   from: [9, 23] },
  { name: 'Skorpion',   emoji: '♏', element: 'Wasser', from: [10, 23] },
  { name: 'Schütze',    emoji: '♐', element: 'Feuer',  from: [11, 22] },
];

export function getWesternZodiac(date: Date): ZodiacInfo {
  const m = date.getMonth() + 1, d = date.getDate();
  // Rückwärts das erste Zeichen finden, dessen Startdatum erreicht ist
  for (let i = ZODIAC.length - 1; i >= 0; i--) {
    const [zm, zd] = ZODIAC[i].from;
    if (m > zm || (m === zm && d >= zd)) return ZODIAC[i];
  }
  return ZODIAC[0]; // 1.1.–19.1. → Steinbock
}

// ── Vedisches Mondhaus (Nakshatra) ───────────────────────────────────────────
// Mond-Länge nach vereinfachter Meeus-Formel (±1° — für Nakshatra ausreichend),
// sidereal via Lahiri-Ayanamsa (~24.2° für 2026).
export const NAKSHATRAS = [
  'Ashvini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Svati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

const NAKSHATRA_KEYWORDS = [
  'Neubeginn & Heilung', 'Transformation & Hingabe', 'Klarheit & Feuer', 'Wachstum & Fülle',
  'Suche & Sanftmut', 'Sturm & Durchbruch', 'Erneuerung & Rückkehr', 'Nähren & Fürsorge',
  'Tiefe & Intuition', 'Ahnenkraft & Würde', 'Freude & Kreativität', 'Partnerschaft & Ordnung',
  'Geschick & Handwerk', 'Schönheit & Design', 'Unabhängigkeit & Wind', 'Zielstrebigkeit & Fokus',
  'Freundschaft & Treue', 'Meisterschaft & Schutz', 'Wurzelkraft & Loslassen', 'Unbesiegbarkeit & Wasser',
  'Sieg & Beständigkeit', 'Zuhören & Weisheit', 'Rhythmus & Wohlstand', 'Heilung & Mysterium',
  'Feuer der Läuterung', 'Tiefer Frieden', 'Vollendung & Übergang',
];

function moonEclipticLongitude(date: Date): number {
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000; // Tage seit J2000
  const rad = Math.PI / 180;
  const L  = 218.316 + 13.176396 * d;             // mittlere Länge
  const M  = 134.963 + 13.064993 * d;             // mittlere Anomalie (Mond)
  const Ms = 357.529 + 0.98560028 * d;            // mittlere Anomalie (Sonne)
  const D  = 297.850 + 12.190749 * d;             // mittlere Elongation
  const F  = 93.272  + 13.229350 * d;             // Argument der Breite
  const lon = L
    + 6.289 * Math.sin(M * rad)                   // große Ungleichheit
    + 1.274 * Math.sin((2 * D - M) * rad)         // Evektion
    + 0.658 * Math.sin(2 * D * rad)               // Variation
    - 0.186 * Math.sin(Ms * rad)                  // jährliche Ungleichheit
    - 0.114 * Math.sin(2 * F * rad);
  return ((lon % 360) + 360) % 360;
}

export interface NakshatraInfo { index: number; name: string; keyword: string; pada: number }

export function getNakshatra(date: Date): NakshatraInfo {
  const AYANAMSA = 24.2; // Lahiri ≈ 2026
  const sidereal = ((moonEclipticLongitude(date) - AYANAMSA) % 360 + 360) % 360;
  const span = 360 / 27; // 13°20'
  const index = Math.floor(sidereal / span);
  const pada = Math.floor((sidereal % span) / (span / 4)) + 1;
  return { index, name: NAKSHATRAS[index], keyword: NAKSHATRA_KEYWORDS[index], pada };
}

// ── Dreamspell-Kin (identisch zur Sidebar-Berechnung) ────────────────────────
export function getKinForDate(date: Date): number {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const origin = Date.UTC(1987, 6, 26);
  const target = Date.UTC(y, m - 1, d);
  let days = Math.round((target - origin) / 86_400_000);
  // Dreamspell überspringt den 29. Februar
  let leapDays = 0;
  const startYear = 1988;
  for (let yy = startYear; yy <= y; yy++) {
    const isLeap = (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0;
    if (!isLeap) continue;
    const feb29 = Date.UTC(yy, 1, 29);
    if (feb29 > origin && feb29 <= target) leapDays++;
  }
  days -= leapDays;
  return ((days + 33) % 260 + 260) % 260 + 1;
}

// ── Portaltage (Galactic Activation Portals — 52 Kins) ───────────────────────
const GAP_KINS = new Set([
  4, 9, 14, 19, 22, 27, 32, 37, 40, 45, 50, 55, 58, 63, 68, 73,
  76, 81, 86, 91, 94, 99, 104, 109, 112, 117, 122, 127, 134, 139,
  144, 149, 152, 157, 162, 167, 170, 175, 180, 185, 188, 193, 198,
  203, 206, 211, 216, 221, 224, 229, 234, 239,
]);

export function isPortalDay(date: Date): boolean {
  return GAP_KINS.has(getKinForDate(date));
}

/** Nächste n Portaltage ab (einschließlich) heute. */
export function upcomingPortalDays(from: Date, count = 5): { date: Date; kin: number }[] {
  const out: { date: Date; kin: number }[] = [];
  const d = new Date(from);
  for (let i = 0; i < 400 && out.length < count; i++) {
    const kin = getKinForDate(d);
    if (GAP_KINS.has(kin)) out.push({ date: new Date(d), kin });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// ── Kurze Energie-Beschreibungen (Deutsch) ───────────────────────────────────
export const SEAL_MEANINGS: Record<string, string> = {
  'Drache':      'Urkraft der Geburt — nähre, was entstehen will. Vertrauen in den Ursprung.',
  'Wind':        'Geist & Kommunikation — sprich deine Wahrheit, lass Ideen zirkulieren.',
  'Nacht':       'Stille & Fülle — träume groß, schöpfe aus dem inneren Reichtum.',
  'Samen':       'Zielgerichtetes Wachstum — setze Absichten, pflanze bewusst.',
  'Schlange':    'Lebenskraft & Instinkt — höre auf den Körper, Energie will fließen.',
  'Weltbrücke':  'Loslassen & Verbinden — Altes darf gehen, Brücken entstehen.',
  'Hand':        'Heilung & Vollendung — handle, vollende, heile mit deinen Fähigkeiten.',
  'Stern':       'Schönheit & Harmonie — verschönere dein Umfeld, Kunst als Medizin.',
  'Mond':        'Reines Gefühl — lass Emotionen fließen wie Wasser, reinige.',
  'Hund':        'Herz & Loyalität — liebe bedingungslos, stärke deine Gefährten.',
  'Affe':        'Spiel & Magie — nimm nichts zu ernst, Leichtigkeit öffnet Türen.',
  'Mensch':      'Freier Wille & Weisheit — wähle bewusst, Einfluss durch Integrität.',
  'Wanderer':    'Raum & Erkundung — verlasse das Bekannte, erweitere Horizonte.',
  'Zauberer':    'Zeitlosigkeit & Empfänglichkeit — verzaubere durch Präsenz.',
  'Adler':       'Vision & Überblick — sieh das große Ganze, plane von oben.',
  'Krieger':     'Furchtlose Intelligenz — stelle Fragen, gehe mutig voran.',
  'Erde':        'Synchronizität & Navigation — folge den Zeichen, alles fügt sich.',
  'Spiegel':     'Klarheit & Wahrheit — erkenne dich in allem, schneide Illusionen.',
  'Sturm':       'Transformation — Selbst-Erneuerung, Energie des Wandels nutzen.',
  'Sonne':       'Universelles Feuer — strahle, erleuchte, bedingungslose Meisterschaft.',
};

export const TONE_MEANINGS: Record<number, string> = {
  1:  'Magnetisch — Ziehe an, was du brauchst. Setze die Absicht des Zyklus.',
  2:  'Lunar — Erkenne die Polarität. Welche Herausforderung stabilisiert dich?',
  3:  'Elektrisch — Aktiviere & verbinde. Dienst bringt die Energie ins Fließen.',
  4:  'Selbst-existierend — Definiere die Form. Struktur gibt Freiheit.',
  5:  'Überton — Sammle deine Kräfte. Strahlungskraft aus der Mitte.',
  6:  'Rhythmisch — Organisiere den Alltag. Gleichgewicht in Bewegung.',
  7:  'Resonant — Stimme dich ein. Kanal zwischen Himmel und Erde.',
  8:  'Galaktisch — Lebe, was du glaubst. Integrität harmonisiert.',
  9:  'Solar — Pulsiere die Absicht. Der Wille vollendet.',
  10: 'Planetar — Manifestiere. Perfektioniere, was du produzierst.',
  11: 'Spektral — Lass los. Auflösung befreit die Energie.',
  12: 'Kristall — Kooperiere. Gemeinsam wird Erfahrung Weisheit.',
  13: 'Kosmisch — Transzendiere. Ausdauer trägt über die Schwelle.',
};

export const CH_ELEMENT_MEANINGS: Record<string, string> = {
  'Holz':   'Wachstum, Vision, Aufbruch — wie ein Baum im Frühling: expandiere flexibel.',
  'Feuer':  'Ausdehnung, Sichtbarkeit, Leidenschaft — zeige dich, aber hüte die Flamme.',
  'Erde':   'Stabilität, Nährung, Mitte — baue Fundamente, pflege Beständigkeit.',
  'Metall': 'Klarheit, Struktur, Präzision — trenne Wesentliches von Unwesentlichem.',
  'Wasser': 'Tiefe, Weisheit, Fluss — folge dem Weg des geringsten Widerstands.',
};

export const CH_ANIMAL_MEANINGS: Record<string, string> = {
  'Ratte': 'Gewandtheit & Ressourcen', 'Ochse': 'Ausdauer & Verlässlichkeit', 'Tiger': 'Mut & Initiative',
  'Hase': 'Diplomatie & Feingefühl', 'Drache': 'Charisma & Größe', 'Schlange': 'Weisheit & Intuition',
  'Pferd': 'Freiheit & Dynamik', 'Ziege': 'Kreativität & Frieden', 'Affe': 'Erfindergeist & Witz',
  'Hahn': 'Präzision & Stolz', 'Hund': 'Treue & Gerechtigkeit', 'Schwein': 'Großzügigkeit & Genuss',
};

export const ZODIAC_MEANINGS: Record<string, string> = {
  'Widder':     'Pionierenergie — beginne, führe, entzünde. Direktheit ist jetzt Medizin.',
  'Stier':      'Verwurzelung & Genuss — verlangsame, sichere Werte, spüre den Körper.',
  'Zwillinge':  'Austausch & Neugier — vernetze, lerne, kommuniziere in alle Richtungen.',
  'Krebs':      'Gefühl & Zuhause — nähre dich und deine Menschen, schütze das Innere.',
  'Löwe':       'Herzensausdruck — kreiere sichtbar, spiele, führe mit Wärme.',
  'Jungfrau':   'Verfeinerung — ordne, optimiere, diene mit Präzision und Demut.',
  'Waage':      'Balance & Beziehung — harmonisiere, verhandle, umgib dich mit Schönheit.',
  'Skorpion':   'Tiefe & Wandlung — geh unter die Oberfläche, transformiere Schatten.',
  'Schütze':    'Expansion & Sinn — denke groß, reise (innerlich), lehre und lerne.',
  'Steinbock':  'Meisterschaft — baue langfristig, übernimm Verantwortung, strukturiere.',
  'Wassermann': 'Innovation — brich Muster, denke für das Kollektiv, sei frei.',
  'Fische':     'Auflösung & Mitgefühl — träume, meditiere, verbinde dich mit allem.',
};

export const MOON_PHASE_MEANINGS: Record<string, string> = {
  'Neumond':           'Setze Intentionen — der leere Raum will mit deiner Vision gefüllt werden.',
  'Zunehmende Sichel': 'Erste Schritte — nähre die Absicht mit kleinen konsequenten Handlungen.',
  'Erstes Viertel':    'Entscheidung & Aktion — Hindernisse zeigen sich, handle jetzt.',
  'Zunehmender Mond':  'Verfeinern & Dranbleiben — justiere den Kurs, Momentum wächst.',
  'Vollmond':          'Kulmination — Ernte, Sichtbarkeit, Dankbarkeit. Emotionen sind hell.',
  'Abnehmender Mond':  'Teilen & Weitergeben — gib Wissen weiter, feiere Ergebnisse.',
  'Letztes Viertel':   'Loslassen — was nicht mehr dient, darf bewusst gehen.',
  'Abnehmende Sichel': 'Ruhe & Rückzug — regeneriere, reflektiere, bereite den Neubeginn vor.',
};
