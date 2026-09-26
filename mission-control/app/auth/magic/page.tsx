'use client';
import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MagicActivateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const globalId = params.get('globalId') || params.get('id') || '';
  const captured = useRef(false);
  useEffect(() => {
    if (captured.current) return;
    captured.current = true;
    const code = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    setToken(code);
    // Keep the credential in component memory only after opening the mail.
    if (code) window.history.replaceState(null, '', window.location.pathname);
    if (!code && !globalId) setError('Dieser Anmeldelink ist unvollständig. Bitte fordere einen neuen an.');
  }, [globalId]);

  async function activate(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/magic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { token } : { globalId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Die Anmeldung konnte nicht abgeschlossen werden.');
      router.replace(data.redirectPath || '/dashboard');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setBusy(false); }
  }
  return <div className="min-h-screen flex items-center justify-center bg-bg p-6 text-sm text-forest-200">
    <form onSubmit={activate} className="glass-dark border border-border rounded-3xl p-8 space-y-5 text-center max-w-md">
      <h1 className="text-xl font-semibold">Willkommen bei TRINITY OS</h1>
      <p>Bestätige deine Anmeldung, um deinen Arbeitsplatz zu öffnen.</p>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {(token || globalId) && <button disabled={busy} className="w-full p-3 rounded-xl bg-forest-700 border border-forest-600 disabled:opacity-50">{busy ? 'Anmeldung läuft…' : 'Jetzt anmelden'}</button>}
      <a href="/login" className="block text-mint-400 underline text-xs">Neuen Anmeldelink anfordern</a>
    </form>
  </div>;
}
export default function MagicActivatePage() {
  return <Suspense fallback={<div className="min-h-screen bg-bg" />}><MagicActivateInner /></Suspense>;
}
