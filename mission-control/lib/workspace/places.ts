import { cityMapping } from "city-timezones";
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const aliases: Record<string, string> = {
  wien: "vienna",
  munchen: "munich",
  muenchen: "munich",
  koln: "cologne",
  koeln: "cologne",
  prag: "prague",
  rom: "rome",
  mailand: "milan",
  venedig: "venice",
  lissabon: "lisbon",
  zurich: "zurich",
  zuerich: "zurich",
  genf: "geneva",
  osterreich: "austria",
  deutschland: "germany",
  schweiz: "switzerland",
};
export function findBirthPlaces(raw: string) {
  const normalized = normalize(raw);
  if (normalized.length < 2 || normalized.length > 100) return [];
  const tokens = normalized.split(" ").map((t) => aliases[t] ?? t);
  return cityMapping
    .filter((p) => {
      const text = normalize(
        [p.city, p.city_ascii, p.province, p.country, p.iso2].join(" "),
      );
      return tokens.every((t) => text.includes(t));
    })
    .sort((a, b) => {
      const exact = (p: typeof a) =>
        normalize(p.city) === tokens.join(" ") ? 1 : 0;
      return exact(b) - exact(a) || b.pop - a.pop;
    })
    .slice(0, 12)
    .map((p) => ({
      name: `${p.city}, ${p.province ? `${p.province}, ` : ""}${p.country}`,
      lat: p.lat,
      lng: p.lng,
      timezone: p.timezone,
    }));
}
