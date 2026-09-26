import { NextResponse } from "next/server";
import { readMcSession } from "@/lib/fusebase/session";
import {
  providers,
  readCredential,
  sameOrigin,
  type VoiceProvider,
} from "@/lib/voice/credentials";
export const runtime = "nodejs";
const requests = new Map<
  string,
  { at: number; count: number; busy: boolean }
>();
export async function POST(req: Request) {
  const user = await readMcSession();
  if (!user)
    return NextResponse.json(
      { error: "Bitte erneut anmelden." },
      { status: 401 },
    );
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Ungültiger Ursprung." },
      { status: 403 },
    );
  if (Number(req.headers.get("content-length") || 0) > 9 * 1024 * 1024)
    return NextResponse.json(
      { error: "Aufnahme zu groß. Bitte kürzer aufnehmen." },
      { status: 413 },
    );
  const now = Date.now();
  for (const [id, item] of requests)
    if (now - item.at > 60000 && !item.busy) requests.delete(id);
  const limit = requests.get(user.email) ?? { at: now, count: 0, busy: false };
  if (limit.busy || limit.count >= 20)
    return NextResponse.json(
      { error: "Bitte kurz warten und erneut versuchen." },
      { status: 429 },
    );
  limit.count++;
  limit.busy = true;
  requests.set(user.email, limit);
  try {
    const form = await req.formData(),
      p = String(form.get("provider"));
    if (!Object.hasOwn(providers, p))
      return NextResponse.json(
        { error: "Anbieter auswählen." },
        { status: 400 },
      );
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 8 * 1024 * 1024 ||
      ![
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
        "audio/mpeg",
      ].includes(file.type.split(";")[0])
    )
      return NextResponse.json(
        { error: "Ungültige Aufnahme oder mehr als 8 MB." },
        { status: 400 },
      );
    const provider = p as VoiceProvider,
      key = readCredential(user.email, provider);
    if (!key)
      return NextResponse.json(
        {
          error: "Verbinde zuerst deinen Sprach-Anbieter in den Einstellungen.",
        },
        { status: 409 },
      );
    const body = new FormData();
    body.set("file", file);
    body.set("model", providers[provider].model);
    body.set("response_format", "json");
    const lang = String(form.get("language") || "de");
    if (["de", "en", "fr", "es", "it"].includes(lang))
      body.set("language", lang);
    const r = await fetch(providers[provider].url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body,
      signal: AbortSignal.timeout(55000),
      redirect: "error",
    });
    if (!r.ok)
      return NextResponse.json(
        {
          error:
            r.status === 401
              ? "Der API-Schlüssel wurde abgelehnt. Bitte die Verbindung prüfen."
              : r.status === 429
                ? "Dein Anbieter meldet ein Limit. Bitte Guthaben und Kontingent prüfen."
                : "Der Sprach-Anbieter konnte die Aufnahme nicht verarbeiten.",
        },
        { status: 502 },
      );
    const data = await r.json();
    return NextResponse.json(
      { text: typeof data.text === "string" ? data.text : "" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Die Übertragung ist fehlgeschlagen. Bitte erneut versuchen." },
      { status: 502 },
    );
  } finally {
    limit.busy = false;
  }
}
