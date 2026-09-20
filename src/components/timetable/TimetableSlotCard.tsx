import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, MapPin, User, GripVertical, Lock } from 'lucide-react';
import { ClassTimetableSlot } from '../../types';

interface TimetableSlotCardProps {
  slot: ClassTimetableSlot;
  canEdit: boolean;
  onEdit: (slot: ClassTimetableSlot) => void;
  onDelete: (slotId: string) => void;
  onDragStart?: (e: React.DragEvent, slot: ClassTimetableSlot) => void;
  isDragging?: boolean;
}

const COLOR_MAP: Record<
  ClassTimetableSlot['colorTheme'],
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
  }
> = {
  indigo: {
    bg: 'bg-indigo-50/70 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    text: 'text-indigo-950 dark:text-indigo-100',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
    accent: 'border-l-indigo-600',
  },
  violet: {
    bg: 'bg-purple-50/70 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800/60',
    text: 'text-purple-950 dark:text-purple-100',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60',
    badgeText: 'text-purple-800 dark:text-purple-200',
    accent: 'border-l-purple-600',
  },
  emerald: {
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-950 dark:text-emerald-100',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    accent: 'border-l-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50/70 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-950 dark:text-amber-100',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
    badgeText: 'text-amber-800 dark:text-amber-200',
    accent: 'border-l-amber-500',
  },
  rose: {
    bg: 'bg-rose-50/70 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/60',
    text: 'text-rose-950 dark:text-rose-100',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
    badgeText: 'text-rose-800 dark:text-rose-200',
    accent: 'border-l-rose-500',
  },
  sky: {
    bg: 'bg-sky-50/70 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800/60',
    text: 'text-sky-950 dark:text-sky-100',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/60',
    badgeText: 'text-sky-800 dark:text-sky-200',
    accent: 'border-l-sky-500',
  },
  teal: {
    bg: 'bg-teal-50/70 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/60',
    text: 'text-teal-950 dark:text-teal-100',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/60',
    badgeText: 'text-teal-800 dark:text-teal-200',
    accent: 'border-l-teal-500',
  },
  orange: {
    bg: 'bg-orange-50/70 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800/60',
    text: 'text-orange-950 dark:text-orange-100',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/60',
    badgeText: 'text-orange-800 dark:text-orange-200',
    accent: 'border-l-orange-500',
  },
  cyan: {
    bg: 'bg-cyan-50/70 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    text: 'text-cyan-950 dark:text-cyan-100',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/60',
    badgeText: 'text-cyan-800 dark:text-cyan-200',
    accent: 'border-l-cyan-500',
  },
};

export const TimetableSlotCard: React.FC<TimetableSlotCardProps> = ({
  slot,
  canEdit,
  onEdit,
  onDelete,
  onDragStart,
  isDragging = false,
}) => {
  const colors = COLOR_MAP[slot.colorTheme] || COLOR_MAP.indigo;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      draggable={canEdit}
      onDragStart={(e) => onDragStart && onDragStart(e as unknown as React.DragEvent, slot)}
      className={`group relative rounded-xl border border-l-4 ${colors.accent} ${colors.border} ${colors.bg} p-2.5 sm:p-3 transition-all shadow-2xs ${
        canEdit
          ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-400/80 dark:hover:border-slate-600'
          : 'cursor-default'
      }`}
    >
      {/* Header: Subject Code & Action Buttons */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${colors.badgeBg} ${colors.badgeText} tracking-wider`}
        >
          {slot.subjectCode}
        </span>

        {canEdit ? (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(slot);
              }}
              title="Edit Slot Assignment"
              className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(slot.id);
              }}
              title="Remove Slot"
              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          </div>
        ) : (
          <span title="Official Published Schedule (Read-Only)">
            <Lock className="w-3 h-3 text-slate-400" />
          </span>
        )}
      </div>

      {/* Subject Title */}
      <h4
        className={`text-xs font-bold leading-snug line-clamp-2 ${colors.text} mb-2`}
        title={slot.subjectName}
      >
        {slot.subjectName}
      </h4>

      {/* Meta Info: Teacher & Room */}
      <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
        <div className="flex items-center gap-1.5 truncate" title={`Educator: ${slot.teacherName}`}>
          <User className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{slot.teacherName}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate" title={`Classroom/Lab: ${slot.room}`}>
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate text-slate-500 dark:text-slate-400">{slot.room}</span>
        </div>
      </div>
    </motion.div>
  );
};
