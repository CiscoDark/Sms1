import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Send,
  CreditCard,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Download,
  Receipt,
  User,
  ShieldCheck,
} from 'lucide-react';
import { StudentFeeAccount } from '../../types';
import {
  getAllStudentFeeAccounts,
  getOutstandingBalanceAnalytics,
  dispatchPaymentReminder,
  dispatchBulkPaymentReminders,
} from '../../lib/fee-store';
import { formatNaira } from '../../lib/currency';
import { PaymentProgressRing } from './PaymentProgressRing';

interface OutstandingBalanceDashboardProps {
  onRecordPayment: (account: StudentFeeAccount) => void;
  onApplyDiscount?: (account: StudentFeeAccount) => void;
  onOpenDiscounts?: (account: StudentFeeAccount) => void;
  onSendReminder?: (account: StudentFeeAccount) => void;
}

type SortField = 'balanceDue' | 'studentName' | 'classLevel' | 'percentagePaid';
type SortOrder = 'asc' | 'desc';
type AgingFilter = 'ALL' | 'CURRENT' | '15_30' | '31_60' | 'OVER_60';

export default function OutstandingBalanceDashboard({
  onRecordPayment,
  onApplyDiscount,
  onOpenDiscounts,
  onSendReminder,
}: OutstandingBalanceDashboardProps) {
  const [accounts, setAccounts] = useState<StudentFeeAccount[]>(() => getAllStudentFeeAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('balanceDue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [reminderSuccessMessage, setReminderSuccessMessage] = useState<string | null>(null);

  const analytics = useMemo(() => getOutstandingBalanceAnalytics(), [accounts]);

  // Defaulters (balanceDue > 0)
  const defaulters = useMemo(() => {
    return accounts.filter((a) => a.balanceDue > 0);
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return defaulters
      .filter((a) => {
        const matchesSearch =
          a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = classFilter === 'ALL' || a.classLevel === classFilter;

        let matchesAging = true;
        // Deterministic sample aging simulation based on index/id for consistent demo
        const charCode = a.studentId.charCodeAt(a.studentId.length - 1);
        if (agingFilter === 'CURRENT') matchesAging = charCode % 4 === 1;
        else if (agingFilter === '15_30') matchesAging = charCode % 4 === 2;
        else if (agingFilter === '31_60') matchesAging = charCode % 4 === 3;
        else if (agingFilter === 'OVER_60') matchesAging = charCode % 4 === 0;

        return matchesSearch && matchesClass && matchesAging;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'balanceDue') comparison = a.balanceDue - b.balanceDue;
        else if (sortField === 'studentName') comparison = a.studentName.localeCompare(b.studentName);
        else if (sortField === 'classLevel') comparison = a.classLevel.localeCompare(b.classLevel);
        else if (sortField === 'percentagePaid') comparison = a.percentagePaid - b.percentagePaid;

        return sortOrder === 'desc' ? -comparison : comparison;
      });
  }, [defaulters, searchTerm, classFilter, agingFilter, sortField, sortOrder]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleToggleSelect = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredAccounts.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredAccounts.map((a) => a.studentId));
    }
  };

  const handleSendSingleReminder = (studentId: string, name: string) => {
    const notif = dispatchPaymentReminder({
      studentId,
      channel: 'MULTI_CHANNEL',
      stage: 'MANUAL_DISPATCH',
    });
    if (notif) {
      setReminderSuccessMessage(`Multi-channel SMS & Email payment reminder dispatched to ${name}'s guardian.`);
      setTimeout(() => setReminderSuccessMessage(null), 5000);
    }
  };

  const handleSendBulkReminders = () => {
    const targetIds = selectedStudentIds.length > 0 ? selectedStudentIds : filteredAccounts.map((a) => a.studentId);
    if (targetIds.length === 0) return;

    const res = dispatchBulkPaymentReminders(targetIds, 'MULTI_CHANNEL');
    setReminderSuccessMessage(
      `Dispatched ${res.dispatchedCount} automated fee clearance reminders via Email & SMS queue.`
    );
    setSelectedStudentIds([]);
    setTimeout(() => setReminderSuccessMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {reminderSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{reminderSuccessMessage}</p>
          </div>
          <button
            onClick={() => setReminderSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Total Outstanding
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatNaira(analytics.totalOutstanding)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span>{analytics.partialCount + analytics.unpaidCount} students with arrears</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Total Realized
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatNaira(analytics.totalCollected)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Collection rate: <span className="font-semibold text-emerald-700">{analytics.collectionRate}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Fully Cleared
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{analytics.clearedCount}</div>
          <div className="mt-1 text-xs text-slate-500">Zero outstanding balance</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Severe Overdue (60d+)
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatNaira(analytics.aging.agingOver60)}
          </div>
          <div className="mt-1 text-xs text-amber-600 font-medium">Critical Bursary Priority</div>
        </div>
      </div>

      {/* Aging Analysis Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Receivables Aging Distribution</h3>
          <span className="text-xs text-slate-500">Sorted into statutory debt recovery brackets</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setAgingFilter(agingFilter === 'CURRENT' ? 'ALL' : 'CURRENT')}
            className={`p-3 rounded-xl border text-left transition-all ${
              agingFilter === 'CURRENT'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-xs font-medium text-slate-500">0 - 14 Days (Current)</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {formatNaira(analytics.aging.current)}
            </div>
          </button>

          <button
            onClick={() => setAgingFilter(agingFilter === '15_30' ? 'ALL' : '15_30')}
            className={`p-3 rounded-xl border text-left transition-all ${
              agingFilter === '15_30'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-xs font-medium text-amber-700">15 - 30 Days Overdue</div>
            <div className="text-base font-bold text-amber-900 mt-1">
              {formatNaira(analytics.aging.aging15To30)}
            </div>
          </button>

          <button
            onClick={() => setAgingFilter(agingFilter === '31_60' ? 'ALL' : '31_60')}
            className={`p-3 rounded-xl border text-left transition-all ${
              agingFilter === '31_60'
                ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-xs font-medium text-orange-700">31 - 60 Days Overdue</div>
            <div className="text-base font-bold text-orange-900 mt-1">
              {formatNaira(analytics.aging.aging31To60)}
            </div>
          </button>

          <button
            onClick={() => setAgingFilter(agingFilter === 'OVER_60' ? 'ALL' : 'OVER_60')}
            className={`p-3 rounded-xl border text-left transition-all ${
              agingFilter === 'OVER_60'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-xs font-medium text-rose-700">60+ Days Severe</div>
            <div className="text-base font-bold text-rose-900 mt-1">
              {formatNaira(analytics.aging.agingOver60)}
            </div>
          </button>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or admission no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          >
            <option value="ALL">All Classes</option>
            <option value="JSS 1">JSS 1</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 3">JSS 3</option>
            <option value="SSS 1">SSS 1</option>
            <option value="SSS 2">SSS 2</option>
            <option value="SSS 3">SSS 3</option>
          </select>

          {agingFilter !== 'ALL' && (
            <button
              onClick={() => setAgingFilter('ALL')}
              className="text-xs text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg"
            >
              Clear Aging Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleSendBulkReminders}
            disabled={filteredAccounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 shadow-sm transition"
          >
            <Send className="w-4 h-4" />
            <span>
              {selectedStudentIds.length > 0
                ? `Send Reminders (${selectedStudentIds.length})`
                : 'Send Reminders to All Defaulters'}
            </span>
          </button>
        </div>
      </div>

      {/* Defaulters Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedStudentIds.length > 0 &&
                      selectedStudentIds.length === filteredAccounts.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleToggleSort('studentName')}
                    className="flex items-center gap-1.5 hover:text-slate-900 font-semibold"
                  >
                    <span>Student Details</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleToggleSort('classLevel')}
                    className="flex items-center gap-1.5 hover:text-slate-900 font-semibold"
                  >
                    <span>Class & Arm</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-4">Discounts Applied</th>
                <th className="p-4">
                  <button
                    onClick={() => handleToggleSort('percentagePaid')}
                    className="flex items-center gap-1.5 hover:text-slate-900 font-semibold"
                  >
                    <span>Payment Progress</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-4 text-right">
                  <button
                    onClick={() => handleToggleSort('balanceDue')}
                    className="flex items-center gap-1.5 ml-auto hover:text-slate-900 font-semibold text-rose-600"
                  >
                    <span>Outstanding Due</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </button>
                </th>
                <th className="p-4 text-center">Bursary Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No outstanding fee balances matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const isSelected = selectedStudentIds.includes(account.studentId);
                  const hasDiscounts = account.appliedDiscounts && account.appliedDiscounts.length > 0;

                  return (
                    <tr
                      key={account.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-slate-50' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(account.studentId)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {account.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{account.studentName}</div>
                            <div className="text-xs text-slate-500 font-mono">
                              {account.admissionNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700">
                        <div className="font-medium">{account.classLevel}</div>
                        <div className="text-xs text-slate-400">{account.classArm} Arm</div>
                      </td>
                      <td className="p-4">
                        {hasDiscounts ? (
                          <div className="space-y-1">
                            {account.appliedDiscounts.map((d, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                              >
                                {d.ruleName}: -{formatNaira(d.amountSaved)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => (onApplyDiscount ? onApplyDiscount(account) : onOpenDiscounts?.(account))}
                            className="text-xs text-slate-500 hover:text-slate-900 underline"
                          >
                            + Add waiver/discount
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <PaymentProgressRing
                            percentage={account.percentagePaid}
                            size="sm"
                            strokeWidth={3.5}
                          />
                          <div className="text-xs">
                            <div className="font-semibold text-slate-900">
                              {account.percentagePaid}% Paid
                            </div>
                            <div className="text-slate-400">
                              {formatNaira(account.totalPaid)} of {formatNaira(account.totalBilled)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bold text-rose-600 text-base">
                          {formatNaira(account.balanceDue)}
                        </div>
                        <div className="text-xs text-slate-400">Due Feb 15, 2025</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onRecordPayment(account)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                            title="Record manual or gateway payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Capture</span>
                          </button>
                          <button
                            onClick={() => handleSendSingleReminder(account.studentId, account.studentName)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Send SMS/Email Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
