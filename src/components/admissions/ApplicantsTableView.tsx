import React, { useState } from 'react';
import { Applicant, AdmissionStage } from '../../types';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import {
  Search,
  Eye,
  ArrowRight,
  UserCheck,
  AlertOctagon,
  Calendar,
  Award
} from 'lucide-react';

interface ApplicantsTableViewProps {
  applicants: Applicant[];
  onSelectApplicant: (applicant: Applicant) => void;
  onAdvanceStageQuick: (applicant: Applicant) => void;
  onRequestEnrollment: (applicant: Applicant) => void;
  onRequestReject: (applicant: Applicant) => void;
}

export const ApplicantsTableView: React.FC<ApplicantsTableViewProps> = ({
  applicants,
  onSelectApplicant,
  onAdvanceStageQuick,
  onRequestEnrollment,
  onRequestReject,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Exclude archived by default in active pipeline table
  const activeApplicants = applicants.filter(
    (a) => a.stage !== 'REJECTED' && a.stage !== 'WITHDRAWN'
  );

  const filtered = activeApplicants.filter((app) => {
    if (selectedStage !== 'ALL' && app.stage !== selectedStage) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const fullName = `${app.firstName} ${app.middleName || ''} ${app.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        app.applicationNumber.toLowerCase().includes(q) ||
        app.desiredLevel.toLowerCase().includes(q) ||
        app.priorSchool.toLowerCase().includes(q) ||
        app.guardianName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStageBadge = (stage: AdmissionStage) => {
    switch (stage) {
      case 'APPLIED':
        return <Badge variant="neutral" size="sm">Applied</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" size="sm">Under Review</Badge>;
      case 'ASSESSED':
        return <Badge variant="primary" size="sm">Assessed</Badge>;
      case 'ADMITTED':
        return <Badge variant="success" size="sm">Admitted</Badge>;
      case 'ENROLLED':
        return <Badge variant="success" size="sm">Enrolled</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{stage}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'APPLIED', 'UNDER_REVIEW', 'ASSESSED', 'ADMITTED', 'ENROLLED'].map((stageKey) => (
            <button
              key={stageKey}
              type="button"
              onClick={() => setSelectedStage(stageKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedStage === stageKey
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {stageKey === 'ALL'
                ? `All Pipeline (${activeApplicants.length})`
                : `${stageKey.replace('_', ' ')} (${activeApplicants.filter((a) => a.stage === stageKey).length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, level, school..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Applicant ID & Name</th>
                <th className="px-4 py-3">Level / Arm</th>
                <th className="px-4 py-3">Current Stage</th>
                <th className="px-4 py-3">Assessment Score</th>
                <th className="px-4 py-3">Prior School</th>
                <th className="px-4 py-3">Guardian Contact</th>
                <th className="px-4 py-3 text-right">Stage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filtered.map((applicant) => (
                <tr
                  key={applicant.id}
                  className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-[11px] text-neutral-400">
                      {applicant.applicationNumber}
                    </div>
                    <div className="font-bold text-neutral-900 dark:text-white text-xs">
                      {applicant.firstName} {applicant.middleName ? applicant.middleName + ' ' : ''}{applicant.lastName}
                    </div>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      Applied: {applicant.appliedDate}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      {applicant.desiredLevel}
                    </div>
                    {applicant.assignedArm ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Arm: {applicant.assignedArm}
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400">
                        {applicant.desiredArmPreference ? `Pref: ${applicant.desiredArmPreference}` : 'Unassigned'}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {getStageBadge(applicant.stage)}
                  </td>

                  <td className="px-4 py-3">
                    {applicant.totalAssessmentScore !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {applicant.totalAssessmentScore.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">Not evaluated</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[150px]">
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

                      {applicant.stage !== 'ENROLLED' && (
                        <button
                          type="button"
                          onClick={() => onRequestReject(applicant)}
                          title="Reject"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {applicant.stage === 'ADMITTED' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onRequestEnrollment(applicant)}
                          className="text-xs py-1"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Enroll
                        </Button>
                      ) : applicant.stage !== 'ENROLLED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAdvanceStageQuick(applicant)}
                          className="text-xs py-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                          Advance
                        </Button>
                      ) : (
                        <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          {applicant.assignedAdmissionNumber}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
