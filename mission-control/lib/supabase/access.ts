import type { SupabaseClient } from '@supabase/supabase-js';

export async function activeProducts(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from('neo_access').select('product')
    .eq('user_id', userId).is('revoked_at', null);
  if (error) throw new Error('Zugangsrechte konnten nicht geprüft werden.');
  return (data ?? []).map((row: { product: string }) => row.product);
}

export function trinityAllowed(products: string[]) {
  return products.includes('foerder');
}
