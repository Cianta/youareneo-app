import { NextResponse } from 'next/server';
import { getNotebook, saveNotebookEntry } from '@/lib/db';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = getNotebook();
  return NextResponse.json<ApiResponse>({ success: true, data: entries });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.date) return NextResponse.json<ApiResponse>({ success: false, error: 'date required' }, { status: 400 });
    const entry = saveNotebookEntry(body);
    return NextResponse.json<ApiResponse>({ success: true, data: entry });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
