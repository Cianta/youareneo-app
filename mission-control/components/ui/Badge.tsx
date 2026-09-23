import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', size = 'sm', className, dot }: BadgeProps) {
  const variants = {
    default: 'bg-forest-800/60 text-forest-300 border-forest-700/50',
    success: 'bg-forest-900/60 text-forest-400 border-forest-700',
    warning: 'bg-yellow-950/60 text-yellow-400 border-yellow-900/50',
    danger:  'bg-red-950/60 text-red-400 border-red-900/50',
    gold:    'bg-yellow-950/40 text-gold border-gold/30',
    info:    'bg-blue-950/60 text-blue-400 border-blue-900/50',
  };
  const dotColors = {
    default: 'bg-forest-400',
    success: 'bg-forest-400',
    warning: 'bg-yellow-400',
    danger:  'bg-red-400',
    gold:    'bg-gold',
    info:    'bg-blue-400',
  };
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md font-medium border', variants[variant], sizes[size], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
