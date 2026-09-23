'use client';
import { useState } from 'react';
import { Building2, KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { supabaseConfigured } from '@/lib/supabase';
import { registerCompany, registerEmployee, signInWithEmail } from '@/lib/supabaseAuth';

type Mode = 'login' | 'register-admin' | 'register-employee';

/** Login & Registrierung über Supabase (Multi-Tenant: Firmen-Admin & Mitarbeiter). */
export function SupabaseAuth({ onSuccess }: { onSuccess?: () => void }) {
  const t = useT();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [firmaName, setFirmaName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!supabaseConfigured()) {
    return <p className="text-[10px] text-anth-500">{t('Supabase ist nicht konfiguriert — .env.local prüfen.')}</p>;
  }

  const submit = async () => {
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), pw);
        onSuccess?.();
      } else if (mode === 'register-admin') {
        const res = await registerCompany({ email: email.trim(), password: pw, firmaName: firmaName.trim(), displayName: displayName.trim() });
        if (res.needsEmailConfirm) setInfo(t('Bestätigungs-E-Mail gesendet — nach dem Bestätigen hier einloggen.'));
        else onSuccess?.();
      } else {
        const res = await registerEmployee({ email: email.trim(), password: pw, inviteCode, displayName: displayName.trim() });
        if (res.needsEmailConfirm) setInfo(t('Bestätigungs-E-Mail gesendet — nach dem Bestätigen hier einloggen.'));
        else onSuccess?.();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors';

  return (
    <div className="space-y-2.5">
      {/* Mode switcher */}
      <div className="flex gap-1">
        {([
          ['login', t('Login'), <LogIn key="i" size={10} />],
          ['register-admin', t('Firma anlegen'), <Building2 key="i" size={10} />],
          ['register-employee', t('Beitreten'), <UserPlus key="i" size={10} />],
        ] as const).map(([m, label, icon]) => (
          <button key={m} onClick={() => { setMode(m); setError(''); setInfo(''); }}
            className={cn('flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all',
              mode === m
                ? 'bg-forest-800/50 border-forest-600/50 text-forest-200'
                : 'bg-anth-800/40 border-anth-700/40 text-anth-500 hover:text-anth-300'
            )}>
            {icon} {label}
          </button>
        ))}
      </div>

      {mode === 'register-admin' && (
        <input value={firmaName} onChange={e => setFirmaName(e.target.value)} placeholder={t('Firmenname…')} className={input} />
      )}
      {mode === 'register-employee' && (
        <div className="relative">
          <KeyRound size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-anth-600" />
          <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder={t('Einladungscode…')} className={cn(input, 'pl-7')} />
        </div>
      )}
      {mode !== 'login' && (
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('Dein Name…')} className={input} />
      )}

      <div className="relative">
        <Mail size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-anth-600" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail" className={cn(input, 'pl-7')} />
      </div>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !busy && submit()}
        placeholder={t('Passwort')} className={input} />

      {error && <p className="text-[10px] text-red-400">{error}</p>}
      {info && <p className="text-[10px] text-mint-400">{info}</p>}

      <button onClick={submit} disabled={busy}
        className="w-full py-2 rounded-xl bg-forest-700/40 border border-forest-600/40 text-xs text-forest-200 font-medium hover:bg-forest-600/40 transition-colors disabled:opacity-50">
        {busy ? '…' : mode === 'login' ? t('Anmelden') : mode === 'register-admin' ? t('Firma registrieren') : t('Firma beitreten')}
      </button>

      <p className="text-[9px] text-anth-600 leading-snug">
        {mode === 'register-admin' && t('Du wirst Admin deiner Firma und erhältst einen Einladungscode für Mitarbeiter.')}
        {mode === 'register-employee' && t('Den Einladungscode bekommst du von deinem Firmen-Admin.')}
      </p>
    </div>
  );
}
