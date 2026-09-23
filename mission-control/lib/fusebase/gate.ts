/**
 * FuseBase Gate client for Trinity / Mission Control.
 * Uses @fusebase/fusebase-gate-sdk when available; fails clearly if env is missing.
 */
import {
  createClient,
  PortalsApi,
  FusebaseAuthApi,
  AppMagicLinksApi,
  type Client,
} from '@fusebase/fusebase-gate-sdk';

export class FuseBaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FuseBaseConfigError';
  }
}

export function requireGateEnv(): {
  baseUrl: string;
  token: string;
  orgId: string;
  portalId: string;
} {
  const baseUrl = process.env.FUSEBASE_GATE_URL?.trim();
  const token = process.env.FUSEBASE_TOKEN?.trim();
  const orgId = process.env.FUSEBASE_ORG_ID?.trim();
  const portalId = process.env.FUSEBASE_PORTAL_ID?.trim();

  const missing: string[] = [];
  if (!baseUrl) missing.push('FUSEBASE_GATE_URL');
  if (!token) missing.push('FUSEBASE_TOKEN');
  if (!orgId) missing.push('FUSEBASE_ORG_ID');
  if (!portalId) missing.push('FUSEBASE_PORTAL_ID');

  if (missing.length) {
    throw new FuseBaseConfigError(
      `FuseBase Gate env missing: ${missing.join(', ')}. Set them in Railway (no secrets in git).`,
    );
  }

  return { baseUrl: baseUrl!, token: token!, orgId: orgId!, portalId: portalId! };
}

export function createGateClient(overrides?: { baseUrl?: string; token?: string }): Client {
  const env = (() => {
    try {
      return requireGateEnv();
    } catch (e) {
      if (overrides?.baseUrl && overrides?.token) {
        return {
          baseUrl: overrides.baseUrl,
          token: overrides.token,
          orgId: process.env.FUSEBASE_ORG_ID?.trim() || '',
          portalId: process.env.FUSEBASE_PORTAL_ID?.trim() || '',
        };
      }
      throw e;
    }
  })();

  const baseUrl = overrides?.baseUrl ?? env.baseUrl;
  const token = overrides?.token ?? env.token;

  if (!baseUrl || !token) {
    throw new FuseBaseConfigError('FUSEBASE_GATE_URL and FUSEBASE_TOKEN are required');
  }

  return createClient({
    baseUrl: baseUrl.replace(/\/$/, ''),
    auth: { token },
  });
}

export function portalsApi(client?: Client): PortalsApi {
  return new PortalsApi(client ?? createGateClient());
}

export function authApi(client?: Client): FusebaseAuthApi {
  return new FusebaseAuthApi(client ?? createGateClient());
}

export function magicLinksApi(client?: Client): AppMagicLinksApi {
  return new AppMagicLinksApi(client ?? createGateClient());
}

export type InviteFoerderResult = {
  magicLink: string;
  url: string;
  userId: number;
  email: string;
  orgId: string;
  portalId: string;
  isFullAccess: true;
};

/**
 * Invite Fördermitglied to Freigeist portal with Full access (decided 2026-09-23).
 */
export async function inviteFoerderToPortal(opts: {
  email: string;
  fullName?: string;
}): Promise<InviteFoerderResult> {
  const { orgId, portalId } = requireGateEnv();
  const api = portalsApi();

  const result = await api.inviteToPortal({
    path: { orgId, portalId },
    body: {
      email: opts.email.trim().toLowerCase(),
      ...(opts.fullName?.trim() ? { fullName: opts.fullName.trim() } : {}),
      orgRole: 'client',
      isFullAccess: true,
      workspaceRole: 'editor',
    },
  });

  return {
    magicLink: result.magicLink,
    url: result.url,
    userId: result.userId,
    email: opts.email.trim().toLowerCase(),
    orgId,
    portalId,
    isFullAccess: true,
  };
}
