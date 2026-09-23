'use client';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_TELEGRAM_URL ?? 'https://web.telegram.org/a';

export default function TelegramPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Messaging</p>
        <h1 className="text-lg font-bold text-forest-100">Telegram Messenger</h1>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="Telegram" configKey="NEXT_PUBLIC_TELEGRAM_URL"
          fallbackMessage="Set NEXT_PUBLIC_TELEGRAM_URL in .env.local." />
      </div>
    </div>
  );
}
