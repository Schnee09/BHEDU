import { AttendanceStatus } from './types';

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  attendanceRate: number;
}

export function calculateAttendanceRate(present: number, late: number, total: number): number {
  return total > 0 ? Math.round(((present + late) / total) * 100) : 0;
}

export function summarizeAttendanceStatuses(
  records: ReadonlyArray<{ status: string }>
): AttendanceSummary {
  const summary = records.reduce(
    (counts, record) => {
      switch (record.status) {
        case AttendanceStatus.PRESENT:
          counts.present += 1;
          break;
        case AttendanceStatus.ABSENT:
          counts.absent += 1;
          break;
        case AttendanceStatus.LATE:
          counts.late += 1;
          break;
        case AttendanceStatus.EXCUSED:
          counts.excused += 1;
          break;
      }
      return counts;
    },
    { present: 0, absent: 0, late: 0, excused: 0 }
  );

  const total = records.length;
  const attendanceRate = calculateAttendanceRate(summary.present, summary.late, total);

  return { ...summary, total, attendanceRate };
}
