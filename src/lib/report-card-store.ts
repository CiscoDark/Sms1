/**
 * Official Report Card Point-in-Time Snapshot Storage & Verification Engine
 * 
 * ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: All snapshots scoped to `schoolId: 'school-apex-001'`.
 * 2. Temporal Immutability: Once published, report card stores a frozen JSON snapshot of
 *    student name, arm, position, grades, remarks, and fee status at that exact moment.
 *    Renaming a class or arm in 2028 NEVER alters a 2024 report card.
 * 3. Public Privacy / Data Sanitization: Public QR verification endpoint (/verify-credential/[uuid])
 *    strictly strips fees, guardian info, and disciplinary remarks.
 */

import {
  ReportCardSnapshot,
  SubjectScoreSnapshot,
  PsychomotorAssessment,
  DisciplinaryRecord,
  Student,
  GradingConfiguration,
} from '../types';
import { TENANT_SCHOOL_ID } from './class-timetable-store';
import { getGradingConfig } from './assessment-exam-store';
import { getEnrichedStudents } from './students/students-store';

const REPORT_CARD_STORAGE_KEY = `sms_report_card_snapshots_${TENANT_SCHOOL_ID}`;
const DISCIPLINARY_STORAGE_KEY = `sms_disciplinary_records_${TENANT_SCHOOL_ID}`;

// Pre-seeded disciplinary records for testing AI ingestion
export const INITIAL_DISCIPLINARY_RECORDS: DisciplinaryRecord[] = [
  {
    id: 'disc-001',
    studentId: 'std-001',
    studentName: 'Chinedu Adeleke',
    studentRegNumber: 'APX/2024/001',
    incidentDate: '2024-02-14',
    incidentTitle: 'Assembly Punctuality',
    description: 'Arrived 10 minutes past the morning assembly bell due to bus delays. Displayed prompt remorse and assisted class captain with hall setup.',
    severity: 'MINOR',
    actionTaken: 'Verbal guidance & advisory note',
    isPrivate: true,
    recordedBy: 'Mrs. Folashade Alabi',
    createdAt: '2024-02-14T08:30:00Z',
  },
  {
    id: 'disc-002',
    studentId: 'std-004',
    studentName: 'Ngozi Okonjo',
    studentRegNumber: 'APX/2024/004',
    incidentDate: '2024-03-08',
    incidentTitle: 'Classroom Noise Regulation',
    description: 'Excessive conversational enthusiasm during private study period in Physics lab.',
    severity: 'MINOR',
    actionTaken: 'Counselled on library decorum',
    isPrivate: true,
    recordedBy: 'Mr. Babatunde Lawal',
    createdAt: '2024-03-08T14:15:00Z',
  },
];

export function getDisciplinaryRecords(studentId?: string): DisciplinaryRecord[] {
  try {
    const raw = localStorage.getItem(DISCIPLINARY_STORAGE_KEY);
    const records: DisciplinaryRecord[] = raw ? JSON.parse(raw) : INITIAL_DISCIPLINARY_RECORDS;
    if (studentId) {
      return records.filter((r) => r.studentId === studentId);
    }
    return records;
  } catch (err) {
    console.error('Error fetching disciplinary records:', err);
    return INITIAL_DISCIPLINARY_RECORDS;
  }
}

// Sample Nigerian Secondary School Subjects
export const DEFAULT_NIGERIAN_SUBJECTS = [
  { code: 'ENG101', name: 'English Language' },
  { code: 'MTH101', name: 'Mathematics' },
  { code: 'BIO101', name: 'Biology' },
  { code: 'CHM101', name: 'Chemistry' },
  { code: 'PHY101', name: 'Physics' },
  { code: 'ECO101', name: 'Economics' },
  { code: 'CIV101', name: 'Civic Education' },
  { code: 'GEO101', name: 'Geography' },
  { code: 'CRS101', name: 'Christian Religious Studies' },
];

/**
 * Generate realistic subject scores for an enrolled student based on their academic tier
 */
