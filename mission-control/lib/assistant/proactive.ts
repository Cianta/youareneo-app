// Proaktive Hilfe: Trinity meldet sich selten, kurz und nie mitten in einer Aufgabe.
// Reine Entscheidungslogik ohne Browser- oder Netzwerkzugriff, damit sie testbar bleibt.
export type ProactiveMode = "off" | "gentle" | "active";
export const PROACTIVE_MODES: ProactiveMode[] = ["off", "gentle", "active"];

export type ProactiveKind = "draft" | "greet" | "checkin" | "late";
export type ProactiveSuggestion = {
  kind: ProactiveKind;
  text: string;
  // Eröffnung im Sprachchat, wenn der Nutzer „Ja, bitte“ wählt.
  opening: string;
};

export type ProactiveMemory = {
  day: string; shown: number; lastShownAt: number; lastDismissedAt: number;
  snoozedDay: string; greetedDay: string;
};
export const emptyMemory: ProactiveMemory = { day: "", shown: 0, lastShownAt: 0, lastDismissedAt: 0, snoozedDay: "", greetedDay: "" };

export type ProactiveContext = {
  mode: ProactiveMode; name: string; hour: number; path: string;
  sessionMs: number; idleMs: number; draftAgeMs: number | null;
  // Aufnahme, Verarbeitung oder ein offenes Panel: dann bleibt Trinity still.
  busy: boolean;
};

const MIN = 60_000;
const limits = {
  gentle: { perDay: 2, gap: 30 * MIN, idle: 6 * MIN, greetAfter: 20_000 },
  active: { perDay: 5, gap: 12 * MIN, idle: 3 * MIN, greetAfter: 8_000 },
} as const;
const AFTER_DISMISS = 20 * MIN;
const DRAFT_WAIT = 2 * MIN;

export const dayKey = (now: number) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 16) : "");

export function memoryOf(value: unknown): ProactiveMemory {
  const m = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    day: str(m.day), shown: Math.min(num(m.shown), 99), lastShownAt: num(m.lastShownAt),
    lastDismissedAt: num(m.lastDismissedAt), snoozedDay: str(m.snoozedDay), greetedDay: str(m.greetedDay),
  };
}

export const greetingWord = (hour: number) =>
  hour < 5 ? "Hallo" : hour < 11 ? "Guten Morgen" : hour < 17 ? "Hallo" : hour < 22 ? "Guten Abend" : "Hallo";

/** Neuer Tag: Zähler zurücksetzen, Schlummern und Begrüßung gelten nur für den Tag. */
export function rolloverMemory(memory: ProactiveMemory, now: number): ProactiveMemory {
  const today = dayKey(now);
  return memory.day === today ? memory : { ...memory, day: today, shown: 0 };
}

const checkinByPath = (path: string, name: string): { text: string; opening: string } => {
  if (path.startsWith("/notiz") || path.startsWith("/gehirn"))
    return {
      text: "Du bist gerade ganz still. Soll ich dir helfen, einen Gedanken einzuordnen oder etwas in deiner Map zu finden?",
      opening: `Gern. Sag mir einfach, was du einordnen oder finden möchtest – ich höre zu.`,
    };
  return {
    text: "Wie läuft es bei dir? Brauchst du Hilfe oder soll ich dir etwas vorlesen oder heraussuchen?",
    opening: `Schön, dass du fragst. Wobei kann ${name} dir helfen?`,
  };
};

export function decideProactive(ctx: ProactiveContext, memory: ProactiveMemory, now: number): ProactiveSuggestion | null {
  if (ctx.mode === "off" || ctx.busy) return null;
  const cfg = limits[ctx.mode], m = rolloverMemory(memory, now), today = dayKey(now);
  if (m.snoozedDay === today || m.shown >= cfg.perDay) return null;
  if (m.lastShownAt && now - m.lastShownAt < cfg.gap) return null;
  if (m.lastDismissedAt && now - m.lastDismissedAt < AFTER_DISMISS) return null;

  if (ctx.draftAgeMs !== null && ctx.draftAgeMs >= DRAFT_WAIT)
    return {
      kind: "draft",
      text: "Dein Vorschlag wartet noch auf dich. Wollen wir ihn kurz durchgehen, bevor er verloren geht?",
      opening: "Ich bin da. Schau dir den Vorschlag an – oder sag mir, was du ändern möchtest.",
    };

  if (m.greetedDay !== today && ctx.sessionMs >= cfg.greetAfter)
    return {
      kind: "greet",
      text: `${greetingWord(ctx.hour)}! Wie geht es dir? Brauchst du heute Hilfe bei etwas?`,
      opening: `${greetingWord(ctx.hour)}! Mir geht es gut, danke. Erzähl mir, was heute ansteht.`,
    };

  if (ctx.idleMs >= cfg.idle) {
    if (ctx.hour >= 22 || ctx.hour < 5)
      return {
        kind: "late",
        text: "Es ist schon spät. Soll ich dir zum Abschluss noch einen Gedanken festhalten, damit du ihn morgen wiederfindest?",
        opening: "Gern. Sprich einfach, ich halte es fest – gespeichert wird erst, wenn du es bestätigst.",
      };
    return { kind: "checkin", ...checkinByPath(ctx.path, ctx.name) };
  }
  return null;
}

export function afterShown(memory: ProactiveMemory, kind: ProactiveKind, now: number): ProactiveMemory {
  const m = rolloverMemory(memory, now);
  return { ...m, shown: m.shown + 1, lastShownAt: now, greetedDay: kind === "greet" ? dayKey(now) : m.greetedDay };
}
export const afterDismissed = (memory: ProactiveMemory, now: number): ProactiveMemory =>
  ({ ...rolloverMemory(memory, now), lastDismissedAt: now });
export const afterSnoozed = (memory: ProactiveMemory, now: number): ProactiveMemory =>
  ({ ...rolloverMemory(memory, now), snoozedDay: dayKey(now) });
