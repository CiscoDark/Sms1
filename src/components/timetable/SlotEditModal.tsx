import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import {
  ClassTimetableSlot,
  DayOfWeek,
  ClassLevel,
  TimetableConflict,
} from '../../types';
import { Modal, Button, Input } from '../../design-system';
import { FACULTY_MEMBERS } from '../../data/mockData';
import {
  CURRICULUM_SUBJECTS,
  SCHOOL_ROOMS,
  DAYS_OF_WEEK,
  TIME_SLOT_DEFINITIONS,
  checkProposedSlotConflict,
  TENANT_SCHOOL_ID,
} from '../../lib/class-timetable-store';

interface SlotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: ClassLevel | null;
  armId: string;
  day: DayOfWeek;
  periodNumber: number;
  existingSlot?: ClassTimetableSlot | null;
  allSlots: ClassTimetableSlot[];
  allLevels: ClassLevel[];
  onSaveSlot: (slot: ClassTimetableSlot) => void;
}

export const SlotEditModal: React.FC<SlotEditModalProps> = ({
  isOpen,
  onClose,
  level,
  armId,
  day,
  periodNumber,
  existingSlot,
  allSlots,
  allLevels,
  onSaveSlot,
}) => {
  const arm = level?.arms.find((a) => a.id === armId);

  // Form states
  const [selectedSubjectCode, setSelectedSubjectCode] = useState(
    existingSlot?.subjectCode || CURRICULUM_SUBJECTS[0].code
  );
  const [teacherId, setTeacherId] = useState(
    existingSlot?.teacherId || CURRICULUM_SUBJECTS[0].defaultTeacherId || FACULTY_MEMBERS[0].id
  );
  const [room, setRoom] = useState(
    existingSlot?.room || arm?.roomNumber || CURRICULUM_SUBJECTS[0].preferredRoom || SCHOOL_ROOMS[0]
  );
  const [notes, setNotes] = useState(existingSlot?.notes || '');
  const [conflict, setConflict] = useState<TimetableConflict | null>(null);

  // When modal opens or subject changes, initialize defaults
  useEffect(() => {
    if (existingSlot) {
      setSelectedSubjectCode(existingSlot.subjectCode);
      setTeacherId(existingSlot.teacherId);
      setRoom(existingSlot.room);
      setNotes(existingSlot.notes || '');
    } else {
      const defaultSubj = CURRICULUM_SUBJECTS[0];
      setSelectedSubjectCode(defaultSubj.code);
      setTeacherId(defaultSubj.defaultTeacherId || arm?.teacherId || FACULTY_MEMBERS[0].id);
      setRoom(arm?.roomNumber || defaultSubj.preferredRoom || SCHOOL_ROOMS[0]);
      setNotes('');
    }
  }, [existingSlot, arm, isOpen]);

  // When subject changes, offer to auto-populate default teacher & preferred room
  const handleSubjectChange = (newCode: string) => {
    setSelectedSubjectCode(newCode);
    const subj = CURRICULUM_SUBJECTS.find((s) => s.code === newCode);
    if (subj) {
      if (subj.defaultTeacherId) setTeacherId(subj.defaultTeacherId);
      if (subj.preferredRoom) setRoom(subj.preferredRoom);
    }
  };

  // Live Conflict Evaluation
  useEffect(() => {
    if (!isOpen || !level || !arm) {
      setConflict(null);
      return;
    }

    const currentTeacher = FACULTY_MEMBERS.find((f) => f.id === teacherId);
    const currentSubject = CURRICULUM_SUBJECTS.find((s) => s.code === selectedSubjectCode);

    const proposed: Omit<ClassTimetableSlot, 'id'> = {
      schoolId: TENANT_SCHOOL_ID,
      levelId: level.id,
      armId: arm.id,
      day,
      periodNumber,
      subjectName: currentSubject?.name || 'Subject',
      subjectCode: selectedSubjectCode,
      teacherId,
      teacherName: currentTeacher?.name || 'Educator',
      room,
      colorTheme: currentSubject?.colorTheme || 'indigo',
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin Registrar',
    };

    const detected = checkProposedSlotConflict(
      proposed,
      allSlots,
      existingSlot?.id,
      allLevels
    );

    setConflict(detected);
  }, [isOpen, level, arm, day, periodNumber, selectedSubjectCode, teacherId, room, notes, existingSlot, allSlots, allLevels]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!level || !arm) return;
    if (conflict) return; // Prevent double-booking

    const currentTeacher = FACULTY_MEMBERS.find((f) => f.id === teacherId) || FACULTY_MEMBERS[0];
    const currentSubject = CURRICULUM_SUBJECTS.find((s) => s.code === selectedSubjectCode) || CURRICULUM_SUBJECTS[0];

    const slotPayload: ClassTimetableSlot = {
      id: existingSlot?.id || `tt-${Date.now()}`,
      schoolId: TENANT_SCHOOL_ID,
      levelId: level.id,
      armId: arm.id,
      day,
      periodNumber,
      subjectName: currentSubject.name,
      subjectCode: currentSubject.code,
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.name,
      room: room.trim(),
      colorTheme: currentSubject.colorTheme,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Registrar Office',
    };

    onSaveSlot(slotPayload);
    onClose();
  };

  const periodDef = TIME_SLOT_DEFINITIONS.find((t) => t.periodNumber === periodNumber);
  const dayDef = DAYS_OF_WEEK.find((d) => d.key === day);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>{existingSlot ? 'Edit Lesson Slot' : 'Assign Timetable Slot'}</span>
        </div>
      }
      description={`${level?.name || 'Class'} ${arm?.name || ''} • ${dayDef?.label || day} • ${periodDef?.label || `Period ${periodNumber}`} (${periodDef?.startTime || '08:00'} - ${periodDef?.endTime || '08:45'})`}
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {conflict ? (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Conflict detected — Double-booking blocked
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> No scheduling conflicts detected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={Boolean(conflict)}
            >
              {existingSlot ? 'Update Lesson' : 'Confirm Assignment'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Real-Time Conflict Warning Banner */}
        {conflict && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Double-Booking Conflict (Rule Prevention)</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              {conflict.message}
            </p>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              Please assign a different educator or room, or re-schedule to another period to proceed.
            </div>
          </div>
        )}

        {/* Subject Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Academic Subject
          </label>
          <select
            value={selectedSubjectCode}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 min-h-[42px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          >
            {CURRICULUM_SUBJECTS.map((subj) => (
              <option key={subj.code} value={subj.code}>
                [{subj.code}] {subj.name} ({subj.category})
              </option>
            ))}
          </select>
        </div>

        {/* Educator / Faculty Member Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Assigned Teacher / Educator
          </label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 min-h-[42px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          >
            {FACULTY_MEMBERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.department}
              </option>
            ))}
          </select>
        </div>

        {/* Classroom / Laboratory Location */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Assigned Room / Facility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value={arm?.roomNumber || 'Classroom'}>
                Default: {arm?.roomNumber || 'Home Room'}
              </option>
              {SCHOOL_ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Input
              placeholder="Or enter custom room name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="py-1.5"
            />
          </div>
        </div>

        {/* Lesson Notes */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Lesson Notes / Equipment Requirements (Optional)
          </label>
          <Input
            placeholder="e.g. Bring scientific calculator, lab coats required, audio-visual session"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="py-2"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            Changes are saved to the authoritative class timetable and will immediately reflect in read-only student/parent schedules.
          </span>
        </div>
      </form>
    </Modal>
  );
};
