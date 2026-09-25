'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Sparkles } from 'lucide-react';
import { FOERDER_PRODUCT_URL } from '@/lib/membership';

type Mode = 'password' | 'magic' | 'forgot';

/**
 * Trinity / Mission Control login via FuseBase Gate helpers
 * (same identity as Freigeist; Gate service token stays server-side).
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const onSubmit = async (e: FormEvent) => {
    const next = new URLSearchParams(window.location.search).get('next');
    const redirectPath = next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/dashboard';
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'password') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, redirectPath }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Login failed (${res.status})`);
        }
        // Sync local TopBar store lightly
        try {
          const { useAuthStore } = await import('@/lib/store');
          useAuthStore.getState().setUser({
            name: data.email?.split('@')[0] || 'Member',
            role: 'FuseBase',
            avatar: '🔮',
          });
        } catch {
          /* store optional */
        }
        router.replace(redirectPath);
        return;
      }

      if (mode === 'forgot') {
        const res = await fetch('/api/auth/password-restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Password restore failed (${res.status})`);
        }
        setInfo(
          data.message ||
            'Falls ein Konto mit dieser E-Mail existiert, erhältst du eine Nachricht zum Zurücksetzen des Passworts.',
        );
        return;
      }

      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectPath }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Magic link failed (${res.status})`);
      }
      setInfo(data.message || 'Magic link sent — check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-forest-100 placeholder-anth-600 outline-none focus:border-forest-600 transition-colors';

  const submitLabel =
    mode === 'password'
      ? 'Anmelden'
      : mode === 'forgot'
        ? 'Reset-Link anfordern'
        : 'Magic Link senden';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md glass-dark border border-border rounded-3xl p-6 shadow-panel space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-mint-400" size={18} />
          <div>
            <h1 className="text-lg font-semibold text-forest-100">TRINITY OS</h1>
            <p className="text-[11px] text-anth-500">FuseBase Gate Login · YOU ARE NEO</p>
          </div>
        </div>

        <div className="flex gap-1">
          {(
            [
              ['password', 'Passwort'],
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
              className={`flex-1 py-1.5 rounded-lg border text-xs transition-all ${
                mode === m
                  ? 'bg-forest-800/50 border-forest-600/50 text-forest-200'
                  : 'bg-anth-800/40 border-anth-700/40 text-anth-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'forgot' && (
          <p className="text-[11px] text-anth-500 leading-relaxed">
            Passwort vergessen? Gib deine E-Mail ein. FuseBase sendet einen Reset-Link
            (nur wenn ein Konto existiert — die Antwort bleibt bewusst generisch).
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-anth-600" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              className={`${input} pl-8`}
            />
          </div>

          {mode === 'password' && (
            <div className="relative">
              <KeyRound size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-anth-600" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort"
                className={`${input} pl-8`}
              />
            </div>
          )}

          {mode === 'password' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setInfo('');
                }}
                className="text-[11px] text-mint-400/90 hover:text-mint-300 underline-offset-2 hover:underline"
              >
                Passwort vergessen?
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setError('');
                  setInfo('');
                }}
                className="text-[11px] text-anth-500 hover:text-anth-400 underline-offset-2 hover:underline"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-mint-400">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-forest-700/50 border border-forest-600/40 text-sm text-forest-100 font-medium hover:bg-forest-600/40 transition-colors disabled:opacity-50"
          >
            {busy ? '…' : submitLabel}
          </button>
        </form>

        <a
          href={FOERDER_PRODUCT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 rounded-xl bg-anth-800/50 border border-anth-600/40 text-sm text-forest-100 font-medium hover:bg-anth-700/40 hover:border-mint-600/30 transition-colors"
        >
          Noch kein Konto? Fördermitglied werden – 3,33 €
        </a>

        <p className="text-[10px] text-anth-600 leading-relaxed">
          Gleiche FuseBase-Identität wie Freigeist. Service-Token bleibt serverseitig.
          Gate-Login für Trinity — getrennt von Portal-Embeds.
        </p>
      </div>
    </div>
  );
}
