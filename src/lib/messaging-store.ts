/**
 * Communications, Broadcast & Two-Way Messaging Store
 * 
 * Features:
 * - SMS Cost Guard: Live character & Unicode segment calculation, live ₦ cost estimation.
 * - Broadcasts: Multi-channel (In-App, Email, SMS) with delivery statistics.
 * - Two-Way Teacher-Parent Threads: Contextualized per student.
 * - Dedicated Captain-Teacher Channel: Peer-representative communications.
 * - Automated Push Notifications: Report cards, fee due dates, school events.
 */

import {
  BroadcastMessageRecord,
  ChatThread,
  DirectChatMessage,
  Role,
  UserProfile,
} from '../types';
import { TENANT_SCHOOL_ID } from './class-timetable-store';
import { enqueueOfflineAction } from './offline-queue';

const BROADCASTS_KEY = `sms_broadcast_messages_${TENANT_SCHOOL_ID}`;
const CHAT_THREADS_KEY = `sms_chat_threads_${TENANT_SCHOOL_ID}`;
const CHAT_MESSAGES_KEY = `sms_chat_messages_${TENANT_SCHOOL_ID}`;
const NOTIFICATIONS_KEY = `sms_system_push_notifications_${TENANT_SCHOOL_ID}`;

// Standard Nigerian SMS segment tariff
export const SMS_COST_PER_SEGMENT_NAIRA = 4.0;

// Standard GSM 7-bit character regex test
// If message contains any character not in GSM 7-bit set, it falls back to UCS-2 (Unicode)
const GSM_7BIT_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~\]|€]*$/;

export interface SmsCostMetrics {
  charCount: number;
  isUnicode: boolean;
  maxFirstSegment: number;
  maxConcatSegment: number;
  segmentsPerRecipient: number;
  recipientCount: number;
  totalSegments: number;
  costPerSegmentNaira: number;
  totalCostNaira: number;
  unicodeWarning?: string;
  costGuardAlert?: string;
}

/**
 * Live SMS Cost Guard Engine
 */
export function calculateSmsMetrics(text: string, recipientCount: number): SmsCostMetrics {
  const charCount = text.length;
  const isUnicode = !GSM_7BIT_REGEX.test(text);

  const maxFirstSegment = isUnicode ? 70 : 160;
  const maxConcatSegment = isUnicode ? 67 : 153;

  let segmentsPerRecipient = 0;
  if (charCount > 0) {
    if (charCount <= maxFirstSegment) {
      segmentsPerRecipient = 1;
    } else {
      segmentsPerRecipient = Math.ceil(charCount / maxConcatSegment);
    }
  }

  const totalSegments = segmentsPerRecipient * Math.max(1, recipientCount);
  const totalCostNaira = totalSegments * SMS_COST_PER_SEGMENT_NAIRA;

  let unicodeWarning: string | undefined;
  if (isUnicode && charCount > 0) {
    unicodeWarning =
      'Unicode characters detected (emojis/special glyphs). Maximum segment capacity reduced from 160 to 70 characters.';
  }

  let costGuardAlert: string | undefined;
  if (totalCostNaira > 1000) {
    costGuardAlert = `High spend warning: ₦${totalCostNaira.toLocaleString()} for ${totalSegments} total SMS segments. Consider sending via Free Push Notification and Email first.`;
  }

  return {
    charCount,
    isUnicode,
    maxFirstSegment,
    maxConcatSegment,
    segmentsPerRecipient,
    recipientCount,
    totalSegments,
    costPerSegmentNaira: SMS_COST_PER_SEGMENT_NAIRA,
    totalCostNaira,
    unicodeWarning,
    costGuardAlert,
  };
}

// Initial sample broadcasts
const INITIAL_BROADCASTS: BroadcastMessageRecord[] = [
  {
    id: 'bc-001',
    title: 'Mid-Term Break & Parent-Teacher Consultative Assembly',
    body: 'Dear Parents, mid-term break commences Thursday, Feb 20. The Term 2 PTA Consultative Conference is scheduled for Saturday at 10:00 AM prompt in the Nelson Mandela Memorial Auditorium.',
    channels: ['IN_APP', 'EMAIL', 'SMS'],
    audienceScope: 'SCHOOL_WIDE',
    recipientCount: 248,
    smsCharacterCount: 198,
    smsSegmentsPerRecipient: 2,
    smsTotalSegments: 496,
    estimatedCostNaira: 1984.0,
    isHighPriorityAlert: false,
    senderId: 'user-1',
    senderName: 'Dr. Evelyn Vance',
    senderRole: 'School Administrator',
    sentAt: '2025-02-10T09:00:00Z',
    deliveryStats: {
      smsSent: 248,
      smsFailed: 3,
      emailSent: 248,
      inAppDelivered: 248,
    },
  },
  {
    id: 'bc-002',
    title: 'Urgent: Weather Advisory & Early Departure Notice',
    body: 'EMERGENCY: Heavy rainfall causing localized flooding along Victoria Island axis. School buses will depart early at 1:30 PM. Parents doing private pickups may arrive starting 1:00 PM.',
    channels: ['SMS', 'IN_APP'],
    audienceScope: 'SCHOOL_WIDE',
    recipientCount: 252,
    smsCharacterCount: 172,
    smsSegmentsPerRecipient: 2,
    smsTotalSegments: 504,
    estimatedCostNaira: 2016.0,
    isHighPriorityAlert: true,
    senderId: 'user-2',
    senderName: 'Prof. Marcus Adebayo',
    senderRole: 'Principal',
    sentAt: '2025-02-04T11:45:00Z',
    deliveryStats: {
      smsSent: 252,
      smsFailed: 0,
      emailSent: 0,
      inAppDelivered: 252,
    },
  },
];

