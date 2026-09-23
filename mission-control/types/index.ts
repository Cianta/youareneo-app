// ─────────────────────────────────────────────────────────────────────────────
//  TRINITY OS — Core Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

// ── Agent Types ───────────────────────────────────────────────────────────────

export type AgentProvider = 'claude' | 'openai' | 'gemini' | 'hermes' | 'openclaw' | 'openrouter' | 'ollama';

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error' | 'idle';

export interface AgentConfig {
  id: string;
  name: string;
  displayName: string;
  provider: AgentProvider;
  model: string;
  apiKeyEnv: string;
  baseUrl?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  color: string;
  icon: string;
  capabilities: AgentCapability[];
  status: AgentStatus;
  lastSeen?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentCapability =
  | 'chat'
  | 'seo'
  | 'kanban'
  | 'shopify'
  | 'media'
  | 'code'
  | 'research'
  | 'memory'
  | 'technical';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId: string;
  timestamp: string;
  tokens?: number;
  /** Rollenname, wenn die Nachricht von einer AI-Firmen-Rolle stammt */
  roleName?: string;
  /** Kurzprotokoll ausgeführter Assistenten-Aktionen */
  actionLog?: string[];
}

// ── Memory Types ──────────────────────────────────────────────────────────────

export type MemoryType = 'fact' | 'conversation' | 'task' | 'insight' | 'context';

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  tags: string[];
  type: MemoryType;
  sourceAgent: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  pinned: boolean;
}

// ── Kanban Types ──────────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'content' | 'technical' | 'seo' | 'media' | 'shopify' | 'research';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assignedAgent?: string;
  assignedMember?: string;
  tags: string[];
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  createdBy: string;
  linkedMemoryIds: string[];
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  updatedAt: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  label: string;
  color: string;
}

// ── Team Member Types ─────────────────────────────────────────────────────────

export type MemberRole = 'founder' | 'assistant' | 'creator' | 'expert';

export interface TeamMember {
  id: string;
  name: string;
  role: MemberRole;
  title: string;
  avatar: string;
  color: string;
  skills: string[];
  activeTasks?: number;
  completedTasks?: number;
}

// ── Notebook Types ────────────────────────────────────────────────────────────

export interface NotebookEntry {
  id: string;
  date: string;
  goals: string[];
  journal: string;
  teamLogs: TeamLog[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamLog {
  id: string;
  agentId: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// ── Universe / Memory Vault Types ─────────────────────────────────────────────

export interface VaultEntry {
  id: string;
  title: string;
  content: string;
  filename: string;
  path: string;
  tags: string[];
  obsidianSynced: boolean;
  notionSynced: boolean;
  notionPageId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── SEO Types ─────────────────────────────────────────────────────────────────

export interface KeywordData {
  id: string;
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  position?: number;
  url?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentDeploy {
  id: string;
  title: string;
  content: string;
  domains: string[];
  status: 'draft' | 'scheduled' | 'deployed' | 'failed';
  scheduledAt?: string;
  deployedAt?: string;
  agentId: string;
  keywords: string[];
  createdAt: string;
}

// ── Media Types ───────────────────────────────────────────────────────────────

export interface MediaJob {
  id: string;
  type: 'tts' | 'podcast' | 'video' | 'transcribe';
  status: 'queued' | 'processing' | 'done' | 'error';
  input: string;
  outputPath?: string;
  agentId: string;
  voice?: string;
  duration?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// ── Shopify Types ─────────────────────────────────────────────────────────────

export interface ShopifyDraft {
  id: string;
  type: 'product' | 'blog' | 'page';
  title: string;
  content: string;
  status: 'draft' | 'publishing' | 'published' | 'failed';
  shopifyId?: string;
  agentId: string;
  tags: string[];
  createdAt: string;
  publishedAt?: string;
}

// ── System Metrics ────────────────────────────────────────────────────────────

export interface SystemMetrics {
  totalAgents: number;
  onlineAgents: number;
  memoryEntries: number;
  kanbanTasks: number;
  completedTasks: number;
  todayMessages: number;
  mediaJobs: number;
  shopifyDrafts: number;
}

// ── API Response Helpers ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
