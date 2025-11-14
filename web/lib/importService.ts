/**
 * CSV Import Service
 * Handles validation, parsing, and bulk import of student data
 */

import Papa from 'papaparse'

export interface StudentImportRow {
  // Required fields
  firstName: string
  lastName: string
  email: string
  
  // Optional student fields
  phone?: string
  address?: string
  dateOfBirth?: string // YYYY-MM-DD format
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  studentId?: string
  enrollmentDate?: string // YYYY-MM-DD format
  gradeLevel?: string
  status?: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended'
  
  // Guardian fields
  guardianName?: string
  guardianRelationship?: 'father' | 'mother' | 'guardian' | 'grandparent' | 'sibling' | 'other'
  guardianPhone?: string
  guardianEmail?: string
  guardianAddress?: string
  isPrimaryContact?: boolean
  isEmergencyContact?: boolean
}

export interface ValidationError {
  row: number
  field: string
  value: unknown
  message: string
  severity: 'error' | 'warning'
}

export interface ImportPreview {
  valid: StudentImportRow[]
  errors: ValidationError[]
  warnings: ValidationError[]
  totalRows: number
  validRows: number
  errorRows: number
}

/**
 * Parse CSV file to structured data
 */
export async function parseCSV(file: File): Promise<StudentImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<StudentImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Convert various header formats to camelCase
        const headerMap: Record<string, string> = {
          'first name': 'firstName',
          'firstname': 'firstName',
          'first_name': 'firstName',
          'last name': 'lastName',
          'lastname': 'lastName',
          'last_name': 'lastName',
          'email': 'email',
          'e-mail': 'email',
          'phone': 'phone',
          'phone number': 'phone',
          'address': 'address',
          'date of birth': 'dateOfBirth',
          'dob': 'dateOfBirth',
          'birth date': 'dateOfBirth',
          'gender': 'gender',
          'sex': 'gender',
          'student id': 'studentId',
          'student_id': 'studentId',
          'id': 'studentId',
          'enrollment date': 'enrollmentDate',
          'enrollment_date': 'enrollmentDate',
          'grade': 'gradeLevel',
          'grade level': 'gradeLevel',
          'class': 'gradeLevel',
          'status': 'status',
          'guardian name': 'guardianName',
          'guardian_name': 'guardianName',
          'parent name': 'guardianName',
          'guardian relationship': 'guardianRelationship',
          'relationship': 'guardianRelationship',
          'guardian phone': 'guardianPhone',
          'guardian_phone': 'guardianPhone',
          'parent phone': 'guardianPhone',
          'guardian email': 'guardianEmail',
          'guardian_email': 'guardianEmail',
          'parent email': 'guardianEmail',
          'guardian address': 'guardianAddress',
          'primary contact': 'isPrimaryContact',
          'emergency contact': 'isEmergencyContact',
        }
        
        const normalized = header.toLowerCase().trim()
        return headerMap[normalized] || header
      },
      complete: (results: Papa.ParseResult<StudentImportRow>) => {
        resolve(results.data)
      },
      error: (error: Error) => {
        reject(error)
      }
    })
  })
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate date format (YYYY-MM-DD or common formats)
 */
