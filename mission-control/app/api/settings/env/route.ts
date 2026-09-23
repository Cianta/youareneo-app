import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(process.cwd(), '.env.local');

function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = val;
  }
  return result;
}

function serializeEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

// GET — return current env keys (masked values)
export async function GET() {
  try {
    const raw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
    const parsed = parseEnv(raw);
    // Return keys with masked values for security display
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      masked[k] = v.length > 6 ? v.slice(0, 4) + '••••' + v.slice(-2) : v ? '••••' : '';
    }
    return NextResponse.json({ ok: true, keys: masked });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// POST — merge new key/value pairs into .env.local
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming: Record<string, string> = body.keys ?? {};

    // Read current env
    const raw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
    const current = parseEnv(raw);

    // Merge — skip empty values (don't overwrite with blank)
    for (const [k, v] of Object.entries(incoming)) {
      if (v && v.trim()) current[k] = v.trim();
    }

    fs.writeFileSync(ENV_PATH, serializeEnv(current), 'utf-8');
    return NextResponse.json({ ok: true, updated: Object.keys(incoming).filter(k => incoming[k]) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
