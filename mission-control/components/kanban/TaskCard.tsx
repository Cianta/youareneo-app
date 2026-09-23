'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Trash2, Check, ChevronDown, ChevronUp,
  Paperclip, Image, FileText, Film, X, Plus, Link, Globe,
  Volume2, Share2, Pencil, Palette,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { cn, PRIORITY_COLORS, TASK_TYPE_ICONS, AGENT_COLORS } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { TCard, Attachment } from './KanbanBoard';
import { SharePicker } from '@/components/shared/SharePicker';
import { CommentsPopover } from '@/components/shared/CommentsPopover';
import { listEdenBoards, publishToEden } from '@/lib/crossPublish';
import { createPortal } from 'react-dom';

export interface CardLink {
  id: string;
  url: string;
  label: string;
  type: 'youtube' | 'website' | 'other';
}

interface Props {
  card: TCard;
  isDragging?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, patch: Partial<TCard>) => void;
  /** Spalten-Status (für Publish → Canvas) */
  statusLabel?: string;
  statusColor?: string;
  /** Board (Projekt), in dem die Karte liegt */
  project?: { id: string; name: string };
  /** Öffnet das Bearbeiten-Fenster (gleiche Maske wie beim Erstellen) */
  onEdit?: (id: string) => void;
  // Connection mode
  connectMode?: boolean;
  isPendingFrom?: boolean;
  onConnectClick?: (id: string) => void;
  // Group mode
  groupMode?: boolean;
  isGroupSelected?: boolean;
  onGroupToggle?: (id: string) => void;
  groupColor?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function AttachIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <Image size={10} className="text-sky-400" />;
  if (mime.startsWith('video/')) return <Film size={10} className="text-violet-400" />;
  if (mime.startsWith('audio/')) return <Volume2 size={10} className="text-amber-400" />;
  if (mime === 'application/pdf') return <FileText size={10} className="text-red-400" />;
  if (mime.startsWith('link/')) return <Globe size={10} className="text-mint-400" />;
  return <FileText size={10} className="text-anth-400" />;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

// ── Link attachment component ─────────────────────────────────────────────────
function LinkPreview({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const url = att.dataUrl;
  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-border/60 relative group">
        <div className="relative" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={att.name}
          />
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-anth-900/80 border-t border-border/40">
          <span className="text-[10px] text-anth-400 truncate flex-1">▶ {att.name || url}</span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 text-anth-600 hover:text-red-400 transition-all ml-1 shrink-0"
          >
            <X size={9} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2 px-2 py-1.5 rounded-xl bg-anth-900/40 border border-border/50 group hover:border-mint-500/30 transition-colors">
      <Globe size={11} className="text-mint-500 shrink-0" />
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="text-[10px] text-mint-light/80 hover:text-mint-light truncate flex-1" title={url}>
        {att.name || url}
      </a>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-anth-600 hover:text-red-400 transition-all shrink-0"
      >
        <X size={9} />
      </button>
    </div>
  );
}

