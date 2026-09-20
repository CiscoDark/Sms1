import React, { useState } from 'react';
import { Applicant, AdmissionStage, AssessmentScore, UserProfile, ClassLevel } from '../../types';
import { Drawer } from '../../design-system/components/Drawer';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import {
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  AlertOctagon,
  UserX,
  History,
  ArrowRight,
  UserCheck,
  Save,
  Clock,
  Plus,
  Trash2,
  Award
} from 'lucide-react';

interface ApplicantDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  levels: ClassLevel[];
  currentUser: UserProfile;
  onAdvanceStage: (
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
  ) => void;
  onRequestEnrollment: (applicant: Applicant) => void;
  onRequestReject: (applicant: Applicant) => void;
  onRequestWithdraw: (applicant: Applicant) => void;
  onRequestReopen: (applicant: Applicant) => void;
}

const STAGES_ORDER: { key: AdmissionStage; label: string; desc: string }[] = [
  { key: 'APPLIED', label: 'Applied', desc: 'Initial inquiry & form submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review', desc: 'Credentials & transcript review' },
  { key: 'ASSESSED', label: 'Assessed / Interviewed', desc: 'Entrance test & evaluation' },
  { key: 'ADMITTED', label: 'Admitted', desc: 'Formal admission offer issued' },
  { key: 'ENROLLED', label: 'Enrolled', desc: 'Registered student & arm assigned' },
];

