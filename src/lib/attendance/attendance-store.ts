import { AttendanceRecord, AttendanceStatus, ClassDailyAttendanceSummary, Student, UserProfile } from '../../types';
import { enqueueOfflineAction } from '../offline-queue';
import { getStoredStudents } from '../migration-store';

const STORAGE_KEY_ATTENDANCE = 'sms_daily_attendance';

export interface HeatmapDayCell {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  dayOfMonth: number;
  monthName: string;
  isSchoolDay: boolean;
  status?: AttendanceStatus;
  percentage?: number; // 0 to 100 for class level
  total?: number;
  present?: number;
  absent?: number;
  late?: number;
  excused?: number;
}

// Generate past N school days (skipping Saturday and Sunday)
export function getRecentSchoolDays(count: number): string[] {
  const days: string[] = [];
  const curr = new Date();

  while (days.length < count) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
    curr.setDate(curr.getDate() - 1);
  }

  return days.reverse(); // Chronological order
}

// Pre-seed realistic attendance records
function generateSeededAttendanceRecords(): AttendanceRecord[] {
  const students = getStoredStudents();
  if (students.length === 0) return [];

  const schoolDays = getRecentSchoolDays(40); // Last 40 school days (~8 weeks)
  const records: AttendanceRecord[] = [];

  // Consistent pseudo-random seed per student and date
  schoolDays.forEach((dateStr) => {
    students.forEach((student, sIdx) => {
      // 93% high attendance rate with realistic sporadic lates/absences
      const hash = (sIdx * 37 + dateStr.charCodeAt(8) * 19 + dateStr.charCodeAt(9) * 31) % 100;
      let status: AttendanceStatus = 'PRESENT';
      let arrivalTime: string | undefined = undefined;
      let remarks: string | undefined = undefined;

      if (hash < 3) {
        status = 'ABSENT';
        remarks = 'Unexcused absence / family emergency';
      } else if (hash < 6) {
        status = 'LATE';
        arrivalTime = `08:${15 + (hash % 20)}`;
        remarks = 'Traffic delay at toll gate';
      } else if (hash < 8) {
        status = 'EXCUSED';
        remarks = 'Medical appointment with parent note';
      } else {
        status = 'PRESENT';
        arrivalTime = '07:45';
      }

      records.push({
        id: `att-${student.id}-${dateStr}`,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        classLevel: student.classLevel,
        classArm: student.classArm,
        date: dateStr,
        status,
        arrivalTime,
        remarks,
        markedBy: 'Mr. David Okonjo (Form Tutor)',
        markedAt: `${dateStr} 08:30`,
      });
    });
  });

  return records;
}

export function getAllAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (raw) return JSON.parse(raw);

    const seeded = generateSeededAttendanceRecords();
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(seeded));
    return seeded;
  } catch {
    return generateSeededAttendanceRecords();
  }
}

export function saveAllAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save attendance records to localStorage', err);
  }
}

export function getAttendanceForClassAndDate(
  classLevel: string,
  classArm: string,
  date: string
): AttendanceRecord[] {
  const all = getAllAttendanceRecords();
  return all.filter(
    (r) =>
      r.date === date &&
      (r.classLevel.toLowerCase() === classLevel.toLowerCase() ||
        r.classLevel.toLowerCase().includes(classLevel.toLowerCase())) &&
      (r.classArm.toLowerCase() === classArm.toLowerCase() ||
        r.classArm.toLowerCase().includes(classArm.toLowerCase()))
  );
}

export function saveClassAttendanceRegister(
  date: string,
  classLevel: string,
  classArm: string,
  records: AttendanceRecord[],
  performer: UserProfile
): {
  updatedRecords: AttendanceRecord[];
  summary: ClassDailyAttendanceSummary;
} {
  const all = getAllAttendanceRecords();

  // Filter out any existing records for this exact class, arm, and date
  const filtered = all.filter(
    (r) =>
      !(
        r.date === date &&
        r.classLevel.toLowerCase() === classLevel.toLowerCase() &&
        r.classArm.toLowerCase() === classArm.toLowerCase()
      )
  );

  const combined = [...filtered, ...records];
  saveAllAttendanceRecords(combined);

  // Compute summary
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const totalCount = records.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 1000) / 10 : 0;

  const summary: ClassDailyAttendanceSummary = {
    date,
    classLevel,
    classArm,
    totalCount,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
    markedAt: new Date().toISOString(),
    markedBy: `${performer.name} (${performer.title || performer.role})`,
  };

  enqueueOfflineAction(
    '/api/attendance/batch-save',
    'POST',
    {
      date,
      classLevel,
      classArm,
      summary,
      recordCount: records.length,
    },
    `Logged attendance for ${classLevel} - ${classArm} on ${date}`
  );

  return { updatedRecords: combined, summary };
}

