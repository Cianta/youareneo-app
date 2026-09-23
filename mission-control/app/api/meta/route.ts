/**
 * /api/meta — Fetches a web page server-side and extracts title, description
 * and preview image (og:image / favicon). Used by the App Launcher to
 * auto-fill descriptions for newly added web apps.
 */
import { NextRequest, NextResponse } from 'next/server';

function extract(html: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'valid url required' }, { status: 400 });
  }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrinityOS/1.0)' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    const html = (await res.text()).slice(0, 300_000);

    const title = extract(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);
    const description = extract(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ]);
    const image = extract(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ]);

    const domain = new URL(url).hostname;
    return NextResponse.json({
      title:       title ?? domain,
      description: description ?? '',
      image:       image ?? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      favicon:     `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    });
  } catch {
    const domain = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
    return NextResponse.json({
      title: domain, description: '',
      image: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
      favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
    });
  }
}
