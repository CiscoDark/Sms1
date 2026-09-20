import React, { useState, useEffect } from 'react';
import {
  School,
  LayoutDashboard,
  Calendar,
  Layers,
  Palette,
  Bell,
  Menu,
  X,
  GraduationCap,
  UploadCloud,
} from 'lucide-react';
import {
  AcademicSession,
  ClassLevel,
  UserProfile,
  AuditLog,
  Role,
  Term,
} from './types';
import {
  INITIAL_SESSIONS,
  INITIAL_LEVELS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import { ThemeProvider, ThemeToggle, SidebarNavItem, Badge, Button } from './design-system';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoleSwitcher } from './components/RoleSwitcher';
import { ServiceWorkerRegister } from './components/ServiceWorkerRegister';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { AcademicSessionsPage } from './components/academic/AcademicSessionsPage';
import { ClassStructurePage } from './components/class-structure/ClassStructurePage';
import { DesignSystemPage } from './components/design-system/DesignSystemPage';
import { DataMigrationPage } from './components/importer/DataMigrationPage';
import { AdvanceTermModal } from './components/academic/AdvanceTermModal';
import { enqueueOfflineAction } from './lib/offline-queue';

type Tab = 'dashboard' | 'sessions' | 'class-structure' | 'data-migration' | 'design-system';

