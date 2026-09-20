import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  FileText,
  Users,
} from 'lucide-react';
import { ImportEntityType, ClassLevel } from '../../types';
import { Button } from '../../design-system';
import {
  getStudentTemplateCSV,
  getStaffTemplateCSV,
  getFeeTemplateCSV,
  generateRealisticStudentCohort,
  generateRealisticStaffCohort,
  generateRealisticFeesCohort,
  generateSampleDatasetWithErrors,
  convertToCSV,
} from '../../lib/importer/mockDatasetGenerator';
import { parseFileToRawRows, parseCSVStringToRawRows } from '../../lib/importer/fileParser';

interface UploadZoneProps {
  entityType: ImportEntityType;
  levels: ClassLevel[];
  onRowsLoaded: (rawRows: Record<string, string>[], sourceName: string) => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  entityType,
  levels,
  onRowsLoaded,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    const validExtensions = ['.csv', '.tsv', '.xlsx', '.xls', '.txt'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadError('Unsupported file format. Please upload a CSV, TSV, or Excel (.xlsx, .xls) file.');
      return;
    }

    try {
      const rows = await parseFileToRawRows(file);
      if (rows.length === 0) {
        setUploadError('The uploaded file appears to be empty or has no data rows.');
        return;
      }
      onRowsLoaded(rows, file.name);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Quick Action 1: Load 250+ Realistic Student Cohort
  const handleLoadRealisticCohort = () => {
    setUploadError(null);
    if (entityType === 'STUDENTS') {
      const cohort = generateRealisticStudentCohort(levels);
      const csv = convertToCSV(cohort);
      const rows = parseCSVStringToRawRows(csv);
      onRowsLoaded(rows, `Realistic_Cohort_250+_Students.csv`);
    } else if (entityType === 'STAFF') {
      const cohort = generateRealisticStaffCohort();
      const csv = convertToCSV(cohort);
      const rows = parseCSVStringToRawRows(csv);
      onRowsLoaded(rows, `Realistic_Staff_Directory.csv`);
    } else {
      const dummyStudents = generateRealisticStudentCohort(levels);
      const cohort = generateRealisticFeesCohort(dummyStudents);
      const csv = convertToCSV(cohort);
      const rows = parseCSVStringToRawRows(csv);
      onRowsLoaded(rows, `Historical_Fee_Records.csv`);
    }
  };

  // Quick Action 2: Load Sample with Intentional Validation Errors
  const handleLoadSampleWithErrors = () => {
    setUploadError(null);
    const rawRows = generateSampleDatasetWithErrors();
    onRowsLoaded(rawRows, 'Test_Sample_With_Validation_Errors.csv');
  };

  // Quick Action 3: Download CSV Template
  const handleDownloadTemplate = () => {
    let csvContent = '';
    let fileName = '';

    if (entityType === 'STUDENTS') {
      csvContent = getStudentTemplateCSV();
      fileName = 'student_migration_template.csv';
    } else if (entityType === 'STAFF') {
      csvContent = getStaffTemplateCSV();
      fileName = 'staff_migration_template.csv';
    } else {
      csvContent = getFeeTemplateCSV();
      fileName = 'fee_records_template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Upload Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 ring-4 ring-indigo-500/10'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Upload {entityType === 'STUDENTS' ? 'Student Register' : entityType === 'STAFF' ? 'Staff Directory' : 'Fee Records'} File
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop your <span className="font-semibold text-slate-700 dark:text-slate-300">CSV, TSV, or Excel (.xlsx)</span> file here, or click to browse.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              .CSV
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              .XLSX
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              .TSV
            </span>
            <span>• Pre-validation runs instantly on upload</span>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Load 250+ Cohort */}
        <button
          type="button"
          onClick={handleLoadRealisticCohort}
          disabled={isLoading}
          className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition-all cursor-pointer group flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              {entityType === 'STUDENTS' ? 'Load 250+ Students Cohort' : entityType === 'STAFF' ? 'Load Realistic Staff List' : 'Load Historical Fees'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Populates realistic data mapped to our 6 class levels & arms.
            </div>
          </div>
        </button>

        {/* Load Test Sample with Errors */}
        <button
          type="button"
          onClick={handleLoadSampleWithErrors}
          disabled={isLoading}
          className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition-all cursor-pointer group flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-amber-600 text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
              Test Pre-Validation Errors
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Loads 10 rows with duplicate adm no, invalid phone & wrong arms.
            </div>
          </div>
        </button>

        {/* Download CSV Template */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all cursor-pointer group flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-slate-700 text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Download CSV Template
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Formatted template headers matching schema requirements.
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
