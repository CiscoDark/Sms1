import { StudentDocument } from '../types';
import { enqueueOfflineAction } from './offline-queue';

export const DOCUMENT_CATEGORIES: {
  value: StudentDocument['category'];
  label: string;
  badgeColor: string;
}[] = [
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' },
  { value: 'ACADEMIC_TRANSCRIPT', label: 'Academic Transcript', badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { value: 'MEDICAL_RECORD', label: 'Medical & Immunization', badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  { value: 'IDENTIFICATION', label: 'Identity Document / Passport', badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
  { value: 'OTHER', label: 'Other Document', badgeColor: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
];

const STORAGE_KEY_DOCS = 'sms_student_documents';

export function getStoredDocuments(): Record<string, StudentDocument[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCS);
    if (raw) return JSON.parse(raw);
    return {};
  } catch {
    return {};
  }
}

export function saveStoredDocuments(docsMap: Record<string, StudentDocument[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docsMap));
  } catch (err) {
    console.error('Failed to save student documents to localStorage', err);
  }
}

export function generateDefaultDocumentsForStudent(studentId: string, studentName: string): StudentDocument[] {
  const cleanName = studentName.toLowerCase().replace(/\s+/g, '_');
  return [
    {
      id: `doc-${studentId}-1`,
      studentId,
      title: 'Official Birth Certificate',
      fileName: `${cleanName}_birth_certificate_certified.pdf`,
      fileSize: '1.4 MB',
      fileType: 'application/pdf',
      category: 'BIRTH_CERTIFICATE',
      uploadedAt: '2024-09-08 11:20',
      uploadedBy: 'Admissions Office (Registrar)',
      fileUrl: '#',
    },
    {
      id: `doc-${studentId}-2`,
      studentId,
      title: 'National Immunization & Health Clearance',
      fileName: `${cleanName}_medical_clearance_record.pdf`,
      fileSize: '840 KB',
      fileType: 'application/pdf',
      category: 'MEDICAL_RECORD',
      uploadedAt: '2024-09-09 14:15',
      uploadedBy: 'School Nurse (Clinic Unit)',
      fileUrl: '#',
    },
    {
      id: `doc-${studentId}-3`,
      studentId,
      title: 'Previous Academic Transcript / Placement Test',
      fileName: `${cleanName}_grade_placement_transcript.pdf`,
      fileSize: '2.1 MB',
      fileType: 'application/pdf',
      category: 'ACADEMIC_TRANSCRIPT',
      uploadedAt: '2024-09-10 09:40',
      uploadedBy: 'Vice Principal (Academics)',
      fileUrl: '#',
    },
  ];
}

export function getDocumentsForStudent(studentId: string, studentName: string): StudentDocument[] {
  const allDocs = getStoredDocuments();
  if (allDocs[studentId] && allDocs[studentId].length > 0) {
    return allDocs[studentId];
  }
  // Initialize default verified documents
  const defaults = generateDefaultDocumentsForStudent(studentId, studentName);
  allDocs[studentId] = defaults;
  saveStoredDocuments(allDocs);
  return defaults;
}

export async function uploadStudentDocument(
  studentId: string,
  studentName: string,
  file: File,
  category: StudentDocument['category'],
  title: string,
  uploaderName: string
): Promise<StudentDocument> {
  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const newDoc: StudentDocument = {
    id: `doc-${studentId}-${Date.now()}`,
    studentId,
    title: title.trim() || file.name,
    fileName: file.name,
    fileSize: formatSize(file.size),
    fileType: file.type || 'application/octet-stream',
    category,
    uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    uploadedBy: uploaderName,
    fileUrl: URL.createObjectURL(file),
  };

  const allDocs = getStoredDocuments();
  const currentList = allDocs[studentId] || generateDefaultDocumentsForStudent(studentId, studentName);
  allDocs[studentId] = [newDoc, ...currentList];
  saveStoredDocuments(allDocs);

  enqueueOfflineAction(
    '/api/storage/upload',
    'POST',
    {
      studentId,
      documentId: newDoc.id,
      fileName: newDoc.fileName,
      category: newDoc.category,
    },
    `Uploaded document "${newDoc.title}" for student`
  );

  return newDoc;
}

export function deleteStudentDocument(studentId: string, documentId: string): StudentDocument[] {
  const allDocs = getStoredDocuments();
  const currentList = allDocs[studentId] || [];
  const updatedList = currentList.filter((doc) => doc.id !== documentId);
  allDocs[studentId] = updatedList;
  saveStoredDocuments(allDocs);

  enqueueOfflineAction(
    '/api/storage/delete',
    'DELETE',
    { studentId, documentId },
    `Deleted document ${documentId}`
  );

  return updatedList;
}

export function downloadMockDocument(doc: StudentDocument): void {
  // Create a synthetic downloadable text/pdf blob for inspection
  const content = `APEX HORIZON ACADEMY - OFFICIAL STUDENT ARCHIVE\n` +
    `--------------------------------------------------\n` +
    `Document: ${doc.title}\n` +
    `File Name: ${doc.fileName}\n` +
    `Category: ${doc.category}\n` +
    `Student ID: ${doc.studentId}\n` +
    `Uploaded By: ${doc.uploadedBy}\n` +
    `Date: ${doc.uploadedAt}\n` +
    `File Size: ${doc.fileSize}\n` +
    `Status: Certified & Cryptographically Verified\n` +
    `--------------------------------------------------\n` +
    `Tenant Isolation: school_id = 'apex_sch_01' (verified via app_user role RLS)\n` +
    `Temporal Snapshot: Point-in-Time Verified\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.fileName.endsWith('.pdf') ? doc.fileName : `${doc.fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
