import React, { useState, useMemo } from 'react';
import {
  Student,
  ClassLevel,
  UserProfile,
  AttendanceStatus,
} from '../../types';
import {
  Search,
  Filter,
  Users,
  Grid,
  List,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  GraduationCap,
  Calendar,
  FileSpreadsheet,
  Download,
  Plus,
  HeartPulse,
  Flame,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { StudentQuickViewDrawer } from './StudentQuickViewDrawer';
import { StudentCredentialModal } from './StudentCredentialModal';
import { DailyAttendanceCheckIn } from '../attendance/DailyAttendanceCheckIn';
import { AttendanceHeatmapCalendar } from '../attendance/AttendanceHeatmapCalendar';
import { updateStudentProfile } from '../../lib/students/students-store';

interface StudentDirectoryPageProps {
  students: Student[];
  levels: ClassLevel[];
  currentUser: UserProfile;
  onLogAudit: (action: string, details: string) => void;
  onRefreshStudents: () => void;
}

type ModuleTab = 'directory' | 'daily_checkin' | 'heatmap';

export const StudentDirectoryPage: React.FC<StudentDirectoryPageProps> = ({
  students,
  levels,
  currentUser,
  onLogAudit,
  onRefreshStudents,
}) => {
  const [activeTab, setActiveTab] = useState<ModuleTab>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [selectedArmFilter, setSelectedArmFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [hasMedicalAlertOnly, setHasMedicalAlertOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Drawer state
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStudentForCredential, setSelectedStudentForCredential] = useState<Student | null>(null);

  // Heatmap tab class selectors
  const [heatmapLevel, setHeatmapLevel] = useState<string>(levels[0]?.name || 'JSS 1');
  const [heatmapArm, setHeatmapArm] = useState<string>(levels[0]?.arms[0]?.name || 'Diamond');

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase();
        const matchName = fullName.includes(q);
        const matchAdm = s.admissionNumber.toLowerCase().includes(q);
        const matchGuardian = s.guardianName.toLowerCase().includes(q);
        const matchPhone = s.guardianPhone.toLowerCase().includes(q);
        const matchClass = `${s.classLevel} ${s.classArm}`.toLowerCase().includes(q);
        if (!matchName && !matchAdm && !matchGuardian && !matchPhone && !matchClass) {
          return false;
        }
      }

      // Class level
      if (selectedLevelFilter !== 'ALL' && s.classLevel !== selectedLevelFilter) {
        return false;
      }

      // Class arm
      if (selectedArmFilter !== 'ALL' && s.classArm !== selectedArmFilter) {
        return false;
      }

      // Gender
      if (selectedGenderFilter !== 'ALL' && s.gender !== selectedGenderFilter) {
        return false;
      }

      // Status
      if (selectedStatusFilter !== 'ALL' && s.status !== selectedStatusFilter) {
        return false;
      }

      // Medical alert filter
      if (hasMedicalAlertOnly) {
        const hasAllergies = s.allergies && s.allergies.length > 0 && !s.allergies.includes('None known');
        const hasMedicalNotes = s.medicalNotes && s.medicalNotes.length > 0;
        if (!hasAllergies && !hasMedicalNotes) return false;
      }

      return true;
    });
  }, [
    students,
    searchQuery,
    selectedLevelFilter,
    selectedArmFilter,
    selectedGenderFilter,
    selectedStatusFilter,
    hasMedicalAlertOnly,
  ]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === 'ACTIVE').length;
    const male = students.filter((s) => s.gender === 'M').length;
    const female = students.filter((s) => s.gender === 'F').length;
    const medicalAlerts = students.filter(
      (s) =>
        (s.allergies && s.allergies.length > 0 && !s.allergies.includes('None known')) ||
        (s.medicalNotes && s.medicalNotes.length > 0)
    ).length;

    return { total, active, male, female, medicalAlerts };
  }, [students]);

  const handleOpenDrawer = (student: Student) => {
    setSelectedStudentForDrawer(student);
    setIsDrawerOpen(true);
  };

  const handleUpdateStudentFromDrawer = (updated: Student) => {
    updateStudentProfile(updated.id, updated, currentUser);
    setSelectedStudentForDrawer(updated);
    onRefreshStudents();
  };

  const handleExportCSV = () => {
    const headers = [
      'Admission Number',
      'First Name',
      'Last Name',
      'Gender',
      'Class Level',
      'Class Arm',
      'Status',
      'Guardian Name',
      'Guardian Phone',
      'Blood Group',
      'Genotype',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.admissionNumber}"`,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      `"${s.gender}"`,
      `"${s.classLevel}"`,
      `"${s.classArm}"`,
      `"${s.status}"`,
      `"${s.guardianName}"`,
      `"${s.guardianPhone}"`,
      `"${s.bloodGroup || 'O+'}"`,
      `"${s.genotype || 'AA'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_directory_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    onLogAudit('DIRECTORY_EXPORT', `Exported CSV archive of ${filteredStudents.length} student records.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Student Records & Attendance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive student dossier profiles, verified documents, promotion archives, and visual attendance heatmaps.
          </p>
        </div>

        {/* Module Sub-tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Student Directory ({students.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily_checkin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'daily_checkin'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Daily Check-In
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heatmap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Attendance Heatmap
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENT DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* High-level KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Enrolled
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {stats.total}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {stats.active} Active Records
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gender Breakdown
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {stats.male} M <span className="text-slate-300 font-normal">/</span> {stats.female} F
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Balanced cohort ratio
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Clinical / Medical Flags
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats.medicalAlerts}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Allergies & emergency alerts
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Export Roster
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                className="w-full mt-2"
              >
                Export CSV ({filteredStudents.length})
              </Button>
            </div>
          </div>

          {/* Search & Multi-criteria Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, admission #, guardian phone, or arm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                  title="Grid Card View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {/* Class Level */}
              <div>
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">All Class Levels</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.name}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Arm */}
              <div>
                <select
                  value={selectedArmFilter}
                  onChange={(e) => setSelectedArmFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">All Arms / Streams</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Sapphire">Sapphire</option>
                  <option value="Gold">Gold</option>
                  <option value="Ruby">Ruby</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <select
                  value={selectedGenderFilter}
                  onChange={(e) => setSelectedGenderFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">All Genders</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active (Enrolled)</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="GRADUATED">Graduated</option>
                </select>
              </div>

              {/* Medical Alert toggle */}
              <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasMedicalAlertOnly}
                    onChange={(e) => setHasMedicalAlertOnly(e.target.checked)}
                    className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    Medical Alerts Only
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Directory Content: Table or Grid */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No students match the criteria
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try adjusting your search query, class level, or filter criteria.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* High-density Table View */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Admission #</th>
                      <th className="py-3 px-3">Class & Arm</th>
                      <th className="py-3 px-3">Gender</th>
                      <th className="py-3 px-3">Guardian Info</th>
                      <th className="py-3 px-3">Medical / Clinical</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map((s) => {
                      const hasMedical =
                        (s.allergies && s.allergies.length > 0 && !s.allergies.includes('None known')) ||
                        (s.medicalNotes && s.medicalNotes.length > 0);

                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleOpenDrawer(s)}
                          className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          {/* Student Name & Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {s.firstName[0]}
                                {s.lastName[0]}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {s.firstName} {s.middleName ? `${s.middleName} ` : ''}{s.lastName}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Enrolled: {s.enrollmentDate}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Admission Number */}
                          <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {s.admissionNumber}
                          </td>

                          {/* Class & Arm */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {s.classLevel}
                            </span>
                            <span className="text-slate-400 ml-1">({s.classArm})</span>
                          </td>

                          {/* Gender */}
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {s.gender === 'M' ? 'Male' : 'Female'}
                          </td>

                          {/* Guardian */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {s.guardianName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {s.guardianPhone}
                            </div>
                          </td>

                          {/* Medical / Clinical */}
                          <td className="py-3 px-3">
                            {hasMedical ? (
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{s.bloodGroup || 'O+'} • {s.genotype || 'AA'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                {s.bloodGroup || 'O+'} • {s.genotype || 'AA'}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                s.status === 'ACTIVE'
                                  ? 'success'
                                  : s.status === 'SUSPENDED'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {s.status}
                            </Badge>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudentForCredential(s);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors"
                                title="View ID Card & QR Credential"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                                Profile <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid Card View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredStudents.map((s) => {
                const hasMedical =
                  (s.allergies && s.allergies.length > 0 && !s.allergies.includes('None known')) ||
                  (s.medicalNotes && s.medicalNotes.length > 0);

                return (
                  <div
                    key={s.id}
                    onClick={() => handleOpenDrawer(s)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-xs">
                            {s.firstName[0]}
                            {s.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {s.firstName} {s.lastName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {s.admissionNumber}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={
                            s.status === 'ACTIVE'
                              ? 'success'
                              : s.status === 'SUSPENDED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {s.status}
                        </Badge>
                      </div>

                      {/* Class and details */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Class</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.classLevel} - {s.classArm}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Guardian</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {s.guardianName}
                          </div>
                        </div>
                      </div>

                      {hasMedical && (
                        <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Clinical / Allergy Alert</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentForCredential(s);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 font-medium text-[11px]"
                        title="View ID Card & QR Credential"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>ID Card</span>
                      </button>
                      <span className="flex items-center gap-1">
                        Profile <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAILY ATTENDANCE CHECK-IN */}
      {activeTab === 'daily_checkin' && (
        <DailyAttendanceCheckIn
          levels={levels}
          students={students}
          currentUser={currentUser}
          onLogAudit={onLogAudit}
          onAttendanceSaved={onRefreshStudents}
        />
      )}

      {/* TAB 3: VISUAL HEATMAP CALENDAR */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          {/* Class selector for heatmap */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Class Level
                </label>
                <select
                  value={heatmapLevel}
                  onChange={(e) => {
                    setHeatmapLevel(e.target.value);
                    const lvl = levels.find((l) => l.name === e.target.value);
                    if (lvl && lvl.arms.length > 0) {
                      setHeatmapArm(lvl.arms[0].name);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.name}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Class Arm
                </label>
                <select
                  value={heatmapArm}
                  onChange={(e) => setHeatmapArm(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="Diamond">Diamond</option>
                  <option value="Sapphire">Sapphire</option>
                  <option value="Gold">Gold</option>
                  <option value="Ruby">Ruby</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Displaying 12-week attendance matrix with daily percentage densities
            </div>
          </div>

          {/* Heatmap component */}
          <AttendanceHeatmapCalendar
            mode="CLASS"
            classLevel={heatmapLevel}
            classArm={heatmapArm}
            weeks={12}
          />
        </div>
      )}

      {/* Slide-in Animated Quick-View Drawer */}
      <StudentQuickViewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        student={selectedStudentForDrawer}
        levels={levels}
        currentUser={currentUser}
        onStudentUpdated={handleUpdateStudentFromDrawer}
        onLogAudit={onLogAudit}
      />

      {/* Student Credential & Public QR Verification Modal */}
      {selectedStudentForCredential && (
        <StudentCredentialModal
          isOpen={!!selectedStudentForCredential}
          onClose={() => setSelectedStudentForCredential(null)}
          student={selectedStudentForCredential}
        />
      )}
    </div>
  );
};
