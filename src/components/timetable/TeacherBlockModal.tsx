import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  TeacherPersonalBlock,
  TeacherActivityType,
  DayOfWeek,
  ClassLevel,
} from '../../types';
import { Modal, Button, Input } from '../../design-system';
import {
  DAYS_OF_WEEK,
  TIME_SLOT_DEFINITIONS,
  TENANT_SCHOOL_ID,
  SCHOOL_ROOMS,
} from '../../lib/class-timetable-store';
import {
  ACTIVITY_TYPE_CONFIG,
  checkOfficialClassOverlap,
} from '../../lib/teacher-timetable-store';

interface TeacherBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  day: DayOfWeek;
  periodNumber: number;
  existingBlock?: TeacherPersonalBlock | null;
  levels: ClassLevel[];
  onSaveBlock: (block: TeacherPersonalBlock) => void;
}

const COLOR_OPTIONS: { id: TeacherPersonalBlock['colorTheme']; label: string; ringClass: string }[] = [
  { id: 'indigo', label: 'Indigo', ringClass: 'bg-indigo-500' },
  { id: 'violet', label: 'Violet', ringClass: 'bg-purple-500' },
  { id: 'emerald', label: 'Emerald', ringClass: 'bg-emerald-500' },
  { id: 'amber', label: 'Amber', ringClass: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', ringClass: 'bg-rose-500' },
  { id: 'sky', label: 'Sky', ringClass: 'bg-sky-500' },
  { id: 'teal', label: 'Teal', ringClass: 'bg-teal-500' },
  { id: 'orange', label: 'Orange', ringClass: 'bg-orange-500' },
  { id: 'cyan', label: 'Cyan', ringClass: 'bg-cyan-500' },
];

export const TeacherBlockModal: React.FC<TeacherBlockModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  day: initialDay,
  periodNumber: initialPeriod,
  existingBlock,
  levels,
  onSaveBlock,
}) => {
  const [activityType, setActivityType] = useState<TeacherActivityType>(
    existingBlock?.activityType || 'PREP_PLANNING'
  );
  const [title, setTitle] = useState(existingBlock?.title || '');
  const [day, setDay] = useState<DayOfWeek>(existingBlock?.day || initialDay);
  const [periodNumber, setPeriodNumber] = useState<number>(existingBlock?.periodNumber || initialPeriod);
  const [room, setRoom] = useState(existingBlock?.room || 'Staff Room / Department Office');
  const [notes, setNotes] = useState(existingBlock?.notes || '');
  const [colorTheme, setColorTheme] = useState<TeacherPersonalBlock['colorTheme']>(
    existingBlock?.colorTheme || ACTIVITY_TYPE_CONFIG.PREP_PLANNING.defaultColor
  );

  // Sync state on open/edit
  useEffect(() => {
    if (isOpen) {
      if (existingBlock) {
        setActivityType(existingBlock.activityType);
        setTitle(existingBlock.title);
        setDay(existingBlock.day);
        setPeriodNumber(existingBlock.periodNumber);
        setRoom(existingBlock.room || 'Staff Room');
        setNotes(existingBlock.notes || '');
        setColorTheme(existingBlock.colorTheme);
      } else {
        setActivityType('PREP_PLANNING');
        setTitle('');
        setDay(initialDay);
        setPeriodNumber(initialPeriod);
        setRoom('Staff Room / Resource Center');
        setNotes('');
        setColorTheme(ACTIVITY_TYPE_CONFIG.PREP_PLANNING.defaultColor);
      }
    }
  }, [isOpen, existingBlock, initialDay, initialPeriod]);

  // When activity type changes, if title is empty or default, suggest title & color
  const handleActivityTypeSelect = (type: TeacherActivityType) => {
    setActivityType(type);
    setColorTheme(ACTIVITY_TYPE_CONFIG[type].defaultColor);
    if (!title || title.trim() === '') {
      if (type === 'PREP_PLANNING') setTitle('Lesson Planning & Worksheets');
      else if (type === 'MARKING_GRADING') setTitle('Grading Homework & Assessments');
      else if (type === 'STUDENT_MENTORING') setTitle('Student Consultation & Tutoring');
      else if (type === 'MEETING') setTitle('Departmental Coordination Meeting');
      else if (type === 'SUPERVISION') setTitle('Recess & Hallway Duty');
      else if (type === 'PERSONAL') setTitle('Curriculum Research & Reading');
      else if (type === 'CLASS_LESSON') setTitle('Classroom Teaching');
    }
  };

  // Real-time Non-blocking Conflict Checking
  const overlapCheck = checkOfficialClassOverlap(
    teacherId,
    day,
    periodNumber,
    existingBlock?.id,
    undefined,
    levels
  );

  const selectedPeriodDef = TIME_SLOT_DEFINITIONS.find((p) => p.periodNumber === periodNumber);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const blockToSave: TeacherPersonalBlock = {
      id: existingBlock ? existingBlock.id : `tpb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      schoolId: TENANT_SCHOOL_ID,
      teacherId,
      teacherName,
      day,
      periodNumber,
      title: title.trim(),
      activityType,
      room: room.trim() || undefined,
      notes: notes.trim() || undefined,
      colorTheme,
      importedFromClassTimetable: existingBlock?.importedFromClassTimetable || false,
      originalClassSlotId: existingBlock?.originalClassSlotId,
      hasOfficialClassOverlap: overlapCheck.hasOverlap && activityType !== 'CLASS_LESSON',
      officialOverlapDetails: overlapCheck.hasOverlap ? overlapCheck.details : undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveBlock(blockToSave);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingBlock ? 'Edit Teacher Planning Block' : 'Add Personal Planning Block'}
      maxWidth="xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Architectural Invariant #2 Banner */}
        <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Architectural Invariant #2 (Timetable Decoupling):</span>{' '}
            This is your private planning view. Changes made here never write back to the school's official class timetable.
          </div>
        </div>

        {/* Non-Blocking Informational Conflict Warning */}
        {overlapCheck.hasOverlap && activityType !== 'CLASS_LESSON' && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>Informational Schedule Notice</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-semibold">
                  Non-blocking
                </span>
              </div>
              <p className="text-rose-700 dark:text-rose-300">
                You are officially assigned to teach <strong>{overlapCheck.details?.subjectName}</strong> for{' '}
                <strong>{overlapCheck.details?.levelName} {overlapCheck.details?.armName}</strong> in{' '}
                <strong>{overlapCheck.details?.room}</strong> during this period.
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Per Invariant #2, you may still save this personal block (e.g. for marking or co-planning). It will be saved with a subtle informational highlight.
              </p>
            </div>
          </div>
        )}

        {/* Activity Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Activity Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(Object.keys(ACTIVITY_TYPE_CONFIG) as TeacherActivityType[]).map((typeKey) => {
              const cfg = ACTIVITY_TYPE_CONFIG[typeKey];
              const isSelected = activityType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => handleActivityTypeSelect(typeKey)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 font-bold text-indigo-900 dark:text-indigo-100'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] truncate">{cfg.label}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{cfg.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title Field with Quick Suggestion Pills */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Block Title / Objective
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grade Mock Exams, Prepare Algebra Worksheets"
            required
          />
          {/* Quick suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-medium">Suggestions:</span>
            {activityType === 'PREP_PLANNING' && (
              <>
                <button
                  type="button"
                  onClick={() => setTitle('Prepare Scheme of Work')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Scheme of Work
                </button>
                <button
                  type="button"
                  onClick={() => setTitle('Photocopy Math Worksheets')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Photocopy Worksheets
                </button>
                <button
                  type="button"
                  onClick={() => setTitle('Laboratory Experiment Setup')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Lab Setup
                </button>
              </>
            )}
            {activityType === 'MARKING_GRADING' && (
              <>
                <button
                  type="button"
                  onClick={() => setTitle('Grade Test 1 Papers')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Grade Test 1
                </button>
                <button
                  type="button"
                  onClick={() => setTitle('Input Grades into Portal')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Portal Entry
                </button>
              </>
            )}
            {activityType === 'STUDENT_MENTORING' && (
              <>
                <button
                  type="button"
                  onClick={() => setTitle('Math Olympiad Coaching')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Olympiad Coaching
                </button>
                <button
                  type="button"
                  onClick={() => setTitle('Student Remedial Clinic')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Remedial Clinic
                </button>
              </>
            )}
            {activityType === 'MEETING' && (
              <>
                <button
                  type="button"
                  onClick={() => setTitle('Department Faculty Meeting')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Department Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setTitle('Curriculum Coordination')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  + Curriculum Sync
                </button>
              </>
            )}
          </div>
        </div>

        {/* Day & Period Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Day of Week
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayOfWeek)}
              className="w-full rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Schedule Period
            </label>
            <select
              value={periodNumber}
              onChange={(e) => setPeriodNumber(Number(e.target.value))}
              className="w-full rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              {TIME_SLOT_DEFINITIONS.filter((p) => !p.isBreak).map((p) => (
                <option key={p.periodNumber} value={p.periodNumber}>
                  {p.label} ({p.startTime} - {p.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room / Location */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Location / Work Area
          </label>
          <div className="flex gap-2">
            <Input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Staff Room 2B, Science Resource Room, Library"
            />
            <select
              onChange={(e) => {
                if (e.target.value) setRoom(e.target.value);
              }}
              value=""
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 text-slate-600 dark:text-slate-300"
            >
              <option value="">Quick Pick</option>
              <option value="Staff Common Room">Staff Common Room</option>
              <option value="Department Resource Center">Department Resource Center</option>
              <option value="Mathematics Laboratory">Mathematics Laboratory</option>
              <option value="School Library - Quiet Pod">School Library - Quiet Pod</option>
              <option value="Block A - Room 101">Block A - Room 101</option>
              <option value="ICT Computer Lab">ICT Computer Lab</option>
              {SCHOOL_ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color Theme Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Visual Color Theme
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorTheme(c.id)}
                className={`w-7 h-7 rounded-full ${c.ringClass} flex items-center justify-center transition-all cursor-pointer ${
                  colorTheme === c.id ? 'ring-3 ring-slate-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title={c.label}
              >
                {colorTheme === c.id && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Notes / Objectives */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Private Notes & Agenda
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add personal reminders, questions to prepare, resources checklist, or student feedback..."
            className="w-full rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-400">
            {overlapCheck.hasOverlap ? (
              <span className="text-rose-500 font-medium">Informational clash noted (non-blocking).</span>
            ) : (
              <span>Personal planning block</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {existingBlock ? 'Save Changes' : 'Add to Schedule'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
