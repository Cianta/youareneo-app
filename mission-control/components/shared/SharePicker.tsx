'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAuthStore, useNinjasStore } from '@/lib/store';
import { supabaseConfigured } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Wiederverwendbarer Teilen-Picker (Ziele, Karten, Boards, Eden-Canvas).
// Struktur: 🌐 Alle (ganz oben, wählt automatisch alle) → Mitglieder einzeln
// anklickbar → 🔒 Privat. Mitglieder = Firmen-Profile aus Supabase (falls
// eingeloggt), sonst die lokalen Team-Mitglieder.
// Popover rendert als Portal mit fixer Position — wird nie abgeschnitten.
// ─────────────────────────────────────────────────────────────────────────────

export type SharedWith = 'all' | string[] | null | undefined;

interface FirmMember { name: string; avatar: string }

// Supabase-Firmen-Mitglieder werden einmal pro Seite geladen und gecacht.
let sbMembersCache: FirmMember[] | null = null;
let sbMembersPromise: Promise<FirmMember[]> | null = null;

async function loadSbMembers(): Promise<FirmMember[]> {
  if (sbMembersCache) return sbMembersCache;
  if (!sbMembersPromise) {
    sbMembersPromise = (async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const sb = getSupabase();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return [];
        const { data } = await sb.from('profile').select('display_name,avatar');
        sbMembersCache = (data ?? []).map(p => ({ name: p.display_name as string, avatar: (p.avatar as string) || '🥷' }));
        return sbMembersCache;
      } catch { return []; }
    })();
  }
  return sbMembersPromise;
}

/** Team-Mitglieder der Firma: Supabase-Profile (falls Session), sonst lokale Mitglieder. */
export function useFirmMembers(): FirmMember[] {
  const ninjas = useNinjasStore(s => s.members);
  const me = useAuthStore(s => s.user?.name ?? null);
  const [sbMembers, setSbMembers] = useState<FirmMember[]>(sbMembersCache ?? []);

  useEffect(() => {
    if (supabaseConfigured()) loadSbMembers().then(m => { if (m.length) setSbMembers(m); });
  }, []);

  const base = sbMembers.length
    ? sbMembers
    : ninjas.map(m => ({ name: m.name, avatar: m.avatar }));
  return base.filter(m => m.name !== me); // sich selbst nicht anzeigen
}

export function SharePicker({
  value, onChange, iconSize = 12, className,
}: {
  value: SharedWith;
  onChange: (v: SharedWith) => void;
  iconSize?: number;
  className?: string;
}) {
  const t = useT();
  const members = useFirmMembers();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const openPicker = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const width = 200;
      const left = Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8);
      const top = Math.min(r.bottom + 4, window.innerHeight - 300);
      setPos({ top, left });
    }
    setOpen(true);
  };

  const list = Array.isArray(value) ? value : [];
  const isShared = value === 'all' || list.length > 0;

  const toggleMember = (name: string) => {
    // Von 'all' aus: alle Mitglieder als Liste übernehmen, dann einen abwählen
    const cur = value === 'all' ? members.map(m => m.name) : list;
    const next = cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name];
    onChange(next.length ? next : null);
  };

  const memberActive = (name: string) => value === 'all' || list.includes(name);

  return (
    <>
      <button ref={btnRef}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); open ? setOpen(false) : openPicker(); }}
        title={isShared ? t('Geteilt — klicken zum Ändern') : t('Mit Team teilen')}
        className={cn('p-1 rounded-md transition-colors',
          isShared ? 'bg-mint-500/15 text-mint-400 opacity-100' : 'bg-anth-800/60 text-anth-500 hover:text-mint-400',
          className)}>
        <Share2 size={iconSize} />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[90]"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setOpen(false); }} />
          <div className="fixed z-[95] glass-dark border border-border rounded-xl shadow-panel p-2 w-[200px] space-y-1"
            style={{ top: pos.top, left: pos.left }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}>
            <p className="text-[9px] uppercase tracking-widest text-anth-600 px-1">{t('Teilen mit')}</p>

            {/* Alle — ganz oben, wählt automatisch alle Mitglieder */}
            <button onClick={() => onChange(value === 'all' ? null : 'all')}
              className={cn('w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors',
                value === 'all' ? 'bg-mint-500/15 text-mint-300' : 'text-anth-400 hover:bg-anth-800/50')}>
              <span>🌐</span>
              <span className="flex-1 text-left">{t('Alle (gesamte Firma)')}</span>
              {value === 'all' && <Check size={9} />}
            </button>

            {/* Mitglieder einzeln */}
            <div className="max-h-40 overflow-y-auto space-y-0.5 border-t border-border/40 pt-1">
              {members.length === 0 && (
                <p className="text-[9px] text-anth-600 px-2 py-1">{t('Keine Team-Mitglieder angelegt.')}</p>
              )}
              {members.map(m => {
                const active = memberActive(m.name);
                return (
                  <button key={m.name} onClick={() => toggleMember(m.name)}
                    className={cn('w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] transition-colors',
                      active ? 'bg-sky-900/30 text-sky-300' : 'text-anth-400 hover:bg-anth-800/50')}>
                    <span>{m.avatar}</span>
                    <span className="flex-1 text-left truncate">{m.name}</span>
                    {active && <Check size={9} />}
                  </button>
                );
              })}
            </div>

            {/* Privat */}
            <button onClick={() => { onChange(null); setOpen(false); }}
              className={cn('w-full text-left px-2 py-1.5 rounded-lg text-[10px] border-t border-border/40 transition-colors',
                !isShared ? 'bg-anth-800/70 text-anth-200' : 'text-anth-400 hover:bg-anth-800/50')}>
              🔒 {t('Privat (nur ich)')}
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
