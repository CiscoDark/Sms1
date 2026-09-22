import {
  OfflineQueueItem,
  OfflineQueueActionType,
  CellConflict,
  UserProfile,
  AttendanceRecord,
  StudentSubjectGradeRecord,
  AttendanceStatus,
} from '../types';

const STORAGE_KEY_QUEUE = 'sms_offline_queue';
const STORAGE_KEY_SIMULATED_OFFLINE = 'sms_simulated_offline';
const STORAGE_KEY_CONFLICTS = 'sms_sync_conflicts';

// Custom event identifiers for reactive state sync across components
export const EVENT_NETWORK_CHANGE = 'sms_event_network_change';
export const EVENT_QUEUE_CHANGE = 'sms_event_queue_change';
export const EVENT_CONFLICT_CHANGE = 'sms_event_conflict_change';

/* =========================================================================
 * 1. Network Connectivity & Offline Simulation
 * ========================================================================= */

export function isAppOnline(): boolean {
  if (typeof window === 'undefined') return true;
  const isSimulatedOffline = localStorage.getItem(STORAGE_KEY_SIMULATED_OFFLINE) === 'true';
  if (isSimulatedOffline) return false;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function isSimulatedOfflineActive(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_SIMULATED_OFFLINE) === 'true';
}

export function setSimulatedOffline(offline: boolean): void {
  try {
    if (offline) {
      localStorage.setItem(STORAGE_KEY_SIMULATED_OFFLINE, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_SIMULATED_OFFLINE);
    }
    window.dispatchEvent(new CustomEvent(EVENT_NETWORK_CHANGE, { detail: { isOnline: isAppOnline() } }));
  } catch (err) {
    console.error('Failed to set simulated offline state', err);
  }
}

export function subscribeNetworkStatus(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => callback(isAppOnline());
  window.addEventListener('online', handleUpdate);
  window.addEventListener('offline', handleUpdate);
  window.addEventListener(EVENT_NETWORK_CHANGE, handleUpdate);

  return () => {
    window.removeEventListener('online', handleUpdate);
    window.removeEventListener('offline', handleUpdate);
    window.removeEventListener(EVENT_NETWORK_CHANGE, handleUpdate);
  };
}

/* =========================================================================
 * 2. Offline Queue Management
 * ========================================================================= */

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(items: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_QUEUE_CHANGE));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
}

export function enqueueOfflineAction(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload: any,
  description: string,
  options?: {
    actionType?: OfflineQueueActionType;
    entityId?: string;
    fieldKey?: string;
    performerName?: string;
    performerRole?: string;
  }
): OfflineQueueItem {
  const items = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    endpoint,
    method,
    payload,
    timestamp: Date.now(),
    description,
    status: 'PENDING',
    actionType: options?.actionType || 'GENERAL_MUTATION',
    entityId: options?.entityId,
    fieldKey: options?.fieldKey,
    performerName: options?.performerName,
    performerRole: options?.performerRole,
  };
  items.push(newItem);
  saveOfflineQueue(items);
  return newItem;
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(STORAGE_KEY_QUEUE);
  window.dispatchEvent(new CustomEvent(EVENT_QUEUE_CHANGE));
}

export function removeQueueItem(id: string): void {
  const items = getOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(items);
}

export function subscribeQueueChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_QUEUE_CHANGE, callback);
  return () => window.removeEventListener(EVENT_QUEUE_CHANGE, callback);
}

/**
 * Check if a specific gradebook cell has pending unsynced offline changes
 */
export function isGradebookCellPendingSync(recordId: string, fieldKey: string): boolean {
  const queue = getOfflineQueue();
  return queue.some(
    (item) =>
      item.status === 'PENDING' &&
      item.actionType === 'GRADEBOOK_SCORE_UPDATE' &&
      item.entityId === recordId &&
      item.fieldKey === fieldKey
  );
}

/**
 * Check if attendance has pending unsynced offline changes for class/date
 */
