import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
      md: 'text-sm px-3.5 py-2 gap-2 min-h-[40px]',
      lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[46px]',
    };

    const variantStyles = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 focus:ring-indigo-500 shadow-[0_4px_14px_0_rgba(99,102,241,0.35)] border border-indigo-500/80',
      secondary:
        'bg-white/65 hover:bg-white/85 dark:bg-slate-800/65 dark:hover:bg-slate-800/90 text-slate-800 dark:text-slate-100 backdrop-blur-md border border-white/75 dark:border-white/10 shadow-2xs active:bg-slate-200/50 dark:active:bg-slate-700/50 focus:ring-slate-400',
      outline:
        'bg-white/40 hover:bg-white/70 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border border-white/60 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 backdrop-blur-sm active:bg-slate-200/50 dark:active:bg-slate-800/50 focus:ring-indigo-500',
      ghost:
        'bg-transparent hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 backdrop-blur-xs border border-transparent focus:ring-slate-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus:ring-rose-500 shadow-[0_4px_14px_0_rgba(244,63,94,0.35)] border border-rose-600',
      glass:
        'bg-white/70 hover:bg-white/90 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 backdrop-blur-md border border-white/85 dark:border-white/15 text-slate-900 dark:text-white shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] focus:ring-indigo-500',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
