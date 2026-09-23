'use client';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Send, StickyNote, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store';
import { newComment, type CardComment } from '@/lib/crossPublish';

// ─────────────────────────────────────────────────────────────────────────────
// Kommentar-Zettel für Karten (Tasks + Eden Canvas).
// Zettel-Symbol mit Anzahl neben dem Kartennamen + „+" zum schnellen
// Hinzufügen. Popover als Portal (fixe Position) — wird nie abgeschnitten.
// ─────────────────────────────────────────────────────────────────────────────

export function CommentsPopover({
  comments, onChange, iconSize = 10,
}: {
  comments: CardComment[] | undefined;
  onChange: (next: CardComment[]) => void;
  iconSize?: number;
}) {
  const t = useT();
  const me = useAuthStore(s => s.user?.name ?? null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const list = comments ?? [];

  const openAt = (focusInput: boolean) => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const width = 240;
      setPos({
        top: Math.min(r.bottom + 4, window.innerHeight - 320),
        left: Math.min(Math.max(8, r.left - 40), window.innerWidth - width - 8),
      });
    }
    setOpen(true);
    if (focusInput) setTimeout(() => document.getElementById('cm-input')?.focus(), 30);
  };

  const add = () => {
    if (!draft.trim()) return;
    onChange([...list, newComment(draft, me)]);
    setDraft('');
  };

  return (
    <>
      {/* Zettel + Anzahl */}
      <button ref={btnRef}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); open ? setOpen(false) : openAt(false); }}
        title={t('Kommentare')}
        className={cn('flex items-center gap-0.5 p-1 rounded-md transition-colors',
          list.length ? 'text-amber-300 bg-amber-500/15' : 'text-anth-500 hover:text-amber-300 hover:bg-amber-500/10')}>
        <StickyNote size={iconSize} />
        {list.length > 0 && <span className="text-[8px] font-bold leading-none">{list.length}</span>}
      </button>
      {/* Schnell neuen Kommentar */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); openAt(true); }}
        title={t('Kommentar hinzufügen')}
        className="p-1 rounded-md text-anth-500 hover:text-amber-300 hover:bg-amber-500/10 transition-colors -ml-0.5">
        <Plus size={iconSize - 1} strokeWidth={3} />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[90]"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setOpen(false); }} />
          <div className="fixed z-[95] w-[240px] glass-dark border border-border rounded-xl shadow-panel p-2 space-y-1.5"
            style={{ top: pos.top, left: pos.left }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}>
            <p className="text-[9px] uppercase tracking-widest text-anth-500 px-1 flex items-center gap-1">
              <StickyNote size={9} className="text-amber-400" /> {t('Kommentare')} {list.length > 0 && `(${list.length})`}
            </p>

            <div className="max-h-44 overflow-y-auto space-y-1 scrollbar-thin">
              {list.length === 0 && (
                <p className="text-[10px] text-anth-600 px-1 py-1">{t('Noch keine Kommentare.')}</p>
              )}
              {list.map(c => (
                <div key={c.id} className="group/cm rounded-lg bg-anth-900/60 border border-border/50 px-2 py-1.5">
                  <p className="text-[10px] text-anth-200 leading-snug whitespace-pre-wrap break-words">{c.text}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[8px] text-anth-500">
                      {c.author ? `${c.author} · ` : ''}{new Date(c.ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <button onClick={() => onChange(list.filter(x => x.id !== c.id))}
                      className="opacity-0 group-hover/cm:opacity-100 p-0.5 text-anth-600 hover:text-red-400 transition-all">
                      <Trash2 size={8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-end gap-1">
              <textarea id="cm-input" value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } }}
                placeholder={t('Kommentar schreiben…')} rows={2}
                className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-[10px] text-anth-200 placeholder:text-anth-600 outline-none focus:border-amber-500/40 resize-none transition-colors" />
              <button onClick={add} disabled={!draft.trim()}
                className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 disabled:opacity-30 transition-all">
                <Send size={10} />
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
