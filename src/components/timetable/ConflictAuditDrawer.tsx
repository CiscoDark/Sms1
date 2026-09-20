import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  DoorClosed,
  UserCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TimetableConflict, ClassLevel } from '../../types';
import { Badge, Button } from '../../design-system';

interface ConflictAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: TimetableConflict[];
  onSelectClass: (levelId: string, armId: string) => void;
  levels: ClassLevel[];
}

export const ConflictAuditDrawer: React.FC<ConflictAuditDrawerProps> = ({
  isOpen,
  onClose,
  conflicts,
  onSelectClass,
  levels,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'TEACHER' | 'ROOM'>('ALL');

  const filtered = conflicts.filter((c) => {
    if (filterType === 'TEACHER') return c.type === 'TEACHER_DOUBLE_BOOKED';
    if (filterType === 'ROOM') return c.type === 'ROOM_DOUBLE_BOOKED';
    return true;
  });

  const findLevelIdForArm = (armId: string) => {
    for (const lvl of levels) {
      if (lvl.arms.some((a) => a.id === armId)) return lvl.id;
    }
    return levels[0]?.id || '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Timetable Conflict Audit Dossier
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  School-wide double-booking conflict detection engine (Rule #2 Decoupled).
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    filterType === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All ({conflicts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('TEACHER')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    filterType === 'TEACHER'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Teacher Clashes (
                  {conflicts.filter((c) => c.type === 'TEACHER_DOUBLE_BOOKED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('ROOM')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    filterType === 'ROOM'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Room Clashes (
                  {conflicts.filter((c) => c.type === 'ROOM_DOUBLE_BOOKED').length})
                </button>
              </div>

              <Badge
                variant={conflicts.length === 0 ? 'success' : 'danger'}
                size="sm"
              >
                {conflicts.length === 0 ? '0 Collisions' : `${conflicts.length} Violations`}
              </Badge>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Perfect Schedule Integrity
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Zero teacher double-bookings and zero room collisions detected across all school class timetables.
                  </p>
                </div>
              ) : (
                filtered.map((item) => {
                  const isTeacher = item.type === 'TEACHER_DOUBLE_BOOKED';
                  const levelAId = findLevelIdForArm(item.firstClass.armId);
                  const levelBId = findLevelIdForArm(item.secondClass.armId);

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                          {isTeacher ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <DoorClosed className="w-4 h-4" />
                          )}
                          {isTeacher ? 'Teacher Collision' : 'Room Collision'}
                        </span>
                        <Badge variant="danger" size="sm">
                          {item.day} • {item.periodLabel}
                        </Badge>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.conflictingEntityName}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Class 1
                          </span>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.firstClass.levelName} {item.firstClass.armName}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {item.firstClass.subjectName}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 w-full text-[11px] h-7"
                            onClick={() => {
                              onSelectClass(levelAId, item.firstClass.armId);
                              onClose();
                            }}
                          >
                            Open Class <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Class 2
                          </span>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.secondClass.levelName} {item.secondClass.armName}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {item.secondClass.subjectName}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 w-full text-[11px] h-7"
                            onClick={() => {
                              onSelectClass(levelBId, item.secondClass.armId);
                              onClose();
                            }}
                          >
                            Open Class <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {item.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Invariant #2: Independent Class Engine</span>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close Audit
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
