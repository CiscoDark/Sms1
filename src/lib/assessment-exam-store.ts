/**
 * Exam & Continuous Assessment (CA) Scheduling Store & Grading Gate Engine
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: Every query and assessment record enforces `schoolId: 'school-apex-001'`.
 * 2. Report Card Lock Gate: Report card grading only opens once the exam window has occurred
 *    or when an authorized administrator explicitly overrides the lock with an audit log.
 * 3. Student Portal Ready: Outputs structured announcements and timetable feeds without manual reposting.
 */

import {
  AssessmentScheduleItem,
  AssessmentType,
  StudentExamAnnouncement,
  GradingConfiguration,
  UserProfile,
} from '../types';
import { TENANT_SCHOOL_ID } from './class-timetable-store';

const ASSESSMENT_STORAGE_KEY = `sms_assessment_schedules_${TENANT_SCHOOL_ID}`;
const GRADING_CONFIG_STORAGE_KEY = `sms_grading_config_${TENANT_SCHOOL_ID}`;

export const DEFAULT_GRADING_CONFIG: GradingConfiguration = {
  schoolId: TENANT_SCHOOL_ID,
  sessionYear: '2024/2025',
  termName: 'First Term',
  ca1Name: 'Continuous Assessment 1 (CA 1)',
  ca1Max: 20,
  ca2Name: 'Mid-Term Test (CA 2)',
  ca2Max: 20,
  ca3Name: 'Practical / Project Work',
  ca3Max: 0, // Disabled by default, can be enabled
  examName: 'Terminal Examination',
  examMax: 60,
  totalMax: 100,
  passMark: 50,
  boundaries: [
    { grade: 'A', minScore: 75, maxScore: 100, remark: 'Distinction / Excellent', gpaPoint: 4.0, color: 'emerald' },
    { grade: 'B', minScore: 65, maxScore: 74, remark: 'Very Good / Credit', gpaPoint: 3.0, color: 'indigo' },
    { grade: 'C', minScore: 50, maxScore: 64, remark: 'Credit / Satisfactory', gpaPoint: 2.0, color: 'sky' },
    { grade: 'D', minScore: 40, maxScore: 49, remark: 'Pass', gpaPoint: 1.0, color: 'amber' },
    { grade: 'F', minScore: 0, maxScore: 39, remark: 'Fail', gpaPoint: 0.0, color: 'rose' },
  ],
  isLocked: false,
  updatedAt: new Date().toISOString(),
};

