import React, { useState } from 'react';
import {
  School,
  LayoutDashboard,
  Calendar,
  Layers,
  Palette,
  Bell,
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
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Search,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, AcademicSession, Term, OfflineQueueItem, CellConflict } from '../../types';
import { TabId } from '../../lib/auth-store';
import { ThemeToggle } from '../../design-system/components/ThemeToggle';
import { RoleSwitcher } from '../RoleSwitcher';
import { NotificationCenter } from './NotificationCenter';
import { FormFactorSwitcher } from './FormFactorSwitcher';
import {
  FormFactorMode,
  FormFactorType,
  NavLayoutMode,
  EffectiveNavLayout,
} from '../../lib/form-factor-store';

export type Tab =
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

interface NavItemDef {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  category: 'core' | 'academics' | 'admin' | 'portals';
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, category: 'core' },
  { id: 'admissions', label: 'Admissions Pipeline', icon: UserPlus, badge: 'Pipeline', badgeVariant: 'success', category: 'core' },
  { id: 'students', label: 'Student Records', icon: Users, badge: 'Dossiers', badgeVariant: 'primary', category: 'core' },
  { id: 'sessions', label: 'Academic Sessions', icon: Calendar, category: 'academics' },
  { id: 'class-structure', label: 'Class Structure', icon: Layers, category: 'academics' },
  { id: 'timetables', label: 'Class Timetables', icon: Calendar, badge: 'Admin', badgeVariant: 'primary', category: 'academics' },
  { id: 'teacher-timetable', label: 'Teacher Timetables', icon: Clock, badge: 'Private', badgeVariant: 'success', category: 'academics' },
  { id: 'assessments', label: 'Exam & CA Schedules', icon: GraduationCap, category: 'academics' },
  { id: 'gradebook', label: 'Teacher Gradebook', icon: FileSpreadsheet, badge: 'Scores', badgeVariant: 'success', category: 'academics' },
  { id: 'student-portal', label: 'Student Portal', icon: GraduationCap, badge: 'Results', category: 'portals' },
  { id: 'parent-portal', label: 'Parent Portal', icon: Users, badge: 'Multi-Child', badgeVariant: 'danger', category: 'portals' },
  { id: 'messages', label: 'Communications Hub', icon: MessageSquare, badge: 'SMS Guard', category: 'portals' },
  { id: 'fees', label: 'Fees & Invoicing', icon: CreditCard, badge: 'Ledgers', category: 'admin' },
  { id: 'disciplinary', label: 'Disciplinary Log', icon: ShieldAlert, category: 'admin' },
  { id: 'suggestions', label: 'Suggestion Box', icon: MessageSquare, category: 'admin' },
  { id: 'payroll', label: 'Staff Payroll', icon: Banknote, badge: '₦ Net', badgeVariant: 'success', category: 'admin' },
  { id: 'backup', label: 'Data Backup', icon: Database, badge: 'SHA-256', badgeVariant: 'danger', category: 'admin' },
  { id: 'data-migration', label: 'Data Migration', icon: UploadCloud, badge: 'CSV/Excel', category: 'admin' },
  { id: 'design-system', label: 'Design System', icon: Palette, category: 'admin' },
];

interface SideDuoBarProps {
  currentUser: UserProfile;
  activeTab: Tab;
  allowedTabs: TabId[];
  onSelectTab: (tab: Tab) => void;
  currentSession: AcademicSession;
  activeTerm?: Term;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSearch: () => void;
  onOpenCommandPalette: () => void;
  onOpenWhatsNew: () => void;
  onOpenDemoModal: () => void;
  onOpenOfflineDrawer: () => void;
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  activeConflicts: CellConflict[];
  isSyncing: boolean;
  onRoleSwitch: (role: UserProfile['role']) => void;
  onUserSwitch: (user: UserProfile) => void;
  onLogout: () => void;
  // Form factor props
  formFactorMode: FormFactorMode;
  detectedFormFactor: FormFactorType;
  effectiveFormFactor: FormFactorType;
  aspectRatio: number;
  width: number;
  height: number;
  navLayoutPreference: NavLayoutMode;
  effectiveNavLayout: EffectiveNavLayout;
  onSelectFormFactorMode: (mode: FormFactorMode) => void;
  onSelectNavLayout: (layout: NavLayoutMode) => void;
  simulateDeviceFrame?: boolean;
  onToggleDeviceFrame?: (enabled: boolean) => void;
}

