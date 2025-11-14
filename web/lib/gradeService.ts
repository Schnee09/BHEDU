/**
 * Grade Book Service
 * Utilities for grade calculations, formatting, and report generation
 */

export interface AssignmentCategory {
  id: string
  class_id: string
  name: string
  description?: string
  weight: number
  drop_lowest: number
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  class_id: string
  category_id?: string
  title: string
  description?: string
  total_points: number
  due_date?: string
  assigned_date: string
  published: boolean
  created_at: string
  updated_at: string
  category?: AssignmentCategory // Populated when joining with categories
}

export interface Grade {
  id: string
  assignment_id: string
  student_id: string
  points_earned?: number
  late: boolean
  excused: boolean
  missing: boolean
  feedback?: string
  graded_at?: string
  graded_by?: string
  created_at: string
  updated_at: string
}

export interface GradeWithDetails extends Grade {
  assignment?: Assignment
  student?: {
    id: string
    email: string
    first_name: string
    last_name: string
    student_id: string
  }
}

export interface CategoryGrade {
  category_id: string
  category_name: string
  average: number
  weight: number
}

export interface OverallGrade {
  overall_percentage: number
  letter_grade: string
  category_grades: CategoryGrade[]
}

/**
 * Calculate percentage for a single grade
 */
export function calculateGradePercentage(
  pointsEarned: number | null,
  totalPoints: number,
  excused: boolean = false,
  missing: boolean = false
): number | null {
  if (excused) return null
  if (missing && pointsEarned === null) return 0
  if (pointsEarned === null) return null
  if (totalPoints === 0) return 0
  return Math.round((pointsEarned / totalPoints) * 100 * 100) / 100
}

/**
 * Convert percentage to letter grade (standard scale)
 */
export function percentageToLetterGrade(percentage: number | null): string {
  if (percentage === null) return 'N/A'
  
  if (percentage >= 93) return 'A'
  if (percentage >= 90) return 'A-'
  if (percentage >= 87) return 'B+'
  if (percentage >= 83) return 'B'
  if (percentage >= 80) return 'B-'
  if (percentage >= 77) return 'C+'
  if (percentage >= 73) return 'C'
  if (percentage >= 70) return 'C-'
  if (percentage >= 67) return 'D+'
  if (percentage >= 63) return 'D'
  if (percentage >= 60) return 'D-'
  return 'F'
}

/**
 * Get color for letter grade
 */
export function getLetterGradeColor(letterGrade: string): string {
  if (letterGrade.startsWith('A')) return 'text-green-600'
  if (letterGrade.startsWith('B')) return 'text-blue-600'
  if (letterGrade.startsWith('C')) return 'text-yellow-600'
  if (letterGrade.startsWith('D')) return 'text-orange-600'
  if (letterGrade === 'F') return 'text-red-600'
  return 'text-gray-600'
}

/**
 * Get color for percentage
 */
