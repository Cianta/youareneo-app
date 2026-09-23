'use client';
import { useEffect, useRef, useState } from 'react';
import {
  User, Target, Image as ImageIcon, Lightbulb, Link2, Save, Download,
  Plus, X, Check, Trash2, Sparkles, Eraser, Pencil, StickyNote as StickyIcon,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import {
  useSelfStore, useNeuralNotebookStore, useAuthStore,
  goalVisibleTo, type GoalEntry, type SelfProfile, type StickyNote,
} from '@/lib/store';
import { AgentSummaryBar } from '@/components/shared/AgentSummaryBar';
import { BrandColorsEditor } from '@/components/shared/BrandColors';

// ─────────────────────────────────────────────────────────────────────────────
// SELF — persönliches Dashboard (inspiriert von Journal.it, TickTick, Todoist).
// Tabs: Profil · Lebensziele (live verknüpft mit Daily Notebook & Tasks) ·
// Visionboard · Brainstorm (Zeichenfeld + Haftnotizen) · Integrationen.
// Alles wird als Markdown gespeichert (Speichern-Button immer sichtbar);
// ein Digital-Staff-Agent kann das Profil zusammenfassen — die Zusammenfassung
// kann per Haken jedem Agenten-Prompt als Vorinfo beigefügt werden.
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = 'profil' | 'ziele' | 'vision' | 'brainstorm' | 'integrationen';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'profil',        label: 'Profil',        icon: User },
  { key: 'ziele',         label: 'Lebensziele',   icon: Target },
  { key: 'vision',        label: 'Visionboard',   icon: ImageIcon },
  { key: 'brainstorm',    label: 'Brainstorm',    icon: Lightbulb },
  { key: 'integrationen', label: 'Integrationen', icon: Link2 },
];

const STICKY_COLORS = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fbcfe8', '#ddd6fe'];

function readFileAsDataUrl(file: File, maxDim = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        if (scale === 1) { resolve(reader.result as string); return; }
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Markdown-Export ────────────────────────────────────────────────────────────
function buildProfileMarkdown(
  profile: SelfProfile, goals: GoalEntry[], visionCaptions: string[],
  brainstormText: string, stickyTexts: string[],
): string {
  const L: string[] = [];
  L.push(`# Self-Profil${profile.name ? ` — ${profile.name}` : ''}`);
  L.push(`_Stand: ${new Date().toLocaleString('de-DE')}_`, '');
  L.push('## Profil');
  const rows: [string, string][] = [
    ['Name', profile.name], ['Rolle', profile.role], ['Alter', profile.age],
    ['Geschlecht', profile.gender], ['Geburtstag', profile.birthday],
    ['Ort', profile.location], ['Ausbildung', profile.education],
    ['Stärken', profile.strengths], ['Werte', profile.values],
    ['Interessen', profile.interests],
  ];
  rows.filter(([, v]) => v.trim()).forEach(([k, v]) => L.push(`- **${k}:** ${v.trim()}`));
  if (profile.brandColors?.length) L.push(`- **Brandfarben:** ${profile.brandColors.join(', ')}`);
  if (profile.logoDataUrl) L.push('- **Logo:** hinterlegt');
  if (profile.story.trim())   { L.push('', '## Meine Geschichte', profile.story.trim()); }
  if (profile.vision.trim())  { L.push('', '## Vision',  profile.vision.trim()); }
  if (profile.mission.trim()) { L.push('', '## Mission', profile.mission.trim()); }
  if (goals.length) {
    L.push('', '## Lebensziele');
    goals.forEach(g => {
      L.push(`- [${g.completed ? 'x' : ' '}] ${g.text}`);
      g.notes.forEach(n => L.push(`  - Notiz: ${n.text}`));
    });
  }
  const caps = visionCaptions.filter(c => c.trim());
  if (caps.length) { L.push('', '## Visionboard'); caps.forEach(c => L.push(`- ${c.trim()}`)); }
  if (brainstormText.trim()) { L.push('', '## Brainstorm', brainstormText.trim()); }
  const notes = stickyTexts.filter(s => s.trim());
  if (notes.length) { L.push('', '### Haftnotizen'); notes.forEach(n => L.push(`- ${n.trim()}`)); }
  return L.join('\n') + '\n';
}

function downloadMd(md: string, filename: string) {
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Feld-Bausteine ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, area }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean;
}) {
  const t = useT();
  const cls = 'w-full px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-forest-600/60 transition-colors';
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-anth-400 mb-1">{t(label)}</span>
      {area
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ? t(placeholder) : undefined} rows={3} className={cn(cls, 'resize-y min-h-[64px]')} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ? t(placeholder) : undefined} className={cls} />}
    </label>
  );
}

