/**
 * Minimal Trinity Gate auth helpers (login + magic link + password restore).
 */
import { createClient, FusebaseAuthApi, AppMagicLinksApi, AccessApi } from '@fusebase/fusebase-gate-sdk';
import { FuseBaseConfigError } from './gate';

export { FuseBaseConfigError };

// These visitor operations must not inherit the administrative service token.
// Gate rejects token subjects on magic-link requests/activation with HTTP 403.
function visitorClient() {
  const baseUrl = process.env.FUSEBASE_GATE_URL?.trim();
  if (!baseUrl) throw new FuseBaseConfigError('FUSEBASE_GATE_URL is required');
  return createClient({ baseUrl: baseUrl.replace(/\/$/, ''), credentials: 'omit' });
}

export function safeAuthRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') &&
    !value.startsWith('//') && !/[\\\x00-\x20]/.test(value) ? value : '/dashboard';
}

export async function loginTrinityUser(opts: {
  email: string;
  password: string;
  redirectPath?: string | null;
}) {
  const api = new FusebaseAuthApi(visitorClient());
  return api.loginFusebaseUser({
    body: {
      email: opts.email.trim().toLowerCase(),
      password: opts.password,
      ...(opts.redirectPath !== undefined ? { redirectPath: opts.redirectPath } : {}),
    },
  });
}

/**
 * Request app magic link for Trinity host.
 * Uses FUSEBASE_APP_HOST (hostname only, no scheme).
 */
export async function requestTrinityMagicLink(opts: {
  email: string;
  redirectPath?: string | null;
}) {
  const host =
    process.env.FUSEBASE_APP_HOST?.trim() ||
    '';

  if (!host) {
    throw new FuseBaseConfigError(
      'FUSEBASE_APP_HOST required for requestTrinityMagicLink',
    );
  }

  const api = new AppMagicLinksApi(visitorClient());
  return api.requestAppMagicLink({
    path: { host: host.replace(/^https?:\/\//, '').replace(/\/$/, '') },
    body: {
      email: opts.email.trim().toLowerCase(),
      redirectPath: safeAuthRedirect(opts.redirectPath),
    },
  });
}

export async function activateTrinityMagicLink(globalId: string) {
  const api = new AppMagicLinksApi(visitorClient());
  const result = await api.activateAppMagicLink({ path: { globalId } });
  const orgId = process.env.FUSEBASE_ORG_ID?.trim();
  if (!orgId || !result.featureToken) throw new Error('Die Anmeldung konnte nicht bestätigt werden. Bitte fordere einen neuen Link an.');
  const access = await new AccessApi(createClient({
    baseUrl: process.env.FUSEBASE_GATE_URL!.trim().replace(/\/$/, ''),
    auth: { token: result.featureToken },
  })).getMyOrgAccess({ path: { orgId } });
  if (!access.hasOrgAccess || !access.user.email || !access.user.id) {
    throw new Error('Dieses Konto hat derzeit keinen Zugriff auf Trinity.');
  }
  return { ...result, user: access.user };
}

/**
 * Request FuseBase platform password-restore email (visitor-safe).
 * Gate always returns { ok: true }; platform mails the reset link.
 */
export async function requestTrinityPasswordRestore(opts: { email: string }) {
  const api = new FusebaseAuthApi(visitorClient());
  return api.requestFusebasePasswordRestore({
    body: {
      email: opts.email.trim().toLowerCase(),
    },
  });
}
