import React from 'react';
import { Calendar, CheckCircle2, MoreVertical, Edit2, ShieldAlert } from 'lucide-react';
import { AcademicSession, Term } from '../../types';
import { Card, Badge, Button } from '../../design-system';
import { TermRow } from './TermRow';
import { formatDate } from './format';

export interface SessionCardProps {
  session: AcademicSession;
  onAdvanceTerm: (session: AcademicSession, activeTerm: Term) => void;
  onEditTermDates: (session: AcademicSession, term: Term) => void;
  onSetAsCurrent: (session: AcademicSession) => void;
  canManage?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onAdvanceTerm,
  onEditTermDates,
  onSetAsCurrent,
  canManage = true,
}) => {
  const activeTerm = session.terms.find((t) => t.status === 'ACTIVE');
  const completedTerms = session.terms.filter((t) => t.status === 'COMPLETED').length;

  const getSessionBadge = () => {
    switch (session.status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" hasDot>
            Current Active Session
          </Badge>
        );
      case 'COMPLETED':
        return <Badge variant="neutral">Completed Session</Badge>;
      case 'UPCOMING':
        return <Badge variant="info">Upcoming Session</Badge>;
    }
  };

  return (
    <Card
      variant={session.isCurrent ? 'default' : 'subtle'}
      className={`border-l-4 ${
        session.isCurrent
          ? 'border-l-indigo-600 dark:border-l-indigo-500 shadow-sm'
          : 'border-l-slate-300 dark:border-l-slate-700'
      }`}
    >
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {session.name}
            </h3>
            {getSessionBadge()}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {formatDate(session.startDate)} — {formatDate(session.endDate)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>
              {completedTerms} of {session.terms.length} Terms Completed
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {!session.isCurrent && canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetAsCurrent(session)}
            >
              Set as Current Active
            </Button>
          )}
          {session.isCurrent && activeTerm && canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAdvanceTerm(session, activeTerm)}
            >
              Advance {activeTerm.name}
            </Button>
          )}
        </div>
      </div>

      {/* Terms List */}
      <div className="pt-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          <span>Academic Terms Breakdown</span>
          <span>Schedule & Duration</span>
        </div>

        <div className="space-y-2.5">
          {session.terms.map((term) => (
            <TermRow
              key={term.id}
              term={term}
              isSessionActive={session.isCurrent}
              canManage={canManage}
              onAdvanceClick={() => onAdvanceTerm(session, term)}
              onEditClick={() => onEditTermDates(session, term)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};
