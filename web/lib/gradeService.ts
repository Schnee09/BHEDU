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
  category?: AssignmentCategory
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
  if (missing) return 0
  if (pointsEarned === null || totalPoints === 0) return null
  return (pointsEarned / totalPoints) * 100
}

/**
 * Convert percentage to letter grade
 */
export function percentageToLetterGrade(percentage: number | null): string {
  if (percentage === null) return 'N/A'
  if (percentage >= 97) return 'A+'
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
 * Get color for letter grade display
 */
export function getLetterGradeColor(letterGrade: string): string {
  const colorMap: Record<string, string> = {
    'A+': 'text-green-600 bg-green-50',
    'A': 'text-green-600 bg-green-50',
    'A-': 'text-green-500 bg-green-50',
    'B+': 'text-blue-600 bg-blue-50',
    'B': 'text-blue-600 bg-blue-50',
    'B-': 'text-blue-500 bg-blue-50',
    'C+': 'text-yellow-600 bg-yellow-50',
    'C': 'text-yellow-600 bg-yellow-50',
    'C-': 'text-yellow-500 bg-yellow-50',
    'D+': 'text-orange-600 bg-orange-50',
    'D': 'text-orange-600 bg-orange-50',
    'D-': 'text-orange-500 bg-orange-50',
    'F': 'text-red-600 bg-red-50',
    'N/A': 'text-gray-500 bg-gray-50',
  }
  return colorMap[letterGrade] || 'text-gray-500 bg-gray-50'
}

/**
 * Calculate weighted average for category grades
 */
export function calculateWeightedAverage(categoryGrades: CategoryGrade[]): number {
  const totalWeight = categoryGrades.reduce((sum, cg) => sum + cg.weight, 0)
  if (totalWeight === 0) return 0
  
  const weightedSum = categoryGrades.reduce(
    (sum, cg) => sum + cg.average * cg.weight,
    0
  )
  return weightedSum / totalWeight
}

/**
 * Format grade for display
 */
export function formatGradeDisplay(
  pointsEarned: number | null,
  totalPoints: number,
  excused: boolean = false,
  missing: boolean = false
): string {
  if (excused) return 'EX'
  if (missing) return 'M'
  if (pointsEarned === null) return '-'
  return `${pointsEarned}/${totalPoints}`
}

/**
 * Calculate GPA from letter grade
 */
export function letterGradeToGPA(letterGrade: string): number {
  const gpaMap: Record<string, number> = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'D-': 0.7,
    'F': 0.0,
  }
  return gpaMap[letterGrade] ?? 0.0
}
