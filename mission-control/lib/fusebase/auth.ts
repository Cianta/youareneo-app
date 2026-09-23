/**
 * Minimal Trinity Gate auth helpers (login + app magic link).
 */
import { authApi, magicLinksApi, FuseBaseConfigError } from './gate';

export { FuseBaseConfigError };

export async function loginTrinityUser(opts: {
  email: string;
  password: string;
  redirectPath?: string | null;
}) {
  const api = authApi();
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
  host?: string;
}) {
  const host =
    opts.host?.trim() ||
    process.env.FUSEBASE_APP_HOST?.trim() ||
    '';

  if (!host) {
    throw new FuseBaseConfigError(
      'FUSEBASE_APP_HOST (or host arg) required for requestTrinityMagicLink',
    );
  }

  const api = magicLinksApi();
  return api.requestAppMagicLink({
    path: { host: host.replace(/^https?:\/\//, '').replace(/\/$/, '') },
    body: {
      email: opts.email.trim().toLowerCase(),
      ...(opts.redirectPath !== undefined ? { redirectPath: opts.redirectPath } : {}),
    },
  });
}

export async function activateTrinityMagicLink(globalId: string) {
  const api = magicLinksApi();
  return api.activateAppMagicLink({ path: { globalId } });
}
