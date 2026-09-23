'use client';
import { getSupabase } from './supabase';
import { useAuthStore } from './store';

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Tenant Auth: Firmen-Admin & Mitarbeiter
//
// Flows:
//  • registerCompany  → signUp + RPC register_firma  (Aufrufer wird Admin)
//  • registerEmployee → signUp + RPC join_firma       (per Einladungscode)
//  • signIn           → Login + Profil laden → useAuthStore füllen
//
// Falls die E-Mail-Bestätigung im Supabase-Projekt aktiv ist, gibt signUp noch
// keine Session zurück. Die Registrierungsdaten werden dann lokal gemerkt und
// das Profil wird beim ersten erfolgreichen Login automatisch angelegt.
// ─────────────────────────────────────────────────────────────────────────────

export interface SbProfile {
  id: string;
  firma_id: string;
  role: 'admin' | 'mitarbeiter';
  display_name: string;
  avatar: string;
  email: string | null;
}

export interface SbFirma {
  id: string;
  name: string;
  invite_code: string;
}

const PENDING_KEY = 'trinity-sb-pending-registration';

type PendingRegistration =
  | { kind: 'company'; firmaName: string; displayName: string }
  | { kind: 'employee'; inviteCode: string; displayName: string };

function setPending(p: PendingRegistration | null) {
  if (typeof window === 'undefined') return;
  if (p) localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  else localStorage.removeItem(PENDING_KEY);
}

function getPending(): PendingRegistration | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null'); } catch { return null; }
}

/** Profil des eingeloggten Users laden (null = noch kein Profil angelegt). */
export async function fetchProfile(): Promise<SbProfile | null> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.from('profile').select('*').eq('id', user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as SbProfile | null;
}

/** Firma des eingeloggten Users (inkl. Einladungscode — RLS: nur Mitglieder). */
export async function fetchFirma(): Promise<SbFirma | null> {
  const sb = getSupabase();
  const { data, error } = await sb.from('firmen').select('id,name,invite_code').maybeSingle();
  if (error) throw new Error(error.message);
  return data as SbFirma | null;
}

/** Lokale App-Session (useAuthStore) aus dem Supabase-Profil füllen. */
function syncLocalSession(profile: SbProfile) {
  useAuthStore.getState().setUser({
    name: profile.display_name,
    role: profile.role === 'admin' ? 'Firmen-Admin' : 'Mitarbeiter',
    avatar: profile.avatar || '🥷',
  });
}

/** Nach Login/Signup: ggf. ausstehende Registrierung ausführen, Profil laden. */
async function completeSession(): Promise<SbProfile> {
  const sb = getSupabase();
  let profile = await fetchProfile();

  if (!profile) {
    const pending = getPending();
    if (pending?.kind === 'company') {
      const { error } = await sb.rpc('register_firma', { firma_name: pending.firmaName, display_name: pending.displayName });
      if (error) throw new Error(error.message);
    } else if (pending?.kind === 'employee') {
      const { error } = await sb.rpc('join_firma', { code: pending.inviteCode, display_name: pending.displayName });
      if (error) throw new Error(error.message);
    } else {
      throw new Error('Kein Profil gefunden. Bitte registriere dich zuerst (Firma anlegen oder Einladungscode nutzen).');
    }
    profile = await fetchProfile();
    if (!profile) throw new Error('Profil konnte nicht angelegt werden.');
  }

  setPending(null);
  syncLocalSession(profile);
  return profile;
}

export interface AuthResult {
  profile: SbProfile | null;
  /** true → E-Mail-Bestätigung nötig, noch keine Session */
  needsEmailConfirm: boolean;
}

/** Firma registrieren — Aufrufer wird Firmen-Admin. */
export async function registerCompany(opts: {
  email: string; password: string; firmaName: string; displayName: string;
}): Promise<AuthResult> {
  const sb = getSupabase();
  setPending({ kind: 'company', firmaName: opts.firmaName, displayName: opts.displayName });
  const { data, error } = await sb.auth.signUp({ email: opts.email, password: opts.password });
  if (error) { setPending(null); throw new Error(error.message); }
  if (!data.session) return { profile: null, needsEmailConfirm: true };
  return { profile: await completeSession(), needsEmailConfirm: false };
}

/** Als Mitarbeiter per Einladungscode registrieren. */
export async function registerEmployee(opts: {
  email: string; password: string; inviteCode: string; displayName: string;
}): Promise<AuthResult> {
  const sb = getSupabase();
  setPending({ kind: 'employee', inviteCode: opts.inviteCode.trim(), displayName: opts.displayName });
  const { data, error } = await sb.auth.signUp({ email: opts.email, password: opts.password });
  if (error) { setPending(null); throw new Error(error.message); }
  if (!data.session) return { profile: null, needsEmailConfirm: true };
  return { profile: await completeSession(), needsEmailConfirm: false };
}

/** Login mit E-Mail & Passwort. */
export async function signInWithEmail(email: string, password: string): Promise<SbProfile> {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return completeSession();
}

/** Logout (Supabase + lokale Session). */
export async function signOutSupabase(): Promise<void> {
  const sb = getSupabase();
  await sb.auth.signOut();
  useAuthStore.getState().logout();
}

/** Beim App-Start: bestehende Supabase-Session wiederherstellen. */
export async function restoreSession(): Promise<SbProfile | null> {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  try {
    const profile = await fetchProfile();
    if (profile) syncLocalSession(profile);
    return profile;
  } catch { return null; }
}

// ── Notebooks (multi-tenant, RLS-geschützt) ─────────────────────────────────
export interface SbNotebook {
  id: string;
  firma_id: string;
  owner_id: string;
  title: string;
  content: Record<string, unknown>;
  shared: boolean;
  created_at: string;
  updated_at: string;
}

export async function listNotebooks(): Promise<SbNotebook[]> {
  const sb = getSupabase();
  const { data, error } = await sb.from('notebooks').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SbNotebook[];
}

export async function createNotebook(title: string, shared = false): Promise<SbNotebook> {
  const sb = getSupabase();
  const profile = await fetchProfile();
  if (!profile) throw new Error('Kein Profil — bitte einloggen.');
  const { data, error } = await sb.from('notebooks')
    .insert({ title, shared, owner_id: profile.id, firma_id: profile.firma_id })
    .select().single();
  if (error) throw new Error(error.message);
  return data as SbNotebook;
}

export async function updateNotebook(id: string, patch: Partial<Pick<SbNotebook, 'title' | 'content' | 'shared'>>): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('notebooks').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteNotebook(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('notebooks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
