import { authClient } from "@/lib/supabase/server";
import { usesSupabase } from "@/lib/supabase/config";
import { HttpError } from "@/lib/auth/http";
import { isStudio } from "./data";

/** Members read through RLS; the database decides which lessons are unlocked. */
export async function kursSession(opts: { readOnly?: boolean; studio?: boolean } = {}) {
  if (!usesSupabase()) throw new HttpError(503, "Der Kursraum benötigt den NEO-Login.");
  const sb = await authClient(opts.readOnly);
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new HttpError(401, "Bitte melde dich an, um deine Kurse zu sehen.");
  const studio = await isStudio(sb);
  if (opts.studio && !studio) throw new HttpError(403, "Das Kursstudio ist nur für das Kursteam freigeschaltet.");
  return { sb, user, studio };
}
