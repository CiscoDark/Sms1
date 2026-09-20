/**
 * Teacher Personal Timetables Store & Non-Blocking Overlap Detection Engine
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: Every query and stored record contains `schoolId` (Invariant #1).
 * 2. Timetable Decoupling: The class timetable (admin) and teacher personal timetable are completely
 *    decoupled systems (Invariant #2).
 *    - Changes made here NEVER write back to the official class timetables.
 *    - Overlaps between personal planning notes and official classes are strictly INFORMATIONAL
 *      (subtle red highlight), and NEVER block saving.
 */

import {
  TeacherPersonalBlock,
  TeacherActivityType,
  DayOfWeek,
  ClassTimetableSlot,
  ClassLevel,
} from '../types';
import {
  getStoredTimetableSlots,
  TENANT_SCHOOL_ID,
  DAYS_OF_WEEK,
  TIME_SLOT_DEFINITIONS,
} from './class-timetable-store';
import { FACULTY_MEMBERS } from '../data/mockData';

const STORAGE_KEY = 'sms_teacher_personal_timetables';

export const ACTIVITY_TYPE_CONFIG: Record<
  TeacherActivityType,
  {
    label: string;
    description: string;
    defaultColor: TeacherPersonalBlock['colorTheme'];
    badgeColor: string;
  }
