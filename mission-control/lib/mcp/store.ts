import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
let db: DatabaseSync | undefined;
export function database() {
  if (process.env.TRINITY_MCP_ENABLED !== "true")
    throw new Error("MCP ist auf diesem Server noch nicht aktiviert.");
  if (!db) {
    const path = resolve(
      process.env.TRINITY_MCP_DB || "data/private-mcp.sqlite",
    );
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    db = new DatabaseSync(path);
    chmodSync(path, 0o600);
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,name TEXT NOT NULL,redirects TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS grants(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,client_id TEXT NOT NULL,scope TEXT NOT NULL,created INTEGER NOT NULL,revoked INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS codes(hash TEXT PRIMARY KEY,grant_id TEXT NOT NULL,redirect TEXT NOT NULL,challenge TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tokens(hash TEXT PRIMARY KEY,grant_id TEXT NOT NULL,kind TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS vault(user_id TEXT PRIMARY KEY,content TEXT NOT NULL,updated TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS inbox(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,kind TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,created TEXT NOT NULL);
`);
  }
  return db;
}
export function transaction<T>(fn: () => T): T {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = fn();
    db.exec("COMMIT");
    return value;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
