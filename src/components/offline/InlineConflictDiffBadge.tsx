import React, { useState } from 'react';
import { AlertTriangle, Check, ArrowRight, User, Clock, ShieldAlert, X } from 'lucide-react';
import { CellConflict, UserProfile } from '../../types';
import { resolveConflict } from '../../lib/offline-queue';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';

interface InlineConflictDiffBadgeProps {
  conflict: CellConflict;
  currentUser: UserProfile;
  onResolved?: (resolved: CellConflict) => void;
  compact?: boolean;
}

export const InlineConflictDiffBadge: React.FC<InlineConflictDiffBadgeProps> = ({
  conflict,
  currentUser,
  onResolved,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const handleChoose = async (choice: 'LOCAL' | 'REMOTE') => {
    setIsResolving(true);
    try {
      const resolved = await resolveConflict(conflict.id, choice, currentUser);
      if (resolved && onResolved) {
        onResolved(resolved);
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to resolve conflict', err);
    } finally {
      setIsResolving(false);
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins === 1) return '1 min ago';
      if (mins < 60) return `${mins} mins ago`;
      const hrs = Math.floor(mins / 60);
      return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Diff Badge trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-[11px] font-semibold hover:bg-amber-500/25 transition-all shadow-2xs animate-pulse hover:animate-none cursor-pointer"
        title="Sync Conflict Detected: Click to inspect diff and resolve"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          Conflict: <strong className="text-rose-600 dark:text-rose-400">{String(conflict.localValue)}</strong> (Local) vs{' '}
          <strong className="text-indigo-600 dark:text-indigo-400">{String(conflict.remoteValue)}</strong> (Server)
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 w-80 sm:w-96 p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-xl text-slate-900 dark:text-slate-100 text-xs">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs">
                    Sync Conflict Resolution
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {conflict.studentName} • {conflict.fieldLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-3 text-[11px] leading-relaxed">
              This record was updated both locally while offline and on the server. Choose which value should be preserved as authoritative:
            </p>

            {/* Comparison Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {/* Local Offline Card */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Offline (Local)
                    </span>
                    <Badge variant="warning" size="sm">Local</Badge>
                  </div>
                  <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200 mb-2">
                    {String(conflict.localValue)}
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate" title={conflict.localEditedBy}>
                        {conflict.localEditedBy}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{formatTimeAgo(conflict.localEditedAt)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isResolving}
                  onClick={() => handleChoose('LOCAL')}
                  className="mt-3 w-full py-1.5 px-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Keep Local</span>
                </button>
              </div>

              {/* Server Online Card */}
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Online (Server)
                    </span>
                    <Badge variant="info" size="sm">Server</Badge>
                  </div>
                  <div className="text-xl font-extrabold text-indigo-900 dark:text-indigo-200 mb-2">
                    {String(conflict.remoteValue)}
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate" title={conflict.remoteEditedBy}>
                        {conflict.remoteEditedBy}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{formatTimeAgo(conflict.remoteEditedAt)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isResolving}
                  onClick={() => handleChoose('REMOTE')}
                  className="mt-3 w-full py-1.5 px-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Keep Server</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 italic text-center">
              Choosing an option updates the active record and removes this conflict.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