// Student specific attendance analytics
export function getStudentAttendanceSummary(studentId: string): {
  totalSchoolDays: number;
  presentDays: number;
  lateDays: number;
  excusedDays: number;
  absentDays: number;
  attendanceRate: number;
  currentStreak: number;
  history: AttendanceRecord[];
} {
  const all = getAllAttendanceRecords();
  const history = all
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSchoolDays = history.length;
  const presentDays = history.filter((r) => r.status === 'PRESENT').length;
  const lateDays = history.filter((r) => r.status === 'LATE').length;
  const excusedDays = history.filter((r) => r.status === 'EXCUSED').length;
  const absentDays = history.filter((r) => r.status === 'ABSENT').length;

  const attendanceRate =
    totalSchoolDays > 0
      ? Math.round(((presentDays + lateDays) / totalSchoolDays) * 1000) / 10
      : 100;

  // Calculate current streak of consecutive present or late days
  let currentStreak = 0;
  for (const rec of history) {
    if (rec.status === 'PRESENT' || rec.status === 'LATE') {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    totalSchoolDays,
    presentDays,
    lateDays,
    excusedDays,
    absentDays,
    attendanceRate,
    currentStreak,
    history,
  };
}

// Calculate Heatmap cells for individual student across past N weeks
export function getStudentHeatmapCells(studentId: string, weeks: number = 10): HeatmapDayCell[] {
  const all = getAllAttendanceRecords();
  const studentRecs = new Map<string, AttendanceRecord>();

  all.filter((r) => r.studentId === studentId).forEach((r) => {
    studentRecs.set(r.date, r);
  });

  const cells: HeatmapDayCell[] = [];
  const today = new Date();

  // Calculate starting date to align nicely with Monday of (weeks) ago
  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - totalDays + 1);

  // Align start to Monday
  const dayOffset = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
  startDate.setDate(startDate.getDate() - dayOffset);

  const cursor = new Date(startDate);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (cursor <= today || cells.length % 7 !== 0) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = cursor.getDay();
    const isSchoolDay = dayOfWeek !== 0 && dayOfWeek !== 6;
    const rec = studentRecs.get(dateStr);

    cells.push({
      date: dateStr,
      dayOfWeek,
      dayOfMonth: cursor.getDate(),
      monthName: monthNames[cursor.getMonth()],
      isSchoolDay,
      status: rec?.status,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

// Calculate Heatmap cells for entire Class/Arm across past N weeks
export function getClassHeatmapCells(
  classLevel: string,
  classArm: string,
  weeks: number = 10
): HeatmapDayCell[] {
  const all = getAllAttendanceRecords();
  const classRecs = all.filter(
    (r) =>
      r.classLevel.toLowerCase() === classLevel.toLowerCase() &&
      r.classArm.toLowerCase() === classArm.toLowerCase()
  );

  // Group by date
  const dateMap = new Map<
    string,
    { total: number; present: number; late: number; excused: number; absent: number }
  >();

  classRecs.forEach((r) => {
    const curr = dateMap.get(r.date) || { total: 0, present: 0, late: 0, excused: 0, absent: 0 };
    curr.total++;
    if (r.status === 'PRESENT') curr.present++;
    if (r.status === 'LATE') curr.late++;
    if (r.status === 'EXCUSED') curr.excused++;
    if (r.status === 'ABSENT') curr.absent++;
    dateMap.set(r.date, curr);
  });

  const cells: HeatmapDayCell[] = [];
  const today = new Date();
  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - totalDays + 1);

  const dayOffset = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
  startDate.setDate(startDate.getDate() - dayOffset);

  const cursor = new Date(startDate);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (cursor <= today || cells.length % 7 !== 0) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = cursor.getDay();
    const isSchoolDay = dayOfWeek !== 0 && dayOfWeek !== 6;
    const stats = dateMap.get(dateStr);

    let percentage: number | undefined = undefined;
    if (stats && stats.total > 0) {
      percentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
    }

    cells.push({
      date: dateStr,
      dayOfWeek,
      dayOfMonth: cursor.getDate(),
      monthName: monthNames[cursor.getMonth()],
      isSchoolDay,
      percentage,
      total: stats?.total,
      present: stats?.present,
      absent: stats?.absent,
      late: stats?.late,
      excused: stats?.excused,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}
