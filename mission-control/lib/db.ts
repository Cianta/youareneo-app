/**
 * File-based database — uses JSON files in ./data/
 * Zero setup, works locally and in Docker volumes.
 * Server-only module (not imported in client components).
 */
import fs from 'fs';
import path from 'path';
import { generateId } from './utils';
import type {
  AgentConfig, KanbanBoard, KanbanTask,
  MemoryEntry, NotebookEntry, ShopifyDraft, MediaJob,
} from '@/types';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');

// ── Helpers ───────────────────────────────────────────────────────────────────

function filePath(name: string) {
  return path.join(DATA_DIR, name);
}

function readJson<T>(name: string, fallback: T): T {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(name: string, data: unknown): void {
  const fp = filePath(name);
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

// ── Agents ────────────────────────────────────────────────────────────────────

export function getAgents(): AgentConfig[] {
  return readJson<AgentConfig[]>('agents.json', []);
}

export function getAgent(id: string): AgentConfig | undefined {
  return getAgents().find(a => a.id === id);
}

export function updateAgentStatus(
  id: string,
  status: AgentConfig['status'],
  extras: Partial<AgentConfig> = {}
): void {
  const agents = getAgents();
  const idx = agents.findIndex(a => a.id === id);
  if (idx === -1) return;
  agents[idx] = {
    ...agents[idx],
    ...extras,
    status,
    updatedAt: new Date().toISOString(),
  };
  writeJson('agents.json', agents);
}

export function saveAgent(agent: AgentConfig): void {
  const agents = getAgents();
  const idx = agents.findIndex(a => a.id === agent.id);
  if (idx === -1) {
    agents.push({ ...agent, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  } else {
    agents[idx] = { ...agent, updatedAt: new Date().toISOString() };
  }
  writeJson('agents.json', agents);
}

// ── Kanban ────────────────────────────────────────────────────────────────────

export function getKanban(): KanbanBoard {
  return readJson<KanbanBoard>('kanban.json', {
    columns: [
      { id: 'backlog',     label: 'Backlog',    color: 'anth-600' },
      { id: 'todo',        label: 'To Do',      color: 'forest-700' },
      { id: 'in-progress', label: 'In Progress', color: 'gold' },
      { id: 'review',      label: 'Review',     color: 'forest-500' },
      { id: 'done',        label: 'Done',       color: 'forest-400' },
    ],
    tasks: [],
    updatedAt: new Date().toISOString(),
  });
}

export function getTasks(): KanbanTask[] {
  return getKanban().tasks;
}

export function getTask(id: string): KanbanTask | undefined {
  return getTasks().find(t => t.id === id);
}

export function saveTask(task: Partial<KanbanTask> & { id?: string }): KanbanTask {
  const board = getKanban();
  const now = new Date().toISOString();
  const existing = task.id ? board.tasks.findIndex(t => t.id === task.id) : -1;

  if (existing !== -1) {
    board.tasks[existing] = {
      ...board.tasks[existing],
      ...task,
      updatedAt: now,
    } as KanbanTask;
    writeJson('kanban.json', { ...board, updatedAt: now });
    return board.tasks[existing];
  }

  const newTask: KanbanTask = {
    id: generateId('task'),
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    type: 'content',
    tags: [],
    subtasks: [],
    createdAt: now,
    updatedAt: now,
    createdBy: 'user',
    linkedMemoryIds: [],
    ...task,
  };
  board.tasks.push(newTask);
  writeJson('kanban.json', { ...board, updatedAt: now });
  return newTask;
}

export function deleteTask(id: string): void {
  const board = getKanban();
  board.tasks = board.tasks.filter(t => t.id !== id);
  board.updatedAt = new Date().toISOString();
  writeJson('kanban.json', board);
}

// ── Memory ────────────────────────────────────────────────────────────────────

export function getMemory(): MemoryEntry[] {
  const memDir = path.join(DATA_DIR, 'memory');
  if (!fs.existsSync(memDir)) return [];
  const files = fs.readdirSync(memDir).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(memDir, f), 'utf-8')));
}

export function getMemoryEntry(id: string): MemoryEntry | undefined {
  const fp = path.join(DATA_DIR, 'memory', `${id}.json`);
  if (!fs.existsSync(fp)) return undefined;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function saveMemoryEntry(entry: Partial<MemoryEntry> & { key: string; value: string; sourceAgent: string }): MemoryEntry {
  const now = new Date().toISOString();
  const existing = getMemory().find(m => m.key === entry.key);
  const id = existing?.id ?? generateId('mem');

  const full: MemoryEntry = {
    id,
    tags: [],
    type: 'fact',
    sharedWith: ['*'],
    accessCount: 0,
    pinned: false,
    createdAt: existing?.createdAt ?? now,
    ...existing,
    ...entry,
    updatedAt: now,
  };

  const memDir = path.join(DATA_DIR, 'memory');
  if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(path.join(memDir, `${id}.json`), JSON.stringify(full, null, 2));
  return full;
}

export function deleteMemoryEntry(id: string): void {
  const fp = path.join(DATA_DIR, 'memory', `${id}.json`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

export function searchMemory(query: string, agentId?: string): MemoryEntry[] {
  const all = getMemory();
  const q = query.toLowerCase();
  return all.filter(m => {
    const accessible = m.sharedWith.includes('*') || (agentId ? m.sharedWith.includes(agentId) : true);
    const matches = m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q));
    return accessible && matches;
  });
}

// ── Notebook ──────────────────────────────────────────────────────────────────

export function getNotebook(): NotebookEntry[] {
  return readJson<NotebookEntry[]>('notebook.json', []);
}

export function getTodayNotebook(): NotebookEntry | undefined {
  const today = new Date().toISOString().slice(0, 10);
  return getNotebook().find(n => n.date === today);
}

export function saveNotebookEntry(entry: Partial<NotebookEntry> & { date: string }): NotebookEntry {
  const entries = getNotebook();
  const now = new Date().toISOString();
  const idx = entries.findIndex(e => e.date === entry.date);

  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...entry, updatedAt: now };
    writeJson('notebook.json', entries);
    return entries[idx];
  }

  const newEntry: NotebookEntry = {
    id: generateId('nb'),
    goals: [],
    journal: '',
    teamLogs: [],
    createdAt: now,
    updatedAt: now,
    ...entry,
  };
  entries.unshift(newEntry);
  writeJson('notebook.json', entries);
  return newEntry;
}

