import { NextResponse } from 'next/server';
import { getMemory, saveMemoryEntry, deleteMemoryEntry, searchMemory } from '@/lib/db';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const agentId = searchParams.get('agent') ?? undefined;

    const entries = q ? searchMemory(q, agentId) : getMemory();
    return NextResponse.json<ApiResponse>({ success: true, data: entries });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = saveMemoryEntry({
      key: body.key,
      value: body.value,
      sourceAgent: body.sourceAgent ?? 'user',
      type: body.type ?? 'fact',
      tags: body.tags ?? [],
      sharedWith: body.sharedWith ?? ['*'],
      pinned: body.pinned ?? false,
    });
    return NextResponse.json<ApiResponse>({ success: true, data: entry });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json<ApiResponse>({ success: false, error: 'Missing id' }, { status: 400 });
    deleteMemoryEntry(id);
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
