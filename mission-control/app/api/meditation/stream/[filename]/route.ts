/**
 * TRINITY OS · Meditation Audio Stream
 * GET /api/meditation/stream/[filename]
 * Streams local audio files with range-request support for seekable playback.
 * Files are stored in <project-root>/uploads/meditation/
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'meditation');

const MIME: Record<string, string> = {
  mp3:  'audio/mpeg',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  m4a:  'audio/mp4',
  flac: 'audio/flac',
  aac:  'audio/aac',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Basic path-traversal guard
  const safe = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safe);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const ext  = safe.split('.').pop()?.toLowerCase() ?? 'mp3';
  const mime = MIME[ext] ?? 'audio/mpeg';
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const rangeHeader = req.headers.get('range');

  if (rangeHeader) {
    // Honour Range: bytes=start-end for seek support
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });
    // Convert Node.js ReadStream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data',  (chunk) => controller.enqueue(chunk));
        stream.on('end',   ()      => controller.close());
        stream.on('error', (err)   => controller.error(err));
      },
      cancel() { stream.destroy(); },
    });

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type':   mime,
        'Cache-Control':  'no-cache',
      },
    });
  }

  // Full file response
  const stream = fs.createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data',  (chunk) => controller.enqueue(chunk));
      stream.on('end',   ()      => controller.close());
      stream.on('error', (err)   => controller.error(err));
    },
    cancel() { stream.destroy(); },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type':   mime,
      'Accept-Ranges':  'bytes',
      'Cache-Control':  'no-cache',
    },
  });
}
