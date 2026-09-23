/**
 * Lightweight Mission Control session cookie after FuseBase Gate login.
 * Does not store raw Gate session ids; uses HMAC-signed payload + APP_SECRET.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const MC_SESSION_COOKIE = 'mc_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export type McSession = {
  email: string;
  userId?: number;
  /** optional FuseBase feature token for Gate-backed calls */
  featureToken?: string;
  exp: number;
};

function secret(): string {
  const s = process.env.APP_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error('APP_SECRET (>=16 chars) required for MC session cookies');
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8');
  return b.toString('base64url');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', secret()).update(payloadB64).digest('base64url');
}

export function encodeSession(session: Omit<McSession, 'exp'> & { exp?: number }): string {
  const body: McSession = {
    email: session.email.trim().toLowerCase(),
    ...(session.userId !== undefined ? { userId: session.userId } : {}),
    ...(session.featureToken ? { featureToken: session.featureToken } : {}),
    exp: session.exp ?? Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const payloadB64 = b64url(JSON.stringify(body));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function decodeSession(token: string | undefined | null): McSession | null {
  if (!token || !token.includes('.')) return null;
  const [payloadB64, sig] = token.split('.', 2);
  if (!payloadB64 || !sig) return null;
  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as McSession;
    if (!body.email || typeof body.exp !== 'number') return null;
    if (body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}

export async function readMcSession(): Promise<McSession | null> {
  const jar = await cookies();
  return decodeSession(jar.get(MC_SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
