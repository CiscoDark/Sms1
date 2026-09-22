import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  SlidersHorizontal,
  UploadCloud,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Layers,
  Award,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  ClassLevel,
  ClassArm,
  UserProfile,
  StudentSubjectGradeRecord,
  GradingConfiguration,
  GradebookSummary,
} from '../../types';
import { Button, Card, Badge, Input } from '../../design-system';
import { CURRICULUM_SUBJECTS, TENANT_SCHOOL_ID } from '../../lib/class-timetable-store';
import { getEnrichedStudents } from '../../lib/students/students-store';
import {
  getGradingConfig,
  getGradingGateStatus,
  GradingGateStatus,
} from '../../lib/assessment-exam-store';
import {
  getOrInitializeClassGradeRecords,
  updateStudentGradeRecord,
  computeGradebookSummary,
  parseExcelClipboardData,
  applyPastedScoresToGradebook,
  computeCumulativeAnnualResults,
  getPriorTermsForSubject,
} from '../../lib/gradebook-store';
import { CumulativeStudentSubjectRecord, ReportCardSnapshot, CellConflict } from '../../types';
import {
  isAppOnline,
  getOfflineQueue,
  getActiveConflicts,
  getConflictForGradebookCell,
  isGradebookCellPendingSync,
  simulateGradebookConflict,
  enqueueOfflineAction,
  subscribeConflictChanges,
  subscribeNetworkStatus,
  subscribeQueueChanges,
} from '../../lib/offline-queue';
import { InlineConflictDiffBadge } from '../offline/InlineConflictDiffBadge';
import { GradingConfigModal } from './GradingConfigModal';
import { PasteFromExcelModal } from './PasteFromExcelModal';
import { CumulativeBroadsheetView } from './CumulativeBroadsheetView';
import { AiRemarkDraftModal } from './AiRemarkDraftModal';
import { BulkAiRemarksModal } from './BulkAiRemarksModal';
import { BulkReportCardModal } from '../report-cards/BulkReportCardModal';
import { ReportCardDocumentModal } from '../report-cards/ReportCardDocumentModal';

export interface GradebookPageProps {
  levels: ClassLevel[];
  currentUser: UserProfile;
  onLogAudit?: (action: string, details: string) => void;
  onNavigateToAssessments?: () => void;
  onOpenPublicVerification?: (uuid: string) => void;
}

type ColumnKey = 'ca1Score' | 'ca2Score' | 'examScore';

