import { authClient } from '@/lib/supabase/server';
import { activeProducts, trinityAllowed } from '@/lib/supabase/access';
import { appOrigin, safeRedirect } from '@/lib/supabase/config';
import { bodyOf, emailOf, failure, HttpError, json, sameOrigin } from './http';

export async function login(req: Request) {
  try {
    sameOrigin(req);
    const body = await bodyOf(req);
    const email = emailOf(body.email);
    if (typeof body.password !== 'string' || !body.password) throw new HttpError(400, 'Passwort erforderlich.');
    const sb = await authClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: body.password });
    if (error || !data.user) throw new HttpError(401, 'E-Mail oder Passwort ist nicht korrekt.');
    return json({ success: true, email: data.user.email, userId: data.user.id,
      redirectPath: safeRedirect(body.redirectPath), hasAppAuth: false });
  } catch (error) { return failure(error); }
}

export async function logout(req: Request) {
  try {
    sameOrigin(req);
    const sb = await authClient();
    const { error } = await sb.auth.signOut({ scope: 'local' });
    if (error) throw error;
    return json({ success: true });
  } catch (error) { return failure(error); }
}

export async function me() {
  try {
    const sb = await authClient();
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return json({ success: false, authenticated: false }, 401);
    const products = await activeProducts(sb, user.id);
    const { data: profile, error: profileError } = await sb.from('neo_profiles').select('display_name,avatar_url').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    const { data: claims } = await sb.auth.getClaims();
    return json({ success: true, authenticated: true, email: user.email, userId: user.id,
      exp: claims?.claims.exp, displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null, products, hasTrinityAccess: trinityAllowed(products) });
  } catch (error) { return failure(error); }
}

export async function requestMail(req: Request, recovery: boolean) {
  try {
    sameOrigin(req);
    const email = emailOf((await bodyOf(req)).email);
    const sb = await authClient();
    const redirectTo = `${appOrigin()}/auth/magic`;
    const { error } = recovery
      ? await sb.auth.resetPasswordForEmail(email, { redirectTo })
      : await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } });
    if (error?.status === 429) throw new HttpError(429, 'Bitte warte kurz, bevor du einen weiteren Link anforderst.');
    if (error && (error.status ?? 500) >= 500) throw error;
    // Missing and existing accounts receive the same response.
    return json({ success: true, ok: true, message: recovery
      ? 'Falls ein Konto mit dieser E-Mail existiert, erhältst du eine Nachricht zum Zurücksetzen des Passworts.'
      : 'Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Link zur Anmeldung.' });
  } catch (error) { return failure(error); }
}

export async function magic(req: Request) {
  try {
    if (req.method === 'POST') sameOrigin(req);
    const body = req.method === 'POST' ? await bodyOf(req) : Object.fromEntries(new URL(req.url).searchParams);
    const sb = await authClient();
    const type = body.type;
    const allowed = ['email', 'magiclink', 'invite', 'recovery', 'signup'];
    let result;
    if (typeof body.token_hash === 'string' && typeof type === 'string' && allowed.includes(type)) {
      result = await sb.auth.verifyOtp({ token_hash: body.token_hash, type: type as 'email' | 'magiclink' | 'invite' | 'recovery' | 'signup' });
    } else if (typeof body.code === 'string' && body.code) {
      result = await sb.auth.exchangeCodeForSession(body.code);
    } else { throw new HttpError(400, 'Dieser Anmeldelink ist unvollständig.'); }
    if (result.error || !result.data.user) throw new HttpError(400, 'Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.');
    return json({ success: true, redirectPath: type === 'recovery' || type === 'invite' || ('redirectType' in result.data && result.data.redirectType === 'recovery') || body.next === '/auth/password' ? '/auth/password' : '/dashboard' });
  } catch (error) { return failure(error); }
}

export async function updatePassword(req: Request) {
  try {
    sameOrigin(req);
    const { password } = await bodyOf(req);
    if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw new HttpError(400, 'Bitte verwende ein Passwort mit 12 bis 256 Zeichen.');
    const sb = await authClient();
    const { data: { user }, error: userError } = await sb.auth.getUser();
    if (userError || !user) throw new HttpError(401, 'Bitte öffne zuerst deinen gültigen Anmeldelink.');
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw new HttpError(400, 'Das Passwort konnte nicht gespeichert werden. Bitte wähle ein anderes oder fordere einen neuen Link an.');
    return json({ success: true, redirectPath: '/dashboard' });
  } catch (error) { return failure(error); }
}
