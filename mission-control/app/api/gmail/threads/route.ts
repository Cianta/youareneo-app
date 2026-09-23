/**
 * TRINITY OS · Gmail Threads API
 * ─────────────────────────────────
 * Serves cached Gmail thread data fetched via the Gmail MCP.
 * Supports filtering by label (inbox, unread, starred, sent, all).
 *
 * GET /api/gmail/threads?filter=inbox&limit=20
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'gmail-threads.json');

export interface GmailMessage {
  id: string;
  threadId: string;
  date: string;
  sender: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  toRecipients: string[];
  labelIds: string[];
  body?: string;
}

export interface GmailThread {
  id: string;
  messages: GmailMessage[];
  lastDate: string;
  subject: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
}

function parseSender(sender: string): { name: string; email: string } {
  const match = sender.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: sender.split('@')[0], email: sender };
}

async function readCache(): Promise<GmailThread[]> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const filter = req.nextUrl.searchParams.get('filter') ?? 'all';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10);

  let threads = await readCache();

  // Filter
  switch (filter) {
    case 'inbox':
      threads = threads.filter(t => t.labels.includes('INBOX'));
      break;
    case 'unread':
      threads = threads.filter(t => t.isUnread);
      break;
    case 'starred':
      threads = threads.filter(t => t.isStarred);
      break;
    case 'important':
      threads = threads.filter(t => t.isImportant);
      break;
    case 'sent':
      threads = threads.filter(t => t.labels.includes('SENT'));
      break;
  }

  // Sort newest first
  threads.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

  return NextResponse.json({
    ok: true,
    filter,
    total: threads.length,
    threads: threads.slice(0, limit),
  });
}

// POST /api/gmail/threads — update cache with new thread data (called by scripts/refresh)
export async function POST(req: NextRequest) {
  try {
    const { threads } = await req.json() as { threads: GmailThread[] };
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(threads, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, cached: threads.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
