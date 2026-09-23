'use client';
import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useT } from '@/lib/i18n';

/** Brandfarben-Editor: Farbfelder mit Hex-Anzeige, Hinzufügen per Farbwähler, Entfernen per X. */
export function BrandColorsEditor({ colors, onChange }: {
  colors: string[];
  onChange: (colors: string[]) => void;
}) {
  const t = useT();
  const picker = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <div key={`${c}-${i}`} className="group relative flex flex-col items-center gap-1">
            <label className="w-12 h-12 rounded-xl border border-anth-600/50 cursor-pointer overflow-hidden relative" style={{ background: c }}>
              <input type="color" value={c}
                onChange={e => onChange(colors.map((x, j) => j === i ? e.target.value : x))}
                className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
            <span className="text-[9px] font-mono text-anth-400">{c}</span>
            <button onClick={() => onChange(colors.filter((_, j) => j !== i))}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-anth-950 border border-anth-700 text-anth-400 hover:text-red-400 items-center justify-center hidden group-hover:flex">
              <X size={9} />
            </button>
          </div>
        ))}
        <button onClick={() => picker.current?.click()}
          className="w-12 h-12 rounded-xl border-2 border-dashed border-anth-600/60 text-anth-500 hover:border-mint-500/60 hover:text-mint-300 transition-colors flex items-center justify-center"
          title={t('Brandfarbe hinzufügen')}>
          <Plus size={16} />
        </button>
        <input ref={picker} type="color" defaultValue="#11CAA0" className="hidden"
          onChange={e => { onChange([...colors, e.target.value]); }} />
      </div>
      {colors.length === 0 && (
        <p className="mt-2 text-[10px] text-anth-500">{t('Noch keine Brandfarben — klicke auf ＋ und wähle eine Farbe.')}</p>
      )}
    </div>
  );
}
