import { NextResponse } from 'next/server';
import { getTask, saveTask, deleteTask } from '@/lib/db';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) return NextResponse.json<ApiResponse>({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json<ApiResponse>({ success: true, data: task });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const task = saveTask({ id, ...updates });
    return NextResponse.json<ApiResponse>({ success: true, data: task });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteTask(id);
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
