export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export interface AttendanceRecord {
  id?: string;
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
}