export function getPercentageColor(percentage: number | null): string {
  if (percentage === null) return 'text-gray-600'
  if (percentage >= 90) return 'text-green-600'
  if (percentage >= 80) return 'text-blue-600'
  if (percentage >= 70) return 'text-yellow-600'
  if (percentage >= 60) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Format grade status badge
 */
export function formatGradeStatus(grade: Grade): {
  text: string
  color: string
} {
  if (grade.excused) {
    return { text: 'Excused', color: 'bg-blue-100 text-blue-800' }
  }
  if (grade.missing) {
    return { text: 'Missing', color: 'bg-red-100 text-red-800' }
  }
  if (grade.late) {
    return { text: 'Late', color: 'bg-yellow-100 text-yellow-800' }
  }
  if (grade.points_earned !== null && grade.points_earned !== undefined) {
    return { text: 'Graded', color: 'bg-green-100 text-green-800' }
  }
  return { text: 'Pending', color: 'bg-gray-100 text-gray-800' }
}

/**
 * Validate grade points
 */
export function validateGradePoints(
  pointsEarned: number,
  totalPoints: number
): { valid: boolean; error?: string } {
  if (pointsEarned < 0) {
    return { valid: false, error: 'Points cannot be negative' }
  }
  if (pointsEarned > totalPoints) {
    return { valid: false, error: `Points cannot exceed ${totalPoints}` }
  }
  return { valid: true }
}

/**
 * Calculate category average with drop_lowest support
 */
export function calculateCategoryAverage(
  grades: GradeWithDetails[],
  dropLowest: number = 0
): number | null {
  // Filter to only graded, non-excused assignments
  const validGrades = grades
    .filter(g => 
      !g.excused && 
      g.assignment &&
      (g.points_earned !== null || g.missing)
    )
    .map(g => {
      if (g.missing && g.points_earned === null) return 0
      if (g.points_earned === null) return null
      const percentage = calculateGradePercentage(
        g.points_earned ?? null,
        g.assignment!.total_points,
        g.excused,
        g.missing
      )
      return percentage
    })
    .filter(p => p !== null) as number[]

  if (validGrades.length === 0) return null

  // Sort ascending and drop lowest N grades
  if (dropLowest > 0 && validGrades.length > dropLowest) {
    validGrades.sort((a, b) => a - b)
    validGrades.splice(0, dropLowest)
  }

  // Calculate average
  const sum = validGrades.reduce((acc, val) => acc + val, 0)
  return Math.round((sum / validGrades.length) * 100) / 100
}

/**
 * Calculate weighted overall grade
 */
export function calculateWeightedGrade(
  categoryGrades: CategoryGrade[]
): number | null {
  const validCategories = categoryGrades.filter(c => c.average !== null && c.weight > 0)
  
  if (validCategories.length === 0) return null

  const weightedSum = validCategories.reduce(
    (sum, cat) => sum + (cat.average * cat.weight / 100),
    0
  )
  const totalWeight = validCategories.reduce((sum, cat) => sum + cat.weight, 0)

  if (totalWeight === 0) return null

  return Math.round((weightedSum / totalWeight) * 100 * 100) / 100
}

/**
 * Export grades to CSV
 */
export function exportGradesToCSV(
  grades: GradeWithDetails[],
  className: string,
  assignmentTitle?: string
): void {
  const headers = [
    'Student Name',
    'Student ID',
    'Email',
    'Assignment',
    'Points Earned',
    'Total Points',
    'Percentage',
    'Letter Grade',
    'Status',
    'Late',
    'Missing',
    'Excused',
    'Feedback'
  ]

  const rows = grades.map(grade => {
    const percentage = calculateGradePercentage(
      grade.points_earned ?? null,
      grade.assignment?.total_points ?? 0,
      grade.excused,
      grade.missing
    )
    const letterGrade = percentage !== null ? percentageToLetterGrade(percentage) : 'N/A'
    const status = formatGradeStatus(grade)

    return [
      `${grade.student?.first_name || ''} ${grade.student?.last_name || ''}`.trim(),
      grade.student?.student_id || '',
      grade.student?.email || '',
      grade.assignment?.title || '',
      grade.points_earned?.toString() || '',
      grade.assignment?.total_points?.toString() || '',
      percentage?.toString() || '',
      letterGrade,
      status.text,
      grade.late ? 'Yes' : 'No',
      grade.missing ? 'Yes' : 'No',
      grade.excused ? 'Yes' : 'No',
      grade.feedback || ''
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const filename = assignmentTitle
    ? `${className}-${assignmentTitle}-grades-${new Date().toISOString().split('T')[0]}.csv`
    : `${className}-grades-${new Date().toISOString().split('T')[0]}.csv`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Generate date range for grade reports
 */
export function generateGradeDateRange(range: 'term' | 'semester' | 'year' | 'custom', customStart?: string, customEnd?: string): {
  startDate: string
  endDate: string
} {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]
  let startDate: string

  switch (range) {
    case 'term':
      const termStart = new Date(today)
      termStart.setMonth(termStart.getMonth() - 3)
      startDate = termStart.toISOString().split('T')[0]
      break
    case 'semester':
      const semesterStart = new Date(today)
      semesterStart.setMonth(semesterStart.getMonth() - 6)
      startDate = semesterStart.toISOString().split('T')[0]
      break
    case 'year':
      const yearStart = new Date(today)
      yearStart.setFullYear(yearStart.getFullYear() - 1)
      startDate = yearStart.toISOString().split('T')[0]
      break
    case 'custom':
      startDate = customStart || endDate
      return { startDate, endDate: customEnd || endDate }
    default:
      startDate = endDate
  }

  return { startDate, endDate }
}
