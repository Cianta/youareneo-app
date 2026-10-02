import { stationOf, type Station } from "./collections";

export const radioPresets = [
  { name: "Jazz im Salon", tags: ["jazz"] },
  { name: "Garage & Soul", tags: ["60s", "soul"] },
  { name: "Garten Eden", tags: ["ambient", "world music"] },
  { name: "Reggae & Dub", tags: ["reggae", "dub"] },
  { name: "Klassik", tags: ["classical"] },
] as const;
const mirrors = ["de1.api.radio-browser.info", "nl1.api.radio-browser.info"];
const cache = new Map<string, { expires: number; stations: Station[] }>();
export async function searchStations(query: string, tags: readonly string[], country: string, signal: AbortSignal): Promise<Station[]> {
  const key = JSON.stringify([query, tags, country]);
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return saved.stations;
  const searches: Record<string, string>[] = query ? [{ name: query }, { tag: query }] : tags.map(tag => ({ tag }));
  async function find(filter: Record<string, string>) {
    for (let i = 0; i < mirrors.length; i++) {
      signal.throwIfAborted();
      const timeout = new AbortController();
      const cancel = () => timeout.abort(); signal.addEventListener("abort", cancel, { once: true });
      const timer = setTimeout(() => timeout.abort(), 7000);
      try {
        const params = new URLSearchParams({ hidebroken: "true", is_https: "true", order: "clickcount", reverse: "true", limit: "40", ...filter });
        if (country) params.set("countrycode", country);
        const response = await fetch(`https://${mirrors[i]}/json/stations/search?${params}`, { signal: timeout.signal, credentials: "omit", referrerPolicy: "no-referrer" });
        if (!response.ok) throw Error("Verzeichnis nicht erreichbar");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw Error("Ungültige Senderliste");
        return data;
      } catch { signal.throwIfAborted(); if (i === mirrors.length - 1) throw Error("Das Senderverzeichnis antwortet gerade nicht. Bitte versuche es erneut."); }
      finally { clearTimeout(timer); signal.removeEventListener("abort", cancel); }
    }
    return [];
  }
  const results = await Promise.all(searches.map(find));
  signal.throwIfAborted();
  const seen = new Set<string>();
  const stations = results.flat().flatMap(row => {
    const station = stationOf(row);
    if (!station || seen.has(station.id)) return [];
    seen.add(station.id); return [station];
  }).slice(0,80);
  if (cache.size >= 24) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 300_000, stations });
  return stations;
}
