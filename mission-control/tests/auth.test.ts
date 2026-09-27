import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { provision } from '../lib/auth/provision';
import { cookieOptions, PROJECT_URL, safeRedirect, SESSION_COOKIE } from '../lib/supabase/config';
import { proxy } from '../proxy';

type Row = { user_id: string; product: string; source: string; revoked_at: string | null; granted_at: string };
const userId = randomUUID();
const email = 'member@example.test';
const user = { id: userId, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01' } });

function environment() {
  process.env.AUTH_PROVIDER = 'supabase';
  process.env.SUPABASE_URL = PROJECT_URL;
  process.env.SUPABASE_ANON_KEY = randomUUID();
  process.env.SUPABASE_SERVICE_ROLE_KEY = randomUUID();
  process.env.PROVISION_WEBHOOK_SECRET = randomUUID();
  process.env.AUTH_APP_URL = 'https://trinity.youareneo.com';
}

function provisionRequest(body: unknown, authorized = true) {
  return new Request('https://trinity.youareneo.com/api/provision/member', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorized ? { Authorization: `Bearer ${process.env.PROVISION_WEBHOOK_SECRET}` } : {}) }, body: JSON.stringify(body),
  });
}

test('webhook: silent create, retries, selective revoke, regrant, existing profile and unknown user', async (t) => {
  environment();
  let exists = false, creates = 0;
  const rows: Row[] = [];
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init), url = new URL(request.url);
    calls.push(`${request.method} ${url.pathname}`);
    if (url.pathname === '/auth/v1/admin/users' && request.method === 'GET') return reply({ users: exists ? [user] : [], aud: 'authenticated' });
    if (url.pathname === '/auth/v1/admin/users' && request.method === 'POST') {
      const body = await request.json();
      assert.equal(body.email_confirm, true);
      assert.equal(body.email, email);
      assert.equal(body.password, undefined);
      creates++; exists = true; return reply(user);
    }
    if (url.pathname === '/rest/v1/neo_profiles') {
      assert.match(request.headers.get('prefer') ?? '', /resolution=ignore-duplicates/);
      return new Response(null, { status: 201 });
    }
    if (url.pathname === '/rest/v1/neo_access' && request.method === 'POST') {
      const additions = await request.json();
      for (const addition of additions) {
        const old = rows.find(row => row.product === addition.product);
        if (old) Object.assign(old, addition);
        else rows.push({ granted_at: new Date().toISOString(), ...addition });
      }
      return new Response(null, { status: 201 });
    }
    if (url.pathname === '/rest/v1/neo_access' && request.method === 'PATCH') {
      const patch = await request.json();
      const selected = rows.filter(row => url.searchParams.get('product')?.includes(row.product) && !row.revoked_at);
      for (const row of selected) Object.assign(row, patch);
      return reply(selected.map(row => ({ product: row.product })));
    }
    throw new Error(`Unexpected request: ${request.method} ${url.pathname}`);
  });
  const body = { email: ' MEMBER@example.test ', fullName: 'New name', products: ['foerder', 'archiv', 'foerder'], source: 'memberspot' };
  const first = await provision(provisionRequest(body));
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { success: true, userId, created: true, loginLink: 'https://trinity.youareneo.com/login' });
  const timestamp = rows[0].granted_at;
  const again = await provision(provisionRequest(body));
  assert.equal((await again.json()).created, false);
  assert.equal(creates, 1); assert.equal(rows.length, 2); assert.equal(rows[0].granted_at, timestamp);
  const revoked = await provision(provisionRequest({ email, products: ['foerder'] }), true);
  assert.deepEqual(await revoked.json(), { success: true, userId, revoked: true });
  assert.equal(rows.find(row => row.product === 'archiv')?.revoked_at, null);
  const revokedAt = rows[0].revoked_at;
  assert.equal((await (await provision(provisionRequest({ email, products: ['foerder'] }), true)).json()).revoked, false);
  assert.equal(rows[0].revoked_at, revokedAt);
  await provision(provisionRequest(body)); assert.equal(rows[0].revoked_at, null);
  const missing = await provision(provisionRequest({ email: 'missing@example.test', products: ['foerder'] }), true);
  assert.deepEqual(await missing.json(), { success: true, userId: null, revoked: false });
  assert.ok(calls.every(call => !/invite|generate_link|otp|recover/.test(call)));
  const alias = await provision(provisionRequest({ email }), false, true);
  const aliasBody = await alias.json();
  assert.equal(aliasBody.magicLink, aliasBody.loginLink);
  assert.equal(aliasBody.created, false);
});

test('webhook rejects missing secret, invalid body and empty products before database calls', async (t) => {
  environment();
  t.mock.method(globalThis, 'fetch', () => { throw new Error('No network expected'); });
  assert.equal((await provision(provisionRequest({}, false))).status, 401);
  for (const body of [null, [], { email }, { email, products: [], source: 'manual' }, { email, products: ['foerder'], source: 'BAD SOURCE' }]) {
    assert.equal((await provision(provisionRequest(body))).status, 400);
  }
  delete process.env.PROVISION_WEBHOOK_SECRET;
  assert.equal((await provision(provisionRequest({})) ).status, 503);
});

