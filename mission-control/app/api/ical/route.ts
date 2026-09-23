import { NextResponse } from 'next/server';

/**
 * /api/ical?url=… — Proxy für externe iCal/ICS-Feeds (Google, Apple, Outlook, …).
 * Browser können die Feeds wegen CORS nicht direkt laden; dieser Endpoint holt
 * sie serverseitig und liefert den rohen ICS-Text zurück.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let url = searchParams.get('url') ?? '';
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  // webcal:// (Apple) ist einfach https://
  url = url.replace(/^webcal:\/\//i, 'https://');
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrinityOS/1.0)' },
      // Feeds ändern sich selten — kurz cachen
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
    const text = await res.text();
    return new Response(text, {
      headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=300' },
    });
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
  }
}
