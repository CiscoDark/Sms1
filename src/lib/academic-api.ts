import { AcademicSession, Term } from '../types';
import { enqueueOfflineAction } from './offline-queue';

export const academicApi = {
  async getSessions(): Promise<AcademicSession[]> {
    const raw = localStorage.getItem('sms_sessions');
    return raw ? JSON.parse(raw) : [];
  },

  async advanceTerm(
    sessionYear: string,
    currentTermId: string,
    nextTermId: string | null
  ): Promise<{ success: boolean; message: string }> {
    enqueueOfflineAction('/api/academic/advance-term', 'POST', { sessionYear, currentTermId, nextTermId }, `Advance term in ${sessionYear}`);
    return { success: true, message: 'Term advance request processed' };
  },

  async updateTermDates(
    termId: string,
    dates: { startDate: string; endDate: string; resumptionDate?: string }
  ): Promise<void> {
    enqueueOfflineAction(`/api/academic/terms/${termId}`, 'PATCH', dates, `Update term dates`);
  },
};
