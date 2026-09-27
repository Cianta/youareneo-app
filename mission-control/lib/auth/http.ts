import { NextResponse } from 'next/server';
import { appOrigin, AuthConfigError } from '@/lib/supabase/config';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({ success: false, error: error.message }, error.status);
  if (error instanceof AuthConfigError) return json({ success: false, error: error.message }, 503);
  // Do not return/log SDK errors, which can contain emails, URLs or tokens.
  return json({ success: false, error: 'Die Anfrage konnte nicht verarbeitet werden. Bitte versuche es später erneut.' }, 503);
}
export async function bodyOf(req: Request): Promise<Record<string, unknown>> {
  let body;
  try { body = await req.json(); } catch { throw new HttpError(400, 'Ungültiges JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Ungültiges JSON.');
  return body;
}
export function emailOf(value: unknown) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Eine gültige E-Mail ist erforderlich.');
  return email;
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if ((origin && origin !== appOrigin()) || req.headers.get('sec-fetch-site') === 'cross-site') {
    throw new HttpError(403, 'Diese Anfrage ist nicht erlaubt.');
  }
}
