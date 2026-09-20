import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Trash2, ArrowRight, Save, ShieldAlert } from 'lucide-react';
import { Modal, Button, Input, Badge } from '../../design-system';
import {
  ImportEntityType,
  ImportRow,
  Student,
  Staff,
  FeePayment,
  ClassLevel,
  ValidationError,
} from '../../types';

interface RowCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: ImportRow<any> | null;
  entityType: ImportEntityType;
  levels: ClassLevel[];
  onSaveRow: (updatedRow: ImportRow<any>) => void;
  onDeleteRow: (rowId: string) => void;
  onSaveAndNext?: (updatedRow: ImportRow<any>) => void;
  hasNextError?: boolean;
}

export const RowCorrectionModal: React.FC<RowCorrectionModalProps> = ({
  isOpen,
  onClose,
  row,
  entityType,
  levels,
  onSaveRow,
  onDeleteRow,
  onSaveAndNext,
  hasNextError = false,
}) => {
  if (!row) return null;

  // Local form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [liveErrors, setLiveErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (row) {
      setFormData({ ...row.data });
      setLiveErrors(row.errors);
    }
  }, [row]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // If level changes, reset arm if it doesn't exist in new level
    if (field === 'classLevel' && entityType === 'STUDENTS') {
      const newLvl = levels.find(
        (l) => l.name.toLowerCase() === String(value).toLowerCase() || l.code.toLowerCase() === String(value).toLowerCase()
      );
      if (newLvl && newLvl.arms.length > 0) {
        // Check if existing arm is in new level, otherwise default to first arm
        const hasArm = newLvl.arms.some(
          (a) => a.name.toLowerCase() === (updated.classArm || '').toLowerCase()
        );
        if (!hasArm) {
          updated.classArm = newLvl.arms[0].name;
          setFormData(updated);
        }
      }
    }
  };

  const getFieldError = (field: string) => {
    return liveErrors.find((e) => e.field === field);
  };

  // Available arms for currently selected student level
  const selectedLevel = levels.find(
    (l) =>
      l.name.toLowerCase() === (formData.classLevel || '').toLowerCase() ||
      l.code.toLowerCase() === (formData.classLevel || '').toLowerCase()
  );
  const availableArms = selectedLevel ? selectedLevel.arms : [];

  const handleSave = () => {
    const updatedRow: ImportRow<any> = {
      ...row,
      data: formData,
    };
    onSaveRow(updatedRow);
  };

  const handleSaveNext = () => {
    const updatedRow: ImportRow<any> = {
      ...row,
      data: formData,
    };
    if (onSaveAndNext) {
      onSaveAndNext(updatedRow);
    } else {
      onSaveRow(updatedRow);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <span>Correct Row #{row.rowIndex}</span>
          <Badge
            variant={row.isValid ? 'success' : 'danger'}
            size="sm"
          >
            {row.isValid ? 'Valid' : `${row.errors.length} Issues`}
          </Badge>
        </div>
      }
      description={`Manually correct values for this ${entityType.toLowerCase().slice(0, -1)} entry. Changes are instantly re-validated against configured class and validation rules.`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteRow(row.id)}
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete Row
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save & Re-Validate
            </Button>
            {hasNextError && onSaveAndNext && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <span>Save & Next</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 py-1">
        {/* Error Callout Banner */}
        {row.errors.length > 0 && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-rose-800 dark:text-rose-300">
                  Validation Errors Flagged in this Row:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700 dark:text-rose-400">
                  {row.errors.map((err, i) => (
                    <li key={i}>
                      <span className="font-medium">{err.field}:</span> {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Fields: STUDENTS */}
        {entityType === 'STUDENTS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Admission Number */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admission Number *
              </label>
              <Input
                value={formData.admissionNumber || ''}
                onChange={(e) => handleChange('admissionNumber', e.target.value)}
                placeholder="e.g. APA/2024/001"
                error={getFieldError('admissionNumber')?.message}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must be unique across the cohort and existing school records.
              </span>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <Input
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="e.g. Chinedu"
                error={getFieldError('firstName')?.message}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <Input
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="e.g. Okafor"
                error={getFieldError('lastName')?.message}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('gender', 'M')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    formData.gender === 'M'
                      ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Male (M)
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('gender', 'F')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    formData.gender === 'F'
                      ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Female (F)
                </button>
              </div>
              {getFieldError('gender') && (
                <p className="text-xs text-rose-500 mt-1">{getFieldError('gender')?.message}</p>
              )}
            </div>

            {/* Class Level Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Class Level *
              </label>
              <select
                value={formData.classLevel || ''}
                onChange={(e) => handleChange('classLevel', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all ${
                  getFieldError('classLevel')
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                }`}
              >
                <option value="">-- Select Class Level --</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.name}>
                    {lvl.name} ({lvl.arms.length} arms)
                  </option>
                ))}
              </select>
              {getFieldError('classLevel') && (
                <p className="text-xs text-rose-500 mt-1">{getFieldError('classLevel')?.message}</p>
              )}
            </div>

            {/* Class Arm Dropdown (Dynamically constrained to selected level) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Class Arm * (Valid in {formData.classLevel || 'Level'})
              </label>
              <select
                value={formData.classArm || ''}
                onChange={(e) => handleChange('classArm', e.target.value)}
                disabled={!selectedLevel}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all ${
                  getFieldError('classArm')
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                }`}
              >
                <option value="">-- Select Arm --</option>
                {availableArms.map((arm) => (
                  <option key={arm.id} value={arm.name}>
                    {arm.name} (Cap: {arm.capacity})
                  </option>
                ))}
              </select>
              {getFieldError('classArm') && (
                <p className="text-xs text-rose-500 mt-1">{getFieldError('classArm')?.message}</p>
              )}
            </div>

            {/* Guardian Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guardian / Parent Name *
              </label>
              <Input
                value={formData.guardianName || ''}
                onChange={(e) => handleChange('guardianName', e.target.value)}
                placeholder="e.g. Dr. Emeka Okafor"
                error={getFieldError('guardianName')?.message}
              />
            </div>

            {/* Guardian Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guardian Phone *
              </label>
              <Input
                value={formData.guardianPhone || ''}
                onChange={(e) => handleChange('guardianPhone', e.target.value)}
                placeholder="+2348031234567 or 08031234567"
                error={getFieldError('guardianPhone')?.message}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must be 10-15 digits without letters.
              </span>
            </div>

            {/* Guardian Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guardian Email (Optional)
              </label>
              <Input
                type="email"
                value={formData.guardianEmail || ''}
                onChange={(e) => handleChange('guardianEmail', e.target.value)}
                placeholder="parent@example.com"
                error={getFieldError('guardianEmail')?.message}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <Input
                type="date"
                value={formData.dob || ''}
                onChange={(e) => handleChange('dob', e.target.value)}
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup || 'O+'}
                onChange={(e) => handleChange('bloodGroup', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
              </select>
            </div>
          </div>
        )}

        {/* Form Fields: STAFF */}
        {entityType === 'STAFF' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Staff Number *
              </label>
              <Input
                value={formData.staffNumber || ''}
                onChange={(e) => handleChange('staffNumber', e.target.value)}
                placeholder="STF-2024-001"
                error={getFieldError('staffNumber')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email *
              </label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="name@apexacademy.edu"
                error={getFieldError('email')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <Input
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="First Name"
                error={getFieldError('firstName')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <Input
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Last Name"
                error={getFieldError('lastName')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone *
              </label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+2348031234567"
                error={getFieldError('phone')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <Input
                value={formData.department || ''}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Mathematics, Science, etc."
                error={getFieldError('department')?.message}
              />
            </div>
          </div>
        )}

        {/* Form Fields: FEES */}
        {entityType === 'FEES' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Reference *
              </label>
              <Input
                value={formData.transactionReference || ''}
                onChange={(e) => handleChange('transactionReference', e.target.value)}
                placeholder="TXN-2024-001"
                error={getFieldError('transactionReference')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Admission Number *
              </label>
              <Input
                value={formData.admissionNumber || ''}
                onChange={(e) => handleChange('admissionNumber', e.target.value)}
                placeholder="APA/2024/001"
                error={getFieldError('admissionNumber')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₦) *
              </label>
              <Input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="250000"
                error={getFieldError('amount')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fee Category *
              </label>
              <Input
                value={formData.feeCategory || ''}
                onChange={(e) => handleChange('feeCategory', e.target.value)}
                placeholder="Tuition Fee"
                error={getFieldError('feeCategory')?.message}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Term *
              </label>
              <select
                value={formData.term || 'First Term'}
                onChange={(e) => handleChange('term', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod || 'BANK_TRANSFER'}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE_CARD">Online Card (Paystack/Flutterwave)</option>
                <option value="CASH">Direct Cash</option>
                <option value="CHEQUE">Bank Cheque / Draft</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
