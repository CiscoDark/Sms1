import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  GraduationCap,
  CreditCard,
  Calendar,
  Bell,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  User,
  ExternalLink,
  QrCode,
  Clock,
  Sparkles,
  Download,
  Receipt,
  Settings,
} from 'lucide-react';
import {
  ParentChildLink,
  Student,
  UserProfile,
  StudentFeeAccount,
  StudentAnnouncementItem,
  FeeItem,
} from '../../types';
import {
  getLinksForParent,
  getAllParentChildLinks,
  getCombinedFamilyFeeSummary,
} from '../../lib/parent-store';
import { formatNaira } from '../../lib/currency';
import { getAnnouncements } from '../../lib/announcements-store';
import { PaymentProgressRing } from '../finance/PaymentProgressRing';
import { ParentChildLinkingModal } from './ParentChildLinkingModal';
import { recordStudentPayment } from '../../lib/fee-store';
import { getApprovedPastoralSummariesForStudent } from '../../lib/disciplinary-store';

interface ParentPortalPageProps {
  currentUser: UserProfile;
  allStudents: Student[];
  onOpenReportCardModal?: (student: Student) => void;
  onOpenMessagingTab?: (studentId: string, studentName: string) => void;
}

type PortalSection = 'OVERVIEW' | 'FEES' | 'ACADEMICS' | 'ATTENDANCE' | 'ANNOUNCEMENTS' | 'PASTORAL';

