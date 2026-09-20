import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Download,
  Plus,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown,
  Clock,
  Coffee,
  Utensils,
  BookOpen,
  FileCheck,
  Info,
  Filter,
} from 'lucide-react';
import {
  TeacherPersonalBlock,
  TeacherActivityType,
  DayOfWeek,
  ClassLevel,
  UserProfile,
} from '../../types';
import { Button, Card, Badge } from '../../design-system';
import { FACULTY_MEMBERS } from '../../data/mockData';
import {
  DAYS_OF_WEEK,
  TIME_SLOT_DEFINITIONS,
  TENANT_SCHOOL_ID,
  getStoredTimetableSlots,
} from '../../lib/class-timetable-store';
import {
  getStoredTeacherBlocks,
  saveStoredTeacherBlocks,
  importClassTimetableSlotsForTeacher,
  checkOfficialClassOverlap,
  ACTIVITY_TYPE_CONFIG,
} from '../../lib/teacher-timetable-store';
import { TeacherPersonalBlockCard } from './TeacherPersonalBlockCard';
import { TeacherBlockModal } from './TeacherBlockModal';

interface TeacherPersonalTimetablePageProps {
  levels: ClassLevel[];
  currentUser: UserProfile;
  onLogAudit?: (action: string, details: string) => void;
}

