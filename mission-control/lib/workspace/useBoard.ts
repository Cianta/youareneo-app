"use client";
import { useCallback, useEffect, useState } from "react";
import { TRINITY_SYNC_EVENT, notifyTrinitySync } from "@/lib/crossPublish";
import {
  BOARD_KEY,
  emptyBoard,
  parseBoard,
  type WorkspaceBoard,
} from "./board";

/** Shares the existing Kanban document, including all metadata and custom columns. */
export function useBoard() {
  const [board, setBoard] = useState(emptyBoard);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const reload = useCallback(() => {
    try {
      setBoard(parseBoard(localStorage.getItem(BOARD_KEY)));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Board nicht verfügbar.");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    reload();
    const storage = (e: StorageEvent) => {
      if (e.key === BOARD_KEY || e.key === null) reload();
    };
    window.addEventListener(TRINITY_SYNC_EVENT, reload);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(TRINITY_SYNC_EVENT, reload);
      window.removeEventListener("storage", storage);
    };
  }, [reload]);
  const change = useCallback(
    (update: (value: WorkspaceBoard) => WorkspaceBoard) => {
      try {
        const next = update(parseBoard(localStorage.getItem(BOARD_KEY)));
        localStorage.setItem(BOARD_KEY, JSON.stringify(next));
        setBoard(next);
        setError("");
        notifyTrinitySync();
        return true;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Speichern fehlgeschlagen. Bitte Speicherplatz prüfen.",
        );
        return false;
      }
    },
    [],
  );
  return { board, ready, error, change };
}
