import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  getOfflineQueue,
  clearOfflineQueue,
  removeQueueItem,
  processOfflineSync,
  getActiveConflicts,
  resolveConflict,
  isAppOnline,
  isSimulatedOfflineActive,
  setSimulatedOffline,
  subscribeQueueChanges,
  subscribeConflictChanges,
  subscribeNetworkStatus,
} from '../../lib/offline-queue';
import { OfflineQueueItem, CellConflict, UserProfile } from '../../types';
import { Drawer } from '../../design-system/components/Drawer';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';

interface OfflineQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogAudit?: (action: string, details: string) => void;
}

export const OfflineQueueDrawer: React.FC<OfflineQueueDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogAudit,
}) => {
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => getOfflineQueue());
  const [conflicts, setConflicts] = useState<CellConflict[]>(() => getActiveConflicts());
  const [isOnline, setIsOnline] = useState<boolean>(() => isAppOnline());
  const [isSimulated, setIsSimulated] = useState<boolean>(() => isSimulatedOfflineActive());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubQueue = subscribeQueueChanges(() => setQueue(getOfflineQueue()));
    const unsubConflicts = subscribeConflictChanges(() => setConflicts(getActiveConflicts()));
    const unsubNet = subscribeNetworkStatus((online) => {
      setIsOnline(online);
      setIsSimulated(isSimulatedOfflineActive());
    });

    return () => {
      unsubQueue();
      unsubConflicts();
      unsubNet();
    };
  }, []);

  const handleToggleSimulatedOffline = (checked: boolean) => {
    setSimulatedOffline(checked);
    setIsSimulated(checked);
    setIsOnline(!checked && (typeof navigator !== 'undefined' ? navigator.onLine : true));
    onLogAudit?.(
      'NETWORK_MODE_CHANGED',
      `Switched simulated network status to: ${checked ? 'OFFLINE' : 'ONLINE'}`
    );
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const result = await processOfflineSync(currentUser);
      setQueue(getOfflineQueue());
      setConflicts(getActiveConflicts());

      if (result.conflictCount > 0) {
        setSyncFeedback(
          `Sync completed: ${result.syncedCount} changes synced, but ${result.conflictCount} conflicts require manual review.`
        );
      } else if (result.syncedCount > 0) {
        setSyncFeedback(`Successfully synchronized ${result.syncedCount} pending change(s) with database!`);
      } else {
        setSyncFeedback('All changes are currently up to date.');
      }

      onLogAudit?.(
        'OFFLINE_QUEUE_SYNCED',
        `Processed offline synchronization: ${result.syncedCount} synced, ${result.conflictCount} conflicts.`
      );
    } catch (err) {
      console.error('Failed to sync offline queue', err);
      setSyncFeedback('An error occurred while syncing. Please retry.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflictItem = async (conflictId: string, choice: 'LOCAL' | 'REMOTE') => {
    await resolveConflict(conflictId, choice, currentUser);
    setConflicts(getActiveConflicts());
    setQueue(getOfflineQueue());
    onLogAudit?.(
      'SYNC_CONFLICT_RESOLVED',
      `Resolved conflict ${conflictId} choosing ${choice}`
    );
  };

  const handleClearAllQueue = () => {
    if (confirm('Clear all pending offline queue items? Unsynced local drafts may be removed.')) {
      clearOfflineQueue();
      setQueue([]);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Offline Sync & Write Queue" size="md">
      <div className="space-y-6">
        {/* Network Status & Offline Simulation Card */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isOnline ? 'Online & Connected' : 'Offline Mode Active'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isOnline
                    ? 'Mutations synchronize automatically or on demand.'
                    : 'Changes queue safely locally in encrypted browser storage.'}
                </p>
              </div>
            </div>

            <Badge variant={isOnline ? 'success' : 'warning'}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Badge>
          </div>

          {/* Simulate Offline Toggle */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Simulate Offline Mode
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Test offline gradebook & attendance queuing without disabling WiFi
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSimulated}
                onChange={(e) => handleToggleSimulatedOffline(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        {/* Sync Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              loading={isSyncing}
              disabled={!isOnline || queue.length === 0}
              onClick={handleTriggerSync}
            >
              <span>Sync All Changes ({queue.length})</span>
            </Button>

            {queue.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Trash2}
                onClick={handleClearAllQueue}
              >
                Clear Queue
              </Button>
            )}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {conflicts.length} conflict(s) • {queue.length} pending
          </span>
        </div>

        {/* Feedback alert */}
        {syncFeedback && (
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
            <span>{syncFeedback}</span>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="text-indigo-600 hover:text-indigo-800 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Active Conflicts Section */}
        {conflicts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Cell Conflicts ({conflicts.length})
                </h4>
              </div>
              <Badge variant="danger">Requires Manual Choice</Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              For gradebook and attendance specifically, conflicting edits are never silently overwritten. Review each diff below:
            </p>

            <div className="space-y-3">
              {conflicts.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.studentName}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.fieldLabel} • {c.contextInfo.subjectName || c.contextInfo.subjectCode || 'Daily Register'}
                      </p>
                    </div>
                    <Badge variant="warning">{c.entityType}</Badge>
                  </div>

                  {/* Inline Diff Side-by-Side */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 mb-1">
                        Offline Value
                      </div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white mb-1.5">
                        {String(c.localValue)}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={c.localEditedBy}>
                        By: {c.localEditedBy}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResolveConflictItem(c.id, 'LOCAL')}
                        className="mt-2 w-full py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[10px] cursor-pointer"
                      >
                        Keep Offline
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        Server Value
                      </div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white mb-1.5">
                        {String(c.remoteValue)}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={c.remoteEditedBy}>
                        By: {c.remoteEditedBy}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResolveConflictItem(c.id, 'REMOTE')}
                        className="mt-2 w-full py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] cursor-pointer"
                      >
                        Keep Server
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queued Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Pending Queue ({queue.length})</span>
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              FIFO Order
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Write queue is empty
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All attendance check-ins and gradebook scores are in sync.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.status === 'CONFLICT'
                            ? 'danger'
                            : item.status === 'PENDING'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{item.method} {item.endpoint}</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQueueItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
