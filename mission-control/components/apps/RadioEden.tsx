"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { radioPresets, searchStations } from "@/lib/apps/radio";
import { RADIO_TAG, radioNote, savedStation, type Station } from "@/lib/apps/collections";
import { useCollection } from "./useCollection";

export function RadioEden() {
  const collection = useCollection(RADIO_TAG);
  const [q, setQ] = useState(""), [country, setCountry] = useState("");
  const [selection, setSelection] = useState({ query: "", preset: 0, revision: 0 });
  const [stations, setStations] = useState<Station[]>([]), [loading, setLoading] = useState(true), [searchError, setSearchError] = useState("");
  const [current, setCurrent] = useState<Station | null>(null), [playing, setPlaying] = useState(false), [volume, setVolume] = useState(0.6);
  const [audioError, setAudioError] = useState(""), [saving, setSaving] = useState(""), [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const audio = useRef<HTMLAudioElement>(null), serial = useRef(0), mounted = useRef(false);
  const saveIds = useRef(new Map<string, string>());
  const saved = collection.notes.flatMap(note => { const station = savedStation(note); return station ? [station] : []; });
  const savedIds = new Set(saved.map(station => station.id));
  useEffect(() => { mounted.current = true; const player = audio.current; return () => { mounted.current = false; serial.current++; if (player) { player.pause(); player.removeAttribute("src"); player.load(); } }; }, []);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setSearchError(""); setStations([]);
    let active = true;
    void searchStations(selection.query, radioPresets[selection.preset].tags, country, abort.signal)
      .then(data => { if (active && !abort.signal.aborted) setStations(data); })
      .catch(error => { if (active && !abort.signal.aborted) setSearchError(error.message); })
      .finally(() => { if (active && !abort.signal.aborted) setLoading(false); });
    return () => { active = false; abort.abort(); };
  }, [selection, country]);
  async function play(station: Station) {
    const player = audio.current; if (!player) return;
    const version = ++serial.current;
    setCurrent(station); setAudioError(""); setPlaying(false);
    player.src = station.stream;
    try { await player.play(); } catch { if (mounted.current && version === serial.current) setAudioError("Dieser Sender startet gerade nicht. Versuche einen anderen Sender oder starte ihn erneut."); }
  }
  async function toggle() {
    const player = audio.current; if (!player || !current) return;
    if (!player.paused) { player.pause(); return; }
    const version = serial.current;
    setAudioError("");
    try { await player.play(); } catch { if (mounted.current && version === serial.current) setAudioError("Die Wiedergabe konnte nicht starten. Bitte versuche es erneut."); }
  }
  async function remember(station: Station) {
    if (saving || !collection.config?.canSave || savedIds.has(station.id)) return;
    setSaving(station.id); setSaveError(""); setNotice("");
    const id = saveIds.current.get(station.id) || crypto.randomUUID(); saveIds.current.set(station.id, id);
    try { await collection.save(radioNote(station), id); if (mounted.current) setNotice(`${station.name} wurde in deiner Merkliste gespeichert.`); }
    catch (e) { if (mounted.current) setSaveError(e instanceof Error ? e.message : "Der Sender konnte nicht gemerkt werden."); }
    finally { if (mounted.current) setSaving(""); }
  }
  function stationButton(station: Station) {
    return <li key={station.id} className="radio-station">
      <button className="radio-tune" onClick={() => void play(station)} aria-label={`${station.name} abspielen`} aria-pressed={current?.id === station.id}>
        <span className="radio-station-symbol" aria-hidden="true">♫</span><span><strong>{station.name}</strong><small>{[station.country, station.tags.split(",").slice(0,3).join(", ")].filter(Boolean).join(" · ")}</small></span>
      </button>
      <button className="radio-remember" onClick={() => void remember(station)} disabled={!!saving || savedIds.has(station.id) || !collection.config?.canSave} aria-label={`${station.name} ${savedIds.has(station.id) ? "bereits gemerkt" : "merken"}`}>{savedIds.has(station.id) ? "✓" : saving === station.id ? "…" : "+"}</button>
    </li>;
  }
  return <section className="neo-apps radio-room workspace-page">
    <Link className="app-back" href="/dashboard/apps">← Meine Apps</Link>
    <header className="room-heading"><svg className="garden-vines" viewBox="0 0 1000 180" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 170Q170 130 110 15M115 65Q28 13 30 64q29 34 89 31m-4 27q103-90 74-87-49 11-70 66M980 170Q830 130 890 15M885 65q87-52 85-1-29 34-89 31m4 27q-103-90-74-87 49 11 70 66"/></g></svg><p className="app-category">GARAGE · GARTEN · GUTE GESELLSCHAFT</p><h1>Radio Eden</h1><p>Ein Platz am Tresen. Ein Klang, der bleibt.</p></header>
    <div className="radio-cabinet">
      <div className="radio-speaker" aria-hidden="true"><span>EDEN<br/><small>Seit diesem Moment</small></span></div>
      <div className="radio-controls">
        <div className="radio-dial" aria-hidden="true"><span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><span>108</span><i/></div>
        <p className="radio-current" role="status"><span className={playing ? "radio-lamp is-on" : "radio-lamp"} aria-hidden="true"/><strong>{current?.name || "Dein Platz am Radio"}</strong><small>{playing ? "Jetzt läuft" : current ? "Bereit zum Weiterhören" : "Wähle unten einen Sender"}</small></p>
        <div className="radio-knobs"><button className="radio-power" disabled={!current} onClick={() => void toggle()} aria-label={playing ? "Radio pausieren" : "Radio abspielen"}>{playing ? "Ⅱ" : "▶"}</button><label>Lautstärke<input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(Number(e.target.value))}/></label></div>
      </div>
    </div>
    <audio ref={audio} preload="none" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onWaiting={() => setPlaying(false)} onError={() => { setPlaying(false); if (current) setAudioError("Der Stream ist nicht erreichbar. Wähle einen anderen Sender oder starte ihn erneut."); }} />
    {audioError && <p className="room-error" role="alert">{audioError}</p>}
    <form className="room-search" onSubmit={e => { e.preventDefault(); setSelection(s => ({ ...s, query: q.trim().slice(0,100), revision: s.revision + 1 })); }}>
      <label htmlFor="radio-search">Sender oder Stil<input id="radio-search" type="search" value={q} maxLength={100} onChange={e => setQ(e.target.value)} placeholder="Jazz, Soul, Wien …"/></label>
      <label htmlFor="radio-country">Land<select id="radio-country" value={country} onChange={e => setCountry(e.target.value)}><option value="">Alle Länder</option><option value="DE">Deutschland</option><option value="AT">Österreich</option><option value="CH">Schweiz</option><option value="GB">Großbritannien</option><option value="US">USA</option></select></label>
      <button className="room-button">Suchen</button>
    </form>
    <div className="radio-presets" aria-label="Klangwelten">{radioPresets.map((preset,index) => <button key={preset.name} aria-pressed={!selection.query && selection.preset === index} onClick={() => { setQ(""); setSelection(s => ({ query: "", preset: index, revision: s.revision + 1 })); }}>{preset.name}</button>)}</div>
    <section aria-labelledby="radio-results" aria-busy={loading}><h2 id="radio-results">{selection.query ? `Sender für „${selection.query}“` : radioPresets[selection.preset].name}</h2>
      {loading ? <p className="room-state" role="status">Das Radio sucht deine Sender …</p> : searchError ? <div className="room-error" role="alert"><p>{searchError}</p><button className="room-button" onClick={() => setSelection(s => ({ ...s, revision: s.revision + 1 }))}>Erneut suchen</button></div> : stations.length ? <ul className="radio-stations">{stations.map(stationButton)}</ul> : <p className="room-state">Keine passenden HTTPS-Sender gefunden. Probiere einen anderen Stil oder ein anderes Land.</p>}
    </section>
    <section aria-labelledby="radio-saved"><h2 id="radio-saved">Deine Merkliste</h2>
      {collection.error ? <div className="room-error" role="alert"><p>{collection.error}</p><button className="room-button" onClick={() => void collection.retry()}>Merkliste erneut laden</button></div> : collection.loading && !collection.loaded ? <p role="status">Deine Merkliste wird geladen …</p> : collection.loaded && !saved.length ? <p className="room-state">Mit + bleibt ein Sender in deinem Konto – auch für dein nächstes Gerät.</p> : null}
      {!!saved.length && <ul className="radio-stations">{saved.map(stationButton)}</ul>}
      {collection.hasMore && <button className="room-button" disabled={collection.loading} onClick={() => void collection.load(collection.notes.at(-1)?.created_at)}>Weitere gemerkte Sender laden</button>}
      {saveError && <p className="room-error" role="alert">{saveError}</p>}{notice && <p role="status">{notice}</p>}
      {collection.config && !collection.config.canSave && <p className="app-hint">Zum Merken brauchst du einen aktiven Trinity-Zugang.</p>}
    </section>
    <p className="app-hint">Das Radio spielt auf dieser Seite. Senderverzeichnis: Radio Browser; Streams kommen direkt vom jeweiligen Sender. Es startet kein Ton automatisch. Alte Radio-Favoriten sind noch nicht übernommen.</p>
    <a className="app-back" href="https://radio.youareneo.com/" target="_blank" rel="noopener noreferrer">Bisheriges Radio öffnen ↗</a>
  </section>;
}
