'use client';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { NotebookPanel } from '@/components/layout/NotebookPanel';
import { FloatingAgentWidget } from '@/components/layout/FloatingAgentWidget';
import { GlobalAudioPlayer } from '@/components/layout/GlobalAudioPlayer';
import { CompletionDialog } from '@/components/layout/CompletionDialog';
import { FlowerBackground } from '@/components/sacred-geometry/FlowerOfLife';
import { useAgentStore } from '@/lib/store';
import type { AgentConfig } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setAgents } = useAgentStore();

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => { if (data.data) setAgents(data.data as AgentConfig[]); })
      .catch(() => {});
  }, [setAgents]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg relative">
      <FlowerBackground />

      {/* Ambient glows */}
      <div className="absolute top-0 left-64 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(17,202,160,0.04)' }} />
      <div className="absolute bottom-0 right-72 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(201,168,76,0.04)' }} />

      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-5">{children}</div>
        </main>
      </div>

      <NotebookPanel />

      {/* Persistent floating agent — renders above everything */}
      <FloatingAgentWidget />

      {/* Global audio player — persists across all routes */}
      <GlobalAudioPlayer />

      {/* Completion dialog — renders above everything via portal */}
      <CompletionDialog />
    </div>
  );
}
