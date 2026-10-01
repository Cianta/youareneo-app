import { setTimeout as delay } from "node:timers/promises";
import { infomaniakToken } from "./infomaniak-config";
import { HttpError } from "@/lib/auth/http";
import type { TranscriptionProvider } from "./providers";

// Infomaniak's OpenAI-compatible upload returns a batch, not a transcript.
// Never follow a provider-supplied URL with the bearer token.
export class InfomaniakTranscription implements TranscriptionProvider {
  name = "Infomaniak";
  async transcribe(
    audio: { bytes: Buffer; extension: string; mime: string },
    language: "de" | "auto",
  ) {
    const product = process.env.INFOMANIAK_AI_PRODUCT_ID?.trim() || "";
    const token = infomaniakToken();
    if (!/^[1-9]\d*$/.test(product) || !token)
      throw new HttpError(503, "Die Spracherkennung mit Infomaniak wird gerade eingerichtet.");
    const base = `https://api.infomaniak.com/1/ai/${product}`;
    const signal = AbortSignal.timeout(120_000);
    const request = async (path: string, body?: FormData) => {
      const response = await fetch(base + path, {
        method: body ? "POST" : "GET",
        headers: { Authorization: `Bearer ${token}` },
        body, signal, redirect: "error", cache: "no-store",
      });
      if (!response.ok)
        throw new HttpError(502, "Infomaniak konnte die Aufnahme nicht verarbeiten. Bitte versuche es später erneut.");
      return response;
    };
    // Accept the documented payload and the standard Infomaniak envelope.
    const unwrap = (value: Record<string, unknown>): Record<string, unknown> =>
      value.result === "success" && value.data && typeof value.data === "object"
        ? value.data as Record<string, unknown> : value;
    try {
      const form = new FormData();
      form.set("file", new File([new Uint8Array(audio.bytes)], `recording.${audio.extension}`, { type: audio.mime }));
      form.set("model", "whisper");
      form.set("response_format", "text");
      if (language === "de") form.set("language", "de");
      const batch = unwrap(await (await request("/openai/audio/transcriptions", form)).json());
      if (typeof batch.batch_id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(batch.batch_id))
        throw new HttpError(502, "Infomaniak hat keinen gültigen Transkriptionsauftrag zurückgegeben.");
      const path = `/results/${batch.batch_id}`;
      while (true) {
        signal.throwIfAborted();
        const result = unwrap(await (await request(path)).json());
        if (result.status === "success") {
          const transcript = typeof result.data === "string"
            ? result.data : await (await request(path + "/download")).text();
          if (!transcript.trim())
            throw new HttpError(422, "Es wurde keine Sprache erkannt. Bitte versuche es erneut.");
          if (transcript.length > 20_000)
            throw new HttpError(502, "Das Transkript ist zu lang. Bitte verwende eine kürzere Aufnahme.");
          return transcript.trim();
        }
        if (result.status !== "pending" && result.status !== "processing")
          throw new HttpError(502, "Infomaniak konnte den Transkriptionsauftrag nicht abschließen.");
        await delay(1_500, undefined, { signal });
      }
    } catch (error) {
      if (signal.aborted)
        throw new HttpError(504, "Die Transkription bei Infomaniak dauert zu lange. Deine Aufnahme bleibt zum erneuten Versuch im Tab.");
      if (error instanceof HttpError) throw error;
      // Provider errors may contain audio, tokens or URLs; do not log them.
      throw new HttpError(502, "Infomaniak ist gerade nicht erreichbar. Bitte versuche es später erneut.");
    }
  }
}
