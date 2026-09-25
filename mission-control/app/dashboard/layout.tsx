'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotebookPanel } from '@/components/layout/NotebookPanel';
import { FloatingAgentWidget } from '@/components/layout/FloatingAgentWidget';
import { CompletionDialog } from '@/components/layout/CompletionDialog';
import { useAgentStore, useAuthStore } from '@/lib/store';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import type { AgentConfig } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setAgents } = useAgentStore();
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.authenticated) {
          router.replace('/login');
          return;
        }
        if (data.email) {
          setUser({
            name: String(data.email).split('@')[0] || 'Member',
            role: 'FuseBase',
            avatar: '🔮',
          });
        }
      } catch {
        router.replace('/login');
        return;
      }
      if (!cancelled) setAuthReady(true);
    })();
    return () => { cancelled = true; };
  }, [router, setUser]);

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => { if (data.data) setAgents(data.data as AgentConfig[]); })
      .catch(() => {});
  }, [setAgents]);

  if (!authReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg text-sm text-anth-500">
        Session…
      </div>
    );
  }

  return (
    <>
      <WorkspaceShell>{children}</WorkspaceShell>
      <NotebookPanel />
      <FloatingAgentWidget />
      <CompletionDialog />
    </>
  );
}