// Initial two-way message threads
const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'thread-adeleke-okonjo',
    type: 'TEACHER_PARENT',
    studentId: 'st-chinedu-adeleke',
    studentName: 'Chinedu Adeleke',
    classLevel: 'JSS 1',
    classArm: 'Gold',
    participantIds: ['user-7', 'user-4'],
    participantNames: {
      'user-7': 'Dr. Kunle Adeleke (Parent)',
      'user-4': 'Mr. David Okonjo (Form Master)',
    },
    participantRoles: {
      'user-7': 'PARENT',
      'user-4': 'TEACHER',
    },
    title: 'Academic Progress & Cowbellpedia Math Olympiad Prep',
    lastMessageSnippet: 'Chinedu has shown exceptional aptitude in algebraic geometry. Practice modules sent!',
    lastMessageAt: '2025-02-12T14:20:00Z',
    unreadCount: {
      'user-7': 0,
      'user-4': 0,
    },
  },
  {
    id: 'thread-alabi-bruce',
    type: 'TEACHER_PARENT',
    studentId: 'st-femi-alabi',
    studentName: 'Femi Alabi',
    classLevel: 'SSS 1',
    classArm: 'Science (Diamond)',
    participantIds: ['user-6', 'user-teacher-bruce'],
    participantNames: {
      'user-6': 'Mrs. Folashade Alabi (Parent/Teacher)',
      'user-teacher-bruce': 'Mr. Kenneth Bruce (Physics Teacher)',
    },
    participantRoles: {
      'user-6': 'PARENT',
      'user-teacher-bruce': 'TEACHER',
    },
    title: 'Advanced Robotics Practical Exhibition',
    lastMessageSnippet: 'Femi has completed the microcontroller servo calibration. Ready for display on Friday.',
    lastMessageAt: '2025-02-11T16:05:00Z',
    unreadCount: {
      'user-6': 1,
      'user-teacher-bruce': 0,
    },
  },
  {
    id: 'thread-captain-okonjo-jss1',
    type: 'CAPTAIN_TEACHER',
    classLevel: 'JSS 1',
    classArm: 'Gold',
    participantIds: ['user-8', 'user-4'],
    participantNames: {
      'user-8': 'Kenechukwu Okafor (Class Captain)',
      'user-4': 'Mr. David Okonjo (Form Master)',
    },
    participantRoles: {
      'user-8': 'CLASS_CAPTAIN',
      'user-4': 'TEACHER',
    },
    title: 'JSS 1 Gold Captain Log: Whiteboard Markers & Science Lab Key',
    lastMessageSnippet: 'Good afternoon sir, all 32 student workbooks for Basic Science have been collected in Room 102.',
    lastMessageAt: '2025-02-14T11:10:00Z',
    unreadCount: {
      'user-8': 0,
      'user-4': 1,
    },
  },
];

const INITIAL_MESSAGES: DirectChatMessage[] = [
  {
    id: 'msg-001',
    threadId: 'thread-adeleke-okonjo',
    senderId: 'user-7',
    senderName: 'Dr. Kunle Adeleke',
    senderRole: 'PARENT',
    recipientId: 'user-4',
    recipientName: 'Mr. David Okonjo',
    recipientRole: 'TEACHER',
    content:
      'Good morning Mr. Okonjo. I reviewed Chinedu’s mid-term mathematics report. He mentioned the state Cowbellpedia Olympiad trials are next month. How is his preparation proceeding?',
    timestamp: '2025-02-12T10:15:00Z',
    status: 'READ',
  },
  {
    id: 'msg-002',
    threadId: 'thread-adeleke-okonjo',
    senderId: 'user-4',
    senderName: 'Mr. David Okonjo',
    senderRole: 'TEACHER',
    recipientId: 'user-7',
    recipientName: 'Dr. Kunle Adeleke',
    recipientRole: 'PARENT',
    content:
      'Good morning Dr. Adeleke. Chinedu has shown exceptional aptitude in algebraic geometry and arithmetic sequences. I have assigned him five past regional olympiad problem sets. He is currently leading the school junior drill squad!',
    timestamp: '2025-02-12T14:20:00Z',
    status: 'READ',
  },
  {
    id: 'msg-003',
    threadId: 'thread-captain-okonjo-jss1',
    senderId: 'user-8',
    senderName: 'Kenechukwu Okafor',
    senderRole: 'CLASS_CAPTAIN',
    recipientId: 'user-4',
    recipientName: 'Mr. David Okonjo',
    recipientRole: 'TEACHER',
    content:
      'Good afternoon Mr. Okonjo. As class captain, I wanted to report that all 32 student notebooks for Basic Science have been collected and placed on your desk in Room 102. Also, the whiteboard dry-erase markers in our arm are running low.',
    timestamp: '2025-02-14T11:10:00Z',
    status: 'DELIVERED',
  },
];

