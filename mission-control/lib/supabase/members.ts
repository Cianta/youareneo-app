import type { SupabaseClient, User } from '@supabase/supabase-js';

export async function findUser(client: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find(user => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
}

export async function provisionMember(client: SupabaseClient, input: {
  email: string; fullName?: string; products: string[]; source: string;
}) {
  const email = input.email.trim().toLowerCase();
  let user = await findUser(client, email);
  let created = false;
  if (!user) {
    const { data, error } = await client.auth.admin.createUser({
      email, email_confirm: true,
      ...(input.fullName ? { user_metadata: { display_name: input.fullName } } : {}),
    });
    if (error) {
      // Concurrent requests may both see no user. Only duplicate-account errors are retried.
      if (!['email_exists', 'user_already_exists'].includes(error.code ?? '')) throw error;
      user = await findUser(client, email);
      if (!user) throw error;
    } else {
      user = data.user;
      created = true;
    }
  }
  if (!user) throw new Error('Account creation failed');
  // Keep existing Visual Room profile data unchanged, including on webhook retries.
  const { error: profileError } = await client.from('neo_profiles').upsert({
    id: user.id, display_name: input.fullName || email.split('@')[0],
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileError) throw profileError;
  const { error } = await client.from('neo_access').upsert(
    input.products.map(product => ({ user_id: user!.id, product, source: input.source, revoked_at: null })),
    { onConflict: 'user_id,product' },
  );
  if (error) throw error;
  return { userId: user.id, created };
}

export async function revokeMember(client: SupabaseClient, email: string, products: string[]) {
  const user = await findUser(client, email.trim().toLowerCase());
  if (!user) return { userId: null, revoked: false };
  const { data, error } = await client.from('neo_access').update({ revoked_at: new Date().toISOString() })
    .eq('user_id', user.id).in('product', products).is('revoked_at', null).select('product');
  if (error) throw error;
  return { userId: user.id, revoked: Boolean(data?.length) };
}
