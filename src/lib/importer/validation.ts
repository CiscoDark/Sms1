import { ClassLevel, ImportEntityType, ValidationError, Student, Staff, FeePayment } from '../../types';

// Phone validation helper
// Accepts international format (+234..., +1..., etc.) and local standard formats (080..., 070..., 090..., 10-15 digits)
export function validatePhoneNumber(phone: string): { isValid: boolean; message?: string } {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { isValid: false, message: 'Phone number is required.' };
  }

  const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');

  // Check for non-digit characters except leading +
  if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
    if (/[a-zA-Z]/.test(cleanPhone)) {
      return { isValid: false, message: `Invalid phone "${phone}": Contains alphabetic characters.` };
    }
    if (cleanPhone.length < 10) {
      return { isValid: false, message: `Invalid phone "${phone}": Too short (${cleanPhone.length} digits, minimum 10 digits required).` };
    }
    if (cleanPhone.length > 15) {
      return { isValid: false, message: `Invalid phone "${phone}": Too long (${cleanPhone.length} digits, maximum 15 digits).` };
    }
    return { isValid: false, message: `Invalid phone "${phone}": Format must be 10-15 digits (e.g. +2348031234567 or 08031234567).` };
  }

  return { isValid: true };
}

// Email format check
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Student row validation
export function validateStudentRow(
  data: Partial<Student>,
  rowIndex: number,
  allBatchAdmissionNumbers: string[],
  existingDatabaseAdmissionNumbers: Set<string>,
  levels: ClassLevel[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Admission Number
  const admNo = data.admissionNumber?.trim() || '';
  if (!admNo) {
    errors.push({
      field: 'admissionNumber',
      message: 'Admission Number is missing or empty.',
      severity: 'ERROR',
    });
  } else {
    // Check intra-batch duplicates
    const occurrencesInBatch = allBatchAdmissionNumbers.filter(
      (a) => a.toLowerCase() === admNo.toLowerCase()
    ).length;
    if (occurrencesInBatch > 1) {
      errors.push({
        field: 'admissionNumber',
        message: `Duplicate admission number: "${admNo}" appears ${occurrencesInBatch} times in this import batch.`,
        severity: 'ERROR',
      });
    }

    // Check existing database records
    if (existingDatabaseAdmissionNumbers.has(admNo.toLowerCase())) {
      errors.push({
        field: 'admissionNumber',
        message: `Admission number "${admNo}" already exists in the school database.`,
        severity: 'ERROR',
      });
    }
  }

  // 2. Names
  if (!data.firstName || !data.firstName.trim()) {
    errors.push({
      field: 'firstName',
      message: 'First name is required.',
      severity: 'ERROR',
    });
  } else if (data.firstName.trim().length < 2) {
    errors.push({
      field: 'firstName',
      message: 'First name must be at least 2 characters long.',
      severity: 'ERROR',
    });
  }

  if (!data.lastName || !data.lastName.trim()) {
    errors.push({
      field: 'lastName',
      message: 'Last name is required.',
      severity: 'ERROR',
    });
  } else if (data.lastName.trim().length < 2) {
    errors.push({
      field: 'lastName',
      message: 'Last name must be at least 2 characters long.',
      severity: 'ERROR',
    });
  }

  // 3. Gender
  const gender = data.gender?.toUpperCase();
  if (!gender || (gender !== 'M' && gender !== 'F' && gender !== 'MALE' && gender !== 'FEMALE')) {
    errors.push({
      field: 'gender',
      message: 'Gender must be "M" or "F" (or Male/Female).',
      severity: 'ERROR',
    });
  }

  // 4. Class Level and Arm Validation
  const levelName = data.classLevel?.trim() || '';
  const armName = data.classArm?.trim() || '';

  if (!levelName) {
    errors.push({
      field: 'classLevel',
      message: 'Class Level is required.',
      severity: 'ERROR',
    });
  } else {
    // Find matching level by name or code (case-insensitive)
    const matchingLevel = levels.find(
      (l) =>
        l.name.toLowerCase() === levelName.toLowerCase() ||
        l.code.toLowerCase() === levelName.toLowerCase()
    );

    if (!matchingLevel) {
      const availableLevelNames = levels.map((l) => l.name).join(', ');
      errors.push({
        field: 'classLevel',
        message: `Class Level "${levelName}" does not match configured levels. Available: ${availableLevelNames}.`,
        severity: 'ERROR',
      });
    } else {
      // Validate Arm inside this matched Level
      if (!armName) {
        errors.push({
          field: 'classArm',
          message: `Class Arm is required for level ${matchingLevel.name}.`,
          severity: 'ERROR',
        });
      } else {
        const matchingArm = matchingLevel.arms.find(
          (a) =>
            a.name.toLowerCase() === armName.toLowerCase() ||
            a.code.toLowerCase() === armName.toLowerCase() ||
            a.name.toLowerCase().includes(armName.toLowerCase()) ||
            armName.toLowerCase().includes(a.name.toLowerCase())
        );

        if (!matchingArm) {
          const availableArms = matchingLevel.arms.map((a) => a.name).join(', ');
          errors.push({
            field: 'classArm',
            message: `Arm "${armName}" does not exist in ${matchingLevel.name}. Configured arms: ${availableArms}.`,
            severity: 'ERROR',
          });
        }
      }
    }
  }

  // 5. Guardian Name & Phone
  if (!data.guardianName || !data.guardianName.trim()) {
    errors.push({
      field: 'guardianName',
      message: 'Guardian name is required.',
      severity: 'ERROR',
    });
  }

  const phoneValidation = validatePhoneNumber(data.guardianPhone || '');
  if (!phoneValidation.isValid) {
    errors.push({
      field: 'guardianPhone',
      message: phoneValidation.message || 'Invalid guardian phone number.',
      severity: 'ERROR',
    });
  }

  // Optional Guardian Email check
  if (data.guardianEmail && data.guardianEmail.trim()) {
    if (!validateEmail(data.guardianEmail)) {
      errors.push({
        field: 'guardianEmail',
        message: `Guardian email "${data.guardianEmail}" has an invalid format.`,
        severity: 'WARNING',
      });
    }
  }

  return errors;
}

// Staff row validation
export function validateStaffRow(
  data: Partial<Staff>,
  rowIndex: number,
  allBatchStaffNumbers: string[],
  existingDatabaseStaffNumbers: Set<string>,
  allBatchEmails: string[],
  existingDatabaseEmails: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  const staffNo = data.staffNumber?.trim() || '';
  if (!staffNo) {
    errors.push({
      field: 'staffNumber',
      message: 'Staff ID/Number is required.',
      severity: 'ERROR',
    });
  } else {
    const batchDuplicates = allBatchStaffNumbers.filter(
      (s) => s.toLowerCase() === staffNo.toLowerCase()
    ).length;
    if (batchDuplicates > 1) {
      errors.push({
        field: 'staffNumber',
        message: `Duplicate staff ID: "${staffNo}" appears ${batchDuplicates} times in batch.`,
        severity: 'ERROR',
      });
    }
    if (existingDatabaseStaffNumbers.has(staffNo.toLowerCase())) {
      errors.push({
        field: 'staffNumber',
        message: `Staff ID "${staffNo}" already exists in staff directory.`,
        severity: 'ERROR',
      });
    }
  }

  if (!data.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required.', severity: 'ERROR' });
  }
  if (!data.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required.', severity: 'ERROR' });
  }

  const email = data.email?.trim() || '';
  if (!email) {
    errors.push({ field: 'email', message: 'Email address is required.', severity: 'ERROR' });
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: `Invalid email format: "${email}".`, severity: 'ERROR' });
  } else {
    const emailDuplicates = allBatchEmails.filter(
      (e) => e.toLowerCase() === email.toLowerCase()
    ).length;
    if (emailDuplicates > 1) {
      errors.push({
        field: 'email',
        message: `Duplicate email: "${email}" used multiple times in batch.`,
        severity: 'ERROR',
      });
    }
    if (existingDatabaseEmails.has(email.toLowerCase())) {
      errors.push({
        field: 'email',
        message: `Email "${email}" is already registered to existing staff.`,
        severity: 'ERROR',
      });
    }
  }

  const phoneRes = validatePhoneNumber(data.phone || '');
  if (!phoneRes.isValid) {
    errors.push({
      field: 'phone',
      message: phoneRes.message || 'Valid contact phone is required.',
      severity: 'ERROR',
    });
  }

  if (!data.department?.trim()) {
    errors.push({ field: 'department', message: 'Department is required.', severity: 'ERROR' });
  }
  if (!data.role?.trim()) {
    errors.push({ field: 'role', message: 'Staff role is required.', severity: 'ERROR' });
  }

  return errors;
}

