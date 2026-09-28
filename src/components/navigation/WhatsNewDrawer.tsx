import React from 'react';
import {
  Sparkles,
  WifiOff,
  Database,
  Briefcase,
  AlertCircle,
  CreditCard,
  QrCode,
  Calendar,
  FileCheck,
  GraduationCap,
  Users,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Drawer } from '../../design-system/components/Drawer';
import { Badge } from '../../design-system/components/Badge';

interface WhatsNewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangelogEntry {
  version: string;
  title: string;
  badge: string;
  date: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: 'v1.26',
    title: 'Offline Sync & Visual Conflict Resolution',
    badge: 'Step 25',
    date: 'Latest',
    description: 'Enables teachers to take roll calls and enter grades completely disconnected. Changes queue locally with non-silent conflict resolution and visual diff badges.',
    icon: <WifiOff className="w-4 h-4 text-amber-500" />,
    highlights: [
      'Indexed write queue with automatic connectivity detection',
      'Cell-level diff badges comparing local draft vs remote server edits',
      'One-click conflict resolution (Keep Local, Keep Remote, Custom override)',
    ],
  },
  {
    version: 'v1.24',
    title: 'Data Export & Cloud Backup Snapshots',
    badge: 'Step 24',
    date: 'Recent',
    description: 'Enterprise data resilience with automated cloud backup schedules, SHA-256 integrity checksums, and full JSON/SQL export generators.',
    icon: <Database className="w-4 h-4 text-emerald-500" />,
    highlights: [
      'Multi-domain export (Students, Finance, Payroll, Academics)',
      'Automated daily/weekly cloud backup cron simulation',
      'One-click JSON database dump and table verification',
    ],
  },
  {
    version: 'v1.23',
    title: 'Staff Payroll, Allowances & PAYE Tax',
    badge: 'Step 23',
    date: 'Recent',
    description: 'Comprehensive compensation engine managing basic salaries, statutory allowances, unexcused absence deductions, pension, and PAYE tax computation.',
    icon: <Briefcase className="w-4 h-4 text-indigo-500" />,
    highlights: [
      'Nigerian PAYE tax bracket progressive calculation',
      'Absence penalty calculation tied to faculty attendance records',
      'Printable and downloadable staff payslips',
    ],
  },
  {
    version: 'v1.21',
    title: 'Disciplinary Incident Tracker & Merits',
    badge: 'Step 21',
    date: 'Recent',
    description: 'Structured behavioral intervention logging with severity grading, merit/demerit point balance, and parent notification workflows.',
    icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
    highlights: [
      'Incident severity tiers (Minor, Moderate, Severe, Critical)',
      'Merit score tracking directly reflected in student profiles',
      'Disciplinary hearing and probation status workflows',
    ],
  },
  {
    version: 'v1.20',
    title: 'Fee Management & Multi-Category Invoicing',
    badge: 'Step 20',
    date: 'Recent',
    description: 'End-to-end tuition, boarding, uniform, and laboratory fee structures with discount scholarship schemes and payment receipts.',
    icon: <CreditCard className="w-4 h-4 text-teal-500" />,
    highlights: [
      'Automatic invoice generation per education category band',
      'Scholarship, sibling, and staff fee discount allowances',
      'Direct partial payment recording with auto-issued PDF receipt preview',
    ],
  },
  {
    version: 'v1.19',
    title: 'Privacy-Scoped Public QR Credential Verification',
    badge: 'Step 19',
    date: 'Recent',
    description: 'Architectural Invariant #4: Public verification endpoint (/verify-credential/[uuid]) completely isolated from student financial, guardian, and disciplinary details.',
    icon: <QrCode className="w-4 h-4 text-purple-500" />,
    highlights: [
      'Publicly accessible route without authentication requirements',
      'Strict data sanitization hiding fees, phone numbers, and conduct remarks',
      'Accreditation cryptographic verification seals',
    ],
  },
  {
    version: 'v1.13',
    title: 'Decoupled Class & Teacher Timetables',
    badge: 'Step 13',
    date: 'Recent',
    description: 'Architectural Invariant #2: Institutional class timetables and teacher personal availability schedules operate as decoupled subsystems.',
    icon: <Calendar className="w-4 h-4 text-sky-500" />,
    highlights: [
      'Class stream room and period matrix',
      'Teacher personal unavailable blockout times',
      'Automatic conflict auditor flagging room or teacher overlaps',
    ],
  },
  {
    version: 'v1.10',
    title: 'Temporal Immutability & Report Card Snapshots',
    badge: 'Step 10',
    date: 'Recent',
    description: 'Architectural Invariant #3: Historical report cards and class names use point-in-time JSON snapshots that never mutate if classes are renamed in subsequent years.',
    icon: <FileCheck className="w-4 h-4 text-blue-500" />,
    highlights: [
      'Frozen historical academic transcripts',
      'Principal and Form Master signature accreditation',
      'Print-ready high-contrast report card generation',
    ],
  },
];

export const WhatsNewDrawer: React.FC<WhatsNewDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="What's New in Apex Horizon SMS"
      width="xl"
    >
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 backdrop-blur-md border border-indigo-200/60 dark:border-indigo-800/60 flex items-start gap-3 shadow-[0_4px_16px_rgba(99,102,241,0.06)]">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
            <strong>Demonstration Prototype Changelog</strong>: This application showcases a full-featured
            school management suite built with React 18+, Tailwind CSS, Framer Motion, and offline-first
            state machines. Review the recently completed architectural milestones below.
          </div>
        </div>

        <div className="space-y-4">
          {CHANGELOG_ENTRIES.map((entry) => (
            <div
              key={entry.version}
              className="p-4 rounded-2xl border border-white/70 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] space-y-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 shadow-2xs">
                    {entry.icon}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {entry.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {entry.badge}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-400">
                    {entry.version}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {entry.description}
              </p>

              <div className="space-y-1 pt-1 border-t border-white/40 dark:border-white/6">
                {entry.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
};
