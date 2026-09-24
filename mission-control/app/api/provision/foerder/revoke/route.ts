import { NextResponse } from 'next/server';
import {
  revokeFoerderFromPortal,
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
 * POST /api/provision/foerder/revoke
 * Make.com webhook: revoke Fördermitglied FuseBase portal access.
 * Auth: Authorization: Bearer <PROVISION_WEBHOOK_SECRET> or X-Provision-Secret.
 * Body: { email: string }
 * Idempotent: unknown email → 200 { success:true, removed:false, noopReason:'not_found' }
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

    let body: { email?: string };
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

    const result = await revokeFoerderFromPortal({ email });

    return NextResponse.json({
      success: true,
      removed: result.removed,
      noopReason: result.noopReason,
      email: result.email,
      userId: result.userId,
      orgId: result.orgId,
      portalId: result.portalId,
      workspaceId: result.workspaceId,
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

    // Treat already-removed / not-found style errors as idempotent success
    const lower = message.toLowerCase();
    if (
      status === 404 ||
      lower.includes('not found') ||
      lower.includes('does not exist') ||
      lower.includes('no such')
    ) {
      return NextResponse.json({
        success: true,
        removed: false,
        noopReason: 'not_found',
        error: message,
      });
    }

    console.error('[provision/foerder/revoke]', err);
    return NextResponse.json(
      { success: false, error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
