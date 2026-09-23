import { MemoryBrowser } from '@/components/memory/MemoryBrowser';

export default function MemoryPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-5 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Unified Knowledge Base</p>
        <p className="text-sm text-anth-400">
          All agents share this memory. Entries tagged <code className="text-gold text-xs bg-forest-900/60 px-1 py-0.5 rounded">[MEMORY]</code> or{' '}
          <code className="text-gold text-xs bg-forest-900/60 px-1 py-0.5 rounded">KEY INSIGHT:</code> are saved here automatically.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <MemoryBrowser />
      </div>
    </div>
  );
}
