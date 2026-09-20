import React, { useState, useEffect } from 'react';
import {
  Applicant,
  AdmissionStage,
  AssessmentScore,
  ClassLevel,
  UserProfile,
  AcademicSession
} from '../../types';
import {
  getStoredApplicants,
  saveApplicants,
  advanceApplicantStage,
  rejectApplicant,
  withdrawApplicant,
  reopenApplicant,
  enrollApplicant
} from '../../lib/admissions/admissions-store';
import { KanbanBoard } from './KanbanBoard';
import { ApplicantsTableView } from './ApplicantsTableView';
import { ArchivedApplicantsView } from './ArchivedApplicantsView';
import { ApplicantDetailDrawer } from './ApplicantDetailDrawer';
import { EnrollmentModal } from './EnrollmentModal';
import { StageActionReasonModal } from './StageActionReasonModal';
import { ApplicationFormModal } from './ApplicationFormModal';
import { Button } from '../../design-system/components/Button';
import {
  UserPlus,
  LayoutGrid,
  List,
  Archive,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertOctagon,
  Globe,
  Sparkles
} from 'lucide-react';

interface AdmissionsPageProps {
  levels: ClassLevel[];
  onLevelsUpdate: (newLevels: ClassLevel[]) => void;
  currentSession: AcademicSession;
  currentUser: UserProfile;
  onLogAudit: (action: string, details: string) => void;
}

