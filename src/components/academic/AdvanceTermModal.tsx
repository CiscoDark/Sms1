import React, { useState } from 'react';
import { ArrowRight, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { AcademicSession, Term, TermAdvanceChecklistState } from '../../types';
import { Modal, Button, Badge } from '../../design-system';
import { TermAdvanceChecklist } from './TermAdvanceChecklist';
import { formatDate } from './format';

export interface AdvanceTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AcademicSession;
  activeTerm: Term;
  nextTerm: Term | null;
  onConfirmAdvance: (
    sessionYear: string,
    currentTermId: string,
    nextTermId: string | null,
    overrideValidation: boolean
  ) => void;
}

export const AdvanceTermModal: React.FC<AdvanceTermModalProps> = ({
  isOpen,
  onClose,
  session,
  activeTerm,
  nextTerm,
  onConfirmAdvance,
}) => {
  const isThirdTerm = activeTerm.name.toLowerCase().includes('third');

  const [checklist, setChecklist] = useState<TermAdvanceChecklistState>({
    gradesFinalized: true,
    attendanceLocked: true,
    feesReconciled: true,
    reportsGenerated: true,
    promotionsApproved: isThirdTerm,
    timetableScheduled: true,
  });

  const [overrideAllowed, setOverrideAllowed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAdvance =
    (checklist.gradesFinalized &&
      checklist.attendanceLocked &&
      checklist.reportsGenerated &&
      (!isThirdTerm || checklist.promotionsApproved)) ||
    overrideAllowed;

  const handleProceed = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmAdvance(
        session.year,
        activeTerm.id,
        nextTerm ? nextTerm.id : null,
        overrideAllowed
      );
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Advance Academic Term
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.name}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {!canAdvance && (
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideAllowed}
                  onChange={(e) => setOverrideAllowed(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span>Administrator Emergency Override</span>
              </label>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!canAdvance}
              onClick={handleProceed}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Advance to {nextTerm ? nextTerm.name : 'New Session'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Transition Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
          {/* Current Term */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Closing Current Term:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {activeTerm.name}
              </span>
              <Badge variant="success" size="sm" hasDot>
                Active
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ends {formatDate(activeTerm.endDate)}
            </p>
          </div>

          {/* Next Term */}
          <div className="space-y-1 sm:border-l sm:pl-4 sm:border-slate-200 dark:sm:border-slate-700">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Activating Subsequent Term:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {nextTerm ? nextTerm.name : 'Next Session (Year-End)'}
              </span>
              <Badge variant="primary" size="sm">
                Next
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {nextTerm ? `Resumption: ${formatDate(nextTerm.startDate)}` : 'Annual Transition'}
            </p>
          </div>
        </div>

        {/* Verification Checklist */}
        <TermAdvanceChecklist
          checklist={checklist}
          onChange={setChecklist}
          isThirdTerm={isThirdTerm}
        />

        {/* Important Notice */}
        <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Advancing the term archives the current active gradebook into read-only mode, updates
            student registration status, and synchronizes the calendar across teacher rosters.
          </p>
        </div>
      </div>
    </Modal>
  );
};
