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
  CumulativeStudentSubjectRecord,
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
 * Evaluate grade boundary, remark, and GPA point (Nigerian A1-F9 Standard)
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

  // Fallback if below minimum boundary (Nigerian F9)
  if (rounded < passMark) {
    return { grade: 'F9', remark: 'Fail', gpaPoint: 0, color: 'rose' };
  }

  return { grade: 'C6', remark: 'Credit', gpaPoint: 1.5, color: 'sky' };
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
      distribution: { A1: 0, B2: 0, B3: 0, C4: 0, C5: 0, C6: 0, D7: 0, E8: 0, F9: 0 },
    };
  }

  const scores = gradedRecords.map((r) => r.totalScore as number);
  const totalSum = scores.reduce((acc, score) => acc + score, 0);
  const classAverage = Math.round((totalSum / gradedStudents) * 10) / 10;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const passedStudents = gradedRecords.filter((r) => (r.totalScore || 0) >= passMark).length;
  const passRate = Math.round((passedStudents / gradedStudents) * 1000) / 10;

  const distribution: Record<string, number> = {
    A1: 0, B2: 0, B3: 0, C4: 0, C5: 0, C6: 0, D7: 0, E8: 0, F9: 0,
  };
  for (const r of gradedRecords) {
    if (r.grade) {
      distribution[r.grade] = (distribution[r.grade] || 0) + 1;
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
  // Deterministic realistic score distribution based on student id and term progression
  const termOffset = termName === 'Second Term' ? 4 : termName === 'Third Term' ? 8 : 0;
  const hash = (student.id.charCodeAt(student.id.length - 1) + index * 7 + termOffset) % 35;
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

/**
 * Nigerian 3rd Term Cumulative Engine:
 * - 20% to First Term
 * - 30% to Second Term
 * - 50% to Third Term
 *
 * Formula: Cumulative = (T1 * 0.20) + (T2 * 0.30) + (T3 * 0.50)
 * Evaluates Nigerian A1 - F9 grade, GPA point, class rank, and promotional recommendation.
 */
export function computeCumulativeAnnualResults(
  term3Records: StudentSubjectGradeRecord[],
  term1Records: StudentSubjectGradeRecord[],
  term2Records: StudentSubjectGradeRecord[],
  config: GradingConfiguration
): CumulativeStudentSubjectRecord[] {
  const t1Map = new Map<string, StudentSubjectGradeRecord>();
  term1Records.forEach((r) => t1Map.set(r.studentId, r));

  const t2Map = new Map<string, StudentSubjectGradeRecord>();
  term2Records.forEach((r) => t2Map.set(r.studentId, r));

  const t1Weight = (config.cumulativeTerm1Weight ?? 20) / 100;
  const t2Weight = (config.cumulativeTerm2Weight ?? 30) / 100;
  const t3Weight = (config.cumulativeTerm3Weight ?? 50) / 100;

  const results: CumulativeStudentSubjectRecord[] = term3Records.map((t3) => {
    const t1 = t1Map.get(t3.studentId);
    const t2 = t2Map.get(t3.studentId);

    const s1 = t1?.totalScore ?? null;
    const s2 = t2?.totalScore ?? null;
    const s3 = t3.totalScore ?? null;

    const w1 = s1 !== null ? Math.round(s1 * t1Weight * 10) / 10 : null;
    const w2 = s2 !== null ? Math.round(s2 * t2Weight * 10) / 10 : null;
    const w3 = s3 !== null ? Math.round(s3 * t3Weight * 10) / 10 : null;

    let cumulativeScore: number | null = null;
    if (s1 !== null || s2 !== null || s3 !== null) {
      const activeWeight =
        (s1 !== null ? t1Weight : 0) +
        (s2 !== null ? t2Weight : 0) +
        (s3 !== null ? t3Weight : 0);
      const rawSum = (w1 || 0) + (w2 || 0) + (w3 || 0);
      if (activeWeight > 0 && activeWeight < 0.99) {
        // Normalize if a student missed an earlier term
        cumulativeScore = Math.round((rawSum / activeWeight) * 10) / 10;
      } else {
        cumulativeScore = Math.round(rawSum * 10) / 10;
      }
    }

    const evalResult = evaluateGradeAndRemark(cumulativeScore, config.boundaries, config.passMark);

    let promotionStatus: CumulativeStudentSubjectRecord['promotionStatus'] = 'PENDING';
    let promotionDecision: 'PROMOTED' | 'PROMOTED ON TRIAL' | 'REPEAT' | 'PENDING' = 'PENDING';
    if (cumulativeScore !== null) {
      if (cumulativeScore >= config.passMark) {
        promotionStatus = 'PROMOTED';
        promotionDecision = 'PROMOTED';
      } else if (cumulativeScore >= 40) {
        promotionStatus = 'PROMOTED_ON_TRIAL';
        promotionDecision = 'PROMOTED ON TRIAL';
      } else {
        promotionStatus = 'REPEAT';
        promotionDecision = 'REPEAT';
      }
    }

    return {
      id: `cum-${t3.studentId}-${t3.subjectCode}-${t3.sessionYear}`,
      schoolId: TENANT_SCHOOL_ID,
      studentId: t3.studentId,
      studentRegNumber: t3.studentRegNumber,
      studentName: t3.studentName,
      gender: t3.gender,
      levelId: t3.levelId,
      levelName: t3.levelName,
      armId: t3.armId,
      armName: t3.armName,
      subjectCode: t3.subjectCode,
      subjectName: t3.subjectName,
      sessionYear: t3.sessionYear,
      term1Score: s1,
      term1Weighted: w1,
      term2Score: s2,
      term2Weighted: w2,
      term3Score: s3,
      term3Weighted: w3,
      term1TotalScore: s1,
      term1WeightedScore: w1,
      term2TotalScore: s2,
      term2WeightedScore: w2,
      term3TotalScore: s3,
      term3WeightedScore: w3,
      cumulativeScore,
      cumulativeTotalScore: cumulativeScore,
      cumulativeGrade: evalResult.grade,
      cumulativeRemark: evalResult.remark,
      cumulativeGpaPoint: evalResult.gpaPoint,
      promotionStatus,
      promotionDecision,
      updatedAt: new Date().toISOString(),
    };
  });

  // Calculate Standard Competition Ranking ("1224") for Cumulative Scores
  const valid = results.filter((r) => r.cumulativeScore !== null);
  valid.sort((a, b) => (b.cumulativeScore || 0) - (a.cumulativeScore || 0));

  const rankMap = new Map<string, number>();
  let currentRank = 1;
  for (let i = 0; i < valid.length; i++) {
    if (i > 0 && valid[i].cumulativeScore === valid[i - 1].cumulativeScore) {
      rankMap.set(valid[i].id, rankMap.get(valid[i - 1].id) || currentRank);
    } else {
      currentRank = i + 1;
      rankMap.set(valid[i].id, currentRank);
    }
  }

  return results.map((r) => ({
    ...r,
    cumulativeRankInArm: rankMap.get(r.id),
  }));
}

/**
 * Retrieve or guarantee records for prior terms (First Term & Second Term)
 * so that when the 3rd term cumulative result is displayed, historical data is available.
 */
export function getPriorTermsForSubject(
  students: Student[],
  levelId: string,
  levelName: string,
  armId: string,
  armName: string,
  subjectCode: string,
  subjectName: string,
  sessionYear: string = '2024/2025'
): {
  term1Records: StudentSubjectGradeRecord[];
  term2Records: StudentSubjectGradeRecord[];
} {
  const term1Records = getOrInitializeClassGradeRecords(
    students,
    levelId,
    levelName,
    armId,
    armName,
    subjectCode,
    subjectName,
    sessionYear,
    'First Term'
  );

  const term2Records = getOrInitializeClassGradeRecords(
    students,
    levelId,
    levelName,
    armId,
    armName,
    subjectCode,
    subjectName,
    sessionYear,
    'Second Term'
  );

  return {
    term1Records,
    term2Records,
  };
}
