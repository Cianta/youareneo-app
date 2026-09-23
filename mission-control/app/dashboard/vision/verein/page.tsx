'use client';
import { useRef, useState } from 'react';
import {
  Building2, Save, Download, Palette, Target, Users, Landmark,
  Sparkles, Pencil, Check, Plus, Trash2, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import {
  useCompanyStore, useNeuralNotebookStore, useAuthStore,
  goalVisibleTo, type CompanyProfile,
} from '@/lib/store';
import { AgentSummaryBar } from '@/components/shared/AgentSummaryBar';
import { BrandColorsEditor } from '@/components/shared/BrandColors';

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY — Firmen-Dashboard (ersetzt die IdeaBuddy-Einbettung).
// Karten für die komplette Firmenstruktur: Firmendaten, Brand (Logo + Farben),
// Mission/Vision, Geschichte, Angebot, Werte & Kultur, Struktur & Rollen,
// Company-Ziele (live verknüpft mit dem Daily Notebook).
// Speichern-Button immer sichtbar → Markdown; Agent-Auswertung wie bei Self.
// ─────────────────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File, maxDim = 600): Promise<string> {
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
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function buildCompanyMarkdown(p: CompanyProfile, goals: { text: string; completed: boolean }[]): string {
  const L: string[] = [];
  L.push(`# Firmenprofil${p.name ? ` — ${p.name}` : ''}`);
  L.push(`_Stand: ${new Date().toLocaleString('de-DE')}_`, '');
  L.push('## Firmendaten');
  ([['Name', p.name], ['Rechtsform', p.legalForm], ['Gegründet', p.founded],
    ['Ort', p.location], ['Branche', p.industry], ['Teamgröße', p.teamSize],
    ['Website', p.website], ['E-Mail', p.email]] as [string, string][])
    .filter(([, v]) => v.trim()).forEach(([k, v]) => L.push(`- **${k}:** ${v.trim()}`));
  if (p.brandColors.length) L.push(`- **Brandfarben:** ${p.brandColors.join(', ')}`);
  if (p.logoDataUrl) L.push('- **Logo:** hinterlegt');
  if (p.mission.trim()) { L.push('', '## Mission', p.mission.trim()); }
  if (p.vision.trim())  { L.push('', '## Vision', p.vision.trim()); }
  if (p.story.trim())   { L.push('', '## Firmengeschichte', p.story.trim()); }
  if (p.offering.trim())       { L.push('', '## Angebot & Produkte', p.offering.trim()); }
  if (p.targetAudience.trim()) { L.push('', '## Zielgruppe', p.targetAudience.trim()); }
  if (p.usp.trim())            { L.push('', '## USP — was uns unterscheidet', p.usp.trim()); }
  if (p.values.trim())  { L.push('', '## Werte', p.values.trim()); }
  if (p.culture.trim()) { L.push('', '## Kultur', p.culture.trim()); }
  if (p.structure.trim()) { L.push('', '## Struktur & Rollen', p.structure.trim()); }
  if (goals.length) {
    L.push('', '## Company-Ziele');
    goals.forEach(g => L.push(`- [${g.completed ? 'x' : ' '}] ${g.text}`));
  }
  return L.join('\n') + '\n';
}

function downloadMd(md: string, filename: string) {
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Bausteine (wie Self) ───────────────────────────────────────────────────────
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

// ── Company-Ziele (verknüpft mit Daily Notebook „COMPANY-ZIELE") ───────────────
function CompanyGoalsCard() {
  const t = useT();
  const { goals, addGoal, updateGoal, deleteGoal } = useNeuralNotebookStore();
  const currentUser = useAuthStore(s => s.user?.name ?? null);
  const [newGoal, setNewGoal] = useState('');
  const companyGoals = goals.filter(g => g.folder === 'vereinsziele' && goalVisibleTo(g, currentUser));

  return (
    <Card title="Company-Ziele" icon={Target} accent="#fbbf24">
      <p className="text-[10px] text-anth-500 mb-2">{t('Live verknüpft mit den Company-Zielen im Daily Notebook.')}</p>
      <div className="flex gap-2 mb-3">
        <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { addGoal(newGoal.trim(), 'vereinsziele'); setNewGoal(''); } }}
          placeholder={t('Neues Company-Ziel …')}
          className="flex-1 px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-forest-600/60" />
        <button onClick={() => { if (newGoal.trim()) { addGoal(newGoal.trim(), 'vereinsziele'); setNewGoal(''); } }}
          className="px-3 py-2 rounded-xl bg-forest-700/40 border border-forest-600/50 text-forest-100 text-xs hover:bg-forest-700/60 transition-colors flex items-center gap-1">
          <Plus size={12} /> {t('Hinzufügen')}
        </button>
      </div>
      <div className="space-y-1.5">
        {companyGoals.map(g => (
          <div key={g.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-anth-900/40 border border-anth-700/30">
            <button onClick={() => updateGoal(g.id, { completed: !g.completed })}
              className={cn('w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-colors',
                g.completed ? 'bg-mint-500/30 border-mint-500/60 text-mint-300' : 'border-anth-600/60 text-transparent hover:border-mint-500/50')}>
              <Check size={10} />
            </button>
            <input value={g.text} onChange={e => updateGoal(g.id, { text: e.target.value })}
              className={cn('flex-1 bg-transparent text-xs focus:outline-none', g.completed ? 'line-through text-anth-500' : 'text-forest-100')} />
            <button onClick={() => deleteGoal(g.id)} className="text-anth-600 hover:text-red-400 transition-colors" title={t('Löschen')}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {companyGoals.length === 0 && <p className="text-xs text-anth-500">{t('Noch keine Company-Ziele.')}</p>}
      </div>
    </Card>
  );
}

// ── Seite ──────────────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const t = useT();
  const {
    profile, setProfile, profileMd, savedAt, setProfileMd,
    summaryMd, summarizedAt, setSummary, attachCompanyToPrompts, setAttachCompany,
  } = useCompanyStore();
  const goals = useNeuralNotebookStore(s => s.goals);
  const currentUser = useAuthStore(s => s.user?.name ?? null);
  const logoInput = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const buildMd = () => buildCompanyMarkdown(
    profile,
    goals.filter(g => g.folder === 'vereinsziele' && goalVisibleTo(g, currentUser)),
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
          <Building2 size={16} className="text-mint-400" /> Company
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {savedAt && !savedFlash && (
            <span className="text-[10px] text-anth-500">{t('Gespeichert')}: {new Date(savedAt).toLocaleString('de-DE')}</span>
          )}
          {savedFlash && <span className="text-[10px] text-mint-400">✓ {t('Gespeichert')}</span>}
          <button onClick={save}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mint-500/20 border border-mint-500/50 text-mint-200 text-xs font-semibold hover:bg-mint-500/30 transition-colors shadow-[0_0_12px_rgba(17,202,160,0.15)]">
            <Save size={13} /> {t('Speichern (MD)')}
          </button>
          <button onClick={() => downloadMd(profileMd || buildMd(), `firmenprofil-${(profile.name || 'company').toLowerCase().replace(/\s+/g, '-')}.md`)}
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
          instruction={'Fasse das folgende Firmenprofil als kompakte Markdown-Vorinfo für KI-Agenten zusammen: was die Firma ist und tut, Angebot, Zielgruppe, Werte, Struktur, Ziele, Brand. Maximal ~250 Wörter, Markdown mit kurzen Abschnitten, auf Deutsch. Erfinde nichts — nutze ausschließlich die angegebenen Informationen; fehlende Bereiche einfach weglassen. Keine Einleitung, keine Rückfragen — nur die Zusammenfassung.'}
          summaryMd={summaryMd}
          summarizedAt={summarizedAt}
          onSummary={setSummary}
          attach={attachCompanyToPrompts}
          setAttach={setAttachCompany}
          attachLabel="Jedem Agenten-Prompt als Vorinfo beifügen"
          downloadName={`firmen-zusammenfassung-${(profile.name || 'company').toLowerCase().replace(/\s+/g, '-')}.md`}
        />
      </div>

      {/* Karten */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Firmendaten" icon={Landmark} accent="#11CAA0">
            <div className="flex items-start gap-4 mb-4">
              <button onClick={() => logoInput.current?.click()}
                className="w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-anth-600/60 hover:border-mint-500/60 transition-colors overflow-hidden flex items-center justify-center bg-anth-900/60"
                title={t('Logo hochladen')}>
                {profile.logoDataUrl
                  ? <img src={profile.logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  : <Building2 size={26} className="text-anth-500" />}
              </button>
              <input ref={logoInput} type="file" accept="image/*" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) setProfile({ logoDataUrl: await readFileAsDataUrl(f) }); e.target.value = ''; }} />
              <div className="flex-1 grid gap-2">
                <Field label="Name" value={profile.name} onChange={v => setProfile({ name: v })} placeholder="Firmenname" />
                <Field label="Rechtsform" value={profile.legalForm} onChange={v => setProfile({ legalForm: v })} placeholder="z. B. Verein, GmbH, e.U." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Gegründet" value={profile.founded} onChange={v => setProfile({ founded: v })} />
              <Field label="Ort" value={profile.location} onChange={v => setProfile({ location: v })} />
              <Field label="Branche" value={profile.industry} onChange={v => setProfile({ industry: v })} />
              <Field label="Teamgröße" value={profile.teamSize} onChange={v => setProfile({ teamSize: v })} />
              <Field label="Website" value={profile.website} onChange={v => setProfile({ website: v })} />
              <Field label="E-Mail" value={profile.email} onChange={v => setProfile({ email: v })} />
            </div>
          </Card>

          <Card title="Brand" icon={Palette} accent="#f0abfc">
            <p className="text-[10px] text-anth-500 mb-2">{t('Logo und Brandfarben — werden mitgespeichert und stehen den Agenten als Vorinfo zur Verfügung.')}</p>
            <BrandColorsEditor colors={profile.brandColors} onChange={c => setProfile({ brandColors: c })} />
          </Card>

          <Card title="Mission & Vision" icon={Sparkles} accent="#7dd3fc">
            <div className="grid gap-2">
              <Field label="Mission" value={profile.mission} onChange={v => setProfile({ mission: v })} area placeholder="Warum gibt es die Firma — der Beitrag?" />
              <Field label="Vision" value={profile.vision} onChange={v => setProfile({ vision: v })} area placeholder="Wohin geht die Reise — das große Bild?" />
            </div>
          </Card>

          <Card title="Firmengeschichte" icon={Pencil} accent="#fbbf24">
            <textarea value={profile.story} onChange={e => setProfile({ story: e.target.value })}
              placeholder={t('Gründung, Meilensteine, Wendepunkte …')}
              className="w-full h-32 px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-amber-500/40 resize-y" />
          </Card>

          <Card title="Angebot & Zielgruppe" icon={Globe} accent="#11CAA0">
            <div className="grid gap-2">
              <Field label="Angebot & Produkte" value={profile.offering} onChange={v => setProfile({ offering: v })} area />
              <Field label="Zielgruppe" value={profile.targetAudience} onChange={v => setProfile({ targetAudience: v })} area />
              <Field label="USP — was uns unterscheidet" value={profile.usp} onChange={v => setProfile({ usp: v })} area />
            </div>
          </Card>

          <Card title="Werte & Kultur" icon={Users} accent="#f87171">
            <div className="grid gap-2">
              <Field label="Werte" value={profile.values} onChange={v => setProfile({ values: v })} area />
              <Field label="Kultur" value={profile.culture} onChange={v => setProfile({ culture: v })} area />
            </div>
          </Card>

          <Card title="Struktur & Rollen" icon={Building2} accent="#9b7aff">
            <textarea value={profile.structure} onChange={e => setProfile({ structure: e.target.value })}
              placeholder={t('Teams, Rollen, Verantwortlichkeiten, Organigramm als Text …')}
              className="w-full h-32 px-3 py-2 text-xs bg-anth-900/50 border border-anth-700/40 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-violet-500/40 resize-y" />
          </Card>

          <CompanyGoalsCard />
        </div>
      </div>
    </div>
  );
}