export const SideDuoBar: React.FC<SideDuoBarProps> = ({
  currentUser,
  activeTab,
  allowedTabs,
  onSelectTab,
  currentSession,
  activeTerm,
  isCollapsed,
  onToggleCollapse,
  onOpenSearch,
  onOpenCommandPalette,
  onOpenWhatsNew,
  onOpenDemoModal,
  onOpenOfflineDrawer,
  isOnline,
  offlineQueue,
  activeConflicts,
  isSyncing,
  onRoleSwitch,
  onUserSwitch,
  onLogout,
  formFactorMode,
  detectedFormFactor,
  effectiveFormFactor,
  aspectRatio,
  width,
  height,
  navLayoutPreference,
  effectiveNavLayout,
  onSelectFormFactorMode,
  onSelectNavLayout,
  simulateDeviceFrame,
  onToggleDeviceFrame,
}) => {
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    allowedTabs.includes(item.id as TabId)
  );

  return (
    <aside
      className={`sticky top-0 h-screen z-40 bg-white/72 dark:bg-slate-900/72 backdrop-blur-2xl border-r border-white/75 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] transition-all duration-200 ease-in-out flex flex-col shrink-0 select-none ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
      aria-label="iPhone Duo-Style Navigation Rail"
    >
      {/* 1. Header / School Identity & Session */}
      <div className="p-3 border-b border-white/60 dark:border-white/10 flex items-center justify-between gap-2 shrink-0 bg-white/35 dark:bg-slate-800/35 backdrop-blur-xs">
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer min-w-0 active:scale-95 transition-transform"
          title="Apex Horizon Academy - Go to Dashboard"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)] border border-indigo-400/30 shrink-0">
            <School className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                Apex Horizon
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{currentSession.year}</span>
                <span>•</span>
                <span className="truncate">{activeTerm?.name || 'Active'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/80 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-90 transition-all cursor-pointer shrink-0"
          title={isCollapsed ? 'Expand side navigation' : 'Collapse to icon rail'}
          aria-label={isCollapsed ? 'Expand side navigation' : 'Collapse to icon rail'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Quick Actions & Search Controls */}
      <div className="p-2 border-b border-white/50 dark:border-white/8 space-y-1.5 shrink-0 bg-white/20 dark:bg-slate-800/20 backdrop-blur-xs">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-10 h-10 rounded-xl bg-white/65 dark:bg-slate-800/65 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/90 dark:hover:bg-slate-700/80 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 flex items-center justify-center border border-white/70 dark:border-slate-700/60 shadow-2xs transition-all cursor-pointer"
              title="Quick Actions & Command Palette (Ctrl+K)"
            >
              <Command className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-xl bg-white/65 dark:bg-slate-800/65 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/90 dark:hover:bg-slate-700/80 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 flex items-center justify-center border border-white/70 dark:border-slate-700/60 shadow-2xs transition-all cursor-pointer"
              title="Global Search (Students, Classes, Records)"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-white/85 dark:hover:bg-slate-700/70 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-[0.98] border border-white/70 dark:border-slate-700/60 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Command className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium">Quick Actions</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 rounded text-slate-500">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-[0.98] border border-white/60 dark:border-slate-700/70 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Search students, logs...</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Navigation Items Scrollable List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 no-scrollbar touch-scroll">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div key={item.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all cursor-pointer active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-[0.98] ${
                  isCollapsed
                    ? 'p-2.5 justify-center'
                    : 'px-3 py-2 justify-between'
                } ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-[0_4px_14px_rgba(99,102,241,0.35)] border border-indigo-500/80'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:border-white/50 dark:hover:border-white/10 border border-transparent font-medium'
                }`}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-xs truncate">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeVariant === 'success'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : item.badgeVariant === 'danger'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Flyout Tooltip when collapsed */}
              {isCollapsed && hoveredTab === item.id && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] opacity-75 font-normal">({item.badge})</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 4. Bottom System Controls Tray */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
        {/* Form Factor Switcher */}
        <div className={isCollapsed ? 'flex justify-center' : 'w-full'}>
          <FormFactorSwitcher
            currentMode={formFactorMode}
            detectedType={detectedFormFactor}
            effectiveType={effectiveFormFactor}
            aspectRatio={aspectRatio}
            width={width}
            height={height}
            navLayoutPreference={navLayoutPreference}
            effectiveNavLayout={effectiveNavLayout}
            onSelectMode={onSelectFormFactorMode}
            onSelectNavLayout={onSelectNavLayout}
            simulateDeviceFrame={simulateDeviceFrame}
            onToggleDeviceFrame={onToggleDeviceFrame}
            compact={isCollapsed}
          />
        </div>

        {/* Offline Sync Status Button */}
        <button
          type="button"
          onClick={onOpenOfflineDrawer}
          className={`w-full flex items-center gap-2 p-1.5 rounded-xl border transition-all cursor-pointer active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 ${
            isCollapsed ? 'justify-center' : 'px-2.5'
          } ${
            activeConflicts.length > 0
              ? 'bg-rose-50/80 dark:bg-rose-950/60 backdrop-blur-md text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
              : !isOnline
              ? 'bg-amber-50/80 dark:bg-amber-950/60 backdrop-blur-md text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : offlineQueue.length > 0
              ? 'bg-blue-50/80 dark:bg-blue-950/60 backdrop-blur-md text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
              : 'text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-white/70 dark:border-slate-700/70 hover:bg-white/85 dark:hover:bg-slate-800 shadow-2xs'
          }`}
          title={
            activeConflicts.length > 0
              ? `${activeConflicts.length} active sync conflict(s) require review`
              : !isOnline
              ? 'Offline mode active'
              : offlineQueue.length > 0
              ? `${offlineQueue.length} pending writes`
              : 'Network Synced'
          }
        >
          {activeConflicts.length > 0 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : !isOnline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : offlineQueue.length > 0 ? (
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          )}

          {!isCollapsed && (
            <span className="text-[11px] font-semibold truncate">
              {activeConflicts.length > 0
                ? `${activeConflicts.length} Conflict(s)`
                : !isOnline
                ? 'Offline'
                : offlineQueue.length > 0
                ? `${offlineQueue.length} Pending`
                : 'Online & Synced'}
            </span>
          )}
        </button>

        {/* Notifications & Persona & Theme & Demo */}
        <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}`}>
          <NotificationCenter onNavigateTab={(t) => onSelectTab(t as Tab)} />
          <ThemeToggle className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/70 dark:border-slate-700/60 shadow-2xs" />
          <button
            type="button"
            onClick={onOpenWhatsNew}
            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all cursor-pointer relative"
            title="What's New in this version"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenDemoModal}
            className="p-1.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-950/60 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 transition-all cursor-pointer"
            title="Demo Mode details"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
          </button>
        </div>

        {/* Persona Switcher row */}
        <div className={isCollapsed ? 'flex justify-center' : 'w-full'}>
          <RoleSwitcher
            currentUser={currentUser}
            onSelectUser={onUserSwitch}
            onRoleChange={onRoleSwitch}
            compact={isCollapsed}
          />
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-2 p-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100/70 dark:hover:bg-rose-900/50 active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 border border-rose-200/70 dark:border-rose-900/60 rounded-xl backdrop-blur-xs transition-all cursor-pointer ${
            isCollapsed ? 'justify-center' : 'px-2.5'
          }`}
          title="Sign out of current account (Ctrl+Shift+L)"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
