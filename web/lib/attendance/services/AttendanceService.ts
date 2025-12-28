import { apiFetch } from '@/lib/api/client';
import { AttendanceRecord, AttendanceStatus, AttendanceStats } from '../types';

export class AttendanceService {
  /**
   * Get attendance for a specific class and date
   */
  static async getDailyAttendance(classId: string, date: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams({
      classId,
      date
    });
    
    try {
      const res = await apiFetch(`/api/attendance/daily?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      return data.records || [];
    } catch (error) {
      console.error('AttendanceService.getDailyAttendance error:', error);
      throw error;
    }
  }

  /**
   * Mark attendance for a single student or bulk
   */
  static async markAttendance(records: Partial<AttendanceRecord>[]): Promise<boolean> {
    try {
      const res = await apiFetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      
      return res.ok;
    } catch (error) {
      console.error('AttendanceService.markAttendance error:', error);
      return false;
    }
  }

  /**
   * Get statistics for a class
   */
  static async getStats(classId: string): Promise<AttendanceStats> {
    try {
      const res = await apiFetch(`/api/attendance/stats?classId=${classId}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    } catch (error) {
      console.error('AttendanceService.getStats error:', error);
      throw error;
    }
  }
}
