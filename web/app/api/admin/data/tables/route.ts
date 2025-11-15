/**
 * Admin Data Viewer: Allowed Tables API
 * GET /api/admin/data/tables - List allowed tables for the data viewer
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'

// Keep a curated allowlist to avoid exposing sensitive/internal tables
const ALLOWED_TABLES = [
  // Core user and settings
  'profiles',
  'school_settings',
  'user_activity_logs',
  'audit_logs',

  // Admin configuration
  'academic_years',
  'grading_scales',

  // Curriculum
  'courses',
  'lessons',

  // Classes and enrollments
  'classes',
  'enrollments',

  // Grading
  'assignment_categories',
  'assignments',
  'grades',

  // Attendance
  'attendance',

  // Imports
  'import_logs',
  'import_errors',

  // Student support
  'guardians',

  // Financial
  'fee_types',
  'payment_schedules',
  'payment_schedule_installments',
  'fee_assignments',
  'student_accounts',
  'invoices',
  'invoice_items',
  'payment_methods',
  'payments',
  'payment_allocations'
]

export async function GET() {
  const authResult = await adminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ success: true, data: ALLOWED_TABLES })
}

export type AllowedTable = typeof ALLOWED_TABLES[number]
export { ALLOWED_TABLES }
