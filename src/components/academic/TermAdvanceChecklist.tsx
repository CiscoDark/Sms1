import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { TermAdvanceChecklistState } from '../../types';
import { Badge, ProgressRing } from '../../design-system';

export interface TermAdvanceChecklistProps {
  checklist: TermAdvanceChecklistState;
  onChange: (updated: TermAdvanceChecklistState) => void;
  isThirdTerm?: boolean;
}

export const TermAdvanceChecklist: React.FC<TermAdvanceChecklistProps> = ({
  checklist,
  onChange,
  isThirdTerm = false,
}) => {
  const toggleItem = (key: keyof TermAdvanceChecklistState) => {
    onChange({
      ...checklist,
      [key]: !checklist[key],
    });
  };

  const items = [
    {
      key: 'gradesFinalized' as const,
      title: 'Finalize Assessment & Exam Grades',
      description: 'All subject teachers have submitted continuous assessment (CA) and terminal exam scores.',
      critical: true,
      completed: checklist.gradesFinalized,
    },
    {
      key: 'attendanceLocked' as const,
      title: 'Lock Daily Attendance Registers',
      description: 'Marking registers closed and daily roll calls validated across all class arms.',
      critical: true,
      completed: checklist.attendanceLocked,
    },
    {
      key: 'feesReconciled' as const,
      title: 'Bursary & Fee Reconciliation',
      description: 'Outstanding payments logged and financial ledger reconciled for this billing cycle.',
      critical: false,
      completed: checklist.feesReconciled,
    },
    {
      key: 'reportsGenerated' as const,
      title: 'Generate Terminal Report Cards',
      description: 'Automated calculation of student positions, remarks, and psychomotor ratings completed.',
      critical: true,
      completed: checklist.reportsGenerated,
    },
    ...(isThirdTerm
      ? [
          {
            key: 'promotionsApproved' as const,
            title: 'Approve Cohort Promotion & Placement',
            description: 'Year-end promotion criteria applied to advance students to subsequent class levels.',
            critical: true,
            completed: checklist.promotionsApproved,
          },
        ]
      : []),
    {
      key: 'timetableScheduled' as const,
      title: 'Review Upcoming Term Calendar & Timetable',
      description: 'Resumption dates confirmed and subject periods allocated for staff assignments.',
      critical: false,
      completed: checklist.timetableScheduled,
    },
  ];

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const allCriticalDone = items.filter((i) => i.critical).every((i) => i.completed);

  return (
    <div className="space-y-5">
      {/* Header with Progress Ring */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Pre-Advancement Verification
            </h4>
            <Badge
              variant={percentage === 100 ? 'success' : allCriticalDone ? 'info' : 'warning'}
              size="sm"
            >
              {completedCount} of {totalCount} Ready
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify key academic requirements before committing the term transition.
          </p>
        </div>
        <ProgressRing
          percentage={percentage}
          size={52}
          strokeWidth={4}
          color={percentage === 100 ? 'success' : percentage >= 70 ? 'primary' : 'warning'}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2.5">
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => toggleItem(item.key)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
              item.completed
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 transition-colors" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-medium ${
                    item.completed
                      ? 'text-emerald-950 dark:text-emerald-200'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {item.title}
                </span>
                {item.critical && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                    Mandatory
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!allCriticalDone && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Mandatory criteria must be satisfied or acknowledged by authorized personnel before advancing.
          </span>
        </div>
      )}
    </div>
  );
};
