import { NextResponse } from 'next/server';
import { getAgent, getShopifyDrafts, saveShopifyDraft } from '@/lib/db';
import { dispatchChat } from '@/lib/agents/base';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const drafts = getShopifyDrafts();
  return NextResponse.json<ApiResponse>({ success: true, data: drafts });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── Generate Content ──────────────────────────────────────────────────────
    if (body.action === 'generate') {
      const { type, title, brief, agent: agentId = 'claude', tone = 'professional' } = body;
      const agent = getAgent(agentId) ?? getAgent('claude');
      if (!agent) return NextResponse.json<ApiResponse>({ success: false, error: 'No AI agent configured' }, { status: 503 });

      const prompts: Record<string, string> = {
        product: `Write a compelling Shopify product description for: "${title}".
Brief: ${brief}
Tone: ${tone}
Requirements:
- Start with a powerful hook (1-2 sentences)
- 3-4 benefit-focused bullet points
- 1 paragraph of social proof / context
- Strong closing CTA
- Optimised for SEO with natural keyword use
- ~300-400 words`,
        blog: `Write a complete Shopify blog post for: "${title}".
Brief: ${brief}
Tone: ${tone}
Requirements:
- SEO-optimised H1 title
- Compelling intro (problem → promise)
- 4-5 H2 sections with actionable content
- Real examples and specific numbers
- Strong CTA at the end
- ~800-1000 words`,
        page: `Write copy for a Shopify page: "${title}".
Brief: ${brief}
Tone: ${tone}
Requirements:
- Clear value proposition
- About/mission statement
- Trust signals and social proof
- Contact or next-step CTA
- ~400-600 words`,
      };

      const content = await dispatchChat({
        agent: {
          ...agent,
          systemPrompt: `You are an expert Shopify copywriter specialising in academy and digital education brands. Write content that sells with authenticity and drives conversions. Always write in a ${tone} tone.`,
          temperature: 0.72,
        },
        messages: [{
          id: 'shopify-gen',
          role: 'user',
          content: prompts[type] ?? prompts.product,
          agentId: agent.id,
          timestamp: new Date().toISOString(),
        }],
        injectMemory: true,
      });

      const draft = saveShopifyDraft({
        type,
        title,
        content,
        status: 'draft',
        agentId: agent.id,
        tags: brief.split(' ').filter((w: string) => w.length > 5).slice(0, 5),
      });

      return NextResponse.json<ApiResponse>({ success: true, data: draft });
    }

    // ── Publish to Shopify ────────────────────────────────────────────────────
    if (body.action === 'publish') {
      const { draftId } = body;
      const drafts = getShopifyDrafts();
      const draft = drafts.find(d => d.id === draftId);
      if (!draft) return NextResponse.json<ApiResponse>({ success: false, error: 'Draft not found' }, { status: 404 });

      const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
      const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

      if (!storeDomain || !adminToken) {
        // Simulate publish (no real Shopify configured)
        const updated = saveShopifyDraft({
          ...draft,
          status: 'published',
          publishedAt: new Date().toISOString(),
          shopifyId: `sim-${Date.now()}`,
        });
        return NextResponse.json<ApiResponse>({ success: true, data: updated, message: 'Simulated (no Shopify credentials)' });
      }

      // Real Shopify API call
      const shopifyEndpoints: Record<string, string> = {
        product: `https://${storeDomain}/admin/api/2024-01/products.json`,
        blog:    `https://${storeDomain}/admin/api/2024-01/blogs/news/articles.json`,
        page:    `https://${storeDomain}/admin/api/2024-01/pages.json`,
      };

      const payloads: Record<string, unknown> = {
        product: { product: { title: draft.title, body_html: draft.content, published: true } },
        blog:    { article: { title: draft.title, body_html: draft.content, published: true } },
        page:    { page: { title: draft.title, body_html: draft.content } },
      };

      const shopifyRes = await fetch(shopifyEndpoints[draft.type] ?? shopifyEndpoints.page, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify(payloads[draft.type]),
      });

      if (!shopifyRes.ok) {
        const err = await shopifyRes.text();
        saveShopifyDraft({ ...draft, status: 'failed' });
        return NextResponse.json<ApiResponse>({ success: false, error: err }, { status: 502 });
      }

      const shopifyData = await shopifyRes.json();
      const shopifyId = shopifyData.product?.id ?? shopifyData.article?.id ?? shopifyData.page?.id;

      const updated = saveShopifyDraft({
        ...draft,
        status: 'published',
        shopifyId: String(shopifyId),
        publishedAt: new Date().toISOString(),
      });

      return NextResponse.json<ApiResponse>({ success: true, data: updated });
    }

    return NextResponse.json<ApiResponse>({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}
