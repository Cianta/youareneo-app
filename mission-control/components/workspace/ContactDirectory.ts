"use client";
import { useCallback, useEffect, useState } from "react";
import { useContacts, type Contact } from "@/lib/workspace/contacts";
export function useContactDirectory() {
  const local = useContacts((s) => s.contacts),
    [remote, setRemote] = useState<Contact[]>([]),
    [userId, setUserId] = useState(""),
    [providers, setProviders] = useState<
      { id: "hubspot" | "ghl"; ready: boolean }[]
    >([]),
    [mailReady, setMailReady] = useState(false),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    window.addEventListener("neo-contacts-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("neo-contacts-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  useEffect(() => {
    const abort = new AbortController();
    setRemote([]);
    setProviders([]);
    setMailReady(false);
    setError("");
    void fetch("/api/crm/contacts", { cache: "no-store", signal: abort.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw Error(
            d.error || "Kontoverbindungen konnten nicht geladen werden.",
          );
        if (!abort.signal.aborted) {
          setUserId(d.userId);
          setRemote(d.contacts ?? []);
          setProviders(d.providers ?? []);
          setMailReady(!!d.mailReady);
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          setUserId("");
          setError(e.message);
        }
      });
    return () => abort.abort();
  }, [revision]);
  return {
    contacts: [...local, ...remote],
    local,
    remote,
    userId,
    providers,
    mailReady,
    error,
    refresh,
  };
}
