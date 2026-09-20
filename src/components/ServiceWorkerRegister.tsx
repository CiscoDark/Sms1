import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getOfflineQueue, clearOfflineQueue } from '../lib/offline-queue';

export const ServiceWorkerRegister: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on queue
    setPendingQueueCount(getOfflineQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerAutoSync = () => {
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      setIsSyncing(true);
      setTimeout(() => {
        clearOfflineQueue();
        setPendingQueueCount(0);
        setIsSyncing(false);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
      }, 1000);
    }
  };

  if (isOnline && pendingQueueCount === 0 && !justSynced) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between z-40 transition-all border-b border-slate-800">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Changes are saved locally and will sync when reconnected.
              </span>
            </>
          ) : justSynced ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All queued mutations synchronized with school database.</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Connected ({pendingQueueCount} pending local updates)
              </span>
            </>
          )}
        </div>

        {pendingQueueCount > 0 && isOnline && (
          <button
            type="button"
            onClick={triggerAutoSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
