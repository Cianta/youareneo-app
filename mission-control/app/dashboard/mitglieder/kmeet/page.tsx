'use client';
import { IframeView } from '@/components/iframe/IframeView';
const URL = process.env.NEXT_PUBLIC_KMEET_URL ?? '';
export default function Page() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs uppercase tracking-widest mb-1" style={{color:'#11CAA0',opacity:0.7}}>kMeet</p>
        <p className="text-sm text-anth-400">Team Video Conferencing</p>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="kMeet" configKey="NEXT_PUBLIC_KMEET_URL" fallbackMessage="Set NEXT_PUBLIC_KMEET_URL in .env.local." />
      </div>
    </div>
  );
}
