'use client';
import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay,
  KeyboardSensor, pointerWithin, rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Check, X, Pencil, Trash2, FolderKanban, GripVertical, GripHorizontal,
  Paintbrush, Link2, Layers, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, PRIORITY_COLORS, TASK_TYPE_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { SharePicker } from '@/components/shared/SharePicker';
import { newComment, TRINITY_SYNC_EVENT } from '@/lib/crossPublish';
import { Bot } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TaskCard } from './TaskCard';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES — exported so TaskCard.tsx can import them
// ══════════════════════════════════════════════════════════════════════════════
export interface Attachment {
  id: string;
  name: string;
  mime: string;
  dataUrl: string;
  size: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TCard {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: string;
  tags: string[];
  assignedAgent: string;
  attachments: Attachment[];
  subtasks: Subtask[];
  createdAt: string;
  /** Owner (team member name). Legacy cards without owner are visible to everyone. */
  ownerId?: string;
  /** Sharing: undefined/null = private to owner · 'all' = every member · string[] = selected members */
  sharedWith?: 'all' | string[] | null;
  /** Kommentar-Zettel */
  comments?: import('@/lib/crossPublish').CardComment[];
  /** Angeheftete Unter-Aufgaben (klebende Karten unter der Hauptkarte) */
  subCards?: { id: string; title: string; description: string }[];
  /** Kommt von einem Eden-Canvas-Board */
  fromCanvas?: { boardId: string; boardName: string };
}

/** Visibility rule for kanban cards (mirrors goalVisibleTo). */
export function cardVisibleTo(card: TCard, userName: string | null): boolean {
  if (!card.ownerId) return true;                 // legacy data — never hide
  const me = userName ?? '';
  if (card.ownerId === me) return true;
  if (card.sharedWith === 'all') return true;
  if (Array.isArray(card.sharedWith) && card.sharedWith.includes(me)) return true;
  return false;
}

export interface TColumn {
  id: string;
  label: string;
  color: string;  // tailwind text-* class
  cardIds: string[]; // ordered
}

export interface TProject {
  id: string;
  name: string;
  columns: TColumn[];
  /** Besitzer (Team-Mitglied). Legacy-Boards ohne Besitzer sind für alle sichtbar. */
  ownerId?: string;
  /** Teilen: undefined/null = privat · 'all' = ganze Firma · string[] = ausgewählte Mitglieder */
  sharedWith?: 'all' | string[] | null;
}

/** Sichtbarkeitsregel für ganze Boards (analog zu cardVisibleTo). */
export function projectVisibleTo(proj: TProject, userName: string | null): boolean {
  if (!proj.ownerId) return true;                 // legacy — nie verstecken
  const me = userName ?? '';
  if (proj.ownerId === me) return true;
  if (proj.sharedWith === 'all') return true;
  if (Array.isArray(proj.sharedWith) && proj.sharedWith.includes(me)) return true;
  return false;
}

export interface CardConnection {
  id: string;
  fromId: string;
  toId: string;
  color: string;
}

export interface CardGroup {
  id: string;
  name: string;
  color: string; // hex color
  cardIds: string[];
}

interface KanbanState {
  projects: TProject[];
  activeProjectId: string;
  cards: Record<string, TCard>;
  connections: CardConnection[];
  groups?: CardGroup[];
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════
const LS_KEY = 'trinity-kanban-v2';

const DEFAULT_STATE: KanbanState = {
  activeProjectId: 'proj-default',
  projects: [
    {
      id: 'proj-default', name: 'Mein Board',
      columns: [
        { id: 'col-idee',        label: 'Idee',        color: 'text-violet-300', cardIds: [] },
        { id: 'col-todo',        label: 'To Do',       color: 'text-anth-300',   cardIds: [] },
        { id: 'col-inprogress',  label: 'In Progress', color: 'text-amber-300',  cardIds: [] },
        { id: 'col-erledigt',    label: 'Erledigt',    color: 'text-forest-300', cardIds: [] },
      ],
    },
  ],
  cards: {},
  connections: [],
};

const COL_COLORS = [
  'text-violet-300', 'text-sky-300', 'text-amber-300',
  'text-forest-300', 'text-pink-300', 'text-anth-300',
];

// Accent hex per column color class — drives the gradient/3D column styling
const COL_ACCENTS: Record<string, string> = {
  'text-violet-300': '#a78bfa',
  'text-sky-300':    '#7dd3fc',
  'text-amber-300':  '#fcd34d',
  'text-forest-300': '#68BC8C',
  'text-pink-300':   '#f9a8d4',
  'text-anth-300':   '#9aa3ad',
};
const colAccent = (colorClass: string) => COL_ACCENTS[colorClass] ?? '#68BC8C';

// ══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function loadState(): KanbanState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as KanbanState;
    // Safety: ensure required fields exist
    if (!parsed.projects?.length) return DEFAULT_STATE;
    if (!parsed.cards) parsed.cards = {};
    if (!parsed.connections) parsed.connections = [];
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: KanbanState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* storage full — ignore */ }
}

