import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  ImportEntityType,
  ImportRow,
  Student,
  Staff,
  FeePayment,
  ClassLevel,
  ValidationError,
} from '../../types';
import { validateStudentRow, validateStaffRow, validateFeeRow } from './validation';

// Helper to normalize header string keys
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Map student fields
function mapStudentRow(raw: Record<string, string>): Partial<Student> {
  const normalized: Record<string, string> = {};
  Object.keys(raw).forEach((key) => {
    normalized[normalizeHeader(key)] = (raw[key] || '').trim();
  });

  const getVal = (...aliases: string[]) => {
    for (const a of aliases) {
      const norm = normalizeHeader(a);
      if (normalized[norm] !== undefined && normalized[norm] !== '') {
        return normalized[norm];
      }
    }
    return '';
  };

  const rawGender = getVal('gender', 'sex');
  let gender: 'M' | 'F' = 'M';
  if (rawGender.toUpperCase().startsWith('F') || rawGender.toUpperCase() === 'FEMALE') {
    gender = 'F';
  } else if (rawGender.toUpperCase().startsWith('M') || rawGender.toUpperCase() === 'MALE') {
    gender = 'M';
  }

  return {
    admissionNumber: getVal('admissionnumber', 'admissionno', 'admno', 'regno', 'studentid', 'id'),
    firstName: getVal('firstname', 'first', 'givenname'),
    lastName: getVal('lastname', 'last', 'surname', 'familyname'),
    gender,
    classLevel: getVal('classlevel', 'level', 'class', 'grade'),
    classArm: getVal('classarm', 'arm', 'stream', 'section'),
    guardianName: getVal('guardianname', 'parentname', 'guardian', 'parent', 'nextofkin'),
    guardianPhone: getVal('guardianphone', 'parentphone', 'phone', 'phonenumber', 'telephone', 'mobile'),
    guardianEmail: getVal('guardianemail', 'parentemail', 'email', 'emailaddress'),
    dob: getVal('dateofbirth', 'dob', 'birthdate'),
    bloodGroup: getVal('bloodgroup', 'bloodtype', 'genotype'),
    enrollmentDate: getVal('enrollmentdate', 'admissiondate') || '2024-09-09',
    status: 'ACTIVE',
  };
}

// Map staff fields
function mapStaffRow(raw: Record<string, string>): Partial<Staff> {
  const normalized: Record<string, string> = {};
  Object.keys(raw).forEach((key) => {
    normalized[normalizeHeader(key)] = (raw[key] || '').trim();
  });

  const getVal = (...aliases: string[]) => {
    for (const a of aliases) {
      const norm = normalizeHeader(a);
      if (normalized[norm] !== undefined && normalized[norm] !== '') {
        return normalized[norm];
      }
    }
    return '';
  };

  const rawGender = getVal('gender', 'sex');
  const gender: 'M' | 'F' = rawGender.toUpperCase().startsWith('F') ? 'F' : 'M';

  return {
    staffNumber: getVal('staffnumber', 'staffid', 'staffno', 'employeeid', 'id'),
    firstName: getVal('firstname', 'first', 'givenname'),
    lastName: getVal('lastname', 'last', 'surname'),
    gender,
    email: getVal('email', 'emailaddress', 'officialemail'),
    phone: getVal('phone', 'phonenumber', 'telephone', 'mobile'),
    role: getVal('role', 'position', 'designation') || 'TEACHER',
    department: getVal('department', 'dept', 'faculty') || 'Academics',
    qualification: getVal('qualification', 'degree') || 'B.Sc. / B.Ed',
    employmentDate: getVal('employmentdate', 'hiredate', 'startdate') || '2024-09-01',
    assignedLevel: getVal('assignedlevel', 'level', 'class'),
    assignedArm: getVal('assignedarm', 'arm', 'stream'),
    status: 'ACTIVE',
  };
}

