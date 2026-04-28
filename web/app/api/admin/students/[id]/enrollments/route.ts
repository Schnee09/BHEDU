/**
 * Student Enrollments (admin)
 * GET /api/admin/students/[id]/enrollments
 *
 * Used by the student detail page EnrollmentManager.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'
import { logger } from '@/lib/logger'
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { supabase } = await getDataClient(req)
    const repository = new EnrollmentRepository(supabase)

    // Verify student exists
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const enrollmentRows = await repository.findByStudent(id)

    const enrollments = (enrollmentRows || []).map((row: any) => ({
      id: row.id,
      class_id: row.class_id,
      class_name: row.class?.name ?? row.class_id,
      class_code: row.class?.code ?? '',
      schedule: row.class?.schedule ?? undefined,
      teacher_name: row.class?.teacher?.full_name ?? undefined,
      enrollment_date: row.enrollment_date,
      status: row.status,
    }))

    return NextResponse.json({ success: true, enrollments })
  } catch (err) {
    logger.error('Failed to fetch student enrollments', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
