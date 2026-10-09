// YOU ARE NEO · Bibliothek-Server (ebook.youareneo.com)
// Liest dieselbe Supabase-Sitzung wie Trinity (Cookie sb-<ref>-auth-token, Domain .youareneo.com),
// prüft neo_access und gibt Dateien nur als kurzlebige signierte Links frei.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const env = (k, d) => (process.env[k] ?? d ?? '').trim();
const SUPABASE_URL = env('SUPABASE_URL', 'https://emxqoahtipbmumghlixb.supabase.co');
const ANON = env('SUPABASE_ANON_KEY');
const SERVICE = env('SUPABASE_SERVICE_ROLE_KEY');
const COOKIE_DOMAIN = env('COOKIE_DOMAIN', '.youareneo.com'); // leer lassen für lokale Tests
const BUCKET = env('BOOKS_BUCKET', 'books');
const PORT = Number(env('PORT', '3000'));
const LOGIN_HELP_URL = env('LOGIN_HELP_URL', 'https://trinity.youareneo.com/login');
const ROOT = fileURLToPath(new URL('./public/', import.meta.url));
if (!ANON) { console.error('SUPABASE_ANON_KEY fehlt'); process.exit(1); }

const BOOKS = JSON.parse(await readFile(new URL('./books.json', import.meta.url), 'utf8'));
const admin = SERVICE ? createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } }) : null;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function supa(req, res) {
  return createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => parseCookieHeader(req.headers.cookie ?? ''),
      setAll: (list) => {
        const prev = [].concat(res.getHeader('Set-Cookie') || []);
        const next = list.map(({ name, value, options }) => serializeCookieHeader(name, value, {
          ...options, path: '/', sameSite: 'lax', secure: true, httpOnly: true,
          ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
        }));
        res.setHeader('Set-Cookie', [...prev, ...next]);
      },
    },
  });
}

const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((ok, no) => { let d = ''; req.on('data', (c) => { d += c; if (d.length > 1e5) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(d || '{}')); } catch { ok({}); } }); req.on('error', no); });

async function currentUser(sb) {
  const { data, error } = await sb.auth.getUser(); // prüft das Token serverseitig bei Supabase
  return error ? null : data.user;
}
async function activeProducts(sb, userId) {
  const { data } = await sb.from('neo_access').select('product').eq('user_id', userId).is('revoked_at', null);
  return new Set((data || []).map((r) => r.product));
}
const bookOf = (product) => BOOKS.find((b) => b.product === product);

async function api(req, res, url) {
  const sb = supa(req, res);

  if (url.pathname === '/api/login' && req.method === 'POST') {
    const { email, password } = await readBody(req);
    const { error } = await sb.auth.signInWithPassword({ email: String(email || '').trim(), password: String(password || '') });
    return json(res, error ? 401 : 200, { ok: !error });
  }
  if (url.pathname === '/api/logout' && req.method === 'POST') { await sb.auth.signOut(); return json(res, 200, { ok: true }); }

  const user = await currentUser(sb);
  if (url.pathname === '/api/library') {
    if (!user) return json(res, 401, { loginHelpUrl: LOGIN_HELP_URL });
    const owned = await activeProducts(sb, user.id);
    const { data: prog } = await sb.from('book_progress').select('product,kind,position,percent').eq('user_id', user.id);
    return json(res, 200, {
      email: user.email,
      books: BOOKS.map((b) => ({
        product: b.product, kind: b.kind, title: b.title, subtitle: b.subtitle, author: b.author, buy: b.buy,
        owned: owned.has(b.product), hasCover: !!b.cover,
        files: owned.has(b.product) ? (b.kind === 'ebook' ? [b.file] : b.files) : [],
        progress: (prog || []).find((p) => p.product === b.product && p.kind === b.kind) || null,
      })),
    });
  }
  if (url.pathname === '/api/file') {
    if (!user) return json(res, 401, {});
    const product = url.searchParams.get('product') || '';
    const file = url.searchParams.get('file') || '';
    const b = bookOf(product);
    const allowed = b && [b.file, b.cover, ...(b.files || [])].filter(Boolean).includes(file);
    if (!allowed) return json(res, 404, {});
    if (!(await activeProducts(sb, user.id)).has(product)) return json(res, 403, {});
    if (!admin) return json(res, 500, { error: 'SUPABASE_SERVICE_ROLE_KEY fehlt' });
    const dl = url.searchParams.get('dl') === '1';
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(`${product}/${file}`, 600, dl ? { download: file } : undefined);
    if (error) return json(res, 404, {});
    res.writeHead(302, { Location: data.signedUrl, 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (url.pathname === '/api/progress' && req.method === 'POST') {
    if (!user) return json(res, 401, {});
    const b = await readBody(req);
    const bk = bookOf(b.product);
    if (!bk || bk.kind !== b.kind) return json(res, 400, {});
    if (!(await activeProducts(sb, user.id)).has(b.product)) return json(res, 403, {});
    const { error } = await sb.from('book_progress').upsert({
      user_id: user.id, product: b.product, kind: b.kind, position: String(b.position ?? '').slice(0, 500),
      percent: Math.max(0, Math.min(100, Number(b.percent) || 0)), updated_at: new Date().toISOString(),
    });
    return json(res, error ? 500 : 200, { ok: !error });
  }
  return json(res, 404, {});
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/healthz') return json(res, 200, { ok: true });
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    let p = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
    if (p === '/' || p === '') p = '/index.html';
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache',
      // Einbetten nur auf eigenen Seiten (Memberspot / youareneo.com)
      'Content-Security-Policy-Report-Only': "frame-ancestors 'self' https://*.youareneo.com https://*.memberspot.de https://*.mspot.de" });
    res.end(body);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EISDIR') { res.writeHead(404); return res.end('Nicht gefunden'); }
    console.error(e); res.writeHead(500); res.end('Fehler');
  }
}).listen(PORT, () => console.log(`ebook läuft auf :${PORT}`));
