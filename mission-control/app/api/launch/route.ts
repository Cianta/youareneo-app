/**
 * /api/launch — Opens a local program on the host machine (macOS `open`).
 * The Next.js dev server runs locally on the user's Mac, so this lets
 * launcher cards of kind "program" actually start desktop applications.
 *
 * Safety: only absolute paths that exist on disk are accepted; the path is
 * passed as an argument (no shell interpolation).
 */
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json() as { path?: string };
    if (!path || !path.startsWith('/')) {
      return NextResponse.json({ error: 'Absoluter Pfad erforderlich (z.B. /Applications/Figma.app)' }, { status: 400 });
    }
    if (!existsSync(path)) {
      return NextResponse.json({ error: `Pfad nicht gefunden: ${path}` }, { status: 404 });
    }
    await new Promise<void>((resolve, reject) => {
      execFile('open', [path], (err) => err ? reject(err) : resolve());
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
