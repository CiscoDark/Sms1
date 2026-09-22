import React, { useState } from 'react';
import {
  X,
  Award,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Plus,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ClassCaptainRecord, Student, UserProfile } from '../../types';
import {
  getAllClassCaptains,
  appointClassCaptain,
  revokeClassCaptain,
} from '../../lib/class-captain-store';

interface ClassCaptainsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentUser: UserProfile;
  onUpdated?: () => void;
}

export const ClassCaptainsManagementModal: React.FC<ClassCaptainsManagementModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  onUpdated,
}) => {
  const [captains, setCaptains] = useState<ClassCaptainRecord[]>(() => getAllClassCaptains());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [captainRole, setCaptainRole] = useState<
    'HEAD_CAPTAIN' | 'ASSISTANT_CAPTAIN' | 'TIME_KEEPER' | 'LAB_PREFECT'
  >('HEAD_CAPTAIN');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAppoint = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === selectedStudentId);
    if (!st) return;

    appointClassCaptain(
      {
        id: st.id,
        name: `${st.firstName} ${st.lastName}`,
        admissionNumber: st.admissionNumber,
        classLevel: st.classLevel,
        classArm: st.classArm,
      },
      captainRole,
      `${currentUser.name} (${currentUser.title || currentUser.role})`
    );

    setCaptains(getAllClassCaptains());
    setShowAddForm(false);
    setSelectedStudentId('');
    setFeedback(`Successfully appointed ${st.firstName} ${st.lastName} as ${captainRole.replace('_', ' ')}!`);
    setTimeout(() => setFeedback(null), 4000);
    onUpdated?.();
  };

  const handleRevoke = (captainId: string, studentName: string) => {
    if (confirm(`Revoke class captain credentials for ${studentName}?`)) {
      revokeClassCaptain(captainId, currentUser.name);
      setCaptains(getAllClassCaptains());
      setFeedback(`Revoked captain appointment for ${studentName}.`);
      setTimeout(() => setFeedback(null), 4000);
      onUpdated?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Class Captains & Peer Leadership Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized Form Teacher Appointments & Scoped Permission Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Scope Isolation Rules */}
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Class Captain Permission Tier Boundaries:</span>
          </div>
          <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-amber-800 dark:text-amber-400">
            <li>
              <strong>Class-Scoped Announcements:</strong> Captains can post announcements ONLY to their own arm (enforced at data level).
            </li>
            <li>
              <strong>Zero-Access to Sensitive Data:</strong> Captains have strictly NO access to classmate grades, fees, or discipline records.
            </li>
            <li>
              <strong>Dedicated Teacher Channel:</strong> Direct communication conduit with the class form master.
            </li>
          </ul>
        </div>

        {feedback && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Appointed Captains ({captains.filter((c) => c.status === 'ACTIVE').length})
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : 'Appoint New Captain'}</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAppoint} className="mx-6 mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  required
                >
                  <option value="">-- Choose student to appoint --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber}) - {s.classLevel} {s.classArm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Captaincy Role
                </label>
                <select
                  value={captainRole}
                  onChange={(e) => setCaptainRole(e.target.value as any)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="HEAD_CAPTAIN">Head Class Captain</option>
                  <option value="ASSISTANT_CAPTAIN">Assistant Class Captain</option>
                  <option value="TIME_KEEPER">Class Time-Keeper & Assembly Monitor</option>
                  <option value="LAB_PREFECT">Laboratory & Equipment Prefect</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 shadow-xs"
              >
                Confirm Appointment
              </button>
            </div>
          </form>
        )}

        {/* List of Captains */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {captains.map((cap) => (
            <div
              key={cap.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                cap.status === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {cap.studentName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                      {cap.captainRole.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
                        cap.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cap.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Class: <strong>{cap.classLevel} {cap.classArm}</strong> • Adm: {cap.admissionNumber} • Appointed by: {cap.appointedBy}
                  </p>
                </div>
              </div>

              {cap.status === 'ACTIVE' && (
                <button
                  onClick={() => handleRevoke(cap.id, cap.studentName)}
                  className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition"
                  title="Revoke Appointment"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