export default function App() {
  // State with localStorage persistence
  const [sessions, setSessions] = useState<AcademicSession[]>(() => {
    try {
      const stored = localStorage.getItem('sms_sessions');
      return stored ? JSON.parse(stored) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });

  const [levels, setLevels] = useState<ClassLevel[]>(() => {
    try {
      const stored = localStorage.getItem('sms_levels');
      return stored ? JSON.parse(stored) : INITIAL_LEVELS;
    } catch {
      return INITIAL_LEVELS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('sms_current_user');
      return stored ? JSON.parse(stored) : INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem('sms_audit_logs');
      return stored ? JSON.parse(stored) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Advance Term Modal State
  const [globalAdvanceModal, setGlobalAdvanceModal] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('sms_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('sms_levels', JSON.stringify(levels));
  }, [levels]);

  useEffect(() => {
    localStorage.setItem('sms_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sms_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Current session & active term
  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];
  const activeTerm = currentSession?.terms.find((t) => t.status === 'ACTIVE') || currentSession?.terms[0];

  const handleLogAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      category: action.includes('SESSION') || action.includes('TERM') ? 'SESSION' : 'CLASS',
      performerName: currentUser.name,
      performerRole: currentUser.role.replace('_', ' '),
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      details,
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    // Also queue for offline sync resilience
    enqueueOfflineAction('/api/audit-logs', 'POST', newLog as unknown as Record<string, unknown>, action);
  };

  const handleAdvanceTermFromHeader = () => {
    setGlobalAdvanceModal(true);
  };

  const handleConfirmAdvanceGlobal = (
    sessionYear: string,
    currentTermId: string,
    nextTermId: string | null
  ) => {
    const updated = sessions.map((sess) => {
      if (sess.year !== sessionYear) return sess;
      const updatedTerms = sess.terms.map((t) => {
        if (t.id === currentTermId) {
          return { ...t, status: 'COMPLETED' as const, isLocked: true };
        }
        if (nextTermId && t.id === nextTermId) {
          return { ...t, status: 'ACTIVE' as const, isLocked: false };
        }
        return t;
      });
      const isSessionComplete = !nextTermId;
      return {
        ...sess,
        terms: updatedTerms,
        status: isSessionComplete ? ('COMPLETED' as const) : sess.status,
        isCurrent: !isSessionComplete,
      };
    });

    setSessions(updated);
    handleLogAudit(
      'TERM_ADVANCED',
      nextTermId
        ? `Advanced term for ${sessionYear}`
        : `Completed academic year ${sessionYear}`
    );
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
          {/* Offline Sync Banner */}
          <ServiceWorkerRegister />

          {/* Main Top Header */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Left Brand */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Toggle Navigation Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <div
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      <span>Apex Horizon Academy</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none hidden sm:block">
                      School Management System
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Active Academic Session Indicator */}
              <div
                onClick={() => setActiveTab('sessions')}
                className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                title="Click to view academic sessions"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currentSession.year}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {activeTerm?.name || 'Active Term'}
                </span>
              </div>

              {/* Right Controls: Role Switcher & Theme Toggle */}
              <div className="flex items-center gap-2 sm:gap-3">
                <RoleSwitcher
                  currentUser={currentUser}
                  onSelectUser={(u) => {
                    setCurrentUser(u);
                    handleLogAudit('ROLE_SWITCH', `Switched active role to ${u.role}`);
                  }}
                />

                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 space-y-1 shadow-lg">
                <SidebarNavItem
                  icon={LayoutDashboard}
                  label="Executive Dashboard"
                  isActive={activeTab === 'dashboard'}
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                />
                <SidebarNavItem
                  icon={Calendar}
                  label="Academic Sessions & Terms"
                  isActive={activeTab === 'sessions'}
                  onClick={() => {
                    setActiveTab('sessions');
                    setMobileMenuOpen(false);
                  }}
                  badge={activeTerm ? activeTerm.name : undefined}
                  badgeVariant="success"
                />
                <SidebarNavItem
                  icon={Layers}
                  label="Class Structure & Streams"
                  isActive={activeTab === 'class-structure'}
                  onClick={() => {
                    setActiveTab('class-structure');
                    setMobileMenuOpen(false);
                  }}
                  badge={`${levels.length} Levels`}
                />
                <SidebarNavItem
                  icon={UploadCloud}
                  label="Data Migration Importer"
                  isActive={activeTab === 'data-migration'}
                  onClick={() => {
                    setActiveTab('data-migration');
                    setMobileMenuOpen(false);
                  }}
                  badge="CSV/Excel"
                  badgeVariant="primary"
                />
                <SidebarNavItem
                  icon={Palette}
                  label="Design System Library"
                  isActive={activeTab === 'design-system'}
                  onClick={() => {
                    setActiveTab('design-system');
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
            )}
          </header>

          {/* Sub Navigation Bar for Desktop */}
          <nav className="hidden md:block bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-12 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'sessions'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Academic Sessions & Terms</span>
                {activeTerm && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    {activeTerm.name}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('class-structure')}
                className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'class-structure'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Class Structure</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {levels.length} Levels
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('data-migration')}
                className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'data-migration'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Data Migration</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                  CSV/Excel
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design-system')}
                className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ml-auto ${
                  activeTab === 'design-system'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Design System UI</span>
              </button>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
            {activeTab === 'dashboard' && (
              <DashboardPage
                currentSession={currentSession}
                levels={levels}
                auditLogs={auditLogs}
                userRole={currentUser.role}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onAdvanceTermRequest={handleAdvanceTermFromHeader}
              />
            )}

            {activeTab === 'sessions' && (
              <AcademicSessionsPage
                sessions={sessions}
                onUpdateSessions={setSessions}
                userRole={currentUser.role}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'class-structure' && (
              <ClassStructurePage
                levels={levels}
                onUpdateLevels={setLevels}
                userRole={currentUser.role}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'data-migration' && (
              <DataMigrationPage
                levels={levels}
                onUpdateLevels={setLevels}
                userRole={currentUser.role}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'design-system' && <DesignSystemPage />}
          </main>

          {/* Global Advance Term Modal */}
          {globalAdvanceModal && currentSession && activeTerm && (
            <AdvanceTermModal
              isOpen={globalAdvanceModal}
              onClose={() => setGlobalAdvanceModal(false)}
              session={currentSession}
              activeTerm={activeTerm}
              nextTerm={
                currentSession.terms[
                  currentSession.terms.findIndex((t) => t.id === activeTerm.id) + 1
                ] || null
              }
              onConfirmAdvance={handleConfirmAdvanceGlobal}
            />
          )}

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                Apex Horizon Academy • Unified School Management Platform
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px]">System Status: Online & Synced</span>
                <span>•</span>
                <span>Active Role: {currentUser.title}</span>
              </div>
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
