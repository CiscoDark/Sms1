import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Student, StudentDocument, UserProfile } from '../../types';
import { DOCUMENT_CATEGORIES, uploadStudentDocument } from '../../lib/file-storage';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentUser: UserProfile;
  onDocumentUploaded: (newDoc: StudentDocument) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
  onDocumentUploaded,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<StudentDocument['category']>('ACADEMIC_TRANSCRIPT');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentTitle) {
        // Strip extension for title
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setDocumentTitle(nameWithoutExt);
      }
      setErrorMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!documentTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setDocumentTitle(nameWithoutExt);
      }
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or drop a document to upload.');
      return;
    }

    if (!documentTitle.trim()) {
      setErrorMessage('Please enter a descriptive title for this document.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      const studentFullName = `${student.firstName} ${student.lastName}`;
      const doc = await uploadStudentDocument(
        student.id,
        studentFullName,
        selectedFile,
        category,
        documentTitle,
        `${currentUser.name} (${currentUser.title || currentUser.role})`
      );

      onDocumentUploaded(doc);
      onClose();
    } catch (err) {
      console.error('Failed to upload document', err);
      setErrorMessage('Failed to save document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Student Document"
      description={`Attach verified statutory or academic records to ${student.firstName} ${student.lastName}'s permanent vault.`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            isLoading={isUploading}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Upload to Vault
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Document Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as StudentDocument['category'])}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title input */}
        <div>
          <Input
            label="Document Title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="e.g. Certified JSS 1 Entrance Transcript"
            helperText="Clear label for audit and promotion dossiers"
          />
        </div>

        {/* Drag & Drop Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            File Attachment (PDF, JPG, PNG, WEBP - Max 15MB)
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another to replace
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Drag and drop student document here, or{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                    browse files
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports statutory certificates, academic transcripts, and clinical reports
                </div>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
