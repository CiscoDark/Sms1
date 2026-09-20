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
} from 'lucide-react';
import { ClassLevel, ClassArm, EducationCategory, Role } from '../../types';
import { FACULTY_MEMBERS } from '../../data/mockData';
import { Card, Button, Input, Modal, Badge, ProgressRing } from '../../design-system';
import { LevelCard } from './LevelCard';
import { ClassAssignmentSnapshotDrawer } from './ClassAssignmentSnapshotDrawer';

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

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | EducationCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
  }>({
    isOpen: false,
    arm: null,
    armName: '',
    roomNumber: '',
    capacity: 35,
    teacherId: '',
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
  const totalStudents = allArms.reduce((sum, a) => sum + a.enrolledCount, 0);
  const totalCapacity = allArms.reduce((sum, a) => sum + a.capacity, 0);
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
        a.roomNumber.toLowerCase().includes(q)
    );
    return matchesLevel || matchesArm;
  });

  // Rename Level
  const handleRenameLevel = (levelId: string, newName: string) => {
    const updated = levels.map((l) => (l.id === levelId ? { ...l, name: newName } : l));
    onUpdateLevels(updated);
    showToast(`Level renamed to ${newName}`);
    onLogAudit?.('LEVEL_RENAMED', `Renamed level ${levelId} to ${newName}`);
  };

  // Rename Arm
  const handleRenameArm = (armId: string, newName: string) => {
    const updated = levels.map((lvl) => ({
      ...lvl,
      arms: lvl.arms.map((a) => (a.id === armId ? { ...a, name: newName } : a)),
    }));
    onUpdateLevels(updated);
    showToast(`Arm renamed to ${newName}`);
    onLogAudit?.('ARM_RENAMED', `Renamed arm ${armId} to ${newName}`);
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
    showToast(`Added arm ${newArm.name} to ${addArmModal.level.name}.`);
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
    });
  };

  // Submit Edit Arm
  const handleSubmitEditArm = () => {
    if (!editArmModal.arm || !editArmModal.armName.trim()) return;

    const teacher = FACULTY_MEMBERS.find((f) => f.id === editArmModal.teacherId);
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
        };
      }),
    }));

    onUpdateLevels(updated);
    setEditArmModal((prev) => ({ ...prev, isOpen: false }));
    showToast(`Updated details for ${editArmModal.armName}.`);
    onLogAudit?.('ARM_UPDATED', `Updated arm settings for ${editArmModal.armName}`);
  };

  // Delete Arm
  const handleDeleteArm = (armId: string) => {
    if (!confirm('Are you sure you want to remove this arm? Assigned students will need to be reallocated.')) {
      return;
    }

    const updated = levels.map((lvl) => ({
      ...lvl,
      arms: lvl.arms.filter((a) => a.id !== armId),
    }));

    onUpdateLevels(updated);
    showToast('Class arm deleted.');
    onLogAudit?.('ARM_DELETED', `Deleted arm ${armId}`);
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
    showToast(`Created class level: ${newLevel.name}`);
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

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Levels
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {levels.length}
            </div>
            <span className="text-xs text-slate-400">JSS 1 through SSS 3</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Streams (Arms)
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {allArms.length}
            </div>
            <span className="text-xs text-emerald-600">All classrooms active</span>
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
              Total seat quota
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              School Occupancy
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
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-medium self-start">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Levels ({levels.length})
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
              placeholder="Search arm or teacher..."
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
              Add Level
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
            canManage={canManage}
            onRenameLevel={handleRenameLevel}
            onAddArm={handleOpenAddArm}
            onRenameArm={handleRenameArm}
            onViewSnapshot={handleViewSnapshot}
            onEditArm={handleOpenEditArm}
            onDeleteArm={handleDeleteArm}
          />
        ))}

        {filteredLevels.length === 0 && (
          <Card className="p-8 text-center text-slate-500 text-sm">
            No class levels match your search criteria.
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

      {/* Add Arm Modal */}
      <Modal
        isOpen={addArmModal.isOpen}
        onClose={() => setAddArmModal((prev) => ({ ...prev, isOpen: false }))}
        title={`Add Class Arm to ${addArmModal.level?.name}`}
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
              Create Arm
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Arm / Stream Name"
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
          description="Update class teacher assignment, room location, and max capacity."
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
            <Input
              label="Arm Name"
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
        title="Add Education Level"
        description="Create a new class tier (e.g. Primary 6, JSS 4, or SSS 4)."
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
              Create Level
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Level Name"
            placeholder="e.g. Primary 6"
            value={addLevelModal.name}
            onChange={(e) =>
              setAddLevelModal((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            label="Level Code"
            placeholder="e.g. PR6"
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
