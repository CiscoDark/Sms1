import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { GradingConfiguration, GradeBoundary } from '../../types';
import { Modal, Button, Input, Badge } from '../../design-system';
import { DEFAULT_GRADING_CONFIG, saveGradingConfig } from '../../lib/assessment-exam-store';

interface GradingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GradingConfiguration;
  onSaveConfig: (newConfig: GradingConfiguration) => void;
}

export const GradingConfigModal: React.FC<GradingConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [ca1Max, setCa1Max] = useState(config.ca1Max);
  const [ca2Max, setCa2Max] = useState(config.ca2Max);
  const [examMax, setExamMax] = useState(config.examMax);
  const [passMark, setPassMark] = useState(config.passMark);
  const [boundaries, setBoundaries] = useState<GradeBoundary[]>(config.boundaries);

  const totalCalculated = ca1Max + ca2Max + examMax;

  const handleResetDefaults = () => {
    setCa1Max(DEFAULT_GRADING_CONFIG.ca1Max);
    setCa2Max(DEFAULT_GRADING_CONFIG.ca2Max);
    setExamMax(DEFAULT_GRADING_CONFIG.examMax);
    setPassMark(DEFAULT_GRADING_CONFIG.passMark);
    setBoundaries(DEFAULT_GRADING_CONFIG.boundaries);
  };

  const handleBoundaryChange = (index: number, field: 'minScore' | 'maxScore' | 'remark' | 'gpaPoint', val: any) => {
    const next = [...boundaries];
    next[index] = { ...next[index], [field]: val };
    setBoundaries(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GradingConfiguration = {
      ...config,
      ca1Max,
      ca2Max,
      examMax,
      totalMax: totalCalculated,
      passMark,
      boundaries,
      updatedAt: new Date().toISOString(),
    };

    saveGradingConfig(updated);
    onSaveConfig(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurable Grading Schema & Boundaries"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure continuous assessment weights, examination maximums, letter grade boundaries, and passing benchmarks. Changes take effect across all calculation engines immediately.
        </p>

        {/* Assessment Weights Configuration */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Assessment Component Maximums
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CA 1 Maximum (Marks)
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={ca1Max}
                onChange={(e) => setCa1Max(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mid-Term / CA 2 Maximum
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={ca2Max}
                onChange={(e) => setCa2Max(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Terminal Exam Maximum
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={examMax}
                onChange={(e) => setExamMax(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Computed Assessment Total:
            </span>
            <span className={`font-black text-sm ${totalCalculated === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {totalCalculated} Marks {totalCalculated === 100 ? '✓ (Balanced 100%)' : '⚠ (Recommended: 100)'}
            </span>
          </div>
        </div>

        {/* Grade Boundaries Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Grade Letter Boundaries & GPA Points
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Pass Benchmark:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
                className="w-16 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-bold text-indigo-600"
              />
              <span>%</span>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-2.5 text-left">Grade</th>
                  <th className="p-2.5 text-left">Min Score</th>
                  <th className="p-2.5 text-left">Max Score</th>
                  <th className="p-2.5 text-left">Performance Remark</th>
                  <th className="p-2.5 text-left">GPA Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {boundaries.map((b, idx) => (
                  <tr key={b.grade}>
                    <td className="p-2.5 font-black text-sm text-slate-900 dark:text-slate-100">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        b.grade === 'A'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : b.grade === 'B'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : b.grade === 'C'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : b.grade === 'D'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {b.grade}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={b.minScore}
                        onChange={(e) => handleBoundaryChange(idx, 'minScore', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={b.maxScore}
                        onChange={(e) => handleBoundaryChange(idx, 'maxScore', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={b.remark}
                        onChange={(e) => handleBoundaryChange(idx, 'remark', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={5}
                        value={b.gpaPoint}
                        onChange={(e) => handleBoundaryChange(idx, 'gpaPoint', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleResetDefaults}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset to Standard Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Save className="w-4 h-4" />}>
              Save & Apply Schema
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
