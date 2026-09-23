import { NextResponse } from 'next/server';
import { getAgent } from '@/lib/db';
import { dispatchChat } from '@/lib/agents/base';
import type { ApiResponse, KeywordData } from '@/types';

export const dynamic = 'force-dynamic';

// SEO keyword research using AI + optional SERP API
export async function POST(req: Request) {
  try {
    const { query, action, draft, domains, agent: agentId = 'hermes' } = await req.json();

    if (action === 'research') {
      // Try SERP API first
      const serpKey = process.env.SERP_API_KEY;
      let serpResults: KeywordData[] = [];

      if (serpKey && query) {
        try {
          const serpRes = await fetch(
            `https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${serpKey}&engine=google&num=10`
          );
          const serpData = await serpRes.json();
          // Extract related searches
          const related = serpData.related_searches ?? [];
          serpResults = related.map((r: { query: string }) => ({
            id: Math.random().toString(36).slice(2),
            keyword: r.query,
            tags: [query],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        } catch { /* SERP API not available */ }
      }

      // Use AI to enrich / generate keyword ideas
      const agent = getAgent('hermes') ?? getAgent('claude');
      if (!agent) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'No AI agent configured' }, { status: 503 });
      }

      const systemPrompt = `You are an expert SEO strategist. When given a keyword or topic, return a JSON array of keyword research results.
Each result must have: keyword (string), volume (number, estimated monthly searches), difficulty (0-100), intent ("informational"|"commercial"|"transactional"|"navigational"), suggestions (array of 3-5 related keywords).
Return ONLY valid JSON, no markdown, no commentary. Array of 5-8 objects.`;

      const aiResponse = await dispatchChat({
        agent: { ...agent, systemPrompt, temperature: 0.3 },
        messages: [{
          id: 'seo-research',
          role: 'user',
          content: `Keyword research for: "${query}". Return 6 keywords with volume, difficulty, intent, and suggestions. JSON only.`,
          agentId: agent.id,
          timestamp: new Date().toISOString(),
        }],
        injectMemory: false,
      });

      let results = [];
      try {
        const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        results = JSON.parse(cleaned);
      } catch {
        results = [{ keyword: query, intent: 'informational', suggestions: [query + ' guide', query + ' tips', 'how to ' + query] }];
      }

      return NextResponse.json<ApiResponse>({ success: true, data: results });
    }

    if (action === 'generate') {
      const agent = getAgent(agentId) ?? getAgent('claude');
      if (!agent) return NextResponse.json<ApiResponse>({ success: false, error: 'No agent' }, { status: 503 });

      const content = await dispatchChat({
        agent: {
          ...agent,
          systemPrompt: 'You are an expert SEO content writer. Write compelling, SEO-optimised content that ranks on Google and converts readers.',
          temperature: 0.7,
        },
        messages: [{
          id: 'seo-gen',
          role: 'user',
          content: `Write a comprehensive blog post titled and optimised for the keyword: "${query}". Include: a compelling H1 title, an intro hook, 3-4 H2 sections with rich content, and a strong CTA. Make it ~800 words. Format as plain text.`,
          agentId: agent.id,
          timestamp: new Date().toISOString(),
        }],
        injectMemory: true,
      });

      const titleMatch = content.match(/^#?\s*(.+?)[\n\r]/);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          title: titleMatch?.[1]?.replace(/^#+\s*/, '') ?? `Guide: ${query}`,
          content,
          keyword: query,
        },
      });
    }

    if (action === 'deploy') {
      // In production this would POST to CMS APIs / WordPress / Ghost / etc.
      // For now it logs the deployment
      console.log(`[SEO] Deploying "${draft?.title}" to: ${domains?.join(', ')}`);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: `Scheduled deployment to ${domains?.length ?? 0} domain(s)`,
      });
    }

    return NextResponse.json<ApiResponse>({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
