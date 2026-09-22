/**
 * Enterprise School Management System - Fee Structure & Payment Ledger Store
 * 
 * ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: All fee structures, student ledgers, and transactions
 *    strictly scoped to `schoolId: 'school-apex-001'`.
 * 2. Strict Financial Precision: Nigerian Naira (₦) currency calculations with
 *    partial payment tracking, balance reconciliation, and payment history audit.
 */

import {
  ClassTermFeeStructure,
  FeeItem,
  FeeItemType,
  PaymentGatewayType,
  StudentFeeAccount,
  StudentPaymentRecord,
  FeeDiscountRule,
  AppliedDiscount,
  PaymentReminderNotification,
  ReminderTriggerStage,
} from '../types';
import { TENANT_SCHOOL_ID } from './class-timetable-store';
import { getEnrichedStudents } from './students/students-store';

const FEE_STRUCTURES_STORAGE_KEY = `sms_fee_structures_${TENANT_SCHOOL_ID}`;
const STUDENT_FEE_ACCOUNTS_STORAGE_KEY = `sms_student_fee_accounts_${TENANT_SCHOOL_ID}`;
const DISCOUNT_RULES_STORAGE_KEY = `sms_discount_rules_${TENANT_SCHOOL_ID}`;
const PAYMENT_REMINDERS_STORAGE_KEY = `sms_payment_reminders_${TENANT_SCHOOL_ID}`;

// STEP 16: Configurable Discount & Waiver Engine Rules
export const DEFAULT_DISCOUNT_RULES: FeeDiscountRule[] = [
  {
    id: 'rule-sibling-2nd',
    name: 'Sibling Discount (2nd Child)',
    type: 'SIBLING',
    calculationType: 'PERCENTAGE',
    value: 10,
    appliesToItemType: 'TUITION',
    siblingMinCount: 2,
    description: '10% tuition fee reduction for the second registered child from the same family.',
    isActive: true,
  },
  {
    id: 'rule-sibling-3rd',
    name: 'Sibling Concession (3rd+ Child)',
    type: 'SIBLING',
    calculationType: 'PERCENTAGE',
    value: 20,
    appliesToItemType: 'TUITION',
    siblingMinCount: 3,
    description: '20% tuition fee reduction for the third and subsequent children.',
    isActive: true,
  },
  {
    id: 'rule-early-bird',
    name: 'Early-Payment Incentive',
    type: 'EARLY_PAYMENT',
    calculationType: 'PERCENTAGE',
    value: 5,
    earlyPaymentCutoffDate: '2025-01-20',
    description: '5% rebate across all compulsory fees if paid in full on or before the early-bird cutoff date.',
    isActive: true,
  },
  {
    id: 'rule-staff-child',
    name: 'Staff-Child Tuition Waiver',
    type: 'STAFF_CHILD',
    calculationType: 'PERCENTAGE',
    value: 50,
    appliesToItemType: 'TUITION',
    description: '50% statutory tuition rebate for biological children of full-time academic & administrative staff.',
    isActive: true,
  },
  {
    id: 'rule-merit-scholarship',
    name: 'Principal Scholastic Merit Award',
    type: 'MERIT_SCHOLARSHIP',
    calculationType: 'FIXED_AMOUNT',
    value: 50000,
    description: '₦50,000 endowment award granted by the Academic Board for term overall top rankers.',
    isActive: true,
  },
];

export const DEFAULT_FEE_ITEMS_JSS: FeeItem[] = [
  {
    id: 'item-tuition-jss',
    name: 'Term Tuition & Academic Instruction',
    type: 'TUITION',
    amount: 120000,
    isCompulsory: true,
    description: 'Covers core teaching, academic materials, and laboratory supplies.',
  },
  {
    id: 'item-pta-jss',
    name: 'PTA Development Levy',
    type: 'PTA',
    amount: 15000,
    isCompulsory: true,
    description: 'Parent-Teacher Association school infrastructure maintenance fund.',
  },
  {
    id: 'item-feeding-jss',
    name: 'Midday Balanced Hot Meal / Feeding',
    type: 'FEEDING',
    amount: 35000,
    isCompulsory: false,
    description: 'Daily nutritious lunch program prepared on campus.',
  },
  {
    id: 'item-transport-jss',
    name: 'School Bus Transit / Transport',
    type: 'TRANSPORT',
    amount: 25000,
    isCompulsory: false,
    description: 'Designated route morning pickup and afternoon drop-off service.',
  },
  {
    id: 'item-lab-jss',
    name: 'Science & ICT Practical Consumables',
    type: 'LAB_SCIENCE',
    amount: 10000,
    isCompulsory: true,
    description: 'Computer lab workstation access and basic science experiment reagents.',
  },
];

