'use client';
import { useState } from 'react';
import { HardDrive, Plus, X } from 'lucide-react';
import { IframeView } from '@/components/iframe/IframeView';
import { cn } from '@/lib/utils';

interface DriveWidget {
  id: string;
  name: string;
  icon: string;
  url: string;
  color: string;
  builtIn?: boolean;
}

const BUILT_IN_DRIVES: DriveWidget[] = [
  { id: 'gdrive', name: 'Google Drive', icon: '🟦', url: 'https://drive.google.com',       color: 'border-sky-700/40 bg-sky-950/20',    builtIn: true },
  { id: 'kdrive', name: 'KDrive',       icon: '🌿', url: 'https://kdrive.infomaniak.com',  color: 'border-teal-700/40 bg-teal-950/20',  builtIn: true },
];

export default function CloudDrivesPage() {
  const [drives, setDrives] = useState<DriveWidget[]>(BUILT_IN_DRIVES);
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftUrl, setDraftUrl] = useState('');
  const [activeDrive, setActiveDrive] = useState<string | null>('kdrive');

  const addDrive = () => {
    if (!draftName.trim() || !draftUrl.trim()) return;
    const url = draftUrl.startsWith('http') ? draftUrl : `https://${draftUrl}`;
    const newId = `custom-${Date.now()}`;
    setDrives(prev => [...prev, { id: newId, name: draftName.trim(), icon: '💾', url, color: 'border-violet-700/40 bg-violet-950/20' }]);
    setActiveDrive(newId);
    setDraftName('');
    setDraftUrl('');
    setAdding(false);
  };

  const activeDriveData = drives.find(d => d.id === activeDrive);

  return (
    <div className="h-full flex flex-col fade-in gap-3">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <HardDrive size={16} className="text-mint-500" />
        <div>
          <p className="text-xs text-anth-500 uppercase tracking-widest">Cloud Storage</p>
          <h1 className="text-lg font-bold text-forest-100">Cloud Drives</h1>
        </div>
      </div>

      {/* Drive tabs */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {drives.map(d => (
          <button key={d.id} onClick={() => setActiveDrive(d.id)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
              activeDrive === d.id ? d.color + ' ring-1 ring-mint-500/30' : 'text-anth-400 border-border hover:text-anth-200'
            )}>
            <span>{d.icon}</span>{d.name}
            {!d.builtIn && (
              <span onClick={e => { e.stopPropagation(); setDrives(p => p.filter(x => x.id !== d.id)); if (activeDrive === d.id) setActiveDrive(drives[0]?.id ?? null); }}
                className="ml-1 text-anth-600 hover:text-red-400 transition-colors">
                <X size={10} />
              </span>
            )}
          </button>
        ))}
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-anth-700/50 text-xs text-anth-600 hover:text-mint-400 hover:border-mint-700/50 transition-all">
          <Plus size={10} /> Add Drive
        </button>
      </div>

      {/* Add drive form */}
      {adding && (
        <div className="flex gap-2 items-center shrink-0">
          <input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Name"
            className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-forest-100 outline-none focus:border-forest-600 w-32" />
          <input value={draftUrl} onChange={e => setDraftUrl(e.target.value)} placeholder="https://..."
            className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-forest-100 outline-none focus:border-forest-600 flex-1" />
          <button onClick={addDrive}
            className="px-3 py-1.5 rounded-xl bg-mint-500/15 border border-mint-500/30 text-xs text-mint-400 hover:bg-mint-500/25 transition-colors">Add</button>
          <button onClick={() => setAdding(false)}
            className="px-3 py-1.5 rounded-xl border border-anth-700/50 text-xs text-anth-400 hover:text-anth-200 transition-colors">Cancel</button>
        </div>
      )}

      {/* Drive iframe */}
      <div className="flex-1 min-h-0">
        {activeDriveData ? (
          <IframeView key={activeDriveData.id} src={activeDriveData.url} title={activeDriveData.name} />
        ) : (
          <div className="h-full flex items-center justify-center text-anth-600 text-sm">Select a drive above</div>
        )}
      </div>
    </div>
  );
}
