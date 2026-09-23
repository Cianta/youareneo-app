'use client';
import { UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useSelfStore } from '@/lib/store';

/**
 * Kompakter Haken für Agent-Chats: sendet das Self-Profil (MD aus der
 * Self-Seite) als Vorinfo mit jedem Prompt. Der Zustand ist global —
 * derselbe Haken wie auf der Self-Seite.
 */
export function SelfContextToggle({ className }: { className?: string }) {
  const t = useT();
  const attach = useSelfStore(s => s.attachProfileToPrompts);
  const setAttach = useSelfStore(s => s.setAttachProfile);
  const hasProfile = useSelfStore(s => !!(s.summaryMd.trim() || s.profileMd.trim()));

  return (
    <button onClick={() => setAttach(!attach)}
      title={hasProfile
        ? t('Self-Profil als Vorinfo mitsenden')
        : t('Self-Profil als Vorinfo mitsenden') + ' — ' + t('zuerst auf der Self-Seite speichern')}
      className={cn('shrink-0 p-1.5 rounded-lg border transition-colors',
        attach && hasProfile
          ? 'bg-mint-500/20 border-mint-500/50 text-mint-300'
          : attach
            ? 'bg-amber-900/20 border-amber-700/40 text-amber-400'
            : 'border-anth-700/40 text-anth-500 hover:text-anth-300 hover:border-anth-600/50',
        className)}>
      {attach ? <UserCheck size={13} /> : <UserX size={13} />}
    </button>
  );
}
