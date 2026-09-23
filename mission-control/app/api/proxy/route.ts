/**
 * TRINITY OS · Sovereign Iframe Proxy v2
 * ────────────────────────────────────────
 * Strips X-Frame-Options, CSP, and frame-busting headers from upstream
 * responses. Rewrites HTML to inject a <base> tag so relative URLs resolve
 * correctly. Forwards cookies so auth sessions survive inside the OS shell.
 *
 * Usage:  GET  /api/proxy?url=https://mail.google.com
 *         POST /api/proxy?url=https://...  (form submissions)
 * Test:   GET  /api/proxy/test?url=https://mail.google.com
 */
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  // Communication
  'mail.google.com', 'mail.infomaniak.com', 'webmail.youareneo.com',
  // CRM & scheduling
  'app.gohighlevel.com', 'app.lunacal.ai', 'riverside.fm',
  'meet.kde.org', 'kmeet.infomaniak.com', 'gobrunch.com',
  // Productivity
  'trello.com', 'app.ideabuddy.com', 'journalit.app',
  'notebooklm.google.com', 'www.notion.so', 'notion.so',
  // Boards / media
  'miro.com', 'wakelet.com', 'padlet.com', 'presenti.ai', 'gamma.app',
  // Commerce & Marketing
  'app.apollo.io', 'admin.shopify.com', 'app.memberspot.de',
  // AI Studios
  'aistudio.google.com', 'openrouter.ai', 'abacus.ai',
  // Social / messaging
  'web.whatsapp.com', 'web.telegram.org',
  // File transfer
  'wetransfer.com', 'swisstransfer.com',
  // Cloud drives
  'drive.google.com', 'kdrive.infomaniak.com',
  // NOAA / news
  'www.swpc.noaa.gov',
  // Audio / music
  'stitch.withgoogle.com', 'flowmusic.app', 'elevenlabs.io',
  // Publishing
  'postiz.youareneo.com', 'app.postiz.com',
  // Localhost services always allowed
  'localhost', '127.0.0.1',
];

const STRIP_HEADERS = new Set([
  // Security / frame-busting
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-content-type-options',
  'strict-transport-security',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
  // Next.js internal headers — forwarding these causes Next.js to perform
  // internal rewrites/redirects inside the proxy route handler (500 error)
  'x-middleware-rewrite',
  'x-middleware-next',
  'x-middleware-override-headers',
  'x-nextjs-cache',
  'x-nextjs-prerender',
  'x-nextjs-stale-time',
  // Encoding/transfer headers — we rewrite the body so length changes
  'content-length',
  'content-encoding',
  'transfer-encoding',
]);

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_ORIGINS.some(o => hostname === o || hostname.endsWith(`.${o}`));
  } catch { return false; }
}

function buildUpstreamHeaders(req: NextRequest, extra?: Record<string,string>): HeadersInit {
  const h: Record<string, string> = {
    'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    'Cache-Control':   'no-cache',
    'Pragma':          'no-cache',
    ...extra,
  };
  // Forward cookies so sessions survive
  const cookie = req.headers.get('cookie');
  if (cookie) h['Cookie'] = cookie;
  // Forward auth headers if present
  const auth = req.headers.get('authorization');
  if (auth) h['Authorization'] = auth;
  return h;
}

function injectServiceWorker(html: string, targetUrl: string): string {
  const swScript = `
<script>
(function(){
  // TRINITY OS iframe SW registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(){});
  }
  // Neutralise frame-busting JS patterns
  try {
    Object.defineProperty(window, 'top',    { get: function(){ return window; } });
    Object.defineProperty(window, 'parent', { get: function(){ return window; } });
    Object.defineProperty(window, 'self',   { get: function(){ return window; } });
  } catch(e){}
  // Override window.open so popups stay inside the frame
  var _origOpen = window.open;
  window.open = function(url, target, features) {
    if (url && target === '_blank') {
      window.location.href = url;
      return null;
    }
    return _origOpen ? _origOpen.call(window, url, target, features) : null;
  };
  // Force all <a target="_blank"> to load in the same frame — run now + watch DOM
  function fixLinks(root) {
    var anchors = root.querySelectorAll ? root.querySelectorAll('a[target="_blank"], a[target="_top"], a[target="_parent"]') : [];
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].setAttribute('target', '_self');
    }
  }
  fixLinks(document);
  if (window.MutationObserver) {
    var obs = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1) { fixLinks(node); }
        }
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
</script>`;

  const baseTag = `<base href="${targetUrl}">`;

  // Inject <base> after <head> and SW script before </head>
  return html
    .replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
    .replace(/<\/head>/i,      `${swScript}</head>`);
}

async function proxyFetch(req: NextRequest, target: string, method: string): Promise<NextResponse> {
  const upstreamOptions: RequestInit = {
    method,
    headers: buildUpstreamHeaders(req),
    redirect: 'follow',
  };

  if (method === 'POST') {
    const body = await req.text();
    upstreamOptions.body = body;
    const ct = req.headers.get('content-type');
    if (ct) (upstreamOptions.headers as Record<string,string>)['Content-Type'] = ct;
  }

  const upstream = await fetch(target, upstreamOptions);
  const contentType = upstream.headers.get('content-type') ?? 'text/html; charset=utf-8';

  // Build response headers
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', contentType);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('X-Trinity-Proxy', 'v2');

  // Forward upstream headers, skipping blocked ones; set-cookie passthrough
  upstream.headers.forEach((value, key) => {
    const lk = key.toLowerCase();
    if (!STRIP_HEADERS.has(lk)) {
      try { responseHeaders.append(key, value); } catch { /* skip invalid */ }
    }
  });

  // If HTML — inject base tag + SW, otherwise stream raw bytes
  if (contentType.includes('text/html')) {
    const text = await upstream.text();
    const rewritten = injectServiceWorker(text, target);
    return new NextResponse(rewritten, { status: upstream.status, headers: responseHeaders });
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, { status: upstream.status, headers: responseHeaders });
}

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  if (!isAllowed(target)) return NextResponse.json({ error: 'Domain not in proxy allow-list' }, { status: 403 });
  try {
    return await proxyFetch(req, target, 'GET');
  } catch (err) {
    return NextResponse.json({ error: `Proxy fetch failed: ${String(err)}` }, { status: 502 });
  }
}

// ── POST (form submissions inside iframe) ───────────────────────────────────
export async function POST(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  if (!isAllowed(target)) return NextResponse.json({ error: 'Domain not in allow-list' }, { status: 403 });
  try {
    return await proxyFetch(req, target, 'POST');
  } catch (err) {
    return NextResponse.json({ error: `Proxy POST failed: ${String(err)}` }, { status: 502 });
  }
}

// ── OPTIONS (CORS preflight) ────────────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    },
  });
}