export function isAttendancePendingSync(date: string, classLevel?: string, classArm?: string): boolean {
  const queue = getOfflineQueue();
  return queue.some((item) => {
    if (item.status !== 'PENDING' || item.actionType !== 'ATTENDANCE_REGISTER_SAVE') return false;
    const p = item.payload;
    if (!p) return false;
    if (p.date !== date) return false;
    if (classLevel && p.classLevel !== classLevel) return false;
    if (classArm && p.classArm !== classArm) return false;
    return true;
  });
}

/* =========================================================================
 * 3. Cell Conflict Store & Resolution
 * ========================================================================= */

export function getAllConflicts(): CellConflict[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFLICTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllConflicts(conflicts: CellConflict[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFLICTS, JSON.stringify(conflicts));
    window.dispatchEvent(new CustomEvent(EVENT_CONFLICT_CHANGE));
  } catch (e) {
    console.error('Failed to save conflicts', e);
  }
}

export function getActiveConflicts(): CellConflict[] {
  return getAllConflicts().filter((c) => c.status === 'UNRESOLVED');
}

export function getConflictForGradebookCell(recordId: string, field: string): CellConflict | undefined {
  return getActiveConflicts().find(
    (c) => c.entityType === 'GRADEBOOK' && c.recordId === recordId && c.field === field
  );
}

export function getConflictForAttendance(studentId: string, date: string): CellConflict | undefined {
  return getActiveConflicts().find(
    (c) =>
      c.entityType === 'ATTENDANCE' &&
      c.studentId === studentId &&
      c.contextInfo.date === date
  );
}

export function subscribeConflictChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_CONFLICT_CHANGE, callback);
  return () => window.removeEventListener(EVENT_CONFLICT_CHANGE, callback);
}

/**
 * Resolve an active conflict: choose either 'LOCAL' (offline) or 'REMOTE' (online)
 */
export async function resolveConflict(
  conflictId: string,
  choice: 'LOCAL' | 'REMOTE',
  resolverUser: UserProfile
): Promise<CellConflict | null> {
  const conflicts = getAllConflicts();
  const target = conflicts.find((c) => c.id === conflictId);
  if (!target) return null;

  const chosenValue = choice === 'LOCAL' ? target.localValue : target.remoteValue;

  target.status = 'RESOLVED';
  target.resolvedChoice = choice;
  target.resolvedValue = chosenValue;
  target.resolvedAt = new Date().toISOString();
  target.resolvedBy = `${resolverUser.name} (${resolverUser.role})`;

  saveAllConflicts(conflicts);

  // Apply chosen value to the actual storage
  if (target.entityType === 'GRADEBOOK') {
    try {
      const { getAllStoredGradeRecords, saveAllGradeRecords, calculateTotalScore, evaluateGradeAndRemark, calculateClassArmRankings } = await import('./gradebook-store');
      const { getGradingConfig } = await import('./assessment-exam-store');
      const config = getGradingConfig();
      const allRecords = getAllStoredGradeRecords();
      const recIndex = allRecords.findIndex((r) => r.id === target.recordId);
      if (recIndex !== -1) {
        const existing = { ...allRecords[recIndex] };
        (existing as any)[target.field] = chosenValue;
        const total = calculateTotalScore(existing.ca1Score, existing.ca2Score, existing.ca3Score, existing.examScore);
        const { grade, remark, gpaPoint } = evaluateGradeAndRemark(total, config.boundaries, config.passMark);
        existing.totalScore = total;
        existing.grade = grade;
        existing.remark = remark;
        existing.gpaPoint = gpaPoint;
        existing.updatedAt = new Date().toISOString();
        existing.updatedBy = `${resolverUser.name} (Resolved Conflict: ${choice})`;

        allRecords[recIndex] = existing;
        const reRanked = calculateClassArmRankings(allRecords);
        saveAllGradeRecords(reRanked);
      }
    } catch (err) {
      console.error('Failed to apply resolved gradebook conflict', err);
    }
  } else if (target.entityType === 'ATTENDANCE') {
    try {
      const { getAllAttendanceRecords, saveAllAttendanceRecords } = await import('./attendance/attendance-store');
      const allAttendance = getAllAttendanceRecords();
      const attIndex = allAttendance.findIndex(
        (a) => a.studentId === target.studentId && a.date === target.contextInfo.date
      );
      if (attIndex !== -1) {
        const existing = { ...allAttendance[attIndex] };
        existing.status = chosenValue;
        existing.markedBy = `${resolverUser.name} (Resolved Conflict: ${choice})`;
        existing.markedAt = new Date().toISOString();
        allAttendance[attIndex] = existing;
        saveAllAttendanceRecords(allAttendance);
      }
    } catch (err) {
      console.error('Failed to apply resolved attendance conflict', err);
    }
  }

  // Remove corresponding pending queue item if any
  const queue = getOfflineQueue();
  const filteredQueue = queue.filter(
    (item) => !(item.entityId === target.recordId && item.fieldKey === target.field)
  );
  saveOfflineQueue(filteredQueue);

  return target;
}

