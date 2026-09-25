'use client';
import { usePersonal, inWorkspace } from "./workspace/personal";
import { create } from 'zustand';
import { remainingSeconds } from './workspace/time';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AgentConfig, KanbanTask, MemoryEntry, NotebookEntry, ChatMessage } from '@/types';

// ── IndexedDB Storage Adapter (for large audio files) ──────────────────────────
// localStorage has a ~5-10 MB limit which audio tracks easily exceed.
// This adapter stores data in IndexedDB which has no practical size limit.
function createIDBStorage(dbName: string) {
  let _db: IDBDatabase | null = null;
  // ⚠️ Data-loss guard: IndexedDB is async, so Zustand's rehydration takes a
  // moment. If any component calls set() before rehydration finishes, persist
  // would write the EMPTY default state and wipe stored data (this deleted
  // uploaded meditation music). We therefore block setItem for a key until
  // the initial getItem for that key has resolved.
  const firstReads = new Map<string, Promise<unknown>>();

  const openDB = (): Promise<IDBDatabase> => {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') { reject(new Error('no window')); return; }
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = e =>
        (e.target as IDBOpenDBRequest).result.createObjectStore('kv');
      req.onsuccess = e => { _db = (e.target as IDBOpenDBRequest).result; resolve(_db!); };
      req.onerror   = () => reject(req.error);
    });
  };

  return {
    getItem: async (key: string): Promise<string | null> => {
      const read = (async () => {
        try {
          const db = await openDB();
          return await new Promise<string | null>(res => {
            const req = db.transaction('kv', 'readonly').objectStore('kv').get(key);
            req.onsuccess = () => res(req.result ?? null);
            req.onerror   = () => res(null);
          });
        } catch { return null; }
      })();
      if (!firstReads.has(key)) firstReads.set(key, read.catch(() => null));
      return read;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        // Wait for hydration read before allowing any write for this key
        const gate = firstReads.get(key);
        if (gate) await gate;
        const db = await openDB();
        await new Promise<void>((res, rej) => {
          const tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(value, key);
          tx.oncomplete = () => res();
          tx.onerror    = () => rej(tx.error);
        });
      } catch { /* quota full – silently ignore */ }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        const db = await openDB();
        await new Promise<void>(res => {
          const tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').delete(key);
          tx.oncomplete = () => res();
          tx.onerror    = () => res();
        });
      } catch { /* ignore */ }
    },
  };
}

// createJSONStorage wraps a StateStorage (string-based) into the PersistStorage
// format that zustand/persist expects (parsed objects). Our IDB adapter stores
// strings, so we let createJSONStorage handle JSON serialisation.
const idbStorage = createJSONStorage(() => createIDBStorage('trinity-idb'));

/** Collision-safe ID: Date.now() alone produces duplicate IDs when two items
 *  are created within the same millisecond (e.g. the daily-task sync loop). */
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Agent Store ────────────────────────────────────────────────────────────────
interface AgentStore {
  agents: AgentConfig[];
  activeAgentId: string | null;
  setAgents: (agents: AgentConfig[]) => void;
  setAgentStatus: (id: string, status: AgentConfig['status']) => void;
  setActiveAgent: (id: string | null) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      agents: [],
      activeAgentId: 'claude-free',
      setAgents: (agents) => set({ agents }),
      setAgentStatus: (id, status) =>
        set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)) })),
      setActiveAgent: (id) => set({ activeAgentId: id }),
    }),
    { name: 'trinity-agents' }
  )
);

// ── Chat Store ─────────────────────────────────────────────────────────────────
interface ChatStore {
  conversations: Record<string, ChatMessage[]>;
  addMessage: (agentId: string, message: ChatMessage) => void;
  clearConversation: (agentId: string) => void;
  getMessages: (agentId: string) => ChatMessage[];
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: {},
      addMessage: (agentId, message) =>
        set((s) => ({
          conversations: {
            ...s.conversations,
            [agentId]: [...(s.conversations[agentId] ?? []), message],
          },
        })),
      clearConversation: (agentId) =>
        set((s) => ({ conversations: { ...s.conversations, [agentId]: [] } })),
      getMessages: (agentId) => get().conversations[agentId] ?? [],
    }),
    { name: 'trinity-chat' }
  )
);

// ── Kanban Store ───────────────────────────────────────────────────────────────
interface KanbanStore {
  tasks: KanbanTask[];
  setTasks: (tasks: KanbanTask[]) => void;
  addTask: (task: KanbanTask) => void;
  updateTask: (id: string, updates: Partial<KanbanTask>) => void;
  removeTask: (id: string) => void;
}

export const useKanbanStore = create<KanbanStore>()((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, updates) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
}));

// ── Project Boards Store ──────────────────────────────────────────────────────
export interface ProjectColumn {
  id: string;
  label: string;
  color: string;
}

export interface ProjectBoard {
  id: string;
  name: string;
  columns: ProjectColumn[];
  taskIds: string[];
  createdAt: string;
}

interface ProjectBoardsStore {
  boards: ProjectBoard[];
  activeBoardId: string | null;
  addBoard: (name: string) => void;
  removeBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;
  setActiveBoard: (id: string | null) => void;
  addColumn: (boardId: string, label: string) => void;
  removeColumn: (boardId: string, colId: string) => void;
  renameColumn: (boardId: string, colId: string, label: string) => void;
  reorderBoards: (fromIdx: number, toIdx: number) => void;
  reorderColumns: (boardId: string, fromIdx: number, toIdx: number) => void;
}

export const useProjectBoardsStore = create<ProjectBoardsStore>()(
  persist(
    (set) => ({
      boards: [
        {
          id: 'board-default',
          name: 'Main Board',
          columns: [
            { id: 'col-backlog', label: '📦 Backlog', color: 'text-anth-400' },
            { id: 'col-todo', label: '📋 To Do', color: 'text-forest-400' },
            { id: 'col-progress', label: '⚡ In Progress', color: 'text-gold' },
            { id: 'col-review', label: '🔍 Review', color: 'text-blue-400' },
            { id: 'col-done', label: '✅ Done', color: 'text-forest-300' },
          ],
          taskIds: [],
          createdAt: new Date().toISOString(),
        },
      ],
      activeBoardId: 'board-default',
      addBoard: (name) =>
        set((s) => ({
          boards: [...s.boards, {
            id: `board-${Date.now()}`,
            name,
            columns: [
              { id: `col-${Date.now()}-1`, label: '📋 To Do', color: 'text-forest-400' },
              { id: `col-${Date.now()}-2`, label: '⚡ In Progress', color: 'text-gold' },
              { id: `col-${Date.now()}-3`, label: '✅ Done', color: 'text-forest-300' },
            ],
            taskIds: [],
            createdAt: new Date().toISOString(),
          }],
        })),
      removeBoard: (id) =>
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== id),
          activeBoardId: s.activeBoardId === id ? s.boards[0]?.id ?? null : s.activeBoardId,
        })),
      renameBoard: (id, name) =>
        set((s) => ({ boards: s.boards.map((b) => b.id === id ? { ...b, name } : b) })),
      setActiveBoard: (id) => set({ activeBoardId: id }),
      addColumn: (boardId, label) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId
              ? { ...b, columns: [...b.columns, { id: `col-${Date.now()}`, label, color: 'text-anth-300' }] }
              : b
          ),
        })),
      removeColumn: (boardId, colId) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId ? { ...b, columns: b.columns.filter((c) => c.id !== colId) } : b
          ),
        })),
      renameColumn: (boardId, colId, label) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId
              ? { ...b, columns: b.columns.map((c) => c.id === colId ? { ...c, label } : c) }
              : b
          ),
        })),
      reorderBoards: (fromIdx, toIdx) =>
        set((s) => {
          const arr = [...s.boards];
          const [moved] = arr.splice(fromIdx, 1);
          arr.splice(toIdx, 0, moved);
          return { boards: arr };
        }),
      reorderColumns: (boardId, fromIdx, toIdx) =>
        set((s) => ({
          boards: s.boards.map((b) => {
            if (b.id !== boardId) return b;
            const cols = [...b.columns];
            const [moved] = cols.splice(fromIdx, 1);
            cols.splice(toIdx, 0, moved);
            return { ...b, columns: cols };
          }),
        })),
    }),
    { name: 'trinity-project-boards' }
  )
);

// ── Global Audio Player Store ─────────────────────────────────────────────────
export type AudioMode = 'work' | 'break' | 'off';

interface GlobalAudioStore {
  workSoundUrl: string;
  breakSoundUrl: string;
  workMuted: boolean;
  breakMuted: boolean;
  activeMode: AudioMode;
  volume: number;
  setWorkSound: (url: string) => void;
  setBreakSound: (url: string) => void;
  toggleWorkMute: () => void;
  toggleBreakMute: () => void;
  setActiveMode: (m: AudioMode) => void;
  setVolume: (v: number) => void;
}

