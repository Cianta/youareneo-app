import { provision } from '@/lib/auth/provision';
import { usesSupabase } from '@/lib/supabase/config';
import * as legacy from '@/lib/auth/legacy/foerder';
export { OPTIONS } from '@/lib/auth/legacy/foerder';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  if (!usesSupabase()) return legacy.POST(req);
  return provision(req, false, true);
}
