import { timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/auth/http";
export function authorizeHermes(req: Request) {
  const secret = process.env.HERMES_API_TOKEN?.trim();
  if (!secret || secret.length < 32)
    throw new HttpError(503, "Hermes ist noch nicht eingerichtet.");
  const value = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (
    Buffer.byteLength(value) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(value), Buffer.from(expected))
  )
    throw new HttpError(401, "Nicht autorisiert.");
}
export function ownerDecision(value: unknown) {
  if (value !== "freigegeben" && value !== "abgelehnt")
    throw new HttpError(400, "Bitte freigeben oder ablehnen.");
  return value;
}
export function hermesDecision(value: unknown) {
  if (value !== "erledigt" && value !== "abgelehnt")
    throw new HttpError(400, "Hermes darf nur erledigt oder abgelehnt melden.");
  return value;
}
