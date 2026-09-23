import { UniverseView } from '@/components/universe/UniverseView';

export default function UniversePage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-4 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Universal Memory Vault</p>
        <p className="text-sm text-anth-400">Submit knowledge → syncs to local Obsidian vault + Notion database simultaneously.</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <UniverseView />
      </div>
    </div>
  );
}
