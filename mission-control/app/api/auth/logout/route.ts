import { usesSupabase } from '@/lib/supabase/config';
import { logout } from '@/lib/auth/handlers';
import * as legacy from '@/lib/auth/legacy/logout';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return usesSupabase() ? logout(req) : legacy.POST();
}
