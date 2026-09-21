import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ImportEntityType,
  ImportRow,
  Student,
  Staff,
  FeePayment,
  ValidationError,
} from '../../types';
import { Badge, Button, Input } from '../../design-system';
import { formatNaira } from '../../lib/currency';

interface ImporterDataGridProps {
  entityType: ImportEntityType;
  rows: ImportRow<any>[];
  onEditRow: (row: ImportRow<any>) => void;
  onDeleteRow: (rowId: string) => void;
  filter: 'ALL' | 'ERRORS' | 'VALID' | 'CORRECTED';
}

export const ImporterDataGrid: React.FC<ImporterDataGridProps> = ({
  entityType,
  rows,
  onEditRow,
  onDeleteRow,
  filter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Status filter
      if (filter === 'ERRORS' && row.isValid) return false;
      if (filter === 'VALID' && !row.isValid) return false;
      if (filter === 'CORRECTED' && !row.isCorrected) return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      if (entityType === 'STUDENTS') {
        const s = row.data as Student;
        return (
          s.admissionNumber?.toLowerCase().includes(q) ||
          s.firstName?.toLowerCase().includes(q) ||
          s.lastName?.toLowerCase().includes(q) ||
          s.classLevel?.toLowerCase().includes(q) ||
          s.classArm?.toLowerCase().includes(q) ||
          s.guardianPhone?.includes(q)
        );
      } else if (entityType === 'STAFF') {
        const stf = row.data as Staff;
        return (
          stf.staffNumber?.toLowerCase().includes(q) ||
          stf.firstName?.toLowerCase().includes(q) ||
          stf.lastName?.toLowerCase().includes(q) ||
          stf.email?.toLowerCase().includes(q) ||
          stf.department?.toLowerCase().includes(q)
        );
      } else {
        const fee = row.data as FeePayment;
        return (
          fee.transactionReference?.toLowerCase().includes(q) ||
          fee.admissionNumber?.toLowerCase().includes(q) ||
          fee.feeCategory?.toLowerCase().includes(q)
        );
      }
    });
  }, [rows, filter, searchQuery, entityType]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const getCellError = (row: ImportRow<any>, field: string): ValidationError | undefined => {
    return row.errors.find((e) => e.field === field);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${entityType.toLowerCase()} in preview...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{paginatedRows.length}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredRows.length}</span> rows
          {filteredRows.length < rows.length && ` (filtered from ${rows.length})`}
        </div>
      </div>

      {/* Responsive Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-100/75 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="py-3 px-3 w-12 text-center">Row</th>
              <th className="py-3 px-3 w-28">Status</th>
              {entityType === 'STUDENTS' && (
                <>
                  <th className="py-3 px-3">Admission No</th>
                  <th className="py-3 px-3">Full Name</th>
                  <th className="py-3 px-2 w-14">Sex</th>
                  <th className="py-3 px-3">Class Level</th>
                  <th className="py-3 px-3">Class Arm</th>
                  <th className="py-3 px-3">Guardian Contact</th>
                  <th className="py-3 px-3">Issues Flagged</th>
                </>
              )}
              {entityType === 'STAFF' && (
                <>
                  <th className="py-3 px-3">Staff ID</th>
                  <th className="py-3 px-3">Staff Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Issues Flagged</th>
                </>
              )}
              {entityType === 'FEES' && (
                <>
                  <th className="py-3 px-3">Txn Ref</th>
                  <th className="py-3 px-3">Adm No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Amount (₦)</th>
                  <th className="py-3 px-3">Term</th>
                  <th className="py-3 px-3">Issues Flagged</th>
                </>
              )}
              <th className="py-3 px-3 text-right w-24">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  No records match your selected filter or search query.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const isError = !row.isValid;
                const isCorrected = row.isCorrected;

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isError
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30'
                        : isCorrected
                        ? 'bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/50'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                      #{row.rowIndex}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      {isError ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Needs Fix</span>
                        </span>
                      ) : isCorrected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                          <CheckCheck className="w-3 h-3 text-amber-600" />
                          <span>Corrected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Valid</span>
                        </span>
                      )}
                    </td>

                    {/* STUDENTS DATA COLUMNS */}
                    {entityType === 'STUDENTS' && (() => {
                      const s = row.data as Student;
                      const admErr = getCellError(row, 'admissionNumber');
                      const nameErr = getCellError(row, 'firstName') || getCellError(row, 'lastName');
                      const lvlErr = getCellError(row, 'classLevel');
                      const armErr = getCellError(row, 'classArm');
                      const phoneErr = getCellError(row, 'guardianPhone') || getCellError(row, 'guardianName');

                      return (
                        <>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={admErr ? 'px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800' : ''}>
                              {s.admissionNumber || '<Empty>'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={nameErr ? 'px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-medium' : 'font-medium text-slate-900 dark:text-slate-100'}>
                              {s.firstName || '<Missing>'} {s.lastName || ''}
                            </span>
                          </td>

                          <td className="py-2.5 px-2">
                            <span className="font-semibold text-[11px]">
                              {s.gender || '-'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={lvlErr ? 'px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300' : ''}>
                              {s.classLevel || '<Empty>'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={armErr ? 'px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300' : 'text-slate-600 dark:text-slate-400'}>
                              {s.classArm || '<Empty>'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="text-[11px]">
                              <div>{s.guardianName || '<No Name>'}</div>
                              <span className={phoneErr ? 'text-rose-600 dark:text-rose-400 font-bold font-mono' : 'text-slate-400 font-mono'}>
                                {s.guardianPhone || '<No Phone>'}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 max-w-xs">
                            {row.errors.length > 0 ? (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium line-clamp-2">
                                {row.errors.map((e) => e.message).join(' • ')}
                              </div>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                No errors
                              </span>
                            )}
                          </td>
                        </>
                      );
                    })()}

                    {/* STAFF DATA COLUMNS */}
                    {entityType === 'STAFF' && (() => {
                      const stf = row.data as Staff;
                      const staffNoErr = getCellError(row, 'staffNumber');
                      const emailErr = getCellError(row, 'email');
                      const phoneErr = getCellError(row, 'phone');

                      return (
                        <>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={staffNoErr ? 'px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 font-bold' : ''}>
                              {stf.staffNumber || '<Empty>'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                            {stf.firstName} {stf.lastName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={emailErr ? 'text-rose-600 font-bold' : ''}>
                              {stf.email}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={phoneErr ? 'text-rose-600 font-bold' : ''}>
                              {stf.phone}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{stf.department}</td>
                          <td className="py-2.5 px-3 font-semibold text-[11px]">{stf.role}</td>
                          <td className="py-2.5 px-3 max-w-xs">
                            {row.errors.length > 0 ? (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium line-clamp-2">
                                {row.errors.map((e) => e.message).join(' • ')}
                              </div>
                            ) : (
                              <span className="text-[11px] text-emerald-600">Clean</span>
                            )}
                          </td>
                        </>
                      );
                    })()}

                    {/* FEES DATA COLUMNS */}
                    {entityType === 'FEES' && (() => {
                      const fee = row.data as FeePayment;
                      const txnErr = getCellError(row, 'transactionReference');
                      const admErr = getCellError(row, 'admissionNumber');
                      const amtErr = getCellError(row, 'amount');

                      return (
                        <>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={txnErr ? 'text-rose-600 font-bold' : ''}>
                              {fee.transactionReference}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={admErr ? 'text-rose-600 font-bold' : ''}>
                              {fee.admissionNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{fee.studentName || '-'}</td>
                          <td className="py-2.5 px-3">{fee.feeCategory}</td>
                          <td className="py-2.5 px-3 font-semibold">
                            <span className={amtErr ? 'text-rose-600 font-bold' : ''}>
                              {formatNaira(Number(fee.amount || 0))}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{fee.term}</td>
                          <td className="py-2.5 px-3 max-w-xs">
                            {row.errors.length > 0 ? (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium line-clamp-2">
                                {row.errors.map((e) => e.message).join(' • ')}
                              </div>
                            ) : (
                              <span className="text-[11px] text-emerald-600">Clean</span>
                            )}
                          </td>
                        </>
                      );
                    })()}

                    {/* Row Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditRow(row)}
                          title="Edit & correct row"
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row.id)}
                          title="Delete row from batch"
                          className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/40 dark:bg-slate-900/40">
          <div className="text-slate-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
