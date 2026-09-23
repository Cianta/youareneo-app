import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'none' | 'green' | 'gold';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className, glow = 'none', padding = 'md', onClick }: CardProps) {
  const glowStyles = {
    none:  '',
    green: 'shadow-glow-green border-forest-600/50',
    gold:  'shadow-glow-gold border-gold/30',
  };
  const pads = {
    none: '',
    sm:   'p-3',
    md:   'p-5',
    lg:   'p-8',
  };
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-2xl border border-border transition-all duration-200',
        'shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]',
        pads[padding],
        glowStyles[glow],
        onClick && 'cursor-pointer hover:border-forest-600/60',
        className
      )}
    >
      {children}
    </div>
  );
}
