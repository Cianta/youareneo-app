'use client';
import { useState } from 'react';
import {
  Building2, Plus, Trash2, Save, FolderOpen, ChevronDown, ChevronUp,
  UserCog, Sparkles, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAiCompanyStore, useAgentStore } from '@/lib/store';

// ─────────────────────────────────────────────────────────────────────────────
// AI-Firma-Builder — großer Bereich oben auf der Digital-Staff-Seite.
// Rollen anlegen/benennen/beschreiben, Agenten zuweisen, Templates speichern/laden.
// Zusätzlich die Persönliche Assistenz (PA) als eigene Karte konfigurieren.
// Der Chat-Assistent rechts unten kann Rollen ebenfalls per Auftrag erstellen.
// ─────────────────────────────────────────────────────────────────────────────

const MINT = '#11CAA0';

export function AiCompanyBuilder() {
  const t = useT();
  const { agents } = useAgentStore();
  const {
    companyName, setCompanyName, roles, addRole, updateRole, removeRole,
    pa, setPa, templates, saveTemplate, loadTemplate, deleteTemplate,
  } = useAiCompanyStore();
  const [open, setOpen] = useState(true);
  const [tplName, setTplName] = useState('');
  const [loadOpen, setLoadOpen] = useState(false);

  const agentOpts = (
    <>
      <option value="">{t('— Agent zuweisen —')}</option>
      {agents.map(a => <option key={a.id} value={a.id} className="bg-anth-900">{a.icon} {a.displayName}</option>)}
    </>
  );
  const inputCls = 'w-full px-2.5 py-1.5 text-xs bg-anth-900/60 border border-anth-700/40 rounded-lg text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-mint-600/50';

  return (
    <div className="shrink-0 border-b" style={{ borderColor: 'rgba(17,202,160,0.15)', background: 'rgba(7,11,19,0.7)' }}>
      {/* Kopf */}
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 px-4 py-2.5 group">
        <Building2 size={14} style={{ color: MINT }} />
        <span className="text-[11px] uppercase tracking-[0.15em] font-bold" style={{ color: MINT }}>{t('AI-Firma')}</span>
        {companyName && <span className="text-xs text-forest-100 font-semibold">· {companyName}</span>}
        <span className="text-[10px] text-anth-500">{roles.length} {t('Rollen')}</span>
        <span className="ml-auto text-anth-500 group-hover:text-anth-300">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Firmenname + Template-Leiste */}
          <div className="flex items-center gap-2 flex-wrap">
            <input value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder={t('Name der AI-Firma / des Projekts …')}
              className={cn(inputCls, 'flex-1 min-w-[200px]')} />
            <div className="flex items-center gap-1.5">
              <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder={t('Template-Name')}
                className="w-32 px-2.5 py-1.5 text-xs bg-anth-900/60 border border-anth-700/40 rounded-lg text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-mint-600/50" />
              <button onClick={() => { if (roles.length) { saveTemplate(tplName || companyName); setTplName(''); } }}
                disabled={!roles.length}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-40"
                style={{ background: `${MINT}18`, border: `1px solid ${MINT}40`, color: MINT }}>
                <Save size={11} /> {t('Speichern')}
              </button>
              <div className="relative">
                <button onClick={() => setLoadOpen(v => !v)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-anth-300 border border-anth-700/50 hover:text-mint-300 hover:border-mint-600/40 transition-colors">
                  <FolderOpen size={11} /> {t('Laden')} ({templates.length})
                </button>
                {loadOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 glass-dark border border-border rounded-xl shadow-panel z-30 py-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                    {templates.length === 0 && <p className="px-3 py-2 text-[11px] text-anth-500">{t('Noch keine Templates gespeichert.')}</p>}
                    {templates.map(tpl => (
                      <div key={tpl.id} className="flex items-center gap-1 px-2 py-1.5 hover:bg-forest-900/40 transition-colors">
                        <button onClick={() => { loadTemplate(tpl.id); setLoadOpen(false); }}
                          className="flex-1 flex items-center gap-2 text-left text-xs text-anth-200">
                          <Users size={11} className="text-mint-400 shrink-0" />
                          <span className="flex-1 truncate">{tpl.name}</span>
                          <span className="text-[9px] text-anth-500">{tpl.roles.length}</span>
                        </button>
                        <button onClick={() => deleteTemplate(tpl.id)} className="text-anth-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            {/* Rollen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-anth-400 flex items-center gap-1"><Sparkles size={10} /> {t('Rollen')}</span>
                <button onClick={() => addRole()} className="flex items-center gap-1 text-[11px] text-mint-400 hover:text-mint-300 transition-colors">
                  <Plus size={11} /> {t('Rolle hinzufügen')}
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map(r => (
                  <div key={r.id} className="rounded-xl border border-anth-700/40 bg-anth-900/40 p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input value={r.name} onChange={e => updateRole(r.id, { name: e.target.value })}
                        placeholder={t('Rollenname')}
                        className="flex-1 bg-transparent text-xs font-semibold text-forest-100 focus:outline-none" />
                      <button onClick={() => removeRole(r.id)} className="text-anth-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                    </div>
                    <textarea value={r.description} onChange={e => updateRole(r.id, { description: e.target.value })}
                      placeholder={t('Aufgabe der Rolle …')} rows={2}
                      className="w-full px-2 py-1 text-[11px] bg-anth-900/60 border border-anth-700/40 rounded-lg text-anth-200 placeholder:text-anth-600 focus:outline-none resize-y" />
                    <textarea value={r.background} onChange={e => updateRole(r.id, { background: e.target.value })}
                      placeholder={t('Hintergrund / Persona (optional) …')} rows={2}
                      className="w-full px-2 py-1 text-[11px] bg-anth-900/60 border border-anth-700/40 rounded-lg text-anth-200 placeholder:text-anth-600 focus:outline-none resize-y" />
                    <select value={r.assignedAgentId} onChange={e => updateRole(r.id, { assignedAgentId: e.target.value })}
                      className={cn(inputCls, r.assignedAgentId ? 'text-mint-300' : 'text-anth-500')}>
                      {agentOpts}
                    </select>
                  </div>
                ))}
                {roles.length === 0 && (
                  <p className="text-[11px] text-anth-500 col-span-full py-3">
                    {t('Noch keine Rollen. Füge welche hinzu — oder bitte den Assistenten rechts unten: „Erstelle eine AI-Firma für Projekt X".')}
                  </p>
                )}
              </div>
            </div>

            {/* PA-Karte */}
            <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'rgba(17,202,160,0.3)', background: 'rgba(17,202,160,0.05)' }}>
              <div className="flex items-center gap-2">
                <UserCog size={13} style={{ color: MINT }} />
                <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: MINT }}>{t('Persönliche Assistenz (PA)')}</span>
              </div>
              <p className="text-[10px] text-anth-500">{t('Existiert immer. Über den Chat rechts unten als „PA" auswählbar.')}</p>
              <input value={pa.name} onChange={e => setPa({ name: e.target.value })} placeholder={t('Name der PA')} className={inputCls} />
              <textarea value={pa.personality} onChange={e => setPa({ personality: e.target.value })}
                placeholder={t('Wie ist sie / wie reagiert sie?')} rows={2}
                className="w-full px-2 py-1 text-[11px] bg-anth-900/60 border border-anth-700/40 rounded-lg text-anth-200 placeholder:text-anth-600 focus:outline-none resize-y" />
              <textarea value={pa.description} onChange={e => setPa({ description: e.target.value })}
                placeholder={t('Aufgaben / Kompetenzen')} rows={2}
                className="w-full px-2 py-1 text-[11px] bg-anth-900/60 border border-anth-700/40 rounded-lg text-anth-200 placeholder:text-anth-600 focus:outline-none resize-y" />
              <select value={pa.agentId} onChange={e => setPa({ agentId: e.target.value })} className={cn(inputCls, 'text-mint-300')}>
                {agents.map(a => <option key={a.id} value={a.id} className="bg-anth-900">{a.icon} {a.displayName}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