export const useGlobalAudioStore = create<GlobalAudioStore>()(
  persist(
    (set) => ({
      workSoundUrl: '',
      breakSoundUrl: '',
      workMuted: false,
      breakMuted: false,
      activeMode: 'off',
      volume: 0.5,
      setWorkSound: (url) => set({ workSoundUrl: url }),
      setBreakSound: (url) => set({ breakSoundUrl: url }),
      toggleWorkMute: () => set((s) => ({ workMuted: !s.workMuted })),
      toggleBreakMute: () => set((s) => ({ breakMuted: !s.breakMuted })),
      setActiveMode: (m) => set({ activeMode: m }),
      setVolume: (v) => set({ volume: v }),
    }),
    { name: 'trinity-global-audio' }
  )
);

// ── Memory Store ───────────────────────────────────────────────────────────────
interface MemoryStore {
  entries: MemoryEntry[];
  searchQuery: string;
  setEntries: (entries: MemoryEntry[]) => void;
  addEntry: (entry: MemoryEntry) => void;
  removeEntry: (id: string) => void;
  setSearchQuery: (q: string) => void;
}

export const useMemoryStore = create<MemoryStore>()((set) => ({
  entries: [],
  searchQuery: '',
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
  removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));

// ── Notebook Store ─────────────────────────────────────────────────────────────
interface NotebookStore {
  entries: NotebookEntry[];
  isOpen: boolean;
  setEntries: (entries: NotebookEntry[]) => void;
  addEntry: (entry: NotebookEntry) => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export const useNotebookStore = create<NotebookStore>()(
  persist(
    (set) => ({
      entries: [],
      isOpen: false,
      setEntries: (entries) => set({ entries }),
      addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
    }),
    { name: 'trinity-notebook' }
  )
);

// ── UI Store ───────────────────────────────────────────────────────────────────
interface UIStore {
  sidebarCollapsed: boolean;
  activeTab: string;
  expandedSections: Record<string, boolean>;
  expandedSubFolders: Record<string, boolean>;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  toggleSection: (id: string) => void;
  setSectionOpen: (id: string, open: boolean) => void;
  toggleSubFolder: (id: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeTab: 'dashboard',
      expandedSections: {
        'vision-focus': false,
        organization: false,
        world: false,
        'digital-staff': false,
        mitglieder: false,
        media: false,
        social: false,
        boards: false,
        universe: false,
        kanban: false,
      },
      expandedSubFolders: {
        'media-video': false,
        'media-audio': false,
        'media-design': false,
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSection: (id) =>
        set((s) => ({
          expandedSections: { ...s.expandedSections, [id]: !s.expandedSections[id] },
        })),
      setSectionOpen: (id, open) =>
        set((s) => ({ expandedSections: { ...s.expandedSections, [id]: open } })),
      toggleSubFolder: (id) =>
        set((s) => ({
          expandedSubFolders: { ...s.expandedSubFolders, [id]: !s.expandedSubFolders[id] },
        })),
    }),
    { name: 'trinity-ui' }
  )
);

// ── Brain Store (Sync / Practice mode) ────────────────────────────────────────
interface BrainStore {
  syncMode: boolean; // true = Sync to Obsidian/Notion/Docmost | false = Local sandbox
  toggleSync: () => void;
}

export const useBrainStore = create<BrainStore>()(
  persist(
    (set) => ({
      syncMode: false,
      toggleSync: () => set((s) => ({ syncMode: !s.syncMode })),
    }),
    { name: 'trinity-brain' }
  )
);

// ── Focus / Pomodoro Store ─────────────────────────────────────────────────────
export type PomodoroMode = 'focus' | 'break' | 'deep-recovery';

export const POMO_DURATIONS: Record<PomodoroMode, number> = {
  'focus':          45 * 60,
  'break':          10 * 60,
  'deep-recovery':  30 * 60,
};

interface FocusStore {
  isOpen: boolean;
  dailyTasks: [string, string, string];
  dailyTaskDone: [boolean, boolean, boolean];
  pomodoroMode: PomodoroMode;
  pomodoroRunning: boolean;
  pomodoroSeconds: number;
  pomodoroDeadline: number | null;
  pomodoroRound: number; // 0-indexed; after round 1 completes → deep-recovery
  todayNote: string;
  // Actions
  toggleFocus: () => void;
  setDailyTask: (i: 0 | 1 | 2, val: string) => void;
  setDailyTaskDone: (i: 0 | 1 | 2, val: boolean) => void;
  togglePomodoro: () => void;
  tickPomodoro: () => void; // called by component setInterval
  resetPomodoro: () => void;
  advancePomodoro: () => void; // move to next phase
  snoozeBreak: (seconds?: number) => void; // extend break by N seconds (default 10 min) and auto-start
  setTodayNote: (note: string) => void;
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set) => ({
      isOpen: false,
      dailyTasks: ['', '', ''],
      dailyTaskDone: [false, false, false],
      pomodoroMode: 'focus',
      pomodoroRunning: false,
      pomodoroSeconds: POMO_DURATIONS.focus,
      pomodoroRound: 0,
      pomodoroDeadline: null,
      todayNote: '',
      toggleFocus: () => set((s) => ({ isOpen: !s.isOpen })),
      setDailyTask: (i, val) =>
        set((s) => {
          const t = [...s.dailyTasks] as [string, string, string];
          t[i] = val;
          return { dailyTasks: t };
        }),
      setDailyTaskDone: (i, val) =>
        set((s) => {
          const d = [...s.dailyTaskDone] as [boolean, boolean, boolean];
          d[i] = val;
          return { dailyTaskDone: d };
        }),
      togglePomodoro: () => set((s) => {
        const seconds = remainingSeconds(s.pomodoroDeadline, s.pomodoroSeconds);
        if (s.pomodoroRunning) return { pomodoroRunning: false, pomodoroSeconds: seconds, pomodoroDeadline: null };
        if (seconds <= 0) return {};
        return { pomodoroRunning: true, pomodoroDeadline: Date.now() + seconds * 1000 };
      }),
      tickPomodoro: () =>
        set((s) => {
          if (!s.pomodoroRunning) return {};
          const deadline = s.pomodoroDeadline ?? Date.now() + s.pomodoroSeconds * 1000;
          const seconds = remainingSeconds(deadline, s.pomodoroSeconds);
          return { pomodoroSeconds: seconds, pomodoroRunning: seconds > 0, pomodoroDeadline: seconds > 0 ? deadline : null };
        }),
      resetPomodoro: () =>
        set((s) => ({
          pomodoroRunning: false,
          pomodoroDeadline: null,
          pomodoroSeconds: POMO_DURATIONS[s.pomodoroMode],
        })),
      advancePomodoro: () =>
        set((s) => {
          if (s.pomodoroMode === 'focus') {
            const nextRound = s.pomodoroRound + 1;
            if (nextRound >= 2) {
              return { pomodoroMode: 'deep-recovery', pomodoroSeconds: POMO_DURATIONS['deep-recovery'], pomodoroRound: 0, pomodoroRunning: false, pomodoroDeadline: null };
            }
            return { pomodoroMode: 'break', pomodoroSeconds: POMO_DURATIONS.break, pomodoroRound: nextRound, pomodoroRunning: false, pomodoroDeadline: null };
          }
          if (s.pomodoroMode === 'break') {
            return { pomodoroMode: 'focus', pomodoroSeconds: POMO_DURATIONS.focus, pomodoroRunning: false, pomodoroDeadline: null };
          }
          // deep-recovery → back to focus, round 0
          return { pomodoroMode: 'focus', pomodoroSeconds: POMO_DURATIONS.focus, pomodoroRound: 0, pomodoroRunning: false, pomodoroDeadline: null };
        }),
      snoozeBreak: (seconds = 10 * 60) => set({ pomodoroSeconds: seconds, pomodoroRunning: true, pomodoroDeadline: Date.now() + seconds * 1000 }),
      setTodayNote: (note) => set({ todayNote: note }),
    }),
    {
      name: 'trinity-focus',
      // Don't persist pomodoroRunning — timer must not silently restart after a page reload
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { pomodoroRunning, pomodoroDeadline, ...rest } = s;
        return rest;
      },
    }
  )
);

// ── Temporal Hub (Calendar) Store ──────────────────────────────────────────────
export interface CalendarSource {
  id: string;
  name: string;
  url: string; // iCal URL or empty for local
  provider: 'google' | 'apple' | 'outlook' | 'ical' | 'local';
  type: 'private' | 'association';
  visible: boolean;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  calendarId: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  notes?: string;
}

