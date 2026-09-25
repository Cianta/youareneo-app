'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, X, Send, Sparkles, Video, FileText, Lightbulb, StickyNote,
  Bot, Paintbrush, Link2, LayoutGrid, Pencil, Check, Trash2,
  Image as ImageIcon, Globe, Upload, ChevronDown, ExternalLink, ZoomIn, ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAuthStore, useAgentStore, withSelfContext } from '@/lib/store';
import { SelfContextToggle } from '@/components/shared/SelfContextToggle';
import { SharePicker } from '@/components/shared/SharePicker';
import { uploadToStorage } from '@/lib/storage';
import { CommentsPopover } from '@/components/shared/CommentsPopover';
import { listKanbanProjects, publishToKanban, newComment, TRINITY_SYNC_EVENT, type CardComment } from '@/lib/crossPublish';

import { CanvasRichCard, exportCanvasCard } from '@/components/workspace/CanvasRichCard';
import { useContacts } from '@/lib/workspace/contacts';
import { usePersonal, inWorkspace } from '@/lib/workspace/personal';

// ── Types ──────────────────────────────────────────────────────────────────────
type CardType = 'note' | 'idea' | 'video' | 'text' | 'image' | 'website' | 'table' | 'chart' | 'formula' | 'contact';

interface CanvasCard {
  id: string;
  type: CardType;
  contactId?: string;
  title: string;
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Video-/Website-/Bild-Link (bei Bildern auch DataURL) */
  url?: string;
  /** Vorschaubild (YouTube-Thumbnail, og:image, …) */
  thumb?: string;
  /** Metadaten der Website-Vorschau */
  metaTitle?: string;
  metaDesc?: string;
  /** Kommentar-Zettel */
  comments?: CardComment[];
  /** Kommt aus dem Task-Kanban (mit Status/Farbe der Spalte) */
  fromTask?: { projectId: string; projectName: string; status: string; color: string };
}

interface EdenConnection {
  id: string;
  fromId: string;
  toId: string;
  color: string;
}

interface EdenBoard {
  id: string;
  name: string;
  /** Besitzer (Team-Mitglied). Legacy-Boards ohne Besitzer sind für alle sichtbar. */
  ownerId?: string;
  workspace?: "private"|"organization"|"both";
  /** Teilen: undefined/null = privat · 'all' = ganze Firma · string[] = ausgewählte Mitglieder */
  sharedWith?: 'all' | string[] | null;
}

interface EdenBoardData { cards: CanvasCard[]; connections: EdenConnection[] }

/** Sichtbarkeitsregel für Eden-Boards (analog zu Kanban-Boards). */
function boardVisibleTo(b: EdenBoard, userName: string | null): boolean {
  if (!b.ownerId) return true;
  const me = userName ?? '';
  if (b.ownerId === me) return true;
  if (b.sharedWith === 'all') return true;
  if (Array.isArray(b.sharedWith) && b.sharedWith.includes(me)) return true;
  return false;
}

// ── Style maps ────────────────────────────────────────────────────────────────
const CARD_COLORS: Record<CardType, string> = {
  table:'border-sky-500/60 bg-sky-900/20', chart:'border-violet-500/60 bg-violet-900/20', formula:'border-emerald-500/60 bg-emerald-900/20', contact:'border-orange-500/60 bg-orange-900/20',
  note:    'border-amber-500/60  bg-amber-900/20',
  idea:    'border-violet-500/60 bg-violet-900/20',
  video:   'border-sky-500/60   bg-sky-900/20',
  text:    'border-forest-500/60 bg-forest-900/20',
  image:   'border-pink-500/60  bg-pink-900/20',
  website: 'border-cyan-500/60  bg-cyan-900/20',
};

const CARD_ICONS: Record<CardType, React.ElementType> = {
  table: LayoutGrid, chart: Paintbrush, formula: Sparkles, contact: Bot,
  note: StickyNote, idea: Lightbulb, video: Video, text: FileText,
  image: ImageIcon, website: Globe,
};

const CARD_LABELS: Record<CardType, string> = {
  table:'Tabelle', chart:'Diagramm', formula:'Formel', contact:'Kontakt',
  note: 'Notiz', idea: 'Idee', text: 'Text',
  video: 'Video (Link + Thumbnail)', website: 'Website (Link + Vorschau)', image: 'Bild (Upload / URL)',
};

/** Medientypen mit URL-Eingabe */
const URL_TYPES: CardType[] = ['video', 'website', 'image'];