// Map fee payment fields
function mapFeeRow(raw: Record<string, string>): Partial<FeePayment> {
  const normalized: Record<string, string> = {};
  Object.keys(raw).forEach((key) => {
    normalized[normalizeHeader(key)] = (raw[key] || '').trim();
  });

  const getVal = (...aliases: string[]) => {
    for (const a of aliases) {
      const norm = normalizeHeader(a);
      if (normalized[norm] !== undefined && normalized[norm] !== '') {
        return normalized[norm];
      }
    }
    return '';
  };

  const amountStr = getVal('amount', 'feeamount', 'paidamount', 'price').replace(/[^0-9.]/g, '');
  const amount = parseFloat(amountStr) || 0;

  const rawMethod = getVal('paymentmethod', 'method', 'channel').toUpperCase();
  let paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'ONLINE_CARD' | 'CHEQUE' = 'BANK_TRANSFER';
  if (rawMethod.includes('CARD') || rawMethod.includes('ONLINE')) paymentMethod = 'ONLINE_CARD';
  else if (rawMethod.includes('CASH')) paymentMethod = 'CASH';
  else if (rawMethod.includes('CHEQUE')) paymentMethod = 'CHEQUE';

  return {
    transactionReference: getVal('transactionreference', 'transactionref', 'txnref', 'ref', 'receiptno', 'referenceno'),
    admissionNumber: getVal('admissionnumber', 'admissionno', 'admno', 'studentid'),
    studentName: getVal('studentname', 'name', 'fullname'),
    classLevel: getVal('classlevel', 'level', 'class'),
    sessionYear: getVal('sessionyear', 'session', 'academicterm', 'year') || '2024/2025',
    term: getVal('term', 'academicterm') || 'First Term',
    feeCategory: getVal('feecategory', 'category', 'purpose', 'description') || 'Tuition Fee',
    amount,
    paymentDate: getVal('paymentdate', 'date', 'transactiondate') || '2024-09-10',
    paymentMethod,
    status: 'PAID',
  };
}

// Parse Raw File (CSV, TSV, or Excel)
export async function parseFileToRawRows(file: File): Promise<Record<string, string>[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    
    // Convert all values to string
    return jsonData.map((row) => {
      const cleanRow: Record<string, string> = {};
      Object.keys(row).forEach((k) => {
        cleanRow[k.trim()] = String(row[k] ?? '').trim();
      });
      return cleanRow;
    });
  }

  // Otherwise treat as CSV/TSV
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const rows = results.data.filter((r) => {
          return Object.values(r).some((v) => v && String(v).trim().length > 0);
        });
        resolve(rows);
      },
      error: (error) => {
        reject(new Error(`CSV Parsing Failed: ${error.message}`));
      },
    });
  });
}

