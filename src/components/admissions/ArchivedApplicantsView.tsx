import React, { useState } from 'react';
import { Applicant } from '../../types';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import {
  Archive,
  Search,
  AlertOctagon,
  UserX,
  FileSpreadsheet,
  RotateCcw,
  Eye,
  ShieldAlert,
  Calendar
} from 'lucide-react';

interface ArchivedApplicantsViewProps {
  applicants: Applicant[];
  onSelectApplicant: (applicant: Applicant) => void;
  onRequestReopen: (applicant: Applicant) => void;
}

export const ArchivedApplicantsView: React.FC<ArchivedApplicantsViewProps> = ({
  applicants,
  onSelectApplicant,
  onRequestReopen,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'REJECTED' | 'WITHDRAWN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter archived applicants only
  const archived = applicants.filter(
    (a) => a.stage === 'REJECTED' || a.stage === 'WITHDRAWN'
  );

  const filtered = archived.filter((app) => {
    if (filterType === 'REJECTED' && app.stage !== 'REJECTED') return false;
    if (filterType === 'WITHDRAWN' && app.stage !== 'WITHDRAWN') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const fullName = `${app.firstName} ${app.middleName || ''} ${app.lastName}`.toLowerCase();
      const matchName = fullName.includes(q);
      const matchAppNo = app.applicationNumber.toLowerCase().includes(q);
      const matchSchool = app.priorSchool.toLowerCase().includes(q);
      const matchGuardian = app.guardianName.toLowerCase().includes(q);
      return matchName || matchAppNo || matchSchool || matchGuardian;
    }

    return true;
  });

  const rejectedCount = archived.filter((a) => a.stage === 'REJECTED').length;
  const withdrawnCount = archived.filter((a) => a.stage === 'WITHDRAWN').length;

  const handleExportCSV = () => {
    const headers = [
      'Application Number',
      'Candidate Name',
      'Gender',
      'Desired Level',
      'Status',
      'Archive Reason',
      'Prior School',
      'Guardian Name',
      'Guardian Phone',
      'Applied Date',
    ];

    const rows = filtered.map((a) => [
      `"${a.applicationNumber}"`,
      `"${a.firstName} ${a.lastName}"`,
      `"${a.gender}"`,
      `"${a.desiredLevel}"`,
      `"${a.stage}"`,
      `"${(a.stage === 'REJECTED' ? a.rejectionReason : a.withdrawalReason) || ''}"`,
      `"${a.priorSchool}"`,
      `"${a.guardianName}"`,
      `"${a.guardianPhone}"`,
      `"${a.appliedDate}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `archived_applicants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Permanent Archival Policy Header */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-neutral-800 dark:text-neutral-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              Institutional Archive & Audit Guarantee
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              In accordance with school governance policies, all rejected and withdrawn applications are preserved indefinitely in this audit register. Records are never deleted.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            Export Archive CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            All Archived ({archived.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
              filterType === 'REJECTED'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            Rejected ({rejectedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('WITHDRAWN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
              filterType === 'WITHDRAWN'
                ? 'bg-amber-600 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <UserX className="w-3 h-3" />
            Withdrawn ({withdrawnCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, App ID, guardian..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Archived Table / Records */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <Archive className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h5 className="font-semibold text-sm text-neutral-900 dark:text-white">No Archived Records Found</h5>
          <p className="text-xs text-neutral-500 mt-1">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No rejected or withdrawn applications in this category.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Applicant ID & Name</th>
                  <th className="px-4 py-3">Desired Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Archival Justification / Notes</th>
                  <th className="px-4 py-3">Prior School</th>
                  <th className="px-4 py-3">Guardian</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filtered.map((applicant) => {
                  const isRejected = applicant.stage === 'REJECTED';
                  const reason = isRejected ? applicant.rejectionReason : applicant.withdrawalReason;

                  return (
                    <tr
                      key={applicant.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-neutral-400">
                          {applicant.applicationNumber}
                        </div>
                        <div className="font-bold text-neutral-900 dark:text-white text-xs">
                          {applicant.firstName} {applicant.lastName}
                        </div>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          Applied: {applicant.appliedDate}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-neutral-800 dark:text-neutral-200">
                        {applicant.desiredLevel}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant={isRejected ? 'danger' : 'warning'} size="sm">
                          {applicant.stage}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-neutral-700 dark:text-neutral-300 text-xs line-clamp-2 leading-relaxed">
                          {reason || 'No specific reason documented.'}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[140px]">
                        {applicant.priorSchool}
                      </td>

                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {applicant.guardianName}
                        </div>
                        <div className="font-mono text-[10px] text-neutral-400">
                          {applicant.guardianPhone}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectApplicant(applicant)}
                            className="text-xs py-1"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Dossier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRequestReopen(applicant)}
                            className="text-xs py-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Appeal
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
