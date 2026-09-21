import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  X,
  Play,
  Sliders,
  Check,
  Edit3,
  UserCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { StudentSubjectGradeRecord, UserProfile } from '../../types';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { generateLocalPedagogicalRemark } from '../../lib/report-card-store';

interface BulkAiRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: StudentSubjectGradeRecord[];
  currentUser: UserProfile;
  classLevel: string;
  classArm: string;
  termName: string;
  sessionYear: string;
  onApplyBulkRemarks: (updatedRecords: { studentId: string; remark: string }[]) => void;
}

export const BulkAiRemarksModal: React.FC<BulkAiRemarksModalProps> = ({
  isOpen,
  onClose,
  records,
  currentUser,
  classLevel,
  classArm,
  termName,
  sessionYear,
  onApplyBulkRemarks,
}) => {
  if (!isOpen) return null;

  const [tone, setTone] = useState<'encouraging' | 'balanced' | 'rigorous' | 'growth'>('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draftedRemarks, setDraftedRemarks] = useState<
    { studentId: string; studentName: string; score: number; grade: string; remark: string; isReviewed: boolean }[]
  >(() =>
    records.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      score: r.totalScore || 75,
      grade: r.grade || 'A1',
      remark: r.teacherRemarks || r.remark || '',
      isReviewed: !!(r.teacherRemarks || r.remark),
    }))
  );

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [teacherSignOffAll, setTeacherSignOffAll] = useState(true);

  // Run bulk generator
  const handleStartBatch = async () => {
    setIsProcessing(true);
    setProgress(5);

    const itemsToProcess = [...draftedRemarks];
    const total = itemsToProcess.length;

    for (let i = 0; i < total; i++) {
      const item = itemsToProcess[i];
      // Generate using local engine or API
      const remark = generateLocalPedagogicalRemark({
        studentName: item.studentName,
        gender: 'M',
        classLevel,
        overallScore: item.score,
        overallGrade: item.grade,
        attendanceRate: 98,
        disciplinaryCount: 0,
        tone,
      });

      itemsToProcess[i] = {
        ...item,
        remark,
        isReviewed: true,
      };

      // Simulate step progress
      setProgress(Math.round(((i + 1) / total) * 100));
      // slight delay for pleasant UI feedback
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    setDraftedRemarks([...itemsToProcess]);
    setIsProcessing(false);
  };

  const handleUpdateSingleRemark = (studentId: string, newText: string) => {
    setDraftedRemarks((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, remark: newText, isReviewed: true } : item
      )
    );
  };

  const handleApplyToGradebook = () => {
    const ready = draftedRemarks
      .filter((r) => r.remark.trim().length > 0)
      .map((r) => ({ studentId: r.studentId, remark: r.remark }));
    onApplyBulkRemarks(ready);
    onClose();
  };

  const countFilled = draftedRemarks.filter((r) => r.remark.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Class Batch AI Remarks Assistant
                </h3>
                <Badge variant="primary" size="sm">
                  {classLevel} • {classArm}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Draft personalized pedagogical remarks for {records.length} students with teacher sign-off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Tone Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Batch Tone Profile:
              </span>
              <div className="flex items-center gap-1.5">
                {(['balanced', 'encouraging', 'rigorous', 'growth'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    disabled={isProcessing}
                    className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                      tone === t
                        ? 'bg-indigo-600 text-white font-medium shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleStartBatch}
              isLoading={isProcessing}
              disabled={isProcessing}
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              {isProcessing ? 'Generating...' : `Draft for All ${records.length} Students`}
            </Button>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                <span>Ingesting scores & generating personalized drafts...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full bg-linear-to-r from-indigo-500 to-teal-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Review Queue List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
            <span>Teacher Review Queue ({countFilled} of {records.length} drafted)</span>
            <span>Click any remark to fine-tune</span>
          </div>

          {draftedRemarks.map((item, idx) => (
            <div
              key={item.studentId}
              className={`p-4 rounded-xl border transition-all ${
                item.remark
                  ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'bg-white/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.studentName}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      Score: <strong className="text-indigo-600 dark:text-indigo-400">{item.score}%</strong> ({item.grade})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.remark && (
                    <Badge variant="success" size="sm">
                      <Check className="w-3 h-3 mr-1" />
                      Ready for Sign-Off
                    </Badge>
                  )}
                  <button
                    onClick={() => setEditingStudentId(editingStudentId === item.studentId ? null : item.studentId)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingStudentId === item.studentId ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={3}
                    value={item.remark}
                    onChange={(e) => handleUpdateSingleRemark(item.studentId, e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" variant="primary" onClick={() => setEditingStudentId(null)}>
                      Done Editing
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  onClick={() => setEditingStudentId(item.studentId)}
                  className="text-xs text-slate-600 dark:text-slate-300 italic cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800"
                >
                  {item.remark || 'No remark drafted yet. Click "Draft for All" or edit manually.'}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer & Teacher Sign-off Confirmation */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shrink-0">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
            <input
              type="checkbox"
              checked={teacherSignOffAll}
              onChange={(e) => setTeacherSignOffAll(e.target.checked)}
              className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Teacher Sign-Off: I confirm Form Teacher review of all {countFilled} generated remarks ({currentUser.name})
            </span>
          </label>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={countFilled === 0 || !teacherSignOffAll}
              onClick={handleApplyToGradebook}
              leftIcon={<FileCheck className="w-4 h-4" />}
            >
              Apply {countFilled} Signed Remarks to Gradebook
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
