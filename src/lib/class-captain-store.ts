/**
 * Class Captains & Scoped Announcements Store
 * 
 * Invariants:
 * - Data-Level Scoping: Captain-posted announcements are STRICTLY locked to their own class arm.
 *   Even if the client request specifies SCHOOL_WIDE, the store forces scope: 'CLASS_ARM',
 *   targetLevel: captain.classLevel, targetArm: captain.classArm.
 * - Privacy Guard: Class captains hold peer-representative responsibilities only;
 *   they are strictly barred from accessing other students' grades, fees, or private records.
 */

import { ClassCaptainRecord, StudentAnnouncementItem, Role, Student } from '../types';
import { addAnnouncement, getAnnouncements } from './announcements-store';
import { TENANT_SCHOOL_ID } from './class-timetable-store';
import { enqueueOfflineAction } from './offline-queue';

const CAPTAINS_STORAGE_KEY = `sms_class_captains_${TENANT_SCHOOL_ID}`;

// Pre-seeded authentic Nigerian school captains
const INITIAL_CAPTAINS: ClassCaptainRecord[] = [
  {
    id: 'cap-jss1-gold-head',
    studentId: 'st-chinedu-adeleke',
    studentName: 'Chinedu Adeleke',
    admissionNumber: 'ADM-2024-001',
    classLevel: 'JSS 1',
    classArm: 'Gold',
    captainRole: 'HEAD_CAPTAIN',
    appointedBy: 'Mr. David Okonjo (Form Master)',
    appointedAt: '2024-09-15T08:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'cap-jss1-gold-asst',
    studentId: 'st-kenechukwu-okafor',
    studentName: 'Kenechukwu Okafor',
    admissionNumber: 'ADM-2024-002',
    classLevel: 'JSS 1',
    classArm: 'Gold',
    captainRole: 'ASSISTANT_CAPTAIN',
    appointedBy: 'Mr. David Okonjo (Form Master)',
    appointedAt: '2024-09-15T08:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'cap-sss1-sci-head',
    studentId: 'st-femi-alabi',
    studentName: 'Femi Alabi',
    admissionNumber: 'ADM-2024-042',
    classLevel: 'SSS 1',
    classArm: 'Science (Diamond)',
    captainRole: 'HEAD_CAPTAIN',
    appointedBy: 'Mr. Kenneth Bruce (Form Master)',
    appointedAt: '2024-09-16T09:00:00Z',
    status: 'ACTIVE',
  },
];

export function getAllClassCaptains(): ClassCaptainRecord[] {
  try {
    const raw = localStorage.getItem(CAPTAINS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CAPTAINS_STORAGE_KEY, JSON.stringify(INITIAL_CAPTAINS));
      return INITIAL_CAPTAINS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load class captains:', err);
    return INITIAL_CAPTAINS;
  }
}

export function saveClassCaptains(captains: ClassCaptainRecord[]): void {
  try {
    localStorage.setItem(CAPTAINS_STORAGE_KEY, JSON.stringify(captains));
  } catch (err) {
    console.error('Failed to persist class captains:', err);
  }
}

export function getCaptainsForClass(classLevel: string, classArm: string): ClassCaptainRecord[] {
  const all = getAllClassCaptains();
  return all.filter(
    (c) => c.classLevel === classLevel && c.classArm === classArm && c.status === 'ACTIVE'
  );
}

export function appointClassCaptain(
  student: { id: string; name: string; admissionNumber: string; classLevel: string; classArm: string },
  captainRole: 'HEAD_CAPTAIN' | 'ASSISTANT_CAPTAIN' | 'TIME_KEEPER' | 'LAB_PREFECT',
  appointedBy: string
): ClassCaptainRecord {
  const current = getAllClassCaptains();

  // If appointing HEAD_CAPTAIN, demote existing head captain in this class arm to ASSISTANT
  const updated = current.map((c) => {
    if (
      c.classLevel === student.classLevel &&
      c.classArm === student.classArm &&
      c.captainRole === captainRole &&
      c.status === 'ACTIVE'
    ) {
      return { ...c, status: 'REVOKED' as const };
    }
    return c;
  });

  const newCaptain: ClassCaptainRecord = {
    id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId: student.id,
    studentName: student.name,
    admissionNumber: student.admissionNumber,
    classLevel: student.classLevel,
    classArm: student.classArm,
    captainRole,
    appointedBy,
    appointedAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  const finalCaptains = [newCaptain, ...updated];
  saveClassCaptains(finalCaptains);

  enqueueOfflineAction(
    '/api/class-captains/appoint',
    'POST',
    newCaptain,
    `Appointed ${student.name} as ${captainRole} for ${student.classLevel} ${student.classArm}`
  );

  return newCaptain;
}

export function revokeClassCaptain(captainId: string, revokedBy: string): void {
  const current = getAllClassCaptains();
  const updated = current.map((c) => (c.id === captainId ? { ...c, status: 'REVOKED' as const } : c));
  saveClassCaptains(updated);

  enqueueOfflineAction(
    '/api/class-captains/revoke',
    'POST',
    { captainId, revokedBy },
    `Revoked captain appointment ${captainId}`
  );
}

/**
 * Strict Data-Level Enforced Captain Announcement Publishing:
 * Regardless of what client passes, this function forcibly overrides:
 * - scope to 'CLASS_ARM'
 * - targetLevel to the captain's authorized class level
 * - targetArm to the captain's authorized class arm
 * - authorType to 'CLASS_CAPTAIN'
 * - isCaptainPost to true
 */
export function postCaptainClassAnnouncement(params: {
  captain: ClassCaptainRecord;
  title: string;
  content: string;
  category: 'ACADEMIC' | 'EVENT' | 'EXAM' | 'ADMINISTRATIVE' | 'EMERGENCY';
}): StudentAnnouncementItem {
  const { captain, title, content, category } = params;

  // STRICT DATA-LEVEL ENFORCEMENT
  const newAnnouncement = addAnnouncement({
    title,
    content,
    scope: 'CLASS_ARM', // Locked: can NEVER be SCHOOL_WIDE or another class
    targetLevel: captain.classLevel,
    targetArm: captain.classArm,
    category,
    authorName: `${captain.studentName} (${captain.captainRole === 'HEAD_CAPTAIN' ? 'Class Captain' : 'Asst. Captain'})`,
    authorRole: `Class Captain - ${captain.classLevel} ${captain.classArm}`,
    authorType: 'CLASS_CAPTAIN',
    isCaptainPost: true,
    captainBadgeText: 'Class Captain Verified',
    isPinned: false,
    readBy: [captain.studentId],
  });

  enqueueOfflineAction(
    '/api/class-captains/announcements',
    'POST',
    newAnnouncement,
    `Class Captain posted announcement for ${captain.classLevel} ${captain.classArm}`
  );

  return newAnnouncement;
}

/**
 * Security Rule: Verify if a role is permitted to inspect sensitive academic/financial records.
 * Class Captains are strictly barred!
 */
export function canAccessStudentPrivateRecords(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'PRINCIPAL' || role === 'ACADEMIC_DIRECTOR' || role === 'TEACHER' || role === 'BURSAR';
}
