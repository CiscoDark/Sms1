import React, { useState, useMemo } from 'react';
import {
  Users,
  Briefcase,
  Receipt,
  Search,
  Download,
  Filter,
  Trash2,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Student, Staff, FeePayment, ClassLevel } from '../../types';
import { Button, Badge } from '../../design-system';
import { convertToCSV } from '../../lib/importer/mockDatasetGenerator';
import { formatNaira } from '../../lib/currency';

interface CommittedDirectoryViewProps {
  students: Student[];
  staff: Staff[];
  fees: FeePayment[];
  levels: ClassLevel[];
  onClearStudents: () => void;
  onClearStaff: () => void;
  onClearFees: () => void;
  onNavigateToImporter: () => void;
}

export const CommittedDirectoryView: React.FC<CommittedDirectoryViewProps> = ({
  students,
  staff,
  fees,
  levels,
  onClearStudents,
  onClearStaff,
  onClearFees,
  onNavigateToImporter,
}) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'STAFF' | 'FEES'>('STUDENTS');
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedLevel !== 'ALL' && s.classLevel !== selectedLevel) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.admissionNumber.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.classArm.toLowerCase().includes(q) ||
        s.guardianPhone.includes(q)
      );
    });
  }, [students, selectedLevel, search]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staff.filter((stf) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        stf.staffNumber.toLowerCase().includes(q) ||
        stf.firstName.toLowerCase().includes(q) ||
        stf.lastName.toLowerCase().includes(q) ||
        stf.email.toLowerCase().includes(q) ||
        stf.department.toLowerCase().includes(q)
      );
    });
  }, [staff, search]);

  // Filtered Fees
  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        f.transactionReference.toLowerCase().includes(q) ||
        f.admissionNumber.toLowerCase().includes(q) ||
        f.feeCategory.toLowerCase().includes(q) ||
        f.studentName?.toLowerCase().includes(q)
      );
    });
  }, [fees, search]);

  const totalFeeCollected = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const exportCurrent = () => {
    let csv = '';
    let name = '';
    if (activeTab === 'STUDENTS') {
      csv = convertToCSV(filteredStudents);
      name = 'committed_students_directory.csv';
    } else if (activeTab === 'STAFF') {
      csv = convertToCSV(filteredStaff);
      name = 'committed_staff_directory.csv';
    } else {
      csv = convertToCSV(filteredFees);
      name = 'committed_fee_payments.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Live School Registry & Directories
            </h2>
            <Badge variant="success" size="sm">
              Database Synced
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse imported students, academic staff, and historical fee payments currently stored in the system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCurrent}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Filtered CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToImporter}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Bulk Import More Records
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Enrolled Students</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {students.length}
            </div>
            <div className="text-[11px] text-slate-400">Across {levels.length} class levels</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Active Staff Faculty</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {staff.length}
            </div>
            <div className="text-[11px] text-slate-400">Teachers & Administrators</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Recorded Revenue</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatNaira(totalFeeCollected)}
            </div>
            <div className="text-[11px] text-slate-400">{fees.length} historical payments</div>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 pt-3 bg-slate-50/50 dark:bg-slate-900/50 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('STUDENTS')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'STUDENTS'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students Directory ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAFF')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'STAFF'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Staff Directory ({staff.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FEES')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'FEES'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Fee Payments Ledger ({fees.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {activeTab === 'STUDENTS' && (
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">All Class Levels</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'STUDENTS' && students.length > 0 && (
              <button
                type="button"
                onClick={onClearStudents}
                className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear Students
              </button>
            )}
            {activeTab === 'STAFF' && staff.length > 0 && (
              <button
                type="button"
                onClick={onClearStaff}
                className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear Staff
              </button>
            )}
            {activeTab === 'FEES' && fees.length > 0 && (
              <button
                type="button"
                onClick={onClearFees}
                className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear Fees
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {activeTab === 'STUDENTS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Admission No</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-3">Sex</th>
                  <th className="py-2.5 px-4">Class Level</th>
                  <th className="py-2.5 px-4">Class Arm</th>
                  <th className="py-2.5 px-4">Guardian Contact</th>
                  <th className="py-2.5 px-4">Enrollment Date</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No students found in registry.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.slice(0, 100).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {s.admissionNumber}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{s.gender}</td>
                      <td className="py-2.5 px-4">{s.classLevel}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{s.classArm}</td>
                      <td className="py-2.5 px-4">
                        <div>{s.guardianName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{s.guardianPhone}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{s.enrollmentDate}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'STAFF' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Staff ID</th>
                  <th className="py-2.5 px-4">Staff Name</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4">Assigned Arm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No staff members registered.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((stf) => (
                    <tr key={stf.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {stf.staffNumber}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {stf.firstName} {stf.lastName}
                      </td>
                      <td className="py-2.5 px-4 font-semibold">{stf.role}</td>
                      <td className="py-2.5 px-4">{stf.department}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{stf.email}</td>
                      <td className="py-2.5 px-4 font-mono">{stf.phone}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {stf.assignedLevel ? `${stf.assignedLevel} - ${stf.assignedArm}` : 'Unassigned'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'FEES' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Txn Ref</th>
                  <th className="py-2.5 px-4">Admission No</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Term</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No fee records found.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {f.transactionReference}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{f.admissionNumber}</td>
                      <td className="py-2.5 px-4 font-medium">{f.studentName || '-'}</td>
                      <td className="py-2.5 px-4">{f.feeCategory}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatNaira(Number(f.amount))}
                      </td>
                      <td className="py-2.5 px-4">{f.term}</td>
                      <td className="py-2.5 px-4">{f.paymentMethod}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{f.paymentDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
