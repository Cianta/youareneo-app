import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export type MagicIdentity = { email: string; userId: number; redirectPath: string };
export class MagicStore {
  private db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS links(hash TEXT PRIMARY KEY,email TEXT NOT NULL,user_id INTEGER NOT NULL,redirect_path TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS limits(hash TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);`);
  }
  issue(identity: MagicIdentity, now = Date.now()) {
    const token = randomBytes(32).toString('base64url');
    this.db.prepare('DELETE FROM links WHERE expires <= ?').run(now);
    this.db.prepare('INSERT INTO links VALUES(?,?,?,?,?)').run(hash(token), identity.email, identity.userId, identity.redirectPath, now + 20 * 60_000);
    return token;
  }
  revoke(token: string) { this.db.prepare('DELETE FROM links WHERE hash=?').run(hash(token)); }
  consume(token: string, now = Date.now()): MagicIdentity | null {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    const row = this.db.prepare('DELETE FROM links WHERE hash=? AND expires>? RETURNING email,user_id,redirect_path').get(hash(token), now) as { email: string; user_id: number; redirect_path: string } | undefined;
    return row ? { email: row.email, userId: row.user_id, redirectPath: row.redirect_path } : null;
  }
  allow(key: string, max: number, now = Date.now()) {
    this.db.prepare('DELETE FROM limits WHERE expires<=?').run(now);
    const row = this.db.prepare(`INSERT INTO limits VALUES(?,1,?) ON CONFLICT(hash) DO UPDATE SET count=count+1 RETURNING count`).get(hash(key), now + 15 * 60_000) as { count: number };
    return row.count <= max;
  }
  close() { this.db.close(); }
}
let store: MagicStore | undefined;
export function magicStore() {
  return store ??= new MagicStore(join(process.env.DATA_DIR || join(process.cwd(), 'data'), 'private-auth.sqlite'));
}
