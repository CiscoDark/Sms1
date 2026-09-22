/**
 * STEP 21 — Disciplinary Records Store
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: All queries & mutations enforce `school_id: 'school-apex-01'`.
 * 2. Academic Decoupling: Disciplinary records MUST NEVER affect academic grades, GPAs, or rank calculations.
 * 3. Public & Student Privacy: NEVER exposed on public QR credential verification, student portal, or report cards.
 * 4. Controlled Parent Exposure: Only admin-approved sanitized summaries may be exposed to parents if explicitly approved.
 * 5. Full Audit Trail: All creations, edits, and parent-exposure approvals are audited.
 */

import { DisciplinaryRecord, DisciplinarySeverity, DisciplinaryAction, DisciplinaryStatus } from '../types';
import { enqueueOfflineAction } from './offline-queue';

const DISCIPLINARY_STORAGE_KEY = 'sms_disciplinary_records_v1';
const DEFAULT_SCHOOL_ID = 'school-apex-01';

export const INITIAL_DISCIPLINARY_RECORDS: DisciplinaryRecord[] = [
  {
    id: 'disc-2024-001',
    school_id: DEFAULT_SCHOOL_ID,
    studentId: 'std-1',
    studentName: 'Chinedu Adeleke',
    admissionNumber: 'APA/2024/001',
    classLevel: 'SSS 1',
    classArm: 'Diamond',
    incidentDate: '2024-10-14',
    category: 'Classroom Disruption & Tardiness',
    description: 'Arrived 25 minutes late to Physics lab and repeatedly distracted lab partners during practical experiment with high-voltage equipment.',
    severity: 'MEDIUM',
    actionTaken: 'WRITTEN_WARNING',
    actionDetails: 'Issued formal written warning and assigned 30 minutes of lab apparatus cleanup under supervision.',
    followUpNotes: 'Student showed remorse, completed cleaning duty promptly, and apologized to Mrs. Adeleke.',
    followUpDate: '2024-10-21',
    status: 'RESOLVED',
    recordedBy: 'Mrs. Chioma Adeleke',
    recorderRole: 'Subject Teacher',
    createdAt: '2024-10-14T11:45:00Z',
    updatedAt: '2024-10-21T14:30:00Z',
    isExposedToParent: true,
    parentApprovedSummary: 'Chinedu received a formal verbal and written warning regarding lab punctuality and safety protocols on Oct 14. He fulfilled the reflective cleanup task conscientiously with no repeat incidents.',
    parentApprovedBy: 'Dr. Kunle Adeleke (Admin)',
    parentApprovedAt: '2024-10-15T09:00:00Z',
  },
  {
    id: 'disc-2024-002',
    school_id: DEFAULT_SCHOOL_ID,
    studentId: 'std-3',
    studentName: 'Babatunde Fashola',
    admissionNumber: 'APA/2024/003',
    classLevel: 'SSS 1',
    classArm: 'Diamond',
    incidentDate: '2024-11-04',
    category: 'Academic Dishonesty',
    description: 'Discovered possessing unauthorized handwritten formula notes tucked inside an approved scientific calculator during Mid-Term Chemistry CA test.',
    severity: 'HIGH',
    actionTaken: 'COUNSELING_REFERRAL',
    actionDetails: 'Mid-term test paper invalidated; assigned alternative retake with 15% moral penalty on CA component (strictly for this single test incident). Referred to School Guidance Counselor.',
    followUpNotes: 'First session with Counselor Mrs. Mensah completed. Identified test anxiety as root trigger.',
    followUpDate: '2024-11-18',
    status: 'UNDER_OBSERVATION',
    recordedBy: 'Mr. Kenneth Bruce',
    recorderRole: 'Exam Invigilator',
    createdAt: '2024-11-04T10:15:00Z',
    updatedAt: '2024-11-12T16:00:00Z',
    isExposedToParent: true,
    parentApprovedSummary: 'Babatunde attended a pastoral and academic ethics counseling session following an irregularity noted during Mid-Term assessments. He is cooperating proactively with the counseling department.',
    parentApprovedBy: 'Dr. Kunle Adeleke (Admin)',
    parentApprovedAt: '2024-11-05T11:20:00Z',
  },
  {
    id: 'disc-2024-003',
    school_id: DEFAULT_SCHOOL_ID,
    studentId: 'std-5',
    studentName: 'Zainab Dangote',
    admissionNumber: 'APA/2024/005',
    classLevel: 'JSS 1',
    classArm: 'Gold',
    incidentDate: '2024-11-20',
    category: 'Bullying/Peer Altercation',
    description: 'Verbal confrontation and shoving near cafeteria queue during lunch break regarding skipping the line.',
    severity: 'MEDIUM',
    actionTaken: 'COMMUNITY_SERVICE',
    actionDetails: 'Assigned 3 days of dining hall orderly duty and mediated reconciliation with peer.',
    followUpNotes: 'Both students signed mutual respect pledge in the Dean of Students office.',
    followUpDate: '2024-11-27',
    status: 'RESOLVED',
    recordedBy: 'Mr. David Okonjo',
    recorderRole: 'Duty Master',
    createdAt: '2024-11-20T13:40:00Z',
    updatedAt: '2024-11-27T15:10:00Z',
    isExposedToParent: false, // School kept internal to avoid undue peer stigma
  },
  {
    id: 'disc-2024-004',
    school_id: DEFAULT_SCHOOL_ID,
    studentId: 'std-2',
    studentName: 'Fatima Al-Hassan',
    admissionNumber: 'APA/2024/002',
    classLevel: 'SSS 1',
    classArm: 'Ruby',
    incidentDate: '2024-12-02',
    category: 'Uniform/Dress Code Infraction',
    description: 'Non-regulation sports footwear and unauthorized jewelry worn on formal assembly day.',
    severity: 'LOW',
    actionTaken: 'VERBAL_WARNING',
    actionDetails: 'Items confiscated until end of school day; student informed of school handbook standards.',
    status: 'RESOLVED',
    recordedBy: 'Ms. Grace Danladi',
    recorderRole: 'Class Teacher',
    createdAt: '2024-12-02T08:10:00Z',
    updatedAt: '2024-12-02T08:10:00Z',
    isExposedToParent: false,
  },
];

