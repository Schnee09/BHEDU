/**
 * Single Class API
 * GET /api/classes/[classId] - Get class details
 * PUT /api/classes/[classId] - Update class
 * DELETE /api/classes/[classId] - Delete class
 */

import { NextRequest, NextResponse } from 'next/server'
import { staffAuth, teacherAuth } from '@/lib/auth/adminAuth'
import { hasAdminAccess } from '@/lib/auth/permissions'
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'
import { ClassService } from '@/lib/services/classService'

interface RouteParams {
  params: { classId: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    const { classId } = params
    const classService = new ClassService()
    const classData = await classService.getClassById(classId)

    if (!classData) {
      throw new NotFoundError('Không tìm thấy lớp học')
    }

    // Teachers can only view their own classes
    if (!hasAdminAccess(authResult.userRole || '')) {
      if (classData.teacher?.id !== authResult.userId) {
        return NextResponse.json(
          { success: false, error: 'Không có quyền truy cập lớp này' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ success: true, class: classData })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    const { classId } = params
    const body = await request.json()
    const { name, code, description, teacherId, academicYearId, grade } = body

    const classService = new ClassService()
    
    // Check if class exists
    const existing = await classService.getClassById(classId)
    if (!existing) {
      throw new NotFoundError('Không tìm thấy lớp học')
    }

    const updated = await classService.updateClass(classId, {
      name,
      code,
      description,
      teacher_id: teacherId,
      academic_year_id: academicYearId,
      grade,
    })

    logger.info('Class updated:', { classId, name: updated.name })

    return NextResponse.json({ success: true, class: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    const { classId } = params
    const classService = new ClassService()

    // Check if class exists
    const existing = await classService.getClassById(classId)
    if (!existing) {
      throw new NotFoundError('Không tìm thấy lớp học')
    }

    await classService.deleteClass(classId)

    logger.info('Class deleted:', { classId, name: existing.name })

    return NextResponse.json({ success: true, message: 'Đã xóa lớp học' })
  } catch (error) {
    return handleApiError(error)
  }
}
