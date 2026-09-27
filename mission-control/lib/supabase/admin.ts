import { createClient } from '@supabase/supabase-js';
import { AuthConfigError, publicConfig } from './config';

export function adminClient() {
  const { url } = publicConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new AuthConfigError('Supabase Administration ist noch nicht konfiguriert.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
