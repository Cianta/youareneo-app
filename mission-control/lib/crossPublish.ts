'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Brücke zwischen Task-Kanban ('trinity-kanban-v2') und Eden Canvas
// ('trinity-eden-v2'). Publizieren funktioniert immer von der jeweils anderen
// Seite aus über localStorage — die Zielseite lädt den Stand beim Öffnen.
// ─────────────────────────────────────────────────────────────────────────────

export interface CardComment {
  id: string;
  text: string;
  author?: string;
  ts: string; // ISO
}

export function newComment(text: string, author?: string | null): CardComment {
  return {
    id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: text.trim(),
    author: author ?? undefined,
    ts: new Date().toISOString(),
  };
}

const KANBAN_LS = 'trinity-kanban-v2';
const EDEN_LS   = 'trinity-eden-v2';

// ── Live-Sync ────────────────────────────────────────────────────────────────
// Wenn der Assistent (Chat-Widget) direkt in localStorage schreibt, laden offene
// Kanban-/Eden-Seiten ihren Stand über dieses Event neu.
export const TRINITY_SYNC_EVENT = 'trinity-store-sync';
export function notifyTrinitySync() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TRINITY_SYNC_EVENT));
}

// ── Kanban lesen/schreiben ───────────────────────────────────────────────────
interface KanbanCol { id: string; label: string; color: string; cardIds: string[] }
interface KanbanProj { id: string; name: string; columns: KanbanCol[] }
interface KanbanData {
  projects: KanbanProj[];
  activeProjectId: string;
  cards: Record<string, Record<string, unknown>>;
  connections: unknown[];
  groups?: unknown[];
}

function readKanban(): KanbanData | null {
  try {
    const raw = localStorage.getItem(KANBAN_LS);
    if (!raw) return null;
    const d = JSON.parse(raw) as KanbanData;
    if (!Array.isArray(d.projects)) return null;
    if (!d.cards) d.cards = {};
    return d;
  } catch { return null; }
}

/** Standard-Board, wenn die Tasks-Seite noch nie geöffnet wurde (kein Speicher). */
function defaultKanban(): KanbanData {
  return {
    activeProjectId: 'proj-default',
    projects: [{
      id: 'proj-default', name: 'Mein Board',
      columns: [
        { id: 'col-idee',       label: 'Idee',        color: 'text-violet-300', cardIds: [] },
        { id: 'col-todo',       label: 'To Do',       color: 'text-anth-300',   cardIds: [] },
        { id: 'col-inprogress', label: 'In Progress', color: 'text-amber-300',  cardIds: [] },
        { id: 'col-erledigt',   label: 'Erledigt',    color: 'text-forest-300', cardIds: [] },
      ],
    }],
    cards: {},
    connections: [],
  };
}

/** Alle Kanban-Boards inkl. Spalten (für Dropdowns). */
export function listKanbanProjects(): { id: string; name: string; columns: { id: string; label: string; color: string }[] }[] {
  const d = readKanban();
  if (!d) return [];
  return d.projects.map(p => ({
    id: p.id, name: p.name,
    columns: p.columns.map(c => ({ id: c.id, label: c.label, color: c.color })),
  }));
}

/** Eden-Karte als Task-Karte in ein Kanban-Board publizieren. */
export function publishToKanban(opts: {
  title: string;
  description: string;
  projectId: string;
  columnId: string;
  source: { boardId: string; boardName: string };
  comments?: CardComment[];
}): boolean {
  const d = readKanban();
  if (!d) return false;
  const proj = d.projects.find(p => p.id === opts.projectId);
  const col = proj?.columns.find(c => c.id === opts.columnId);
  if (!proj || !col) return false;
  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  d.cards[id] = {
    id,
    title: opts.title.slice(0, 120),
    description: opts.description,
    priority: 'medium',
    type: 'task',
    tags: [],
    assignedAgent: '',
    attachments: [],
    subtasks: [],
    createdAt: new Date().toISOString(),
    comments: opts.comments ?? [],
    fromCanvas: { boardId: opts.source.boardId, boardName: opts.source.boardName },
  };
  col.cardIds.unshift(id);
  try { localStorage.setItem(KANBAN_LS, JSON.stringify(d)); return true; } catch { return false; }
}

// ── Eden lesen/schreiben ─────────────────────────────────────────────────────
interface EdenData {
  boards: { id: string; name: string }[];
  activeBoardId: string;
  data: Record<string, { cards: Record<string, unknown>[]; connections: unknown[] }>;
}

function readEden(): EdenData | null {
  try {
    const raw = localStorage.getItem(EDEN_LS);
    if (!raw) return null;
    const d = JSON.parse(raw) as EdenData;
    if (!Array.isArray(d.boards)) return null;
    if (!d.data) d.data = {};
    return d;
  } catch { return null; }
}

