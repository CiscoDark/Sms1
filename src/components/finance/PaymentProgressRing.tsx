import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface PaymentProgressRingProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  strokeWidth?: number;
  className?: string;
}

export const PaymentProgressRing: React.FC<PaymentProgressRingProps> = ({
  percentage,
  size = 'md',
  showLabel = true,
  strokeWidth,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  // Size dimensions
  const dimensions = {
    sm: { size: 36, stroke: strokeWidth || 3.5, fontSize: 'text-[10px]' },
    md: { size: 48, stroke: strokeWidth || 4.5, fontSize: 'text-xs' },
    lg: { size: 76, stroke: strokeWidth || 6, fontSize: 'text-base font-bold' },
  }[size];

  const radius = (dimensions.size - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Tier color grading
  const getColor = () => {
    if (clamped >= 100) {
      return {
        stroke: '#10B981', // emerald-500
        bgRing: 'rgba(16, 185, 129, 0.15)',
        text: 'text-emerald-600 dark:text-emerald-400',
      };
    }
    if (clamped >= 50) {
      return {
        stroke: '#F59E0B', // amber-500
        bgRing: 'rgba(245, 158, 11, 0.15)',
        text: 'text-amber-600 dark:text-amber-400',
      };
    }
    if (clamped > 0) {
      return {
        stroke: '#EF4444', // rose-500
        bgRing: 'rgba(239, 68, 68, 0.15)',
        text: 'text-rose-600 dark:text-rose-400',
      };
    }
    return {
      stroke: '#94A3B8', // slate-400
      bgRing: 'rgba(148, 163, 184, 0.15)',
      text: 'text-slate-400 dark:text-slate-500',
    };
  };

  const theme = getColor();

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: dimensions.size, height: dimensions.size }}
      title={`${clamped}% Fees Paid`}
    >
      <svg
        width={dimensions.size}
        height={dimensions.size}
        viewBox={`0 0 ${dimensions.size} ${dimensions.size}`}
        className="-rotate-90 transform"
      >
        {/* Track Background */}
        <circle
          cx={dimensions.size / 2}
          cy={dimensions.size / 2}
          r={radius}
          fill="none"
          stroke={theme.bgRing}
          strokeWidth={dimensions.stroke}
        />
        {/* Animated Progress Arc */}
        <motion.circle
          cx={dimensions.size / 2}
          cy={dimensions.size / 2}
          r={radius}
          fill="none"
          stroke={theme.stroke}
          strokeWidth={dimensions.stroke}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center Label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold select-none">
          {clamped >= 100 && size !== 'sm' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            </motion.div>
          ) : (
            <span className={`${dimensions.fontSize} ${theme.text}`}>
              {clamped}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};