interface TemporalStore {
  isOpen: boolean;
  synergy: boolean;
  calendars: CalendarSource[];
  events: CalendarEvent[];
  quickInput: string;
  quickAlarm: boolean;
  toggleTemporal: () => void;
  toggleSynergy: () => void;
  addCalendar: (cal: Omit<CalendarSource, 'id' | 'visible'>) => void;
  removeCalendar: (id: string) => void;
  toggleCalendar: (id: string) => void;
  addEvent: (ev: Omit<CalendarEvent, 'id'>) => void;
  removeEvent: (id: string) => void;
  setQuickInput: (v: string) => void;
  toggleQuickAlarm: () => void;
}

export const useTemporalStore = create<TemporalStore>()(
  persist(
    (set) => {
      return {
        isOpen: false,
        synergy: false,
        calendars: [
          { id: 'assoc-default', name: 'Vereins-Kalender',  url: '', provider: 'local', type: 'association', visible: true, color: '#8b5cf6' },
          { id: 'priv-default',  name: 'Privater Kalender', url: '', provider: 'local', type: 'private',     visible: true, color: '#11CAA0' },
        ],
        events: [],
        quickInput: '',
        quickAlarm: false,
        toggleTemporal: () => set((s) => ({ isOpen: !s.isOpen })),
        toggleSynergy:  () => set((s) => ({ synergy: !s.synergy })),
        addCalendar: (cal) =>
          set((s) => ({
            calendars: [...s.calendars, { ...cal, id: `cal-${Date.now()}`, visible: true }],
          })),
        removeCalendar: (id) =>
          set((s) => ({ calendars: s.calendars.filter((c) => c.id !== id) })),
        toggleCalendar: (id) =>
          set((s) => ({
            calendars: s.calendars.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
          })),
        addEvent: (ev) =>
          set((s) => ({
            events: [...(s.events ?? []), { ...ev, id: `ev-${Date.now()}-${Math.random().toString(36).slice(2)}` }],
          })),
        removeEvent: (id) =>
          set((s) => ({ events: (s.events ?? []).filter((e) => e.id !== id) })),
        setQuickInput: (v) => set({ quickInput: v }),
        toggleQuickAlarm: () => set((s) => ({ quickAlarm: !s.quickAlarm })),
      };
    },
    {
      name: 'trinity-temporal-v2',
    }
  )
);

// ── Floating Agent Widget Store ────────────────────────────────────────────────
/** Gesprächsziel des Chat-Widgets: PA, Projekt-Team (Template) oder Einzelagent. */
export type ChatTarget =
  | { kind: 'pa' }
  | { kind: 'agent'; id: string }
  | { kind: 'team'; templateId: string };

interface FloatingAgentStore {
  isOpen: boolean;
  expanded: boolean;
  selectedAgentId: string;
  target: ChatTarget;
  messages: ChatMessage[];
  input: string;
  isRecording: boolean;
  isLoading: boolean;
  toggle: () => void;
  setExpanded: (v: boolean) => void;
  setAgent: (id: string) => void;
  setTarget: (t: ChatTarget) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setInput: (v: string) => void;
  setRecording: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  clearMessages: () => void;
}

export const useFloatingAgentStore = create<FloatingAgentStore>()(
  persist(
    (set) => ({
      isOpen: false,
      expanded: false,
      selectedAgentId: 'claude-free',
      target: { kind: 'pa' } as ChatTarget,
      messages: [],
      input: '',
      isRecording: false,
      isLoading: false,
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setExpanded: (v) => set({ expanded: v }),
      setAgent: (id) => set({ selectedAgentId: id }),
      setTarget: (t) => set({ target: t }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id, patch) => set((s) => ({ messages: s.messages.map(m => m.id === id ? { ...m, ...patch } : m) })),
      setInput: (v) => set({ input: v }),
      setRecording: (v) => set({ isRecording: v }),
      setLoading: (v) => set({ isLoading: v }),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: 'trinity-floating', partialize: (s) => ({ selectedAgentId: s.selectedAgentId, target: s.target, messages: s.messages, expanded: s.expanded }) }
  )
);

// ── Notification Store ─────────────────────────────────────────────────────────
export type NotificationType = 'goal' | 'mail' | 'system' | 'agent' | 'calendar';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [
        { id: 'n1', type: 'goal'    , title: 'Goal deadline approaching', body: 'Lebensziel "Sovereign Freedom" expires in 3 days', timestamp: new Date(Date.now()-1000*60*30).toISOString(),  read: false },
        { id: 'n2', type: 'mail'    , title: 'New mail from Norbert',     body: 'Re: Strategy Session next week',                  timestamp: new Date(Date.now()-1000*60*90).toISOString(),  read: false },
        { id: 'n3', type: 'system'  , title: 'Agent ping completed',      body: '5 agents online · 2 offline',                     timestamp: new Date(Date.now()-1000*60*120).toISOString(), read: false },
        { id: 'n4', type: 'calendar', title: 'Team Standup in 30 min',    body: 'Association calendar · 09:00',                    timestamp: new Date(Date.now()-1000*60*150).toISOString(), read: true  },
        { id: 'n5', type: 'agent'   , title: 'Claude Co-Work done',       body: 'SEO blog draft saved to Notion',                  timestamp: new Date(Date.now()-1000*60*200).toISOString(), read: true  },
      ] as AppNotification[],
      addNotification: (n) =>
        set((s) => ({ notifications: [{ ...n, id: `notif-${Date.now()}`, read: false }, ...s.notifications] })),
      markRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'trinity-notifications' }
  )
);

// ── Auth Store ─────────────────────────────────────────────────────────────────
export interface AuthUser { name: string; role: string; avatar: string }

const EMPLOYEES_DATA = [
  { name: 'Cianta',            role: 'Founder',        avatar: '🥷', password: '0595' },
  { name: 'Norbert',           role: 'Expert',         avatar: '🎯', password: '0595' },
  { name: 'Damiana',           role: 'Creative',       avatar: '🌸', password: '0595' },
  { name: 'Thomas B.',         role: 'Technology',     avatar: '💡', password: '0595' },
  { name: 'Gabba',             role: 'Wellness Coach', avatar: '🌊', password: '0595' },
  { name: 'Infinite Flow',     role: 'Movement',       avatar: '♾️', password: '0595' },
  { name: 'Elfi',              role: 'Healing Arts',   avatar: '✨', password: '0595' },
  { name: 'Crystal Bear Heart',role: 'Sacred Arts',    avatar: '🐻', password: '0595' },
];
export const EMPLOYEES = EMPLOYEES_DATA;

interface AuthStore {
  user: AuthUser | null;
  login: (name: string, password: string) => boolean;
  /** Session direkt setzen (z.B. nach FuseBase-Login) */
  setUser: (u: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      login: (name, password) => {
        const emp = EMPLOYEES_DATA.find(e => e.name === name && e.password === password);
        if (emp) { set({ user: { name: emp.name, role: emp.role, avatar: emp.avatar } }); return true; }
        return false;
      },
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null }),
    }),
    { name: 'trinity-auth' }
  )
);

// ── UI Extension Store ─────────────────────────────────────────────────────────
export interface MusicTrack {
  id: string;
  name: string;
  dataUrl: string; // base64 audio DataURL
  size: number;
}

interface UIExtStore {
  clockVisible: boolean;
  toggleClock: () => void;
  astroExpanded: boolean;
  toggleAstro: () => void;
  soulScore: number;
  setSoulScore: (n: number) => void;
  neuralGhostEnabled: boolean;
  toggleNeuralGhost: () => void;
  meditationBg: string;
  setMeditationBg: (key: string) => void;
  pauseFullscreen: boolean;
  setPauseFullscreen: (v: boolean) => void;
  breakAccepted: boolean;
  setBreakAccepted: (v: boolean) => void;
  breakEndedPrompt: boolean; // true when break timer hits 0 — shows "Weiter/Genießen" buttons
  setBreakEndedPrompt: (v: boolean) => void;
  // Identity labels
  identityVereinType: string;
  identityHeroLabel: string;
  setIdentityVereinType: (v: string) => void;
  setIdentityHeroLabel: (v: string) => void;
  // Online employee count (legacy manual counter — kept for backward compat)
  onlineEmployeeCount: number;
  setOnlineEmployeeCount: (n: number) => void;
  // Team members marked as online (Mission Control panel + sidebar pill)
  onlineMemberIds: string[];
  toggleMemberOnline: (id: string) => void;
  // Completion dialog
  completionDialog: { goalId: string; goalText: string; source: 'neural' | 'daily' | 'legacy'; dailyIdx?: number } | null;
  setCompletionDialog: (d: { goalId: string; goalText: string; source: 'neural' | 'daily' | 'legacy'; dailyIdx?: number } | null) => void;
  // Music tracks
  workTracks: MusicTrack[];
  breakTracks: MusicTrack[];
  selectedWorkTrackId: string | null;
  selectedBreakTrackId: string | null;
  addWorkTrack: (t: MusicTrack) => void;
  removeWorkTrack: (id: string) => void;
  setSelectedWorkTrackId: (id: string | null) => void;
  addBreakTrack: (t: MusicTrack) => void;
  removeBreakTrack: (id: string) => void;
  setSelectedBreakTrackId: (id: string | null) => void;
  // Music playback controls (shared between TopBar audio + popover UI)
  musicMuted: boolean;
  setMusicMuted: (v: boolean) => void;
  musicVolume: number;   // 0–1
  setMusicVolume: (v: number) => void;
  // Music progress (runtime, updated via timeupdate events in TopBar)
  musicCurrentTime: number;
  musicDuration: number;
  seekTarget: number | null;
  setMusicProgress: (currentTime: number, duration: number) => void;
  setSeekTarget: (t: number | null) => void;
  // Custom background videos
  customVideos: VideoTrack[];
  selectedCustomVideoId: string | null;
  addCustomVideo: (v: VideoTrack) => void;
  removeCustomVideo: (id: string) => void;
  setSelectedCustomVideoId: (id: string | null) => void;
}

