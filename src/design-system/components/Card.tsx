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
      'liquid-glass-card rounded-[1.75rem]',
    subtle:
      'liquid-glass-subtle rounded-[1.5rem]',
    outline:
      'liquid-glass-background border border-slate-200/80 dark:border-slate-800/80 rounded-[1.5rem]',
    interactive:
      'liquid-glass-interactive rounded-[1.75rem]',
    glass:
      'liquid-glass-floating rounded-[2rem]',
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
