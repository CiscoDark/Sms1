import React, { useState } from 'react';
import {
  School,
  ShieldCheck,
  Lock,
  Calendar,
  Layers,
  GraduationCap,
  Users,
  CreditCard,
  MessageSquare,
  Sparkles,
  QrCode,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Wifi,
  Smartphone,
  Check,
  UserCheck,
  Menu,
  X,
  FileCheck,
  BookOpen,
  Award,
  Clock,
  ExternalLink,
  Shield,
  Zap,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../../design-system/components/ThemeToggle';
import { Button } from '../../design-system/components/Button';
import { UserProfile, Role } from '../../types';
import { DEMO_ACCOUNTS } from '../../lib/auth-store';

interface LandingPageProps {
  onEnterLogin: () => void;
  onDirectLoginAs: (user: UserProfile) => void;
  onOpenPublicVerification: (uuid?: string) => void;
  defaultStartingScreen?: 'landing' | 'login';
  onSetDefaultStartingScreen?: (screen: 'landing' | 'login') => void;
  savedUser?: UserProfile | null;
  onResumeSession?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterLogin,
  onDirectLoginAs,
  onOpenPublicVerification,
  defaultStartingScreen = 'landing',
  onSetDefaultStartingScreen,
  savedUser,
  onResumeSession,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'kpi' | 'timetable' | 'gradebook' | 'qr'>('kpi');

  // Filter public demo accounts (exclude super admin)
  const availablePersonas = DEMO_ACCOUNTS.filter((acc) => !acc.isSuperAdmin);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient Glassmorphic Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[12%] -left-[10%] w-[55vw] h-[55vw] max-w-[680px] max-h-[680px] rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-400/15 to-transparent dark:from-indigo-600/18 dark:via-purple-600/12 dark:to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[25%] -right-[12%] w-[50vw] h-[50vw] max-w-[620px] max-h-[620px] rounded-full bg-gradient-to-bl from-teal-400/18 via-emerald-300/12 to-transparent dark:from-emerald-600/15 dark:via-cyan-600/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-[10%] left-[25%] w-[55vw] h-[55vw] max-w-[680px] max-h-[680px] rounded-full bg-gradient-to-tr from-blue-500/18 via-indigo-400/12 to-transparent dark:from-indigo-900/22 dark:via-blue-900/12 dark:to-transparent blur-3xl" />
      </div>

      {/* 1. FLOATING GLASS NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-4">
        <div className="max-w-7xl mx-auto bg-white/78 dark:bg-slate-900/78 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/80 dark:border-white/10 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.35)] border border-indigo-400/30 shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <span>Apex Horizon</span>
                <span className="hidden xs:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Academy OS
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none hidden sm:block">
                Unified School Management System
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('invariants')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Architectural Security
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('modules')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Modules & Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('personas')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Role Personas
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('verification')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Public Verification</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Start Screen Switcher Segmented Control */}
            <div className="hidden sm:inline-flex items-center p-0.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-2xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs">
                <Globe className="w-3 h-3 text-indigo-500" />
                <span>Landing</span>
              </span>
              <button
                type="button"
                onClick={onEnterLogin}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                title="Switch to Direct Sign In screen"
              >
                <Lock className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            </div>

            {/* Default Start Screen Toggle */}
            {onSetDefaultStartingScreen && (
              <button
                type="button"
                onClick={() =>
                  onSetDefaultStartingScreen(defaultStartingScreen === 'landing' ? 'login' : 'landing')
                }
                className={`hidden xl:inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold border backdrop-blur-md transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  defaultStartingScreen === 'landing'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-white/70 dark:border-slate-700/60'
                }`}
                title="Toggle whether opening the site defaults to the Landing Page or Login Page"
              >
                <Check
                  className={`w-3 h-3 ${
                    defaultStartingScreen === 'landing' ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-30'
                  }`}
                />
                <span>
                  Start:{' '}
                  <strong>
                    {defaultStartingScreen === 'landing' ? 'Landing' : 'Login'}
                  </strong>
                </span>
              </button>
            )}

            <ThemeToggle className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/80 shadow-2xs" />

            <button
              type="button"
              onClick={() => onOpenPublicVerification('cred-sample-jss1-001')}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100/70 transition-all cursor-pointer shadow-2xs"
              title="Verify a sample student transcript credential without signing in"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Verify QR</span>
            </button>

            {savedUser && onResumeSession ? (
              <button
                type="button"
                onClick={onResumeSession}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                title={`Resume active session as ${savedUser.name}`}
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onEnterLogin}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-xl shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden mt-2 max-w-7xl mx-auto bg-white/92 dark:bg-slate-900/92 backdrop-blur-2xl rounded-2xl border border-white/80 dark:border-white/10 p-4 space-y-3 shadow-2xl"
            >
              <div className="flex flex-col space-y-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => scrollToSection('invariants')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Architectural Security (Postgres RLS)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('modules')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Modules & Platform Features
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('personas')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Role Personas (One-Click Launch)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    onOpenPublicVerification('cred-sample-jss1-001');
                  }}
                  className="text-left py-2 px-3 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center justify-between"
                >
                  <span>Public QR Credential Verification</span>
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setMobileNavOpen(false);
                    onEnterLogin();
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter Portal / Sign In
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-5 sm:space-y-6">
          {/* Top Trust Kicker */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-white/85 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Strict Tenant Isolation • Postgres Row-Level Security</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            The Unified Intelligence Platform for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-500 dark:from-indigo-400 dark:via-sky-300 dark:to-indigo-300">
              Modern Educational Excellence
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Purpose-built for academies and multi-school groups. Experience strict multi-tenant isolation,
            decoupled master timetables, temporal immutable report cards, and instant public QR verification.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={() => scrollToSection('personas')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-[0_10px_25px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Live Personas</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onEnterLogin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base border border-white/90 dark:border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In to Portal</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPublicVerification('cred-sample-jss1-001')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 backdrop-blur-xl hover:bg-emerald-100/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-200/80 dark:border-emerald-800/80 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-500" />
              <span>Verify Transcript QR</span>
            </button>
          </div>

          {/* Clean Unboxed Metadata Separators */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-3">
            <span>Postgres RLS Enforced</span>
            <span aria-hidden="true">·</span>
            <span>Decoupled Timetables</span>
            <span aria-hidden="true">·</span>
            <span>Temporal Immutability</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Leak QR Verifier</span>
            <span aria-hidden="true">·</span>
            <span>Offline-Ready PWA</span>
          </div>
        </div>

        {/* 3. INTERACTIVE HERO SHOWCASE CARD */}
        <div className="mt-10 sm:mt-14 max-w-5xl mx-auto">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/90 dark:border-white/10 p-3 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
            {/* Showcase Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  Live System Intelligence Deck
                </span>
              </div>

              {/* Segmented Control Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('kpi')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activePreviewTab === 'kpi'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Executive KPIs
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('timetable')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activePreviewTab === 'timetable'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Decoupled Timetable
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('gradebook')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activePreviewTab === 'gradebook'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Immutable Gradebook
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('qr')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activePreviewTab === 'qr'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Public QR Verifier
                </button>
              </div>
            </div>

            {/* Showcase Tab Panels */}
            <div className="pt-4 sm:pt-6">
              {activePreviewTab === 'kpi' && (
                <div className="space-y-4">
                  {/* KPI Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 to-slate-900/90 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                        Apex Horizon Academy • 2024/2025 First Term
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black mt-1">
                        Active Term In Full Operation
                      </h3>
                      <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                        100% Postgres RLS tenant enforcement active. 14 teaching weeks, automated grade calculations,
                        and decoupled timetable schedule in effect.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const principal = availablePersonas.find((p) => p.user.role === 'PRINCIPAL');
                        if (principal) onDirectLoginAs(principal.user);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 font-bold shrink-0"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Open Live Dashboard
                    </Button>
                  </div>

                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/80">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Enrolled</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">1,248</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">100% Verified RLS</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/80">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Daily Attendance</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">98.7%</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">Heatmap synced</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/80">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Term Fee Collection</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">₦48.2M</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">91% Reconciliation</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/80">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tenant Security</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">0 Leaks</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">app_user isolated</div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'timetable' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Architectural Invariant #2: Decoupled Engines
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Class Timetable vs. Teacher Personal Planning
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                        Admin-Owned Master
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                        Teacher Private Plan
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Class timetables are strictly managed by Academic Directors to prevent room and period conflicts.
                    Teachers maintain completely independent personal lesson plans and prep slots that never overwrite or collide with the school-wide master schedule.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-slate-100">Class Master Schedule</div>
                      <div className="text-[11px] text-slate-500 mt-1">Admin control • Grade-level synchronization</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-slate-100">Teacher Personal Timetable</div>
                      <div className="text-[11px] text-slate-500 mt-1">Private prep periods • Lesson objectives</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-slate-100">Period Conflict Engine</div>
                      <div className="text-[11px] text-slate-500 mt-1">Instant clash alerts • Room quota guards</div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'gradebook' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Architectural Invariant #3: Temporal Immutability
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Immutable Point-in-Time Report Card Snapshots
                      </h4>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold self-start sm:self-auto">
                      JSON Snapshot Frozen
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Once academic sessions advance or final term sign-off occurs, historical student report cards
                    and class names are preserved in frozen point-in-time JSON snapshots. If a student transitions from
                    JSS 1 to JSS 2, their historical JSS 1 report card remains permanently unchanged.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                    {`{ "snapshotId": "snap-2024-t1-stu-001", "session": "2024/2025", "term": "First Term", "class": "JSS 1 Gold", "average": 88.4, "status": "LOCKED" }`}
                  </div>
                </div>
              )}

              {activePreviewTab === 'qr' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Architectural Invariant #4: Public Zero-Leak Verification
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Sanitized QR Endpoint (/verify-credential/[uuid])
                      </h4>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenPublicVerification('cred-sample-jss1-001')}
                      className="border-emerald-500 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 text-xs shrink-0"
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Test Live Verification
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Anyone with a physical or digital transcript can scan the QR code to authenticate grades without signing in.
                    The endpoint strictly redacts all confidential data: <strong className="text-rose-600 dark:text-rose-400">zero guardian phone numbers, zero fee balances, zero disciplinary remarks</strong> are ever returned.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Student Marks</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>GPA / Grade Summary</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 flex items-center gap-1.5 font-semibold">
                      <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Fees Redacted</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 flex items-center gap-1.5 font-semibold">
                      <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Guardian Data Redacted</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. FIVE STRICT ARCHITECTURAL INVARIANTS SECTION */}
      <section id="invariants" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Architectural Invariants</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Engineered With Zero Security Compromises
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Adhering strictly to enterprise multi-tenant isolation, immutable snapshots, and decoupled timetables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Rule 1: Tenant Isolation */}
          <div className="p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Rule 1 • Tenant Isolation
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Postgres RLS Under 'app_user'
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every database query and table is guarded by Row-Level Security incorporating <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">school_id</code>. Cross-tenant leakage is mathematically impossible at the database layer.
            </p>
          </div>

          {/* Rule 2: Timetable Decoupling */}
          <div className="p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-600/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Rule 2 • Timetable Decoupling
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Admin & Teacher Separation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The class timetable (admin-owned master schedule) and teacher personal timetables are completely decoupled subsystems. Changes to personal teacher plans never distort school rosters.
            </p>
          </div>

          {/* Rule 3: Temporal Immutability */}
          <div className="p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Rule 3 • Temporal Immutability
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Point-in-Time Snapshots
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Historical report cards, class structures, and grade distributions use frozen point-in-time JSON snapshots. Advancing terms or modifying student profiles preserves past academic integrity.
            </p>
          </div>

          {/* Rule 4: Public Privacy Sanitization */}
          <div className="p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Rule 4 • Public Privacy
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Zero-Leak QR Verifier
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The public verification endpoint (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">/verify-credential/[uuid]</code>) exposes authenticated grades and signatures while strictly censoring fees, guardians, and conduct logs.
            </p>
          </div>

          {/* Rule 5: Fluid Ergonomics & Glassmorphism */}
          <div className="p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Rule 5 • UI & Aesthetics
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Glassmorphism & Fluid Mobile
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Off-white background (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">#F8FAFC</code>), frosted glass depth, Framer Motion transitions, shimmer loaders, and thumb-friendly mobile dock navigation.
            </p>
          </div>

          {/* Offline PWA Sync Engine */}
          <div className="p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Wifi className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Reliability • Offline PWA
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Offline Queue & Conflict Engine
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Continue recording attendance and grades in poor connectivity. Outbound updates queue locally and synchronize seamlessly with two-way conflict resolution upon reconnection.
            </p>
          </div>
        </div>
      </section>

      {/* 5. ROLE PERSONAS SECTION (ONE-CLICK DEMO LAUNCH) */}
      <section id="personas" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Interactive Persona Sandbox</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Experience Every Educational Role in 1 Click
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Select any persona below to authenticate instantly into the prototype and explore role-scoped capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {availablePersonas.map((persona) => {
            const role = persona.user.role;
            const roleLabel = role.replace('_', ' ');

            let icon = School;
            let badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300';
            let description = 'Oversees school-wide operations and term promotions.';

            if (role === 'PRINCIPAL') {
              icon = School;
              badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300';
              description = 'Executive dashboard, admissions pipeline, academic session advancement, and school-wide audit logs.';
            } else if (role === 'ACADEMIC_DIRECTOR') {
              icon = Layers;
              badgeColor = 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
              description = 'Class structures, streams, arm quotas, master timetable period allocation, and curriculum oversight.';
            } else if (role === 'TEACHER') {
              icon = GraduationCap;
              badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
              description = 'Gradebook Continuous Assessment & exam scoring, attendance heatmaps, and private personal lesson timetables.';
            } else if (role === 'BURSAR') {
              icon = CreditCard;
              badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
              description = 'Fee ledgers, student receipts, multi-child payment reconciliation, and staff payroll generation.';
            } else if (role === 'PARENT') {
              icon = Users;
              badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
              description = 'Multi-child report card viewer with QR verifier, fee balances, and direct form master messaging.';
            } else if (role === 'STUDENT') {
              icon = Award;
              badgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
              description = 'Student result dossier, class timetable, assignment schedule, and peer suggestion box submission.';
            }

            const IconComponent = icon;

            return (
              <div
                key={persona.username}
                className="p-5 sm:p-6 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                      {roleLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {persona.user.name}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {persona.user.title}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {description}
                  </p>

                  <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1">
                    Demo credentials: user <strong className="text-slate-700 dark:text-slate-300">{persona.username}</strong> / pass <strong className="text-slate-700 dark:text-slate-300">{persona.username}</strong>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onDirectLoginAs(persona.user)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Launch as {roleLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. MODULES & PLATFORM SUITE */}
      <section id="modules" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Academic Suite</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Engineered For Every Facet of School Life
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            From admissions to immutable report cards, financial ledgers, and parent communications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Admissions */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Users className="w-4 h-4" />
              <span>Admissions & Pipeline</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Kanban and list tracking for prospective applicants, document verification, entrance exam scores, and automated admission letter generation.
            </p>
          </div>

          {/* Student Dossiers */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <GraduationCap className="w-4 h-4" />
              <span>Student Dossiers & Attendance</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Centralized student profiles, daily morning and afternoon registers, real-time attendance heatmaps, and medical emergency notes.
            </p>
          </div>

          {/* Decoupled Timetable */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Calendar className="w-4 h-4" />
              <span>Decoupled Master Timetables</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Conflict-free class schedule matrix with automatic teacher clash detection, room quota checks, and distinct personal teacher prep planners.
            </p>
          </div>

          {/* Smart Gradebook */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <FileCheck className="w-4 h-4" />
              <span>Continuous Assessment & Exam</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Configurable CA test components (40%) and terminal exam (60%) summing to 100%. Automatic letter grading, class rank computation, and remark drafts.
            </p>
          </div>

          {/* Fees & Billing */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Multi-Tier Fees & Receipts</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Tuition, boarding, uniforms, and bus levies with individual student balances, payment receipts, bank reconciliation, and automated arrears alerts.
            </p>
          </div>

          {/* Parent Portal */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Users className="w-4 h-4" />
              <span>Multi-Child Parent Portal</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Guardians can toggle seamlessly between multiple enrolled wards, inspect subject performance, download signed report cards, and pay school levies.
            </p>
          </div>

          {/* Disciplinary & Pastoral */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Disciplinary & Guidance Log</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Private behavioral tracking, merits, counseling remarks, and parental notification records kept strictly confidential from public QR endpoints.
            </p>
          </div>

          {/* SMS & Communications */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>SMS Guard & Communications</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Real-time GSM vs Unicode SMS character counting, automated cost calculation per recipient, broadcast announcements, and urgent alerts.
            </p>
          </div>

          {/* Suggestion Box */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI-Sorted Suggestion Box</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Anonymous feedback channel for students and staff with automatic categorization (Facilities, Academics, Catering, Welfare) for rapid action.
            </p>
          </div>
        </div>
      </section>

      {/* 7. LIVE PUBLIC VERIFICATION SPOTLIGHT */}
      <section id="verification" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60 relative z-10">
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white relative overflow-hidden shadow-2xl border border-white/15">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Public Credential Verification Engine</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Tamper-Proof Transcripts With Instant QR Verification
            </h2>

            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Every printed or digital report card includes a cryptographic QR code linking to our secure verification endpoint.
              External universities, embassies, and employers can confirm student authenticity in seconds without authentication,
              while strictly protecting student privacy.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenPublicVerification('cred-sample-jss1-001')}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Test Sample Verification (JSS 1)</span>
              </button>

              <button
                type="button"
                onClick={onEnterLogin}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Access Staff Portal</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl py-10 px-4 sm:px-6 lg:px-8 relative z-10 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <School className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Apex Horizon Academy
              </div>
              <div className="text-[10px]">
                Unified School Management Platform • Postgres RLS Isolated
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <button
              type="button"
              onClick={() => scrollToSection('invariants')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('modules')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Modules
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('personas')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Personas
            </button>
            <button
              type="button"
              onClick={() => onOpenPublicVerification('cred-sample-jss1-001')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              QR Verification
            </button>
            <button
              type="button"
              onClick={onEnterLogin}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Sign In
            </button>
          </div>

          <div className="text-[11px] text-center md:text-right">
            © {new Date().getFullYear()} Apex Horizon Academy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
