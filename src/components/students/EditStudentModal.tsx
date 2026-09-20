import React, { useState } from 'react';
import { Student, ClassLevel, UserProfile } from '../../types';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Save, UserCheck, ShieldAlert } from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  levels: ClassLevel[];
  currentUser: UserProfile;
  onSave: (updated: Student) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  levels,
  currentUser,
  onSave,
}) => {
  const [firstName, setFirstName] = useState(student.firstName);
  const [middleName, setMiddleName] = useState(student.middleName || '');
  const [lastName, setLastName] = useState(student.lastName);
  const [gender, setGender] = useState<'M' | 'F'>(student.gender);
  const [dob, setDob] = useState(student.dob || '');
  const [classLevel, setClassLevel] = useState(student.classLevel);
  const [classArm, setClassArm] = useState(student.classArm);
  const [status, setStatus] = useState(student.status);

  // Guardian
  const [guardianName, setGuardianName] = useState(student.guardianName);
  const [guardianPhone, setGuardianPhone] = useState(student.guardianPhone);
  const [guardianEmail, setGuardianEmail] = useState(student.guardianEmail || '');
  const [guardianRelationship, setGuardianRelationship] = useState(student.guardianRelationship || 'Father');
  const [guardianOccupation, setGuardianOccupation] = useState(student.guardianOccupation || '');

  // Medical & Clinical Notes
  const [bloodGroup, setBloodGroup] = useState(student.bloodGroup || 'O+');
  const [genotype, setGenotype] = useState(student.genotype || 'AA');
  const [allergiesInput, setAllergiesInput] = useState((student.allergies || []).join(', '));
  const [medicalNotes, setMedicalNotes] = useState(student.medicalNotes || '');
  const [emergencyContactName, setEmergencyContactName] = useState(student.emergencyContactName || student.guardianName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(student.emergencyContactPhone || student.guardianPhone);
  const [residentialAddress, setResidentialAddress] = useState(student.residentialAddress || '');

  const [isSaving, setIsSaving] = useState(false);

  // Available arms for selected level
  const activeLevel = levels.find((l) => l.name === classLevel) || levels[0];
  const availableArms = activeLevel?.arms || [];

  const handleSave = () => {
    setIsSaving(true);

    const allergies = allergiesInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const updated: Student = {
      ...student,
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      gender,
      dob: dob || undefined,
      classLevel,
      classArm,
      status,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianEmail: guardianEmail.trim() || undefined,
      guardianRelationship,
      guardianOccupation: guardianOccupation.trim() || undefined,
      bloodGroup,
      genotype,
      allergies,
      medicalNotes: medicalNotes.trim() || undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      residentialAddress: residentialAddress.trim() || undefined,
    };

    onSave(updated);
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Student Profile"
      description={`Update bio-data, guardian contact, class placement, and clinical dossier for ${student.admissionNumber}.`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Section 1: Bio Data */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            1. Core Bio-Data
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Middle Name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Enrollment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Student['status'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="ACTIVE">Active (Enrolled)</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="GRADUATED">Graduated (Alumni)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Class Level
              </label>
              <select
                value={classLevel}
                onChange={(e) => {
                  setClassLevel(e.target.value);
                  const lvl = levels.find((l) => l.name === e.target.value);
                  if (lvl && lvl.arms.length > 0) {
                    setClassArm(lvl.arms[0].name);
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.name}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Class Arm / Stream
              </label>
              <select
                value={classArm}
                onChange={(e) => setClassArm(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {availableArms.map((arm) => (
                  <option key={arm.id} value={arm.name}>
                    {arm.name} (Room: {arm.roomNumber || 'TBD'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Guardian Details */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            2. Guardian Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Primary Guardian Name"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              required
            />
            <Input
              label="Guardian Phone"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Guardian Email"
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Relationship
              </label>
              <select
                value={guardianRelationship}
                onChange={(e) => setGuardianRelationship(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Legal Guardian</option>
                <option value="Uncle">Uncle / Aunt</option>
              </select>
            </div>
            <Input
              label="Occupation"
              value={guardianOccupation}
              onChange={(e) => setGuardianOccupation(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Residential Address"
              value={residentialAddress}
              onChange={(e) => setResidentialAddress(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Medical & Emergency Notes */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            3. Medical & Clinical Notes
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Genotype
              </label>
              <select
                value={genotype}
                onChange={(e) => setGenotype(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="AA">AA</option>
                <option value="AS">AS (Carrier)</option>
                <option value="AC">AC</option>
                <option value="SS">SS (Sickle Cell)</option>
              </select>
            </div>
          </div>

          <div>
            <Input
              label="Allergies (comma-separated)"
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              placeholder="e.g. Peanuts, Penicillin, Dust / Asthmatic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Clinical Instructions / Emergency Notes
            </label>
            <textarea
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="e.g. Carry inhaler during physical training. In case of allergic flare-up notify school clinic immediately."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Emergency Contact Name"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
            />
            <Input
              label="Emergency Contact Phone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