> = {
  CLASS_LESSON: {
    label: 'Class Lesson',
    description: 'Scheduled classroom teaching period',
    defaultColor: 'indigo',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  PREP_PLANNING: {
    label: 'Lesson Prep & Planning',
    description: 'Curriculum design, slides, and syllabus review',
    defaultColor: 'violet',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  MARKING_GRADING: {
    label: 'Marking & Grading',
    description: 'Marking test scripts, homework, and reports',
    defaultColor: 'amber',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  STUDENT_MENTORING: {
    label: 'Student Mentoring',
    description: '1-on-1 tutoring, homeroom guidance & consultation',
    defaultColor: 'teal',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  MEETING: {
    label: 'Meeting / Committee',
    description: 'Departmental meeting, faculty briefing, or PTA',
    defaultColor: 'sky',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  SUPERVISION: {
    label: 'Duty & Supervision',
    description: 'Hall monitoring, lunch supervision, or invigilation',
    defaultColor: 'orange',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  PERSONAL: {
    label: 'Personal & Research',
    description: 'Independent research, reading, or wellness break',
    defaultColor: 'emerald',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
};

// Initial realistic schedule for default teacher (Mr. David Okonjo, f-1)
const SEED_TEACHER_BLOCKS: TeacherPersonalBlock[] = [
  {
    id: 'tpb-1',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'MONDAY',
    periodNumber: 1,
    title: 'Mathematics (Algebra Foundations)',
    activityType: 'CLASS_LESSON',
    classContext: {
      levelName: 'JSS 1',
      armName: 'Diamond',
      subjectName: 'Mathematics',
      room: 'Block A - Room 101',
    },
    room: 'Block A - Room 101',
    notes: 'Introduce algebraic variables and order of operations. Check homework questions 1-10.',
    colorTheme: 'indigo',
    importedFromClassTimetable: true,
    originalClassSlotId: 'tt-1',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-2',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'MONDAY',
    periodNumber: 2,
    title: 'Print Worksheets & Prep Lab Sets',
    activityType: 'PREP_PLANNING',
    room: 'Mathematics Staff Resource Room',
    notes: 'Photocopy 70 sets of geometry workbooks and verify scientific calculators for afternoon cohort.',
    colorTheme: 'violet',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-3',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'MONDAY',
    periodNumber: 4,
    title: 'Mathematics (Fractions & Decimals)',
    activityType: 'CLASS_LESSON',
    classContext: {
      levelName: 'JSS 1',
      armName: 'Gold',
      subjectName: 'Mathematics',
      room: 'Block A - Room 102',
    },
    room: 'Block A - Room 102',
    notes: 'Recap percentage conversions. Pair students for peer worksheet review.',
    colorTheme: 'indigo',
    importedFromClassTimetable: true,
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-4',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'TUESDAY',
    periodNumber: 1,
    title: 'Mathematics (Equations & Word Problems)',
    activityType: 'CLASS_LESSON',
    classContext: {
      levelName: 'JSS 1',
      armName: 'Diamond',
      subjectName: 'Mathematics',
      room: 'Block A - Room 101',
    },
    room: 'Block A - Room 101',
    notes: 'Interactive whiteboard quadratic concepts.',
    colorTheme: 'indigo',
    importedFromClassTimetable: true,
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-5',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'TUESDAY',
    periodNumber: 3,
    title: 'Grade JSS 1 Continuous Assessment 1',
    activityType: 'MARKING_GRADING',
    room: 'Staff Common Room 2B',
    notes: 'Finish grading 65 papers for Diamond and Gold cohorts before Friday gradebook deadline.',
    colorTheme: 'amber',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-6',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'WEDNESDAY',
    periodNumber: 2,
    title: 'HOD STEM Curriculum Review Meeting',
    activityType: 'MEETING',
    room: 'Principal Conference Room',
    notes: 'Present term 1 WAEC mock preparation metrics to Academic Director Claire Sterling.',
    colorTheme: 'sky',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-7',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'WEDNESDAY',
    periodNumber: 7,
    title: 'National Math Olympiad Coaching',
    activityType: 'STUDENT_MENTORING',
    room: 'ICT Computer Lab',
    notes: 'Advanced problem sets for top 5 candidates; past questions from 2023 international rounds.',
    colorTheme: 'teal',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-8',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'THURSDAY',
    periodNumber: 1,
    title: 'Mathematics (Geometry & Angles)',
    activityType: 'CLASS_LESSON',
    classContext: {
      levelName: 'JSS 1',
      armName: 'Diamond',
      subjectName: 'Mathematics',
      room: 'Block A - Room 101',
    },
    room: 'Block A - Room 101',
    notes: 'Protractor and compass practical drawing exercise.',
    colorTheme: 'indigo',
    importedFromClassTimetable: true,
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-9',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'THURSDAY',
    periodNumber: 5,
    title: 'Mid-term Quiz Corrections & Feedback',
    activityType: 'MARKING_GRADING',
    room: 'Block A - Room 101',
    notes: 'Walk through common mistakes on question 4 with student group.',
    colorTheme: 'amber',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-10',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'FRIDAY',
    periodNumber: 2,
    title: 'Term 1 Lesson Planning & Scheme of Work',
    activityType: 'PREP_PLANNING',
    room: 'Mathematics Library',
    notes: 'Submit next week lesson notes to Academic Director portal.',
    colorTheme: 'violet',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpb-11',
    schoolId: TENANT_SCHOOL_ID,
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    day: 'FRIDAY',
    periodNumber: 6,
    title: 'Homeroom Parent Consultations',
    activityType: 'STUDENT_MENTORING',
    room: 'Block A - Room 101',
    notes: 'Scheduled calls with 4 guardians regarding attendance and exam preparations.',
    colorTheme: 'teal',
    hasOfficialClassOverlap: false,
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Retrieve all teacher personal blocks for the tenant.
 */
export function getStoredTeacherBlocks(): TeacherPersonalBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TEACHER_BLOCKS));
      return SEED_TEACHER_BLOCKS;
    }
    const parsed = JSON.parse(raw);
    // Tenant isolation verification
    return parsed.filter((b: TeacherPersonalBlock) => b.schoolId === TENANT_SCHOOL_ID);
  } catch {
    return SEED_TEACHER_BLOCKS;
  }
}

/**
 * Save all teacher personal blocks (strict tenant isolation, NO write to class timetables).
 */
export function saveStoredTeacherBlocks(blocks: TeacherPersonalBlock[]): void {
  try {
    // Ensure all blocks strictly maintain tenant school ID
    const sanitized = blocks.map((b) => ({
      ...b,
      schoolId: TENANT_SCHOOL_ID,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save teacher personal blocks:', err);
  }
}

/**
 * Check if a personal block overlaps with an official assigned class timetable slot.
 * Per Invariant #2, this is STRICTLY INFORMATIONAL (subtle red highlight) and NEVER BLOCKS saving!
 */
export function checkOfficialClassOverlap(
  teacherId: string,
  day: DayOfWeek,
  periodNumber: number,
  blockId?: string,
  allClassSlots: ClassTimetableSlot[] = getStoredTimetableSlots(),
  levels: ClassLevel[] = []
): {
  hasOverlap: boolean;
  officialSlot?: ClassTimetableSlot;
  message?: string;
  details?: {
    subjectName: string;
    levelName: string;
    armName: string;
    room: string;
  };
} {
  // Find if teacher has an official class slot at this day & period
  const officialSlot = allClassSlots.find(
    (s) => s.teacherId === teacherId && s.day === day && s.periodNumber === periodNumber
  );

  if (!officialSlot) {
    return { hasOverlap: false };
  }

  // Find class level & arm name for rich information
  let levelName = 'Class';
  let armName = '';
  for (const lvl of levels) {
    const foundArm = lvl.arms.find((a) => a.id === officialSlot.armId);
    if (foundArm) {
      levelName = lvl.name;
      armName = foundArm.name;
      break;
    }
  }

  return {
    hasOverlap: true,
    officialSlot,
    message: `Informational Overlap: You are officially scheduled to teach ${officialSlot.subjectName} for ${levelName} (${armName}) in ${officialSlot.room} during this period.`,
    details: {
      subjectName: officialSlot.subjectName,
      levelName,
      armName,
      room: officialSlot.room,
    },
  };
}

/**
 * One-time import of assigned class-timetable slots from the official class timetable
 * into the teacher's personal timetable.
 *
 * INVARIANT #2 ENFORCEMENT:
 * - This reads from class timetables, creates independent personal block copies.
 * - Future edits to these blocks NEVER write back to the official timetable.
 */
export function importClassTimetableSlotsForTeacher(
  teacherId: string,
  teacherName: string,
  currentBlocks: TeacherPersonalBlock[],
  levels: ClassLevel[]
): {
  importedCount: number;
  updatedBlocks: TeacherPersonalBlock[];
} {
  const allClassSlots = getStoredTimetableSlots();
  const assignedSlots = allClassSlots.filter(
    (s) => s.teacherId === teacherId || s.teacherName.toLowerCase() === teacherName.toLowerCase()
  );

  if (assignedSlots.length === 0) {
    return { importedCount: 0, updatedBlocks: currentBlocks };
  }

  const existingOtherTeachers = currentBlocks.filter((b) => b.teacherId !== teacherId);
  const teacherExisting = currentBlocks.filter((b) => b.teacherId === teacherId);

  let newImports = 0;
  const newBlocks: TeacherPersonalBlock[] = [...teacherExisting];

  for (const slot of assignedSlots) {
    // Find level and arm name
    let levelName = 'Class';
    let armName = '';
    for (const lvl of levels) {
      const foundArm = lvl.arms.find((a) => a.id === slot.armId);
      if (foundArm) {
        levelName = lvl.name;
        armName = foundArm.name;
        break;
      }
    }

    // Check if slot already exists by matching originalClassSlotId or exact day+period
    const existingIndex = newBlocks.findIndex(
      (b) =>
        b.originalClassSlotId === slot.id ||
        (b.day === slot.day && b.periodNumber === slot.periodNumber && b.activityType === 'CLASS_LESSON')
    );

    const importedBlock: TeacherPersonalBlock = {
      id: `tpb-imported-${Date.now()}-${slot.id}-${Math.random().toString(36).substr(2, 4)}`,
      schoolId: TENANT_SCHOOL_ID,
      teacherId,
      teacherName,
      day: slot.day,
      periodNumber: slot.periodNumber,
      title: `${slot.subjectName} (${levelName} ${armName})`,
      activityType: 'CLASS_LESSON',
      classContext: {
        levelName,
        armName,
        subjectName: slot.subjectName,
        room: slot.room,
      },
      room: slot.room,
      notes: slot.notes || `Official Class Timetable assignment for ${levelName} ${armName}.`,
      colorTheme: slot.colorTheme || 'indigo',
      importedFromClassTimetable: true,
      originalClassSlotId: slot.id,
      hasOfficialClassOverlap: false,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Refresh context without overwriting custom notes if teacher added personal ones
      const existing = newBlocks[existingIndex];
      newBlocks[existingIndex] = {
        ...importedBlock,
        id: existing.id,
        notes: existing.notes || importedBlock.notes,
        colorTheme: existing.colorTheme,
      };
    } else {
      newBlocks.push(importedBlock);
      newImports++;
    }
  }

  const combined = [...existingOtherTeachers, ...newBlocks];
  saveStoredTeacherBlocks(combined);

  return {
    importedCount: newImports,
    updatedBlocks: combined,
  };
}
