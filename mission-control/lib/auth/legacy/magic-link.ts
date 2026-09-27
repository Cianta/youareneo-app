import { NextResponse } from 'next/server';
import {
  requestTrinityMagicLink,
  FuseBaseConfigError,
} from '@/lib/fusebase/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body: { email?: string; redirectPath?: string; host?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email.includes('@')) {
      return NextResponse.json({ success: false, error: 'email required' }, { status: 400 });
    }

    await requestTrinityMagicLink({
      email,
      redirectPath: body.redirectPath ?? '/dashboard',
      host: typeof body.host === 'string' ? body.host : undefined,
    });

    // Always generic (Gate also avoids enumeration)
    return NextResponse.json({
      success: true,
      ok: true,
      message: 'If this email has access, a magic link was sent.',
    });
  } catch (err) {
    if (err instanceof FuseBaseConfigError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/magic-link]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
