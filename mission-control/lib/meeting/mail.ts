import nodemailer from "nodemailer";
import { HttpError, emailOf } from "@/lib/auth/http";
import { text, uuid } from "@/lib/voice/validation";
import { roomUrl } from "./room";
export { roomUrl } from "./room";
type Environment = Record<string, string | undefined>;
export function meetingConfigured(
  userId: string,
  env: Environment = process.env,
) {
  return (
    env.MEETING_MAIL_OWNER_USER_ID === userId &&
    !!env.MEETING_SMTP_USER &&
    !!env.MEETING_SMTP_PASSWORD &&
    !!env.MEETING_SMTP_FROM
  );
}
export function invitationOf(b: Record<string, unknown>) {
  const room = roomUrl(text(b.room, 2000, true));
  if (!room)
    throw new HttpError(
      400,
      "Bitte einen HTTPS-Raumlink ohne Zugangsdaten wählen.",
    );
  const subject = text(b.subject, 180, true);
  if (/[\r\n]/.test(subject)) throw new HttpError(400, "Ungültiger Betreff.");
  return {
    id: uuid(b.id),
    to: emailOf(b.to),
    room,
    subject,
    message: text(b.message, 3000),
  };
}
export type Invitation = ReturnType<typeof invitationOf>;
const sent = new Map<
  string,
  { at: number; payload: string; state: "pending" | "sent" | "unknown" }
>();
export async function sendInvitation(
  userId: string,
  invite: Invitation,
  env: Environment = process.env,
  deliver?: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
  }) => Promise<unknown>,
) {
  if (!meetingConfigured(userId, env))
    throw new HttpError(
      503,
      "Direkter Versand ist für dein Konto noch nicht eingerichtet. Du kannst den Entwurf im Mailprogramm öffnen.",
    );
  const now = Date.now();
  for (const [k, v] of sent) if (v.at < now - 24 * 3600000) sent.delete(k);
  const key = userId + ":" + invite.id,
    payload = JSON.stringify(invite),
    existing = sent.get(key);
  if (existing) {
    if (existing.payload !== payload)
      throw new HttpError(
        409,
        "Diese Einladung wurde bereits mit anderem Inhalt vorbereitet.",
      );
    if (existing.state === "sent") return { sent: true, duplicate: true };
    throw new HttpError(
      409,
      "Der Versandstatus dieser Einladung ist noch unklar. Prüfe dein Postfach vor einem erneuten Versand.",
    );
  }
  if (
    [...sent].filter(
      ([k, v]) => k.startsWith(userId + ":") && v.at > now - 3600000,
    ).length >= 10
  )
    throw new HttpError(
      429,
      "Maximal zehn Einladungen pro Stunde. Bitte später erneut versuchen.",
    );
  const from = emailOf(env.MEETING_SMTP_FROM),
    port = Number(env.MEETING_SMTP_PORT || 465);
  if (![465, 587].includes(port))
    throw new HttpError(503, "Der SMTP-Port muss 465 oder 587 sein.");
  const message = {
    from,
    to: invite.to,
    subject: invite.subject,
    text: `${invite.message}\n\nDein Meeting-Raum:\n${invite.room}\n\nDiese Einladung wurde von guiding.space versendet.`,
  };
  sent.set(key, { at: now, payload, state: "pending" });
  try {
    if (deliver) await deliver(message);
    else {
      const transport = nodemailer.createTransport({
        host: env.MEETING_SMTP_HOST || "mail.infomaniak.com",
        port,
        secure: port === 465,
        requireTLS: true,
        auth: { user: env.MEETING_SMTP_USER, pass: env.MEETING_SMTP_PASSWORD },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        disableFileAccess: true,
        disableUrlAccess: true,
        logger: false,
        debug: false,
      });
      await transport.sendMail(message);
    }
    sent.set(key, { at: now, payload, state: "sent" });
    return { sent: true, duplicate: false };
  } catch {
    sent.set(key, { at: now, payload, state: "unknown" });
    throw new HttpError(
      503,
      "Der Versand konnte nicht bestätigt werden. Prüfe dein Postfach, bevor du erneut sendest.",
    );
  }
}
