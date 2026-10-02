import type { NoteDraft, SavedNote } from "@/lib/voice/contracts";

export const RECIPE_TAG = "kochbuch";
export const RADIO_TAG = "radiofavorit";
export function recipeNote(title: string, ingredients: string, method: string, season: string): NoteDraft {
  return { title: title.trim(), transcript: `Zutaten\n${ingredients.trim()}\n\nZubereitung\n${method.trim()}\n\nJahreszeit: ${season}`, summary: "", type: "notiz", source: "text", project: null, tags: [RECIPE_TAG, season.toLowerCase()], due: null, assignee: null };
}
export type Station = { id: string; name: string; stream: string; country: string; tags: string };
export function secureUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; } catch { return ""; }
}
export function stationOf(value: unknown): Station | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const stream = secureUrl(row.stream ?? row.url_resolved ?? row.url);
  const id = row.id ?? row.stationuuid;
  if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(id) || typeof row.name !== "string" || !row.name.trim() || !stream) return null;
  return { id, name: row.name.slice(0,200), stream, country: typeof row.country === "string" ? row.country.slice(0,100) : "", tags: typeof row.tags === "string" ? row.tags.slice(0,300) : "" };
}
export function radioNote(station: Station): NoteDraft {
  return { title: station.name, transcript: JSON.stringify(station), summary: "Radio-Merkliste", type: "notiz", source: "text", project: null, tags: [RADIO_TAG], due: null, assignee: null };
}
export function savedStation(note: SavedNote): Station | null {
  if (!note.tags.includes(RADIO_TAG)) return null;
  try { return stationOf(JSON.parse(note.transcript)); } catch { return null; }
}
