/**
 * Class Timetables (Admin/Registrar-Owned) Store & Conflict Detection Engine
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: Every slot includes tenant isolation (`schoolId: 'school-apex-001'`).
 * 2. Timetable Decoupling: The class timetable (admin/registrar) and teacher personal timetable
 *    are completely decoupled systems. Do not merge them or let one write to the other.
 */

import {
  ClassTimetableSlot,
  TimeSlotDefinition,
  DayOfWeek,
  TimetableConflict,
  SubjectItem,
  ClassLevel,
} from '../types';

export const TENANT_SCHOOL_ID = 'school-apex-001';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'MONDAY', label: 'Monday', short: 'Mon' },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { key: 'FRIDAY', label: 'Friday', short: 'Fri' },
];

export const TIME_SLOT_DEFINITIONS: TimeSlotDefinition[] = [
  { periodNumber: 1, label: 'Period 1', startTime: '08:00', endTime: '08:45', type: 'LESSON' },
  { periodNumber: 2, label: 'Period 2', startTime: '08:45', endTime: '09:30', type: 'LESSON' },
  { periodNumber: 3, label: 'Period 3', startTime: '09:30', endTime: '10:15', type: 'LESSON' },
  { periodNumber: -1, label: 'Morning Recess', startTime: '10:15', endTime: '10:45', type: 'BREAK', isBreak: true },
  { periodNumber: 4, label: 'Period 4', startTime: '10:45', endTime: '11:30', type: 'LESSON' },
  { periodNumber: 5, label: 'Period 5', startTime: '11:30', endTime: '12:15', type: 'LESSON' },
  { periodNumber: 6, label: 'Period 6', startTime: '12:15', endTime: '13:00', type: 'LESSON' },
  { periodNumber: -2, label: 'Lunch Break', startTime: '13:00', endTime: '13:45', type: 'BREAK', isBreak: true },
  { periodNumber: 7, label: 'Period 7', startTime: '13:45', endTime: '14:30', type: 'LESSON' },
  { periodNumber: 8, label: 'Period 8', startTime: '14:30', endTime: '15:15', type: 'LESSON' },
];

export const SCHOOL_ROOMS: string[] = [
  'Block A - Room 101',
  'Block A - Room 102',
  'Block A - Room 103',
  'Block B - Room 201',
  'Block B - Room 202',
  'Block B - Room 203',
  'Science Lab 1 (Physics/Chem)',
  'Biology Laboratory',
  'ICT Computer Lab (35 Workstations)',
  'Creative Arts & Design Studio',
  'School Auditorium Hall',
  'Outdoor Sports Field',
];

export const CURRICULUM_SUBJECTS: SubjectItem[] = [
  {
    code: 'MTH',
    name: 'Mathematics',
    category: 'CORE',
    defaultTeacherId: 'f-1',
    preferredRoom: 'Block A - Room 101',
    colorTheme: 'indigo',
  },
  {
    code: 'ENG',
    name: 'English Language & Literature',
    category: 'CORE',
    defaultTeacherId: 'f-2',
    preferredRoom: 'Block A - Room 102',
    colorTheme: 'violet',
  },
  {
    code: 'BST',
    name: 'Basic Science & Technology',
    category: 'SCIENCE',
    defaultTeacherId: 'f-3',
    preferredRoom: 'Science Lab 1 (Physics/Chem)',
    colorTheme: 'emerald',
  },
  {
    code: 'SSC',
    name: 'Social Studies & Civic Education',
    category: 'CORE',
    defaultTeacherId: 'f-4',
    preferredRoom: 'Block A - Room 103',
    colorTheme: 'amber',
  },
  {
    code: 'PHY',
    name: 'Physics',
    category: 'SCIENCE',
    defaultTeacherId: 'f-5',
    preferredRoom: 'Science Lab 1 (Physics/Chem)',
    colorTheme: 'cyan',
  },
  {
    code: 'CHM',
    name: 'Chemistry',
    category: 'SCIENCE',
    defaultTeacherId: 'f-6',
    preferredRoom: 'Science Lab 1 (Physics/Chem)',
    colorTheme: 'teal',
  },
  {
    code: 'BIO',
    name: 'Biology',
    category: 'SCIENCE',
    defaultTeacherId: 'f-7',
    preferredRoom: 'Biology Laboratory',
    colorTheme: 'emerald',
  },
  {
    code: 'ICT',
    name: 'Computer Studies & ICT',
    category: 'VOCATIONAL',
    defaultTeacherId: 'f-8',
    preferredRoom: 'ICT Computer Lab (35 Workstations)',
    colorTheme: 'sky',
  },
  {
    code: 'ART',
    name: 'Fine & Applied Arts',
    category: 'VOCATIONAL',
    defaultTeacherId: 'f-9',
    preferredRoom: 'Creative Arts & Design Studio',
    colorTheme: 'rose',
  },
  {
    code: 'ECO',
    name: 'Economics & Commerce',
    category: 'ELECTIVE',
    defaultTeacherId: 'f-10',
    preferredRoom: 'Block B - Room 201',
    colorTheme: 'orange',
  },
];

