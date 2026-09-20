import React from 'react';
import { Applicant, AdmissionStage } from '../../types';
import { Badge } from '../../design-system/components/Badge';
import {
  FileText,
  Search,
  CheckCircle,
  Award,
  UserCheck,
  Phone,
  GraduationCap,
  ArrowRight,
  Eye,
  AlertOctagon
} from 'lucide-react';

interface KanbanBoardProps {
  applicants: Applicant[];
  searchQuery: string;
  onSelectApplicant: (applicant: Applicant) => void;
  onAdvanceStageQuick: (applicant: Applicant) => void;
  onRequestEnrollment: (applicant: Applicant) => void;
  onRequestReject: (applicant: Applicant) => void;
}

interface ColumnConfig {
  stage: AdmissionStage;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  headerBorder: string;
  badgeVariant: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  colorDot: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    stage: 'APPLIED',
    label: 'Applied',
    sublabel: 'New Submissions',
    icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    headerBorder: 'border-blue-500',
    badgeVariant: 'neutral',
    colorDot: 'bg-blue-500',
  },
  {
    stage: 'UNDER_REVIEW',
    label: 'Under Review',
    sublabel: 'Screening & Eligibility',
    icon: <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    headerBorder: 'border-amber-500',
    badgeVariant: 'warning',
    colorDot: 'bg-amber-500',
  },
  {
    stage: 'ASSESSED',
    label: 'Assessed / Interviewed',
    sublabel: 'Scores & Entrance Exams',
    icon: <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    headerBorder: 'border-purple-500',
    badgeVariant: 'primary',
    colorDot: 'bg-purple-500',
  },
  {
    stage: 'ADMITTED',
    label: 'Admitted',
    sublabel: 'Offer Accepted / Pending Arm',
    icon: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    headerBorder: 'border-emerald-500',
    badgeVariant: 'success',
    colorDot: 'bg-emerald-500',
  },
  {
    stage: 'ENROLLED',
    label: 'Enrolled',
    sublabel: 'Active Student Record',
    icon: <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
    headerBorder: 'border-teal-500',
    badgeVariant: 'success',
    colorDot: 'bg-teal-500',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applicants,
  searchQuery: _searchQuery,
  onSelectApplicant,
  onAdvanceStageQuick,
  onRequestEnrollment,
  onRequestReject,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
      {COLUMNS.map((col) => {
        const stageApplicants = applicants.filter((a) => a.stage === col.stage);

        return (
          <div
            key={col.stage}
            className="flex flex-col rounded-2xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 p-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 shadow-2xs">
                  {col.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                    {col.label}
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {col.sublabel}
                  </p>
                </div>
              </div>
              <Badge variant={col.badgeVariant} size="sm">
                {stageApplicants.length}
              </Badge>
            </div>

            {/* Candidate Cards List */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {stageApplicants.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-neutral-400 dark:text-neutral-600 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl my-4">
                  <span>No applicants in this stage</span>
                </div>
              ) : (
                stageApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-3 shadow-2xs hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer"
                    onClick={() => onSelectApplicant(applicant)}
                  >
                    {/* Top Row: App Number & Gender */}
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-mono text-neutral-500 dark:text-neutral-400 font-medium">
                        {applicant.applicationNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                        {applicant.gender === 'M' ? 'Boy' : 'Girl'}
                      </span>
                    </div>

                    {/* Candidate Name */}
                    <div className="font-bold text-sm text-neutral-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {applicant.firstName} {applicant.middleName ? applicant.middleName + ' ' : ''}{applicant.lastName}
                    </div>

                    {/* Target Level & Arm */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                      <GraduationCap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {applicant.desiredLevel}
                      </span>
                      {applicant.assignedArm ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          • {applicant.assignedArm} Arm
                        </span>
                      ) : applicant.desiredArmPreference ? (
                        <span className="text-neutral-500 text-[11px]">
                          (Pref: {applicant.desiredArmPreference})
                        </span>
                      ) : null}
                    </div>

                    {/* Prior School */}
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mb-2.5">
                      From: {applicant.priorSchool}
                    </div>

                    {/* Assessment Score Badge if available */}
                    {applicant.totalAssessmentScore !== undefined && (
                      <div className="mb-2.5 flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Exam Score</span>
                        <span className="font-mono font-bold">{applicant.totalAssessmentScore.toFixed(1)}%</span>
                      </div>
                    )}

                    {/* Enrolled Admission Number if available */}
                    {applicant.assignedAdmissionNumber && (
                      <div className="mb-2.5 flex items-center justify-between text-xs p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-teal-800 dark:text-teal-300">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Adm No.</span>
                        <span className="font-mono font-bold">{applicant.assignedAdmissionNumber}</span>
                      </div>
                    )}

                    {/* Footer: Guardian & Actions */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-neutral-500 truncate max-w-[120px]">
                        <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{applicant.guardianPhone}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectApplicant(applicant)}
                          title="View Full Dossier"
                          className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {applicant.stage !== 'ENROLLED' && (
                          <button
                            type="button"
                            onClick={() => onRequestReject(applicant)}
                            title="Reject Applicant"
                            className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {applicant.stage === 'ADMITTED' ? (
                          <button
                            type="button"
                            onClick={() => onRequestEnrollment(applicant)}
                            title="Enroll and Assign Arm"
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] shadow-2xs transition-colors"
                          >
                            <UserCheck className="w-3 h-3" />
                            Enroll
                          </button>
                        ) : applicant.stage !== 'ENROLLED' ? (
                          <button
                            type="button"
                            onClick={() => onAdvanceStageQuick(applicant)}
                            title="Advance Stage"
                            className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