export const INITIAL_ASSESSMENT_SCHEDULES: AssessmentScheduleItem[] = [
  // Completed CA1
  {
    id: 'asm-ca1-mth-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'CA 1: Mathematics Diagnostic Assessment',
    type: 'CA1',
    subjectCode: 'MTH',
    subjectName: 'Mathematics',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [], // All arms
    date: '2024-10-14',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    venue: 'Classroom Assigned (All JSS1 Arms)',
    supervisorTeacherId: 'f-1',
    supervisorTeacherName: 'Mr. David Okonjo',
    maxScore: 20,
    weightPercentage: 20,
    status: 'CONCLUDED',
    isGradingOpen: true,
    gradingUnlockedAt: '2024-10-14T10:00:00Z',
    gradingUnlockedBy: 'System Auto-Unlock',
    isPublishedToStudents: true,
    instructions: 'Bring non-programmable calculators, mathematical sets, and pencils.',
    syllabusTopics: ['Number Bases', 'Fractions & Percentages', 'Algebraic Expressions'],
    createdAt: '2024-09-12T08:00:00Z',
    updatedAt: '2024-10-14T10:00:00Z',
  },
  {
    id: 'asm-ca1-eng-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'CA 1: English Language Comprehension & Grammar',
    type: 'CA1',
    subjectCode: 'ENG',
    subjectName: 'English Language',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-10-15',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    venue: 'Classroom Assigned (All JSS1 Arms)',
    supervisorTeacherId: 'f-2',
    supervisorTeacherName: 'Mrs. Rebecca Mensah',
    maxScore: 20,
    weightPercentage: 20,
    status: 'CONCLUDED',
    isGradingOpen: true,
    gradingUnlockedAt: '2024-10-15T10:00:00Z',
    gradingUnlockedBy: 'System Auto-Unlock',
    isPublishedToStudents: true,
    instructions: 'Essay paper and lexical structure test.',
    syllabusTopics: ['Parts of Speech', 'Reading Comprehension', 'Descriptive Composition'],
    createdAt: '2024-09-12T08:00:00Z',
    updatedAt: '2024-10-15T10:00:00Z',
  },
  // Completed CA2 Mid-Term
  {
    id: 'asm-ca2-mth-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'Mid-Term CA 2: Mathematics Theory & Problem Solving',
    type: 'MID_TERM',
    subjectCode: 'MTH',
    subjectName: 'Mathematics',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-11-04',
    startTime: '09:00',
    endTime: '10:30',
    durationMinutes: 90,
    venue: 'School Auditorium Hall',
    supervisorTeacherId: 'f-1',
    supervisorTeacherName: 'Mr. David Okonjo',
    maxScore: 20,
    weightPercentage: 20,
    status: 'CONCLUDED',
    isGradingOpen: true,
    gradingUnlockedAt: '2024-11-04T10:30:00Z',
    gradingUnlockedBy: 'System Auto-Unlock',
    isPublishedToStudents: true,
    instructions: 'Step-by-step mathematical working must be shown clearly.',
    syllabusTopics: ['Linear Equations', 'Geometry & Angles', 'Perimeter and Area of Plane Shapes'],
    createdAt: '2024-09-12T08:00:00Z',
    updatedAt: '2024-11-04T10:30:00Z',
  },
  {
    id: 'asm-ca2-eng-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'Mid-Term CA 2: English Grammar & Oral Expression',
    type: 'MID_TERM',
    subjectCode: 'ENG',
    subjectName: 'English Language',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-11-05',
    startTime: '09:00',
    endTime: '10:30',
    durationMinutes: 90,
    venue: 'School Auditorium Hall',
    supervisorTeacherId: 'f-2',
    supervisorTeacherName: 'Mrs. Rebecca Mensah',
    maxScore: 20,
    weightPercentage: 20,
    status: 'CONCLUDED',
    isGradingOpen: true,
    gradingUnlockedAt: '2024-11-05T10:30:00Z',
    gradingUnlockedBy: 'System Auto-Unlock',
    isPublishedToStudents: true,
    instructions: 'Section A: Objective questions (CBT). Section B: Formal letter writing.',
    syllabusTopics: ['Tenses & Concord', 'Summary Writing', 'Phonetics & Intonation'],
    createdAt: '2024-09-12T08:00:00Z',
    updatedAt: '2024-11-05T10:30:00Z',
  },
  // Terminal Examination - Concluded / Active
  {
    id: 'asm-exam-mth-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'First Term Terminal Examination: Mathematics Paper 1 & 2',
    type: 'TERMINAL_EXAM',
    subjectCode: 'MTH',
    subjectName: 'Mathematics',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-11-25',
    startTime: '09:00',
    endTime: '11:30',
    durationMinutes: 150,
    venue: 'Main Examination Hall A',
    supervisorTeacherId: 'f-1',
    supervisorTeacherName: 'Mr. David Okonjo',
    maxScore: 60,
    weightPercentage: 60,
    status: 'CONCLUDED',
    // Window has occurred: GRADING IS OPEN
    isGradingOpen: true,
    gradingUnlockedAt: '2024-11-25T11:30:00Z',
    gradingUnlockedBy: 'System Auto-Unlock (Exam Concluded)',
    isPublishedToStudents: true,
    instructions: 'Paper 1 (60 Multiple Choice, 1 hour). Paper 2 (Theory 5 Questions, 1.5 hours).',
    syllabusTopics: ['Whole Numbers & Basic Operations', 'Fractions, Decimals & Percentages', 'Simple Equations', 'Plane Shapes & Solid Figures', 'Statistics & Averages'],
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-11-25T11:30:00Z',
  },
  {
    id: 'asm-exam-eng-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'First Term Terminal Examination: English Language Paper 1 & 2',
    type: 'TERMINAL_EXAM',
    subjectCode: 'ENG',
    subjectName: 'English Language',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-11-26',
    startTime: '09:00',
    endTime: '11:30',
    durationMinutes: 150,
    venue: 'Main Examination Hall A',
    supervisorTeacherId: 'f-2',
    supervisorTeacherName: 'Mrs. Rebecca Mensah',
    maxScore: 60,
    weightPercentage: 60,
    status: 'CONCLUDED',
    isGradingOpen: true,
    gradingUnlockedAt: '2024-11-26T11:30:00Z',
    gradingUnlockedBy: 'System Auto-Unlock (Exam Concluded)',
    isPublishedToStudents: true,
    instructions: 'Bring blue or black ink pens. Essay length minimum 250 words.',
    syllabusTopics: ['Comprehension Passages', 'Continuous Writing / Composition', 'Grammatical Accuracies', 'Literature Anthology Texts'],
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-11-26T11:30:00Z',
  },
  // Upcoming Terminal Exam with GRADING LOCKED
  {
    id: 'asm-exam-sci-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'First Term Terminal Examination: Basic Science & Technology',
    type: 'TERMINAL_EXAM',
    subjectCode: 'SCI',
    subjectName: 'Basic Science & Tech',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-12-02',
    startTime: '09:00',
    endTime: '11:00',
    durationMinutes: 120,
    venue: 'Science Lab 1 & Main Hall',
    supervisorTeacherId: 'f-3',
    supervisorTeacherName: 'Dr. Samuel Okafor',
    maxScore: 60,
    weightPercentage: 60,
    status: 'SCHEDULED',
    // GATING REQUIREMENT: Exam date is in future / scheduled -> GRADING IS LOCKED
    isGradingOpen: false,
    isPublishedToStudents: true,
    instructions: 'Includes practical section on measurement instruments and living things classification.',
    syllabusTopics: ['Living and Non-Living Things', 'Matter & Physical Properties', 'Energy Transformation', 'Basic Technological Skills'],
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-10-01T08:00:00Z',
  },
  {
    id: 'asm-exam-ict-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'First Term Terminal Examination: Computer Studies / ICT CBT',
    type: 'TERMINAL_EXAM',
    subjectCode: 'ICT',
    subjectName: 'Computer Studies',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-12-04',
    startTime: '10:00',
    endTime: '12:00',
    durationMinutes: 120,
    venue: 'ICT Computer Lab (35 Workstations)',
    supervisorTeacherId: 'f-8',
    supervisorTeacherName: 'Ms. Ngozi Nwosu',
    maxScore: 60,
    weightPercentage: 60,
    status: 'SCHEDULED',
    isGradingOpen: false, // LOCKED
    isPublishedToStudents: true,
    instructions: 'Login credentials will be distributed 15 minutes before the CBT session commences.',
    syllabusTopics: ['Computer Fundamentals & History', 'Hardware Devices & Peripherals', 'Operating Systems & File Management', 'Digital Literacy & Typing'],
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-10-01T08:00:00Z',
  },
  {
    id: 'asm-exam-soc-jss1',
    schoolId: TENANT_SCHOOL_ID,
    sessionYear: '2024/2025',
    termName: 'First Term',
    title: 'First Term Terminal Examination: Social Studies & Civic Education',
    type: 'TERMINAL_EXAM',
    subjectCode: 'SOC',
    subjectName: 'Social Studies',
    levelId: 'level-jss-1',
    levelName: 'JSS 1',
    armIds: [],
    date: '2024-12-05',
    startTime: '09:00',
    endTime: '11:00',
    durationMinutes: 120,
    venue: 'Main Examination Hall B',
    supervisorTeacherId: 'f-4',
    supervisorTeacherName: 'Ms. Grace Danladi',
    maxScore: 60,
    weightPercentage: 60,
    status: 'SCHEDULED',
    isGradingOpen: false, // LOCKED
    isPublishedToStudents: true,
    instructions: 'Answer all questions in Section A and three questions in Section B.',
    syllabusTopics: ['Family & Social Groups', 'Culture and Social Values', 'Civic Rights and Responsibilities', 'Leadership and Followership'],
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-10-01T08:00:00Z',
  },
];

