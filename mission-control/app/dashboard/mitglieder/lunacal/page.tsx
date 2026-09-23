'use client';
import { useT } from '@/lib/i18n';
import { ExternalLink, LogIn } from 'lucide-react';
import { IframeView } from '@/components/iframe/IframeView';

const LUNACAL_URL = process.env.NEXT_PUBLIC_LUNACAL_URL ?? 'https://app.lunacal.ai';
const LUNACAL_LOGIN_URL = 'https://app.lunacal.ai/login';

export default function LunacalPage() {
  const t = useT();
  return (
    <div className="h-full flex flex-col fade-in gap-3">
      <div className="shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Lunacal Scheduler Terminal</p>
        <p className="text-sm text-anth-400">Embedded calendar and appointment booking dashboard.</p>
      </div>

      {/* Breakout Login Button */}
      <button
        onClick={() => window.open(LUNACAL_LOGIN_URL, '_blank')}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-forest-500/40 bg-forest-950/60 text-forest-300 hover:bg-forest-900/80 hover:text-forest-100 hover:border-forest-400/60 transition-all duration-300 shrink-0 group"
        style={{ boxShadow: '0 0 15px rgba(79,158,112,0.12)' }}
      >
        <LogIn size={16} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold">{t('Lunacal Google Login aktivieren')}</span>
        <ExternalLink size={11} className="text-anth-600" />
      </button>

      {/* Iframe */}
      <div className="flex-1 min-h-0">
        <IframeView
          src={LUNACAL_URL}
          title="Lunacal Scheduler"
          configKey="NEXT_PUBLIC_LUNACAL_URL"
          description="Lunacal Calendar — Appointment Booking Dashboard"
          fallbackMessage="Set your Lunacal dashboard URL to embed the scheduler directly inside TRINITY OS."
        />
      </div>
    </div>
  );
}
