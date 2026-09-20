import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Layers,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Printer,
  Copy,
  Sparkles,
  Coffee,
  Utensils,
  Clock,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronDown,
} from 'lucide-react';
import {
  ClassLevel,
  ClassArm,
  Role,
  ClassTimetableSlot,
  DayOfWeek,
  TimetableConflict,
} from '../../types';
import { Button, Card, Badge } from '../../design-system';
import { TimetableSlotCard } from './TimetableSlotCard';
import { SlotEditModal } from './SlotEditModal';
import { ConflictAuditDrawer } from './ConflictAuditDrawer';
import {
  DAYS_OF_WEEK,
  TIME_SLOT_DEFINITIONS,
  getStoredTimetableSlots,
  saveStoredTimetableSlots,
  detectAllConflicts,
  checkProposedSlotConflict,
  TENANT_SCHOOL_ID,
  CURRICULUM_SUBJECTS,
} from '../../lib/class-timetable-store';

export interface ClassTimetablePageProps {
  levels: ClassLevel[];
  userRole: Role;
  onLogAudit?: (action: string, details: string) => void;
  onNavigateToTeacherTimetable?: () => void;
}

export const ClassTimetablePage: React.FC<ClassTimetablePageProps> = ({
  levels,
  userRole,
  onLogAudit,
  onNavigateToTeacherTimetable,
}) => {
  // Role permission: Admin / Registrar can edit, all others view read-only
  const canManage = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR', 'REGISTRAR'].includes(userRole);

  // Selected Level & Arm
  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || '');
  const selectedLevel = levels.find((l) => l.id === selectedLevelId) || levels[0] || null;

  const [selectedArmId, setSelectedArmId] = useState<string>(selectedLevel?.arms[0]?.id || '');

  // Keep arm selection in sync when level changes
  useEffect(() => {
    if (selectedLevel && selectedLevel.arms.length > 0) {
      if (!selectedLevel.arms.some((a) => a.id === selectedArmId)) {
        setSelectedArmId(selectedLevel.arms[0].id);
      }
    }
  }, [selectedLevelId, selectedLevel, selectedArmId]);

  const selectedArm: ClassArm | null =
    selectedLevel?.arms.find((a) => a.id === selectedArmId) || selectedLevel?.arms[0] || null;

  // All timetable slots across the school
  const [allSlots, setAllSlots] = useState<ClassTimetableSlot[]>(() => getStoredTimetableSlots());
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);

  // Modals & Drawers
  const [isConflictDrawerOpen, setIsConflictDrawerOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceArmId, setCopySourceArmId] = useState<string>('');

  // Slot Edit/Create Modal
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    day: DayOfWeek;
    periodNumber: number;
    existingSlot: ClassTimetableSlot | null;
  }>({
    isOpen: false,
    day: 'MONDAY',
    periodNumber: 1,
    existingSlot: null,
  });

  // Drag and Drop States
  const [draggedSlot, setDraggedSlot] = useState<ClassTimetableSlot | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: DayOfWeek; periodNumber: number } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Run Conflict Detection whenever slots or levels change
  useEffect(() => {
    const detected = detectAllConflicts(allSlots, levels);
    setConflicts(detected);
  }, [allSlots, levels]);

  // Filter slots for current arm
  const currentArmSlots = allSlots.filter((s) => s.armId === selectedArm?.id);

  // Helper to find slot in cell
  const getSlotForCell = (day: DayOfWeek, periodNumber: number): ClassTimetableSlot | undefined => {
    return currentArmSlots.find((s) => s.day === day && s.periodNumber === periodNumber);
  };

  // Save / Update Slot
  const handleSaveSlot = (slot: ClassTimetableSlot) => {
    const existingIndex = allSlots.findIndex((s) => s.id === slot.id);
    let updated: ClassTimetableSlot[];

    if (existingIndex >= 0) {
      updated = [...allSlots];
      updated[existingIndex] = slot;
      showToast(`Updated ${slot.subjectName} assignment.`);
      onLogAudit?.(
        'TIMETABLE_SLOT_UPDATED',
        `Updated slot for ${selectedLevel?.name} ${selectedArm?.name} (${slot.day} P${slot.periodNumber}): ${slot.subjectName}`
      );
    } else {
      updated = [...allSlots, slot];
      showToast(`Assigned ${slot.subjectName} to ${slot.day} Period ${slot.periodNumber}.`);
      onLogAudit?.(
        'TIMETABLE_SLOT_CREATED',
        `Assigned ${slot.subjectName} to ${selectedLevel?.name} ${selectedArm?.name} (${slot.day} P${slot.periodNumber})`
      );
    }

    setAllSlots(updated);
    saveStoredTimetableSlots(updated);
  };

  // Delete Slot
  const handleDeleteSlot = (slotId: string) => {
    const target = allSlots.find((s) => s.id === slotId);
    const updated = allSlots.filter((s) => s.id !== slotId);
    setAllSlots(updated);
    saveStoredTimetableSlots(updated);
    showToast(`Removed ${target?.subjectName || 'slot'} from schedule.`);
    onLogAudit?.(
      'TIMETABLE_SLOT_DELETED',
      `Removed ${target?.subjectName} slot from ${selectedLevel?.name} ${selectedArm?.name}`
    );
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, slot: ClassTimetableSlot) => {
    if (!canManage) return;
    setDraggedSlot(slot);
    e.dataTransfer.setData('text/plain', slot.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, periodNumber: number) => {
    if (!canManage || !draggedSlot) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCell?.day !== day || dragOverCell?.periodNumber !== periodNumber) {
      setDragOverCell({ day, periodNumber });
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: DayOfWeek, targetPeriod: number) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!canManage || !draggedSlot || !selectedLevel || !selectedArm) return;

    // Check if dropping on the exact same slot
    if (draggedSlot.day === targetDay && draggedSlot.periodNumber === targetPeriod) {
      setDraggedSlot(null);
      return;
    }

    const targetSlot = getSlotForCell(targetDay, targetPeriod);

    if (!targetSlot) {
      // Moving to an empty cell: check for collisions in target
      const proposedMove: Omit<ClassTimetableSlot, 'id'> = {
        ...draggedSlot,
        day: targetDay,
        periodNumber: targetPeriod,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin Registrar',
      };

      const conflictCheck = checkProposedSlotConflict(
        proposedMove,
        allSlots,
        draggedSlot.id,
        levels
      );

      if (conflictCheck) {
        showToast(conflictCheck.message, 'error');
        setDraggedSlot(null);
        return;
      }

      // Safe move
      const updated = allSlots.map((s) => {
        if (s.id === draggedSlot.id) {
          return {
            ...s,
            day: targetDay,
            periodNumber: targetPeriod,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      setAllSlots(updated);
      saveStoredTimetableSlots(updated);
      showToast(`Moved ${draggedSlot.subjectName} to ${targetDay} Period ${targetPeriod}.`);
      onLogAudit?.(
        'TIMETABLE_SLOT_MOVED',
        `Moved ${draggedSlot.subjectName} to ${targetDay} Period ${targetPeriod} in ${selectedLevel.name} ${selectedArm.name}`
      );
    } else {
      // Swapping with an occupied cell: check collisions for both
      const proposedA: Omit<ClassTimetableSlot, 'id'> = {
        ...draggedSlot,
        day: targetDay,
        periodNumber: targetPeriod,
      };
      const proposedB: Omit<ClassTimetableSlot, 'id'> = {
        ...targetSlot,
        day: draggedSlot.day,
        periodNumber: draggedSlot.periodNumber,
      };

      const conflictA = checkProposedSlotConflict(proposedA, allSlots, draggedSlot.id, levels);
      const conflictB = checkProposedSlotConflict(proposedB, allSlots, targetSlot.id, levels);

      if (conflictA) {
        showToast(`Cannot swap: ${conflictA.message}`, 'error');
        setDraggedSlot(null);
        return;
      }
      if (conflictB) {
        showToast(`Cannot swap: ${conflictB.message}`, 'error');
        setDraggedSlot(null);
        return;
      }

      // Safe swap
      const updated = allSlots.map((s) => {
        if (s.id === draggedSlot.id) {
          return {
            ...s,
            day: targetDay,
            periodNumber: targetPeriod,
            updatedAt: new Date().toISOString(),
          };
        }
        if (s.id === targetSlot.id) {
          return {
            ...s,
            day: draggedSlot.day,
            periodNumber: draggedSlot.periodNumber,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      setAllSlots(updated);
      saveStoredTimetableSlots(updated);
      showToast(`Swapped ${draggedSlot.subjectName} and ${targetSlot.subjectName}.`);
      onLogAudit?.(
        'TIMETABLE_SLOTS_SWAPPED',
        `Swapped ${draggedSlot.subjectName} and ${targetSlot.subjectName} in ${selectedLevel.name} ${selectedArm.name}`
      );
    }

    setDraggedSlot(null);
  };

  // Clone/Copy Timetable from parallel arm
  const handleExecuteCopy = () => {
    if (!copySourceArmId || !selectedArm || !selectedLevel) return;

    const sourceSlots = allSlots.filter((s) => s.armId === copySourceArmId);
    if (sourceSlots.length === 0) {
      showToast('Source stream has no timetable slots to clone.', 'error');
      return;
    }

    // Clone slots with new IDs and assigned to target arm
    const clonedSlots: ClassTimetableSlot[] = sourceSlots.map((src) => ({
      ...src,
      id: `tt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      levelId: selectedLevel.id,
      armId: selectedArm.id,
      room: selectedArm.roomNumber || src.room,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin Cloned',
    }));

    // Remove existing slots for target arm and append cloned
    const filteredOther = allSlots.filter((s) => s.armId !== selectedArm.id);
    const updated = [...filteredOther, ...clonedSlots];

    setAllSlots(updated);
    saveStoredTimetableSlots(updated);
    setIsCopyModalOpen(false);
    showToast(`Cloned ${clonedSlots.length} schedule periods into ${selectedArm.name}.`);
    onLogAudit?.(
      'TIMETABLE_CLONED',
      `Cloned ${clonedSlots.length} slots from arm ${copySourceArmId} to ${selectedArm.name}`
    );
  };

  // Reset / Clear current arm schedule
  const handleClearArmSchedule = () => {
    if (!selectedArm || !window.confirm(`Are you sure you want to clear all slots for ${selectedArm.name}?`)) {
      return;
    }

    const updated = allSlots.filter((s) => s.armId !== selectedArm.id);
    setAllSlots(updated);
    saveStoredTimetableSlots(updated);
    showToast(`Cleared schedule for ${selectedArm.name}.`);
    onLogAudit?.('TIMETABLE_CLEARED', `Cleared all timetable slots for ${selectedArm.name}`);
  };

  // Quick-Populate Standard Preset
  const handleQuickPopulate = () => {
    if (!selectedArm || !selectedLevel) return;

    const newSlots: ClassTimetableSlot[] = [];
    const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    let subjectIndex = 0;

    for (const day of days) {
      for (const period of TIME_SLOT_DEFINITIONS) {
        if (period.isBreak) continue;

        // Pick subject in round-robin fashion
        const subj = CURRICULUM_SUBJECTS[subjectIndex % CURRICULUM_SUBJECTS.length];
        subjectIndex++;

        newSlots.push({
          id: `tt-auto-${Date.now()}-${day}-${period.periodNumber}`,
          schoolId: TENANT_SCHOOL_ID,
          levelId: selectedLevel.id,
          armId: selectedArm.id,
          day,
          periodNumber: period.periodNumber,
          subjectName: subj.name,
          subjectCode: subj.code,
          teacherId: subj.defaultTeacherId || selectedArm.teacherId,
          teacherName: selectedArm.teacherName,
          room: selectedArm.roomNumber || subj.preferredRoom || 'Classroom',
          colorTheme: subj.colorTheme,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin Auto-Preset',
        });
      }
    }

    const filtered = allSlots.filter((s) => s.armId !== selectedArm.id);
    const updated = [...filtered, ...newSlots];
    setAllSlots(updated);
    saveStoredTimetableSlots(updated);
    showToast(`Populated full weekly curriculum schedule for ${selectedArm.name}.`);
    onLogAudit?.('TIMETABLE_PRESET_POPULATED', `Populated default schedule for ${selectedArm.name}`);
  };

  // Print timetable
  const handlePrint = () => {
    window.print();
  };

  // Other arms available for cloning
  const availableSourceArms = levels
    .flatMap((l) => l.arms.map((a) => ({ ...a, levelName: l.name })))
    .filter((a) => a.id !== selectedArm?.id);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white animate-bounce ${
            toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-slate-900 dark:bg-white dark:text-slate-900'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Ownership Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Class Timetables & Stream Scheduling
            </h2>
            <Badge variant={canManage ? 'primary' : 'neutral'} size="sm">
              {canManage ? 'Admin-Owned Control' : 'Official Portal (Read-Only)'}
            </Badge>
            <Badge variant="info" size="sm" className="hidden sm:inline-flex">
              Decoupled Engine (Invariant #2)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {canManage
              ? 'Admin/Registrar authority: configure subjects, faculty, and room allocations with real-time double-booking prevention.'
              : 'Official published classroom schedule. Students, guardians, and educators can review periods and room locations.'}
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Conflict Health Button */}
          <Button
            variant={conflicts.length === 0 ? 'outline' : 'danger'}
            size="sm"
            onClick={() => setIsConflictDrawerOpen(true)}
            leftIcon={
              conflicts.length === 0 ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )
            }
          >
            {conflicts.length === 0 ? '0 Conflicts' : `${conflicts.length} Collisions Detected`}
          </Button>

          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCopyModalOpen(true)}
                leftIcon={<Copy className="w-4 h-4 text-indigo-500" />}
                title="Clone schedule from another class arm"
              >
                Copy Schedule
              </Button>

              {currentArmSlots.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickPopulate}
                  leftIcon={<Sparkles className="w-4 h-4 text-emerald-500" />}
                  title="Auto-fill with standard curriculum subjects"
                >
                  Quick Populate
                </Button>
              )}
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 text-slate-500" />}
          >
            Print / PDF
          </Button>

          {onNavigateToTeacherTimetable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToTeacherTimetable}
              leftIcon={<Clock className="w-4 h-4 text-emerald-500" />}
              title="Open decoupled Teacher Personal Planning View (Invariant #2)"
            >
              Teacher Planner
            </Button>
          )}
        </div>
      </div>

      {/* Class Level & Stream Selector Card */}
      <Card className="p-4 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Level Dropdown */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Education Level
            </span>
            <div className="relative">
              <select
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                className="appearance-none pr-8 pl-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} ({lvl.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Arm / Stream Dropdown */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Stream / Classroom
            </span>
            <div className="relative">
              <select
                value={selectedArmId}
                onChange={(e) => setSelectedArmId(e.target.value)}
                className="appearance-none pr-8 pl-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {selectedLevel?.arms.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name} ({arm.enrolledCount} Students)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selected Arm Details Pill */}
        {selectedArm && (
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Form Master:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {selectedArm.teacherName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Classroom:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {selectedArm.roomNumber}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Weekly Allocated Lessons:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {currentArmSlots.length} Periods
              </span>
            </div>
            {canManage && currentArmSlots.length > 0 && (
              <button
                type="button"
                onClick={handleClearArmSchedule}
                className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer ml-auto"
                title="Clear all assigned slots for this arm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Schedule
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Timetable Weekly Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left border-collapse min-w-[850px]">
          {/* Header Days of Week */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs font-bold text-slate-700 dark:text-slate-300">
              <th className="py-3 px-4 w-32 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] text-slate-500">
                Time / Period
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={day.key}
                  className="py-3 px-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800"
                >
                  <div className="font-bold text-slate-900 dark:text-slate-100">{day.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{day.short} Schedule</div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body (Time Periods) */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {TIME_SLOT_DEFINITIONS.map((period) => {
              // 1. Break Row (Morning Recess / Lunch Break)
              if (period.isBreak) {
                const isLunch = period.periodNumber === -2;
                return (
                  <tr
                    key={period.label}
                    className="bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                  >
                    <td className="py-2.5 px-4 font-semibold border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px]">
                          {period.startTime} - {period.endTime}
                        </span>
                      </div>
                    </td>
                    <td
                      colSpan={DAYS_OF_WEEK.length}
                      className="py-2.5 px-4 text-center font-bold tracking-wide uppercase text-[11px] text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isLunch ? (
                          <Utensils className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Coffee className="w-4 h-4 text-indigo-500" />
                        )}
                        <span>
                          {period.label} ({period.startTime} - {period.endTime})
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }

              // 2. Regular Academic Period Row
              return (
                <tr
                  key={period.periodNumber}
                  className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                >
                  {/* Period Label & Time */}
                  <td className="py-3 px-4 font-medium border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 whitespace-nowrap align-top">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {period.label}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {period.startTime} - {period.endTime}
                    </div>
                  </td>

                  {/* Day Cells */}
                  {DAYS_OF_WEEK.map((day) => {
                    const slot = getSlotForCell(day.key, period.periodNumber);
                    const isDragOver =
                      dragOverCell?.day === day.key && dragOverCell?.periodNumber === period.periodNumber;

                    return (
                      <td
                        key={`${day.key}-${period.periodNumber}`}
                        onDragOver={(e) => handleDragOver(e, day.key, period.periodNumber)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day.key, period.periodNumber)}
                        className={`p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-top min-w-[150px] transition-colors relative ${
                          isDragOver
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500 ring-inset rounded-lg'
                            : ''
                        }`}
                      >
                        {slot ? (
                          <TimetableSlotCard
                            slot={slot}
                            canEdit={canManage}
                            onEdit={(s) =>
                              setEditModalState({
                                isOpen: true,
                                day: s.day,
                                periodNumber: s.periodNumber,
                                existingSlot: s,
                              })
                            }
                            onDelete={handleDeleteSlot}
                            onDragStart={handleDragStart}
                            isDragging={draggedSlot?.id === slot.id}
                          />
                        ) : (
                          <div className="h-full min-h-[96px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-2 text-center group transition-all hover:border-slate-300 dark:hover:border-slate-700">
                            {canManage ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditModalState({
                                    isOpen: true,
                                    day: day.key,
                                    periodNumber: period.periodNumber,
                                    existingSlot: null,
                                  })
                                }
                                className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-3 cursor-pointer"
                              >
                                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                  Assign Subject
                                </span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-300 dark:text-slate-600 font-medium italic">
                                Free Period
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Invariant Clarification Note */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            <strong>Architectural Rule #2 Enforced:</strong> The class timetable (admin) and teacher personal timetables are completely decoupled systems. Publishing changes here never mutates individual teacher calendar entries.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" size="sm">
            Tenant Isolation: {TENANT_SCHOOL_ID}
          </Badge>
        </div>
      </div>

      {/* Slot Add/Edit Modal */}
      <SlotEditModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState((prev) => ({ ...prev, isOpen: false }))}
        level={selectedLevel}
        armId={selectedArm?.id || ''}
        day={editModalState.day}
        periodNumber={editModalState.periodNumber}
        existingSlot={editModalState.existingSlot}
        allSlots={allSlots}
        allLevels={levels}
        onSaveSlot={handleSaveSlot}
      />

      {/* Conflict Audit Drawer */}
      <ConflictAuditDrawer
        isOpen={isConflictDrawerOpen}
        onClose={() => setIsConflictDrawerOpen(false)}
        conflicts={conflicts}
        levels={levels}
        onSelectClass={(lvlId, armId) => {
          setSelectedLevelId(lvlId);
          setSelectedArmId(armId);
        }}
      />

      {/* Copy Timetable Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCopyModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 z-10">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Copy className="w-5 h-5 text-indigo-500" />
              Copy Schedule to {selectedArm?.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clone an existing timetable structure from a parallel stream. Existing periods in {selectedArm?.name} will be replaced.
            </p>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Select Source Stream to Copy From
              </label>
              <select
                value={copySourceArmId}
                onChange={(e) => setCopySourceArmId(e.target.value)}
                className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="">-- Choose a Stream --</option>
                {availableSourceArms.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.levelName} - {a.name} ({a.enrolledCount} students)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCopyModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteCopy}
                disabled={!copySourceArmId}
              >
                Clone Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
