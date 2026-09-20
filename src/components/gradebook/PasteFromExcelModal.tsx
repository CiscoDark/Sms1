import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Layers,
} from 'lucide-react';
import { StudentSubjectGradeRecord, GradingConfiguration } from '../../types';
import { Modal, Button, Badge } from '../../design-system';
import { parseExcelClipboardData, applyPastedScoresToGradebook } from '../../lib/gradebook-store';

interface PasteFromExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecords: StudentSubjectGradeRecord[];
  config: GradingConfiguration;
  onApplyPasted: (updatedRecords: StudentSubjectGradeRecord[], count: number) => void;
}

export const PasteFromExcelModal: React.FC<PasteFromExcelModalProps> = ({
  isOpen,
  onClose,
  currentRecords,
  config,
  onApplyPasted,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [targetColumn, setTargetColumn] = useState<'ca1Score' | 'ca2Score' | 'examScore'>('ca1Score');

  const matrix = parseExcelClipboardData(pastedText);
  const detectedRows = matrix.length;
  const detectedCols = matrix[0]?.length || 0;

  const handleApply = () => {
    if (detectedRows === 0) return;

    const { updatedRecords, cellsUpdated } = applyPastedScoresToGradebook(
      0, // Start from first student row
      targetColumn,
      matrix,
      currentRecords,
      config
    );

    onApplyPasted(updatedRecords, cellsUpdated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paste Scores from Excel or Google Sheets"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Copy a single column (e.g. CA scores) or multiple columns (CA1, CA2, Exam) directly from your Excel or Google Sheets spreadsheet and paste them into the box below.
        </p>

        {/* Target Starting Column */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Paste Starting Column:
          </span>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="ca1Score">CA 1 (Max {config.ca1Max})</option>
            <option value="ca2Score">Mid-Term CA 2 (Max {config.ca2Max})</option>
            <option value="examScore">Terminal Exam (Max {config.examMax})</option>
          </select>
          <span className="text-[11px] text-slate-400">
            (If multiple columns are pasted, they fill rightward)
          </span>
        </div>

        {/* Paste Textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Raw Spreadsheet Clipboard Data (Ctrl+V or Cmd+V)
          </label>
          <textarea
            rows={7}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`18\t19\t52\n15\t17\t48\n19\t20\t58\n...`}
            className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Live Parsing Preview */}
        {detectedRows > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">
                Detected {detectedRows} student rows across {detectedCols} column(s)
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Matches {Math.min(detectedRows, currentRecords.length)} class roster student(s)
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={detectedRows === 0}
            onClick={handleApply}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Apply to Gradebook Grid
          </Button>
        </div>
      </div>
    </Modal>
  );
};
