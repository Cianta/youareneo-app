import type { SupabaseClient } from "@supabase/supabase-js";
export const PROJECT_RULE_TAG = "projektregeln";
/** Rules remain ordinary private notes. The latest version for this owner's project wins. */
export async function ownProjectRules(sb: SupabaseClient, owner: string, project: string | null): Promise<string> {
  if (!project) return "";
  const { data, error } = await sb.from("trinity_notes").select("transcript")
    .eq("user_id", owner).eq("project", project).contains("tags", [PROJECT_RULE_TAG])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return typeof data?.transcript === "string" ? data.transcript.slice(0, 2000) : "";
}
