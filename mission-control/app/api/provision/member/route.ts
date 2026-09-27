import { provision } from '@/lib/auth/provision';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return provision(req, false, false);
}
