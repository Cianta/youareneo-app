import { NextResponse } from 'next/server';
import { getAgent, updateAgentStatus, addTeamLog } from '@/lib/db';
import { dispatchStream } from '@/lib/agents/base';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 2 minutes for long responses

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) {
    return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
  }

  try {
    const { messages } = await req.json();
    updateAgentStatus(agent.id, 'busy');

    // Create a streaming response using SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of dispatchStream({ agent, messages, injectMemory: true })) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          updateAgentStatus(agent.id, 'online', { lastSeen: new Date().toISOString() });
          addTeamLog(agent.id, `Completed chat response for conversation.`, 'info');
        } catch (error) {
          const errMsg = String(error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
          updateAgentStatus(agent.id, 'error');
          addTeamLog(agent.id, `Chat error: ${errMsg.slice(0, 100)}`, 'error');
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    updateAgentStatus(agent.id, 'error');
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