export const DEFAULT_FEE_ITEMS_SSS: FeeItem[] = [
  {
    id: 'item-tuition-sss',
    name: 'Senior Secondary Tuition & Specialist Mentorship',
    type: 'TUITION',
    amount: 140000,
    isCompulsory: true,
    description: 'Covers senior curriculum, specialist subject tutorials, and mock exams.',
  },
  {
    id: 'item-pta-sss',
    name: 'PTA Development Levy',
    type: 'PTA',
    amount: 15000,
    isCompulsory: true,
    description: 'PTA infrastructure and campus development fund.',
  },
  {
    id: 'item-feeding-sss',
    name: 'Senior Dining & Nutrition Program',
    type: 'FEEDING',
    amount: 35000,
    isCompulsory: false,
    description: 'Daily campus meal voucher and dining hall access.',
  },
  {
    id: 'item-transport-sss',
    name: 'Air-Conditioned Transit Shuttle',
    type: 'TRANSPORT',
    amount: 25000,
    isCompulsory: false,
    description: 'Zonal express bus route service.',
  },
  {
    id: 'item-lab-sss',
    name: 'Senior Physics, Chemistry & Biology Practical Kit',
    type: 'LAB_SCIENCE',
    amount: 20000,
    isCompulsory: true,
    description: 'Advanced laboratory specimens, STEM tools, and robotics equipment.',
  },
];

function generateSeedFeeStructures(): ClassTermFeeStructure[] {
  const sessionYear = '2024/2025';
  const termName = 'Third Term';
  const dueDate = '2025-05-15';

  const levels = [
    { id: 'level-jss-1', name: 'JSS 1', items: DEFAULT_FEE_ITEMS_JSS },
    { id: 'level-jss-2', name: 'JSS 2', items: DEFAULT_FEE_ITEMS_JSS },
    {
      id: 'level-jss-3',
      name: 'JSS 3',
      items: [
        ...DEFAULT_FEE_ITEMS_JSS,
        {
          id: 'item-bece-levy',
          name: 'National / State BECE Examination Levy',
          type: 'EXAM_LEVY' as FeeItemType,
          amount: 20000,
          isCompulsory: true,
          description: 'Basic Education Certificate Examination registration and logistics.',
        },
      ],
    },
    { id: 'level-sss-1', name: 'SSS 1', items: DEFAULT_FEE_ITEMS_SSS },
    { id: 'level-sss-2', name: 'SSS 2', items: DEFAULT_FEE_ITEMS_SSS },
    {
      id: 'level-sss-3',
      name: 'SSS 3',
      items: [
        ...DEFAULT_FEE_ITEMS_SSS,
        {
          id: 'item-waec-neco',
          name: 'WAEC / NECO Senior School Certificate Levy',
          type: 'EXAM_LEVY' as FeeItemType,
          amount: 40000,
          isCompulsory: true,
          description: 'Official council registration, practical examination materials, and security seals.',
        },
      ],
    },
  ];

  return levels.map((lvl) => {
    const totalAmount = lvl.items.reduce((sum, item) => sum + item.amount, 0);
    return {
      id: `fee-struct-${lvl.id}-2024-2025-t3`,
      schoolId: TENANT_SCHOOL_ID,
      sessionYear,
      termName,
      classLevelId: lvl.id,
      classLevelName: lvl.name,
      items: lvl.items,
      totalAmount,
      dueDate,
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: '2025-01-10T08:00:00Z',
    };
  });
}

/**
 * Fetch all fee structures for tenant
 */
