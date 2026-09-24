import { NextResponse } from 'next/server';
import {
  requestTrinityPasswordRestore,
  FuseBaseConfigError,
} from '@/lib/fusebase/auth';

export const dynamic = 'force-dynamic';

/**
 * Visitor-safe password restore via FuseBase Gate
 * (`requestFusebasePasswordRestore` → platform mail with reset link).
 */
export async function POST(req: Request) {
  try {
    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email.includes('@')) {
      return NextResponse.json({ success: false, error: 'email required' }, { status: 400 });
    }

    await requestTrinityPasswordRestore({ email });

    return NextResponse.json({
      success: true,
      ok: true,
      message:
        'Falls ein Konto mit dieser E-Mail existiert, erhältst du eine Nachricht zum Zurücksetzen des Passworts.',
    });
  } catch (err) {
    if (err instanceof FuseBaseConfigError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/password-restore]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
