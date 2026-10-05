import { HttpError } from "@/lib/auth/http";
export type SpeechVoice = { id: string; name: string; languages: string[] };
export interface SpeechProvider {
  name: string;
  voices(signal?: AbortSignal): Promise<SpeechVoice[]>;
  synthesize(
    text: string,
    voice: string,
    signal?: AbortSignal,
  ): Promise<Uint8Array>;
}
const BASE = "https://api.vocallab.ai/api/v1";
const MAX_RESPONSE = 16 * 1024 * 1024;
export function speechConfig() {
  const provider = process.env.SPEECH_PROVIDER?.trim() || "vocallab";
  return {
    provider,
    ready: provider === "vocallab" && !!process.env.VOCALLAB_API_KEY?.trim(),
  };
}
async function providerRequest(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
) {
  const key = process.env.VOCALLAB_API_KEY?.trim();
  if (!key)
    throw new HttpError(
      503,
      "VocalLab ist noch nicht eingerichtet. Wähle die Browser-Stimme.",
    );
  const response = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.any([
      AbortSignal.timeout(90000),
      ...(signal ? [signal] : []),
    ]),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(
      response.status === 429 ? 429 : 503,
      "VocalLab ist gerade nicht verfügbar. Du kannst zur Browser-Stimme wechseln.",
    );
  }
  return response;
}
async function boundedJson(response: Response) {
  if (Number(response.headers.get("content-length")) > MAX_RESPONSE) {
    await response.body?.cancel();
    throw new HttpError(502, "Die Sprachausgabe war zu groß.");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new HttpError(502, "Die Sprachausgabe fehlt.");
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_RESPONSE) {
        await reader.cancel();
        throw new HttpError(502, "Die Sprachausgabe war zu groß.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
// Eigene, vom Betreiber festgelegte Stimme (z. B. mit VocalLab entworfen). Nur genau diese
// eine Konto-Stimme wird freigegeben; andere Klone/Entwürfe des Kontos bleiben verborgen.
export function trinityVoice(): SpeechVoice | null {
  const id = process.env.TRINITY_VOICE_ID?.trim();
  if (!id || !/^[A-Za-z0-9_-]{1,200}$/.test(id)) return null;
  const name = process.env.TRINITY_VOICE_NAME?.trim().slice(0, 60) || "Trinity";
  return { id, name, languages: ["de"] };
}
let catalog: { expires: number; voices: SpeechVoice[] } | undefined;
export class VocalLabSpeech implements SpeechProvider {
  name = "vocallab";
  constructor(private cached = true) {}
  async voices(signal?: AbortSignal) {
    const own = trinityVoice();
    const withOwn = (list: SpeechVoice[]) =>
      own ? [own, ...list.filter((v) => v.id !== own.id)] : list;
    if (this.cached && catalog && catalog.expires > Date.now())
      return withOwn(catalog.voices);
    const data = await boundedJson(
      await providerRequest(
        "/voices?type=preset&limit=500",
        { method: "GET" },
        signal,
      ),
    );
    if (!Array.isArray(data.voices))
      throw new HttpError(
        502,
        "Der Stimmenkatalog konnte nicht geladen werden.",
      );
    // Never expose shared account clones/designs to other members.
    const voices: SpeechVoice[] = data.voices
      .filter(
        (v: Record<string, unknown>) =>
          v.type === "preset" &&
          typeof v.id === "string" &&
          typeof v.name === "string",
      )
      .slice(0, 500)
      .map((v: { id: string; name: string; languages?: string[] }) => ({
        id: v.id.slice(0, 200),
        name: v.name.slice(0, 200),
        languages: (v.languages || [])
          .filter((x) => typeof x === "string")
          .slice(0, 20),
      }));
    if (this.cached) catalog = { expires: Date.now() + 600000, voices };
    return withOwn(voices);
  }
  async synthesize(text: string, voice: string, signal?: AbortSignal) {
    if (!text.trim() || text.length > 2000)
      throw new HttpError(400, "Sprachausgabe benötigt 1 bis 2.000 Zeichen.");
    const model = process.env.VOCALLAB_MODEL?.trim() || "v-pro";
    if (!["v-pro", "v-flash", "v-lite", "v-studio"].includes(model))
      throw new HttpError(
        503,
        "Das VocalLab-Modell ist noch nicht korrekt eingerichtet.",
      );
    // No automatic retries: each POST may incur a charge.
    const data = await boundedJson(
      await providerRequest(
        "/tts",
        {
          method: "POST",
          body: JSON.stringify({
            text: text.replace(/<[^>]*>/g, ""),
            voice,
            model,
            format: "MP3",
          }),
        },
        signal,
      ),
    );
    try {
      if (typeof data.audio_base64 !== "string")
        throw new HttpError(
          502,
          "VocalLab hat noch kein Audio geliefert. Bitte erneut versuchen.",
        );
      const match =
        /^data:audio\/(?:mp3|mpeg);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(
          data.audio_base64,
        );
      if (!match)
        throw new HttpError(
          502,
          "VocalLab hat ein unbekanntes Audioformat geliefert.",
        );
      const bytes = Buffer.from(match[1], "base64");
      if (
        bytes.length < 3 ||
        bytes.length > 12 * 1024 * 1024 ||
        !(
          bytes.subarray(0, 3).toString() === "ID3" ||
          (bytes[0] === 255 && (bytes[1] & 224) === 224)
        )
      )
        throw new HttpError(
          502,
          "Die Sprachausgabe konnte nicht gelesen werden.",
        );
      return new Uint8Array(bytes);
    } finally {
      // Clean up only this newly created temporary generation. Never follow response URLs.
      if (
        typeof data.id === "string" &&
        /^[A-Za-z0-9_-]{1,200}$/.test(data.id)
      ) {
        try {
          const clean = await providerRequest(
            "/tts/" + encodeURIComponent(data.id),
            { method: "DELETE" },
            AbortSignal.timeout(5000),
          );
          await clean.body?.cancel();
        } catch {
          /* Provider retention may remain if cleanup fails; no sensitive logging. */
        }
      }
    }
  }
}
export function speechProvider(): SpeechProvider {
  if (!speechConfig().ready)
    throw new HttpError(
      503,
      "VocalLab ist noch nicht eingerichtet. Wähle die Browser-Stimme.",
    );
  const model = process.env.VOCALLAB_MODEL?.trim() || "v-pro";
  if (!["v-pro", "v-flash", "v-lite", "v-studio"].includes(model))
    throw new HttpError(
      503,
      "Das VocalLab-Modell ist noch nicht korrekt eingerichtet.",
    );
  return new VocalLabSpeech();
}
