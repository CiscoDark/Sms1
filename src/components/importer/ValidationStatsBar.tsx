import React from 'react';
import { CheckCircle2, AlertTriangle, CheckCheck, FileText, Database, Trash2 } from 'lucide-react';
import { Badge, Button } from '../../design-system';

export type FilterStatus = 'ALL' | 'ERRORS' | 'VALID' | 'CORRECTED';

interface ValidationStatsBarProps {
  totalRows: number;
  validRows: number;
  errorRows: number;
  correctedRows: number;
  currentFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  onCommitValid: () => void;
  onDiscard: () => void;
  entityName: string;
}

export const ValidationStatsBar: React.FC<ValidationStatsBarProps> = ({
  totalRows,
  validRows,
  errorRows,
  correctedRows,
  currentFilter,
  onFilterChange,
  onCommitValid,
  onDiscard,
  entityName,
}) => {
  const readyToCommitCount = validRows;
  const healthPercent = totalRows > 0 ? Math.round((validRows / totalRows) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Pre-Validation Health Check
              </h3>
              <Badge
                variant={errorRows === 0 ? 'success' : 'warning'}
                size="sm"
              >
                {errorRows === 0 ? '100% Ready' : `${errorRows} Issues Detected`}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and correct highlighted records before committing to the live school registry.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Discard Batch
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onCommitValid}
            disabled={readyToCommitCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Database className="w-4 h-4 mr-1.5" />
            Commit {readyToCommitCount} {readyToCommitCount === 1 ? 'Record' : 'Records'}
          </Button>
        </div>
      </div>

      {/* KPI Cards & Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {/* Total */}
        <button
          type="button"
          onClick={() => onFilterChange('ALL')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            currentFilter === 'ALL'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Uploaded</div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {totalRows}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {entityName} rows detected
          </div>
        </button>

        {/* Valid */}
        <button
          type="button"
          onClick={() => onFilterChange('VALID')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            currentFilter === 'VALID'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span>Valid & Clean</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {validRows}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {healthPercent}% pass rate
          </div>
        </button>

        {/* Errors */}
        <button
          type="button"
          onClick={() => onFilterChange('ERRORS')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            currentFilter === 'ERRORS'
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-rose-700 dark:text-rose-400">
            <span>Needs Correction</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
            {errorRows}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {errorRows === 0 ? 'No blocking errors' : 'Requires row edit'}
          </div>
        </button>

        {/* Corrected */}
        <button
          type="button"
          onClick={() => onFilterChange('CORRECTED')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            currentFilter === 'CORRECTED'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-amber-700 dark:text-amber-400">
            <span>User Corrected</span>
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {correctedRows}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Fixed in preview
          </div>
        </button>
      </div>
    </div>
  );
};