// Initial pre-populated schedule for JSS 1 (lvl-jss-1 / arm-jss1-diamond & arm-jss1-gold)
const SEED_TIMETABLE_SLOTS: ClassTimetableSlot[] = [
  // Monday JSS 1 Diamond
  {
    id: 'tt-1',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'MONDAY',
    periodNumber: 1,
    subjectName: 'Mathematics',
    subjectCode: 'MTH',
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    room: 'Block A - Room 101',
    colorTheme: 'indigo',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-2',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'MONDAY',
    periodNumber: 2,
    subjectName: 'English Language & Literature',
    subjectCode: 'ENG',
    teacherId: 'f-2',
    teacherName: 'Mrs. Rebecca Mensah',
    room: 'Block A - Room 101',
    colorTheme: 'violet',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-3',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'MONDAY',
    periodNumber: 3,
    subjectName: 'Basic Science & Technology',
    subjectCode: 'BST',
    teacherId: 'f-3',
    teacherName: 'Dr. Samuel Okafor',
    room: 'Science Lab 1 (Physics/Chem)',
    colorTheme: 'emerald',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-4',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'MONDAY',
    periodNumber: 4,
    subjectName: 'Social Studies & Civic Education',
    subjectCode: 'SSC',
    teacherId: 'f-4',
    teacherName: 'Ms. Grace Danladi',
    room: 'Block A - Room 101',
    colorTheme: 'amber',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-5',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'MONDAY',
    periodNumber: 5,
    subjectName: 'Computer Studies & ICT',
    subjectCode: 'ICT',
    teacherId: 'f-8',
    teacherName: 'Ms. Ngozi Nwosu',
    room: 'ICT Computer Lab (35 Workstations)',
    colorTheme: 'sky',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-6',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'MONDAY',
    periodNumber: 6,
    subjectName: 'Fine & Applied Arts',
    subjectCode: 'ART',
    teacherId: 'f-9',
    teacherName: 'Mr. Patrick Osei',
    room: 'Creative Arts & Design Studio',
    colorTheme: 'rose',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },

  // Tuesday JSS 1 Diamond
  {
    id: 'tt-7',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'TUESDAY',
    periodNumber: 1,
    subjectName: 'English Language & Literature',
    subjectCode: 'ENG',
    teacherId: 'f-2',
    teacherName: 'Mrs. Rebecca Mensah',
    room: 'Block A - Room 101',
    colorTheme: 'violet',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-8',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'TUESDAY',
    periodNumber: 2,
    subjectName: 'Mathematics',
    subjectCode: 'MTH',
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    room: 'Block A - Room 101',
    colorTheme: 'indigo',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-9',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'TUESDAY',
    periodNumber: 3,
    subjectName: 'Computer Studies & ICT',
    subjectCode: 'ICT',
    teacherId: 'f-8',
    teacherName: 'Ms. Ngozi Nwosu',
    room: 'ICT Computer Lab (35 Workstations)',
    colorTheme: 'sky',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-10',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'TUESDAY',
    periodNumber: 4,
    subjectName: 'Basic Science & Technology',
    subjectCode: 'BST',
    teacherId: 'f-3',
    teacherName: 'Dr. Samuel Okafor',
    room: 'Science Lab 1 (Physics/Chem)',
    colorTheme: 'emerald',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-11',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'TUESDAY',
    periodNumber: 5,
    subjectName: 'Social Studies & Civic Education',
    subjectCode: 'SSC',
    teacherId: 'f-4',
    teacherName: 'Ms. Grace Danladi',
    room: 'Block A - Room 101',
    colorTheme: 'amber',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },

  // Wednesday JSS 1 Diamond
  {
    id: 'tt-12',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'WEDNESDAY',
    periodNumber: 1,
    subjectName: 'Basic Science & Technology',
    subjectCode: 'BST',
    teacherId: 'f-3',
    teacherName: 'Dr. Samuel Okafor',
    room: 'Science Lab 1 (Physics/Chem)',
    colorTheme: 'emerald',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-13',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'WEDNESDAY',
    periodNumber: 2,
    subjectName: 'Mathematics',
    subjectCode: 'MTH',
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    room: 'Block A - Room 101',
    colorTheme: 'indigo',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-14',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'WEDNESDAY',
    periodNumber: 3,
    subjectName: 'English Language & Literature',
    subjectCode: 'ENG',
    teacherId: 'f-2',
    teacherName: 'Mrs. Rebecca Mensah',
    room: 'Block A - Room 101',
    colorTheme: 'violet',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-15',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'WEDNESDAY',
    periodNumber: 4,
    subjectName: 'Fine & Applied Arts',
    subjectCode: 'ART',
    teacherId: 'f-9',
    teacherName: 'Mr. Patrick Osei',
    room: 'Creative Arts & Design Studio',
    colorTheme: 'rose',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },

  // Thursday JSS 1 Diamond
  {
    id: 'tt-16',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'THURSDAY',
    periodNumber: 1,
    subjectName: 'Mathematics',
    subjectCode: 'MTH',
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    room: 'Block A - Room 101',
    colorTheme: 'indigo',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-17',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'THURSDAY',
    periodNumber: 2,
    subjectName: 'English Language & Literature',
    subjectCode: 'ENG',
    teacherId: 'f-2',
    teacherName: 'Mrs. Rebecca Mensah',
    room: 'Block A - Room 101',
    colorTheme: 'violet',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-18',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'THURSDAY',
    periodNumber: 3,
    subjectName: 'Social Studies & Civic Education',
    subjectCode: 'SSC',
    teacherId: 'f-4',
    teacherName: 'Ms. Grace Danladi',
    room: 'Block A - Room 101',
    colorTheme: 'amber',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-19',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'THURSDAY',
    periodNumber: 4,
    subjectName: 'Computer Studies & ICT',
    subjectCode: 'ICT',
    teacherId: 'f-8',
    teacherName: 'Ms. Ngozi Nwosu',
    room: 'ICT Computer Lab (35 Workstations)',
    colorTheme: 'sky',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },

  // Friday JSS 1 Diamond
  {
    id: 'tt-20',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'FRIDAY',
    periodNumber: 1,
    subjectName: 'English Language & Literature',
    subjectCode: 'ENG',
    teacherId: 'f-2',
    teacherName: 'Mrs. Rebecca Mensah',
    room: 'Block A - Room 101',
    colorTheme: 'violet',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-21',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'FRIDAY',
    periodNumber: 2,
    subjectName: 'Basic Science & Technology',
    subjectCode: 'BST',
    teacherId: 'f-3',
    teacherName: 'Dr. Samuel Okafor',
    room: 'Science Lab 1 (Physics/Chem)',
    colorTheme: 'emerald',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-22',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'FRIDAY',
    periodNumber: 3,
    subjectName: 'Mathematics',
    subjectCode: 'MTH',
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    room: 'Block A - Room 101',
    colorTheme: 'indigo',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-23',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-diamond',
    day: 'FRIDAY',
    periodNumber: 4,
    subjectName: 'Fine & Applied Arts',
    subjectCode: 'ART',
    teacherId: 'f-9',
    teacherName: 'Mr. Patrick Osei',
    room: 'Creative Arts & Design Studio',
    colorTheme: 'rose',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },

  // Parallel Arm: JSS 1 Gold (Monday periods designed to demonstrate valid schedule without clash)
  {
    id: 'tt-24',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-gold',
    day: 'MONDAY',
    periodNumber: 1,
    subjectName: 'English Language & Literature',
    subjectCode: 'ENG',
    teacherId: 'f-2',
    teacherName: 'Mrs. Rebecca Mensah',
    room: 'Block A - Room 102',
    colorTheme: 'violet',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-25',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-gold',
    day: 'MONDAY',
    periodNumber: 2,
    subjectName: 'Basic Science & Technology',
    subjectCode: 'BST',
    teacherId: 'f-3',
    teacherName: 'Dr. Samuel Okafor',
    room: 'Block A - Room 102',
    colorTheme: 'emerald',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
  {
    id: 'tt-26',
    schoolId: TENANT_SCHOOL_ID,
    levelId: 'lvl-jss-1',
    armId: 'arm-jss1-gold',
    day: 'MONDAY',
    periodNumber: 3,
    subjectName: 'Mathematics',
    subjectCode: 'MTH',
    teacherId: 'f-1',
    teacherName: 'Mr. David Okonjo',
    room: 'Block A - Room 102',
    colorTheme: 'indigo',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dean Claire Sterling',
  },
];

const LOCAL_STORAGE_KEY = 'sms_class_timetables_v1';

export function getStoredTimetableSlots(): ClassTimetableSlot[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_TIMETABLE_SLOTS));
      return SEED_TIMETABLE_SLOTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_TIMETABLE_SLOTS;
  } catch (err) {
    console.error('Failed to parse timetable slots from storage', err);
    return SEED_TIMETABLE_SLOTS;
  }
}

