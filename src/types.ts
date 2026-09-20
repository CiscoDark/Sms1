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

export interface ArmPointInTimeSnapshot {
  id: string;
  armId: string;
  levelId: string;
  previousName: string;
  newName: string;
  renamedAt: string;
  renamedBy: string;
  reason?: string;
  academicSessionYear: string;
  termName: string;
  frozenJsonSnapshot: {
    armId: string;
    levelId: string;
    levelName: string;
    armName: string;
    code: string;
    roomNumber: string;
    formMaster: string;
    enrolledCount: number;
  };
}

export interface SchoolNomenclature {
  levelTermSingular: string; // e.g. "Class", "Grade", "Form", "Year", "Level"
  levelTermPlural: string;   // e.g. "Classes", "Grades", "Forms", "Years", "Levels"
  armTermSingular: string;   // e.g. "Arm", "Stream", "Section", "House", "Division"
  armTermPlural: string;     // e.g. "Arms", "Streams", "Sections", "Houses", "Divisions"
  schoolCurriculum: 'NIGERIAN_NATIONAL' | 'BRITISH_CAMBRIDGE' | 'AMERICAN_K12' | 'INTERNATIONAL_BACCALAUREATE' | 'CUSTOM';
}

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
  classCaptainId?: string;
  classCaptainName?: string;
  assistantCaptainId?: string;
  assistantCaptainName?: string;
  historicalSnapshots?: ArmPointInTimeSnapshot[];
}

