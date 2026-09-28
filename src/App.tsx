import React, { useState, useEffect, useMemo } from 'react';
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
  UserPlus,
  Users,
  Clock,
  FileSpreadsheet,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Banknote,
  Database,
  LogOut,
  Command,
  Info,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AcademicSession,
  ClassLevel,
  UserProfile,
  AuditLog,
  Role,
  Term,
  Student,
  OfflineQueueItem,
  CellConflict,
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
import { AdmissionsPage } from './components/admissions/AdmissionsPage';
import { StudentDirectoryPage } from './components/students/StudentDirectoryPage';
import { AdvanceTermModal } from './components/academic/AdvanceTermModal';
import { StudentCredentialModal } from './components/students/StudentCredentialModal';
import { ClassTimetablePage } from './components/timetable/ClassTimetablePage';
import { TeacherPersonalTimetablePage } from './components/timetable/TeacherPersonalTimetablePage';
import { AssessmentSchedulePage } from './components/assessments/AssessmentSchedulePage';
import { GradebookPage } from './components/gradebook/GradebookPage';
import { StudentPortalPage } from './components/student-portal/StudentPortalPage';
import { ParentPortalPage } from './components/parent-portal/ParentPortalPage';
import { CommunicationsHubPage } from './components/messaging/CommunicationsHubPage';
import { PublicCredentialVerifyView } from './components/report-cards/PublicCredentialVerifyView';
import { FeeManagementPage } from './components/finance/FeeManagementPage';
import { DisciplinaryLogPage } from './components/disciplinary/DisciplinaryLogPage';
import { SuggestionBoxPage } from './components/suggestions/SuggestionBoxPage';
import { PayrollPage } from './components/payroll/PayrollPage';
import { DataExportBackupPage } from './components/backup/DataExportBackupPage';
import { LoginPage } from './components/auth/LoginPage';
import { GlobalSearchBar } from './components/navigation/GlobalSearchBar';
import { NotificationCenter } from './components/navigation/NotificationCenter';
import { CommandPaletteModal } from './components/navigation/CommandPaletteModal';
import { WhatsNewDrawer } from './components/navigation/WhatsNewDrawer';
import { DemoModeInfoModal } from './components/navigation/DemoModeInfoModal';
import { OfflineQueueDrawer } from './components/offline/OfflineQueueDrawer';
import {
  TabId,
  getAllowedTabsForRole,
  getDefaultTabForRole,
  getStoredAuthUser,
  storeAuthUser,
  clearAuthUser,
  getStoredStartPage,
  setStoredStartPage,
} from './lib/auth-store';
import { getReportCardByCredentialUuid, getAllPublishedReportCards } from './lib/report-card-store';
import {
  isAppOnline,
  getOfflineQueue,
  getActiveConflicts,
  subscribeNetworkStatus,
  subscribeQueueChanges,
  subscribeConflictChanges,
  processOfflineSync,
  enqueueOfflineAction,
} from './lib/offline-queue';
import { getEnrichedStudents } from './lib/students/students-store';
import { LandingPage } from './components/landing/LandingPage';

