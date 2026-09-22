import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  UserCheck,
  Lock,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  DisciplinaryRecord,
  DisciplinarySeverity,
  DisciplinaryAction,
  DisciplinaryStatus,
  UserProfile,
  Student,
} from '../../types';
import {
  getDisciplinaryRecords,
  addDisciplinaryRecord,
  updateDisciplinaryRecord,
  approveParentPastoralSummary,
  revokeParentPastoralExposure,
} from '../../lib/disciplinary-store';

interface DisciplinaryLogPageProps {
  currentUser: UserProfile;
  allStudents: Student[];
  onLogAudit: (action: string, details: string) => void;
}

export const DisciplinaryLogPage: React.FC<DisciplinaryLogPageProps> = ({
  currentUser,
  allStudents,
  onLogAudit,
}) => {
  const [records, setRecords] = useState<DisciplinaryRecord[]>(() => getDisciplinaryRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isParentSummaryModalOpen, setIsParentSummaryModalOpen] = useState(false);

  // New Record Form State
  const [formData, setFormData] = useState({
    studentId: '',
    incidentDate: new Date().toISOString().slice(0, 10),
    category: 'Classroom Disruption & Tardiness',
    severity: 'MEDIUM' as DisciplinarySeverity,
    description: '',
    actionTaken: 'WRITTEN_WARNING' as DisciplinaryAction,
    actionDetails: '',
    followUpNotes: '',
    followUpDate: '',
    status: 'OPEN' as DisciplinaryStatus,
    exposeToParent: false,
    parentApprovedSummary: '',
  });

  // Parent Summary Form State
  const [parentSummaryDraft, setParentSummaryDraft] = useState('');

  const isAdmin = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(currentUser.role);
  const isTeacher = currentUser.role === 'TEACHER';
  const hasAccess = isAdmin || isTeacher;

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (severityFilter !== 'ALL' && rec.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(query);
        const matchReg = (rec.admissionNumber || rec.studentRegNumber || '').toLowerCase().includes(query);
        const matchCat = (rec.category || '').toLowerCase().includes(query);
        if (!matchName && !matchReg && !matchCat) return false;
      }
      return true;
    });
  }, [records, severityFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const criticalCount = records.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH').length;
    const openCount = records.filter((r) => r.status === 'OPEN' || r.status === 'UNDER_OBSERVATION').length;
    const parentShared = records.filter((r) => r.isExposedToParent).length;
    return { total, criticalCount, openCount, parentShared };
  }, [records]);

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="inline-flex p-4 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Confidentiality Gate: Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Disciplinary and pastoral conduct records are strictly confidential and restricted to certified school administrators and designated faculty. They are never accessible to student or public accounts.
        </p>
      </div>
    );
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.description.trim()) {
      alert('Please select a student and provide incident notes.');
      return;
    }

    const student = allStudents.find((s) => s.id === formData.studentId);
    if (!student) return;

    const newRec = addDisciplinaryRecord(
      {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        classLevel: student.classLevel,
        classArm: student.classArm,
        incidentDate: formData.incidentDate,
        category: formData.category,
        description: formData.description.trim(),
        severity: formData.severity,
        actionTaken: formData.actionTaken,
        actionDetails: formData.actionDetails.trim(),
        followUpNotes: formData.followUpNotes.trim() || undefined,
        followUpDate: formData.followUpDate || undefined,
        status: formData.status,
        isExposedToParent: formData.exposeToParent && Boolean(formData.parentApprovedSummary.trim()),
        parentApprovedSummary: formData.exposeToParent ? formData.parentApprovedSummary.trim() : undefined,
        parentApprovedBy: formData.exposeToParent ? currentUser.name : undefined,
        parentApprovedAt: formData.exposeToParent ? new Date().toISOString() : undefined,
      },
      currentUser.name,
      currentUser.role.replace('_', ' ')
    );

    setRecords(getDisciplinaryRecords());
    setIsCreateModalOpen(false);
    onLogAudit(
      'DISCIPLINARY_RECORD_CREATED',
      `Logged conduct record for ${student.firstName} ${student.lastName} (${formData.severity})`
    );

    // Reset Form
    setFormData({
      studentId: '',
      incidentDate: new Date().toISOString().slice(0, 10),
      category: 'Classroom Disruption & Tardiness',
      severity: 'MEDIUM',
      description: '',
      actionTaken: 'WRITTEN_WARNING',
      actionDetails: '',
      followUpNotes: '',
      followUpDate: '',
      status: 'OPEN',
      exposeToParent: false,
      parentApprovedSummary: '',
    });
  };

  const handleOpenParentSummaryModal = (record: DisciplinaryRecord) => {
    setSelectedRecord(record);
    setParentSummaryDraft(record.parentApprovedSummary || '');
    setIsParentSummaryModalOpen(true);
  };

  const handleSaveParentSummary = () => {
    if (!selectedRecord) return;
    if (!parentSummaryDraft.trim()) {
      alert('Please provide an official pastoral summary before enabling parent portal exposure.');
      return;
    }

    const updated = approveParentPastoralSummary(selectedRecord.id, parentSummaryDraft.trim(), currentUser.name);
    if (updated) {
      setRecords(getDisciplinaryRecords());
      setSelectedRecord(updated);
      setIsParentSummaryModalOpen(false);
      onLogAudit(
        'DISCIPLINARY_PARENT_SUMMARY_APPROVED',
        `Approved pastoral summary for parent view: ${updated.studentName}`
      );
    }
  };

  const handleRevokeParentSummary = (recordId: string) => {
    const updated = revokeParentPastoralExposure(recordId, currentUser.name);
    if (updated) {
      setRecords(getDisciplinaryRecords());
      if (selectedRecord?.id === recordId) setSelectedRecord(updated);
      onLogAudit(
        'DISCIPLINARY_PARENT_SUMMARY_REVOKED',
        `Revoked parent view exposure for record: ${recordId}`
      );
    }
  };

  const getSeverityBadge = (severity: DisciplinarySeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status: DisciplinaryStatus) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'UNDER_OBSERVATION':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      case 'OPEN':
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Decoupling Invariant Architecture Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wide">Conduct & Pastoral Log</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Architecturally Decoupled
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Disciplinary records are strictly decoupled from the academic report card engine and GPA rankings. 
              Internal notes are invisible to students, classmates, and public QR credential verification. 
              Parents only receive sanitized pastoral summaries if explicitly authorized by administration.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Record Conduct Incident</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Conduct Incidents</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">2024/2025 Academic Year</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Active / Open Cases</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.openCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending review or observation</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>High / Critical Severity</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Counselor / Dean oversight</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Parent-Approved Summaries</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.parentShared}</div>
          <div className="text-[11px] text-slate-500 mt-1">Visible in Parent Portal</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, reg number, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_OBSERVATION">Under Observation</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Disciplinary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student & Class</th>
                <th className="py-3 px-4">Category & Details</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Parent Exposure</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No conduct records match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {rec.incidentDate}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {rec.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {rec.admissionNumber} • {rec.classLevel} ({rec.classArm})
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {rec.category}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {rec.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSeverityBadge(rec.severity)}`}>
                        {rec.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      {rec.actionTaken.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {rec.isExposedToParent ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800">
                          <Eye className="w-3 h-3" />
                          <span>Approved Summary</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-medium">
                          <EyeOff className="w-3 h-3" />
                          <span>Internal Only</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(rec.status || 'OPEN')}`}>
                        {(rec.status || 'OPEN').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Details Slide-over / Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Pastoral Incident #{selectedRecord.id.slice(-6)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(selectedRecord.severity)}`}>
                      {selectedRecord.severity}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(selectedRecord.status || 'OPEN')}`}>
                      {selectedRecord.status || 'OPEN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedRecord.studentName} ({selectedRecord.admissionNumber}) • {selectedRecord.classLevel} {selectedRecord.classArm}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Incident Date</span>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedRecord.incidentDate}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Recorded By</span>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedRecord.recordedBy} ({selectedRecord.recorderRole})
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Raw Incident Notes (Confidential Faculty & Counselor Only)</span>
                  </h4>
                  <p className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200 leading-relaxed font-mono text-[11px]">
                    {selectedRecord.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Action Taken & Remedial Measures</h4>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {selectedRecord.actionTaken.replace(/_/g, ' ')}
                    </div>
                    <div className="mt-1 text-slate-600 dark:text-slate-300">
                      {selectedRecord.actionDetails}
                    </div>
                  </div>
                </div>

                {selectedRecord.followUpNotes && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Follow-Up Observations</h4>
                    <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      {selectedRecord.followUpNotes}
                      {selectedRecord.followUpDate && (
                        <span className="block text-[11px] text-slate-400 mt-1">Review Target Date: {selectedRecord.followUpDate}</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Parent Exposure Section */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <span>Parent Portal Visibility</span>
                    </h4>
                    {selectedRecord.isExposedToParent ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeParentSummary(selectedRecord.id)}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-medium"
                      >
                        Revoke Parent Access
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenParentSummaryModal(selectedRecord)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                      >
                        Approve Sanitized Summary
                      </button>
                    )}
                  </div>

                  {selectedRecord.isExposedToParent && selectedRecord.parentApprovedSummary ? (
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                        <span>ADMIN-APPROVED SUMMARY (VISIBLE TO PARENTS)</span>
                        <span>Approved by {selectedRecord.parentApprovedBy}</span>
                      </div>
                      <p className="leading-relaxed">{selectedRecord.parentApprovedSummary}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs flex items-center justify-between">
                      <span>Not currently visible in the Parent Portal. Internal notes remain private.</span>
                      <button
                        type="button"
                        onClick={() => handleOpenParentSummaryModal(selectedRecord)}
                        className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                      >
                        Compose Summary
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Changer */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Update Incident Status:</span>
                  <div className="flex items-center gap-1.5">
                    {(['OPEN', 'UNDER_OBSERVATION', 'RESOLVED'] as DisciplinaryStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const updated = updateDisciplinaryRecord(selectedRecord.id, { status: st }, currentUser.name);
                          if (updated) {
                            setSelectedRecord(updated);
                            setRecords(getDisciplinaryRecords());
                            onLogAudit('DISCIPLINARY_STATUS_CHANGED', `Changed status to ${st} for ${selectedRecord.studentName}`);
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          selectedRecord.status === st
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Incident Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Log Student Conduct Incident</h3>
                  <p className="text-xs text-slate-500">Record a private pastoral or disciplinary entry</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Student *
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {allStudents.map((std) => (
                      <option key={std.id} value={std.id}>
                        {std.firstName} {std.lastName} ({std.admissionNumber}) • {std.classLevel} {std.classArm}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Incident Date *
                    </label>
                    <input
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Severity Level *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as DisciplinarySeverity })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low (First warning, minor infraction)</option>
                      <option value="MEDIUM">Medium (Disruption, repeat tardiness)</option>
                      <option value="HIGH">High (Dishonesty, fighting, harassment)</option>
                      <option value="CRITICAL">Critical (Safety breach, severe misconduct)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Classroom Disruption & Tardiness">Classroom Disruption & Tardiness</option>
                    <option value="Academic Dishonesty">Academic Dishonesty (Cheating / Plagiarism)</option>
                    <option value="Bullying & Peer Altercation">Bullying & Peer Altercation</option>
                    <option value="Uniform & Dress Code Infraction">Uniform & Dress Code Infraction</option>
                    <option value="Campus Property Damage & Vandalism">Campus Property Damage & Vandalism</option>
                    <option value="Substance & Contraband Possession">Substance & Contraband Possession</option>
                    <option value="Other Conduct Concern">Other Conduct Concern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Raw Incident Description * (Visible only to Admin & Counselor)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide factual details: where, when, witnesses, what transpired..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Action Taken *
                    </label>
                    <select
                      value={formData.actionTaken}
                      onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value as DisciplinaryAction })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="VERBAL_WARNING">Verbal Warning</option>
                      <option value="WRITTEN_WARNING">Written Warning</option>
                      <option value="DETENTION">Supervised Detention</option>
                      <option value="COMMUNITY_SERVICE">Community Service</option>
                      <option value="PARENTAL_CONFERENCE">Parental Conference</option>
                      <option value="COUNSELING_REFERRAL">Counseling Referral</option>
                      <option value="IN_SCHOOL_SUSPENSION">In-School Suspension</option>
                      <option value="OUT_OF_SCHOOL_SUSPENSION">Out-of-School Suspension</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Action Details
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 hour detention on Friday"
                      value={formData.actionDetails}
                      onChange={(e) => setFormData({ ...formData, actionDetails: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="exposeToParent"
                      checked={formData.exposeToParent}
                      onChange={(e) => setFormData({ ...formData, exposeToParent: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="exposeToParent" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      Expose approved pastoral summary to parents in Parent Portal
                    </label>
                  </div>

                  {formData.exposeToParent && (
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Sanitized Summary (Will be seen by the student's guardian — avoid inflammatory words)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Student met with class teacher regarding punctuality. Agreed to arrive 10 minutes early."
                        value={formData.parentApprovedSummary}
                        onChange={(e) => setFormData({ ...formData, parentApprovedSummary: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Save Conduct Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Parent Summary Approver Modal */}
      <AnimatePresence>
        {isParentSummaryModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Approve Parent Portal Summary
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedRecord.studentName} ({selectedRecord.classLevel} {selectedRecord.classArm})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParentSummaryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Internal Incident Context:
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">{selectedRecord.description}</div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Admin-Sanitized Pastoral Summary for Parent
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Write an objective, constructive statement summarizing the incident and resolution. Raw disciplinary notes and counselor remarks will NOT be exposed.
                  </p>
                  <textarea
                    rows={4}
                    value={parentSummaryDraft}
                    onChange={(e) => setParentSummaryDraft(e.target.value)}
                    placeholder="e.g. Student took part in a restorative discussion regarding campus conduct. Demonstrating positive improvement."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsParentSummaryModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveParentSummary}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Authorize & Publish to Parent Portal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
