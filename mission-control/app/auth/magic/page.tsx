'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ConfirmLink() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const confirm = async () => {
    setBusy(true); setError('');
    try {
      const body = Object.fromEntries(params);
      if (!body.globalId && body.id) body.globalId = body.id;
      const response = await fetch('/api/auth/magic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Der Link konnte nicht bestätigt werden.');
      window.history.replaceState(null, '', '/auth/magic');
      window.location.replace(data.redirectPath || '/dashboard');
    } catch (e) { setError(e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen.'); setBusy(false); }
  };
  return <main className="min-h-screen flex items-center justify-center bg-bg p-6 text-forest-100">
    <div className="max-w-md space-y-4 text-center">
      <h1 className="text-xl">Deinen NEO-Zugang bestätigen</h1>
      <p>Bestätige den Link, um dich anzumelden oder dein Passwort festzulegen.</p>
      <button className="rounded-xl bg-forest-700 px-5 py-3" disabled={busy} onClick={confirm}>{busy ? 'Wird bestätigt…' : 'Weiter'}</button>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <p><a href="/login" className="underline">Zur Anmeldung</a></p>
    </div>
  </main>;
}
export default function Page() { return <Suspense><ConfirmLink /></Suspense>; }
