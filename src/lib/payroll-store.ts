/**
 * STEP 23 — Staff Payroll Store & Engine
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: All staff, payroll runs, and payslips enforce `school_id: 'school-apex-01'`.
 * 2. Transparent Salary Structure: Basic Pay, itemized allowances, statutory deductions (PAYE, Pension 8%).
 * 3. Attendance-Tied Deductions: Unexcused absences automatically deduct daily pro-rated wage.
 * 4. Audit & Disbursement Tracking: Every pay run has a verifiable batch reference and log.
 * 5. Printable / Automated Payslip Generation: Ready for instant PDF rendering & print.
 */

import {
  StaffMember,
  MonthlyPayrollRun,
  StaffPayslip,
} from '../types';
import { enqueueOfflineAction } from './offline-queue';

const STAFF_STORAGE_KEY = 'sms_staff_records_v1';
const PAYROLL_RUNS_KEY = 'sms_payroll_runs_v1';
const PAYSLIPS_STORAGE_KEY = 'sms_payslips_v1';
const DEFAULT_SCHOOL_ID = 'school-apex-01';

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-01',
    school_id: DEFAULT_SCHOOL_ID,
    employeeCode: 'EMP/2021/014',
    name: 'Mr. David Okonjo',
    email: 'david.okonjo@apexacademy.edu',
    phone: '+234 803 219 4432',
    role: 'Head of Mathematics',
    department: 'Sciences & Mathematics',
    employmentDate: '2021-09-01',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    bankDetails: {
      bankName: 'Guaranty Trust Bank (GTBank)',
      accountNumber: '0129485721',
      accountName: 'DAVID IFEANYI OKONJO',
      bvnMasked: '2234****891',
      sortCode: '058152062',
    },
    salary: {
      basicPay: 280000,
      housingAllowance: 65000,
      transportAllowance: 35000,
      teachingAllowance: 30000,
      responsibilityAllowance: 25000, // Department Head
      mealAllowance: 15000,
      payeTaxRate: 0.08,
      pensionEmployeeRate: 0.08,
      unionDues: 3000,
      healthInsurance: 5000,
    },
    attendanceThisMonth: {
      month: '2024-11',
      workingDays: 22,
      daysWorked: 22,
      unexcusedAbsences: 0,
      approvedLeaves: 0,
      dailyWageRate: 12727,
      absenceDeduction: 0,
    },
  },
  {
    id: 'staff-02',
    school_id: DEFAULT_SCHOOL_ID,
    employeeCode: 'EMP/2020/008',
    name: 'Mrs. Rebecca Mensah',
    email: 'rebecca.mensah@apexacademy.edu',
    phone: '+234 802 811 9023',
    role: 'Senior English Literature Teacher',
    department: 'Languages & Humanities',
    employmentDate: '2020-01-15',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    bankDetails: {
      bankName: 'Access Bank Plc',
      accountNumber: '0039481729',
      accountName: 'REBECCA AFUA MENSAH',
      bvnMasked: '2219****304',
      sortCode: '044150149',
    },
    salary: {
      basicPay: 260000,
      housingAllowance: 60000,
      transportAllowance: 30000,
      teachingAllowance: 25000,
      responsibilityAllowance: 15000,
      mealAllowance: 15000,
      payeTaxRate: 0.08,
      pensionEmployeeRate: 0.08,
      unionDues: 3000,
      healthInsurance: 5000,
    },
    attendanceThisMonth: {
      month: '2024-11',
      workingDays: 22,
      daysWorked: 21,
      unexcusedAbsences: 1, // 1 unexcused day
      approvedLeaves: 0,
      dailyWageRate: 11818,
      absenceDeduction: 11818,
    },
  },
  {
    id: 'staff-03',
    school_id: DEFAULT_SCHOOL_ID,
    employeeCode: 'EMP/2019/003',
    name: 'Dr. Samuel Okafor',
    email: 'samuel.okafor@apexacademy.edu',
    phone: '+234 805 321 0089',
    role: 'Senior Science Master & Lab Coordinator',
    department: 'Sciences & Mathematics',
    employmentDate: '2019-08-20',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    bankDetails: {
      bankName: 'Zenith Bank Plc',
      accountNumber: '2081948271',
      accountName: 'SAMUEL CHUKWUMA OKAFOR',
      bvnMasked: '2221****998',
      sortCode: '057150013',
    },
    salary: {
      basicPay: 310000,
      housingAllowance: 70000,
      transportAllowance: 40000,
      teachingAllowance: 35000,
      responsibilityAllowance: 30000,
      mealAllowance: 15000,
      payeTaxRate: 0.09,
      pensionEmployeeRate: 0.08,
      unionDues: 3000,
      healthInsurance: 5000,
    },
    attendanceThisMonth: {
      month: '2024-11',
      workingDays: 22,
      daysWorked: 22,
      unexcusedAbsences: 0,
      approvedLeaves: 0,
      dailyWageRate: 14090,
      absenceDeduction: 0,
    },
  },
  {
    id: 'staff-04',
    school_id: DEFAULT_SCHOOL_ID,
    employeeCode: 'EMP/2022/029',
    name: 'Ms. Ngozi Nwosu',
    email: 'ngozi.nwosu@apexacademy.edu',
    phone: '+234 814 998 1234',
    role: 'Computer Science & ICT Lead',
    department: 'Information Technology',
    employmentDate: '2022-03-01',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    bankDetails: {
      bankName: 'United Bank for Africa (UBA)',
      accountNumber: '1029384756',
      accountName: 'NGOZI CHIAMAKA NWOSU',
      bvnMasked: '2240****712',
      sortCode: '033153513',
    },
    salary: {
      basicPay: 275000,
      housingAllowance: 65000,
      transportAllowance: 35000,
      teachingAllowance: 30000,
      responsibilityAllowance: 20000,
      mealAllowance: 15000,
      payeTaxRate: 0.08,
      pensionEmployeeRate: 0.08,
      unionDues: 3000,
      healthInsurance: 5000,
    },
    attendanceThisMonth: {
      month: '2024-11',
      workingDays: 22,
      daysWorked: 22,
      unexcusedAbsences: 0,
      approvedLeaves: 0,
      dailyWageRate: 12500,
      absenceDeduction: 0,
    },
  },
  {
    id: 'staff-05',
    school_id: DEFAULT_SCHOOL_ID,
    employeeCode: 'EMP/2018/002',
    name: 'Mrs. Folashade Adeleke',
    email: 'folashade.adeleke@apexacademy.edu',
    phone: '+234 803 555 1212',
    role: 'Chief Bursar & Finance Director',
    department: 'Finance & Administration',
    employmentDate: '2018-02-01',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    bankDetails: {
      bankName: 'First Bank of Nigeria',
      accountNumber: '3049182736',
      accountName: 'FOLASHADE OLUWATOYIN ADELEKE',
      bvnMasked: '2211****430',
      sortCode: '011151003',
    },
    salary: {
      basicPay: 380000,
      housingAllowance: 90000,
      transportAllowance: 50000,
      teachingAllowance: 0,
      responsibilityAllowance: 50000,
      mealAllowance: 20000,
      payeTaxRate: 0.10,
      pensionEmployeeRate: 0.08,
      unionDues: 3000,
      healthInsurance: 5000,
    },
    attendanceThisMonth: {
      month: '2024-11',
      workingDays: 22,
      daysWorked: 22,
      unexcusedAbsences: 0,
      approvedLeaves: 0,
      dailyWageRate: 17272,
      absenceDeduction: 0,
    },
  },
];

