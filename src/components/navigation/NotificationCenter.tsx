import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  CreditCard,
  UserPlus,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'FEES' | 'ADMISSION' | 'EXAM' | 'SYNC' | 'GENERAL';
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Outstanding Tuition Reminder',
    message: '52 students across JSS 2 have outstanding Term 1 tuition balances awaiting reconciliation.',
    category: 'FEES',
    timestamp: '10m ago',
    isRead: false,
    linkTab: 'fees',
  },
  {
    id: 'notif-2',
    title: 'New Admission Applications',
    message: '3 new student entrance applications have been submitted for 2024/2025 JSS 1 intake.',
    category: 'ADMISSION',
    timestamp: '45m ago',
    isRead: false,
    linkTab: 'admissions',
  },
  {
    id: 'notif-3',
    title: 'End-of-Term Examinations',
    message: 'End-of-term examinations begin in 10 days for Senior Secondary (SSS 1 - SSS 3). Timetable published.',
    category: 'EXAM',
    timestamp: '2h ago',
    isRead: false,
    linkTab: 'assessments',
  },
  {
    id: 'notif-4',
    title: 'Offline Sync Queue Healthy',
    message: 'All local attendance and gradebook mutation queues are synchronized with zero pending conflicts.',
    category: 'SYNC',
    timestamp: '4h ago',
    isRead: true,
  },
];

interface NotificationCenterProps {
  onNavigateTab?: (tab: string) => void;
  isOpenExternal?: boolean;
  onToggleExternal?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleItemClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    if (notif.linkTab && onNavigateTab) {
      onNavigateTab(notif.linkTab);
      setIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Listen for Ctrl+N / Cmd+N keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCategoryIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'FEES':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'ADMISSION':
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'EXAM':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'SYNC':
        return <RefreshCw className="w-4 h-4 text-sky-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/70 dark:border-slate-700/60 shadow-2xs hover:bg-white/85 dark:hover:bg-slate-700/80 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all cursor-pointer"
        aria-label="Notifications"
        title="Notifications (Ctrl+N)"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        )}
      </button>

      {/* Slide-down Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-3 sm:inset-auto sm:right-0 top-16 sm:top-auto sm:mt-2 max-w-sm sm:max-w-none sm:w-96 mx-auto sm:mx-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border-b border-white/60 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Notification Centre
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/40 dark:divide-white/6">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-start gap-3 ${
                    !item.isRead ? 'bg-indigo-50/30 dark:bg-indigo-950/30' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-white/70 dark:border-slate-700/60 shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-white/30 dark:bg-slate-950/40 backdrop-blur-xs border-t border-white/60 dark:border-white/10 text-center text-[10px] text-slate-400">
              Press <kbd className="font-mono text-slate-500">Ctrl+N</kbd> to toggle notifications
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
