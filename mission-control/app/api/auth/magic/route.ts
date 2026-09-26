import { activateVpsMagicLink } from '@/lib/fusebase/vps-magic';
import { NextResponse } from 'next/server';
import {
  activateTrinityMagicLink,
  FuseBaseConfigError,
  safeAuthRedirect,
} from '@/lib/fusebase/auth';
import {
  encodeSession,
  MC_SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/fusebase/session';

export const dynamic = 'force-dynamic';

/**
 * Activate FuseBase app magic link (globalId) and mint MC session cookie.
 * Query: ?globalId=... or body { globalId }. Identity comes only from FuseBase.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const globalId = url.searchParams.get('globalId')?.trim() || '';
  return activate(globalId);
}

export async function POST(req: Request) {
  let body: { globalId?: string; token?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  if (typeof body.token === 'string') {
    try {
      const identity = await activateVpsMagicLink(body.token);
      if (!identity) return NextResponse.json({ success: false, error: 'Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen an.' }, { status: 401 });
      const res = NextResponse.json({ success: true, redirectPath: identity.redirectPath });
      res.cookies.set(MC_SESSION_COOKIE, encodeSession({ email: identity.email, userId: identity.userId }), sessionCookieOptions());
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } catch {
      return NextResponse.json({ success: false, error: 'Die Anmeldung ist gerade nicht möglich. Bitte fordere einen neuen Link an.' }, { status: 503 });
    }
  }
  return activate(
    typeof body.globalId === 'string' ? body.globalId.trim() : '',
  );
}

async function activate(globalId: string) {
  try {
    if (!globalId) {
      return NextResponse.json({ success: false, error: 'globalId required' }, { status: 400 });
    }

    const result = await activateTrinityMagicLink(globalId);
    const email = result.user.email!.toLowerCase();

    const token = encodeSession({
      email,
      userId: result.user.id,
      featureToken: result.featureToken || undefined,
    });

    const redirectPath = safeAuthRedirect(result.redirectPath);

    const res = NextResponse.json({
      success: true,
      redirectPath,
      appId: result.appId,
    });
    res.cookies.set(MC_SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    if (err instanceof FuseBaseConfigError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/magic]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