export const INITIAL_PAYROLL_RUNS: MonthlyPayrollRun[] = [
  {
    id: 'payrun-2024-10',
    school_id: DEFAULT_SCHOOL_ID,
    sessionYear: '2024/2025',
    month: 'October 2024',
    runDate: '2024-10-28T14:00:00Z',
    totalStaffCount: 5,
    totalBasicPay: 1505000,
    totalAllowances: 840000,
    totalGrossPay: 2345000,
    totalTaxPAYE: 198400,
    totalPension: 120400,
    totalAbsenceDeductions: 0,
    totalOtherDeductions: 40000,
    totalDeductions: 358800,
    totalNetPay: 1986200,
    status: 'DISBURSED',
    batchPaymentReference: 'NIP/BATCH/20241028/APX99182',
    disbursedAt: '2024-10-28T16:45:00Z',
    approvedBy: 'Dr. Olumide Johnson (Principal)',
  },
];

export function getStaffMembers(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF_MEMBERS));
      return INITIAL_STAFF_MEMBERS;
    }
    const parsed: StaffMember[] = JSON.parse(raw);
    return parsed.filter((s) => !s.school_id || s.school_id === DEFAULT_SCHOOL_ID);
  } catch (err) {
    console.error('Failed to load staff records:', err);
    return INITIAL_STAFF_MEMBERS;
  }
}

export function saveStaffMembers(records: StaffMember[]): void {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save staff records:', err);
  }
}

export function getPayrollRuns(): MonthlyPayrollRun[] {
  try {
    const raw = localStorage.getItem(PAYROLL_RUNS_KEY);
    if (!raw) {
      localStorage.setItem(PAYROLL_RUNS_KEY, JSON.stringify(INITIAL_PAYROLL_RUNS));
      return INITIAL_PAYROLL_RUNS;
    }
    const parsed: MonthlyPayrollRun[] = JSON.parse(raw);
    return parsed.filter((r) => !r.school_id || r.school_id === DEFAULT_SCHOOL_ID);
  } catch (err) {
    console.error('Failed to load payroll runs:', err);
    return INITIAL_PAYROLL_RUNS;
  }
}

