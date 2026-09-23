'use client';
import { useEffect, useState } from 'react';
import { ChevronDown, Download, Loader2, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAgentStore } from '@/lib/store';

/**
 * Wiederverwendbare KI-Auswertungs-Leiste (Self- & Company-Seite):
 * Agent wählen → Profil-MD zusammenfassen lassen → Ergebnis speichern/anzeigen/
 * herunterladen. Optionaler Haken hängt die MD jedem Agenten-Prompt an.
 */
export function AgentSummaryBar({
  buildMd, instruction, summaryMd, summarizedAt, onSummary,
  attach, setAttach, attachLabel, downloadName,
}: {
  buildMd: () => string;
  /** [ANWEISUNG]-Text für den Agenten */
  instruction: string;
  summaryMd: string;
  summarizedAt: string | null;
  onSummary: (md: string, agentId: string) => void;
  attach: boolean;
  setAttach: (v: boolean) => void;
  attachLabel: string;
  downloadName: string;
}) {
  const t = useT();
  const agents = useAgentStore(s => s.agents);
  const setAgents = useAgentStore(s => s.setAgents);
  const [agentId, setAgentId] = useState('claude-free');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (agents.length) return;
    fetch('/api/agents').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : d.agents;
      if (Array.isArray(list) && list.length) setAgents(list);
    }).catch(() => {});
  }, [agents.length, setAgents]);

  const summarize = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `[ANWEISUNG]\n${instruction}\n[/ANWEISUNG]\n\n${buildMd()}` }] }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const d = JSON.parse(payload);
            if (d.error) throw new Error(d.error);
            if (d.text ?? d.delta) full += d.text ?? d.delta;
          } catch { /* skip */ }
        }
      }
      if (!full.trim()) throw new Error('leer');
      onSummary(full.trim(), agentId);
      setShowSummary(true);
    } catch {
      setError(t('Agent nicht erreichbar — bitte API-Key im Digital Staff prüfen.'));
    } finally { setBusy(false); }
  };

  const download = () => {
    const blob = new Blob([summaryMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = downloadName; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-violet-700/40 bg-violet-950/20 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles size={13} className="text-violet-300 shrink-0" />
        <select value={agentId} onChange={e => setAgentId(e.target.value)}
          className="px-2 py-1.5 text-[11px] bg-anth-900/60 border border-anth-700/40 rounded-lg text-forest-100 focus:outline-none">
          {(agents.length ? agents : [{ id: 'claude-free', displayName: 'Claude Free', icon: '🔓' } as { id: string; displayName: string; icon: string }]).map(a => (
            <option key={a.id} value={a.id} className="bg-anth-900">{a.icon} {a.displayName}</option>
          ))}
        </select>
        <button onClick={summarize} disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-800/40 border border-violet-600/50 text-violet-100 text-[11px] hover:bg-violet-800/60 transition-colors disabled:opacity-50">
          {busy ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          {t('Profil auswerten & speichern')}
        </button>
        {summaryMd && (
          <>
            <button onClick={() => setShowSummary(v => !v)}
              className="flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-100 transition-colors">
              <ChevronDown size={11} className={cn('transition-transform', showSummary && 'rotate-180')} />
              {t('Zusammenfassung')} {summarizedAt && `(${new Date(summarizedAt).toLocaleDateString('de-DE')})`}
            </button>
            <button onClick={download} className="text-violet-300 hover:text-violet-100 transition-colors" title={t('Als MD-Datei herunterladen')}>
              <Download size={12} />
            </button>
          </>
        )}
        <label className="ml-auto flex items-center gap-2 cursor-pointer select-none" onClick={() => setAttach(!attach)}>
          <span className="text-[11px] text-anth-300">{t(attachLabel)}</span>
          <span className={cn('w-8 rounded-full border relative transition-colors inline-block',
            attach ? 'bg-mint-500/40 border-mint-500/60' : 'bg-anth-800 border-anth-600/60')}
            style={{ height: 18 }}>
            <span className={cn('absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all', attach ? 'left-4' : 'left-0.5')} />
          </span>
        </label>
      </div>
      {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}
      {showSummary && summaryMd && (
        <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap text-[11px] text-anth-200 bg-anth-950/50 border border-anth-700/40 rounded-xl p-3 font-sans">
          {summaryMd}
        </pre>
      )}
    </div>
  );
}