export function TaskCard({
  card, isDragging, onDelete, onUpdate, statusLabel, statusColor, project, onEdit,
  connectMode, isPendingFrom, onConnectClick,
  groupMode, isGroupSelected, onGroupToggle, groupColor,
}: Props) {
  const t = useT();
  const [showSubtasks, setShowSubtasks]     = useState(false);
  const [showAttachList, setShowAttachList] = useState(false);
  const [newSubtask, setNewSubtask]         = useState('');
  const [addingSubtask, setAddingSubtask]   = useState(false);
  const [publishOpen, setPublishOpen]       = useState(false);
  const [addingTask, setAddingTask]         = useState(false);
  const [taskTitle, setTaskTitle]           = useState('');
  const [taskDesc, setTaskDesc]             = useState('');
  const [publishPos, setPublishPos]         = useState({ top: 0, left: 0 });
  const [publishDone, setPublishDone]       = useState('');
  const [addingLink, setAddingLink]         = useState(false);
  const [linkInput, setLinkInput]           = useState('');
  const [linkLabel, setLinkLabel]           = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging,
  } = useSortable({ id: card.id, disabled: !!connectMode || !!groupMode });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const mediaAttachments = card.attachments.filter(a => !a.mime.startsWith('link/'));
  const linkAttachments  = card.attachments.filter(a => a.mime.startsWith('link/'));
  const coverImage       = mediaAttachments.find(a => a.mime.startsWith('image/'));

  const doneCount   = card.subtasks.filter(s => s.done).length;
  const progress    = card.subtasks.length ? doneCount / card.subtasks.length : 0;
  const agentColors = card.assignedAgent ? (AGENT_COLORS[card.assignedAgent] ?? AGENT_COLORS.system) : null;

  // Stop drag propagation from interactive elements
  const stopDrag = (e: React.PointerEvent) => e.stopPropagation();

  const handleFiles = (files: FileList | null) => {
    if (!files || !onUpdate) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const att: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          dataUrl,
          size: file.size,
        };
        onUpdate(card.id, { attachments: [...card.attachments, att] });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (attId: string) =>
    onUpdate?.(card.id, { attachments: card.attachments.filter(a => a.id !== attId) });

  const addLink = () => {
    if (!linkInput.trim() || !onUpdate) return;
    let url = linkInput.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    const ytId = getYouTubeId(url);
    let hostname = url;
    try { hostname = new URL(url).hostname; } catch { /* Eingabe ohne gültige URL */ }
    const att: Attachment = {
      id: `link-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: linkLabel.trim() || (ytId ? 'YouTube Video' : hostname),
      mime: ytId ? 'link/youtube' : 'link/website',
      dataUrl: url,
      size: 0,
    };
    onUpdate(card.id, { attachments: [...card.attachments, att] });
    setLinkInput(''); setLinkLabel(''); setAddingLink(false);
  };

  const addSubtask = () => {
    if (!newSubtask.trim() || !onUpdate) return;
    const st = { id: `st-${Date.now()}`, title: newSubtask.trim(), done: false };
    onUpdate(card.id, { subtasks: [...card.subtasks, st] });
    setNewSubtask(''); setAddingSubtask(false);
  };

  const handleSpecialClick = (e: React.MouseEvent) => {
    if (connectMode) {
      e.preventDefault();
      e.stopPropagation();
      onConnectClick?.(card.id);
    } else if (groupMode) {
      e.preventDefault();
      e.stopPropagation();
      onGroupToggle?.(card.id);
    }
  };

  // Determine border style based on mode
  const borderStyle = groupColor
    ? { borderLeft: `3px solid ${groupColor}` }
    : undefined;

  const rootStyle: React.CSSProperties = {
    ...style,
    ...(groupColor ? { borderLeft: `3px solid ${groupColor}`, borderRadius: '0 12px 12px 0' } : {}),
    ...(isGroupSelected && groupMode ? { outline: '2px solid #11CAA0', outlineOffset: 1 } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={rootStyle}
      data-card-id={card.id}
      {...(!connectMode && !groupMode ? { ...attributes, ...listeners } : {})}
      className={cn(
        'group glass rounded-xl border overflow-hidden transition-all duration-200',
        connectMode
          ? cn('cursor-pointer border-2', isPendingFrom
              ? 'border-mint-500 shadow-[0_0_20px_rgba(17,202,160,0.4)]'
              : 'border-anth-700/60 hover:border-mint-500/60 hover:shadow-[0_0_12px_rgba(17,202,160,0.2)]')
          : groupMode
            ? cn('cursor-pointer border-2', isGroupSelected
                ? 'border-mint-500/60 shadow-[0_0_20px_rgba(17,202,160,0.4)]'
                : 'border-anth-700/60 hover:border-mint-500/60')
            : 'cursor-grab active:cursor-grabbing border-border/80 hover:border-forest-600/80 bg-surface/60',
        groupColor && !groupMode && 'border-l-0',
        (isDragging || isSortDragging) && 'opacity-40 shadow-[0_0_20px_rgba(17,202,160,0.25)] scale-95',
      )}
      onClick={connectMode || groupMode ? handleSpecialClick : undefined}
    >
      {/* ── Image Cover ── */}
      {coverImage && (
        <div className="relative w-full h-28 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage.dataUrl} alt={coverImage.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="p-3">
        {/* ── Header row ── */}
        <div className="flex items-start gap-2">
          {/* Group mode indicator */}
          {groupMode && (
            <div className={cn(
              'mt-1 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all',
              isGroupSelected ? 'border-mint-500 bg-mint-500/30' : 'border-anth-600'
            )}>
              {isGroupSelected && <Check size={9} className="text-mint-400" />}
            </div>
          )}

          {/* Connect mode indicator */}
          {connectMode && (
            <div className={cn('mt-1 w-3 h-3 rounded-full border-2 shrink-0',
              isPendingFrom ? 'border-mint-500 bg-mint-500' : 'border-anth-600')}>
              {isPendingFrom && <span className="block w-full h-full rounded-full bg-mint-500 animate-ping absolute" />}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Type + Agent */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[10px]">{TASK_TYPE_ICONS[card.type] ?? '📌'}</span>
              {agentColors && card.assignedAgent && (
                <span className={cn('text-[10px] font-medium', agentColors.text)}>
                  {card.assignedAgent}
                </span>
              )}
            </div>

            {/* Title — groß */}
            <p className="text-[15px] font-bold text-forest-50 leading-snug break-words">{card.title}</p>

            {/* Symbol-Zeile: Kommentare · Teilen · Bearbeiten · Canvas-Verbindung */}
            <div className="flex items-center gap-1 mt-1.5">
              {onUpdate && (
                <CommentsPopover
                  comments={card.comments}
                  onChange={next => onUpdate(card.id, { comments: next })}
                  iconSize={11}
                />
              )}
              {onUpdate && (
                <SharePicker
                  value={card.sharedWith}
                  onChange={v => onUpdate(card.id, { sharedWith: v ?? null })}
                  iconSize={11}
                />
              )}
              {onEdit && (
                <button
                  onPointerDown={stopDrag}
                  onClick={e => { e.stopPropagation(); onEdit(card.id); }}
                  title={t('Bearbeiten')}
                  className="p-1 rounded-md text-anth-500 hover:text-forest-300 hover:bg-forest-800/40 transition-colors">
                  <Pencil size={11} />
                </button>
              )}
              {/* Canvas-Verbindung: farbig wenn verbunden, dunkel wenn nicht — Klick ändert */}
              <button
                onPointerDown={stopDrag}
                onClick={e => {
                  e.stopPropagation();
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setPublishPos({
                    top: Math.min(r.bottom + 4, window.innerHeight - 240),
                    left: Math.min(Math.max(8, r.left), window.innerWidth - 208),
                  });
                  setPublishOpen(v => !v);
                }}
                title={card.fromCanvas ? `${t('Vom Canvas-Board')}: ${card.fromCanvas.boardName}` : t('Auf Canvas-Board veröffentlichen')}
                className={cn('flex items-center gap-1 p-1 rounded-md transition-colors',
                  card.fromCanvas
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/40'
                    : 'text-anth-500 hover:text-cyan-300 hover:bg-cyan-500/10')}>
                <Palette size={11} />
                {card.fromCanvas && <span className="text-[8px] font-bold uppercase tracking-wide">Canvas</span>}
              </button>
              {publishDone && <span className="text-[9px] text-cyan-300">{publishDone}</span>}
            </div>

            {publishOpen && typeof document !== 'undefined' && createPortal(
              <>
                <div className="fixed inset-0 z-[90]" onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setPublishOpen(false); }} />
                <div className="fixed z-[95] w-[200px] glass-dark border border-border rounded-xl shadow-panel p-2 space-y-1"
                  style={{ top: publishPos.top, left: publishPos.left }}
                  onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                  {card.fromCanvas && (
                    <p className="text-[10px] text-cyan-200 px-1 pb-1 border-b border-border/40">
                      🎨 {t('Vom Canvas-Board')}: <span className="font-medium">{card.fromCanvas.boardName}</span>
                    </p>
                  )}
                  <p className="text-[9px] uppercase tracking-widest text-anth-500 px-1">{t('Auf Canvas-Board veröffentlichen')}</p>
                  {listEdenBoards().map(b => (
                    <button key={b.id}
                      onClick={() => {
                        const ok = publishToEden({
                          title: card.title,
                          content: card.description,
                          boardId: b.id,
                          status: { label: statusLabel ?? '—', color: statusColor ?? '#68BC8C' },
                          source: { projectId: project?.id ?? '', projectName: project?.name ?? '' },
                          comments: card.comments,
                        });
                        if (ok && onUpdate) onUpdate(card.id, { fromCanvas: { boardId: b.id, boardName: b.name } });
                        setPublishOpen(false);
                        setPublishDone(ok ? `✓ ${b.name}` : '⚠');
                        setTimeout(() => setPublishDone(''), 2500);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-anth-300 hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors truncate">
                      🎨 {b.name}
                    </button>
                  ))}
                </div>
              </>,
              document.body
            )}

            {/* Description */}
            {card.description && (
              <p className="text-[10px] text-anth-400 mt-1 leading-relaxed line-clamp-2">{card.description}</p>
            )}

            {/* Link attachments */}
            {linkAttachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {linkAttachments.map(att => (
                  <LinkPreview key={att.id} att={att} onRemove={() => removeAttachment(att.id)} />
                ))}
              </div>
            )}

            {/* Subtasks */}
            {card.subtasks.length > 0 && (
              <div className="mt-2">
                <button
                  onPointerDown={stopDrag}
                  onClick={() => setShowSubtasks(v => !v)}
                  className="flex items-center gap-1.5 text-[10px] text-anth-500 hover:text-anth-300 transition-colors"
                >
                  <span>{doneCount}/{card.subtasks.length} {t('Teilaufgaben')}</span>
                  {showSubtasks ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                </button>
                <div className="mt-1 h-1 bg-anth-800 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-500 rounded-full transition-all duration-300" style={{ width: `${progress * 100}%` }} />
                </div>
                {showSubtasks && (
                  <div className="mt-2 space-y-1 pl-1">
                    {card.subtasks.map(st => (
                      <div key={st.id}
                        className="flex items-center gap-2 cursor-pointer group/st"
                        onPointerDown={stopDrag}
                        onClick={() => onUpdate?.(card.id, {
                          subtasks: card.subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s),
                        })}>
                        <div className={cn('w-3 h-3 rounded border flex items-center justify-center shrink-0',
                          st.done ? 'bg-forest-600/50 border-forest-500' : 'border-border group-hover/st:border-forest-600')}>
                          {st.done && <Check size={7} className="text-forest-300" />}
                        </div>
                        <span className={cn('text-[10px]', st.done ? 'line-through text-anth-600' : 'text-anth-300')}>
                          {st.title}
                        </span>
                        <button
                          onPointerDown={stopDrag}
                          onClick={e => { e.stopPropagation(); onUpdate?.(card.id, { subtasks: card.subtasks.filter(s => s.id !== st.id) }); }}
                          className="ml-auto opacity-0 group-hover/st:opacity-100 text-anth-700 hover:text-red-400">
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                    {addingSubtask ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                          onPointerDown={stopDrag}
                          onKeyDown={e => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') setAddingSubtask(false); }}
                          placeholder={t('Teilaufgabe…')} autoFocus
                          className="flex-1 bg-surface border border-border rounded px-1.5 py-0.5 text-[10px] text-forest-100 outline-none" />
                        <button onPointerDown={stopDrag} onClick={addSubtask} className="text-forest-400"><Check size={9} /></button>
                        <button onPointerDown={stopDrag} onClick={() => setAddingSubtask(false)} className="text-anth-500"><X size={9} /></button>
                      </div>
                    ) : (
                      <button
                        onPointerDown={stopDrag}
                        onClick={() => setAddingSubtask(true)}
                        className="flex items-center gap-1 text-[10px] text-anth-600 hover:text-forest-300 mt-1">
                        <Plus size={9} /> {t('Teilaufgabe')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {card.tags.filter(tag => !(card.fromCanvas && tag === 'canvas')).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {card.tags.filter(tag => !(card.fromCanvas && tag === 'canvas')).map(tag => (
                  <span key={tag} className="tag text-[9px] px-1.5">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          {!connectMode && !groupMode && onDelete && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onPointerDown={stopDrag}
                onClick={e => { e.stopPropagation(); onDelete(card.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-anth-500 hover:text-red-400 transition-all">
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* ── Add Link form ── */}
        {addingLink && (
          <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-anth-900/50 border border-border/60">
            <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
              onPointerDown={stopDrag}
              onKeyDown={e => { if (e.key === 'Enter') addLink(); if (e.key === 'Escape') setAddingLink(false); }}
              placeholder="https://... oder youtube.com/watch?v=..." autoFocus
              className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-[10px] text-forest-100 outline-none focus:border-mint-500/40" />
            <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)}
              onPointerDown={stopDrag}
              placeholder={t('Bezeichnung (optional)…')}
              className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-[10px] text-forest-100 outline-none focus:border-mint-500/40" />
            <div className="flex gap-1">
              <button onPointerDown={stopDrag} onClick={addLink}
                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-mint-500/15 border border-mint-500/30 text-[10px] text-mint-400 hover:bg-mint-500/25 transition-colors">
                <Check size={9} /> {t('Hinzufügen')}
              </button>
              <button onPointerDown={stopDrag} onClick={() => { setAddingLink(false); setLinkInput(''); setLinkLabel(''); }}
                className="p-1 text-anth-500 hover:text-anth-300"><X size={10} /></button>
            </div>
          </div>
        )}

        {/* ── Attachments footer ── */}
        {!connectMode && !groupMode && (
          <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2 flex-wrap">
            <button
              onPointerDown={stopDrag}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[10px] text-anth-600 hover:text-forest-300 transition-colors"
              title={t('Datei anhängen')}>
              <Paperclip size={9} />
              {mediaAttachments.length > 0 ? `${mediaAttachments.length}` : t('Anhang')}
            </button>
            <input ref={fileInputRef} type="file" multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onPointerDown={stopDrag}
              onChange={e => handleFiles(e.target.files)} />

            <button
              onPointerDown={stopDrag}
              onClick={() => setAddingLink(true)}
              className="flex items-center gap-1 text-[10px] text-anth-600 hover:text-mint-400 transition-colors"
              title={t('Link / YouTube hinzufügen')}>
              <Link size={9} /> Link
            </button>

            <button
              onPointerDown={stopDrag}
              onClick={() => setAddingTask(v => !v)}
              className="flex items-center gap-1 text-[10px] text-anth-600 hover:text-forest-300 transition-colors">
              <Plus size={9} /> {t('Aufgabe')}
            </button>

            {mediaAttachments.length > 0 && (
              <button
                onPointerDown={stopDrag}
                onClick={() => setShowAttachList(v => !v)}
                className="text-[10px] text-anth-600 hover:text-anth-300 transition-colors ml-auto">
                {showAttachList ? t('▲ verbergen') : t('▼ zeigen')}
              </button>
            )}
          </div>
        )}

        {/* Media attachment list */}
        {showAttachList && mediaAttachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {mediaAttachments.map(att => (
              <div key={att.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-anth-900/50 border border-border/40 group/att">
                <AttachIcon mime={att.mime} />
                {att.mime.startsWith('image/') ? (
                  <a href={att.dataUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-[10px] text-anth-400 hover:text-forest-200 truncate">
                    {att.name}
                  </a>
                ) : att.mime.startsWith('video/') ? (
                  <details className="flex-1 min-w-0" onPointerDown={stopDrag}>
                    <summary className="text-[10px] text-anth-400 cursor-pointer truncate hover:text-anth-200">{att.name}</summary>
                    <video src={att.dataUrl} controls className="w-full mt-1 rounded-lg max-h-32" />
                  </details>
                ) : att.mime.startsWith('audio/') ? (
                  <details className="flex-1 min-w-0" onPointerDown={stopDrag}>
                    <summary className="text-[10px] text-anth-400 cursor-pointer truncate hover:text-anth-200">{att.name}</summary>
                    <audio src={att.dataUrl} controls className="w-full mt-1" style={{ height: 30 }} />
                  </details>
                ) : (
                  <span className="flex-1 min-w-0 text-[10px] text-anth-400 truncate">{att.name}</span>
                )}
                <span className="text-[9px] text-anth-600 shrink-0">{formatBytes(att.size)}</span>
                <button
                  onPointerDown={stopDrag}
                  onClick={() => removeAttachment(att.id)}
                  className="opacity-0 group-hover/att:opacity-100 text-anth-700 hover:text-red-400 shrink-0 transition-all">
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Unteraufgaben-Maske (Titel + Beschreibung) ── */}
        {addingTask && (
          <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-forest-900/25 border border-forest-700/40" onPointerDown={stopDrag}>
            <p className="text-[9px] uppercase tracking-widest text-anth-500">{t('Neue Unteraufgabe')}</p>
            <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setAddingTask(false); }}
              placeholder={t('Titel *')} autoFocus
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 outline-none focus:border-forest-600/60" />
            <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
              placeholder={t('Beschreibung…')} rows={2}
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[10px] text-anth-200 outline-none focus:border-forest-600/60 resize-none" />
            <div className="flex gap-1">
              <button onClick={() => {
                  if (!taskTitle.trim() || !onUpdate) return;
                  onUpdate(card.id, { subCards: [...(card.subCards ?? []), {
                    id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                    title: taskTitle.trim(), description: taskDesc.trim(),
                  }] });
                  setTaskTitle(''); setTaskDesc(''); setAddingTask(false);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-forest-700/40 border border-forest-600/40 text-[10px] text-forest-200 hover:bg-forest-600/40 transition-colors">
                <Check size={9} /> {t('Hinzufügen')}
              </button>
              <button onClick={() => setAddingTask(false)}
                className="p-1 text-anth-500 hover:text-anth-300"><X size={10} /></button>
            </div>
          </div>
        )}

        {/* ── Prioritäts-Fußzeile mit Trennstrich ── */}
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', PRIORITY_COLORS[card.priority])}>
            {card.priority}
          </span>
          {statusLabel && <span className="text-[9px] text-anth-500 ml-auto">{t(statusLabel)}</span>}
        </div>
      </div>

      {/* ── Angeheftete Unter-Karten (klebend, nach innen versetzt) ── */}
      {(card.subCards ?? []).length > 0 && (
        <div className="ml-4 -mt-1.5 space-y-0">
          {(card.subCards ?? []).map(sc => (
            <div key={sc.id}
              className="group/sc px-3 pt-3 pb-2 rounded-b-xl border border-t-0 border-forest-700/40 bg-forest-900/30 backdrop-blur-sm"
              onPointerDown={stopDrag}>
              <div className="flex items-start gap-1.5">
                <span className="text-[9px] mt-0.5">↳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-forest-100 leading-snug">{sc.title}</p>
                  {sc.description && (
                    <p className="text-[10px] text-anth-400 mt-0.5 leading-relaxed">{sc.description}</p>
                  )}
                </div>
                <button
                  onClick={() => onUpdate?.(card.id, { subCards: (card.subCards ?? []).filter(x => x.id !== sc.id) })}
                  className="opacity-0 group-hover/sc:opacity-100 p-0.5 text-anth-500 hover:text-red-400 transition-all shrink-0">
                  <X size={9} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
