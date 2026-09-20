import { ClassLevel, ClassArm, SchoolNomenclature, ArmPointInTimeSnapshot } from '../types';
import { INITIAL_LEVELS } from '../data/mockData';
import { enqueueOfflineAction } from './offline-queue';

const NOMENCLATURE_STORAGE_KEY = 'sms_school_nomenclature_v1';
const LEVELS_STORAGE_KEY = 'sms_levels';
const HISTORICAL_SNAPSHOTS_KEY = 'sms_temporal_class_snapshots_v1';

export const DEFAULT_NOMENCLATURE: SchoolNomenclature = {
  levelTermSingular: 'Class',
  levelTermPlural: 'Classes',
  armTermSingular: 'Arm',
  armTermPlural: 'Arms',
  schoolCurriculum: 'NIGERIAN_NATIONAL',
};

// Preset Hierarchy Templates
export interface HierarchyTemplate {
  id: string;
  name: string;
  description: string;
  curriculum: SchoolNomenclature['schoolCurriculum'];
  defaultLevelTerm: string;
  defaultLevelTermPlural: string;
  defaultArmTerm: string;
  defaultArmTermPlural: string;
  levels: {
    name: string;
    code: string;
    category: 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY' | 'PRIMARY' | 'NURSERY';
    order: number;
    description: string;
  }[];
}

export const HIERARCHY_PRESETS: HierarchyTemplate[] = [
  {
    id: 'nigerian-secondary',
    name: 'Nigerian Secondary (JSS 1 – SSS 3)',
    description: 'Universal Basic Education 9-3-4 system standard tier with Junior & Senior Secondary splits.',
    curriculum: 'NIGERIAN_NATIONAL',
    defaultLevelTerm: 'Class',
    defaultLevelTermPlural: 'Classes',
    defaultArmTerm: 'Arm',
    defaultArmTermPlural: 'Arms',
    levels: [
      { name: 'JSS 1', code: 'JSS1', category: 'JUNIOR_SECONDARY', order: 1, description: 'Junior Secondary Year 1 foundational tier' },
      { name: 'JSS 2', code: 'JSS2', category: 'JUNIOR_SECONDARY', order: 2, description: 'Junior Secondary Year 2 intermediate tier' },
      { name: 'JSS 3', code: 'JSS3', category: 'JUNIOR_SECONDARY', order: 3, description: 'Junior Secondary Year 3 BECE examination tier' },
      { name: 'SSS 1', code: 'SSS1', category: 'SENIOR_SECONDARY', order: 4, description: 'Senior Secondary Year 1 science, arts & commercial split' },
      { name: 'SSS 2', code: 'SSS2', category: 'SENIOR_SECONDARY', order: 5, description: 'Senior Secondary Year 2 WAEC preparation tier' },
      { name: 'SSS 3', code: 'SSS3', category: 'SENIOR_SECONDARY', order: 6, description: 'Senior Secondary Year 3 final graduation & WASSCE tier' },
    ],
  },
  {
    id: 'primary-school',
    name: 'Primary Elementary (Primary 1 – 6)',
    description: 'Comprehensive foundational primary school grades with dedicated classroom homerooms.',
    curriculum: 'NIGERIAN_NATIONAL',
    defaultLevelTerm: 'Class',
    defaultLevelTermPlural: 'Classes',
    defaultArmTerm: 'Stream',
    defaultArmTermPlural: 'Streams',
    levels: [
      { name: 'Primary 1', code: 'PR1', category: 'PRIMARY', order: 1, description: 'Lower Primary Entry Grade' },
      { name: 'Primary 2', code: 'PR2', category: 'PRIMARY', order: 2, description: 'Lower Primary Grade 2' },
      { name: 'Primary 3', code: 'PR3', category: 'PRIMARY', order: 3, description: 'Lower Primary Transition Grade' },
      { name: 'Primary 4', code: 'PR4', category: 'PRIMARY', order: 4, description: 'Upper Primary Grade 4' },
      { name: 'Primary 5', code: 'PR5', category: 'PRIMARY', order: 5, description: 'Upper Primary Grade 5' },
      { name: 'Primary 6', code: 'PR6', category: 'PRIMARY', order: 6, description: 'Graduating Primary Common Entrance Grade' },
    ],
  },
  {
    id: 'british-cambridge',
    name: 'British Cambridge System (Year 7 – Year 13)',
    description: 'Key Stages 3, 4 (IGCSE), and 5 (AS/A-Levels Sixth Form College).',
    curriculum: 'BRITISH_CAMBRIDGE',
    defaultLevelTerm: 'Year',
    defaultLevelTermPlural: 'Years',
    defaultArmTerm: 'Form',
    defaultArmTermPlural: 'Forms',
    levels: [
      { name: 'Year 7', code: 'Y7', category: 'JUNIOR_SECONDARY', order: 1, description: 'Key Stage 3 Entry Year' },
      { name: 'Year 8', code: 'Y8', category: 'JUNIOR_SECONDARY', order: 2, description: 'Key Stage 3 Middle Year' },
      { name: 'Year 9', code: 'Y9', category: 'JUNIOR_SECONDARY', order: 3, description: 'Key Stage 3 Checkpoint Year' },
      { name: 'Year 10', code: 'Y10', category: 'SENIOR_SECONDARY', order: 4, description: 'Key Stage 4 IGCSE First Year' },
      { name: 'Year 11', code: 'Y11', category: 'SENIOR_SECONDARY', order: 5, description: 'Key Stage 4 IGCSE Exam Year' },
      { name: 'Year 12', code: 'Y12', category: 'SENIOR_SECONDARY', order: 6, description: 'Sixth Form Lower Sixth (AS-Level)' },
      { name: 'Year 13', code: 'Y13', category: 'SENIOR_SECONDARY', order: 7, description: 'Sixth Form Upper Sixth (A-Level)' },
    ],
  },
  {
    id: 'american-k12',
    name: 'American K-12 System (Grade 6 – Grade 12)',
    description: 'Middle School (Grades 6–8) and High School (Grades 9–12) college-prep hierarchy.',
    curriculum: 'AMERICAN_K12',
    defaultLevelTerm: 'Grade',
    defaultLevelTermPlural: 'Grades',
    defaultArmTerm: 'Section',
    defaultArmTermPlural: 'Sections',
    levels: [
      { name: 'Grade 6', code: 'G6', category: 'JUNIOR_SECONDARY', order: 1, description: 'Middle School 6th Grade' },
      { name: 'Grade 7', code: 'G7', category: 'JUNIOR_SECONDARY', order: 2, description: 'Middle School 7th Grade' },
      { name: 'Grade 8', code: 'G8', category: 'JUNIOR_SECONDARY', order: 3, description: 'Middle School 8th Grade' },
      { name: 'Grade 9', code: 'G9', category: 'SENIOR_SECONDARY', order: 4, description: 'High School Freshman Year' },
      { name: 'Grade 10', code: 'G10', category: 'SENIOR_SECONDARY', order: 5, description: 'High School Sophomore Year' },
      { name: 'Grade 11', code: 'G11', category: 'SENIOR_SECONDARY', order: 6, description: 'High School Junior Year' },
      { name: 'Grade 12', code: 'G12', category: 'SENIOR_SECONDARY', order: 7, description: 'High School Senior Graduation Year' },
    ],
  },
];