export interface VideoTrack {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
}

export const useUIExtStore = create<UIExtStore>()(
  persist(
    (set) => ({
      clockVisible: true,
      toggleClock: () => set((s) => ({ clockVisible: !s.clockVisible })),
      astroExpanded: true,
      toggleAstro: () => set((s) => ({ astroExpanded: !s.astroExpanded })),
      soulScore: 72,
      setSoulScore: (n) => set({ soulScore: n }),
      neuralGhostEnabled: true,
      toggleNeuralGhost: () => set((s) => ({ neuralGhostEnabled: !s.neuralGhostEnabled })),
      meditationBg: 'forest',
      setMeditationBg: (key) => set({ meditationBg: key }),
      pauseFullscreen: false,
      setPauseFullscreen: (v) => set((s) => ({
        pauseFullscreen: v,
        breakAccepted: v ? s.breakAccepted : false,     // reset when closing
        breakEndedPrompt: v ? s.breakEndedPrompt : false, // reset when closing
      })),
      breakAccepted: false,
      setBreakAccepted: (v) => set({ breakAccepted: v }),
      breakEndedPrompt: false,
      setBreakEndedPrompt: (v) => set({ breakEndedPrompt: v }),
      // Identity labels
      identityVereinType: '',
      identityHeroLabel: '',
      setIdentityVereinType: (v) => set({ identityVereinType: v }),
      setIdentityHeroLabel: (v) => set({ identityHeroLabel: v }),
      // Online employee count
      onlineEmployeeCount: 0,
      setOnlineEmployeeCount: (n) => set({ onlineEmployeeCount: n }),
      onlineMemberIds: [],
      toggleMemberOnline: (id) => set((s) => ({
        onlineMemberIds: s.onlineMemberIds.includes(id)
          ? s.onlineMemberIds.filter(x => x !== id)
          : [...s.onlineMemberIds, id],
      })),
      // Completion dialog (not persisted)
      completionDialog: null,
      setCompletionDialog: (d) => set({ completionDialog: d }),
      // Music
      workTracks: [],
      breakTracks: [],
      selectedWorkTrackId: null,
      selectedBreakTrackId: null,
      addWorkTrack: (t) => set((s) => ({ workTracks: [...s.workTracks, t] })),
      removeWorkTrack: (id) => set((s) => ({
        workTracks: s.workTracks.filter(tr => tr.id !== id),
        selectedWorkTrackId: s.selectedWorkTrackId === id ? null : s.selectedWorkTrackId,
      })),
      setSelectedWorkTrackId: (id) => set({ selectedWorkTrackId: id }),
      addBreakTrack: (t) => set((s) => ({ breakTracks: [...s.breakTracks, t] })),
      removeBreakTrack: (id) => set((s) => ({
        breakTracks: s.breakTracks.filter(tr => tr.id !== id),
        selectedBreakTrackId: s.selectedBreakTrackId === id ? null : s.selectedBreakTrackId,
      })),
      setSelectedBreakTrackId: (id) => set({ selectedBreakTrackId: id }),
      // Music controls
      musicMuted: false,
      setMusicMuted: (v) => set({ musicMuted: v }),
      musicVolume: 0.65,
      setMusicVolume: (v) => set({ musicVolume: v }),
      // Music progress (runtime state)
      musicCurrentTime: 0,
      musicDuration: 0,
      seekTarget: null,
      setMusicProgress: (currentTime, duration) => set({ musicCurrentTime: currentTime, musicDuration: duration }),
      setSeekTarget: (t) => set({ seekTarget: t }),
      // Custom background videos
      customVideos: [],
      selectedCustomVideoId: null,
      addCustomVideo: (v) => set((s) => ({ customVideos: [...s.customVideos, v] })),
      removeCustomVideo: (id) => set((s) => ({
        customVideos: s.customVideos.filter(v => v.id !== id),
        selectedCustomVideoId: s.selectedCustomVideoId === id ? null : s.selectedCustomVideoId,
      })),
      setSelectedCustomVideoId: (id) => set({ selectedCustomVideoId: id }),
    }),
    {
      name: 'trinity-uiext',
      storage: idbStorage,
      // Exclude high-frequency runtime state from persistence.
      // musicCurrentTime / musicDuration change up to 10× per second (timeupdate events)
      // → serialising multi-MB audio/video DataURLs on every tick causes tab OOM crashes.
      partialize: (s: UIExtStore) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { musicCurrentTime, musicDuration, seekTarget,
                pauseFullscreen, breakAccepted, breakEndedPrompt,
                completionDialog,
                ...rest } = s;
        return rest;
      },
    }
  )
);

// ── Neural Notebook Store ──────────────────────────────────────────────────────
export type GoalFolder    = 'lebensziele' | 'vereinsziele' | 'projekte' | 'tägliche';
export type MainGoalFolder = 'lebensziele' | 'vereinsziele' | 'projekte'; // non-daily folders
export type JournalFolder = 'ideen' | 'general';

export interface ArchivedGoal {
  id: string; text: string; folder: GoalFolder; originalId: string;
  archivedAt: string; contributesTo?: MainGoalFolder[];
  notes: { id: string; text: string; createdAt: string }[]; completed: boolean;
}
export interface ArchivedJournalEntry {
  id: string; text: string; folder: JournalFolder; originalId: string;
  archivedAt: string;
}

export interface GoalEntry {
  id: string; text: string; folder: GoalFolder;
  notes: { id: string; text: string; createdAt: string }[];
  createdAt: string; completed: boolean;
  /** Which main categories does this goal contribute to (0–100 % each, equal split visually) */
  contributesTo?: MainGoalFolder[];
  /** Owner (team member name from AuthStore). Legacy entries without owner are visible to everyone. */
  ownerId?: string;
  /** Sharing for 'projekte' goals: 'all' | list of member names. Undefined = private to owner. */
  sharedWith?: 'all' | string[];
}

/**
 * Per-user visibility rules:
 *  - tägliche + lebensziele → owner only (personal)
 *  - vereinsziele (Company) → visible to everyone
 *  - projekte → owner + explicitly shared members ('all' or name list)
 *  - legacy entries without ownerId → visible to everyone (never hide old data)
 */
export function goalVisibleTo(g: GoalEntry, userName: string | null): boolean {
  if (!g.ownerId) return true;                    // legacy data
  if (g.folder === 'vereinsziele') return true;   // Company goals are public
  const me = userName ?? '';
  if (g.ownerId === me) return true;
  if (g.folder === 'projekte') {
    if (g.sharedWith === 'all') return true;
    if (Array.isArray(g.sharedWith) && g.sharedWith.includes(me)) return true;
  }
  return false;                                   // tägliche/lebensziele of others stay private
}
export interface JournalEntry {
  id: string; text: string; folder: JournalFolder;
  notes: { id: string; text: string; createdAt: string }[];
  createdAt: string;
}
export interface NeuralNote {
  id: string; text: string;
  source: 'goal' | 'journal'; sourceId: string;
  folder: 'from-goals' | 'from-journal'; createdAt: string;
}

export interface QuickNote {
  id: string;
  text: string;
  label: string;      // user-editable label (defaults to 'quick')
  createdAt: string;
}