type Tab =
  | 'dashboard'
  | 'admissions'
  | 'students'
  | 'sessions'
  | 'class-structure'
  | 'timetables'
  | 'teacher-timetable'
  | 'assessments'
  | 'gradebook'
  | 'student-portal'
  | 'parent-portal'
  | 'messages'
  | 'fees'
  | 'disciplinary'
  | 'suggestions'
  | 'payroll'
  | 'backup'
  | 'data-migration'
  | 'design-system';

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

  // User authentication session state:
  // Starts on unauthenticated entry page (Landing or Login) unless explicitly navigating to #/app
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.startsWith('#/app') || hash.startsWith('#app')) {
      return getStoredAuthUser();
    }
    // Default starting page: unauthenticated
    return null;
  });

  // Default starting page preference: 'landing' or 'login' (persisted in localStorage)
  const [defaultStartScreen, setDefaultStartScreen] = useState<'landing' | 'login'>(() => {
    return getStoredStartPage();
  });

  const handleUpdateDefaultStartScreen = (screen: 'landing' | 'login') => {
    setDefaultStartScreen(screen);
    setStoredStartPage(screen);
    setAuthView(screen);
    window.location.hash = screen === 'login' ? '#/login' : '#/landing';
  };

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem('sms_audit_logs');
      return stored ? JSON.parse(stored) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Students state populated with enriched records
  const [students, setStudents] = useState<Student[]>(() => {
    return getEnrichedStudents();
  });

  const refreshStudents = () => {
    setStudents(getEnrichedStudents());
  };

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const initialUser = getStoredAuthUser();
    return initialUser ? (getDefaultTabForRole(initialUser.role) as Tab) : 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicVerifyStudent, setPublicVerifyStudent] = useState<Student | null>(null);

  // Unauthenticated view state: 'landing' (public marketing showcase) or 'login' (sign in form)
  const [authView, setAuthView] = useState<'landing' | 'login'>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash === '#/login' || hash.startsWith('#/login') || hash === '#login') {
      return 'login';
    }
    if (hash === '#/landing' || hash.startsWith('#/landing') || hash === '#landing') {
      return 'landing';
    }
    // Use stored start page preference (defaults to 'landing', can be 'login')
    return getStoredStartPage();
  });

  const [publicVerificationUuid, setPublicVerificationUuid] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.includes('/verify-credential/')) {
      const parts = hash.split('/verify-credential/');
      return parts[1]?.split('?')[0] || null;
    }
    return null;
  });

  // Check URL for public credential verification hash, login hash, landing hash, or app hash
  useEffect(() => {
    const checkVerificationRoute = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('/verify-credential/')) {
        const parts = hash.split('/verify-credential/');
        const uuid = parts[1]?.split('?')[0] || 'sample-cred-uuid';
        setPublicVerificationUuid(uuid);
      } else if (search.includes('verify=')) {
        const params = new URLSearchParams(search);
        const uuid = params.get('verify') || 'sample-cred-uuid';
        setPublicVerificationUuid(uuid);
      } else {
        setPublicVerificationUuid(null);
        if (hash === '#/login' || hash.startsWith('#/login') || hash === '#login') {
          setAuthView('login');
          setCurrentUser(null);
        } else if (hash === '#/landing' || hash.startsWith('#/landing') || hash === '#landing') {
          setAuthView('landing');
          setCurrentUser(null);
        } else if (hash.startsWith('#/app') || hash.startsWith('#app')) {
          const stored = getStoredAuthUser();
          if (stored) {
            setCurrentUser(stored);
          } else {
            const startPref = getStoredStartPage();
            setAuthView(startPref);
            setCurrentUser(null);
            window.location.hash = startPref === 'login' ? '#/login' : '#/landing';
          }
        } else if (hash === '' || hash === '#' || hash === '#/') {
          // Starting at root URL: always open the configured start page (Landing or Login)
          const startPref = getStoredStartPage();
          setAuthView(startPref);
          setCurrentUser(null);
        }
      }
    };

    checkVerificationRoute();
    window.addEventListener('hashchange', checkVerificationRoute);
    return () => window.removeEventListener('hashchange', checkVerificationRoute);
  }, []);

  // Global Advance Term Modal State
  const [globalAdvanceModal, setGlobalAdvanceModal] = useState(false);

  // Offline Sync & Conflict Drawer State
  const [offlineDrawerOpen, setOfflineDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => isAppOnline());
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => getOfflineQueue());
  const [activeConflicts, setActiveConflicts] = useState<CellConflict[]>(() => getActiveConflicts());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubNet = subscribeNetworkStatus((online) => setIsOnline(online));
    const unsubQueue = subscribeQueueChanges(() => setOfflineQueue(getOfflineQueue()));
    const unsubConflicts = subscribeConflictChanges(() => setActiveConflicts(getActiveConflicts()));
    return () => {
      unsubNet();
      unsubQueue();
      unsubConflicts();
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('sms_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('sms_levels', JSON.stringify(levels));
  }, [levels]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sms_current_user', JSON.stringify(currentUser));
      storeAuthUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sms_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Allowed tabs for the active role
  const allowedTabs = useMemo(() => {
    return currentUser ? getAllowedTabsForRole(currentUser.role) : [];
  }, [currentUser]);

  // Tab guard: redirect unauthorized users to their role's default landing page
  useEffect(() => {
    if (currentUser) {
      const allowed = getAllowedTabsForRole(currentUser.role);
      if (!allowed.includes(activeTab as TabId)) {
        const defaultTab = getDefaultTabForRole(currentUser.role);
        setActiveTab(defaultTab as Tab);
      }
    }
  }, [currentUser, activeTab]);

  // Handle Logout
  const handleLogout = () => {
    clearAuthUser();
    localStorage.removeItem('sms_current_user');
    setCurrentUser(null);
    setCommandPaletteOpen(false);
    setWhatsNewOpen(false);
    setDemoModalOpen(false);
    const startPref = getStoredStartPage();
    setAuthView(startPref);
    window.location.hash = startPref === 'login' ? '#/login' : '#/landing';
  };

  // Keyboard shortcuts (Ctrl/Cmd + K, Ctrl/Cmd + H, Ctrl/Cmd + Shift + L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // Jump to Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (currentUser && allowedTabs.includes('dashboard')) {
          setActiveTab('dashboard');
        }
      }
      // Quick Logout
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleLogout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, allowedTabs]);

  // Tab Labels for Mobile Swipe Navigation
  const TAB_LABELS: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    admissions: 'Admissions Pipeline',
    students: 'Student Records',
    sessions: 'Academic Sessions',
    'class-structure': 'Class Structure',
    timetables: 'Class Timetables',
    'teacher-timetable': 'Teacher Timetable',
    assessments: 'Exam & CA Schedules',
    gradebook: 'Teacher Gradebook',
    'student-portal': 'Student Portal',
    'parent-portal': 'Parent Portal',
    messages: 'Communications Hub',
    fees: 'Fees & Payments',
    disciplinary: 'Disciplinary Log',
    suggestions: 'Suggestion Box',
    payroll: 'Staff Payroll',
    backup: 'Data Backup',
    'data-migration': 'Data Migration',
    'design-system': 'Design System UI',
  };

  const TAB_SUBTITLES: Record<string, string> = {
    dashboard: 'Enrollment analytics, attendance metrics, and terms overview',
    admissions: 'Applicant pipeline, entrance examination, and enrollment',
    students: 'Enriched dossiers, medical logs, and biometric attendance',
    sessions: 'Academic calendar, terms lifecycle, and promotion rules',
    'class-structure': 'Grade levels, stream arms, and capacity limits',
    timetables: 'Master timetable matrix with conflict prevention',
    'teacher-timetable': 'Individual teacher schedules and lesson planning',
    assessments: 'Continuous assessment schedule and examination calendar',
    gradebook: 'Teacher score entries, weighting, and approval ledger',
    'student-portal': 'Student results, timetable, and attendance dossier',
    'parent-portal': 'Multi-child monitoring and unified fee management',
    messages: 'Omnichannel SMS Guard, WhatsApp, and emergency alerts',
    fees: 'Invoicing, tuition tracking, receipts, and outstanding ledgers',
    disciplinary: 'Infraction records, merits, interventions, and counselor notes',
    suggestions: 'Confidential feedback box from students, parents, and staff',
    payroll: 'Staff salary calculation, tax deductions, and net payouts',
    backup: 'Full system database snapshot and cryptographic export',
    'data-migration': 'CSV/Excel spreadsheet batch import and reconciliation',
    'design-system': 'Design system tokens, typography, and UI elements',
  };

  // Mobile Swipe & Gesture Navigation State
  const touchStartRef = React.useRef<{
    x: number;
    y: number;
    time: number;
    isLeftEdge: boolean;
    inScrollable: boolean;
  } | null>(null);

  const drawerTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<'left' | 'right' | null>(null);

  const currentTabIndex = allowedTabs.indexOf(activeTab);
  const prevTab = currentTabIndex > 0 ? allowedTabs[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < allowedTabs.length - 1 ? allowedTabs[currentTabIndex + 1] : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const target = e.target as HTMLElement | null;

    // Check if touch target is an interactive or horizontally scrollable element
    const inScrollable = !!target?.closest?.(
      '.touch-scroll, table, input, textarea, select, pre, .no-swipe, [data-prevent-swipe="true"]'
    );
    const isLeftEdge = touch.clientX < 40;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isLeftEdge,
      inScrollable,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const { isLeftEdge, inScrollable } = touchStartRef.current;
    touchStartRef.current = null;

    if (deltaTime > 800) return;

    // 1. Edge swipe from left to right: open mobile drawer
    if (isLeftEdge && deltaX > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      setMobileMenuOpen(true);
      return;
    }

    // 2. If touch was inside horizontally scrollable container, don't switch tabs
    if (inScrollable) return;

    // 3. Tab Container Horizontal Swipe Gesture
    const isDominantHorizontal = Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
    if (isDominantHorizontal) {
      if (deltaX < 0 && nextTab) {
        // Swiped Left -> Go to Next Tab
        setSwipeFeedback('left');
        setTimeout(() => setSwipeFeedback(null), 450);
        setActiveTab(nextTab as Tab);
      } else if (deltaX > 0 && prevTab) {
        // Swiped Right -> Go to Previous Tab
        setSwipeFeedback('right');
        setTimeout(() => setSwipeFeedback(null), 450);
        setActiveTab(prevTab as Tab);
      }
    }
  };

  // Current session & active term
  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];
  const activeTerm = currentSession?.terms.find((t) => t.status === 'ACTIVE') || currentSession?.terms[0];

  const handleLogAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      category: action.includes('SESSION') || action.includes('TERM') ? 'SESSION' : 'CLASS',
      performerName: currentUser?.name || 'System User',
      performerRole: currentUser ? currentUser.role.replace('_', ' ') : 'DEMO USER',
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

  // Unauthenticated / Public Credential Verification Hash Route
  if (publicVerificationUuid) {
    const reportCard = getReportCardByCredentialUuid(publicVerificationUuid);
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <PublicCredentialVerifyView
            credentialUuid={publicVerificationUuid}
            reportCard={reportCard}
            onBackToApp={() => {
              window.location.hash = '';
              setPublicVerificationUuid(null);
            }}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Authentication & Marketing Gate: if user is not in an active app session
  if (!currentUser) {
    const savedSessionUser = getStoredAuthUser();
    const handleResumeSession = () => {
      if (savedSessionUser) {
        setCurrentUser(savedSessionUser);
        const defaultTab = getDefaultTabForRole(savedSessionUser.role);
        setActiveTab(defaultTab as Tab);
        window.location.hash = '#/app';
      }
    };

    if (authView === 'login') {
      return (
        <ErrorBoundary>
          <ThemeProvider>
            <LoginPage
              onLoginSuccess={(user) => {
                storeAuthUser(user);
                setCurrentUser(user);
                const defaultTab = getDefaultTabForRole(user.role);
                setActiveTab(defaultTab as Tab);
                window.location.hash = '#/app';
              }}
              onOpenPublicVerification={() => {
                window.location.hash = '/verify-credential/cred-sample-jss1-001';
              }}
              onBackToLanding={() => {
                setAuthView('landing');
                window.location.hash = '#/landing';
              }}
              defaultStartingScreen={defaultStartScreen}
              onSetDefaultStartingScreen={handleUpdateDefaultStartScreen}
              savedUser={savedSessionUser}
              onResumeSession={savedSessionUser ? handleResumeSession : undefined}
            />
          </ThemeProvider>
        </ErrorBoundary>
      );
    }

    // Default unauthenticated view: Rich Glassmorphic Landing Page
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <LandingPage
            onEnterLogin={() => {
              setAuthView('login');
              window.location.hash = '#/login';
            }}
            onDirectLoginAs={(user) => {
              storeAuthUser(user);
              setCurrentUser(user);
              const defaultTab = getDefaultTabForRole(user.role);
              setActiveTab(defaultTab as Tab);
              window.location.hash = '#/app';
            }}
            onOpenPublicVerification={(uuid) => {
              const targetUuid = uuid || 'cred-sample-jss1-001';
              window.location.hash = `/verify-credential/${targetUuid}`;
              setPublicVerificationUuid(targetUuid);
            }}
            defaultStartingScreen={defaultStartScreen}
            onSetDefaultStartingScreen={handleUpdateDefaultStartScreen}
            savedUser={savedSessionUser}
            onResumeSession={savedSessionUser ? handleResumeSession : undefined}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors relative overflow-x-hidden w-full max-w-full"
        >
          {/* Ambient Glassmorphism Luminous Glow Backdrops */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            <div className="absolute -top-[12%] -left-[8%] w-[50vw] h-[50vw] max-w-[620px] max-h-[620px] rounded-full bg-gradient-to-br from-indigo-400/18 via-sky-400/12 to-transparent dark:from-indigo-600/16 dark:via-purple-600/10 dark:to-transparent blur-3xl" />
            <div className="absolute top-[28%] -right-[12%] w-[48vw] h-[48vw] max-w-[580px] max-h-[580px] rounded-full bg-gradient-to-bl from-emerald-400/15 via-teal-300/10 to-transparent dark:from-emerald-600/12 dark:via-cyan-600/08 dark:to-transparent blur-3xl" />
            <div className="absolute -bottom-[12%] left-[18%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-tr from-blue-400/14 via-indigo-300/10 to-transparent dark:from-indigo-900/18 dark:via-blue-900/10 dark:to-transparent blur-3xl" />
          </div>

          {/* Offline Sync Banner */}
          <ServiceWorkerRegister currentUser={currentUser} onLogAudit={handleLogAudit} />

          {/* Main Top Header (Fully Responsive for Web PC and Mobile) */}
          <header className="sticky top-0 z-30 bg-white/78 dark:bg-slate-900/75 backdrop-blur-xl border-b border-white/60 dark:border-white/10 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
            <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
              {/* Left Brand */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all cursor-pointer shrink-0"
                  aria-label="Toggle Navigation Menu"
                  title="Open navigation menu (or swipe from left edge)"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <div
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0 active:scale-[0.98] transition-transform"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <School className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs sm:text-base tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      <span className="truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">Apex Horizon Academy</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none hidden sm:block">
                      School Management System
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Active Academic Session Indicator */}
              {allowedTabs.includes('sessions') && (
                <div
                  onClick={() => setActiveTab('sessions')}
                  className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/70 dark:border-slate-700/60 cursor-pointer hover:bg-white/85 dark:hover:bg-slate-700/70 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all shrink-0 shadow-2xs"
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
              )}

              {/* Global Search Bar */}
              <div className="flex-1 max-w-md mx-2 hidden md:block">
                <GlobalSearchBar
                  students={students}
                  onSelectStudent={(st) => {
                    setPublicVerifyStudent(st);
                  }}
                />
              </div>

              {/* Right Controls: Landing Page, Command Palette, Demo Badge, What's New, Notifications, Role Switcher, Theme, Sign Out */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Landing Page Link */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('landing');
                    setCurrentUser(null);
                    window.location.hash = '#/landing';
                  }}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50/70 dark:bg-indigo-950/50 backdrop-blur-md border border-indigo-200/70 dark:border-indigo-800/70 rounded-xl shadow-2xs hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 transition-all cursor-pointer"
                  title="View Public Landing Page"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden xl:inline text-[11px] font-semibold">Landing Page</span>
                </button>

                {/* Command Palette Button */}
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-white/85 dark:hover:bg-slate-700/70 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 border border-white/70 dark:border-slate-700/60 rounded-xl shadow-2xs transition-all cursor-pointer"
                  title="Open Command Palette (Ctrl+K)"
                >
                  <Command className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden xl:inline text-[11px] font-medium">Quick Actions</span>
                  <kbd className="hidden sm:inline px-1 py-0.5 text-[9px] font-mono font-semibold bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 rounded text-slate-500">
                    ⌘K
                  </kbd>
                </button>

                {/* Demo Mode Badge */}
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/60 backdrop-blur-md border border-amber-200/80 dark:border-amber-800/80 rounded-full hover:bg-amber-100/90 dark:hover:bg-amber-900/70 active:bg-amber-100/70 dark:active:bg-amber-900/80 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  title="Prototype Demonstration Mode - Click for details"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Demo Mode</span>
                </button>

                {/* What's New Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setWhatsNewOpen(true)}
                  className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all cursor-pointer relative"
                  title="What's New & System Releases"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
                </button>

                {/* Offline Status & Sync Manager Trigger */}
                <button
                  type="button"
                  onClick={() => setOfflineDrawerOpen(true)}
                  className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                    activeConflicts.length > 0
                      ? 'bg-rose-50/80 dark:bg-rose-950/60 backdrop-blur-md text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 active:bg-rose-100 animate-pulse'
                      : !isOnline
                      ? 'bg-amber-50/80 dark:bg-amber-950/60 backdrop-blur-md text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 active:bg-amber-100'
                      : offlineQueue.length > 0
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 backdrop-blur-md text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 active:bg-blue-100'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/60 dark:bg-slate-800/60 backdrop-blur-md active:bg-slate-200/50 dark:active:bg-slate-700/50 border border-white/70 dark:border-slate-700/60'
                  }`}
                  title={
                    activeConflicts.length > 0
                      ? `${activeConflicts.length} active sync conflict(s) require review`
                      : !isOnline
                      ? `Offline mode active (${offlineQueue.length} queued writes)`
                      : offlineQueue.length > 0
                      ? `${offlineQueue.length} offline change(s) pending sync`
                      : 'Offline Sync & Network Engine: Online & Synced'
                  }
                >
                  {activeConflicts.length > 0 ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span className="hidden sm:inline font-bold text-rose-700 dark:text-rose-300">
                        {activeConflicts.length} Conflict{activeConflicts.length > 1 ? 's' : ''}
                      </span>
                    </>
                  ) : !isOnline ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="hidden sm:inline text-amber-700 dark:text-amber-300">
                        Offline {offlineQueue.length > 0 ? `(${offlineQueue.length})` : ''}
                      </span>
                    </>
                  ) : offlineQueue.length > 0 ? (
                    <>
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline text-blue-700 dark:text-blue-300">
                        {offlineQueue.length} Pending
                      </span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="hidden xl:inline text-[11px] text-slate-500">Synced</span>
                    </>
                  )}
                </button>

                {/* Notification Center */}
                <NotificationCenter
                  onNavigateTab={(tab) => {
                    if (allowedTabs.includes(tab as TabId)) {
                      setActiveTab(tab as Tab);
                    }
                  }}
                />

                {/* Persona Switcher */}
                <RoleSwitcher
                  currentUser={currentUser}
                  onSelectUser={(u) => {
                    setCurrentUser(u);
                    handleLogAudit('ROLE_SWITCH', `Switched active user to ${u.name} (${u.role})`);
                    const defTab = getDefaultTabForRole(u.role);
                    setActiveTab(defTab as Tab);
                  }}
                  onRoleChange={(role) => {
                    setCurrentUser((prev) => (prev ? { ...prev, role } : null));
                    handleLogAudit('ROLE_SWITCH', `Switched active role to ${role}`);
                    const defTab = getDefaultTabForRole(role);
                    setActiveTab(defTab as Tab);
                  }}
                />

                <ThemeToggle className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/70 dark:border-slate-700/60 shadow-2xs" />

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100/70 dark:hover:bg-rose-900/50 active:bg-rose-100 dark:active:bg-rose-900/80 active:scale-95 border border-rose-200/70 dark:border-rose-900/60 rounded-xl backdrop-blur-xs transition-all cursor-pointer shadow-2xs"
                  title="Sign out of current account (Ctrl+Shift+L)"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </header>

            {/* Mobile Navigation Drawer with Swipe-to-Dismiss */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md"
                  />

                  {/* Sliding Drawer Panel with Gesture Dismiss */}
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    drag="x"
                    dragConstraints={{ left: -320, right: 0 }}
                    dragElastic={0.08}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x < -50 || info.velocity.x < -150) {
                        setMobileMenuOpen(false);
                      }
                    }}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      drawerTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
                    }}
                    onTouchEnd={(e) => {
                      if (!drawerTouchStartRef.current) return;
                      const deltaX = e.changedTouches[0].clientX - drawerTouchStartRef.current.x;
                      const deltaY = e.changedTouches[0].clientY - drawerTouchStartRef.current.y;
                      drawerTouchStartRef.current = null;
                      if (deltaX < -50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className="relative w-80 max-w-[85vw] h-full bg-white/88 dark:bg-slate-900/85 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] flex flex-col z-10 border-r border-white/70 dark:border-white/10"
                  >
                    {/* Drawer Header */}
                    <div className="p-4 border-b border-white/60 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <School className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                            Apex Horizon Academy
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {currentSession.year} • {activeTerm?.name || 'Active'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ThemeToggle className="w-8 h-8" />
                        <button
                          type="button"
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all cursor-pointer"
                          aria-label="Close navigation"
                          title="Close menu (or swipe left)"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Swipe-to-Close Gesture Tip */}
                    <div className="px-4 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                      <span>Swipe left or drag to close</span>
                      <ChevronLeft className="w-3.5 h-3.5 animate-pulse" />
                    </div>

                    {/* Persona & Dual-Role Switcher inside drawer */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Active Persona & Roles
                      </div>
                      <RoleSwitcher
                        currentUser={currentUser}
                        showDualRoleInHeader={true}
                        onSelectUser={(u) => {
                          setCurrentUser(u);
                          handleLogAudit('ROLE_SWITCH', `Switched active user to ${u.name} (${u.role})`);
                          const defTab = getDefaultTabForRole(u.role);
                          setActiveTab(defTab as Tab);
                          setMobileMenuOpen(false);
                        }}
                        onRoleChange={(role) => {
                          setCurrentUser((prev) => (prev ? { ...prev, role } : null));
                          handleLogAudit('ROLE_SWITCH', `Switched active role to ${role}`);
                          const defTab = getDefaultTabForRole(role);
                          setActiveTab(defTab as Tab);
                          setMobileMenuOpen(false);
                        }}
                      />
                    </div>

                    {/* Global Search inside drawer */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                      <GlobalSearchBar
                        students={students}
                        onSelectStudent={(st) => {
                          setPublicVerifyStudent(st);
                          setMobileMenuOpen(false);
                        }}
                      />
                    </div>

                    {/* Navigation Items (Scrollable) */}
                    <div className="flex-1 overflow-y-auto touch-scroll p-3 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Navigation ({allowedTabs.length} modules)
                      </div>

                {allowedTabs.includes('dashboard') && (
                  <SidebarNavItem
                    icon={LayoutDashboard}
                    label="Executive Dashboard"
                    isActive={activeTab === 'dashboard'}
                    onClick={() => {
                      setActiveTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                  />
                )}
                {allowedTabs.includes('admissions') && (
                  <SidebarNavItem
                    icon={UserPlus}
                    label="Admission & Enrollment"
                    isActive={activeTab === 'admissions'}
                    onClick={() => {
                      setActiveTab('admissions');
                      setMobileMenuOpen(false);
                    }}
                    badge="Pipeline"
                    badgeVariant="success"
                  />
                )}
                {allowedTabs.includes('students') && (
                  <SidebarNavItem
                    icon={Users}
                    label="Student Records & Attendance"
                    isActive={activeTab === 'students'}
                    onClick={() => {
                      setActiveTab('students');
                      setMobileMenuOpen(false);
                    }}
                    badge={`${students.length} Records`}
                    badgeVariant="primary"
                  />
                )}
                {allowedTabs.includes('sessions') && (
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
                )}
                {allowedTabs.includes('class-structure') && (
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
                )}
                {allowedTabs.includes('timetables') && (
                  <SidebarNavItem
                    icon={Calendar}
                    label="Class Timetables"
                    isActive={activeTab === 'timetables'}
                    onClick={() => {
                      setActiveTab('timetables');
                      setMobileMenuOpen(false);
                    }}
                    badge="Admin-Owned"
                    badgeVariant="primary"
                  />
                )}
                {allowedTabs.includes('teacher-timetable') && (
                  <SidebarNavItem
                    icon={Clock}
                    label="Teacher Timetables"
                    isActive={activeTab === 'teacher-timetable'}
                    onClick={() => {
                      setActiveTab('teacher-timetable');
                      setMobileMenuOpen(false);
                    }}
                    badge="Private Plan"
                    badgeVariant="success"
                  />
                )}
                {allowedTabs.includes('assessments') && (
                  <SidebarNavItem
                    icon={GraduationCap}
                    label="Exam & CA Schedules"
                    isActive={activeTab === 'assessments'}
                    onClick={() => {
                      setActiveTab('assessments');
                      setMobileMenuOpen(false);
                    }}
                    badge="CA / Exam"
                    badgeVariant="primary"
                  />
                )}
                {allowedTabs.includes('gradebook') && (
                  <SidebarNavItem
                    icon={FileSpreadsheet}
                    label="Teacher Gradebook"
                    isActive={activeTab === 'gradebook'}
                    onClick={() => {
                      setActiveTab('gradebook');
                      setMobileMenuOpen(false);
                    }}
                    badge="Scores"
                    badgeVariant="success"
                  />
                )}
                {allowedTabs.includes('student-portal') && (
                  <SidebarNavItem
                    icon={GraduationCap}
                    label="Student Portal"
                    isActive={activeTab === 'student-portal'}
                    onClick={() => {
                      setActiveTab('student-portal');
                      setMobileMenuOpen(false);
                    }}
                    badge="Results & Feed"
                    badgeVariant="primary"
                  />
                )}
                {allowedTabs.includes('parent-portal') && (
                  <SidebarNavItem
                    icon={Users}
                    label="Parent & Guardian Portal"
                    isActive={activeTab === 'parent-portal'}
                    onClick={() => {
                      setActiveTab('parent-portal');
                      setMobileMenuOpen(false);
                    }}
                    badge="Multi-Child"
                    badgeVariant="primary"
                  />
                )}
                {allowedTabs.includes('messages') && (
                  <SidebarNavItem
                    icon={MessageSquare}
                    label="Communications Hub"
                    isActive={activeTab === 'messages'}
                    onClick={() => {
                      setActiveTab('messages');
                      setMobileMenuOpen(false);
                    }}
                    badge="SMS Guard"
                    badgeVariant="success"
                  />
                )}
                {allowedTabs.includes('fees') && (
                  <SidebarNavItem
                    icon={CreditCard}
                    label="Fees & Payments"
                    isActive={activeTab === 'fees'}
                    onClick={() => {
                      setActiveTab('fees');
                      setMobileMenuOpen(false);
                    }}
                    badge="Billing"
                    badgeVariant="success"
                  />
                )}
                {allowedTabs.includes('disciplinary') && (
                  <SidebarNavItem
                    icon={ShieldAlert}
                    label="Disciplinary Records"
                    isActive={activeTab === 'disciplinary'}
                    onClick={() => {
                      setActiveTab('disciplinary');
                      setMobileMenuOpen(false);
                    }}
                    badge="Private"
                    badgeVariant="warning"
                  />
                )}
                {allowedTabs.includes('suggestions') && (
                  <SidebarNavItem
                    icon={Sparkles}
                    label="AI Suggestion Box"
                    isActive={activeTab === 'suggestions'}
                    onClick={() => {
                      setActiveTab('suggestions');
                      setMobileMenuOpen(false);
                    }}
                    badge="AI Sorted"
                    badgeVariant="primary"
                  />
                )}
                {allowedTabs.includes('payroll') && (
                  <SidebarNavItem
                    icon={Banknote}
                    label="Staff Payroll & Payslips"
                    isActive={activeTab === 'payroll'}
                    onClick={() => {
                      setActiveTab('payroll');
                      setMobileMenuOpen(false);
                    }}
                    badge="₦ Net"
                    badgeVariant="success"
                  />
                )}
                {allowedTabs.includes('backup') && (
                  <SidebarNavItem
                    icon={Database}
                    label="Data Export & Backup"
                    isActive={activeTab === 'backup'}
                    onClick={() => {
                      setActiveTab('backup');
                      setMobileMenuOpen(false);
                    }}
                    badge="Admin"
                    badgeVariant="warning"
                  />
                )}
                {allowedTabs.includes('data-migration') && (
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
                )}
                {allowedTabs.includes('design-system') && (
                  <SidebarNavItem
                    icon={Palette}
                    label="Design System Library"
                    isActive={activeTab === 'design-system'}
                    onClick={() => {
                      setActiveTab('design-system');
                      setMobileMenuOpen(false);
                    }}
                  />
                )}

                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="p-3 border-t border-white/60 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md space-y-2">
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/70 dark:border-slate-700/60 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Theme Mode</span>
                        <ThemeToggle className="w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/70 dark:border-slate-700/60 shadow-2xs" />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWhatsNewOpen(true);
                            setMobileMenuOpen(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 active:bg-indigo-100 dark:active:bg-indigo-900/60 active:scale-95 transition-all cursor-pointer backdrop-blur-xs shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>What's New</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOfflineDrawerOpen(true);
                            setMobileMenuOpen(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-white/70 dark:border-slate-700/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all cursor-pointer backdrop-blur-xs shadow-2xs"
                        >
                          {offlineQueue.length > 0 ? (
                            <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                          ) : (
                            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span>Sync ({offlineQueue.length})</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAuthView('landing');
                          setCurrentUser(null);
                          window.location.hash = '#/landing';
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 backdrop-blur-xs transition-all cursor-pointer shadow-2xs"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Public Landing Page</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100/70 dark:hover:bg-rose-900/50 active:bg-rose-100 dark:active:bg-rose-900/80 active:scale-95 border border-rose-200/70 dark:border-rose-900/60 backdrop-blur-xs transition-all cursor-pointer shadow-2xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.aside>
                </div>
              )}
            </AnimatePresence>

          {/* Mobile Tab Swipe Header & Quick Selector */}
          <div className="md:hidden sticky top-16 z-20 bg-white/78 dark:bg-slate-900/75 backdrop-blur-xl border-b border-white/60 dark:border-white/10 px-3 py-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              {/* Previous Tab Button */}
              <button
                type="button"
                onClick={() => prevTab && setActiveTab(prevTab as Tab)}
                disabled={!prevTab}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-xl border transition-all cursor-pointer ${
                  prevTab
                    ? 'text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/70 dark:border-slate-700/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 shadow-2xs'
                    : 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
                }`}
                aria-label="Previous Tab"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="truncate max-w-[70px] xs:max-w-[90px]">{prevTab ? TAB_LABELS[prevTab] || prevTab : 'Prev'}</span>
              </button>

              {/* Current Tab Indicator */}
              <div className="flex flex-col items-center min-w-0 px-1 text-center">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px] xs:max-w-[170px]">
                  {TAB_LABELS[activeTab] || activeTab}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-medium">
                  <span>{currentTabIndex + 1} of {allowedTabs.length}</span>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Swipe ⇄</span>
                </div>
              </div>

              {/* Next Tab Button */}
              <button
                type="button"
                onClick={() => nextTab && setActiveTab(nextTab as Tab)}
                disabled={!nextTab}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-xl border transition-all cursor-pointer ${
                  nextTab
                    ? 'text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/70 dark:border-slate-700/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 shadow-2xs'
                    : 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
                }`}
                aria-label="Next Tab"
              >
                <span className="truncate max-w-[70px] xs:max-w-[90px]">{nextTab ? TAB_LABELS[nextTab] || nextTab : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Edge Swipe Hint Tab (Mobile screen left edge) */}
          <div
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-indigo-600/90 text-white p-1 rounded-r-md shadow-md opacity-40 hover:opacity-100 active:opacity-100 active:scale-90 active:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center"
            title="Swipe right or tap to open menu"
            aria-label="Open Navigation Menu"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </div>

          {/* Transient Visual Gesture Feedback Overlay */}
          <AnimatePresence>
            {swipeFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: swipeFeedback === 'left' ? 40 : -40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: swipeFeedback === 'left' ? -40 : 40 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold"
              >
                {swipeFeedback === 'left' ? (
                  <>
                    <span>Next: {TAB_LABELS[activeTab] || activeTab}</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
                    <span>Prev: {TAB_LABELS[activeTab] || activeTab}</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub Navigation Bar for Desktop PC */}
          <nav className="hidden md:block bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border-b border-white/60 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-12 text-sm overflow-x-auto no-scrollbar whitespace-nowrap">
              {allowedTabs.includes('dashboard') && (
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
              )}

              {allowedTabs.includes('admissions') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('admissions')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'admissions'
                      ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Admissions</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    Pipeline
                  </span>
                </button>
              )}

              {allowedTabs.includes('students') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'students'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Student Records</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                    {students.length}
                  </span>
                </button>
              )}

              {allowedTabs.includes('sessions') && (
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
              )}

              {allowedTabs.includes('class-structure') && (
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
              )}

              {allowedTabs.includes('timetables') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('timetables')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'timetables'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Class Timetables</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                    Admin
                  </span>
                </button>
              )}

              {allowedTabs.includes('teacher-timetable') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('teacher-timetable')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'teacher-timetable'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Teacher Timetable</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    Private
                  </span>
                </button>
              )}

              {allowedTabs.includes('assessments') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('assessments')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'assessments'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Exam Schedules</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-semibold">
                    Gated
                  </span>
                </button>
              )}

              {allowedTabs.includes('gradebook') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('gradebook')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'gradebook'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Gradebook</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    Marks
                  </span>
                </button>
              )}

              {allowedTabs.includes('student-portal') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('student-portal')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'student-portal'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Portal</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                    Results
                  </span>
                </button>
              )}

              {allowedTabs.includes('parent-portal') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('parent-portal')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'parent-portal'
                      ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Parent Portal</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">
                    Multi-Child
                  </span>
                </button>
              )}

              {allowedTabs.includes('messages') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'messages'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Communications</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                    SMS Guard
                  </span>
                </button>
              )}

              {allowedTabs.includes('fees') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('fees')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'fees'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Fees & Payments</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    ₦ Ledger
                  </span>
                </button>
              )}

              {allowedTabs.includes('disciplinary') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('disciplinary')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'disciplinary'
                      ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Disciplinary Log</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                    Private
                  </span>
                </button>
              )}

              {allowedTabs.includes('suggestions') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('suggestions')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'suggestions'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Suggestion Box</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                    AI Sorted
                  </span>
                </button>
              )}

              {allowedTabs.includes('payroll') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('payroll')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'payroll'
                      ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Staff Payroll</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    ₦ Net
                  </span>
                </button>
              )}

              {allowedTabs.includes('backup') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('backup')}
                  className={`h-full border-b-2 font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'backup'
                      ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Backup & Export</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">
                    SHA-256
                  </span>
                </button>
              )}

              {allowedTabs.includes('data-migration') && (
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
              )}

              {allowedTabs.includes('design-system') && (
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
              )}
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-8 w-full">
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

            {activeTab === 'admissions' && (
              <AdmissionsPage
                levels={levels}
                onLevelsUpdate={setLevels}
                currentSession={currentSession}
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'students' && (
              <StudentDirectoryPage
                students={students}
                levels={levels}
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
                onRefreshStudents={refreshStudents}
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

            {activeTab === 'timetables' && (
              <ClassTimetablePage
                levels={levels}
                userRole={currentUser.role}
                onLogAudit={handleLogAudit}
                onNavigateToTeacherTimetable={() => setActiveTab('teacher-timetable')}
              />
            )}

            {activeTab === 'teacher-timetable' && (
              <TeacherPersonalTimetablePage
                levels={levels}
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'assessments' && (
              <AssessmentSchedulePage
                levels={levels}
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
                onNavigateToGradebook={() => setActiveTab('gradebook')}
              />
            )}

            {activeTab === 'gradebook' && (
              <GradebookPage
                levels={levels}
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
                onNavigateToAssessments={() => setActiveTab('assessments')}
                onOpenPublicVerification={(uuid) => {
                  window.location.hash = `/verify-credential/${uuid}`;
                  setPublicVerificationUuid(uuid);
                }}
              />
            )}

            {activeTab === 'student-portal' && (
              <StudentPortalPage
                students={students}
                currentUser={currentUser}
                onOpenPublicVerification={(uuid) => {
                  window.location.hash = `/verify-credential/${uuid}`;
                  setPublicVerificationUuid(uuid);
                }}
              />
            )}

            {activeTab === 'parent-portal' && (
              <ParentPortalPage
                currentUser={currentUser}
                allStudents={students}
                onOpenReportCardModal={(student) => {
                  const allReports = getAllPublishedReportCards();
                  const report = allReports.find(
                    (r) => r.studentId === student.id || r.studentRegNumber === student.admissionNumber
                  );
                  if (report) {
                    window.location.hash = `/verify-credential/${report.credentialUuid}`;
                    setPublicVerificationUuid(report.credentialUuid);
                  } else {
                    alert(`Report card for ${student.firstName} ${student.lastName} will be accessible upon final term sign-off.`);
                  }
                }}
                onOpenMessagingTab={() => {
                  setActiveTab('messages');
                }}
              />
            )}

            {activeTab === 'messages' && (
              <CommunicationsHubPage
                currentUser={currentUser}
                levels={levels}
                allStudents={students}
              />
            )}

            {activeTab === 'fees' && (
              <FeeManagementPage
                levels={levels}
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'disciplinary' && (
              <DisciplinaryLogPage
                currentUser={currentUser}
                allStudents={students}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'suggestions' && (
              <SuggestionBoxPage
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'payroll' && (
              <PayrollPage
                currentUser={currentUser}
                onLogAudit={handleLogAudit}
              />
            )}

            {activeTab === 'backup' && (
              <DataExportBackupPage
                currentUser={currentUser}
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

          {/* Direct Public Credential QR Verification Modal */}
          {publicVerifyStudent && (
            <StudentCredentialModal
              isOpen={!!publicVerifyStudent}
              onClose={() => {
                setPublicVerifyStudent(null);
                if (window.location.hash.includes('/verify-credential/')) {
                  window.location.hash = '';
                }
              }}
              student={publicVerifyStudent}
            />
          )}

          {/* Global Command Palette Modal */}
          <CommandPaletteModal
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            userRole={currentUser.role}
            onNavigateTab={(tab) => {
              if (allowedTabs.includes(tab as TabId)) {
                setActiveTab(tab as Tab);
              }
            }}
            onLogout={handleLogout}
          />

          {/* What's New Drawer */}
          <WhatsNewDrawer
            isOpen={whatsNewOpen}
            onClose={() => setWhatsNewOpen(false)}
          />

          {/* Demo Mode Info Modal */}
          <DemoModeInfoModal
            isOpen={demoModalOpen}
            onClose={() => setDemoModalOpen(false)}
            onOpenWhatsNew={() => {
              setDemoModalOpen(false);
              setWhatsNewOpen(true);
            }}
          />

          {/* Offline Queue & Conflict Resolution Drawer */}
          <OfflineQueueDrawer
            isOpen={offlineDrawerOpen}
            onClose={() => setOfflineDrawerOpen(false)}
            currentUser={currentUser}
            onLogAudit={handleLogAudit}
            onConflictResolved={() => {
              refreshStudents();
              setActiveConflicts(getActiveConflicts());
              setOfflineQueue(getOfflineQueue());
            }}
          />

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                Apex Horizon Academy • Unified School Management Platform
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOfflineDrawerOpen(true)}
                  className="font-mono text-[11px] hover:underline cursor-pointer flex items-center gap-1.5"
                  title="Open Offline Queue & Conflict Center"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeConflicts.length > 0
                        ? 'bg-rose-500 animate-ping'
                        : !isOnline
                        ? 'bg-amber-500'
                        : offlineQueue.length > 0
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>
                    {activeConflicts.length > 0
                      ? `${activeConflicts.length} Conflict(s) Require Review`
                      : !isOnline
                      ? `Offline Mode (${offlineQueue.length} queued)`
                      : offlineQueue.length > 0
                      ? `${offlineQueue.length} Pending Sync`
                      : 'System Status: Online & Synced'}
                  </span>
                </button>
                <span>•</span>
                <span>Active Role: {currentUser.title}</span>
              </div>
            </div>
          </footer>

          {/* Mobile Fixed Glassmorphism Bottom Navigation Dock */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border-t border-white/70 dark:border-white/10 px-2 py-1 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            {allowedTabs.includes('dashboard') && (
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">Dashboard</span>
              </button>
            )}

            {allowedTabs.includes('students') ? (
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'students'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">Students</span>
              </button>
            ) : allowedTabs.includes('gradebook') ? (
              <button
                type="button"
                onClick={() => setActiveTab('gradebook')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'gradebook'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">Gradebook</span>
              </button>
            ) : allowedTabs.includes('parent-portal') ? (
              <button
                type="button"
                onClick={() => setActiveTab('parent-portal')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'parent-portal'
                    ? 'text-rose-600 dark:text-rose-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">Children</span>
              </button>
            ) : null}

            {allowedTabs.includes('timetables') ? (
              <button
                type="button"
                onClick={() => setActiveTab('timetables')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'timetables'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">Timetable</span>
              </button>
            ) : allowedTabs.includes('teacher-timetable') ? (
              <button
                type="button"
                onClick={() => setActiveTab('teacher-timetable')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'teacher-timetable'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">My Plan</span>
              </button>
            ) : allowedTabs.includes('fees') ? (
              <button
                type="button"
                onClick={() => setActiveTab('fees')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'fees'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">Fees</span>
              </button>
            ) : null}

            {allowedTabs.includes('messages') && (
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'messages'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 leading-none">Messages</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 leading-none">Menu ({allowedTabs.length})</span>
            </button>
          </div>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