export const GradebookPage: React.FC<GradebookPageProps> = ({
  levels,
  currentUser,
  onLogAudit,
  onNavigateToAssessments,
  onOpenPublicVerification,
}) => {
  // Class selection state
  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || 'level-jss-1');
  const selectedLevel = levels.find((l) => l.id === selectedLevelId) || levels[0] || null;

  const [selectedArmId, setSelectedArmId] = useState<string>(selectedLevel?.arms[0]?.id || '');

  // Keep arm synchronized
  useEffect(() => {
    if (selectedLevel && selectedLevel.arms.length > 0) {
      if (!selectedLevel.arms.some((a) => a.id === selectedArmId)) {
        setSelectedArmId(selectedLevel.arms[0].id);
      }
    }
  }, [selectedLevelId, selectedLevel, selectedArmId]);

  const selectedArm: ClassArm | null =
    selectedLevel?.arms.find((a) => a.id === selectedArmId) || selectedLevel?.arms[0] || null;

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('MTH');
  const [sessionYear] = useState<string>('2024/2025');
  const [termName, setTermName] = useState<string>('First Term');
  const [viewMode, setViewMode] = useState<'MARKS_ENTRY' | 'CUMULATIVE_SUMMARY'>('MARKS_ENTRY');

  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRank, setFilterRank] = useState<'all' | 'top10' | 'failing' | 'incomplete'>('all');

  // Configuration & Modals
  const [gradingConfig, setGradingConfig] = useState<GradingConfiguration>(() => getGradingConfig());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  // Step 13 & 14 AI Remark & Report Card Modals
  const [activeRemarkRecord, setActiveRemarkRecord] = useState<StudentSubjectGradeRecord | null>(null);
  const [isBulkRemarksModalOpen, setIsBulkRemarksModalOpen] = useState<boolean>(false);
  const [isBulkReportCardsModalOpen, setIsBulkReportCardsModalOpen] = useState<boolean>(false);
  const [previewReportCard, setPreviewReportCard] = useState<ReportCardSnapshot | null>(null);

  const handleSaveSingleRemark = (studentId: string, remarkText: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, remark: remarkText, teacherRemarks: remarkText }
          : r
      )
    );
    onLogAudit?.(
      'AI_REMARK_SIGNED_OFF',
      `Teacher ${currentUser.name} signed off remark for student ${studentId}`
    );
  };

  const handleApplyBulkRemarks = (updatedList: { studentId: string; remark: string }[]) => {
    setRecords((prev) =>
      prev.map((r) => {
        const found = updatedList.find((u) => u.studentId === r.studentId);
        if (found) {
          return { ...r, remark: found.remark, teacherRemarks: found.remark };
        }
        return r;
      })
    );
    onLogAudit?.(
      'BULK_AI_REMARKS_APPLIED',
      `Applied ${updatedList.length} teacher-reviewed AI remarks to class ${selectedLevel?.name} - ${selectedArm?.name}`
    );
  };

  // Grade records & save status
  const [records, setRecords] = useState<StudentSubjectGradeRecord[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');

  // Admin lock override state
  const [adminBypass, setAdminBypass] = useState<boolean>(false);

  // Grid cell input refs for rapid Tab/Enter navigation: refMap[rowIdx_colKey]
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const canOverrideLock = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(currentUser.role);
  const selectedSubject = CURRICULUM_SUBJECTS.find((s) => s.code === selectedSubjectCode) || CURRICULUM_SUBJECTS[0];

  // Evaluate Step 11 Grading Lock Gate
  const gateStatus: GradingGateStatus = useMemo(() => {
    return getGradingGateStatus(
      selectedLevelId,
      selectedArmId,
      selectedSubjectCode,
      sessionYear,
      termName
    );
  }, [selectedLevelId, selectedArmId, selectedSubjectCode, sessionYear, termName]);

  const isGradingLocked = gateStatus.isLocked && !adminBypass;

  // Load records for selected class arm & subject
  useEffect(() => {
    const allStudents = getEnrichedStudents();
    const classRecords = getOrInitializeClassGradeRecords(
      allStudents,
      selectedLevel?.id || 'level-jss-1',
      selectedLevel?.name || 'JSS 1',
      selectedArm?.id || 'arm-diamond',
      selectedArm?.name || 'Diamond',
      selectedSubjectCode,
      selectedSubject.name,
      sessionYear,
      termName
    );
    setRecords(classRecords);
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [selectedLevelId, selectedArmId, selectedSubjectCode, sessionYear, termName]);

  // When in Third Term, fetch prior terms (Term 1 & Term 2) for cumulative promotion broadsheet
  const { term1Records, term2Records } = useMemo(() => {
    if (termName !== 'Third Term') {
      return { term1Records: [], term2Records: [] };
    }
    const allStudents = getEnrichedStudents();
    return getPriorTermsForSubject(
      allStudents,
      selectedLevel?.id || 'level-jss-1',
      selectedLevel?.name || 'JSS 1',
      selectedArm?.id || 'arm-diamond',
      selectedArm?.name || 'Diamond',
      selectedSubjectCode,
      selectedSubject.name,
      sessionYear
    );
  }, [termName, selectedLevelId, selectedArmId, selectedSubjectCode, sessionYear]);

  // Compute 3rd Term Nigerian Cumulative Annual composite (20% T1 + 30% T2 + 50% T3)
  const cumulativeRecords: CumulativeStudentSubjectRecord[] = useMemo(() => {
    if (termName !== 'Third Term') return [];
    return computeCumulativeAnnualResults(records, term1Records, term2Records, gradingConfig);
  }, [termName, records, term1Records, term2Records, gradingConfig]);

  // Compute live summary stats
  const summary: GradebookSummary = useMemo(() => {
    return computeGradebookSummary(records, gradingConfig.passMark);
  }, [records, gradingConfig.passMark]);

  // Filtered students
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.studentName.toLowerCase().includes(q);
        const matchReg = r.studentRegNumber.toLowerCase().includes(q);
        if (!matchName && !matchReg) return false;
      }

      if (filterRank === 'top10') {
        return r.rankInArm && r.rankInArm <= 10;
      }
      if (filterRank === 'failing') {
        return r.totalScore !== null && r.totalScore < gradingConfig.passMark;
      }
      if (filterRank === 'incomplete') {
        return r.ca1Score === null || r.ca2Score === null || r.examScore === null;
      }

      return true;
    });
  }, [records, searchQuery, filterRank, gradingConfig.passMark]);

  // Offline Sync & Conflict Handling State
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
    if (selectedLevel && selectedArm) {
      const allStudents = getEnrichedStudents();
      const refreshed = getOrInitializeClassGradeRecords(
        allStudents,
        selectedLevel.id,
        selectedLevel.name,
        selectedArm.id,
        selectedArm.name,
        selectedSubjectCode,
        selectedSubject.name,
        sessionYear,
        termName
      );
      setRecords(refreshed);
    }
    setConflicts(getActiveConflicts());
    onLogAudit?.(
      'SYNC_CONFLICT_RESOLVED',
      `Resolved Gradebook cell conflict for ${resolved.studentName} on ${resolved.fieldLabel} with choice: ${resolved.resolvedChoice}`
    );
  };

  const handleSimulateConflict = () => {
    if (filteredRecords.length === 0) return;
    const targetRecord = filteredRecords[0];
    simulateGradebookConflict(targetRecord, 'ca1Score', {
      localScore: Math.min(gradingConfig.ca1Max, (targetRecord.ca1Score ?? 14) + 5),
      remoteScore: Math.max(0, (targetRecord.ca1Score ?? 14) - 4),
      localAuthor: `${currentUser.name} (Offline Tablet Draft)`,
      remoteAuthor: 'Mrs. Sarah Adebayo (HOD Science - Web Portal)',
    });
    setConflicts(getActiveConflicts());
    setQueueCount(getOfflineQueue().length);
    onLogAudit?.(
      'SYNC_CONFLICT_SIMULATED',
      `Simulated Gradebook sync conflict on CA 1 for ${targetRecord.studentName}`
    );
  };

  /**
   * Fast In-Cell Score Change
   */
  const handleScoreChange = (
    recordId: string,
    colKey: ColumnKey,
    valStr: string
  ) => {
    if (isGradingLocked) return;

    let numVal: number | null = null;
    if (valStr.trim() !== '') {
      numVal = parseFloat(valStr);
      if (isNaN(numVal)) numVal = null;
    }

    // Boundary capping
    if (numVal !== null) {
      if (numVal < 0) numVal = 0;
      if (colKey === 'ca1Score' && numVal > gradingConfig.ca1Max) numVal = gradingConfig.ca1Max;
      if (colKey === 'ca2Score' && numVal > gradingConfig.ca2Max) numVal = gradingConfig.ca2Max;
      if (colKey === 'examScore' && numVal > gradingConfig.examMax) numVal = gradingConfig.examMax;
    }

    const currentRec = records.find((r) => r.id === recordId);
    if (!currentRec) return;

    const updated = {
      ...currentRec,
      [colKey]: numVal,
    };

    setSaveStatus('saving');
    const { rankedClassRecords } = updateStudentGradeRecord(updated, records, gradingConfig);
    setRecords(rankedClassRecords);

    // If offline, enqueue into persistent write-queue with fieldKey for cell-level pending indicator
    if (!isAppOnline()) {
      enqueueOfflineAction(
        '/api/gradebook/score-update',
        'PUT',
        { recordId: updated.id, studentId: updated.studentId, subjectCode: updated.subjectCode, [colKey]: numVal },
        `Offline gradebook edit for ${updated.studentName} (${colKey}: ${numVal})`,
        {
          actionType: 'GRADEBOOK_SCORE_UPDATE',
          entityId: updated.id,
          fieldKey: colKey,
          performerName: currentUser.name,
          performerRole: currentUser.role,
        }
      );
    }
  };

  const handleScoreBlur = () => {
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  /**
   * Keyboard Navigation (Spreadsheet Enter/Tab/Arrow Keys)
   * Rapid data entry: Enter or Down Arrow moves to the same column for the NEXT student.
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: ColumnKey
  ) => {
    const columns: ColumnKey[] = ['ca1Score', 'ca2Score', 'examScore'];
    const colIdx = columns.indexOf(colKey);

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Move DOWN to the same column for next student
      const nextRow = rowIndex + 1;
      if (nextRow < filteredRecords.length) {
        const nextInput = inputRefs.current[`${nextRow}_${colKey}`];
        nextInput?.focus();
        nextInput?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Move UP to the same column for previous student
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        const prevInput = inputRefs.current[`${prevRow}_${colKey}`];
        prevInput?.focus();
        prevInput?.select();
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // If at last column and presses Tab, move to first column of next row
      if (colIdx === columns.length - 1 && rowIndex < filteredRecords.length - 1) {
        e.preventDefault();
        const nextRowFirstInput = inputRefs.current[`${rowIndex + 1}_${columns[0]}`];
        nextRowFirstInput?.focus();
        nextRowFirstInput?.select();
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      // If at first column and presses Shift+Tab, move to last column of prev row
      if (colIdx === 0 && rowIndex > 0) {
        e.preventDefault();
        const prevRowLastInput = inputRefs.current[`${rowIndex - 1}_${columns[columns.length - 1]}`];
        prevRowLastInput?.focus();
        prevRowLastInput?.select();
      }
    }
  };

  /**
   * Direct Clipboard Paste handler on table cells
   * Supports copying from Excel and pressing Ctrl+V / Cmd+V directly on any cell
   */
  const handleCellPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: ColumnKey
  ) => {
    if (isGradingLocked) return;

    const clipboardText = e.clipboardData.getData('text');
    if (!clipboardText || !clipboardText.includes('\t') && !clipboardText.includes('\n')) {
      return; // Single-value paste, let native input handle it
    }

    e.preventDefault();
    const matrix = parseExcelClipboardData(clipboardText);
    if (matrix.length === 0) return;

    const { updatedRecords, cellsUpdated } = applyPastedScoresToGradebook(
      rowIndex,
      colKey,
      matrix,
      records,
      gradingConfig
    );

    setRecords(updatedRecords);
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    onLogAudit?.(
      'GRADEBOOK_EXCEL_PASTED',
      `Pasted ${cellsUpdated} scores into ${selectedLevel?.name} ${selectedArm?.name} (${selectedSubject.name})`
    );
  };

  const handleConfigSaved = (newConfig: GradingConfiguration) => {
    setGradingConfig(newConfig);
    // Recalculate all records with new boundaries
    const recalculated = records.map((r) => {
      const { updatedRecord } = updateStudentGradeRecord(r, records, newConfig);
      return updatedRecord;
    });
    setRecords(recalculated);
    onLogAudit?.(
      'GRADING_SCHEMA_UPDATED',
      `Updated grading configuration: CA1 (${newConfig.ca1Max}), CA2 (${newConfig.ca2Max}), Exam (${newConfig.examMax}), Pass Mark (${newConfig.passMark})`
    );
  };

  const handleQuickExemptToggle = (recordId: string) => {
    if (isGradingLocked) return;
    const currentRec = records.find((r) => r.id === recordId);
    if (!currentRec) return;

    const updated = {
      ...currentRec,
      isExempt: !currentRec.isExempt,
    };
    const { rankedClassRecords } = updateStudentGradeRecord(updated, records, gradingConfig);
    setRecords(rankedClassRecords);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Teacher Gradebook & Grade Calculation
            </h2>
            <Badge variant="primary" size="sm">
              Step 12 Engine
            </Badge>
            <Badge variant="neutral" size="sm" className="hidden sm:inline-flex text-[10px]">
              Tenant: {TENANT_SCHOOL_ID}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Spreadsheet-style continuous mark entry, Excel clipboard pasting, automatic GPA point calculation, and class arm rankings.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-save & Offline Sync status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            {!isOnline ? (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Offline Draft Mode ({queueCount} Pending Sync)</span>
              </div>
            ) : queueCount > 0 ? (
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>{queueCount} Change(s) Pending Sync</span>
              </div>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  All Changes Synced
                </span>
                <span className="text-[10px] text-slate-400">({lastSavedTime})</span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  Calculating & Saving...
                </span>
              </>
            )}
          </div>

          {/* Active Conflicts Alert Badge */}
          {conflicts.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{conflicts.length} Sync Conflict(s) Flagged</span>
            </div>
          )}

          {/* Simulate Conflict Test Button (Step 25 evaluation) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateConflict}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            title="Simulate an offline vs online score collision to test inline diff badge and conflict resolution"
          >
            Simulate Sync Conflict
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkRemarksModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            title="Batch draft personalized pedagogical remarks for all students with teacher review"
          >
            Batch AI Remarks
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBulkReportCardsModalOpen(true)}
            leftIcon={<Layers className="w-4 h-4" />}
            title="Generate and freeze point-in-time report card snapshots with verified QR codes"
          >
            Publish Report Cards
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPasteModalOpen(true)}
            leftIcon={<UploadCloud className="w-4 h-4 text-indigo-500" />}
            title="Paste scores from Excel or Google Sheets"
          >
            Paste from Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
            leftIcon={
              isAdmin ? (
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )
            }
          >
            {isAdmin ? 'Grading Schema & Headings (Admin)' : 'Grading Schema (Read-Only)'}
          </Button>

          {onNavigateToAssessments && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToAssessments}
              leftIcon={<Calendar className="w-4 h-4 text-indigo-600" />}
            >
              Exam Schedules
            </Button>
          )}
        </div>
      </div>

      {/* Step 11 Report Card Lock Gate Banner */}
      {isGradingLocked ? (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Report Card Grading Locked (Exam Gating Rule)
                </h4>
                <Badge variant="warning" size="sm">
                  Step 11 Gating
                </Badge>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                {gateStatus.reason} Official score entry remains locked until the scheduled exam window has occurred.
              </p>
            </div>
          </div>

          {canOverrideLock && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setAdminBypass(true);
                  onLogAudit?.(
                    'GRADING_LOCK_BYPASSED',
                    `Administrator ${currentUser.name} bypassed grading lock for ${selectedLevel?.name} ${selectedSubject.name}`
                  );
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                leftIcon={<Unlock className="w-4 h-4" />}
              >
                Admin Override Lock
              </Button>
            </div>
          )}
        </div>
      ) : adminBypass ? (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">
              Administrator Override Active: Grading window manually unlocked for score entry.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAdminBypass(false)}
            className="text-xs underline hover:text-emerald-900 font-semibold cursor-pointer"
          >
            Re-enable Lock
          </button>
        </div>
      ) : null}

      {/* Class, Stream, and Subject Selector Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Level Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Class Level
            </span>
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Arm / Stream Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Arm / Stream
            </span>
            <div className="flex items-center gap-1.5">
              {selectedLevel?.arms.map((arm) => {
                const isSelected = arm.id === selectedArmId;
                return (
                  <button
                    key={arm.id}
                    type="button"
                    onClick={() => setSelectedArmId(arm.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {arm.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Subject
            </span>
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400"
            >
              {CURRICULUM_SUBJECTS.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Term Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Academic Term
            </span>
            <select
              value={termName}
              onChange={(e) => {
                const newTerm = e.target.value;
                setTermName(newTerm);
                if (newTerm !== 'Third Term') {
                  setViewMode('MARKS_ENTRY');
                }
              }}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="First Term">1st Term</option>
              <option value="Second Term">2nd Term</option>
              <option value="Third Term">3rd Term (Promotional)</option>
            </select>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="w-48 sm:w-60">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or reg no..."
              leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            />
          </div>

          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value as any)}
            className="px-2.5 py-2 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Students</option>
            <option value="top10">Top 10 Ranked</option>
            <option value="failing">Below Pass Mark (&lt;{gradingConfig.passMark})</option>
            <option value="incomplete">Incomplete Scores</option>
          </select>
        </div>
      </Card>

      {/* 3rd Term Promotional Cumulative Switcher Banner */}
      {termName === 'Third Term' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                  Nigerian 3rd Term Promotional Session Engine
                </h4>
                <Badge variant="primary" size="sm">
                  {gradingConfig.cumulativeTerm1Weight ?? 20}% T1 + {gradingConfig.cumulativeTerm2Weight ?? 30}% T2 + {gradingConfig.cumulativeTerm3Weight ?? 50}% T3
                </Badge>
              </div>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                Statutory secondary weighting automatically factors 1st &amp; 2nd term continuous achievements into the final promotional grade and class arm ranking.
              </p>
            </div>
          </div>

          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-indigo-200 dark:border-indigo-800/60 shadow-xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('MARKS_ENTRY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'MARKS_ENTRY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Term 3 Marks Entry Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CUMULATIVE_SUMMARY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'CUMULATIVE_SUMMARY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Annual Cumulative Broadsheet
            </button>
          </div>
        </div>
      )}

      {/* Real-time Class Statistics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Class Size
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100">
            {summary.totalStudents} Students
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Graded %
          </span>
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
            {summary.totalStudents > 0
              ? Math.round((summary.gradedStudents / summary.totalStudents) * 100)
              : 0}%
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Class Average
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100">
            {summary.classAverage}%
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Highest Score
          </span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {summary.highestScore}%
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Lowest Score
          </span>
          <span className="text-lg font-black text-rose-600 dark:text-rose-400">
            {summary.lowestScore}%
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Pass Rate (≥{gradingConfig.passMark}%)
          </span>
          <span className="text-lg font-black text-teal-600 dark:text-teal-400">
            {summary.passRate}%
          </span>
        </Card>
      </div>

      {/* Grade Distribution Breakdown (Nigerian A1 - F9 Standard) */}
      <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          Nigerian WAEC/NECO Grade Distribution:
        </span>
        {gradingConfig.boundaries.map((b) => {
          const count = summary.distribution[b.grade] || 0;
          const isA = b.grade.startsWith('A');
          const isB = b.grade.startsWith('B');
          const isC = b.grade.startsWith('C');
          const isPass = b.grade.startsWith('D') || b.grade.startsWith('E');

          const badgeBg = isA
            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            : isB
            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
            : isC
            ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
            : isPass
            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300';

          return (
            <span
              key={b.grade}
              className={`px-2 py-0.5 rounded-full font-bold ${badgeBg}`}
            >
              {b.grade} ({b.remark}): {count}
            </span>
          );
        })}
      </div>

      {/* 3rd Term Annual Cumulative Broadsheet OR Standard Spreadsheet Data Grid */}
      {termName === 'Third Term' && viewMode === 'CUMULATIVE_SUMMARY' ? (
        <CumulativeBroadsheetView
          cumulativeRecords={cumulativeRecords}
          config={gradingConfig}
          level={selectedLevel}
          arm={selectedArm}
          subjectName={selectedSubject.name}
          sessionYear={sessionYear}
        />
      ) : (
        /* Spreadsheet Data Grid */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Instructions banner */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono">↓</kbd> to jump to the same column for the next student.
            </span>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono">Tab</kbd> to move right.
            </span>
          </div>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            Copy-paste from Excel supported directly in cells
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 w-32">Reg Number</th>
                <th className="p-3 min-w-[180px]">Student Name</th>
                <th className="p-3 w-16 text-center">Gender</th>
                <th className="p-3 w-28 text-center bg-indigo-50/50 dark:bg-indigo-950/20">
                  <span>{gradingConfig.ca1Name || 'CA 1'}</span>
                  <span className="block text-[10px] font-normal text-slate-400">
                    Max {gradingConfig.ca1Max}
                  </span>
                </th>
                <th className="p-3 w-28 text-center bg-indigo-50/50 dark:bg-indigo-950/20">
                  <span>{gradingConfig.ca2Name || 'Mid-Term (CA2)'}</span>
                  <span className="block text-[10px] font-normal text-slate-400">
                    Max {gradingConfig.ca2Max}
                  </span>
                </th>
                <th className="p-3 w-28 text-center bg-indigo-50/50 dark:bg-indigo-950/20">
                  <span>{gradingConfig.examName || 'Terminal Exam'}</span>
                  <span className="block text-[10px] font-normal text-slate-400">
                    Max {gradingConfig.examMax}
                  </span>
                </th>
                <th className="p-3 w-24 text-center font-black">
                  <span>Total</span>
                  <span className="block text-[10px] font-normal text-slate-400">100%</span>
                </th>
                <th className="p-3 w-20 text-center">Grade</th>
                <th className="p-3 min-w-[140px]">Performance Remark</th>
                <th className="p-3 w-20 text-center">Rank</th>
                <th className="p-3 w-20 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.map((record, index) => {
                const isFailing = record.totalScore !== null && record.totalScore < gradingConfig.passMark;
                const ca1Conflict = conflicts.find(
                  (c) => c.entityType === 'GRADEBOOK' && c.recordId === record.id && c.field === 'ca1Score'
                );
                const ca2Conflict = conflicts.find(
                  (c) => c.entityType === 'GRADEBOOK' && c.recordId === record.id && c.field === 'ca2Score'
                );
                const examConflict = conflicts.find(
                  (c) => c.entityType === 'GRADEBOOK' && c.recordId === record.id && c.field === 'examScore'
                );
                const ca1Pending = isGradebookCellPendingSync(record.id, 'ca1Score');
                const ca2Pending = isGradebookCellPendingSync(record.id, 'ca2Score');
                const examPending = isGradebookCellPendingSync(record.id, 'examScore');

                return (
                  <tr
                    key={record.id}
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      record.isExempt ? 'opacity-50 bg-slate-50 dark:bg-slate-800/30' : ''
                    }`}
                  >
                    {/* S/N */}
                    <td className="p-3 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>

                    {/* Reg No */}
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {record.studentRegNumber}
                    </td>

                    {/* Student Name */}
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      {record.studentName}
                    </td>

                    {/* Gender */}
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        record.gender === 'M' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {record.gender}
                      </span>
                    </td>

                    {/* CA 1 Score Input */}
                    <td className={`p-2 text-center bg-indigo-50/20 dark:bg-indigo-950/10 ${ca1Conflict ? 'bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-400 rounded-md' : ''}`}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          ref={(el) => {
                            inputRefs.current[`${index}_ca1Score`] = el;
                          }}
                          type="number"
                          min={0}
                          max={gradingConfig.ca1Max}
                          step="0.5"
                          disabled={isGradingLocked || record.isExempt}
                          value={record.ca1Score !== null && record.ca1Score !== undefined ? record.ca1Score : ''}
                          onChange={(e) => handleScoreChange(record.id, 'ca1Score', e.target.value)}
                          onBlur={handleScoreBlur}
                          onKeyDown={(e) => handleKeyDown(e, index, 'ca1Score')}
                          onPaste={(e) => handleCellPaste(e, index, 'ca1Score')}
                          placeholder="-"
                          className={`w-16 px-2 py-1 text-center font-mono font-bold text-xs border rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:opacity-50 ${
                            ca1Conflict
                              ? 'border-rose-500 ring-1 ring-rose-400'
                              : ca1Pending
                              ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                        {ca1Pending && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                            title="Offline edit pending sync"
                          />
                        )}
                      </div>
                      {ca1Conflict && (
                        <div className="mt-1.5 flex justify-center">
                          <InlineConflictDiffBadge
                            conflict={ca1Conflict}
                            currentUser={currentUser}
                            onResolved={handleConflictResolved}
                          />
                        </div>
                      )}
                    </td>

                    {/* CA 2 Score Input */}
                    <td className={`p-2 text-center bg-indigo-50/20 dark:bg-indigo-950/10 ${ca2Conflict ? 'bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-400 rounded-md' : ''}`}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          ref={(el) => {
                            inputRefs.current[`${index}_ca2Score`] = el;
                          }}
                          type="number"
                          min={0}
                          max={gradingConfig.ca2Max}
                          step="0.5"
                          disabled={isGradingLocked || record.isExempt}
                          value={record.ca2Score !== null && record.ca2Score !== undefined ? record.ca2Score : ''}
                          onChange={(e) => handleScoreChange(record.id, 'ca2Score', e.target.value)}
                          onBlur={handleScoreBlur}
                          onKeyDown={(e) => handleKeyDown(e, index, 'ca2Score')}
                          onPaste={(e) => handleCellPaste(e, index, 'ca2Score')}
                          placeholder="-"
                          className={`w-16 px-2 py-1 text-center font-mono font-bold text-xs border rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:opacity-50 ${
                            ca2Conflict
                              ? 'border-rose-500 ring-1 ring-rose-400'
                              : ca2Pending
                              ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                        {ca2Pending && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                            title="Offline edit pending sync"
                          />
                        )}
                      </div>
                      {ca2Conflict && (
                        <div className="mt-1.5 flex justify-center">
                          <InlineConflictDiffBadge
                            conflict={ca2Conflict}
                            currentUser={currentUser}
                            onResolved={handleConflictResolved}
                          />
                        </div>
                      )}
                    </td>

                    {/* Exam Score Input */}
                    <td className={`p-2 text-center bg-indigo-50/20 dark:bg-indigo-950/10 ${examConflict ? 'bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-400 rounded-md' : ''}`}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          ref={(el) => {
                            inputRefs.current[`${index}_examScore`] = el;
                          }}
                          type="number"
                          min={0}
                          max={gradingConfig.examMax}
                          step="0.5"
                          disabled={isGradingLocked || record.isExempt}
                          value={record.examScore !== null && record.examScore !== undefined ? record.examScore : ''}
                          onChange={(e) => handleScoreChange(record.id, 'examScore', e.target.value)}
                          onBlur={handleScoreBlur}
                          onKeyDown={(e) => handleKeyDown(e, index, 'examScore')}
                          onPaste={(e) => handleCellPaste(e, index, 'examScore')}
                          placeholder="-"
                          className={`w-16 px-2 py-1 text-center font-mono font-bold text-xs border rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:opacity-50 ${
                            examConflict
                              ? 'border-rose-500 ring-1 ring-rose-400'
                              : examPending
                              ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                        {examPending && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                            title="Offline edit pending sync"
                          />
                        )}
                      </div>
                      {examConflict && (
                        <div className="mt-1.5 flex justify-center">
                          <InlineConflictDiffBadge
                            conflict={examConflict}
                            currentUser={currentUser}
                            onResolved={handleConflictResolved}
                          />
                        </div>
                      )}
                    </td>

                    {/* Auto-Calculated Total */}
                    <td className="p-3 text-center font-mono font-black text-sm">
                      {record.totalScore !== null && record.totalScore !== undefined ? (
                        <span className={isFailing ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}>
                          {record.totalScore}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Auto-Calculated Grade */}
                    <td className="p-3 text-center">
                      {record.grade !== '-' ? (
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${
                          record.grade.startsWith('A')
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : record.grade.startsWith('B')
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : record.grade.startsWith('C')
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : record.grade.startsWith('D') || record.grade.startsWith('E')
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {record.grade}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Remark & AI Assistant Button */}
                    <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                      <div className="flex items-center justify-between gap-1 group">
                        <span className="truncate max-w-[130px]" title={record.teacherRemarks || record.remark}>
                          {record.teacherRemarks || record.remark || '—'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveRemarkRecord(record)}
                          className="p-1 rounded-md text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0"
                          title="Draft & Review Personalized AI Remark (Step 13)"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Class Arm Position / Rank */}
                    <td className="p-3 text-center font-mono font-bold">
                      {record.rankInArm ? (
                        <span className={`inline-flex items-center gap-1 ${
                          record.rankInArm === 1
                            ? 'text-amber-600 dark:text-amber-400 font-black'
                            : record.rankInArm <= 3
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {record.rankInArm === 1 && <Award className="w-3.5 h-3.5" />}
                          {record.rankInArm}
                          {record.rankInArm === 1
                            ? 'st'
                            : record.rankInArm === 2
                            ? 'nd'
                            : record.rankInArm === 3
                            ? 'rd'
                            : 'th'}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Exemption Toggle */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleQuickExemptToggle(record.id)}
                        disabled={isGradingLocked}
                        className={`text-[10px] px-2 py-1 rounded transition-all cursor-pointer ${
                          record.isExempt
                            ? 'bg-slate-200 text-slate-700 font-bold'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                        }`}
                        title={record.isExempt ? 'Click to include in grading' : 'Mark as medical or transferred exempt'}
                      >
                        {record.isExempt ? 'Exempt' : 'Active'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    No students match the selected class or search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Grading Configuration Modal */}
      {isConfigModalOpen && (
        <GradingConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          config={gradingConfig}
          currentUser={currentUser}
          onSaveConfig={handleConfigSaved}
        />
      )}

      {/* Paste from Excel Modal */}
      {isPasteModalOpen && (
        <PasteFromExcelModal
          isOpen={isPasteModalOpen}
          onClose={() => setIsPasteModalOpen(false)}
          currentRecords={records}
          config={gradingConfig}
          onApplyPasted={(updatedRecords, count) => {
            setRecords(updatedRecords);
            setSaveStatus('saved');
            setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            onLogAudit?.(
              'GRADEBOOK_EXCEL_IMPORTED',
              `Imported ${count} marks via Excel modal for ${selectedLevel?.name} ${selectedArm?.name} (${selectedSubject.name})`
            );
          }}
        />
      )}

      {/* Step 13: Single Student AI Remark Draft Modal */}
      {activeRemarkRecord && (
        <AiRemarkDraftModal
          isOpen={!!activeRemarkRecord}
          onClose={() => setActiveRemarkRecord(null)}
          record={activeRemarkRecord}
          currentUser={currentUser}
          classLevel={selectedLevel?.name || 'JSS 1'}
          classArm={selectedArm?.name || 'Diamond'}
          termName={termName}
          sessionYear={sessionYear}
          onSaveRemark={handleSaveSingleRemark}
        />
      )}

      {/* Step 13: Class Bulk AI Remarks Modal */}
      {isBulkRemarksModalOpen && (
        <BulkAiRemarksModal
          isOpen={isBulkRemarksModalOpen}
          onClose={() => setIsBulkRemarksModalOpen(false)}
          records={records}
          currentUser={currentUser}
          classLevel={selectedLevel?.name || 'JSS 1'}
          classArm={selectedArm?.name || 'Diamond'}
          termName={termName}
          sessionYear={sessionYear}
          onApplyBulkRemarks={handleApplyBulkRemarks}
        />
      )}

      {/* Step 13/14: Bulk Point-in-Time Report Card Generator */}
      {isBulkReportCardsModalOpen && (
        <BulkReportCardModal
          isOpen={isBulkReportCardsModalOpen}
          onClose={() => setIsBulkReportCardsModalOpen(false)}
          students={getEnrichedStudents().filter(
            (s) => s.classLevel === (selectedLevel?.name || 'JSS 1')
          )}
          classLevel={selectedLevel?.name || 'JSS 1'}
          classArm={selectedArm?.name || 'Diamond'}
          termName={termName}
          sessionYear={sessionYear}
          currentUser={currentUser}
          onViewSingleReport={(snapshot) => setPreviewReportCard(snapshot)}
        />
      )}

      {/* Step 14: Printable Official Report Card Document with Verified QR */}
      {previewReportCard && (
        <ReportCardDocumentModal
          isOpen={!!previewReportCard}
          onClose={() => setPreviewReportCard(null)}
          reportCard={previewReportCard}
          onOpenPublicVerification={onOpenPublicVerification}
        />
      )}
    </div>
  );
};
