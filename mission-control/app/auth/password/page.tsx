'use client';
import { useState, type FormEvent } from 'react';
export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('Die Passwörter stimmen nicht überein.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Passwort konnte nicht gespeichert werden.');
      window.location.replace('/dashboard');
    } catch (e) { setError(e instanceof Error ? e.message : 'Bitte versuche es erneut.'); setBusy(false); }
  };
  return <main className="min-h-screen flex items-center justify-center bg-bg p-6 text-forest-100">
    <form onSubmit={submit} className="max-w-md w-full space-y-4">
      <h1 className="text-xl">Dein NEO-Passwort festlegen</h1>
      <label className="block">Neues Passwort<input className="block w-full rounded-lg bg-surface p-3" type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block">Passwort wiederholen<input className="block w-full rounded-lg bg-surface p-3" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <button className="rounded-xl bg-forest-700 px-5 py-3" disabled={busy}>{busy ? 'Wird gespeichert…' : 'Passwort speichern'}</button>
      <p><a href="/login" className="underline">Zur Anmeldung</a></p>
    </form>
  </main>;
}
