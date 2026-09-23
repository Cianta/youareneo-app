'use client';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_GEMMA_URL ?? 'https://ai.google.dev/gemma';

export default function GemmaPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Google Gemma Model Workspace</p>
        <h1 className="text-lg font-bold text-forest-100">Gemma AI</h1>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="Gemma AI" configKey="NEXT_PUBLIC_GEMMA_URL"
          fallbackMessage="Set NEXT_PUBLIC_GEMMA_URL in .env.local." />
      </div>
    </div>
  );
}
