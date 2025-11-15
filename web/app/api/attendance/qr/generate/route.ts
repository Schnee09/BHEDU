/**
 * Generate QR Code API
 * POST /api/attendance/qr/generate
 * 
 * Generate QR codes for students
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

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

  const supabase = createServiceClient()
    const body = await req.json()
    const { studentIds, classId, validDate, expiryHours } = body as {
      studentIds: string[]
      classId: string
      validDate: string
      expiryHours?: number
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Student IDs array is required' },
        { status: 400 }
      )
    }

    if (!classId || !validDate) {
      return NextResponse.json(
        { error: 'Class ID and valid date are required' },
        { status: 400 }
      )
    }

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
          { error: 'You do not have permission to generate QR codes for this class' },
          { status: 403 }
        )
      }
    }

    logger.info(`Generating QR codes for ${studentIds.length} students`, {
      classId,
      validDate,
      userId: authResult.userId
    })

    const results = []

    // Generate QR code for each student
    for (const studentId of studentIds) {
      try {
        const { data, error } = await supabase
          .rpc('generate_qr_code', {
            p_student_id: studentId,
            p_class_id: classId,
            p_valid_date: validDate,
            p_expiry_hours: expiryHours || 24
          })
          .single()

        if (error) {
          logger.error(`Failed to generate QR code for student ${studentId}`, { error: error.message })
          results.push({
            studentId,
            success: false,
            error: error.message
          })
        } else {
          const qrData = data as {
            qr_code_id: string
            code: string
            expires_at: string
          }
          
          results.push({
            studentId,
            success: true,
            qrCodeId: qrData.qr_code_id,
            code: qrData.code,
            expiresAt: qrData.expires_at
          })
        }
      } catch (error) {
        logger.error(`Unexpected error generating QR code for student ${studentId}`, error)
        results.push({
          studentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'generate_qr_codes',
      resource_type: 'qr_code',
      details: {
        class_id: classId,
        valid_date: validDate,
        total: studentIds.length,
        success: successCount,
        errors: errorCount
      }
    })

    logger.info(`QR code generation completed`, {
      total: studentIds.length,
      success: successCount,
      errors: errorCount
    })

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: studentIds.length,
        successCount,
        errorCount
      }
    })

  } catch (error) {
    logger.error('QR code generation error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
