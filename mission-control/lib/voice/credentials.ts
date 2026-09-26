import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import path from "node:path";
export type VoiceProvider = "openai" | "groq";
export const providers = {
  openai: {
    url: "https://api.openai.com/v1/audio/transcriptions",
    model: "gpt-4o-mini-transcribe",
  },
  groq: {
    url: "https://api.groq.com/openai/v1/audio/transcriptions",
    model: "whisper-large-v3-turbo",
  },
} as const;
let db: DatabaseSync | undefined;
function database() {
  if (!db) {
    const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const file = path.join(dir, "voice-private.sqlite");
    db = new DatabaseSync(file);
    chmodSync(file, 0o600);
    db.exec(
      "CREATE TABLE IF NOT EXISTS credentials(owner TEXT NOT NULL, provider TEXT NOT NULL, secret TEXT NOT NULL, PRIMARY KEY(owner,provider))",
    );
  }
  return db;
}
function key() {
  if (!process.env.APP_SECRET || process.env.APP_SECRET.length < 16)
    throw new Error("Server secret missing");
  return createHash("sha256")
    .update("trinity-voice-v1:" + process.env.APP_SECRET)
    .digest();
}
export function seal(value: string, owner: string, provider: string) {
  const iv = randomBytes(12),
    c = createCipheriv("aes-256-gcm", key(), iv);
  c.setAAD(Buffer.from(owner + ":" + provider));
  const data = Buffer.concat([c.update(value, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data]
    .map((x) => x.toString("base64url"))
    .join(".");
}
export function unseal(value: string, owner: string, provider: string) {
  const [iv, tag, data] = value
    .split(".")
    .map((x) => Buffer.from(x, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAAD(Buffer.from(owner + ":" + provider));
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
export function saveCredential(
  owner: string,
  provider: VoiceProvider,
  secret: string,
) {
  database()
    .prepare("INSERT OR REPLACE INTO credentials VALUES(?,?,?)")
    .run(owner, provider, seal(secret, owner, provider));
}
export function readCredential(owner: string, provider: VoiceProvider) {
  const row = database()
    .prepare("SELECT secret FROM credentials WHERE owner=? AND provider=?")
    .get(owner, provider) as { secret: string } | undefined;
  return row ? unseal(row.secret, owner, provider) : null;
}
export function removeCredential(owner: string, provider: VoiceProvider) {
  database()
    .prepare("DELETE FROM credentials WHERE owner=? AND provider=?")
    .run(owner, provider);
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return (
    (!origin ||
      origin ===
        (process.env.NODE_ENV === "production"
          ? new URL(
              process.env.TRINITY_PUBLIC_URL || "https://trinity.youareneo.com",
            ).origin
          : new URL(req.url).protocol +
            "//" +
            (req.headers.get("host") || new URL(req.url).host))) &&
    req.headers.get("sec-fetch-site") !== "cross-site"
  );
}
