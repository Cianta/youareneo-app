import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicConfig, cookieOptions } from './config';

export async function authClient() {
  const { url, key } = publicConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: cookieOptions(),
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values) jar.set(name, value, options);
      },
    },
  });
}
