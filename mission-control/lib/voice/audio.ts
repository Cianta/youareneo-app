import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { HttpError } from "@/lib/auth/http";
import { MAX_AUDIO_BYTES, MAX_RECORDING_SECONDS } from "./contracts";
const run = promisify(execFile);
export function audioType(file: File) {
  const mime = file.type.split(";")[0];
  const extensions: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/ogg": "ogg",
  };
  if (!extensions[mime] || !file.size || file.size > MAX_AUDIO_BYTES)
    throw new HttpError(
      400,
      "Bitte eine Aufnahme in WebM/Opus, MP4/AAC oder Ogg bis 20 MB verwenden.",
    );
  return { mime, extension: extensions[mime] };
}
export async function inspectAudio(file: File) {
  const type = audioType(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = await mkdtemp(join(tmpdir(), "neo-audio-"));
  try {
    const path = join(dir, `recording.${type.extension}`);
    await writeFile(path, bytes, { mode: 0o600 });
    // Decode the actual audio: do not trust client duration or container metadata.
    const { stdout } = await run(
      "ffmpeg",
      [
        "-v",
        "error",
        "-nostdin",
        "-protocol_whitelist",
        "file,pipe",
        "-i",
        path,
        "-map",
        "0:a:0",
        "-t",
        String(MAX_RECORDING_SECONDS + 1),
        "-f",
        "null",
        "-",
        "-progress",
        "pipe:1",
      ],
      { timeout: 30_000, maxBuffer: 1_000_000 },
    );
    const times = [...stdout.matchAll(/out_time_us=(\d+)/g)].map(
      (m) => Number(m[1]) / 1e6,
    );
    const seconds = Math.ceil(Math.max(0, ...times));
    if (!seconds || seconds > MAX_RECORDING_SECONDS)
      throw new HttpError(
        400,
        "Bitte eine Aufnahme von höchstens fünf Minuten verwenden.",
      );
    return { ...type, bytes, seconds };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(
      400,
      "Die Audiodatei konnte nicht gelesen werden. Bitte nimm sie erneut auf.",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
