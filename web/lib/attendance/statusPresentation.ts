export type AttendanceStatusValue = 'present' | 'absent' | 'late' | 'excused';

export const ATTENDANCE_STATUS_META = {
  present: {
    translationKey: 'attendance.present',
    badgeVariant: 'success',
    mobileColor: 'green',
    chartColor: '#10b981',
    accentClass: 'bg-emerald-500',
  },
  absent: {
    translationKey: 'attendance.absent',
    badgeVariant: 'danger',
    mobileColor: 'red',
    chartColor: '#ef4444',
    accentClass: 'bg-red-500',
  },
  late: {
    translationKey: 'attendance.late',
    badgeVariant: 'warning',
    mobileColor: 'yellow',
    chartColor: '#f59e0b',
    accentClass: 'bg-amber-500',
  },
  excused: {
    translationKey: 'attendance.excused',
    badgeVariant: 'info',
    mobileColor: 'blue',
    chartColor: '#3b82f6',
    accentClass: 'bg-blue-500',
  },
} as const satisfies Record<
  AttendanceStatusValue,
  {
    translationKey: string;
    badgeVariant: string;
    mobileColor: string;
    chartColor: string;
    accentClass: string;
  }
>;

export function getAttendanceStatusMeta(status: string) {
  return ATTENDANCE_STATUS_META[status as AttendanceStatusValue] || null;
}

export function getAttendanceStatusLabel(
  status: string,
  translate: (key: string) => string
): string {
  const meta = getAttendanceStatusMeta(status);
  return meta ? translate(meta.translationKey) : status;
}
