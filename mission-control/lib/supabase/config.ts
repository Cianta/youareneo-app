export const PROJECT_URL = 'https://emxqoahtipbmumghlixb.supabase.co';
export const SESSION_COOKIE = 'sb-emxqoahtipbmumghlixb-auth-token';

export class AuthConfigError extends Error {}

export function usesSupabase() {
  return process.env.AUTH_PROVIDER !== 'fusebase';
}

export function publicConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (url !== PROJECT_URL || !key) {
    throw new AuthConfigError('Supabase Auth ist noch nicht konfiguriert.');
  }
  return { url, key };
}

export function appOrigin() {
  const value = process.env.AUTH_APP_URL?.trim();
  if (!value) throw new AuthConfigError('AUTH_APP_URL ist noch nicht konfiguriert.');
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new AuthConfigError('AUTH_APP_URL muss eine sichere App-Origin sein.');
  }
  return url.origin;
}

export function cookieOptions() {
  const url = new URL(appOrigin());
  const shared = url.hostname === 'youareneo.com' || url.hostname.endsWith('.youareneo.com');
  return {
    name: SESSION_COOKIE,
    ...(shared ? { domain: '.youareneo.com' } : {}),
    path: '/', sameSite: 'lax' as const, secure: url.protocol === 'https:', httpOnly: true,
  };
}

export function safeRedirect(value: unknown, fallback = '/dashboard') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return fallback;
  return value;
}
