import React, { useState, useMemo } from 'react';
import {
  X,
  GraduationCap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  StudentPromotionDecision,
  PromotionAction,
  BulkPromotionBatch,
} from '../../types';
import {
  generatePromotionPreview,
  commitBulkPromotion,
  PromotionPreviewSummary,
  CLASS_LEVEL_PROGRESSION,
} from '../../lib/promotion/promotion-wizard-store';
import { formatNaira } from '../../lib/currency';

interface BulkPromotionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (batch: BulkPromotionBatch) => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export default function BulkPromotionWizardModal({
  isOpen,
  onClose,
  onCompleted,
}: BulkPromotionWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [fromSessionYear, setFromSessionYear] = useState('2024/2025');
  const [toSessionYear, setToSessionYear] = useState('2025/2026');
  const [selectedClassLevel, setSelectedClassLevel] = useState('ALL');

  // Preview state
  const [preview, setPreview] = useState<PromotionPreviewSummary | null>(null);
  const [decisions, setDecisions] = useState<StudentPromotionDecision[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);
  const [committedBatch, setCommittedBatch] = useState<BulkPromotionBatch | null>(null);

  if (!isOpen) return null;

  // Step 1 -> Step 2: Generate Preview
  const handleGeneratePreview = () => {
    const summary = generatePromotionPreview({
      fromSessionYear,
      toSessionYear,
      selectedClassLevel,
    });
    setPreview(summary);
    setDecisions(summary.decisions);
    setCurrentStep(2);
  };

  // Toggle or change individual student action (e.g. toggle to REPEAT or TRIAL)
  const handleUpdateStudentAction = (studentId: string, action: PromotionAction) => {
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.studentId !== studentId) return d;
        const isRepeat = action === 'REPEAT';
        const isAlumni = action === 'GRADUATE_ALUMNI';
        const targetProgression = CLASS_LEVEL_PROGRESSION[d.currentClassLevel];

        const targetClassLevel = isRepeat
          ? d.currentClassLevel
          : isAlumni
          ? 'Alumni'
          : (targetProgression as string);

        return {
          ...d,
          action,
          targetClassLevel,
          isManuallyOverridden: true,
          overrideReason: isRepeat ? 'Manually retained by Academic Board' : undefined,
        };
      })
    );
  };

  // Recalculate summary metrics from modified decisions
  const recalculatedSummary = useMemo(() => {
    if (!preview) return null;
    const promotedCount = decisions.filter((d) => d.action === 'PROMOTE').length;
    const repeatedCount = decisions.filter((d) => d.action === 'REPEAT').length;
    const trialCount = decisions.filter((d) => d.action === 'PROMOTE_TRIAL').length;
    const graduatedCount = decisions.filter((d) => d.action === 'GRADUATE_ALUMNI').length;
    const projectedNewBilledRevenue = decisions.reduce(
      (sum, d) => sum + (d.action !== 'GRADUATE_ALUMNI' ? (d.assignedFeeTotal || 0) : 0),
      0
    );

    return {
      ...preview,
      promotedCount,
      repeatedCount,
      trialCount,
      graduatedCount,
      projectedNewBilledRevenue,
      decisions,
    };
  }, [preview, decisions]);

  // Step 4 -> Step 5: Execute atomic bulk promotion
  const handleCommitPromotion = async () => {
    if (!recalculatedSummary) return;
    setIsCommitting(true);

    try {
      const res = commitBulkPromotion({
        preview: recalculatedSummary,
        performerName: 'Vice Principal (Academic) / Admin',
      });

      if (res.success && res.batch) {
        setCommittedBatch(res.batch);
        setCurrentStep(5);
        onCompleted?.(res.batch);
      }
    } catch (err) {
      console.error('Commit failed:', err);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bulk Promotion Wizard</h2>
              <p className="text-xs text-slate-500">
                End-of-Session cohort promotion, retention management &amp; automated fee assignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { step: 1, label: 'Session & Cohort' },
              { step: 2, label: 'Student Review & Repeat' },
              { step: 3, label: 'Fee Profile Mapping' },
              { step: 4, label: 'Preview & Confirmation' },
              { step: 5, label: 'Completed' },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    currentStep === item.step
                      ? 'bg-slate-900 text-white'
                      : currentStep > item.step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > item.step ? '✓' : item.step}
                </div>
                <span
                  className={`text-xs font-semibold hidden md:inline ${
                    currentStep === item.step
                      ? 'text-slate-900'
                      : currentStep > item.step
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
                {idx < 4 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden md:inline" />}
              </div>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-500">
            Step {currentStep} of 5
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Session & Cohort Selection */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Select Promotion Session &amp; Target Cohort
                </h3>
                <p className="text-xs text-slate-500">
                  Choose the academic sessions for progression and specify classes to evaluate.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      From Session (Current)
                    </label>
                    <select
                      value={fromSessionYear}
                      onChange={(e) => setFromSessionYear(e.target.value)}
                      className="w-full text-sm p-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="2024/2025">2024/2025 Academic Session</option>
                      <option value="2023/2024">2023/2024 Academic Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      To Session (Target)
                    </label>
                    <select
                      value={toSessionYear}
                      onChange={(e) => setToSessionYear(e.target.value)}
                      className="w-full text-sm p-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="2025/2026">2025/2026 Academic Session</option>
                      <option value="2024/2025">2024/2025 Academic Session</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Class Cohort Selection
                  </label>
                  <select
                    value={selectedClassLevel}
                    onChange={(e) => setSelectedClassLevel(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="ALL">All Levels (JSS 1 to SSS 3 — Whole School Promotion)</option>
                    <option value="JSS 1">JSS 1 Cohort Only</option>
                    <option value="JSS 2">JSS 2 Cohort Only</option>
                    <option value="JSS 3">JSS 3 Cohort Only (Transition to Senior Secondary)</option>
                    <option value="SSS 1">SSS 1 Cohort Only</option>
                    <option value="SSS 2">SSS 2 Cohort Only</option>
                    <option value="SSS 3">SSS 3 Final Year Cohort (Graduation to Alumni)</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Non-Destructive Historical Preservation (Invariant #3)</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Prior report card snapshots and grades are permanently frozen. Graduating SSS 3
                    students will transition to Alumni status with full dossier access preserved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Student Review & Repeat Decisions */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Student Academic Review &amp; Retention Flagging
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review cumulative 3rd term GPA. Toggle individual students to Repeat or Trial.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Promote: {recalculatedSummary?.promotedCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    Trial: {recalculatedSummary?.trialCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                    Repeat: {recalculatedSummary?.repeatedCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                    Alumni: {recalculatedSummary?.graduatedCount}
                  </span>
                </div>
              </div>

              {/* Roster Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Current Level</th>
                        <th className="p-3">3rd Term GPA</th>
                        <th className="p-3">Fee Status</th>
                        <th className="p-3">Target Progression</th>
                        <th className="p-3 text-center">Promotion Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {decisions.map((st) => {
                        const isFinal = st.currentClassLevel === 'SSS 3';
                        return (
                          <tr key={st.studentId} className="hover:bg-slate-50/60 transition">
                            <td className="p-3 font-semibold text-slate-900">
                              <div>{st.studentName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {st.admissionNumber}
                              </div>
                            </td>
                            <td className="p-3 text-slate-600">
                              {st.currentClassLevel} ({st.currentClassArm})
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">
                                {st.academicGpa} / 5.0
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Grade {st.overallGrade}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  st.feeClearanceStatus === 'CLEARED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {st.feeClearanceStatus}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5 text-indigo-700">
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                <span>{st.targetClassLevel}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                {isFinal ? (
                                  <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    Graduate (Alumni)
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStudentAction(st.studentId, 'PROMOTE')}
                                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                        st.action === 'PROMOTE'
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Promote
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStudentAction(st.studentId, 'PROMOTE_TRIAL')}
                                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                        st.action === 'PROMOTE_TRIAL'
                                          ? 'bg-amber-600 text-white shadow-sm'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Trial
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStudentAction(st.studentId, 'REPEAT')}
                                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                        st.action === 'REPEAT'
                                          ? 'bg-rose-600 text-white shadow-sm'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Repeat
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Class & Fee Profile Mapping */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Auto-Assigned New Cohort Fee Profiles
                </h3>
                <p className="text-xs text-slate-500">
                  Each promoted student cohort is automatically assigned their target class fee schedule from Step 15.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { level: 'JSS 2', tuition: 120000, pta: 15000, feeding: 45000, total: 200000 },
                  { level: 'JSS 3', tuition: 130000, pta: 15000, feeding: 45000, total: 215000 },
                  { level: 'SSS 1', tuition: 160000, pta: 20000, feeding: 55000, total: 275000 },
                  { level: 'SSS 2', tuition: 170000, pta: 20000, feeding: 55000, total: 285000 },
                  { level: 'SSS 3', tuition: 190000, pta: 25000, feeding: 55000, total: 310000 },
                  { level: 'Alumni Association', tuition: 0, pta: 0, feeding: 0, total: 0 },
                ].map((mapping) => (
                  <div
                    key={mapping.level}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{mapping.level} Profile</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {mapping.total > 0 ? formatNaira(mapping.total) : 'Zero Tuition (Alumni)'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      {mapping.total > 0 ? (
                        <>
                          <div className="flex justify-between">
                            <span>Tuition &amp; Educational Resources</span>
                            <span>{formatNaira(mapping.tuition)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PTA Levy &amp; Welfare</span>
                            <span>{formatNaira(mapping.pta)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cafeteria &amp; Nutrition</span>
                            <span>{formatNaira(mapping.feeding)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          Graduating cohort transitioned to Alumni directory with zero active tuition billing.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Preview & Non-destructive Impact Summary */}
          {currentStep === 4 && recalculatedSummary && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Pre-Commitment Impact Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Review the non-destructive impact before executing permanent student state transitions.
                </p>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Evaluated</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {recalculatedSummary.totalEvaluated}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-semibold">Advancing / Promoted</div>
                  <div className="text-2xl font-bold text-emerald-900 mt-1">
                    {recalculatedSummary.promotedCount + recalculatedSummary.trialCount}
                  </div>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <div className="text-xs text-rose-700 font-semibold">Retained / Repeat</div>
                  <div className="text-2xl font-bold text-rose-900 mt-1">
                    {recalculatedSummary.repeatedCount}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
                  <div className="text-xs text-purple-700 font-semibold">Alumni Graduated</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {recalculatedSummary.graduatedCount}
                  </div>
                </div>
              </div>

              {/* Financial Projection Box */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Projected New Session Tuition Receivables ({toSessionYear})
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white">
                  {formatNaira(recalculatedSummary.projectedNewBilledRevenue)}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  First Term fee accounts will be instantiated automatically with corresponding
                  itemized structures for all active students.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <div className="font-bold">Rollback Snapshot Protection Active</div>
                  <p>
                    A point-in-time snapshot will be archived before committing changes. You may view
                    audit logs or revert at any time from the Session Management settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Execution Completed */}
          {currentStep === 5 && committedBatch && (
            <div className="text-center py-8 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Bulk Promotion Batch Committed!
                </h3>
                <p className="text-xs text-slate-500">
                  Students have transitioned to {committedBatch.toSessionYear}. New fee structures
                  instantiated and historical archives sealed.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 text-left space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Batch Reference:</span>
                  <span className="font-bold text-slate-900">{committedBatch.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Students Promoted:</span>
                  <span className="font-bold text-emerald-700">{committedBatch.promotedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Students Retained:</span>
                  <span className="font-bold text-rose-700">{committedBatch.repeatedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alumni Transitions:</span>
                  <span className="font-bold text-purple-700">{committedBatch.graduatedCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 5 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as WizardStep)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
            )}

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm transition"
              >
                <span>Generate Promotion Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm transition"
              >
                <span>Continue to Fee Mapping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm transition"
              >
                <span>Preview Impact Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={handleCommitPromotion}
                disabled={isCommitting}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 disabled:opacity-50 shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCommitting ? 'Committing Batch...' : 'Confirm & Commit Promotion'}</span>
              </button>
            )}

            {currentStep === 5 && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-sm transition"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
