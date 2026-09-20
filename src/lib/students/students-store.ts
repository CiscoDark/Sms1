import { Student, AcademicRecordSnapshot, UserProfile } from '../../types';
import { getStoredStudents, saveStudents } from '../migration-store';
import { enqueueOfflineAction } from '../offline-queue';

const STATES_OF_ORIGIN = [
  'Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Edo', 'Delta', 'Rivers',
  'Anambra', 'Enugu', 'Imo', 'Abia', 'Kano', 'Kaduna', 'Kwara', 'FCT Abuja'
];

const GENOTYPES = ['AA', 'AA', 'AA', 'AS', 'AS', 'AC'];

const ALLERGIES_LIST = [
  ['Peanuts / Groundnuts'],
  ['Penicillin antibiotics'],
  ['Asthma (dust & pollen triggers)'],
  ['Lactose intolerance'],
  ['Shellfish / Seafood'],
  ['None known'],
  ['None known'],
  ['None known'],
];

const MEDICAL_NOTES_LIST = [
  'Carry prescribed salbutamol inhaler for sports and PE activities.',
  'Mild allergic rhinitis in dry season; antihistamines provided by parent.',
  'Requires corrective lenses for chalkboard and digital projector viewing.',
  'Routine annual physical completed; fit for full athletic participation.',
  'No chronic conditions recorded. Immunizations fully up to date.',
  'Lactose intolerant - strictly substitute dairy with soya in school cafeteria meals.',
];

// Helper to generate realistic temporal academic snapshots
function generateHistoricalSnapshots(student: Student): AcademicRecordSnapshot[] {
  const snapshots: AcademicRecordSnapshot[] = [];
  const level = student.classLevel;

  // If student is in JSS 2, they have JSS 1 records from 2023/2024
  if (level.includes('JSS 2')) {
    snapshots.push(
      {
        id: `snap-${student.id}-1`,
        sessionYear: '2023/2024',
        termName: 'First Term',
        classLevel: 'JSS 1',
        classArm: student.classArm,
        averageScore: 82.4,
        grade: 'A',
        positionInClass: 5,
        totalInClass: 35,
        attendanceRate: 98.2,
        promotionStatus: 'CURRENT',
        principalRemarks: 'Strong academic foundation demonstrated across STEM subjects.',
        snapshotTimestamp: '2023-12-15T12:00:00Z',
      },
      {
        id: `snap-${student.id}-2`,
        sessionYear: '2023/2024',
        termName: 'Second Term',
        classLevel: 'JSS 1',
        classArm: student.classArm,
        averageScore: 85.1,
        grade: 'A',
        positionInClass: 4,
        totalInClass: 35,
        attendanceRate: 97.5,
        promotionStatus: 'CURRENT',
        principalRemarks: 'Consistent diligence and active classroom participation.',
        snapshotTimestamp: '2024-04-05T12:00:00Z',
      },
      {
        id: `snap-${student.id}-3`,
        sessionYear: '2023/2024',
        termName: 'Third Term',
        classLevel: 'JSS 1',
        classArm: student.classArm,
        averageScore: 86.8,
        grade: 'A',
        positionInClass: 3,
        totalInClass: 35,
        attendanceRate: 99.0,
        promotionStatus: 'PROMOTED',
        promotedTo: 'JSS 2',
        promotedDate: '2024-07-20',
        principalRemarks: 'Promoted to JSS 2 with honors. Exemplary conduct and academic excellence.',
        snapshotTimestamp: '2024-07-20T12:00:00Z',
      }
    );
  } else if (level.includes('JSS 3')) {
    snapshots.push({
      id: `snap-${student.id}-1`,
      sessionYear: '2023/2024',
      termName: 'Third Term',
      classLevel: 'JSS 2',
      classArm: student.classArm,
      averageScore: 81.2,
      grade: 'A',
      positionInClass: 7,
      totalInClass: 36,
      attendanceRate: 96.5,
      promotionStatus: 'PROMOTED',
      promotedTo: 'JSS 3',
      promotedDate: '2024-07-20',
      principalRemarks: 'Promoted to JSS 3. Keep preparing for the BECE junior WAEC examinations.',
      snapshotTimestamp: '2024-07-20T12:00:00Z',
    });
  } else if (level.includes('SSS 1')) {
    snapshots.push({
      id: `snap-${student.id}-1`,
      sessionYear: '2023/2024',
      termName: 'Third Term',
      classLevel: 'JSS 3',
      classArm: student.classArm,
      averageScore: 88.4,
      grade: 'A+',
      positionInClass: 2,
      totalInClass: 34,
      attendanceRate: 98.8,
      promotionStatus: 'PROMOTED',
      promotedTo: 'SSS 1',
      promotedDate: '2024-07-20',
      principalRemarks: 'Outstanding BECE results. Transitioned seamlessly into Senior Secondary.',
      snapshotTimestamp: '2024-07-20T12:00:00Z',
    });
  } else if (level.includes('SSS 2') || level.includes('SSS 3')) {
    snapshots.push(
      {
        id: `snap-${student.id}-1`,
        sessionYear: '2022/2023',
        termName: 'Third Term',
        classLevel: level.includes('SSS 3') ? 'SSS 1' : 'JSS 3',
        classArm: student.classArm,
        averageScore: 84.0,
        grade: 'A',
        positionInClass: 4,
        totalInClass: 32,
        attendanceRate: 97.0,
        promotionStatus: 'PROMOTED',
        promotedTo: level.includes('SSS 3') ? 'SSS 2' : 'SSS 1',
        promotedDate: '2023-07-22',
        principalRemarks: 'Promoted with commendable grades in Core Science & Quantitative Reasoning.',
        snapshotTimestamp: '2023-07-22T12:00:00Z',
      },
      {
        id: `snap-${student.id}-2`,
        sessionYear: '2023/2024',
        termName: 'Third Term',
        classLevel: level.includes('SSS 3') ? 'SSS 2' : 'SSS 1',
        classArm: student.classArm,
        averageScore: 87.5,
        grade: 'A',
        positionInClass: 3,
        totalInClass: 33,
        attendanceRate: 98.5,
        promotionStatus: 'PROMOTED',
        promotedTo: level,
        promotedDate: '2024-07-20',
        principalRemarks: 'Strong analytical prowess demonstrated. Promoted in regular standing.',
        snapshotTimestamp: '2024-07-20T12:00:00Z',
      }
    );
  }

  return snapshots;
}

