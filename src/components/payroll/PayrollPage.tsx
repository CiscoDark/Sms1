import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Banknote,
  DollarSign,
  Users,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Plus,
  QrCode,
  CreditCard,
  Percent,
} from 'lucide-react';
import {
  StaffMember,
  MonthlyPayrollRun,
  StaffPayslip,
  UserProfile,
} from '../../types';
import {
  getStaffMembers,
  getPayrollRuns,
  getPayslips,
  calculateStaffPay,
  executeMonthlyPayrollRun,
  disbursePayrollRun,
  updateStaffAttendanceAbsence,
} from '../../lib/payroll-store';
import { formatNaira } from '../../lib/currency';

interface PayrollPageProps {
  currentUser: UserProfile;
  onLogAudit: (action: string, details: string) => void;
}

export const PayrollPage: React.FC<PayrollPageProps> = ({
  currentUser,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'runs' | 'staff' | 'attendance' | 'payslips'>('runs');
  const [staffList, setStaffList] = useState<StaffMember[]>(() => getStaffMembers());
  const [payrollRuns, setPayrollRuns] = useState<MonthlyPayrollRun[]>(() => getPayrollRuns());
  const [payslips, setPayslips] = useState<StaffPayslip[]>(() => getPayslips());

  // Modal States
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<StaffPayslip | null>(null);
  const [editingAttendanceStaff, setEditingAttendanceStaff] = useState<StaffMember | null>(null);

  // New Run Form
  const [newRunMonth, setNewRunMonth] = useState('November 2024');
  const [newRunSession, setNewRunSession] = useState('2024/2025');

  // Attendance Form State
  const [unexcusedDays, setUnexcusedDays] = useState(0);
  const [approvedLeaveDays, setApprovedLeaveDays] = useState(0);

  const isAdminOrBursar = ['SUPER_ADMIN', 'PRINCIPAL', 'BURSAR'].includes(currentUser.role);
  const isTeacher = currentUser.role === 'TEACHER';

  // Overall KPI aggregates
  const totalMonthlyPayrollExpense = useMemo(() => {
    return staffList.reduce((acc, staff) => acc + calculateStaffPay(staff).grossPay, 0);
  }, [staffList]);

  const totalNetDisbursed = useMemo(() => {
    return staffList.reduce((acc, staff) => acc + calculateStaffPay(staff).netPay, 0);
  }, [staffList]);

  // Execute New Payroll Run
  const handleExecuteRun = (e: React.FormEvent) => {
    e.preventDefault();
    const result = executeMonthlyPayrollRun(newRunMonth, newRunSession, currentUser.name);
    setPayrollRuns(getPayrollRuns());
    setPayslips(getPayslips());
    setIsRunModalOpen(false);

    onLogAudit(
      'PAYROLL_RUN_EXECUTED',
      `Generated draft payroll run for ${newRunMonth} (${result.run.totalStaffCount} staff, Net: ${formatNaira(result.run.totalNetPay)})`
    );
  };

  // Disburse Payroll Run
  const handleDisburse = (runId: string) => {
    const updated = disbursePayrollRun(runId, currentUser.name);
    if (updated) {
      setPayrollRuns(getPayrollRuns());
      setPayslips(getPayslips());
      onLogAudit(
        'PAYROLL_DISBURSED',
        `Disbursed payroll for ${updated.month} (Ref: ${updated.batchPaymentReference})`
      );
    }
  };

  // Update Attendance
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendanceStaff) return;

    const updated = updateStaffAttendanceAbsence(editingAttendanceStaff.id, unexcusedDays, approvedLeaveDays);
    if (updated) {
      setStaffList(getStaffMembers());
      setEditingAttendanceStaff(null);
      onLogAudit(
        'STAFF_ATTENDANCE_ADJUSTED',
        `Adjusted unexcused absences for ${updated.name}: ${unexcusedDays} days (Deduction: ${formatNaira(updated.attendanceThisMonth.absenceDeduction)})`
      );
    }
  };

  // If user is a teacher, filter payslips to their own
  const userPayslips = useMemo(() => {
    if (isAdminOrBursar) return payslips;
    return payslips.filter((p) => p.staffName.toLowerCase().includes(currentUser.name.toLowerCase()));
  }, [payslips, isAdminOrBursar, currentUser.name]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold">Staff Payroll & Compensation Hub</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Statutory PAYE & Pension
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Attendance Deduction Tied
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Automated salary disbursements, statutory deductions (8% Pension, PAYE Tax), attendance-linked wage adjustments, 
              and official printable PDF payslips with tenant verification stamps.
            </p>
          </div>
        </div>

        {isAdminOrBursar && (
          <button
            type="button"
            onClick={() => setIsRunModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Monthly Pay Run</span>
          </button>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Active Staff</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{staffList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Teaching & Admin Faculty</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Monthly Gross Payroll</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatNaira(totalMonthlyPayrollExpense)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Basic + Allowances</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Net Monthly Disbursement</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatNaira(totalNetDisbursed)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct Bank Remittance</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Statutory Pension (8%)</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatNaira(staffList.reduce((acc, s) => acc + calculateStaffPay(s).pension, 0))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Remitted to PFAs</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('runs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'runs'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Monthly Pay Runs ({payrollRuns.length})
        </button>

        {isAdminOrBursar && (
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Staff Directory & Salaries ({staffList.length})
          </button>
        )}

        {isAdminOrBursar && (
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Leave & Attendance Tracking
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('payslips')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'payslips'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isAdminOrBursar ? `All Payslips (${payslips.length})` : 'My Payslips'}
        </button>
      </div>

      {/* TAB 1: MONTHLY PAY RUNS */}
      {activeTab === 'runs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Pay Period</th>
                  <th className="py-3 px-4">Staff Count</th>
                  <th className="py-3 px-4">Gross Pay</th>
                  <th className="py-3 px-4">PAYE & Pension</th>
                  <th className="py-3 px-4">Absences Deductions</th>
                  <th className="py-3 px-4">Net Disbursement</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payrollRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{run.month}</div>
                      <div className="text-[11px] text-slate-500">{run.sessionYear} Academic Session</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {run.totalStaffCount} Employees
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      {formatNaira(run.totalGrossPay)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatNaira(run.totalTaxPAYE + run.totalPension)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-amber-600 dark:text-amber-400 font-mono">
                      {run.totalAbsenceDeductions > 0 ? `-${formatNaira(run.totalAbsenceDeductions)}` : '₦0.00'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNaira(run.totalNetPay)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          run.status === 'DISBURSED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {run.status === 'DISBURSED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{run.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {run.status === 'DRAFT' && isAdminOrBursar ? (
                        <button
                          type="button"
                          onClick={() => handleDisburse(run.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs cursor-pointer"
                        >
                          Authorize & Disburse
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-400">
                          {run.batchPaymentReference?.slice(0, 16)}...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY & SALARIES */}
      {activeTab === 'staff' && isAdminOrBursar && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Bank Account</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Estimated Net</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffList.map((staff) => {
                  const pay = calculateStaffPay(staff);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{staff.name}</div>
                        <div className="text-[11px] text-slate-500">{staff.employeeCode} • {staff.employmentDate}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{staff.role}</div>
                        <div className="text-[11px] text-slate-500">{staff.department}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{staff.bankDetails.bankName}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          •••• {staff.bankDetails.accountNumber.slice(-4)} (BVN: {staff.bankDetails.bvnMasked})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-900 dark:text-slate-100">
                        {formatNaira(staff.salary.basicPay)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {formatNaira(pay.totalAllowances)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNaira(pay.netPay)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {staff.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE & ATTENDANCE TRACKING TIED TO PAYROLL */}
      {activeTab === 'attendance' && isAdminOrBursar && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Attendance Deduction Engine:</span>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Staff daily wage rate is computed automatically as <code>Basic Pay / 22 Working Days</code>.
                Unexcused absences trigger pro-rated salary deductions on the current month's payroll run.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Working Days</th>
                    <th className="py-3 px-4">Days Worked</th>
                    <th className="py-3 px-4">Approved Leaves</th>
                    <th className="py-3 px-4">Unexcused Absences</th>
                    <th className="py-3 px-4">Daily Wage Rate</th>
                    <th className="py-3 px-4">Absence Deduction</th>
                    <th className="py-3 px-4 text-right">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{staff.name}</div>
                        <div className="text-[11px] text-slate-500">{staff.role}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">{staff.attendanceThisMonth.workingDays} days</td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-medium text-slate-900 dark:text-slate-100">
                        {staff.attendanceThisMonth.daysWorked} days
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {staff.attendanceThisMonth.approvedLeaves} days
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-rose-600 dark:text-rose-400">
                        {staff.attendanceThisMonth.unexcusedAbsences} day(s)
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {formatNaira(staff.attendanceThisMonth.dailyWageRate)}/day
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-rose-600 dark:text-rose-400">
                        {staff.attendanceThisMonth.absenceDeduction > 0
                          ? `-${formatNaira(staff.attendanceThisMonth.absenceDeduction)}`
                          : '₦0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAttendanceStaff(staff);
                            setUnexcusedDays(staff.attendanceThisMonth.unexcusedAbsences);
                            setApprovedLeaveDays(staff.attendanceThisMonth.approvedLeaves);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYSLIPS ARCHIVE */}
      {activeTab === 'payslips' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">Total Allowances</th>
                  <th className="py-3 px-4">Total Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Disbursement Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userPayslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{slip.staffName}</div>
                      <div className="text-[11px] text-slate-500">{slip.employeeCode} • {slip.department}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {slip.month}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">{formatNaira(slip.basicPay)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatNaira(slip.grossPay - slip.basicPay)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-rose-600 dark:text-rose-400">
                      -{formatNaira(slip.totalDeductions)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatNaira(slip.netPay)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        slip.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {slip.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPayslip(slip)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE PAYSLIP MODAL */}
      <AnimatePresence>
        {selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              {/* Top Modal Controls */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  Official Confidential Payslip Preview
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Payslip (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayslip(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable Payslip Body */}
              <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200 font-sans" id="printable-payslip">
                {/* School Header & Tenant Watermark */}
                <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                      Apex International Academy • Lagos
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                      OFFICIAL SALARY PAYSLIP
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Plot 14 Victoria Island Campus, Lagos State, Nigeria
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {selectedPayslip.month}
                    </div>
                    <div className="text-[11px] text-slate-500">Session: {selectedPayslip.sessionYear}</div>
                    <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded mt-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{selectedPayslip.status}</span>
                    </div>
                  </div>
                </div>

                {/* Staff Demographics */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Name</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedPayslip.staffName}</span>
                    <span className="text-[11px] text-slate-500 block">{selectedPayslip.jobTitle} • {selectedPayslip.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff Code & Account</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPayslip.employeeCode}</span>
                    <span className="text-[11px] text-slate-500 block font-mono">{selectedPayslip.bankDetailsMasked}</span>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800 pb-1">
                      Earnings & Allowances
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span>Basic Salary</span>
                        <span className="font-mono font-semibold">{formatNaira(selectedPayslip.basicPay)}</span>
                      </div>
                      {selectedPayslip.allowances.map((item) => (
                        <div key={item.name} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold">{formatNaira(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                        <span>GROSS EARNINGS</span>
                        <span className="font-mono">{formatNaira(selectedPayslip.grossPay)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400 border-b border-rose-200 dark:border-rose-800 pb-1">
                      Statutory & Attendance Deductions
                    </h4>
                    <div className="space-y-1.5">
                      {selectedPayslip.deductions.map((item) => (
                        <div key={item.name} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">-{formatNaira(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-bold text-rose-600 dark:text-rose-400 text-xs">
                        <span>TOTAL DEDUCTIONS</span>
                        <span className="font-mono">-{formatNaira(selectedPayslip.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Callout */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-800 dark:text-emerald-300 tracking-wider">
                      TOTAL TAKE-HOME NET PAY
                    </span>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                      {formatNaira(selectedPayslip.netPay)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono block">
                      Ref: {selectedPayslip.paymentReference}
                    </span>
                    <span className="text-[10px] text-slate-500">Processed via Central Bank NIP Gateway</span>
                  </div>
                </div>

                {/* Footer Stamp & Signatures */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-8 h-8 text-slate-400" />
                    <div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">Apex Authenticated Payroll Document</div>
                      <div>Immutable Snapshot • Encrypted with Tenant Key</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif italic text-slate-800 dark:text-slate-200 text-xs">Mrs. Folashade Adeleke</div>
                    <div className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Chief Bursar & Finance Director</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GENERATE RUN MODAL */}
      <AnimatePresence>
        {isRunModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Initiate Monthly Payroll Run</h3>
                <button type="button" onClick={() => setIsRunModalOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleExecuteRun} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pay Period Month *
                  </label>
                  <input
                    type="text"
                    value={newRunMonth}
                    onChange={(e) => setNewRunMonth(e.target.value)}
                    required
                    placeholder="e.g. November 2024"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Academic Session *
                  </label>
                  <input
                    type="text"
                    value={newRunSession}
                    onChange={(e) => setNewRunSession(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Active Staff to be Processed:</div>
                  <div className="text-slate-500">{staffList.length} employees across Academic & Administration</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    Est. Total: {formatNaira(totalNetDisbursed)}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRunModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
                  >
                    Execute Calculations & Generate Run
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ATTENDANCE MODAL */}
      <AnimatePresence>
        {editingAttendanceStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Adjust Attendance Records</h3>
                  <p className="text-xs text-slate-500">{editingAttendanceStaff.name}</p>
                </div>
                <button type="button" onClick={() => setEditingAttendanceStaff(null)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleSaveAttendance} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Unexcused Absence Days (triggers pro-rated salary deduction)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={22}
                    value={unexcusedDays}
                    onChange={(e) => setUnexcusedDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Approved Paid Leaves (no deduction)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={22}
                    value={approvedLeaveDays}
                    onChange={(e) => setApprovedLeaveDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200 space-y-1">
                  <div className="font-semibold">Calculated Absence Penalty:</div>
                  <div className="text-base font-bold font-mono">
                    -{formatNaira(unexcusedDays * Math.round(editingAttendanceStaff.salary.basicPay / 22))}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Daily Wage: {formatNaira(Math.round(editingAttendanceStaff.salary.basicPay / 22))}/day
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAttendanceStaff(null)}
                    className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    Save Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