export function addTeamLog(
  agentId: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = getTodayNotebook() ?? { date: today };
  const updated = {
    ...entry,
    teamLogs: [
      ...((entry as NotebookEntry).teamLogs ?? []),
      { id: generateId('log'), agentId, message, timestamp: new Date().toISOString(), type },
    ],
  };
  saveNotebookEntry(updated as Partial<NotebookEntry> & { date: string });
}

// ── Media Jobs ────────────────────────────────────────────────────────────────

export function getMediaJobs(): MediaJob[] {
  return readJson<MediaJob[]>('media-jobs.json', []);
}

export function saveMediaJob(job: Partial<MediaJob>): MediaJob {
  const jobs = getMediaJobs();
  const now = new Date().toISOString();
  const idx = job.id ? jobs.findIndex(j => j.id === job.id) : -1;

  if (idx !== -1) {
    jobs[idx] = { ...jobs[idx], ...job };
    writeJson('media-jobs.json', jobs);
    return jobs[idx];
  }

  const newJob: MediaJob = {
    id: generateId('mj'),
    type: 'tts',
    status: 'queued',
    input: '',
    agentId: 'system',
    createdAt: now,
    ...job,
  };
  jobs.unshift(newJob);
  writeJson('media-jobs.json', jobs);
  return newJob;
}

// ── Shopify Drafts ────────────────────────────────────────────────────────────

export function getShopifyDrafts(): ShopifyDraft[] {
  return readJson<ShopifyDraft[]>('shopify-drafts.json', []);
}

export function saveShopifyDraft(draft: Partial<ShopifyDraft>): ShopifyDraft {
  const drafts = getShopifyDrafts();
  const now = new Date().toISOString();
  const idx = draft.id ? drafts.findIndex(d => d.id === draft.id) : -1;

  if (idx !== -1) {
    drafts[idx] = { ...drafts[idx], ...draft };
    writeJson('shopify-drafts.json', drafts);
    return drafts[idx];
  }

  const newDraft: ShopifyDraft = {
    id: generateId('sd'),
    type: 'product',
    title: '',
    content: '',
    status: 'draft',
    agentId: 'system',
    tags: [],
    createdAt: now,
    ...draft,
  };
  drafts.unshift(newDraft);
  writeJson('shopify-drafts.json', drafts);
  return newDraft;
}
