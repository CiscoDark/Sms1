export type Role =
  | 'SUPER_ADMIN'
  | 'PRINCIPAL'
  | 'ACADEMIC_DIRECTOR'
  | 'TEACHER'
  | 'BURSAR'
  | 'PARENT'
  | 'STUDENT'
  | 'CLASS_CAPTAIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles?: Role[];
  avatarUrl?: string;
  title: string;
  phoneNumber?: string;
  linkedStudentIds?: string[];
  assignedClassLevel?: string;
  assignedClassArm?: string;
  schoolId?: string; // Tenant isolation key
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

export type OfflineQueueActionType =
  | 'GRADEBOOK_SCORE_UPDATE'
  | 'ATTENDANCE_REGISTER_SAVE'
  | 'ATTENDANCE_RECORD'
  | 'GENERAL_MUTATION';

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  description: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  actionType?: OfflineQueueActionType;
  entityId?: string; // e.g. studentId or recordId
  fieldKey?: string; // e.g. 'ca1Score', 'ca2Score', 'examScore', 'status'
  performerName?: string;
  performerRole?: string;
}

export interface CellConflict {
  id: string;
  entityType: 'GRADEBOOK' | 'ATTENDANCE';
  recordId: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  field: string; // e.g. 'ca1Score' | 'ca2Score' | 'examScore' | 'status'
  fieldLabel: string;
  contextInfo: {
    levelName?: string;
    armName?: string;
    subjectCode?: string;
    subjectName?: string;
    sessionYear?: string;
    termName?: string;
    date?: string;
  };
  // Offline (Local) side
  localValue: any;
  localEditedBy: string;
  localEditedAt: string;
  // Remote (Online/Server) side
  remoteValue: any;
  remoteEditedBy: string;
  remoteEditedAt: string;
  // Conflict status & resolution
  status: 'UNRESOLVED' | 'RESOLVED';
  resolvedChoice?: 'LOCAL' | 'REMOTE';
  resolvedValue?: any;
  resolvedAt?: string;
  resolvedBy?: string;
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
  promotionStatus: 'PROMOTED' | 'PROMOTED_ON_TRIAL' | 'REPEATED' | 'CURRENT' | 'GRADUATED';
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

export type FeeItemType =
  | 'TUITION'
  | 'PTA'
  | 'FEEDING'
  | 'TRANSPORT'
  | 'LAB_SCIENCE'
  | 'EXAM_LEVY'
  | 'OTHER';

export interface FeeItem {
  id: string;
  name: string;
  type: FeeItemType;
  amount: number;
  isCompulsory: boolean;
  description?: string;
}

export interface ClassTermFeeStructure {
  id: string;
  schoolId: string;
  sessionYear: string;
  termName: string;
  classLevelId: string;
  classLevelName: string;
  items: FeeItem[];
  totalAmount: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentGatewayType = 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER_MANUAL' | 'CASH';

export interface StudentPaymentRecord {
  id: string;
  transactionReference: string;
  idempotencyKey?: string; // Step 16: Idempotency protection to prevent double-crediting
  studentId: string;
  amount: number;
  paymentDate: string;
  channel: PaymentGatewayType;
  status: 'SUCCESS' | 'PENDING' | 'RECONCILED' | 'FAILED' | 'FLAGGED_MANUAL_REVIEW';
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
  bankName?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
  reconciliationStatus?: 'NOT_NEEDED' | 'PENDING_POLL' | 'RECONCILED' | 'FLAGGED_MANUAL_REVIEW' | 'EXPIRED_ABANDONED';
  pollAttempts?: number;
  lastPollAt?: string;
  gatewayTransactionId?: string;
}

// STEP 16: Discount & Waiver Engine Types
export type FeeDiscountType =
  | 'SIBLING'
  | 'EARLY_PAYMENT'
  | 'STAFF_CHILD'
  | 'MERIT_SCHOLARSHIP'
  | 'CUSTOM';

export type FeeCalculationType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface FeeDiscountRule {
  id: string;
  name: string;
  type: FeeDiscountType;
  calculationType: FeeCalculationType;
  value: number; // e.g. 15 for 15%, or 25000 for ₦25,000
  appliesToItemType?: FeeItemType; // Optional target e.g. 'TUITION'
  earlyPaymentCutoffDate?: string; // YYYY-MM-DD for early bird
  siblingMinCount?: number; // e.g. 2 for 2nd child, 3 for 3rd+
  description?: string;
  isActive: boolean;
}

export interface AppliedDiscount {
  ruleId: string;
  ruleName: string;
  discountType: FeeDiscountType;
  amountSaved: number;
  appliedAt: string;
  notes?: string;
}

// STEP 16: Automated Payment Reminders
export type ReminderTriggerStage =
  | 'UPCOMING_14_DAYS'
  | 'UPCOMING_3_DAYS'
  | 'ON_DUE_DATE'
  | 'OVERDUE_7_DAYS'
  | 'OVERDUE_14_DAYS'
  | 'MANUAL_DISPATCH';

export interface PaymentReminderNotification {
  id: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  guardianEmail?: string;
  guardianPhone?: string;
  amountDue: number;
  dueDate: string;
  channel: 'EMAIL' | 'SMS' | 'MULTI_CHANNEL';
  triggerStage: ReminderTriggerStage;
  messageBody: string;
  sentAt: string;
  status: 'DELIVERED' | 'SENT' | 'QUEUED';
}

export interface StudentFeeAccount {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  avatarUrl?: string;
  classLevel: string;
  classArm: string;
  sessionYear: string;
  termName: string;
  grossBilled: number; // Gross amount before discounts
  discountAmount: number; // Total discounts applied
  appliedDiscounts: AppliedDiscount[]; // Active discounts/waivers
  totalBilled: number; // Net billed = grossBilled - discountAmount
  totalPaid: number;
  balanceDue: number;
  percentagePaid: number;
  status: 'CLEARED' | 'PARTIAL' | 'UNPAID';
  feeItems?: FeeItem[];
  payments: StudentPaymentRecord[];
}

// STEP 17: Bulk Promotion Wizard Types
export type PromotionAction =
  | 'PROMOTE'
  | 'REPEAT'
  | 'PROMOTE_TRIAL'
  | 'GRADUATE_ALUMNI';

export interface StudentPromotionDecision {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  currentClassLevel: string;
  currentClassArm: string;
  targetClassLevel: string;
  targetClassArm: string;
  action: PromotionAction;
  academicGpa?: number;
  overallGrade?: string;
  academicRecommendation?: string;
  feeClearanceStatus: 'CLEARED' | 'PARTIAL' | 'OUTSTANDING';
  assignedFeeStructureId?: string;
  assignedFeeTotal?: number;
  isManuallyOverridden?: boolean;
  overrideReason?: string;
}

export interface BulkPromotionBatch {
  id: string;
  schoolId: string;
  fromSessionYear: string;
  toSessionYear: string;
  promotedCount: number;
  repeatedCount: number;
  graduatedCount: number;
  promotedAt: string;
  promotedBy: string;
  decisions: StudentPromotionDecision[];
  rollbackSnapshotId: string;
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
  systemTitle?: string; // e.g. "Nigerian Secondary School Standard (A1-F9)"
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
  // Nigerian 3rd Term Cumulative Weightings: 20% 1st Term, 30% 2nd Term, 50% 3rd Term
  cumulativeTerm1Weight: number; // Default 20 (%)
  cumulativeTerm2Weight: number; // Default 30 (%)
  cumulativeTerm3Weight: number; // Default 50 (%)
  boundaries: GradeBoundary[];
  isLocked: boolean;
  updatedAt: string;
  updatedBy?: string;
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

export interface CumulativeStudentSubjectRecord {
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
  // Term breakdowns
  term1Score: number | null;
  term1Weighted: number | null; // e.g. 20% of T1
  term2Score: number | null;
  term2Weighted: number | null; // e.g. 30% of T2
  term3Score: number | null;
  term3Weighted: number | null; // e.g. 50% of T3
  term1TotalScore?: number | null;
  term1WeightedScore?: number | null;
  term2TotalScore?: number | null;
  term2WeightedScore?: number | null;
  term3TotalScore?: number | null;
  term3WeightedScore?: number | null;
  // Cumulative totals
  cumulativeScore: number | null; // Total out of 100%
  cumulativeTotalScore?: number | null;
  cumulativeGrade: string; // A1 - F9
  cumulativeRemark: string;
  cumulativeGpaPoint: number;
  cumulativeRankInArm?: number;
  promotionStatus: 'PROMOTED' | 'PROMOTED_ON_TRIAL' | 'REPEAT' | 'PENDING';
  promotionDecision?: 'PROMOTED' | 'PROMOTED ON TRIAL' | 'REPEAT' | 'PENDING';
  updatedAt: string;
}

export interface GradebookSummary {
  totalStudents: number;
  gradedStudents: number;
  classAverage: number;
  highestScore: number;
  lowestScore: number;
  passRate: number; // percentage
  distribution: Record<string, number>;
}

// STEP 13 & STEP 14: Report Card Snapshots, Verification & Student Portal Types
export interface SubjectScoreSnapshot {
  subjectCode: string;
  subjectName: string;
  ca1Score: number | null; // e.g. / 20
  ca2Score: number | null; // e.g. / 20
  examScore: number | null; // e.g. / 60
  totalScore: number | null; // e.g. / 100
  grade: string; // e.g. 'A1', 'B2', 'C4', etc.
  remark: string; // e.g. 'Distinction', 'Credit'
  gpaPoint: number;
  classAverage?: number;
  highestInClass?: number;
  lowestInClass?: number;
}

export interface PsychomotorAssessment {
  neatness: number; // 1 - 5
  punctuality: number; // 1 - 5
  politeness: number; // 1 - 5
  leadership: number; // 1 - 5
  attentiveness: number; // 1 - 5
  sportsmanship: number; // 1 - 5
  honesty: number; // 1 - 5
}

export interface ReportCardSnapshot {
  id: string; // Unique snapshot ID
  credentialUuid: string; // Public QR verification UUID (e.g. cred-studentId-term-hash)
  schoolId: string; // 'school-apex-001' (Tenant Isolation Invariant)
  schoolName: string;
  studentId: string;
  studentRegNumber: string;
  studentName: string;
  gender: 'M' | 'F';
  avatarUrl?: string;
  classLevel: string; // e.g. 'JSS 1'
  classArm: string; // FROZEN snapshot of arm name at publish time e.g. 'Diamond' (Temporal Immutability Invariant)
  sessionYear: string; // e.g. '2024/2025'
  termName: string; // 'First Term' | 'Second Term' | 'Third Term'
  subjects: SubjectScoreSnapshot[];
  totalScore: number;
  totalMaxScore: number;
  averagePercentage: number;
  overallGrade: string; // 'A1' - 'F9'
  overallGpa: number;
  positionInArm: number;
  totalInArm: number;
  classAverage: number;
  attendanceRate: number;
  daysPresent: number;
  totalDays: number;
  // Financial status at publish moment (strictly private, NEVER exposed to public QR)
  feeStatus: 'CLEARED' | 'PARTIAL' | 'OUTSTANDING';
  feeBalance: number;
  feeStatusText: string;
  // Remarks & Sign-offs
  teacherRemarks: string;
  teacherSignedOff: boolean;
  teacherSignedAt?: string;
  teacherName?: string;
  isAiDrafted?: boolean;
  principalRemarks: string;
  principalSigned: boolean;
  principalSignedAt?: string;
  principalName?: string;
  nextTermBegins?: string;
  promotionDecision?: 'PROMOTED' | 'PROMOTED ON TRIAL' | 'REPEAT' | 'N/A';
  psychomotor: PsychomotorAssessment;
  publishedAt: string;
  publishedBy: string;
  isPublished: boolean;
}

export interface StudentAnnouncementItem {
  id: string;
  title: string;
  content: string;
  scope: 'SCHOOL_WIDE' | 'CLASS_LEVEL' | 'CLASS_ARM';
  targetLevel?: string;
  targetArm?: string;
  category: 'ACADEMIC' | 'EVENT' | 'EXAM' | 'ADMINISTRATIVE' | 'EMERGENCY';
  authorName: string;
  authorRole: string;
  authorType?: 'STAFF' | 'CLASS_CAPTAIN' | 'ADMIN';
  isCaptainPost?: boolean;
  captainBadgeText?: string;
  createdAt: string;
  isPinned?: boolean;
  readBy?: string[]; // studentIds that marked as read
}

export interface ParentChildLink {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classLevel: string;
  classArm: string;
  isEmergencyContact: boolean;
  hasFinancialResponsibility: boolean;
  linkedAt: string;
  linkedBy: string;
}

export interface ClassCaptainRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classLevel: string;
  classArm: string;
  captainRole: 'HEAD_CAPTAIN' | 'ASSISTANT_CAPTAIN' | 'TIME_KEEPER' | 'LAB_PREFECT';
  appointedBy: string;
  appointedAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

export interface DirectChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  recipientId: string;
  recipientName: string;
  recipientRole: Role;
  content: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  attachments?: { name: string; url: string; type: string }[];
}

export interface ChatThread {
  id: string;
  type: 'TEACHER_PARENT' | 'CAPTAIN_TEACHER';
  studentId?: string;
  studentName?: string;
  classLevel: string;
  classArm: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, Role>;
  title: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>;
}

export interface BroadcastMessageRecord {
  id: string;
  title: string;
  body: string;
  channels: ('SMS' | 'EMAIL' | 'IN_APP')[];
  audienceScope: 'SCHOOL_WIDE' | 'CLASS_LEVEL' | 'CLASS_ARM' | 'CUSTOM';
  targetLevel?: string;
  targetArm?: string;
  recipientCount: number;
  smsCharacterCount?: number;
  smsSegmentsPerRecipient?: number;
  smsTotalSegments?: number;
  estimatedCostNaira?: number;
  isHighPriorityAlert?: boolean;
  senderId: string;
  senderName: string;
  senderRole: string;
  sentAt: string;
  deliveryStats: {
    smsSent: number;
    smsFailed: number;
    emailSent: number;
    inAppDelivered: number;
  };
}

// ==========================================
// STEP 21 — Disciplinary Records
// ==========================================

export type DisciplinarySeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'MINOR'
  | 'MODERATE'
  | 'SERIOUS';

export type DisciplinaryAction =
  | 'VERBAL_WARNING'
  | 'WRITTEN_WARNING'
  | 'DETENTION'
  | 'COMMUNITY_SERVICE'
  | 'PARENTAL_CONFERENCE'
  | 'COUNSELING_REFERRAL'
  | 'IN_SCHOOL_SUSPENSION'
  | 'OUT_OF_SCHOOL_SUSPENSION'
  | string;

export type DisciplinaryStatus = 'OPEN' | 'RESOLVED' | 'UNDER_OBSERVATION';

export interface DisciplinaryRecord {
  id: string;
  school_id?: string; // Tenant isolation invariant
  studentId: string;
  studentName: string;
  studentRegNumber?: string;
  admissionNumber?: string;
  classLevel?: string;
  classArm?: string;
  incidentDate: string; // YYYY-MM-DD
  incidentTitle?: string;
  category?: string; // e.g. "Disruptive Behavior", "Truancy/Tardiness", "Academic Dishonesty", "Bullying/Harassment", "Vandalism", "Dress Code Violation"
  description: string; // Raw incident notes (Visible only to Admin & Counselor/Teacher)
  severity: DisciplinarySeverity;
  actionTaken: DisciplinaryAction;
  actionDetails?: string;
  followUpNotes?: string;
  followUpDate?: string;
  status?: DisciplinaryStatus;
  recordedBy: string;
  recorderRole?: string;
  createdAt: string;
  updatedAt?: string;
  isPrivate?: boolean; // Strictly private - never shown in student portal or public QR
  // Parent exposure control
  isExposedToParent?: boolean;
  parentApprovedSummary?: string; // Admin-approved sanitized summary (NOT raw notes)
  parentApprovedBy?: string;
  parentApprovedAt?: string;
}

// ==========================================
// STEP 22 — AI-Sorted Suggestion Box
// ==========================================

export type SuggestionCategory =
  | 'FACILITIES'
  | 'ACADEMICS'
  | 'BULLYING_WELFARE'
  | 'FOOD_CAFETERIA'
  | 'FEES_BILLING'
  | 'GENERAL';

export type SuggestionUrgency = 'LOW' | 'NORMAL' | 'URGENT' | 'CRITICAL_WELFARE';

export type SuggestionSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'DISTRESSED';

export type SuggestionStatus = 'RECEIVED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'ACTIONED';

export interface SuggestionRecord {
  id: string;
  school_id: string; // Tenant isolation
  trackingCode: string; // e.g. "SUG-2024-819"
  title: string;
  content: string;
  isAnonymous: boolean;
  submitterId?: string;
  submitterName?: string;
  submitterRole?: Role;
  submitterEmail?: string;
  category: SuggestionCategory;
  urgency: SuggestionUrgency;
  sentiment: SuggestionSentiment;
  sentimentScore: number; // -1.0 to 1.0
  aiTags: string[];
  isWelfareEscalated: boolean;
  escalatedTo?: string; // e.g. "Designated Safeguarding Lead (Dr. Kunle Adeleke)"
  status: SuggestionStatus;
  adminFeedback?: string; // Visible to submitter
  internalAdminNotes?: string; // Confidential - visible only to Admins
  submittedAt: string;
  updatedAt: string;
}

// ==========================================
// STEP 23 — Staff Payroll
// ==========================================

export interface StaffBankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bvnMasked: string; // e.g. "2234****109"
  sortCode?: string;
}

export interface StaffSalaryStructure {
  basicPay: number;
  housingAllowance: number;
  transportAllowance: number;
  teachingAllowance: number;
  responsibilityAllowance: number;
  mealAllowance: number;
  payeTaxRate: number; // e.g. 0.08 for 8%
  pensionEmployeeRate: number; // e.g. 0.08 for 8% statutory
  unionDues: number;
  healthInsurance: number;
}

export interface StaffAttendanceRecord {
  month: string; // "2024-10"
  workingDays: number;
  daysWorked: number;
  unexcusedAbsences: number;
  approvedLeaves: number;
  dailyWageRate: number;
  absenceDeduction: number;
}

export interface StaffMember {
  id: string;
  school_id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employmentDate: string; // YYYY-MM-DD
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  bankDetails: StaffBankDetails;
  salary: StaffSalaryStructure;
  attendanceThisMonth: StaffAttendanceRecord;
}

export interface MonthlyPayrollRun {
  id: string;
  school_id: string;
  sessionYear: string;
  month: string; // e.g. "October 2024"
  runDate: string;
  totalStaffCount: number;
  totalBasicPay: number;
  totalAllowances: number;
  totalGrossPay: number;
  totalTaxPAYE: number;
  totalPension: number;
  totalAbsenceDeductions: number;
  totalOtherDeductions: number;
  totalDeductions: number;
  totalNetPay: number;
  status: 'DRAFT' | 'APPROVED' | 'DISBURSED';
  batchPaymentReference?: string;
  disbursedAt?: string;
  approvedBy?: string;
}

export interface StaffPayslip {
  id: string;
  payrollRunId: string;
  school_id: string;
  staffId: string;
  staffName: string;
  employeeCode: string;
  department: string;
  jobTitle: string;
  month: string;
  sessionYear: string;
  basicPay: number;
  allowances: { name: string; amount: number }[];
  grossPay: number;
  deductions: { name: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
  bankDetailsMasked: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paymentReference: string;
  generatedAt: string;
}

// ==========================================
// STEP 24 — Data Export & Backup
// ==========================================

export type ExportScope = 'ALL' | 'CLASS_LEVEL' | 'CLASS_ARM' | 'TERM' | 'CUSTOM';
export type ExportDomain = 'STUDENTS' | 'FEES_FINANCE' | 'STAFF_PAYROLL' | 'EXAMS_ACADEMICS';

export interface BackupScheduleConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  backupTimeUtc: string; // e.g. "02:00"
  retentionDays: number;
  targetCloudBucket: string;
  autoExportFormat: 'SQL_JSON' | 'CSV_ARCHIVE';
  isEnabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
}

export interface DatabaseBackupSnapshot {
  id: string;
  school_id: string;
  filename: string;
  type: 'AUTOMATED' | 'MANUAL';
  createdAt: string;
  sizeBytes: number;
  formattedSize: string;
  checksumSha256: string;
  schemaVersion: string;
  tablesIncluded: { table: string; count: number }[];
  status: 'HEALTHY' | 'VERIFIED' | 'FAILED';
  triggeredBy: string;
  downloadPayload?: string;
}