// Ensure all student records have enriched profile data
export function getEnrichedStudents(): Student[] {
  const rawStudents = getStoredStudents();
  let hasModifications = false;

  const enriched = rawStudents.map((s, index) => {
    let modified = false;
    const updated = { ...s };

    if (!updated.nationality) {
      updated.nationality = 'Nigerian';
      modified = true;
    }

    if (!updated.stateOfOrigin) {
      updated.stateOfOrigin = STATES_OF_ORIGIN[index % STATES_OF_ORIGIN.length];
      modified = true;
    }

    if (!updated.genotype) {
      updated.genotype = GENOTYPES[index % GENOTYPES.length];
      modified = true;
    }

    if (!updated.allergies || updated.allergies.length === 0) {
      updated.allergies = ALLERGIES_LIST[index % ALLERGIES_LIST.length];
      modified = true;
    }

    if (!updated.medicalNotes) {
      updated.medicalNotes = MEDICAL_NOTES_LIST[index % MEDICAL_NOTES_LIST.length];
      modified = true;
    }

    if (!updated.emergencyContactName) {
      updated.emergencyContactName = updated.guardianName;
      updated.emergencyContactPhone = updated.guardianPhone;
      modified = true;
    }

    if (!updated.residentialAddress) {
      updated.residentialAddress = `${12 + (index % 45)} Adeola Odeku St / Victoria Island, Lagos`;
      modified = true;
    }

    if (!updated.guardianRelationship) {
      updated.guardianRelationship = index % 2 === 0 ? 'Father' : 'Mother';
      modified = true;
    }

    if (!updated.guardianOccupation) {
      const occupations = [
        'Chartered Accountant',
        'Senior Software Architect',
        'Commercial Attorney',
        'Surgeon',
        'Civil Engineer',
        'Director of Human Resources',
        'Senior Banker'
      ];
      updated.guardianOccupation = occupations[index % occupations.length];
      modified = true;
    }

    if (!updated.academicHistory) {
      updated.academicHistory = generateHistoricalSnapshots(updated);
      modified = true;
    }

    if (modified) {
      hasModifications = true;
    }

    return updated;
  });

  if (hasModifications) {
    saveStudents(enriched);
  }

  return enriched;
}

export function updateStudentProfile(
  studentId: string,
  updates: Partial<Student>,
  performer: UserProfile
): Student[] {
  const current = getEnrichedStudents();
  const updatedStudents = current.map((s) => {
    if (s.id !== studentId) return s;
    return { ...s, ...updates };
  });

  saveStudents(updatedStudents);

  enqueueOfflineAction(
    '/api/students/update',
    'PATCH',
    { studentId, updates, updatedBy: performer.id },
    `Updated profile for student ${studentId}`
  );

  return updatedStudents;
}

export function recordStudentPromotion(
  studentId: string,
  snapshot: AcademicRecordSnapshot,
  performer: UserProfile
): Student[] {
  const current = getEnrichedStudents();
  const updatedStudents = current.map((s) => {
    if (s.id !== studentId) return s;
    const history = s.academicHistory || [];
    const newHistory = [snapshot, ...history];
    const newLevel = snapshot.promotedTo || s.classLevel;

    return {
      ...s,
      classLevel: newLevel,
      academicHistory: newHistory,
    };
  });

  saveStudents(updatedStudents);

  enqueueOfflineAction(
    '/api/students/promotion',
    'POST',
    { studentId, snapshot, promotedBy: performer.name },
    `Recorded promotion snapshot for student ${studentId} to ${snapshot.promotedTo}`
  );

  return updatedStudents;
}