/** YouTube-Thumbnail direkt aus dem Link ableiten (ohne Server-Roundtrip). */
function youtubeThumb(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function isHttpUrl(v: string): boolean {
  return /^https?:\/\/\S+$/i.test(v.trim());
}

const CARD_ACCENT: Record<CardType, string> = {
  table:'#86b9ed', chart:'#c1a0ec', formula:'#94c5a4', contact:'#e5c180',
  note: '#f59e0b', idea: '#a78bfa', video: '#38bdf8', text: '#11CAA0',
  image: '#f472b6', website: '#22d3ee',
};

const CONN_COLORS = [
  '#11CAA0','#f59e0b','#ef4444','#3b82f6',
  '#a78bfa','#ec4899','#f97316','#06b6d4','#84cc16','#ffffff',
];

// ── AI Chat ───────────────────────────────────────────────────────────────────
interface ChatMsg { role: 'user' | 'ai'; text: string; timestamp: string }

const SEED_CARDS: CanvasCard[] = [
  { id: 'c1', type: 'idea',  title: 'YouTube Hook Formula',
    content: 'Start with the pain → agitate → solution within 30 seconds.',
    x: 40,  y: 60,  w: 280, h: 140 },
  { id: 'c2', type: 'video', title: 'Podcast Episode #12',
    content: 'https://riverside.fm — record with high-fidelity remote guests.',
    x: 360, y: 40,  w: 280, h: 140 },
  { id: 'c3', type: 'note',  title: 'Content Pillars',
    content: '1. Education\n2. Inspiration\n3. Community\n4. Behind-the-Scenes',
    x: 40,  y: 240, w: 280, h: 160 },
  { id: 'c4', type: 'text',  title: 'Scaling Strategy',
    content: 'Batch → Repurpose → Distribute → Automate via TRINITY OS agents.',
    x: 360, y: 220, w: 280, h: 140 },
];

const EDEN_LS_KEY    = 'trinity-eden-v1';
const EDEN_LS_KEY_V2 = 'trinity-eden-v2';
const DEFAULT_BOARD: EdenBoard = { id: 'board-main', name: 'Mein Canvas' };

// ── Edge-point helper ─────────────────────────────────────────────────────────
// Returns the point on the border of `rect` closest to (towardX, towardY).
function getEdgePoint(
  rect: { cx: number; cy: number; w: number; h: number },
  towardX: number,
  towardY: number,
): { x: number; y: number } {
  const dx = towardX - rect.cx, dy = towardY - rect.cy;
  if (dx === 0 && dy === 0) return { x: rect.cx, y: rect.cy };
  const tx = dx !== 0 ? Math.abs(rect.w / 2 / dx) : Infinity;
  const ty = dy !== 0 ? Math.abs(rect.h / 2 / dy) : Infinity;
  const t  = Math.min(tx, ty);
  return { x: rect.cx + t * dx, y: rect.cy + t * dy };
}

const EDEN_SYSTEM_PROMPT =
  'Du bist der Eden Canvas KI-Assistent — ein kreativer Content-Stratege für YouTube, ' +
  'Podcasts und Social Media. Antworte präzise und inspirierend auf Deutsch. ' +
  'Wenn Canvas-Karten als Kontext mitgegeben werden, beziehe dich konkret auf deren Inhalte.\n\n' +
  'DU KANNST DAS BOARD DIREKT BEARBEITEN. Wenn der Nutzer möchte, dass du Karten erstellst, ' +
  'ein Board aufbaust, Ideen anlegst oder einen Website-Link als Karte hinzufügst, hänge ans ENDE ' +
  'deiner Antwort GENAU EINEN Block in diesem Format an (valides JSON, keine Kommentare):\n' +
  '<eden-actions>{"actions":[{"op":"addCard","type":"note|idea|text|video|website|image",' +
  '"title":"Kurzer Titel","content":"Text der Karte","url":"nur bei video/website/image"}]}</eden-actions>\n' +
  'Weitere Operationen: {"op":"newBoard","name":"Board-Name"} (legt ein neues Board an und ' +
  'füllt es mit den folgenden addCard-Operationen), {"op":"clearBoard"} (nur wenn ausdrücklich verlangt).\n' +
  'Erstelle 3–8 prägnante Karten pro Anfrage. Nutze type "website" für Links, "video" für ' +
  'YouTube/Video-Links. Erwähne im Text kurz, was du angelegt hast — der Block selbst wird dem ' +
  'Nutzer nicht angezeigt.';

// ═════════════════════════════════════════════════════════════════════════════
export default function EdenPage() {
  const personal=usePersonal(); const contacts=useContacts(s=>s.contacts).filter(c=>inWorkspace(c,personal.workspace));
  const [context,setContext]=useState<{x:number;y:number;cx:number;cy:number;cardId?:string}|null>(null);
  const [exportError,setExportError]=useState('');
  const t = useT();
  const [cards,       setCards]       = useState<CanvasCard[]>(SEED_CARDS);
  const [connections, setConnections] = useState<EdenConnection[]>([]);
  const [hydrated,    setHydrated]    = useState(false);

  // Boards (mehrere Canvases, teilbar innerhalb der Firma)
  const [boards,        setBoards]        = useState<EdenBoard[]>([DEFAULT_BOARD]);
  const [activeBoardId, setActiveBoardId] = useState(DEFAULT_BOARD.id);
  const [newBoardName,  setNewBoardName]  = useState('');
  const [showNewBoard,  setShowNewBoard]  = useState(false);
  const [editBoardId,   setEditBoardId]   = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const boardDataRef = useRef<Record<string, EdenBoardData>>({});
  const currentUser  = useAuthStore(s => s.user?.name ?? null);

  // Drag
  const [dragId,     setDragId]     = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Editing & selection
  const [editId,        setEditId]        = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Connection mode
  const [connectMode,    setConnectMode]    = useState(false);
  const [connectColor,   setConnectColor]   = useState('#11CAA0');
  const [pendingFromId,  setPendingFromId]  = useState<string | null>(null);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);

  // Add-card dropdown
  const [addOpen, setAddOpen] = useState(false);

  // Publish → Tasks (pro Karte): erst Board, dann Status-Spalte wählen
  const [pubCardId, setPubCardId] = useState<string | null>(null);
  const [pubProjId, setPubProjId] = useState<string | null>(null);
  const [pubDoneId, setPubDoneId] = useState<string | null>(null);
  const [pubPos, setPubPos] = useState({ top: 0, left: 0 });

  // „Einer Karte hinzufügen" unter KI-Antworten (Index der Chat-Nachricht)
  const [addToCardIdx, setAddToCardIdx] = useState<number | null>(null);

  // Status-Info-Popover (Chip auf Karten aus dem Kanban)
  const [statusInfoId, setStatusInfoId] = useState<string | null>(null);
  const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addOpen) return;
    const h = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [addOpen]);

  // Resize (Ecke unten rechts)
  const [resizeId, setResizeId] = useState<string | null>(null);
  const resizeStart = useRef({ mx: 0, my: 0, w: 0, h: 0 });

  // Zoom (0.4×–2×) — Canvas-Fläche 3000×2000, überstehendes scrollt
  const [zoom, setZoom] = useState(1);
  const CANVAS_W = 3000, CANVAS_H = 2000;

  // KI-Agent-Auswahl (Digital Staff)
  const agents = useAgentStore(s => s.agents);
  const setAgents = useAgentStore(s => s.setAgents);
  const [agentId, setAgentId] = useState('claude-free');
  useEffect(() => {
    if (agents.length) return;
    fetch('/api/agents').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : d.agents;
      if (Array.isArray(list) && list.length) setAgents(list);
    }).catch(() => {});
  }, [agents.length, setAgents]);

  // Chat
  const [chatOpen,  setChatOpen]  = useState(true);
  const [chatMsgs,  setChatMsgs]  = useState<ChatMsg[]>([{
    role: 'ai',
    text: 'Willkommen im Eden Canvas ✦ Füge Karten hinzu, arrangiere deine Ideen und frag mich nach YouTube-Hooks, Content-Skripten oder Strategien.',
    timestamp: '',
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping,  setIsTyping]  = useState(false);

  const canvasRef  = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  // ── Persistence (v2: mehrere Boards · migriert automatisch von v1) ────────
  useEffect(() => {
    try {
      const rawV2 = localStorage.getItem(EDEN_LS_KEY_V2);
      if (rawV2) {
        const saved = JSON.parse(rawV2) as { boards?: EdenBoard[]; activeBoardId?: string; data?: Record<string, EdenBoardData> };
        const bs = saved.boards?.length ? saved.boards : [DEFAULT_BOARD];
        boardDataRef.current = saved.data ?? {};
        setBoards(bs);
        const active = bs.find(b => b.id === saved.activeBoardId)?.id ?? bs[0].id;
        setActiveBoardId(active);
        const d = boardDataRef.current[active];
        setCards(d?.cards ?? []);
        setConnections(d?.connections ?? []);
      } else {
        // Migration vom alten Single-Canvas-Format
        const rawV1 = localStorage.getItem(EDEN_LS_KEY);
        if (rawV1) {
          const saved = JSON.parse(rawV1) as { cards?: CanvasCard[]; connections?: EdenConnection[] };
          if (saved.cards?.length)       setCards(saved.cards);
          if (saved.connections?.length) setConnections(saved.connections);
          boardDataRef.current[DEFAULT_BOARD.id] = {
            cards: saved.cards ?? SEED_CARDS,
            connections: saved.connections ?? [],
          };
        }
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Der Assistent (Chat-Widget) schreibt direkt in localStorage → aktives Board neu laden
  useEffect(() => {
    const reload = () => {
      try {
        const raw = localStorage.getItem(EDEN_LS_KEY_V2);
        if (!raw) return;
        const saved = JSON.parse(raw) as { boards?: EdenBoard[]; activeBoardId?: string; data?: Record<string, EdenBoardData> };
        if (saved.data) boardDataRef.current = saved.data;
        if (saved.boards?.length) setBoards(saved.boards);
        const d = boardDataRef.current[activeBoardId];
        if (d) { setCards(d.cards ?? []); setConnections(d.connections ?? []); }
      } catch { /* ignore */ }
    };
    window.addEventListener(TRINITY_SYNC_EVENT, reload);
    return () => window.removeEventListener(TRINITY_SYNC_EVENT, reload);
  }, [activeBoardId]);

  const persistBoards = useCallback((bs: EdenBoard[], activeId: string) => {
    try {
      localStorage.setItem(EDEN_LS_KEY_V2, JSON.stringify({ boards: bs, activeBoardId: activeId, data: boardDataRef.current }));
    } catch { /* storage full */ }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    boardDataRef.current[activeBoardId] = { cards, connections };
    persistBoards(boards, activeBoardId);
  }, [cards, connections, boards, activeBoardId, hydrated, persistBoards]);

  // ── Board-Operationen ──────────────────────────────────────────────────────
  const switchBoard = (id: string) => {
    if (id === activeBoardId) return;
    boardDataRef.current[activeBoardId] = { cards, connections };
    const d = boardDataRef.current[id];
    setCards(d?.cards ?? []);
    setConnections(d?.connections ?? []);
    setActiveBoardId(id);
    setSelectedCards(new Set());
    setEditId(null);
    setPendingFromId(null);
    setSelectedConnId(null);
  };

  const addBoard = () => {
    const name = newBoardName.trim();
    if (!name) return;
    const id = `eden-board-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const b: EdenBoard = { id, name, workspace: personal.workspace, ownerId: currentUser ?? undefined };
    boardDataRef.current[activeBoardId] = { cards, connections };
    boardDataRef.current[id] = { cards: [], connections: [] };
    setBoards(prev => [...prev, b]);
    setCards([]); setConnections([]);
    setActiveBoardId(id);
    setNewBoardName(''); setShowNewBoard(false);
  };

  const deleteBoard = (id: string) => {
    if (boards.length <= 1) return;
    delete boardDataRef.current[id];
    const remaining = boards.filter(b => b.id !== id);
    setBoards(remaining);
    if (id === activeBoardId) {
      const next = remaining[0];
      const d = boardDataRef.current[next.id];
      setCards(d?.cards ?? []);
      setConnections(d?.connections ?? []);
      setActiveBoardId(next.id);
    }
  };

  const renameBoard = (id: string, name: string) => {
    if (!name.trim()) return;
    setBoards(prev => prev.map(b => b.id === id ? { ...b, name: name.trim() } : b));
  };

  const shareBoard = (id: string, sharedWith: 'all' | string[] | null) => {
    setBoards(prev => prev.map(b => b.id === id
      ? { ...b, sharedWith, ownerId: b.ownerId ?? (currentUser ?? undefined) }
      : b));
  };

  const visibleBoards = boards.filter(b => boardVisibleTo(b, currentUser)&&inWorkspace(b,personal.workspace));
  useEffect(()=>{if(!hydrated)return;const valid=boards.find(b=>b.id===activeBoardId&&inWorkspace(b,personal.workspace));if(valid)return;const next=boards.find(b=>inWorkspace(b,personal.workspace)&&boardVisibleTo(b,currentUser));if(next){switchBoard(next.id);}else{const id=crypto.randomUUID();boardDataRef.current[activeBoardId]={cards,connections};boardDataRef.current[id]={cards:[],connections:[]};setBoards(v=>[...v,{id,name:personal.workspace==='private'?'Mein privater Ideenraum':'Mein Arbeitsraum',workspace:personal.workspace,ownerId:currentUser??undefined}]);setActiveBoardId(id);setCards([]);setConnections([]);}},[personal.workspace,hydrated]);

  // ── Card rects — computed directly from card state (never stale) ─────────
  //    No DOM querying: card positions come straight from state so the SVG
  //    connection lines update on every drag frame.
  const cardRects = useMemo(() => {
    const rects: Record<string, { cx: number; cy: number; w: number; h: number }> = {};
    cards.forEach(card => {
      rects[card.id] = {
        cx: card.x + card.w / 2,
        cy: card.y + card.h / 2,
        w:  card.w,
        h:  card.h,
      };
    });
    return rects;
  }, [cards]);

  // ── Connection click ──────────────────────────────────────────────────────
  const handleCardConnectClick = useCallback((cardId: string) => {
    if (!connectMode) return;
    if (!pendingFromId) {
      setPendingFromId(cardId);
    } else if (pendingFromId === cardId) {
      setPendingFromId(null); // deselect same card
    } else {
      const exists = connections.some(c =>
        (c.fromId === pendingFromId && c.toId === cardId) ||
        (c.fromId === cardId && c.toId === pendingFromId),
      );
      if (!exists) {
        setConnections(prev => [...prev, {
          id:     `conn-${Date.now()}`,
          fromId: pendingFromId,
          toId:   cardId,
          color:  connectColor,
        }]);
      }
      // Keep pendingFromId → connect same source to many targets
    }
  }, [connectMode, pendingFromId, connections, connectColor]);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).closest('textarea,input,button')) return;
    if (connectMode) { handleCardConnectClick(id); return; }
    e.preventDefault();
    const card = cards.find(c => c.id === id);
    if (!card || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left + canvasRef.current.scrollLeft) / zoom;
    const cy = (e.clientY - rect.top  + canvasRef.current.scrollTop)  / zoom;
    setDragId(id);
    setDragOffset({ x: cx - card.x, y: cy - card.y });
  }, [cards, connectMode, handleCardConnectClick, zoom]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (resizeId) {
      const { mx, my, w, h } = resizeStart.current;
      const nw = Math.max(180, w + (e.clientX - mx) / zoom);
      const nh = Math.max(110, h + (e.clientY - my) / zoom);
      setCards(cs => cs.map(c => c.id === resizeId ? { ...c, w: nw, h: nh } : c));
      return;
    }
    if (!dragId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = Math.max(0, (e.clientX - rect.left + canvasRef.current.scrollLeft) / zoom - dragOffset.x);
    const ny = Math.max(0, (e.clientY - rect.top  + canvasRef.current.scrollTop)  / zoom - dragOffset.y);
    setCards(cs => cs.map(c => c.id === dragId ? { ...c, x: nx, y: ny } : c));
  }, [dragId, dragOffset, resizeId, zoom]);

  const onMouseUp = useCallback(() => { setDragId(null); setResizeId(null); }, []);

  const startResize = (e: React.MouseEvent, card: CanvasCard) => {
    e.stopPropagation();
    e.preventDefault();
    resizeStart.current = { mx: e.clientX, my: e.clientY, w: card.w, h: card.h };
    setResizeId(card.id);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addCard = (type: CardType, preset?: Partial<CanvasCard>) => {
    const id = `c${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const media = URL_TYPES.includes(type);
    setCards(cs => [...cs, {
      id, type,
      title: preset?.title ?? 'Neue Karte',
      content: preset?.content ?? (type==='chart'?'Idee A: 30\nIdee B: 50':type==='formula'?'(120 + 80) * 1.2':''),
      contactId: preset?.contactId,
      x: preset?.x ?? 80 + Math.random() * 200,
      y: preset?.y ?? 80 + Math.random() * 200,
      w: preset?.w ?? (media ? 300 : 280),
      h: preset?.h ?? (media || ["table","chart"].includes(type) ? 280 : 180),
      url: preset?.url, thumb: preset?.thumb,
      metaTitle: preset?.metaTitle, metaDesc: preset?.metaDesc,
    }]);
    if (!preset) setEditId(id);
    return id;
  };

  /** Link einer Medien-Karte setzen und Vorschau (Thumbnail/og:image) laden. */
  const resolveCardUrl = async (id: string, type: CardType, rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return;
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    updateCard(id, { url: withProto });
    if (type === 'image') return; // Bild-URL wird direkt angezeigt
    const yt = type === 'video' ? youtubeThumb(withProto) : null;
    if (yt) { updateCard(id, { thumb: yt }); return; }
    try {
      const res = await fetch(`/api/meta?url=${encodeURIComponent(withProto)}`);
      if (!res.ok) return;
      const meta = await res.json();
      updateCard(id, {
        thumb: meta.image || meta.favicon || undefined,
        metaTitle: meta.title || undefined,
        metaDesc: meta.description || undefined,
      });
    } catch { /* Vorschau optional */ }
  };

  /** Bild-Datei hochladen: Cloud-Stub (FuseBase Store später), Fallback DataURL. */
  const attachImageFile = async (id: string, file: File) => {
    const cloudUrl = await uploadToStorage(file, 'eden/images');
    if (cloudUrl) { updateCard(id, { url: cloudUrl }); return; }
    const reader = new FileReader();
    reader.onload = () => updateCard(id, { url: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const removeCard = (id: string) => {
    setCards(cs => cs.filter(c => c.id !== id));
    setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id));
  };

  const updateCard = (id: string, patch: Partial<CanvasCard>) =>
    setCards(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));

  // ── KI-Board-Aktionen: <eden-actions>{...}</eden-actions> anwenden ────────
  const applyEdenActions = (raw: string): { applied: number; boardName?: string } => {
    let applied = 0;
    let boardName: string | undefined;
    try {
      const parsed = JSON.parse(raw) as { actions?: Array<Record<string, string>> };
      const actions = parsed.actions ?? [];
      // Grid-Platzierung für neue Karten
      let idx = cards.length;
      const place = () => {
        const col = idx % 3, row = Math.floor(idx / 3);
        idx += 1;
        return { x: 60 + col * 330, y: 60 + row * 210 };
      };
      for (const a of actions) {
        if (a.op === 'newBoard' && a.name) {
          // Neues Board anlegen und aktivieren
          const id = `eden-board-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          boardDataRef.current[activeBoardId] = { cards, connections };
          boardDataRef.current[id] = { cards: [], connections: [] };
          setBoards(prev => [...prev, { id, name: a.name, workspace: personal.workspace, ownerId: currentUser ?? undefined }]);
          setCards([]); setConnections([]);
          setActiveBoardId(id);
          idx = 0;
          boardName = a.name;
        } else if (a.op === 'clearBoard') {
          setCards([]); setConnections([]);
          idx = 0;
        } else if (a.op === 'addCard') {
          const type: CardType = (['note','idea','text','table','chart','formula','contact','video','website','image'] as CardType[])
            .includes(a.type as CardType) ? a.type as CardType : 'note';
          const pos = place();
          const media = URL_TYPES.includes(type);
          const id = addCard(type, {
            title: a.title || 'Neue Karte',
            content: a.content || '',
            url: a.url || undefined,
            x: pos.x, y: pos.y,
            w: media ? 300 : 280, h: media ? 250 : 150,
          });
          if (a.url && media) void resolveCardUrl(id, type, a.url);
          applied += 1;
        }
      }
    } catch { /* ungültiger Action-Block — ignorieren */ }
    return { applied, boardName };
  };

  // ── Chat — real agent API with selected cards as context ─────────────────
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || isTyping) return;
    const ts = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    setChatMsgs(m => [...m, { role: 'user', text, timestamp: ts }]);
    setChatInput('');

    // Nur ein Link? → direkt als Website-/Video-Karte anlegen, ohne KI-Roundtrip
    if (isHttpUrl(text)) {
      const type: CardType = youtubeThumb(text) ? 'video' : 'website';
      const id = addCard(type, { title: type === 'video' ? 'Video' : 'Website', content: '', w: 300, h: 250 });
      void resolveCardUrl(id, type, text);
      setChatMsgs(m => [...m, {
        role: 'ai',
        text: type === 'video' ? '✦ Video-Karte mit Thumbnail angelegt.' : '✦ Website-Karte mit Vorschau angelegt.',
        timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      }]);
      return;
    }

    setIsTyping(true);

    // Build context from selected cards
    const contextCards = cards.filter(c => selectedCards.has(c.id));
    const boardSummary = cards.length
      ? `\n\nAktuelles Board \"${boards.find(b => b.id === activeBoardId)?.name ?? 'Canvas'}\" (${cards.length} Karten): ` +
        cards.slice(0, 20).map(c => `[${c.type}] ${c.title}`).join(' · ')
      : '\n\nDas aktuelle Board ist leer.';
    const contextBlock = (contextCards.length
      ? `\n\nCanvas-Karten als Kontext:\n${contextCards.map(c => `• [${c.type}] ${c.title}: ${c.content}`).join('\n')}`
      : '') + boardSummary;

    try {
      // History for the API: previous messages + new one (context appended to latest)
      const history = [
        ...chatMsgs.filter(m => m.timestamp !== '').map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
        { role: 'user', content: `[ANWEISUNG]\n${EDEN_SYSTEM_PROMPT}\n[/ANWEISUNG]\n\n${text}${contextBlock}` },
      ];
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withSelfContext(history) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (res.body) {
        // SSE stream — same format the Berater chat uses
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        const doneTs = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        setChatMsgs(m => [...m, { role: 'ai', text: '', timestamp: doneTs }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const d = JSON.parse(payload);
              if (d.error) throw new Error(d.error);
              const chunk = d.text ?? d.delta;
              if (chunk) {
                full += chunk;
                setChatMsgs(m => { const n = [...m]; n[n.length-1] = { ...n[n.length-1], text: full }; return n; });
              }
            } catch (err) { if ((err as Error)?.message && String(err).includes('API')) throw err; /* skip malformed chunk */ }
          }
        }
        if (!full) throw new Error('Leere Antwort');

        // <eden-actions>…</eden-actions> ausführen und aus der Anzeige entfernen
        const actionMatch = full.match(/<eden-actions>([\s\S]*?)<\/eden-actions>/);
        if (actionMatch) {
          const { applied, boardName } = applyEdenActions(actionMatch[1]);
          let display = full.replace(/<eden-actions>[\s\S]*?<\/eden-actions>/g, '').trim();
          if (applied > 0) {
            display += `\n\n✦ ${applied} Karte${applied !== 1 ? 'n' : ''}${boardName ? ` auf neuem Board \"${boardName}\"` : ''} angelegt.`;
          }
          setChatMsgs(m => { const n = [...m]; n[n.length-1] = { ...n[n.length-1], text: display.trim() }; return n; });
        }
      }
    } catch {
      setChatMsgs(m => [...m.filter(x => x.text !== '' || x.role !== 'ai'), {
        role: 'ai',
        text: '⚠️ KI-Agent nicht erreichbar. Bitte prüfe, ob ein API-Key in den Agent-Einstellungen hinterlegt ist.',
        timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleCardSelect = (id: string) =>
    setSelectedCards(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex gap-0 fade-in overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT: BOARDS PANEL (220px) — wie bei den Tasks, inkl. Teilen
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="w-[220px] shrink-0 flex flex-col bg-anth-950/40 overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.10)', boxShadow: '2px 0 16px rgba(0,0,0,0.5), inset -1px 0 0 rgba(17,202,160,0.06)' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
          <LayoutGrid size={13} className="text-forest-500 shrink-0" />
          <p className="text-[11px] uppercase tracking-widest text-anth-500 font-semibold">{t('Boards')}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
          {visibleBoards.map(b => {
            const isActive = b.id === activeBoardId;
            const editing = editBoardId === b.id;
            return (
              <div key={b.id}
                onClick={() => !editing && switchBoard(b.id)}
                className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all group cursor-pointer',
                  isActive
                    ? 'bg-forest-800/50 border-forest-600/50 text-forest-100 shadow-[0_0_12px_rgba(17,202,160,0.12)]'
                    : 'border-transparent text-anth-400 hover:bg-forest-900/30 hover:text-anth-200')}>
                {editing ? (
                  <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                    <input value={editBoardName} onChange={e => setEditBoardName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { renameBoard(b.id, editBoardName); setEditBoardId(null); }
                        if (e.key === 'Escape') setEditBoardId(null);
                      }}
                      autoFocus
                      className="flex-1 min-w-0 bg-surface border border-forest-700/50 rounded-lg px-2 py-0.5 text-xs text-forest-100 outline-none" />
                    <button onClick={() => { renameBoard(b.id, editBoardName); setEditBoardId(null); }} className="text-forest-400 p-0.5"><Check size={10} /></button>
                    <button onClick={() => setEditBoardId(null)} className="text-anth-500 p-0.5"><X size={10} /></button>
                  </div>
                ) : (
                  <span className="flex-1 text-sm font-medium truncate">{b.name}</span>
                )}
                {!editing && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <SharePicker
                      value={b.sharedWith}
                      onChange={v => shareBoard(b.id, v ?? null)}
                      iconSize={9}
                      className={cn('p-0.5 bg-transparent', !b.sharedWith && 'opacity-0 group-hover:opacity-100')}
                    />
                    <button onClick={e => { e.stopPropagation(); setEditBoardId(b.id); setEditBoardName(b.name); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-anth-600 hover:text-forest-300 transition-all">
                      <Pencil size={9} />
                    </button>
                    {visibleBoards.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); deleteBoard(b.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-anth-600 hover:text-red-400 transition-all">
                        <Trash2 size={9} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Neues Board */}
        <div className="px-2 py-2 border-t border-border/40 shrink-0">
          {showNewBoard ? (
            <div className="flex items-center gap-1 px-1">
              <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addBoard(); if (e.key === 'Escape') { setShowNewBoard(false); setNewBoardName(''); } }}
                placeholder={t('Board-Name…')} autoFocus
                className="flex-1 min-w-0 bg-surface border border-forest-700/40 rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-600 outline-none" />
              <button onClick={addBoard} className="text-forest-400 p-1.5"><Check size={12} /></button>
              <button onClick={() => { setShowNewBoard(false); setNewBoardName(''); }} className="text-anth-500 p-1.5"><X size={12} /></button>
            </div>
          ) : (
            <button onClick={() => setShowNewBoard(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-forest-700/40 text-xs text-anth-500 hover:text-forest-300 hover:border-forest-600/50 hover:bg-forest-900/20 transition-all">
              <Plus size={12} />
              <span className="font-medium">{t('Neues Board')}</span>
            </button>
          )}
        </div>
      </div>

      {context&&<><button className="s-context-backdrop" aria-label="Kontextmenü schließen" onClick={()=>setContext(null)}/><div className="s-canvas-context" role="dialog" aria-label="Ideenraum Aktionen" style={{left:context.x,top:context.y}} onKeyDown={e=>{if(e.key==='Escape')setContext(null);}}><button className="w-btn" onClick={()=>setContext(null)}>Schließen ×</button>{(['text','table','chart','formula','image','video'] as CardType[]).map(type=><button key={type} onClick={()=>{addCard(type,{x:context.cx,y:context.cy});setContext(null);}}>{CARD_LABELS[type]} einfügen</button>)}<label>Kontakt verknüpfen<select className="w-input" defaultValue="" onChange={e=>{const c=contacts.find(x=>x.id===e.target.value);if(!c)return;const id=addCard('contact',{contactId:c.id,title:c.name,content:[c.company,c.email].filter(Boolean).join('\n'),x:context.cx+320,y:context.cy});if(context.cardId)setConnections(v=>[...v,{id:crypto.randomUUID(),fromId:context.cardId!,toId:id,color:'#e5c180'}]);setContext(null);}}><option value="">Kontakt wählen …</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><a href="/dashboard/contacts">Kontakte & HubSpot öffnen ↗</a>{context.cardId&&(['pdf','docx'] as const).map(format=><button key={format} onClick={()=>{const card=cards.find(c=>c.id===context.cardId);if(card)void exportCanvasCard(card,format).catch(e=>setExportError(String(e)));setContext(null);}}>Als {format==='docx'?'Word': 'PDF'} exportieren</button>)}{context.cardId&&<label>E-Mail vorbereiten<select className="w-input" defaultValue="" onChange={e=>{const c=contacts.find(x=>x.id===e.target.value),card=cards.find(x=>x.id===context.cardId);if(c?.email&&card){window.location.href=`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(card.title)}&body=${encodeURIComponent(card.content.slice(0,1500))}`;setContext(null);}}}><option value="">Empfänger auswählen …</option>{contacts.filter(c=>c.email).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><small>Öffnet dein Mailprogramm. PDF/Word vorher exportieren und anhängen.</small></label>}</div></>}
      {/* ── Canvas Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {exportError&&<p role="alert">{exportError}</p>}
        <div className="s-canvas-toolbar">{(['text','table','chart','formula','video','image','contact'] as CardType[]).map(type=><button className="w-btn" key={type} onClick={()=>addCard(type)}>{CARD_LABELS[type]}</button>)}</div>
        {/* Toolbar */}
        <div className="relative z-40 shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/10 backdrop-blur-sm"
          style={{ background: 'var(--w-surface)' }}>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest mb-0" style={{ color: '#11CAA0', opacity: 0.8 }}>Eden Canvas</p>
            <p className="text-[11px] text-anth-400">{cards.length} {t('Karten')} · {connections.length} {t('Verbindungen')}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">

            {/* Karte hinzufügen — großes + mit Medientyp-Dropdown */}
            <div className="relative" ref={addRef}>
              <button onClick={() => setAddOpen(v => !v)}
                className={cn('flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all',
                  addOpen
                    ? 'bg-mint-500/20 border-mint-500/50 text-mint-200 shadow-[0_0_14px_rgba(17,202,160,0.3)]'
                    : 'bg-forest-700/30 border-forest-600/50 text-forest-100 hover:bg-forest-600/40 hover:shadow-[0_0_12px_rgba(17,202,160,0.2)]')}>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-mint-500/25 text-mint-300">
                  <Plus size={13} strokeWidth={3} />
                </span>
                {t('Karte hinzufügen')}
                <ChevronDown size={11} className={cn('transition-transform', addOpen && 'rotate-180')} />
              </button>
              {addOpen && (
                <>
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-60 rounded-2xl border border-white/15 shadow-2xl p-1.5 space-y-0.5"
                    style={{ background: 'var(--w-surface)' }}>
                    {(['note','idea','text','table','chart','formula','contact','video','website','image'] as CardType[]).map(type => {
                      const Icon = CARD_ICONS[type];
                      return (
                        <button key={type}
                          onClick={() => { addCard(type); setAddOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[11px] text-anth-300 hover:bg-white/5 hover:text-forest-100 transition-colors">
                          <Icon size={13} style={{ color: CARD_ACCENT[type] }} className="shrink-0" />
                          <span className="flex-1">{t(CARD_LABELS[type])}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Connect mode */}
            <button
              onClick={() => { setConnectMode(v => !v); setPendingFromId(null); setSelectedConnId(null); }}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] transition-all',
                connectMode
                  ? 'bg-mint-500/20 border-mint-500/50 text-mint-300 shadow-[0_0_12px_rgba(17,202,160,0.3)]'
                  : 'border-white/10 text-anth-400 hover:text-anth-200 hover:border-white/20'
              )}>
              <Paintbrush size={11} />
              {connectMode ? t('Verbinden: AN') : t('Verbinden')}
            </button>

            {/* Connection color picker */}
            <div className="flex items-center gap-0.5">
              {CONN_COLORS.map(c => (
                <button key={c} onClick={() => setConnectColor(c)}
                  className={cn('w-3.5 h-3.5 rounded-full border-2 transition-all hover:scale-125',
                    connectColor === c ? 'border-white scale-125' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }} />
              ))}
            </div>

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* KI-Assistent jetzt zentral im Chat-Widget rechts unten */}
            <span className="flex items-center gap-1.5 text-[10px] text-anth-600">
              <Bot size={11} /> {t('KI-Assistent → Chat rechts unten')}
            </span>
          </div>
        </div>

        {/* Connect mode status bar */}
        {connectMode && (
          <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-b border-mint-500/30 bg-mint-500/8">
            <Paintbrush size={11} className="text-mint-400 shrink-0" />
            <p className="text-[11px] text-mint-300 flex-1">
              {pendingFromId
                ? t('✦ Erste Karte aktiv — klicke eine zweite Karte zum Verbinden')
                : t('Klicke eine Karte als Startpunkt, dann eine weitere')}
            </p>
            {connections.length > 0 && (
              <span className="text-[10px] text-anth-500 flex items-center gap-1">
                <Link2 size={10} />{connections.length} {t('Verbindung(en)')}
              </span>
            )}
          </div>
        )}

        {/* Canvas — zoombar, mit Scrollbars unten & rechts */}
        <div className="flex-1 min-h-0 relative">
        <div
          ref={canvasRef}
          className="absolute inset-0 overflow-auto scrollbar-thin"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%,rgba(17,202,160,0.04) 0%,transparent 60%),radial-gradient(ellipse at 70% 60%,rgba(79,158,112,0.04) 0%,transparent 60%),var(--w-bg)',
            cursor: connectMode ? 'crosshair' : 'default',
          }}
          onContextMenu={e=>{e.preventDefault();const r=e.currentTarget.getBoundingClientRect();setContext({x:Math.min(e.clientX,window.innerWidth-260),y:Math.min(e.clientY,window.innerHeight-420),cx:(e.clientX-r.left+e.currentTarget.scrollLeft)/zoom,cy:(e.clientY-r.top+e.currentTarget.scrollTop)/zoom});}}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
        <div style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}>
        <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
          {/* Grid dots */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle,rgba(79,158,112,0.12) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* ── SVG Connection Lines ── */}
          {/* Note: cardRects is derived from card state via useMemo — always in sync with card positions,
              no stale DOM-querying. Lines update on every drag frame automatically. */}
          <svg className="absolute inset-0 pointer-events-none overflow-visible"
            style={{ width: '100%', height: '100%', zIndex: 10 }}>
            <defs>
              <filter id="glow-conn" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {connections.map(conn => {
              const from = cardRects[conn.fromId];
              const to   = cardRects[conn.toId];
              if (!from || !to) return null;
              const fp = getEdgePoint(from, to.cx, to.cy);
              const tp = getEdgePoint(to, from.cx, from.cy);
              const mx = (fp.x + tp.x) / 2;
              const pathD = `M ${fp.x} ${fp.y} C ${mx} ${fp.y}, ${mx} ${tp.y}, ${tp.x} ${tp.y}`;
              const isSel = selectedConnId === conn.id;
              return (
                <g key={conn.id}>
                  {/* Hit area */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth={16}
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); setSelectedConnId(isSel ? null : conn.id); }} />
                  {/* Visible line */}
                  <path d={pathD} fill="none" stroke={conn.color}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    strokeDasharray={isSel ? '7,3' : undefined}
                    opacity={isSel ? 1 : 0.7}
                    filter={isSel ? 'url(#glow-conn)' : undefined}
                    style={{ pointerEvents: 'none' }} />
                  <circle cx={fp.x} cy={fp.y} r={4} fill={conn.color} opacity={0.9} style={{ pointerEvents: 'none' }} />
                  <circle cx={tp.x} cy={tp.y} r={4} fill={conn.color} opacity={0.9} style={{ pointerEvents: 'none' }} />
                </g>
              );
            })}
          </svg>

          {/* Selected connection popover */}
          {selectedConnId && (() => {
            const conn   = connections.find(c => c.id === selectedConnId);
            const from   = conn ? cardRects[conn.fromId] : null;
            const to     = conn ? cardRects[conn.toId]   : null;
            if (!conn || !from || !to) return null;
            const px = (from.cx + to.cx) / 2;
            const py = (from.cy + to.cy) / 2;
            return (
              <div className="absolute z-30 flex flex-col gap-2 p-3 rounded-xl border border-white/15 shadow-2xl"
                style={{ left: px - 75, top: py - 90, width: 150, background: 'var(--w-surface)', backdropFilter: 'blur(12px)' }}>
                <p className="text-[9px] uppercase tracking-widest text-anth-500">{t('Verbindung')}</p>
                <div className="flex flex-wrap gap-1">
                  {CONN_COLORS.map(c => (
                    <button key={c} onClick={() => setConnections(prev => prev.map(x => x.id === conn.id ? { ...x, color: c } : x))}
                      className={cn('w-4 h-4 rounded-full border-2 hover:scale-110 transition-all',
                        conn.color === c ? 'border-white' : 'border-transparent')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={() => { setConnections(prev => prev.filter(c => c.id !== conn.id)); setSelectedConnId(null); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/30 border border-red-700/40 text-[10px] text-red-400 hover:bg-red-800/40 transition-colors">
                  <X size={9} /> {t('Linie löschen')}
                </button>
              </div>
            );
          })()}

          {/* Cards */}
          {cards.map(card => {
            const Icon      = CARD_ICONS[card.type];
            const isEditing = editId === card.id;
            const isSelected = selectedCards.has(card.id);
            const isPending  = pendingFromId === card.id;
            return (
              <div
                key={card.id}
                onContextMenu={e=>{e.preventDefault();e.stopPropagation();setContext({x:Math.min(e.clientX,window.innerWidth-260),y:Math.max(12,Math.min(e.clientY,window.innerHeight-420)),cx:card.x,cy:card.y,cardId:card.id});}}
                style={{
                  position: 'absolute', left: card.x, top: card.y,
                  width: card.w, height: card.h,
                  cursor: connectMode ? 'pointer' : dragId === card.id ? 'grabbing' : 'grab',
                  zIndex: dragId === card.id ? 50 : isPending ? 20 : isSelected ? 10 : 1,
                }}
                onMouseDown={e => onMouseDown(e, card.id)}
                className={cn(
                  'rounded-2xl border-2 backdrop-blur-sm select-none transition-shadow duration-200 group flex flex-col',
                  CARD_COLORS[card.type],
                  isPending && 'ring-2 ring-mint-500 shadow-[0_0_24px_rgba(17,202,160,0.5)]',
                  isSelected && !isPending && 'ring-2 ring-mint-500/50 shadow-[0_0_16px_rgba(17,202,160,0.25)]',
                  connectMode && !isPending && 'hover:ring-2 hover:ring-mint-500/40 hover:shadow-[0_0_14px_rgba(17,202,160,0.2)]',
                  dragId === card.id && 'shadow-[0_8px_40px_rgba(0,0,0,0.5)]',
                )}
              >
                {/* Card header */}
                <div className="flex items-center gap-2 px-3 pt-3 pb-1.5 shrink-0">
                  <Icon size={12} style={{ color: CARD_ACCENT[card.type] }} className="shrink-0" />
                  {isPending && (
                    <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-mint-500 animate-ping" />
                  )}
                  {isEditing ? (
                    <input
                      autoFocus
                      value={card.title}
                      onChange={e => updateCard(card.id, { title: e.target.value })}
                      onBlur={() => setEditId(null)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditId(null); }}
                      className="flex-1 bg-transparent text-xs font-semibold text-forest-100 outline-none border-b border-forest-700/60 pb-0.5"
                    />
                  ) : (
                    <p className="flex-1 text-xs font-semibold text-forest-100 truncate"
                      onDoubleClick={() => setEditId(card.id)}>{t(card.title)}</p>
                  )}
                  {/* Status-Chip (Karte aus dem Task-Kanban) */}
                  {card.fromTask && (
                    <span className="relative shrink-0" onMouseDown={e => e.stopPropagation()}>
                      <button
                        onClick={e => { e.stopPropagation(); setStatusInfoId(statusInfoId === card.id ? null : card.id); }}
                        className="px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide border transition-colors"
                        style={{ color: card.fromTask.color, borderColor: `${card.fromTask.color}66`, background: `${card.fromTask.color}1f` }}>
                        {card.fromTask.status}
                      </button>
                      {statusInfoId === card.id && (
                        <>
                          <span className="fixed inset-0 z-40" onClick={e => { e.stopPropagation(); setStatusInfoId(null); }} />
                          <span className="absolute right-0 top-full mt-1 z-50 block w-44 glass-dark border border-border rounded-xl shadow-panel px-2.5 py-2">
                            <span className="block text-[9px] uppercase tracking-widest text-anth-500">{t('Vom Task-Board')}</span>
                            <span className="block text-[11px] text-forest-200 font-medium mt-0.5">📋 {card.fromTask.projectName}</span>
                            <span className="block text-[10px] mt-0.5" style={{ color: card.fromTask.color }}>● {card.fromTask.status}</span>
                          </span>
                        </>
                      )}
                    </span>
                  )}
                  {/* Kommentar-Zettel + Plus */}
                  <span className="flex items-center shrink-0" onMouseDown={e => e.stopPropagation()}>
                    <CommentsPopover
                      comments={card.comments}
                      onChange={next => updateCard(card.id, { comments: next })}
                      iconSize={11}
                    />
                  </span>
                  {/* Controls — immer sichtbar */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditId(editId === card.id ? null : card.id)} title={t('Umbenennen')}
                      className={cn('p-1 rounded-md transition-colors', isEditing ? 'text-forest-200 bg-forest-700/40' : 'text-anth-500 hover:text-forest-300 hover:bg-forest-800/40')}
                      onMouseDown={e => e.stopPropagation()}>
                      <Pencil size={10} />
                    </button>
                    <button onClick={() => toggleCardSelect(card.id)} title={t('Für KI-Chat auswählen')}
                      className={cn('p-1 rounded-md transition-colors', isSelected ? 'text-mint-300 bg-mint-500/25' : 'text-anth-500 hover:text-mint-400 hover:bg-mint-500/10')}
                      onMouseDown={e => e.stopPropagation()}>
                      <Bot size={11} />
                    </button>
                    <button onClick={() => removeCard(card.id)} title={t('Karte löschen')}
                      className="p-1 rounded-md text-anth-400 bg-anth-900/40 hover:text-red-300 hover:bg-red-900/40 transition-colors"
                      onMouseDown={e => e.stopPropagation()}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Card body — je nach Medientyp */}
                <div className="flex-1 px-3 pb-3 min-h-0 flex flex-col gap-2">
                  {URL_TYPES.includes(card.type) && !card.url && (
                    <div className="flex flex-col gap-1.5" onMouseDown={e => e.stopPropagation()}>
                      <input
                        placeholder={card.type === 'video' ? t('Video-Link einfügen…') : card.type === 'website' ? t('Website-Link einfügen…') : t('Bild-URL einfügen…')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') void resolveCardUrl(card.id, card.type, (e.target as HTMLInputElement).value);
                        }}
                        onBlur={e => { if (e.target.value.trim()) void resolveCardUrl(card.id, card.type, e.target.value); }}
                        className="w-full bg-black/30 border border-white/15 rounded-lg px-2.5 py-1.5 text-[10px] text-anth-200 placeholder:text-anth-600 outline-none focus:border-mint-500/50 transition-colors"
                      />
                      {card.type === 'image' && (
                        <label className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-white/20 text-[10px] text-anth-500 hover:text-pink-300 hover:border-pink-500/40 cursor-pointer transition-colors">
                          <Upload size={10} /> {t('Bild hochladen')}
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) attachImageFile(card.id, f); }} />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Vorschau: Bild / Video-Thumbnail / Website */}
                  {card.type === 'image' && card.url && (
                    <div className="relative rounded-lg overflow-hidden border border-white/10 shrink-0" style={{ maxHeight: '65%' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={card.url} alt={card.title} className="w-full h-full object-cover" draggable={false} />
                    </div>
                  )}
                  {card.type === 'video' && card.url && (
                    <a href={card.url} target="_blank" rel="noreferrer"
                      onMouseDown={e => e.stopPropagation()}
                      className="relative block rounded-lg overflow-hidden border border-white/10 shrink-0 group/vid" style={{ maxHeight: '65%' }}>
                      {card.thumb
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={card.thumb} alt={card.title} className="w-full h-full object-cover" draggable={false} />
                        : <div className="w-full h-20 flex items-center justify-center bg-sky-950/40"><Video size={20} className="text-sky-400/60" /></div>}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-80 group-hover/vid:opacity-100 transition-opacity">
                        <span className="w-9 h-9 rounded-full bg-black/60 border border-white/40 flex items-center justify-center text-white text-xs pl-0.5">▶</span>
                      </span>
                    </a>
                  )}
                  {card.type === 'website' && card.url && (
                    <a href={card.url} target="_blank" rel="noreferrer"
                      onMouseDown={e => e.stopPropagation()}
                      className="block rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/25 hover:border-cyan-500/40 transition-colors" style={{ maxHeight: '65%' }}>
                      {card.thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.thumb} alt={card.metaTitle ?? card.title} className="w-full h-20 object-cover" draggable={false} />
                      )}
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] font-semibold text-cyan-200 truncate flex items-center gap-1">
                          <ExternalLink size={8} className="shrink-0" />{card.metaTitle ?? card.url}
                        </p>
                        {card.metaDesc && <p className="text-[9px] text-anth-500 line-clamp-2">{card.metaDesc}</p>}
                      </div>
                    </a>
                  )}

                  <div onContextMenu={e=>{e.preventDefault();e.stopPropagation();setContext({x:Math.min(e.clientX,window.innerWidth-260),y:Math.min(e.clientY,window.innerHeight-420),cx:card.x,cy:card.y,cardId:card.id});}}>
                  <CanvasRichCard type={card.type} content={card.content} onChange={content=>updateCard(card.id,{content})}/>
                  {card.type==='contact'&&<select aria-label="Kontakt auswählen" className="w-input" value={card.contactId??''} onMouseDown={e=>e.stopPropagation()} onChange={e=>{const c=contacts.find(x=>x.id===e.target.value);if(c)updateCard(card.id,{contactId:c.id,title:c.name,content:[c.company,c.email].filter(Boolean).join('\n')});}}><option value="">Kontakt auswählen …</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
                  </div>
                  {card.type!=='table'&&<textarea
                    value={card.content}
                    onChange={e => updateCard(card.id, { content: e.target.value })}
                    placeholder={card.type==='chart'?'Bezeichnung: Zahl (eine Zeile je Balken)':t('Inhalt eingeben…')}
                    className="w-full flex-1 min-h-[24px] bg-transparent text-[11px] text-anth-300 resize-none outline-none placeholder:text-anth-700 leading-relaxed"
                    onMouseDown={e => e.stopPropagation()}
                  />}
                  <div className="s-actions" onMouseDown={e=>e.stopPropagation()}><button title="Als PDF exportieren" onClick={()=>void exportCanvasCard(card,'pdf').catch(e=>setExportError(String(e)))}>PDF ↗</button><button title="Als Word-Dokument exportieren" onClick={()=>void exportCanvasCard(card,'docx').catch(e=>setExportError(String(e)))}>Word ↗</button></div>
                </div>

                {/* Publish → Tasks — unten links */}
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setPubPos({
                      top: Math.min(r.bottom + 4, window.innerHeight - 260),
                      left: Math.min(Math.max(8, r.left), window.innerWidth - 218),
                    });
                    setPubProjId(null);
                    setPubCardId(pubCardId === card.id ? null : card.id);
                  }}
                  className="absolute bottom-1 left-2 flex items-center gap-1 text-[9px] text-anth-600 hover:text-forest-300 opacity-60 group-hover:opacity-100 transition-all"
                  title={t('Zu den Tasks veröffentlichen')}>
                  📋 {pubDoneId === card.id ? '✓' : t('→ Tasks')}
                </button>

                {/* Resize-Griff — Ecke unten rechts */}
                <div
                  onMouseDown={e => startResize(e, card)}
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-40 group-hover:opacity-90 transition-opacity"
                  title={t('Größe ändern')}>
                  <svg viewBox="0 0 16 16" className="w-full h-full">
                    <path d="M 14,6 L 6,14 M 14,10 L 10,14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-anth-400" fill="none" />
                  </svg>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold"
                    style={{ backgroundColor: CARD_ACCENT[card.type], color: '#000' }}>→</div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {cards.length === 0 && (
            <div className="absolute left-[120px] top-[120px] pointer-events-none">
              <div className="text-center space-y-2">
                <p className="text-4xl opacity-20">✦</p>
                <p className="text-xs text-anth-600">{t('Leerer Canvas — füge deine erste Karte hinzu')}</p>
              </div>
            </div>
          )}
        </div>
        </div>
        </div>

        {/* Publish → Tasks Dropdown (Portal) */}
        {pubCardId && typeof document !== 'undefined' && createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => { setPubCardId(null); setPubProjId(null); }} />
            <div className="fixed z-[95] w-[210px] glass-dark border border-border rounded-xl shadow-panel p-2 space-y-1"
              style={{ top: pubPos.top, left: pubPos.left }} onClick={e => e.stopPropagation()}>
              {!pubProjId ? (
                <>
                  <p className="text-[9px] uppercase tracking-widest text-anth-600 px-1">{t('Task-Board wählen')}</p>
                  {listKanbanProjects().map(pr => (
                    <button key={pr.id} onClick={() => setPubProjId(pr.id)}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-anth-300 hover:bg-forest-800/40 hover:text-forest-200 transition-colors truncate">
                      📋 {pr.name}
                    </button>
                  ))}
                  {listKanbanProjects().length === 0 && (
                    <p className="text-[10px] text-anth-600 px-2 py-1">{t('Kein Task-Board gefunden.')}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[9px] uppercase tracking-widest text-anth-600 px-1">{t('Status wählen')}</p>
                  {listKanbanProjects().find(pr => pr.id === pubProjId)?.columns.map(colm => {
                    const accent: Record<string, string> = {
                      'text-violet-300': '#a78bfa', 'text-sky-300': '#7dd3fc', 'text-amber-300': '#fcd34d',
                      'text-forest-300': '#68BC8C', 'text-pink-300': '#f9a8d4', 'text-anth-300': '#9aa3ad', 'text-amber-400': '#fbbf24',
                    };
                    const color = accent[colm.color] ?? '#68BC8C';
                    return (
                      <button key={colm.id}
                        onClick={() => {
                          const cardObj = cards.find(c => c.id === pubCardId);
                          const proj = listKanbanProjects().find(pr => pr.id === pubProjId);
                          if (cardObj && proj) {
                            publishToKanban({
                              title: cardObj.title,
                              description: cardObj.content + (cardObj.url ? `\n${cardObj.url}` : ''),
                              projectId: proj.id,
                              columnId: colm.id,
                              source: { boardId: activeBoardId, boardName: boards.find(b => b.id === activeBoardId)?.name ?? 'Canvas' },
                              comments: cardObj.comments,
                            });
                            setPubDoneId(cardObj.id);
                            setTimeout(() => setPubDoneId(null), 2500);
                          }
                          setPubCardId(null); setPubProjId(null);
                        }}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-anth-300 hover:bg-forest-800/40 hover:text-forest-200 transition-colors">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="truncate">{colm.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </>,
          document.body
        )}

        {/* Zoom-Controls — unten rechts */}
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-0.5 rounded-xl border border-white/15 px-1 py-1 shadow-xl"
          style={{ background: 'var(--w-surface)' }}>
          <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2)))}
            title={t('Herauszoomen')}
            className="p-1.5 rounded-lg text-anth-400 hover:text-forest-100 hover:bg-white/5 transition-colors">
            <ZoomOut size={13} />
          </button>
          <button onClick={() => setZoom(1)} title="100%"
            className="w-11 text-center text-[10px] font-mono text-anth-300 hover:text-forest-100 py-1 rounded-lg hover:bg-white/5 transition-colors">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))}
            title={t('Hereinzoomen')}
            className="p-1.5 rounded-lg text-anth-400 hover:text-forest-100 hover:bg-white/5 transition-colors">
            <ZoomIn size={13} />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
