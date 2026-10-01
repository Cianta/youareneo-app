import { cache } from "react";
import { authClient } from "@/lib/supabase/server";
import { HttpError } from "@/lib/auth/http";
export type WorkspaceIdentity = {
  id: string;
  name: string;
  onboarded: boolean;
};
export const workspaceIdentity = cache(async (): Promise<WorkspaceIdentity> => {
  const sb = await authClient(true);
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (error || !user) throw new HttpError(401, "Bitte melde dich erneut an.");
  const { data: profile, error: profileError } = await sb
    .from("neo_profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  return {
    id: user.id,
    name:
      (typeof user.user_metadata.trinity_display_name === "string"
        ? user.user_metadata.trinity_display_name.slice(0, 80)
        : "") ||
      profile?.display_name ||
      user.email?.split("@")[0] ||
      "Mitglied",
    onboarded: user.user_metadata.trinity_onboarding_complete === true,
  };
});
