import { requestVpsMagicLink } from '@/lib/fusebase/vps-magic';
import { NextResponse } from 'next/server';
import {
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

    await requestVpsMagicLink(email, body.redirectPath, req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown');

    // Always generic (Gate also avoids enumeration)
    return NextResponse.json({
      success: true,
      ok: true,
      message: 'Wenn diese E-Mail zu deinem NEO-Konto gehört, erhältst du einen Anmeldelink. Bitte prüfe auch den Spam-Ordner. Der Link ist 20 Minuten gültig.',
    });
  } catch (err) {
    if (err instanceof FuseBaseConfigError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/magic-link]', message);
    return NextResponse.json({ success: false, error: 'Der Anmeldelink konnte gerade nicht versendet werden. Bitte versuche es später erneut.' }, { status: 503 });
  }
}
