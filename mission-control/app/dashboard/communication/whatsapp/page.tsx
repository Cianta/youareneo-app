'use client';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? 'https://web.whatsapp.com';

export default function WhatsAppPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Messaging</p>
        <h1 className="text-lg font-bold text-forest-100">WhatsApp Business</h1>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="WhatsApp Business" configKey="NEXT_PUBLIC_WHATSAPP_URL"
          fallbackMessage="Set NEXT_PUBLIC_WHATSAPP_URL in .env.local." />
      </div>
    </div>
  );
}
