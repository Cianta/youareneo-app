import {skyNow} from "@/lib/workspace/cosmos";
import {RestoredHome} from "@/components/workspace/RestoredHome";
import {workspaceIdentity} from "@/lib/workspace/session";
import {usesSupabase} from "@/lib/supabase/config";
import Onboarding from "@/components/workspace/Onboarding";
export default async function Dashboard() {
  const identity = usesSupabase() ? await workspaceIdentity() : null;
  return <><RestoredHome sky={skyNow(new Date())} />{identity && !identity.onboarded && <Onboarding initialName={identity.name}/>}</>;
}
