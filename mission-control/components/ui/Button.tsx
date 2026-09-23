'use client';
import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'gold' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-forest-600 text-white hover:bg-forest-500 shadow-[0_2px_8px_rgba(42,96,64,0.4)] hover:shadow-[0_4px_16px_rgba(42,96,64,0.5)]',
      ghost:   'bg-transparent text-forest-300 hover:bg-forest-800/50 hover:text-forest-100',
      gold:    'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 hover:border-gold/50',
      danger:  'bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-950',
      outline: 'bg-transparent border border-border text-forest-200 hover:border-forest-600 hover:bg-forest-800/30',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
