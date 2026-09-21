/**
 * Student & School Announcements Store
 * 
 * Supports:
 * - Scoped announcement feed (School-Wide, Class-Level, Class-Arm)
 * - Visual priority & category tags (Academic, Exam, Event, Admin, Emergency)
 * - Read/Unread state tracking per student
 */

import { StudentAnnouncementItem } from '../types';
import { TENANT_SCHOOL_ID } from './class-timetable-store';

const ANNOUNCEMENTS_STORAGE_KEY = `sms_student_announcements_${TENANT_SCHOOL_ID}`;

export const INITIAL_ANNOUNCEMENTS: StudentAnnouncementItem[] = [
  {
    id: 'ann-001',
    title: 'Release of Third Term Examination Results & Annual Promotion Status',
    content: 'The academic board has published the official third term cumulative promotion broadsheets and verified report cards. Students and guardians may inspect their digital transcripts via the Student Portal. Hard-copy transcripts with tamper-proof holographic QR credentials can be printed directly.',
    scope: 'SCHOOL_WIDE',
    category: 'ACADEMIC',
    authorName: 'Dr. Obinna Anyaoku',
    authorRole: 'Principal & Head of School',
    createdAt: '2026-07-25T08:00:00Z',
    isPinned: true,
    readBy: [],
  },
  {
    id: 'ann-002',
    title: 'Inter-House Sports & Cultural Day Festival',
    content: 'Apex Horizon Academy annual Inter-House Sports competition is scheduled for Friday next week at the National Stadium complex. All students are expected to turn out in their respective house jerseys (Sapphire, Emerald, Ruby, and Gold). Transportation departs the main quadrangle at 7:30 AM prompt.',
    scope: 'SCHOOL_WIDE',
    category: 'EVENT',
    authorName: 'Coach Segun Oladipo',
    authorRole: 'Director of Physical Education',
    createdAt: '2026-07-23T14:30:00Z',
    readBy: [],
  },
  {
    id: 'ann-003',
    title: 'JSS 1 Science Project Submissions Deadline',
    content: 'All Junior Secondary 1 students must submit their integrated science practical exhibition boards by Tuesday noon in Biology Lab 2. Ensure all apparatus labels follow the provided laboratory formatting rubric.',
    scope: 'CLASS_LEVEL',
    targetLevel: 'JSS 1',
    category: 'ACADEMIC',
    authorName: 'Mrs. Folashade Alabi',
    authorRole: 'Head of Sciences',
    createdAt: '2026-07-21T11:15:00Z',
    readBy: [],
  },
  {
    id: 'ann-004',
    title: 'Resumption Protocol & Fee Clearance for Upcoming Session',
    content: 'The 2026/2027 academic session will commence on Monday, September 15. All returning students must obtain their electronic Bursary clearance receipt prior to hostel check-in and laboratory locker allocation.',
    scope: 'SCHOOL_WIDE',
    category: 'ADMINISTRATIVE',
    authorName: 'Mr. Emmanuel Chukwuma',
    authorRole: 'Bursar & Finance Controller',
    createdAt: '2026-07-18T09:45:00Z',
    readBy: [],
  },
];

export function getAnnouncements(): StudentAnnouncementItem[] {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading announcements:', err);
    return INITIAL_ANNOUNCEMENTS;
  }
}

export function saveAnnouncements(items: StudentAnnouncementItem[]): void {
  try {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving announcements:', err);
  }
}

export function markAnnouncementAsRead(announcementId: string, studentId: string): void {
  const current = getAnnouncements();
  const updated = current.map((ann) => {
    if (ann.id === announcementId) {
      const readers = ann.readBy || [];
      if (!readers.includes(studentId)) {
        return { ...ann, readBy: [...readers, studentId] };
      }
    }
    return ann;
  });
  saveAnnouncements(updated);
}

export function addAnnouncement(item: Omit<StudentAnnouncementItem, 'id' | 'createdAt'>): StudentAnnouncementItem {
  const current = getAnnouncements();
  const newAnn: StudentAnnouncementItem = {
    ...item,
    id: `ann-${Date.now()}`,
    createdAt: new Date().toISOString(),
    readBy: [],
  };
  saveAnnouncements([newAnn, ...current]);
  return newAnn;
}
