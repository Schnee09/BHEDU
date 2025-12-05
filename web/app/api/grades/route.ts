/**
 * Grades API
 * GET/POST/PUT /api/grades
 * 
 * Manage student grades for assignments
 * Updated: 2024-12-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'
import { handleApiError } from '@/lib/api/errors'
import { validateQuery } from '@/lib/api/validation'
import { createGradeSchema, bulkGradeEntrySchema, gradeQuerySchema } from '@/lib/schemas/grades'

export async function GET(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate query parameters
    const queryParams = validateQuery(request, gradeQuerySchema)

    // Use service client to bypass RLS and avoid recursion
    const supabase = createServiceClient()

    let query = supabase
      .from('grades')
      .select(`
        *,
        assignment:assignments(
          id,
          title,
          max_points,
          due_date,
          class_id
        ),
        student:profiles!grades_student_id_fkey(
          id,
          email,
          full_name
        )
      `)

    if (queryParams.assignment_id) {
      query = query.eq('assignment_id', queryParams.assignment_id)
    }

    if (queryParams.student_id) {
      query = query.eq('student_id', queryParams.student_id)
    }

    if (queryParams.class_id) {
      query = query.filter('assignment.class_id', 'eq', queryParams.class_id)
    }

    // Verify access
    if (authResult.userRole !== 'admin') {
      // Get teacher's classes
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', authResult.userId)

      const classIds = teacherClasses?.map(c => c.id) || []
      
      if (classIds.length === 0) {
        return NextResponse.json({ success: true, grades: [] })
      }
    }

    const { data: grades, error } = await query

    if (error) {
      logger.error('Failed to fetch grades:', {
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint
      })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      grades: grades || []
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Check if it's bulk entry or single grade
    let validatedData;
    if (body.grades && Array.isArray(body.grades)) {
      // Bulk entry
      validatedData = bulkGradeEntrySchema.parse(body)
    } else {
      // Single grade
      validatedData = createGradeSchema.parse(body)
    }

    const supabase = createServiceClient()
    
    if ('grades' in validatedData) {
      // Bulk insert
      const { data, error } = await supabase
        .from('grades')
        .insert(validatedData.grades)
        .select()
      
      if (error) {
        logger.error('Bulk grade insert failed:', error)
        throw new Error(`Failed to create grades: ${error.message}`)
      }
      
      return NextResponse.json({
        success: true,
        grades: data
      }, { status: 201 })
    } else {
      // Single insert
      const { data, error } = await supabase
        .from('grades')
        .insert(validatedData)
        .select()
        .single()
      
      if (error) {
        logger.error('Grade insert failed:', error)
        throw new Error(`Failed to create grade: ${error.message}`)
      }
      
      return NextResponse.json({
        success: true,
        grade: data
      }, { status: 201 })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