function parseDate(dateString: string): Date | null {
  if (!dateString) return null
  
  // Try ISO format first (YYYY-MM-DD)
  const isoDate = new Date(dateString)
  if (!isNaN(isoDate.getTime())) {
    return isoDate
  }
  
  // Try common formats: MM/DD/YYYY, DD/MM/YYYY, etc.
  const parts = dateString.split(/[-\/]/)
  if (parts.length === 3) {
    // Try MM/DD/YYYY
    const date1 = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`)
    if (!isNaN(date1.getTime())) return date1
    
    // Try DD/MM/YYYY
    const date2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    if (!isNaN(date2.getTime())) return date2
  }
  
  return null
}

/**
 * Validate phone number (basic validation)
 */
function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  // Check if it's between 10-15 digits
  return /^\d{10,15}$/.test(cleaned)
}

/**
 * Validate student import data
 */
export async function validateImportData(
  rows: StudentImportRow[]
): Promise<ImportPreview> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const valid: StudentImportRow[] = []
  const seenEmails = new Set<string>()
  const seenStudentIds = new Set<string>()

  rows.forEach((row, index) => {
    const rowNumber = index + 2 // +2 because row 1 is header, arrays are 0-indexed
    let hasError = false

    // Required field validations
    if (!row.firstName || row.firstName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'firstName',
        value: row.firstName,
        message: 'First name is required',
        severity: 'error'
      })
      hasError = true
    }

    if (!row.lastName || row.lastName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'lastName',
        value: row.lastName,
        message: 'Last name is required',
        severity: 'error'
      })
      hasError = true
    }

    if (!row.email || row.email.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'email',
        value: row.email,
        message: 'Email is required',
        severity: 'error'
      })
      hasError = true
    } else if (!isValidEmail(row.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        value: row.email,
        message: 'Invalid email format',
        severity: 'error'
      })
      hasError = true
    } else if (seenEmails.has(row.email.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'email',
        value: row.email,
        message: 'Duplicate email in import file',
        severity: 'error'
      })
      hasError = true
    } else {
      seenEmails.add(row.email.toLowerCase())
    }

    // Optional field validations
    if (row.phone && !isValidPhone(row.phone)) {
      warnings.push({
        row: rowNumber,
        field: 'phone',
        value: row.phone,
        message: 'Invalid phone number format',
        severity: 'warning'
      })
    }

    if (row.dateOfBirth) {
      const dob = parseDate(row.dateOfBirth)
      if (!dob) {
        warnings.push({
          row: rowNumber,
          field: 'dateOfBirth',
          value: row.dateOfBirth,
          message: 'Invalid date format (use YYYY-MM-DD)',
          severity: 'warning'
        })
      } else {
        // Convert to ISO format
        row.dateOfBirth = dob.toISOString().split('T')[0]
      }
    }

    if (row.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(row.gender)) {
      warnings.push({
        row: rowNumber,
        field: 'gender',
        value: row.gender,
        message: 'Invalid gender value (use: male, female, other, prefer_not_to_say)',
        severity: 'warning'
      })
    }

    if (row.studentId) {
      if (seenStudentIds.has(row.studentId)) {
        errors.push({
          row: rowNumber,
          field: 'studentId',
          value: row.studentId,
          message: 'Duplicate student ID in import file',
          severity: 'error'
        })
        hasError = true
      } else {
        seenStudentIds.add(row.studentId)
      }
    }

    if (row.enrollmentDate) {
      const enrollDate = parseDate(row.enrollmentDate)
      if (!enrollDate) {
        warnings.push({
          row: rowNumber,
          field: 'enrollmentDate',
          value: row.enrollmentDate,
          message: 'Invalid enrollment date format (use YYYY-MM-DD)',
          severity: 'warning'
        })
      } else {
        row.enrollmentDate = enrollDate.toISOString().split('T')[0]
      }
    }

    if (row.status && !['active', 'inactive', 'graduated', 'transferred', 'suspended'].includes(row.status)) {
      warnings.push({
        row: rowNumber,
        field: 'status',
        value: row.status,
        message: 'Invalid status (use: active, inactive, graduated, transferred, suspended)',
        severity: 'warning'
      })
      row.status = 'active' // Default to active
    }

    // Guardian validations
    if (row.guardianEmail && !isValidEmail(row.guardianEmail)) {
      warnings.push({
        row: rowNumber,
        field: 'guardianEmail',
        value: row.guardianEmail,
        message: 'Invalid guardian email format',
        severity: 'warning'
      })
    }

    if (row.guardianPhone && !isValidPhone(row.guardianPhone)) {
      warnings.push({
        row: rowNumber,
        field: 'guardianPhone',
        value: row.guardianPhone,
        message: 'Invalid guardian phone number format',
        severity: 'warning'
      })
    }

    if (row.guardianRelationship && !['father', 'mother', 'guardian', 'grandparent', 'sibling', 'other'].includes(row.guardianRelationship)) {
      warnings.push({
        row: rowNumber,
        field: 'guardianRelationship',
        value: row.guardianRelationship,
        message: 'Invalid relationship (use: father, mother, guardian, grandparent, sibling, other)',
        severity: 'warning'
      })
    }

    // Convert boolean strings to actual booleans
    if (row.isPrimaryContact !== undefined) {
      row.isPrimaryContact = ['true', '1', 'yes', 'y'].includes(String(row.isPrimaryContact).toLowerCase())
    }
    if (row.isEmergencyContact !== undefined) {
      row.isEmergencyContact = ['true', '1', 'yes', 'y'].includes(String(row.isEmergencyContact).toLowerCase())
    }

    if (!hasError) {
      valid.push(row)
    }
  })

  return {
    valid,
    errors,
    warnings,
    totalRows: rows.length,
    validRows: valid.length,
    errorRows: rows.length - valid.length
  }
}

/**
 * Generate CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'address',
    'dateOfBirth',
    'gender',
    'studentId',
    'enrollmentDate',
    'gradeLevel',
    'status',
    'guardianName',
    'guardianRelationship',
    'guardianPhone',
    'guardianEmail',
    'guardianAddress',
    'isPrimaryContact',
    'isEmergencyContact'
  ]

  const sampleData = [
    [
      'John',
      'Doe',
      'john.doe@example.com',
      '+1234567890',
      '123 Main St, City, State 12345',
      '2010-05-15',
      'male',
      'STU-2024-001',
      '2024-09-01',
      'Grade 8',
      'active',
      'Jane Doe',
      'mother',
      '+1234567891',
      'jane.doe@example.com',
      '123 Main St, City, State 12345',
      'true',
      'true'
    ],
    [
      'Alice',
      'Smith',
      'alice.smith@example.com',
      '+1234567892',
      '456 Oak Ave, City, State 12345',
      '2011-08-22',
      'female',
      'STU-2024-002',
      '2024-09-01',
      'Grade 7',
      'active',
      'Bob Smith',
      'father',
      '+1234567893',
      'bob.smith@example.com',
      '456 Oak Ave, City, State 12345',
      'true',
      'false'
    ]
  ]

  const csv = Papa.unparse({
    fields: headers,
    data: sampleData
  })

  return csv
}
