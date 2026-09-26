import test from 'node:test';
import assert from 'node:assert/strict';
import { loginTrinityUser, requestTrinityMagicLink, requestTrinityPasswordRestore, activateTrinityMagicLink, safeAuthRedirect } from '../lib/fusebase/auth';

test('visitor auth never sends service credentials; activation uses verified user identity', async () => {
  process.env.FUSEBASE_GATE_URL = 'https://gate.example/v1';
  process.env.FUSEBASE_APP_HOST = 'trinity.example';
  process.env.FUSEBASE_TOKEN = 'admin-must-not-be-sent';
  process.env.FUSEBASE_ORG_ID = 'neo';
  let allowAccess = true;
  const calls: { url: string; init: RequestInit }[] = [];
  const previous = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init: RequestInit = {}) => {
    if (url instanceof Request) { init = { headers: url.headers, body: await url.text() }; url = url.url; }
    calls.push({ url: String(url), init });
    const body = String(url).endsWith('/me/access')
      ? { hasOrgAccess: allowAccess, user: { id: 42, email: 'member@example.com' } }
      : String(url).includes('/activate')
        ? { featureToken: 'verified-user-token', appId: 'app', redirectPath: '/dashboard' }
        : { ok: true, status: 'authenticated' };
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  try {
    await loginTrinityUser({ email: ' MEMBER@EXAMPLE.COM ', password: 'test-password' });
    await requestTrinityMagicLink({ email: ' MEMBER@EXAMPLE.COM ', redirectPath: '//evil.example' });
    await requestTrinityPasswordRestore({ email: ' MEMBER@EXAMPLE.COM ' });
    const activated = await activateTrinityMagicLink('test-link');
    assert.equal(activated.user.id, 42);
    assert.equal(activated.user.email, 'member@example.com');
    for (const call of calls.slice(0, 4)) assert.equal(new Headers(call.init.headers).get('Authorization'), null);
    assert.equal(new Headers(calls[4].init.headers).get('Authorization'), 'Bearer verified-user-token');
    assert.equal(calls[1].url, 'https://gate.example/v1/apps/by-host/trinity.example/magic-links/request');
    assert.deepEqual(JSON.parse(String(calls[1].init.body)), { email: 'member@example.com', redirectPath: '/dashboard' });
    allowAccess = false;
    await assert.rejects(activateTrinityMagicLink('revoked-member'), /keinen Zugriff/);
  } finally { globalThis.fetch = previous; }
});

test('auth redirects stay on Trinity', () => {
  for (const path of ['//evil.example', '/\\evil.example', '/\nevil.example', 'https://evil.example', null]) assert.equal(safeAuthRedirect(path), '/dashboard');
  assert.equal(safeAuthRedirect('/dashboard/tasks?view=week'), '/dashboard/tasks?view=week');
});
