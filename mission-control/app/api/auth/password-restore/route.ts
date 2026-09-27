import { usesSupabase } from '@/lib/supabase/config';
import { requestMail } from '@/lib/auth/handlers';
import * as legacy from '@/lib/auth/legacy/password-restore';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return usesSupabase() ? requestMail(req, true) : legacy.POST(req);
}
