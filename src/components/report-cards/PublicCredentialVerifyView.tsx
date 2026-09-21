import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  GraduationCap,
  Calendar,
  Award,
  AlertTriangle,
  ArrowLeft,
  School,
  ExternalLink,
} from 'lucide-react';
import { ReportCardSnapshot } from '../../types';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';

interface PublicCredentialVerifyViewProps {
  credentialUuid: string;
  reportCard: ReportCardSnapshot | null;
  onBackToApp: () => void;
}

export const PublicCredentialVerifyView: React.FC<PublicCredentialVerifyViewProps> = ({
  credentialUuid,
  reportCard,
  onBackToApp,
}) => {
  const isValid = !!reportCard;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      {/* Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Verification Status Header */}
        <div className="bg-linear-to-b from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 text-center relative">
          {/* Back button */}
          <button
            onClick={onBackToApp}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </button>

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg">
            {isValid ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isValid ? 'Official Credential Verified' : 'Invalid Credential'}
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Academic Transcript Verification
          </h1>
          <p className="text-xs text-indigo-200 font-mono mt-1">
            UUID: {credentialUuid}
          </p>
        </div>

        {/* Public Sanitization Security Guarantee Notice */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold">Privacy Enforced:</span>
            <span className="text-slate-400">Strictly sanitized read-only record</span>
          </div>
          <Badge variant="primary" size="sm">
            Invariant #4 Active
          </Badge>
        </div>

        {/* Verified Data Body */}
        {isValid && reportCard ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Permitted Public Data Fields ONLY */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  Issuing Institution
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-600" />
                  {reportCard.schoolName || 'Apex Horizon Academy'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Accredited by Ministry of Education • Federal Republic of Nigeria
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Student Full Name</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {reportCard.studentName}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Admission / Reg. No.</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {reportCard.studentRegNumber}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Academic Term & Session</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {reportCard.termName} • {reportCard.sessionYear}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Overall Performance</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                    Grade {reportCard.overallGrade} (GPA: {reportCard.overallGpa.toFixed(2)} / 4.00)
                  </div>
                </div>
              </div>

              {/* Final Remarks */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Official Board Recommendation / Remarks
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{reportCard.principalRemarks || 'Commendable scholastic performance and character.'}"
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Status: <strong>{reportCard.promotionDecision || 'PROMOTED'}</strong> • Verified on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Privacy Compliance Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="leading-relaxed">
                <strong>Data Protection Guarantee:</strong> In strict compliance with institutional privacy standards, fee balances, payment histories, guardian phone numbers, and internal disciplinary logs are NEVER exposed on public endpoints.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No matching published academic credential found for UUID:{' '}
              <span className="font-mono font-bold text-rose-600">{credentialUuid}</span>.
            </p>
            <p className="text-xs text-slate-400">
              Please ensure the QR code was scanned from an authentic, issued Apex Horizon Academy report card or contact the school registry.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center">
          <Button variant="outline" size="sm" onClick={onBackToApp}>
            Back to Apex Horizon Academy Portal
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
