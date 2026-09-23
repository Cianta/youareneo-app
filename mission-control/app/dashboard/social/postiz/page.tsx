'use client';
import { IframeView } from '@/components/iframe/IframeView';

const POSTIZ_URL = process.env.NEXT_PUBLIC_POSTIZ_URL ?? '';

export default function PostizPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Postiz Distribution Engine</p>
        <p className="text-sm text-anth-400">Self-hosted Postiz dashboard — schedule and distribute content across all social channels.</p>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView
          src={POSTIZ_URL || 'http://localhost:5000'}
          title="Postiz Hub"
          configKey="NEXT_PUBLIC_POSTIZ_URL"
          fallbackMessage="Set your self-hosted Postiz instance URL (e.g. http://localhost:5000) to embed it here."
        />
      </div>
    </div>
  );
}