export const TeacherPersonalTimetablePage: React.FC<TeacherPersonalTimetablePageProps> = ({
  levels,
  currentUser,
  onLogAudit,
}) => {
  // Determine active teacher:
  // If current logged-in user is a TEACHER, match with faculty or use user id
  const matchedFaculty = FACULTY_MEMBERS.find(
    (f) => f.email === currentUser.email || f.name.toLowerCase() === currentUser.name.toLowerCase()
  ) || FACULTY_MEMBERS[0];

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(matchedFaculty.id);

  // Sync if current user changes to a teacher
  useEffect(() => {
    const found = FACULTY_MEMBERS.find(
      (f) => f.email === currentUser.email || f.name.toLowerCase() === currentUser.name.toLowerCase()
    );
    if (found) {
      setSelectedTeacherId(found.id);
    }
  }, [currentUser]);

  const activeTeacher = FACULTY_MEMBERS.find((f) => f.id === selectedTeacherId) || FACULTY_MEMBERS[0];

  // Store of all teacher blocks
  const [allBlocks, setAllBlocks] = useState<TeacherPersonalBlock[]>(() => getStoredTeacherBlocks());

  // Filter type
  const [filterType, setFilterType] = useState<'ALL' | TeacherActivityType>('ALL');

  // Modal State
  const [blockModalState, setBlockModalState] = useState<{
    isOpen: boolean;
    day: DayOfWeek;
    periodNumber: number;
    existingBlock: TeacherPersonalBlock | null;
  }>({
    isOpen: false,
    day: 'MONDAY',
    periodNumber: 1,
    existingBlock: null,
  });

  // Drag and drop state
  const [draggedBlock, setDraggedBlock] = useState<TeacherPersonalBlock | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: DayOfWeek; periodNumber: number } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Filter blocks for active teacher
  const teacherBlocks = allBlocks.filter((b) => b.teacherId === activeTeacher.id);

  // Official class timetable slots for reference and non-blocking overlap checking
  const officialClassSlots = getStoredTimetableSlots().filter(
    (s) => s.teacherId === activeTeacher.id || s.teacherName.toLowerCase() === activeTeacher.name.toLowerCase()
  );

  // Compute stats
  const teachingPeriods = teacherBlocks.filter((b) => b.activityType === 'CLASS_LESSON').length;
  const prepPeriods = teacherBlocks.filter((b) => b.activityType === 'PREP_PLANNING').length;
  const markingPeriods = teacherBlocks.filter((b) => b.activityType === 'MARKING_GRADING').length;
  const mentoringAndMeetings = teacherBlocks.filter(
    (b) => b.activityType === 'STUDENT_MENTORING' || b.activityType === 'MEETING' || b.activityType === 'SUPERVISION'
  ).length;

  // Count non-blocking overlaps
  const overlapCount = teacherBlocks.filter((b) => {
    if (b.activityType === 'CLASS_LESSON') return false;
    const overlap = checkOfficialClassOverlap(activeTeacher.id, b.day, b.periodNumber, b.id, undefined, levels);
    return overlap.hasOverlap;
  }).length;

  // Save / Update Block
  const handleSaveBlock = (block: TeacherPersonalBlock) => {
    const existingIndex = allBlocks.findIndex((b) => b.id === block.id);
    let updated: TeacherPersonalBlock[];

    if (existingIndex >= 0) {
      updated = [...allBlocks];
      updated[existingIndex] = block;
      showToast(`Updated planning block: "${block.title}".`);
      onLogAudit?.(
        'TEACHER_BLOCK_UPDATED',
        `Updated personal block "${block.title}" for ${activeTeacher.name} on ${block.day} P${block.periodNumber}`
      );
    } else {
      updated = [...allBlocks, block];
      showToast(`Added planning block: "${block.title}".`);
      onLogAudit?.(
        'TEACHER_BLOCK_CREATED',
        `Added personal block "${block.title}" for ${activeTeacher.name} on ${block.day} P${block.periodNumber}`
      );
    }

    setAllBlocks(updated);
    saveStoredTeacherBlocks(updated);
  };

  // Delete Block
  const handleDeleteBlock = (blockId: string) => {
    const target = allBlocks.find((b) => b.id === blockId);
    const updated = allBlocks.filter((b) => b.id !== blockId);
    setAllBlocks(updated);
    saveStoredTeacherBlocks(updated);
    showToast(`Removed "${target?.title || 'block'}" from your plan.`);
    onLogAudit?.(
      'TEACHER_BLOCK_DELETED',
      `Deleted personal planning block "${target?.title}" for ${activeTeacher.name}`
    );
  };

  // One-time Import from Class Timetable (Invariant #2 Decoupled)
  const handleImportClassSlots = () => {
    const result = importClassTimetableSlotsForTeacher(
      activeTeacher.id,
      activeTeacher.name,
      allBlocks,
      levels
    );

    setAllBlocks(result.updatedBlocks);
    showToast(
      result.importedCount > 0
        ? `Imported ${result.importedCount} class lessons from official schedule as independent blocks (Zero write-back).`
        : `Refreshed class lessons for ${activeTeacher.name}. All assigned classes are up-to-date.`,
      'success'
    );

    onLogAudit?.(
      'TEACHER_TIMETABLE_IMPORTED',
      `Imported ${result.importedCount} class lessons into ${activeTeacher.name}'s decoupled personal planner`
    );
  };

  // Clear Personal Schedule
  const handleClearPersonalSchedule = () => {
    if (!window.confirm(`Are you sure you want to clear your personal planning schedule for ${activeTeacher.name}?`)) {
      return;
    }

    const updated = allBlocks.filter((b) => b.teacherId !== activeTeacher.id);
    setAllBlocks(updated);
    saveStoredTeacherBlocks(updated);
    showToast(`Cleared personal schedule for ${activeTeacher.name}.`, 'info');
    onLogAudit?.('TEACHER_TIMETABLE_CLEARED', `Cleared personal planning schedule for ${activeTeacher.name}`);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, block: TeacherPersonalBlock) => {
    setDraggedBlock(block);
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, periodNumber: number) => {
    if (!draggedBlock) return;
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
    if (!draggedBlock) return;

    if (draggedBlock.day === targetDay && draggedBlock.periodNumber === targetPeriod) {
      setDraggedBlock(null);
      return;
    }

    // Check non-blocking overlap in destination
    const overlapCheck = checkOfficialClassOverlap(
      activeTeacher.id,
      targetDay,
      targetPeriod,
      draggedBlock.id,
      undefined,
      levels
    );

    const updated = allBlocks.map((b) => {
      if (b.id === draggedBlock.id) {
        return {
          ...b,
          day: targetDay,
          periodNumber: targetPeriod,
          hasOfficialClassOverlap: overlapCheck.hasOverlap && b.activityType !== 'CLASS_LESSON',
          officialOverlapDetails: overlapCheck.hasOverlap ? overlapCheck.details : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    setAllBlocks(updated);
    saveStoredTeacherBlocks(updated);

    if (overlapCheck.hasOverlap && draggedBlock.activityType !== 'CLASS_LESSON') {
      showToast(
        `Moved to ${targetDay} Period ${targetPeriod}. Notice: Overlaps with an official assigned class (Non-blocking).`,
        'info'
      );
    } else {
      showToast(`Moved "${draggedBlock.title}" to ${targetDay} Period ${targetPeriod}.`);
    }

    onLogAudit?.(
      'TEACHER_BLOCK_MOVED',
      `Moved "${draggedBlock.title}" to ${targetDay} P${targetPeriod} in ${activeTeacher.name}'s planner`
    );

    setDraggedBlock(null);
  };

  // Helper to find block for cell
  const getBlockForCell = (day: DayOfWeek, periodNumber: number): TeacherPersonalBlock | undefined => {
    return teacherBlocks.find((b) => {
      if (b.day !== day || b.periodNumber !== periodNumber) return false;
      if (filterType === 'ALL') return true;
      return b.activityType === filterType;
    });
  };

  // Helper to find official class assignment in cell (for informational preview in empty cells)
  const getOfficialClassForCell = (day: DayOfWeek, periodNumber: number) => {
    return officialClassSlots.find((s) => s.day === day && s.periodNumber === periodNumber);
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-rose-600'
              : toastMessage.type === 'info'
              ? 'bg-amber-600'
              : 'bg-slate-900 dark:bg-white dark:text-slate-900'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : toastMessage.type === 'info' ? (
            <Info className="w-4 h-4 text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Decoupling Invariant Clarification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Teacher Personal Timetable & Planning Agenda
            </h2>
            <Badge variant="primary" size="sm">
              Private Teacher View
            </Badge>
            <Badge variant="info" size="sm" className="hidden sm:inline-flex">
              Architectural Invariant #2 Decoupled
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A private planning calendar for educators to manage lesson prep, exam grading, consultations, and class assignments.
            <strong> Completely decoupled:</strong> Changes here never write back to the official school class timetable.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClassSlots}
            leftIcon={<Download className="w-4 h-4 text-indigo-500" />}
            title="Import assigned class lessons as independent editable blocks (Invariant #2)"
          >
            Import Class Lessons (One-Time)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setBlockModalState({
                isOpen: true,
                day: 'MONDAY',
                periodNumber: 1,
                existingBlock: null,
              })
            }
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Planning Block
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 text-slate-500" />}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Faculty Profile Card & Activity Filter */}
      <Card className="p-4 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Teacher Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0">
            {activeTeacher.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Faculty Planner
            </span>
            <div className="relative">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="appearance-none pr-8 pl-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 min-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20 cursor-pointer"
              >
                {FACULTY_MEMBERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Activity Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> View:
          </span>
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All ({teacherBlocks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('CLASS_LESSON')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'CLASS_LESSON'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}
          >
            Teaching ({teachingPeriods})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('PREP_PLANNING')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'PREP_PLANNING'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300'
            }`}
          >
            Prep ({prepPeriods})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('MARKING_GRADING')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'MARKING_GRADING'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            Marking ({markingPeriods})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('STUDENT_MENTORING')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'STUDENT_MENTORING'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300'
            }`}
          >
            Mentoring ({mentoringAndMeetings})
          </button>

          {teacherBlocks.length > 0 && (
            <button
              type="button"
              onClick={handleClearPersonalSchedule}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer ml-2"
              title="Reset personal blocks for this teacher"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Weekly Planning Stat Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Total Planned
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {teacherBlocks.length} <span className="text-xs font-medium text-slate-400">Periods</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Classroom Teaching
          </div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {teachingPeriods} <span className="text-xs font-medium text-slate-400">Lessons</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            Prep & Curriculum
          </div>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {prepPeriods} <span className="text-xs font-medium text-slate-400">Periods</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-amber-500" />
            Marking & Grading
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {markingPeriods} <span className="text-xs font-medium text-slate-400">Periods</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <AlertTriangle
              className={`w-3.5 h-3.5 ${overlapCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
            />
            Schedule Overlaps
          </div>
          <div
            className={`text-xl font-extrabold mt-1 ${
              overlapCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {overlapCount} <span className="text-xs font-medium text-slate-400">Non-blocking</span>
          </div>
        </div>
      </div>

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
                  <div className="text-[10px] text-slate-400 font-normal">Personal Agenda</div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body (Time Periods) */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {TIME_SLOT_DEFINITIONS.map((period) => {
              // Break Row
              if (period.isBreak) {
                const isLunch = period.periodNumber === -2;
                return (
                  <tr
                    key={period.label}
                    className="bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                  >
                    <td className="py-2 px-4 font-semibold border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px]">
                          {period.startTime} - {period.endTime}
                        </span>
                      </div>
                    </td>
                    <td
                      colSpan={DAYS_OF_WEEK.length}
                      className="py-2 px-4 text-center font-bold tracking-wide uppercase text-[11px] text-slate-500 dark:text-slate-400"
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

              // Academic / Planning Period Row
              return (
                <tr
                  key={period.periodNumber}
                  className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors"
                >
                  {/* Period Label & Time */}
                  <td className="py-3 px-4 font-medium border-r border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 whitespace-nowrap align-top">
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
                    const block = getBlockForCell(day.key, period.periodNumber);
                    const officialClass = getOfficialClassForCell(day.key, period.periodNumber);
                    const isDragOver =
                      dragOverCell?.day === day.key && dragOverCell?.periodNumber === period.periodNumber;

                    return (
                      <td
                        key={`${day.key}-${period.periodNumber}`}
                        onDragOver={(e) => handleDragOver(e, day.key, period.periodNumber)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day.key, period.periodNumber)}
                        className={`p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-top min-w-[155px] transition-colors relative ${
                          isDragOver
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500 ring-inset rounded-lg'
                            : ''
                        }`}
                      >
                        {block ? (
                          <TeacherPersonalBlockCard
                            block={block}
                            onEdit={(b) =>
                              setBlockModalState({
                                isOpen: true,
                                day: b.day,
                                periodNumber: b.periodNumber,
                                existingBlock: b,
                              })
                            }
                            onDelete={handleDeleteBlock}
                            onDragStart={handleDragStart}
                            isDragging={draggedBlock?.id === block.id}
                          />
                        ) : (
                          <div className="h-full min-h-[96px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col justify-between p-2 text-center group transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
                            {/* If an official class assignment exists in this period that isn't yet added */}
                            {officialClass ? (
                              <div className="text-left p-1 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1 mb-1">
                                <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 truncate">
                                  {officialClass.subjectName}
                                </div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400">
                                  {officialClass.room}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSaveBlock({
                                      id: `tpb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                      schoolId: TENANT_SCHOOL_ID,
                                      teacherId: activeTeacher.id,
                                      teacherName: activeTeacher.name,
                                      day: day.key,
                                      periodNumber: period.periodNumber,
                                      title: `${officialClass.subjectName} (Assigned Class)`,
                                      activityType: 'CLASS_LESSON',
                                      room: officialClass.room,
                                      colorTheme: 'indigo',
                                      importedFromClassTimetable: true,
                                      originalClassSlotId: officialClass.id,
                                      hasOfficialClassOverlap: false,
                                      updatedAt: new Date().toISOString(),
                                    });
                                  }}
                                  className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer pt-0.5"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Add to Planner
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-300 dark:text-slate-600 font-medium italic my-auto">
                                Free Block
                              </div>
                            )}

                            {/* Add Block button */}
                            <button
                              type="button"
                              onClick={() =>
                                setBlockModalState({
                                  isOpen: true,
                                  day: day.key,
                                  periodNumber: period.periodNumber,
                                  existingBlock: null,
                                })
                              }
                              className="w-full flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1 cursor-pointer opacity-40 group-hover:opacity-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Plan Activity</span>
                            </button>
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

      {/* Decoupled Invariant #2 Enforcement Note */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            <strong>Architectural Invariant #2 Strictly Enforced:</strong> The class timetable (admin) and teacher personal timetable are completely decoupled systems. Personal blocks, prep times, and notes never write back to the official timetable. Overlaps with class slots are informational only and never block saving.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" size="sm">
            Tenant Isolation: {TENANT_SCHOOL_ID}
          </Badge>
        </div>
      </div>

      {/* Teacher Block Modal */}
      <TeacherBlockModal
        isOpen={blockModalState.isOpen}
        onClose={() => setBlockModalState((prev) => ({ ...prev, isOpen: false }))}
        teacherId={activeTeacher.id}
        teacherName={activeTeacher.name}
        day={blockModalState.day}
        periodNumber={blockModalState.periodNumber}
        existingBlock={blockModalState.existingBlock}
        levels={levels}
        onSaveBlock={handleSaveBlock}
      />
    </div>
  );
};
