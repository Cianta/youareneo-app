'use client';
import { motion } from 'framer-motion';
import { Brain, Kanban, CheckSquare, MessageSquare, Music, ShoppingBag, Zap, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemMetrics } from '@/types';

interface MetricProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  change?: string;
  index: number;
}

function MetricTile({ label, value, icon: Icon, color, change, index }: MetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl p-4 border border-border hover:border-forest-600/50 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', color)}>
          <Icon size={16} />
        </div>
        {change && (
          <span className="text-[10px] text-forest-400 bg-forest-800/50 px-1.5 py-0.5 rounded-md">{change}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-forest-100 mt-3 leading-none">{value}</p>
      <p className="text-xs text-anth-400 mt-1">{label}</p>
    </motion.div>
  );
}

interface Props {
  metrics: SystemMetrics;
}

export function MetricsGrid({ metrics }: Props) {
  const tiles: Omit<MetricProps, 'index'>[] = [
    { label: 'Active Agents',       value: `${metrics.onlineAgents}/${metrics.totalAgents}`, icon: Zap,         color: 'bg-forest-800/60 text-forest-400 border-forest-700' },
    { label: 'Memory Entries',      value: metrics.memoryEntries,   icon: Brain,       color: 'bg-purple-950/50 text-purple-400 border-purple-800', change: 'shared' },
    { label: 'Open Tasks',          value: metrics.kanbanTasks,      icon: Kanban,      color: 'bg-gold/10 text-gold border-gold/30' },
    { label: 'Completed Tasks',     value: metrics.completedTasks,   icon: CheckSquare, color: 'bg-forest-900/60 text-forest-400 border-forest-700' },
    { label: "Today's Messages",    value: metrics.todayMessages,    icon: MessageSquare, color: 'bg-blue-950/50 text-blue-400 border-blue-800' },
    { label: 'Media Jobs',          value: metrics.mediaJobs,        icon: Music,       color: 'bg-teal-950/50 text-teal-400 border-teal-800' },
    { label: 'Shopify Drafts',      value: metrics.shopifyDrafts,    icon: ShoppingBag, color: 'bg-orange-950/50 text-orange-400 border-orange-800' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {tiles.map((t, i) => (
        <MetricTile key={t.label} {...t} index={i} />
      ))}
    </div>
  );
}
