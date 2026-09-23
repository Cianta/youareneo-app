'use client';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_APOLLO_URL ?? 'https://app.apollo.io';

export default function ApolloPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Sales Intelligence</p>
        <h1 className="text-lg font-bold text-forest-100">Apollo.io</h1>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="Apollo.io" configKey="NEXT_PUBLIC_APOLLO_URL"
          fallbackMessage="Set NEXT_PUBLIC_APOLLO_URL in .env.local." />
      </div>
    </div>
  );
}
