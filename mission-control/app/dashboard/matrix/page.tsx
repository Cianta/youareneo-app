'use client';
import { useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Atom, Check, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useT } from '@/lib/i18n';

// ─────────────────────────────────────────────────────────────────────────────
// MATRIX — Karten-Board für Themen (Wetter, Nachrichten, Reisen, …).
// Karten legen sich neben- und untereinander (Masonry); ihre Größe wächst mit
// der Anzahl der verknüpften Programme/Links. Eigene Karten per ＋.
// ─────────────────────────────────────────────────────────────────────────────

interface MatrixLink { id: string; name: string; url: string }
interface MatrixCard { id: string; title: string; emoji: string; links: MatrixLink[] }

interface MatrixStore {
  cards: MatrixCard[];
  addCard: (title: string, emoji?: string) => void;
  removeCard: (id: string) => void;
  renameCard: (id: string, title: string) => void;
  addLink: (cardId: string, name: string, url: string) => void;
  removeLink: (cardId: string, linkId: string) => void;
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const useMatrixStore = create<MatrixStore>()(
  persist(
    (set) => ({
      cards: [
        { id: 'mx-wetter',      title: 'Wetter',      emoji: '⛅', links: [] },
        { id: 'mx-nachrichten', title: 'Nachrichten', emoji: '📰', links: [] },
        { id: 'mx-reisen',      title: 'Reisen',      emoji: '✈️', links: [] },
        { id: 'mx-cosmic',      title: 'Cosmic Sync', emoji: '🌌', links: [{ id: 'mx-cs-1', name: 'Space Weather', url: '/dashboard/matrix/space-weather' }] },
      ],
      addCard: (title, emoji = '🗂️') => set(s => ({ cards: [...s.cards, { id: uid('mx'), title, emoji, links: [] }] })),
      removeCard: (id) => set(s => ({ cards: s.cards.filter(c => c.id !== id) })),
      renameCard: (id, title) => set(s => ({ cards: s.cards.map(c => c.id === id ? { ...c, title } : c) })),
      addLink: (cardId, name, url) => set(s => ({
        cards: s.cards.map(c => c.id === cardId ? { ...c, links: [...c.links, { id: uid('ml'), name, url }] } : c),
      })),
      removeLink: (cardId, linkId) => set(s => ({
        cards: s.cards.map(c => c.id === cardId ? { ...c, links: c.links.filter(l => l.id !== linkId) } : c),
      })),
    }),
    { name: 'trinity-matrix' }
  )
);

export default function MatrixPage() {
  const t = useT();
  const { cards, addCard, removeCard, renameCard, addLink, removeLink } = useMatrixStore();
  const [addingCard, setAddingCard]   = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [addingIn, setAddingIn]       = useState<string | null>(null);
  const [linkName, setLinkName]       = useState('');
  const [linkUrl, setLinkUrl]         = useState('');
  const [editId, setEditId]           = useState<string | null>(null);
  const [editName, setEditName]       = useState('');

  const openLink = (url: string) => {
    if (url.startsWith('/')) { window.location.href = url; return; }
    window.open(/^https?:\/\//i.test(url) ? url : `https://${url}`, '_blank');
  };

  const submitLink = (cardId: string) => {
    const url = linkUrl.trim();
    if (!url) return;
    const fallback = (() => { try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname; } catch { return url; } })();
    addLink(cardId, linkName.trim() || fallback, url);
    setLinkName(''); setLinkUrl(''); setAddingIn(null);
  };

  return (
    <div className="h-full flex flex-col fade-in overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-border/40">
        <Atom size={16} className="text-violet-400" />
        <div className="flex-1">
          <h1 className="text-base font-bold text-forest-50">Matrix</h1>
          <p className="text-[11px] text-anth-400">{t('Deine Themen-Karten — Programme & Websites pro Thema verknüpfen.')}</p>
        </div>
        {addingCard ? (
          <div className="flex items-center gap-1">
            <input value={newCardName} onChange={e => setNewCardName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newCardName.trim()) { addCard(newCardName.trim()); setNewCardName(''); setAddingCard(false); }
                if (e.key === 'Escape') setAddingCard(false);
              }}
              placeholder={t('Karten-Titel…')} autoFocus
              className="bg-surface border border-violet-700/40 rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-500 outline-none w-40" />
            <button onClick={() => { if (newCardName.trim()) { addCard(newCardName.trim()); setNewCardName(''); setAddingCard(false); } }}
              className="p-1.5 text-violet-400"><Check size={13} /></button>
            <button onClick={() => setAddingCard(false)} className="p-1.5 text-anth-500"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setAddingCard(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-violet-600/50 bg-violet-900/20 text-xs text-violet-300 hover:text-violet-100 hover:border-violet-500/70 transition-all">
            <Plus size={13} strokeWidth={3} /> {t('Karte hinzufügen')}
          </button>
        )}
      </div>

      {/* Masonry — Karten neben- und untereinander, Höhe wächst mit Inhalt */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin">
        <div className="columns-1 sm:columns-2 xl:columns-3 2xl:columns-4 gap-4 [&>*]:mb-4">
          {cards.map(card => (
            <div key={card.id}
              className="break-inside-avoid rounded-2xl border border-border/60 bg-anth-900/40 overflow-hidden group/card"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 28px rgba(0,0,0,0.35)' }}>
              {/* Kartenkopf */}
              <div className="flex items-center gap-2 px-3.5 py-3 border-b border-border/40 bg-anth-950/50">
                <span className="text-lg shrink-0">{card.emoji}</span>
                {editId === card.id ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { if (editName.trim()) renameCard(card.id, editName.trim()); setEditId(null); }
                      if (e.key === 'Escape') setEditId(null);
                    }} autoFocus
                    className="flex-1 min-w-0 bg-surface border border-violet-700/50 rounded-lg px-2 py-0.5 text-sm text-forest-100 outline-none" />
                ) : (
                  <p className="flex-1 text-sm font-bold text-forest-50 truncate">{t(card.title)}</p>
                )}
                <span className="text-[10px] text-anth-500">{card.links.length}</span>
                <button onClick={() => { setEditId(card.id); setEditName(card.title); }}
                  className="p-0.5 text-anth-500 hover:text-violet-300 opacity-0 group-hover/card:opacity-100 transition-all"><Pencil size={11} /></button>
                <button onClick={() => removeCard(card.id)}
                  className="p-0.5 text-anth-500 hover:text-red-400 opacity-0 group-hover/card:opacity-100 transition-all"><Trash2 size={11} /></button>
              </div>

              {/* Links */}
              <div className="p-2.5 space-y-1.5">
                {card.links.length === 0 && (
                  <p className="text-[10px] text-anth-500 px-1 py-2 text-center">{t('Noch keine Links verknüpft.')}</p>
                )}
                {card.links.map(l => (
                  <div key={l.id} className="relative group/link">
                    <button onClick={() => openLink(l.url)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-anth-800/40 hover:border-violet-600/50 hover:bg-violet-900/20 transition-all text-left">
                      <span className="text-sm shrink-0">🔗</span>
                      <span className="flex-1 min-w-0 text-xs text-anth-200 truncate">{t(l.name)}</span>
                      <ExternalLink size={10} className="text-anth-500 shrink-0" />
                    </button>
                    <button onClick={() => removeLink(card.id, l.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-anth-800 border border-border flex items-center justify-center text-anth-400 hover:text-red-400 opacity-0 group-hover/link:opacity-100 transition-all">
                      <X size={8} />
                    </button>
                  </div>
                ))}

                {addingIn === card.id ? (
                  <div className="p-2 rounded-xl border border-violet-500/30 bg-violet-900/15 space-y-1.5">
                    <input value={linkName} onChange={e => setLinkName(e.target.value)}
                      placeholder={t('Name…')} autoFocus
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-500 outline-none" />
                    <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitLink(card.id); if (e.key === 'Escape') setAddingIn(null); }}
                      placeholder="https://…"
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[11px] text-forest-100 placeholder-anth-500 outline-none" />
                    <div className="flex gap-1">
                      <button onClick={() => submitLink(card.id)}
                        className="flex-1 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-[10px] text-violet-300 hover:bg-violet-500/25 transition-colors">
                        {t('Hinzufügen')}
                      </button>
                      <button onClick={() => setAddingIn(null)} className="p-1 text-anth-500 hover:text-anth-300"><X size={11} /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingIn(card.id); setLinkName(''); setLinkUrl(''); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-anth-600/50 text-[10px] text-anth-400 hover:text-violet-300 hover:border-violet-600/50 transition-all">
                    <Plus size={10} /> {t('Link verknüpfen')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
