import React from 'react';
import {
  Users,
  UserCheck,
  DoorOpen,
  Calendar,
  Download,
  Mail,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import { ClassArm, ClassLevel } from '../../types';
import { Drawer, Badge, Button, ProgressRing, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../design-system';

export interface ClassAssignmentSnapshotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  arm: ClassArm | null;
  level: ClassLevel | null;
}

export const ClassAssignmentSnapshotDrawer: React.FC<ClassAssignmentSnapshotDrawerProps> = ({
  isOpen,
  onClose,
  arm,
  level,
}) => {
  if (!arm) return null;

  const occupancyRate = Math.round((arm.enrolledCount / arm.capacity) * 100);

  // Realistic sample students for snapshot roster
  const sampleStudents = [
    { id: 'st-1', regNo: 'APA/2024/014', name: 'Alexander Chukwu', gender: 'M', attendance: '99%', gpa: 'A (88%)', status: 'Cleared' },
    { id: 'st-2', regNo: 'APA/2024/019', name: 'Zainab Danjuma', gender: 'F', attendance: '98%', gpa: 'A (85%)', status: 'Cleared' },
    { id: 'st-3', regNo: 'APA/2024/023', name: 'Ethan Williams', gender: 'M', attendance: '96%', gpa: 'B+ (79%)', status: 'Cleared' },
    { id: 'st-4', regNo: 'APA/2024/031', name: 'Khadijat Suleiman', gender: 'F', attendance: '95%', gpa: 'B+ (77%)', status: 'Cleared' },
    { id: 'st-5', regNo: 'APA/2024/044', name: 'David Oluwaseun', gender: 'M', attendance: '94%', gpa: 'B (73%)', status: 'Cleared' },
    { id: 'st-6', regNo: 'APA/2024/052', name: 'Amina Yusuf', gender: 'F', attendance: '97%', gpa: 'A- (81%)', status: 'Cleared' },
    { id: 'st-7', regNo: 'APA/2024/067', name: 'Emmanuel Eze', gender: 'M', attendance: '92%', gpa: 'B (71%)', status: 'Pending Fee' },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {level?.name} - {arm.name} Snapshot
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {arm.code} • {arm.roomNumber}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500">
            Current Academic Session Cohort
          </span>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => alert(`Roster for ${arm.name} downloaded successfully (CSV)`)}
          >
            Export Roster
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {arm.enrolledCount}{' '}
              <span className="text-xs font-normal text-slate-400">/ {arm.capacity}</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {occupancyRate}% capacity
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gender Ratio
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {arm.maleCount}M : {arm.femaleCount}F
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Balanced cohort</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Attendance
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {arm.attendanceRate}%
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">High consistency</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Avg Score
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {arm.averageGrade}
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
              Grade Tier 1
            </div>
          </div>
        </div>

        {/* Assigned Teacher Details */}
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {arm.teacherName.split(' ')[1]?.[0] || 'T'}
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Assigned Form Master / Class Teacher
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {arm.teacherName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{arm.teacherEmail}</span>
              </div>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Active Assignment
          </Badge>
        </div>

        {/* Student Roster Preview */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Student Assignment Cohort (Sample Roster)
            </h4>
            <span className="text-xs text-slate-400">
              Showing 7 of {arm.enrolledCount} students
            </span>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Reg No</TableHeaderCell>
                <TableHeaderCell>Student Name</TableHeaderCell>
                <TableHeaderCell>Sex</TableHeaderCell>
                <TableHeaderCell>Terminal GPA</TableHeaderCell>
                <TableHeaderCell>Clearance</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleStudents.map((st) => (
                <TableRow key={st.id}>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {st.regNo}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    {st.name}
                  </TableCell>
                  <TableCell className="text-xs">{st.gender}</TableCell>
                  <TableCell className="font-medium">{st.gpa}</TableCell>
                  <TableCell>
                    <Badge
                      variant={st.status === 'Cleared' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {st.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Drawer>
  );
};
