/**
 * TRINITY OS · GHL Dedicated Catch-All Proxy
 * ────────────────────────────────────────────
 * Routes: GET|POST /api/proxy/ghl/[...path]
 *
 * Forwards all path segments to https://app.gohighlevel.com/[...path]
 * Strips X-Frame-Options, CSP, and frame-busting headers.
 * Rewrites absolute GHL URLs in HTML/JS responses so relative navigation
 * stays inside the proxy (/api/proxy/ghl/...) instead of escaping.
 * Forwards cookies and auth headers so sessions survive inside TRINITY OS.
 */
import { NextRequest, NextResponse } from 'next/server';

const GHL_ORIGIN = 'https://app.gohighlevel.com';

const STRIP_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-content-type-options',
  'strict-transport-security',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
  'clear-site-data',
]);

function buildUpstreamHeaders(req: NextRequest): HeadersInit {
  const h: Record<string, string> = {
    'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    'Cache-Control':   'no-cache',
    'Pragma':          'no-cache',
    'Origin':          GHL_ORIGIN,
    'Referer':         GHL_ORIGIN + '/',
  };
  const cookie = req.headers.get('cookie');
  if (cookie) h['Cookie'] = cookie;
  const auth = req.headers.get('authorization');
  if (auth) h['Authorization'] = auth;
  return h;
}

/**
 * Rewrite all absolute GHL URLs in HTML/JS so navigation stays proxied.
 * https://app.gohighlevel.com/v2/foo  →  /api/proxy/ghl/v2/foo
 */
function rewriteGHLUrls(content: string): string {
  return content.replace(
    /https?:\/\/app\.gohighlevel\.com\/?/g,
    '/api/proxy/ghl/'
  );
}

/**
 * Inject frame-busting neutraliser + base tag into HTML responses.
 */
function injectFrameGuard(html: string, targetUrl: string): string {
  const guardScript = `
<script>
(function(){
  // TRINITY OS · GHL frame guard
  try {
    Object.defineProperty(window,'top',{get:function(){return window;}});
    Object.defineProperty(window,'parent',{get:function(){return window;}});
    Object.defineProperty(window,'self',{get:function(){return window;}});
  } catch(e){}
  // Redirect interceptor: keep navigation inside proxy
  var _pushState = history.pushState.bind(history);
  history.pushState = function(s,t,url){
    if(url && url.toString().startsWith('https://app.gohighlevel.com')){
      url = url.toString().replace('https://app.gohighlevel.com','/api/proxy/ghl');
    }
    return _pushState(s,t,url);
  };
})();
</script>`;

  const baseTag = `<base href="${GHL_ORIGIN}/">`;

  return html
    .replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
    .replace(/<\/head>/i, `${guardScript}</head>`);
}

async function proxyRequest(req: NextRequest, pathSegments: string[], method: string): Promise<NextResponse> {
  const joinedPath = pathSegments.join('/');
  const queryString = req.nextUrl.search; // includes "?" if present
  const targetUrl = `${GHL_ORIGIN}/${joinedPath}${queryString}`;

  const options: RequestInit = {
    method,
    headers: buildUpstreamHeaders(req),
    redirect: 'follow',
  };

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    options.body = await req.text();
    const ct = req.headers.get('content-type');
    if (ct) (options.headers as Record<string,string>)['Content-Type'] = ct;
  }

  const upstream = await fetch(targetUrl, options);
  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

  // Build clean response headers
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', contentType);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('X-Trinity-Proxy', 'ghl-v1');
  responseHeaders.set('X-Proxied-Url', targetUrl);

  // Pass through upstream headers, stripping dangerous ones
  upstream.headers.forEach((value, key) => {
    const lk = key.toLowerCase();
    if (STRIP_HEADERS.has(lk)) return;
    // Rewrite Location redirects to stay inside proxy
    if (lk === 'location') {
      const rewritten = value.replace(/^https?:\/\/app\.gohighlevel\.com\/?/, '/api/proxy/ghl/');
      try { responseHeaders.set('Location', rewritten); } catch {}
      return;
    }
    // Rewrite set-cookie domain so browser accepts it on localhost
    if (lk === 'set-cookie') {
      const rewritten = value
        .replace(/;\s*domain=[^;]+/gi, '; Domain=localhost')
        .replace(/;\s*secure/gi, '');
      try { responseHeaders.append('Set-Cookie', rewritten); } catch {}
      return;
    }
    try { responseHeaders.append(key, value); } catch {}
  });

  const isHtml = contentType.includes('text/html');
  const isJs   = contentType.includes('javascript') || contentType.includes('application/json');

  if (isHtml) {
    let text = await upstream.text();
    text = rewriteGHLUrls(text);
    text = injectFrameGuard(text, targetUrl);
    return new NextResponse(text, { status: upstream.status, headers: responseHeaders });
  }

  if (isJs) {
    let text = await upstream.text();
    text = rewriteGHLUrls(text);
    return new NextResponse(text, { status: upstream.status, headers: responseHeaders });
  }

  // Binary / static assets — stream raw
  const body = await upstream.arrayBuffer();
  return new NextResponse(body, { status: upstream.status, headers: responseHeaders });
}

// ── Route handlers ───────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  try {
    return await proxyRequest(req, path, 'GET');
  } catch (err) {
    return NextResponse.json({ error: `GHL proxy GET failed: ${String(err)}` }, { status: 502 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  try {
    return await proxyRequest(req, path, 'POST');
  } catch (err) {
    return NextResponse.json({ error: `GHL proxy POST failed: ${String(err)}` }, { status: 502 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  try {
    return await proxyRequest(req, path, 'PUT');
  } catch (err) {
    return NextResponse.json({ error: `GHL proxy PUT failed: ${String(err)}` }, { status: 502 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  try {
    return await proxyRequest(req, path, 'PATCH');
  } catch (err) {
    return NextResponse.json({ error: `GHL proxy PATCH failed: ${String(err)}` }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    },
  });
}
