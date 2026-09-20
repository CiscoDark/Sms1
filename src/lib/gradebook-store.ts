/**
 * Gradebook Store & Real-Time Grade Calculation Engine
 *
 * ARCHITECTURAL INVARIANTS & CONVENTIONS:
 * 1. Tenant Isolation: All student grade records include `schoolId: 'school-apex-001'`.
 * 2. Rapid Spreadsheet UX: Tab/Enter key navigation, auto-save on blur, bulk Excel/TSV clipboard paste.
 * 3. Automatic Calculation: Real-time calculation of Totals, Grade Letter, Remark, GPA points,
 *    and Class Arm Ranking (1st, 2nd, 3rd with tie handling).
 */

import {
  Student,
  StudentSubjectGradeRecord,
  GradingConfiguration,
  GradeBoundary,
  GradebookSummary,
} from '../types';
import { TENANT_SCHOOL_ID } from './class-timetable-store';
import { getGradingConfig } from './assessment-exam-store';

const GRADEBOOK_STORAGE_KEY = `sms_gradebook_records_${TENANT_SCHOOL_ID}`;

/**
 * Calculate total score from component values
 */
export function calculateTotalScore(
  ca1: number | null | undefined,
  ca2: number | null | undefined,
  ca3: number | null | undefined,
  exam: number | null | undefined
): number | null {
  const hasAnyScore =
    ca1 !== null && ca1 !== undefined ||
    ca2 !== null && ca2 !== undefined ||
    ca3 !== null && ca3 !== undefined ||
    exam !== null && exam !== undefined;

  if (!hasAnyScore) return null;

  const total = (ca1 || 0) + (ca2 || 0) + (ca3 || 0) + (exam || 0);
  return Math.min(100, Math.max(0, Math.round(total * 10) / 10));
}

/**
 * Evaluate grade boundary, remark, and GPA point
 */
export function evaluateGradeAndRemark(
  totalScore: number | null,
  boundaries: GradeBoundary[],
  passMark: number = 50
): { grade: string; remark: string; gpaPoint: number; color: GradeBoundary['color'] } {
  if (totalScore === null || totalScore === undefined) {
    return { grade: '-', remark: 'Pending Assessment', gpaPoint: 0, color: 'sky' };
  }

  const rounded = Math.round(totalScore);

  for (const b of boundaries) {
    if (rounded >= b.minScore && rounded <= b.maxScore) {
      return {
        grade: b.grade,
        remark: b.remark,
        gpaPoint: b.gpaPoint,
        color: b.color,
      };
    }
  }

  // Fallback if below minimum boundary
  if (rounded < passMark) {
    return { grade: 'F', remark: 'Fail', gpaPoint: 0, color: 'rose' };
  }

  return { grade: 'C', remark: 'Credit / Pass', gpaPoint: 2.0, color: 'sky' };
}

/**
 * Auto-calculate class arm rankings using Standard Competition Ranking ("1224" ranking)
 */
export function calculateClassArmRankings(
  records: StudentSubjectGradeRecord[]
): StudentSubjectGradeRecord[] {
  // Sort graded records descending by totalScore
  const validRecords = records.filter(
    (r) => !r.isExempt && r.totalScore !== null && r.totalScore !== undefined
  );

  validRecords.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  const rankMap = new Map<string, number>();
  let currentRank = 1;

  for (let i = 0; i < validRecords.length; i++) {
    if (i > 0 && validRecords[i].totalScore === validRecords[i - 1].totalScore) {
      // Tie: assign same rank as previous
      rankMap.set(validRecords[i].id, rankMap.get(validRecords[i - 1].id) || currentRank);
    } else {
      currentRank = i + 1;
      rankMap.set(validRecords[i].id, currentRank);
    }
  }

  return records.map((r) => {
    if (r.isExempt || r.totalScore === null || r.totalScore === undefined) {
      return { ...r, rankInArm: undefined };
    }
    return {
      ...r,
      rankInArm: rankMap.get(r.id),
    };
  });
}

/**
 * Compute Gradebook summary metrics
 */
