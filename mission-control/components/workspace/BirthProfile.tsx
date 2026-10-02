"use client";
import { useState, useRef, useEffect } from "react";
import { useNinjasStore, useAuthStore } from "@/lib/store";
import type { BirthResult } from "@/lib/workspace/birth";
import { create } from "zustand";
import { persist } from "zustand/middleware";
export type SavedBirth = {
  date: string;
  time: string;
  timezone: string;
  city: string;
  lat?: number;
  lng?: number;
  result: BirthResult;
};
export const useBirthProfiles = create<{
  profiles: Record<string, SavedBirth>;
  save: (id: string, p: SavedBirth) => void;
}>()(
  persist(
    (set) => ({
      profiles: {},
      save: (id, p) => set((s) => ({ profiles: { ...s.profiles, [id]: p } })),
    }),
    { name: "trinity-birth-profiles-v1" },
  ),
);
export function BirthProfile({ personId = "self" }: { personId?: string }) {
  const members = useNinjasStore((s) => s.members),
    user = useAuthStore((s) => s.user),
    store = useBirthProfiles(),
    saved = store.profiles[personId],
    member = members.find((m) => m.id === personId);
  const [result, setResult] = useState<BirthResult | null>(
      saved?.result ?? null,
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [places, setPlaces] = useState<
      { name: string; lat: number; lng: number; timezone: string }[]
    >([]),
    [placeBusy, setPlaceBusy] = useState(false),
    [placeQuery, setPlaceQuery] = useState(
      saved?.city ?? member?.birthCity ?? "",
    ),
    [location, setLocation] = useState<{
      lat?: number;
      lng?: number;
      timezone: string;
    }>({
      lat: saved?.lat,
      lng: saved?.lng,
      timezone: saved?.timezone ?? member?.birthTimezone ?? "Europe/Vienna",
    });
  const searchRequest = useRef<AbortController | null>(null);
  useEffect(() => () => searchRequest.current?.abort(), []);
  async function searchPlaces() {
    const query = placeQuery.trim();
    if (query.length < 2) return;
    searchRequest.current?.abort();
    const request = new AbortController();
    searchRequest.current = request;
    setPlaceBusy(true);
    setPlaces([]);
    setError("");
    try {
      const r = await fetch(
        `/api/birth-places?q=${encodeURIComponent(query)}`,
        {
          signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
        },
      );
      if (!r.ok) throw new Error("Ortssuche derzeit nicht erreichbar.");
      const data = await r.json();
      if (request.signal.aborted) return;
      setPlaces(data.places);
      if (!data.places.length)
        setError(
          "Kein Treffer im Städteverzeichnis. Versuche einen größeren Ort in der Nähe oder gib die Koordinaten manuell ein.",
        );
    } catch (e) {
      if (!request.signal.aborted)
        setError(e instanceof Error ? e.message : "Ortssuche fehlgeschlagen.");
    } finally {
      if (searchRequest.current === request) setPlaceBusy(false);
    }
  }
  return (
    <div className="s-stack">
      <section className="w-card">
        <span className="w-eyebrow">
          DEIN URSPRUNG · {member?.name ?? user?.name ?? "DU"}
        </span>
        <h2>Eine Geburt. Viele Perspektiven.</h2>
        <p className="w-muted">
          Die Daten bleiben auf diesem Gerät gespeichert. Die Berechnung läuft
          auf dem Trinity-Server; es wird kein externer Horoskopdienst
          aufgerufen.
        </p>
        <form
          className="s-form s-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              input = {
                date: String(f.get("date")),
                time: String(f.get("time")),
                timezone: String(f.get("timezone")),
                city: placeQuery,
                ...(f.get("lat") && f.get("lng")
                  ? { lat: Number(f.get("lat")), lng: Number(f.get("lng")) }
                  : {}),
              };
            setBusy(true);
            setError("");
            setResult(null);
            try {
              const r = await fetch("/api/birth-chart", {
                  signal: AbortSignal.timeout(20000),
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(input),
                }),
                data = await r.json();
              if (!r.ok) throw new Error(data.error);
              store.save(personId, { ...input, result: data });
              setResult(data);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Berechnung fehlgeschlagen.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Geburtsdatum
            <input
              className="w-input"
              required
              name="date"
              type="date"
              defaultValue={saved?.date ?? member?.birthDate}
            />
          </label>
          <label>
            Geburtszeit · optional
            <input
              className="w-input"
              name="time"
              type="time"
              defaultValue={saved?.time ?? member?.birthTime}
            />
          </label>
          <label>
            Geburtsort
            <input
              className="w-input"
              name="city"
              autoComplete="off"
              value={placeQuery}
              onChange={(e) => {
                searchRequest.current?.abort();
                setPlaceBusy(false);
                setError("");
                setPlaceQuery(e.target.value);
                setPlaces([]);
                setResult(null);
                setLocation((l) => ({ ...l, lat: undefined, lng: undefined }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void searchPlaces();
                }
              }}
              placeholder="z. B. Wien"
            />
          </label>
          <button
            type="button"
            className="w-btn"
            disabled={placeBusy || placeQuery.trim().length < 2}
            onClick={searchPlaces}
          >
            {placeBusy ? "Suche …" : "Ort suchen & Koordinaten finden"}
          </button>
          {places.length > 0 && (
            <div
              className="s-wide s-place-results"
              aria-label="Gefundene Geburtsorte"
              aria-live="polite"
            >
              <span>Passenden Ort anklicken</span>
              {places.map((p) => (
                <button
                  type="button"
                  className="w-btn"
                  key={`${p.name}-${p.lat}-${p.lng}`}
                  onClick={() => {
                    setLocation(p);
                    setPlaceQuery(p.name);
                    setPlaces([]);
                  }}
                >
                  <span>
                    {p.name}
                    <small>
                      {p.lat.toFixed(4)}°, {p.lng.toFixed(4)}° · {p.timezone}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
          <label>
            Zeitzone am Geburtsort
            <input
              className="w-input"
              name="timezone"
              required
              value={location.timezone}
              onChange={(e) =>
                setLocation({ ...location, timezone: e.target.value })
              }
            />
          </label>
          <label>
            Breitengrad · automatisch oder manuell
            <input
              className="w-input"
              name="lat"
              type="number"
              step="any"
              min="-89.9"
              max="89.9"
              value={location.lat ?? ""}
              onChange={(e) =>
                setLocation({
                  ...location,
                  lat: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </label>
          <label>
            Längengrad · automatisch oder manuell
            <input
              className="w-input"
              name="lng"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={location.lng ?? ""}
              onChange={(e) =>
                setLocation({
                  ...location,
                  lng: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </label>
          <p className="w-muted s-wide">
            Die Zeitzone berücksichtigt Sommerzeit. Ohne bekannte Uhrzeit:
            Sonnenzeichen als Mittagsnäherung, kein Human-Design-Typ. Die
            Ortssuche läuft in einem lokalen Städteverzeichnis; es werden keine
            Geburtsdaten an Kartendienste gesendet.
          </p>
          <button className="w-btn w-btn-primary" disabled={busy}>
            {busy ? "Wird berechnet …" : "Profil berechnen & speichern"}
          </button>
          {error && (
            <p role="alert" className="w-error">
              {error}
            </p>
          )}
        </form>
      </section>
      {result && (
        <>
          <div className="s-grid">
            {[
              [
                "Westlich",
                `${result.western.icon} ${result.western.name}`,
                `Sonne · ${result.western.element} · Mond: ${result.moon.name}${result.ascendant ? ` · Aszendent: ${result.ascendant.name}` : ""}`,
              ],
              [
                "Vedisch · Lahiri",
                `${result.vedic.icon} ${result.vedic.name}`,
                `Sonne · Mond: ${result.vedicMoon.name}`,
              ],
              [
                "Chinesisch",
                `${result.chinese.icon} ${result.chinese.name}`,
                "Tierzeichen des chinesischen Mondjahres",
              ],
              [
                "Maya · Dreamspell",
                result.maya.name,
                `Ton ${result.maya.tone} · moderne Dreamspell-Tradition`,
              ],
              [
                "Keltischer Baum",
                `♧ ${result.celtic.name}`,
                "Moderner Kalender mit 13 Bäumen",
              ],
              [
                "Human Design",
                result.hd?.type ?? "Geburtszeit fehlt",
                result.hd
                  ? `Profil ${result.hd.profile} · Autorität ${result.hd.authority}`
                  : "Für eine Berechnung bitte die Uhrzeit ergänzen.",
              ],
            ].map(([label, value, detail]) => (
              <section className="w-card s-result" key={label}>
                <span className="w-eyebrow">{label}</span>
                <h2>{value}</h2>
                <p className="w-muted">{detail}</p>
              </section>
            ))}
          </div>
          <p className="w-muted">
            Symbolische Selbstreflexion, keine wissenschaftliche
            Persönlichkeitsdiagnose. Human Design: rechnerische Näherung mit
            free-human-design 1.0.1; Grenzfälle mit einem Referenzchart
            vergleichen. Dreamspell ist nicht der traditionelle Maya-Tzolk’in.
          </p>
        </>
      )}
    </div>
  );
}
