import React, { useState } from 'react';
import { HeatmapDayCell, getClassHeatmapCells, getStudentHeatmapCells } from '../../lib/attendance/attendance-store';
import { Calendar, Info, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';

interface AttendanceHeatmapCalendarProps {
  mode: 'CLASS' | 'STUDENT';
  classLevel?: string;
  classArm?: string;
  studentId?: string;
  studentName?: string;
  weeks?: number;
}

export const AttendanceHeatmapCalendar: React.FC<AttendanceHeatmapCalendarProps> = ({
  mode,
  classLevel = 'JSS 1',
  classArm = 'Diamond',
  studentId,
  studentName,
  weeks = 12,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDayCell | null>(null);

  const cells: HeatmapDayCell[] =
    mode === 'STUDENT' && studentId
      ? getStudentHeatmapCells(studentId, weeks)
      : getClassHeatmapCells(classLevel, classArm, weeks);

  // Group cells into 7-day columns (Monday to Sunday)
  const columns: HeatmapDayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }

  // Weekday labels (Mon to Fri school days, plus weekends)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Helper for cell color in CLASS mode
  const getClassCellColor = (cell: HeatmapDayCell): string => {
    if (!cell.isSchoolDay) return 'bg-slate-100/60 dark:bg-slate-800/30 border-transparent';
    if (cell.percentage === undefined || cell.total === 0) return 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    if (cell.percentage >= 95) return 'bg-emerald-600 dark:bg-emerald-500 text-white';
    if (cell.percentage >= 85) return 'bg-emerald-400 dark:bg-emerald-600 text-white';
    if (cell.percentage >= 75) return 'bg-lime-400 dark:bg-lime-600 text-slate-900';
    if (cell.percentage >= 60) return 'bg-amber-400 dark:bg-amber-500 text-slate-900';
    return 'bg-rose-500 dark:bg-rose-600 text-white';
  };

  // Helper for cell color in STUDENT mode
  const getStudentCellColor = (cell: HeatmapDayCell): string => {
    if (!cell.isSchoolDay) return 'bg-slate-100/50 dark:bg-slate-800/30 border-transparent';
    if (!cell.status) return 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    switch (cell.status) {
      case 'PRESENT':
        return 'bg-emerald-500 dark:bg-emerald-500';
      case 'LATE':
        return 'bg-amber-500 dark:bg-amber-500';
      case 'EXCUSED':
        return 'bg-sky-500 dark:bg-sky-500';
      case 'ABSENT':
        return 'bg-rose-500 dark:bg-rose-600';
      default:
        return 'bg-slate-200 dark:bg-slate-800';
    }
  };

  // Extract unique month labels with column offsets
  const monthHeaders: { label: string; colIndex: number }[] = [];
  let lastMonth = '';
  columns.forEach((col, idx) => {
    const firstCell = col[0];
    if (firstCell && firstCell.monthName !== lastMonth) {
      monthHeaders.push({ label: firstCell.monthName, colIndex: idx });
      lastMonth = firstCell.monthName;
    }
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {mode === 'CLASS'
                ? `Attendance Heatmap: ${classLevel} - ${classArm}`
                : `Attendance Calendar: ${studentName || 'Student'}`}
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {mode === 'CLASS'
              ? 'Multi-week attendance density across enrolled students'
              : 'Individual daily attendance pattern over the academic term'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {mode === 'CLASS' ? (
            <>
              <span className="text-slate-400 font-medium">Rate:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-rose-500" title="<60%" />
                <span className="w-3 h-3 rounded-xs bg-amber-400" title="60-74%" />
                <span className="w-3 h-3 rounded-xs bg-lime-400" title="75-84%" />
                <span className="w-3 h-3 rounded-xs bg-emerald-400" title="85-94%" />
                <span className="w-3 h-3 rounded-xs bg-emerald-600" title="95-100%" />
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Low → High</span>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> Late
              </span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" /> Excused
              </span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" /> Absent
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Matrix Container */}
      <div className="mt-4 overflow-x-auto pb-2">
        <div className="min-w-fit">
          {/* Month Label Row */}
          <div className="flex text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1 pl-8">
            {columns.map((_, colIdx) => {
              const header = monthHeaders.find((m) => m.colIndex === colIdx);
              return (
                <div key={colIdx} className="w-4 sm:w-5 mr-1 text-left">
                  {header ? header.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid with Weekday Labels on Left */}
          <div className="flex">
            {/* Weekday labels */}
            <div className="flex flex-col gap-1 pr-2 text-[10px] font-medium text-slate-400 select-none">
              {dayLabels.map((lbl, dIdx) => (
                <div key={lbl} className="h-4 sm:h-5 flex items-center justify-end w-6">
                  {dIdx % 2 === 0 ? lbl : ''}
                </div>
              ))}
            </div>

            {/* Matrix columns */}
            <div className="flex gap-1">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1">
                  {col.map((cell) => {
                    const colorClass =
                      mode === 'CLASS' ? getClassCellColor(cell) : getStudentCellColor(cell);

                    return (
                      <div
                        key={cell.date}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-xs cursor-pointer transition-transform duration-100 hover:scale-125 hover:z-10 relative ${colorClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Inspection Bar */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 min-h-7">
        {hoveredCell ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {new Date(hoveredCell.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span>•</span>
            {mode === 'CLASS' ? (
              hoveredCell.percentage !== undefined ? (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      hoveredCell.percentage >= 90
                        ? 'success'
                        : hoveredCell.percentage >= 75
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {hoveredCell.percentage}% Attendance
                  </Badge>
                  <span className="text-slate-600 dark:text-slate-300">
                    ({hoveredCell.present} Present, {hoveredCell.late} Late, {hoveredCell.absent} Absent)
                  </span>
                </div>
              ) : (
                <span className="italic text-slate-400">
                  {hoveredCell.isSchoolDay ? 'No register logged' : 'Weekend / School Closed'}
                </span>
              )
            ) : hoveredCell.status ? (
              <Badge
                variant={
                  hoveredCell.status === 'PRESENT'
                    ? 'success'
                    : hoveredCell.status === 'LATE'
                    ? 'warning'
                    : hoveredCell.status === 'EXCUSED'
                    ? 'info'
                    : 'danger'
                }
                size="sm"
              >
                {hoveredCell.status}
              </Badge>
            ) : (
              <span className="italic text-slate-400">
                {hoveredCell.isSchoolDay ? 'No record logged' : 'Weekend'}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Hover over any calendar cell to view attendance details and percentages.</span>
          </div>
        )}
      </div>
    </div>
  );
};