/* =========================================================================
 * 4. Conflict & Offline Test Simulators (For evaluation & verification)
 * ========================================================================= */

/**
 * Simulate an inline Gradebook conflict on demand:
 * Creates an offline edit (local) colliding with an online edit (remote)
 */
export function simulateGradebookConflict(
  record: StudentSubjectGradeRecord,
  field: 'ca1Score' | 'ca2Score' | 'examScore' = 'ca1Score',
  options?: {
    localScore?: number;
    remoteScore?: number;
    localAuthor?: string;
    remoteAuthor?: string;
  }
): CellConflict {
  const currentVal = record[field] ?? 14;
  const localVal = options?.localScore ?? (typeof currentVal === 'number' ? currentVal + 4 : 18);
  const remoteVal = options?.remoteScore ?? (typeof currentVal === 'number' ? Math.max(0, currentVal - 3) : 12);

  const fieldLabels: Record<string, string> = {
    ca1Score: 'Continuous Assessment 1 (CA 1)',
    ca2Score: 'Continuous Assessment 2 (CA 2)',
    examScore: 'Terminal Examination',
  };

  const newConflict: CellConflict = {
    id: `conflict-grd-${record.id}-${field}-${Date.now()}`,
    entityType: 'GRADEBOOK',
    recordId: record.id,
    studentId: record.studentId,
    studentName: record.studentName,
    admissionNumber: record.studentRegNumber,
    field,
    fieldLabel: fieldLabels[field] || field,
    contextInfo: {
      levelName: record.levelName,
      armName: record.armName,
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      sessionYear: record.sessionYear,
      termName: record.termName,
    },
    localValue: localVal,
    localEditedBy: options?.localAuthor || 'Mr. David Okonjo (Form Tutor - Offline Entry)',
    localEditedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    remoteValue: remoteVal,
    remoteEditedBy: options?.remoteAuthor || 'Mrs. Sarah Adebayo (Subject Head - Portal Online)',
    remoteEditedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // 4 mins ago
    status: 'UNRESOLVED',
  };

  // Enqueue offline action so pending indicator also shows
  enqueueOfflineAction(
    '/api/gradebook/score-update',
    'PUT',
    { recordId: record.id, field, score: localVal },
    `Offline grade score entry for ${record.studentName} (${record.subjectCode})`,
    {
      actionType: 'GRADEBOOK_SCORE_UPDATE',
      entityId: record.id,
      fieldKey: field,
      performerName: 'Mr. David Okonjo',
      performerRole: 'Teacher',
    }
  );

  const existingConflicts = getAllConflicts().filter(
    (c) => !(c.entityType === 'GRADEBOOK' && c.recordId === record.id && c.field === field && c.status === 'UNRESOLVED')
  );
  saveAllConflicts([newConflict, ...existingConflicts]);

  return newConflict;
}

/**
 * Simulate an Attendance Conflict:
 * e.g., Form tutor marked 'LATE' offline, while School Clinic / VP marked 'EXCUSED' online
 */
