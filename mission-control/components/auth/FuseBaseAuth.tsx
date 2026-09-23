'use client';
import { FormEvent, useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

type Mode = 'password' | 'magic';

/**
 * Compact TopBar login via FuseBase Gate (server routes keep the service token).
 * Same identity as Freigeist portal.
 */
export function FuseBaseAuth({ onSuccess }: { onSuccess?: () => void }) {
  const t = useT();
  const setUser = useAuthStore(s => s.setUser);
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'password') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, redirectPath: '/dashboard' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Login failed (${res.status})`);
        }
        setUser({
          name: (data.email as string)?.split('@')[0] || 'Member',
          role: 'FuseBase',
          avatar: '🔮',
        });
        onSuccess?.();
        return;
      }

      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectPath: '/dashboard' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Magic link failed (${res.status})`);
      }
      setInfo(data.message || t('Magic Link gesendet — Postfach prüfen.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors';

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(
          [
            ['password', t('Passwort')],
            ['magic', 'Magic Link'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError('');
              setInfo('');
            }}
            className={`flex-1 py-1 rounded-lg border text-[10px] transition-all ${
              mode === m
                ? 'bg-forest-800/50 border-forest-600/50 text-forest-200'
                : 'bg-anth-800/40 border-anth-700/40 text-anth-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <div className="relative">
          <Mail size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-anth-600" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className={`${input} pl-7`}
          />
        </div>

        {mode === 'password' && (
          <div className="relative">
            <KeyRound size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-anth-600" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Passwort')}
              className={`${input} pl-7`}
            />
          </div>
        )}

        {error && <p className="text-[10px] text-red-400">{error}</p>}
        {info && <p className="text-[10px] text-mint-400">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2 rounded-xl bg-forest-700/40 border border-forest-600/40 text-xs text-forest-200 font-medium hover:bg-forest-600/40 transition-colors disabled:opacity-50"
        >
          {busy ? '…' : mode === 'password' ? t('Anmelden') : t('Magic Link senden')}
        </button>
      </form>

      <p className="text-[9px] text-anth-600 leading-relaxed">
        FuseBase · gleiche Identität wie Freigeist
      </p>
    </div>
  );
}
