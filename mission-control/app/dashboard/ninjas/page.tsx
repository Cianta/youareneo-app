import { NinjasView } from '@/components/ninjas/NinjasView';

export default function NinjasPage() {
  return (
    <div className="h-full overflow-y-auto fade-in">
      <div className="mb-5">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Human Team Dashboard</p>
        <p className="text-sm text-anth-400">Team profiles, active task tracking, and Postiz webhook status.</p>
      </div>
      <NinjasView />
    </div>
  );
}
