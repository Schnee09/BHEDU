/**
 * Bulk Attendance Marking API
 * POST /api/attendance/bulk
 * 
 * Mark attendance for multiple students at once
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'
import type { AttendanceRecord } from '@/lib/attendanceService'

export async function POST(req: NextRequest) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

   const supabase = createClientFromRequest(req as any)
    const body = await req.json()
    const { classId, date, records } = body as {
      classId: string
      date: string
      records: AttendanceRecord[]
    }

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Invalid request: classId, date, and records array are required' },
        { status: 400 }
      )
    }

    logger.info(`Bulk marking attendance for class ${classId} on ${date}`, {
      userId: authResult.userId,
      count: records.length
    })

    // Verify teacher has access to this class
    if (authResult.userRole !== 'admin') {
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('id', classId)
        .eq('teacher_id', authResult.userId)
        .single()

      if (!classData) {
        return NextResponse.json(
          { error: 'You do not have permission to mark attendance for this class' },
          { status: 403 }
        )
      }
    }

    const results = {
      success: [] as string[],
      errors: [] as { studentId: string; error: string }[],
      successCount: 0,
      errorCount: 0
    }

    // Process each attendance record
    for (const record of records) {
      try {
        // Upsert attendance record (insert or update if exists)
        const { error } = await supabase
          .from('attendance')
          .upsert(
            {
              student_id: record.studentId,
              class_id: classId,
              date: date,
              status: record.status,
              check_in_time: record.checkInTime || null,
              check_out_time: record.checkOutTime || null,
              notes: record.notes || null,
              marked_by: authResult.userId,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'student_id,class_id,date',
              ignoreDuplicates: false
            }
          )

        if (error) {
          logger.error(`Failed to mark attendance for student ${record.studentId}`, { error: error.message })
          results.errors.push({
            studentId: record.studentId,
            error: error.message
          })
          results.errorCount++
        } else {
          results.success.push(record.studentId)
          results.successCount++
        }
      } catch (error) {
        logger.error(`Unexpected error marking attendance for student ${record.studentId}`, error)
        results.errors.push({
          studentId: record.studentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        results.errorCount++
      }
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'bulk_mark_attendance',
      resource_type: 'attendance',
      details: {
        class_id: classId,
        date: date,
        total: records.length,
        success: results.successCount,
        errors: results.errorCount
      }
    })

    logger.info(`Bulk attendance marking completed`, {
      classId,
      date,
      total: records.length,
      success: results.successCount,
      errors: results.errorCount
    })

    return NextResponse.json({
      success: true,
      results: {
        total: records.length,
        successCount: results.successCount,
        errorCount: results.errorCount,
        errors: results.errors
      }
    })

  } catch (error) {
    logger.error('Bulk attendance marking error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
