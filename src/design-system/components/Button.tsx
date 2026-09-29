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
        'liquid-primary text-white font-semibold border border-indigo-400/30 focus:ring-indigo-500',
      secondary:
        'liquid-glass-button text-slate-800 dark:text-slate-100 focus:ring-slate-400',
      outline:
        'liquid-glass-subtle hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 focus:ring-indigo-500',
      ghost:
        'bg-transparent hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 backdrop-blur-xs border border-transparent focus:ring-slate-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus:ring-rose-500 shadow-[0_4px_14px_0_rgba(244,63,94,0.35)] border border-rose-600',
      glass:
        'liquid-glass-button text-slate-900 dark:text-white focus:ring-indigo-500',
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