// Preset Arm Naming Patterns
export const ARM_NAMING_PRESETS = [
  { id: 'precious-stones', label: 'Precious Stones', arms: ['Diamond', 'Gold', 'Silver', 'Emerald', 'Ruby', 'Sapphire', 'Topaz'] },
  { id: 'alphabetical', label: 'Alphabetical Letters (A, B, C...)', arms: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  { id: 'colors', label: 'Academy Colors (Blue, Green...)', arms: ['Blue', 'Green', 'Red', 'Yellow', 'Purple', 'Orange'] },
  { id: 'numeric', label: 'Numbered Sections (1, 2, 3...)', arms: ['1', '2', '3', '4', '5', '6'] },
  { id: 'houses', label: 'House Names (Olympus, Phoenix...)', arms: ['Olympus', 'Phoenix', 'Titan', 'Centaur', 'Pegasus', 'Griffin'] },
];

/**
 * Get configured school nomenclature
 */
export function getSchoolNomenclature(): SchoolNomenclature {
  try {
    const raw = localStorage.getItem(NOMENCLATURE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading nomenclature:', err);
  }
  return DEFAULT_NOMENCLATURE;
}

/**
 * Save school nomenclature
 */
export function saveSchoolNomenclature(nomenclature: SchoolNomenclature): void {
  try {
    localStorage.setItem(NOMENCLATURE_STORAGE_KEY, JSON.stringify(nomenclature));
    enqueueOfflineAction('/api/school/nomenclature', 'PUT', nomenclature as unknown as Record<string, unknown>, 'Update School Nomenclature & Terms');
  } catch (err) {
    console.error('Error saving nomenclature:', err);
  }
}

/**
 * Get all stored historical arm snapshots for Invariant #3 Temporal Immutability
 */
export function getHistoricalArmSnapshots(): ArmPointInTimeSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORICAL_SNAPSHOTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading historical snapshots:', err);
  }

  // Pre-seed illustrative point-in-time snapshots demonstrating Invariant #3
  const seedSnapshots: ArmPointInTimeSnapshot[] = [
    {
      id: 'snap-2024-term1-jss1-gold',
      armId: 'arm-jss1-gold',
      levelId: 'lvl-jss-1',
      previousName: 'Gold Stream',
      newName: 'Gold',
      renamedAt: '2024-11-15T10:30:00Z',
      renamedBy: 'Dr. Evelyn Vance (Super Admin)',
      reason: 'Standardized nomenclature for secondary streams',
      academicSessionYear: '2024/2025',
      termName: 'First Term',
      frozenJsonSnapshot: {
        armId: 'arm-jss1-gold',
        levelId: 'lvl-jss-1',
        levelName: 'JSS 1',
        armName: 'Gold Stream',
        code: 'JSS1-GOLD',
        roomNumber: 'Block A - Room 102',
        formMaster: 'Mrs. Rebecca Mensah',
        enrolledCount: 34,
      },
    },
    {
      id: 'snap-2023-term3-sss2-emerald',
      armId: 'arm-sss2-emerald',
      levelId: 'lvl-sss-2',
      previousName: 'Science Section B',
      newName: 'Emerald',
      renamedAt: '2024-04-12T14:20:00Z',
      renamedBy: 'Mrs. Claire Sterling (Academic Director)',
      reason: 'School-wide adoption of gemstone arm taxonomy',
      academicSessionYear: '2023/2024',
      termName: 'Third Term',
      frozenJsonSnapshot: {
        armId: 'arm-sss2-emerald',
        levelId: 'lvl-sss-2',
        levelName: 'SSS 2',
        armName: 'Science Section B',
        code: 'SSS2-SC-B',
        roomNumber: 'Science Complex - Lab 2',
        formMaster: 'Dr. Samuel Okafor',
        enrolledCount: 31,
      },
    },
  ];

  try {
    localStorage.setItem(HISTORICAL_SNAPSHOTS_KEY, JSON.stringify(seedSnapshots));
  } catch {
    // ignore
  }

  return seedSnapshots;
}

