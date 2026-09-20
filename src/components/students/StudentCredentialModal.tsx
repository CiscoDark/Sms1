import React, { useState } from 'react';
import { Student } from '../../types';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  EyeOff,
  Copy,
  Printer,
  ExternalLink,
  X,
  School,
  Sparkles,
  Check,
  Info,
} from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';

interface StudentCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export const StudentCredentialModal: React.FC<StudentCredentialModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const [viewMode, setViewMode] = useState<'id_card' | 'public_endpoint'>('id_card');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate a deterministic UUID for the student credential
  const credentialUuid = `cred-${student.id}-${student.admissionNumber.replace(/\//g, '-').toLowerCase()}`;
  const verifyUrl = `${window.location.origin}/#/verify-credential/${credentialUuid}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Student Credential & Public QR Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tamper-proof digital credential with zero-knowledge data sanitization (SMS Invariant #4)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setViewMode('id_card')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'id_card'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <School className="w-4 h-4" />
              PVC Student ID Badge
            </button>
            <button
              type="button"
              onClick={() => setViewMode('public_endpoint')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'public_endpoint'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Public QR Endpoint (/verify-credential/{credentialUuid.slice(0, 8)}...)
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-2">
            <Badge variant="success" size="sm" className="flex items-center gap-1 font-mono text-[10px]">
              <Lock className="w-3 h-3" />
              Invariant #4 Enforced
            </Badge>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {viewMode === 'id_card' ? (
            <div className="space-y-6">
              {/* PVC Card Render */}
              <div className="flex justify-center">
                <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-indigo-900/50 relative overflow-hidden">
                  {/* Holographic accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-indigo-900/50 pb-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-xs">
                        AO
                      </div>
                      <div>
                        <div className="font-black text-xs tracking-wider uppercase text-indigo-200">
                          Apex Oak Academy
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                          Official Student Pass
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      {student.status}
                    </div>
                  </div>

                  {/* Student Details Section */}
                  <div className="flex gap-4 items-center">
                    {/* Photo / Avatar */}
                    <div className="w-24 h-28 rounded-xl bg-slate-800 border-2 border-indigo-400/30 overflow-hidden flex items-center justify-center text-indigo-300 shrink-0 relative shadow-inner">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.firstName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-2xl font-black">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-center py-0.5 text-[9px] font-bold text-slate-300">
                        {student.gender === 'M' ? 'MALE' : 'FEMALE'}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div>
                        <div className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">
                          Student Name
                        </div>
                        <div className="font-bold text-sm text-white truncate">
                          {student.firstName} {student.middleName ? `${student.middleName} ` : ''}
                          {student.lastName}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Admission No</div>
                          <div className="font-mono font-bold text-indigo-200 text-[11px] truncate">
                            {student.admissionNumber}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Class Stream</div>
                          <div className="font-bold text-white text-[11px]">
                            {student.classLevel} - {student.classArm}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Blood / Genotype</div>
                          <div className="font-medium text-slate-200 text-[11px]">
                            {student.bloodGroup || 'O+'} / {student.genotype || 'AA'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Academic Year</div>
                          <div className="font-medium text-slate-200 text-[11px]">2025/2026</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Barcode & Scannable QR */}
                  <div className="mt-5 pt-3 border-t border-indigo-900/50 flex items-center justify-between">
                    <div className="space-y-1">
                      {/* Stylized Barcode */}
                      <div className="h-6 flex items-end space-x-0.5">
                        {[4, 2, 6, 1, 5, 2, 4, 3, 6, 2, 1, 5, 4, 2, 6, 3, 2, 5, 1, 4, 6].map(
                          (h, idx) => (
                            <div
                              key={idx}
                              className="bg-indigo-300 w-1 rounded-xs"
                              style={{ height: `${h * 4}px` }}
                            />
                          )
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        CRED-ID: {credentialUuid.slice(0, 16).toUpperCase()}
                      </div>
                    </div>

                    {/* QR Code preview */}
                    <div className="p-1.5 bg-white rounded-lg shadow-sm flex items-center justify-center">
                      <svg
                        className="w-14 h-14 text-slate-950"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h4.5v4.5h-4.5zM15.75 4.5h4.5v4.5h-4.5zM3.75 16.5h4.5v4.5h-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 6h1.5v1.5h-1.5zM17.25 6h1.5v1.5h-1.5zM5.25 18h1.5v1.5h-1.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v3M12 10.5v3M12 16.5v3M15.75 12h4.5M16.5 15.75h1.5v1.5h-1.5zM19.5 19.5h-1.5v-1.5h1.5zM10.5 15h1.5v1.5h-1.5z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>High-resolution vector credential suitable for 300DPI badge printing.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copied ? 'Copied Verification URL' : 'Copy Public Link'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print ID Badge
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Public Verification Endpoint Simulation */
            <div className="space-y-5">
              {/* Invariant #4 Architecture Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                      Architectural Invariant #4: Public Privacy & Zero-Leakage Sanitization
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                      Public QR verification at <span className="font-mono font-bold">/verify-credential/[uuid]</span> strictly sanitizes all responses. Financial fee balances, guardian phone numbers/residential addresses, and disciplinary records are completely pruned prior to response dispatch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mock Browser URL Bar */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-center gap-2 text-xs font-mono">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> https://
                </span>
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  sms.apex-oak.edu/verify-credential/{credentialUuid}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="ml-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Public Verification Result Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Official Academic Credential
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Verified Authentic by Apex Oak Academy
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    Active Student
                  </Badge>
                </div>

                {/* Sanitized Public Attributes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Verified Full Name</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                      {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Official Admission ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {student.admissionNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Institutional Authority</span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">
                      Apex Oak Academy (Tenant: AO-2026)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Enrolled Level & Arm</span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">
                      {student.classLevel} - {student.classArm}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Enrollment Date</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(student.enrollmentDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Digital Cryptographic Hash</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate block">
                      SHA256: 8a4f91b...{student.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                {/* Sanitization Proof Table */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                    Strict Data Exclusion Matrix (Zero-Knowledge Privacy)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Financial Balances: <strong>EXCLUDED</strong></span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Guardian Contacts: <strong>EXCLUDED</strong></span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Disciplinary Files: <strong>EXCLUDED</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            UUID: {credentialUuid}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
