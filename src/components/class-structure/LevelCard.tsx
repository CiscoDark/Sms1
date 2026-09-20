import React from 'react';
import { Plus, Users, School, Layers } from 'lucide-react';
import { ClassLevel, ClassArm, SchoolNomenclature } from '../../types';
import { Card, Badge, Button, EmptyState } from '../../design-system';
import { InlineEditableLabel } from '../InlineEditableLabel';
import { ArmRow } from './ArmRow';

export interface LevelCardProps {
  level: ClassLevel;
  nomenclature?: SchoolNomenclature;
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
  nomenclature,
  onRenameLevel,
  onAddArm,
  onRenameArm,
  onViewSnapshot,
  onEditArm,
  onDeleteArm,
  canManage = true,
}) => {
  const activeArms = level.arms.filter((a) => a.status !== 'INACTIVE');
  const totalEnrolled = level.arms.reduce((sum, a) => sum + a.enrolledCount, 0);
  const totalCapacity = level.arms.reduce((sum, a) => sum + a.capacity, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const armSingular = nomenclature?.armTermSingular || 'Arm';
  const armPlural = nomenclature?.armTermPlural || 'Arms';

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
            {level.arms.length > activeArms.length && (
              <Badge variant="neutral" size="sm">
                {level.arms.length - activeArms.length} Archived
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span>
              {activeArms.length} Active {armPlural}
            </span>
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
            Add {armSingular}
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
              nomenclature={nomenclature}
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
            title={`No ${armPlural.toLowerCase()} created yet`}
            description={`Add streams or ${armPlural.toLowerCase()} (e.g. Diamond, Gold, A, B) to allocate students and designate class teachers.`}
            action={
              canManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddArm(level)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add First {armSingular}
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </Card>
  );
};
