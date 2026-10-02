"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RECIPE_TAG, recipeNote } from "@/lib/apps/collections";
import { useCollection } from "./useCollection";

export function Cookbook() {
  const collection = useCollection(RECIPE_TAG);
  const [q, setQ] = useState(""), [seasonFilter, setSeasonFilter] = useState("");
  const [title, setTitle] = useState(""), [ingredients, setIngredients] = useState(""), [method, setMethod] = useState(""), [season, setSeason] = useState("Ganzjährig");
  const [saving, setSaving] = useState(false), [saveError, setSaveError] = useState(""), [notice, setNotice] = useState("");
  const lastSubmission = useRef<{ serialized: string; id: string } | null>(null);
  const mounted = useRef(false);
  useEffect(() => { lastSubmission.current = null; }, [collection.config?.userId]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const dirty = !!(title || ingredients || method);
  useEffect(() => { if (!dirty) return; const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener("beforeunload",guard); return () => window.removeEventListener("beforeunload",guard); }, [dirty]);
  const matches = collection.notes.filter(note => {
    const term = q.trim().toLocaleLowerCase("de");
    return (!term || `${note.title} ${note.transcript}`.toLocaleLowerCase("de").includes(term)) && (!seasonFilter || note.tags.includes(seasonFilter.toLowerCase()));
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (saving || !collection.config?.canSave) return;
    const note = recipeNote(title,ingredients,method,season);
    const serialized = JSON.stringify(note);
    const id = lastSubmission.current?.serialized === serialized ? lastSubmission.current.id : crypto.randomUUID();
    lastSubmission.current = { serialized,id };
    setSaving(true); setSaveError(""); setNotice("");
    try {
      await collection.save(note,id);
      if (!mounted.current) return;
      setTitle(""); setIngredients(""); setMethod(""); setSeason("Ganzjährig"); lastSubmission.current = null;
      setNotice("Dein Rezept liegt jetzt in deinem Küchenschatzbuch und in deinen Trinity-Notizen.");
    } catch (error) { if (mounted.current) setSaveError(error instanceof Error ? error.message : "Dein Rezept konnte nicht gespeichert werden. Dein Entwurf bleibt hier."); }
    finally { if (mounted.current) setSaving(false); }
  }
  return <section className="neo-apps cookbook-room workspace-page">
    <Link href="/dashboard/apps" className="app-back">← Meine Apps</Link>
    <header className="book-cover"><div className="book-ornament" aria-hidden="true">❧</div><p className="app-category">AUS DEINER KÜCHE · FÜR DEIN LEBEN</p><h1>Das Küchen<br/>schatzbuch</h1><p>Rezepte, Erinnerungen und ein Hauch Gartenglück.</p><div className="book-ornament" aria-hidden="true">❧</div></header>
    <div className="book-pages">
      <section className="book-page" aria-labelledby="recipe-library"><p className="book-chapter">I · Die Sammlung</p><h2 id="recipe-library">Deine Fundstücke</h2>
        <label htmlFor="recipe-search">Im geladenen Buch suchen<input id="recipe-search" type="search" maxLength={100} value={q} onChange={e => setQ(e.target.value)} placeholder="Rezept oder Zutat …"/></label>
        <label htmlFor="recipe-season-filter">Jahreszeit<select id="recipe-season-filter" value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}><option value="">Alle Jahreszeiten</option>{["Frühling","Sommer","Herbst","Winter","Ganzjährig"].map(s => <option key={s}>{s}</option>)}</select></label>
        <div aria-busy={collection.loading}>
          {collection.error ? <div className="room-error" role="alert"><p>{collection.error}</p><button className="room-button" onClick={() => void collection.retry()}>Buch erneut öffnen</button></div> : collection.loading && !collection.loaded ? <p className="room-state" role="status">Dein Buch wird geöffnet …</p> : collection.loaded && !matches.length ? <div className="room-state"><p>{q || seasonFilter ? "Kein passendes Rezept in den bisher geladenen Seiten." : "Die erste Seite wartet auf dein Rezept."}</p>{(q || seasonFilter) ? <button className="room-button" onClick={() => { setQ(""); setSeasonFilter(""); }}>Filter zurücksetzen</button> : <a className="room-button" href="#recipe-title">Ein Rezept eintragen</a>}</div> : null}
          {matches.map(note => <details key={note.id} className="recipe-entry"><summary>{note.title}</summary><p className="recipe-text">{note.transcript}</p><Link href={`/notiz?note=${encodeURIComponent(note.id)}`} prefetch={false}>Als Trinity-Notiz öffnen →</Link></details>)}
          {collection.hasMore && <button className="room-button" disabled={collection.loading} onClick={() => void collection.load(collection.notes.at(-1)?.created_at)}>{collection.loading ? "Seiten werden geladen …" : "Weitere Buchseiten laden"}</button>}
        </div>
        <p className="book-small">Nur deine eigenen Rezepte. Bestehende Kochbuch-Sammlungen wurden noch nicht übernommen.</p>
      </section>
      <section className="book-page" aria-labelledby="recipe-new"><p className="book-chapter">II · Eine neue Seite</p><h2 id="recipe-new">Was kochen wir?</h2>
        <form onSubmit={e => void submit(e)}>
          <fieldset disabled={saving}>
            <label htmlFor="recipe-title">Name des Rezepts<input id="recipe-title" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} placeholder="Omas Kürbissuppe …"/></label>
            <label htmlFor="recipe-season">Jahreszeit<select id="recipe-season" value={season} onChange={e => setSeason(e.target.value)}>{["Ganzjährig","Frühling","Sommer","Herbst","Winter"].map(s => <option key={s}>{s}</option>)}</select></label>
            <label htmlFor="recipe-ingredients">Zutaten<textarea id="recipe-ingredients" required maxLength={8000} rows={5} value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="Zutaten, Mengen und Portionen …"/></label>
            <label htmlFor="recipe-method">Zubereitung & kleine Geheimnisse<textarea id="recipe-method" required maxLength={10000} rows={7} value={method} onChange={e => setMethod(e.target.value)} placeholder="So geht es – Schritt für Schritt …"/></label>
            <button className="room-button" disabled={!collection.config?.canSave || !title.trim() || !ingredients.trim() || !method.trim()}>{saving ? "Dein Rezept wird eingelegt …" : "In meinem Buch speichern"}</button>
          </fieldset>
        </form>
        {saveError && <p className="room-error" role="alert">{saveError}</p>}{notice && <p role="status">{notice}</p>}
        {collection.config && !collection.config.canSave && <p className="book-small">Zum Speichern brauchst du einen aktiven Trinity-Zugang. Du kannst deinen Entwurf hier schreiben.</p>}
        <p className="book-small">Ein Rezept wird erst gespeichert, wenn du den Knopf drückst. Es nutzt dieselbe Anmeldung und dieselbe private Suche wie deine Notizen.</p>
      </section>
    </div>
  </section>;
}