export function savePayrollRuns(runs: MonthlyPayrollRun[]): void {
  try {
    localStorage.setItem(PAYROLL_RUNS_KEY, JSON.stringify(runs));
  } catch (err) {
    console.error('Failed to save payroll runs:', err);
  }
}

export function getPayslips(): StaffPayslip[] {
  try {
    const raw = localStorage.getItem(PAYSLIPS_STORAGE_KEY);
    if (!raw) {
      // Auto generate initial payslips for October 2024
      const initialPayslips = generatePayslipsForRun(INITIAL_PAYROLL_RUNS[0], INITIAL_STAFF_MEMBERS);
      localStorage.setItem(PAYSLIPS_STORAGE_KEY, JSON.stringify(initialPayslips));
      return initialPayslips;
    }
    const parsed: StaffPayslip[] = JSON.parse(raw);
    return parsed.filter((p) => !p.school_id || p.school_id === DEFAULT_SCHOOL_ID);
  } catch (err) {
    console.error('Failed to load payslips:', err);
    return [];
  }
}

export function savePayslips(payslips: StaffPayslip[]): void {
  try {
    localStorage.setItem(PAYSLIPS_STORAGE_KEY, JSON.stringify(payslips));
  } catch (err) {
    console.error('Failed to save payslips:', err);
  }
}

/**
 * Calculates a single staff member's gross, deductions, and net pay
 */
export function calculateStaffPay(staff: StaffMember) {
  const { salary, attendanceThisMonth } = staff;
  const basic = salary.basicPay;
  const totalAllowances =
    salary.housingAllowance +
    salary.transportAllowance +
    salary.teachingAllowance +
    salary.responsibilityAllowance +
    salary.mealAllowance;

  const grossPay = basic + totalAllowances;

  // Statutory Deductions
  const payeTax = Math.round(grossPay * salary.payeTaxRate);
  const pension = Math.round(basic * salary.pensionEmployeeRate); // 8% of basic
  const unionDues = salary.unionDues;
  const healthInsurance = salary.healthInsurance;
  const absenceDeduction = attendanceThisMonth.absenceDeduction || 0;

  const totalDeductions = payeTax + pension + unionDues + healthInsurance + absenceDeduction;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    basic,
    totalAllowances,
    grossPay,
    payeTax,
    pension,
    unionDues,
    healthInsurance,
    absenceDeduction,
    totalDeductions,
    netPay,
  };
}

export function generatePayslipsForRun(run: MonthlyPayrollRun, staffList: StaffMember[]): StaffPayslip[] {
  return staffList.map((staff) => {
    const pay = calculateStaffPay(staff);
    const maskedAcc = `${staff.bankDetails.bankName} (•••• ${staff.bankDetails.accountNumber.slice(-4)})`;
    return {
      id: `slip-${run.id}-${staff.id}`,
      payrollRunId: run.id,
      school_id: DEFAULT_SCHOOL_ID,
      staffId: staff.id,
      staffName: staff.name,
      employeeCode: staff.employeeCode,
      department: staff.department,
      jobTitle: staff.role,
      month: run.month,
      sessionYear: run.sessionYear,
      basicPay: pay.basic,
      allowances: [
        { name: 'Housing Allowance', amount: staff.salary.housingAllowance },
        { name: 'Transport Allowance', amount: staff.salary.transportAllowance },
        { name: 'Teaching Allowance', amount: staff.salary.teachingAllowance },
        { name: 'Responsibility Allowance', amount: staff.salary.responsibilityAllowance },
        { name: 'Meal Allowance', amount: staff.salary.mealAllowance },
      ].filter((a) => a.amount > 0),
      grossPay: pay.grossPay,
      deductions: [
        { name: 'PAYE Income Tax', amount: pay.payeTax },
        { name: 'Statutory Pension (8%)', amount: pay.pension },
        { name: 'Health Insurance (NHIS)', amount: pay.healthInsurance },
        { name: 'Staff Welfare & Union', amount: pay.unionDues },
        ...(pay.absenceDeduction > 0
          ? [{ name: `Unexcused Absences (${staff.attendanceThisMonth.unexcusedAbsences} day(s))`, amount: pay.absenceDeduction }]
          : []),
      ].filter((d) => d.amount > 0),
      totalDeductions: pay.totalDeductions,
      netPay: pay.netPay,
      bankDetailsMasked: maskedAcc,
      status: run.status === 'DISBURSED' ? 'PAID' : 'PENDING',
      paymentReference: `${run.batchPaymentReference || 'REF'}-${staff.employeeCode.replace(/\//g, '')}`,
      generatedAt: run.runDate,
    };
  });
}

