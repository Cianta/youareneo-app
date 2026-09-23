'use client';
import { useT } from '@/lib/i18n';
import { ExternalLink, LogIn } from 'lucide-react';
import { IframeView } from '@/components/iframe/IframeView';

const RIVERSIDE_URL = process.env.NEXT_PUBLIC_RIVERSIDE_URL ?? 'https://riverside.fm';
const RIVERSIDE_LOGIN_URL = 'https://riverside.fm/login';

export default function RiversidePage() {
  const t = useT();
  return (
    <div className="h-full flex flex-col fade-in gap-3">
      <div className="shrink-0">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#11CAA0', opacity: 0.7 }}>Riverside Studio</p>
        <p className="text-sm text-anth-400">Video Podcast Recording</p>
      </div>

      {/* Breakout Login Button */}
      <button
        onClick={() => window.open(RIVERSIDE_LOGIN_URL, '_blank')}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-forest-500/40 bg-forest-950/60 text-forest-300 hover:bg-forest-900/80 hover:text-forest-100 hover:border-forest-400/60 transition-all duration-300 shrink-0 group"
        style={{ boxShadow: '0 0 15px rgba(79,158,112,0.12)' }}
      >
        <LogIn size={16} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold">{t('Riverside Google Login aktivieren')}</span>
        <ExternalLink size={11} className="text-anth-600" />
      </button>

      {/* Iframe */}
      <div className="flex-1 min-h-0">
        <IframeView
          src={RIVERSIDE_URL}
          title="Riverside Studio"
          configKey="NEXT_PUBLIC_RIVERSIDE_URL"
          description="Riverside — Video Podcast Recording Studio"
          fallbackMessage="Set NEXT_PUBLIC_RIVERSIDE_URL in .env.local."
        />
      </div>
    </div>
  );
}
