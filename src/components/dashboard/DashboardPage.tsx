import React from 'react';
import {
  Calendar,
  Users,
  Layers,
  GraduationCap,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  History,
  Building2,
  BookOpen,
  UploadCloud,
  FileSpreadsheet,
  UserPlus,
  Sparkles,
  CreditCard,
  Activity,
  FileCheck,
  TrendingUp,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { AcademicSession, ClassLevel, AuditLog, Role } from '../../types';
import { Card, Button, Badge, ProgressRing, CountUp, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../design-system';
import { formatDate } from '../academic/format';

export interface DashboardPageProps {
  currentSession: AcademicSession;
  levels: ClassLevel[];
  auditLogs: AuditLog[];
  userRole: Role;
  onNavigateTab: (
    tab:
      | 'dashboard'
      | 'admissions'
      | 'students'
      | 'sessions'
      | 'class-structure'
      | 'timetables'
      | 'teacher-timetable'
      | 'assessments'
      | 'gradebook'
      | 'data-migration'
      | 'design-system'
  ) => void;
  onAdvanceTermRequest: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentSession,
  levels,
  auditLogs,
  userRole,
  onNavigateTab,
  onAdvanceTermRequest,
}) => {
  const activeTerm = currentSession.terms.find((t) => t.status === 'ACTIVE');
  const allArms = levels.flatMap((l) => l.arms);
  const totalStudents = allArms.reduce((sum, a) => sum + a.enrolledCount, 0);
  const totalCapacity = allArms.reduce((sum, a) => sum + a.capacity, 0);
  const totalBoys = allArms.reduce((sum, a) => sum + a.maleCount, 0);
  const totalGirls = allArms.reduce((sum, a) => sum + a.femaleCount, 0);
  const schoolOccupancyRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const canAdvance = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Hero Active Term Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-indigo-900/90 backdrop-blur-2xl text-white p-6 sm:p-8 border border-white/15 shadow-[0_20px_50px_rgba(31,38,135,0.15)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl bg-white/10 text-indigo-200 border border-white/15 backdrop-blur-sm shadow-2xs">
                Active Academic Session
              </span>
              <Badge variant="success" size="sm" hasDot>
                Live School Term
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentSession.name} — {activeTerm ? activeTerm.name : 'Active Term'}
            </h1>

            <p className="text-sm text-indigo-200/90 max-w-xl leading-relaxed">
              Term started on {formatDate(activeTerm?.startDate)} and runs through{' '}
              {formatDate(activeTerm?.endDate)} ({activeTerm?.totalWeeks} teaching weeks).
              Grade submission, attendance tracking, and fee reconciliations are currently in effect.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {canAdvance && (
              <Button
                variant="primary"
                size="md"
                onClick={onAdvanceTermRequest}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 shadow-[0_4px_16px_rgba(99,102,241,0.4)] font-semibold"
              >
                Advance Academic Term
              </Button>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigateTab('class-structure')}
              className="border-white/30 text-white hover:bg-white/15 backdrop-blur-xs"
            >
              Class Structure
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <CountUp end={totalStudents} duration={800} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{totalBoys} Boys / {totalGirls} Girls</span>
            <span className="text-emerald-600 font-medium">100% Active</span>
          </div>
        </Card>

        {/* Class Levels & Arms */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Class Arms
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <CountUp end={allArms.length} duration={700} /> Streams
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Across {levels.length} Education Levels</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              Avg 32/arm
            </span>
          </div>
        </Card>

        {/* Overall Capacity Utilization */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Campus Capacity
            </span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <CountUp end={schoolOccupancyRate} suffix="%" duration={900} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Quota: {totalCapacity} desks</span>
            <span className="text-emerald-600 font-medium">Healthy</span>
          </div>
        </Card>

        {/* Teaching Faculty */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Form Masters & Staff
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <CountUp end={allArms.length} duration={600} /> Form Masters
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>100% classrooms allocated</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              Verified
            </span>
          </div>
        </Card>
      </div>

      {/* Secondary Operational Metric Cards (Fees, Attendance, Admissions) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Outstanding Fees */}
        <Card className="p-5 space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Outstanding Fees
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <CountUp end={4850000} prefix="₦" duration={900} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-rose-600 dark:text-rose-400 font-medium">18.4% uncollected balance</span>
            <button
              type="button"
              onClick={() => onNavigateTab('fees' as any)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Invoices</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* Weekly Attendance */}
        <Card className="p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Attendance (This Week)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
            <CountUp end={96.4} decimals={1} suffix="%" duration={850} />
            <span className="text-xs font-normal text-emerald-600 font-medium">+1.2% vs last week</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>High engagement</span>
            <span className="text-emerald-600 font-medium">Above 95% SLA</span>
          </div>
        </Card>

        {/* Pending Admissions */}
        <Card className="p-5 space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Admissions
            </span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <CountUp end={14} duration={750} /> Applications
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-sky-600 dark:text-sky-400 font-medium">5 Entrance Exams Pending</span>
            <button
              type="button"
              onClick={() => onNavigateTab('admissions')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Pipeline</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      </div>

      {/* Grid: Term Progression & Class Structure Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Session Term Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Academic Term Cycle ({currentSession.year})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('sessions')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Manage Sessions
            </Button>
          </div>

          <div className="space-y-3">
            {currentSession.terms.map((term, index) => (
              <Card
                key={term.id}
                className={`p-4 flex items-center justify-between gap-4 ${
                  term.status === 'ACTIVE'
                    ? 'border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      term.status === 'ACTIVE'
                        ? 'bg-indigo-600 text-white'
                        : term.status === 'COMPLETED'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    T{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {term.name}
                      </h4>
                      <Badge
                        variant={
                          term.status === 'ACTIVE'
                            ? 'success'
                            : term.status === 'COMPLETED'
                            ? 'neutral'
                            : 'info'
                        }
                        size="sm"
                        hasDot={term.status === 'ACTIVE'}
                      >
                        {term.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(term.startDate)} — {formatDate(term.endDate)} •{' '}
                      {term.totalWeeks} Weeks
                    </p>
                  </div>
                </div>

                {term.status === 'ACTIVE' && canAdvance && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onAdvanceTermRequest}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Advance
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Class Level Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Level Distribution
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('class-structure')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Class Setup
            </Button>
          </div>

          <Card className="p-4 space-y-3">
            {levels.map((lvl) => {
              const count = lvl.arms.reduce((s, a) => s + a.enrolledCount, 0);
              const cap = lvl.arms.reduce((s, a) => s + a.capacity, 0);
              const pct = cap > 0 ? Math.round((count / cap) * 100) : 0;
              return (
                <div key={lvl.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {lvl.name} ({lvl.arms.length} arms)
                    </span>
                    <span className="text-slate-500">
                      {count} / {cap} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      {/* Core Modules Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Records & Attendance Banner */}
        <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 dark:border-blue-900/60 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Student Records & Attendance
                </h4>
                <Badge variant="primary" size="sm">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Full bio-data dossiers, verified documents vault, point-in-time academic promotion snapshots, daily check-in, and visual attendance heatmaps.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-blue-100 dark:border-blue-900/30">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Heatmap Calendar & Streaks
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('students')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
            >
              Open Records
            </Button>
          </div>
        </div>

        {/* Admission & Enrollment Pipeline Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Admission & Enrollment Pipeline
                </h4>
                <Badge variant="success" size="sm">
                  Pipeline
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage candidate stages (Applied → Review → Assessed → Admitted → Enrolled), attach interview scoring, assign arms, and auto-generate student records.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-emerald-100 dark:border-emerald-900/30">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Preserved archive
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('admissions')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
            >
              Open Pipeline
            </Button>
          </div>
        </div>

        {/* Bulk Data Migration Banner */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  CSV / Excel Bulk Data Importer
                </h4>
                <Badge variant="primary" size="sm">
                  Migration
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload student registers, staff directories, and fee payments with automatic pre-validation, phone format checks, and row-level correction.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
              Multi-entity spreadsheet ingestion
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('data-migration')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-xs"
            >
              Open Importer
            </Button>
          </div>
        </div>
      </div>

      {/* Decoupled Timetable Systems (Invariant #2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class Timetables (Admin-Owned) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Class Timetables & Streams
                </h4>
                <Badge variant="primary" size="sm">
                  Admin-Owned
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Official registrar schedules per class and arm. Real-time conflict engine prevents teacher and room double-bookings school-wide.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">
              Read-only for students/parents
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('timetables')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Class Timetables
            </Button>
          </div>
        </div>

        {/* Teacher Personal Timetable (Private Planning) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Teacher Personal Timetables
                </h4>
                <Badge variant="success" size="sm">
                  Private Planner
                </Badge>
                <Badge variant="info" size="sm" className="hidden sm:inline-flex">
                  Decoupled (Invariant #2)
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Private planning view per educator. One-time import from official schedule, freely editable notes and prep time, with zero write-back.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">
              Non-blocking overlap checks
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('teacher-timetable')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Teacher Planner
            </Button>
          </div>
        </div>
      </div>

      {/* Assessment Scheduling & Gradebook Engines (Steps 11 & 12) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exam & CA Scheduling */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Exam & Assessment Scheduling
                </h4>
                <Badge variant="primary" size="sm">
                  Step 11 Gate
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Continuous assessment (CA1, CA2) and terminal exam windows. Automatically locks report card grading until each exam window occurs, with structured student portal feeds.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">
              Automated grading lock gates
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('assessments')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Exam Schedules
            </Button>
          </div>
        </div>

        {/* Teacher Gradebook & Calculation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Teacher Gradebook & Calculation
                </h4>
                <Badge variant="success" size="sm">
                  Step 12 Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                High-speed spreadsheet grid with Enter/Tab navigation, Excel clipboard paste, real-time total computation, configurable letter boundaries, and class arm rankings.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              40 students scored in &lt;2 min
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('gradebook')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Open Gradebook
            </Button>
          </div>
        </div>
      </div>

      {/* Live Operations & Mock Activity Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Live Campus Operations & Recent Activity
            </h3>
          </div>
          <span className="text-xs text-slate-400">Real-time mock event stream</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Activity 1: Payment Recorded */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Tuition Payment
                </span>
                <span className="text-[10px] font-mono text-slate-400">8m ago</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                ₦150,000 received for Chioma Okonjo
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Bank Transfer (Zenith Bank) • JSS 1 Gold • Verified by Bursar
              </p>
            </div>
          </div>

          {/* Activity 2: Report Card Published */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Report Card Snapshot
                </span>
                <span className="text-[10px] font-mono text-slate-400">24m ago</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Term 1 Snapshot Published (SSS 3 Diamond)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Cryptographic hash generated • Invariant #3 frozen point-in-time
              </p>
            </div>
          </div>

          {/* Activity 3: New Admission Advanced */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  Admissions Pipeline
                </span>
                <span className="text-[10px] font-mono text-slate-400">1h ago</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Tariq Balogun moved to &ldquo;Admitted&rdquo;
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Score: 88% Entrance Assessment • JSS 1 2024/2025 cohort
              </p>
            </div>
          </div>

          {/* Activity 4: Attendance Register */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                  Daily Attendance
                </span>
                <span className="text-[10px] font-mono text-slate-400">2h ago</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Morning Roll Call Submitted
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                JSS 1 Gold: 38 Present, 2 Late, 0 Absent by Mr. David Okonjo
              </p>
            </div>
          </div>

          {/* Activity 5: Offline Sync Completed */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Offline Write Queue
                </span>
                <span className="text-[10px] font-mono text-slate-400">3h ago</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Offline Queue Synchronized
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                12 cached gradebook and attendance mutations synced with 0 conflicts
              </p>
            </div>
          </div>

          {/* Activity 6: Timetable Published */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  Master Timetable
                </span>
                <span className="text-[10px] font-mono text-slate-400">5h ago</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Term 1 Final Exam Timetable Live
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Hall allocation verified • Decoupled from private teacher availability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Activity Log */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Administrative Activity & Audit Log
            </h3>
          </div>
          <span className="text-xs text-slate-400">Security & Compliance Log</span>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Authorized By</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Details</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                  {log.action}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.category === 'SESSION'
                        ? 'primary'
                        : log.category === 'CLASS'
                        ? 'info'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {log.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                  {log.performerName} ({log.performerRole})
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {log.timestamp}
                </TableCell>
                <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