/**
 * Record a temporal point-in-time snapshot when an arm or level is renamed.
 * Strictly adheres to Invariant #3: Historical report cards keep old names via point-in-time snapshots.
 */
export function recordArmRenameSnapshot(
  arm: ClassArm,
  level: ClassLevel,
  newName: string,
  performerName: string,
  reason?: string
): ArmPointInTimeSnapshot {
  const snapshots = getHistoricalArmSnapshots();

  const newSnapshot: ArmPointInTimeSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    armId: arm.id,
    levelId: level.id,
    previousName: arm.name,
    newName: newName.trim(),
    renamedAt: new Date().toISOString(),
    renamedBy: performerName || 'System Administrator',
    reason: reason || 'Administrative stream rename',
    academicSessionYear: '2024/2025',
    termName: 'First Term',
    frozenJsonSnapshot: {
      armId: arm.id,
      levelId: level.id,
      levelName: level.name,
      armName: arm.name,
      code: arm.code,
      roomNumber: arm.roomNumber,
      formMaster: arm.teacherName,
      enrolledCount: arm.enrolledCount,
    },
  };

  const updatedSnapshots = [newSnapshot, ...snapshots];
  try {
    localStorage.setItem(HISTORICAL_SNAPSHOTS_KEY, JSON.stringify(updatedSnapshots));
  } catch (err) {
    console.error('Error persisting temporal snapshot:', err);
  }

  return newSnapshot;
}

/**
 * Check if an arm can be safely removed without data loss.
 * Enforces non-destructive rule: never drop or orphan existing students.
 */
export function evaluateArmSafety(arm: ClassArm): {
  isSafeToDelete: boolean;
  enrolledCount: number;
  message: string;
} {
  if (arm.enrolledCount > 0) {
    return {
      isSafeToDelete: false,
      enrolledCount: arm.enrolledCount,
      message: `Arm contains ${arm.enrolledCount} actively enrolled student(s). To preserve data integrity and prevent student loss, you must either migrate students to another arm or mark this arm as Archived.`,
    };
  }
  return {
    isSafeToDelete: true,
    enrolledCount: 0,
    message: 'Arm is currently empty. It can be safely removed with no student impact.',
  };
}
