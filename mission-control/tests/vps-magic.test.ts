import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { requestVpsMagicLink, activateVpsMagicLink } from '../lib/fusebase/vps-magic';
import { magicStore } from '../lib/fusebase/magic-store';

test('VPS mail targets existing members only; callback rechecks membership and never accepts caller identity', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'trinity-vps-auth-'));
  Object.assign(process.env, { DATA_DIR: dir, FUSEBASE_GATE_URL: 'https://gate.example/v1', FUSEBASE_ORG_ID: 'neo', FUSEBASE_PORTAL_ID: 'portal', FUSEBASE_TOKEN: 'members-token', FUSEBASE_AUTH_MAIL_TOKEN: 'mail-only-token', TRINITY_PUBLIC_URL: 'https://trinity.example' });
  let present = true, rejectMail = false;
  const mails: { recipient: string; body: string }[] = [];
  const previous = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input, init);
    if (req.url.endsWith('/users')) {
      assert.equal(req.headers.get('Authorization'), 'Bearer members-token');
      return Response.json({ users: present ? [{ id: 7, email: 'member@example.com', role: 'client' }] : [] });
    }
    assert.equal(req.url, 'https://gate.example/v1/neo/email');
    assert.equal(req.headers.get('Authorization'), 'Bearer mail-only-token');
    mails.push(await req.json());
    return rejectMail ? Response.json({ error: 'mail denied' }, { status: 403 }) : Response.json({ requestId: 'test', sentUserId: 7 });
  }) as typeof fetch;
  const code = () => mails.at(-1)!.body.match(/#token=([A-Za-z0-9_-]+)/)![1];
  try {
    await requestVpsMagicLink('unknown@example.com', '/', 'ip1');
    assert.equal(mails.length, 0);
    await requestVpsMagicLink(' MEMBER@EXAMPLE.COM ', '//evil.example', 'ip2');
    assert.equal(mails[0].recipient, 'member@example.com');
    assert.match(mails[0].body, /https:\/\/trinity.example\/auth\/magic#token=/);
    const first = code();
    assert.deepEqual(await activateVpsMagicLink(first), { email: 'member@example.com', userId: 7, redirectPath: '/dashboard' });
    assert.equal(await activateVpsMagicLink(first), null);
    await requestVpsMagicLink('member@example.com', '/dashboard', 'ip2');
    present = false;
    assert.equal(await activateVpsMagicLink(code()), null);
    present = true; rejectMail = true;
    await assert.rejects(requestVpsMagicLink('member@example.com', '/dashboard', 'ip2'));
    assert.equal(await activateVpsMagicLink(code()), null);
  } finally { globalThis.fetch = previous; magicStore().close(); rmSync(dir, { recursive: true }); }
});
