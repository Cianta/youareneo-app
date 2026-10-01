'use client';
import { useState } from 'react';
import { useAgentStore, useGlobalAudioStore, useTemporalStore } from '@/lib/store';
import { cn, AGENT_COLORS } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Save, Eye, EyeOff, ExternalLink, Monitor, Mouse, Globe, ShieldAlert, Check, ToggleLeft, ToggleRight, Volume2, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Hardware Permission Tri-State ─────────────────────────────────────────────
type HwState = 'on' | 'off' | 'ask';
const HW_CYCLE: HwState[] = ['off', 'ask', 'on'];
const HW_LABELS: Record<HwState, { label: string; color: string; bg: string }> = {
  on:  { label: 'ON',  color: 'text-mint-500',  bg: 'bg-mint-500/15 border-mint-500/40'  },
  ask: { label: 'ASK', color: 'text-gold',       bg: 'bg-gold/10 border-gold/30'          },
  off: { label: 'OFF', color: 'text-anth-500',   bg: 'bg-anth-800 border-anth-700'        },
};

function cycle(s: HwState): HwState { return HW_CYCLE[(HW_CYCLE.indexOf(s) + 1) % 3]; }

function AudioSettings() {
  const { workSoundUrl, breakSoundUrl, setWorkSound, setBreakSound, volume, setVolume } = useGlobalAudioStore();
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-4 flex items-center gap-1.5">
        <Volume2 size={12} /> Global Audio Player
      </h2>
      <div className="glass rounded-2xl border border-border p-5 space-y-4">
        <p className="text-xs text-anth-400">
          Set audio URLs for focus and break sessions. Audio persists across route changes.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">Arbeits-Sound (Focus Block)</label>
            <input value={workSoundUrl} onChange={e => setWorkSound(e.target.value)}
              placeholder="https://example.com/focus-music.mp3"
              className="mc-input text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">Pausen-Sound (Break Block)</label>
            <input value={breakSoundUrl} onChange={e => setBreakSound(e.target.value)}
              placeholder="https://example.com/break-ambient.mp3"
              className="mc-input text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs text-anth-400 mb-1.5 block">Volume: {Math.round(volume * 100)}%</label>
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-full accent-forest-500" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarSettings() {
  const { calendars, addCalendar, removeCalendar } = useTemporalStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'private' | 'association'>('private');

  const handleOAuth = (provider: string) => {
    const urls: Record<string, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/calendar&response_type=code&access_type=offline',
      apple:  'https://appleid.apple.com/auth/authorize',
      infomaniak: 'https://login.infomaniak.com/authorize',
    };
    window.open(urls[provider] ?? '#', '_blank', 'width=600,height=700');
  };

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-4 flex items-center gap-1.5">
        <CalendarDays size={12} /> Calendar Integrations
      </h2>
      <div className="glass rounded-2xl border border-border p-5 space-y-4">
        <p className="text-xs text-anth-400">
          Connect calendar accounts. The global <strong className="text-forest-300">Vereins-Kalender</strong> is active for everyone.
          Private calendars use OAuth breakout tabs for safe login.
        </p>
        {/* OAuth Connect Buttons */}
        <div className="flex gap-2">
          {[
            { id: 'google', label: 'Google Calendar', emoji: '🔴' },
            { id: 'apple', label: 'Apple Calendar', emoji: '🍎' },
            { id: 'infomaniak', label: 'Infomaniak', emoji: '🟢' },
          ].map(p => (
            <button key={p.id} onClick={() => handleOAuth(p.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-forest-700/40 bg-forest-900/20 text-xs text-forest-300 hover:bg-forest-800/30 hover:border-forest-600/50 transition-all">
              <span>{p.emoji}</span>
              Connect {p.label}
            </button>
          ))}
        </div>
        {/* Existing calendars */}
        <div className="space-y-1.5">
          {calendars.map(cal => (
            <div key={cal.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/60 border border-border/50">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
              <span className="text-xs text-forest-200 flex-1 truncate">{cal.name}</span>
              <span className="text-[9px] text-anth-600 uppercase">{cal.type}</span>
              {!['assoc-default', 'priv-default'].includes(cal.id) && (
                <button onClick={() => removeCalendar(cal.id)} className="text-anth-500 hover:text-red-400 transition-colors text-xs">Remove</button>
              )}
            </div>
          ))}
        </div>
        {/* Add manual calendar */}
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Calendar name…" className="mc-input py-1.5 text-xs flex-1" />
          <select value={type} onChange={e => setType(e.target.value as 'private' | 'association')} className="mc-input py-1.5 text-xs w-28">
            <option value="private">Privat</option>
            <option value="association">Verein</option>
          </select>
          <button onClick={() => { if (!name.trim()) return; addCalendar({ name: name.trim(), url: '', provider: 'local', type, color: type === 'private' ? '#11CAA0' : '#8b5cf6' }); setName(''); }}
            className="px-4 py-1.5 rounded-xl bg-forest-700/40 border border-forest-600/40 text-forest-300 text-xs hover:bg-forest-600/40 transition-colors">
            Add
          </button>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { agents } = useAgentStore();

  // Hardware permissions
  const [screenMirror, setScreenMirror] = useState<HwState>('off');
  const [browserNode,  setBrowserNode]  = useState<HwState>('off');
  const [mouseControl, setMouseControl] = useState<HwState>('off');

  const HwToggle = ({ label, icon: Icon, state, setState }: {
    label: string; icon: React.ElementType; state: HwState; setState: (s: HwState) => void;
  }) => {
    const s = HW_LABELS[state];
    return (
      <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl border border-border bg-surface flex items-center justify-center">
            <Icon size={14} className="text-anth-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-anth-200">{label}</p>
            <p className="text-[10px] text-anth-600">Click to cycle: OFF → ASK → ON</p>
          </div>
        </div>
        <button
          onClick={() => setState(cycle(state))}
          className={cn('px-3 py-1.5 rounded-xl border text-xs font-bold transition-all', s.bg, s.color)}
        >
          {s.label}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl space-y-8 fade-in">

      <section className="workspace-notice"><h1 className="text-xl mb-2">Einstellungen</h1><p>Die Verbindungen werden zentral verwaltet. In der App werden keine Zugangsschlüssel eingegeben oder gespeichert.</p></section>
      {/* ── Global Hardware Permissions ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-4">Global Hardware Permissions · All Claude Models</h2>
        <div className="glass rounded-2xl border border-border p-5">
          <p className="text-xs text-anth-400 mb-4">
            Experimentelle Anzeige: Diese Schalter ändern derzeit keine Browser- oder Systemberechtigungen.
            <span className="text-mint-500 font-medium"> ON</span> = always allow ·
            <span className="text-gold font-medium"> ASK</span> = prompt each time ·
            <span className="text-anth-500 font-medium"> OFF</span> = always deny.
          </p>
          <HwToggle label="Screen Mirror Access"   icon={Monitor}  state={screenMirror} setState={setScreenMirror} />
          <HwToggle label="Browser Node Access"    icon={Globe}    state={browserNode}  setState={setBrowserNode}  />
          <HwToggle label="Mouse / Virtual Input"  icon={Mouse}    state={mouseControl} setState={setMouseControl} />
        </div>
      </section>

      {/* ── Agent Configs ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-4">Agent Registry ({agents.length} agents)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent, i) => {
            const colors = AGENT_COLORS[agent.id] ?? AGENT_COLORS.system;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn('glass rounded-2xl p-4 border', colors.border)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-bold text-sm truncate', colors.text)}>{agent.displayName}</p>
                    <p className="text-[10px] text-anth-500 font-mono truncate">{agent.model}</p>
                  </div>
                  <Badge
                    variant={agent.status === 'online' ? 'success' : agent.status === 'error' ? 'danger' : agent.status === 'busy' ? 'gold' : 'default'}
                    dot
                  >{agent.status}</Badge>
                </div>
                <div className="space-y-1 text-xs">
                  {[
                    ['Provider', agent.provider],
                    ['Temp', String(agent.temperature)],
                    ['Tokens', agent.maxTokens.toLocaleString()],
                    ...(agent.baseUrl ? [['Base URL', agent.baseUrl.replace('https://','').replace('http://','')]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-anth-600">{k}</span>
                      <span className="text-anth-300 font-mono truncate max-w-[140px]">{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Audio Settings ── */}
      <AudioSettings />

      {/* ── Calendar Integration ── */}
      <CalendarSettings />

      {/* ── System Info ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-anth-500 mb-3">System Information</h2>
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {[
              { label: 'Version',   value: '6.0.0 — Sovereign Cosmic Kernel' },
              { label: 'Framework', value: 'Next.js 15 + Turbopack' },
              { label: 'Runtime',   value: 'Node.js 20 LTS' },
              { label: 'Agents',    value: `${agents.length} active` },
              { label: 'Academy',   value: 'YOU ARE NEO' },
              { label: 'Owner',     value: 'info@youareneo.com' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-anth-500 mb-0.5">{label}</p>
                <p className="text-forest-200 font-mono text-[11px]">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
