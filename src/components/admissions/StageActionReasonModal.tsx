import React, { useState } from 'react';
import { Applicant } from '../../types';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { AlertOctagon, UserX, Info } from 'lucide-react';

interface StageActionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  actionType: 'REJECT' | 'WITHDRAW' | 'REOPEN';
  onConfirm: (reason: string) => void;
}

export const StageActionReasonModal: React.FC<StageActionReasonModalProps> = ({
  isOpen,
  onClose,
  applicant,
  actionType,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!applicant) return null;

  const config = {
    REJECT: {
      title: 'Reject Admission Application',
      description: `Provide the institutional reason for rejecting ${applicant.firstName} ${applicant.lastName}. This will be retained in the permanent archive.`,
      icon: <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-500/10',
      confirmLabel: 'Confirm Rejection',
      confirmVariant: 'danger' as const,
      placeholder: 'e.g. Entrance assessment aggregate score (48%) fell below institutional cut-off threshold of 65%...',
      presets: [
        'Failed to meet minimum entrance assessment cut-off score.',
        'Target class level and arm capacity completely exhausted for the academic session.',
        'Institutional policy precludes direct external transfer into terminal examination class.',
        'Incomplete statutory documentation / unverifiable prior school records.',
      ],
    },
    WITHDRAW: {
      title: 'Record Application Withdrawal',
      description: `Record the reason for voluntary withdrawal of ${applicant.firstName} ${applicant.lastName}'s application.`,
      icon: <UserX className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-500/10',
      confirmLabel: 'Confirm Withdrawal',
      confirmVariant: 'secondary' as const,
      placeholder: 'e.g. Guardian relocated internationally to another state / country...',
      presets: [
        'Parent / guardian relocated to another city or country.',
        'Applicant accepted admission offer at an alternative institution.',
        'Family deferring enrollment to the subsequent academic session.',
        'Personal or medical reasons requested by guardian.',
      ],
    },
    REOPEN: {
      title: 'Re-open Archived Application',
      description: `Reconsider or appeal application for ${applicant.firstName} ${applicant.lastName}. This moves the applicant back to Under Review.`,
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-500/10',
      confirmLabel: 'Re-open for Review',
      confirmVariant: 'primary' as const,
      placeholder: 'e.g. Parent submitted supplementary academic transcripts for appeal re-evaluation...',
      presets: [
        'Guardian lodged formal appeal with supplementary academic records.',
        'Additional class capacity opened up in the requested class level.',
        'Administrative review upon candidate re-assessment request.',
      ],
    },
  }[actionType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      onConfirm(reason.trim());
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${config.iconBg}`}>{config.icon}</div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {config.title}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
              {applicant.applicationNumber} • {applicant.desiredLevel}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleSubmit}
            disabled={!reason.trim()}
            isLoading={isSubmitting}
          >
            {config.confirmLabel}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {config.description}
        </p>

        {actionType !== 'REOPEN' && (
          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <span>
              <strong>Archive Integrity Policy:</strong> Rejected and withdrawn applicants remain indefinitely in the institutional admissions archive and are never deleted.
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Documented Reason / Administrative Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            placeholder={config.placeholder}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quick presets */}
        <div>
          <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 font-medium">
            Common Quick Templates:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {config.presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReason(preset)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 transition-colors text-left"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
