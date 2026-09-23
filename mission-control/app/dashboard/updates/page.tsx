'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { useNotificationStore } from '@/lib/store';
import type { NotificationType } from '@/lib/store';
import { cn } from '@/lib/utils';

const TYPE_META: Record<NotificationType, { icon: string; label: string; color: string; bg: string }> = {
  goal:     { icon: '🎯', label: 'Goal',     color: 'text-gold',        bg: 'bg-gold/10 border-gold/30' },
  mail:     { icon: '📧', label: 'Mail',     color: 'text-sky-400',     bg: 'bg-sky-900/20 border-sky-700/30' },
  system:   { icon: '⚙️', label: 'System',   color: 'text-anth-400',    bg: 'bg-anth-800/40 border-anth-700/40' },
  agent:    { icon: '🤖', label: 'Agent',    color: 'text-mint-400',    bg: 'bg-mint-900/10 border-mint-700/30' },
  calendar: { icon: '📅', label: 'Calendar', color: 'text-violet-400',  bg: 'bg-violet-900/20 border-violet-700/30' },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function UpdatesPage() {
  const { notifications, markRead, markAllRead, clearAll } = useNotificationStore();
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gold-gradient">Updates Center</h1>
          <p className="text-xs text-anth-500 mt-1">{unread} unread · {notifications.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-forest-700/40 bg-forest-800/30 text-xs text-forest-300 hover:bg-forest-700/30 transition-colors">
            <CheckCheck size={12} /> Mark All Read
          </button>
          <button onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-800/40 bg-red-900/10 text-xs text-red-400 hover:bg-red-900/20 transition-colors">
            <Trash2 size={12} /> Clear All
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'goal', 'mail', 'system', 'agent', 'calendar'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
              filter === f
                ? 'bg-forest-700/40 border-forest-600/50 text-forest-200'
                : 'bg-anth-800/40 border-anth-700/40 text-anth-500 hover:text-anth-300'
            )}>
            {f === 'all' ? <Filter size={10} /> : <span>{TYPE_META[f as NotificationType].icon}</span>}
            {f === 'all' ? 'All' : TYPE_META[f as NotificationType].label}
            {f === 'all' && unread > 0 && (
              <span className="w-4 h-4 rounded-full bg-gold text-anth-900 text-[9px] font-bold flex items-center justify-center">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell size={32} className="text-anth-600 mb-3" />
            <p className="text-sm text-anth-500">No notifications</p>
            <p className="text-xs text-anth-600 mt-1">You're all caught up</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((n, i) => {
              const meta = TYPE_META[n.type];
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn('flex gap-4 px-5 py-4 hover:bg-forest-900/10 transition-colors', !n.read && 'bg-forest-900/5')}>
                  {/* Type badge */}
                  <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center text-base shrink-0', meta.bg)}>
                    {meta.icon}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium', n.read ? 'text-anth-400' : 'text-forest-100')}>{n.title}</p>
                        <p className="text-xs text-anth-500 mt-0.5">{n.body}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-gold" />}
                        <span className={cn('text-[10px]', meta.color)}>{timeAgo(n.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn('text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-md border', meta.bg, meta.color)}>
                        {meta.label}
                      </span>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)}
                          className="flex items-center gap-1 text-[10px] text-anth-500 hover:text-mint-400 transition-colors">
                          <Check size={10} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
