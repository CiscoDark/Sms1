import React from 'react';

export interface ProgressRingProps {
  percentage: number; // 0 to 100
  size?: number; // diameter in px, default 48
  strokeWidth?: number; // stroke width, default 4
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  showLabel?: boolean;
  labelClassName?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 48,
  strokeWidth = 4,
  color = 'primary',
  showLabel = true,
  labelClassName = '',
}) => {
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;

  const colorStyles = {
    primary: 'text-indigo-600 dark:text-indigo-400 stroke-indigo-600 dark:stroke-indigo-400',
    success: 'text-emerald-600 dark:text-emerald-400 stroke-emerald-600 dark:stroke-emerald-400',
    warning: 'text-amber-500 dark:text-amber-400 stroke-amber-500 dark:stroke-amber-400',
    danger: 'text-rose-600 dark:text-rose-400 stroke-rose-600 dark:stroke-rose-400',
    info: 'text-sky-600 dark:text-sky-400 stroke-sky-600 dark:stroke-sky-400',
  };

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        {/* Dynamic progress bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${colorStyles[color]}`}
        />
      </svg>
      {showLabel && (
        <span
          className={`absolute text-[11px] font-semibold text-slate-800 dark:text-slate-200 ${labelClassName}`}
        >
          {Math.round(normalizedPercentage)}%
        </span>
      )}
    </div>
  );
};
