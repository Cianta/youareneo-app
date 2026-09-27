import { HttpError } from "@/lib/auth/http";
import { NOTE_TYPES, type NoteDraft } from "./contracts";
export function text(value: unknown, max: number, required = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new HttpError(400, "Bitte prüfe die Notizfelder und ihre Länge.");
  return value.trim();
}
export function noteOf(input: unknown): NoteDraft {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new HttpError(400, "Ungültige Notiz.");
  const b = input as Record<string, unknown>;
  if (
    !NOTE_TYPES.includes(b.type as NoteDraft["type"]) ||
    !["voice", "text"].includes(String(b.source))
  )
    throw new HttpError(400, "Ungültiger Notiztyp.");
  if (!Array.isArray(b.tags) || b.tags.length > 20)
    throw new HttpError(400, "Maximal 20 Tags.");
  const due = b.due ? text(b.due, 40) : null;
  if (
    due &&
    (!/^\d{4}-\d{2}-\d{2}T/.test(due) || !Number.isFinite(Date.parse(due)))
  )
    throw new HttpError(400, "Ungültiger Termin.");
  return {
    title: text(b.title, 200, true),
    transcript: text(b.transcript, 20000, true),
    summary: text(b.summary, 4000),
    type: b.type as NoteDraft["type"],
    source: b.source as NoteDraft["source"],
    project: b.project ? text(b.project, 100, true) : null,
    tags: [...new Set(b.tags.map((t) => text(t, 50, true).toLowerCase()))],
    due: due ? new Date(due).toISOString() : null,
    assignee: b.assignee ? text(b.assignee, 100) : null,
  };
}
export async function limitedBody(req: Request, limit: number) {
  if (Number(req.headers.get("content-length")) > limit)
    throw new HttpError(413, "Die Aufnahme oder Notiz ist zu groß.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Inhalt fehlt.");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "Die Aufnahme oder Notiz ist zu groß.");
      }
      parts.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Request(req.url, {
    method: "POST",
    headers: { "content-type": req.headers.get("content-type") ?? "" },
    body: Buffer.concat(parts),
  });
}
export async function smallJson(req: Request) {
  try {
    const value = await (await limitedBody(req, 100_000)).json();
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new HttpError(400, "Ungültiges JSON.");
    return value;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Ungültiges JSON.");
  }
}
export function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new HttpError(400, "Ungültige Notiz-ID.");
  return value;
}
