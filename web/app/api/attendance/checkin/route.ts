/**
 * QR Code Check-in API
 * POST /api/attendance/checkin
 * 
 * Check in using QR code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { code, location, deviceInfo } = body as {
      code: string
      location?: string
      deviceInfo?: string
    }

    if (!code) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      )
    }

    logger.info(`QR code check-in attempt`, { code: code.substring(0, 10) + '...' })

    // Use the database function to validate and process check-in
    const { data, error } = await supabase
      .rpc('check_in_with_qr', {
        p_code: code,
        p_location: location || null,
        p_device_info: deviceInfo || null
      })
      .single()

    if (error) {
      logger.error('QR check-in database error', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to process check-in' },
        { status: 500 }
      )
    }

    const result = data as {
      success: boolean
      message: string
      student_id: string
      student_name: string
      class_id: string
      attendance_id: string
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.message 
        },
        { status: 400 }
      )
    }

    logger.info(`QR check-in successful`, {
      studentId: result.student_id,
      studentName: result.student_name
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      student: {
        id: result.student_id,
        name: result.student_name
      },
      classId: result.class_id,
      attendanceId: result.attendance_id
    })

  } catch (error) {
    logger.error('QR check-in error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
