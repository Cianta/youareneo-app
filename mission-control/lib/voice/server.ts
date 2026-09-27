import { authClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { activeProducts } from "@/lib/supabase/access";
import { HttpError } from "@/lib/auth/http";
import { usesSupabase } from "@/lib/supabase/config";
import { maySave } from "./contracts";
export async function voiceSession(save = false) {
  if (!usesSupabase())
    throw new HttpError(503, "Die Notizfunktion benötigt den NEO-Login.");
  const sb = await authClient();
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (error || !user)
    throw new HttpError(
      401,
      "Bitte melde dich für die Umwandlung oder deine gespeicherten Notizen an.",
    );
  const canSave = maySave(await activeProducts(sb, user.id));
  if (save && !canSave)
    throw new HttpError(
      403,
      "Nutzen ist frei. Zum Speichern brauchst du einen aktiven Förder- oder App-Zugang.",
    );
  return { sb, user, canSave };
}
export function limits() {
  const parse = (key: string, fallback: number) => {
    const value = process.env[key]?.trim();
    if (!value) return fallback;
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 0 || number > 1_000_000)
      throw new HttpError(
        503,
        "Das Nutzungslimit ist noch nicht korrekt eingerichtet.",
      );
    return number;
  };
  return {
    minutes: parse("VOICE_MINUTES_PER_MONTH", 120),
    requests: parse("VOICE_REQUESTS_PER_MONTH", 600),
  };
}
export async function reserveUsage(userId: string, seconds: number) {
  const cap = limits();
  const { data, error } = await adminClient().rpc("trinity_reserve_usage", {
    p_user: userId,
    p_seconds: Math.ceil(seconds),
    p_minutes_limit: cap.minutes,
    p_requests_limit: cap.requests,
  });
  if (error) throw error;
  if (!data)
    throw new HttpError(
      429,
      "Dein Monatskontingent ist aufgebraucht. Du kannst weiter Textnotizen verfassen. Im nächsten Monat geht es automatisch weiter.",
    );
}