export function saveStoredTimetableSlots(slots: ClassTimetableSlot[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slots));
  } catch (err) {
    console.error('Failed to save timetable slots to storage', err);
  }
}

/**
 * Conflict Detection Engine
 * Scans all slots across all classes to find:
 * 1. TEACHER_DOUBLE_BOOKED: Same teacher scheduled in 2 different classes during the same day and period.
 * 2. ROOM_DOUBLE_BOOKED: Same room assigned to 2 different classes during the same day and period.
 */
export function detectAllConflicts(
  slots: ClassTimetableSlot[],
  levels: ClassLevel[]
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];

  // Helper to get arm name and level name
  const getClassLabels = (armId: string) => {
    for (const lvl of levels) {
      const arm = lvl.arms.find((a) => a.id === armId);
      if (arm) {
        return { armName: arm.name, levelName: lvl.name };
      }
    }
    return { armName: armId, levelName: 'Class' };
  };

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slotA = slots[i];
      const slotB = slots[j];

      // Only compare slots on the same day and same period number
      if (slotA.day === slotB.day && slotA.periodNumber === slotB.periodNumber) {
        // Different classes/arms
        if (slotA.armId !== slotB.armId) {
          const periodDef = TIME_SLOT_DEFINITIONS.find((t) => t.periodNumber === slotA.periodNumber);
          const periodLabel = periodDef ? `${periodDef.label} (${periodDef.startTime} - ${periodDef.endTime})` : `Period ${slotA.periodNumber}`;
          const classA = getClassLabels(slotA.armId);
          const classB = getClassLabels(slotB.armId);

          // 1. Teacher Collision
          if (slotA.teacherId && slotB.teacherId && slotA.teacherId === slotB.teacherId) {
            conflicts.push({
              id: `conflict-teacher-${slotA.id}-${slotB.id}`,
              type: 'TEACHER_DOUBLE_BOOKED',
              day: slotA.day,
              periodNumber: slotA.periodNumber,
              periodLabel,
              conflictingEntityName: slotA.teacherName,
              firstClass: {
                armId: slotA.armId,
                armName: classA.armName,
                levelName: classA.levelName,
                subjectName: slotA.subjectName,
              },
              secondClass: {
                armId: slotB.armId,
                armName: classB.armName,
                levelName: classB.levelName,
                subjectName: slotB.subjectName,
              },
              message: `Teacher Conflict: ${slotA.teacherName} is double-booked on ${slotA.day} during ${periodLabel} between ${classA.levelName} ${classA.armName} and ${classB.levelName} ${classB.armName}.`,
            });
          }

          // 2. Room Collision
          if (slotA.room && slotB.room && slotA.room.trim().toLowerCase() === slotB.room.trim().toLowerCase()) {
            conflicts.push({
              id: `conflict-room-${slotA.id}-${slotB.id}`,
              type: 'ROOM_DOUBLE_BOOKED',
              day: slotA.day,
              periodNumber: slotA.periodNumber,
              periodLabel,
              conflictingEntityName: slotA.room,
              firstClass: {
                armId: slotA.armId,
                armName: classA.armName,
                levelName: classA.levelName,
                subjectName: slotA.subjectName,
              },
              secondClass: {
                armId: slotB.armId,
                armName: classB.armName,
                levelName: classB.levelName,
                subjectName: slotB.subjectName,
              },
              message: `Room Collision: ${slotA.room} is assigned to both ${classA.levelName} ${classA.armName} (${slotA.subjectName}) and ${classB.levelName} ${classB.armName} (${slotB.subjectName}) on ${slotA.day}, ${periodLabel}.`,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Checks if a proposed or moved slot will cause a conflict before applying it.
 */
export function checkProposedSlotConflict(
  proposed: Omit<ClassTimetableSlot, 'id'>,
  existingSlots: ClassTimetableSlot[],
  currentSlotId?: string,
  levels: ClassLevel[] = []
): TimetableConflict | null {
  const getClassLabels = (armId: string) => {
    for (const lvl of levels) {
      const arm = lvl.arms.find((a) => a.id === armId);
      if (arm) return { armName: arm.name, levelName: lvl.name };
    }
    return { armName: armId, levelName: 'Class' };
  };

  const periodDef = TIME_SLOT_DEFINITIONS.find((t) => t.periodNumber === proposed.periodNumber);
  const periodLabel = periodDef ? `${periodDef.label} (${periodDef.startTime} - ${periodDef.endTime})` : `Period ${proposed.periodNumber}`;
  const proposedClass = getClassLabels(proposed.armId);

  for (const existing of existingSlots) {
    if (existing.id === currentSlotId) continue;

    if (existing.day === proposed.day && existing.periodNumber === proposed.periodNumber) {
      if (existing.armId !== proposed.armId) {
        const existingClass = getClassLabels(existing.armId);

        // Teacher double-booking check
        if (proposed.teacherId && existing.teacherId === proposed.teacherId) {
          return {
            id: `conflict-check-teacher-${Date.now()}`,
            type: 'TEACHER_DOUBLE_BOOKED',
            day: proposed.day,
            periodNumber: proposed.periodNumber,
            periodLabel,
            conflictingEntityName: proposed.teacherName,
            firstClass: {
              armId: proposed.armId,
              armName: proposedClass.armName,
              levelName: proposedClass.levelName,
              subjectName: proposed.subjectName,
            },
            secondClass: {
              armId: existing.armId,
              armName: existingClass.armName,
              levelName: existingClass.levelName,
              subjectName: existing.subjectName,
            },
            message: `Teacher Collision: ${proposed.teacherName} is already scheduled in ${existingClass.levelName} ${existingClass.armName} (${existing.subjectName}) on ${proposed.day} during ${periodLabel}.`,
          };
        }

        // Room double-booking check
        if (proposed.room && existing.room && proposed.room.trim().toLowerCase() === existing.room.trim().toLowerCase()) {
          return {
            id: `conflict-check-room-${Date.now()}`,
            type: 'ROOM_DOUBLE_BOOKED',
            day: proposed.day,
            periodNumber: proposed.periodNumber,
            periodLabel,
            conflictingEntityName: proposed.room,
            firstClass: {
              armId: proposed.armId,
              armName: proposedClass.armName,
              levelName: proposedClass.levelName,
              subjectName: proposed.subjectName,
            },
            secondClass: {
              armId: existing.armId,
              armName: existingClass.armName,
              levelName: existingClass.levelName,
              subjectName: existing.subjectName,
            },
            message: `Room Collision: ${proposed.room} is already booked by ${existingClass.levelName} ${existingClass.armName} (${existing.subjectName}) on ${proposed.day} during ${periodLabel}.`,
          };
        }
      }
    }
  }

  return null;
}
