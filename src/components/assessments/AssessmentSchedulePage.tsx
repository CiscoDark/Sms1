import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
  SlidersHorizontal,
  GraduationCap,
} from 'lucide-react';
import {
  AssessmentScheduleItem,
  AssessmentType,
  ClassLevel,
  Role,
  UserProfile,
} from '../../types';
import { Button, Card, Badge, Input, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../design-system';
import {
  getStoredAssessmentSchedules,
  saveStoredAssessmentSchedules,
  toggleAdminGradingOverride,
  generateStudentExamFeed,
} from '../../lib/assessment-exam-store';
import { TENANT_SCHOOL_ID } from '../../lib/class-timetable-store';
import { AssessmentModal } from './AssessmentModal';

export interface AssessmentSchedulePageProps {
  levels: ClassLevel[];
  currentUser: UserProfile;
  onLogAudit?: (action: string, details: string) => void;
  onNavigateToGradebook?: () => void;
}

export const AssessmentSchedulePage: React.FC<AssessmentSchedulePageProps> = ({
  levels,
  currentUser,
  onLogAudit,
  onNavigateToGradebook,
}) => {
  const [schedules, setSchedules] = useState<AssessmentScheduleItem[]>(() =>
    getStoredAssessmentSchedules()
  );
  const [selectedLevelId, setSelectedLevelId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'SCHEDULE' | 'STUDENT_FEED'>('SCHEDULE');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AssessmentScheduleItem | null>(null);

  // Admin Override Modal
  const [overrideTarget, setOverrideTarget] = useState<AssessmentScheduleItem | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('Early score entry authorized by Academic Director');

  const canManage = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR', 'TEACHER'].includes(currentUser.role);
  const isAdmin = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(currentUser.role);

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    if (selectedLevelId !== 'all' && s.levelId !== selectedLevelId) return false;
    if (selectedType !== 'all' && s.type !== selectedType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchSubject = s.subjectName.toLowerCase().includes(q);
      const matchVenue = s.venue.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchVenue) return false;
    }
    return true;
  });

  // Calculate stats
  const totalCount = schedules.length;
  const terminalCount = schedules.filter((s) => s.type === 'TERMINAL_EXAM').length;
  const openGradingCount = schedules.filter((s) => s.isGradingOpen).length;
  const lockedGradingCount = schedules.filter((s) => !s.isGradingOpen).length;

  const handleSaveSchedule = (item: AssessmentScheduleItem) => {
    const exists = schedules.some((s) => s.id === item.id);
    let nextList: AssessmentScheduleItem[];
    if (exists) {
      nextList = schedules.map((s) => (s.id === item.id ? item : s));
      onLogAudit?.(
        'ASSESSMENT_SCHEDULE_UPDATED',
        `Updated assessment schedule "${item.title}" for ${item.levelName} ${item.subjectName}`
      );
    } else {
      nextList = [item, ...schedules];
      onLogAudit?.(
        'ASSESSMENT_SCHEDULE_CREATED',
        `Scheduled new assessment "${item.title}" for ${item.levelName} on ${item.date}`
      );
    }
    setSchedules(nextList);
    saveStoredAssessmentSchedules(nextList);
  };

  const handleConfirmOverride = () => {
    if (!overrideTarget) return;
    const newLockState = !overrideTarget.isGradingOpen;
    const updated = toggleAdminGradingOverride(
      overrideTarget.id,
      newLockState,
      currentUser,
      overrideReason
    );

    if (updated) {
      const nextList = schedules.map((s) => (s.id === updated.id ? updated : s));
      setSchedules(nextList);
      onLogAudit?.(
        'GRADING_LOCK_OVERRIDDEN',
        `${newLockState ? 'Unlocked' : 'Locked'} report card grading for ${overrideTarget.title} (Reason: ${overrideReason})`
      );
    }
    setOverrideTarget(null);
  };

  // Student portal feed simulation
  const studentFeedItems = generateStudentExamFeed(TENANT_SCHOOL_ID, selectedLevelId === 'all' ? undefined : selectedLevelId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Invariant #1 Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Exam & Continuous Assessment Scheduling
            </h2>
            <Badge variant="primary" size="sm">
              Step 11 Engine
            </Badge>
            <Badge variant="neutral" size="sm" className="hidden sm:inline-flex text-[10px]">
              Tenant: {TENANT_SCHOOL_ID}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Master timetable for Continuous Assessments (CA1, CA2) and Terminal Exams with automated Report Card grading lock gates.
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Switch View */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('SCHEDULE')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'SCHEDULE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Master Timetable
            </button>
            <button
              type="button"
              onClick={() => setViewMode('STUDENT_FEED')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'STUDENT_FEED'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-indigo-500" />
              Student Feed Preview
            </button>
          </div>

          {onNavigateToGradebook && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToGradebook}
              rightIcon={<ArrowRight className="w-4 h-4 text-emerald-600" />}
              className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
            >
              Teacher Gradebook
            </Button>
          )}

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Schedule Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Scheduled</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {totalCount}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Terminal Exams</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {terminalCount}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Grading Open</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {openGradingCount}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Grading Locked</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {lockedGradingCount}
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">Level:</span>
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Class Levels</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Assessment Types</option>
              <option value="TERMINAL_EXAM">Terminal Examination</option>
              <option value="MID_TERM">Mid-Term CA 2</option>
              <option value="CA1">Continuous Assessment 1</option>
              <option value="PRACTICAL">Practical / Lab Test</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subject, title, venue..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </Card>

      {/* Main View Mode: MASTER TIMETABLE */}
      {viewMode === 'SCHEDULE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Scheduled Assessments ({filteredSchedules.length})
            </h3>
            <span className="text-xs text-slate-400">
              Lock icon indicates Report Card Grading Gate status
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredSchedules.map((item) => {
              const isExam = item.type === 'TERMINAL_EXAM';
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800 ${
                    item.isGradingOpen
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-amber-200/80 dark:border-amber-900/40 bg-amber-500/5'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Assessment Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            item.type === 'TERMINAL_EXAM'
                              ? 'primary'
                              : item.type === 'MID_TERM'
                              ? 'info'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {item.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {item.levelName}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">
                          [{item.subjectCode}]
                        </span>
                        <span className="text-xs text-slate-500">
                          Weight: {item.weightPercentage}% (Max {item.maxScore} marks)
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>
                            {item.startTime} - {item.endTime} ({item.durationMinutes} min)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.venue}</span>
                        </div>
                        {item.supervisorTeacherName && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Invigilator: {item.supervisorTeacherName}</span>
                          </div>
                        )}
                      </div>

                      {item.syllabusTopics && item.syllabusTopics.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                          <span className="font-semibold">Coverage:</span>
                          <span>{item.syllabusTopics.join(' • ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Grading Gate & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Grading Gate Status Badge */}
                      <div className="flex flex-col sm:items-end">
                        {item.isGradingOpen ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Report Card Grading Open</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Grading Locked (Gated)</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {item.isGradingOpen
                            ? `Unlocked on ${item.gradingUnlockedAt?.split('T')[0] || item.date}`
                            : `Opens when exam window occurs (${item.date})`}
                        </span>
                      </div>

                      {/* Admin Override Lock Button */}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOverrideTarget(item)}
                          className={`text-xs ${
                            item.isGradingOpen
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {item.isGradingOpen ? 'Lock Gate' : 'Override Lock'}
                        </Button>
                      )}

                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSchedules.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  No assessment schedules match the current filters.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try clearing your search query or schedule a new exam.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Feed Preview (Step 11 Requirement) */}
      {viewMode === 'STUDENT_FEED' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
            <Send className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-bold">Student Portal Feed Integration (Step 11 Architecture):</span>{' '}
              Published exam and CA schedules automatically pipe into the student's personal announcements and exam countdown without requiring any manual duplicate posting.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentFeedItems.map((feed) => (
              <div
                key={feed.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      {feed.levelName} • {feed.subjectCode}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {feed.title}
                    </h4>
                  </div>
                  <Badge
                    variant={feed.daysRemaining <= 3 ? 'danger' : feed.daysRemaining <= 7 ? 'warning' : 'primary'}
                    size="sm"
                  >
                    {feed.daysRemaining < 0
                      ? 'Concluded'
                      : feed.daysRemaining === 0
                      ? 'Today'
                      : `In ${feed.daysRemaining} Days`}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Date & Time</span>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {feed.date} • {feed.timeRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Venue</span>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {feed.venue}
                    </span>
                  </div>
                </div>

                {feed.instructions && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Instructions: </span>
                    {feed.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Edit Modal */}
      {isModalOpen && (
        <AssessmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSchedule}
          existingItem={editingItem}
          levels={levels}
          currentUser={currentUser}
        />
      )}

      {/* Admin Override Lock Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {overrideTarget.isGradingOpen ? 'Lock Grading Gate' : 'Override Grading Lock'}
                </h3>
                <span className="text-xs text-slate-400">{overrideTarget.title}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {overrideTarget.isGradingOpen
                ? 'Locking this assessment prevents teachers from entering or altering report card marks until the exam window is formally re-opened.'
                : 'Overriding this lock permits early entry of CA or examination marks before the scheduled date. This action will be logged in the permanent security audit trail.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Administrative Justification / Reason
              </label>
              <Input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Special accreditation mock grading authorized"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setOverrideTarget(null)}>
                Cancel
              </Button>
              <Button
                variant={overrideTarget.isGradingOpen ? 'danger' : 'primary'}
                size="sm"
                onClick={handleConfirmOverride}
              >
                Confirm {overrideTarget.isGradingOpen ? 'Lock' : 'Unlock'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