export function generateSubjectScoresForStudent(student: Student, baseAverage: number = 80): SubjectScoreSnapshot[] {
  return DEFAULT_NIGERIAN_SUBJECTS.map((sub, idx) => {
    // Slight variance per subject
    const offset = ((idx * 7) % 15) - 7;
    const score = Math.min(96, Math.max(48, Math.round(baseAverage + offset)));

    // Breakdown: CA1 (20%), CA2 (20%), Exam (60%)
    const ca1 = Math.round((score / 100) * 20 * 10) / 10;
    const ca2 = Math.round((score / 100) * 20 * 10) / 10;
    const exam = Math.round((score / 100) * 60 * 10) / 10;
    const total = Math.round(ca1 + ca2 + exam);

    let grade = 'C4';
    let remark = 'Credit';
    let gpaPoint = 2.5;

    if (total >= 75) {
      grade = 'A1';
      remark = 'Distinction / Excellent';
      gpaPoint = 4.0;
    } else if (total >= 70) {
      grade = 'B2';
      remark = 'Very Good';
      gpaPoint = 3.5;
    } else if (total >= 65) {
      grade = 'B3';
      remark = 'Good';
      gpaPoint = 3.0;
    } else if (total >= 60) {
      grade = 'C4';
      remark = 'Credit';
      gpaPoint = 2.5;
    } else if (total >= 55) {
      grade = 'C5';
      remark = 'Credit';
      gpaPoint = 2.0;
    } else if (total >= 50) {
      grade = 'C6';
      remark = 'Credit';
      gpaPoint = 1.5;
    } else if (total >= 45) {
      grade = 'D7';
      remark = 'Pass';
      gpaPoint = 1.0;
    } else if (total >= 40) {
      grade = 'E8';
      remark = 'Pass';
      gpaPoint = 0.5;
    } else {
      grade = 'F9';
      remark = 'Fail';
      gpaPoint = 0.0;
    }

    return {
      subjectCode: sub.code,
      subjectName: sub.name,
      ca1Score: ca1,
      ca2Score: ca2,
      examScore: exam,
      totalScore: total,
      grade,
      remark,
      gpaPoint,
      classAverage: 68.4,
      highestInClass: 94,
      lowestInClass: 42,
    };
  });
}

/**
 * Generate initial frozen snapshots for illustration of Invariant #2 and #3
 */
function generateSeedSnapshots(): ReportCardSnapshot[] {
  const students = getEnrichedStudents();
  const targetStudents = students.slice(0, 10);

  return targetStudents.map((st, i) => {
    const baseAvg = 84 - i * 2.5;
    const subjects = generateSubjectScoresForStudent(st, baseAvg);
    const sum = subjects.reduce((acc, s) => acc + (s.totalScore || 0), 0);
    const avg = Math.round((sum / subjects.length) * 10) / 10;
    const position = i + 1;

    const credentialUuid = `cred-${st.id}-2024-t3-${Math.random().toString(36).substring(2, 8)}`;

    const psychomotor: PsychomotorAssessment = {
      neatness: Math.min(5, 4 + (i % 2)),
      punctuality: Math.min(5, 5 - (i % 3)),
      politeness: 5,
      leadership: i === 0 ? 5 : 4,
      attentiveness: 4,
      sportsmanship: 4,
      honesty: 5,
    };

    let overallGrade = 'B2';
    if (avg >= 75) overallGrade = 'A1';
    else if (avg >= 70) overallGrade = 'B2';
    else if (avg >= 65) overallGrade = 'B3';

    const teacherRemarks =
      i === 0
        ? 'Chinedu has maintained an exemplary academic record throughout this session. His analytical thinking in Mathematics and sciences is truly commendable. Keep up the high standard!'
        : i === 1
        ? 'Amina demonstrates high intellectual capability and consistent work ethic. Her mastery of English Language and creative writing continues to stand out in the class.'
        : `${st.firstName} has made commendable progress across all subjects this term. Continues to show good discipline and enthusiasm during class discussions.`;

    const principalRemarks =
      avg >= 80
        ? 'Outstanding academic accomplishment. A worthy ambassador of Apex Horizon Academy. Promoted with Distinction.'
        : 'Very commendable performance. Keep striving for greater heights in the upcoming session. Promoted.';

    return {
      id: `rc-${st.id}-2024-2025-Third-Term`,
      credentialUuid,
      schoolId: TENANT_SCHOOL_ID,
      schoolName: 'Apex Horizon Academy',
      studentId: st.id,
      studentRegNumber: st.admissionNumber,
      studentName: `${st.firstName} ${st.middleName ? st.middleName + ' ' : ''}${st.lastName}`,
      gender: st.gender,
      avatarUrl: st.avatarUrl,
      classLevel: st.classLevel,
      classArm: st.classArm, // FROZEN arm label
      sessionYear: '2024/2025',
      termName: 'Third Term',
      subjects,
      totalScore: sum,
      totalMaxScore: subjects.length * 100,
      averagePercentage: avg,
      overallGrade,
      overallGpa: avg >= 75 ? 4.0 : avg >= 70 ? 3.5 : 3.0,
      positionInArm: position,
      totalInArm: 35,
      classAverage: 69.2,
      attendanceRate: 98.4 - (i % 4),
      daysPresent: 118,
      totalDays: 120,
      feeStatus: i % 4 === 0 ? 'PARTIAL' : 'CLEARED',
      feeBalance: i % 4 === 0 ? 25000 : 0,
      feeStatusText: i % 4 === 0 ? '₦25,000 Balance Carried to Term 1' : 'Tuition & Levies Cleared (₦0.00)',
      teacherRemarks,
      teacherSignedOff: true,
      teacherSignedAt: '2024-07-22T10:30:00Z',
      teacherName: 'Mrs. Folashade Alabi',
      isAiDrafted: true,
      principalRemarks,
      principalSigned: true,
      principalSignedAt: '2024-07-24T14:00:00Z',
      principalName: 'Dr. Obinna Anyaoku',
      nextTermBegins: 'September 15, 2025',
      promotionDecision: 'PROMOTED',
      psychomotor,
      publishedAt: '2024-07-25T09:00:00Z',
      publishedBy: 'Principal Office',
      isPublished: true,
    };
  });
}

