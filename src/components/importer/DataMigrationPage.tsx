import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Users,
  Briefcase,
  Receipt,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ClassLevel,
  ImportEntityType,
  ImportRow,
  Role,
  Student,
  Staff,
  FeePayment,
} from '../../types';
import { Button, Badge, Modal } from '../../design-system';
import { UploadZone } from './UploadZone';
import { ValidationStatsBar, FilterStatus } from './ValidationStatsBar';
import { ImporterDataGrid } from './ImporterDataGrid';
import { RowCorrectionModal } from './RowCorrectionModal';
import { CommittedDirectoryView } from './CommittedDirectoryView';
import { processAndValidateBatch, revalidateRow } from '../../lib/importer/fileParser';
import {
  getStoredStudents,
  saveStudents,
  getStoredStaff,
  saveStaff,
  getStoredFees,
  saveFees,
  syncLevelArmEnrollments,
} from '../../lib/migration-store';

interface DataMigrationPageProps {
  levels: ClassLevel[];
  onUpdateLevels: (newLevels: ClassLevel[]) => void;
  userRole: Role;
  onLogAudit: (action: string, details: string) => void;
}

export const DataMigrationPage: React.FC<DataMigrationPageProps> = ({
  levels,
  onUpdateLevels,
  userRole,
  onLogAudit,
}) => {
  // Navigation & Entity
  const [activeTab, setActiveTab] = useState<ImportEntityType | 'DIRECTORY'>('STUDENTS');

  // Database stored records
  const [committedStudents, setCommittedStudents] = useState<Student[]>(() => getStoredStudents());
  const [committedStaff, setCommittedStaff] = useState<Staff[]>(() => getStoredStaff());
  const [committedFees, setCommittedFees] = useState<FeePayment[]>(() => getStoredFees());

  // Active Upload Batch State
  const [batchRows, setBatchRows] = useState<ImportRow<any>[]>([]);
  const [batchSourceName, setBatchSourceName] = useState<string | null>(null);
  const [batchFilter, setBatchFilter] = useState<FilterStatus>('ALL');

  // Correction Modal State
  const [editingRow, setEditingRow] = useState<ImportRow<any> | null>(null);

  // Success / Commit confirmation modal
  const [commitSummary, setCommitSummary] = useState<{
    count: number;
    entity: ImportEntityType;
  } | null>(null);

  // Synchronize initial data if needed
  useEffect(() => {
    // If students exist in storage and levels haven't been synchronized, sync them
    if (committedStudents.length > 0) {
      const updatedLevels = syncLevelArmEnrollments(levels, committedStudents);
      const hasChanges = JSON.stringify(updatedLevels) !== JSON.stringify(levels);
      if (hasChanges) {
        onUpdateLevels(updatedLevels);
      }
    }
  }, [committedStudents]);

  // Handle uploaded raw rows from UploadZone
  const handleRowsLoaded = (rawRows: Record<string, string>[], sourceName: string) => {
    if (activeTab === 'DIRECTORY') return;

    const validated = processAndValidateBatch(
      activeTab,
      rawRows,
      levels,
      committedStudents,
      committedStaff,
      committedFees
    );

    setBatchRows(validated);
    setBatchSourceName(sourceName);
    setBatchFilter('ALL');
  };

  // Row correction save
  const handleSaveCorrectedRow = (updatedRow: ImportRow<any>) => {
    if (activeTab === 'DIRECTORY') return;

    const updatedBatch = batchRows.map((r) => {
      if (r.id === updatedRow.id) {
        return revalidateRow(
          updatedRow,
          activeTab,
          batchRows,
          levels,
          committedStudents,
          committedStaff,
          committedFees
        );
      }
      return r;
    });

    setBatchRows(updatedBatch);
    setEditingRow(null);
  };

  // Save row and navigate to next invalid row
  const handleSaveAndNext = (updatedRow: ImportRow<any>) => {
    if (activeTab === 'DIRECTORY') return;

    const updatedBatch = batchRows.map((r) => {
      if (r.id === updatedRow.id) {
        return revalidateRow(
          updatedRow,
          activeTab,
          batchRows,
          levels,
          committedStudents,
          committedStaff,
          committedFees
        );
      }
      return r;
    });

    setBatchRows(updatedBatch);

    // Find next invalid row
    const currentIndex = updatedBatch.findIndex((r) => r.id === updatedRow.id);
    const remainingErrors = updatedBatch.slice(currentIndex + 1).filter((r) => !r.isValid);

    if (remainingErrors.length > 0) {
      setEditingRow(remainingErrors[0]);
    } else {
      setEditingRow(null);
    }
  };

  // Delete row from batch
  const handleDeleteRow = (rowId: string) => {
    const updated = batchRows.filter((r) => r.id !== rowId);
    setBatchRows(updated);
    if (editingRow?.id === rowId) {
      setEditingRow(null);
    }
  };

  // Discard entire batch
  const handleDiscardBatch = () => {
    setBatchRows([]);
    setBatchSourceName(null);
    setEditingRow(null);
  };

  // Commit valid rows to database
  const handleCommitValid = () => {
    if (activeTab === 'DIRECTORY') return;

    const validRows = batchRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    if (activeTab === 'STUDENTS') {
      const newStudents = validRows.map((r) => r.data as Student);
      const combined = [...committedStudents, ...newStudents];
      saveStudents(combined);
      setCommittedStudents(combined);

      // Update class structure arm counts
      const updatedLevels = syncLevelArmEnrollments(levels, combined);
      onUpdateLevels(updatedLevels);

      onLogAudit(
        'DATA_IMPORT_STUDENTS',
        `Committed ${newStudents.length} student records from "${batchSourceName}". Total students enrolled: ${combined.length}.`
      );

      setCommitSummary({ count: newStudents.length, entity: 'STUDENTS' });
    } else if (activeTab === 'STAFF') {
      const newStaff = validRows.map((r) => r.data as Staff);
      const combined = [...committedStaff, ...newStaff];
      saveStaff(combined);
      setCommittedStaff(combined);

      onLogAudit(
        'DATA_IMPORT_STAFF',
        `Committed ${newStaff.length} staff records from "${batchSourceName}". Total staff registered: ${combined.length}.`
      );

      setCommitSummary({ count: newStaff.length, entity: 'STAFF' });
    } else if (activeTab === 'FEES') {
      const newFees = validRows.map((r) => r.data as FeePayment);
      const combined = [...committedFees, ...newFees];
      saveFees(combined);
      setCommittedFees(combined);

      onLogAudit(
        'DATA_IMPORT_FEES',
        `Committed ${newFees.length} historical fee transactions from "${batchSourceName}".`
      );

      setCommitSummary({ count: newFees.length, entity: 'FEES' });
    }

    // Remove committed rows from preview batch
    const remainingInvalid = batchRows.filter((r) => !r.isValid);
    setBatchRows(remainingInvalid);
    if (remainingInvalid.length === 0) {
      setBatchSourceName(null);
    }
  };

  // Clear handlers
  const handleClearStudents = () => {
    saveStudents([]);
    setCommittedStudents([]);
    onLogAudit('DATA_PURGE_STUDENTS', 'Cleared all student directory records.');
  };

  const handleClearStaff = () => {
    saveStaff([]);
    setCommittedStaff([]);
    onLogAudit('DATA_PURGE_STAFF', 'Cleared all staff directory records.');
  };

  const handleClearFees = () => {
    saveFees([]);
    setCommittedFees([]);
    onLogAudit('DATA_PURGE_FEES', 'Cleared all historical fee records.');
  };

  // Metrics for active batch
  const totalBatch = batchRows.length;
  const validBatch = batchRows.filter((r) => r.isValid).length;
  const errorBatch = batchRows.filter((r) => !r.isValid).length;
  const correctedBatch = batchRows.filter((r) => r.isCorrected).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              CSV & Excel Data Migration Importer
            </h1>
            <Badge variant="primary" size="sm">
              Pre-Validation Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Bulk onboard student registers, academic staff directories, and historical fee ledgers.
            Features automated schema matching, class structure validation, duplicate admission detection,
            and inline row-level error correction before database commit.
          </p>
        </div>

        {/* Database Quick Stats */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>Database:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {committedStudents.length} Students
            </span>
          </button>
        </div>
      </div>

      {/* Entity Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('STUDENTS');
            if (batchRows.length > 0 && activeTab !== 'STUDENTS') handleDiscardBatch();
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'STUDENTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Records</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'STUDENTS'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {committedStudents.length} Enrolled
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('STAFF');
            if (batchRows.length > 0 && activeTab !== 'STAFF') handleDiscardBatch();
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'STAFF'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Staff Records</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'STAFF'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {committedStaff.length} Staff
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('FEES');
            if (batchRows.length > 0 && activeTab !== 'FEES') handleDiscardBatch();
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'FEES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Historical Fee Records</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'FEES'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {committedFees.length} Records
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold ml-auto transition-all cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>View Database Directory</span>
        </button>
      </div>

      {/* VIEW 1: COMMITTED DATABASE DIRECTORY */}
      {activeTab === 'DIRECTORY' ? (
        <CommittedDirectoryView
          students={committedStudents}
          staff={committedStaff}
          fees={committedFees}
          levels={levels}
          onClearStudents={handleClearStudents}
          onClearStaff={handleClearStaff}
          onClearFees={handleClearFees}
          onNavigateToImporter={() => setActiveTab('STUDENTS')}
        />
      ) : (
        /* VIEW 2: IMPORTER WORKFLOW */
        <div className="space-y-6">
          {/* No batch in progress: show Upload Dropzone */}
          {batchRows.length === 0 ? (
            <UploadZone
              entityType={activeTab}
              levels={levels}
              onRowsLoaded={handleRowsLoaded}
              isLoading={false}
            />
          ) : (
            /* Batch in progress: Pre-Validation Preview Screen */
            <div className="space-y-4">
              {/* Batch Source Header Info */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Source File:
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {batchSourceName || 'Uploaded Batch'}
                  </span>
                </div>
                <div>
                  Pre-validated against{' '}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {levels.length} class levels & {levels.reduce((acc, l) => acc + l.arms.length, 0)} arms
                  </span>
                </div>
              </div>

              {/* KPI Summary Cards & Filters */}
              <ValidationStatsBar
                totalRows={totalBatch}
                validRows={validBatch}
                errorRows={errorBatch}
                correctedRows={correctedBatch}
                currentFilter={batchFilter}
                onFilterChange={setBatchFilter}
                onCommitValid={handleCommitValid}
                onDiscard={handleDiscardBatch}
                entityName={activeTab === 'STUDENTS' ? 'Student' : activeTab === 'STAFF' ? 'Staff' : 'Fee'}
              />

              {/* Data Table Grid */}
              <ImporterDataGrid
                entityType={activeTab}
                rows={batchRows}
                onEditRow={(row) => setEditingRow(row)}
                onDeleteRow={handleDeleteRow}
                filter={batchFilter}
              />
            </div>
          )}
        </div>
      )}

      {/* Row Correction Modal */}
      {editingRow && (
        <RowCorrectionModal
          isOpen={!!editingRow}
          onClose={() => setEditingRow(null)}
          row={editingRow}
          entityType={activeTab === 'DIRECTORY' ? 'STUDENTS' : activeTab}
          levels={levels}
          onSaveRow={handleSaveCorrectedRow}
          onDeleteRow={handleDeleteRow}
          onSaveAndNext={handleSaveAndNext}
          hasNextError={batchRows.some((r) => !r.isValid && r.id !== editingRow.id)}
        />
      )}

      {/* Commit Celebration Modal */}
      {commitSummary && (
        <Modal
          isOpen={!!commitSummary}
          onClose={() => setCommitSummary(null)}
          maxWidth="md"
          title={
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Import Committed Successfully</span>
            </div>
          }
          description="The validated records have been written to the permanent school registry and synced with class capacity allocations."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommitSummary(null)}
              >
                Done
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCommitSummary(null);
                  setActiveTab('DIRECTORY');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <span>View in Database</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          }
        >
          <div className="py-4 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {commitSummary.count} Records Ingested
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {commitSummary.entity === 'STUDENTS'
                ? `All ${commitSummary.count} students are now enrolled. Class arm enrollments and capacity utilization graphs have been recalculated dynamically.`
                : commitSummary.entity === 'STAFF'
                ? `Staff directory has been updated with ${commitSummary.count} faculty and administration personnel.`
                : `Fee payments ledger updated with ${commitSummary.count} historical transactions.`}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
