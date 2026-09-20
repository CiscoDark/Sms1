import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: string | number;
  badgeVariant?: 'primary' | 'success' | 'warning';
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  badge,
  badgeVariant = 'primary',
}) => {
  const badgeColors = {
    primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none cursor-pointer ${
        isActive
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold shadow-2xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={`w-4.5 h-4.5 shrink-0 ${
            isActive
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        />
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <span
          className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${badgeColors[badgeVariant]}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
