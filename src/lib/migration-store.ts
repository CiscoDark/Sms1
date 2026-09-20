import { Student, Staff, FeePayment, ClassLevel } from '../types';
import { enqueueOfflineAction } from './offline-queue';
import { INITIAL_LEVELS } from '../data/mockData';
import {
  generateRealisticStudentCohort,
  generateRealisticStaffCohort,
  generateRealisticFeesCohort,
} from './importer/mockDatasetGenerator';

const STORAGE_KEYS = {
  STUDENTS: 'sms_students',
  STAFF: 'sms_staff',
  FEES: 'sms_fees',
};

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) return JSON.parse(raw);

    // First time initialization: Seed realistic 250+ student cohort
    const seeded = generateRealisticStudentCohort(INITIAL_LEVELS);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(seeded));
    return seeded;
  } catch {
    return generateRealisticStudentCohort(INITIAL_LEVELS);
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    enqueueOfflineAction('/api/students/bulk-save', 'POST', { count: students.length }, 'Persisted student directory');
  } catch (err) {
    console.error('Failed to save students to localStorage', err);
  }
}

export function getStoredStaff(): Staff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (raw) return JSON.parse(raw);

    // First time initialization: Seed realistic staff directory
    const seeded = generateRealisticStaffCohort();
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(seeded));
    return seeded;
  } catch {
    return generateRealisticStaffCohort();
  }
}

export function saveStaff(staff: Staff[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
    enqueueOfflineAction('/api/staff/bulk-save', 'POST', { count: staff.length }, 'Persisted staff directory');
  } catch (err) {
    console.error('Failed to save staff to localStorage', err);
  }
}

export function getStoredFees(): FeePayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEES);
    if (raw) return JSON.parse(raw);

    // First time initialization: Seed realistic historical fee records
    const students = getStoredStudents();
    const seeded = generateRealisticFeesCohort(students);
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveFees(fees: FeePayment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees));
    enqueueOfflineAction('/api/fees/bulk-save', 'POST', { count: fees.length }, 'Persisted fee payments ledger');
  } catch (err) {
    console.error('Failed to save fees to localStorage', err);
  }
}

// Dynamically recalculate arm enrolled counts, male and female breakdown from actual student records
export function syncLevelArmEnrollments(levels: ClassLevel[], students: Student[]): ClassLevel[] {
  return levels.map((lvl) => {
    const updatedArms = lvl.arms.map((arm) => {
      const armStudents = students.filter(
        (s) =>
          (s.classLevel.toLowerCase() === lvl.name.toLowerCase() ||
           s.classLevel.toLowerCase() === lvl.code.toLowerCase()) &&
          (s.classArm.toLowerCase() === arm.name.toLowerCase() ||
           s.classArm.toLowerCase() === arm.code.toLowerCase() ||
           arm.name.toLowerCase().includes(s.classArm.toLowerCase()) ||
           s.classArm.toLowerCase().includes(arm.name.toLowerCase()))
      );

      if (armStudents.length === 0) {
        return arm; // Keep existing counts if no imported students in this arm
      }

      const maleCount = armStudents.filter((s) => s.gender === 'M').length;
      const femaleCount = armStudents.filter((s) => s.gender === 'F').length;

      return {
        ...arm,
        enrolledCount: armStudents.length,
        maleCount,
        femaleCount,
      };
    });

    return {
      ...lvl,
      arms: updatedArms,
    };
  });
}
