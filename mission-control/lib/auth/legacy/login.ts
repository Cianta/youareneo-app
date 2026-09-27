import { NextResponse } from 'next/server';
import {
  loginTrinityUser,
  FuseBaseConfigError,
} from '@/lib/fusebase/auth';
import {
  encodeSession,
  MC_SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/fusebase/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body: { email?: string; password?: string; redirectPath?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email.includes('@') || !password) {
      return NextResponse.json(
        { success: false, error: 'email and password required' },
        { status: 400 },
      );
    }

    const result = await loginTrinityUser({
      email,
      password,
      redirectPath: body.redirectPath ?? '/dashboard',
    });

    if (result.status === 'challenge_required') {
      return NextResponse.json(
        {
          success: false,
          error: 'challenge_required',
          challenge: result.challenge ?? null,
          hint: 'Complete Gate challenge then retry (not yet wired in UI)',
        },
        { status: 401 },
      );
    }

    if (result.status !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 401 },
      );
    }

    const token = encodeSession({
      email,
      userId: result.session?.userId,
    });

    const res = NextResponse.json({
      success: true,
      email: email.toLowerCase(),
      userId: result.session?.userId ?? null,
      redirectPath: result.redirectPath || '/dashboard',
      // appAuth handoff available for FuseBase-hosted apps; MC uses own cookie
      hasAppAuth: Boolean(result.appAuth),
    });
    res.cookies.set(MC_SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    if (err instanceof FuseBaseConfigError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    const status =
      lower.includes('unauthorized') ||
      lower.includes('invalid') ||
      lower.includes('credential')
        ? 401
        : 500;
    console.error('[auth/login]', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
