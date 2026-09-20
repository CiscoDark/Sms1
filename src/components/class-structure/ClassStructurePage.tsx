import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  Layers,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Wand2,
  Lock,
  Crown,
  ShieldCheck,
  Archive,
} from 'lucide-react';
import { ClassLevel, ClassArm, EducationCategory, Role, SchoolNomenclature } from '../../types';
import { FACULTY_MEMBERS } from '../../data/mockData';
import { Card, Button, Input, Modal, Badge, ProgressRing } from '../../design-system';
import { LevelCard } from './LevelCard';
import { ClassAssignmentSnapshotDrawer } from './ClassAssignmentSnapshotDrawer';
import { NomenclatureSettingsModal } from './NomenclatureSettingsModal';
import { HierarchyBuilderModal } from './HierarchyBuilderModal';
import { TemporalImmutabilityModal } from './TemporalImmutabilityModal';
import { SafeArmActionModal } from './SafeArmActionModal';
import {
  getSchoolNomenclature,
  saveSchoolNomenclature,
  recordArmRenameSnapshot,
} from '../../lib/class-structure-store';

export interface ClassStructurePageProps {
  levels: ClassLevel[];
  onUpdateLevels: (levels: ClassLevel[]) => void;
  userRole: Role;
  onLogAudit?: (action: string, details: string) => void;
}

