import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Building2,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Download,
  Plus,
  Layers,
  TrendingUp,
  FileText,
  DollarSign,
  X,
  History,
  ShieldCheck,
  Check,
  Send,
  RefreshCw,
  Tag,
  GraduationCap,
} from 'lucide-react';
import {
  ClassLevel,
  ClassTermFeeStructure,
  PaymentGatewayType,
  StudentFeeAccount,
  UserProfile,
} from '../../types';
import {
  getAllFeeStructures,
  getAllStudentFeeAccounts,
  recordStudentPayment,
  saveFeeStructure,
} from '../../lib/fee-store';
import { formatNaira } from '../../lib/currency';
import { PaymentProgressRing } from './PaymentProgressRing';
import { PaymentCaptureModal } from './PaymentCaptureModal';
import { FeeStructureBuilder } from './FeeStructureBuilder';
import OutstandingBalanceDashboard from './OutstandingBalanceDashboard';
import DiscountWaiverEngineModal from './DiscountWaiverEngineModal';
import PaymentReconciliationModal from './PaymentReconciliationModal';
import PaymentRemindersModal from './PaymentRemindersModal';
import BulkPromotionWizardModal from '../academic/BulkPromotionWizardModal';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';

interface FeeManagementPageProps {
  levels: ClassLevel[];
  currentUser: UserProfile;
  onLogAudit?: (action: string, details: string) => void;
}