function Card({ title, icon: Icon, children, accent }: {
  title: string; icon?: React.ElementType; children: React.ReactNode; accent?: string;
}) {
  const t = useT();
  return (
    <section className="rounded-2xl border border-anth-700/40 bg-anth-900/40 p-4">
      <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: accent ?? '#8F8F8F' }}>
        {Icon && <Icon size={13} />} {t(title)}
      </h3>
      {children}
    </section>
  );
}

// ── Tab: Profil ────────────────────────────────────────────────────────────────
function ProfileTab() {
  const t = useT();
  const { profile, setProfile } = useSelfStore();
  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Persönliche Daten" icon={User} accent="#11CAA0">
        <div className="flex items-start gap-4 mb-4">
          <button onClick={() => avatarInput.current?.click()}
            className="w-20 h-20 shrink-0 rounded-full border-2 border-dashed border-anth-600/60 hover:border-mint-500/60 transition-colors overflow-hidden flex items-center justify-center bg-anth-900/60"
            title={t('Profilbild hochladen')}>
            {profile.avatarDataUrl
              ? <img src={profile.avatarDataUrl} alt="" className="w-full h-full object-cover" />
              : <User size={26} className="text-anth-500" />}
          </button>
          <input ref={avatarInput} type="file" accept="image/*" className="hidden"
            onChange={async e => { const f = e.target.files?.[0]; if (f) setProfile({ avatarDataUrl: await readFileAsDataUrl(f, 400) }); e.target.value = ''; }} />
          <div className="flex-1 grid gap-2">
            <Field label="Name" value={profile.name} onChange={v => setProfile({ name: v })} placeholder="Dein Name" />
            <Field label="Rolle" value={profile.role} onChange={v => setProfile({ role: v })} placeholder="z. B. Gründer, Visionär, Coach" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Alter" value={profile.age} onChange={v => setProfile({ age: v })} />
          <Field label="Geschlecht" value={profile.gender} onChange={v => setProfile({ gender: v })} />
          <Field label="Geburtstag" value={profile.birthday} onChange={v => setProfile({ birthday: v })} />
          <Field label="Ort" value={profile.location} onChange={v => setProfile({ location: v })} />
        </div>
        <div className="mt-2 grid gap-2">
          <Field label="Ausbildung" value={profile.education} onChange={v => setProfile({ education: v })} area placeholder="Schule, Studium, Weiterbildungen …" />
        </div>
      </Card>

      <Card title="Meine Geschichte" icon={Pencil} accent="#f0abfc">
        <textarea value={profile.story} onChange={e => setProfile({ story: e.target.value })}
          placeholder={t('Erzähle deine Geschichte — Herkunft, Wendepunkte, was dich geprägt hat …')}
          className="w-full h-64 px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-fuchsia-500/40 resize-y" />
      </Card>

      <Card title="Hintergrund" icon={Sparkles} accent="#fbbf24">
        <div className="grid gap-2">
          <Field label="Stärken" value={profile.strengths} onChange={v => setProfile({ strengths: v })} area />
          <Field label="Werte" value={profile.values} onChange={v => setProfile({ values: v })} area />
          <Field label="Interessen" value={profile.interests} onChange={v => setProfile({ interests: v })} area />
        </div>
      </Card>

      <Card title="Vision & Mission" icon={Target} accent="#7dd3fc">
        <div className="grid gap-2">
          <Field label="Vision" value={profile.vision} onChange={v => setProfile({ vision: v })} area placeholder="Wohin geht die Reise — das große Bild?" />
          <Field label="Mission" value={profile.mission} onChange={v => setProfile({ mission: v })} area placeholder="Was ist dein Beitrag — dein Warum?" />
        </div>
      </Card>

      <Card title="Brand" icon={Palette} accent="#f0abfc">
        <p className="text-[10px] text-anth-500 mb-3">{t('Dein persönliches Logo und deine Brandfarben — werden mitgespeichert.')}</p>
        <div className="flex items-start gap-4">
          <button onClick={() => logoInput.current?.click()}
            className="w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-anth-600/60 hover:border-fuchsia-500/60 transition-colors overflow-hidden flex items-center justify-center bg-anth-900/60"
            title={t('Logo hochladen')}>
            {profile.logoDataUrl
              ? <img src={profile.logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              : <Palette size={24} className="text-anth-500" />}
          </button>
          <input ref={logoInput} type="file" accept="image/*" className="hidden"
            onChange={async e => { const f = e.target.files?.[0]; if (f) setProfile({ logoDataUrl: await readFileAsDataUrl(f, 600) }); e.target.value = ''; }} />
          <div className="flex-1">
            <BrandColorsEditor colors={profile.brandColors ?? []} onChange={c => setProfile({ brandColors: c })} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Lebensziele (verknüpft mit Daily Notebook & Tasks) ────────────────────
function GoalsTab() {
  const t = useT();
  const { goals, addGoal, updateGoal, deleteGoal, addGoalNote } = useNeuralNotebookStore();
  const { goalImages, setGoalImage, todoistToken, trelloKey, trelloToken, trelloListId } = useSelfStore();
  const currentUser = useAuthStore(s => s.user?.name ?? null);
  const [newGoal, setNewGoal] = useState('');
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [sendStatus, setSendStatus] = useState<Record<string, string>>({});
  const imgInput = useRef<HTMLInputElement>(null);
  const imgTarget = useRef<string | null>(null);

  const lifeGoals = goals.filter(g => g.folder === 'lebensziele' && goalVisibleTo(g, currentUser));

  const sendTo = async (g: GoalEntry, target: 'todoist' | 'trello') => {
    setSendStatus(s => ({ ...s, [g.id]: '…' }));
    const body = target === 'todoist'
      ? { provider: 'todoist', token: todoistToken, action: 'addTask', content: g.text, description: 'Lebensziel aus TRINITY OS Self' }
      : { provider: 'trello', key: trelloKey, token: trelloToken, action: 'addCard', listId: trelloListId, name: g.text, desc: 'Lebensziel aus TRINITY OS Self' };
    try {
      const r = await fetch('/api/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      setSendStatus(s => ({ ...s, [g.id]: d.ok ? '✓' : '✗' }));
    } catch { setSendStatus(s => ({ ...s, [g.id]: '✗' })); }
    setTimeout(() => setSendStatus(s => { const n = { ...s }; delete n[g.id]; return n; }), 3000);
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-anth-400">
        {t('Live verknüpft mit den Lebenszielen im Daily Notebook und der Task-Übersicht — Änderungen erscheinen überall.')}
      </p>

      {/* Neues Ziel */}
      <div className="flex gap-2">
        <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { addGoal(newGoal.trim(), 'lebensziele'); setNewGoal(''); } }}
          placeholder={t('Neues Lebensziel …')}
          className="flex-1 px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-forest-600/60" />
        <button onClick={() => { if (newGoal.trim()) { addGoal(newGoal.trim(), 'lebensziele'); setNewGoal(''); } }}
          className="px-3 py-2 rounded-xl bg-forest-700/40 border border-forest-600/50 text-forest-100 text-xs hover:bg-forest-700/60 transition-colors flex items-center gap-1">
          <Plus size={12} /> {t('Hinzufügen')}
        </button>
      </div>

      <input ref={imgInput} type="file" accept="image/*" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0];
          if (f && imgTarget.current) setGoalImage(imgTarget.current, await readFileAsDataUrl(f, 900));
          e.target.value = '';
        }} />

      <div className="grid gap-3 md:grid-cols-2">
        {lifeGoals.map(g => (
          <div key={g.id} className={cn('rounded-2xl border p-3 transition-colors',
            g.completed ? 'border-forest-700/50 bg-forest-950/40' : 'border-anth-700/40 bg-anth-900/40')}>
            {goalImages[g.id] && (
              <div className="relative mb-2 rounded-xl overflow-hidden">
                <img src={goalImages[g.id]} alt="" className="w-full h-28 object-cover" />
                <button onClick={() => setGoalImage(g.id, null)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-anth-950/80 text-anth-300 hover:text-red-400 flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            )}
            <div className="flex items-start gap-2">
              <button onClick={() => updateGoal(g.id, { completed: !g.completed })}
                className={cn('mt-0.5 w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-colors',
                  g.completed ? 'bg-mint-500/30 border-mint-500/60 text-mint-300' : 'border-anth-600/60 text-transparent hover:border-mint-500/50')}>
                <Check size={10} />
              </button>
              <input value={g.text} onChange={e => updateGoal(g.id, { text: e.target.value })}
                className={cn('flex-1 bg-transparent text-xs focus:outline-none', g.completed ? 'line-through text-anth-500' : 'text-forest-100')} />
              <button onClick={() => deleteGoal(g.id)} className="text-anth-600 hover:text-red-400 transition-colors" title={t('Löschen')}>
                <Trash2 size={12} />
              </button>
            </div>
            {g.notes.length > 0 && (
              <ul className="mt-2 space-y-0.5 pl-6">
                {g.notes.map(n => <li key={n.id} className="text-[10px] text-anth-400">· {n.text}</li>)}
              </ul>
            )}
            {noteFor === g.id ? (
              <div className="mt-2 flex gap-1.5">
                <input autoFocus value={noteText} onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) { addGoalNote(g.id, noteText.trim()); setNoteText(''); setNoteFor(null); } }}
                  placeholder={t('Notiz …')}
                  className="flex-1 px-2 py-1 text-[10px] bg-anth-900/60 border border-anth-700/40 rounded-lg text-forest-100 focus:outline-none" />
                <button onClick={() => setNoteFor(null)} className="text-anth-500 hover:text-anth-300"><X size={11} /></button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-[10px]">
                <button onClick={() => { setNoteFor(g.id); setNoteText(''); }} className="text-anth-500 hover:text-forest-300 transition-colors">+ {t('Notiz')}</button>
                <button onClick={() => { imgTarget.current = g.id; imgInput.current?.click(); }}
                  className="text-anth-500 hover:text-forest-300 transition-colors">+ {t('Bild')}</button>
                {todoistToken && (
                  <button onClick={() => sendTo(g, 'todoist')} className="text-anth-500 hover:text-red-300 transition-colors">
                    → Todoist {sendStatus[g.id] ?? ''}
                  </button>
                )}
                {trelloKey && trelloToken && trelloListId && (
                  <button onClick={() => sendTo(g, 'trello')} className="text-anth-500 hover:text-sky-300 transition-colors">
                    → Trello {sendStatus[g.id] ?? ''}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {lifeGoals.length === 0 && (
          <p className="text-xs text-anth-500 col-span-full">{t('Noch keine Lebensziele — füge oben dein erstes hinzu.')}</p>
        )}
      </div>
    </div>
  );
}

// ── Tab: Visionboard ───────────────────────────────────────────────────────────
function VisionTab() {
  const t = useT();
  const { visionImages, addVisionImage, removeVisionImage, updateVisionCaption } = useSelfStore();
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => input.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-900/30 border border-violet-700/40 text-violet-200 text-xs hover:bg-violet-900/50 transition-colors">
          <Plus size={12} /> {t('Bild zum Visionboard hinzufügen')}
        </button>
        <p className="text-[10px] text-anth-500">{t('Bilder, die deine Ziele und Träume sichtbar machen.')}</p>
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="hidden"
        onChange={async e => {
          for (const f of Array.from(e.target.files ?? [])) addVisionImage(await readFileAsDataUrl(f));
          e.target.value = '';
        }} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visionImages.map(v => (
          <figure key={v.id} className="group relative rounded-2xl overflow-hidden border border-anth-700/40 bg-anth-900/40">
            <img src={v.dataUrl} alt={v.caption} className="w-full h-44 object-cover" />
            <button onClick={() => removeVisionImage(v.id)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-anth-950/80 text-anth-300 hover:text-red-400 items-center justify-center hidden group-hover:flex">
              <X size={12} />
            </button>
            <input value={v.caption} onChange={e => updateVisionCaption(v.id, e.target.value)}
              placeholder={t('Beschriftung …')}
              className="w-full px-3 py-2 text-[11px] bg-anth-950/60 text-forest-100 placeholder:text-anth-600 focus:outline-none" />
          </figure>
        ))}
        {visionImages.length === 0 && (
          <p className="text-xs text-anth-500 col-span-full">{t('Noch leer — lade Bilder hoch, die dich an deine Vision erinnern.')}</p>
        )}
      </div>
    </div>
  );
}

// ── Tab: Brainstorm (Zeichenfeld + Haftnotizen) ────────────────────────────────
function DrawingPad() {
  const t = useT();
  const { drawingDataUrl, setDrawing } = useSelfStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState('#11CAA0');
  const [size, setSize] = useState(3);
  const [eraser, setEraser] = useState(false);

  // Gespeicherte Zeichnung laden
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#101215';
    ctx.fillRect(0, 0, c.width, c.height);
    if (drawingDataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = drawingDataUrl;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current!.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current!.height / r.height),
      p: e.pressure > 0 ? e.pressure : 0.5,   // Stift-/Zeichenpad-Druck
    };
  };

  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    canvasRef.current!.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const { x, y, p } = pos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = eraser ? '#101215' : color;
    ctx.lineWidth = (eraser ? size * 6 : size) * (0.5 + p);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setDrawing(canvasRef.current!.toDataURL('image/png'));
  };
  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#101215'; ctx.fillRect(0, 0, c.width, c.height);
    setDrawing('');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {['#11CAA0', '#f0abfc', '#7dd3fc', '#fbbf24', '#f87171', '#e5e7eb'].map(c => (
          <button key={c} onClick={() => { setColor(c); setEraser(false); }}
            className={cn('w-5 h-5 rounded-full border-2 transition-transform',
              color === c && !eraser ? 'border-white scale-110' : 'border-transparent hover:scale-105')}
            style={{ background: c }} />
        ))}
        <button onClick={() => setEraser(v => !v)}
          className={cn('flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-colors',
            eraser ? 'bg-anth-700/60 border-anth-500/60 text-forest-100' : 'border-anth-700/40 text-anth-400 hover:text-anth-200')}>
          <Eraser size={11} /> {t('Radierer')}
        </button>
        <input type="range" min={1} max={12} value={size} onChange={e => setSize(Number(e.target.value))} className="w-24 accent-mint-500" />
        <button onClick={clear} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-anth-700/40 text-[10px] text-anth-400 hover:text-red-300 transition-colors">
          <Trash2 size={11} /> {t('Leeren')}
        </button>
      </div>
      <canvas ref={canvasRef} width={1200} height={560}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="w-full rounded-2xl border border-anth-700/40 cursor-crosshair"
        style={{ touchAction: 'none', background: '#101215' }} />
      <p className="mt-1 text-[10px] text-anth-500">{t('Funktioniert mit Maus, Finger und Zeichenpad/Stift (mit Druckstärke). Wird automatisch gespeichert.')}</p>
    </div>
  );
}

