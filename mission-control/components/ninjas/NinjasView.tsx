'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, CheckSquare, Clock, Zap, MoreVertical, Edit3, Trash2, Plus,
  Star, Moon, Sun, Eye, EyeOff, Lock, MapPin, Camera, Building2,
  ChevronDown, X, ArrowRight, Shield, GripVertical, Upload, Copy, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useKanbanStore, useNinjasStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { KanbanTask } from '@/types';
import type { NinjaMember, NinjaRole, AstroData } from '@/lib/store';

// ═══════════════════════════════════════════════════════════════
//  TIMEZONE HELPER — convert local HH:MM + IANA tz → UTC HH:MM
//  Uses the browser Intl API (no extra library needed).
// ═══════════════════════════════════════════════════════════════

/** Common IANA timezones with UTC offset label for the dropdown */
export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Europe/Vienna',        label: 'Wien / Tirol (CET/CEST +1/+2)'  },
  { value: 'Europe/Berlin',        label: 'Berlin / München (+1/+2)'        },
  { value: 'Europe/Zurich',        label: 'Zürich / Bern (+1/+2)'           },
  { value: 'Europe/London',        label: 'London (GMT/BST 0/+1)'           },
  { value: 'Europe/Paris',         label: 'Paris (+1/+2)'                   },
  { value: 'Europe/Rome',          label: 'Rom / Mailand (+1/+2)'           },
  { value: 'Europe/Madrid',        label: 'Madrid (+1/+2)'                  },
  { value: 'Europe/Amsterdam',     label: 'Amsterdam (+1/+2)'               },
  { value: 'Europe/Warsaw',        label: 'Warschau (+1/+2)'                },
  { value: 'Europe/Bucharest',     label: 'Bukarest (+2/+3)'                },
  { value: 'Europe/Helsinki',      label: 'Helsinki (+2/+3)'                },
  { value: 'Europe/Moscow',        label: 'Moskau (+3)'                     },
  { value: 'America/New_York',     label: 'New York (EST/EDT −5/−4)'        },
  { value: 'America/Chicago',      label: 'Chicago (CST/CDT −6/−5)'        },
  { value: 'America/Denver',       label: 'Denver (MST/MDT −7/−6)'         },
  { value: 'America/Los_Angeles',  label: 'Los Angeles (PST/PDT −8/−7)'    },
  { value: 'America/Toronto',      label: 'Toronto (EST/EDT −5/−4)'        },
  { value: 'America/Sao_Paulo',    label: 'São Paulo (BRT −3)'              },
  { value: 'Africa/Cairo',         label: 'Kairo (EET +2)'                  },
  { value: 'Asia/Dubai',           label: 'Dubai (+4)'                      },
  { value: 'Asia/Kolkata',         label: 'Indien (+5:30)'                  },
  { value: 'Asia/Bangkok',         label: 'Bangkok (+7)'                    },
  { value: 'Asia/Singapore',       label: 'Singapur (+8)'                   },
  { value: 'Asia/Shanghai',        label: 'Peking / Shanghai (+8)'          },
  { value: 'Asia/Tokyo',           label: 'Tokio (+9)'                      },
  { value: 'Australia/Sydney',     label: 'Sydney (AEST/AEDT +10/+11)'     },
  { value: 'Pacific/Auckland',     label: 'Auckland (+12/+13)'              },
  { value: 'UTC',                  label: 'UTC / GMT (±0)'                  },
];

/**
 * Converts a local "HH:MM" time on a given "YYYY-MM-DD" date in an IANA timezone
 * to UTC. Returns BOTH the UTC date and time, because the conversion can roll the
 * date to the previous/next day (e.g. 00:30 in Vienna = 23:30 UTC the day BEFORE).
 * Returns null on any parse failure.
 */
