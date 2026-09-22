import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Unlink,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { ParentChildLink, Student, UserProfile } from '../../types';
import {
  getAllParentChildLinks,
  linkChildToParent,
  unlinkChildFromParent,
} from '../../lib/parent-store';

interface ParentChildLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentUser: UserProfile;
  onLinksUpdated?: () => void;
}

export const ParentChildLinkingModal: React.FC<ParentChildLinkingModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  onLinksUpdated,
}) => {
  const [links, setLinks] = useState<ParentChildLink[]>(() => getAllParentChildLinks());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New link form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [parentId, setParentId] = useState('user-7'); // Default to Dr. Adeleke or custom
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [relationship, setRelationship] = useState<'FATHER' | 'MOTHER' | 'GUARDIAN'>('FATHER');
  const [isEmergencyContact, setIsEmergencyContact] = useState(true);
  const [hasFinancialResponsibility, setHasFinancialResponsibility] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sync parent info when student or parent preset changes
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const st = students.find((s) => s.id === studentId);
    if (st) {
      setParentName(st.guardianName || '');
      setParentEmail(st.guardianEmail || '');
      setParentPhone(st.guardianPhone || '');
    }
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !parentName || !parentPhone) {
      alert('Please select a student and provide parent name & phone number.');
      return;
    }

    const st = students.find((s) => s.id === selectedStudentId);
    if (!st) return;

    const newLink = linkChildToParent({
      parentId: parentId || `parent-${Date.now()}`,
      parentName,
      parentEmail: parentEmail || `${parentName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      parentPhone,
      relationship,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNumber: st.admissionNumber,
      classLevel: st.classLevel,
      classArm: st.classArm,
      isEmergencyContact,
      hasFinancialResponsibility,
      linkedBy: `${currentUser.name} (${currentUser.title || currentUser.role})`,
    });

    const updated = getAllParentChildLinks();
    setLinks(updated);
    setShowAddForm(false);
    setSelectedStudentId('');
    setNotification(`Successfully linked ${newLink.studentName} to ${newLink.parentName}`);
    setTimeout(() => setNotification(null), 4000);
    onLinksUpdated?.();
  };

  const handleUnlink = (linkId: string, studentName: string, parentName: string) => {
    if (confirm(`Are you sure you want to remove the link between ${studentName} and ${parentName}?`)) {
      unlinkChildFromParent(linkId, currentUser.name);
      setLinks(getAllParentChildLinks());
      setNotification(`Unlinked ${studentName} from ${parentName}`);
      setTimeout(() => setNotification(null), 4000);
      onLinksUpdated?.();
    }
  };

  const filteredLinks = links.filter(
    (l) =>
      l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.classLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Parent-Child Linking Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registrar Authorized Multi-Child Linking & Guardian Permissions
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

        {/* Security Invariant Banner */}
        <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Architectural Rule:</strong> Parents are strictly restricted from self-linking wards to prevent unauthorized fee inspection or grade access. All linkages require registrar/admin sign-off.
          </span>
        </div>

        {notification && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search and Action Toolbar */}
        <div className="p-6 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student, parent, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel Link' : 'Link New Student to Parent'}</span>
          </button>
        </div>

        {/* Form: Add New Link */}
        {showAddForm && (
          <form onSubmit={handleCreateLink} className="mx-6 mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Authorize Parent-Child Linkage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student Ward *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  required
                >
                  <option value="">-- Choose student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.admissionNumber}) - {st.classLevel} {st.classArm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Account Context
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="user-7">Dr. Kunle Adeleke (Parent Account)</option>
                  <option value="user-6">Mrs. Folashade Alabi (Teacher + Parent)</option>
                  <option value="user-4">Mr. David Okonjo (Teacher + Parent)</option>
                  <option value={`parent-custom-${Date.now()}`}>External / New Parent Account</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent / Guardian Full Name *
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Dr. Kunle Adeleke"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+234 803 445 6789"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as 'FATHER' | 'MOTHER' | 'GUARDIAN')}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Legal Guardian / Sponsor</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFinancialResponsibility}
                  onChange={(e) => setHasFinancialResponsibility(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Primary Financial Responsibilty (Receives Invoices & Receipts)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergencyContact}
                  onChange={(e) => setIsEmergencyContact(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Emergency Broadcast Alert Recipient</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 shadow-xs"
              >
                Confirm Linkage
              </button>
            </div>
          </form>
        )}

        {/* Linkages Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-2">Student Ward</th>
                <th className="py-3 px-2">Class / Arm</th>
                <th className="py-3 px-2">Parent / Guardian</th>
                <th className="py-3 px-2">Relationship</th>
                <th className="py-3 px-2">Permissions</th>
                <th className="py-3 px-2">Authorized By</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active parent-child linkages found matching your query.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {link.studentName}
                      </div>
                      <div className="text-[10px] text-slate-400">{link.admissionNumber}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {link.classLevel} {link.classArm}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {link.parentName}
                      </div>
                      <div className="text-[10px] text-slate-400">{link.parentPhone}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold uppercase text-[10px]">
                        {link.relationship}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        {link.hasFinancialResponsibility && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-bold">
                            Fee Payer
                          </span>
                        )}
                        {link.isEmergencyContact && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] font-bold">
                            Emergency
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {link.linkedBy}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleUnlink(link.id, link.studentName, link.parentName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Unlink student"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