export const AdmissionsPage: React.FC<AdmissionsPageProps> = ({
  levels,
  onLevelsUpdate,
  currentSession: _currentSession,
  currentUser,
  onLogAudit,
}) => {
  const [applicants, setApplicants] = useState<Applicant[]>(() => getStoredApplicants());
  const [activeView, setActiveView] = useState<'KANBAN' | 'TABLE' | 'ARCHIVE'>('KANBAN');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers state
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [enrollmentTargetApplicant, setEnrollmentTargetApplicant] = useState<Applicant | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  const [reasonModalApplicant, setReasonModalApplicant] = useState<Applicant | null>(null);
  const [reasonActionType, setReasonActionType] = useState<'REJECT' | 'WITHDRAW' | 'REOPEN'>('REJECT');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

  // Toast / Alert banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Sync to storage
  useEffect(() => {
    saveApplicants(applicants);
  }, [applicants]);

  // Derived metrics
  const totalCount = applicants.length;
  const inPipelineCount = applicants.filter(
    (a) =>
      a.stage === 'APPLIED' ||
      a.stage === 'UNDER_REVIEW' ||
      a.stage === 'ASSESSED' ||
      a.stage === 'ADMITTED'
  ).length;
  const enrolledCount = applicants.filter((a) => a.stage === 'ENROLLED').length;
  const archivedCount = applicants.filter(
    (a) => a.stage === 'REJECTED' || a.stage === 'WITHDRAWN'
  ).length;

  const acceptanceRate =
    totalCount > 0 ? Math.round(((enrolledCount + applicants.filter((a) => a.stage === 'ADMITTED').length) / totalCount) * 100) : 0;

  // Handlers
  const handleOpenDetail = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsDetailDrawerOpen(true);
  };

  const handleAdvanceStage = (
    applicantId: string,
    nextStage: AdmissionStage,
    details: {
      notes?: string;
      assessmentScores?: AssessmentScore[];
      totalAssessmentScore?: number;
      assessmentNotes?: string;
      interviewerName?: string;
      assessmentDate?: string;
    }
  ) => {
    const { updatedApplicants, updatedApplicant } = advanceApplicantStage(
      applicants,
      applicantId,
      nextStage,
      details,
      currentUser
    );
    setApplicants(updatedApplicants);
    setSelectedApplicant(updatedApplicant);

    onLogAudit(
      'ADMISSION_STAGE_ADVANCE',
      `Advanced applicant ${updatedApplicant.applicationNumber} (${updatedApplicant.firstName} ${updatedApplicant.lastName}) to ${nextStage.replace('_', ' ')}`
    );

    showToast(
      `Candidate ${updatedApplicant.firstName} moved to ${nextStage.replace('_', ' ')}.`
    );
  };

  const handleAdvanceStageQuick = (applicant: Applicant) => {
    const nextMap: Record<AdmissionStage, AdmissionStage | null> = {
      APPLIED: 'UNDER_REVIEW',
      UNDER_REVIEW: 'ASSESSED',
      ASSESSED: 'ADMITTED',
      ADMITTED: 'ENROLLED',
      ENROLLED: null,
      REJECTED: null,
      WITHDRAWN: null,
    };

    const next = nextMap[applicant.stage];
    if (!next) return;

    if (next === 'ENROLLED') {
      handleRequestEnrollment(applicant);
      return;
    }

    handleAdvanceStage(applicant.id, next, {
      notes: `Quick advanced from ${applicant.stage.replace('_', ' ')} to ${next.replace('_', ' ')}.`,
    });
  };

  const handleRequestEnrollment = (applicant: Applicant) => {
    setEnrollmentTargetApplicant(applicant);
    setIsEnrollmentModalOpen(true);
  };

  const handleConfirmEnrollment = (
    applicantId: string,
    assignedArm: string,
    admissionNumber: string
  ) => {
    const res = enrollApplicant(
      applicants,
      applicantId,
      assignedArm,
      admissionNumber,
      levels,
      currentUser
    );

    setApplicants(res.updatedApplicants);
    onLevelsUpdate(res.updatedLevels);

    if (selectedApplicant?.id === applicantId) {
      setSelectedApplicant(res.updatedApplicant);
    }

    onLogAudit(
      'STUDENT_ENROLLED',
      `Enrolled student ${res.newStudent.firstName} ${res.newStudent.lastName} into ${res.newStudent.classLevel} (${res.newStudent.classArm}). Generated Admission No: ${res.newStudent.admissionNumber}`
    );

    showToast(
      `Official Student Registered: ${res.newStudent.firstName} ${res.newStudent.lastName} (${res.newStudent.admissionNumber}) enrolled in ${res.newStudent.classLevel} - ${res.newStudent.classArm}!`,
      'success'
    );
  };

  const handleOpenReasonModal = (applicant: Applicant, type: 'REJECT' | 'WITHDRAW' | 'REOPEN') => {
    setReasonModalApplicant(applicant);
    setReasonActionType(type);
    setIsReasonModalOpen(true);
  };

  const handleConfirmReasonAction = (reason: string) => {
    if (!reasonModalApplicant) return;

    if (reasonActionType === 'REJECT') {
      const res = rejectApplicant(applicants, reasonModalApplicant.id, reason, currentUser);
      setApplicants(res.updatedApplicants);
      if (selectedApplicant?.id === reasonModalApplicant.id) {
        setSelectedApplicant(res.updatedApplicant);
      }
      onLogAudit(
        'ADMISSION_REJECTED',
        `Rejected application ${reasonModalApplicant.applicationNumber}. Reason: ${reason}`
      );
      showToast(`Application ${reasonModalApplicant.applicationNumber} archived as Rejected.`, 'info');
    } else if (reasonActionType === 'WITHDRAW') {
      const res = withdrawApplicant(applicants, reasonModalApplicant.id, reason, currentUser);
      setApplicants(res.updatedApplicants);
      if (selectedApplicant?.id === reasonModalApplicant.id) {
        setSelectedApplicant(res.updatedApplicant);
      }
      onLogAudit(
        'ADMISSION_WITHDRAWN',
        `Withdrew application ${reasonModalApplicant.applicationNumber}. Reason: ${reason}`
      );
      showToast(`Application ${reasonModalApplicant.applicationNumber} marked Withdrawn.`, 'info');
    } else if (reasonActionType === 'REOPEN') {
      const res = reopenApplicant(applicants, reasonModalApplicant.id, reason, currentUser);
      setApplicants(res.updatedApplicants);
      if (selectedApplicant?.id === reasonModalApplicant.id) {
        setSelectedApplicant(res.updatedApplicant);
      }
      onLogAudit(
        'ADMISSION_REOPENED',
        `Reopened application ${reasonModalApplicant.applicationNumber} for appeal review. Justification: ${reason}`
      );
      showToast(`Application ${reasonModalApplicant.applicationNumber} reopened into Under Review.`, 'success');
    }
  };

  const handleSubmitNewApplication = (newApp: Applicant) => {
    const updated = [newApp, ...applicants];
    setApplicants(updated);
    onLogAudit(
      'ADMISSION_SUBMITTED',
      `New application lodged: ${newApp.applicationNumber} for ${newApp.firstName} ${newApp.lastName} (${newApp.desiredLevel})`
    );
    showToast(`Application ${newApp.applicationNumber} registered successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Admission & Enrollment Pipeline
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Session 2024/2025
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            End-to-end applicant lifecycle from submission and entrance examination to arm assignment and official student record instantiation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsApplicationFormOpen(true)}
            leftIcon={<Globe className="w-3.5 h-3.5 text-blue-600" />}
          >
            Public Portal Simulator
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsApplicationFormOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            New Application
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Total Applications</span>
            <Users className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
            {totalCount}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Across all levels</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
            <span>In Active Pipeline</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {inPipelineCount}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Applied to Admitted</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-teal-600 dark:text-teal-400 mb-1">
            <span>Enrolled Students</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-mono">
            {enrolledCount}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Arm Assigned & Active</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 mb-1">
            <span>Archived Records</span>
            <Archive className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            {archivedCount}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Rejected & Withdrawn (Preserved)</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Acceptance Rate</span>
            <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
            {acceptanceRate}%
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Competitive selectivity</div>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('KANBAN')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'KANBAN'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Visual Pipeline (Kanban)
          </button>

          <button
            type="button"
            onClick={() => setActiveView('TABLE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'TABLE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Active Register Table
          </button>

          <button
            type="button"
            onClick={() => setActiveView('ARCHIVE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'ARCHIVE'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Archived Applicants ({archivedCount})
          </button>
        </div>

        <div className="text-xs text-neutral-500">
          Showing <strong>{activeView === 'ARCHIVE' ? archivedCount : inPipelineCount + enrolledCount}</strong> candidates
        </div>
      </div>

      {/* Main View Area */}
      {activeView === 'KANBAN' && (
        <KanbanBoard
          applicants={applicants}
          searchQuery={searchQuery}
          onSelectApplicant={handleOpenDetail}
          onAdvanceStageQuick={handleAdvanceStageQuick}
          onRequestEnrollment={handleRequestEnrollment}
          onRequestReject={(app) => handleOpenReasonModal(app, 'REJECT')}
        />
      )}

      {activeView === 'TABLE' && (
        <ApplicantsTableView
          applicants={applicants}
          onSelectApplicant={handleOpenDetail}
          onAdvanceStageQuick={handleAdvanceStageQuick}
          onRequestEnrollment={handleRequestEnrollment}
          onRequestReject={(app) => handleOpenReasonModal(app, 'REJECT')}
        />
      )}

      {activeView === 'ARCHIVE' && (
        <ArchivedApplicantsView
          applicants={applicants}
          onSelectApplicant={handleOpenDetail}
          onRequestReopen={(app) => handleOpenReasonModal(app, 'REOPEN')}
        />
      )}

      {/* Drawer: Detailed Applicant Dossier & Assessment Scoring */}
      <ApplicantDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        applicant={selectedApplicant}
        levels={levels}
        currentUser={currentUser}
        onAdvanceStage={handleAdvanceStage}
        onRequestEnrollment={handleRequestEnrollment}
        onRequestReject={(app) => handleOpenReasonModal(app, 'REJECT')}
        onRequestWithdraw={(app) => handleOpenReasonModal(app, 'WITHDRAW')}
        onRequestReopen={(app) => handleOpenReasonModal(app, 'REOPEN')}
      />

      {/* Modal: Final Admitted -> Enrolled with Arm Selector & Admission Number Generator */}
      <EnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        applicant={enrollmentTargetApplicant}
        levels={levels}
        currentUser={currentUser}
        onConfirmEnrollment={handleConfirmEnrollment}
      />

      {/* Modal: Reason for Rejection / Withdrawal / Reopen */}
      <StageActionReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        applicant={reasonModalApplicant}
        actionType={reasonActionType}
        onConfirm={handleConfirmReasonAction}
      />

      {/* Modal: New Admission Application (Admin / Public Portal) */}
      <ApplicationFormModal
        isOpen={isApplicationFormOpen}
        onClose={() => setIsApplicationFormOpen(false)}
        levels={levels}
        existingApplicants={applicants}
        currentUser={currentUser}
        onSubmitApplication={handleSubmitNewApplication}
      />
    </div>
  );
};
