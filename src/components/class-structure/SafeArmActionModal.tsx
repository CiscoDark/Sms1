import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  ShieldCheck,
  Users,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { ClassArm, ClassLevel, SchoolNomenclature } from '../../types';
import { Modal, Button, Badge, Card } from '../../design-system';

export interface SafeArmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  arm: ClassArm | null;
  level: ClassLevel | null;
  allLevels: ClassLevel[];
  nomenclature: SchoolNomenclature;
  onArchiveArm: (armId: string) => void;
  onMigrateAndRetire: (sourceArmId: string, targetArmId: string, migrationReason: string) => void;
  onDirectDeleteEmptyArm: (armId: string) => void;
}

export const SafeArmActionModal: React.FC<SafeArmActionModalProps> = ({
  isOpen,
  onClose,
  arm,
  level,
  allLevels,
  nomenclature,
  onArchiveArm,
  onMigrateAndRetire,
  onDirectDeleteEmptyArm,
}) => {
  if (!arm || !level) return null;

  const hasStudents = arm.enrolledCount > 0;

  // Migration form state
  const availableTargetArms = level.arms.filter((a) => a.id !== arm.id && a.status !== 'INACTIVE');
  const [selectedTargetArmId, setSelectedTargetArmId] = useState<string>(
    availableTargetArms[0]?.id || ''
  );
  const [migrationReason, setMigrationReason] = useState<string>(
    'Stream consolidation and academic cohort restructuring'
  );
  const [activeAction, setActiveAction] = useState<'CHOICE' | 'MIGRATE'>('CHOICE');

  const targetArm = level.arms.find((a) => a.id === selectedTargetArmId);

  const handleConfirmDirectDelete = () => {
    onDirectDeleteEmptyArm(arm.id);
    onClose();
  };

  const handleConfirmArchive = () => {
    onArchiveArm(arm.id);
    onClose();
  };

  const handleConfirmMigrate = () => {
    if (!selectedTargetArmId) return;
    onMigrateAndRetire(arm.id, selectedTargetArmId, migrationReason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${hasStudents ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
            {hasStudents ? <ShieldCheck className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              {hasStudents ? `Safeguard Students in ${level.name} - ${arm.name}` : `Delete Empty ${nomenclature.armTermSingular}`}
            </div>
            <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {hasStudents
                ? 'Non-destructive protection prevents silent student deletion or orphaned records.'
                : 'Confirm removal of this empty stream.'}
            </div>
          </div>
        </div>
      }
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          {!hasStudents ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDirectDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Deletion
            </Button>
          ) : activeAction === 'MIGRATE' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmMigrate}
              disabled={!selectedTargetArmId}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Execute Safe Migration & Retire
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4 text-slate-800 dark:text-slate-200">
        {!hasStudents ? (
          /* Empty arm delete confirmation */
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              This {nomenclature.armTermSingular.toLowerCase()} ({arm.name}) has <strong>0 enrolled students</strong>. Removing it will not impact any existing student cohorts or historical transcripts.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="text-slate-500">Location: <strong>{arm.roomNumber}</strong></div>
              <div className="text-slate-500">Form Master: <strong>{arm.teacherName}</strong></div>
            </div>
          </div>
        ) : activeAction === 'CHOICE' ? (
          /* Choice between Archive vs Migrate */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  System Architectural Rule: Never Drop Students
                </div>
                <div className="text-amber-700 dark:text-amber-300">
                  <strong>{arm.enrolledCount} active students</strong> are currently assigned to this {nomenclature.armTermSingular.toLowerCase()}. Direct deletion is disabled to prevent data loss. Choose a non-destructive path below:
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Option A: Archive Arm */}
              <div
                onClick={handleConfirmArchive}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    <Archive className="w-4 h-4 text-indigo-500" />
                    Option 1: Archive {nomenclature.armTermSingular} (Recommended)
                  </span>
                  <Badge variant="neutral" size="sm">Zero Impact</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sets status to <strong>Archived / Inactive</strong>. All {arm.enrolledCount} students retain their records and transcripts, but this stream is closed to new admissions.
                </p>
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <span>Archive now without touching students</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Option B: Migrate Students */}
              <div
                onClick={() => setActiveAction('MIGRATE')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Option 2: Safe Student Migration Assistant
                  </span>
                  <Badge variant="success" size="sm">Reassign Roster</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Explicitly migrate all {arm.enrolledCount} students to another parallel stream in {level.name}, then retire this arm.
                </p>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Open student migration wizard</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Migration Wizard */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Migrate {arm.enrolledCount} Students from {arm.name}
              </span>
              <button
                type="button"
                onClick={() => setActiveAction('CHOICE')}
                className="text-xs text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
              >
                ← Back to options
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                  Destination Stream in {level.name}
                </label>
                {availableTargetArms.length > 0 ? (
                  <select
                    value={selectedTargetArmId}
                    onChange={(e) => setSelectedTargetArmId(e.target.value)}
                    className="w-full rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 min-h-[38px]"
                  >
                    {availableTargetArms.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Currently {a.enrolledCount} / {a.capacity} students)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-600">
                    No parallel active streams available in {level.name}. Create another stream first or use Option 1 (Archive).
                  </p>
                )}
              </div>

              {targetArm && (
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    New Cohort in <strong>{targetArm.name}</strong>:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {targetArm.enrolledCount} + {arm.enrolledCount} = {targetArm.enrolledCount + arm.enrolledCount} students
                  </span>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                  Administrative Migration Reason
                </label>
                <input
                  type="text"
                  value={migrationReason}
                  onChange={(e) => setMigrationReason(e.target.value)}
                  className="w-full rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 min-h-[38px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
