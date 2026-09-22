import React, { useEffect, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
} from 'lucide-react';
import {
  getOfflineQueue,
  processOfflineSync,
  getActiveConflicts,
  isAppOnline,
  isSimulatedOfflineActive,
  setSimulatedOffline,
  subscribeNetworkStatus,
  subscribeQueueChanges,
  subscribeConflictChanges,
} from '../lib/offline-queue';
import { UserProfile } from '../types';
import { OfflineQueueDrawer } from './offline/OfflineQueueDrawer';

interface ServiceWorkerRegisterProps {
  currentUser?: UserProfile;
  onLogAudit?: (action: string, details: string) => void;
}

export const ServiceWorkerRegister: React.FC<ServiceWorkerRegisterProps> = ({
  currentUser,
  onLogAudit,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => isAppOnline());
  const [isSimulated, setIsSimulated] = useState<boolean>(() => isSimulatedOfflineActive());
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [activeConflictsCount, setActiveConflictsCount] = useState<number>(() => getActiveConflicts().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const unsubNet = subscribeNetworkStatus((online) => {
      setIsOnline(online);
      setIsSimulated(isSimulatedOfflineActive());
      if (online) {
        // Auto sync when reconnecting
        handleAutoSync();
      }
    });

    const unsubQueue = subscribeQueueChanges(() => {
      setPendingQueueCount(getOfflineQueue().length);
    });

    const unsubConflicts = subscribeConflictChanges(() => {
      setActiveConflictsCount(getActiveConflicts().length);
    });

    return () => {
      unsubNet();
      unsubQueue();
      unsubConflicts();
    };
  }, []);

  const handleAutoSync = async () => {
    const q = getOfflineQueue();
    if (q.length === 0) return;

    setIsSyncing(true);
    try {
      const fallbackUser: UserProfile = currentUser || {
        id: 'usr-system-sync',
        name: 'Auto-Sync Worker',
        email: 'sync@apexhorizon.edu.ng',
        role: 'SUPER_ADMIN',
        schoolId: 'school-apex-001',
      };
      await processOfflineSync(fallbackUser);
      setPendingQueueCount(getOfflineQueue().length);
      setActiveConflictsCount(getActiveConflicts().length);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3500);
    } catch (e) {
      console.error('Auto sync error', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const userToUse: UserProfile = currentUser || {
        id: 'usr-current',
        name: 'Active Staff',
        email: 'staff@apexhorizon.edu.ng',
        role: 'TEACHER',
        schoolId: 'school-apex-001',
      };
      const result = await processOfflineSync(userToUse);
      setPendingQueueCount(getOfflineQueue().length);
      setActiveConflictsCount(getActiveConflicts().length);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3500);
      onLogAudit?.(
        'OFFLINE_QUEUE_SYNCED',
        `Synchronized ${result.syncedCount} queued mutations (${result.conflictCount} conflicts).`
      );
    } catch (e) {
      console.error('Manual sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSimulatedOffline = () => {
    const next = !isSimulated;
    setSimulatedOffline(next);
    setIsSimulated(next);
    setIsOnline(!next && (typeof navigator !== 'undefined' ? navigator.onLine : true));
    onLogAudit?.(
      'NETWORK_MODE_TOGGLED',
      `Toggled simulated connection mode to: ${next ? 'OFFLINE' : 'ONLINE'}`
    );
  };

  // Always render the banner if offline, or if there are pending items, or if there are conflicts,
  // or show a slim indicator bar so teachers can test offline mode anytime
  return (
    <>
      <div
        className={`w-full text-xs transition-colors duration-200 border-b z-40 px-4 py-2 ${
          !isOnline
            ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
            : activeConflictsCount > 0
            ? 'bg-rose-900 text-white border-rose-950 shadow-xs'
            : pendingQueueCount > 0
            ? 'bg-indigo-900 text-white border-indigo-950'
            : justSynced
            ? 'bg-emerald-800 text-white border-emerald-900'
            : 'bg-slate-900/90 text-slate-300 border-slate-800 py-1.5'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Status Text */}
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-amber-200 shrink-0 animate-pulse" />
                <span>
                  <strong>Offline Mode Active</strong> {isSimulated ? '(Simulated)' : ''}: Attendance & Gradebook changes queue locally.
                </span>
                {pendingQueueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 text-[10px] font-bold">
                    {pendingQueueCount} Pending
                  </span>
                )}
              </>
            ) : activeConflictsCount > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 animate-bounce" />
                <span>
                  <strong>Sync Conflicts Detected:</strong> {activeConflictsCount} item(s) require manual resolution before overwriting.
                </span>
              </>
            ) : justSynced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>All local mutations synchronized with central database.</span>
              </>
            ) : pendingQueueCount > 0 ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Connected with <strong>{pendingQueueCount} pending local updates</strong> awaiting sync.
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-400">
                  PWA Engine Online • Offline Sync & Write-Queue Ready
                </span>
              </>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {/* Toggle Simulate Offline */}
            <button
              type="button"
              onClick={handleToggleSimulatedOffline}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                isSimulated
                  ? 'bg-amber-700 hover:bg-amber-800 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Toggle simulated offline state for grading and attendance testing"
            >
              {isSimulated ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
              <span>{isSimulated ? 'Exit Offline Simulation' : 'Simulate Offline'}</span>
            </button>

            {/* Sync Now Button */}
            {isOnline && pendingQueueCount > 0 && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `Sync Now (${pendingQueueCount})`}</span>
              </button>
            )}

            {/* Drawer trigger */}
            {(pendingQueueCount > 0 || activeConflictsCount > 0 || !isOnline) && (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 cursor-pointer"
              >
                <Layers className="w-3 h-3" />
                <span>Queue & Conflicts</span>
                {(pendingQueueCount > 0 || activeConflictsCount > 0) && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-700 text-white text-[10px] font-bold">
                    {pendingQueueCount + activeConflictsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Queue & Conflicts Drawer */}
      <OfflineQueueDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={
          currentUser || {
            id: 'usr-admin-default',
            name: 'School Administrator',
            email: 'admin@apexhorizon.edu.ng',
            role: 'ADMIN',
            schoolId: 'school-apex-001',
          }
        }
        onLogAudit={onLogAudit}
      />
    </>
  );
};
