'use client';
/**
 * Strategie — social media strategy workspace.
 * Left: program/link launcher (same cards as Media Studio pages).
 * Right: strategy sections — starts with "Hauptstrategie", more can be added
 * via +. Each section holds free-form strategy notes.
 */
import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { AppLauncher } from '@/components/launcher/AppLauncher';
import { useStrategyStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function StrategiePage() {
  const t = useT();
  const { sections, activeSectionId, addSection, updateSection, removeSection, setActiveSection } = useStrategyStore();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const active = sections.find(s => s.id === activeSectionId) ?? sections[0] ?? null;

  const submitNew = () => {
    if (!newTitle.trim()) return;
    addSection(newTitle.trim());
    setNewTitle('');
    setAdding(false);
  };

  return (
    <div className="h-full flex gap-4 fade-in">
      {/* ── Left: launcher for strategy tools ── */}
      <div className="flex-1 min-w-0">
        <AppLauncher pageKey="strategie" title="Strategie" subtitle="Strategie-Tools & Programme verknüpfen." />
      </div>

      {/* ── Right: strategy description column ── */}
      <div className="w-96 shrink-0 glass rounded-2xl border border-border p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-anth-600">{t('Strategie-Beschreibung')}</p>
          <button onClick={() => setAdding(v => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-mint-500/30 bg-mint-500/10 text-mint-400 text-[10px] font-semibold hover:bg-mint-500/20 transition-colors">
            <Plus size={10} /> {t('Punkt')}
          </button>
        </div>

        {/* New section input */}
        {adding && (
          <div className="flex gap-1.5 shrink-0">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitNew()}
              placeholder={t('Titel des Strategie-Punkts…')}
              className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-forest-100 outline-none focus:border-mint-500/40" />
            <button onClick={submitNew} disabled={!newTitle.trim()}
              className="px-3 rounded-xl bg-mint-500/20 border border-mint-500/40 text-mint-400 text-xs disabled:opacity-40">✓</button>
            <button onClick={() => setAdding(false)} className="px-2 rounded-xl border border-border text-anth-500"><X size={11} /></button>
          </div>
        )}

        {/* Section tabs */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {sections.map(s => (
            <div key={s.id} className="group relative">
              <button onClick={() => setActiveSection(s.id)}
                className={cn('px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all',
                  active?.id === s.id
                    ? 'border-gold/50 bg-gold/10 text-gold'
                    : 'border-border text-anth-500 hover:text-anth-300')}>
                {s.title}
              </button>
              {s.id !== 'strat-main' && (
                <button onClick={() => removeSection(s.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-anth-800 border border-border text-anth-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <Trash2 size={7} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Active section editor */}
        {active && (
          <textarea
            key={active.id}
            value={active.content}
            onChange={e => updateSection(active.id, { content: e.target.value })}
            placeholder={`${active.title} — ${t('beschreibe hier deine Strategie…')}\n\n${t('Ziele, Zielgruppen, Content-Formate, Frequenz, KPIs…')}`}
            className="flex-1 bg-surface border border-border rounded-xl p-3 text-xs text-anth-200 leading-relaxed resize-none outline-none focus:border-gold/40 transition-colors"
          />
        )}
      </div>
    </div>
  );
}