export interface SystemPushNotification {
  id: string;
  title: string;
  message: string;
  category: 'REPORT_CARD' | 'FEE_DUE' | 'EVENT' | 'ATTENDANCE' | 'ALERT';
  targetUserId?: string;
  targetRole?: Role;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

const INITIAL_NOTIFICATIONS: SystemPushNotification[] = [
  {
    id: 'notif-1',
    title: 'Verified Report Cards Released',
    message: 'Third Term cumulative report cards with tamper-evident QR credentials are now accessible in the parent portal.',
    category: 'REPORT_CARD',
    timestamp: '2025-02-14T08:00:00Z',
    isRead: false,
    actionUrl: '#parent-portal',
  },
  {
    id: 'notif-2',
    title: 'Fee Payment Installment Recorded',
    message: 'A payment of ₦150,000 for Chinedu Adeleke was reconciled successfully via Paystack gateway.',
    category: 'FEE_DUE',
    timestamp: '2025-02-13T14:30:00Z',
    isRead: true,
  },
  {
    id: 'notif-3',
    title: 'PTA General Assembly Scheduled',
    message: 'Saturday Feb 22 at 10:00 AM. In-person in Mandela Hall or stream via portal.',
    category: 'EVENT',
    timestamp: '2025-02-12T11:00:00Z',
    isRead: false,
  },
];

export function getAllBroadcasts(): BroadcastMessageRecord[] {
  try {
    const raw = localStorage.getItem(BROADCASTS_KEY);
    if (!raw) {
      localStorage.setItem(BROADCASTS_KEY, JSON.stringify(INITIAL_BROADCASTS));
      return INITIAL_BROADCASTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BROADCASTS;
  }
}

export function saveBroadcast(record: Omit<BroadcastMessageRecord, 'id' | 'sentAt' | 'deliveryStats'>): BroadcastMessageRecord {
  const current = getAllBroadcasts();
  const newBroadcast: BroadcastMessageRecord = {
    ...record,
    id: `bc-${Date.now()}`,
    sentAt: new Date().toISOString(),
    deliveryStats: {
      smsSent: record.channels.includes('SMS') ? record.recipientCount : 0,
      smsFailed: 0,
      emailSent: record.channels.includes('EMAIL') ? record.recipientCount : 0,
      inAppDelivered: record.channels.includes('IN_APP') ? record.recipientCount : 0,
    },
  };

  const updated = [newBroadcast, ...current];
  localStorage.setItem(BROADCASTS_KEY, JSON.stringify(updated));

  enqueueOfflineAction(
    '/api/broadcasts/dispatch',
    'POST',
    newBroadcast,
    `Dispatched broadcast "${record.title}" to ${record.recipientCount} recipients`
  );

  return newBroadcast;
}

export function getAllChatThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(CHAT_THREADS_KEY);
    if (!raw) {
      localStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(INITIAL_THREADS));
      return INITIAL_THREADS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_THREADS;
  }
}

export function getChatMessages(threadId: string): DirectChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
    const all: DirectChatMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    return all.filter((m) => m.threadId === threadId);
  } catch {
    return INITIAL_MESSAGES.filter((m) => m.threadId === threadId);
  }
}

export function sendChatMessage(message: Omit<DirectChatMessage, 'id' | 'timestamp' | 'status'>): DirectChatMessage {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
    const all: DirectChatMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;

    const newMsg: DirectChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
    };

    all.push(newMsg);
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(all));

    // Update parent thread's snippet & timestamp
    const threads = getAllChatThreads();
    const updatedThreads = threads.map((t) => {
      if (t.id === message.threadId) {
        return {
          ...t,
          lastMessageSnippet: message.content.substring(0, 80),
          lastMessageAt: newMsg.timestamp,
        };
      }
      return t;
    });
    localStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(updatedThreads));

    enqueueOfflineAction(
      '/api/messages/send',
      'POST',
      newMsg,
      `Sent direct message in thread ${message.threadId}`
    );

    return newMsg;
  } catch (err) {
    console.error('Failed to send chat message:', err);
    throw err;
  }
}

export function getSystemNotifications(): SystemPushNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function markNotificationAsRead(id: string): void {
  const list = getSystemNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

export function createSystemPushNotification(notif: Omit<SystemPushNotification, 'id' | 'timestamp' | 'isRead'>): void {
  const list = getSystemNotifications();
  const newItem: SystemPushNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([newItem, ...list]));
}
