import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'outline' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    default:
      'bg-white/72 dark:bg-slate-900/68 backdrop-blur-md border border-white/75 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.85)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.05)] rounded-2xl',
    subtle:
      'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/60 dark:border-white/6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl',
    outline:
      'bg-transparent border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs rounded-2xl',
    interactive:
      'bg-white/75 dark:bg-slate-900/68 backdrop-blur-md border border-white/75 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.85)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.05)] rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/88 dark:hover:bg-slate-800/80 hover:border-indigo-400/40 dark:hover:border-indigo-500/30 hover:shadow-[0_14px_36px_rgba(99,102,241,0.08)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.4)] cursor-pointer active:scale-[0.99]',
    glass:
      'bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl border border-white/85 dark:border-white/15 shadow-[0_16px_40px_rgba(31,38,135,0.08),inset_0_1px_2px_0_rgba(255,255,255,0.95)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_1px_2px_0_rgba(255,255,255,0.08)] rounded-2xl',
  };

  return (
    <div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
