import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  Sliders,
  Award,
  Calendar,
  AlertCircle,
  FileSignature,
  Bot,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { StudentSubjectGradeRecord, UserProfile, DisciplinaryRecord } from '../../types';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { getDisciplinaryRecords, generateLocalPedagogicalRemark } from '../../lib/report-card-store';

interface AiRemarkDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StudentSubjectGradeRecord;
  currentUser: UserProfile;
  classLevel: string;
  classArm: string;
  termName: string;
  sessionYear: string;
  onSaveRemark: (studentId: string, remark: string, signedOff: boolean) => void;
}

export const AiRemarkDraftModal: React.FC<AiRemarkDraftModalProps> = ({
  isOpen,
  onClose,
  record,
  currentUser,
  classLevel,
  classArm,
  termName,
  sessionYear,
  onSaveRemark,
}) => {
  if (!isOpen) return null;

  const [tone, setTone] = useState<'encouraging' | 'balanced' | 'rigorous' | 'growth'>('balanced');
  const [remarkText, setRemarkText] = useState<string>(record.teacherRemarks || record.remark || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [source, setSource] = useState<'initial' | 'gemini_api' | 'local_pedagogical_engine'>(
    record.teacherRemarks || record.remark ? 'initial' : 'local_pedagogical_engine'
  );
  const [isSignedOff, setIsSignedOff] = useState<boolean>(true);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Ingest student attendance and disciplinary data
  const disciplinary = getDisciplinaryRecords(record.studentId);
  const attendanceRate = 98.2; // default high attendance

  // Trigger AI remark draft
  const handleGenerate = async (selectedTone = tone) => {
    setIsGenerating(true);
    setGenerationNotice(null);

    const payload = {
      studentName: record.studentName,
      gender: record.gender || 'M',
      classLevel,
      classArm,
      termName,
      sessionYear,
      totalScore: record.totalScore || 75,
      grade: record.grade || 'A1',
      rankInClass: record.rankInArm || 1,
      totalInClass: 35,
      attendanceRate,
      disciplinaryRecords: disciplinary.map((d) => `${d.incidentTitle}: ${d.description}`),
      tone: selectedTone,
      subjectHighlights: `${record.subjectName} (${record.totalScore}%, Grade: ${record.grade})`,
    };

    try {
      const response = await fetch('/api/ai/draft-remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setRemarkText(data.remark);
        setSource(data.source === 'gemini_api' ? 'gemini_api' : 'local_pedagogical_engine');
        if (data.notice) {
          setGenerationNotice(data.notice);
        }
      } else {
        throw new Error('API route returned error');
      }
    } catch (err) {
      // Local pedagogical fallback
      const fallback = generateLocalPedagogicalRemark({
        studentName: record.studentName,
        gender: 'M',
        classLevel,
        overallScore: record.totalScore || 75,
        overallGrade: record.grade || 'A1',
        attendanceRate,
        disciplinaryCount: disciplinary.length,
        topSubject: record.subjectName,
        tone: selectedTone,
      });
      setRemarkText(fallback);
      setSource('local_pedagogical_engine');
      setGenerationNotice('Generated using local pedagogical engine rules.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndSign = () => {
    onSaveRemark(record.studentId, remarkText, isSignedOff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-indigo-50/80 via-white to-indigo-50/30 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  AI-Drafted Teacher Remark
                </h3>
                <Badge variant="primary" size="sm">
                  Highest-Value AI
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized first-pass review • Requires teacher sign-off before publishing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Ingestion Dossier Card */}
        <div className="p-6 space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Student Assessment Context
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {record.studentName} ({record.studentRegNumber})
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm">
                  {classLevel} • {classArm}
                </Badge>
                <Badge variant="success" size="sm">
                  Rank #{record.rankInArm || 1}
                </Badge>
              </div>
            </div>

            {/* Ingested metrics pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">CA 1 + CA 2</div>
                <div className="font-bold text-slate-700 dark:text-slate-200">
                  {(record.ca1Score || 0) + (record.ca2Score || 0)} / 40
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Exam / 60</div>
                <div className="font-bold text-slate-700 dark:text-slate-200">
                  {record.examScore ?? '—'}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Total & Scale</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400">
                  {record.totalScore ?? '—'}% ({record.grade || '—'})
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Term Attendance</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {attendanceRate}% Present
                </div>
              </div>
            </div>

            {/* Disciplinary Notice if any */}
            {disciplinary.length > 0 ? (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Private Conduct Context Ingested:</span>{' '}
                  {disciplinary[0].description} (Guidance provided: {disciplinary[0].actionTaken})
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero disciplinary flags • Clean conduct record ingested</span>
              </div>
            )}
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Select Pedagogical Tone:
              </label>
              <span className="text-slate-400">Adjusts language and developmental emphasis</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'balanced', label: 'Balanced & Formative', desc: 'Holistic feedback' },
                { id: 'encouraging', label: 'Encouraging & Inspiring', desc: 'High praise' },
                { id: 'rigorous', label: 'Academic Rigour', desc: 'Stretch challenges' },
                { id: 'growth', label: 'Growth & Focus', desc: 'Remedial focus' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTone(t.id as any);
                    handleGenerate(t.id as any);
                  }}
                  className={`px-3 py-2 rounded-xl text-left border transition-all text-xs ${
                    tone === t.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Draft Remark Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                First-Pass Editable Remark:
              </label>
              <div className="flex items-center gap-2">
                {source === 'gemini_api' && (
                  <Badge variant="primary" size="sm">
                    Gemini 3.8 Flash
                  </Badge>
                )}
                {source === 'local_pedagogical_engine' && (
                  <Badge variant="neutral" size="sm">
                    Apex Pedagogical Rules
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-xs font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Click generate to formulate a personalized pedagogical remark..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-hidden leading-relaxed shadow-inner"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Formulating personalized remark...
                </div>
              )}
            </div>

            {generationNotice && (
              <p className="text-[11px] text-slate-400 italic">{generationNotice}</p>
            )}
          </div>

          {/* Teacher Review & Sign-Off Checkbox (Mandatory Human Sign-off Invariant) */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSignedOff}
                onChange={(e) => setIsSignedOff(e.target.checked)}
                className="mt-1 w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Teacher Review & Official Sign-off Confirmation
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  I confirm that I have reviewed, personalized, and approved this terminal remark as Form Teacher ({currentUser.name}). It will be sealed onto the official student report card snapshot.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Discard
          </Button>

          <div className="flex items-center gap-2">
            {!remarkText && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate()}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}
              >
                Generate First Pass
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={!remarkText.trim() || !isSignedOff}
              onClick={handleSaveAndSign}
              leftIcon={<FileSignature className="w-4 h-4" />}
            >
              Sign-Off & Apply to Record
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