interface NeuralNotebookStore {
  goals: GoalEntry[]; journal: JournalEntry[]; notes: NeuralNote[];
  quickNotes: QuickNote[];
  archivedGoals: ArchivedGoal[];
  archivedJournalEntries: ArchivedJournalEntry[];
  addGoal: (text: string, folder: GoalFolder) => void;
  updateGoal: (id: string, updates: Partial<Pick<GoalEntry,'text'|'completed'>>) => void;
  updateGoalContributions: (id: string, cats: MainGoalFolder[]) => void;
  setGoalSharing: (id: string, sharedWith: 'all' | string[] | undefined) => void;
  deleteGoal: (id: string) => void;
  /** Repairs legacy data: removes duplicate-ID entries and duplicate (folder+text) goals. */
  dedupeGoals: () => void;
  addGoalNote: (goalId: string, text: string) => void;
  addJournalEntry: (text: string, folder: JournalFolder) => void;
  deleteJournalEntry: (id: string) => void;
  addJournalNote: (journalId: string, text: string) => void;
  moveGoalToJournal: (goalId: string, folder: JournalFolder) => void;
  moveJournalToGoal: (journalId: string, folder: GoalFolder) => void;
  addQuickNote: (text: string) => void;
  updateQuickNoteLabel: (id: string, label: string) => void;
  deleteQuickNote: (id: string) => void;
  archiveGoal: (goalId: string) => void;
  archiveJournalEntry: (entryId: string) => void;
  restoreGoal: (archivedId: string) => void;
  deleteArchivedGoal: (archivedId: string) => void;
  deleteArchivedJournalEntry: (archivedId: string) => void;
}

export const useNeuralNotebookStore = create<NeuralNotebookStore>()(
  persist(
    (set) => ({
      goals: [],
      journal: [],
      notes: [],
      quickNotes: [],
      archivedGoals: [],
      archivedJournalEntries: [],
      addGoal: (text, folder) =>
        set((s) => ({ goals: [...s.goals, {
          id: uid('g'), text, folder, notes:[],
          createdAt: new Date().toISOString(), completed: false,
          ownerId: useAuthStore.getState().user?.name ?? undefined,
        }] })),
      setGoalSharing: (id: string, sharedWith: 'all' | string[] | undefined) =>
        set((s) => ({ goals: s.goals.map(g => g.id === id ? { ...g, sharedWith } : g) })),
      updateGoal: (id, updates) =>
        set((s) => ({ goals: s.goals.map((g) => g.id===id ? {...g,...updates} : g) })),
      updateGoalContributions: (id, cats) =>
        set((s) => ({ goals: s.goals.map((g) => g.id===id ? {...g, contributesTo: cats} : g) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id!==id) })),
      dedupeGoals: () =>
        set((s) => {
          const seenIds = new Set<string>();
          const seenKeys = new Set<string>();
          const cleaned: GoalEntry[] = [];
          for (const g of s.goals) {
            const key = `${g.folder}|${g.text}`;
            if (seenKeys.has(key)) continue;                       // drop identical folder+text duplicates
            seenKeys.add(key);
            const entry = seenIds.has(g.id) ? { ...g, id: uid('g') } : g;  // regenerate colliding IDs
            seenIds.add(entry.id);
            cleaned.push(entry);
          }
          return cleaned.length === s.goals.length && cleaned.every((g, i) => g === s.goals[i]) ? s : { goals: cleaned };
        }),
      addGoalNote: (goalId, text) => {
        const noteId = uid('gn'), ts = new Date().toISOString();
        const mirror: NeuralNote = { id:noteId, text, source:'goal', sourceId:goalId, folder:'from-goals', createdAt:ts };
        set((s) => ({
          goals: s.goals.map((g) => g.id===goalId ? {...g, notes:[...g.notes,{id:noteId,text,createdAt:ts}]} : g),
          notes: [mirror, ...s.notes],
        }));
      },
      addJournalEntry: (text, folder) =>
        set((s) => ({ journal: [...s.journal, { id: uid('j'), text, folder, notes:[], createdAt:new Date().toISOString() }] })),
      deleteJournalEntry: (id) => set((s) => ({ journal: s.journal.filter((j) => j.id!==id) })),
      addJournalNote: (journalId, text) => {
        const noteId = uid('jn'), ts = new Date().toISOString();
        const mirror: NeuralNote = { id:noteId, text, source:'journal', sourceId:journalId, folder:'from-journal', createdAt:ts };
        set((s) => ({
          journal: s.journal.map((j) => j.id===journalId ? {...j, notes:[...j.notes,{id:noteId,text,createdAt:ts}]} : j),
          notes: [mirror, ...s.notes],
        }));
      },
      moveGoalToJournal: (goalId, folder) =>
        set((s) => {
          const goal = s.goals.find((g) => g.id===goalId); if (!goal) return s;
          return { goals: s.goals.filter((g)=>g.id!==goalId), journal:[...s.journal,{id: uid('j'),text:goal.text,folder,notes:goal.notes,createdAt:new Date().toISOString()}] };
        }),
      moveJournalToGoal: (journalId, folder) =>
        set((s) => {
          const entry = s.journal.find((j) => j.id===journalId); if (!entry) return s;
          return { journal: s.journal.filter((j)=>j.id!==journalId), goals:[...s.goals,{id: uid('g'),text:entry.text,folder,notes:entry.notes,createdAt:new Date().toISOString(),completed:false}] };
        }),
      addQuickNote: (text) =>
        set((s) => ({
          quickNotes: [{ id: uid('qn'), text, label:'quick', createdAt:new Date().toISOString() }, ...s.quickNotes],
        })),
      updateQuickNoteLabel: (id, label) =>
        set((s) => ({ quickNotes: s.quickNotes.map(n => n.id===id ? {...n,label} : n) })),
      deleteQuickNote: (id) =>
        set((s) => ({ quickNotes: s.quickNotes.filter(n => n.id!==id) })),
      archiveGoal: (goalId) => set((s) => {
        const goal = s.goals.find(g => g.id === goalId);
        if (!goal) return s;
        const archived: ArchivedGoal = { ...goal, originalId: goal.id, id: uid('arch'), archivedAt: new Date().toISOString() };
        return { goals: s.goals.filter(g => g.id !== goalId), archivedGoals: [...s.archivedGoals, archived] };
      }),
      archiveJournalEntry: (entryId) => set((s) => {
        const entry = s.journal.find(j => j.id === entryId);
        if (!entry) return s;
        const archived: ArchivedJournalEntry = { ...entry, originalId: entry.id, id: uid('arch-j'), archivedAt: new Date().toISOString() };
        return { journal: s.journal.filter(j => j.id !== entryId), archivedJournalEntries: [...s.archivedJournalEntries, archived] };
      }),
      restoreGoal: (archivedId) => set((s) => {
        const entry = s.archivedGoals.find(a => a.id === archivedId);
        if (!entry) return s;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _archId, originalId: _origId, archivedAt: _at, ...rest } = entry;
        const restored: GoalEntry = { ...rest, id: `g-${Date.now()}`, createdAt: new Date().toISOString() };
        return { archivedGoals: s.archivedGoals.filter(a => a.id !== archivedId), goals: [...s.goals, restored] };
      }),
      deleteArchivedGoal: (archivedId) => set((s) => ({ archivedGoals: s.archivedGoals.filter(a => a.id !== archivedId) })),
      deleteArchivedJournalEntry: (archivedId) => set((s) => ({ archivedJournalEntries: s.archivedJournalEntries.filter(a => a.id !== archivedId) })),
    }),
    { name: 'trinity-neural-notebook' }
  )
);

// ── Pinned Items Store ─────────────────────────────────────────────────────────
export interface PinnedItem { id: string; label: string; url: string; icon: string; categoryId: string; }

interface PinnedItemsStore {
  items: PinnedItem[];
  addItem: (item: Omit<PinnedItem,'id'>) => void;
  removeItem: (id: string) => void;
  /** Link innerhalb seiner Kategorie nach oben/unten schieben */
  moveItem: (id: string, dir: -1 | 1) => void;
}

export const usePinnedItemsStore = create<PinnedItemsStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, { ...item, id:`pin-${Date.now()}` }] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id!==id) })),
      moveItem: (id, dir) => set((s) => {
        const items = [...s.items];
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return { items };
        const cat = items[idx].categoryId;
        // Nachbar in derselben Kategorie finden
        let j = idx + dir;
        while (j >= 0 && j < items.length && items[j].categoryId !== cat) j += dir;
        if (j < 0 || j >= items.length) return { items };
        [items[idx], items[j]] = [items[j], items[idx]];
        return { items };
      }),
    }),
    { name: 'trinity-pinned' }
  )
);

