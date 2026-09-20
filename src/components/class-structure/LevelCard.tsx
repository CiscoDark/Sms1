import React from 'react';
import { Plus, Users, School, Layers } from 'lucide-react';
import { ClassLevel, ClassArm } from '../../types';
import { Card, Badge, Button, EmptyState } from '../../design-system';
import { InlineEditableLabel } from '../InlineEditableLabel';
import { ArmRow } from './ArmRow';

export interface LevelCardProps {
  level: ClassLevel;
  onRenameLevel: (levelId: string, newName: string) => void;
  onAddArm: (level: ClassLevel) => void;
  onRenameArm: (armId: string, newName: string) => void;
  onViewSnapshot: (arm: ClassArm) => void;
  onEditArm: (arm: ClassArm) => void;
  onDeleteArm: (armId: string) => void;
  canManage?: boolean;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  onRenameLevel,
  onAddArm,
  onRenameArm,
  onViewSnapshot,
  onEditArm,
  onDeleteArm,
  canManage = true,
}) => {
  const totalEnrolled = level.arms.reduce((sum, a) => sum + a.enrolledCount, 0);
  const totalCapacity = level.arms.reduce((sum, a) => sum + a.capacity, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <Card variant="default" className="space-y-4">
      {/* Level Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <InlineEditableLabel
              value={level.name}
              onSave={(newName) => onRenameLevel(level.id, newName)}
              disabled={!canManage}
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            />
            <Badge
              variant={level.category === 'JUNIOR_SECONDARY' ? 'primary' : 'info'}
              size="sm"
            >
              {level.category.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">#{level.code}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span>{level.arms.length} Active Streams/Arms</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>
              {totalEnrolled} / {totalCapacity} Students ({occupancyPercent}% capacity)
            </span>
          </div>
        </div>

        {/* Action to Add Arm */}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddArm(level)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Arm
          </Button>
        )}
      </div>

      {/* Arms List */}
      <div className="space-y-2.5">
        {level.arms.length > 0 ? (
          level.arms.map((arm) => (
            <ArmRow
              key={arm.id}
              arm={arm}
              canManage={canManage}
              onRenameArm={onRenameArm}
              onViewSnapshot={onViewSnapshot}
              onEditArm={onEditArm}
              onDeleteArm={onDeleteArm}
            />
          ))
        ) : (
          <EmptyState
            icon={Layers}
            title="No class arms created yet"
            description="Add streams or arms (e.g. Diamond, Gold, A, B) to allocate students and designate class teachers."
            action={
              canManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddArm(level)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add First Arm
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </Card>
  );
};