export interface ClassLevel {
  id: string;
  name: string; // e.g. "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
  code: string;
  category: EducationCategory;
  order: number;
  arms: ClassArm[];
  description?: string;
  defaultFeeBand?: number;
  timetableSlotsPerWeek?: number;
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

export interface AcademicRecordSnapshot {
  id: string;
  sessionYear: string;
  termName: string;
  classLevel: string;
  classArm: string;
  averageScore: number;
  grade: string;
  positionInClass?: number;
  totalInClass?: number;
  attendanceRate: number;
  promotionStatus: 'PROMOTED' | 'PROMOTED_ON_TRIAL' | 'REPEATED' | 'CURRENT';
  promotedTo?: string;
  promotedDate?: string;
  principalRemarks?: string;
  snapshotTimestamp: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  category: 'BIRTH_CERTIFICATE' | 'ACADEMIC_TRANSCRIPT' | 'MEDICAL_RECORD' | 'IDENTIFICATION' | 'OTHER';
  uploadedAt: string;
  uploadedBy: string;
  fileUrl?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classLevel: string;
  classArm: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  arrivalTime?: string;
  remarks?: string;
  markedBy: string;
  markedAt: string;
}

export interface ClassDailyAttendanceSummary {
  date: string;
  classLevel: string;
  classArm: string;
  totalCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  markedAt?: string;
  markedBy?: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'M' | 'F';
  classLevel: string;
  classArm: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  guardianOccupation?: string;
  guardianAddress?: string;
  dob?: string;
  bloodGroup?: string;
  genotype?: string;
  allergies?: string[];
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  nationality?: string;
  stateOfOrigin?: string;
  residentialAddress?: string;
  avatarUrl?: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'SUSPENDED';
  academicHistory?: AcademicRecordSnapshot[];
  documents?: StudentDocument[];
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

export type AdmissionStage =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'ASSESSED'
  | 'ADMITTED'
  | 'ENROLLED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface AssessmentScore {
  subject: string;
  score: number;
  maxScore: number;
}

export interface StageHistoryEntry {
  id: string;
  stage: AdmissionStage;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export interface Applicant {
  id: string;
  applicationNumber: string;
  appliedDate: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'M' | 'F';
  dateOfBirth: string;
  residentialAddress: string;
  desiredLevel: string;
  desiredArmPreference?: string;
  priorSchool: string;
  priorGradeAverage?: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianOccupation?: string;
  stage: AdmissionStage;
  assessmentNotes?: string;
  assessmentScores?: AssessmentScore[];
  totalAssessmentScore?: number;
  interviewerName?: string;
  assessmentDate?: string;
  rejectionReason?: string;
  withdrawalReason?: string;
  assignedArm?: string;
  assignedAdmissionNumber?: string;
  enrolledDate?: string;
  stageHistory: StageHistoryEntry[];
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

export type PeriodType = 'LESSON' | 'LAB' | 'BREAK' | 'ASSEMBLY' | 'SPORT' | 'HOMEROOM';

export interface TimeSlotDefinition {
  periodNumber: number;
  label: string;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "08:45"
  type: PeriodType;
  isBreak?: boolean;
}

export interface ClassTimetableSlot {
  id: string;
  schoolId: string; // Architectural Invariant #1: Tenant Isolation
  levelId: string;
  armId: string;
  day: DayOfWeek;
  periodNumber: number;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  room: string;
  colorTheme: 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'teal' | 'orange' | 'cyan';
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TimetableConflict {
  id: string;
  type: 'TEACHER_DOUBLE_BOOKED' | 'ROOM_DOUBLE_BOOKED';
  day: DayOfWeek;
  periodNumber: number;
  periodLabel: string;
  conflictingEntityName: string; // Teacher name or Room name
  firstClass: {
    armId: string;
    armName: string;
    levelName: string;
    subjectName: string;
  };
  secondClass: {
    armId: string;
    armName: string;
    levelName: string;
    subjectName: string;
  };
  message: string;
}

export interface SubjectItem {
  code: string;
  name: string;
  category: 'CORE' | 'ELECTIVE' | 'VOCATIONAL' | 'SCIENCE';
  defaultTeacherId?: string;
  preferredRoom?: string;
  colorTheme: 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'teal' | 'orange' | 'cyan';
}

export type TeacherActivityType =
  | 'CLASS_LESSON'
  | 'PREP_PLANNING'
  | 'MARKING_GRADING'
  | 'STUDENT_MENTORING'
  | 'MEETING'
  | 'SUPERVISION'
  | 'PERSONAL';

export interface TeacherPersonalBlock {
  id: string;
  schoolId: string; // Invariant #1: Tenant Isolation
  teacherId: string;
  teacherName: string;
  day: DayOfWeek;
  periodNumber: number;
  title: string;
  activityType: TeacherActivityType;
  classContext?: {
    levelName?: string;
    armName?: string;
    subjectName?: string;
    room?: string;
  };
  room?: string;
  notes?: string;
  colorTheme: 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'teal' | 'orange' | 'cyan';
  importedFromClassTimetable?: boolean;
  originalClassSlotId?: string;
  hasOfficialClassOverlap?: boolean;
  officialOverlapDetails?: {
    subjectName: string;
    levelName: string;
    armName: string;
    room: string;
  };
  updatedAt: string;
}

// STEP 11: Exam & Continuous Assessment (CA) Scheduling
export type AssessmentType =
  | 'CA1'
  | 'CA2'
  | 'CA3'
  | 'MID_TERM'
  | 'PRACTICAL'
  | 'TERMINAL_EXAM'
  | 'MOCK_EXAM';

export type AssessmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'CONCLUDED' | 'CANCELLED';

export interface AssessmentScheduleItem {
  id: string;
  schoolId: string; // Invariant #1: Tenant Isolation
  sessionYear: string; // e.g. "2024/2025"
  termName: string; // e.g. "First Term"
  title: string; // e.g. "First Term Mathematics Examination"
  type: AssessmentType;
  subjectCode: string; // e.g. "MTH"
  subjectName: string; // e.g. "Mathematics"
  levelId: string; // e.g. "level-jss-1"
  levelName: string; // e.g. "JSS 1"
  armIds: string[]; // empty array means all arms in level
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string; // HH:mm e.g. "11:30"
  durationMinutes: number;
  venue: string; // e.g. "School Auditorium Hall"
  supervisorTeacherId?: string;
  supervisorTeacherName?: string;
  maxScore: number; // e.g. 60 or 20
  weightPercentage: number; // e.g. 60%
  status: AssessmentStatus;
  // Grading lock gate: Report card grading only opens once exam window has occurred or admin override
  isGradingOpen: boolean;
  gradingUnlockedAt?: string;
  gradingUnlockedBy?: string;
  isPublishedToStudents: boolean;
  instructions?: string;
  syllabusTopics?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentExamAnnouncement {
  id: string;
  schoolId: string;
  examId: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  levelName: string;
  date: string;
  timeRange: string;
  venue: string;
  instructions?: string;
  daysRemaining: number;
  isUpcoming: boolean;
  status: AssessmentStatus;
}

// STEP 12: Gradebook & Grade Calculation Layer
export interface GradeBoundary {
  grade: string; // e.g. 'A', 'B', 'C', 'D', 'F'
  minScore: number;
  maxScore: number;
  remark: string; // e.g. "Distinction", "Very Good", "Credit", "Pass", "Fail"
  gpaPoint: number; // e.g. 4.0, 3.0, 2.0, 1.0, 0.0
  color: 'emerald' | 'indigo' | 'sky' | 'amber' | 'rose';
}

export interface GradingConfiguration {
  schoolId: string;
  sessionYear: string;
  termName: string;
  ca1Name: string;
  ca1Max: number; // e.g. 20
  ca2Name: string;
  ca2Max: number; // e.g. 20
  ca3Name?: string;
  ca3Max?: number; // e.g. 0
  examName: string;
  examMax: number; // e.g. 60
  totalMax: number; // 100
  passMark: number; // e.g. 50
  boundaries: GradeBoundary[];
  isLocked: boolean;
  updatedAt: string;
}

export interface StudentSubjectGradeRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentRegNumber: string;
  studentName: string;
  gender: 'M' | 'F';
  levelId: string;
  levelName: string;
  armId: string;
  armName: string;
  subjectCode: string;
  subjectName: string;
  sessionYear: string;
  termName: string;
  ca1Score: number | null;
  ca2Score: number | null;
  ca3Score?: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string;
  remark: string;
  gpaPoint: number;
  rankInArm?: number;
  rankInLevel?: number;
  isExempt?: boolean;
  teacherRemarks?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface GradebookSummary {
  totalStudents: number;
  gradedStudents: number;
  classAverage: number;
  highestScore: number;
  lowestScore: number;
  passRate: number; // percentage
  distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}


