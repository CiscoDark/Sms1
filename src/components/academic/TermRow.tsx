import React from 'react';
import { Calendar, Lock, Unlock, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Term } from '../../types';
import { Badge, Button } from '../../design-system';
import { formatDate } from './format';

export interface TermRowProps {
  term: Term;
  isSessionActive: boolean;
  onAdvanceClick?: () => void;
  onEditClick?: () => void;
  canManage?: boolean;
}

export const TermRow: React.FC<TermRowProps> = ({
  term,
  isSessionActive,
  onAdvanceClick,
  onEditClick,
  canManage = true,
}) => {
  const getStatusBadge = () => {
    switch (term.status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" size="sm" hasDot>
            Active Term
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="neutral" size="sm">
            Completed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="info" size="sm">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
        term.status === 'ACTIVE'
          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 shadow-2xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Term info */}
      <div className="flex items-start sm:items-center gap-3.5">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            term.status === 'ACTIVE'
              ? 'bg-indigo-600 text-white'
              : term.status === 'COMPLETED'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              : 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400'
          }`}
        >
          {term.status === 'COMPLETED' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : term.status === 'ACTIVE' ? (
            <Clock className="w-5 h-5" />
          ) : (
            <Calendar className="w-5 h-5" />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {term.name}
            </h4>
            {getStatusBadge()}
            {term.isLocked ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500"
                title="Term gradebook and attendance locked"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Locked</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
                title="Gradebook & registers open"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Open</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span>
              {formatDate(term.startDate)} — {formatDate(term.endDate)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{term.totalWeeks} Teaching Weeks</span>
            {term.resumptionDate && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Resumption: {formatDate(term.resumptionDate)}</span>
              </>
            )}
          </div>
          {term.notes && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">
              {term.notes}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onEditClick && canManage && (
          <Button variant="ghost" size="sm" onClick={onEditClick}>
            Edit Dates
          </Button>
        )}
        {term.status === 'ACTIVE' && onAdvanceClick && canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAdvanceClick}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Advance Term
          </Button>
        )}
      </div>
    </div>
  );
};
