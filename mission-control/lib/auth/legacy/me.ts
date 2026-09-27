import { NextResponse } from 'next/server';
import { readMcSession } from '@/lib/fusebase/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await readMcSession();
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      authenticated: true,
      email: session.email,
      userId: session.userId ?? null,
      exp: session.exp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, authenticated: false, error: message },
      { status: 503 },
    );
  }
}