// Fee row validation
export function validateFeeRow(
  data: Partial<FeePayment>,
  rowIndex: number,
  allBatchTxnRefs: string[],
  existingTxnRefs: Set<string>,
  existingStudentAdmNumbers: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  const txn = data.transactionReference?.trim() || '';
  if (!txn) {
    errors.push({
      field: 'transactionReference',
      message: 'Transaction reference is required.',
      severity: 'ERROR',
    });
  } else {
    const duplicates = allBatchTxnRefs.filter((t) => t.toLowerCase() === txn.toLowerCase()).length;
    if (duplicates > 1) {
      errors.push({
        field: 'transactionReference',
        message: `Duplicate transaction reference "${txn}" in batch.`,
        severity: 'ERROR',
      });
    }
    if (existingTxnRefs.has(txn.toLowerCase())) {
      errors.push({
        field: 'transactionReference',
        message: `Transaction reference "${txn}" already recorded in database.`,
        severity: 'ERROR',
      });
    }
  }

  const admNo = data.admissionNumber?.trim() || '';
  if (!admNo) {
    errors.push({
      field: 'admissionNumber',
      message: 'Student admission number is required.',
      severity: 'ERROR',
    });
  } else if (existingStudentAdmNumbers.size > 0 && !existingStudentAdmNumbers.has(admNo.toLowerCase())) {
    errors.push({
      field: 'admissionNumber',
      message: `Admission number "${admNo}" not found in current student registry.`,
      severity: 'WARNING',
    });
  }

  if (typeof data.amount !== 'number' || isNaN(data.amount) || data.amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a positive numeric value greater than zero.',
      severity: 'ERROR',
    });
  }

  if (!data.feeCategory?.trim()) {
    errors.push({ field: 'feeCategory', message: 'Fee category is required.', severity: 'ERROR' });
  }

  if (!data.paymentDate?.trim()) {
    errors.push({ field: 'paymentDate', message: 'Payment date is required.', severity: 'ERROR' });
  }

  if (!data.term?.trim()) {
    errors.push({ field: 'term', message: 'Academic term is required.', severity: 'ERROR' });
  }

  if (!data.sessionYear?.trim()) {
    errors.push({ field: 'sessionYear', message: 'Session year is required.', severity: 'ERROR' });
  }

  return errors;
}