/**
 * Creates a new monthly payroll run and generates individual payslips
 */
export function executeMonthlyPayrollRun(
  monthName: string, // e.g. "November 2024"
  sessionYear: string, // e.g. "2024/2025"
  operatorName: string
): { run: MonthlyPayrollRun; payslips: StaffPayslip[] } {
  const staffList = getStaffMembers().filter((s) => s.status === 'ACTIVE');
  let totalBasic = 0;
  let totalAllowances = 0;
  let totalGross = 0;
  let totalTax = 0;
  let totalPension = 0;
  let totalAbsences = 0;
  let totalOtherDeductions = 0;

  staffList.forEach((staff) => {
    const pay = calculateStaffPay(staff);
    totalBasic += pay.basic;
    totalAllowances += pay.totalAllowances;
    totalGross += pay.grossPay;
    totalTax += pay.payeTax;
    totalPension += pay.pension;
    totalAbsences += pay.absenceDeduction;
    totalOtherDeductions += pay.unionDues + pay.healthInsurance;
  });

  const totalDeductions = totalTax + totalPension + totalAbsences + totalOtherDeductions;
  const totalNet = totalGross - totalDeductions;

  const runId = `payrun-${Date.now()}`;
  const newRun: MonthlyPayrollRun = {
    id: runId,
    school_id: DEFAULT_SCHOOL_ID,
    sessionYear,
    month: monthName,
    runDate: new Date().toISOString(),
    totalStaffCount: staffList.length,
    totalBasicPay: totalBasic,
    totalAllowances,
    totalGrossPay: totalGross,
    totalTaxPAYE: totalTax,
    totalPension: totalPension,
    totalAbsenceDeductions: totalAbsences,
    totalOtherDeductions,
    totalDeductions,
    totalNetPay: totalNet,
    status: 'DRAFT',
    approvedBy: operatorName,
  };

  const existingRuns = getPayrollRuns();
  const updatedRuns = [newRun, ...existingRuns];
  savePayrollRuns(updatedRuns);

  const generatedPayslips = generatePayslipsForRun(newRun, staffList);
  const existingPayslips = getPayslips();
  const updatedPayslips = [...generatedPayslips, ...existingPayslips];
  savePayslips(updatedPayslips);

  enqueueOfflineAction('/api/payroll/runs', 'POST', newRun, `Generated Payroll Run for ${monthName}`);

  return { run: newRun, payslips: generatedPayslips };
}

export function disbursePayrollRun(runId: string, approvedByName: string): MonthlyPayrollRun | null {
  const runs = getPayrollRuns();
  const index = runs.findIndex((r) => r.id === runId);
  if (index === -1) return null;

  const batchRef = `NIP/BATCH/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/APX${Math.floor(10000 + Math.random() * 90000)}`;
  const updatedRun: MonthlyPayrollRun = {
    ...runs[index],
    status: 'DISBURSED',
    batchPaymentReference: batchRef,
    disbursedAt: new Date().toISOString(),
    approvedBy: approvedByName,
  };

  runs[index] = updatedRun;
  savePayrollRuns(runs);

  // Update payslips status to PAID
  const payslips = getPayslips();
  const updatedPayslips = payslips.map((p) => {
    if (p.payrollRunId === runId) {
      return {
        ...p,
        status: 'PAID' as const,
        paymentReference: `${batchRef}-${p.employeeCode.replace(/\//g, '')}`,
      };
    }
    return p;
  });
  savePayslips(updatedPayslips);

  enqueueOfflineAction(`/api/payroll/runs/${runId}/disburse`, 'POST', { batchRef }, `Disbursed Payroll Run ${runId}`);

  return updatedRun;
}

export function updateStaffAttendanceAbsence(
  staffId: string,
  unexcusedAbsences: number,
  approvedLeaves: number
): StaffMember | null {
  const staffList = getStaffMembers();
  const index = staffList.findIndex((s) => s.id === staffId);
  if (index === -1) return null;

  const staff = staffList[index];
  const workingDays = 22;
  const dailyRate = Math.round(staff.salary.basicPay / workingDays);
  const absenceDeduction = unexcusedAbsences * dailyRate;
  const daysWorked = Math.max(0, workingDays - unexcusedAbsences - approvedLeaves);

  const updatedStaff: StaffMember = {
    ...staff,
    attendanceThisMonth: {
      ...staff.attendanceThisMonth,
      unexcusedAbsences,
      approvedLeaves,
      daysWorked,
      dailyWageRate: dailyRate,
      absenceDeduction,
    },
  };

  staffList[index] = updatedStaff;
  saveStaffMembers(staffList);
  return updatedStaff;
}
