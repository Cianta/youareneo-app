'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MagicActivateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const globalId = params.get('globalId') || params.get('id') || '';
    if (!globalId) {
      setError('globalId fehlt');
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/auth/magic?globalId=${encodeURIComponent(globalId)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Activate failed (${res.status})`);
        }
        router.replace(data.redirectPath || '/dashboard');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6 text-sm text-forest-200">
      {error ? (
        <div className="space-y-2 text-center">
          <p className="text-red-400">{error}</p>
          <a href="/login" className="text-mint-400 underline text-xs">
            Zum Login
          </a>
        </div>
      ) : (
        <p>Magic Link wird aktiviert…</p>
      )}
    </div>
  );
}

export default function MagicActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <MagicActivateInner />
    </Suspense>
  );
}
