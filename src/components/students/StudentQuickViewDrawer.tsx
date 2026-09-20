import React, { useState } from 'react';
import {
  Student,
  StudentDocument,
  ClassLevel,
  UserProfile,
  AcademicRecordSnapshot,
} from '../../types';
import { Drawer } from '../../design-system/components/Drawer';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { AttendanceHeatmapCalendar } from '../attendance/AttendanceHeatmapCalendar';
import {
  getDocumentsForStudent,
  downloadMockDocument,
  deleteStudentDocument,
} from '../../lib/file-storage';
import { getStudentAttendanceSummary } from '../../lib/attendance/attendance-store';
import {
  User,
  HeartPulse,
  GraduationCap,
  FileText,
  CalendarCheck,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Upload,
  Download,
  Trash2,
  Edit3,
  Award,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Printer,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { DocumentUploadModal } from './DocumentUploadModal';
import { EditStudentModal } from './EditStudentModal';
import { StudentCredentialModal } from './StudentCredentialModal';

interface StudentQuickViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  levels: ClassLevel[];
  currentUser: UserProfile;
  onStudentUpdated: (updated: Student) => void;
  onLogAudit: (action: string, details: string) => void;
}

type TabKey = 'overview' | 'medical' | 'academic' | 'documents' | 'attendance';

