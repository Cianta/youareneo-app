'use client';
import { useT } from '@/lib/i18n';
import { ExternalLink, LogIn, Rocket } from 'lucide-react';

const GHL_LOGIN_URL = 'https://app.gohighlevel.com/login';
const GHL_DASHBOARD_URL = process.env.NEXT_PUBLIC_GHL_URL ?? 'https://app.gohighlevel.com';

export default function GHLPage() {
  const t = useT();
  return (
    <div className="h-full flex flex-col fade-in gap-4">
      <div className="shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">GoHighLevel CRM Terminal</p>
        <p className="text-sm text-anth-400">
          GHL enforces strict iframe restrictions. Use the Command Portal below.
        </p>
      </div>

      {/* ── Command Portal Card ── */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full max-w-lg glass rounded-3xl border border-forest-700/50 p-8 space-y-6"
          style={{ boxShadow: '0 0 60px rgba(79,158,112,0.08), 0 0 120px rgba(79,158,112,0.04)' }}>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-forest-800/60 border border-forest-700/50 flex items-center justify-center"
              style={{ boxShadow: '0 0 30px rgba(79,158,112,0.15)' }}>
              <span className="text-3xl">📇</span>
            </div>
            <h2 className="text-lg font-bold text-forest-100">GHL Command Portal</h2>
            <p className="text-xs text-anth-500 max-w-xs mx-auto">
              GoHighLevel blockiert Iframe-Einbettung. Nutze die Buttons unten, um direkt auf dein CRM zuzugreifen.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.open(GHL_LOGIN_URL, '_blank')}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-forest-500/40 bg-forest-950/60 text-forest-300 hover:bg-forest-900/80 hover:text-forest-100 hover:border-forest-400/60 transition-all duration-300 group"
              style={{ boxShadow: '0 0 20px rgba(79,158,112,0.12)' }}
            >
              <LogIn size={18} className="group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-sm font-semibold">{t('1. GHL Google Login aktivieren')}</p>
                <p className="text-[10px] text-anth-500">OAuth-Login im neuen Tab starten</p>
              </div>
              <ExternalLink size={12} className="text-anth-600 ml-auto mr-1" />
            </button>

            <button
              onClick={() => window.open(GHL_DASHBOARD_URL, '_blank')}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-mint-500/30 bg-mint-500/10 text-mint-light hover:bg-mint-500/20 hover:border-mint-500/50 transition-all duration-300 group"
              style={{ boxShadow: '0 0 20px rgba(17,202,160,0.10)' }}
            >
              <Rocket size={18} className="group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-sm font-semibold">2. GHL Dashboard (Externer Workspace)</p>
                <p className="text-[10px] text-anth-500">Vollbild-CRM im separaten Tab</p>
              </div>
              <ExternalLink size={12} className="text-anth-600 ml-auto mr-1" />
            </button>
          </div>

          {/* Info Footer */}
          <div className="rounded-xl bg-anth-900/40 border border-anth-700/30 px-4 py-3">
            <p className="text-[10px] text-anth-500 leading-relaxed">
              <strong className="text-anth-400">Warum kein Iframe?</strong> GoHighLevel setzt <code className="text-gold">X-Frame-Options: DENY</code>,
              wodurch Einbettung in fremde Seiten verhindert wird. Der externe Tab umgeht dieses Sicherheits-Limit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
