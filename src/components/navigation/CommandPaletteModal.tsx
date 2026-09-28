import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  Clock,
  BookOpen,
  FileCheck,
  CreditCard,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  Briefcase,
  Database,
  ArrowRight,
  LogOut,
  Sparkles,
  Palette,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Role } from '../../types';
import { getAllowedTabsForRole, TabId } from '../../lib/auth-store';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: Role;
  onNavigateTab: (tab: TabId) => void;
  onLogout: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tab?: TabId;
  action?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  userRole,
  onNavigateTab,
  onLogout,
}) => {
  const [query, setQuery] = useState('');
  const allowedTabs = getAllowedTabsForRole(userRole);

  const allCommands: CommandItem[] = [
    {
      id: 'cmd-dash',
      title: 'Executive Dashboard',
      subtitle: 'Overview KPIs, active sessions, and attendance metrics',
      icon: <LayoutDashboard className="w-4 h-4 text-indigo-500" />,
      tab: 'dashboard',
    },
    {
      id: 'cmd-students',
      title: 'Students Directory & Dossier',
      subtitle: 'Search student records, enrollment, and credentials',
      icon: <Users className="w-4 h-4 text-emerald-500" />,
      tab: 'students',
    },
    {
      id: 'cmd-gradebook',
      title: 'Master Gradebook Grid',
      subtitle: 'Record CA1, CA2, exam scores with live weighted grading',
      icon: <FileCheck className="w-4 h-4 text-amber-500" />,
      tab: 'gradebook',
    },
    {
      id: 'cmd-class-struct',
      title: 'Class Structure & Arms',
      subtitle: 'Manage streams, form masters, and arm capacity',
      icon: <Layers className="w-4 h-4 text-sky-500" />,
      tab: 'class-structure',
    },
    {
      id: 'cmd-admissions',
      title: 'Admissions Pipeline',
      subtitle: 'Applicant tracking, entrance assessments, and placement',
      icon: <GraduationCap className="w-4 h-4 text-indigo-400" />,
      tab: 'admissions',
    },
    {
      id: 'cmd-timetables',
      title: 'Class Timetable (Admin)',
      subtitle: 'School master schedule and room allocation',
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      tab: 'timetables',
    },
    {
      id: 'cmd-teacher-tt',
      title: 'Personal Teacher Timetable',
      subtitle: 'Decoupled teacher schedule and personal availability blocks',
      icon: <Clock className="w-4 h-4 text-teal-500" />,
      tab: 'teacher-timetable',
    },
    {
      id: 'cmd-fees',
      title: 'Fee Management & Invoices',
      subtitle: 'Fee structures, student balances, receipts, and discounts',
      icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
      tab: 'fees',
    },
    {
      id: 'cmd-payroll',
      title: 'Staff Payroll & Allowances',
      subtitle: 'Monthly payroll runs, PAYE tax, pension, and payslips',
      icon: <Briefcase className="w-4 h-4 text-amber-600" />,
      tab: 'payroll',
    },
    {
      id: 'cmd-disciplinary',
      title: 'Disciplinary Incident Tracker',
      subtitle: 'Behavior logs, point-deduction merits, and parent notifications',
      icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
      tab: 'disciplinary',
    },
    {
      id: 'cmd-parent-portal',
      title: 'Parent Portal',
      subtitle: 'Ward academic reports, fee payments, and teacher messages',
      icon: <Users className="w-4 h-4 text-sky-600" />,
      tab: 'parent-portal',
    },
    {
      id: 'cmd-student-portal',
      title: 'Student Portal',
      subtitle: 'Personal report cards, assignments, and class captain logs',
      icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
      tab: 'student-portal',
    },
    {
      id: 'cmd-suggestions',
      title: 'Suggestion Box',
      subtitle: 'Feedback channels for students, staff, and parents',
      icon: <HelpCircle className="w-4 h-4 text-cyan-500" />,
      tab: 'suggestions',
    },
    {
      id: 'cmd-backup',
      title: 'Data Export & Cloud Backup',
      subtitle: 'Full database JSON/SQL snapshots and automated backups',
      icon: <Database className="w-4 h-4 text-slate-500" />,
      tab: 'backup',
    },
    {
      id: 'cmd-messages',
      title: 'Communications Hub',
      subtitle: 'Broadcast announcements and direct messaging channels',
      icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
      tab: 'messages',
    },
  ];

  // Super Admin ONLY command
  if (userRole === 'SUPER_ADMIN') {
    allCommands.push({
      id: 'cmd-design-sys',
      title: 'System Design Tokens & UI Specs',
      subtitle: 'Developer palette tokens, typography scales, and component library',
      icon: <Palette className="w-4 h-4 text-pink-500" />,
      tab: 'design-system',
    });
  }

  // Filter commands by active role permissions
  const permittedCommands = allCommands.filter((c) => !c.tab || allowedTabs.includes(c.tab));

  // Search filter
  const filtered = query.trim()
    ? permittedCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : permittedCommands;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="w-full max-w-xl bg-white/88 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search header */}
        <div className="p-4 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a screen or command to jump..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="overflow-y-auto p-2 divide-y divide-white/40 dark:divide-white/6 flex-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
            Role-Scoped Quick Navigation ({userRole.replace('_', ' ')})
          </div>

          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching screens found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => {
                  if (cmd.tab) onNavigateTab(cmd.tab);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-2xl hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-white/70 dark:border-slate-700/60 group-hover:bg-white dark:group-hover:bg-slate-700 shadow-2xs shrink-0">
                    {cmd.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {cmd.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {cmd.subtitle}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))
          )}

          {/* Quick logout action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full text-left p-3 rounded-2xl hover:bg-rose-50/70 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/80 border border-rose-200/60 dark:border-rose-900/60 group-hover:bg-white dark:group-hover:bg-rose-900 shrink-0">
                <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <div className="text-xs font-bold">Sign Out of Session</div>
                <div className="text-[11px] text-rose-500/80">
                  End current demonstration session and return to Login
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-white/30 dark:bg-slate-950/40 backdrop-blur-xs border-t border-white/60 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono text-slate-500">↵</kbd> Select
            </span>
            <span>
              <kbd className="font-mono text-slate-500">Esc</kbd> Close
            </span>
          </div>
          <span className="font-mono text-[10px]">Apex Horizon SMS</span>
        </div>
      </motion.div>
    </div>
  );
};
