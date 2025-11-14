/**
 * Attendance Service
 * Handles attendance marking, QR code generation, and reporting
 */

export interface AttendanceRecord {
  studentId: string
  classId: string
  date: string // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day'
  checkInTime?: string // HH:MM:SS
  checkOutTime?: string // HH:MM:SS
  notes?: string
  markedBy?: string
}

export interface BulkAttendanceRequest {
  classId: string
  date: string
  records: AttendanceRecord[]
}

export interface AttendanceStats {
  totalDays: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  halfDayCount: number
  attendanceRate: number
}

export interface ClassAttendanceSummary {
  classId: string
  className: string
  date: string
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  unmarkedCount: number
  attendanceRate: number
}

export interface StudentAttendanceRecord {
  studentId: string
  firstName: string
  lastName: string
  email: string
  studentNumber: string | null
  status: string
  checkInTime: string | null
  checkOutTime: string | null
  notes: string | null
}

/**
 * Calculate attendance rate percentage
 */
export function calculateAttendanceRate(stats: {
  presentCount: number
  lateCount: number
  halfDayCount: number
  totalDays: number
}): number {
  if (stats.totalDays === 0) return 0
  
  const attendedDays = stats.presentCount + stats.lateCount + stats.halfDayCount
  return Math.round((attendedDays / stats.totalDays) * 100 * 100) / 100 // Round to 2 decimals
}

/**
 * Determine if student is late based on check-in time
 */
export function determineAttendanceStatus(
  checkInTime: string,
  classStartTime: string = '08:00:00'
): 'present' | 'late' {
  const checkIn = new Date(`2000-01-01 ${checkInTime}`)
  const classStart = new Date(`2000-01-01 ${classStartTime}`)
  
  // If check-in is more than 15 minutes after class start, mark as late
  const fifteenMinutes = 15 * 60 * 1000
  if (checkIn.getTime() - classStart.getTime() > fifteenMinutes) {
    return 'late'
  }
  
  return 'present'
}

/**
 * Format attendance status for display
 */
export function formatAttendanceStatus(status: string): {
  label: string
  color: string
  bgColor: string
} {
  switch (status) {
    case 'present':
      return {
        label: 'Present',
        color: 'text-green-700',
        bgColor: 'bg-green-100'
      }
    case 'absent':
      return {
        label: 'Absent',
        color: 'text-red-700',
        bgColor: 'bg-red-100'
      }
    case 'late':
      return {
        label: 'Late',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100'
      }
    case 'excused':
      return {
        label: 'Excused',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100'
      }
    case 'half_day':
      return {
        label: 'Half Day',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100'
      }
    default:
      return {
        label: 'Unmarked',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100'
      }
  }
}

/**
 * Generate date range for attendance reports
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * Get date range for common report periods
 */
export function getReportDateRange(period: 'today' | 'week' | 'month' | 'term' | 'year'): {
  startDate: string
  endDate: string
} {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]
  
  let startDate: Date
  
  switch (period) {
    case 'today':
      startDate = today
      break
    
    case 'week':
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
      break
    
    case 'month':
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 1)
      break
    
    case 'term':
      // Assume 3 months per term
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 3)
      break
    
    case 'year':
      startDate = new Date(today)
      startDate.setFullYear(today.getFullYear() - 1)
      break
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate
  }
}

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

/**
 * Export attendance data to CSV format
 */
export function exportAttendanceToCSV(
  records: StudentAttendanceRecord[],
  className: string,
  date: string
): string {
  const headers = [
    'Student Name',
    'Email',
    'Student ID',
    'Status',
    'Check-in Time',
    'Check-out Time',
    'Notes'
  ]
  
  const rows = records.map(record => [
    `${record.firstName} ${record.lastName}`,
    record.email,
    record.studentNumber || '',
    record.status,
    record.checkInTime || '',
    record.checkOutTime || '',
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
