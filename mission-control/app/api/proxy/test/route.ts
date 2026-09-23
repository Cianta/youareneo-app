/**
 * TRINITY OS · Proxy Integration Test
 * GET /api/proxy/test?url=https://...
 * Returns whether a URL can be framed directly, via proxy, or requires tunnel.
 */
import { NextRequest, NextResponse } from 'next/server';

type Frameability = 'direct' | 'proxy' | 'tunnel' | 'blocked';

interface TestResult {
  url: string;
  frameable: Frameability;
  xFrameOptions: string | null;
  csp: string | null;
  status: number;
  latencyMs: number;
  recommendation: string;
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const start = Date.now();
  try {
    const res = await fetch(target, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrinityOS/2.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    const xfo  = res.headers.get('x-frame-options');
    const csp  = res.headers.get('content-security-policy');
    const latencyMs = Date.now() - start;

    let frameable: Frameability = 'direct';
    let recommendation = 'Embed directly — no frame restrictions detected.';

    if (xfo || (csp && csp.includes('frame-ancestors'))) {
      frameable = 'proxy';
      recommendation = 'Use TRINITY proxy (/api/proxy?url=...) — frame restrictions detected and will be stripped.';
    }

    // Domains known to break even with proxy (heavy SPA + CORS auth)
    const hardBlocked = ['google.com/mail', 'accounts.google.com', 'workspace.google.com'];
    if (hardBlocked.some(d => target.includes(d))) {
      frameable = 'tunnel';
      recommendation = 'Use fetch-tunnel — Google Workspace requires OAuth token relay. Use the open-in-tab button.';
    }

    const result: TestResult = {
      url: target,
      frameable,
      xFrameOptions: xfo,
      csp: csp ? csp.slice(0, 120) + (csp.length > 120 ? '…' : '') : null,
      status: res.status,
      latencyMs,
      recommendation,
    };

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      result: {
        url: target,
        frameable: 'tunnel' as Frameability,
        xFrameOptions: null,
        csp: null,
        status: 0,
        latencyMs: Date.now() - start,
        recommendation: `Fetch failed (${String(err)}) — domain may be unreachable or blocking all automated requests.`,
      },
    });
  }
}