function StickyBoard() {
  const t = useT();
  const { stickyNotes, addSticky, updateSticky, removeSticky } = useSelfStore();
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const onDown = (e: React.PointerEvent, n: StickyNote) => {
    const r = boardRef.current!.getBoundingClientRect();
    drag.current = { id: n.id, dx: e.clientX - r.left - n.x, dy: e.clientY - r.top - n.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const r = boardRef.current!.getBoundingClientRect();
    updateSticky(drag.current.id, {
      x: Math.max(0, Math.min(r.width - 170, e.clientX - r.left - drag.current.dx)),
      y: Math.max(0, Math.min(r.height - 120, e.clientY - r.top - drag.current.dy)),
    });
  };
  const onUp = () => { drag.current = null; };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-anth-400 flex items-center gap-1"><StickyIcon size={11} /> {t('Notiz ankleben')}:</span>
        {STICKY_COLORS.map(c => (
          <button key={c} onClick={() => addSticky(c)}
            className="w-5 h-5 rounded-md border border-anth-950/40 hover:scale-110 transition-transform shadow"
            style={{ background: c }} title={t('Notiz ankleben')} />
        ))}
      </div>
      <div ref={boardRef} onPointerMove={onMove} onPointerUp={onUp}
        className="relative h-72 rounded-2xl border border-anth-700/40 bg-anth-900/30 overflow-hidden">
        {stickyNotes.map(n => (
          <div key={n.id} className="absolute w-40 rounded-lg shadow-lg" style={{ left: n.x, top: n.y, background: n.color }}>
            <div onPointerDown={e => onDown(e, n)}
              className="flex items-center justify-between px-2 pt-1 cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }}>
              <span className="w-8 h-1 rounded-full bg-black/15" />
              <button onClick={() => removeSticky(n.id)} className="text-black/40 hover:text-black/80"><X size={11} /></button>
            </div>
            <textarea value={n.text} onChange={e => updateSticky(n.id, { text: e.target.value })}
              placeholder="…" rows={3}
              className="w-full px-2 pb-2 bg-transparent text-[11px] text-anth-950 placeholder:text-black/30 resize-none focus:outline-none" />
          </div>
        ))}
        {stickyNotes.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-[11px] text-anth-600 pointer-events-none">
            {t('Klicke oben auf eine Farbe, um eine Haftnotiz anzukleben.')}
          </p>
        )}
      </div>
    </div>
  );
}

