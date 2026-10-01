import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { workspaceIdentity } from "@/lib/workspace/session";
import { usesSupabase } from "@/lib/supabase/config";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = usesSupabase() ? await workspaceIdentity() : null;
  return <WorkspaceShell identity={identity}>{children}</WorkspaceShell>;
}
