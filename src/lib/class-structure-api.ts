import { ClassLevel, ClassArm } from '../types';
import { enqueueOfflineAction } from './offline-queue';

export const classStructureApi = {
  async getLevels(): Promise<ClassLevel[]> {
    const raw = localStorage.getItem('sms_levels');
    return raw ? JSON.parse(raw) : [];
  },

  async updateArm(armId: string, payload: Partial<ClassArm>): Promise<void> {
    enqueueOfflineAction(`/api/classes/arms/${armId}`, 'PATCH', payload as Record<string, unknown>, `Update arm ${armId}`);
  },

  async createArm(levelId: string, arm: Partial<ClassArm>): Promise<void> {
    enqueueOfflineAction(`/api/classes/levels/${levelId}/arms`, 'POST', arm as Record<string, unknown>, `Create new class arm`);
  },

  async deleteArm(armId: string): Promise<void> {
    enqueueOfflineAction(`/api/classes/arms/${armId}`, 'DELETE', { armId }, `Delete arm ${armId}`);
  },
};
