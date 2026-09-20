import { OfflineQueueItem } from '../types';

const STORAGE_KEY = 'sms_offline_queue';

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(items: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
}

export function enqueueOfflineAction(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload: Record<string, unknown>,
  description: string
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
  };
  items.push(newItem);
  saveOfflineQueue(items);
  return newItem;
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}
