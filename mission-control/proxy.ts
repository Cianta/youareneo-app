import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { activeProducts, trinityAllowed } from '@/lib/supabase/access';
import { appOrigin, cookieOptions, publicConfig, usesSupabase } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  if (!usesSupabase()) return NextResponse.next();
  const path = request.nextUrl.pathname;
  // Public, read-only place/weather lookup; no account data or arbitrary upstream URLs.
  if (path === '/api/ambience') return NextResponse.next();
  // Auth routes perform their own verification and cookie writes. Webhooks use their secret.
  if (path.startsWith('/api/auth/') || path.startsWith('/api/provision/')
    || path.startsWith('/api/voice/') || path === '/api/notes' || path.startsWith('/api/notes/')
    || path === '/api/hermes/queue' || path === '/api/brain' || path === '/api/search' || path === '/api/onboarding'
    || path === '/api/calendar/feed' || path === '/api/workspace/snapshot' || path === '/api/gmail/threads') return NextResponse.next();
  const isApi = path.startsWith('/api/');
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  const finish = (next: NextResponse) => {
    for (const cookie of response.cookies.getAll()) next.cookies.set(cookie);
    next.headers.set('Cache-Control', 'private, no-store');
    return next;
  };
  try {
    const { url, key } = publicConfig();
    const sb = createServerClient(url, key, {
      cookieOptions: cookieOptions(),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: values => {
          for (const { name, value } of values) request.cookies.set(name, value);
          const previous = response.cookies.getAll();
          response = NextResponse.next({ request });
          for (const cookie of previous) response.cookies.set(cookie);
          for (const { name, value, options } of values) response.cookies.set(name, value, options);
        },
      },
    });
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return finish(isApi
      ? NextResponse.json({ success: false, error: 'Anmeldung erforderlich.' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', appOrigin())));
    if (!trinityAllowed(await activeProducts(sb, user.id))) return finish(isApi
      ? NextResponse.json({ success: false, error: 'Kein aktiver Trinity-Zugang.' }, { status: 403 })
      : NextResponse.redirect(new URL('/access-denied', appOrigin())));
    return finish(response);
  } catch {
    return finish(isApi
      ? NextResponse.json({ success: false, error: 'Anmeldung vorübergehend nicht verfügbar.' }, { status: 503 })
      : new NextResponse('Anmeldung vorübergehend nicht verfügbar. Bitte versuche es später erneut.', { status: 503 }));
  }
}

export const config = { matcher: ['/dashboard/:path*', '/api/:path*'] };
