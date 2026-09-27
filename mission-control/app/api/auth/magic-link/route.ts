import { usesSupabase } from '@/lib/supabase/config';
import { requestMail } from '@/lib/auth/handlers';
import * as legacy from '@/lib/auth/legacy/magic-link';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return usesSupabase() ? requestMail(req, false) : legacy.POST(req);
}