export function getDisciplinaryRecords(): DisciplinaryRecord[] {
  try {
    const raw = localStorage.getItem(DISCIPLINARY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DISCIPLINARY_STORAGE_KEY, JSON.stringify(INITIAL_DISCIPLINARY_RECORDS));
      return INITIAL_DISCIPLINARY_RECORDS;
    }
    const parsed: DisciplinaryRecord[] = JSON.parse(raw);
    // Tenant isolation filter
    return parsed.filter((r) => !r.school_id || r.school_id === DEFAULT_SCHOOL_ID);
  } catch (err) {
    console.error('Failed to load disciplinary records from storage:', err);
    return INITIAL_DISCIPLINARY_RECORDS;
  }
}

export function saveDisciplinaryRecords(records: DisciplinaryRecord[]): void {
  try {
    localStorage.setItem(DISCIPLINARY_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save disciplinary records:', err);
  }
}

export function addDisciplinaryRecord(
  data: Omit<DisciplinaryRecord, 'id' | 'school_id' | 'createdAt' | 'updatedAt' | 'recordedBy' | 'recorderRole'>,
  recordedByName: string,
  recordedByRole: string
): DisciplinaryRecord {
  const records = getDisciplinaryRecords();
  const newRecord: DisciplinaryRecord = {
    ...data,
    id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    school_id: DEFAULT_SCHOOL_ID,
    recordedBy: recordedByName,
    recorderRole: recordedByRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newRecord, ...records];
  saveDisciplinaryRecords(updated);

  // Queue offline sync
  enqueueOfflineAction('/api/disciplinary', 'POST', newRecord, `Logged disciplinary record for ${newRecord.studentName}`);

  return newRecord;
}

export function updateDisciplinaryRecord(
  id: string,
  updates: Partial<DisciplinaryRecord>,
  updatedByName: string
): DisciplinaryRecord | null {
  const records = getDisciplinaryRecords();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const existing = records[index];
  const updatedRecord: DisciplinaryRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  records[index] = updatedRecord;
  saveDisciplinaryRecords(records);

  enqueueOfflineAction(`/api/disciplinary/${id}`, 'PUT', updatedRecord, `Updated disciplinary record ${id} by ${updatedByName}`);

  return updatedRecord;
}

export function approveParentPastoralSummary(
  id: string,
  sanitizedSummary: string,
  approvedByName: string
): DisciplinaryRecord | null {
  return updateDisciplinaryRecord(
    id,
    {
      isExposedToParent: true,
      parentApprovedSummary: sanitizedSummary,
      parentApprovedBy: approvedByName,
      parentApprovedAt: new Date().toISOString(),
    },
    approvedByName
  );
}

export function revokeParentPastoralExposure(
  id: string,
  revokedByName: string
): DisciplinaryRecord | null {
  return updateDisciplinaryRecord(
    id,
    {
      isExposedToParent: false,
    },
    revokedByName
  );
}

/**
 * Returns parent-approved pastoral summaries for a specific student.
 * CRITICAL PRIVACY INVARIANT:
 * This function NEVER returns raw internal notes (`description`, `actionDetails`, or internal counselor logs).
 * Only returns the sanitized `parentApprovedSummary` if `isExposedToParent === true`.
 */
export function getApprovedPastoralSummariesForStudent(studentId: string): Array<{
  id: string;
  incidentDate: string;
  category: string;
  severity: DisciplinarySeverity;
  parentApprovedSummary: string;
  parentApprovedAt?: string;
  status: DisciplinaryStatus;
}> {
  const allRecords = getDisciplinaryRecords();
  return allRecords
    .filter((r) => r.studentId === studentId && r.isExposedToParent && r.parentApprovedSummary)
    .map((r) => ({
      id: r.id,
      incidentDate: r.incidentDate,
      category: r.category || 'General Conduct',
      severity: r.severity,
      parentApprovedSummary: r.parentApprovedSummary!,
      parentApprovedAt: r.parentApprovedAt,
      status: r.status || 'OPEN',
    }));
}
