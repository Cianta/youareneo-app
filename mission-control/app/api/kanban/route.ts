import { NextResponse } from 'next/server';
import { getTasks, saveTask, getKanban } from '@/lib/db';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const board = getKanban();
    return NextResponse.json<ApiResponse>({ success: true, data: board });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = saveTask(body);
    return NextResponse.json<ApiResponse>({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