export function getAllFeeStructures(): ClassTermFeeStructure[] {
  try {
    const raw = localStorage.getItem(FEE_STRUCTURES_STORAGE_KEY);
    if (!raw) {
      const seeded = generateSeedFeeStructures();
      localStorage.setItem(FEE_STRUCTURES_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error fetching fee structures:', err);
    return generateSeedFeeStructures();
  }
}

/**
 * Save or update fee structure
 */
export function saveFeeStructure(structure: ClassTermFeeStructure): void {
  const all = getAllFeeStructures();
  const idx = all.findIndex((s) => s.id === structure.id);
  let updated: ClassTermFeeStructure[];
  const now = new Date().toISOString();
  const modified = { ...structure, updatedAt: now };

  if (idx >= 0) {
    updated = [...all];
    updated[idx] = modified;
  } else {
    updated = [modified, ...all];
  }

  try {
    localStorage.setItem(FEE_STRUCTURES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error persisting fee structure:', err);
  }
}

/**
 * Generate seed student fee accounts with realistic partial payment scenarios
 */
function generateSeedStudentFeeAccounts(): StudentFeeAccount[] {
  const students = getEnrichedStudents();
  const structures = getAllFeeStructures();
  const sessionYear = '2024/2025';
  const termName = 'Third Term';

  return students.map((st, i) => {
    // Determine class structure
    const struct =
      structures.find((s) => s.classLevelName === st.classLevel) || structures[0];
    let totalBilled = struct ? struct.totalAmount : 205000;

    // Realistic partial payment distribution
    let payments: StudentPaymentRecord[] = [];
    let totalPaid = 0;

    if (i === 0) {
      // 100% Cleared (Chinedu Adeleke)
      totalPaid = totalBilled;
      payments = [
        {
          id: `pay-${st.id}-1`,
          transactionReference: `PAY-2025-01-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          studentId: st.id,
          amount: 150000,
          paymentDate: '2025-01-14',
          channel: 'PAYSTACK',
          status: 'SUCCESS',
          payerName: st.guardianName || 'Dr. Adeleke',
          payerEmail: st.guardianEmail || 'adeleke.parent@example.com',
          payerPhone: st.guardianPhone,
          notes: 'Upfront 73% payment via Paystack checkout',
          recordedBy: 'Paystack Gateway Automated',
          recordedAt: '2025-01-14T10:15:00Z',
        },
        {
          id: `pay-${st.id}-2`,
          transactionReference: `BNK-2025-02-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          studentId: st.id,
          amount: 55000,
          paymentDate: '2025-02-05',
          channel: 'BANK_TRANSFER_MANUAL',
          status: 'SUCCESS',
          payerName: st.guardianName || 'Dr. Adeleke',
          payerEmail: st.guardianEmail,
          bankName: 'Zenith Bank PLC',
          proofDocumentName: 'zenith_deposit_slip_55000.pdf',
          proofDocumentUrl: '#',
          notes: 'Balance cleared via direct bank transfer',
          recordedBy: 'Mr. Jude Okafor (Bursar)',
          recordedAt: '2025-02-05T14:30:00Z',
        },
      ];
    } else if (i === 1) {
      // Partial: Paid ₦150,000 of ₦205,000 (73% paid, ₦55,000 balance)
      totalPaid = 150000;
      payments = [
        {
          id: `pay-${st.id}-1`,
          transactionReference: `FLW-2025-01-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          studentId: st.id,
          amount: 150000,
          paymentDate: '2025-01-16',
          channel: 'FLUTTERWAVE',
          status: 'SUCCESS',
          payerName: st.guardianName || 'Alhaji Bello',
          payerEmail: st.guardianEmail,
          payerPhone: st.guardianPhone,
          notes: 'Initial term installment payment via Flutterwave checkout',
          recordedBy: 'Flutterwave Webhook Gateway',
          recordedAt: '2025-01-16T11:42:00Z',
        },
      ];
    } else if (i === 2) {
      // Partial: Paid ₦100,000 (49% paid)
      totalPaid = 100000;
      payments = [
        {
          id: `pay-${st.id}-1`,
          transactionReference: `BNK-2025-01-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          studentId: st.id,
          amount: 100000,
          paymentDate: '2025-01-20',
          channel: 'BANK_TRANSFER_MANUAL',
          status: 'SUCCESS',
          payerName: st.guardianName || 'Mr. Chukwu',
          bankName: 'Access Bank PLC',
          proofDocumentName: 'access_bank_teller_100k.jpg',
          proofDocumentUrl: '#',
          notes: 'First installment submitted with bank teller copy',
          recordedBy: 'Mr. Jude Okafor (Bursar)',
          recordedAt: '2025-01-20T09:20:00Z',
        },
      ];
    } else if (i === 3) {
      // Unpaid: ₦0 paid (0%)
      totalPaid = 0;
      payments = [];
    } else if (i === 4) {
      // Partial: Paid ₦160,000 (78% paid)
      totalPaid = 160000;
      payments = [
        {
          id: `pay-${st.id}-1`,
          transactionReference: `PAY-2025-01-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          studentId: st.id,
          amount: 160000,
          paymentDate: '2025-01-22',
          channel: 'PAYSTACK',
          status: 'SUCCESS',
          payerName: st.guardianName || 'Mrs. Adeyemi',
          notes: 'Tuition + Feeding paid upfront',
          recordedBy: 'Paystack Gateway',
          recordedAt: '2025-01-22T13:00:00Z',
        },
      ];
    } else {
      // Default: Cleared or Partial
      const isCleared = i % 2 === 0;
      totalPaid = isCleared ? totalBilled : Math.round(totalBilled * 0.6);
      payments = [
        {
          id: `pay-${st.id}-1`,
          transactionReference: `TRX-2025-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          studentId: st.id,
          amount: totalPaid,
          paymentDate: '2025-01-18',
          channel: i % 3 === 0 ? 'PAYSTACK' : 'BANK_TRANSFER_MANUAL',
          status: 'SUCCESS',
          payerName: st.guardianName || `${st.lastName} Family`,
          bankName: 'GTBank PLC',
          notes: isCleared ? 'Full term fees cleared' : 'Term fee deposit',
          recordedBy: 'Bursar Office',
          recordedAt: '2025-01-18T10:00:00Z',
        },
      ];
    }

    // Step 16: Seed discounts for sample students
    let appliedDiscounts: AppliedDiscount[] = [];
    let discountAmount = 0;

    if (i === 1) {
      // Sibling discount (10% off tuition = ₦12,000 saved)
      const siblingDiscount: AppliedDiscount = {
        ruleId: 'rule-sibling-2nd',
        ruleName: 'Sibling Discount (2nd Child)',
        discountType: 'SIBLING',
        amountSaved: 12000,
        appliedAt: '2025-01-10T08:00:00Z',
        notes: 'Second child enrolled from Bello family',
      };
      appliedDiscounts.push(siblingDiscount);
      discountAmount += 12000;
    } else if (i === 3) {
      // Staff-child waiver (50% off tuition = ₦60,000 saved)
      const staffWaiver: AppliedDiscount = {
        ruleId: 'rule-staff-child',
        ruleName: 'Staff-Child Tuition Waiver',
        discountType: 'STAFF_CHILD',
        amountSaved: 60000,
        appliedAt: '2025-01-08T10:00:00Z',
        notes: 'Child of Mrs. Folashade Alabi (Head of Sciences)',
      };
      appliedDiscounts.push(staffWaiver);
      discountAmount += 60000;
    }

    const grossBilled = totalBilled;
    const netBilled = Math.max(0, grossBilled - discountAmount);
    totalBilled = netBilled;

    const balanceDue = Math.max(0, totalBilled - totalPaid);
    const percentagePaid = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;
    const status: 'CLEARED' | 'PARTIAL' | 'UNPAID' =
      balanceDue === 0 ? 'CLEARED' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';

    return {
      id: `fee-acc-${st.id}-2024-t3`,
      schoolId: TENANT_SCHOOL_ID,
      studentId: st.id,
      studentName: `${st.firstName} ${st.middleName ? st.middleName + ' ' : ''}${st.lastName}`,
      admissionNumber: st.admissionNumber,
      avatarUrl: st.avatarUrl,
      classLevel: st.classLevel,
      classArm: st.classArm,
      sessionYear,
      termName,
      grossBilled,
      discountAmount,
      appliedDiscounts,
      totalBilled,
      totalPaid,
      balanceDue,
      percentagePaid,
      status,
      payments,
    };
  });
}

/**
 * Fetch all student fee accounts for current tenant
 */
export function getAllStudentFeeAccounts(): StudentFeeAccount[] {
  try {
    const raw = localStorage.getItem(STUDENT_FEE_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      const seeded = generateSeedStudentFeeAccounts();
      localStorage.setItem(STUDENT_FEE_ACCOUNTS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const accounts = JSON.parse(raw);
    // Ensure all accounts have grossBilled, discountAmount, appliedDiscounts initialized
    return accounts.map((acc: any) => ({
      ...acc,
      grossBilled: acc.grossBilled ?? acc.totalBilled,
      discountAmount: acc.discountAmount ?? 0,
      appliedDiscounts: acc.appliedDiscounts ?? [],
    }));
  } catch (err) {
    console.error('Error fetching student fee accounts:', err);
    return generateSeedStudentFeeAccounts();
  }
}

/**
 * Get fee account for a specific student
 */
export function getStudentFeeAccount(studentId: string): StudentFeeAccount | null {
  const accounts = getAllStudentFeeAccounts();
  return accounts.find((a) => a.studentId === studentId) || null;
}

/**
 * Record a new payment (via Paystack, Flutterwave, or Manual Bank Transfer)
 * INVARIANT: Strictly checks for duplicate idempotencyKey or transactionReference
 * to guarantee that duplicate requests or webhooks do NOT double-credit.
 */
export function recordStudentPayment(params: {
  studentId: string;
  amount: number;
  channel: PaymentGatewayType;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  bankName?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
  notes?: string;
  recordedBy: string;
  idempotencyKey?: string;
  transactionReference?: string;
}): { success: boolean; updatedAccount?: StudentFeeAccount; error?: string; isDuplicate?: boolean } {
  const accounts = getAllStudentFeeAccounts();
  const idx = accounts.findIndex((a) => a.studentId === params.studentId);

  if (idx === -1) {
    return { success: false, error: 'Student fee account not found' };
  }

  const current = accounts[idx];

  // 1. Check for Duplicate Idempotency Key or Reference
  if (params.idempotencyKey) {
    const existingByIdempotency = current.payments.find(
      (p) => p.idempotencyKey === params.idempotencyKey
    );
    if (existingByIdempotency) {
      return {
        success: true,
        updatedAccount: current,
        isDuplicate: true,
      };
    }
  }

  if (params.transactionReference) {
    const existingByRef = current.payments.find(
      (p) => p.transactionReference === params.transactionReference
    );
    if (existingByRef) {
      return {
        success: true,
        updatedAccount: current,
        isDuplicate: true,
      };
    }
  }

  const refPrefix =
    params.channel === 'PAYSTACK'
      ? 'PSTK'
      : params.channel === 'FLUTTERWAVE'
      ? 'FLW'
      : 'MNL';
  const transactionReference =
    params.transactionReference ||
    `${refPrefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newPayment: StudentPaymentRecord = {
    id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    transactionReference,
    idempotencyKey: params.idempotencyKey,
    studentId: params.studentId,
    amount: params.amount,
    paymentDate: new Date().toISOString().split('T')[0],
    channel: params.channel,
    status: 'SUCCESS',
    payerName: params.payerName || current.studentName,
    payerEmail: params.payerEmail,
    payerPhone: params.payerPhone,
    bankName: params.bankName,
    proofDocumentUrl: params.proofDocumentUrl,
    proofDocumentName: params.proofDocumentName,
    notes: params.notes,
    recordedBy: params.recordedBy,
    recordedAt: new Date().toISOString(),
  };

  const updatedPayments = [newPayment, ...current.payments];
  const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
  const newBalance = Math.max(0, current.totalBilled - newTotalPaid);
  const newPercentage =
    current.totalBilled > 0
      ? Math.min(100, Math.round((newTotalPaid / current.totalBilled) * 100))
      : 100;
  const newStatus: 'CLEARED' | 'PARTIAL' | 'UNPAID' =
    newBalance === 0 ? 'CLEARED' : newTotalPaid > 0 ? 'PARTIAL' : 'UNPAID';

  const updatedAccount: StudentFeeAccount = {
    ...current,
    totalPaid: newTotalPaid,
    balanceDue: newBalance,
    percentagePaid: newPercentage,
    status: newStatus,
    payments: updatedPayments,
  };

  accounts[idx] = updatedAccount;

  try {
    localStorage.setItem(STUDENT_FEE_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    return { success: true, updatedAccount, isDuplicate: false };
  } catch (err: any) {
    console.error('Error saving payment record:', err);
    return { success: false, error: err.message || 'Failed to persist payment' };
  }
}

// =========================================================================
// STEP 16: DISCOUNT & WAIVER ENGINE MANAGEMENT
// =========================================================================

export function getAvailableDiscountRules(): FeeDiscountRule[] {
  try {
    const raw = localStorage.getItem(DISCOUNT_RULES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DISCOUNT_RULES_STORAGE_KEY, JSON.stringify(DEFAULT_DISCOUNT_RULES));
      return DEFAULT_DISCOUNT_RULES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DISCOUNT_RULES;
  }
}

export function saveDiscountRules(rules: FeeDiscountRule[]): void {
  localStorage.setItem(DISCOUNT_RULES_STORAGE_KEY, JSON.stringify(rules));
}

export function toggleDiscountRule(ruleId: string): FeeDiscountRule[] {
  const rules = getAvailableDiscountRules();
  const updated = rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
  saveDiscountRules(updated);
  return updated;
}

export function addDiscountRule(rule: FeeDiscountRule): FeeDiscountRule[] {
  const rules = getAvailableDiscountRules();
  const updated = [rule, ...rules];
  saveDiscountRules(updated);
  return updated;
}

/**
 * Apply a set of discounts to a student's fee account and recalculate net billed & balance
 */
export function applyDiscountsToStudentAccount(
  studentId: string,
  discounts: AppliedDiscount[]
): { success: boolean; account?: StudentFeeAccount; error?: string } {
  const accounts = getAllStudentFeeAccounts();
  const idx = accounts.findIndex((a) => a.studentId === studentId);
  if (idx === -1) return { success: false, error: 'Student fee account not found' };

  const current = accounts[idx];
  const grossBilled = current.grossBilled || current.totalBilled;
  const totalDiscount = discounts.reduce((sum, d) => sum + d.amountSaved, 0);
  const netBilled = Math.max(0, grossBilled - totalDiscount);
  const balanceDue = Math.max(0, netBilled - current.totalPaid);
  const percentagePaid =
    netBilled > 0 ? Math.min(100, Math.round((current.totalPaid / netBilled) * 100)) : 100;
  const status: 'CLEARED' | 'PARTIAL' | 'UNPAID' =
    balanceDue === 0 ? 'CLEARED' : current.totalPaid > 0 ? 'PARTIAL' : 'UNPAID';

  const updated: StudentFeeAccount = {
    ...current,
    grossBilled,
    discountAmount: totalDiscount,
    appliedDiscounts: discounts,
    totalBilled: netBilled,
    balanceDue,
    percentagePaid,
    status,
  };

  accounts[idx] = updated;
  localStorage.setItem(STUDENT_FEE_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  return { success: true, account: updated };
}

// =========================================================================
// STEP 16: AUTOMATED PAYMENT REMINDERS (EMAIL & SMS)
// =========================================================================

export function getStoredPaymentReminders(): PaymentReminderNotification[] {
  try {
    const raw = localStorage.getItem(PAYMENT_REMINDERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePaymentReminders(reminders: PaymentReminderNotification[]): void {
  localStorage.setItem(PAYMENT_REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
}

export function dispatchPaymentReminder(params: {
  studentId: string;
  channel: 'EMAIL' | 'SMS' | 'MULTI_CHANNEL';
  stage: ReminderTriggerStage;
  customMessage?: string;
}): PaymentReminderNotification | null {
  const account = getStudentFeeAccount(params.studentId);
  if (!account) return null;

  const students = getEnrichedStudents();
  const student = students.find((s) => s.id === params.studentId);

  const guardianName = student?.guardianName || `${account.studentName}'s Guardian`;
  const guardianEmail = student?.guardianEmail || 'parent@example.ng';
  const guardianPhone = student?.guardianPhone || '+234 803 123 4567';
  const dueDate = '2025-02-15';

  let stageLabel = '';
  switch (params.stage) {
    case 'UPCOMING_14_DAYS':
      stageLabel = 'Friendly Notice: Term fee balance due in 14 days';
      break;
    case 'UPCOMING_3_DAYS':
      stageLabel = 'Urgent Reminder: Term fee balance due in 3 days';
      break;
    case 'ON_DUE_DATE':
      stageLabel = 'Payment Due Today: Please complete term fee clearance';
      break;
    case 'OVERDUE_7_DAYS':
      stageLabel = 'Overdue Notice (7 Days): Immediate fee clearance requested';
      break;
    case 'OVERDUE_14_DAYS':
      stageLabel = 'Final Notice (14 Days Overdue): Bursary clearance required';
      break;
    default:
      stageLabel = 'Direct Bursary Notice: Outstanding term fee settlement';
  }

  const messageBody =
    params.customMessage ||
    `Dear ${guardianName}, this is an official notification from Apex Horizon Academy Bursary. ${account.studentName} has an outstanding balance of ₦${account.balanceDue.toLocaleString()}. Due date: ${dueDate}. Please settle via Paystack or direct bank transfer to ensure uninterrupted hostel & exam clearance.`;

  const notification: PaymentReminderNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId: params.studentId,
    studentName: account.studentName,
    guardianName,
    guardianEmail,
    guardianPhone,
    amountDue: account.balanceDue,
    dueDate,
    channel: params.channel,
    triggerStage: params.stage,
    messageBody,
    sentAt: new Date().toISOString(),
    status: 'DELIVERED',
  };

  const existing = getStoredPaymentReminders();
  savePaymentReminders([notification, ...existing]);
  return notification;
}

export function dispatchBulkPaymentReminders(
  studentIds: string[],
  channel: 'EMAIL' | 'SMS' | 'MULTI_CHANNEL' = 'MULTI_CHANNEL'
): { dispatchedCount: number; notifications: PaymentReminderNotification[] } {
  const created: PaymentReminderNotification[] = [];
  for (const id of studentIds) {
    const notif = dispatchPaymentReminder({
      studentId: id,
      channel,
      stage: 'MANUAL_DISPATCH',
    });
    if (notif) created.push(notif);
  }
  return { dispatchedCount: created.length, notifications: created };
}

// =========================================================================
// STEP 16: OUTSTANDING BALANCE & AGING ANALYSIS
// =========================================================================

export interface OutstandingBalanceAnalytics {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number; // %
  clearedCount: number;
  partialCount: number;
  unpaidCount: number;
  aging: {
    current: number; // 0 - 14 days
    aging15To30: number; // 15 - 30 days
    aging31To60: number; // 31 - 60 days
    agingOver60: number; // 60+ days
  };
}

export function getOutstandingBalanceAnalytics(): OutstandingBalanceAnalytics {
  const accounts = getAllStudentFeeAccounts();

  let totalBilled = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let clearedCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  // Aging categories
  let current = 0;
  let aging15To30 = 0;
  let aging31To60 = 0;
  let agingOver60 = 0;

  accounts.forEach((acc, i) => {
    totalBilled += acc.totalBilled;
    totalCollected += acc.totalPaid;
    totalOutstanding += acc.balanceDue;

    if (acc.status === 'CLEARED') clearedCount++;
    else if (acc.status === 'PARTIAL') partialCount++;
    else unpaidCount++;

    if (acc.balanceDue > 0) {
      // Bucket aging according to sample distribution
      if (i % 4 === 0) agingOver60 += acc.balanceDue;
      else if (i % 3 === 0) aging31To60 += acc.balanceDue;
      else if (i % 2 === 0) aging15To30 += acc.balanceDue;
      else current += acc.balanceDue;
    }
  });

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return {
    totalBilled,
    totalCollected,
    totalOutstanding,
    collectionRate,
    clearedCount,
    partialCount,
    unpaidCount,
    aging: {
      current,
      aging15To30,
      aging31To60,
      agingOver60,
    },
  };
}
