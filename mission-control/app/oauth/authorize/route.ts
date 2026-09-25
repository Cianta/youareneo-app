import { NextResponse } from "next/server";
import { readMcSession } from "@/lib/fusebase/session";
import {
  authorization,
  grantCode,
  issuer,
  sameOrigin,
  random,
} from "@/lib/mcp/oauth";
import { cookies } from "next/headers";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function GET(req: Request) {
  try {
    const u = new URL(req.url),
      a = authorization(u.searchParams),
      session = await readMcSession();
    if (!session?.userId)
      return NextResponse.redirect(
        new URL(
          `/login?next=${encodeURIComponent("/oauth/authorize" + u.search)}`,
          issuer(),
        ),
      );
    const csrf = random();
    const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Trinity · Agent verbinden</title><style>body{font:16px system-ui;background:#101614;color:#edf0e7;max-width:560px;margin:12vh auto;padding:24px;line-height:1.7}main{border:1px solid #405143;border-radius:24px;padding:32px}button{padding:14px 22px;border-radius:12px;border:0;margin:16px 8px 0 0;cursor:pointer}small{color:#acbdaa;overflow-wrap:anywhere}</style><main><small>TRINITY · VERBINDUNG FREIGEBEN</small><h1>${esc(a.c.name)}</h1><p>Dieser Agent möchte auf deinen ausdrücklich veröffentlichten Workspace zugreifen.</p><ul><li>Freigegebene Markdown-Dokumente lesen</li>${a.scope.includes("trinity:draft") ? "<li>Notiz- und Aufgabenentwürfe vorschlagen. Übernehmen kannst du sie selbst in Trinity.</li>" : ""}</ul><p>Keine Passwörter, Geburtsdaten, Administrationsrechte oder privaten App-Schlüssel.</p><small>Konto: ${esc(session.email)}<br>Rückleitung: ${esc(a.redirect)}<br>Der Clientname stammt vom anfragenden Programm. Prüfe die Adresse.</small><form method="post"><input type="hidden" name="query" value="${esc(u.searchParams.toString())}"><input type="hidden" name="csrf" value="${csrf}"><button name="decision" value="allow">Zugriff erlauben</button><button name="decision" value="deny">Ablehnen</button></form></main></html>`;
    const res = new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
        "Referrer-Policy": "no-referrer",
      },
    });
    res.cookies.set("trinity_oauth_csrf", csrf, {
      httpOnly: true,
      secure: issuer().startsWith("https:"),
      sameSite: "strict",
      path: "/oauth/authorize",
      maxAge: 300,
    });
    return res;
  } catch {
    return new Response(
      "Die OAuth-Anfrage ist ungültig oder MCP ist noch nicht aktiviert.",
      { status: 400 },
    );
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req))
      return new Response("Origin abgelehnt", { status: 403 });
    const session = await readMcSession();
    if (!session?.userId)
      return new Response("Bitte anmelden", { status: 401 });
    const raw = await req.text();
    if (raw.length > 16000) return new Response("Zu groß", { status: 413 });
    const form = new URLSearchParams(raw),
      cookie = (await cookies()).get("trinity_oauth_csrf")?.value;
    if (!cookie || form.get("csrf") !== cookie)
      return new Response("Freigabe abgelaufen", { status: 403 });
    const p = new URLSearchParams(form.get("query") || ""),
      a = authorization(p);
    let target: string;
    if (form.get("decision") === "allow")
      target = grantCode(String(session.userId), p);
    else {
      const u = new URL(a.redirect);
      u.searchParams.set("error", "access_denied");
      if (a.state) u.searchParams.set("state", a.state);
      target = u.href;
    }
    const res = NextResponse.redirect(target, 303);
    res.cookies.set("trinity_oauth_csrf", "", { path: "/oauth/authorize", maxAge: 0 });
    return res;
  } catch {
    return new Response("Freigabe fehlgeschlagen. Verbindung erneut starten.", {
      status: 400,
    });
  }
}
