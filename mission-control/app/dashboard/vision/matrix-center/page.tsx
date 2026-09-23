'use client';
import { useState } from 'react';
import { IframeView } from '@/components/iframe/IframeView';
import { cn } from '@/lib/utils';

const NOAA_URL = process.env.NEXT_PUBLIC_NOAA_URL ?? 'https://www.swpc.noaa.gov';
const MORPHREADER_URL = process.env.NEXT_PUBLIC_MORPHREADER_URL ?? 'https://morphreader.com';

type MatrixTab = 'noaa' | 'morphreader';

export default function MatrixCenterPage() {
  const [tab, setTab] = useState<MatrixTab>('noaa');

  return (
    <div className="h-full flex flex-col fade-in gap-3">
      <div className="shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Matrix Center</p>
        <p className="text-sm text-anth-400">Space weather analytics & intelligence feeds</p>
      </div>

      <div className="flex items-center gap-1 border-b border-border shrink-0 pb-0">
        {([
          { id: 'noaa' as const, label: '🌍 Space Weather (NOAA)' },
          { id: 'morphreader' as const, label: '📰 MorphReader News' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px',
              tab === t.id ? 'text-mint-light border-mint-500' : 'text-anth-400 border-transparent hover:text-anth-200'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'noaa' && (
          <IframeView src={NOAA_URL} title="NOAA Space Weather" configKey="NEXT_PUBLIC_NOAA_URL"
            description="Solar storm tracking, geomagnetic alerts & Schumann resonance" />
        )}
        {tab === 'morphreader' && (
          <IframeView src={MORPHREADER_URL} title="MorphReader" configKey="NEXT_PUBLIC_MORPHREADER_URL"
            description="AI-curated technology intelligence feed" />
        )}
      </div>
    </div>
  );
}
