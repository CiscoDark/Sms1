import React, { useState, useId } from 'react';
import { Applicant, ClassLevel, UserProfile } from '../../types';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { generateNextAdmissionNumber } from '../../lib/admissions/admissions-store';
import { getStoredStudents } from '../../lib/migration-store';
import { CheckCircle2, UserCheck, AlertTriangle, Sparkles, RefreshCw, Hash, Users } from 'lucide-react';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  levels: ClassLevel[];
  currentUser: UserProfile;
  onConfirmEnrollment: (
    applicantId: string,
    assignedArm: string,
    admissionNumber: string
  ) => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  applicant,
  levels,
  currentUser: _currentUser,
  onConfirmEnrollment,
}) => {
  const armSelectId = useId();
  const admInputId = useId();
  const dateInputId = useId();

  if (!applicant) return null;

  // Find matching class level
  const targetLevel = levels.find(
    (lvl) =>
      lvl.name.toLowerCase() === applicant.desiredLevel.toLowerCase() ||
      lvl.code.toLowerCase() === applicant.desiredLevel.toLowerCase()
  ) || levels[0];

  // Default arm: check if applicant has arm preference that exists, else first available
  const defaultArm =
    targetLevel?.arms.find(
      (a) => a.name.toLowerCase() === (applicant.desiredArmPreference || '').toLowerCase()
    )?.name ||
    targetLevel?.arms[0]?.name ||
    'Gold';

  const [selectedArm, setSelectedArm] = useState<string>(defaultArm);
  const [admissionNumber, setAdmissionNumber] = useState<string>(() => {
    const existingStudents = getStoredStudents();
    return generateNextAdmissionNumber(existingStudents);
  });
  const [enrollmentDate, setEnrollmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-generate next sequence on button click
  const handleRegenerateAdmNo = () => {
    const existing = getStoredStudents();
    setAdmissionNumber(generateNextAdmissionNumber(existing));
  };

  const selectedArmObj = targetLevel?.arms.find((a) => a.name === selectedArm);
  const enrolledCount = selectedArmObj?.enrolledCount || 0;
  const capacity = selectedArmObj?.capacity || 40;
  const isNearCapacity = enrolledCount >= capacity * 0.9;
  const isOverCapacity = enrolledCount >= capacity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionNumber.trim() || !selectedArm) return;

    setIsSubmitting(true);
    try {
      onConfirmEnrollment(applicant.id, selectedArm, admissionNumber.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Enroll Student & Assign Arm
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
              Finalizing enrollment for {applicant.firstName} {applicant.lastName} ({applicant.applicationNumber})
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Auto-commits to Student Registry</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Complete Enrollment
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Candidate Snapshot Card */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Candidate</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {applicant.firstName} {applicant.middleName ? applicant.middleName + ' ' : ''}{applicant.lastName}
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
              {applicant.gender === 'M' ? 'Male' : 'Female'}
            </span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Desired Level</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {applicant.desiredLevel}
            </span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Assessment Score</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {applicant.totalAssessmentScore ? `${applicant.totalAssessmentScore.toFixed(1)}%` : 'Passed'}
            </span>
          </div>
        </div>

        {/* Arm Selection with Real Capacity Visuals */}
        <div>
          <label htmlFor={armSelectId} className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
            Assign Class Arm in {targetLevel.name}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {targetLevel.arms.map((arm) => {
              const isSelected = selectedArm === arm.name;
              const isFull = (arm.enrolledCount || 0) >= (arm.capacity || 40);
              const occupancyPct = Math.round(((arm.enrolledCount || 0) / (arm.capacity || 40)) * 100);

              return (
                <button
                  key={arm.id || arm.name}
                  type="button"
                  onClick={() => setSelectedArm(arm.name)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                      {arm.name}
                    </span>
                    <Badge
                      variant={isFull ? 'danger' : isSelected ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {arm.enrolledCount || 0}/{arm.capacity || 40}
                    </Badge>
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${
                        occupancyPct >= 95
                          ? 'bg-amber-500'
                          : occupancyPct >= 80
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex justify-between">
                    <span>Occupancy</span>
                    <span className="font-mono">{occupancyPct}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {isOverCapacity && (
            <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Warning:</strong> {selectedArm} has reached its configured capacity limit ({capacity} students). Enrolling will place this arm in over-capacity.
              </span>
            </div>
          )}
          {isNearCapacity && !isOverCapacity && (
            <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>
                {selectedArm} currently has only {capacity - enrolledCount} seat{capacity - enrolledCount > 1 ? 's' : ''} remaining.
              </span>
            </div>
          )}
        </div>

        {/* Auto-Generated Official Admission Number */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={admInputId} className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-neutral-400" />
              Official Admission Number
            </label>
            <button
              type="button"
              onClick={handleRegenerateAdmNo}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh Next Available
            </button>
          </div>
          <div className="relative">
            <input
              id={admInputId}
              type="text"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
              required
              className="w-full px-3.5 py-2.5 text-sm font-mono font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. APA/2024/263"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            System automatically sequentially tracks active students to ensure zero duplicate admission codes.
          </p>
        </div>

        {/* Enrollment Date */}
        <div>
          <label htmlFor={dateInputId} className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Official Enrollment Date
          </label>
          <input
            id={dateInputId}
            type="date"
            value={enrollmentDate}
            onChange={(e) => setEnrollmentDate(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Summary note */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
          <p className="font-semibold mb-0.5">What happens next:</p>
          <ul className="list-disc list-inside space-y-0.5 text-emerald-700 dark:text-emerald-400">
            <li>An official student profile will be instantiated in the active student registry.</li>
            <li>Class arm enrollment statistics and dashboard occupancy metrics will update immediately.</li>
            <li>Applicant record status will transition to <strong>Enrolled</strong> in the admissions archive.</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
};
