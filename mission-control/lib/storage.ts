'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Media uploads — FuseBase Isolated Store stub (no Supabase).
// Callers already fall back to local DataURL when null is returned.
// Future: wire to FuseBase Isolated Store `mission-control` when ready.
// ─────────────────────────────────────────────────────────────────────────────

/** Upload stub: always null → callers keep local DataURL. */
export async function uploadToStorage(
  _file: File | Blob,
  _folder: string,
): Promise<string | null> {
  return null;
}

/** Delete stub: no-op (no cloud object to remove). */
export async function deleteFromStorage(_publicUrl: string): Promise<void> {
  /* no-op */
}