export function computeGradebookSummary(
  records: StudentSubjectGradeRecord[],
  passMark: number = 50
): GradebookSummary {
  const totalStudents = records.length;
  const gradedRecords = records.filter(
    (r) => !r.isExempt && r.totalScore !== null && r.totalScore !== undefined
  );
  const gradedStudents = gradedRecords.length;

  if (gradedStudents === 0) {
    return {
      totalStudents,
      gradedStudents: 0,
      classAverage: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    };
  }

  const scores = gradedRecords.map((r) => r.totalScore as number);
  const totalSum = scores.reduce((acc, score) => acc + score, 0);
  const classAverage = Math.round((totalSum / gradedStudents) * 10) / 10;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const passedStudents = gradedRecords.filter((r) => (r.totalScore || 0) >= passMark).length;
  const passRate = Math.round((passedStudents / gradedStudents) * 1000) / 10;

  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of gradedRecords) {
    const letter = r.grade as keyof typeof distribution;
    if (distribution[letter] !== undefined) {
      distribution[letter]++;
    }
  }

  return {
    totalStudents,
    gradedStudents,
    classAverage,
    highestScore,
    lowestScore,
    passRate,
    distribution,
  };
}

/**
 * Fetch all stored grade records
 */
export function getAllStoredGradeRecords(): StudentSubjectGradeRecord[] {
  try {
    const raw = localStorage.getItem(GRADEBOOK_STORAGE_KEY);
    if (!raw) return [];
    const parsed: StudentSubjectGradeRecord[] = JSON.parse(raw);
    return parsed.filter((r) => r.schoolId === TENANT_SCHOOL_ID);
  } catch {
    return [];
  }
}

/**
 * Persist grade records with tenant isolation
 */
export function saveAllGradeRecords(records: StudentSubjectGradeRecord[]): void {
  try {
    const tenantScoped = records.map((r) => ({ ...r, schoolId: TENANT_SCHOOL_ID }));
    localStorage.setItem(GRADEBOOK_STORAGE_KEY, JSON.stringify(tenantScoped));
  } catch (err) {
    console.error('Failed to save gradebook records', err);
  }
}

/**
 * Helper to generate initial demo seed scores for a class arm and subject
 */
function seedDemoScores(
  student: Student,
  subjectCode: string,
  levelId: string,
  armId: string,
  levelName: string,
  armName: string,
  sessionYear: string,
  termName: string,
  config: GradingConfiguration,
  index: number
): StudentSubjectGradeRecord {
  // Deterministic realistic score distribution based on student id
  const hash = (student.id.charCodeAt(student.id.length - 1) + index * 7) % 35;
  const ca1 = Math.min(config.ca1Max, Math.max(10, Math.round(13 + (hash % 8))));
  const ca2 = Math.min(config.ca2Max, Math.max(9, Math.round(12 + ((hash + 3) % 9))));
  const exam = Math.min(config.examMax, Math.max(24, Math.round(35 + ((hash * 2) % 25))));

  const total = calculateTotalScore(ca1, ca2, 0, exam);
  const evalResult = evaluateGradeAndRemark(total, config.boundaries, config.passMark);

  return {
    id: `grd-${student.id}-${subjectCode}-${sessionYear}-${termName}`,
    schoolId: TENANT_SCHOOL_ID,
    studentId: student.id,
    studentRegNumber: student.admissionNumber || student.id,
    studentName: `${student.lastName} ${student.firstName}`,
    gender: student.gender as 'M' | 'F',
    levelId,
    levelName,
    armId,
    armName,
    subjectCode,
    subjectName: getSubjectName(subjectCode),
    sessionYear,
    termName,
    ca1Score: ca1,
    ca2Score: ca2,
    ca3Score: null,
    examScore: exam,
    totalScore: total,
    grade: evalResult.grade,
    remark: evalResult.remark,
    gpaPoint: evalResult.gpaPoint,
    isExempt: false,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Faculty Instructor',
  };
}

function getSubjectName(code: string): string {
  const map: Record<string, string> = {
    MTH: 'Mathematics',
    ENG: 'English Language',
    SCI: 'Basic Science & Tech',
    SOC: 'Social Studies & Civic',
    ICT: 'Computer Studies',
    AGR: 'Agricultural Science',
    BUS: 'Business Studies',
    FRE: 'French Language',
    ART: 'Cultural & Creative Arts',
  };
  return map[code] || code;
}

