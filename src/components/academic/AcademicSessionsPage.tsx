import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AcademicSession, Term, Role } from '../../types';
import { Card, Button, Input, Modal, Badge } from '../../design-system';
import { SessionCard } from './SessionCard';
import { AdvanceTermModal } from './AdvanceTermModal';
import { formatDate } from './format';

export interface AcademicSessionsPageProps {
  sessions: AcademicSession[];
  onUpdateSessions: (sessions: AcademicSession[]) => void;
  userRole: Role;
  onLogAudit?: (action: string, details: string) => void;
}

export const AcademicSessionsPage: React.FC<AcademicSessionsPageProps> = ({
  sessions,
  onUpdateSessions,
  userRole,
  onLogAudit,
}) => {
  const canManage = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(userRole);

  // Modals state
  const [advanceModalState, setAdvanceModalState] = useState<{
    isOpen: boolean;
    session: AcademicSession | null;
    activeTerm: Term | null;
    nextTerm: Term | null;
  }>({
    isOpen: false,
    session: null,
    activeTerm: null,
    nextTerm: null,
  });

  const [editTermModalState, setEditTermModalState] = useState<{
    isOpen: boolean;
    session: AcademicSession | null;
    term: Term | null;
    startDate: string;
    endDate: string;
    resumptionDate: string;
  }>({
    isOpen: false,
    session: null,
    term: null,
    startDate: '',
    endDate: '',
    resumptionDate: '',
  });

  const [newSessionModalOpen, setNewSessionModalOpen] = useState(false);
  const [newSessionYear, setNewSessionYear] = useState('2026/2027');
  const [newSessionStartDate, setNewSessionStartDate] = useState('2026-09-07');
  const [newSessionEndDate, setNewSessionEndDate] = useState('2027-07-23');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];
  const activeTerm = currentSession?.terms.find((t) => t.status === 'ACTIVE');

  // Open Advance Term
  const handleOpenAdvanceTerm = (session: AcademicSession, term: Term) => {
    const currentIndex = session.terms.findIndex((t) => t.id === term.id);
    const nextTerm = currentIndex !== -1 && currentIndex + 1 < session.terms.length
      ? session.terms[currentIndex + 1]
      : null;

    setAdvanceModalState({
      isOpen: true,
      session,
      activeTerm: term,
      nextTerm,
    });
  };

  // Confirm Advance Term
  const handleConfirmAdvance = (
    sessionYear: string,
    currentTermId: string,
    nextTermId: string | null
  ) => {
    const updated = sessions.map((sess) => {
      if (sess.year !== sessionYear) return sess;

      const updatedTerms = sess.terms.map((t) => {
        if (t.id === currentTermId) {
          return { ...t, status: 'COMPLETED' as const, isLocked: true };
        }
        if (nextTermId && t.id === nextTermId) {
          return { ...t, status: 'ACTIVE' as const, isLocked: false };
        }
        return t;
      });

      // If no next term in this session, this session is now complete!
      const isSessionComplete = !nextTermId;
      return {
        ...sess,
        terms: updatedTerms,
        status: isSessionComplete ? ('COMPLETED' as const) : sess.status,
        isCurrent: !isSessionComplete,
      };
    });

    onUpdateSessions(updated);
    const msg = nextTermId
      ? `Successfully advanced to next term in ${sessionYear}.`
      : `Session ${sessionYear} completed. Transitioned to new academic calendar.`;
    showToast(msg);
    onLogAudit?.('TERM_ADVANCED', msg);
  };

  // Set as Current Session
  const handleSetAsCurrent = (session: AcademicSession) => {
    const updated = sessions.map((s) => ({
      ...s,
      isCurrent: s.id === session.id,
      status: s.id === session.id ? ('ACTIVE' as const) : s.status === 'ACTIVE' ? ('COMPLETED' as const) : s.status,
    }));
    onUpdateSessions(updated);
    showToast(`${session.name} is now the active primary session.`);
    onLogAudit?.('SESSION_CHANGED', `Activated session ${session.year}`);
  };

  // Edit Term Dates
  const handleOpenEditTerm = (session: AcademicSession, term: Term) => {
    setEditTermModalState({
      isOpen: true,
      session,
      term,
      startDate: term.startDate,
      endDate: term.endDate,
      resumptionDate: term.resumptionDate || '',
    });
  };

  const handleSaveTermDates = () => {
    if (!editTermModalState.session || !editTermModalState.term) return;

    const { session, term, startDate, endDate, resumptionDate } = editTermModalState;
    const updated = sessions.map((s) => {
      if (s.id !== session.id) return s;
      return {
        ...s,
        terms: s.terms.map((t) => {
          if (t.id !== term.id) return t;
          return {
            ...t,
            startDate,
            endDate,
            resumptionDate: resumptionDate || undefined,
          };
        }),
      };
    });

    onUpdateSessions(updated);
    setEditTermModalState((prev) => ({ ...prev, isOpen: false }));
    showToast(`Updated calendar dates for ${term.name}.`);
    onLogAudit?.('TERM_DATES_UPDATED', `Updated schedule for ${session.year} ${term.name}`);
  };

  // Add New Academic Session
  const handleCreateNewSession = () => {
    const newSession: AcademicSession = {
      id: `session-${Date.now()}`,
      year: newSessionYear,
      name: `${newSessionYear} Academic Session`,
      status: 'UPCOMING',
      startDate: newSessionStartDate,
      endDate: newSessionEndDate,
      isCurrent: false,
      terms: [
        {
          id: `term-${Date.now()}-1`,
          name: 'First Term',
          sessionYear: newSessionYear,
          startDate: newSessionStartDate,
          endDate: `${newSessionYear.split('/')[0]}-12-12`,
          resumptionDate: `${newSessionYear.split('/')[1]}-01-05`,
          totalWeeks: 14,
          status: 'PENDING',
          isLocked: true,
        },
        {
          id: `term-${Date.now()}-2`,
          name: 'Second Term',
          sessionYear: newSessionYear,
          startDate: `${newSessionYear.split('/')[1]}-01-05`,
          endDate: `${newSessionYear.split('/')[1]}-04-10`,
          resumptionDate: `${newSessionYear.split('/')[1]}-04-27`,
          totalWeeks: 13,
          status: 'PENDING',
          isLocked: true,
        },
        {
          id: `term-${Date.now()}-3`,
          name: 'Third Term',
          sessionYear: newSessionYear,
          startDate: `${newSessionYear.split('/')[1]}-04-27`,
          endDate: newSessionEndDate,
          totalWeeks: 13,
          status: 'PENDING',
          isLocked: true,
        },
      ],
    };

    onUpdateSessions([newSession, ...sessions]);
    setNewSessionModalOpen(false);
    showToast(`Created new session template for ${newSessionYear}.`);
    onLogAudit?.('SESSION_CREATED', `Created session ${newSessionYear}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-lg text-xs font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Current Academic Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-white/20 backdrop-blur-xs text-white">
              Current Active Period
            </span>
            <span className="text-xs text-indigo-200">
              {currentSession.year} Academic Year
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {activeTerm ? `${activeTerm.name}, ${currentSession.year}` : currentSession.name}
          </h2>
          <p className="text-xs text-indigo-100/80 max-w-xl">
            Active teaching window runs through {formatDate(activeTerm?.endDate)}. Gradebook,
            attendance, and lesson diaries are open for form masters and subject educators.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeTerm && canManage && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleOpenAdvanceTerm(currentSession, activeTerm)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-white text-indigo-900 hover:bg-indigo-50 border-none font-semibold shadow-xs"
            >
              Advance Term
            </Button>
          )}
          {canManage && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setNewSessionModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="border-white/30 text-white hover:bg-white/10"
            >
              New Session
            </Button>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Academic Calendar Sessions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure term dates, monitor session progression, and enforce terminal transitions.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>{sessions.length} Recorded Sessions</span>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-5">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            canManage={canManage}
            onAdvanceTerm={handleOpenAdvanceTerm}
            onEditTermDates={handleOpenEditTerm}
            onSetAsCurrent={handleSetAsCurrent}
          />
        ))}
      </div>

      {/* Advance Term Modal */}
      {advanceModalState.session && advanceModalState.activeTerm && (
        <AdvanceTermModal
          isOpen={advanceModalState.isOpen}
          onClose={() =>
            setAdvanceModalState((prev) => ({ ...prev, isOpen: false }))
          }
          session={advanceModalState.session}
          activeTerm={advanceModalState.activeTerm}
          nextTerm={advanceModalState.nextTerm}
          onConfirmAdvance={handleConfirmAdvance}
        />
      )}

      {/* Edit Term Dates Modal */}
      {editTermModalState.term && (
        <Modal
          isOpen={editTermModalState.isOpen}
          onClose={() =>
            setEditTermModalState((prev) => ({ ...prev, isOpen: false }))
          }
          title={`Edit Dates: ${editTermModalState.term.name}`}
          description={`${editTermModalState.session?.name} calendar schedule`}
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditTermModalState((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveTermDates}>
                Save Changes
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Term Start Date"
              type="date"
              value={editTermModalState.startDate}
              onChange={(e) =>
                setEditTermModalState((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
            />
            <Input
              label="Term End Date"
              type="date"
              value={editTermModalState.endDate}
              onChange={(e) =>
                setEditTermModalState((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
            />
            <Input
              label="Resumption Date (Following Term)"
              type="date"
              value={editTermModalState.resumptionDate}
              onChange={(e) =>
                setEditTermModalState((prev) => ({
                  ...prev,
                  resumptionDate: e.target.value,
                }))
              }
              helperText="Date when students resume for the next academic term"
            />
          </div>
        </Modal>
      )}

      {/* New Academic Session Modal */}
      <Modal
        isOpen={newSessionModalOpen}
        onClose={() => setNewSessionModalOpen(false)}
        title="Create New Academic Session"
        description="Initialize a new annual academic cycle with 3 standard term structures."
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewSessionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateNewSession}>
              Create Session
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Session Academic Year (e.g. 2026/2027)"
            value={newSessionYear}
            onChange={(e) => setNewSessionYear(e.target.value)}
            placeholder="YYYY/YYYY"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Session Start Date"
              type="date"
              value={newSessionStartDate}
              onChange={(e) => setNewSessionStartDate(e.target.value)}
            />
            <Input
              label="Session End Date"
              type="date"
              value={newSessionEndDate}
              onChange={(e) => setNewSessionEndDate(e.target.value)}
            />
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500 dark:text-slate-400">
            <p>
              By default, 3 terms (First, Second, Third) will be pre-generated with
              standard 13-14 week durations. You can adjust exact break periods and
              vacation dates afterward.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