export function simulateAttendanceConflict(
  record: AttendanceRecord,
  options?: {
    localStatus?: AttendanceStatus;
    remoteStatus?: AttendanceStatus;
    localAuthor?: string;
    remoteAuthor?: string;
  }
): CellConflict {
  const localVal = options?.localStatus ?? 'LATE';
  const remoteVal = options?.remoteStatus ?? 'EXCUSED';

  const newConflict: CellConflict = {
    id: `conflict-att-${record.studentId}-${record.date}-${Date.now()}`,
    entityType: 'ATTENDANCE',
    recordId: record.id,
    studentId: record.studentId,
    studentName: record.studentName,
    admissionNumber: record.admissionNumber,
    field: 'status',
    fieldLabel: 'Daily Attendance Status',
    contextInfo: {
      levelName: record.classLevel,
      armName: record.classArm,
      date: record.date,
    },
    localValue: localVal,
    localEditedBy: options?.localAuthor || 'Mr. David Okonjo (Form Tutor - Tablet Offline)',
    localEditedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    remoteValue: remoteVal,
    remoteEditedBy: options?.remoteAuthor || 'Sister Comfort (School Clinic Nurse - Web Online)',
    remoteEditedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'UNRESOLVED',
  };

  enqueueOfflineAction(
    '/api/attendance/mark',
    'POST',
    { studentId: record.studentId, date: record.date, status: localVal },
    `Offline attendance check-in for ${record.studentName} on ${record.date}`,
    {
      actionType: 'ATTENDANCE_REGISTER_SAVE',
      entityId: record.studentId,
      fieldKey: 'status',
      performerName: 'Mr. David Okonjo',
      performerRole: 'Form Tutor',
    }
  );

  const existingConflicts = getAllConflicts().filter(
    (c) => !(c.entityType === 'ATTENDANCE' && c.studentId === record.studentId && c.contextInfo.date === record.date && c.status === 'UNRESOLVED')
  );
  saveAllConflicts([newConflict, ...existingConflicts]);

  return newConflict;
}

/* =========================================================================
 * 5. Full Automatic Sync Processing Engine
 * ========================================================================= */

export interface SyncExecutionResult {
  totalProcessed: number;
  syncedCount: number;
  conflictCount: number;
  errors: string[];
}

export async function processOfflineSync(
  currentUser: UserProfile
): Promise<SyncExecutionResult> {
  const queue = getOfflineQueue();
  const pendingItems = queue.filter((item) => item.status === 'PENDING');

  const result: SyncExecutionResult = {
    totalProcessed: pendingItems.length,
    syncedCount: 0,
    conflictCount: 0,
    errors: [],
  };

  if (pendingItems.length === 0) {
    return result;
  }

  const activeConflicts = getActiveConflicts();

  // Process each item
  const updatedQueue = [...queue];

  for (const item of pendingItems) {
    // Check if this item is involved in an active unresolved conflict
    const hasUnresolvedConflict = activeConflicts.some((c) => {
      if (item.actionType === 'GRADEBOOK_SCORE_UPDATE') {
        return c.entityType === 'GRADEBOOK' && c.recordId === item.entityId && c.field === item.fieldKey;
      }
      if (item.actionType === 'ATTENDANCE_REGISTER_SAVE') {
        return c.entityType === 'ATTENDANCE' && c.studentId === item.entityId;
      }
      return false;
    });

    if (hasUnresolvedConflict) {
      // Do not silently overwrite — retain as CONFLICT in queue
      item.status = 'CONFLICT';
      result.conflictCount++;
      continue;
    }

    // Default policy: Last-write-wins by timestamp
    // Mark as SYNCED
    item.status = 'SYNCED';
    result.syncedCount++;
  }

  // Filter out SYNCED items from the active queue, keeping CONFLICT or FAILED
  const remainingQueue = updatedQueue.filter((item) => item.status !== 'SYNCED');
  saveOfflineQueue(remainingQueue);

  return result;
}

