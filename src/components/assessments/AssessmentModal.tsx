import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Layers,
  BookOpen,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  AssessmentScheduleItem,
  AssessmentType,
  ClassLevel,
  UserProfile,
} from '../../types';
import { Modal, Button, Input, Badge } from '../../design-system';
import { FACULTY_MEMBERS } from '../../data/mockData';
import { CURRICULUM_SUBJECTS, SCHOOL_ROOMS, TENANT_SCHOOL_ID } from '../../lib/class-timetable-store';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: AssessmentScheduleItem) => void;
  existingItem?: AssessmentScheduleItem | null;
  levels: ClassLevel[];
  currentUser: UserProfile;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingItem,
  levels,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssessmentType>('TERMINAL_EXAM');
  const [subjectCode, setSubjectCode] = useState('MTH');
  const [levelId, setLevelId] = useState(levels[0]?.id || 'level-jss-1');
  const [selectedArmIds, setSelectedArmIds] = useState<string[]>([]);
  const [date, setDate] = useState('2024-11-25');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [venue, setVenue] = useState(SCHOOL_ROOMS[0] || 'Main Examination Hall A');
  const [supervisorTeacherId, setSupervisorTeacherId] = useState(FACULTY_MEMBERS[0]?.id || 'f-1');
  const [maxScore, setMaxScore] = useState(60);
  const [weightPercentage, setWeightPercentage] = useState(60);
  const [status, setStatus] = useState<AssessmentScheduleItem['status']>('SCHEDULED');
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [isPublishedToStudents, setIsPublishedToStudents] = useState(true);
  const [instructions, setInstructions] = useState('');
  const [syllabusTopicInput, setSyllabusTopicInput] = useState('');

  const currentLevel = levels.find((l) => l.id === levelId) || levels[0];

  useEffect(() => {
    if (existingItem) {
      setTitle(existingItem.title);
      setType(existingItem.type);
      setSubjectCode(existingItem.subjectCode);
      setLevelId(existingItem.levelId);
      setSelectedArmIds(existingItem.armIds || []);
      setDate(existingItem.date);
      setStartTime(existingItem.startTime);
      setEndTime(existingItem.endTime);
      setVenue(existingItem.venue);
      setSupervisorTeacherId(existingItem.supervisorTeacherId || FACULTY_MEMBERS[0]?.id || '');
      setMaxScore(existingItem.maxScore);
      setWeightPercentage(existingItem.weightPercentage);
      setStatus(existingItem.status);
      setIsGradingOpen(existingItem.isGradingOpen);
      setIsPublishedToStudents(existingItem.isPublishedToStudents);
      setInstructions(existingItem.instructions || '');
      setSyllabusTopicInput((existingItem.syllabusTopics || []).join(', '));
    } else {
      // Defaults based on type
      setTitle('First Term Examination');
      setType('TERMINAL_EXAM');
      setSubjectCode('MTH');
      setLevelId(levels[0]?.id || 'level-jss-1');
      setSelectedArmIds([]);
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('11:30');
      setVenue('Main Examination Hall A');
      setMaxScore(60);
      setWeightPercentage(60);
      setStatus('SCHEDULED');
      setIsGradingOpen(false);
      setIsPublishedToStudents(true);
      setInstructions('Bring all authorized instruments and identification credentials.');
      setSyllabusTopicInput('Topics 1 to 5');
    }
  }, [existingItem, isOpen, levels]);

  // Adjust default scores when type changes
  const handleTypeChange = (newType: AssessmentType) => {
    setType(newType);
    if (newType === 'CA1' || newType === 'CA2') {
      setMaxScore(20);
      setWeightPercentage(20);
      setTitle(`First Term Continuous Assessment (${newType})`);
    } else if (newType === 'MID_TERM') {
      setMaxScore(20);
      setWeightPercentage(20);
      setTitle('First Term Mid-Term Assessment');
    } else if (newType === 'TERMINAL_EXAM') {
      setMaxScore(60);
      setWeightPercentage(60);
      setTitle('First Term Terminal Examination');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subjectObj = CURRICULUM_SUBJECTS.find((s) => s.code === subjectCode);
    const teacherObj = FACULTY_MEMBERS.find((f) => f.id === supervisorTeacherId);

    // Calculate duration in minutes
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const duration = Math.max(30, (endH * 60 + endM) - (startH * 60 + startM));

    const topics = syllabusTopicInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload: AssessmentScheduleItem = {
      id: existingItem?.id || `asm-${Date.now()}`,
      schoolId: TENANT_SCHOOL_ID,
      sessionYear: existingItem?.sessionYear || '2024/2025',
      termName: existingItem?.termName || 'First Term',
      title: title || `${subjectObj?.name || subjectCode} Assessment`,
      type,
      subjectCode,
      subjectName: subjectObj?.name || subjectCode,
      levelId,
      levelName: currentLevel?.name || 'JSS 1',
      armIds: selectedArmIds,
      date,
      startTime,
      endTime,
      durationMinutes: duration,
      venue,
      supervisorTeacherId,
      supervisorTeacherName: teacherObj?.name || 'Assigned Faculty',
      maxScore,
      weightPercentage,
      status,
      isGradingOpen,
      gradingUnlockedAt: isGradingOpen
        ? existingItem?.gradingUnlockedAt || new Date().toISOString()
        : undefined,
      gradingUnlockedBy: isGradingOpen
        ? existingItem?.gradingUnlockedBy || `${currentUser.name} (${currentUser.role})`
        : undefined,
      isPublishedToStudents,
      instructions,
      syllabusTopics: topics,
      createdAt: existingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingItem ? 'Edit Assessment Schedule' : 'Schedule Examination or CA'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assessment Classification
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as AssessmentType)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="TERMINAL_EXAM">Terminal Examination (Final Exam)</option>
              <option value="MID_TERM">Mid-Term Assessment (CA 2)</option>
              <option value="CA1">Continuous Assessment 1 (CA 1)</option>
              <option value="PRACTICAL">Practical / Laboratory Test</option>
              <option value="MOCK_EXAM">Mock Examination (Senior Classes)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Academic Subject
            </label>
            <select
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {CURRICULUM_SUBJECTS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Exam / Assessment Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. First Term Terminal Examination: Mathematics Paper 1 & 2"
            required
          />
        </div>

        {/* Level and Arms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Class Level
            </label>
            <select
              value={levelId}
              onChange={(e) => {
                setLevelId(e.target.value);
                setSelectedArmIds([]);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name} ({lvl.arms.length} Streams)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Class Streams / Arms
            </label>
            <div className="text-xs text-slate-500 mb-1">
              {selectedArmIds.length === 0 ? 'Applying to all arms in class' : `${selectedArmIds.length} stream(s) selected`}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedArmIds([])}
                className={`px-2 py-1 text-xs rounded-md border ${
                  selectedArmIds.length === 0
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300 font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Arms
              </button>
              {currentLevel?.arms.map((arm) => {
                const isSelected = selectedArmIds.includes(arm.id);
                return (
                  <button
                    key={arm.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedArmIds(selectedArmIds.filter((id) => id !== arm.id));
                      } else {
                        setSelectedArmIds([...selectedArmIds, arm.id]);
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded-md border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {arm.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Date, Time Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assessment Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Start Time
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              End Time
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Venue & Invigilator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Venue / Examination Hall
            </label>
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {SCHOOL_ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lead Invigilator / Supervisor
            </label>
            <select
              value={supervisorTeacherId}
              onChange={(e) => setSupervisorTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {FACULTY_MEMBERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scores & Weights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Max Score
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Weight %
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={weightPercentage}
              onChange={(e) => setWeightPercentage(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Session Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AssessmentScheduleItem['status'])}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CONCLUDED">Concluded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={isPublishedToStudents}
                onChange={(e) => setIsPublishedToStudents(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Publish to Students
              </span>
            </label>
          </div>
        </div>

        {/* Step 11 Gating Lock Configuration */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isGradingOpen
            ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
            : 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {isGradingOpen ? (
                <Unlock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              )}
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  Report Card Grading Gate: {isGradingOpen ? 'Grading Window Open' : 'Grading Window Locked'}
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {isGradingOpen
                    ? 'Teachers can freely submit and finalize marks in the gradebook.'
                    : 'Report card grading is locked until this exam window has occurred, preventing premature grade entry.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGradingOpen(!isGradingOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isGradingOpen
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {isGradingOpen ? 'Lock Grading' : 'Unlock Grading'}
            </button>
          </div>
        </div>

        {/* Instructions & Topics */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Candidate Instructions & Equipment Required
          </label>
          <Input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Bring non-programmable calculator, 2B pencils, and drawing set."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Syllabus Topics Covered (Comma-separated)
          </label>
          <Input
            value={syllabusTopicInput}
            onChange={(e) => setSyllabusTopicInput(e.target.value)}
            placeholder="e.g. Linear Equations, Plane Geometry, Mensuration, Statistics"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {existingItem ? 'Update Assessment' : 'Create Assessment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
