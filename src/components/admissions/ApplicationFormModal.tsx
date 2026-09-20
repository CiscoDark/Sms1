import React, { useState } from 'react';
import { Applicant, ClassLevel, UserProfile, StageHistoryEntry } from '../../types';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import {
  FilePlus,
  Globe,
  ShieldCheck,
  User,
  GraduationCap,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { generateNextApplicationNumber } from '../../lib/admissions/admissions-store';

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: ClassLevel[];
  existingApplicants: Applicant[];
  currentUser: UserProfile;
  onSubmitApplication: (newApplicant: Applicant) => void;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  levels,
  existingApplicants,
  currentUser,
  onSubmitApplication,
}) => {
  const [entryMode, setEntryMode] = useState<'ADMIN' | 'PUBLIC'>('ADMIN');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [dob, setDob] = useState('2012-05-15');
  const [address, setAddress] = useState('');

  const [desiredLevel, setDesiredLevel] = useState<string>(levels[0]?.name || 'JSS 1');
  const [desiredArmPreference, setDesiredArmPreference] = useState('');

  const [priorSchool, setPriorSchool] = useState('');
  const [priorGradeAverage, setPriorGradeAverage] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Father');
  const [guardianPhone, setGuardianPhone] = useState('+234');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianOccupation, setGuardianOccupation] = useState('');

  const [adminNotes, setAdminNotes] = useState('');
  const [autoAdvanceToReview, setAutoAdvanceToReview] = useState(false);

  // Form error state
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected level arms for preference
  const selectedLevelObj = levels.find((l) => l.name === desiredLevel) || levels[0];

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('M');
    setDob('2012-05-15');
    setAddress('');
    setDesiredLevel(levels[0]?.name || 'JSS 1');
    setDesiredArmPreference('');
    setPriorSchool('');
    setPriorGradeAverage('');
    setGuardianName('');
    setGuardianRelationship('Father');
    setGuardianPhone('+234');
    setGuardianEmail('');
    setGuardianOccupation('');
    setAdminNotes('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Candidate First Name and Last Name are required.');
      return;
    }
    if (!guardianName.trim() || !guardianPhone.trim()) {
      setErrorMsg('Guardian Full Name and Primary Phone Number are required.');
      return;
    }
    if (!priorSchool.trim()) {
      setErrorMsg('Prior School Name is required for academic admissions verification.');
      return;
    }

    // Nigerian phone validation
    const cleanPhone = guardianPhone.replace(/\s+/g, '');
    const phoneRegex = /^(\+?234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMsg(
        'Invalid Nigerian phone number format. Expected format: +234803... or 0803... (11 digits).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const appNumber = generateNextApplicationNumber(existingApplicants);
      const now = new Date();
      const todayDateStr = now.toISOString().split('T')[0];
      const timestampStr = `${todayDateStr} ${now.toTimeString().slice(0, 5)}`;

      const initialStage = autoAdvanceToReview && entryMode === 'ADMIN' ? 'UNDER_REVIEW' : 'APPLIED';

      const stageHistory: StageHistoryEntry[] = [
        {
          id: `hist-${Date.now()}-1`,
          stage: 'APPLIED',
          changedAt: timestampStr,
          changedBy:
            entryMode === 'ADMIN'
              ? `${currentUser.name} (${currentUser.title || currentUser.role})`
              : 'Public Admissions Online Portal',
          notes:
            entryMode === 'ADMIN'
              ? `Manually registered by administrative staff. ${adminNotes}`
              : 'Submitted through online public portal application form.',
        },
      ];

      if (initialStage === 'UNDER_REVIEW') {
        stageHistory.push({
          id: `hist-${Date.now()}-2`,
          stage: 'UNDER_REVIEW',
          changedAt: timestampStr,
          changedBy: `${currentUser.name} (${currentUser.title || currentUser.role})`,
          notes: 'Fast-tracked directly to academic review.',
        });
      }

      const newApplicant: Applicant = {
        id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        applicationNumber: appNumber,
        appliedDate: todayDateStr,
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        gender,
        dateOfBirth: dob,
        residentialAddress: address.trim() || 'Lagos, Nigeria',
        desiredLevel,
        desiredArmPreference: desiredArmPreference || undefined,
        priorSchool: priorSchool.trim(),
        priorGradeAverage: priorGradeAverage.trim() || undefined,
        guardianName: guardianName.trim(),
        guardianRelationship,
        guardianPhone: cleanPhone,
        guardianEmail: guardianEmail.trim() || undefined,
        guardianOccupation: guardianOccupation.trim() || undefined,
        stage: initialStage,
        stageHistory,
      };

      onSubmitApplication(newApplicant);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                New Student Admission Application
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                {entryMode === 'ADMIN'
                  ? 'Internal staff entry / Walk-in paper registration'
                  : 'Simulating Parent / Guardian Online Portal Submission'}
              </p>
            </div>
          </div>
          {/* Mode Switcher */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setEntryMode('ADMIN')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                entryMode === 'ADMIN'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Staff Entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('PUBLIC')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                entryMode === 'PUBLIC'
                  ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Public Portal
            </button>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Next ID: <strong className="font-mono">{generateNextApplicationNumber(existingApplicants)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Application
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {entryMode === 'PUBLIC' && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
            <strong>Apex Academy Online Admissions Portal:</strong> Welcome prospective parents.
            Please complete candidate and guardian details accurately. A registration receipt will be generated automatically.
          </div>
        )}

        {/* Section 1: Candidate Personal Info */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Candidate Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Oluwaseun"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Middle Name (Optional)
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="e.g. Damilola"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Last Name (Surname) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Adeleke"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('M')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                    gender === 'M'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-600'
                  }`}
                >
                  Male (Boy)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                    gender === 'F'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-600'
                  }`}
                >
                  Female (Girl)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 15 Ikoyi Crescent, Lagos"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Academic Program & Prior School */}
        <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            Academic Placement & Prior Background
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Desired Class Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={desiredLevel}
                onChange={(e) => setDesiredLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {levels.map((lvl) => (
                  <option key={lvl.id || lvl.name} value={lvl.name}>
                    {lvl.name} ({lvl.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Arm / Stream Preference (Optional)
              </label>
              <select
                value={desiredArmPreference}
                onChange={(e) => setDesiredArmPreference(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">No preference (Assign by capacity)</option>
                {selectedLevelObj.arms.map((arm) => (
                  <option key={arm.id || arm.name} value={arm.name}>
                    {arm.name} (Capacity: {arm.enrolledCount || 0}/{arm.capacity || 40})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Previous School Attended <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={priorSchool}
                onChange={(e) => setPriorSchool(e.target.value)}
                placeholder="e.g. Corona Primary School, Victoria Island"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Prior Academic Performance / BECE Result
              </label>
              <input
                type="text"
                value={priorGradeAverage}
                onChange={(e) => setPriorGradeAverage(e.target.value)}
                placeholder="e.g. 85% aggregate / 7 Distinctions"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Guardian & Contact Information */}
        <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            Guardian / Emergency Contact
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Guardian Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. Dr. Babatunde Adeleke"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <select
                value={guardianRelationship}
                onChange={(e) => setGuardianRelationship(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Uncle / Aunt">Uncle / Aunt</option>
                <option value="Sponsor">Sponsor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Guardian Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+2348031234567"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Guardian Email
              </label>
              <input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="babatunde@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Guardian Occupation
              </label>
              <input
                type="text"
                value={guardianOccupation}
                onChange={(e) => setGuardianOccupation(e.target.value)}
                placeholder="e.g. Civil Engineer"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Staff-only Options */}
        {entryMode === 'ADMIN' && (
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center gap-2">
              <input
                id="autoAdvance"
                type="checkbox"
                checked={autoAdvanceToReview}
                onChange={(e) => setAutoAdvanceToReview(e.target.checked)}
                className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autoAdvance" className="text-xs text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer">
                Fast-track immediately into <strong>Under Review</strong> stage (skips unreviewed inbox)
              </label>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">
                Internal Administrative Notes
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Walk-in registration with original birth cert sighted..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
