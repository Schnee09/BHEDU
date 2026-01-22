import { apiFetch } from "@/lib/api/client";
import { AttendanceRecord, AttendanceStats, AttendanceStatus } from "../types";

export class AttendanceService {
  /**
   * Get attendance for a specific class and date
   */
  static async getDailyAttendance(
    classId: string,
    date: string,
  ): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams({
      classId,
      date,
    });

    try {
      const res = await apiFetch(`/api/attendance/daily?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      return data.records || [];
    } catch (error) {
      console.error("AttendanceService.getDailyAttendance error:", error);
      throw error;
    }
  }

  /**
   * Mark attendance for a single student or bulk
   */
  static async markAttendance(
    records: Partial<AttendanceRecord>[],
  ): Promise<boolean> {
    if (records.length === 0) return true;

    try {
      // Extract classId and date from the first record
      const classId = records[0].class_id;
      const date = records[0].date;

      if (!classId || !date) {
        console.error(
          "AttendanceService.markAttendance: classId and date are required",
        );
        return false;
      }

      // Transforming records to be sent to /api/attendance/bulk
      const bulkRecords = records.map((r) => ({
        studentId: r.student_id,
        status: r.status,
        remarks: r.remarks, // Matching backend standardized schema
      }));

      const res = await apiFetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          date,
          records: bulkRecords,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("AttendanceService.markAttendance failed:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("AttendanceService.markAttendance error:", error);
      return false;
    }
  }

  /**
   * Get statistics for a class
   */
  static async getStats(classId: string): Promise<AttendanceStats> {
    try {
      const res = await apiFetch(`/api/attendance/stats?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    } catch (error) {
      console.error("AttendanceService.getStats error:", error);
      throw error;
    }
  }
}
