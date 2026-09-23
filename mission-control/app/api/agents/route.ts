import { NextResponse } from 'next/server';
import { getAgents, saveAgent, updateAgentStatus } from '@/lib/db';
import { pingAgent } from '@/lib/agents/base';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agents = getAgents();
    return NextResponse.json<ApiResponse>({ success: true, data: agents });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ping action
    if (body.action === 'ping') {
      const agents = getAgents();
      const results: Record<string, boolean> = {};
      await Promise.allSettled(
        agents.map(async (agent) => {
          const ok = await pingAgent(agent);
          results[agent.id] = ok;
          updateAgentStatus(agent.id, ok ? 'online' : 'offline', { lastSeen: new Date().toISOString() });
        })
      );
      return NextResponse.json<ApiResponse>({ success: true, data: results });
    }

    // Ping single agent
    if (body.action === 'ping-one' && body.agentId) {
      const agents = getAgents();
      const agent = agents.find(a => a.id === body.agentId);
      if (!agent) return NextResponse.json<ApiResponse>({ success: false, error: 'Agent not found' }, { status: 404 });
      const ok = await pingAgent(agent);
      updateAgentStatus(agent.id, ok ? 'online' : 'offline', { lastSeen: new Date().toISOString() });
      return NextResponse.json<ApiResponse>({ success: true, data: { online: ok } });
    }

    // Save/update agent config
    if (body.agent) {
      saveAgent(body.agent);
      return NextResponse.json<ApiResponse>({ success: true, data: body.agent });
    }

    return NextResponse.json<ApiResponse>({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