function BrainstormTab() {
  const t = useT();
  const { brainstormText, setBrainstormText } = useSelfStore();
  return (
    <div className="space-y-4">
      <Card title="Freies Denken" icon={Lightbulb} accent="#fbbf24">
        <textarea value={brainstormText} onChange={e => setBrainstormText(e.target.value)}
          placeholder={t('Ideen, Gedankenblitze, Fragen an dich selbst …')}
          className="w-full h-32 px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-amber-500/40 resize-y" />
      </Card>
      <Card title="Zeichenfeld" icon={Pencil} accent="#11CAA0">
        <DrawingPad />
      </Card>
      <Card title="Haftnotizen" icon={StickyIcon} accent="#f0abfc">
        <StickyBoard />
      </Card>
    </div>
  );
}

// ── Tab: Integrationen ─────────────────────────────────────────────────────────
function IntegrationsTab() {
  const t = useT();
  const { todoistToken, setTodoistToken, trelloKey, trelloToken, trelloListId, setTrello } = useSelfStore();
  const [tdToken, setTdToken] = useState(todoistToken);
  const [tdStatus, setTdStatus] = useState('');
  const [trKey, setTrKey] = useState(trelloKey);
  const [trToken, setTrToken] = useState(trelloToken);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [boardId, setBoardId] = useState('');
  const [listId, setListId] = useState(trelloListId);
  const [trStatus, setTrStatus] = useState('');

  const testTodoist = async () => {
    setTdStatus('…');
    try {
      const r = await fetch('/api/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'todoist', token: tdToken, action: 'test' }) });
      const d = await r.json();
      if (d.ok) { setTodoistToken(tdToken); setTdStatus(`✓ ${t('Verbunden')} (${d.projects.length} ${t('Projekte')})`); }
      else setTdStatus(`✗ ${d.error ?? 'Fehler'}`);
    } catch { setTdStatus('✗ Fehler'); }
  };

  const loadBoards = async () => {
    setTrStatus('…');
    try {
      const r = await fetch('/api/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'trello', key: trKey, token: trToken, action: 'listBoards' }) });
      const d = await r.json();
      if (d.ok) { setBoards(d.boards); setTrStatus(`✓ ${d.boards.length} Boards`); }
      else setTrStatus(`✗ ${d.error ?? 'Fehler'}`);
    } catch { setTrStatus('✗ Fehler'); }
  };

  const loadLists = async (bid: string) => {
    setBoardId(bid);
    if (!bid) { setLists([]); return; }
    const r = await fetch('/api/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'trello', key: trKey, token: trToken, action: 'listLists', boardId: bid }) });
    const d = await r.json();
    if (d.ok) setLists(d.lists);
  };

  const saveTrello = (lid: string) => {
    setListId(lid);
    if (lid) { setTrello(trKey, trToken, lid); setTrStatus(`✓ ${t('Gespeichert')}`); }
  };

  const inputCls = 'w-full px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-forest-600/60';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Todoist" icon={Check} accent="#f87171">
        <p className="text-[10px] text-anth-500 mb-2">
          {t('API-Token unter Todoist → Einstellungen → Integrationen → Entwickler kopieren. Danach lassen sich Lebensziele als Todoist-Aufgabe senden.')}
        </p>
        <div className="flex gap-2">
          <input type="password" value={tdToken} onChange={e => setTdToken(e.target.value)} placeholder="Todoist API-Token" className={inputCls} />
          <button onClick={testTodoist} className="shrink-0 px-3 py-2 rounded-xl bg-red-900/30 border border-red-700/40 text-red-200 text-xs hover:bg-red-900/50 transition-colors">
            {t('Verbinden')}
          </button>
        </div>
        {tdStatus && <p className="mt-2 text-[11px] text-anth-300">{tdStatus}</p>}
        {todoistToken && <p className="mt-1 text-[10px] text-mint-400">✓ {t('Aktiv — in den Lebenszielen erscheint „→ Todoist".')}</p>}
      </Card>

      <Card title="Trello" icon={Link2} accent="#7dd3fc">
        <p className="text-[10px] text-anth-500 mb-2">
          {t('API-Key & Token unter trello.com/power-ups/admin erstellen. Dann Board und Liste wählen — Lebensziele lassen sich als Trello-Karte senden.')}
        </p>
        <div className="grid gap-2">
          <input type="password" value={trKey} onChange={e => setTrKey(e.target.value)} placeholder="Trello API-Key" className={inputCls} />
          <div className="flex gap-2">
            <input type="password" value={trToken} onChange={e => setTrToken(e.target.value)} placeholder="Trello Token" className={inputCls} />
            <button onClick={loadBoards} className="shrink-0 px-3 py-2 rounded-xl bg-sky-900/30 border border-sky-700/40 text-sky-200 text-xs hover:bg-sky-900/50 transition-colors">
              {t('Boards laden')}
            </button>
          </div>
          {boards.length > 0 && (
            <select value={boardId} onChange={e => loadLists(e.target.value)} className={inputCls}>
              <option value="">{t('Board wählen …')}</option>
              {boards.map(b => <option key={b.id} value={b.id} className="bg-anth-900">{b.name}</option>)}
            </select>
          )}
          {lists.length > 0 && (
            <select value={listId} onChange={e => saveTrello(e.target.value)} className={inputCls}>
              <option value="">{t('Liste wählen …')}</option>
              {lists.map(l => <option key={l.id} value={l.id} className="bg-anth-900">{l.name}</option>)}
            </select>
          )}
        </div>
        {trStatus && <p className="mt-2 text-[11px] text-anth-300">{trStatus}</p>}
        {trelloListId && <p className="mt-1 text-[10px] text-mint-400">✓ {t('Aktiv — in den Lebenszielen erscheint „→ Trello".')}</p>}
      </Card>
    </div>
  );
}

// ── Seite ──────────────────────────────────────────────────────────────────────
export default function SelfPage() {
  const t = useT();
  const [tab, setTab] = useState<TabKey>('profil');
  const {
    profile, visionImages, brainstormText, stickyNotes, setProfileMd, profileMd, savedAt,
    summaryMd, summarizedAt, setSummary, attachProfileToPrompts, setAttachProfile,
  } = useSelfStore();
  const goals = useNeuralNotebookStore(s => s.goals);
  const currentUser = useAuthStore(s => s.user?.name ?? null);
  const [savedFlash, setSavedFlash] = useState(false);

  const buildMd = () => buildProfileMarkdown(
    profile,
    goals.filter(g => g.folder === 'lebensziele' && goalVisibleTo(g, currentUser)),
    visionImages.map(v => v.caption),
    brainstormText,
    stickyNotes.map(n => n.text),
  );

  const save = () => {
    setProfileMd(buildMd());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Kopfzeile — Speichern immer sichtbar */}
      <div className="shrink-0 flex items-center gap-3 mb-3 flex-wrap">
        <h1 className="text-lg font-bold text-forest-100 flex items-center gap-2">
          <User size={16} className="text-mint-400" /> Self
        </h1>
        <div className="flex items-center gap-1.5">
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                tab === tb.key
                  ? 'bg-forest-700/40 border-forest-600/50 text-forest-100'
                  : 'bg-anth-800/40 border-anth-700/40 text-anth-400 hover:text-anth-200')}>
              <tb.icon size={12} /> {t(tb.label)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {savedAt && !savedFlash && (
            <span className="text-[10px] text-anth-500">{t('Gespeichert')}: {new Date(savedAt).toLocaleString('de-DE')}</span>
          )}
          {savedFlash && <span className="text-[10px] text-mint-400">✓ {t('Gespeichert')}</span>}
          <button onClick={save}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mint-500/20 border border-mint-500/50 text-mint-200 text-xs font-semibold hover:bg-mint-500/30 transition-colors shadow-[0_0_12px_rgba(17,202,160,0.15)]">
            <Save size={13} /> {t('Speichern (MD)')}
          </button>
          <button onClick={() => downloadMd(profileMd || buildMd(), `self-profil-${(profile.name || 'ich').toLowerCase().replace(/\s+/g, '-')}.md`)}
            className="p-2 rounded-xl border border-anth-700/40 text-anth-400 hover:text-mint-300 hover:border-mint-600/40 transition-colors"
            title={t('Als MD-Datei herunterladen')}>
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* KI-Auswertung */}
      <div className="shrink-0 mb-3">
        <AgentSummaryBar
          buildMd={buildMd}
          instruction={'Fasse das folgende Nutzerprofil als kompakte Markdown-Vorinfo für KI-Agenten zusammen: wer die Person ist, Hintergrund, Stärken, Werte, Ziele, Vision. Maximal ~250 Wörter, Markdown mit kurzen Abschnitten, auf Deutsch. Erfinde nichts — nutze ausschließlich die angegebenen Informationen; fehlende Bereiche einfach weglassen. Keine Einleitung, keine Rückfragen — nur die Zusammenfassung.'}
          summaryMd={summaryMd}
          summarizedAt={summarizedAt}
          onSummary={setSummary}
          attach={attachProfileToPrompts}
          setAttach={setAttachProfile}
          attachLabel="Jedem Agenten-Prompt als Vorinfo beifügen"
          downloadName={`self-zusammenfassung-${(profile.name || 'profil').toLowerCase().replace(/\s+/g, '-')}.md`}
        />
      </div>

      {/* Inhalt */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
        {tab === 'profil'        && <ProfileTab />}
        {tab === 'ziele'         && <GoalsTab />}
        {tab === 'vision'        && <VisionTab />}
        {tab === 'brainstorm'    && <BrainstormTab />}
        {tab === 'integrationen' && <IntegrationsTab />}
      </div>
    </div>
  );
}