export const FeeManagementPage: React.FC<FeeManagementPageProps> = ({
  levels,
  currentUser,
  onLogAudit,
}) => {
  // Main view tab: 'ROSTER' | 'DEFAULTERS' | 'STRUCTURES' | 'RECONCILIATION'
  const [activeMainTab, setActiveMainTab] = useState<
    'ROSTER' | 'DEFAULTERS' | 'STRUCTURES' | 'RECONCILIATION'
  >('ROSTER');

  // Fee structures & student accounts state
  const [structures, setStructures] = useState<ClassTermFeeStructure[]>(() =>
    getAllFeeStructures()
  );
  const [accounts, setAccounts] = useState<StudentFeeAccount[]>(() =>
    getAllStudentFeeAccounts()
  );

  // Filters
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'CLEARED' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [paymentTargetAccount, setPaymentTargetAccount] = useState<StudentFeeAccount | null>(null);
  const [historyTargetAccount, setHistoryTargetAccount] = useState<StudentFeeAccount | null>(null);
  const [discountModalAccount, setDiscountModalAccount] = useState<StudentFeeAccount | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isPromotionWizardOpen, setIsPromotionWizardOpen] = useState(false);

  // Calculate high-level financial metrics
  const metrics = useMemo(() => {
    const totalBilled = accounts.reduce((acc, a) => acc + a.totalBilled, 0);
    const totalPaid = accounts.reduce((acc, a) => acc + a.totalPaid, 0);
    const totalOutstanding = Math.max(0, totalBilled - totalPaid);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    const clearedCount = accounts.filter((a) => a.status === 'CLEARED').length;
    const partialCount = accounts.filter((a) => a.status === 'PARTIAL').length;
    const unpaidCount = accounts.filter((a) => a.status === 'UNPAID').length;

    return {
      totalBilled,
      totalPaid,
      totalOutstanding,
      collectionRate,
      clearedCount,
      partialCount,
      unpaidCount,
      totalStudents: accounts.length,
    };
  }, [accounts]);

  // Filtered accounts list
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (selectedLevelFilter !== 'ALL' && acc.classLevel !== selectedLevelFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL' && acc.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = acc.studentName.toLowerCase().includes(query);
        const matchReg = acc.admissionNumber.toLowerCase().includes(query);
        if (!matchName && !matchReg) return false;
      }
      return true;
    });
  }, [accounts, selectedLevelFilter, selectedStatusFilter, searchQuery]);

  // Handler for saving a fee structure
  const handleSaveStructure = (struct: ClassTermFeeStructure) => {
    saveFeeStructure(struct);
    setStructures(getAllFeeStructures());
  };

  // Handler for committing a payment
  const handleCommitPayment = (paymentData: {
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
  }) => {
    const res = recordStudentPayment(paymentData);
    if (res.success && res.updatedAccount) {
      setAccounts(getAllStudentFeeAccounts());
      onLogAudit?.(
        'FEE_PAYMENT_RECORDED',
        `Recorded ${formatNaira(paymentData.amount)} payment via ${paymentData.channel} for student ${res.updatedAccount.studentName} (${res.updatedAccount.admissionNumber})`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            <span>Fees & Payment Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Itemized fee structures, partial payment tracking with animated progress rings, discount concessions &amp; bulk promotion.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPromotionWizardOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Bulk Promotion Wizard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDiscountModalAccount(null);
              setIsDiscountModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Discount Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRemindersModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>Send Reminders</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReconciliationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reconciliation</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveMainTab('ROSTER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'ROSTER'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Student Payment Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('DEFAULTERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'DEFAULTERS'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Outstanding Balance Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('STRUCTURES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'STRUCTURES'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Fee Structure Builder</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('RECONCILIATION')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'RECONCILIATION'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-emerald-500" />
          <span>Gateway Reconciliation</span>
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Billed */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>TOTAL EXPECTED REVENUE</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatNaira(metrics.totalBilled)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {metrics.totalStudents} active students (Third Term)
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
            <span>TOTAL CASH COLLECTED</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatNaira(metrics.totalPaid)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.clearedCount} cleared • {metrics.partialCount} partial payments
          </div>
        </div>

        {/* Card 3: Total Outstanding */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-500 font-semibold mb-2">
            <span>OUTSTANDING BALANCE</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {formatNaira(metrics.totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.unpaidCount} students with 0% payment
          </div>
        </div>

        {/* Card 4: Progress Compliance Ring */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">
              COLLECTION RATE
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.collectionRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Institutional Target: 85%
            </div>
          </div>
          <PaymentProgressRing
            percentage={metrics.collectionRate}
            size="lg"
            strokeWidth={6}
          />
        </div>
      </div>

      {/* VIEW 1: STUDENT PAYMENT ROSTER */}
      {activeMainTab === 'ROSTER' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Table Filters Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-800/30">
            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or admission number..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Class Level Filter */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">Class:</span>
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="bg-transparent font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Levels</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) =>
                    setSelectedStatusFilter(
                      e.target.value as 'ALL' | 'CLEARED' | 'PARTIAL' | 'UNPAID'
                    )
                  }
                  className="bg-transparent font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CLEARED">Cleared (100%)</option>
                  <option value="PARTIAL">Partial Payment</option>
                  <option value="UNPAID">Unpaid (0%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accounts Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Student Dossier</th>
                  <th className="p-4">Class & Arm</th>
                  <th className="p-4 text-center">Payment Progress</th>
                  <th className="p-4 text-right">Total Billed</th>
                  <th className="p-4 text-right">Amount Paid</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAccounts.map((account) => {
                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Student Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                            {account.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {account.studentName}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {account.admissionNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class Level & Arm */}
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold">{account.classLevel}</span>
                        <span className="text-slate-400"> • {account.classArm}</span>
                      </td>

                      {/* Animated Circular Progress Ring */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <PaymentProgressRing
                            percentage={account.percentagePaid}
                            size="sm"
                          />
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {account.percentagePaid}%
                          </span>
                        </div>
                      </td>

                      {/* Total Billed */}
                      <td className="p-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatNaira(account.totalBilled)}
                      </td>

                      {/* Total Paid */}
                      <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNaira(account.totalPaid)}
                      </td>

                      {/* Balance Due */}
                      <td className="p-4 text-right font-mono font-bold">
                        {account.balanceDue > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatNaira(account.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>₦0.00</span>
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-4">
                        {account.status === 'CLEARED' ? (
                          <Badge variant="success" size="sm">
                            Cleared
                          </Badge>
                        ) : account.status === 'PARTIAL' ? (
                          <Badge variant="warning" size="sm">
                            Partial
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Unpaid
                          </Badge>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountModalAccount(account);
                              setIsDiscountModalOpen(true);
                            }}
                            title="Manage Student Concessions & Waivers"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                          >
                            <Tag className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setHistoryTargetAccount(account)}
                            title="View Payment Receipts & History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setPaymentTargetAccount(account)}
                            className="gap-1.5 text-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Record Payment</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No matching student fee accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: OUTSTANDING DEFAULTERS DASHBOARD */}
      {activeMainTab === 'DEFAULTERS' && (
        <OutstandingBalanceDashboard
          onSendReminder={(acc: StudentFeeAccount) => {
            setPaymentTargetAccount(acc);
            setIsRemindersModalOpen(true);
          }}
          onApplyDiscount={(acc: StudentFeeAccount) => {
            setDiscountModalAccount(acc);
            setIsDiscountModalOpen(true);
          }}
          onRecordPayment={(acc: StudentFeeAccount) => {
            setPaymentTargetAccount(acc);
          }}
        />
      )}

      {/* VIEW 3: FEE STRUCTURE BUILDER */}
      {activeMainTab === 'STRUCTURES' && (
        <FeeStructureBuilder
          levels={levels}
          structures={structures}
          onSaveStructure={handleSaveStructure}
          currentUser={currentUser}
          onLogAudit={onLogAudit}
        />
      )}

      {/* VIEW 4: RECONCILIATION HUB */}
      {activeMainTab === 'RECONCILIATION' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-indigo-600 flex items-center justify-center mx-auto">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Gateway Reconciliation & Idempotency Center
            </h3>
            <p className="text-xs text-slate-500">
              Active background worker monitoring transactions stuck &gt; 15 mins across Paystack and Flutterwave gateways with automated retries and double-crediting protection.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setIsReconciliationModalOpen(true)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
            >
              Open Reconciliation Console
            </button>
          </div>
        </div>
      )}

      {/* Payment Capture Modal */}
      {paymentTargetAccount && (
        <PaymentCaptureModal
          isOpen={!!paymentTargetAccount}
          onClose={() => setPaymentTargetAccount(null)}
          account={paymentTargetAccount}
          onRecordPayment={handleCommitPayment}
          currentUser={currentUser}
        />
      )}

      {/* Payment History Drawer Modal */}
      {historyTargetAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <span>Transaction History & Receipts</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {historyTargetAccount.studentName} ({historyTargetAccount.admissionNumber})
                </p>
              </div>
              <button
                onClick={() => setHistoryTargetAccount(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {historyTargetAccount.payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{formatNaira(p.amount)}</span>
                      <Badge
                        variant={
                          p.channel === 'PAYSTACK'
                            ? 'primary'
                            : p.channel === 'FLUTTERWAVE'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {p.channel.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                      Ref: {p.transactionReference} • {p.paymentDate}
                    </div>
                    {p.notes && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-1">
                        "{p.notes}"
                      </div>
                    )}
                    {p.bankName && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Bank: {p.bankName}
                      </div>
                    )}
                    {p.proofDocumentName && (
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Attached Proof: {p.proofDocumentName}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Recorded By</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      {p.recordedBy}
                    </span>
                  </div>
                </div>
              ))}

              {historyTargetAccount.payments.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No payment transactions recorded yet for this student.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHistoryTargetAccount(null)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Discount & Concession Engine Modal */}
      {isDiscountModalOpen && (
        <DiscountWaiverEngineModal
          isOpen={isDiscountModalOpen}
          onClose={() => {
            setIsDiscountModalOpen(false);
            setDiscountModalAccount(null);
          }}
          targetAccount={discountModalAccount}
          onAccountUpdated={(updated) => {
            setAccounts(getAllStudentFeeAccounts());
            onLogAudit?.(
              'FEE_DISCOUNT_CONCESSION_APPLIED',
              `Applied discount waivers to student fee account: ${updated.studentName} (${updated.admissionNumber})`
            );
          }}
        />
      )}

      {/* Payment Gateway Reconciliation Modal */}
      {isReconciliationModalOpen && (
        <PaymentReconciliationModal
          isOpen={isReconciliationModalOpen}
          onClose={() => setIsReconciliationModalOpen(false)}
        />
      )}

      {/* Parent Payment Reminders Modal */}
      {isRemindersModalOpen && (
        <PaymentRemindersModal
          isOpen={isRemindersModalOpen}
          onClose={() => setIsRemindersModalOpen(false)}
          targetAccount={paymentTargetAccount}
        />
      )}

      {/* Bulk Promotion Wizard Modal */}
      {isPromotionWizardOpen && (
        <BulkPromotionWizardModal
          isOpen={isPromotionWizardOpen}
          onClose={() => setIsPromotionWizardOpen(false)}
          onCompleted={(batch) => {
            setAccounts(getAllStudentFeeAccounts());
            onLogAudit?.(
              'BULK_PROMOTION_COMMITTED',
              `Executed bulk promotion cohort transition to ${batch.toSessionYear}: ${batch.promotedCount} promoted, ${batch.repeatedCount} repeated, ${batch.graduatedCount} alumni`
            );
          }}
        />
      )}
    </div>
  );
};
