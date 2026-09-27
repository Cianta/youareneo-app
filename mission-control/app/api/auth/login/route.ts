import { usesSupabase } from '@/lib/supabase/config';
import { login } from '@/lib/auth/handlers';
import * as legacy from '@/lib/auth/legacy/login';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return usesSupabase() ? login(req) : legacy.POST(req);
}
