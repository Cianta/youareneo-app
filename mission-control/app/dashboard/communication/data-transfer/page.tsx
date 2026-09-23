'use client';
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { IframeView } from '@/components/iframe/IframeView';
import { cn } from '@/lib/utils';

const SERVICES = [
  { id: 'swiss', label: 'SwissTransfer', subtitle: 'Secure · up to 50 GB', url: 'https://www.swisstransfer.com', icon: '🇨🇭', color: 'text-red-300 border-red-700/40 bg-red-950/30' },
  { id: 'we',    label: 'WeTransfer',    subtitle: 'Easy file sharing',      url: 'https://wetransfer.com',      icon: '📦', color: 'text-sky-300 border-sky-700/40 bg-sky-950/30' },
];

export default function DataTransferPage() {
  const [active, setActive] = useState('swiss');
  const svc = SERVICES.find(s => s.id === active)!;

  return (
    <div className="h-full flex flex-col fade-in gap-3">
      <div className="flex items-center gap-3 shrink-0">
        <Share2 size={16} className="text-mint-500" />
        <div>
          <p className="text-xs text-anth-500 uppercase tracking-widest">Data Transfer</p>
          <h1 className="text-lg font-bold text-forest-100">Secure File Sharing</h1>
        </div>
        <div className="ml-auto flex gap-2">
          {SERVICES.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                active === s.id ? s.color : 'text-anth-400 border-border hover:text-anth-200'
              )}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView key={svc.url} src={svc.url} title={svc.label} />
      </div>
    </div>
  );
}