/**
 * Retrieve all assessment schedules with tenant isolation
 */
export function getStoredAssessmentSchedules(): AssessmentScheduleItem[] {
  try {
    const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw) {
      saveStoredAssessmentSchedules(INITIAL_ASSESSMENT_SCHEDULES);
      return INITIAL_ASSESSMENT_SCHEDULES;
    }
    const parsed: AssessmentScheduleItem[] = JSON.parse(raw);
    return parsed.filter((item) => item.schoolId === TENANT_SCHOOL_ID);
  } catch {
    return INITIAL_ASSESSMENT_SCHEDULES;
  }
}

/**
 * Persist assessment schedules
 */
export function saveStoredAssessmentSchedules(items: AssessmentScheduleItem[]): void {
  try {
    const tenantScoped = items.map((i) => ({ ...i, schoolId: TENANT_SCHOOL_ID }));
    localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(tenantScoped));
  } catch (err) {
    console.error('Failed to save assessment schedules', err);
  }
}

/**
 * Grading configuration persistence
 */
export function getGradingConfig(): GradingConfiguration {
  try {
    const raw = localStorage.getItem(GRADING_CONFIG_STORAGE_KEY);
    if (!raw) {
      saveGradingConfig(DEFAULT_GRADING_CONFIG);
      return DEFAULT_GRADING_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return parsed.schoolId === TENANT_SCHOOL_ID ? parsed : DEFAULT_GRADING_CONFIG;
  } catch {
    return DEFAULT_GRADING_CONFIG;
  }
}

export function saveGradingConfig(config: GradingConfiguration): void {
  try {
    const tenantScoped = { ...config, schoolId: TENANT_SCHOOL_ID, updatedAt: new Date().toISOString() };
    localStorage.setItem(GRADING_CONFIG_STORAGE_KEY, JSON.stringify(tenantScoped));
  } catch (err) {
    console.error('Failed to save grading config', err);
  }
}

/**
 * Gating Logic: Checks whether report card grading is OPEN or LOCKED for a given class and subject.
 * Per Step 11: "Report card grading should only 'open' for a class once its exam window
 * has actually occurred — lock icon on the report card module until then."
 */
export interface GradingGateStatus {
  isLocked: boolean;
  status: 'UPCOMING_LOCKED' | 'GRADING_OPEN' | 'OVERRIDDEN_OPEN' | 'NO_SCHEDULE';
  reason: string;
  scheduledDate?: string;
  examTitle?: string;
  examItem?: AssessmentScheduleItem;
  canOverride: boolean;
}

export function getGradingGateStatus(
  levelId: string,
  armId: string,
  subjectCode: string,
  sessionYear: string = '2024/2025',
  termName: string = 'First Term'
): GradingGateStatus {
  const allSchedules = getStoredAssessmentSchedules();

  // Look for the terminal exam schedule for this class/subject
  const exam = allSchedules.find(
    (s) =>
      s.sessionYear === sessionYear &&
      s.termName === termName &&
      s.levelId === levelId &&
      s.subjectCode === subjectCode &&
      s.type === 'TERMINAL_EXAM' &&
      (s.armIds.length === 0 || s.armIds.includes(armId))
  );

  if (!exam) {
    // If no terminal exam is scheduled, grading is available with a notice
    return {
      isLocked: false,
      status: 'NO_SCHEDULE',
      reason: 'No official terminal examination has been scheduled for this subject. Continuous grading enabled.',
      canOverride: true,
    };
  }

  // If already marked open (either window concluded or admin unlocked)
  if (exam.isGradingOpen) {
    return {
      isLocked: false,
      status: exam.gradingUnlockedBy?.includes('Override') ? 'OVERRIDDEN_OPEN' : 'GRADING_OPEN',
      reason: `Grading is active. Examination window concluded on ${exam.date}.`,
      scheduledDate: exam.date,
      examTitle: exam.title,
      examItem: exam,
      canOverride: true,
    };
  }

  // Otherwise, the window is in the future or pending -> LOCKED
  return {
    isLocked: true,
    status: 'UPCOMING_LOCKED',
    reason: `Report card grading locked. Official terminal examination window is scheduled for ${exam.date} (${exam.startTime} - ${exam.endTime}).`,
    scheduledDate: exam.date,
    examTitle: exam.title,
    examItem: exam,
    canOverride: true,
  };
}

/**
 * Admin override toggle for grading lock
 */
export function toggleAdminGradingOverride(
  scheduleId: string,
  unlock: boolean,
  adminUser: UserProfile,
  reason: string = 'Authorized early entry'
): AssessmentScheduleItem | null {
  const allSchedules = getStoredAssessmentSchedules();
  const index = allSchedules.findIndex((s) => s.id === scheduleId);
  if (index === -1) return null;

  const item = allSchedules[index];
  const updated: AssessmentScheduleItem = {
    ...item,
    isGradingOpen: unlock,
    gradingUnlockedAt: unlock ? new Date().toISOString() : undefined,
    gradingUnlockedBy: unlock ? `Admin Override by ${adminUser.name} (${adminUser.role}): ${reason}` : undefined,
    status: unlock && item.status === 'SCHEDULED' ? 'IN_PROGRESS' : item.status,
    updatedAt: new Date().toISOString(),
  };

  allSchedules[index] = updated;
  saveStoredAssessmentSchedules(allSchedules);
  return updated;
}

/**
 * Structured Student Portal Feed Generator
 * Per Step 11: "Once published, exam dates should automatically appear on the student's
 * timetable/announcements feed later, without a separate manual post."
 */
export function generateStudentExamFeed(
  schoolId: string,
  levelId?: string,
  armId?: string
): StudentExamAnnouncement[] {
  const allSchedules = getStoredAssessmentSchedules().filter(
    (s) => s.schoolId === schoolId && s.isPublishedToStudents
  );

  const filtered = allSchedules.filter((s) => {
    if (levelId && s.levelId !== levelId) return false;
    if (armId && s.armIds.length > 0 && !s.armIds.includes(armId)) return false;
    return true;
  });

  const now = new Date();

  return filtered
    .map((s) => {
      const examDate = new Date(`${s.date}T${s.startTime}`);
      const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: `ann-${s.id}`,
        schoolId: s.schoolId,
        examId: s.id,
        title: s.title,
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
        levelName: s.levelName,
        date: s.date,
        timeRange: `${s.startTime} - ${s.endTime}`,
        venue: s.venue,
        instructions: s.instructions,
        daysRemaining: diffDays,
        isUpcoming: diffDays >= 0,
        status: s.status,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