// Parse raw text (e.g. from pasted text or mock generators)
export function parseCSVStringToRawRows(csvString: string): Record<string, string>[] {
  const results = Papa.parse<Record<string, string>>(csvString.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  return results.data.filter((r) => Object.values(r).some((v) => v && String(v).trim().length > 0));
}

// Full Batch Processing & Pre-Validation Pipeline
export function processAndValidateBatch(
  entityType: ImportEntityType,
  rawRows: Record<string, string>[],
  levels: ClassLevel[],
  existingStudents: Student[],
  existingStaff: Staff[],
  existingFees: FeePayment[]
): ImportRow<any>[] {
  if (entityType === 'STUDENTS') {
    const mapped = rawRows.map((r) => mapStudentRow(r));
    const allBatchAdmNos = mapped.map((m) => m.admissionNumber || '');
    const existingAdmNos = new Set(existingStudents.map((s) => s.admissionNumber.toLowerCase()));

    return mapped.map((data, index) => {
      const errors = validateStudentRow(
        data,
        index,
        allBatchAdmNos,
        existingAdmNos,
        levels
      );
      const isValid = errors.filter((e) => e.severity === 'ERROR').length === 0;

      return {
        rowIndex: index + 1,
        id: `row-stu-${Date.now()}-${index}`,
        rawData: rawRows[index],
        data: {
          id: `stu-${Date.now()}-${index}`,
          admissionNumber: data.admissionNumber || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          gender: data.gender || 'M',
          classLevel: data.classLevel || '',
          classArm: data.classArm || '',
          guardianName: data.guardianName || '',
          guardianPhone: data.guardianPhone || '',
          guardianEmail: data.guardianEmail,
          dob: data.dob,
          bloodGroup: data.bloodGroup,
          enrollmentDate: data.enrollmentDate || '2024-09-09',
          status: 'ACTIVE' as const,
        },
        errors,
        isValid,
        isCorrected: false,
        isCommitted: false,
      };
    });
  }

  if (entityType === 'STAFF') {
    const mapped = rawRows.map((r) => mapStaffRow(r));
    const allBatchStaffNos = mapped.map((m) => m.staffNumber || '');
    const existingStaffNos = new Set(existingStaff.map((s) => s.staffNumber.toLowerCase()));
    const allBatchEmails = mapped.map((m) => m.email || '');
    const existingEmails = new Set(existingStaff.map((s) => s.email.toLowerCase()));

    return mapped.map((data, index) => {
      const errors = validateStaffRow(
        data,
        index,
        allBatchStaffNos,
        existingStaffNos,
        allBatchEmails,
        existingEmails
      );
      const isValid = errors.filter((e) => e.severity === 'ERROR').length === 0;

      return {
        rowIndex: index + 1,
        id: `row-stf-${Date.now()}-${index}`,
        rawData: rawRows[index],
        data: {
          id: `stf-${Date.now()}-${index}`,
          staffNumber: data.staffNumber || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          gender: data.gender || 'M',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'TEACHER',
          department: data.department || 'Academics',
          qualification: data.qualification || 'B.Sc.',
          employmentDate: data.employmentDate || '2024-09-01',
          assignedLevel: data.assignedLevel,
          assignedArm: data.assignedArm,
          status: 'ACTIVE' as const,
        },
        errors,
        isValid,
        isCorrected: false,
        isCommitted: false,
      };
    });
  }

  // FEES
  const mapped = rawRows.map((r) => mapFeeRow(r));
  const allBatchTxnRefs = mapped.map((m) => m.transactionReference || '');
  const existingTxnRefs = new Set(existingFees.map((f) => f.transactionReference.toLowerCase()));
  const existingStudentAdmNos = new Set(existingStudents.map((s) => s.admissionNumber.toLowerCase()));

  return mapped.map((data, index) => {
    const errors = validateFeeRow(
      data,
      index,
      allBatchTxnRefs,
      existingTxnRefs,
      existingStudentAdmNos
    );
    const isValid = errors.filter((e) => e.severity === 'ERROR').length === 0;

    return {
      rowIndex: index + 1,
      id: `row-fee-${Date.now()}-${index}`,
      rawData: rawRows[index],
      data: {
        id: `fee-${Date.now()}-${index}`,
        transactionReference: data.transactionReference || '',
        admissionNumber: data.admissionNumber || '',
        studentName: data.studentName || '',
        classLevel: data.classLevel || '',
        sessionYear: data.sessionYear || '2024/2025',
        term: data.term || 'First Term',
        feeCategory: data.feeCategory || 'Tuition Fee',
        amount: data.amount || 0,
        paymentDate: data.paymentDate || '2024-09-10',
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        status: 'PAID' as const,
      },
      errors,
      isValid,
      isCorrected: false,
      isCommitted: false,
    };
  });
}

// Re-validate an individual corrected row in place
export function revalidateRow<T>(
  row: ImportRow<T>,
  entityType: ImportEntityType,
  allRows: ImportRow<T>[],
  levels: ClassLevel[],
  existingStudents: Student[],
  existingStaff: Staff[],
  existingFees: FeePayment[]
): ImportRow<T> {
  let errors: ValidationError[] = [];

  if (entityType === 'STUDENTS') {
    const stuData = row.data as unknown as Student;
    const allAdmNos = allRows.map((r) => (r.data as unknown as Student).admissionNumber || '');
    const existingAdmNos = new Set(existingStudents.map((s) => s.admissionNumber.toLowerCase()));
    errors = validateStudentRow(stuData, row.rowIndex - 1, allAdmNos, existingAdmNos, levels);
  } else if (entityType === 'STAFF') {
    const stfData = row.data as unknown as Staff;
    const allStaffNos = allRows.map((r) => (r.data as unknown as Staff).staffNumber || '');
    const existingStaffNos = new Set(existingStaff.map((s) => s.staffNumber.toLowerCase()));
    const allEmails = allRows.map((r) => (r.data as unknown as Staff).email || '');
    const existingEmails = new Set(existingStaff.map((s) => s.email.toLowerCase()));
    errors = validateStaffRow(stfData, row.rowIndex - 1, allStaffNos, existingStaffNos, allEmails, existingEmails);
  } else if (entityType === 'FEES') {
    const feeData = row.data as unknown as FeePayment;
    const allTxns = allRows.map((r) => (r.data as unknown as FeePayment).transactionReference || '');
    const existingTxns = new Set(existingFees.map((f) => f.transactionReference.toLowerCase()));
    const existingAdmNos = new Set(existingStudents.map((s) => s.admissionNumber.toLowerCase()));
    errors = validateFeeRow(feeData, row.rowIndex - 1, allTxns, existingTxns, existingAdmNos);
  }

  const isValid = errors.filter((e) => e.severity === 'ERROR').length === 0;

  return {
    ...row,
    errors,
    isValid,
    isCorrected: true,
  };
}
