import { createHash, randomBytes } from "node:crypto";
import { database, transaction } from "./store";
export const READ = "trinity:read",
  WRITE = "trinity:draft";
export function issuer() {
  const raw = process.env.TRINITY_PUBLIC_URL;
  if (!raw) throw new Error("TRINITY_PUBLIC_URL fehlt.");
  const u = new URL(raw);
  if (
    u.protocol !== "https:" &&
    !["127.0.0.1", "localhost"].includes(u.hostname)
  )
    throw new Error("Öffentliches OAuth benötigt HTTPS.");
  if (u.username || u.password || u.search || u.hash || u.pathname !== "/")
    throw new Error("TRINITY_PUBLIC_URL muss eine reine Origin sein.");
  return u.origin;
}
export const resource = () => `${issuer()}/mcp`;
export const random = () => randomBytes(32).toString("base64url");
export const hash = (s: string) =>
  createHash("sha256").update(s).digest("base64url");
const now = () => Math.floor(Date.now() / 1000);
export function validRedirect(s: string) {
  try {
    const u = new URL(s);
    return (
      !u.hash &&
      !u.username &&
      !u.password &&
      (u.protocol === "https:" ||
        (u.protocol === "http:" &&
          ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)))
    );
  } catch {
    return false;
  }
}
export function safeReturn(s: string | null | undefined) {
  return s?.startsWith("/") &&
    !s.startsWith("//") &&
    !s.includes("\\") &&
    !/[\r\n]/.test(s)
    ? s
    : "/dashboard";
}
export function client(id: string) {
  return database().prepare("SELECT * FROM clients WHERE id=?").get(id) as
    | { id: string; name: string; redirects: string }
    | undefined;
}
export function authorization(p: URLSearchParams) {
  const id = p.get("client_id") || "",
    c = client(id),
    redirect = p.get("redirect_uri") || "",
    scope = p.get("scope") || READ,
    challenge = p.get("code_challenge") || "";
  if (
    !c ||
    !JSON.parse(c.redirects).includes(redirect) ||
    p.get("response_type") !== "code" ||
    p.get("code_challenge_method") !== "S256" ||
    !/^[A-Za-z0-9_-]{43}$/.test(challenge) ||
    p.get("resource") !== resource() ||
    scope.split(" ").some((s) => ![READ, WRITE].includes(s)) ||
    !scope.split(" ").includes(READ)
  )
    throw new Error(
      "Ungültige OAuth-Anfrage. Client, Redirect, Resource und PKCE prüfen.",
    );
  return { c, redirect, scope, challenge, state: p.get("state") || "" };
}
export function grantCode(user: string, p: URLSearchParams) {
  const a = authorization(p),
    id = random(),
    code = random();
  transaction(() => {
    const db = database();
    db.prepare(
      "INSERT INTO grants(id,user_id,client_id,scope,created) VALUES(?,?,?,?,?)",
    ).run(id, user, a.c.id, a.scope, now());
    db.prepare("INSERT INTO codes VALUES(?,?,?,?,?)").run(
      hash(code),
      id,
      a.redirect,
      a.challenge,
      now() + 300,
    );
  });
  const u = new URL(a.redirect);
  u.searchParams.set("code", code);
  if (a.state) u.searchParams.set("state", a.state);
  return u.href;
}
type Grant = {
  id: string;
  user_id: string;
  client_id: string;
  scope: string;
  revoked: number;
};
function issue(grant: Grant) {
  const access = random(),
    refresh = random(),
    db = database();
  db.prepare("INSERT INTO tokens VALUES(?,?,?,?,0)").run(
    hash(access),
    grant.id,
    "access",
    now() + 1800,
  );
  db.prepare("INSERT INTO tokens VALUES(?,?,?,?,0)").run(
    hash(refresh),
    grant.id,
    "refresh",
    now() + 30 * 86400,
  );
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "Bearer",
    expires_in: 1800,
    scope: grant.scope,
  };
}
export function exchange(p: URLSearchParams) {
  let replay = false;
  const result = transaction(() => {
    const db = database();
    if (p.get("resource") !== resource()) throw new Error("invalid_target");
    const kind = p.get("grant_type");
    if (kind === "authorization_code") {
      const code = db
        .prepare("SELECT * FROM codes WHERE hash=?")
        .get(hash(p.get("code") || "")) as
        | {
            grant_id: string;
            redirect: string;
            challenge: string;
            expires: number;
          }
        | undefined;
      if (!code || code.expires < now()) throw new Error("invalid_grant");
      const g = db
        .prepare("SELECT * FROM grants WHERE id=?")
        .get(code.grant_id) as Grant;
      const verifier = p.get("code_verifier") || "";
      if (
        g.revoked ||
        g.client_id !== p.get("client_id") ||
        code.redirect !== p.get("redirect_uri") ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) ||
        hash(verifier) !== code.challenge
      )
        throw new Error("invalid_grant");
      db.prepare("DELETE FROM codes WHERE hash=?").run(hash(p.get("code")!));
      return issue(g);
    }
    if (kind === "refresh_token") {
      const t = db
        .prepare("SELECT * FROM tokens WHERE hash=? AND kind=?")
        .get(hash(p.get("refresh_token") || ""), "refresh") as
        | { grant_id: string; expires: number; used: number }
        | undefined;
      if (!t || t.expires < now()) throw new Error("invalid_grant");
      const g = db
        .prepare("SELECT * FROM grants WHERE id=?")
        .get(t.grant_id) as Grant;
      if (g.client_id !== p.get("client_id") || g.revoked)
        throw new Error("invalid_grant");
      if (t.used) {
        db.prepare("UPDATE grants SET revoked=1 WHERE id=?").run(g.id);
        replay = true;
        return null;
      }
      db.prepare("UPDATE tokens SET used=1 WHERE hash=?").run(
        hash(p.get("refresh_token")!),
      );
      return issue(g);
    }
    throw new Error("unsupported_grant_type");
  });
  if (replay) throw new Error("invalid_grant");
  return result;
}
export function bearer(req: Request) {
  const raw = req.headers
    .get("authorization")
    ?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!raw) return null;
  const r = database()
    .prepare(
      "SELECT g.* FROM tokens t JOIN grants g ON t.grant_id=g.id WHERE t.hash=? AND t.kind=? AND t.expires>? AND g.revoked=0",
    )
    .get(hash(raw), "access", now()) as Grant | undefined;
  return r ?? null;
}
export function sameOrigin(req: Request) {
  return req.headers.get("origin") === issuer();
}
export const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
export async function boundedJson(req: Request, limit = 262144) {
  const raw = await req.text();
  if (Buffer.byteLength(raw) > limit) throw new Error("Anfrage zu groß.");
  return JSON.parse(raw);
}
