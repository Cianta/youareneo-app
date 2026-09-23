'use client';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_KCHAT_URL ?? '';

export default function KChatPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Team Communication</p>
        <h1 className="text-lg font-bold text-forest-100">KChat Hub</h1>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="KChat" configKey="NEXT_PUBLIC_KCHAT_URL"
          fallbackMessage="Set NEXT_PUBLIC_KCHAT_URL (e.g. http://localhost:8065) in .env.local." />
      </div>
    </div>
  );
}
