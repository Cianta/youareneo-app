'use client';
import { IframeView } from '@/components/iframe/IframeView';
const URL = process.env.NEXT_PUBLIC_NOTEBOOKLM_URL ?? 'https://notebooklm.google.com';
export default function Page() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs uppercase tracking-widest mb-1" style={{color:'#11CAA0',opacity:0.7}}>NotebookLM</p>
        <p className="text-sm text-anth-400">Google AI Notebook Research</p>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="NotebookLM" configKey="NEXT_PUBLIC_NOTEBOOKLM_URL" fallbackMessage="Set NEXT_PUBLIC_NOTEBOOKLM_URL in .env.local." />
      </div>
    </div>
  );
}