/**
 * Initialize or retrieve records for a specific class arm & subject
 */
export function getOrInitializeClassGradeRecords(
  students: Student[],
  levelId: string,
  levelName: string,
  armId: string,
  armName: string,
  subjectCode: string,
  subjectName: string,
  sessionYear: string = '2024/2025',
  termName: string = 'First Term'
): StudentSubjectGradeRecord[] {
  const allStored = getAllStoredGradeRecords();
  const config = getGradingConfig();

  // Filter existing records for this specific class arm & subject
  const existingForSubject = allStored.filter(
    (r) =>
      r.levelId === levelId &&
      r.armId === armId &&
      r.subjectCode === subjectCode &&
      r.sessionYear === sessionYear &&
      r.termName === termName
  );

  const existingMap = new Map<string, StudentSubjectGradeRecord>();
  existingForSubject.forEach((r) => existingMap.set(r.studentId, r));

  let needsSave = false;
  const activeClassStudents = students.filter(
    (s) =>
      s.classArm.toLowerCase().includes(armName.toLowerCase()) ||
      s.classLevel.toLowerCase().includes(levelName.toLowerCase())
  );

  // If no active students matched specific arm, use all students in this level or first 30 students
  const targetStudents = activeClassStudents.length > 0 ? activeClassStudents : students.slice(0, 30);

  const mergedRecords: StudentSubjectGradeRecord[] = targetStudents.map((student, idx) => {
    const existing = existingMap.get(student.id);
    if (existing) return existing;

    needsSave = true;
    // For demonstration, pre-seed Mathematics and English with initial realistic scores
    if (subjectCode === 'MTH' || subjectCode === 'ENG') {
      return seedDemoScores(
        student,
        subjectCode,
        levelId,
        armId,
        levelName,
        armName,
        sessionYear,
        termName,
        config,
        idx
      );
    }

    // Default empty record for new or un-graded subject
    return {
      id: `grd-${student.id}-${subjectCode}-${sessionYear}-${termName}`,
      schoolId: TENANT_SCHOOL_ID,
      studentId: student.id,
      studentRegNumber: student.admissionNumber || student.id,
      studentName: `${student.lastName} ${student.firstName}`,
      gender: student.gender as 'M' | 'F',
      levelId,
      levelName,
      armId,
      armName,
      subjectCode,
      subjectName,
      sessionYear,
      termName,
      ca1Score: null,
      ca2Score: null,
      ca3Score: null,
      examScore: null,
      totalScore: null,
      grade: '-',
      remark: 'Pending Assessment',
      gpaPoint: 0,
      isExempt: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Pending Entry',
    };
  });

  // Calculate ranks
  const ranked = calculateClassArmRankings(mergedRecords);

  if (needsSave) {
    const otherRecords = allStored.filter(
      (r) =>
        !(
          r.levelId === levelId &&
          r.armId === armId &&
          r.subjectCode === subjectCode &&
          r.sessionYear === sessionYear &&
          r.termName === termName
        )
    );
    saveAllGradeRecords([...otherRecords, ...ranked]);
  }

  return ranked;
}

/**
 * Update a single student record with automatic recalculation of total, grade, remark, and ranks
 */
export function updateStudentGradeRecord(
  updatedRecord: StudentSubjectGradeRecord,
  allClassRecords: StudentSubjectGradeRecord[],
  config: GradingConfiguration = getGradingConfig()
): {
  updatedRecord: StudentSubjectGradeRecord;
  rankedClassRecords: StudentSubjectGradeRecord[];
} {
  // 1. Recalculate total
  const total = calculateTotalScore(
    updatedRecord.ca1Score,
    updatedRecord.ca2Score,
    updatedRecord.ca3Score,
    updatedRecord.examScore
  );

  // 2. Evaluate boundary
  const { grade, remark, gpaPoint } = evaluateGradeAndRemark(total, config.boundaries, config.passMark);

  const calculated: StudentSubjectGradeRecord = {
    ...updatedRecord,
    totalScore: total,
    grade,
    remark,
    gpaPoint,
    updatedAt: new Date().toISOString(),
  };

  // 3. Replace in class records
  const nextList = allClassRecords.map((r) => (r.id === calculated.id ? calculated : r));

  // 4. Re-rank
  const ranked = calculateClassArmRankings(nextList);
  const freshlyRanked = ranked.find((r) => r.id === calculated.id) || calculated;

  // 5. Persist
  const allStored = getAllStoredGradeRecords();
  const others = allStored.filter((r) => !nextList.some((n) => n.id === r.id));
  saveAllGradeRecords([...others, ...ranked]);

  return {
    updatedRecord: freshlyRanked,
    rankedClassRecords: ranked,
  };
}

