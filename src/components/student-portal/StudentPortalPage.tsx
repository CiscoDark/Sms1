import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Bell,
  Calendar,
  FileText,
  Award,
  Clock,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  User,
  Check,
  Eye,
  Megaphone,
  BookOpen,
} from 'lucide-react';
import { Student, ReportCardSnapshot, StudentAnnouncementItem, UserProfile } from '../../types';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { getAllPublishedReportCards } from '../../lib/report-card-store';
import { getAnnouncements, markAnnouncementAsRead } from '../../lib/announcements-store';
import { ReportCardDocumentModal } from '../report-cards/ReportCardDocumentModal';

interface StudentPortalPageProps {
  students: Student[];
  currentUser: UserProfile;
  onOpenPublicVerification?: (uuid: string) => void;
}

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  students,
  currentUser,
  onOpenPublicVerification,
}) => {
  // Select which student is active in the portal view
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'std-001'
  );

  const [activeTab, setActiveTab] = useState<'results' | 'announcements' | 'timetable'>('results');
  const [announcementFilter, setAnnouncementFilter] = useState<'ALL' | 'SCHOOL_WIDE' | 'CLASS_LEVEL' | 'ACADEMIC'>('ALL');
  const [searchAnnouncements, setSearchAnnouncements] = useState('');

  // Selected report card modal
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCardSnapshot | null>(null);

  // Data fetching
  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const allReportCards = getAllPublishedReportCards();
  const studentReportCards = allReportCards.filter((rc) => rc.studentId === activeStudent?.id);
  const [announcements, setAnnouncements] = useState<StudentAnnouncementItem[]>(() => getAnnouncements());

  // Mark announcement as read
  const handleToggleRead = (annId: string) => {
    if (!activeStudent) return;
    markAnnouncementAsRead(annId, activeStudent.id);
    setAnnouncements(getAnnouncements());
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    // Filter by scope/category
    if (announcementFilter === 'SCHOOL_WIDE' && ann.scope !== 'SCHOOL_WIDE') return false;
    if (announcementFilter === 'CLASS_LEVEL' && ann.scope !== 'CLASS_LEVEL') return false;
    if (announcementFilter === 'ACADEMIC' && ann.category !== 'ACADEMIC' && ann.category !== 'EXAM') return false;

    // Search query
    if (searchAnnouncements.trim()) {
      const q = searchAnnouncements.toLowerCase();
      return ann.title.toLowerCase().includes(q) || ann.content.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = announcements.filter(
    (ann) => !ann.readBy?.includes(activeStudent?.id || '')
  ).length;

  if (!activeStudent) {
    return (
      <div className="p-8 text-center text-slate-500">
        No enrolled student record found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Dossier Banner & View Switcher */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Student Photo */}
            <div className="w-20 h-24 rounded-2xl bg-slate-800 border-2 border-indigo-400/30 overflow-hidden flex items-center justify-center shrink-0 shadow-lg text-indigo-300">
              {activeStudent.avatarUrl ? (
                <img
                  src={activeStudent.avatarUrl}
                  alt={activeStudent.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black">
                  {activeStudent.firstName[0]}
                  {activeStudent.lastName[0]}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  View-Only Student Portal
                </span>
                <span className="text-xs text-indigo-300 font-mono">
                  {activeStudent.admissionNumber}
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white">
                {activeStudent.firstName} {activeStudent.middleName ? `${activeStudent.middleName} ` : ''}
                {activeStudent.lastName}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200">
                <span>Class: <strong>{activeStudent.classLevel} - {activeStudent.classArm}</strong></span>
                <span>•</span>
                <span>Term: <strong>Third Term (2024/2025)</strong></span>
                <span>•</span>
                <span>Gender: <strong>{activeStudent.gender === 'M' ? 'Male' : 'Female'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Switcher (Useful for Testing & Parents) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-xs">
            <span className="text-indigo-200 font-medium">Switch Student:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-900/90 text-white rounded-lg px-3 py-1.5 border border-indigo-400/30 outline-hidden font-semibold cursor-pointer"
            >
              {students.slice(0, 15).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.classLevel} - {s.classArm})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Portal Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/40 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-indigo-300 uppercase">Released Transcripts</div>
            <div className="text-base font-bold text-white mt-0.5">
              {studentReportCards.length} Report Cards
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-indigo-300 uppercase">Current Session GPA</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {studentReportCards[0]?.overallGpa.toFixed(2) || '3.85'} / 4.00
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-indigo-300 uppercase">Session Attendance</div>
            <div className="text-base font-bold text-teal-300 mt-0.5">
              {studentReportCards[0]?.attendanceRate || 98.4}% Present
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-indigo-300 uppercase">Promotion Status</div>
            <div className="text-base font-bold text-amber-300 mt-0.5 uppercase">
              {studentReportCards[0]?.promotionDecision || 'Promoted'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Released Results & Report Cards</span>
          {studentReportCards.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {studentReportCards.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements Feed</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'timetable'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Class Timetable (View-Only)</span>
        </button>
      </div>

      {/* Tab 1: Released Results & Report Cards */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Verified Academic Report Cards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official terminal report cards with immutable cryptographic QR credentials
              </p>
            </div>

            <Badge variant="primary" size="sm">
              Point-in-Time Frozen Snapshots (Invariant #2)
            </Badge>
          </div>

          {studentReportCards.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Published Report Cards Yet
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Teachers and the academic board are currently compiling terminal assessment scores. As soon as report cards are signed off and published, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {studentReportCards.map((rc) => (
                <motion.div
                  key={rc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all space-y-5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                          {rc.termName} • {rc.sessionYear}
                        </span>
                        <span className="text-xs text-slate-400">
                          Class: <strong>{rc.classLevel} - {rc.classArm}</strong>
                        </span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        Aggregate: {rc.averagePercentage}% • Grade {rc.overallGrade} (Rank #{rc.positionInArm} of {rc.totalInArm})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenPublicVerification?.(rc.credentialUuid)}
                        leftIcon={<QrCode className="w-4 h-4 text-indigo-600" />}
                      >
                        Verify QR
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedReportCard(rc)}
                        leftIcon={<FileText className="w-4 h-4" />}
                      >
                        View & Print Official Report Card
                      </Button>
                    </div>
                  </div>

                  {/* Subject Scores Preview Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <tr>
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-2 text-center">CA 1 (20)</th>
                          <th className="py-2 px-2 text-center">CA 2 (20)</th>
                          <th className="py-2 px-2 text-center">Exam (60)</th>
                          <th className="py-2 px-2 text-center">Total (100)</th>
                          <th className="py-2 px-2 text-center">Grade</th>
                          <th className="py-2 px-3">Teacher Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rc.subjects.map((sub, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {sub.subjectName}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">
                              {sub.ca1Score ?? '—'}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">
                              {sub.ca2Score ?? '—'}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">
                              {sub.examScore ?? '—'}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-indigo-600 dark:text-indigo-400">
                              {sub.totalScore ?? '—'}%
                            </td>
                            <td className="py-2.5 px-2 text-center font-black">
                              <span className={sub.grade.startsWith('A') ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}>
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                              {sub.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks & Sign-off summary */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Form Teacher's Official Remark:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        "{rc.teacherRemarks}"
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Signed & Sealed
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Announcements Feed */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                School & Class Announcements Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official notices from school administration, teachers, and department heads
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'All Notices' },
                { id: 'SCHOOL_WIDE', label: 'School-Wide' },
                { id: 'CLASS_LEVEL', label: activeStudent.classLevel },
                { id: 'ACADEMIC', label: 'Academics & Exams' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAnnouncementFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    announcementFilter === f.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements Feed List */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAnnouncements.map((ann) => {
                const isRead = ann.readBy?.includes(activeStudent.id);

                return (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`p-5 rounded-2xl border transition-all ${
                      ann.isPinned
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
                        : isRead
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {ann.isPinned && (
                          <Badge variant="primary" size="sm">
                            Pinned Notice
                          </Badge>
                        )}
                        <Badge
                          variant={
                            ann.category === 'ACADEMIC'
                              ? 'primary'
                              : ann.category === 'EVENT'
                              ? 'success'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {ann.category}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {ann.scope === 'SCHOOL_WIDE' ? 'School-Wide' : ann.targetLevel || 'Class-Specific'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleToggleRead(ann.id)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                            isRead
                              ? 'text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800'
                              : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100'
                          }`}
                        >
                          {isRead ? 'Mark as Unread' : 'Mark as Read'}
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                      {ann.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ann.content}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Posted by: <strong className="text-slate-600 dark:text-slate-300">{ann.authorName}</strong> ({ann.authorRole})
                      </span>
                      {!isRead && (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                          Unread
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Tab 3: Class Timetable (View-Only) */}
      {activeTab === 'timetable' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Official Class Timetable: {activeStudent.classLevel} - {activeStudent.classArm}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Class schedule curated by School Administration • Read-only for students and parents
              </p>
            </div>

            <Badge variant="neutral" size="sm">
              View-Only Access
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 text-left">Period / Time</th>
                  <th className="py-2.5 px-3">Monday</th>
                  <th className="py-2.5 px-3">Tuesday</th>
                  <th className="py-2.5 px-3">Wednesday</th>
                  <th className="py-2.5 px-3">Thursday</th>
                  <th className="py-2.5 px-3">Friday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {[
                  { time: '08:00 - 08:45', mon: 'Mathematics', tue: 'English Lang', wed: 'Basic Science', thu: 'Civic Education', fri: 'Physical Education' },
                  { time: '08:45 - 09:30', mon: 'English Lang', tue: 'Mathematics', wed: 'Social Studies', thu: 'Agricultural Sci', fri: 'French Language' },
                  { time: '09:30 - 10:15', mon: 'Basic Tech', tue: 'Business Studies', wed: 'Mathematics', thu: 'English Lang', fri: 'Music & Arts' },
                  { time: '10:15 - 10:45', mon: 'RECESS / BREAK', tue: 'RECESS / BREAK', wed: 'RECESS / BREAK', thu: 'RECESS / BREAK', fri: 'RECESS / BREAK', isBreak: true },
                  { time: '10:45 - 11:30', mon: 'Integrated Science', tue: 'Computer Studies', wed: 'Home Economics', thu: 'Mathematics', fri: 'Club Activities' },
                  { time: '11:30 - 12:15', mon: 'Christian Rel. Studies', tue: 'Civic Studies', wed: 'Intro Tech', thu: 'Biology', fri: 'Assembly / Dismissal' },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row.isBreak
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 font-bold text-amber-800 dark:text-amber-300'
                        : idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/50 dark:bg-slate-800/30'
                    }
                  >
                    <td className="py-3 px-3 text-left font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {row.time}
                    </td>
                    <td className="py-3 px-3">{row.mon}</td>
                    <td className="py-3 px-3">{row.tue}</td>
                    <td className="py-3 px-3">{row.wed}</td>
                    <td className="py-3 px-3">{row.thu}</td>
                    <td className="py-3 px-3">{row.fri}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Report Card PDF Modal */}
      {selectedReportCard && (
        <ReportCardDocumentModal
          isOpen={!!selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
          reportCard={selectedReportCard}
          onOpenPublicVerification={onOpenPublicVerification}
        />
      )}
    </div>
  );
};