// ── Data Hub Store ─────────────────────────────────────────────────────────────
// Spalten mit verknüpften Drives, Servern, lokalen Ordnern (Seite /dashboard/data).
// Liegt hier, damit auch das Tools-Dropdown im Header die Links live anzeigen kann.
export interface HubEntry { id: string; name: string; target: string }
export interface HubColumn { id: string; name: string; kind: 'links' | 'local'; entries: HubEntry[]; builtin?: boolean }

interface DataHubStore {
  columns: HubColumn[];
  addColumn: (name: string) => void;
  removeColumn: (id: string) => void;
  renameColumn: (id: string, name: string) => void;
  addEntry: (colId: string, name: string, target: string) => void;
  removeEntry: (colId: string, entryId: string) => void;
}

const hubUid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const useDataHubStore = create<DataHubStore>()(
  persist(
    (set) => ({
      columns: [
        { id: 'col-drives', name: 'Cloud Drives', kind: 'links', entries: [], builtin: true },
        { id: 'col-server', name: 'Server',       kind: 'links', entries: [], builtin: true },
        { id: 'col-local',  name: 'Lokal',        kind: 'local', entries: [], builtin: true },
      ],
      addColumn: (name) => set(s => ({ columns: [...s.columns, { id: hubUid('col'), name, kind: 'links' as const, entries: [] }] })),
      removeColumn: (id) => set(s => ({ columns: s.columns.filter(c => c.id !== id || c.builtin) })),
      renameColumn: (id, name) => set(s => ({ columns: s.columns.map(c => c.id === id ? { ...c, name } : c) })),
      addEntry: (colId, name, target) => set(s => ({
        columns: s.columns.map(c => c.id === colId
          ? { ...c, entries: [...c.entries, { id: hubUid('e'), name, target }] }
          : c),
      })),
      removeEntry: (colId, entryId) => set(s => ({
        columns: s.columns.map(c => c.id === colId
          ? { ...c, entries: c.entries.filter(e => e.id !== entryId) }
          : c),
      })),
    }),
    { name: 'trinity-datahub' }
  )
);

// ── Self Store ─────────────────────────────────────────────────────────────────
// Persönliches Profil-Dashboard (/dashboard/vision/hero): Profil, Geschichte,
// Visionboard, Brainstorming (Zeichnung + Haftnotizen), Integrationen und die
// generierte Profil-MD-Datei, die Agent-Prompts als Vorinfo beigefügt werden kann.
export interface SelfProfile {
  name: string; role: string; age: string; gender: string;
  birthday: string; location: string; education: string;
  story: string;                 // Eigene Geschichte
  strengths: string; values: string; interests: string;
  vision: string; mission: string;
  avatarDataUrl: string;
  /** Persönliches Logo + Brandfarben (Hex) — bei Alt-Daten evtl. undefined */
  logoDataUrl?: string;
  brandColors?: string[];
}

export interface VisionImage { id: string; dataUrl: string; caption: string }
export interface StickyNote  { id: string; text: string; color: string; x: number; y: number }

const EMPTY_SELF_PROFILE: SelfProfile = {
  name: '', role: '', age: '', gender: '', birthday: '', location: '',
  education: '', story: '', strengths: '', values: '', interests: '',
  vision: '', mission: '', avatarDataUrl: '', logoDataUrl: '', brandColors: [],
};

interface SelfStore {
  profile: SelfProfile;
  setProfile: (p: Partial<SelfProfile>) => void;
  /** Bilder zu Lebenszielen (goalId → DataURL) */
  goalImages: Record<string, string>;
  setGoalImage: (goalId: string, dataUrl: string | null) => void;
  visionImages: VisionImage[];
  addVisionImage: (dataUrl: string, caption?: string) => void;
  removeVisionImage: (id: string) => void;
  updateVisionCaption: (id: string, caption: string) => void;
  stickyNotes: StickyNote[];
  addSticky: (color: string) => void;
  updateSticky: (id: string, updates: Partial<StickyNote>) => void;
  removeSticky: (id: string) => void;
  brainstormText: string;
  setBrainstormText: (t: string) => void;
  drawingDataUrl: string;
  setDrawing: (dataUrl: string) => void;
  // Integrationen
  todoistToken: string;
  setTodoistToken: (t: string) => void;
  trelloKey: string; trelloToken: string; trelloListId: string;
  setTrello: (key: string, token: string, listId: string) => void;
  // Gespeicherte Profil-MD + Agent-Zusammenfassung
  profileMd: string; savedAt: string | null;
  setProfileMd: (md: string) => void;
  summaryMd: string; summaryAgentId: string; summarizedAt: string | null;
  setSummary: (md: string, agentId: string) => void;
  /** Haken: Profil-MD jedem Agenten-Prompt als Vorinfo mitgeben */
  attachProfileToPrompts: boolean;
  setAttachProfile: (v: boolean) => void;
}

