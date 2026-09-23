import { NextResponse } from 'next/server';
import {
  activateTrinityMagicLink,
  FuseBaseConfigError,
} from '@/lib/fusebase/auth';
import {
  encodeSession,
  MC_SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/fusebase/session';

export const dynamic = 'force-dynamic';

/**
 * Activate FuseBase app magic link (globalId) and mint MC session cookie.
 * Query: ?globalId=... or body { globalId, email? }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const globalId = url.searchParams.get('globalId')?.trim() || '';
  return activate(globalId, url.searchParams.get('email')?.trim() || undefined);
}

export async function POST(req: Request) {
  let body: { globalId?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  return activate(
    typeof body.globalId === 'string' ? body.globalId.trim() : '',
    typeof body.email === 'string' ? body.email.trim() : undefined,
  );
}

async function activate(globalId: string, emailHint?: string) {
  try {
    if (!globalId) {
      return NextResponse.json({ success: false, error: 'globalId required' }, { status: 400 });
    }

    const result = await activateTrinityMagicLink(globalId);
    const email =
      emailHint?.toLowerCase() ||
      `user+${result.appId || 'fusebase'}@trinity.local`;

    const token = encodeSession({
      email,
      featureToken: result.featureToken || undefined,
    });

    const redirectPath =
      result.redirectPath && result.redirectPath.startsWith('/')
        ? result.redirectPath
        : '/dashboard';

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
