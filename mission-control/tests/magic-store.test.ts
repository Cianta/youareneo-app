import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MagicStore } from '../lib/fusebase/magic-store';

test('VPS magic links expire, cannot be tampered with or replayed, and retain separate identities', () => {
  const store = new MagicStore(':memory:');
  try {
    const alice = { email: 'alice@example.com', userId: 1, redirectPath: '/dashboard' };
    const bob = { email: 'bob@example.com', userId: 2, redirectPath: '/dashboard/tasks' };
    const a = store.issue(alice, 1000), b = store.issue(bob, 1000);
    assert.equal(store.consume(a.slice(0, -1) + (a.endsWith('a') ? 'b' : 'a'), 2000), null);
    assert.deepEqual(store.consume(a, 2000), alice);
    assert.equal(store.consume(a, 2000), null);
    assert.deepEqual(store.consume(b, 2000), bob);
    assert.equal(store.consume(store.issue(alice, 1000), 1201000), null);
    const revoked = store.issue(alice, 2000); store.revoke(revoked);
    assert.equal(store.consume(revoked, 3000), null);
    assert.equal(store.consume('invalid', 3000), null);
  } finally { store.close(); }
});

test('only token hashes are persisted and delivery limits survive restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trinity-auth-')), path = join(dir, 'auth.sqlite');
  let store = new MagicStore(path);
  try {
    const identity = { email: 'alice@example.com', userId: 1, redirectPath: '/dashboard' };
    const code = store.issue(identity, 1000);
    assert.equal(store.allow('email:alice@example.com', 2, 1000), true);
    assert.equal(store.allow('email:alice@example.com', 2, 1000), true);
    store.close(); store = new MagicStore(path);
    assert.equal(readFileSync(path).includes(Buffer.from(code)), false);
    assert.equal(store.allow('email:alice@example.com', 2, 2000), false);
    assert.equal(store.allow('email:alice@example.com', 2, 901000), true);
    assert.deepEqual(store.consume(code, 2000), identity);
  } finally { store.close(); rmSync(dir, { recursive: true }); }
});