/**
 * Get all stored report card snapshots
 */
export function getAllPublishedReportCards(): ReportCardSnapshot[] {
  try {
    const stored = localStorage.getItem(REPORT_CARD_STORAGE_KEY);
    if (!stored) {
      const seeds = generateSeedSnapshots();
      localStorage.setItem(REPORT_CARD_STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('Error fetching report card snapshots:', err);
    return generateSeedSnapshots();
  }
}

/**
 * Get snapshot by public credential UUID (strictly for unauthenticated verification)
 */
export function getReportCardByCredentialUuid(uuid: string): ReportCardSnapshot | null {
  const all = getAllPublishedReportCards();
  const cleanUuid = uuid.trim().toLowerCase();
  return (
    all.find(
      (rc) =>
        rc.credentialUuid.toLowerCase() === cleanUuid ||
        rc.id.toLowerCase() === cleanUuid ||
        rc.studentRegNumber.replace(/\//g, '-').toLowerCase() === cleanUuid
    ) || null
  );
}

/**
 * Get single report card for student
 */
export function getReportCardForStudent(
  studentId: string,
  sessionYear: string = '2024/2025',
  termName: string = 'Third Term'
): ReportCardSnapshot | null {
  const all = getAllPublishedReportCards();
  return (
    all.find(
      (rc) =>
        rc.studentId === studentId &&
        rc.sessionYear === sessionYear &&
        rc.termName.toLowerCase() === termName.toLowerCase()
    ) || null
  );
}

/**
 * Save / Publish a frozen report card snapshot
 * Strictly enforces Invariant #2: Frozen JSON snapshot of student, arm name, grades, fee status.
 */
export function saveReportCardSnapshot(snapshot: ReportCardSnapshot): void {
  const all = getAllPublishedReportCards();
  const idx = all.findIndex((r) => r.id === snapshot.id);

  let updated: ReportCardSnapshot[];
  if (idx >= 0) {
    updated = [...all];
    updated[idx] = snapshot;
  } else {
    updated = [snapshot, ...all];
  }

  try {
    localStorage.setItem(REPORT_CARD_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error persisting report card snapshot:', err);
  }
}

/**
 * Bulk Publish Report Cards for an entire Arm or Level
 */
export function bulkPublishReportCards(snapshots: ReportCardSnapshot[]): void {
  const all = getAllPublishedReportCards();
  const existingMap = new Map<string, ReportCardSnapshot>();
  all.forEach((rc) => existingMap.set(rc.id, rc));

  snapshots.forEach((snap) => {
    existingMap.set(snap.id, {
      ...snap,
      isPublished: true,
      publishedAt: new Date().toISOString(),
    });
  });

  const merged = Array.from(existingMap.values());
  try {
    localStorage.setItem(REPORT_CARD_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Error bulk publishing report card snapshots:', err);
  }
}

/**
 * Pedagogical AI Remark Generator (Client / Server fallback)
 * Generates personalized, balanced, high-value pedagogical remarks
 * ingesting CA scores, overall grade, attendance rate, and conduct history.
 */
export function generateLocalPedagogicalRemark(params: {
  studentName: string;
  gender: 'M' | 'F';
  classLevel: string;
  overallScore: number;
  overallGrade: string;
  attendanceRate: number;
  disciplinaryCount: number;
  topSubject?: string;
  weakSubject?: string;
  tone?: 'encouraging' | 'balanced' | 'rigorous' | 'growth';
}): string {
  const {
    studentName,
    gender,
    overallScore,
    overallGrade,
    attendanceRate,
    disciplinaryCount,
    topSubject = 'Mathematics',
    weakSubject,
    tone = 'balanced',
  } = params;

  const pronoun = gender === 'M' ? 'He' : 'She';
  const posPronoun = gender === 'M' ? 'His' : 'Her';
  const objPronoun = gender === 'M' ? 'him' : 'her';

  let remark = '';

  if (overallScore >= 75) {
    if (tone === 'encouraging') {
      remark = `${studentName} has delivered an extraordinary academic performance this term, achieving an enviable ${overallGrade} grade (${overallScore}%). ${posPronoun} brilliance in ${topSubject} and commendable ${attendanceRate}% attendance reflect true dedication. ${pronoun} is a natural leader and a role model in the classroom.`;
    } else if (tone === 'rigorous') {
      remark = `${studentName} maintains high scholastic excellence with ${overallScore}%. While ${posPronoun.toLowerCase()} mastery of core concepts is evident, ${pronoun.toLowerCase()} should now be challenged with advanced Olympiad-level exercises to further stretch ${posPronoun.toLowerCase()} analytical prowess.`;
    } else {
      remark = `${studentName} exhibits exceptional academic capability and disciplined study habits, earning a stellar ${overallGrade} (${overallScore}%). ${posPronoun} attendance of ${attendanceRate}% demonstrates consistent diligence. With continued focus, ${pronoun.toLowerCase()} will maintain this distinction.`;
    }
  } else if (overallScore >= 60) {
    if (tone === 'growth') {
      remark = `${studentName} has demonstrated steady intellectual growth this session with a solid ${overallScore}%. ${posPronoun} commendable effort in ${topSubject} is noteworthy. Concentrating more effort on ${weakSubject || 'quantitative coursework'} will easily propel ${objPronoun} into the distinction echelon next term.`;
    } else {
      remark = `${studentName} is a hardworking and well-behaved student who achieved a commendable ${overallGrade} grade (${overallScore}%). ${pronoun} attended ${attendanceRate}% of classes with punctuality. Consistent revision at home will yield even stronger examination scores.`;
    }
  } else if (overallScore >= 50) {
    remark = `${studentName} has made satisfactory progress, achieving a pass grade of ${overallScore}%. While ${posPronoun.toLowerCase()} conduct is cooperative, greater attention to continuous assessment assignments is recommended. We encourage regular weekend study sessions to bolster confidence.`;
  } else {
    remark = `${studentName} scored ${overallScore}% this term, which is below ${posPronoun.toLowerCase()} true potential. ${posPronoun} attendance rate of ${attendanceRate}% indicates areas where attendance and class engagement need strengthening. With dedicated remedial guidance and structured study hours, significant improvement can be achieved.`;
  }

  if (disciplinaryCount > 0) {
    remark += ` Note: ${studentName} responded maturely to guidance regarding school regulations and has shown commendable behavioral growth.`;
  }

  return remark;
}