/**
 * Excel / TSV / CSV Clipboard Parser
 * Supports pasting rows from Excel / Google Sheets directly into the spreadsheet grid!
 */
export function parseExcelClipboardData(clipboardText: string): (number | null)[][] {
  if (!clipboardText || !clipboardText.trim()) return [];

  // Standard Excel paste is Tab-delimited per column, newline per row
  const lines = clipboardText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => {
    // If contains tabs, split by tab; otherwise split by comma if CSV
    const cells = line.includes('\t') ? line.split('\t') : line.split(',');
    return cells.map((cell) => {
      const cleaned = cell.trim().replace(/[^0-9.]/g, '');
      if (cleaned === '' || isNaN(Number(cleaned))) return null;
      return parseFloat(cleaned);
    });
  });
}

/**
 * Apply pasted 2D matrix starting at a specific student row and score column
 */
export function applyPastedScoresToGradebook(
  startRowIndex: number,
  startColumnKey: 'ca1Score' | 'ca2Score' | 'examScore',
  matrix: (number | null)[][],
  currentRecords: StudentSubjectGradeRecord[],
  config: GradingConfiguration = getGradingConfig()
): {
  updatedRecords: StudentSubjectGradeRecord[];
  cellsUpdated: number;
} {
  const columnOrder: ('ca1Score' | 'ca2Score' | 'examScore')[] = ['ca1Score', 'ca2Score', 'examScore'];
  const startColIdx = columnOrder.indexOf(startColumnKey);
  if (startColIdx === -1) return { updatedRecords: currentRecords, cellsUpdated: 0 };

  const nextRecords = [...currentRecords];
  let cellsUpdated = 0;

  for (let r = 0; r < matrix.length; r++) {
    const targetRowIdx = startRowIndex + r;
    if (targetRowIdx >= nextRecords.length) break;

    const rowData = matrix[r];
    const targetRecord = { ...nextRecords[targetRowIdx] };

    for (let c = 0; c < rowData.length; c++) {
      const colIdx = startColIdx + c;
      if (colIdx >= columnOrder.length) break;

      const colKey = columnOrder[colIdx];
      const val = rowData[c];

      if (val !== null) {
        // Enforce maximum boundaries
        let cappedVal = Math.max(0, val);
        if (colKey === 'ca1Score') cappedVal = Math.min(config.ca1Max, cappedVal);
        if (colKey === 'ca2Score') cappedVal = Math.min(config.ca2Max, cappedVal);
        if (colKey === 'examScore') cappedVal = Math.min(config.examMax, cappedVal);

        targetRecord[colKey] = cappedVal;
        cellsUpdated++;
      }
    }

    // Recalculate record
    const total = calculateTotalScore(
      targetRecord.ca1Score,
      targetRecord.ca2Score,
      targetRecord.ca3Score,
      targetRecord.examScore
    );
    const { grade, remark, gpaPoint } = evaluateGradeAndRemark(total, config.boundaries, config.passMark);

    targetRecord.totalScore = total;
    targetRecord.grade = grade;
    targetRecord.remark = remark;
    targetRecord.gpaPoint = gpaPoint;
    targetRecord.updatedAt = new Date().toISOString();

    nextRecords[targetRowIdx] = targetRecord;
  }

  // Re-rank all
  const ranked = calculateClassArmRankings(nextRecords);

  // Persist
  const allStored = getAllStoredGradeRecords();
  const others = allStored.filter((r) => !ranked.some((n) => n.id === r.id));
  saveAllGradeRecords([...others, ...ranked]);

  return {
    updatedRecords: ranked,
    cellsUpdated,
  };
}
