import { AttendanceStatus } from './types';

/**
 * Validate attendance date (not future date, not too old)
 */
export function validateAttendanceDate(date: string): {
  valid: boolean
  error?: string
} {
  const attendanceDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if future date
  if (attendanceDate > today) {
    return {
      valid: false,
      error: 'Cannot mark attendance for future dates'
    }
  }
  
  // Check if more than 30 days old (configurable policy)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  if (attendanceDate < thirtyDaysAgo) {
    return {
      valid: false,
      error: 'Cannot mark attendance for dates more than 30 days old'
    }
  }
  
  return { valid: true }
}

export function formatAttendanceStatus(status: string) {
    switch (status) {
    case AttendanceStatus.PRESENT:
      return { label: 'Có mặt', color: 'text-green-700', bgColor: 'bg-green-100' }
    case AttendanceStatus.ABSENT:
      return { label: 'Vắng', color: 'text-red-700', bgColor: 'bg-red-100' }
    default:
      return { label: 'Chưa điểm danh', color: 'text-gray-700', bgColor: 'bg-gray-100' }
  }
}

/**
 * Export attendance data to CSV format
 */
export function exportAttendanceToCSV(
  records: any[], // Type loosely here as the view model might differ from DB model
  className: string,
  date: string
): string {
  const headers = [
    'Student Name',
    'Email',
    'Student ID',
    'Status',
    'Notes'
  ]
  
  const rows = records.map(record => [
    record.studentName || `${record.firstName} ${record.lastName}`,
    record.email,
    record.studentNumber || record.studentCode || '',
    record.status,
    record.notes || ''
  ])
  
  const csvContent = [
    `Attendance Report - ${className} - ${date}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csvContent
}
