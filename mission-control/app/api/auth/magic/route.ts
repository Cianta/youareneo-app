import { usesSupabase } from '@/lib/supabase/config';
import { magic } from '@/lib/auth/handlers';
import * as legacy from '@/lib/auth/legacy/magic';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) { return usesSupabase() ? magic(req) : legacy.GET(req); }
export async function POST(req: Request) { return usesSupabase() ? magic(req) : legacy.POST(req); }
