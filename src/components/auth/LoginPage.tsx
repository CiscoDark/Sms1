import React, { useState } from 'react';
import {
  School,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  QrCode,
  Globe,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authenticateDemoUser, getPublicDemoAccounts } from '../../lib/auth-store';
import { UserProfile } from '../../types';
import { Button } from '../../design-system/components/Button';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenPublicVerification?: () => void;
  onBackToLanding?: () => void;
  defaultStartingScreen?: 'landing' | 'login';
  onSetDefaultStartingScreen?: (screen: 'landing' | 'login') => void;
  savedUser?: UserProfile | null;
  onResumeSession?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenPublicVerification,
  onBackToLanding,
  defaultStartingScreen = 'landing',
  onSetDefaultStartingScreen,
  savedUser,
  onResumeSession,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publicAccounts = getPublicDemoAccounts();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMsg('Please enter both your username or email and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const match = authenticateDemoUser(usernameOrEmail, password);
      if (match) {
        onLoginSuccess(match.user);
      } else {
        setErrorMsg('Invalid credentials. Check your username and password, or use one of the demo accounts below.');
        setIsSubmitting(false);
      }
    }, 350);
  };

  const handleQuickFill = (uname: string) => {
    setUsernameOrEmail(uname);
    setPassword(uname);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-start items-center bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-y-auto">
      {/* Ambient Glassmorphism Luminous Glow Backdrops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-400/15 to-transparent dark:from-indigo-600/20 dark:via-purple-600/12 dark:to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-bl from-teal-400/18 via-emerald-300/12 to-transparent dark:from-emerald-600/15 dark:via-cyan-600/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-[15%] left-[20%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-tr from-blue-500/16 via-indigo-400/12 to-transparent dark:from-indigo-900/22 dark:via-blue-900/12 dark:to-transparent blur-3xl" />
      </div>

      {/* Top Navigation & Starting Page Switcher Bar */}
      <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        {/* Segmented Starting Page Switcher */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 active:scale-95 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Landing Page</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]">
            <Lock className="w-3.5 h-3.5 text-white" />
            <span>Sign In Portal</span>
          </div>
        </div>

        {/* Right side: Resume Session & Default Start Screen Preference */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
          {onSetDefaultStartingScreen && (
            <button
              type="button"
              onClick={() =>
                onSetDefaultStartingScreen(defaultStartingScreen === 'login' ? 'landing' : 'login')
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border backdrop-blur-md transition-all cursor-pointer shadow-2xs active:scale-95 ${
                defaultStartingScreen === 'login'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                  : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-white/70 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Toggle whether opening the site defaults to the Login Page or Landing Page"
            >
              <Check
                className={`w-3 h-3 ${
                  defaultStartingScreen === 'login' ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-30'
                }`}
              />
              <span>
                Default Start:{' '}
                <strong className="font-bold">
                  {defaultStartingScreen === 'login' ? 'Login Page' : 'Landing Page'}
                </strong>
              </span>
            </button>
          )}

          {savedUser && onResumeSession && (
            <button
              type="button"
              onClick={onResumeSession}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Resume Session ({savedUser.name.split(' ')[0]})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Col: Brand Presentation & Public Verification Link */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Demonstration Prototype • Local State</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(99,102,241,0.35)] border border-indigo-400/30">
                <School className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                  Apex Horizon
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Academy School Management
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto lg:mx-0">
              Welcome to the Apex Horizon Academy enterprise demonstration. Sign in with any of the
              preconfigured testing accounts below to experience role-scoped administration, real-time
              gradebook computation, attendance registers, and point-in-time report cards.
            </p>
          </div>

          {/* Highlights checklist */}
          <div className="hidden sm:grid grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/65 dark:bg-slate-900/65 backdrop-blur-md border border-white/75 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Multi-Tenant Scoping</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/65 dark:bg-slate-900/65 backdrop-blur-md border border-white/75 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
              <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Decoupled Timetables</span>
            </div>
          </div>

          {/* Public Verification Link */}
          {onOpenPublicVerification && (
            <div className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl border border-white/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Public QR Verification
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Accessible without logging in (privacy-scoped)
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenPublicVerification}
                className="text-xs shrink-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/80 dark:border-slate-700"
              >
                Open Verify
              </Button>
            </div>
          )}
        </div>

        {/* Right Col: Sign In Card & Demo Credentials Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Login Form Card */}
          <div className="liquid-glass rounded-[2rem] p-6 sm:p-8">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a demo role or enter your credentials
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/50 backdrop-blur-sm border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username / Email field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. principal, teacher, or bursar"
                    autoComplete="username"
                    className="liquid-glass-input w-full pl-10 pr-3 py-3 text-sm rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="liquid-glass-input w-full pl-10 pr-10 py-3 text-sm rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="liquid-primary w-full text-white font-bold rounded-2xl"
                >
                  Continue
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Demo mode • role-scoped access
                </p>
              </div>
            </form>
          </div>

          {/* Demo Roles Helper Panel */}
          <div className="liquid-glass rounded-[2rem] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Demo Roles
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Tap a role to autofill</span>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
              {publicAccounts.map((acc) => {
                const roleLabel = acc.user.role.replace('_', ' ');
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickFill(acc.username)}
                    className="liquid-role text-left p-3 rounded-2xl cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between">
                      <span>{roleLabel}</span>
                      <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Fill ↵
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      <strong className="text-slate-500 dark:text-slate-400 font-medium">{acc.username}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
