export type Role = 'SUPER_ADMIN' | 'PRINCIPAL' | 'ACADEMIC_DIRECTOR' | 'TEACHER' | 'BURSAR';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  title: string;
}

export type SessionStatus = 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
export type TermStatus = 'ACTIVE' | 'PENDING' | 'COMPLETED';

export interface Term {
  id: string;
  name: string; // e.g., "First Term", "Second Term", "Third Term"
  sessionYear: string; // e.g., "2024/2025"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  resumptionDate?: string;
  totalWeeks: number;
  status: TermStatus;
  isLocked: boolean;
  notes?: string;
}

export interface AcademicSession {
  id: string;
  year: string; // e.g. "2024/2025"
  name: string; // e.g. "2024/2025 Academic Session"
  status: SessionStatus;
  startDate: string;
  endDate: string;
  terms: Term[];
  isCurrent: boolean;
}

export interface TermAdvanceChecklistState {
  gradesFinalized: boolean;
  attendanceLocked: boolean;
  feesReconciled: boolean;
  promotionsApproved: boolean;
  reportsGenerated: boolean;
  timetableScheduled: boolean;
}

export type EducationCategory = 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY' | 'PRIMARY' | 'NURSERY';

export interface ClassArm {
  id: string;
  levelId: string;
  name: string; // e.g. "Diamond", "Gold", "Silver", "Ruby"
  code: string; // e.g. "JSS1-D"
  roomNumber: string; // e.g. "Block B - Room 104"
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  capacity: number;
  enrolledCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  maleCount: number;
  femaleCount: number;
  averageGrade: string; // e.g. "B+ (78%)"
  attendanceRate: number; // percentage, e.g. 96.2
}

export interface ClassLevel {
  id: string;
  name: string; // e.g. "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
  code: string;
  category: EducationCategory;
  order: number;
  arms: ClassArm[];
  description?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'SESSION' | 'CLASS' | 'SYSTEM' | 'SECURITY';
  performerName: string;
  performerRole: string;
  timestamp: string;
  details: string;
}

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number;
  description: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export type ImportEntityType = 'STUDENTS' | 'STAFF' | 'FEES';

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  classLevel: string;
  classArm: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  dob?: string;
  bloodGroup?: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'SUSPENDED';
}

export interface Staff {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  email: string;
  phone: string;
  role: string;
  department: string;
  qualification: string;
  employmentDate: string;
  assignedLevel?: string;
  assignedArm?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
}

export interface FeePayment {
  id: string;
  transactionReference: string;
  admissionNumber: string;
  studentName: string;
  classLevel: string;
  sessionYear: string;
  term: string;
  feeCategory: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'ONLINE_CARD' | 'CHEQUE';
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'RECONCILED';
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ImportRow<T = Record<string, any>> {
  rowIndex: number;
  id: string;
  rawData: Record<string, string>;
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isCorrected: boolean;
  isCommitted: boolean;
}

export interface ImportBatchSummary {
  total: number;
  valid: number;
  hasErrors: number;
  corrected: number;
  committed: number;
}
