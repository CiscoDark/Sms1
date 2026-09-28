import React, { useState } from 'react';
import {
  School,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authenticateDemoUser, getPublicDemoAccounts } from '../../lib/auth-store';
import { UserProfile } from '../../types';
import { Button } from '../../design-system/components/Button';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenPublicVerification?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenPublicVerification,
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient Glassmorphism Luminous Glow Backdrops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-400/15 to-transparent dark:from-indigo-600/20 dark:via-purple-600/12 dark:to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-bl from-teal-400/18 via-emerald-300/12 to-transparent dark:from-emerald-600/15 dark:via-cyan-600/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-[15%] left-[20%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-tr from-blue-500/16 via-indigo-400/12 to-transparent dark:from-indigo-900/22 dark:via-blue-900/12 dark:to-transparent blur-3xl" />
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
          <div className="bg-white/78 dark:bg-slate-900/78 backdrop-blur-2xl rounded-3xl border border-white/85 dark:border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.06)]">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your test credentials below to access the management portal
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
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] transition-all"
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
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] transition-all"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_4px_16px_rgba(99,102,241,0.35)]"
                >
                  Sign in to Portal
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Note: These are demo credentials for testing the system in prototype mode.
                </p>
              </div>
            </form>
          </div>

          {/* Demo Credentials Helper Panel (Lists only non-Super-Admin accounts) */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/75 dark:border-white/10 p-5 space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Demo Test Credentials (Click to fill)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Click any role to autofill</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {publicAccounts.map((acc) => {
                const roleLabel = acc.user.role.replace('_', ' ');
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickFill(acc.username)}
                    className="text-left p-2.5 rounded-xl border border-white/70 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:bg-white/95 dark:hover:bg-slate-700/90 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-2xs active:scale-95 transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between">
                      <span>{roleLabel}</span>
                      <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Fill ↵
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      user: <strong className="text-slate-700 dark:text-slate-300">{acc.username}</strong>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                      pass: {acc.username}
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
