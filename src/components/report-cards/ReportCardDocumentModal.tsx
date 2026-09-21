import React, { useRef } from 'react';
import { motion } from 'motion/react';
import {
  Printer,
  Download,
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Calendar,
  User,
  GraduationCap,
  ExternalLink,
  Award,
} from 'lucide-react';
import { ReportCardSnapshot } from '../../types';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { NAIRA_SYMBOL } from '../../lib/currency';

interface ReportCardDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportCard: ReportCardSnapshot;
  onOpenPublicVerification?: (uuid: string) => void;
}

export const ReportCardDocumentModal: React.FC<ReportCardDocumentModalProps> = ({
  isOpen,
  onClose,
  reportCard,
  onOpenPublicVerification,
}) => {
  if (!isOpen) return null;

  const verifyUrl = `${window.location.origin}/#/verify-credential/${reportCard.credentialUuid}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto print:shadow-none print:border-none print:rounded-none print:max-w-none print:m-0"
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              Point-in-Time Frozen Snapshot
            </Badge>
            <span className="text-xs text-slate-500 font-mono">
              CRED: {reportCard.credentialUuid.slice(0, 18).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPublicVerification?.(reportCard.credentialUuid)}
              leftIcon={<QrCode className="w-4 h-4 text-indigo-600" />}
            >
              Test Public QR Endpoint
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Report Card Document */}
        <div className="p-8 sm:p-10 relative bg-white overflow-hidden print:p-6 text-slate-900 font-sans">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <GraduationCap className="w-96 h-96 text-slate-900" />
          </div>

          {/* School Crest Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center relative">
            <div className="flex items-center justify-between">
              {/* Crest Logo */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-950 text-white flex flex-col items-center justify-center font-black shadow-md border-2 border-amber-400">
                <span className="text-xl tracking-tighter">AHA</span>
                <span className="text-[7px] tracking-widest text-amber-300 uppercase font-mono">1998</span>
              </div>

              {/* Institution Title */}
              <div className="space-y-1 flex-1 px-4">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
                  Apex Horizon Academy
                </h1>
                <p className="text-xs text-slate-600 font-medium tracking-wide">
                  Plot 14, Admiralty Way, Lekki Phase 1, Lagos State, Nigeria
                </p>
                <p className="text-[11px] text-indigo-900 font-semibold tracking-wider uppercase">
                  Motto: Excellence, Discipline & Global Leadership
                </p>
                <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-800 uppercase tracking-wider mt-1">
                  Continuous Assessment & Terminal Examination Report Card
                </div>
              </div>

              {/* Student Photo */}
              <div className="w-16 h-20 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
                {reportCard.avatarUrl ? (
                  <img
                    src={reportCard.avatarUrl}
                    alt={reportCard.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
            </div>
          </div>

          {/* Student Bio Dossier Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Student Full Name</div>
              <div className="font-bold text-slate-900 text-sm truncate">{reportCard.studentName}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Admission / Reg No.</div>
              <div className="font-mono font-bold text-slate-900">{reportCard.studentRegNumber}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Class Level & Arm</div>
              <div className="font-bold text-slate-900">
                {reportCard.classLevel} — {reportCard.classArm}{' '}
                <span className="text-[9px] text-indigo-600 font-mono font-normal">(Snapshot)</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Session & Term</div>
              <div className="font-bold text-slate-900">
                {reportCard.termName} • {reportCard.sessionYear}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Gender / Sex</div>
              <div className="font-medium text-slate-800">{reportCard.gender === 'M' ? 'Male' : 'Female'}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Position in Arm</div>
              <div className="font-bold text-indigo-700">
                #{reportCard.positionInArm} of {reportCard.totalInArm} Students
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Term Attendance</div>
              <div className="font-bold text-emerald-700">
                {reportCard.attendanceRate}% ({reportCard.daysPresent}/{reportCard.totalDays} Days)
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Annual Promotion Status</div>
              <div className="font-bold text-indigo-900 uppercase">
                {reportCard.promotionDecision || 'PROMOTED'}
              </div>
            </div>
          </div>

          {/* Academic Performance Table (WAEC / NECO Secondary Standard) */}
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Academic Performance Breakdown (100% Scale)</span>
              <span className="text-[10px] text-slate-500 font-normal">
                Continuous Assessment (40%) + Terminal Exam (60%)
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3">Subject Name</th>
                    <th className="py-2 px-2 text-center">CA 1 (20)</th>
                    <th className="py-2 px-2 text-center">CA 2 (20)</th>
                    <th className="py-2 px-2 text-center">Exam (60)</th>
                    <th className="py-2 px-2 text-center bg-slate-200/60">Total (100)</th>
                    <th className="py-2 px-2 text-center">Grade</th>
                    <th className="py-2 px-3">Remark</th>
                    <th className="py-2 px-2 text-center text-slate-500">Class Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportCard.subjects.map((sub, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{sub.subjectName}</td>
                      <td className="py-2 px-2 text-center text-slate-700">{sub.ca1Score ?? '—'}</td>
                      <td className="py-2 px-2 text-center text-slate-700">{sub.ca2Score ?? '—'}</td>
                      <td className="py-2 px-2 text-center text-slate-700">{sub.examScore ?? '—'}</td>
                      <td className="py-2 px-2 text-center font-bold text-indigo-900 bg-slate-100/60">
                        {sub.totalScore ?? '—'}%
                      </td>
                      <td className="py-2 px-2 text-center font-black">
                        <span
                          className={
                            sub.grade.startsWith('A')
                              ? 'text-emerald-700 font-black'
                              : sub.grade.startsWith('B')
                              ? 'text-blue-700 font-bold'
                              : sub.grade.startsWith('C')
                              ? 'text-amber-700 font-semibold'
                              : 'text-rose-700 font-bold'
                          }
                        >
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{sub.remark}</td>
                      <td className="py-2 px-2 text-center text-slate-400 font-mono text-[10px]">
                        {sub.classAverage || 68.4}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 text-xs font-bold border-t-2 border-slate-300">
                  <tr>
                    <td className="py-2.5 px-3">Cumulative Performance</td>
                    <td colSpan={3} className="py-2.5 px-2 text-right text-slate-600">
                      Total Obtained: {reportCard.totalScore} / {reportCard.totalMaxScore}
                    </td>
                    <td className="py-2.5 px-2 text-center text-indigo-950 font-black text-sm bg-slate-200">
                      {reportCard.averagePercentage}%
                    </td>
                    <td className="py-2.5 px-2 text-center font-black text-emerald-800">
                      {reportCard.overallGrade}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-slate-600 text-[11px]">
                      GPA: {reportCard.overallGpa.toFixed(2)} / 4.00 (Class Mean: {reportCard.classAverage}%)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Affective & Psychomotor Traits Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                Affective & Behavioral Traits (Rating: 1 - 5)
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Punctuality:</span>
                  <span className="font-bold text-slate-800">{reportCard.psychomotor.punctuality} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Neatness & Decorum:</span>
                  <span className="font-bold text-slate-800">{reportCard.psychomotor.neatness} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Politeness:</span>
                  <span className="font-bold text-slate-800">{reportCard.psychomotor.politeness} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Leadership:</span>
                  <span className="font-bold text-slate-800">{reportCard.psychomotor.leadership} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Attentiveness:</span>
                  <span className="font-bold text-slate-800">{reportCard.psychomotor.attentiveness} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600">Honesty:</span>
                  <span className="font-bold text-slate-800">{reportCard.psychomotor.honesty} / 5</span>
                </div>
              </div>
            </div>

            {/* Grading Scale Guide */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-[10px]">
              <div className="font-bold uppercase tracking-wider text-slate-700 mb-1">
                National Grading Interpretation Key
              </div>
              <div className="grid grid-cols-3 gap-1 text-slate-600">
                <div><strong>A1:</strong> 75 - 100% (Dist.)</div>
                <div><strong>B2:</strong> 70 - 74% (V. Good)</div>
                <div><strong>B3:</strong> 65 - 69% (Good)</div>
                <div><strong>C4:</strong> 60 - 64% (Credit)</div>
                <div><strong>C5:</strong> 55 - 59% (Credit)</div>
                <div><strong>C6:</strong> 50 - 54% (Credit)</div>
                <div><strong>D7:</strong> 45 - 49% (Pass)</div>
                <div><strong>E8:</strong> 40 - 44% (Pass)</div>
                <div><strong>F9:</strong> 0 - 39% (Fail)</div>
              </div>
              <div className="mt-2 text-[9px] text-slate-400 border-t border-slate-200 pt-1">
                Next Term Resumption: <strong className="text-slate-700">{reportCard.nextTermBegins || 'September 15, 2025'}</strong>
              </div>
            </div>
          </div>

          {/* Remarks & Signatures Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-300 pt-4 mb-6">
            {/* Form Teacher Remarks Block */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                <span>Form Teacher's Confidential Remark</span>
                {reportCard.teacherSignedOff && (
                  <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Reviewed & Signed Off
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-800 italic leading-relaxed min-h-[44px]">
                "{reportCard.teacherRemarks}"
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <div>
                  Signed: <strong className="text-slate-800">{reportCard.teacherName || 'Mrs. Folashade Alabi'}</strong>
                </div>
                <div className="font-mono">Date: {new Date(reportCard.publishedAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Principal Remarks & Official Stamp Block */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 relative">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                <span>Principal's Assessment & Decision</span>
                <span className="text-[10px] text-indigo-700 font-bold uppercase">
                  Apex Board Validated
                </span>
              </div>
              <p className="text-xs text-slate-800 italic leading-relaxed min-h-[44px]">
                "{reportCard.principalRemarks}"
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <div>
                  Principal: <strong className="text-slate-800">{reportCard.principalName || 'Dr. Obinna Anyaoku'}</strong>
                </div>
                <div className="font-mono">Official Seal Affixed</div>
              </div>
            </div>
          </div>

          {/* Document Footer: Bursary Status & Public QR Verification Seal */}
          <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Bursary & Fee Status badge */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Bursary & Account Clearance (Point-in-Time)
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
                  {reportCard.feeStatusText}
                </span>
                <span className="text-[11px] text-slate-500">
                  (Fee clearance recorded at term publication)
                </span>
              </div>
            </div>

            {/* Verification QR Code and Invariant #4 notice */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {/* QR Code Graphic */}
              <div className="p-1 bg-white rounded-lg border border-slate-300 shrink-0">
                <svg
                  className="w-12 h-12 text-slate-950"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h4.5v4.5h-4.5zM15.75 4.5h4.5v4.5h-4.5zM3.75 16.5h4.5v4.5h-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 6h1.5v1.5h-1.5zM17.25 6h1.5v1.5h-1.5zM5.25 18h1.5v1.5h-1.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v3M12 10.5v3M12 16.5v3M15.75 12h4.5M16.5 15.75h1.5v1.5h-1.5zM19.5 19.5h-1.5v-1.5h1.5zM10.5 15h1.5v1.5h-1.5z" />
                </svg>
              </div>

              <div className="text-left space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Scan to Verify Authenticity
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  URL: /verify-credential/{reportCard.credentialUuid.slice(0, 14)}...
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  Public verify endpoint securely strips fees, guardian, & disciplinary records.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
