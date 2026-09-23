'use client';
import { useState } from 'react';
import { Mail, Plus, Trash2, Zap, Check, X } from 'lucide-react';
import { IframeView } from '@/components/iframe/IframeView';
import { GmailInbox } from '@/components/gmail/GmailInbox';
import { cn } from '@/lib/utils';

// Static references required — dynamic process.env[key] won't inline NEXT_PUBLIC_ vars
const GMAIL_URL = process.env.NEXT_PUBLIC_GMAIL_URL ?? 'https://mail.google.com';
const KMAIL_URL = process.env.NEXT_PUBLIC_KMAIL_URL ?? 'https://webmail.youareneo.com';

type EmailMode = 'native' | 'gmail' | 'kmail' | string;

interface ExtraAccount {
  id: string;
  name: string;
  url: string;
  type: 'imap' | 'pop3' | 'webmail';
}

const LS_KEY = 'trinity-extra-email-accounts';

function loadExtraAccounts(): ExtraAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch { return []; }
}

function saveExtraAccounts(accounts: ExtraAccount[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(accounts));
}

export default function EmailPage() {
  const [mode, setMode] = useState<EmailMode>('native');
  const [extras, setExtras] = useState<ExtraAccount[]>(() => loadExtraAccounts());
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formType, setFormType] = useState<'imap' | 'pop3' | 'webmail'>('webmail');

  const addAccount = () => {
    if (!formName.trim() || !formUrl.trim()) return;
    const newAcc: ExtraAccount = {
      id: `extra-${Date.now()}`,
      name: formName.trim(),
      url: formUrl.trim(),
      type: formType,
    };
    const updated = [...extras, newAcc];
    setExtras(updated);
    saveExtraAccounts(updated);
    setFormName('');
    setFormUrl('');
    setShowAddForm(false);
  };

  const removeAccount = (id: string) => {
    const updated = extras.filter(a => a.id !== id);
    setExtras(updated);
    saveExtraAccounts(updated);
    if (mode === id) setMode('native');
  };

  return (
    <div className="h-full flex flex-col fade-in gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs text-anth-500 uppercase tracking-widest">Universal Inbox</p>
          <h1 className="text-lg font-bold text-forest-100">Email Core</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Native inbox toggle */}
          <button onClick={() => setMode('native')}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
              mode === 'native' ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                : 'bg-anth-800/40 border-anth-700/40 text-anth-400 hover:text-anth-200'
            )}>
            <Zap size={12} /> Native
          </button>

          {/* Gmail iframe */}
          <button onClick={() => setMode('gmail')}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
              mode === 'gmail' ? 'bg-sky-900/30 border-sky-700/50 text-sky-300'
                : 'bg-anth-800/40 border-anth-700/40 text-anth-400 hover:text-anth-200'
            )}>
            <Mail size={12} /> Gmail
          </button>

          {/* KMail iframe */}
          <button onClick={() => setMode('kmail')}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
              mode === 'kmail' ? 'bg-violet-900/30 border-violet-700/50 text-violet-300'
                : 'bg-anth-800/40 border-anth-700/40 text-anth-400 hover:text-anth-200'
            )}>
            <Mail size={12} /> KMail
          </button>

          {/* Extra accounts */}
          {extras.map(acc => (
            <div key={acc.id} className="flex items-center gap-1">
              <button onClick={() => setMode(acc.id)}
                className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                  mode === acc.id ? 'bg-amber-900/30 border-amber-700/50 text-amber-300'
                    : 'bg-anth-800/40 border-anth-700/40 text-anth-400 hover:text-anth-200'
                )}>
                <Mail size={12} /> {acc.name}
              </button>
              <button onClick={() => removeAccount(acc.id)}
                className="p-1.5 rounded-lg text-anth-500 hover:text-red-400 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {/* Add account button */}
          <button onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-dashed border-anth-700/40 text-xs text-anth-500 hover:text-forest-300 hover:border-forest-700/50 transition-all">
            <Plus size={12} /> Account
          </button>
        </div>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl glass border border-border">
          <input value={formName} onChange={e => setFormName(e.target.value)}
            placeholder="Account name (e.g. Work IMAP)" className="mc-input py-1.5 text-xs flex-1 max-w-[200px]" />
          <input value={formUrl} onChange={e => setFormUrl(e.target.value)}
            placeholder="Webmail URL (e.g. https://mail.example.com)" className="mc-input py-1.5 text-xs flex-[2]" />
          <select value={formType} onChange={e => setFormType(e.target.value as 'imap' | 'pop3' | 'webmail')}
            className="mc-input py-1.5 text-xs w-28">
            <option value="webmail">Webmail</option>
            <option value="imap">IMAP</option>
            <option value="pop3">POP3</option>
          </select>
          <button onClick={addAccount} className="p-2 rounded-xl bg-forest-700/40 border border-forest-600/40 text-forest-300 hover:bg-forest-600/40 transition-colors">
            <Check size={14} />
          </button>
          <button onClick={() => { setShowAddForm(false); setFormName(''); setFormUrl(''); }}
            className="p-2 rounded-xl text-anth-500 hover:text-anth-300 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {mode === 'native' && <GmailInbox />}
        {mode === 'gmail' && (
          <IframeView key="gmail" src={GMAIL_URL} title="Gmail" configKey="NEXT_PUBLIC_GMAIL_URL"
            description="Gmail — Google Mail Inbox" />
        )}
        {mode === 'kmail' && (
          <IframeView key="kmail" src={KMAIL_URL} title="KMail" configKey="NEXT_PUBLIC_KMAIL_URL"
            description="KMail — Infomaniak Webmail" />
        )}
        {/* Extra accounts render as IframeViews */}
        {extras.map(acc => mode === acc.id && (
          <IframeView key={acc.id} src={acc.url} title={acc.name}
            configKey={`EXTRA_EMAIL_${acc.id}`}
            description={`${acc.name} — ${acc.type.toUpperCase()} Account`} />
        ))}
      </div>
    </div>
  );
}
