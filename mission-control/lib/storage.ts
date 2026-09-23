'use client';
import { getSupabase, supabaseConfigured } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Datei-Uploads in den Supabase-Storage-Bucket "media".
// Dateien (Meditationsmusik, Videos, Bilder) liegen damit dauerhaft in der
// Cloud und überleben Browser-Reset, Gerätewechsel und localStorage-Limits.
// Fallback: Gibt null zurück, wenn Supabase nicht konfiguriert ist oder der
// Upload fehlschlägt — die Aufrufer nutzen dann weiter die lokale DataURL.
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET = 'media';

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 80);
}

/** Datei hochladen → dauerhafte öffentliche URL (oder null bei Fehler). */
export async function uploadToStorage(file: File | Blob, folder: string): Promise<string | null> {
  if (!supabaseConfigured()) return null;
  try {
    const sb = getSupabase();
    const base = file instanceof File ? safeName(file.name) : 'blob';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${base}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) return null;
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch {
    return null;
  }
}

/** Datei anhand ihrer öffentlichen URL wieder löschen (best effort). */
export async function deleteFromStorage(publicUrl: string): Promise<void> {
  if (!supabaseConfigured()) return;
  try {
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(publicUrl.slice(idx + marker.length));
    await getSupabase().storage.from(BUCKET).remove([path]);
  } catch { /* best effort */ }
}
