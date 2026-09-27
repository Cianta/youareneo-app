import { NextResponse } from 'next/server';
import {
  inviteFoerderToPortal,
  FuseBaseConfigError,
} from '@/lib/fusebase/gate';

export const dynamic = 'force-dynamic';

function unauthorized(msg = 'Unauthorized') {
  return NextResponse.json({ success: false, error: msg }, { status: 401 });
}

function checkSecret(req: Request): boolean {
  const expected = process.env.PROVISION_WEBHOOK_SECRET?.trim();
  if (!expected) return false;

  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : '';
  const headerSecret =
    req.headers.get('x-provision-secret')?.trim() ||
    req.headers.get('x-webhook-secret')?.trim() ||
    '';

  return bearer === expected || headerSecret === expected;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Provision-Secret,X-Webhook-Secret',
    },
  });
}

/**
 * POST /api/provision/foerder
 * Make.com webhook: provision Fördermitglied via FuseBase inviteToPortal (Full access).
 * Auth: Authorization: Bearer <PROVISION_WEBHOOK_SECRET> or X-Provision-Secret header.
 * Body: { email: string, fullName?: string }
 */
export async function POST(req: Request) {
  try {
    if (!process.env.PROVISION_WEBHOOK_SECRET?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'PROVISION_WEBHOOK_SECRET not configured on Mission Control',
        },
        { status: 503 },
      );
    }

    if (!checkSecret(req)) {
      return unauthorized('Invalid provision webhook secret');
    }

    let body: { email?: string; fullName?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'email required' },
        { status: 400 },
      );
    }

    const fullName =
      typeof body.fullName === 'string' && body.fullName.trim()
        ? body.fullName.trim()
        : undefined;

    const result = await inviteFoerderToPortal({ email, fullName });

    return NextResponse.json({
      success: true,
      magicLink: result.magicLink,
      url: result.url,
      userId: result.userId,
      email: result.email,
      orgId: result.orgId,
      portalId: result.portalId,
      isFullAccess: true,
      orgRole: 'client',
      workspaceRole: 'editor',
    });
  } catch (err) {
    if (err instanceof FuseBaseConfigError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 503 },
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    const status =
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as { status: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 500;

    // Idempotent-ish: already invited/member — still useful for Make
    const lower = message.toLowerCase();
    if (
      status === 409 ||
      lower.includes('already') ||
      lower.includes('exists') ||
      lower.includes('member')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: 'already_member_or_invited',
          hint: 'Do not hard-fail in Make; optionally re-request magic link or tag HubSpot',
        },
        { status: 409 },
      );
    }

    console.error('[provision/foerder]', err);
    return NextResponse.json(
      { success: false, error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
