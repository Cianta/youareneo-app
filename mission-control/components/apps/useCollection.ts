"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { maySave, type NoteDraft, type SavedNote } from "@/lib/voice/contracts";

class CollectionError extends Error { constructor(message: string, public status: number) { super(message); } }

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, { cache: "no-store", ...init });
  const data = await response.json();
  if (!response.ok) throw new CollectionError(data.error || "Deine Sammlung konnte nicht geladen werden.", response.status);
  return data;
}
export function useCollection(tag: string) {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [config, setConfig] = useState<{ userId: string; canSave: boolean } | null>(null);
  const [loading, setLoading] = useState(true), [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(""), [hasMore, setHasMore] = useState(false);
  const [retryBefore, setRetryBefore] = useState<string | undefined>();
  const request = useRef<{ version: number; abort: AbortController | null }>({ version: 0, abort: null });
  const alive = useRef(false);
  const owner = useRef("");
  const load = useCallback(async (before?: string) => {
    const version = ++request.current.version;
    request.current.abort?.abort();
    const abort = new AbortController(); request.current.abort = abort;
    const current = () => alive.current && version === request.current.version && !abort.signal.aborted;
    setLoading(true); setError(""); setRetryBefore(before);
    try {
      // Reverify the current owner on every reload; never persist another account's list.
      const identity = await api("/api/auth/me", { signal: abort.signal });
      if (!current()) return;
      if (!identity.authenticated || !identity.userId) throw new CollectionError("Bitte melde dich erneut an.",401);
      const changedOwner = !!owner.current && owner.current !== identity.userId;
      if (changedOwner) { setNotes([]); setHasMore(false); setLoaded(false); setRetryBefore(undefined); before = undefined; }
      owner.current = identity.userId;
      setConfig({ userId: identity.userId, canSave: maySave(Array.isArray(identity.products) ? identity.products : []) });
      const params = new URLSearchParams({ tag });
      if (before) params.set("before", before);
      const data = await api("/api/notes?" + params, { signal: abort.signal });
      if (!current()) return;
      if (!Array.isArray(data.notes)) throw Error("Die Sammlung enthält eine ungültige Antwort.");
      setNotes(previous => {
        if (!before) return data.notes;
        const seen = new Set(previous.map(note => note.id));
        return [...previous, ...data.notes.filter((note: SavedNote) => !seen.has(note.id))];
      });
      setHasMore(data.notes.length === 50); setLoaded(true);
    } catch (e) {
      if (current() && e instanceof CollectionError && (e.status === 401 || e.status === 403)) { setNotes([]); setConfig(null); setHasMore(false); setLoaded(false); owner.current = ""; }
      if (current()) setError(e instanceof Error && !(e instanceof TypeError) && !(e instanceof SyntaxError) ? e.message : "Die Verbindung zur Sammlung ist unterbrochen. Bitte versuche es erneut.");
    } finally { if (current()) setLoading(false); }
  }, [tag]);
  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; request.current.version++; request.current.abort?.abort(); }; }, [load]);
  async function save(note: NoteDraft, id: string) {
    const form = new FormData(); form.set("id", id); form.set("note", JSON.stringify(note));
    await api("/api/notes", { method: "POST", body: form });
    if (alive.current) void load();
  }
  return { notes, config, loading, loaded, error, hasMore, load, retry: () => load(retryBefore), save };
}