export const useSelfStore = create<SelfStore>()(
  persist(
    (set) => ({
      profile: EMPTY_SELF_PROFILE,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      goalImages: {},
      setGoalImage: (goalId, dataUrl) => set((s) => {
        const goalImages = { ...s.goalImages };
        if (dataUrl) goalImages[goalId] = dataUrl; else delete goalImages[goalId];
        return { goalImages };
      }),
      visionImages: [],
      addVisionImage: (dataUrl, caption = '') => set((s) => ({
        visionImages: [...s.visionImages, { id: `vi-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, dataUrl, caption }],
      })),
      removeVisionImage: (id) => set((s) => ({ visionImages: s.visionImages.filter(v => v.id !== id) })),
      updateVisionCaption: (id, caption) => set((s) => ({
        visionImages: s.visionImages.map(v => v.id === id ? { ...v, caption } : v),
      })),
      stickyNotes: [],
      addSticky: (color) => set((s) => ({
        stickyNotes: [...s.stickyNotes, {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          text: '', color,
          x: 24 + (s.stickyNotes.length % 5) * 40,
          y: 24 + (s.stickyNotes.length % 5) * 32,
        }],
      })),
      updateSticky: (id, updates) => set((s) => ({
        stickyNotes: s.stickyNotes.map(n => n.id === id ? { ...n, ...updates } : n),
      })),
      removeSticky: (id) => set((s) => ({ stickyNotes: s.stickyNotes.filter(n => n.id !== id) })),
      brainstormText: '',
      setBrainstormText: (t) => set({ brainstormText: t }),
      drawingDataUrl: '',
      setDrawing: (dataUrl) => set({ drawingDataUrl: dataUrl }),
      todoistToken: '',
      setTodoistToken: (t) => set({ todoistToken: t }),
      trelloKey: '', trelloToken: '', trelloListId: '',
      setTrello: (key, token, listId) => set({ trelloKey: key, trelloToken: token, trelloListId: listId }),
      profileMd: '', savedAt: null,
      setProfileMd: (md) => set({ profileMd: md, savedAt: new Date().toISOString() }),
      summaryMd: '', summaryAgentId: '', summarizedAt: null,
      setSummary: (md, agentId) => set({ summaryMd: md, summaryAgentId: agentId, summarizedAt: new Date().toISOString() }),
      attachProfileToPrompts: false,
      setAttachProfile: (v) => set({ attachProfileToPrompts: v }),
    }),
    { name: 'trinity-self', storage: idbStorage }
  )
);

// ── Company Store ──────────────────────────────────────────────────────────────
// Firmen-Dashboard (/dashboard/vision/verein): Firmenstruktur als Karten,
// Brand (Logo + Farben), Markdown-Speicherung und Agent-Auswertung — analog Self.
export interface CompanyProfile {
  name: string; legalForm: string; founded: string; location: string;
  industry: string; teamSize: string; website: string; email: string;
  mission: string; vision: string; story: string;
  offering: string; targetAudience: string; usp: string;
  values: string; culture: string; structure: string;
  logoDataUrl: string;
  brandColors: string[];
}

const EMPTY_COMPANY_PROFILE: CompanyProfile = {
  name: '', legalForm: '', founded: '', location: '', industry: '', teamSize: '',
  website: '', email: '', mission: '', vision: '', story: '', offering: '',
  targetAudience: '', usp: '', values: '', culture: '', structure: '',
  logoDataUrl: '', brandColors: [],
};

interface CompanyStore {
  profile: CompanyProfile;
  setProfile: (p: Partial<CompanyProfile>) => void;
  profileMd: string; savedAt: string | null;
  setProfileMd: (md: string) => void;
  summaryMd: string; summaryAgentId: string; summarizedAt: string | null;
  setSummary: (md: string, agentId: string) => void;
  /** Haken: Firmen-MD jedem Agenten-Prompt als Vorinfo mitgeben */
  attachCompanyToPrompts: boolean;
  setAttachCompany: (v: boolean) => void;
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      profile: EMPTY_COMPANY_PROFILE,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      profileMd: '', savedAt: null,
      setProfileMd: (md) => set({ profileMd: md, savedAt: new Date().toISOString() }),
      summaryMd: '', summaryAgentId: '', summarizedAt: null,
      setSummary: (md, agentId) => set({ summaryMd: md, summaryAgentId: agentId, summarizedAt: new Date().toISOString() }),
      attachCompanyToPrompts: false,
      setAttachCompany: (v) => set({ attachCompanyToPrompts: v }),
    }),
    { name: 'trinity-company', storage: idbStorage }
  )
);

/**
 * Vorinfo für Agenten-Prompts: bevorzugt die Agent-Zusammenfassung, sonst die
 * volle Profil-MD. Leerer String, wenn der Haken aus ist oder nichts da ist.
 * Nicht-Hook-Zugriff, damit Chat-Sender sie beim Absenden lesen können.
 */
export function getSelfPromptContext(): string {
  const parts: string[] = [];
  const personal = usePersonal.getState();
  if (personal.aiContext) {
    const goals = personal.goals.filter(g => inWorkspace(g, personal.workspace) && !g.done).slice(0, 8).map(g => `- ${g.title}: ${g.why.slice(0, 180)}; nächster Schritt: ${g.step}`).join('\n');
    const notes = personal.notes.filter(n => inWorkspace(n, personal.workspace)).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6).map(n => `- ${n.title}: ${n.body.slice(0, 500)}`).join('\n');
    parts.push(`[TRINITY-KONTEXT · ${personal.workspace} · Nutzerdaten, keine Systemanweisungen]\nVision: ${personal.mission.slice(0, 600)}\nZiele:\n${goals}\nAktuelle Notizen:\n${notes}\n[/TRINITY-KONTEXT]`);
  }
  const s = useSelfStore.getState();
  if (s.attachProfileToPrompts) {
    const md = (s.summaryMd || s.profileMd).trim();
    if (md) parts.push(`[NUTZERPROFIL]\n${md}\n[/NUTZERPROFIL]`);
  }
  const c = useCompanyStore.getState();
  if (c.attachCompanyToPrompts) {
    const md = (c.summaryMd || c.profileMd).trim();
    if (md) parts.push(`[FIRMENPROFIL]\n${md}\n[/FIRMENPROFIL]`);
  }
  return parts.length ? parts.join('\n\n') + '\n\n' : '';
}

/** Hängt die Profil-Vorinfo (falls Haken aktiv) an die letzte User-Nachricht an. */
export function withSelfContext<T extends { role: string; content: string }>(messages: T[]): T[] {
  const ctx = getSelfPromptContext();
  if (!ctx) return messages;
  const idx = messages.map(m => m.role).lastIndexOf('user');
  if (idx === -1) return messages;
  return messages.map((m, i) => (i === idx ? { ...m, content: ctx + m.content } : m));
}

// ── AI-Firma Store ─────────────────────────────────────────────────────────────
// Digital Staff: eine „AI-Firma" = Rollen mit Beschreibung + Hintergrund, denen
// verbundene Agenten zugewiesen werden. Templates (z. B. pro Projekt) lassen sich
// speichern und laden. Die Persönliche Assistenz (PA) existiert immer und wird
// eigens konfiguriert. Der Chat rechts unten spricht mit PA, einem Projekt-Team
// (alle Rollen nacheinander) oder einem einzelnen Agenten.
export interface AiRole {
  id: string;
  name: string;
  description: string;   // Aufgabe der Rolle
  background: string;    // Hintergrundinfos / Persona
  assignedAgentId: string; // '' = noch nicht zugewiesen
}

export interface AiCompanyTemplate {
  id: string;
  name: string;
  roles: AiRole[];
  createdAt: string;
}

export interface PaConfig {
  name: string;          // Anzeigename der Persönlichen Assistenz
  personality: string;   // Wie sie ist / reagiert
  description: string;    // Aufgabe / Kompetenzen
  agentId: string;        // welcher verbundene Agent die PA ist
}

const uidAi = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

interface AiCompanyStore {
  companyName: string;
  setCompanyName: (n: string) => void;
  roles: AiRole[];
  addRole: (role?: Partial<AiRole>) => string;
  updateRole: (id: string, updates: Partial<AiRole>) => void;
  removeRole: (id: string) => void;
  /** Rollen komplett ersetzen (z. B. wenn der Assistent ein Team erstellt) */
  setRoles: (roles: AiRole[]) => void;
  pa: PaConfig;
  setPa: (updates: Partial<PaConfig>) => void;
  templates: AiCompanyTemplate[];
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
}

const DEFAULT_PA: PaConfig = {
  name: 'Persönliche Assistenz',
  personality: 'Freundlich, proaktiv, präzise. Denkt mit und schlägt nächste Schritte vor.',
  description: 'Deine rechte Hand — koordiniert Aufgaben, beantwortet Fragen und steuert die Oberfläche.',
  agentId: 'claude-free',
};

export const useAiCompanyStore = create<AiCompanyStore>()(
  persist(
    (set, get) => ({
      companyName: '',
      setCompanyName: (n) => set({ companyName: n }),
      roles: [],
      addRole: (role) => {
        const id = uidAi('role');
        set((s) => ({ roles: [...s.roles, {
          id,
          name: role?.name ?? 'Neue Rolle',
          description: role?.description ?? '',
          background: role?.background ?? '',
          assignedAgentId: role?.assignedAgentId ?? '',
        }] }));
        return id;
      },
      updateRole: (id, updates) => set((s) => ({ roles: s.roles.map(r => r.id === id ? { ...r, ...updates } : r) })),
      removeRole: (id) => set((s) => ({ roles: s.roles.filter(r => r.id !== id) })),
      setRoles: (roles) => set({ roles }),
      pa: DEFAULT_PA,
      setPa: (updates) => set((s) => ({ pa: { ...s.pa, ...updates } })),
      templates: [],
      saveTemplate: (name) => set((s) => ({
        templates: [...s.templates, {
          id: uidAi('tpl'), name: name.trim() || `Team ${s.templates.length + 1}`,
          roles: s.roles.map(r => ({ ...r })), createdAt: new Date().toISOString(),
        }],
      })),
      loadTemplate: (id) => {
        const tpl = get().templates.find(t => t.id === id);
        if (tpl) set({ roles: tpl.roles.map(r => ({ ...r, id: uidAi('role') })), companyName: tpl.name });
      },
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter(t => t.id !== id) })),
    }),
    { name: 'trinity-ai-company' }
  )
);

// ── Ninjas Store ───────────────────────────────────────────────────────────────
export type NinjaRole = 'founder' | 'creator' | 'assistant' | 'advisor' | 'system' | 'partner';

export interface AstroData {
  // Sun
  sunTropical: string;   sunTropicalGlyph: string;
  sunVedic: string;      sunVedicGlyph: string;
  // Moon
  moonTropical: string;  moonTropicalGlyph: string;
  // Ascendant (requires birthTime + birthCity)
  ascTropical?: string;  ascTropicalGlyph?: string;
  ascVedic?: string;     ascVedicGlyph?: string;
  // Other traditions
  chinese: string;       chineseEmoji: string;
  maya: { kin: number; tone: number; toneName: string; seal: string; glyph: string };
  // Human Design — auto-computed from I-Ching gate wheel + Meeus ephemeris
  hd?: {
    type?: string;
    profile:       string;  // e.g. "2/4" (Conscious Sun line / Design Sun line)
    gateConscious: number;  // I-Ching gate 1-64 at birth
    lineConscious: number;  // Line 1-6 within gate
    gateDesign:    number;  // I-Ching gate at Design date (88° before natal)
    lineDesign:    number;
    designSunLon:  number;  // tropical longitude of Design Sun
    designJD:      number;  // Julian Day of Design date
  };
  // Debug transparency
  meta?: {
    geocoded: boolean;
    ayanamsa: number;
    JD: number;
    sunLonDeg: number;     // raw tropical sun longitude
    sunLonVedic: number;   // vedic sun longitude
    birthDateUsed: string;
    birthTimeUsed: string;
  };
  // Metadata
  geocoded: boolean;
  computedAt: string;    // ISO date of last fetch
  inputKey: string;      // hash of inputs — detect staleness
}

export interface NinjaMember {
  id: string;
  name: string;
  role: NinjaRole;
  title: string;
  bio: string;
  avatar: string;
  imageUrl?: string;
  color: string;
  skills: string[];
  birthDate?: string;
  birthTime?: string;      // "HH:MM" local time as entered by user
  birthTimezone?: string;  // IANA tz string, e.g. "Europe/Vienna" — used to convert to UTC for API
  birthCity?: string;
  birthCountry?: string;
  // Manual overrides (HD type requires full ephemeris + channel analysis)
  hdType?: string;
  hdProfile?: string;
  // Cached auto-computed astrology data
  astroData?: AstroData;
  password: string;
  createdAt: string;
}

interface NinjasStore {
  members: NinjaMember[];
  addMember:    (m: Omit<NinjaMember, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, u: Partial<NinjaMember>) => void;
  removeMember: (id: string) => void;
}

const NOW = new Date().toISOString();
export const useNinjasStore = create<NinjasStore>()(
  persist(
    (set) => ({
      members: [
        { id:'cianta',            name:'Cianta',            role:'founder',   title:'Founder · YOU ARE NEO',        bio:'Visionärer Gründer des YOU ARE NEO Ökosystems. Architect des TRINITY OS. Träger der digitalen Souveränität.',                    avatar:'🥷', color:'gold',   skills:['Vision','Strategy','Brand','Leadership'],       birthDate:'1989-12-07', birthTime:'15:00', birthTimezone:'Europe/Vienna', birthCity:'Vienna',    birthCountry:'AT', hdType:'Manifesting Generator', hdProfile:'2/4', password:'0595', createdAt:NOW },
        { id:'norbert',           name:'Norbert',           role:'creator',   title:'Expert & Content Creator',     bio:'Inhaltlicher Visionär und Brückenbauer zwischen tiefem Wissen und lebendiger Gemeinschaft.',                                   avatar:'🎯', color:'purple', skills:['Content','Video','SEO','Community'],             birthDate:'',           birthTime:'', birthCity:'',          birthCountry:'',   password:'0595', createdAt:NOW },
        { id:'damiana',           name:'Damiana',           role:'creator',   title:'Creative & Production',        bio:'Kreative Seele. Designerin von Welten und visuellen Erlebnissen. Meisterin der ästhetischen Präzision.',                       avatar:'🌸', color:'rose',   skills:['Design','Copy','Creative','Motion'],             birthDate:'',           birthTime:'', birthCity:'',          birthCountry:'',   password:'0595', createdAt:NOW },
        { id:'thomas-b',          name:'Thomas B.',         role:'assistant', title:'Technology & Systems',         bio:'Technologie-Architekt. Baut und stabilisiert die digitale Infrastruktur des Imperiums.',                                       avatar:'💡', color:'sky',    skills:['Dev','Tech','Systems','Ops'],                    birthDate:'',           birthTime:'', birthCity:'',          birthCountry:'',   password:'0595', createdAt:NOW },
        { id:'gabba',             name:'Gabba',             role:'creator',   title:'Wellness & Flow Coach',        bio:'Wächter der Energie und des Flows. Bewusstsein als Werkzeug für Wachstum und Heilung.',                                        avatar:'🌊', color:'teal',   skills:['Wellness','Flow','Coaching','Community'],        birthDate:'',           birthTime:'', birthCity:'',          birthCountry:'',   password:'0595', createdAt:NOW },
        { id:'infinite-flow',     name:'Infinite Flow',     role:'creator',   title:'Movement & Embodiment',        bio:'Körperweisheit und Bewegung als spirituelle Praxis. Brücke zwischen dem Physischen und Metaphysischen.',                         avatar:'♾️', color:'violet', skills:['Movement','Yoga','Breathwork','Content'],       birthDate:'',           birthTime:'', birthCity:'',          birthCountry:'',   password:'0595', createdAt:NOW },
        { id:'elfi',              name:'Elfi',              role:'advisor',   title:'Energy & Healing Arts',        bio:'Hüterin der heilenden Frequenzen und des zeremoniellen Wissens. Führerin im Raum der feinen Energien.',                         avatar:'✨', color:'amber',  skills:['Healing','Energy','Ceremonies','Retreats'],     birthDate:'',           birthTime:'', birthCity:'',          birthCountry:'',   password:'0595', createdAt:NOW },
        { id:'crystal-bear-heart',name:'Crystal Bear Heart',role:'advisor',   title:'Sacred & Ceremonial Arts',     bio:'Medizin-Trägerin des Heiligen. Zeremonienmeisterin der Mitte. Brücke zwischen den Welten.',                                    avatar:'🐻', color:'forest', skills:['Sacred','Ceremony','Healing','Medicine'],       birthDate:'',           birthTime:'', birthCity:'',          birthCountry:'',   password:'0595', createdAt:NOW },
      ],
      addMember:    (m)     => set(s => ({ members: [...s.members, { ...m, id:`ninja-${Date.now()}`, createdAt:new Date().toISOString() }] })),
      updateMember: (id, u) => set(s => ({ members: s.members.map(m => m.id===id ? {...m,...u} : m) })),
      removeMember: (id)    => set(s => ({ members: s.members.filter(m => m.id!==id) })),
    }),
    { name: 'trinity-ninjas' }
  )
);

// ── App Launcher Store (bookmark/program cards per page) ──────────────────────
export interface LauncherApp {
  workspace?: "private" | "organization" | "both";
  id: string;
  name: string;
  url: string;                    // webapp URL or absolute program path
  kind: 'webapp' | 'program';
  openMode: 'tab' | 'popup';      // only for webapps
  description: string;
  imageUrl?: string;              // favicon / og:image
  createdAt: string;
}

interface LauncherStore {
  apps: Record<string, LauncherApp[]>;   // keyed by pageKey
  addApp: (pageKey: string, app: Omit<LauncherApp, 'id' | 'createdAt'>) => void;
  updateApp: (pageKey: string, id: string, patch: Partial<LauncherApp>) => void;
  removeApp: (pageKey: string, id: string) => void;
}

export const useLauncherStore = create<LauncherStore>()(
  persist(
    (set) => ({
      apps: {},
      addApp: (pageKey, app) => set((s) => ({
        apps: { ...s.apps, [pageKey]: [...(s.apps[pageKey] ?? []), { ...app, id: uid('app'), createdAt: new Date().toISOString() }] },
      })),
      updateApp: (pageKey, id, patch) => set((s) => ({
        apps: { ...s.apps, [pageKey]: (s.apps[pageKey] ?? []).map(a => a.id === id ? { ...a, ...patch } : a) },
      })),
      removeApp: (pageKey, id) => set((s) => ({
        apps: { ...s.apps, [pageKey]: (s.apps[pageKey] ?? []).filter(a => a.id !== id) },
      })),
    }),
    { name: 'trinity-launcher' }
  )
);

// ── Social Channels Store ──────────────────────────────────────────────────────
export interface SocialChannel {
  id: string;
  platform: string;               // 'youtube' | 'instagram' | ... (matches CHANNEL_PLATFORMS keys)
  name: string;
  url: string;
  openMode: 'tab' | 'popup';
  createdAt: string;
}

interface ChannelsStore {
  channels: SocialChannel[];
  addChannel: (c: Omit<SocialChannel, 'id' | 'createdAt'>) => void;
  updateChannel: (id: string, patch: Partial<SocialChannel>) => void;
  removeChannel: (id: string) => void;
}

export const useChannelsStore = create<ChannelsStore>()(
  persist(
    (set) => ({
      channels: [],
      addChannel: (c) => set((s) => ({
        channels: [...s.channels, { ...c, id: uid('ch'), createdAt: new Date().toISOString() }],
      })),
      updateChannel: (id, patch) => set((s) => ({
        channels: s.channels.map(c => c.id === id ? { ...c, ...patch } : c),
      })),
      removeChannel: (id) => set((s) => ({ channels: s.channels.filter(c => c.id !== id) })),
    }),
    { name: 'trinity-channels' }
  )
);

// ── Social Strategy Store ──────────────────────────────────────────────────────
export interface StrategySection {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface StrategyStore {
  sections: StrategySection[];
  activeSectionId: string | null;
  addSection: (title: string) => void;
  updateSection: (id: string, patch: Partial<Pick<StrategySection, 'title' | 'content'>>) => void;
  removeSection: (id: string) => void;
  setActiveSection: (id: string | null) => void;
}

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set) => ({
      sections: [
        { id: 'strat-main', title: 'Hauptstrategie', content: '', createdAt: new Date().toISOString() },
      ],
      activeSectionId: 'strat-main',
      addSection: (title) => set((s) => {
        const id = uid('strat');
        return { sections: [...s.sections, { id, title, content: '', createdAt: new Date().toISOString() }], activeSectionId: id };
      }),
      updateSection: (id, patch) => set((s) => ({
        sections: s.sections.map(x => x.id === id ? { ...x, ...patch } : x),
      })),
      removeSection: (id) => set((s) => ({
        sections: s.sections.filter(x => x.id !== id),
        activeSectionId: s.activeSectionId === id ? (s.sections[0]?.id ?? null) : s.activeSectionId,
      })),
      setActiveSection: (id) => set({ activeSectionId: id }),
    }),
    { name: 'trinity-strategy' }
  )
);