export const ClassStructurePage: React.FC<ClassStructurePageProps> = ({
  levels,
  onUpdateLevels,
  userRole,
  onLogAudit,
}) => {
  const canManage = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(userRole);

  const [nomenclature, setNomenclature] = useState<SchoolNomenclature>(getSchoolNomenclature());
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | EducationCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isNomenclatureOpen, setIsNomenclatureOpen] = useState(false);
  const [isHierarchyBuilderOpen, setIsHierarchyBuilderOpen] = useState(false);
  const [isTemporalImmutabilityOpen, setIsTemporalImmutabilityOpen] = useState(false);

  // Safe arm action modal state
  const [safeArmModal, setSafeArmModal] = useState<{
    isOpen: boolean;
    arm: ClassArm | null;
    level: ClassLevel | null;
  }>({
    isOpen: false,
    arm: null,
    level: null,
  });

  // Snapshot drawer state
  const [snapshotState, setSnapshotState] = useState<{
    isOpen: boolean;
    arm: ClassArm | null;
    level: ClassLevel | null;
  }>({
    isOpen: false,
    arm: null,
    level: null,
  });

  // Add Arm Modal
  const [addArmModal, setAddArmModal] = useState<{
    isOpen: boolean;
    level: ClassLevel | null;
    armName: string;
    roomNumber: string;
    capacity: number;
    teacherId: string;
  }>({
    isOpen: false,
    level: null,
    armName: '',
    roomNumber: '',
    capacity: 35,
    teacherId: FACULTY_MEMBERS[0]?.id || '',
  });

  // Edit Arm Modal
  const [editArmModal, setEditArmModal] = useState<{
    isOpen: boolean;
    arm: ClassArm | null;
    armName: string;
    roomNumber: string;
    capacity: number;
    teacherId: string;
    classCaptainName: string;
    assistantCaptainName: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    isOpen: false,
    arm: null,
    armName: '',
    roomNumber: '',
    capacity: 35,
    teacherId: '',
    classCaptainName: '',
    assistantCaptainName: '',
    status: 'ACTIVE',
  });

  // Add Level Modal
  const [addLevelModal, setAddLevelModal] = useState<{
    isOpen: boolean;
    name: string;
    code: string;
    category: EducationCategory;
  }>({
    isOpen: false,
    name: '',
    code: '',
    category: 'JUNIOR_SECONDARY',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Calculations
  const allArms = levels.flatMap((l) => l.arms);
  const activeArms = allArms.filter((a) => a.status !== 'INACTIVE');
  const totalStudents = allArms.reduce((sum, a) => sum + a.enrolledCount, 0);
  const totalCapacity = activeArms.reduce((sum, a) => sum + a.capacity, 0);
  const schoolOccupancyRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  // Filter levels
  const filteredLevels = levels.filter((lvl) => {
    const matchesCategory = categoryFilter === 'ALL' || lvl.category === categoryFilter;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesLevel = lvl.name.toLowerCase().includes(q) || lvl.code.toLowerCase().includes(q);
    const matchesArm = lvl.arms.some(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.teacherName.toLowerCase().includes(q) ||
        a.roomNumber.toLowerCase().includes(q) ||
        (a.classCaptainName && a.classCaptainName.toLowerCase().includes(q))
    );
    return matchesLevel || matchesArm;
  });

  // Nomenclature save
  const handleSaveNomenclature = (updated: SchoolNomenclature) => {
    setNomenclature(updated);
    saveSchoolNomenclature(updated);
    showToast(`School terminology updated to ${updated.levelTermSingular} / ${updated.armTermSingular}.`);
    onLogAudit?.('NOMENCLATURE_UPDATED', `Updated terminology: Level=${updated.levelTermSingular}, Arm=${updated.armTermSingular}`);
  };

  // Apply Hierarchy from Builder
  const handleApplyHierarchy = (newLevels: ClassLevel[], isAdditiveMerge: boolean) => {
    let finalLevels: ClassLevel[];
    if (isAdditiveMerge) {
      finalLevels = [...levels, ...newLevels];
    } else {
      finalLevels = newLevels;
    }
    onUpdateLevels(finalLevels);
    showToast(`Configured hierarchy with ${finalLevels.length} total ${nomenclature.levelTermPlural.toLowerCase()}.`);
    onLogAudit?.('HIERARCHY_RESTRUCTURED', `Configured hierarchy with ${newLevels.length} new ${nomenclature.levelTermPlural.toLowerCase()} (Additive: ${isAdditiveMerge})`);
  };

  // Rename Level
  const handleRenameLevel = (levelId: string, newName: string) => {
    const updated = levels.map((l) => (l.id === levelId ? { ...l, name: newName } : l));
    onUpdateLevels(updated);
    showToast(`${nomenclature.levelTermSingular} renamed to ${newName}`);
    onLogAudit?.('LEVEL_RENAMED', `Renamed level ${levelId} to ${newName}`);
  };

  // Rename Arm with Invariant #3 Temporal Immutability Snapshot
  const handleRenameArm = (armId: string, newName: string) => {
    const parentLevel = levels.find((l) => l.arms.some((a) => a.id === armId));
    const targetArm = parentLevel?.arms.find((a) => a.id === armId);

    if (parentLevel && targetArm && targetArm.name !== newName) {
      // Mint point-in-time snapshot to ensure historical reports are completely immune to this rename
      const snapshot = recordArmRenameSnapshot(
        targetArm,
        parentLevel,
        newName,
        userRole,
        'Class arm administrative renaming'
      );
      onLogAudit?.(
        'TEMPORAL_SNAPSHOT_RECORDED',
        `Minted point-in-time snapshot ${snapshot.id} when renaming ${targetArm.name} to ${newName}`
      );
    }

    const updated = levels.map((lvl) => ({
      ...lvl,
      arms: lvl.arms.map((a) => (a.id === armId ? { ...a, name: newName } : a)),
    }));
    onUpdateLevels(updated);
    showToast(`${nomenclature.armTermSingular} renamed to ${newName} (Temporal Snapshot minted)`);
  };

  // Open Snapshot
  const handleViewSnapshot = (arm: ClassArm) => {
    const foundLevel = levels.find((l) => l.id === arm.levelId) || null;
    setSnapshotState({
      isOpen: true,
      arm,
      level: foundLevel,
    });
  };

  // Open Add Arm
  const handleOpenAddArm = (level: ClassLevel) => {
    setAddArmModal({
      isOpen: true,
      level,
      armName: '',
      roomNumber: `Block ${level.code.startsWith('JSS') ? 'A' : 'B'} - Room ${100 + level.arms.length + 1}`,
      capacity: 35,
      teacherId: FACULTY_MEMBERS[0]?.id || '',
    });
  };

  // Submit Add Arm
  const handleSubmitAddArm = () => {
    if (!addArmModal.level || !addArmModal.armName.trim()) return;

    const teacher = FACULTY_MEMBERS.find((f) => f.id === addArmModal.teacherId) || FACULTY_MEMBERS[0];
    const newArm: ClassArm = {
      id: `arm-${Date.now()}`,
      levelId: addArmModal.level.id,
      name: addArmModal.armName.trim(),
      code: `${addArmModal.level.code}-${addArmModal.armName.charAt(0).toUpperCase()}`,
      roomNumber: addArmModal.roomNumber,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      capacity: Number(addArmModal.capacity) || 35,
      enrolledCount: 0,
      status: 'ACTIVE',
      maleCount: 0,
      femaleCount: 0,
      averageGrade: 'Pending',
      attendanceRate: 100,
    };

    const updated = levels.map((lvl) => {
      if (lvl.id !== addArmModal.level?.id) return lvl;
      return {
        ...lvl,
        arms: [...lvl.arms, newArm],
      };
    });

    onUpdateLevels(updated);
    setAddArmModal((prev) => ({ ...prev, isOpen: false }));
    showToast(`Added ${nomenclature.armTermSingular.toLowerCase()} ${newArm.name} to ${addArmModal.level.name}.`);
    onLogAudit?.('ARM_CREATED', `Created arm ${newArm.name} for ${addArmModal.level.name}`);
  };

  // Open Edit Arm
  const handleOpenEditArm = (arm: ClassArm) => {
    setEditArmModal({
      isOpen: true,
      arm,
      armName: arm.name,
      roomNumber: arm.roomNumber,
      capacity: arm.capacity,
      teacherId: arm.teacherId,
      classCaptainName: arm.classCaptainName || '',
      assistantCaptainName: arm.assistantCaptainName || '',
      status: arm.status,
    });
  };

  // Submit Edit Arm
  const handleSubmitEditArm = () => {
    if (!editArmModal.arm || !editArmModal.armName.trim()) return;

    const teacher = FACULTY_MEMBERS.find((f) => f.id === editArmModal.teacherId);
    const parentLevel = levels.find((l) => l.arms.some((a) => a.id === editArmModal.arm?.id));

    // If renamed, record temporal snapshot
    if (parentLevel && editArmModal.arm.name !== editArmModal.armName.trim()) {
      recordArmRenameSnapshot(
        editArmModal.arm,
        parentLevel,
        editArmModal.armName.trim(),
        userRole,
        'Class arm configuration update'
      );
    }

    const updated = levels.map((lvl) => ({
      ...lvl,
      arms: lvl.arms.map((a) => {
        if (a.id !== editArmModal.arm?.id) return a;
        return {
          ...a,
          name: editArmModal.armName.trim(),
          roomNumber: editArmModal.roomNumber,
          capacity: Number(editArmModal.capacity),
          teacherId: teacher ? teacher.id : a.teacherId,
          teacherName: teacher ? teacher.name : a.teacherName,
          teacherEmail: teacher ? teacher.email : a.teacherEmail,
          classCaptainName: editArmModal.classCaptainName.trim() || undefined,
          assistantCaptainName: editArmModal.assistantCaptainName.trim() || undefined,
          status: editArmModal.status,
        };
      }),
    }));

    onUpdateLevels(updated);
    setEditArmModal((prev) => ({ ...prev, isOpen: false }));
    showToast(`Updated details for ${editArmModal.armName}.`);
    onLogAudit?.('ARM_UPDATED', `Updated arm settings & captains for ${editArmModal.armName}`);
  };

  // Safe delete handler: Open SafeArmActionModal
  const handleTriggerDeleteArm = (armId: string) => {
    const parentLevel = levels.find((l) => l.arms.some((a) => a.id === armId));
    const arm = parentLevel?.arms.find((a) => a.id === armId);
    if (!parentLevel || !arm) return;

    setSafeArmModal({
      isOpen: true,
      arm,
      level: parentLevel,
    });
  };

  // Non-destructive Archive Arm
  const handleArchiveArm = (armId: string) => {
    const updated = levels.map((lvl) => ({
      ...lvl,
      arms: lvl.arms.map((a) => (a.id === armId ? { ...a, status: 'INACTIVE' as const } : a)),
    }));
    onUpdateLevels(updated);
    showToast(`Arm archived safely. Students remain enrolled and records are preserved.`);
    onLogAudit?.('ARM_ARCHIVED', `Archived arm ${armId} without dropping students`);
  };

  // Non-destructive Student Migration & Retire
  const handleMigrateAndRetire = (sourceArmId: string, targetArmId: string, reason: string) => {
    let transferredCount = 0;
    const updated = levels.map((lvl) => {
      const sourceArm = lvl.arms.find((a) => a.id === sourceArmId);
      if (!sourceArm) return lvl;
      transferredCount = sourceArm.enrolledCount;

      return {
        ...lvl,
        arms: lvl.arms.map((a) => {
          if (a.id === targetArmId) {
            return {
              ...a,
              enrolledCount: a.enrolledCount + transferredCount,
              maleCount: a.maleCount + sourceArm.maleCount,
              femaleCount: a.femaleCount + sourceArm.femaleCount,
            };
          }
          if (a.id === sourceArmId) {
            return {
              ...a,
              enrolledCount: 0,
              maleCount: 0,
              femaleCount: 0,
              status: 'INACTIVE' as const,
            };
          }
          return a;
        }),
      };
    });

    onUpdateLevels(updated);
    showToast(`Safely migrated ${transferredCount} students to target stream. Source arm retired.`);
    onLogAudit?.('STUDENTS_MIGRATED', `Migrated ${transferredCount} students from ${sourceArmId} to ${targetArmId}. Reason: ${reason}`);
  };

  // Direct delete empty arm
  const handleDirectDeleteEmptyArm = (armId: string) => {
    const updated = levels.map((lvl) => ({
      ...lvl,
      arms: lvl.arms.filter((a) => a.id !== armId),
    }));
    onUpdateLevels(updated);
    showToast(`Empty ${nomenclature.armTermSingular.toLowerCase()} removed.`);
    onLogAudit?.('ARM_DELETED', `Deleted empty arm ${armId}`);
  };

  // Submit Add Level
  const handleSubmitAddLevel = () => {
    if (!addLevelModal.name.trim() || !addLevelModal.code.trim()) return;

    const newLevel: ClassLevel = {
      id: `lvl-${Date.now()}`,
      name: addLevelModal.name.trim(),
      code: addLevelModal.code.trim().toUpperCase(),
      category: addLevelModal.category,
      order: levels.length + 1,
      arms: [],
    };

    onUpdateLevels([...levels, newLevel]);
    setAddLevelModal({
      isOpen: false,
      name: '',
      code: '',
      category: 'JUNIOR_SECONDARY',
    });
    showToast(`Created ${nomenclature.levelTermSingular.toLowerCase()}: ${newLevel.name}`);
    onLogAudit?.('LEVEL_CREATED', `Created level ${newLevel.name}`);
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

      {/* Top Banner with Architecture Invariant Proof & Nomenclature Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              School Class & Stream Hierarchy
            </h2>
            <Badge variant="primary" size="sm">
              {nomenclature.levelTermSingular} / {nomenclature.armTermSingular} Nomenclature
            </Badge>
            <Badge variant="success" size="sm" className="hidden sm:inline-flex">
              Invariant #3 Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define institutional hierarchy, parallel streams, class captains, and point-in-time immutable snapshots.
          </p>
        </div>

        {/* Global Admin Configuration Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNomenclatureOpen(true)}
            leftIcon={<Sliders className="w-4 h-4 text-indigo-500" />}
            title="Configure Level & Arm Naming Terms"
          >
            Terminology
          </Button>

          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHierarchyBuilderOpen(true)}
              leftIcon={<Wand2 className="w-4 h-4 text-emerald-500" />}
              title="Hierarchy Builder & Level Quantity Assistant"
            >
              Hierarchy Builder
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemporalImmutabilityOpen(true)}
            leftIcon={<Lock className="w-4 h-4 text-amber-500" />}
            title="Inspect Point-in-Time Historical Snapshots"
          >
            Temporal Snapshots
          </Button>
        </div>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total {nomenclature.levelTermPlural}
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {levels.length}
            </div>
            <span className="text-xs text-slate-400">
              {levels[0]?.code} through {levels[levels.length - 1]?.code}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active {nomenclature.armTermPlural}
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeArms.length}
            </div>
            <span className="text-xs text-emerald-600">
              {allArms.length - activeArms.length > 0
                ? `${allArms.length - activeArms.length} archived stream(s)`
                : 'All classrooms active'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Layers className="w-6 h-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalStudents}{' '}
              <span className="text-xs font-normal text-slate-400">/ {totalCapacity}</span>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">
              Active student roster
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Capacity Utilization
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {schoolOccupancyRate}%
            </div>
            <span className="text-xs text-slate-400">Optimal utilization</span>
          </div>
          <ProgressRing
            percentage={schoolOccupancyRate}
            size={52}
            strokeWidth={4}
            color={schoolOccupancyRate > 95 ? 'warning' : 'primary'}
          />
        </Card>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-medium self-start flex-wrap">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All {nomenclature.levelTermPlural} ({levels.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('JUNIOR_SECONDARY')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              categoryFilter === 'JUNIOR_SECONDARY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Junior Secondary
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('SENIOR_SECONDARY')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              categoryFilter === 'SENIOR_SECONDARY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Senior Secondary
          </button>
        </div>

        {/* Search & Add Level */}
        <div className="flex items-center gap-3">
          <div className="w-56 sm:w-64">
            <Input
              placeholder={`Search ${nomenclature.armTermSingular.toLowerCase()}, teacher, captain...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="py-1.5 min-h-[36px] text-xs"
            />
          </div>

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddLevelModal((prev) => ({ ...prev, isOpen: true }))}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add {nomenclature.levelTermSingular}
            </Button>
          )}
        </div>
      </div>

      {/* Levels & Arms Display */}
      <div className="space-y-6">
        {filteredLevels.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            nomenclature={nomenclature}
            canManage={canManage}
            onRenameLevel={handleRenameLevel}
            onAddArm={handleOpenAddArm}
            onRenameArm={handleRenameArm}
            onViewSnapshot={handleViewSnapshot}
            onEditArm={handleOpenEditArm}
            onDeleteArm={handleTriggerDeleteArm}
          />
        ))}

        {filteredLevels.length === 0 && (
          <Card className="p-8 text-center text-slate-500 text-sm">
            No {nomenclature.levelTermPlural.toLowerCase()} match your search criteria.
          </Card>
        )}
      </div>

      {/* Class Assignment Snapshot Drawer */}
      <ClassAssignmentSnapshotDrawer
        isOpen={snapshotState.isOpen}
        onClose={() => setSnapshotState((prev) => ({ ...prev, isOpen: false }))}
        arm={snapshotState.arm}
        level={snapshotState.level}
      />

      {/* School Nomenclature Settings Modal */}
      <NomenclatureSettingsModal
        isOpen={isNomenclatureOpen}
        onClose={() => setIsNomenclatureOpen(false)}
        nomenclature={nomenclature}
        onSave={handleSaveNomenclature}
      />

      {/* Hierarchy Builder Modal */}
      <HierarchyBuilderModal
        isOpen={isHierarchyBuilderOpen}
        onClose={() => setIsHierarchyBuilderOpen(false)}
        existingLevels={levels}
        nomenclature={nomenclature}
        onApplyHierarchy={handleApplyHierarchy}
      />

      {/* Temporal Immutability Inspector Modal */}
      <TemporalImmutabilityModal
        isOpen={isTemporalImmutabilityOpen}
        onClose={() => setIsTemporalImmutabilityOpen(false)}
        levels={levels}
        onArmRenamed={handleRenameArm}
        onLogAudit={onLogAudit}
      />

      {/* Safe Arm Action (Non-Destructive Protection) Modal */}
      <SafeArmActionModal
        isOpen={safeArmModal.isOpen}
        onClose={() => setSafeArmModal((prev) => ({ ...prev, isOpen: false }))}
        arm={safeArmModal.arm}
        level={safeArmModal.level}
        allLevels={levels}
        nomenclature={nomenclature}
        onArchiveArm={handleArchiveArm}
        onMigrateAndRetire={handleMigrateAndRetire}
        onDirectDeleteEmptyArm={handleDirectDeleteEmptyArm}
      />

      {/* Add Arm Modal */}
      <Modal
        isOpen={addArmModal.isOpen}
        onClose={() => setAddArmModal((prev) => ({ ...prev, isOpen: false }))}
        title={`Add ${nomenclature.armTermSingular} to ${addArmModal.level?.name}`}
        description="Allocate a new classroom stream and assign a form master educator."
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddArmModal((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitAddArm}>
              Create {nomenclature.armTermSingular}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label={`${nomenclature.armTermSingular} / Stream Name`}
            placeholder="e.g. Diamond, Gold, Silver, Emerald"
            value={addArmModal.armName}
            onChange={(e) =>
              setAddArmModal((prev) => ({ ...prev, armName: e.target.value }))
            }
          />

          <Input
            label="Room / Classroom Location"
            value={addArmModal.roomNumber}
            onChange={(e) =>
              setAddArmModal((prev) => ({ ...prev, roomNumber: e.target.value }))
            }
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
              Assigned Class Teacher (Form Master)
            </label>
            <select
              value={addArmModal.teacherId}
              onChange={(e) =>
                setAddArmModal((prev) => ({ ...prev, teacherId: e.target.value }))
              }
              className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3.5 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              {FACULTY_MEMBERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Maximum Student Capacity"
            type="number"
            value={addArmModal.capacity}
            onChange={(e) =>
              setAddArmModal((prev) => ({
                ...prev,
                capacity: parseInt(e.target.value, 10) || 35,
              }))
            }
          />
        </div>
      </Modal>

      {/* Edit Arm Modal */}
      {editArmModal.arm && (
        <Modal
          isOpen={editArmModal.isOpen}
          onClose={() => setEditArmModal((prev) => ({ ...prev, isOpen: false }))}
          title={`Configure: ${editArmModal.armName}`}
          description="Update class teacher assignment, captains, room location, and capacity."
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditArmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmitEditArm}>
                Save Changes
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={`${nomenclature.armTermSingular} Name`}
                value={editArmModal.armName}
                onChange={(e) =>
                  setEditArmModal((prev) => ({ ...prev, armName: e.target.value }))
                }
              />
              <Input
                label="Room / Classroom Location"
                value={editArmModal.roomNumber}
                onChange={(e) =>
                  setEditArmModal((prev) => ({
                    ...prev,
                    roomNumber: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                  Form Master Teacher
                </label>
                <select
                  value={editArmModal.teacherId}
                  onChange={(e) =>
                    setEditArmModal((prev) => ({
                      ...prev,
                      teacherId: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  {FACULTY_MEMBERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                  Status
                </label>
                <select
                  value={editArmModal.status}
                  onChange={(e) =>
                    setEditArmModal((prev) => ({
                      ...prev,
                      status: e.target.value as 'ACTIVE' | 'INACTIVE',
                    }))
                  }
                  className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value="ACTIVE">Active Classroom</option>
                  <option value="INACTIVE">Archived / Closed</option>
                </select>
              </div>
            </div>

            {/* Class Captains Assignment */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Crown className="w-4 h-4 text-amber-600" />
                Class Captain & Leadership Assignment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Class Captain Name"
                  placeholder="e.g. Tobi Adebayo"
                  value={editArmModal.classCaptainName}
                  onChange={(e) =>
                    setEditArmModal((prev) => ({
                      ...prev,
                      classCaptainName: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Assistant Class Captain"
                  placeholder="e.g. Zainab Ibrahim"
                  value={editArmModal.assistantCaptainName}
                  onChange={(e) =>
                    setEditArmModal((prev) => ({
                      ...prev,
                      assistantCaptainName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Input
              label="Maximum Seat Capacity"
              type="number"
              value={editArmModal.capacity}
              onChange={(e) =>
                setEditArmModal((prev) => ({
                  ...prev,
                  capacity: parseInt(e.target.value, 10) || 35,
                }))
              }
            />
          </div>
        </Modal>
      )}

      {/* Add Level Modal */}
      <Modal
        isOpen={addLevelModal.isOpen}
        onClose={() => setAddLevelModal((prev) => ({ ...prev, isOpen: false }))}
        title={`Add Education ${nomenclature.levelTermSingular}`}
        description={`Create a new ${nomenclature.levelTermSingular.toLowerCase()} tier (e.g. Primary 6, JSS 4, or Grade 12).`}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddLevelModal((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitAddLevel}>
              Create {nomenclature.levelTermSingular}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label={`${nomenclature.levelTermSingular} Name`}
            placeholder="e.g. Primary 6 or Grade 9"
            value={addLevelModal.name}
            onChange={(e) =>
              setAddLevelModal((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            label={`${nomenclature.levelTermSingular} Code`}
            placeholder="e.g. PR6 or G9"
            value={addLevelModal.code}
            onChange={(e) =>
              setAddLevelModal((prev) => ({ ...prev, code: e.target.value }))
            }
          />
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
              Category
            </label>
            <select
              value={addLevelModal.category}
              onChange={(e) =>
                setAddLevelModal((prev) => ({
                  ...prev,
                  category: e.target.value as EducationCategory,
                }))
              }
              className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3.5 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="JUNIOR_SECONDARY">Junior Secondary</option>
              <option value="SENIOR_SECONDARY">Senior Secondary</option>
              <option value="PRIMARY">Primary</option>
              <option value="NURSERY">Nursery / Early Years</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
