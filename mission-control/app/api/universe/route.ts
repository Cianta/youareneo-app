import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateId } from '@/lib/utils';
import { saveMemoryEntry, addTeamLog } from '@/lib/db';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { title, content, tags = [] } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'content is required' }, { status: 400 });
    }

    const slug = title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : `entry-${Date.now()}`;
    const filename = `${slug}.md`;
    const now = new Date().toISOString();

    const mdContent = `---
title: ${title || slug}
created: ${now}
tags: [${tags.join(', ')}]
source: trinity-os
---

# ${title || slug}

${content.trim()}
`;

    // ── 1. Write to Obsidian Vault ────────────────────────────────────────────
    let obsidianPath: string | undefined;
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH;

    if (vaultPath) {
      try {
        const trinityDir = path.join(vaultPath, 'TRINITY OS');
        if (!fs.existsSync(trinityDir)) fs.mkdirSync(trinityDir, { recursive: true });
        const fullPath = path.join(trinityDir, filename);
        fs.writeFileSync(fullPath, mdContent, 'utf-8');
        obsidianPath = `TRINITY OS/${filename}`;
        addTeamLog('system', `📁 Written to Obsidian: ${obsidianPath}`, 'success');
      } catch (err) {
        console.error('[Universe] Obsidian write failed:', err);
      }
    } else {
      // Fallback: write to local data/vault directory
      const localVault = path.join(process.cwd(), 'data', 'vault');
      if (!fs.existsSync(localVault)) fs.mkdirSync(localVault, { recursive: true });
      fs.writeFileSync(path.join(localVault, filename), mdContent, 'utf-8');
      obsidianPath = `data/vault/${filename}`;
    }

    // ── 2. Save to Shared Memory ──────────────────────────────────────────────
    saveMemoryEntry({
      key: `universe:${slug}`,
      value: content.trim().slice(0, 500),
      sourceAgent: 'universe',
      type: 'context',
      tags: ['universe', 'vault', ...(tags as string[])],
      sharedWith: ['*'],
    });

    // ── 3. Push to Notion ────────────────────────────────────────────────────
    let notionUrl: string | undefined;
    const notionKey = process.env.NOTION_API_KEY;
    const notionDbId = process.env.NOTION_DATABASE_ID;

    if (notionKey && notionDbId) {
      try {
        const notionRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { database_id: notionDbId },
            properties: {
              title: {
                title: [{ type: 'text', text: { content: title || slug } }],
              },
            },
            children: [
              {
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: title || slug } }] },
              },
              ...content
                .trim()
                .split('\n\n')
                .filter((p: string) => p.trim())
                .slice(0, 10) // Notion block limit
                .map((para: string) => ({
                  object: 'block',
                  type: 'paragraph',
                  paragraph: {
                    rich_text: [{ type: 'text', text: { content: para.trim().slice(0, 2000) } }],
                  },
                })),
            ],
          }),
        });

        if (notionRes.ok) {
          const notionData = await notionRes.json();
          notionUrl = notionData.url;
          addTeamLog('system', `📖 Synced to Notion: ${title || slug}`, 'success');
        } else {
          const err = await notionRes.text();
          console.error('[Universe] Notion push failed:', err);
        }
      } catch (err) {
        console.error('[Universe] Notion error:', err);
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        filename,
        obsidianPath,
        notionUrl,
        obsidianConfigured: !!vaultPath,
        notionConfigured: !!(notionKey && notionDbId),
      },
      message: [
        obsidianPath ? `✓ Obsidian: ${obsidianPath}` : '⚠ Obsidian: not configured (saved to data/vault)',
        notionUrl    ? `✓ Notion synced`              : '⚠ Notion: not configured',
      ].join(' · '),
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  // List vault entries
  const localVault = path.join(process.cwd(), 'data', 'vault');
  if (!fs.existsSync(localVault)) {
    return NextResponse.json<ApiResponse>({ success: true, data: [] });
  }
  const files = fs.readdirSync(localVault)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(localVault, f), 'utf-8');
      const titleMatch = content.match(/^title:\s*(.+)$/m);
      const createdMatch = content.match(/^created:\s*(.+)$/m);
      return {
        filename: f,
        title: titleMatch?.[1] ?? f.replace('.md', ''),
        created: createdMatch?.[1] ?? '',
        preview: content.split('\n').filter(l => !l.startsWith('---') && !l.startsWith('#') && l.trim()).slice(0, 2).join(' ').slice(0, 120),
      };
    });
  return NextResponse.json<ApiResponse>({ success: true, data: files });
}
