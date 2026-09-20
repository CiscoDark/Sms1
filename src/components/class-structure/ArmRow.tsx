import React from 'react';
import { Users, DoorOpen, Award, UserCheck, Eye, Trash2, Settings, ShieldAlert, Crown } from 'lucide-react';
import { ClassArm, SchoolNomenclature } from '../../types';
import { Badge, Button } from '../../design-system';
import { InlineEditableLabel } from '../InlineEditableLabel';

export interface ArmRowProps {
  arm: ClassArm;
  nomenclature?: SchoolNomenclature;
  onRenameArm: (armId: string, newName: string) => void;
  onViewSnapshot: (arm: ClassArm) => void;
  onEditArm: (arm: ClassArm) => void;
  onDeleteArm: (armId: string) => void;
  canManage?: boolean;
}

export const ArmRow: React.FC<ArmRowProps> = ({
  arm,
  nomenclature,
  onRenameArm,
  onViewSnapshot,
  onEditArm,
  onDeleteArm,
  canManage = true,
}) => {
  const occupancyPercentage = Math.round((arm.enrolledCount / arm.capacity) * 100);
  const isNearCapacity = occupancyPercentage >= 90;
  const isOverCapacity = occupancyPercentage > 100;
  const isArchived = arm.status === 'INACTIVE';

  return (
    <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all ${
      isArchived
        ? 'border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 opacity-80'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      {/* Arm Identifiers & Teacher */}
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold shrink-0 text-sm ${
          isArchived
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
        }`}>
          {arm.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <InlineEditableLabel
              value={arm.name}
              onSave={(newName) => onRenameArm(arm.id, newName)}
              disabled={!canManage || isArchived}
              className="text-sm font-bold text-slate-900 dark:text-slate-100"
            />
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {arm.code}
            </span>
            {isArchived && (
              <Badge variant="neutral" size="sm">
                Archived
              </Badge>
            )}
            {arm.classCaptainName && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Captain: {arm.classCaptainName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {arm.teacherName}
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{arm.roomNumber}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics & Occupancy Bar */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-stretch lg:self-center">
        {/* Capacity bar */}
        <div className="min-w-[130px] flex-1 sm:flex-initial space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Enrollment</span>
            </span>
            <span
              className={`font-semibold ${
                isOverCapacity
                  ? 'text-rose-600 dark:text-rose-400'
                  : isNearCapacity
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {arm.enrolledCount} / {arm.capacity} ({occupancyPercentage}%)
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverCapacity
                  ? 'bg-rose-500'
                  : isNearCapacity
                  ? 'bg-amber-500'
                  : 'bg-indigo-600 dark:bg-indigo-400'
              }`}
              style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
            />
          </div>
        </div>

        {/* Gender distribution & Performance badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <Badge variant="neutral" size="sm">
            {arm.maleCount}M : {arm.femaleCount}F
          </Badge>
          <Badge variant="primary" size="sm">
            Avg: {arm.averageGrade}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-auto lg:ml-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewSnapshot(arm)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            title="View Class Assignment Snapshot"
          >
            Roster & Snapshot
          </Button>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditArm(arm)}
              title="Configure Arm & Captains"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => onDeleteArm(arm.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title={arm.enrolledCount > 0 ? "Safely Manage or Archive Stream" : "Delete Empty Arm"}
            >
              {arm.enrolledCount > 0 ? <ShieldAlert className="w-3.5 h-3.5 text-amber-500 hover:text-amber-600" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