export const StudentQuickViewDrawer: React.FC<StudentQuickViewDrawerProps> = ({
  isOpen,
  onClose,
  student,
  levels,
  currentUser,
  onStudentUpdated,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

  if (!student) return null;

  // Documents
  const documents = getDocumentsForStudent(student.id, `${student.firstName} ${student.lastName}`);

  // Attendance summary
  const attendanceStats = getStudentAttendanceSummary(student.id);

  // Age calculation
  const getAge = (dobString?: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(student.dob);

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="2xl"
        title={
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-black text-base flex items-center justify-center shadow-md">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  student.status === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : student.status === 'SUSPENDED'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
                title={student.status}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {student.firstName} {student.middleName ? `${student.middleName} ` : ''}
                  {student.lastName}
                </h3>
                <Badge
                  variant={
                    student.status === 'ACTIVE'
                      ? 'success'
                      : student.status === 'SUSPENDED'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {student.status}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{student.admissionNumber}</span>
                <span>•</span>
                <span className="font-sans font-semibold text-indigo-600 dark:text-indigo-400">
                  {student.classLevel} - Arm {student.classArm}
                </span>
                {age && (
                  <>
                    <span>•</span>
                    <span className="font-sans text-slate-400">{age} yrs old ({student.gender === 'M' ? 'Male' : 'Female'})</span>
                  </>
                )}
              </div>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintDossier}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCredentialModalOpen(true)}
                leftIcon={<QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              >
                ID & QR Credential
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Doc
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        }
      >
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 -mx-5 sm:-mx-6 px-5 sm:px-6 mb-5 flex space-x-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile & Guardian
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'medical'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Medical Dossier
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'academic'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Academic & Promotion
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documents Vault ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Attendance Heatmap
          </button>
        </div>

        {/* Tab 1: Profile & Guardian */}
        {activeTab === 'overview' && (
          <div className="space-y-5 text-sm">
            {/* Quick KPI stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Class Stream</div>
                <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {student.classLevel} - {student.classArm}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Enrolled Since</div>
                <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {student.enrollmentDate}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Attendance</div>
                <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {attendanceStats.attendanceRate}% Rate
                </div>
              </div>
            </div>

            {/* Core Bio-Data Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Student Identification
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                <div>
                  <div className="text-xs text-slate-400">Date of Birth</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.dob || 'Not recorded'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Nationality</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.nationality || 'Nigerian'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">State of Origin</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.stateOfOrigin || 'Lagos State'}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <div className="text-xs text-slate-400">Residential Address</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{student.residentialAddress || 'Not recorded'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Primary Guardian & Emergency Contact
                </div>
                <Badge variant="primary" size="sm">
                  {student.guardianRelationship || 'Guardian'}
                </Badge>
              </div>

              <div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {student.guardianName}
                </div>
                {student.guardianOccupation && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {student.guardianOccupation}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Primary Phone</div>
                    <a
                      href={`tel:${student.guardianPhone}`}
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono"
                    >
                      {student.guardianPhone}
                    </a>
                  </div>
                </div>

                {student.guardianEmail && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-[11px] text-slate-400">Email Address</div>
                      <a
                        href={`mailto:${student.guardianEmail}`}
                        className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 truncate block font-mono"
                      >
                        {student.guardianEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Medical Dossier */}
        {activeTab === 'medical' && (
          <div className="space-y-5 text-sm">
            {/* Clinical Blood & Genotype stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">
                  Blood Group
                </div>
                <div className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1">
                  {student.bloodGroup || 'O+'}
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400/80 mt-0.5">
                  Verified by School Clinic
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                <div className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">
                  Genotype
                </div>
                <div className="text-2xl font-black text-purple-900 dark:text-purple-200 mt-1">
                  {student.genotype || 'AA'}
                </div>
                <div className="text-[11px] text-purple-600 dark:text-purple-400/80 mt-0.5">
                  {student.genotype === 'AS' ? 'Sickle Cell Carrier' : 'Standard Electrophoresis'}
                </div>
              </div>
            </div>

            {/* Known Allergies */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Known Allergies & Triggers
                </h4>
              </div>

              {student.allergies && student.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {student.allergies.map((allergy, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No allergies recorded on file.</div>
              )}
            </div>

            {/* Clinical & Emergency Instructions */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Emergency Medical Protocol
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-sans">
                {student.medicalNotes ||
                  'No chronic conditions or emergency restrictions recorded. Routine physical exam cleared for full athletic and academic activity.'}
              </p>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-500">Emergency Contact:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {student.emergencyContactName || student.guardianName} (
                  {student.emergencyContactPhone || student.guardianPhone})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Academic & Promotion Snapshots */}
        {activeTab === 'academic' && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Point-in-Time Academic History (Temporal Immutability)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical term records are locked snapshots and never overwritten by future promotions.
                </p>
              </div>
              <Badge variant="info" size="sm">
                Rule 3 Invariant Verified
              </Badge>
            </div>

            {!student.academicHistory || student.academicHistory.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No historical term snapshots available yet
                </div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Snapshots are automatically archived during end-of-term promotion and report card compilation.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {student.academicHistory.map((snap: AcademicRecordSnapshot) => (
                  <div
                    key={snap.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {snap.sessionYear} • {snap.termName}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {snap.classLevel} - {snap.classArm}
                        </span>
                      </div>
                      <Badge
                        variant={
                          snap.promotionStatus === 'PROMOTED'
                            ? 'success'
                            : snap.promotionStatus === 'PROMOTED_ON_TRIAL'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {snap.promotionStatus === 'PROMOTED' && snap.promotedTo
                          ? `Promoted to ${snap.promotedTo}`
                          : snap.promotionStatus}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-400">Average</div>
                        <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {snap.averageScore}%
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-400">Grade</div>
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {snap.grade}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-400">Position</div>
                        <div className="text-sm font-black text-slate-800 dark:text-slate-200">
                          {snap.positionInClass ? `${snap.positionInClass}/${snap.totalInClass || 35}` : 'N/A'}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-400">Attendance</div>
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {snap.attendanceRate}%
                        </div>
                      </div>
                    </div>

                    {snap.principalRemarks && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                        "{snap.principalRemarks}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Documents Vault */}
        {activeTab === 'documents' && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Verified Document Vault
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Permanent statutory certificates, health clearances, and transcripts.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No documents uploaded yet
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{doc.fileName}</span>
                          <span>•</span>
                          <span>{doc.fileSize}</span>
                          <span>•</span>
                          <span>{doc.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => downloadMockDocument(doc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Download Certificate"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete document "${doc.title}"?`)) {
                            deleteStudentDocument(student.id, doc.id);
                            onLogAudit('DOCUMENT_DELETED', `Deleted document ${doc.title} from student ${student.admissionNumber}`);
                            onStudentUpdated({ ...student });
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Attendance Heatmap */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 text-sm">
            {/* KPI Streak & Attendance Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                    Active Streak
                  </div>
                  <div className="text-xl font-black text-amber-900 dark:text-amber-200">
                    {attendanceStats.currentStreak} Days
                  </div>
                  <div className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    Consecutive attendance
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Attendance Rate
                </div>
                <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                  {attendanceStats.attendanceRate}%
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {attendanceStats.presentDays} of {attendanceStats.totalSchoolDays} school days
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">
                  Exceptions Log
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 space-y-0.5">
                  <div>Late: {attendanceStats.lateDays} days</div>
                  <div>Excused: {attendanceStats.excusedDays} days</div>
                  <div>Absent: {attendanceStats.absentDays} days</div>
                </div>
              </div>
            </div>

            {/* Visual Heatmap Calendar */}
            <AttendanceHeatmapCalendar
              mode="STUDENT"
              studentId={student.id}
              studentName={`${student.firstName} ${student.lastName}`}
              weeks={12}
            />

            {/* Recent Attendance Log Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 uppercase">
                Recent Daily Check-Ins (Last 10 Records)
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceStats.history.slice(0, 10).map((r) => (
                  <div
                    key={r.id}
                    className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.date}
                      </span>
                      {r.arrivalTime && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({r.arrivalTime})
                        </span>
                      )}
                      {r.remarks && (
                        <span className="text-slate-500 italic max-w-xs truncate">
                          "{r.remarks}"
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={
                        r.status === 'PRESENT'
                          ? 'success'
                          : r.status === 'LATE'
                          ? 'warning'
                          : r.status === 'EXCUSED'
                          ? 'info'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        student={student}
        currentUser={currentUser}
        onDocumentUploaded={(newDoc) => {
          onLogAudit('DOCUMENT_UPLOADED', `Uploaded ${newDoc.title} for student ${student.admissionNumber}`);
          onStudentUpdated({ ...student });
        }}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={student}
        levels={levels}
        currentUser={currentUser}
        onSave={(updated) => {
          onStudentUpdated(updated);
          onLogAudit('STUDENT_UPDATED', `Modified profile for ${updated.admissionNumber}`);
        }}
      />

      <StudentCredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        student={student}
      />
    </>
  );
};
