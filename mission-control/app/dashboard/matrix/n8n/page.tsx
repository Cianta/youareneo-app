'use client';
import { ExternalLink } from 'lucide-react';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_N8N_URL ?? 'http://localhost:5678';

export default function N8nPage() {
  return (
    <div className="h-full flex flex-col fade-in gap-3">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs text-anth-500 uppercase tracking-widest">Digital Staff · Automation</p>
          <h1 className="text-lg font-bold text-forest-100">n8n Automation Hub</h1>
        </div>
        <a href={URL} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-700/40 bg-orange-950/20 text-orange-300 text-xs hover:bg-orange-900/30 transition-all">
          <ExternalLink size={12} /> Open in Tab
        </a>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="n8n Automation Hub" configKey="NEXT_PUBLIC_N8N_URL"
          fallbackMessage="Set NEXT_PUBLIC_N8N_URL (default: http://localhost:5678) in .env.local." />
      </div>
    </div>
  );
}