function genId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// SORTABLE PROJECT ITEM
// ══════════════════════════════════════════════════════════════════════════════
function SortableProject({
  project, isActive, onSelect, onRename, onDelete, canDelete, onShare,
}: {
  project: TProject;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  canDelete: boolean;
  onShare: (v: 'all' | string[] | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  const cardCount = project.columns.reduce((n, c) => n + c.cardIds.length, 0);

  const commit = () => {
    if (name.trim()) onRename(name.trim());
    else setName(project.name);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all group cursor-pointer',
        isActive
          ? 'bg-forest-800/50 border-forest-600/50 text-forest-100 shadow-[0_0_12px_rgba(17,202,160,0.12)]'
          : 'border-transparent text-anth-400 hover:bg-forest-900/30 hover:text-anth-200',
        isDragging && 'opacity-40',
      )}
      onClick={() => !editing && onSelect()}
    >
      {/* Drag handle */}
      <span {...attributes} {...listeners}
        className="shrink-0 text-anth-700 hover:text-anth-400 cursor-grab active:cursor-grabbing"
        onClick={e => e.stopPropagation()}>
        <GripVertical size={12} />
      </span>

      {editing ? (
        <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setName(project.name); setEditing(false); } }}
            autoFocus
            className="flex-1 bg-surface border border-forest-700/50 rounded-lg px-2 py-0.5 text-xs text-forest-100 outline-none" />
          <button onClick={commit} className="text-forest-400 p-0.5"><Check size={10} /></button>
          <button onClick={() => { setName(project.name); setEditing(false); }} className="text-anth-500 p-0.5"><X size={10} /></button>
        </div>
      ) : (
        <span className="flex-1 text-sm font-medium truncate">{project.name}</span>
      )}

      {!editing && (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-anth-600 bg-anth-800/60 rounded-full px-1.5 py-0.5">{cardCount}</span>
          <SharePicker
            value={project.sharedWith}
            onChange={v => onShare(v ?? null)}
            iconSize={9}
            className={cn('p-0.5 bg-transparent', !project.sharedWith && 'opacity-0 group-hover:opacity-100')}
          />
          <button onClick={e => { e.stopPropagation(); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-anth-600 hover:text-forest-300 transition-all">
            <Pencil size={9} />
          </button>
          {canDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-anth-600 hover:text-red-400 transition-all">
              <Trash2 size={9} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SORTABLE COLUMN
// ══════════════════════════════════════════════════════════════════════════════
function SortableColumn({
  col, cards, activeCardId, canDelete,
  onAddCard, onDeleteCol, onRenameCol,
  onDeleteCard, onUpdateCard,
  connectMode, pendingFromId, onConnectCardClick,
  groupMode, pendingGroupCards, onGroupCardToggle,
  groups, allColumns, onDeleteGroup, onMoveGroup, project, onEditCard,
}: {
  col: TColumn;
  cards: TCard[];
  activeCardId: string | null;
  canDelete: boolean;
  onAddCard: () => void;
  onDeleteCol: () => void;
  onRenameCol: (label: string) => void;
  onDeleteCard: (id: string) => void;
  onUpdateCard: (id: string, patch: Partial<TCard>) => void;
  connectMode?: boolean;
  pendingFromId?: string | null;
  onConnectCardClick?: (id: string) => void;
  groupMode?: boolean;
  pendingGroupCards?: Set<string>;
  onGroupCardToggle?: (id: string) => void;
  groups?: CardGroup[];
  allColumns?: TColumn[];
  onDeleteGroup?: (id: string) => void;
  onMoveGroup?: (groupId: string, targetColId: string) => void;
  project?: { id: string; name: string };
  onEditCard?: (id: string) => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(col.label);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'column' },
  });

  const commit = () => {
    if (label.trim()) onRenameCol(label.trim());
    else setLabel(col.label);
    setEditing(false);
  };

  // ── Group helpers for this column ──────────────────────────────────────────
  // Build a map: cardId → group (if any)
  const cardGroupMap: Record<string, CardGroup> = {};
  const groupFirstInCol: Record<string, string> = {};
  (groups ?? []).forEach(group => {
    col.cardIds.forEach(cardId => {
      if (group.cardIds.includes(cardId)) {
        cardGroupMap[cardId] = group;
        if (!groupFirstInCol[group.id]) groupFirstInCol[group.id] = cardId;
      }
    });
  });

  const accent = colAccent(col.color);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        // 3D column card: per-column colour tint fading into anthracite,
        // top accent bar, deep drop shadow + subtle inner top highlight
        background: `linear-gradient(180deg, ${accent}16 0%, rgba(27,30,36,0.72) 26%, rgba(21,23,28,0.92) 100%)`,
        border: `1px solid ${accent}2e`,
        borderTop: `3px solid ${accent}cc`,
        borderRadius: '1.25rem',
        boxShadow: `0 14px 34px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.35), 0 0 24px ${accent}0d, inset 0 1px 0 rgba(255,255,255,0.07)`,
      }}
      className={cn('flex flex-col w-64 shrink-0 p-2.5', isDragging && 'opacity-50')}
    >
      {/* ── Column Header ── */}
      <div className="flex items-center gap-1.5 mb-2.5 px-1 pt-0.5">
        {/* Drag handle for column */}
        <span {...attributes} {...listeners}
          className="text-anth-700 hover:text-anth-400 cursor-grab active:cursor-grabbing shrink-0">
          <GripHorizontal size={12} />
        </span>

        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <input value={label} onChange={e => setLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setLabel(col.label); setEditing(false); } }}
              autoFocus
              className="flex-1 bg-surface border border-border rounded-lg px-2 py-0.5 text-xs text-forest-100 outline-none" />
            <button onClick={commit} className="text-forest-400 p-0.5"><Check size={10} /></button>
            <button onClick={() => { setLabel(col.label); setEditing(false); }} className="text-anth-500 p-0.5"><X size={10} /></button>
          </div>
        ) : (
          <button className="flex items-center gap-1.5 flex-1 min-w-0"
            onDoubleClick={() => setEditing(true)}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}80` }} />
            <span className={cn('text-xs font-bold uppercase tracking-wider truncate', col.color)}>{t(col.label)}</span>
            <span className="text-[10px] rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-semibold"
              style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}33` }}>
              {cards.length}
            </span>
          </button>
        )}

        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            {canDelete && (
              <button onClick={onDeleteCol}
                className="p-1 rounded text-anth-700 hover:text-red-400 transition-colors">
                <Trash2 size={10} />
              </button>
            )}
            {/* Always-visible + button next to header */}
            <button
              onClick={onAddCard}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-forest-800/50 border border-forest-700/40 text-forest-400 hover:text-forest-200 hover:bg-forest-700/50 hover:border-forest-600/60 transition-all font-medium"
              title={t('Karte hinzufügen')}
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Drop Zone — clean inset area, glows in accent colour while dragging ── */}
      <div
        className="flex-1 rounded-xl transition-all min-h-[120px] p-1.5"
        style={activeCardId
          ? { background: `${accent}0f`, boxShadow: `inset 0 0 0 1.5px ${accent}66, inset 0 2px 8px rgba(0,0,0,0.3)` }
          : { background: 'rgba(0,0,0,0.18)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.28)' }}
      >
        <SortableContext items={col.cardIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {cards.map(card => {
              const cardGroup   = cardGroupMap[card.id];
              const isGroupFirst = cardGroup && groupFirstInCol[cardGroup.id] === card.id;
              const isGroupSelected = groupMode && (pendingGroupCards?.has(card.id) ?? false);

              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="mb-2"
                >
                  {/* Group header label above first card in this column */}
                  {isGroupFirst && cardGroup && (
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 mb-0.5 rounded-t-lg text-[10px] font-semibold"
                      style={{ backgroundColor: `${cardGroup.color}18`, borderLeft: `3px solid ${cardGroup.color}` }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cardGroup.color }} />
                      <span style={{ color: cardGroup.color }}>{cardGroup.name}</span>
                      <div className="ml-auto flex items-center gap-1">
                        {/* Move group */}
                        {(allColumns ?? []).filter(c => c.id !== col.id).length > 0 && (
                          <select
                            className="text-[9px] bg-transparent text-anth-500 outline-none cursor-pointer"
                            onChange={e => { if (e.target.value) onMoveGroup?.(cardGroup.id, e.target.value); e.target.value = ''; }}
                            defaultValue=""
                            title={t('Gruppe verschieben')}
                          >
                            <option value="" disabled>{t('Verschieben…')}</option>
                            {(allColumns ?? []).filter(c => c.id !== col.id).map(c => (
                              <option key={c.id} value={c.id}>{t(c.label)}</option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => onDeleteGroup?.(cardGroup.id)}
                          className="text-anth-700 hover:text-red-400 transition-colors"
                          title={t('Gruppe löschen')}
                        >
                          <X size={9} />
                        </button>
                      </div>
                    </div>
                  )}
                  <TaskCard
                    card={card}
                    onDelete={onDeleteCard}
                    onUpdate={onUpdateCard}
                    statusLabel={col.label}
                    statusColor={colAccent(col.color)}
                    project={project}
                    onEdit={onEditCard}
                    connectMode={connectMode}
                    isPendingFrom={pendingFromId === card.id}
                    onConnectClick={onConnectCardClick}
                    groupMode={groupMode}
                    isGroupSelected={isGroupSelected}
                    onGroupToggle={onGroupCardToggle}
                    groupColor={cardGroup?.color}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </SortableContext>

        {cards.length === 0 && !activeCardId && (
          <div className="flex items-center justify-center h-16">
            <p className="text-[10px] text-anth-700">{t('Hierher ziehen')}</p>
          </div>
        )}

        {/* ── Always-visible "Add Card" at bottom of list ── */}
        <button
          onClick={onAddCard}
          className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs text-anth-600 hover:text-anth-200 transition-all"
          style={{ background: 'rgba(255,255,255,0.03)' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}14`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <Plus size={14} className="shrink-0" style={{ color: accent }} />
          <span>{t('Karte hinzufügen')}</span>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
// ── Connection line colors ─────────────────────────────────────────────────────
const CONN_COLORS = ['#11CAA0','#f59e0b','#ef4444','#3b82f6','#a78bfa','#ec4899','#f97316','#06b6d4','#84cc16','#fff'];

export function KanbanBoard() {
  const t = useT();
  // ── State ──────────────────────────────────────────────────────────────────
  const [kb, setKb] = useState<KanbanState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const currentUser = useAuthStore(s => s.user?.name ?? null);

  // Load from localStorage on mount (anti-wipe)
  useEffect(() => {
    setKb(loadState());
    setHydrated(true);
  }, []);

  // Der Assistent (Chat-Widget) schreibt direkt in localStorage → neu laden
  useEffect(() => {
    const reload = () => setKb(loadState());
    window.addEventListener(TRINITY_SYNC_EVENT, reload);
    return () => window.removeEventListener(TRINITY_SYNC_EVENT, reload);
  }, []);

  // Persist every change
  useEffect(() => {
    if (hydrated) saveState(kb);
  }, [kb, hydrated]);

  // ── DnD state ──────────────────────────────────────────────────────────────
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'card' | 'column' | 'project' | null>(null);

  // ── Connection state ───────────────────────────────────────────────────────
  const [connectMode,      setConnectMode]      = useState(false);
  const [connectColor,     setConnectColor]     = useState('#11CAA0');
  const [pendingFromId,    setPendingFromId]    = useState<string | null>(null);
  const [selectedConnId,   setSelectedConnId]   = useState<string | null>(null);
  const [cardCenters,      setCardCenters]      = useState<Record<string, { x: number; y: number }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Group state ────────────────────────────────────────────────────────────
  const [groupMode,         setGroupMode]         = useState(false);
  const [pendingGroupCards, setPendingGroupCards] = useState<Set<string>>(new Set());
  // showGroupCreate removed — confirmation is now the inline bar that appears automatically
  const [newGroupName,      setNewGroupName]      = useState('');
  const [newGroupColor,     setNewGroupColor]     = useState('#11CAA0');

  const GROUP_COLORS = ['#11CAA0','#f59e0b','#ef4444','#3b82f6','#a78bfa','#ec4899','#f97316','#06b6d4','#84cc16','#e2c97e'];

  // ── Modal state ────────────────────────────────────────────────────────────
  const [cardModal, setCardModal]     = useState(false);
  const [editCardId, setEditCardId]   = useState<string | null>(null);
  const [targetColId, setTargetColId] = useState<string>('');
  const [newColLabel, setNewColLabel] = useState('');
  const [showNewCol, setShowNewCol]   = useState(false);
  const [showNewProj, setShowNewProj] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [saving, setSaving]           = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium' as TCard['priority'],
    type: 'content', assignedAgent: '', tags: '',
  });

  // ── Sensors ────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Custom collision: prioritise cards over columns ────────────────────────
  const customCollision: CollisionDetection = useCallback((args) => {
    // First: try to find a card directly under the pointer
    const pointerCollisions = pointerWithin(args);
    // Filter to card IDs only (exclude column IDs)
    const proj = kb.projects.find(p => p.id === kb.activeProjectId);
    const colIds = new Set(proj?.columns.map(c => c.id) ?? []);
    const cardCollisions = pointerCollisions.filter(({ id }) => !colIds.has(String(id)));
    if (cardCollisions.length > 0) return cardCollisions;
    // Fallback: return anything (column or card) via rect intersection
    return rectIntersection(args);
  }, [kb]);

  // ── Compute card centers for SVG lines ────────────────────────────────────
  // useLayoutEffect + rAF → runs after DOM paint so positions are accurate.
  // Also attaches a scroll listener so lines update when the board is scrolled.
  const computeCenters = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const centers: Record<string, { x: number; y: number }> = {};
    container.querySelectorAll<HTMLElement>('[data-card-id]').forEach(el => {
      const id = el.getAttribute('data-card-id')!;
      const r  = el.getBoundingClientRect();
      centers[id] = {
        x: r.left - containerRect.left + container.scrollLeft + r.width  / 2,
        y: r.top  - containerRect.top  + container.scrollTop  + r.height / 2,
      };
    });
    setCardCenters(centers);
  }, []);

  useLayoutEffect(() => {
    if (!hydrated) return;
    const raf = requestAnimationFrame(computeCenters);
    return () => cancelAnimationFrame(raf);
  }, [kb, hydrated, connectMode, computeCenters]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', computeCenters, { passive: true });
    return () => container.removeEventListener('scroll', computeCenters);
  }, [computeCenters]);

  // ── Connection mode handlers ───────────────────────────────────────────────
  const handleConnectCardClick = useCallback((cardId: string) => {
    if (!connectMode) return;
    if (!pendingFromId) {
      setPendingFromId(cardId);
    } else if (pendingFromId !== cardId) {
      const exists = (kb.connections ?? []).some(c =>
        (c.fromId === pendingFromId && c.toId === cardId) ||
        (c.fromId === cardId && c.toId === pendingFromId)
      );
      if (!exists) {
        update(s => ({
          ...s,
          connections: [...(s.connections ?? []), {
            id: genId('conn'),
            fromId: pendingFromId,
            toId: cardId,
            color: connectColor,
          }],
        }));
      }
      setPendingFromId(null);
    }
  }, [connectMode, pendingFromId, kb.connections, connectColor]);

  const deleteConnection = (connId: string) => {
    update(s => ({ ...s, connections: (s.connections ?? []).filter(c => c.id !== connId) }));
    setSelectedConnId(null);
  };

  const updateConnectionColor = (connId: string, color: string) => {
    update(s => ({
      ...s,
      connections: (s.connections ?? []).map(c => c.id === connId ? { ...c, color } : c),
    }));
  };

  // ── Group handlers ─────────────────────────────────────────────────────────
  const handleGroupCardToggle = useCallback((cardId: string) => {
    if (!groupMode) return;
    setPendingGroupCards(prev => {
      const next = new Set(prev);
      next.has(cardId) ? next.delete(cardId) : next.add(cardId);
      return next;
    });
  }, [groupMode]);

  // createGroup is defined after `update` below

  // deleteGroup and moveGroupToColumn are defined after `update` below

  // ── Derived ────────────────────────────────────────────────────────────────
  const visibleProjects = kb.projects.filter(p => projectVisibleTo(p, currentUser));
  const activeProject = visibleProjects.find(p => p.id === kb.activeProjectId) ?? visibleProjects[0];
  // Board wurde von jemand anderem mit mir geteilt → alle Karten darin anzeigen
  const boardSharedToMe = Boolean(activeProject?.ownerId && activeProject.ownerId !== (currentUser ?? '') && activeProject.sharedWith);

  // ── State helpers (always sync to localStorage) ────────────────────────────
  const update = useCallback((fn: (prev: KanbanState) => KanbanState) => {
    setKb(prev => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  // ── Projects ───────────────────────────────────────────────────────────────
  const addProject = () => {
    if (!newProjName.trim()) return;
    const id = genId('proj');
    update(s => ({
      ...s,
      projects: [...s.projects, {
        id, name: newProjName.trim(),
        ownerId: useAuthStore.getState().user?.name ?? undefined,
        columns: [
          { id: genId('col'), label: 'To Do',       color: 'text-anth-300',  cardIds: [] },
          { id: genId('col'), label: 'In Progress', color: 'text-amber-300', cardIds: [] },
          { id: genId('col'), label: 'Erledigt',    color: 'text-forest-300', cardIds: [] },
        ],
      }],
      activeProjectId: id,
    }));
    setNewProjName('');
    setShowNewProj(false);
  };

  const deleteProject = (projId: string) => {
    update(s => {
      const remaining = s.projects.filter(p => p.id !== projId);
      return {
        ...s,
        projects: remaining,
        activeProjectId: remaining[0]?.id ?? '',
      };
    });
  };

  const renameProject = (projId: string, name: string) => {
    update(s => ({
      ...s,
      projects: s.projects.map(p => p.id === projId ? { ...p, name } : p),
    }));
  };

  const openEditCard = (cardId: string) => {
    const c = kb.cards[cardId];
    if (!c) return;
    setForm({
      title: c.title, description: c.description, priority: c.priority,
      type: c.type, assignedAgent: c.assignedAgent, tags: c.tags.join(', '),
    });
    setEditCardId(cardId);
    setCardModal(true);
  };

  const shareProject = (projId: string, sharedWith: 'all' | string[] | null) => {
    update(s => ({
      ...s,
      projects: s.projects.map(p => p.id === projId
        ? { ...p, sharedWith, ownerId: p.ownerId ?? (useAuthStore.getState().user?.name ?? undefined) }
        : p),
    }));
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const addColumn = () => {
    if (!newColLabel.trim() || !activeProject) return;
    const colId = genId('col');
    const colorIdx = activeProject.columns.length % COL_COLORS.length;
    update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === s.activeProjectId
          ? { ...p, columns: [...p.columns, { id: colId, label: newColLabel.trim(), color: COL_COLORS[colorIdx], cardIds: [] }] }
          : p
      ),
    }));
    setNewColLabel('');
    setShowNewCol(false);
  };

  const deleteColumn = (colId: string) => {
    update(s => ({
      ...s,
      projects: s.projects.map(p => {
        if (p.id !== s.activeProjectId) return p;
        const col = p.columns.find(c => c.id === colId);
        // Remove all cards in this column
        const newCards = { ...s.cards };
        col?.cardIds.forEach(cid => { delete newCards[cid]; });
        return { ...p, columns: p.columns.filter(c => c.id !== colId) };
      }),
    }));
  };

  const renameColumn = (colId: string, label: string) => {
    update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === s.activeProjectId
          ? { ...p, columns: p.columns.map(c => c.id === colId ? { ...c, label } : c) }
          : p
      ),
    }));
  };

  // ── Cards ──────────────────────────────────────────────────────────────────
  const createCard = () => {
    if (!form.title.trim()) return;
    setSaving(true);
    // Bearbeiten-Modus: bestehende Karte aktualisieren
    if (editCardId) {
      update(s => ({
        ...s,
        cards: {
          ...s.cards,
          [editCardId]: {
            ...s.cards[editCardId],
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority,
            type: form.type,
            assignedAgent: form.assignedAgent,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          },
        },
      }));
      setEditCardId(null);
      setCardModal(false);
      setSaving(false);
      setForm({ title: '', description: '', priority: 'medium', type: 'content', assignedAgent: '', tags: '' });
      return;
    }
    const id = genId('card');
    const card: TCard = {
      id,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      type: form.type,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      assignedAgent: form.assignedAgent,
      attachments: [],
      subtasks: [],
      createdAt: new Date().toISOString(),
      ownerId: useAuthStore.getState().user?.name ?? undefined,
    };
    update(s => ({
      ...s,
      cards: { ...s.cards, [id]: card },
      projects: s.projects.map(p =>
        p.id === s.activeProjectId
          ? {
            ...p,
            columns: p.columns.map(c =>
              c.id === targetColId ? { ...c, cardIds: [...c.cardIds, id] } : c
            ),
          }
          : p
      ),
    }));
    setForm({ title: '', description: '', priority: 'medium', type: 'content', assignedAgent: '', tags: '' });
    setCardModal(false);
    setSaving(false);
  };

  const deleteCard = useCallback((cardId: string) => {
    update(s => {
      const newCards = { ...s.cards };
      delete newCards[cardId];
      return {
        ...s,
        cards: newCards,
        projects: s.projects.map(p => ({
          ...p,
          columns: p.columns.map(c => ({ ...c, cardIds: c.cardIds.filter(id => id !== cardId) })),
        })),
      };
    });
  }, [update]);

  const updateCard = useCallback((cardId: string, patch: Partial<TCard>) => {
    update(s => ({
      ...s,
      cards: { ...s.cards, [cardId]: { ...s.cards[cardId], ...patch } },
    }));
  }, [update]);

  // ── Group handlers (need `update`) ────────────────────────────────────────
  const createGroup = useCallback(() => {
    if (!newGroupName.trim() || pendingGroupCards.size === 0) return;
    update(s => ({
      ...s,
      groups: [...(s.groups ?? []), {
        id: genId('grp'),
        name: newGroupName.trim(),
        color: newGroupColor,
        cardIds: Array.from(pendingGroupCards),
      }],
    }));
    setPendingGroupCards(new Set());
    setNewGroupName('');
    setNewGroupColor('#11CAA0');
    setGroupMode(false);
    // confirmation bar is hidden automatically when pendingGroupCards is cleared
  }, [newGroupName, pendingGroupCards, newGroupColor, update]);

  const deleteGroup = useCallback((groupId: string) => {
    update(s => ({ ...s, groups: (s.groups ?? []).filter(g => g.id !== groupId) }));
  }, [update]);

  const moveGroupToColumn = useCallback((groupId: string, targetColId: string) => {
    const group = (kb.groups ?? []).find(g => g.id === groupId);
    if (!group) return;
    update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id !== s.activeProjectId ? p : {
          ...p,
          columns: p.columns.map(c => ({
            ...c,
            cardIds: c.id === targetColId
              ? [...c.cardIds.filter(id => !group.cardIds.includes(id)), ...group.cardIds]
              : c.cardIds.filter(id => !group.cardIds.includes(id)),
          })),
        }
      ),
    }));
  }, [kb.groups, update]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Find which column contains a card
  const findColOfCard = useCallback((cardId: string): TColumn | undefined => {
    if (!activeProject) return undefined;
    return activeProject.columns.find(c => c.cardIds.includes(cardId));
  }, [activeProject]);

  // ══════════════════════════════════════════════════════════════════════════
  // DND — PROJECTS (separate context in left panel)
  // ══════════════════════════════════════════════════════════════════════════
  const handleProjDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update(s => {
      const from = s.projects.findIndex(p => p.id === active.id);
      const to   = s.projects.findIndex(p => p.id === over.id);
      if (from < 0 || to < 0) return s;
      return { ...s, projects: arrayMove(s.projects, from, to) };
    });
  }, [update]);

  // ══════════════════════════════════════════════════════════════════════════
  // DND — COLUMNS + CARDS (main area)
  // ══════════════════════════════════════════════════════════════════════════
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const id = active.id as string;
    setActiveId(id);
    if (activeProject?.columns.some(c => c.id === id)) {
      setActiveType('column');
    } else {
      setActiveType('card');
    }
  }, [activeProject]);

  const handleDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over || !activeProject || activeType !== 'card') return;
    const activeCardId = active.id as string;
    const overId       = over.id as string;

    const activeCol = activeProject.columns.find(c => c.cardIds.includes(activeCardId));
    if (!activeCol) return;

    const overCol = activeProject.columns.find(c => c.id === overId)
      ?? activeProject.columns.find(c => c.cardIds.includes(overId));
    if (!overCol || activeCol.id === overCol.id) return;

    // If the dragged card belongs to a group, move ALL group cards together
    update(s => {
      if (!s.activeProjectId) return s;
      const group = (s.groups ?? []).find(g => g.cardIds.includes(activeCardId));
      const cardsToMove = group ? group.cardIds : [activeCardId];

      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== s.activeProjectId) return p;
          return {
            ...p,
            columns: p.columns.map(c => {
              if (c.id === activeCol.id) {
                return { ...c, cardIds: c.cardIds.filter(id => !cardsToMove.includes(id)) };
              }
              if (c.id === overCol.id) {
                const without = c.cardIds.filter(id => !cardsToMove.includes(id));
                return { ...c, cardIds: [...without, ...cardsToMove] };
              }
              return c;
            }),
          };
        }),
      };
    });
  }, [activeProject, activeType, update]);

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);
    if (!over || !activeProject) return;

    const activeId = active.id as string;
    const overId   = over.id   as string;
    if (activeId === overId) return;

    // ── Column reorder ──────────────────────────────────────────────────────
    if (activeType === 'column' || activeProject.columns.some(c => c.id === activeId)) {
      update(s => {
        const proj = s.projects.find(p => p.id === s.activeProjectId);
        if (!proj) return s;
        const from = proj.columns.findIndex(c => c.id === activeId);
        const to   = proj.columns.findIndex(c => c.id === overId);
        if (from < 0 || to < 0) return s;
        return {
          ...s,
          projects: s.projects.map(p =>
            p.id === s.activeProjectId
              ? { ...p, columns: arrayMove(p.columns, from, to) }
              : p
          ),
        };
      });
      return;
    }

    // ── Card reorder within same column (including group reorder) ───────────
    update(s => {
      const proj = s.projects.find(p => p.id === s.activeProjectId);
      if (!proj) return s;

      const activeCol = proj.columns.find(c => c.cardIds.includes(activeId));
      const overCol   = proj.columns.find(c => c.id === overId || c.cardIds.includes(overId));
      if (!activeCol || !overCol) return s;

      if (activeCol.id !== overCol.id) {
        // Cross-column already handled in onDragOver
        return s;
      }

      // Same column — reorder; if grouped, move all group cards as a block
      const group = (s.groups ?? []).find(g => g.cardIds.includes(activeId));
      const cardsToMove = group ? group.cardIds.filter(id => activeCol.cardIds.includes(id)) : [activeId];
      const insertAt = overCol.cardIds.includes(overId) ? overCol.cardIds.indexOf(overId) : overCol.cardIds.length;

      const remaining = activeCol.cardIds.filter(id => !cardsToMove.includes(id));
      const insertIdx = Math.min(insertAt, remaining.length);
      const reordered = [
        ...remaining.slice(0, insertIdx),
        ...cardsToMove,
        ...remaining.slice(insertIdx),
      ];

      return {
        ...s,
        projects: s.projects.map(p =>
          p.id === s.activeProjectId
            ? { ...p, columns: p.columns.map(c => c.id === activeCol.id ? { ...c, cardIds: reordered } : c) }
            : p
        ),
      };
    });
  }, [activeProject, activeType, update]);

  // ── Overlay items ──────────────────────────────────────────────────────────
  const activeCard   = activeType === 'card'   ? kb.cards[activeId!] : null;
  const activeColObj = activeType === 'column' ? activeProject?.columns.find(c => c.id === activeId) : null;

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-forest-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!activeProject) return null;

  return (
    <div className="h-full flex gap-0 overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT: PROJECTS PANEL (250px)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="w-[250px] shrink-0 flex flex-col bg-anth-950/40 overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.10)', boxShadow: '2px 0 16px rgba(0,0,0,0.5), inset -1px 0 0 rgba(17,202,160,0.06)' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
          <FolderKanban size={13} className="text-forest-500 shrink-0" />
          <p className="text-[11px] uppercase tracking-widest text-anth-500 font-semibold">{t('Projekte')}</p>
        </div>

        {/* Project list — sortable */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
          <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleProjDragEnd}>
            <SortableContext items={visibleProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {visibleProjects.map(proj => (
                <SortableProject
                  key={proj.id}
                  project={proj}
                  isActive={proj.id === kb.activeProjectId}
                  onSelect={() => update(s => ({ ...s, activeProjectId: proj.id }))}
                  onRename={name => renameProject(proj.id, name)}
                  onDelete={() => deleteProject(proj.id)}
                  canDelete={visibleProjects.length > 1}
                  onShare={v => shareProject(proj.id, v)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add Project */}
        <div className="px-2 py-2 border-t border-border/40 shrink-0">
          {showNewProj ? (
            <div className="flex items-center gap-1 px-1">
              <input value={newProjName} onChange={e => setNewProjName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') { setShowNewProj(false); setNewProjName(''); } }}
                placeholder={t('Projektname…')} autoFocus
                className="flex-1 bg-surface border border-forest-700/40 rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-600 outline-none" />
              <button onClick={addProject} className="text-forest-400 p-1.5"><Check size={12} /></button>
              <button onClick={() => { setShowNewProj(false); setNewProjName(''); }} className="text-anth-500 p-1.5"><X size={12} /></button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewProj(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-forest-700/40 text-xs text-anth-500 hover:text-forest-300 hover:border-forest-600/50 hover:bg-forest-900/20 transition-all"
            >
              <Plus size={12} />
              <span className="font-medium">{t('Neues Projekt')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CENTRE: KANBAN COLUMNS (horizontal scroll)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">

        {/* ── Connection + Group Toolbar ── */}
        <div className="shrink-0 flex flex-col border-b border-border/30 bg-anth-950/60">
          <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
            {/* Groups button */}
            <button
              onClick={() => {
                setGroupMode(v => !v);
                if (connectMode) { setConnectMode(false); setPendingFromId(null); }
                if (groupMode) { setPendingGroupCards(new Set()); setNewGroupName(''); }
              }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all',
                groupMode
                  ? 'bg-gold/20 border-gold/50 text-gold shadow-[0_0_10px_rgba(201,168,76,0.2)]'
                  : 'border-anth-700/40 text-anth-500 hover:text-anth-300 hover:border-anth-600/50'
              )}
              title={t('Karten gruppieren')}
            >
              <Layers size={12} />
              {groupMode ? t('Gruppe: AN') : `${t('Gruppen')} (${(kb.groups ?? []).length})`}
            </button>


            {/* Group color picker (in group mode, when no cards selected yet) */}
            {groupMode && pendingGroupCards.size === 0 && (
              <div className="flex items-center gap-1">
                {GROUP_COLORS.map(c => (
                  <button key={c} onClick={() => setNewGroupColor(c)}
                    className={cn('w-4 h-4 rounded-full border-2 transition-all hover:scale-125',
                      newGroupColor === c ? 'border-white scale-125' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            )}

            {/* Pending group cards counter */}
            {groupMode && (
              <span className="text-[10px] text-gold/70 ml-2">
                {pendingGroupCards.size === 0
                  ? t('Karten antippen zum Auswählen')
                  : `${pendingGroupCards.size} ${t(pendingGroupCards.size !== 1 ? 'Karten ausgewählt' : 'Karte ausgewählt')}`}
              </span>
            )}

            {connectMode && pendingFromId && (
              <span className="text-[10px] text-mint-400 animate-pulse ml-2">
                {t('✦ Erste Karte gewählt — klicke die zweite Karte')}
              </span>
            )}

            {/* Hinweis: KI-Assistent jetzt zentral im Chat-Widget rechts unten */}
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-anth-600">
              <Bot size={11} /> {t('KI-Assistent → Chat rechts unten')}
            </span>
          </div>

          {/* ── Group Confirmation Bar — appears when ≥1 card selected ── */}
          {groupMode && pendingGroupCards.size >= 1 && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-t-2 border-gold/40 bg-gold/8"
              style={{ background: 'rgba(201,168,76,0.07)' }}>
              {/* Color picker */}
              <div className="flex items-center gap-1 shrink-0">
                {GROUP_COLORS.map(c => (
                  <button key={c} onClick={() => setNewGroupColor(c)}
                    className={cn('w-4 h-4 rounded-full border-2 transition-all hover:scale-110',
                      newGroupColor === c ? 'border-white scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              {/* Name input */}
              <input
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newGroupName.trim()) createGroup(); if (e.key === 'Escape') { setPendingGroupCards(new Set()); setNewGroupName(''); setGroupMode(false); } }}
                placeholder={t('Gruppenname eingeben…')}
                autoFocus
                className="flex-1 bg-surface border border-gold/40 rounded-xl px-3 py-1.5 text-xs text-forest-100 placeholder-anth-600 outline-none focus:border-gold/70"
              />
              {/* Confirm */}
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gold/25 border border-gold/50 text-gold text-xs font-semibold hover:bg-gold/35 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-[0_0_12px_rgba(201,168,76,0.2)]"
              >
                <Check size={11} />
                {t('Gruppe bestätigen')} ({pendingGroupCards.size})
              </button>
              {/* Cancel */}
              <button onClick={() => { setPendingGroupCards(new Set()); setNewGroupName(''); setGroupMode(false); }}
                className="p-1.5 text-anth-500 hover:text-anth-300 transition-colors shrink-0">
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative">
          <DndContext
            sensors={sensors}
            collisionDetection={customCollision}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Scrollable columns area */}
            <div ref={scrollRef} className="flex gap-4 h-full overflow-x-auto px-4 py-4 pb-6 relative">

              {/* ── SVG Connection Lines Overlay ── */}
              <svg
                className="absolute inset-0 pointer-events-none overflow-visible"
                style={{ width: '100%', height: '100%', zIndex: 10 }}
              >
                {(kb.connections ?? []).map(conn => {
                  const from = cardCenters[conn.fromId];
                  const to   = cardCenters[conn.toId];
                  if (!from || !to) return null;
                  const mx = (from.x + to.x) / 2;
                  const pathD = `M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`;
                  const isSelected = selectedConnId === conn.id;
                  return (
                    <g key={conn.id}>
                      {/* Thick invisible hit area */}
                      <path d={pathD} fill="none" stroke="transparent" strokeWidth={12}
                        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedConnId(isSelected ? null : conn.id); }} />
                      {/* Visible line */}
                      <path d={pathD} fill="none" stroke={conn.color} strokeWidth={isSelected ? 3 : 2}
                        strokeDasharray={isSelected ? '6,3' : undefined}
                        opacity={isSelected ? 1 : 0.7}
                        style={{ pointerEvents: 'none' }}
                      />
                      {/* Endpoints */}
                      <circle cx={from.x} cy={from.y} r={4} fill={conn.color} opacity={0.8} style={{ pointerEvents: 'none' }} />
                      <circle cx={to.x}   cy={to.y}   r={4} fill={conn.color} opacity={0.8} style={{ pointerEvents: 'none' }} />
                    </g>
                  );
                })}
              </svg>

              {/* ── Selected connection popover ── */}
              {selectedConnId && (() => {
                const conn = (kb.connections ?? []).find(c => c.id === selectedConnId);
                const from = conn ? cardCenters[conn.fromId] : null;
                const to   = conn ? cardCenters[conn.toId]   : null;
                if (!conn || !from || !to) return null;
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2;
                return (
                  <div
                    className="absolute z-20 flex flex-col gap-1.5 p-2 glass-dark rounded-xl border border-border shadow-panel"
                    style={{ left: mx - 70, top: my - 80, width: 140 }}
                  >
                    <p className="text-[9px] uppercase tracking-widest text-anth-500">{t('Verbindung')}</p>
                    <div className="flex flex-wrap gap-1">
                      {CONN_COLORS.map(c => (
                        <button key={c} onClick={() => updateConnectionColor(conn.id, c)}
                          className={cn('w-4 h-4 rounded-full border-2 hover:scale-110 transition-all',
                            conn.color === c ? 'border-white' : 'border-transparent'
                          )}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <button onClick={() => deleteConnection(conn.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/30 border border-red-700/40 text-[10px] text-red-400 hover:bg-red-800/40 transition-colors">
                      <X size={9} /> {t('Linie löschen')}
                    </button>
                  </div>
                );
              })()}

              <SortableContext
                items={activeProject.columns.map(c => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {activeProject.columns.map(col => (
                  <SortableColumn
                    key={col.id}
                    col={col}
                    cards={col.cardIds.map(id => kb.cards[id]).filter(Boolean).filter(c => boardSharedToMe || cardVisibleTo(c, currentUser))}
                    activeCardId={activeType === 'card' ? activeId : null}
                    canDelete={activeProject.columns.length > 1}
                    onAddCard={() => { setTargetColId(col.id); setCardModal(true); }}
                    onDeleteCol={() => deleteColumn(col.id)}
                    onRenameCol={label => renameColumn(col.id, label)}
                    onDeleteCard={deleteCard}
                    onUpdateCard={updateCard}
                    connectMode={connectMode}
                    pendingFromId={pendingFromId}
                    onConnectCardClick={handleConnectCardClick}
                    groupMode={groupMode}
                    pendingGroupCards={pendingGroupCards}
                    onGroupCardToggle={handleGroupCardToggle}
                    groups={kb.groups ?? []}
                    allColumns={activeProject.columns}
                    onDeleteGroup={deleteGroup}
                    onMoveGroup={moveGroupToColumn}
                    project={{ id: activeProject.id, name: activeProject.name }}
                    onEditCard={openEditCard}
                  />
                ))}
              </SortableContext>

              {/* ── Add Column ── */}
              <div className="w-56 shrink-0 flex flex-col gap-2">
                {showNewCol ? (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl border border-forest-700/40 bg-forest-950/30">
                    <input value={newColLabel} onChange={e => setNewColLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') { setShowNewCol(false); setNewColLabel(''); } }}
                      placeholder={t('Spaltenname…')} autoFocus
                      className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-600 outline-none" />
                    <div className="flex gap-1.5">
                      <button onClick={addColumn}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-forest-700/40 border border-forest-600/40 text-xs text-forest-300 hover:bg-forest-600/40 transition-colors">
                        <Check size={11} /> {t('Hinzufügen')}
                      </button>
                      <button onClick={() => { setShowNewCol(false); setNewColLabel(''); }}
                        className="p-1.5 rounded-xl text-anth-500 hover:text-anth-300 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCol(true)}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-forest-600/50 bg-forest-900/20 text-xs text-forest-300 hover:text-forest-100 hover:border-forest-500/70 hover:bg-forest-800/30 hover:shadow-[0_0_14px_rgba(17,202,160,0.15)] transition-all"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-forest-700/50 border border-forest-500/50">
                      <Plus size={12} strokeWidth={3} />
                    </span>
                    <span className="font-semibold">{t('Spalte hinzufügen')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Drag Overlay ── */}
            <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
              {activeCard && (
                <div className="opacity-95 rotate-1 shadow-[0_0_30px_rgba(17,202,160,0.3)]">
                  <TaskCard card={activeCard} isDragging />
                </div>
              )}
              {activeColObj && (
                <div className="w-64 opacity-90 shadow-[0_0_30px_rgba(17,202,160,0.2)] rounded-2xl border border-forest-700/50 bg-anth-950/80 p-3">
                  <p className={cn('text-xs font-bold uppercase tracking-wider', activeColObj.color)}>{t(activeColObj.label)}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: New Task Card
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal open={cardModal} onClose={() => { setCardModal(false); setEditCardId(null); }} title={editCardId ? t('Aufgabe bearbeiten') : t('Neue Aufgabe erstellen')} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">{t('Titel *')}</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="mc-input" placeholder={t('Was muss erledigt werden?')} autoFocus />
          </div>
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">{t('Beschreibung')}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="mc-input min-h-[80px] resize-none" placeholder={t('Kontext hinzufügen…')} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-anth-400 mb-1.5 block">{t('Priorität')}</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TCard['priority'] }))} className="mc-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-anth-400 mb-1.5 block">{t('Typ')}</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="mc-input">
                <option value="content">Content</option>
                <option value="technical">Technical</option>
                <option value="seo">SEO</option>
                <option value="media">Media</option>
                <option value="shopify">Shopify</option>
                <option value="research">Research</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">{t('Agent zuweisen')}</label>
            <select value={form.assignedAgent} onChange={e => setForm(f => ({ ...f, assignedAgent: e.target.value }))} className="mc-input">
              <option value="">{t('Nicht zugewiesen')}</option>
              <option value="hermes">Hermes</option>
              <option value="claude">Claude</option>
              <option value="openclaw">OpenClaw</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">{t('Tags (kommagetrennt)')}</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="mc-input" placeholder="seo, content, urgent" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={createCard} loading={saving} className="flex-1">{editCardId ? t('Speichern') : t('Erstellen')}</Button>
            <Button variant="ghost" onClick={() => { setCardModal(false); setEditCardId(null); }}>{t('Abbrechen')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