export const ApplicantDetailDrawer: React.FC<ApplicantDetailDrawerProps> = ({
  isOpen,
  onClose,
  applicant,
  levels: _levels,
  currentUser,
  onAdvanceStage,
  onRequestEnrollment,
  onRequestReject,
  onRequestWithdraw,
  onRequestReopen,
}) => {
  if (!applicant) return null;

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment' | 'history'>('overview');

  // Local state for assessment editing
  const [assessmentNotes, setAssessmentNotes] = useState(applicant.assessmentNotes || '');
  const [interviewerName, setInterviewerName] = useState(
    applicant.interviewerName || `${currentUser.name} (${currentUser.title || currentUser.role})`
  );
  const [assessmentDate, setAssessmentDate] = useState(
    applicant.assessmentDate || new Date().toISOString().split('T')[0]
  );
  const [scores, setScores] = useState<AssessmentScore[]>(
    applicant.assessmentScores || [
      { subject: 'Mathematics', score: 85, maxScore: 100 },
      { subject: 'English Language', score: 88, maxScore: 100 },
      { subject: 'General Science & Aptitude', score: 82, maxScore: 100 },
    ]
  );
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Calculate aggregate score
  const totalScoreCalc = scores.length
    ? Math.round(
        (scores.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 100, 0) /
          scores.length) *
          10
      ) / 10
    : 0;

  const currentStageIndex = STAGES_ORDER.findIndex((s) => s.key === applicant.stage);
  const isArchived = applicant.stage === 'REJECTED' || applicant.stage === 'WITHDRAWN';

  const handleScoreChange = (index: number, field: 'subject' | 'score' | 'maxScore', val: any) => {
    const next = [...scores];
    next[index] = {
      ...next[index],
      [field]: field === 'subject' ? val : Number(val) || 0,
    };
    setScores(next);
  };

  const handleAddScoreRow = () => {
    setScores([...scores, { subject: 'Subject Exam', score: 75, maxScore: 100 }]);
  };

  const handleRemoveScoreRow = (idx: number) => {
    setScores(scores.filter((_, i) => i !== idx));
  };

  const handleSaveAssessment = () => {
    setIsSavingScores(true);
    try {
      onAdvanceStage(applicant.id, applicant.stage, {
        assessmentScores: scores,
        totalAssessmentScore: totalScoreCalc,
        assessmentNotes: assessmentNotes.trim(),
        interviewerName: interviewerName.trim(),
        assessmentDate,
        notes: `Updated entrance assessment scores (${totalScoreCalc}%) and evaluator notes.`,
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } finally {
      setIsSavingScores(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            {applicant.firstName[0]}
            {applicant.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {applicant.firstName} {applicant.middleName ? applicant.middleName + ' ' : ''}{applicant.lastName}
              </h3>
              <Badge
                variant={
                  applicant.stage === 'ENROLLED'
                    ? 'success'
                    : applicant.stage === 'REJECTED'
                    ? 'danger'
                    : applicant.stage === 'WITHDRAWN'
                    ? 'warning'
                    : applicant.stage === 'ADMITTED'
                    ? 'primary'
                    : 'neutral'
                }
                size="sm"
              >
                {applicant.stage.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              {applicant.applicationNumber} • Desired: {applicant.desiredLevel}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {!isArchived && applicant.stage !== 'ENROLLED' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestReject(applicant)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestWithdraw(applicant)}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <UserX className="w-3.5 h-3.5 mr-1" />
                  Withdraw
                </Button>
              </>
            )}
            {isArchived && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRequestReopen(applicant)}
              >
                Re-open Application / Appeal
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} size="sm">
              Close
            </Button>

            {applicant.stage === 'APPLIED' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() =>
                  onAdvanceStage(applicant.id, 'UNDER_REVIEW', {
                    notes: 'Marked under academic review.',
                  })
                }
              >
                Advance to Under Review
              </Button>
            )}

            {applicant.stage === 'UNDER_REVIEW' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() =>
                  onAdvanceStage(applicant.id, 'ASSESSED', {
                    notes: 'Proceeded to entrance examination and interview assessment.',
                  })
                }
              >
                Proceed to Assessment
              </Button>
            )}

            {applicant.stage === 'ASSESSED' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Award className="w-3.5 h-3.5" />}
                onClick={() =>
                  onAdvanceStage(applicant.id, 'ADMITTED', {
                    notes: `Formal admission offer extended with assessment score of ${applicant.totalAssessmentScore || totalScoreCalc}%.`,
                  })
                }
              >
                Grant Admission Offer
              </Button>
            )}

            {applicant.stage === 'ADMITTED' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                onClick={() => onRequestEnrollment(applicant)}
              >
                Enroll & Assign Arm
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stage Progress Stepper */}
        {!isArchived ? (
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
              Admission Pipeline Stage
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2 z-0" />
              {STAGES_ORDER.map((s, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div
                    key={s.key}
                    className="relative z-10 flex flex-col items-center text-center group cursor-default"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                        isCurrent
                          ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {s.label.split(' / ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-300">
              <strong className="block font-semibold">
                Application Status: {applicant.stage}
              </strong>
              <span>
                {applicant.stage === 'REJECTED'
                  ? applicant.rejectionReason
                  : applicant.withdrawalReason}
              </span>
              <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-400">
                This record remains indefinitely in the archived register and is never removed.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Applicant Dossier
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'assessment'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>Assessment & Notes</span>
            {applicant.totalAssessmentScore !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                {applicant.totalAssessmentScore.toFixed(0)}%
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>Stage History</span>
            <span className="text-xs text-neutral-400">({applicant.stageHistory.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Enrollment Callout if Enrolled */}
            {applicant.stage === 'ENROLLED' && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Official Student Registered
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-500 block">Admission Number:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                      {applicant.assignedAdmissionNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-500 block">Assigned Arm:</span>
                    <span className="font-bold text-neutral-900 dark:text-white text-sm">
                      {applicant.desiredLevel} - {applicant.assignedArm}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Student Personal Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-neutral-500 block">Gender</span>
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {applicant.gender === 'M' ? 'Male (Boy)' : 'Female (Girl)'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-neutral-500 block">Date of Birth</span>
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {applicant.dateOfBirth}
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-neutral-500 block">Residential Address</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {applicant.residentialAddress || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Academic Interest & Prior School
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-neutral-500 block">Desired Class Level</span>
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {applicant.desiredLevel}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-neutral-500 block">Stream / Arm Preference</span>
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {applicant.desiredArmPreference || 'Any available arm'}
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-neutral-500 block">Previous Institution Attended</span>
                  <span className="font-medium text-neutral-900 dark:text-white text-sm">
                    {applicant.priorSchool}
                  </span>
                  {applicant.priorGradeAverage && (
                    <div className="mt-1 text-emerald-600 dark:text-emerald-400">
                      Prior Record / Transcripts: {applicant.priorGradeAverage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guardian & Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Guardian Information
              </h4>
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 dark:text-white text-sm">
                    {applicant.guardianName}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {applicant.guardianRelationship}
                  </Badge>
                </div>
                {applicant.guardianOccupation && (
                  <div className="text-neutral-600 dark:text-neutral-400">
                    Occupation: {applicant.guardianOccupation}
                  </div>
                )}
                <div className="flex flex-wrap gap-4 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <a
                    href={`tel:${applicant.guardianPhone}`}
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-mono"
                  >
                    <Phone className="w-3 h-3" />
                    {applicant.guardianPhone}
                  </a>
                  {applicant.guardianEmail && (
                    <a
                      href={`mailto:${applicant.guardianEmail}`}
                      className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Mail className="w-3 h-3" />
                      {applicant.guardianEmail}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assessment & Interview Notes */}
        {activeTab === 'assessment' && (
          <div className="space-y-5">
            {saveSuccessNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Assessment and evaluator notes saved successfully!
              </div>
            )}

            {/* Assessment Score Grid */}
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Entrance Exam Scores
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Aggregate:</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {totalScoreCalc}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddScoreRow}
                    className="text-xs py-1"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Subject
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {scores.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={s.subject}
                      onChange={(e) => handleScoreChange(idx, 'subject', e.target.value)}
                      placeholder="Subject Name"
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.score}
                        onChange={(e) => handleScoreChange(idx, 'score', e.target.value)}
                        className="w-16 px-2 py-1.5 text-xs text-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono font-medium text-neutral-900 dark:text-white"
                      />
                      <span className="text-xs text-neutral-400">/</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={s.maxScore}
                        onChange={(e) => handleScoreChange(idx, 'maxScore', e.target.value)}
                        className="w-14 px-2 py-1.5 text-xs text-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                      />
                    </div>
                    {scores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScoreRow(idx)}
                        className="text-neutral-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluator Notes & Metadata */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Interview & Assessment Observations
                </label>
                <textarea
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  rows={4}
                  placeholder="Record verbal comprehension, conduct, academic strengths, and recommendation..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-1">Interviewer / Examiner</label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Assessment Date</label>
                  <input
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAssessment}
                  isLoading={isSavingScores}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Assessment Notes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Stage History Timeline */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Administrative Audit Log
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
              {applicant.stageHistory.map((hist) => (
                <div key={hist.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 border-2 border-emerald-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {hist.stage.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hist.changedAt}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      By: {hist.changedBy}
                    </div>
                    {hist.notes && (
                      <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/40 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60">
                        {hist.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