function localToUTC(date: string, localTime: string, tz: string): { date: string; time: string } | null {
  try {
    const [h, m]     = localTime.split(':').map(Number);
    const [y, mo, d] = date.split('-').map(Number);
    if (!y || !mo || !d || isNaN(h) || isNaN(m)) return null;
    // Use DateTimeFormat to find the UTC offset at this moment in `tz`
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit',
      hour12: false,
    });
    // Start from naive UTC (offset 0) and shift by the observed offset difference.
    const naiveUTC = Date.UTC(y, mo-1, d, h, m, 0);
    const parts = fmt.formatToParts(new Date(naiveUTC));
    const get = (t: string) => parseInt(parts.find(p=>p.type===t)?.value ?? '0', 10);
    // Include the date in the offset computation so day rollovers are handled
    const naiveMin = h*60 + m;
    const tzMin    = get('hour')*60 + get('minute');
    let offsetMin  = naiveMin - tzMin;
    // If the tz representation landed on a different calendar day, adjust by ±24h
    const dayDiff = Date.UTC(get('year'), get('month')-1, get('day')) - Date.UTC(y, mo-1, d);
    offsetMin -= Math.round(dayDiff / 60000);
    const d2 = new Date(naiveUTC + offsetMin * 60_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      date: `${d2.getUTCFullYear()}-${pad(d2.getUTCMonth()+1)}-${pad(d2.getUTCDate())}`,
      time: `${pad(d2.getUTCHours())}:${pad(d2.getUTCMinutes())}`,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
//  ASTROLOGY ENGINE
// ═══════════════════════════════════════════════════════════════

function getWesternZodiac(month: number, day: number): { sign: string; glyph: string } {
  const signs = [
    { sign:'Capricorn',   glyph:'♑', from:[12,22], to:[1,19]  },
    { sign:'Aquarius',    glyph:'♒', from:[1,20],  to:[2,18]  },
    { sign:'Pisces',      glyph:'♓', from:[2,19],  to:[3,20]  },
    { sign:'Aries',       glyph:'♈', from:[3,21],  to:[4,19]  },
    { sign:'Taurus',      glyph:'♉', from:[4,20],  to:[5,20]  },
    { sign:'Gemini',      glyph:'♊', from:[5,21],  to:[6,20]  },
    { sign:'Cancer',      glyph:'♋', from:[6,21],  to:[7,22]  },
    { sign:'Leo',         glyph:'♌', from:[7,23],  to:[8,22]  },
    { sign:'Virgo',       glyph:'♍', from:[8,23],  to:[9,22]  },
    { sign:'Libra',       glyph:'♎', from:[9,23],  to:[10,22] },
    { sign:'Scorpio',     glyph:'♏', from:[10,23], to:[11,21] },
    { sign:'Sagittarius', glyph:'♐', from:[11,22], to:[12,21] },
  ];
  for (const s of signs) {
    const [fm, fd] = s.from, [tm, td] = s.to;
    if ((month===fm&&day>=fd)||(month===tm&&day<=td)) return { sign:s.sign, glyph:s.glyph };
  }
  return { sign:'Capricorn', glyph:'♑' };
}

function getWesternZodiacIdx(month: number, day: number): number {
  // 0=Aries, 1=Taurus, ..., 11=Pisces
  const CUTOFFS = [19,18,20,19,20,20,22,22,22,22,21,21];
  let monthIdx = month - 1; // 0=Jan
  if (day <= CUTOFFS[monthIdx]) monthIdx = (monthIdx - 1 + 12) % 12;
  return ((monthIdx - 2) % 12 + 12) % 12; // shift so March=0(Aries)
}

// City → {timezone offset from UTC (winter), latitude} for local sidereal time
const CITY_GEO: Record<string, { tz: number; lat: number }> = {
  'wien': { tz: 1, lat: 48.2 }, 'vienna': { tz: 1, lat: 48.2 },
  'salzburg': { tz: 1, lat: 47.8 }, 'graz': { tz: 1, lat: 47.1 },
  'linz': { tz: 1, lat: 48.3 }, 'innsbruck': { tz: 1, lat: 47.3 },
  'berlin': { tz: 1, lat: 52.5 }, 'münchen': { tz: 1, lat: 48.1 },
  'munich': { tz: 1, lat: 48.1 }, 'hamburg': { tz: 1, lat: 53.6 },
  'zürich': { tz: 1, lat: 47.4 }, 'zurich': { tz: 1, lat: 47.4 },
  'bern': { tz: 1, lat: 46.9 }, 'genf': { tz: 1, lat: 46.2 },
  'london': { tz: 0, lat: 51.5 }, 'paris': { tz: 1, lat: 48.9 },
  'amsterdam': { tz: 1, lat: 52.4 }, 'rom': { tz: 1, lat: 41.9 },
  'rome': { tz: 1, lat: 41.9 }, 'madrid': { tz: 1, lat: 40.4 },
  'new york': { tz: -5, lat: 40.7 }, 'los angeles': { tz: -8, lat: 34.1 },
  'toronto': { tz: -5, lat: 43.7 }, 'sydney': { tz: 10, lat: -33.9 },
  'tokio': { tz: 9, lat: 35.7 }, 'tokyo': { tz: 9, lat: 35.7 },
  'dubai': { tz: 4, lat: 25.2 }, 'singapur': { tz: 8, lat: 1.3 },
  'singapore': { tz: 8, lat: 1.3 }, 'bangkok': { tz: 7, lat: 13.8 },
};

function getVedicAscendant(
  birthDate: string, birthTime: string, birthCity?: string,
): { sign: string; glyph: string; approx: boolean } | null {
  if (!birthDate || !birthTime) return null;

  // Resolve timezone + latitude from city name
  const cityKey = (birthCity ?? '').toLowerCase().trim();
  const geo = CITY_GEO[cityKey] ?? { tz: 1, lat: 48.0 }; // Default: CET / Vienna lat

  const d = new Date(`${birthDate}T${birthTime}:00Z`);
  if (isNaN(d.getTime())) return null;

  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  // Sun's tropical zodiac sign index (0=Aries … 11=Pisces)
  const sunIdx = getWesternZodiacIdx(m, day);

  // Local clock hour at birth location
  const localHour = (d.getUTCHours() + d.getUTCMinutes() / 60 + geo.tz + 24) % 24;

  // Tropical Ascendant approximation:
  // At 6 AM local → ASC ≈ Sun sign; each 2h later → +1 sign
  const hoursFrom6 = localHour - 6;
  const signsShift  = Math.round(hoursFrom6 / 2);
  const tropAscIdx  = ((sunIdx + signsShift) % 12 + 12) % 12;

  // Lahiri ayanamsa (current ≈ 24°) → subtract ~1 sign
  const vedicIdx = ((tropAscIdx - 1) % 12 + 12) % 12;

  const VEDIC  = ['Mesha','Vrishabha','Mithuna','Karkata','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
  const GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  return { sign: VEDIC[vedicIdx], glyph: GLYPHS[vedicIdx], approx: !CITY_GEO[cityKey] };
}

const MAYA_SEALS  = ['Dragon','Wind','Night','Seed','Serpent','Worldbridger','Hand','Star','Moon','Dog','Monkey','Human','Skywalker','Wizard','Eagle','Warrior','Earth','Mirror','Storm','Sun'];
const MAYA_GLYPHS = ['🐉','💨','🌙','🌱','🐍','🌉','✋','⭐','🌊','🐕','🐒','👤','🚶','🧙','🦅','⚔️','🌍','🪞','⛈️','☀️'];
const MAYA_TONES  = ['Magnetic','Lunar','Electric','Self-Existing','Overtone','Rhythmic','Resonant','Galactic','Solar','Planetary','Spectral','Crystal','Cosmic'];
function getMayaKin(birthDate: string): { kin: number; tone: number; toneName: string; seal: string; glyph: string } | null {
  if (!birthDate) return null;
  // Parse date parts directly to avoid timezone shift (YYYY-MM-DD parsed as UTC midnight)
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const originMs = Date.UTC(1987, 6, 26); // 1987-07-26
  const birthMs  = Date.UTC(y, m - 1, d);
  const days     = Math.floor((birthMs - originMs) / 86400000);
  const kin      = ((days % 260) + 260) % 260 || 260;
  const tone     = ((kin - 1) % 13) + 1;
  return { kin, tone, toneName: MAYA_TONES[tone - 1], seal: MAYA_SEALS[(kin-1)%20], glyph: MAYA_GLYPHS[(kin-1)%20] };
}

/**
 * ⚠️ IMPORTANT: Real Human Design (Type, Profile, Gates, Channels) cannot be
 * computed without a full Swiss Ephemeris + 64-hexagram I-Ching gate mapping.
 * This function returns null to force users to use the manual override fields.
 * Auto-approximation was intentionally removed because it produced incorrect results.
 */
function getHumanDesign(_birthDate: string, _birthTime?: string): null {
  return null;
}

const CZ_ELEMENTS = ['Metall','Metall','Wasser','Wasser','Holz','Holz','Feuer','Feuer','Erde','Erde'];
const CZ_ANIMALS  = ['Ratte','Ochse','Tiger','Hase','Drache','Schlange','Pferd','Ziege','Affe','Hahn','Hund','Schwein'];
const CZ_EMOJI    = ['🐀','🐂','🐯','🐰','🐉','🐍','🐴','🐑','🐒','🐓','🐕','🐷'];
function getChineseZodiac(birthYear: number) {
  return {
    element: CZ_ELEMENTS[birthYear % 10],
    animal:  CZ_ANIMALS[((birthYear - 4) % 12 + 12) % 12],
    emoji:   CZ_EMOJI[((birthYear - 4) % 12 + 12) % 12],
  };
}

// ═══════════════════════════════════════════════════════════════
//  ROLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════
const ROLE_DEFS: { id: NinjaRole; label: string; emoji: string; color: string; bg: string; border: string; pill: string }[] = [
  { id:'founder',   label:'Gründer',   emoji:'👑', color:'text-gold',       bg:'bg-yellow-950/50', border:'border-gold/40',        pill:'bg-gold/10 text-gold border-gold/30'             },
  { id:'creator',   label:'Creator',   emoji:'🎨', color:'text-purple-300', bg:'bg-purple-950/40', border:'border-purple-500/40',  pill:'bg-purple-950/60 text-purple-300 border-purple-700/40' },
  { id:'assistant', label:'Assistent', emoji:'💡', color:'text-sky-300',    bg:'bg-sky-950/40',    border:'border-sky-500/40',     pill:'bg-sky-950/60 text-sky-300 border-sky-700/40'     },
  { id:'advisor',   label:'Advisor',   emoji:'🔮', color:'text-teal-300',   bg:'bg-teal-950/40',   border:'border-teal-500/40',    pill:'bg-teal-950/60 text-teal-300 border-teal-700/40'  },
  { id:'system',    label:'System',    emoji:'⚙️', color:'text-rose-300',   bg:'bg-rose-950/40',   border:'border-rose-500/40',    pill:'bg-rose-950/60 text-rose-300 border-rose-700/40'  },
  { id:'partner',   label:'Partner',   emoji:'🤝', color:'text-forest-300', bg:'bg-forest-950/40', border:'border-forest-500/40',  pill:'bg-forest-900/60 text-forest-300 border-forest-700/40' },
];

// ── Predefined skill/attribute tags ──────────────────────────────────────────
const SKILL_PRESETS = [
  'Leadership','Vision','Strategy','Brand','Marketing','SEO','Content','Video',
  'Design','Motion','Copy','Community','Dev','Tech','Systems','Ops','Automation',
  'Sales','CRM','Email','Social Media','Coaching','Healing','Energy','Ceremonies',
  'Retreats','Sacred','Medicine','Movement','Yoga','Breathwork','Wellness','Flow',
  'Finance','Legal','Research','Analytics','AI','Podcast','Photography','Events',
];

const COLOR_MAP: Record<string,{border:string;bg:string;text:string;badge:string}> = {
  gold:   { border:'border-gold/40',         bg:'bg-yellow-950/30',  text:'text-gold',         badge:'bg-gold/10 text-gold border-gold/30'               },
  forest: { border:'border-forest-500/40',   bg:'bg-forest-900/30',  text:'text-forest-400',   badge:'bg-forest-800/60 text-forest-300 border-forest-700/50' },
  purple: { border:'border-purple-500/40',   bg:'bg-purple-950/30',  text:'text-purple-300',   badge:'bg-purple-950/50 text-purple-300 border-purple-800/50' },
  rose:   { border:'border-rose-500/40',     bg:'bg-rose-950/30',    text:'text-rose-300',     badge:'bg-rose-950/50 text-rose-300 border-rose-800/50'     },
  sky:    { border:'border-sky-500/40',      bg:'bg-sky-950/30',     text:'text-sky-300',      badge:'bg-sky-950/50 text-sky-300 border-sky-700/40'        },
  teal:   { border:'border-teal-500/40',     bg:'bg-teal-950/30',    text:'text-teal-300',     badge:'bg-teal-950/50 text-teal-300 border-teal-700/40'     },
  violet: { border:'border-violet-500/40',   bg:'bg-violet-950/30',  text:'text-violet-300',   badge:'bg-violet-950/50 text-violet-300 border-violet-700/40' },
  amber:  { border:'border-amber-500/40',    bg:'bg-amber-950/30',   text:'text-amber-300',    badge:'bg-amber-950/50 text-amber-300 border-amber-700/40'  },
};

// ═══════════════════════════════════════════════════════════════
//  ROLE DISTRIBUTION COLUMN (DnD)
// ═══════════════════════════════════════════════════════════════
function RoleColumn({
  role, members, draggedId, onDragStart, onDrop,
}: {
  role: typeof ROLE_DEFS[0];
  members: NinjaMember[];
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (targetRole: NinjaRole) => void;
}) {
  const t = useT();
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(role.id); }}
      className={cn(
        'rounded-xl border transition-all duration-200 overflow-hidden',
        role.border, role.bg,
        over ? 'ring-2 ring-mint-500/40 scale-[1.01]' : '',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-white/5">
        <span className="text-sm">{role.emoji}</span>
        <span className={cn('text-[10px] font-bold uppercase tracking-widest', role.color)}>{t(role.label)}</span>
        <span className="ml-auto text-[9px] text-anth-600">{members.length}</span>
      </div>
      {/* Member pills */}
      <div className="p-1.5 space-y-1 min-h-[40px]">
        {members.length === 0 && (
          <p className="text-[9px] text-anth-700 text-center py-2">Drop here</p>
        )}
        {members.map(m => (
          <div
            key={m.id}
            draggable
            onDragStart={() => onDragStart(m.id)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-grab active:cursor-grabbing select-none transition-opacity',
              'bg-anth-900/60 border border-white/5 hover:border-white/20',
              draggedId === m.id ? 'opacity-40' : 'opacity-100',
            )}
          >
            <GripVertical size={8} className="text-anth-700 shrink-0" />
            <span className="text-xs shrink-0">{m.avatar}</span>
            <span className="text-[10px] text-anth-300 truncate">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ASTROLOGY BADGE GRID  — auto-fetches from /api/astro
// ═══════════════════════════════════════════════════════════════
// Version stamp forces re-fetch after code changes that add new fields (e.g. hd, meta)
// v4: fixed Chinese element order, Maya Kin anchor (Kin 34 @ 1987-07-26), UTC date rollover
const ASTRO_CACHE_VERSION = 'v4';
function inputKey(m: NinjaMember) {
  return [m.birthDate, m.birthTime, m.birthTimezone ?? 'Europe/Vienna',
          m.birthCity, m.birthCountry, ASTRO_CACHE_VERSION].join('|');
}

function AstroBadges({ member }: { member: NinjaMember }) {
  const t = useT();
  const { updateMember } = useNinjasStore();
  const bd = member.birthDate ?? '';
  const bt = member.birthTime ?? '';
  const bc = member.birthCity ?? '';
  const hasTime = !!bt;
  const hasCity = !!bc;
  const hasDate = !!bd;

  // Convert local birth date+time → UTC before sending to API.
  // The conversion returns BOTH date and time, because e.g. 00:30 Vienna = 23:30 UTC the day before.
  // Default to Europe/Vienna so existing members without saved timezone get correct conversion.
  const effectiveTz = member.birthTimezone ?? 'Europe/Vienna';
  const utc    = (bd && bt) ? localToUTC(bd, bt, effectiveTz) : null;
  const bdUTC  = utc?.date ?? bd;   // UTC date for the ephemeris (may differ from local date!)
  const btUTC  = utc?.time ?? bt;   // UTC time

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Check if cached data is still valid for the current inputs
  const cached = member.astroData;
  const cacheHit = cached && cached.inputKey === inputKey(member);

  const fetchAstro = useCallback(async (force = false) => {
    if (!hasDate) return;
    if (cacheHit && !force) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/astro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: bdUTC,                 // ← UTC-Datum (kann sich durch Rollover vom lokalen Datum unterscheiden)
          birthTime: btUTC || undefined,    // ← UTC-Zeit
          birthDateLocal: bd,               // ← lokales Datum für Chinesisch/Maya (kalendertag-basiert)
          birthCity: bc || undefined,
          birthCountry: member.birthCountry || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const astro: AstroData = {
        sunTropical:    data.sunTropical,   sunTropicalGlyph: data.sunTropGlyph,
        sunVedic:       data.sunVedic,      sunVedicGlyph:    data.sunVedGlyph,
        moonTropical:   data.moonTropical,  moonTropicalGlyph: data.moonTropGlyph,
        ascTropical:    data.ascTropical  ?? undefined,  ascTropicalGlyph: data.ascTropGlyph  ?? undefined,
        ascVedic:       data.ascVedic     ?? undefined,  ascVedicGlyph:    data.ascVedGlyph   ?? undefined,
        chinese:        data.chinese,       chineseEmoji: data.chineseEmoji,
        maya:           data.maya,
        hd:             data.hd ?? undefined,  // ← auto-computed HD profile from I-Ching wheel
        meta:           data.meta,             // ← transparency: JD, sunLon, etc.
        geocoded:       data.meta.geocoded,
        computedAt:     new Date().toISOString(),
        inputKey:       inputKey(member),
      };
      updateMember(member.id, { astroData: astro });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [bd, bt, bdUTC, btUTC, effectiveTz, bc, member, cacheHit, hasDate, updateMember]);

  // Auto-fetch on mount if cache miss
  useEffect(() => { if (hasDate && !cacheHit) fetchAstro(); }, [hasDate, cacheHit, fetchAstro]);

  if (!hasDate) return (
    <div className="rounded-xl border border-border/40 p-3 text-center bg-anth-900/20">
      <p className="text-xs text-anth-500">{t('Geburtsdatum hinzufügen → Astrologien aktivieren')}</p>
    </div>
  );

  // Use fetched API data (null while still loading for first time)
  const a = cacheHit ? cached! : null;

  // HD: manual override wins for Type; Profile comes from API (I-Ching gate calc)
  // If the user has set hdProfile manually, that takes precedence over API profile
  const apiHdProfile  = a?.hd?.profile ?? null;
  const hdProfileShow = member.hdProfile ?? apiHdProfile ?? '?';
  const hdTypeShow    = member.hdType ?? null;   // Type still manual (needs full planetary chart)
  const hdGateCon     = a?.hd?.gateConscious;
  const hdGateDes     = a?.hd?.gateDesign;
  const hdHasData     = !!(hdTypeShow || apiHdProfile);
  const hdMissingType = !hdTypeShow;

  // Loading spinner (first fetch, no cache yet)
  if (loading && !a) return (
    <div className="rounded-xl border border-border/40 p-4 text-center bg-anth-900/20 space-y-2">
      <div className="animate-spin w-5 h-5 border-2 border-mint-500/30 border-t-mint-500 rounded-full mx-auto" />
      <p className="text-[9px] text-anth-500">{t('Berechne Astrodaten via Ephemeris…')}</p>
    </div>
  );

  // Error state (no cache to fall back on)
  if (error && !a) return (
    <div className="rounded-xl border border-red-500/20 p-3 bg-red-950/20 space-y-2">
      <p className="text-[9px] text-red-400">{t('Fehler:')} {error}</p>
      <button onClick={() => fetchAstro(true)}
        className="text-[8px] text-anth-400 hover:text-anth-200 underline transition-colors">
        {t('Nochmals versuchen')}
      </button>
    </div>
  );

  // Build badge list from API data
  const badges = [
    a ? { emoji: a.sunTropicalGlyph,  top: a.sunTropical,   sub: t('Sonne · Westlich'),                       color: 'text-gold'       } : null,
    a ? { emoji: a.sunVedicGlyph,     top: a.sunVedic,      sub: t('Sonne · Vedisch (Lahiri)'),                color: 'text-amber-300'  } : null,
    a ? { emoji: a.moonTropicalGlyph, top: a.moonTropical,  sub: t('Mond'),                                   color: 'text-sky-300'    } : null,
    (a?.ascVedic)
      ? { emoji: a.ascVedicGlyph ?? a.ascTropicalGlyph ?? '↑', top: a.ascVedic,
          sub: a.geocoded ? t('Aszendent · Vedisch (Lagna)') : t('Aszendent · Vedisch ≈'),                       color: 'text-rose-300'   }
      : (a?.ascTropical)
        ? { emoji: a.ascTropicalGlyph ?? '↑', top: a.ascTropical, sub: t('Aszendent · Westlich'),             color: 'text-rose-300'   }
        : null,
    a ? { emoji: a.chineseEmoji,      top: a.chinese,       sub: t('Chinesisches Tierzeichen'),                color: 'text-orange-300' } : null,
    a?.maya ? { emoji: a.maya.glyph,  top: `Kin ${a.maya.kin} · ${a.maya.seal}`,
                sub: `${t('Ton')} ${a.maya.tone} · ${a.maya.toneName}`,                                             color: 'text-violet-400' } : null,
    // HD badge: show type if known manually + auto-computed profile from API
    hdHasData ? {
      emoji: '⬡',
      top:   hdTypeShow ?? 'HD Profil',
      sub:   `Profil ${hdProfileShow}${hdGateCon ? ` · ☀ Gate ${hdGateCon}/${hdGateDes}` : ''}${hdMissingType ? ' · Typ → Astro-Tab' : ''}`,
      color: 'text-mint-400',
    } : null,
  ].filter(Boolean) as { emoji: string; top: string; sub: string; color: string }[];

  return (
    <div className="rounded-xl border border-border/60 p-2.5 space-y-1.5 bg-anth-900/30">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[7px] uppercase tracking-widest text-anth-600">Soul Blueprint · Bio-Analytics</p>
        <div className="flex items-center gap-1.5">
          {hasTime
            ? <span className="text-[7px] text-mint-600"
                title={`Lokal: ${bd} ${bt} ${effectiveTz} → UTC: ${bdUTC} ${btUTC} (wird so ans Backend übergeben)`}>
                ⏰ {bt} <span className="opacity-60 text-[6px]">→ {btUTC} UTC{bdUTC !== bd ? ` (${bdUTC})` : ''}</span>
              </span>
            : <span className="text-[7px] text-amber-600/70">{t('Zeit fehlt')}</span>
          }
          {hasCity
            ? <span className="text-[7px] text-sky-600">📍 {bc}</span>
            : <span className="text-[7px] text-amber-600/70">{t('Stadt fehlt')}</span>
          }
          <button onClick={() => fetchAstro(true)} title={t('Neu berechnen')}
            className="text-anth-700 hover:text-anth-400 transition-colors ml-1">
            <RefreshCw size={8} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Inline update indicator */}
      {loading && a && (
        <div className="flex items-center gap-1.5 text-[8px] text-anth-600">
          <div className="animate-spin w-3 h-3 border border-mint-500/30 border-t-mint-500 rounded-full" />
          {t('Aktualisiere…')}
        </div>
      )}
      {error && a && <p className="text-[8px] text-red-400">{error}</p>}

      {/* First-time skeleton (cache exists but stale, still fetching) */}
      {!a && !loading && !error && (
        <p className="text-[9px] text-anth-500 text-center py-2">{t('Lade…')}</p>
      )}

      {/* Badge grid */}
      {badges.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {badges.map((b, i) => (
            <div key={i} className="bg-anth-800/50 rounded-lg p-2 text-center">
              <p className="text-lg leading-none mb-0.5">{b.emoji}</p>
              <p className={cn('text-xs font-bold leading-tight truncate', b.color)}>{b.top}</p>
              <p className="text-[9px] text-anth-400 leading-tight mt-0.5">{b.sub}</p>
            </div>
          ))}
          {/* HD placeholder: only if API hasn't returned data yet and no manual entry */}
          {!hdHasData && (
            <div className="bg-anth-800/30 rounded-lg p-2 text-center border border-dashed border-mint-500/20">
              <p className="text-lg leading-none mb-0.5 opacity-40">⬡</p>
              <p className="text-[9px] font-bold text-mint-600/70 leading-tight">Human Design</p>
              <p className="text-[8px] text-anth-600 leading-tight mt-0.5">{t('wird berechnet…')}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer: transparency — show raw sun longitude + which date the ephemeris used */}
      {a && (
        <div className="pt-0.5 space-y-0.5">
          {a.meta && (
            <p className="text-[6px] text-anth-700 leading-tight"
              title={t('Raw-Werte der Ephemeris — für Diagnose')}>
              ☀ Trop: {a.meta.sunLonDeg}° · Ved: {a.meta.sunLonVedic}° · JD: {a.meta.JD}
              {a.meta.birthDateUsed ? ` · Datum: ${a.meta.birthDateUsed}` : ''}
              {a.hd ? ` · HD Design JD: ${a.hd.designJD}` : ''}
            </p>
          )}
          <p className="text-[6px] text-anth-700 text-right">
            {a.geocoded ? '📍 Geocoded' : t('⚠️ kein Geocoding')} · {t('Berechnet:')} {new Date(a.computedAt).toLocaleDateString('de-AT')}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MEMBER CARD
// ═══════════════════════════════════════════════════════════════
function MemberCard({ member, tasks, onEdit, onDelete }: {
  member: NinjaMember;
  tasks: KanbanTask[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAstro, setShowAstro] = useState(false);
  const c = COLOR_MAP[member.color] ?? COLOR_MAP.forest;
  const roleDef = ROLE_DEFS.find(r => r.id === member.role);
  const openTasks = tasks.filter(t => t.assignedMember===member.id && t.status!=='done');
  const doneTasks = tasks.filter(t => t.assignedMember===member.id && t.status==='done');

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      className={cn('glass rounded-2xl border p-5 flex flex-col gap-3 relative', c.border)}>

      {/* 3-dot menu */}
      <div className="absolute top-3 right-3">
        <button onClick={() => setMenuOpen(v=>!v)}
          className="p-1.5 rounded-lg text-anth-600 hover:text-anth-300 hover:bg-anth-800/50 transition-colors">
          <MoreVertical size={13}/>
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{opacity:0,scale:0.95,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="absolute top-full right-0 mt-1 w-44 glass-dark border border-border rounded-xl shadow-panel z-20 py-1">
              <button onClick={()=>{setMenuOpen(false);onEdit();}}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-anth-300 hover:bg-forest-900/30 hover:text-forest-200 transition-colors">
                <Edit3 size={11}/> {t('Profil bearbeiten')}
              </button>
              <button onClick={()=>{setMenuOpen(false);setShowAstro(v=>!v);}}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-anth-300 hover:bg-forest-900/30 hover:text-forest-200 transition-colors">
                <Star size={11}/> {showAstro?t('Astro verbergen'):'Soul Blueprint'}
              </button>
              <button onClick={()=>{setMenuOpen(false);onDelete();}}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors">
                <Trash2 size={11}/> {t('Mitglied entfernen')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar + identity */}
      <div className="flex items-center gap-3">
        <div className={cn('relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shrink-0', c.bg, c.border)}>
          {member.imageUrl
            ? <img src={member.imageUrl} alt={member.name} className="w-full h-full rounded-2xl object-cover" />
            : <span>{member.avatar}</span>}
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className={cn('text-sm font-bold truncate', c.text)}>{member.name}</h3>
          <p className="text-[10px] text-anth-400 truncate">{member.title}</p>
          {(member.birthCity || member.birthCountry) && (
            <p className="text-[9px] text-anth-600 flex items-center gap-1 mt-0.5">
              <MapPin size={7} className="shrink-0"/>{[member.birthCity, member.birthCountry].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Role badge */}
      {roleDef && (
        <div className={cn('self-start text-[9px] px-2 py-0.5 rounded-full border font-semibold', roleDef.pill)}>
          {roleDef.emoji} {t(roleDef.label)}
        </div>
      )}

      {/* Bio */}
      {member.bio && (
        <p className="text-[10px] text-anth-500 leading-relaxed line-clamp-2">{member.bio}</p>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {member.skills.map(skill => (
          <span key={skill} className={cn('text-[9px] px-1.5 py-0.5 rounded-md border font-medium', c.badge)}>{skill}</span>
        ))}
      </div>

      {/* Astrology panel */}
      <AnimatePresence>
        {showAstro && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <AstroBadges member={member} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-anth-900/30 rounded-xl p-2.5 border border-border text-center">
          <p className={cn('text-lg font-bold', c.text)}>{openTasks.length}</p>
          <p className="text-[9px] text-anth-500 flex items-center justify-center gap-1"><Clock size={8}/> {t('Offen')}</p>
        </div>
        <div className="bg-anth-900/30 rounded-xl p-2.5 border border-border text-center">
          <p className="text-lg font-bold text-forest-400">{doneTasks.length}</p>
          <p className="text-[9px] text-anth-500 flex items-center justify-center gap-1"><CheckSquare size={8}/> {t('Erledigt')}</p>
        </div>
      </div>

      {openTasks.length > 0 && (
        <div className="space-y-1">
          {openTasks.slice(0,3).map(task=>(
            <div key={task.id} className="flex items-center gap-2 text-xs text-anth-300 bg-anth-900/30 rounded-lg px-2.5 py-1.5">
              <Zap size={9} className="text-gold shrink-0"/><span className="truncate">{task.title}</span>
            </div>
          ))}
        </div>
      )}

      <Link href="/dashboard/kanban"
        className="flex items-center gap-1.5 text-[10px] text-anth-500 hover:text-forest-300 transition-colors mt-auto">
        <ExternalLink size={10}/> Task Board
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CORPORATE ENTITY CARD
// ═══════════════════════════════════════════════════════════════
function CorporateEntityCard() {
  const t = useT();
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      className="glass rounded-2xl border border-dashed border-anth-600/40 p-5 flex flex-col gap-3 bg-anth-900/20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-anth-800/60 border border-anth-700/40 flex items-center justify-center text-2xl">
          📎
        </div>
        <div>
          <h3 className="text-sm font-bold text-anth-300">Paperclip Entity Hub</h3>
          <p className="text-[10px] text-anth-500">Corporate Intelligence Network</p>
        </div>
      </div>
      <p className="text-[10px] text-anth-600 leading-relaxed">
        {t('AI-gestütztes Partner-Netzwerk. Verträge, Gesellschaftsstrukturen, legale Entitäten. Powered by Paperclip Bot.')}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {['YOU ARE NEO GmbH','Academy License','Verein Statut','IP Portfolio'].map(item => (
          <div key={item} className="bg-anth-800/40 rounded-lg px-2 py-1.5 text-[9px] text-anth-500 flex items-center gap-1.5 border border-anth-700/30">
            <Building2 size={8} className="text-anth-600 shrink-0"/>{item}
          </div>
        ))}
      </div>
      <Link href="/dashboard/agents/paperclip-bot"
        className="flex items-center gap-1.5 text-[10px] text-pink-400 hover:text-pink-300 transition-colors mt-auto border-t border-border/40 pt-2">
        <ExternalLink size={10}/> {t('Paperclip Bot öffnen →')}
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EDIT MODAL — full form
// ═══════════════════════════════════════════════════════════════
function EditModal({ member, onSave, onClose }: {
  member: NinjaMember;
  onSave: (m: NinjaMember) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [draft, setDraft]       = useState({ ...member });
  const [showPw, setShowPw]     = useState(false);
  const [activeTab, setTab]     = useState<'profile'|'astro'>('profile');
  const [newSkillInput, setNewSkillInput] = useState('');
  const imgRef                  = useRef<HTMLInputElement>(null);

  const addSkill = (tag: string) => {
    const t = tag.trim();
    if (!t || draft.skills.includes(t)) return;
    setDraft(p => ({ ...p, skills: [...p.skills, t] }));
    setNewSkillInput('');
  };
  const removeSkill = (tag: string) =>
    setDraft(p => ({ ...p, skills: p.skills.filter(s => s !== tag) }));

  const set = (k: keyof NinjaMember, v: string) => setDraft(p => ({ ...p, [k]: v }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setDraft(p => ({ ...p, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-anth-950/85 backdrop-blur-sm p-4">
      <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
        className="glass-dark border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">{draft.avatar}</span>
            <h3 className="text-sm font-bold text-forest-100">{member.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-anth-500 hover:text-anth-300"><X size={15}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/60">
          {([['profile','Profil'],['astro','Geburt & Astro']] as const).map(([tabId, label]) => (
            <button key={tabId} onClick={() => setTab(tabId)}
              className={cn('flex-1 py-2.5 text-xs transition-colors',
                activeTab===tabId ? 'text-forest-300 border-b-2 border-forest-500 bg-forest-800/10' : 'text-anth-500 hover:text-anth-300'
              )}>
              {t(label)}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <>
              {/* Profile image upload */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-border bg-anth-800/50 flex items-center justify-center shrink-0">
                  {draft.imageUrl
                    ? <img src={draft.imageUrl} alt="" className="w-full h-full object-cover"/>
                    : <span className="text-3xl">{draft.avatar}</span>}
                  <button onClick={() => imgRef.current?.click()}
                    className="absolute inset-0 bg-anth-950/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white"/>
                  </button>
                </div>
                <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">Avatar Emoji</label>
                    <input value={draft.avatar} onChange={e=>set('avatar',e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-sm outline-none focus:border-forest-600"/>
                  </div>
                </div>
              </div>

              {[
                { k:'name',  label:'Name',       type:'text' },
                { k:'title', label:'Titel / Rolle',type:'text' },
              ].map(f => (
                <div key={f.k}>
                  <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">{t(f.label)}</label>
                  <input type={f.type} value={((draft as unknown as Record<string,string>))[f.k]??''}
                    onChange={e=>set(f.k as keyof NinjaMember, e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors"/>
                </div>
              ))}

              {/* Bio */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">Bio</label>
                <textarea value={draft.bio} onChange={e=>set('bio',e.target.value)} rows={3}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors resize-none"/>
              </div>

              {/* ── Skills / Attribute Tags ── */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-anth-600 block">Skills / Attribute</label>
                {/* Current tags with delete */}
                <div className="flex flex-wrap gap-1 min-h-[28px]">
                  {draft.skills.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border bg-forest-900/50 border-forest-600/60 text-forest-200">
                      {tag}
                      <button onClick={() => removeSkill(tag)} className="hover:text-red-400 transition-colors leading-none ml-0.5 text-sm">×</button>
                    </span>
                  ))}
                  {draft.skills.length === 0 && <span className="text-xs text-anth-500 italic">{t('Noch keine Skills')}</span>}
                </div>
                {/* Quick-add from preset list */}
                <div className="flex flex-wrap gap-1">
                  {SKILL_PRESETS.filter(s => !draft.skills.includes(s)).slice(0, 24).map(tag => (
                    <button key={tag} onClick={() => addSkill(tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-anth-600/50 text-anth-300 hover:border-forest-500/60 hover:text-forest-200 hover:bg-forest-900/25 transition-colors">
                      + {tag}
                    </button>
                  ))}
                </div>
                {/* Custom new tag */}
                <div className="flex gap-1.5">
                  <input
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkillInput); } }}
                    placeholder={t('Eigener Tag…')}
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors"
                  />
                  <button onClick={() => addSkill(newSkillInput)}
                    className="px-3 py-1.5 rounded-xl bg-forest-800/40 border border-forest-700/40 text-xs text-forest-300 hover:bg-forest-700/40 transition-colors">
                    +
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">{t('Rolle')}</label>
                <select value={draft.role} onChange={e=>set('role',e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600">
                  {ROLE_DEFS.map(r => <option key={r.id} value={r.id}>{r.emoji} {t(r.label)}</option>)}
                </select>
              </div>

              {/* Color selector */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-1 block">{t('Farbe')}</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(COLOR_MAP).map(col => (
                    <button key={col} onClick={() => set('color',col)}
                      className={cn('w-6 h-6 rounded-full border-2 transition-all', draft.color===col?'scale-125 border-white':'border-transparent opacity-70')}
                      style={{backgroundColor: col==='gold'?'#F5C842':col==='forest'?'#11CAA0':col==='purple'?'#9333EA':col==='rose'?'#F43F5E':col==='sky'?'#38BDF8':col==='teal'?'#14B8A6':col==='violet'?'#8B5CF6':'#F59E0B'}}
                    />
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">{t('Passwort')}</label>
                <div className="relative">
                  <input type={showPw?'text':'password'} value={draft.password} onChange={e=>set('password',e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 pr-8 font-mono"/>
                  <button onClick={()=>setShowPw(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-anth-500 hover:text-anth-300">
                    {showPw?<EyeOff size={11}/>:<Eye size={11}/>}
                  </button>
                </div>
              </div>

              {/* ── Quick Birth Data (for astro) ── */}
              <div className="border-t border-border/40 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-widest text-anth-600">{t('Geburtsdaten')}</p>
                  <button onClick={() => setTab('astro')}
                    className="text-[8px] text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">
                    {t('Vollständige Astro-Einstellungen →')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-anth-600 mb-0.5 block">{t('Geburtsdatum')}</label>
                    <input type="date" value={draft.birthDate??''} onChange={e=>set('birthDate',e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors"/>
                  </div>
                  <div>
                    <label className="text-[9px] text-anth-600 mb-0.5 block">{t('Geburtszeit (Lokalzeit)')}</label>
                    <input type="time" value={draft.birthTime??''} onChange={e=>set('birthTime',e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors"/>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-anth-600 mb-0.5 block">{t('Zeitzone des Geburtsortes')}</label>
                  <select value={(draft as unknown as Record<string,string>).birthTimezone ?? 'Europe/Vienna'}
                    onChange={e=>set('birthTimezone',e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors">
                    {TIMEZONE_OPTIONS.map(tz=><option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-anth-600 mb-0.5 block">{t('Geburtsstadt')}</label>
                    <input type="text" placeholder="z.B. Vienna" value={draft.birthCity??''} onChange={e=>set('birthCity',e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 placeholder-anth-600 transition-colors"/>
                  </div>
                  <div>
                    <label className="text-[9px] text-anth-600 mb-0.5 block">{t('Geburtsland')}</label>
                    <input type="text" placeholder="z.B. AT" value={draft.birthCountry??''} onChange={e=>set('birthCountry',e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 placeholder-anth-600 transition-colors"/>
                  </div>
                </div>
                <p className="text-[8px] text-anth-700">
                  {t('⚡ Lokale Geburtszeit wird automatisch in UTC umgerechnet. Zeitzone korrekt wählen!')}
                </p>
              </div>
            </>
          )}

          {activeTab === 'astro' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k:'birthDate',    label:'Geburtsdatum',         type:'date' },
                  { k:'birthTime',    label:'Geburtszeit (lokal)',   type:'time' },
                  { k:'birthCity',    label:'Geburtsstadt',          type:'text' },
                  { k:'birthCountry', label:'Geburtsland',           type:'text' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">{t(f.label)}</label>
                    <input type={f.type} value={((draft as unknown as Record<string,string>))[f.k]??''}
                      onChange={e=>set(f.k as keyof NinjaMember, e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors"/>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">{t('Zeitzone des Geburtsortes')}</label>
                <select value={(draft as unknown as Record<string,string>).birthTimezone ?? 'Europe/Vienna'}
                  onChange={e=>set('birthTimezone',e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600 transition-colors">
                  {TIMEZONE_OPTIONS.map(tz=><option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
                <p className="text-[8px] text-amber-600/80 mt-1">{t('⚡ Lokalzeit wird automatisch in UTC umgerechnet. Für korrekte Sonne/Mond/Aszendent-Berechnung!')}</p>
              </div>
              {/* Human Design override (profile auto-computed, type optional manual) */}
              <div className="border-t border-border/40 pt-3 space-y-2">
                <p className="text-[9px] uppercase tracking-widest text-anth-600">Human Design</p>
                <p className="text-[8px] text-anth-700 leading-snug">{t('Profil wird automatisch aus Geburts-Ephemeris berechnet. HD-Typ optional manuell setzen.')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-anth-600 mb-0.5 block">HD Typ</label>
                    <select value={(draft as unknown as Record<string,string>).hdType ?? ''}
                      onChange={e => setDraft(p => ({ ...p, hdType: e.target.value || undefined }))}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600">
                      <option value="">{t('Auto (Näherung)')}</option>
                      {['Generator','Manifesting Generator','Projector','Manifestor','Reflector'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-anth-600 mb-0.5 block">HD Profil</label>
                    <select value={(draft as unknown as Record<string,string>).hdProfile ?? ''}
                      onChange={e => setDraft(p => ({ ...p, hdProfile: e.target.value || undefined }))}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600">
                      <option value="">Auto</option>
                      {['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {draft.birthDate && (
                <div className="mt-2">
                  <p className="text-[9px] uppercase tracking-widest text-anth-600 mb-2">{t('Vorschau')}</p>
                  <AstroBadges member={draft} />
                </div>
              )}
              {!draft.birthDate && (
                <p className="text-[10px] text-anth-600 text-center py-4">{t('Geburtsdatum eingeben für Vorschau.')}</p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-anth-700/50 text-xs text-anth-400 hover:text-anth-200 transition-colors">
            {t('Abbrechen')}
          </button>
          <button onClick={() => { onSave(draft); onClose(); }}
            className="flex-1 py-2 rounded-xl bg-forest-700/40 border border-forest-600/40 text-xs text-forest-200 font-medium hover:bg-forest-600/40 transition-colors">
            {t('Speichern')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ADD MEMBER MODAL
// ═══════════════════════════════════════════════════════════════
function AddMemberModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { addMember } = useNinjasStore();
  const [draft, setDraft] = useState({
    name:'', title:'', bio:'', avatar:'🌀', role:'creator' as NinjaRole,
    color:'forest', skills:[] as string[], password:'0595',
    birthDate:'', birthTime:'', birthCity:'', birthCountry:'',
  });
  const setF = (k: string, v: string) => setDraft(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-anth-950/85 backdrop-blur-sm p-4">
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
        className="glass-dark border border-border rounded-2xl p-5 w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-forest-100">{t('Neues Mitglied')}</h3>
          <button onClick={onClose} className="text-anth-500 hover:text-anth-300"><X size={15}/></button>
        </div>
        {[
          { k:'name',   label:'Name',        type:'text' },
          { k:'title',  label:'Titel',       type:'text' },
          { k:'avatar', label:'Avatar Emoji',type:'text' },
        ].map(f => (
          <div key={f.k}>
            <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">{t(f.label)}</label>
            <input type={f.type} value={((draft as unknown as Record<string,string>))[f.k]??''}
              onChange={e=>setF(f.k,e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none focus:border-forest-600"/>
          </div>
        ))}
        <div>
          <label className="text-[9px] uppercase tracking-widest text-anth-600 mb-0.5 block">{t('Rolle')}</label>
          <select value={draft.role} onChange={e=>setF('role',e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 outline-none">
            {ROLE_DEFS.map(r=><option key={r.id} value={r.id}>{r.emoji} {t(r.label)}</option>)}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-anth-700/50 text-xs text-anth-400">{t('Abbrechen')}</button>
          <button onClick={() => {
            if (!draft.name.trim()) return;
            addMember({ ...draft });
            onClose();
          }} className="flex-1 py-2 rounded-xl bg-mint-500/20 border border-mint-500/30 text-xs text-mint-400 font-medium hover:bg-mint-500/30 transition-colors">
            {t('Hinzufügen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN VIEW
// ═══════════════════════════════════════════════════════════════
export function NinjasView() {
  const t = useT();
  const { tasks, setTasks } = useKanbanStore();
  const { members, updateMember, removeMember } = useNinjasStore();
  const [editingId, setEditingId]   = useState<string|null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [draggedId, setDraggedId]   = useState<string|null>(null);

  useEffect(() => {
    fetch('/api/kanban').then(r=>r.json()).then(d=>setTasks(d.data?.tasks??[])).catch(()=>{});
  }, [setTasks]);

  const handleDrop = useCallback((targetRole: NinjaRole) => {
    if (draggedId) {
      updateMember(draggedId, { role: targetRole });
      setDraggedId(null);
    }
  }, [draggedId, updateMember]);

  const editingMember = members.find(m => m.id === editingId) ?? null;

  return (
    <div className="flex gap-5 min-h-0 pb-4">
      {/* ── Left: Rollen-Verteilung ── */}
      <div className="w-52 shrink-0 space-y-2">
        <p className="text-[8px] uppercase tracking-widest text-anth-600 px-0.5 mb-3">{t('Rollen-Verteilung')}</p>
        {ROLE_DEFS.map(role => (
          <RoleColumn
            key={role.id}
            role={role}
            members={members.filter(m => m.role === role.id)}
            draggedId={draggedId}
            onDragStart={setDraggedId}
            onDrop={handleDrop}
          />
        ))}
        <p className="text-[7px] text-anth-700 text-center pt-1">{t('Karte ziehen → Rolle wechseln')}</p>
      </div>

      {/* ── Right: Main content ── */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {members.slice(0,8).map(m=><span key={m.id} className="text-base">{m.avatar}</span>)}
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-anth-500">YOU ARE NEO · Team Registry</p>
              <p className="text-sm text-anth-300">{members.length} {t('aktive Mitglieder · Astrologien aktiv')}</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mint-500/15 border border-mint-500/30 text-xs text-mint-400 font-medium hover:bg-mint-500/25 transition-colors">
            <Plus size={12}/> {t('Hinzufügen')}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map(member => (
            <MemberCard key={member.id} member={member} tasks={tasks}
              onEdit={() => setEditingId(member.id)}
              onDelete={() => removeMember(member.id)} />
          ))}
          <CorporateEntityCard />
          <motion.button initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            onClick={() => setShowAdd(true)}
            className="glass rounded-2xl border border-dashed border-forest-700/30 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[180px] hover:border-mint-500/30 hover:bg-forest-900/10 transition-all group">
            <Plus size={24} className="text-anth-600 group-hover:text-mint-500 transition-colors"/>
            <p className="text-xs text-anth-500 group-hover:text-mint-400 transition-colors">{t('Mitglied hinzufügen')}</p>
          </motion.button>
        </div>
      </div>

      {/* Modals */}
      {editingMember && (
        <EditModal member={editingMember}
          onSave={updated => updateMember(updated.id, updated)}
          onClose={() => setEditingId(null)} />
      )}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