export const ParentPortalPage: React.FC<ParentPortalPageProps> = ({
  currentUser,
  allStudents,
  onOpenReportCardModal,
  onOpenMessagingTab,
}) => {
  const [activeSection, setActiveSection] = useState<PortalSection>('OVERVIEW');
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

  // Retrieve parent-child links for this logged-in account
  const parentLinks = useMemo(() => {
    const directLinks = getLinksForParent(currentUser.id);
    if (directLinks.length > 0) return directLinks;

    // Fallback: If user email matches guardian email or mock fallback for demonstration
    const allLinks = getAllParentChildLinks();
    const emailMatch = allLinks.filter((l) => l.parentEmail === currentUser.email);
    if (emailMatch.length > 0) return emailMatch;

    // Default to first family (Dr. Adeleke) if testing without specific links
    return allLinks.filter((l) => l.parentId === 'user-7');
  }, [currentUser.id, currentUser.email]);

  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    return parentLinks[0]?.studentId || (allStudents[0]?.id ?? '');
  });

  // Re-sync if links change
  React.useEffect(() => {
    if (parentLinks.length > 0 && !parentLinks.some((l) => l.studentId === selectedChildId)) {
      setSelectedChildId(parentLinks[0].studentId);
    }
  }, [parentLinks, selectedChildId]);

  // Active child object
  const activeChild = useMemo(() => {
    return (
      allStudents.find((s) => s.id === selectedChildId) ||
      allStudents.find((s) => s.admissionNumber === 'ADM-2024-001') ||
      allStudents[0]
    );
  }, [allStudents, selectedChildId]);

  // Combined Family Fee Analysis across all linked wards
  const linkedStudentIds = useMemo(() => {
    return parentLinks.map((l) => l.studentId);
  }, [parentLinks]);

  const familyFeeSummary = useMemo(() => {
    return getCombinedFamilyFeeSummary(linkedStudentIds, allStudents);
  }, [linkedStudentIds, allStudents]);

  // Active child's fee account
  const activeChildFeeAccount = useMemo(() => {
    return (
      familyFeeSummary.accounts.find((a) => a.studentId === activeChild?.id) ||
      familyFeeSummary.accounts[0]
    );
  }, [familyFeeSummary, activeChild]);

  // Announcements filtered for active child's class level and arm
  const filteredAnnouncements = useMemo(() => {
    const all = getAnnouncements();
    if (!activeChild) return all;
    return all.filter((ann) => {
      if (ann.scope === 'SCHOOL_WIDE') return true;
      if (ann.scope === 'CLASS_LEVEL' && ann.targetLevel === activeChild.classLevel) return true;
      if (
        ann.scope === 'CLASS_ARM' &&
        ann.targetLevel === activeChild.classLevel &&
        ann.targetArm === activeChild.classArm
      ) {
        return true;
      }
      return false;
    });
  }, [activeChild]);

  // Payment capture modal state for parent direct checkout
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSimulatePayment = (amountToPay: number, isFamilyCombined: boolean) => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      if (isFamilyCombined) {
        // Distribute payment across accounts with balances
        familyFeeSummary.accounts.forEach((acc) => {
          if (acc.balanceDue > 0) {
            recordStudentPayment({
              studentId: acc.studentId,
              amount: acc.balanceDue,
              channel: 'PAYSTACK',
              payerName: currentUser.name,
              payerEmail: currentUser.email,
              notes: 'Settled via Parent Portal instant checkout',
              recordedBy: 'Paystack Gateway Parent Portal',
            });
          }
        });
        setPaymentSuccessMessage(`Successfully settled full family balance of ${formatNaira(amountToPay)}!`);
      } else if (activeChildFeeAccount) {
        recordStudentPayment({
          studentId: activeChildFeeAccount.studentId,
          amount: amountToPay,
          channel: 'PAYSTACK',
          payerName: currentUser.name,
          payerEmail: currentUser.email,
          notes: `Settled balance for ${activeChild?.firstName} via Parent Portal`,
          recordedBy: 'Paystack Gateway Parent Portal',
        });
        setPaymentSuccessMessage(
          `Successfully paid ${formatNaira(amountToPay)} for ${activeChild?.firstName} ${activeChild?.lastName}!`
        );
      }

      setIsProcessingPayment(false);
      setTimeout(() => setPaymentSuccessMessage(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 1. PORTAL HEADER & CONTEXT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xl shadow-xs">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  Parent & Guardian Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold">
                  Multi-Child Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Connected Parent: <strong>{currentUser.name}</strong> •{' '}
                {parentLinks.length} Wards Enrolled • Session 2024/2025
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLinkingModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
              title="Registrar Linking Tool"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Manage Ward Linkages</span>
            </button>
          </div>
        </div>

        {paymentSuccessMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{paymentSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 2. MULTI-CHILD SWITCHER (Tabs with animated cross-swap transition) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Select Enrolled Child / Ward:
          </span>
          <span className="text-xs text-slate-400">
            Click avatar tab to switch child view
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {parentLinks.map((link) => {
            const isSelected = link.studentId === activeChild?.id;
            const childFee = familyFeeSummary.accounts.find((a) => a.studentId === link.studentId);
            const isCleared = childFee ? childFee.balanceDue === 0 : true;

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => setSelectedChildId(link.studentId)}
                className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {link.studentName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {link.studentName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {link.classLevel} {link.classArm}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        isCleared
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {childFee ? (isCleared ? 'Fees Cleared' : `Due: ${formatNaira(childFee.balanceDue)}`) : 'Enrolled'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="activeChildCheckmark"
                    className="w-2 h-2 rounded-full bg-rose-600 shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. COMBINED FAMILY FEE DASHBOARD (Aggregate total-owed view + Per-child breakdown) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-700/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              <span>Consolidated Family Fee Ledger</span>
            </div>
            <h2 className="text-2xl font-black mt-1">
              {familyFeeSummary.totalBalanceDue === 0 ? (
                <span className="text-emerald-400">All Family Fees 100% Cleared</span>
              ) : (
                <span>Total Family Owed: {formatNaira(familyFeeSummary.totalBalanceDue)}</span>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Consolidates tuition, laboratory, and STEM infrastructure levies across {parentLinks.length} enrolled wards for the 2024/2025 Third Term session.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
              <PaymentProgressRing
                percentage={familyFeeSummary.overallPercentagePaid}
                size="md"
                strokeWidth={4.5}
              />
              <div>
                <div className="text-xs font-bold text-white">
                  {familyFeeSummary.overallPercentagePaid}% Settled
                </div>
                <div className="text-[11px] text-slate-300">
                  {formatNaira(familyFeeSummary.totalPaid)} of {formatNaira(familyFeeSummary.totalBilled)}
                </div>
              </div>
            </div>

            {familyFeeSummary.totalBalanceDue > 0 && (
              <button
                onClick={() => handleSimulatePayment(familyFeeSummary.totalBalanceDue, true)}
                disabled={isProcessingPayment}
                className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isProcessingPayment ? 'Processing Gateway...' : `Pay Combined Balance (${formatNaira(familyFeeSummary.totalBalanceDue)})`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Per-Child Quick Breakdown Strip */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {familyFeeSummary.accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-xs text-white">{acc.studentName}</div>
                <div className="text-[10px] text-slate-400">
                  {acc.classLevel} • Due: {formatNaira(acc.balanceDue)}
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  acc.balanceDue === 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {acc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ACTIVE CHILD DETAIL SECTION (Animated Cross-swap) */}
      {activeChild && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChild.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Child Profile Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white dark:bg-rose-600 flex items-center justify-center font-bold text-lg">
                  {activeChild.firstName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeChild.firstName} {activeChild.middleName ? activeChild.middleName + ' ' : ''}
                    {activeChild.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Admission No: <strong>{activeChild.admissionNumber}</strong> • Class:{' '}
                    <strong>{activeChild.classLevel} {activeChild.classArm}</strong> • Genotype:{' '}
                    {activeChild.genotype || 'AA'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenReportCardModal?.(activeChild)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Inspect Verified Report Card</span>
                </button>

                <button
                  onClick={() =>
                    onOpenMessagingTab?.(
                      activeChild.id,
                      `${activeChild.firstName} ${activeChild.lastName}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>Message Form Master</span>
                </button>
              </div>
            </div>

            {/* Sub-Navigation Pills */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveSection('OVERVIEW')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSection === 'OVERVIEW'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Academic Performance
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('FEES')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSection === 'FEES'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Itemized Fee Ledger
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('ATTENDANCE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSection === 'ATTENDANCE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Attendance Register
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('ANNOUNCEMENTS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSection === 'ANNOUNCEMENTS'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Class & School Circulars ({filteredAnnouncements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('PASTORAL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSection === 'PASTORAL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Pastoral Conduct Notices
              </button>
            </div>

            {/* TAB 1: ACADEMIC PERFORMANCE */}
            {activeSection === 'OVERVIEW' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Cumulative GPA
                    </span>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      4.62 / 5.0
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Top 5% in class level</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Overall Composite Grade
                    </span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      A1 (Distinction)
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Weighted across T1/T2/T3</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Class Arm Position
                    </span>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      2nd of 35
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{activeChild.classArm} Arm</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Term Attendance
                    </span>
                    <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
                      98.4%
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">59 of 60 Sessions Present</p>
                  </div>
                </div>

                {/* Subject Scores Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Subject Marks & Continuous Assessment (WAEC/NECO Standard)
                    </h4>
                    <span className="text-[10px] text-slate-400">Term 3 Final Examinations</span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-3">CA 1 (20)</th>
                        <th className="py-2.5 px-3">CA 2 (20)</th>
                        <th className="py-2.5 px-3">Exam (60)</th>
                        <th className="py-2.5 px-3">Total (100)</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-4">Instructor Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { name: 'Mathematics', ca1: 19, ca2: 18, exam: 54, total: 91, grade: 'A1', remark: 'Brilliant conceptual grasp of algebra & proofs' },
                        { name: 'English Language', ca1: 17, ca2: 18, exam: 49, total: 84, grade: 'A1', remark: 'Eloquent prose and reading comprehension' },
                        { name: 'Basic Science', ca1: 18, ca2: 19, exam: 51, total: 88, grade: 'A1', remark: 'Exemplary performance in laboratory practicals' },
                        { name: 'Social Studies', ca1: 16, ca2: 17, exam: 46, total: 79, grade: 'B2', remark: 'Good analytical engagement with civic concepts' },
                        { name: 'Computer Studies / ICT', ca1: 20, ca2: 20, exam: 55, total: 95, grade: 'A1', remark: 'Superb algorithm and coding aptitude' },
                      ].map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {sub.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{sub.ca1}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{sub.ca2}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{sub.exam}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{sub.total}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400 italic">
                            "{sub.remark}"
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ITEMIZED FEE LEDGER */}
            {activeSection === 'FEES' && activeChildFeeAccount && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">
                      Total Billed
                    </span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {formatNaira(activeChildFeeAccount.totalBilled)}
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">
                      Total Paid
                    </span>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {formatNaira(activeChildFeeAccount.totalPaid)}
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">
                      Outstanding Due
                    </span>
                    <div className="text-xl font-bold text-rose-600 mt-1">
                      {formatNaira(activeChildFeeAccount.balanceDue)}
                    </div>
                  </div>
                </div>

                {/* Fee Item Breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Itemized Term Charges
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(activeChildFeeAccount.feeItems || []).map((item: FeeItem) => (
                      <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.name}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatNaira(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {activeChildFeeAccount.balanceDue > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleSimulatePayment(activeChildFeeAccount.balanceDue, false)}
                        disabled={isProcessingPayment}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pay {formatNaira(activeChildFeeAccount.balanceDue)} via Paystack</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment History Receipts */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Payment Receipts & Webhook Verification
                  </h4>
                  <div className="space-y-2">
                    {activeChildFeeAccount.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {formatNaira(p.amount)} • {p.channel.replace('_', ' ')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {p.transactionReference} • {new Date(p.paymentDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            {p.status}
                          </span>
                          <button
                            onClick={() => alert(`Official Receipt Ref: ${p.transactionReference}\nStudent: ${activeChild.firstName} ${activeChild.lastName}\nAmount: ${formatNaira(p.amount)}\nSigned: Bursar Office`)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                            title="Download Official PDF Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ATTENDANCE REGISTER */}
            {activeSection === 'ATTENDANCE' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Daily Punctuality & Attendance History
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Monitored daily via class biometric & form register.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-600">98.4%</span>
                    <div className="text-[10px] text-slate-400">Present (59/60 days)</div>
                  </div>
                </div>

                {/* Calendar matrix representation */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-2">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const day = i + 1;
                    const isAbsent = day === 14;
                    const isLate = day === 8;
                    return (
                      <div
                        key={day}
                        className={`p-2 rounded-lg text-center border text-[10px] font-semibold ${
                          isAbsent
                            ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                            : isLate
                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                        }`}
                      >
                        <div>Day {day}</div>
                        <div className="text-[9px] font-normal">
                          {isAbsent ? 'Absent' : isLate ? 'Late' : 'Present'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: CLASS & SCHOOL CIRCULARS */}
            {activeSection === 'ANNOUNCEMENTS' && (
              <div className="space-y-3">
                {filteredAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {ann.isCaptainPost ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Class Captain Verified</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold text-[10px]">
                            {ann.scope.replace('_', ' ')}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-semibold">
                          {ann.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                      Posted by: <strong>{ann.authorName}</strong> ({ann.authorRole})
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: PASTORAL & CONDUCT SUMMARIES */}
            {activeSection === 'PASTORAL' && activeChild && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Official Pastoral & Conduct Communications
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Only constructive, admin-authorized pastoral summaries are shared here to foster home-school partnership. 
                      Internal disciplinary proceedings and academic grades remain strictly decoupled and confidential.
                    </p>
                  </div>
                </div>

                {(() => {
                  const summaries = getApprovedPastoralSummariesForStudent(activeChild.id);
                  if (summaries.length === 0) {
                    return (
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Exemplary Conduct Record
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          No pastoral concerns or conduct notices have been issued for {activeChild.firstName}. The student is in exemplary standing with the school community.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {summaries.map((s) => (
                        <div
                          key={s.id}
                          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{s.category}</span>
                            <span className="text-[10px] text-slate-400">{s.incidentDate}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            {s.parentApprovedSummary}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>Status: <strong className="text-indigo-600 dark:text-indigo-400">{s.status.replace(/_/g, ' ')}</strong></span>
                            <span>Authorized by School Administration</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Admin/Registrar Linking Modal */}
      <ParentChildLinkingModal
        isOpen={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        students={allStudents}
        currentUser={currentUser}
      />
    </div>
  );
};
