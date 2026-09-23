import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Integrations-Proxy für Todoist & Trello (Self-Seite).
// Läuft serverseitig, damit keine CORS-Probleme entstehen und die Tokens nicht
// an fremde Origins aus dem Browser gesendet werden müssen.
//
// POST body:
//   { provider: 'todoist', token, action: 'test' }
//   { provider: 'todoist', token, action: 'addTask', content, description? }
//   { provider: 'trello',  key, token, action: 'test' }
//   { provider: 'trello',  key, token, action: 'listBoards' }
//   { provider: 'trello',  key, token, action: 'listLists', boardId }
//   { provider: 'trello',  key, token, action: 'addCard', listId, name, desc? }
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { provider, action } = body;

  try {
    if (provider === 'todoist') {
      const token = body.token?.trim();
      if (!token) return NextResponse.json({ error: 'Todoist-Token fehlt' }, { status: 400 });
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      if (action === 'test') {
        const r = await fetch('https://api.todoist.com/rest/v2/projects', { headers });
        if (!r.ok) return NextResponse.json({ error: `Todoist: ${r.status}` }, { status: 502 });
        const projects = await r.json();
        return NextResponse.json({ ok: true, projects: projects.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) });
      }
      if (action === 'addTask') {
        const r = await fetch('https://api.todoist.com/rest/v2/tasks', {
          method: 'POST', headers,
          body: JSON.stringify({ content: body.content, description: body.description ?? '' }),
        });
        if (!r.ok) return NextResponse.json({ error: `Todoist: ${r.status} ${await r.text()}` }, { status: 502 });
        return NextResponse.json({ ok: true, task: await r.json() });
      }
    }

    if (provider === 'trello') {
      const key = body.key?.trim(), token = body.token?.trim();
      if (!key || !token) return NextResponse.json({ error: 'Trello Key/Token fehlt' }, { status: 400 });
      const auth = `key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;

      if (action === 'test' || action === 'listBoards') {
        const r = await fetch(`https://api.trello.com/1/members/me/boards?fields=id,name&${auth}`);
        if (!r.ok) return NextResponse.json({ error: `Trello: ${r.status}` }, { status: 502 });
        return NextResponse.json({ ok: true, boards: await r.json() });
      }
      if (action === 'listLists') {
        const r = await fetch(`https://api.trello.com/1/boards/${encodeURIComponent(body.boardId)}/lists?fields=id,name&${auth}`);
        if (!r.ok) return NextResponse.json({ error: `Trello: ${r.status}` }, { status: 502 });
        return NextResponse.json({ ok: true, lists: await r.json() });
      }
      if (action === 'addCard') {
        const r = await fetch(`https://api.trello.com/1/cards?idList=${encodeURIComponent(body.listId)}&name=${encodeURIComponent(body.name)}&desc=${encodeURIComponent(body.desc ?? '')}&${auth}`, { method: 'POST' });
        if (!r.ok) return NextResponse.json({ error: `Trello: ${r.status} ${await r.text()}` }, { status: 502 });
        return NextResponse.json({ ok: true, card: await r.json() });
      }
    }

    return NextResponse.json({ error: 'Unbekannte provider/action-Kombination' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Proxy-Fehler' }, { status: 500 });
  }
}
