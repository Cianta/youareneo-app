'use client';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIExtStore, useNeuralNotebookStore, useFocusStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export function CompletionDialog() {
  const t = useT();
  const { completionDialog, setCompletionDialog } = useUIExtStore();
  const { deleteGoal, archiveGoal, updateGoal } = useNeuralNotebookStore();
  const { setDailyTaskDone } = useFocusStore();

  if (typeof document === 'undefined') return null;

  const close = () => setCompletionDialog(null);

  const handleDone = () => {
    if (!completionDialog) return;
    const { goalId, source, dailyIdx } = completionDialog;
    updateGoal(goalId, { completed: true });
    if (source === 'daily' && dailyIdx !== undefined) {
      setDailyTaskDone(dailyIdx as 0 | 1 | 2, true);
    }
    close();
  };

  const handleArchive = () => {
    if (!completionDialog) return;
    archiveGoal(completionDialog.goalId);
    close();
  };

  const handleDelete = () => {
    if (!completionDialog) return;
    deleteGoal(completionDialog.goalId);
    close();
  };

  return createPortal(
    <AnimatePresence>
      {completionDialog && (
        <motion.div
          key="completion-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-anth-950/90 backdrop-blur-xl border border-border rounded-3xl p-6 w-80 shadow-2xl"
          >
            <div className="text-center mb-4">
              <p className="text-2xl mb-1">🎯</p>
              <p className="text-sm font-bold text-forest-100">{t('Ziel erreicht!')}</p>
              <p className="text-xs text-anth-400 mt-1 italic" style={{ color: '#11CAA0' }}>
                &ldquo;{completionDialog?.goalText}&rdquo;
              </p>
            </div>

            <p className="text-[10px] text-anth-500 text-center mb-4 uppercase tracking-widest">
              {t('Was möchtest du damit machen?')}
            </p>

            <div className="space-y-2">
              {/* Als erledigt markieren */}
              <button
                onClick={handleDone}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-forest-700/60 border border-forest-500/50 text-forest-100 text-sm font-semibold hover:bg-forest-600/70 transition-all"
              >
                <span>✓</span> {t('Als erledigt markieren')}
              </button>

              {/* Archivieren */}
              <button
                onClick={handleArchive}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-yellow-900/30 border border-yellow-700/40 text-sm font-semibold hover:bg-yellow-900/50 transition-all"
                style={{ color: '#C9A84C' }}
              >
                <span>📦</span> {t('Archivieren')}
              </button>

              {/* Löschen */}
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-anth-800/40 border border-anth-700/40 text-anth-400 text-xs hover:text-red-400 hover:border-red-800/40 transition-all"
              >
                <span>🗑</span> {t('Löschen')}
              </button>
            </div>

            {/* Schließen */}
            <button
              onClick={close}
              className="w-full mt-3 text-center text-[10px] text-anth-600 hover:text-anth-400 transition-colors"
            >
              × {t('Schließen')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