test('concurrent provisioning resolves duplicate user and does not send a mail', async (t) => {
  environment();
  let lists = 0, creates = 0;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init), path = new URL(req.url).pathname;
    if (path === '/auth/v1/admin/users' && req.method === 'GET') return reply({ users: ++lists > 2 ? [user] : [] });
    if (path === '/auth/v1/admin/users') {
      if (++creates === 1) return reply(user);
      return reply({ code: 'email_exists', msg: 'Already registered' }, 422);
    }
    if (path.startsWith('/rest/v1/')) return new Response(null, { status: 201 });
    throw new Error('Unexpected endpoint');
  });
  const body = { email, products: ['foerder'], source: 'manual' };
  const responses = await Promise.all([provision(provisionRequest(body)), provision(provisionRequest(body))]);
  assert.deepEqual(responses.map(r => r.status), [200, 200]);
  const results = await Promise.all(responses.map(r => r.json()));
  assert.equal(results.filter(r => r.created).length, 1);
  assert.ok(results.every(r => r.userId === userId));
});

function session(expiresAt = Math.floor(Date.now() / 1000) + 3600) {
  const token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt, iat: expiresAt - 3600, role: 'authenticated' })).toString('base64url'), randomUUID()].join('.');
  return { access_token: token, refresh_token: randomUUID(), token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, user };
}

test('SSR chunks shared HttpOnly cookies, second subdomain reads them, refresh and logout preserve domain', async (t) => {
  environment();
  const jar = new Map<string, string>();
  const writes: { name: string; value: string; options: CookieOptions }[] = [];
  const authSession = session();
  authSession.user = { ...user, user_metadata: { data: 'x'.repeat(6000) } };
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init), url = new URL(request.url);
    if (url.pathname.endsWith('/token')) return reply(authSession);
    if (url.pathname.endsWith('/user')) return reply(user);
    if (url.pathname.endsWith('/logout')) return new Response(null, { status: 204 });
    throw new Error('Unexpected request');
  });
  const makeClient = () => createServerClient(PROJECT_URL, process.env.SUPABASE_ANON_KEY!, {
    cookieOptions: cookieOptions(),
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => { for (const cookie of values) { writes.push(cookie); if (cookie.options.maxAge === 0) jar.delete(cookie.name); else jar.set(cookie.name, cookie.value); } } },
  });
  const { error } = await makeClient().auth.signInWithPassword({ email, password: randomUUID() });
  assert.equal(error, null);
  assert.ok(jar.size > 1, 'long sessions are chunked');
  assert.ok(writes.every(c => c.name.startsWith(SESSION_COOKIE) && c.options.domain === '.youareneo.com' && c.options.httpOnly && c.options.secure && c.options.sameSite === 'lax'));
  process.env.AUTH_APP_URL = 'https://archiv.youareneo.com';
  const sibling = makeClient();
  assert.equal((await sibling.auth.getUser()).data.user?.id, userId);
  assert.equal((await sibling.auth.refreshSession()).error, null);
  assert.equal((await sibling.auth.signOut({ scope: 'local' })).error, null);
  assert.equal(jar.size, 0);
  const deletions = writes.filter(c => !c.value);
  assert.ok(deletions.every(c => c.options.maxAge === 0));
  assert.ok(deletions.some(c => c.options.domain === '.youareneo.com'));
  assert.equal(deletions.at(-1)?.options.domain, '.youareneo.com');
  process.env.AUTH_APP_URL = 'https://mission-control-stg.srv1966331.hstgr.cloud';
  assert.equal(cookieOptions().domain, undefined, 'unrelated staging host must use host-only cookies');
});

test('proxy verifies sessions, denies revoked grants and keeps refreshed cookies on redirects', async (t) => {
  environment();
  let allowed = true, refreshes = 0;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(new Request(input, init).url);
    if (url.pathname.endsWith('/token')) { refreshes++; return reply(session()); }
    if (url.pathname.endsWith('/user')) return reply(user);
    if (url.pathname.endsWith('/neo_access')) return reply(allowed ? [{ product: 'foerder' }] : []);
    throw new Error('Unexpected request');
  });
  const value = 'base64-' + Buffer.from(JSON.stringify(session(Math.floor(Date.now() / 1000) - 100))).toString('base64url');
  const request = () => new NextRequest('https://trinity.youareneo.com/dashboard', { headers: { cookie: `${SESSION_COOKIE}=${value}` } });
  const passed = await proxy(request());
  assert.equal(passed.status, 200); assert.ok(refreshes > 0);
  assert.match(passed.headers.get('set-cookie') ?? '', /Domain=.youareneo.com/);
  allowed = false;
  const denied = await proxy(request());
  assert.equal(denied.status, 307); assert.match(denied.headers.get('location') ?? '', /access-denied/);
  assert.match(denied.headers.get('set-cookie') ?? '', /Domain=.youareneo.com/);
  assert.equal((await proxy(new NextRequest('https://trinity.youareneo.com/api/agents'))).status, 401);
});

test('redirects cannot escape to another origin', () => {
  assert.equal(safeRedirect('//evil.test'), '/dashboard');
  assert.equal(safeRedirect('/\\evil.test'), '/dashboard');
  assert.equal(safeRedirect('https://evil.test'), '/dashboard');
  assert.equal(safeRedirect('/dashboard/eden'), '/dashboard/eden');
});
