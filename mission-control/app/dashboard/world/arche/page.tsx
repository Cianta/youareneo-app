'use client';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_MEMBERSPOT_URL ?? 'https://app.memberspot.de';

export default function ArchePage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Arche · Die Kunst des Lebens</p>
        <h1 className="text-lg font-bold text-forest-100">Memberspot Academy</h1>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="Memberspot" configKey="NEXT_PUBLIC_MEMBERSPOT_URL"
          fallbackMessage="Set NEXT_PUBLIC_MEMBERSPOT_URL in .env.local." />
      </div>
    </div>
  );
}
