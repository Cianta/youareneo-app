import { usesSupabase } from '@/lib/supabase/config';
import { me } from '@/lib/auth/handlers';
import * as legacy from '@/lib/auth/legacy/me';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  return usesSupabase() ? me() : legacy.GET();
}
