import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Lock,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { GradingConfiguration, GradeBoundary, UserProfile } from '../../types';
import { Modal, Button, Input, Badge } from '../../design-system';
import { DEFAULT_GRADING_CONFIG, NIGERIAN_A1_F9_BOUNDARIES, saveGradingConfig } from '../../lib/assessment-exam-store';

interface GradingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GradingConfiguration;
  currentUser: UserProfile;
  onSaveConfig: (newConfig: GradingConfiguration) => void;
}

export const GradingConfigModal: React.FC<GradingConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  currentUser,
  onSaveConfig,
}) => {
  // Permission gate: "heading system can be edited by super admin and admin only"
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role);

  // Component headings and labels
  const [systemTitle, setSystemTitle] = useState(config.systemTitle || 'Nigerian Secondary School Standard (A1 - F9)');
  const [ca1Name, setCa1Name] = useState(config.ca1Name || 'Continuous Assessment 1 (CA 1)');
  const [ca2Name, setCa2Name] = useState(config.ca2Name || 'Mid-Term Test (CA 2)');
  const [examName, setExamName] = useState(config.examName || 'Terminal Examination');

  // Maximum marks
  const [ca1Max, setCa1Max] = useState(config.ca1Max);
  const [ca2Max, setCa2Max] = useState(config.ca2Max);
  const [examMax, setExamMax] = useState(config.examMax);
  const [passMark, setPassMark] = useState(config.passMark);

  // Nigerian 3rd Term Cumulative Weightings: 20% First Term, 30% Second Term, 50% Third Term
  const [cumTerm1, setCumTerm1] = useState(config.cumulativeTerm1Weight ?? 20);
  const [cumTerm2, setCumTerm2] = useState(config.cumulativeTerm2Weight ?? 30);
  const [cumTerm3, setCumTerm3] = useState(config.cumulativeTerm3Weight ?? 50);

  const [boundaries, setBoundaries] = useState<GradeBoundary[]>(
    config.boundaries && config.boundaries.length > 0 ? config.boundaries : NIGERIAN_A1_F9_BOUNDARIES
  );

  const totalCalculated = ca1Max + ca2Max + examMax;
  const cumulativeTotalWeight = cumTerm1 + cumTerm2 + cumTerm3;

  const handleResetDefaults = () => {
    if (!isAdmin) return;
    setSystemTitle(DEFAULT_GRADING_CONFIG.systemTitle || 'Nigerian Secondary School Standard (A1 - F9)');
    setCa1Name(DEFAULT_GRADING_CONFIG.ca1Name);
    setCa2Name(DEFAULT_GRADING_CONFIG.ca2Name);
    setExamName(DEFAULT_GRADING_CONFIG.examName);
    setCa1Max(DEFAULT_GRADING_CONFIG.ca1Max);
    setCa2Max(DEFAULT_GRADING_CONFIG.ca2Max);
    setExamMax(DEFAULT_GRADING_CONFIG.examMax);
    setPassMark(DEFAULT_GRADING_CONFIG.passMark);
    setCumTerm1(DEFAULT_GRADING_CONFIG.cumulativeTerm1Weight);
    setCumTerm2(DEFAULT_GRADING_CONFIG.cumulativeTerm2Weight);
    setCumTerm3(DEFAULT_GRADING_CONFIG.cumulativeTerm3Weight);
    setBoundaries(NIGERIAN_A1_F9_BOUNDARIES);
  };

  const handleBoundaryChange = (index: number, field: 'grade' | 'minScore' | 'maxScore' | 'remark' | 'gpaPoint', val: any) => {
    if (!isAdmin) return;
    const next = [...boundaries];
    next[index] = { ...next[index], [field]: val };
    setBoundaries(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const updated: GradingConfiguration = {
      ...config,
      systemTitle,
      ca1Name,
      ca2Name,
      examName,
      ca1Max,
      ca2Max,
      examMax,
      totalMax: totalCalculated,
      passMark,
      cumulativeTerm1Weight: cumTerm1,
      cumulativeTerm2Weight: cumTerm2,
      cumulativeTerm3Weight: cumTerm3,
      boundaries,
      updatedAt: new Date().toISOString(),
      updatedBy: `${currentUser.name} (${currentUser.role})`,
    };

    saveGradingConfig(updated);
    onSaveConfig(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nigerian Secondary School Grading Schema & Cumulative Weights"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Admin Permission Lock Notice */}
        {!isAdmin ? (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Restricted Configuration (Admin Gate)</p>
              <p>
                In accordance with Nigerian Secondary School regulations, the grading system headings, continuous assessment weighting, and grade boundaries can <strong>only be edited by Super Admins and Admins</strong>.
                You are currently viewing this schema in read-only audit mode.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-0.5">
              <p className="font-bold">Authorized Administrative Access ({currentUser.role})</p>
              <p>
                You hold administrative privileges to configure component headings, continuous assessment maximums, WAEC/NECO grade thresholds, and promotional term cumulative weights.
              </p>
            </div>
          </div>
        )}

        {/* Heading System Configuration */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Assessment Heading System (Admin Editable)
            </h4>
            <Badge variant="primary" size="sm">
              Nigerian Percentage Model
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grading System Heading / Standard Title
              </label>
              <Input
                type="text"
                value={systemTitle}
                onChange={(e) => setSystemTitle(e.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CA 1 Column Heading
              </label>
              <Input
                type="text"
                value={ca1Name}
                onChange={(e) => setCa1Name(e.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CA 2 / Mid-Term Column Heading
              </label>
              <Input
                type="text"
                value={ca2Name}
                onChange={(e) => setCa2Name(e.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Terminal Examination Column Heading
              </label>
              <Input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
          </div>
        </div>

        {/* Assessment Component Maximums */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Term Marks Breakdown (Total: 100%)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ca1Name} Max (Marks)
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={ca1Max}
                onChange={(e) => setCa1Max(Number(e.target.value))}
                disabled={!isAdmin}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ca2Name} Max (Marks)
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={ca2Max}
                onChange={(e) => setCa2Max(Number(e.target.value))}
                disabled={!isAdmin}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {examName} Max (Marks)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={examMax}
                onChange={(e) => setExamMax(Number(e.target.value))}
                disabled={!isAdmin}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Computed Term Total:
            </span>
            <span className={`font-black text-sm ${totalCalculated === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {totalCalculated}% {totalCalculated === 100 ? '✓ (Standard 100% Balanced)' : '⚠ (Standard secondary total is 100)'}
            </span>
          </div>
        </div>

        {/* 3rd Term Cumulative Rule (20% T1 + 30% T2 + 50% T3) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              3rd Term Annual Cumulative Weights (Promotional Formula)
            </h4>
            <Badge variant="primary" size="sm">
              20% T1 + 30% T2 + 50% T3
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            In the 3rd Term (promotional term), Nigerian secondary schools calculate each student&apos;s cumulative annual grade based on: <strong>20% from First Term</strong>, <strong>30% from Second Term</strong>, and <strong>50% from Third Term</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                1st Term Weight (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={cumTerm1}
                onChange={(e) => setCumTerm1(Number(e.target.value))}
                disabled={!isAdmin}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                2nd Term Weight (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={cumTerm2}
                onChange={(e) => setCumTerm2(Number(e.target.value))}
                disabled={!isAdmin}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                3rd Term Weight (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={cumTerm3}
                onChange={(e) => setCumTerm3(Number(e.target.value))}
                disabled={!isAdmin}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Cumulative Total Weight:
            </span>
            <span className={`font-black text-sm ${cumulativeTotalWeight === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {cumulativeTotalWeight}% {cumulativeTotalWeight === 100 ? '✓ (Balanced 100%)' : '⚠ (Total must equal 100%)'}
            </span>
          </div>
        </div>

        {/* Grade Boundaries Table (A1 - F9) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nigerian Secondary School Scale (A1 - F9)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                WAEC / NECO standard percentage boundaries and performance remarks
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Pass Benchmark:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
                disabled={!isAdmin}
                className="w-16 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-bold text-indigo-600 disabled:opacity-60"
              />
              <span>%</span>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 sticky top-0">
                <tr>
                  <th className="p-2.5 text-left">Grade</th>
                  <th className="p-2.5 text-left">Min (%)</th>
                  <th className="p-2.5 text-left">Max (%)</th>
                  <th className="p-2.5 text-left">Performance Remark</th>
                  <th className="p-2.5 text-left">GPA / Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {boundaries.map((b, idx) => {
                  const isA = b.grade.startsWith('A');
                  const isB = b.grade.startsWith('B');
                  const isC = b.grade.startsWith('C');
                  const isPass = b.grade.startsWith('D') || b.grade.startsWith('E');

                  const badgeClass = isA
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : isB
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : isC
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : isPass
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

                  return (
                    <tr key={b.grade}>
                      <td className="p-2 font-black text-xs text-slate-900 dark:text-slate-100">
                        {isAdmin ? (
                          <input
                            type="text"
                            value={b.grade}
                            onChange={(e) => handleBoundaryChange(idx, 'grade', e.target.value)}
                            className={`w-12 px-1.5 py-0.5 rounded font-bold text-center ${badgeClass}`}
                          />
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-bold ${badgeClass}`}>
                            {b.grade}
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={b.minScore}
                          onChange={(e) => handleBoundaryChange(idx, 'minScore', Number(e.target.value))}
                          disabled={!isAdmin}
                          className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 disabled:opacity-70"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={b.maxScore}
                          onChange={(e) => handleBoundaryChange(idx, 'maxScore', Number(e.target.value))}
                          disabled={!isAdmin}
                          className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 disabled:opacity-70"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={b.remark}
                          onChange={(e) => handleBoundaryChange(idx, 'remark', e.target.value)}
                          disabled={!isAdmin}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 disabled:opacity-70"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={5}
                          value={b.gpaPoint}
                          onChange={(e) => handleBoundaryChange(idx, 'gpaPoint', Number(e.target.value))}
                          disabled={!isAdmin}
                          className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 disabled:opacity-70"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {isAdmin ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleResetDefaults}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset to Nigerian WAEC/NECO Standard
            </Button>
          ) : (
            <span className="text-xs text-slate-400 italic">
              Read-only mode (Non-admin)
            </span>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              {isAdmin ? 'Cancel' : 'Close'}
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={cumulativeTotalWeight !== 100}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save & Apply Schema
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