/** Alle Eden-Boards (für Dropdowns). */
export function listEdenBoards(): { id: string; name: string }[] {
  const d = readEden();
  if (!d) return [{ id: 'board-main', name: 'Mein Canvas' }];
  return d.boards.map(b => ({ id: b.id, name: b.name }));
}

// ── Assistenten-Schreibhelfer (Chat-Widget steuert die Oberfläche) ───────────

/** Neue Task-Karte anlegen. projectId/columnId optional → erstes Board / erste Spalte. */
export function assistantAddKanbanCard(opts: {
  title: string; description?: string; priority?: 'low' | 'medium' | 'high';
  projectId?: string; columnId?: string;
}): { ok: boolean; project?: string; column?: string } {
  const d = readKanban() ?? defaultKanban();
  if (!d.projects.length) return { ok: false };
  const proj = d.projects.find(p => p.id === opts.projectId) ?? d.projects.find(p => p.id === d.activeProjectId) ?? d.projects[0];
  const col = proj.columns.find(c => c.id === opts.columnId) ?? proj.columns[0];
  if (!proj || !col) return { ok: false };
  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  d.cards[id] = {
    id, title: opts.title.slice(0, 120), description: opts.description ?? '',
    priority: opts.priority ?? 'medium', type: 'task', tags: [], assignedAgent: '',
    attachments: [], subtasks: [], createdAt: new Date().toISOString(), comments: [],
  };
  col.cardIds.unshift(id);
  try { localStorage.setItem(KANBAN_LS, JSON.stringify(d)); notifyTrinitySync(); return { ok: true, project: proj.name, column: col.label }; }
  catch { return { ok: false }; }
}

/** Neue Spalte in einem Board anlegen. */
export function assistantAddKanbanColumn(opts: { label: string; color?: string; projectId?: string }): boolean {
  const d = readKanban() ?? defaultKanban();
  if (!d.projects.length) return false;
  const proj = d.projects.find(p => p.id === opts.projectId) ?? d.projects.find(p => p.id === d.activeProjectId) ?? d.projects[0];
  if (!proj) return false;
  proj.columns.push({ id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label: opts.label.slice(0, 40), color: opts.color ?? '#11CAA0', cardIds: [] });
  try { localStorage.setItem(KANBAN_LS, JSON.stringify(d)); notifyTrinitySync(); return true; } catch { return false; }
}

/** Neue Canvas-Karte anlegen. */
export function assistantAddEdenCard(opts: {
  type?: 'note' | 'idea' | 'text' | 'video' | 'website' | 'image';
  title: string; content?: string; url?: string; boardId?: string;
}): boolean {
  let d = readEden();
  if (!d) d = { boards: [{ id: 'board-main', name: 'Mein Canvas' }], activeBoardId: 'board-main', data: {} };
  const boardId = (opts.boardId && d.boards.some(b => b.id === opts.boardId)) ? opts.boardId : d.activeBoardId || d.boards[0]?.id || 'board-main';
  const board = d.data[boardId] ?? { cards: [], connections: [] };
  const idx = board.cards.length;
  const col = idx % 3, row = Math.floor(idx / 3);
  const type = opts.type ?? 'note';
  const media = type === 'video' || type === 'website' || type === 'image';
  board.cards.push({
    id: `c${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, title: opts.title.slice(0, 120), content: opts.content ?? '', url: opts.url,
    x: 60 + col * 330, y: 60 + row * 210, w: media ? 300 : 280, h: media ? 250 : 150, comments: [],
  });
  d.data[boardId] = board;
  try { localStorage.setItem(EDEN_LS, JSON.stringify(d)); notifyTrinitySync(); return true; } catch { return false; }
}

/** Task-Karte als Canvas-Karte in ein Eden-Board publizieren (links oben). */
export function publishToEden(opts: {
  title: string;
  content: string;
  boardId: string;
  status: { label: string; color: string }; // Spaltenname + Akzentfarbe (hex)
  source: { projectId: string; projectName: string };
  comments?: CardComment[];
}): boolean {
  let d = readEden();
  if (!d) {
    d = { boards: [{ id: 'board-main', name: 'Mein Canvas' }], activeBoardId: 'board-main', data: {} };
  }
  if (!d.boards.some(b => b.id === opts.boardId)) return false;
  const board = d.data[opts.boardId] ?? { cards: [], connections: [] };
  // Links oben platzieren, leicht versetzt je nach vorhandenen publizierten Karten
  const offset = board.cards.length % 5;
  board.cards.unshift({
    id: `c${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'note',
    title: opts.title.slice(0, 120),
    content: opts.content,
    x: 40 + offset * 26,
    y: 40 + offset * 26,
    w: 280, h: 150,
    comments: opts.comments ?? [],
    fromTask: {
      projectId: opts.source.projectId,
      projectName: opts.source.projectName,
      status: opts.status.label,
      color: opts.status.color,
    },
  });
  d.data[opts.boardId] = board;
  try { localStorage.setItem(EDEN_LS, JSON.stringify(d)); return true; } catch { return false; }
}
