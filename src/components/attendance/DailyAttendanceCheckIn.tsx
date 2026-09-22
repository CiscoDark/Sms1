import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Check,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Save,
  CheckCircle2,
  Users,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  ClassLevel,
  Student,
  UserProfile,
  CellConflict,
} from '../../types';
import {
  getAttendanceForClassAndDate,
  saveClassAttendanceRegister,
} from '../../lib/attendance/attendance-store';
import {
  isAppOnline,
  getOfflineQueue,
  getActiveConflicts,
  getConflictForAttendance,
  simulateAttendanceConflict,
  subscribeConflictChanges,
  subscribeNetworkStatus,
  subscribeQueueChanges,
} from '../../lib/offline-queue';
import { InlineConflictDiffBadge } from '../offline/InlineConflictDiffBadge';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { Input } from '../../design-system/components/Input';

interface DailyAttendanceCheckInProps {
  levels: ClassLevel[];
  students: Student[];
  currentUser: UserProfile;
  onLogAudit: (action: string, details: string) => void;
  onAttendanceSaved?: () => void;
}

export const DailyAttendanceCheckIn: React.FC<DailyAttendanceCheckInProps> = ({
  levels,
  students,
  currentUser,
  onLogAudit,
  onAttendanceSaved,
}) => {
  // Current date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedLevelName, setSelectedLevelName] = useState<string>(levels[0]?.name || 'JSS 1');
  const [selectedArmName, setSelectedArmName] = useState<string>(
    levels[0]?.arms[0]?.name || 'Diamond'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Available arms for selected level
  const activeLevel = levels.find((l) => l.name === selectedLevelName) || levels[0];
  const availableArms = activeLevel?.arms || [];

  // Students belonging to selected level and arm
  const classStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.status === 'ACTIVE' &&
        (s.classLevel.toLowerCase() === selectedLevelName.toLowerCase() ||
          s.classLevel.toLowerCase().includes(selectedLevelName.toLowerCase())) &&
        (s.classArm.toLowerCase() === selectedArmName.toLowerCase() ||
          s.classArm.toLowerCase().includes(selectedArmName.toLowerCase()) ||
          selectedArmName.toLowerCase().includes(s.classArm.toLowerCase()))
    );
  }, [students, selectedLevelName, selectedArmName]);

  // Local map of studentId -> AttendanceRecord draft
  const [attendanceDraft, setAttendanceDraft] = useState<Map<string, AttendanceRecord>>(new Map());

  // Offline Sync & Conflict State
  const [isOnline, setIsOnline] = useState<boolean>(() => isAppOnline());
  const [queueCount, setQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [conflicts, setConflicts] = useState<CellConflict[]>(() => getActiveConflicts());

  useEffect(() => {
    const unsubNet = subscribeNetworkStatus((online) => setIsOnline(online));
    const unsubQueue = subscribeQueueChanges(() => setQueueCount(getOfflineQueue().length));
    const unsubConflicts = subscribeConflictChanges(() => setConflicts(getActiveConflicts()));
    return () => {
      unsubNet();
      unsubQueue();
      unsubConflicts();
    };
  }, []);

  const handleConflictResolved = (resolved: CellConflict) => {
    const existing = getAttendanceForClassAndDate(selectedLevelName, selectedArmName, selectedDate);
    const draftMap = new Map<string, AttendanceRecord>();
    existing.forEach((r) => draftMap.set(r.studentId, r));
    setAttendanceDraft(draftMap);
    setConflicts(getActiveConflicts());
    onLogAudit(
      'SYNC_CONFLICT_RESOLVED',
      `Resolved attendance sync conflict for ${resolved.studentName} selecting: ${resolved.resolvedChoice}`
    );
  };

  const handleSimulateConflict = () => {
    if (classStudents.length === 0) return;
    const targetStudent = classStudents[0];
    const rec = attendanceDraft.get(targetStudent.id) || {
      id: `att-${targetStudent.id}-${selectedDate}`,
      studentId: targetStudent.id,
      studentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
      admissionNumber: targetStudent.admissionNumber,
      classLevel: selectedLevelName,
      classArm: selectedArmName,
      date: selectedDate,
      status: 'PRESENT' as const,
      markedBy: currentUser.name,
      markedAt: new Date().toISOString(),
    };
    simulateAttendanceConflict(rec, {
      localStatus: 'LATE',
      remoteStatus: 'EXCUSED',
      localAuthor: `${currentUser.name} (Form Tutor - Tablet Offline)`,
      remoteAuthor: 'Sister Comfort (School Clinic Nurse - Web Portal)',
    });
    setConflicts(getActiveConflicts());
    setQueueCount(getOfflineQueue().length);
    onLogAudit(
      'SYNC_CONFLICT_SIMULATED',
      `Simulated attendance sync conflict for ${rec.studentName} on ${selectedDate} (Offline: LATE vs Server: EXCUSED)`
    );
  };

  // Load existing records or default all to PRESENT when class or date changes
  useEffect(() => {
    const existing = getAttendanceForClassAndDate(selectedLevelName, selectedArmName, selectedDate);
    const draftMap = new Map<string, AttendanceRecord>();

    if (existing.length > 0) {
      existing.forEach((r) => draftMap.set(r.studentId, r));
    } else {
      // Default to PRESENT for easy one-tap check-in
      classStudents.forEach((student) => {
        draftMap.set(student.id, {
          id: `att-${student.id}-${selectedDate}`,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          classLevel: selectedLevelName,
          classArm: selectedArmName,
          date: selectedDate,
          status: 'PRESENT',
          arrivalTime: '07:45',
          markedBy: currentUser.name,
          markedAt: new Date().toISOString(),
        });
      });
    }

    setAttendanceDraft(draftMap);
    setSaveSuccess(false);
  }, [selectedLevelName, selectedArmName, selectedDate, classStudents, currentUser.name]);

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase();
    return classStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
    );
  }, [classStudents, searchQuery]);

  // Calculate live statistics
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;

    classStudents.forEach((s) => {
      const rec = attendanceDraft.get(s.id);
      const status = rec?.status || 'PRESENT';
      if (status === 'PRESENT') present++;
      else if (status === 'LATE') late++;
      else if (status === 'EXCUSED') excused++;
      else if (status === 'ABSENT') absent++;
    });

    const total = classStudents.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 100;

    return { total, present, late, excused, absent, rate };
  }, [classStudents, attendanceDraft]);

  // Update a student's status
  const handleSetStatus = (
    studentId: string,
    status: AttendanceStatus,
    extra?: { arrivalTime?: string; remarks?: string }
  ) => {
    const student = classStudents.find((s) => s.id === studentId);
    if (!student) return;

    setAttendanceDraft((prev) => {
      const next = new Map(prev);
      const curr = next.get(studentId) || {
        id: `att-${studentId}-${selectedDate}`,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        classLevel: selectedLevelName,
        classArm: selectedArmName,
        date: selectedDate,
        status,
        markedBy: currentUser.name,
        markedAt: new Date().toISOString(),
      };

      next.set(studentId, {
        ...curr,
        status,
        arrivalTime: extra?.arrivalTime ?? (status === 'LATE' ? '08:20' : status === 'PRESENT' ? '07:45' : undefined),
        remarks: extra?.remarks ?? curr.remarks,
      });

      return next;
    });

    setSaveSuccess(false);
  };

  // Batch actions
  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceDraft((prev) => {
      const next = new Map(prev);
      classStudents.forEach((student) => {
        next.set(student.id, {
          id: `att-${student.id}-${selectedDate}`,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          classLevel: selectedLevelName,
          classArm: selectedArmName,
          date: selectedDate,
          status,
          arrivalTime: status === 'PRESENT' ? '07:45' : undefined,
          markedBy: currentUser.name,
          markedAt: new Date().toISOString(),
        });
      });
      return next;
    });
    setSaveSuccess(false);
  };

  // Save register
  const handleSaveRegister = () => {
    setIsSaving(true);
    try {
      const recordsToSave: AttendanceRecord[] = [];
      classStudents.forEach((s) => {
        const rec = attendanceDraft.get(s.id);
        if (rec) {
          recordsToSave.push(rec);
        } else {
          recordsToSave.push({
            id: `att-${s.id}-${selectedDate}`,
            studentId: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            admissionNumber: s.admissionNumber,
            classLevel: selectedLevelName,
            classArm: selectedArmName,
            date: selectedDate,
            status: 'PRESENT',
            arrivalTime: '07:45',
            markedBy: currentUser.name,
            markedAt: new Date().toISOString(),
          });
        }
      });

      saveClassAttendanceRegister(
        selectedDate,
        selectedLevelName,
        selectedArmName,
        recordsToSave,
        currentUser
      );

      onLogAudit(
        'ATTENDANCE_MARKED',
        `Logged attendance register for ${selectedLevelName} - ${selectedArmName} on ${selectedDate} (${stats.present} Present, ${stats.absent} Absent, ${stats.late} Late).`
      );

      setSaveSuccess(true);
      if (onAttendanceSaved) onAttendanceSaved();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving attendance register', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Date Selector Ribbon */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Class Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Class Level
            </label>
            <select
              value={selectedLevelName}
              onChange={(e) => {
                const newLevel = levels.find((l) => l.name === e.target.value);
                setSelectedLevelName(e.target.value);
                if (newLevel && newLevel.arms.length > 0) {
                  setSelectedArmName(newLevel.arms[0].name);
                }
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.name}>
                  {lvl.name} ({lvl.category.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Class Arm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Class Arm / Stream
            </label>
            <select
              value={selectedArmName}
              onChange={(e) => setSelectedArmName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {availableArms.map((arm) => (
                <option key={arm.id} value={arm.name}>
                  {arm.name} (Tutor: {arm.teacherName})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker with Today/Yesterday shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Register Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Quick Roster Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Filter Student Name / ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search roster..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Metrics Summary Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Enrolled Roster
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {stats.total} Students
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {stats.present} Present
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {stats.late} Late
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                {stats.excused} Excused
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                {stats.absent} Absent
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Attendance:</span>
            <Badge
              variant={stats.rate >= 90 ? 'success' : stats.rate >= 75 ? 'warning' : 'danger'}
              size="md"
            >
              {stats.rate}% Rate
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Offline Sync State Pill */}
          {!isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Offline Mode ({queueCount} Queued)</span>
            </div>
          ) : queueCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{queueCount} Pending Sync</span>
            </div>
          ) : null}

          {/* Active Conflicts Indicator */}
          {conflicts.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{conflicts.length} Attendance Conflict(s)</span>
            </div>
          )}

          {/* Simulate Conflict Test Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateConflict}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            title="Simulate an attendance sync conflict to test inline diff badge"
          >
            Simulate Attendance Conflict
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll('PRESENT')}
          >
            Mark All Present
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveRegister}
            isLoading={isSaving}
            leftIcon={saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          >
            {saveSuccess ? 'Register Saved!' : 'Save Attendance Register'}
          </Button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {selectedLevelName} - Arm: {selectedArmName} ({filteredStudents.length} Students)
          </div>
          <div className="text-xs text-slate-400">
            Click status pills to toggle check-in state
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No students found for this arm
            </h5>
            <p className="text-xs text-slate-400 mt-1">
              Select another class arm or clear the search filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStudents.map((student, idx) => {
              const rec = attendanceDraft.get(student.id);
              const currentStatus = rec?.status || 'PRESENT';
              const attConflict = conflicts.find(
                (c) =>
                  c.entityType === 'ATTENDANCE' &&
                  (c.recordId === student.id || c.recordId === rec?.id || c.studentId === student.id)
              );

              return (
                <div
                  key={student.id}
                  className={`px-5 py-3.5 flex flex-col justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                    attConflict
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-l-4 border-l-rose-500'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left Student Info */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6 text-right">
                        {idx + 1}.
                      </span>
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{student.firstName} {student.lastName}</span>
                          {attConflict && (
                            <Badge variant="danger" size="sm">
                              Conflict Pending Review
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {student.admissionNumber}
                          </span>
                          <span>•</span>
                          <span>{student.gender === 'M' ? 'Male' : 'Female'}</span>
                          {rec?.arrivalTime && currentStatus === 'LATE' && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                In at {rec.arrivalTime}
                              </span>
                            </>
                          )}
                          {rec?.remarks && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-500 truncate max-w-xs">
                                "{rec.remarks}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Status Pill Selector Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {/* Present */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(student.id, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Present
                      </button>

                      {/* Late */}
                      <button
                        type="button"
                        onClick={() => {
                          const arrivalTime = prompt('Enter arrival time (e.g. 08:20 AM):', rec?.arrivalTime || '08:15 AM');
                          handleSetStatus(student.id, 'LATE', { arrivalTime: arrivalTime || '08:15 AM' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Late
                      </button>

                      {/* Excused */}
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt('Enter excused reason (e.g. Hospital / Dental):', rec?.remarks || 'Medical appointment');
                          handleSetStatus(student.id, 'EXCUSED', { remarks: reason || 'Approved excusal' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentStatus === 'EXCUSED'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-50 hover:text-sky-700'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Excused
                      </button>

                      {/* Absent */}
                      <button
                        type="button"
                        onClick={() => {
                          handleSetStatus(student.id, 'ABSENT', { remarks: 'Unexcused Absence' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Absent
                      </button>
                    </div>
                  </div>

                  {/* Inline Conflict Diff Badge If Present */}
                  {attConflict && (
                    <div className="w-full pt-2 border-t border-rose-200 dark:border-rose-900/60 flex justify-end">
                      <InlineConflictDiffBadge
                        conflict={attConflict}
                        currentUser={currentUser}
                        onResolved={handleConflictResolved}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
