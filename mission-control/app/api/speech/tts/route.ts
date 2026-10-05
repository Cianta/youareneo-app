import { NextResponse } from 'next/server';
import { SPEECH_LANGS, listVoices, speak } from '@/lib/speech/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_CHARS = 2500;

/** Konfiguration für den Player: Stimmen + Sprachen. */
export async function GET() {
  return NextResponse.json({
    voices: listVoices(),
    langs: Object.entries(SPEECH_LANGS).map(([code, v]) => ({ code, name: v.name, locale: v.locale })),
  });
}

/** Absatz → MP3 (übersetzt in `lang`, gecacht). */
export async function POST(req: Request) {
  try {
    const { text, lang = 'de', voice } = await req.json();
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!clean) return NextResponse.json({ error: 'text fehlt' }, { status: 400 });
    if (clean.length > MAX_CHARS) return NextResponse.json({ error: 'Text zu lang' }, { status: 413 });
    if (!SPEECH_LANGS[lang]) return NextResponse.json({ error: 'Sprache unbekannt' }, { status: 400 });

    const voices = listVoices();
    if (!voices.length) return NextResponse.json({ error: 'Kein TTS-Anbieter konfiguriert' }, { status: 503 });
    const v = voices.find(x => x.id === voice) ?? voices[0];

    const { audio, cached } = await speak(clean, lang, v.id);
    return new NextResponse(new Uint8Array(audio), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400', 'X-TTS-Cached': cached ? '1' : '0' },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'TTS fehlgeschlagen' }, { status: 500 });
  }
}
