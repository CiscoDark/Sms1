import React from 'react';
import {
  BookOpen,
  FileCheck,
  GraduationCap,
  Users,
  Eye,
  Coffee,
  MapPin,
  AlertCircle,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { TeacherPersonalBlock, TeacherActivityType } from '../../types';
import { ACTIVITY_TYPE_CONFIG } from '../../lib/teacher-timetable-store';

interface TeacherPersonalBlockCardProps {
  block: TeacherPersonalBlock;
  onEdit: (block: TeacherPersonalBlock) => void;
  onDelete: (blockId: string) => void;
  onDragStart?: (e: React.DragEvent, block: TeacherPersonalBlock) => void;
  isDragging?: boolean;
}

const ACTIVITY_ICONS: Record<TeacherActivityType, React.ElementType> = {
  CLASS_LESSON: BookOpen,
  PREP_PLANNING: Sparkles,
  MARKING_GRADING: FileCheck,
  STUDENT_MENTORING: GraduationCap,
  MEETING: Users,
  SUPERVISION: Eye,
  PERSONAL: Coffee,
};

const COLOR_MAP: Record<
  TeacherPersonalBlock['colorTheme'],
  { bg: string; border: string; text: string; badge: string }
> = {
  indigo: {
    bg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/70',
    text: 'text-indigo-950 dark:text-indigo-100',
    badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
  },
  violet: {
    bg: 'bg-purple-50/90 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/70',
    text: 'text-purple-950 dark:text-purple-100',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
  },
  emerald: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/70',
    text: 'text-emerald-950 dark:text-emerald-100',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50/90 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/70',
    text: 'text-amber-950 dark:text-amber-100',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
  },
  rose: {
    bg: 'bg-rose-50/90 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/70',
    text: 'text-rose-950 dark:text-rose-100',
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
  },
  sky: {
    bg: 'bg-sky-50/90 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/70',
    text: 'text-sky-950 dark:text-sky-100',
    badge: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300',
  },
  teal: {
    bg: 'bg-teal-50/90 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800/70',
    text: 'text-teal-950 dark:text-teal-100',
    badge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300',
  },
  orange: {
    bg: 'bg-orange-50/90 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800/70',
    text: 'text-orange-950 dark:text-orange-100',
    badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300',
  },
  cyan: {
    bg: 'bg-cyan-50/90 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800/70',
    text: 'text-cyan-950 dark:text-cyan-100',
    badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300',
  },
};

export const TeacherPersonalBlockCard: React.FC<TeacherPersonalBlockCardProps> = ({
  block,
  onEdit,
  onDelete,
  onDragStart,
  isDragging = false,
}) => {
  const IconComponent = ACTIVITY_ICONS[block.activityType] || BookOpen;
  const activityConfig = ACTIVITY_TYPE_CONFIG[block.activityType] || ACTIVITY_TYPE_CONFIG.PERSONAL;
  const colors = COLOR_MAP[block.colorTheme] || COLOR_MAP.indigo;

  // Non-blocking conflict styling: Subtle red highlight if overlap exists
  const hasOverlap = block.hasOfficialClassOverlap;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, block)}
      className={`group relative rounded-xl border p-2.5 transition-all cursor-grab active:cursor-grabbing select-none shadow-xs hover:shadow-md ${
        colors.bg
      } ${
        hasOverlap
          ? 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/40 dark:ring-rose-900/40'
          : colors.border
      } ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
    >
      {/* Top Badges: Activity Type & Badges */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border ${activityConfig.badgeColor}`}
        >
          <IconComponent className="w-3 h-3" />
          <span>{activityConfig.label}</span>
        </span>

        <div className="flex items-center gap-1">
          {block.importedFromClassTimetable && (
            <span
              title="Imported from official Class Timetable (Independent copy)"
              className="text-[9px] font-semibold px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Class Lesson
            </span>
          )}

          {/* Non-blocking subtle red badge */}
          {hasOverlap && (
            <span
              title={
                block.officialOverlapDetails
                  ? `Informational Overlap: Officially assigned to teach ${block.officialOverlapDetails.subjectName} in ${block.officialOverlapDetails.room}. Non-blocking.`
                  : 'Informational overlap with official class timetable. Non-blocking.'
              }
              className="flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
            >
              <AlertCircle className="w-2.5 h-2.5" />
              <span>Overlap</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Title */}
      <div className={`font-bold text-xs leading-snug line-clamp-2 ${colors.text}`}>
        {block.title}
      </div>

      {/* Class context if teaching */}
      {block.classContext && (
        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
          {block.classContext.levelName} {block.classContext.armName}
        </div>
      )}

      {/* Location / Room */}
      {block.room && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{block.room}</span>
        </div>
      )}

      {/* Personal Notes Preview */}
      {block.notes && (
        <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 italic bg-white/50 dark:bg-slate-900/40 p-1 rounded">
          {block.notes}
        </div>
      )}

      {/* Informational Overlap details note banner if present */}
      {hasOverlap && block.officialOverlapDetails && (
        <div className="mt-1.5 p-1 rounded bg-rose-100/70 dark:bg-rose-950/40 text-[9px] text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 leading-tight">
          <span className="font-semibold">Official Duty:</span> {block.officialOverlapDetails.subjectName} ({block.officialOverlapDetails.levelName} {block.officialOverlapDetails.armName})
        </div>
      )}

      {/* Floating Action Controls on Hover */}
      <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(block);
          }}
          className="p-1 rounded text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Edit Personal Planning Block"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          className="p-1 rounded text-slate-600 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Delete Personal Block"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
