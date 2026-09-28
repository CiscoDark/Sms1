import React from 'react';
import { Sparkles, ShieldCheck, Database, HardDrive, WifiOff, X } from 'lucide-react';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';

interface DemoModeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsNew: () => void;
}

export const DemoModeInfoModal: React.FC<DemoModeInfoModalProps> = ({
  isOpen,
  onClose,
  onOpenWhatsNew,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Demo Mode • Architecture Notice"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            Local Frontend Demonstration
          </Badge>
          <span className="text-xs text-slate-400 font-mono">school-apex-001</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          This system is running as a high-fidelity demonstration prototype completely on the frontend.
          All state, audit trails, and mutation queues are persisted directly into your browser&rsquo;s{' '}
          <code className="text-indigo-600 dark:text-indigo-400 font-mono">localStorage</code> and indexed
          write queues.
        </p>

        <div className="space-y-2.5 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-slate-800 dark:text-slate-200">Tenant Isolation Scoped:</strong>
              <div className="text-slate-500 dark:text-slate-400">
                All mock tables and records strictly respect Postgres RLS tenant key{' '}
                <span className="font-mono text-indigo-500">school-apex-001</span>.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-slate-800 dark:text-slate-200">Offline Resilience:</strong>
              <div className="text-slate-500 dark:text-slate-400">
                You can toggle offline mode from the sync drawer. Attendance and grades will queue and
                trigger non-silent conflict diffs on sync.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-slate-800 dark:text-slate-200">Temporal Immutability:</strong>
              <div className="text-slate-500 dark:text-slate-400">
                Report card credentials and historical transcripts use frozen point-in-time snapshots.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onOpenWhatsNew();
            }}
          >
            View Changelog (What&rsquo;s New)
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};
