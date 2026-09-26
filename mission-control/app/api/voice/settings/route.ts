import { NextResponse } from "next/server";
import { readMcSession } from "@/lib/fusebase/session";
import {
  readCredential,
  saveCredential,
  removeCredential,
  sameOrigin,
  providers,
  type VoiceProvider,
} from "@/lib/voice/credentials";
export const runtime = "nodejs";
export async function GET() {
  const user = await readMcSession();
  if (!user)
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  try {
    return NextResponse.json(
      {
        openai: !!readCredential(user.email, "openai"),
        groq: !!readCredential(user.email, "groq"),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Verbindungen konnten nicht geladen werden." },
      { status: 503 },
    );
  }
}
export async function POST(req: Request) {
  const user = await readMcSession();
  if (!user)
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Ungültiger Ursprung." },
      { status: 403 },
    );
  try {
    const b = await req.json();
    if (!Object.hasOwn(providers, b.provider))
      return NextResponse.json(
        { error: "Anbieter auswählen." },
        { status: 400 },
      );
    const p = b.provider as VoiceProvider;
    if (b.remove) {
      removeCredential(user.email, p);
    } else {
      if (
        typeof b.key !== "string" ||
        b.key.trim().length < 10 ||
        b.key.length > 1024 ||
        /[\r\n]/.test(b.key)
      )
        return NextResponse.json(
          { error: "Bitte einen gültigen API-Schlüssel eingeben." },
          { status: 400 },
        );
      saveCredential(user.email, p, b.key.trim());
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Verbindung konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
