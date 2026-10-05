/**
 * Vorlese-Dienst (Server) — Übersetzen + TTS mit dauerhaftem Cache.
 * Jeder Absatz wird pro (Text, Sprache, Stimme) nur EINMAL bezahlt:
 *   1. lokaler Cache  DATA_DIR/tts-cache/<hash>.mp3
 *   2. optionaler Spiegel in kDrive (WebDAV) → überlebt Container-Neustarts
 * Server-only.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const CACHE_DIR = path.join(DATA_DIR, 'tts-cache');

export const SPEECH_LANGS: Record<string, { name: string; locale: string }> = {
  de: { name: 'Deutsch', locale: 'de-DE' },
  en: { name: 'English', locale: 'en-US' },
  es: { name: 'Español', locale: 'es-ES' },
  fr: { name: 'Français', locale: 'fr-FR' },
  it: { name: 'Italiano', locale: 'it-IT' },
  pt: { name: 'Português', locale: 'pt-PT' },
  nl: { name: 'Nederlands', locale: 'nl-NL' },
  ru: { name: 'Русский', locale: 'ru-RU' },
  tr: { name: 'Türkçe', locale: 'tr-TR' },
  ar: { name: 'العربية', locale: 'ar-SA' },
  hi: { name: 'हिन्दी', locale: 'hi-IN' },
  ja: { name: '日本語', locale: 'ja-JP' },
  zh: { name: '中文', locale: 'zh-CN' },
};

export interface SpeechVoice { id: string; label: string; provider: 'elevenlabs' | 'openai' }

const OPENAI_VOICES = ['nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx'];

/** Verfügbare Stimmen. ELEVENLABS_VOICES="Name:voiceId,Name2:voiceId2" erweitert die Liste. */
export function listVoices(): SpeechVoice[] {
  const out: SpeechVoice[] = [];
  if (process.env.ELEVENLABS_API_KEY) {
    const extra = (process.env.ELEVENLABS_VOICES ?? '').split(',').map(s => s.trim()).filter(Boolean);
    for (const e of extra) {
      const [label, id] = e.split(':');
      if (label && id) out.push({ id: `el:${id}`, label: `${label} (ElevenLabs)`, provider: 'elevenlabs' });
    }
    if (process.env.ELEVENLABS_VOICE_ID) {
      out.push({ id: `el:${process.env.ELEVENLABS_VOICE_ID}`, label: 'Standard (ElevenLabs)', provider: 'elevenlabs' });
    }
  }
  if (process.env.OPENAI_API_KEY) {
    for (const v of OPENAI_VOICES) out.push({ id: `oa:${v}`, label: `${v} (OpenAI)`, provider: 'openai' });
  }
  return out;
}

export const hasServerTts = () => listVoices().length > 0;

const hash = (...parts: string[]) =>
  crypto.createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 40);

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// ── kDrive (WebDAV) — optional ────────────────────────────────────────────────
// KDRIVE_WEBDAV_URL=https://<id>.connect.kdrive.infomaniak.com/Trinity/tts   (Ordner muss existieren)
// KDRIVE_USER=…  KDRIVE_PASSWORD=… (App-Passwort)
function kdriveAuth() {
  const url = process.env.KDRIVE_WEBDAV_URL;
  const user = process.env.KDRIVE_USER;
  const pass = process.env.KDRIVE_PASSWORD;
  if (!url || !user || !pass) return null;
  return { url: url.replace(/\/$/, ''), auth: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64') };
}

async function kdriveGet(name: string): Promise<Buffer | null> {
  const k = kdriveAuth();
  if (!k) return null;
  try {
    const r = await fetch(`${k.url}/${name}`, { headers: { Authorization: k.auth } });
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch { return null; }
}

function kdrivePut(name: string, data: Buffer) {
  const k = kdriveAuth();
  if (!k) return;
  fetch(`${k.url}/${name}`, {
    method: 'PUT', headers: { Authorization: k.auth, 'Content-Type': 'audio/mpeg' },
    body: new Uint8Array(data),
  }).catch(() => { /* Spiegel ist best-effort */ });
}

// ── Übersetzung ───────────────────────────────────────────────────────────────
async function translate(text: string, lang: string): Promise<string> {
  const target = SPEECH_LANGS[lang]?.name ?? lang;
  const prompt =
    `Translate the text into ${target}. If it is already in ${target}, return it unchanged. ` +
    `Output ONLY the resulting text, no comments, no quotes.\n\n${text}`;

  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.SPEECH_TRANSLATE_MODEL_ANTHROPIC ?? 'claude-haiku-4-5-20251001',
        max_tokens: 2048, messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (r.ok) {
      const j = await r.json();
      const t = j?.content?.[0]?.text;
      if (t) return String(t).trim();
    }
  }
  if (process.env.OPENAI_API_KEY) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.SPEECH_TRANSLATE_MODEL_OPENAI ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (r.ok) {
      const j = await r.json();
      const t = j?.choices?.[0]?.message?.content;
      if (t) return String(t).trim();
    }
  }
  return text; // keine Übersetzung möglich → Original vorlesen
}

async function cachedTranslate(text: string, lang: string): Promise<string> {
  ensureDir();
  const fp = path.join(CACHE_DIR, `${hash('tr', lang, text)}.txt`);
  if (fs.existsSync(fp)) return fs.readFileSync(fp, 'utf-8');
  const out = await translate(text, lang);
  if (out !== text) fs.writeFileSync(fp, out);
  return out;
}

// ── TTS ───────────────────────────────────────────────────────────────────────
async function synthesize(text: string, voiceId: string): Promise<Buffer> {
  const [prov, id] = [voiceId.slice(0, 2), voiceId.slice(3)];
  if (prov === 'el') {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY ?? '', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: id, input: text, response_format: 'mp3' }),
  });
  if (!r.ok) throw new Error(`OpenAI TTS ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Liefert MP3 für (Text → Sprache → Stimme); bezahlt wird nur beim ersten Mal. */
export async function speak(text: string, lang: string, voiceId: string): Promise<{ audio: Buffer; cached: boolean }> {
  ensureDir();
  const name = `${hash('mp3', lang, voiceId, text)}.mp3`;
  const fp = path.join(CACHE_DIR, name);

  if (fs.existsSync(fp)) return { audio: fs.readFileSync(fp), cached: true };

  const remote = await kdriveGet(name);
  if (remote) { fs.writeFileSync(fp, remote); return { audio: remote, cached: true }; }

  const spoken = await cachedTranslate(text, lang);
  const audio = await synthesize(spoken, voiceId);
  fs.writeFileSync(fp, audio);
  kdrivePut(name, audio);
  return { audio, cached: false };
}
