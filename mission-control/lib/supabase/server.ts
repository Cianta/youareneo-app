import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicConfig, cookieOptions } from './config';

export async function authClient(readOnly = false) {
  const { url, key } = publicConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: cookieOptions(),
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        // Server Components cannot write cookies; the auth proxy refreshes them.
        if (readOnly) return;
        for (const { name, value, options } of values) jar.set(name, value, options);
      },
    },
  });
}
