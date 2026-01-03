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

    // Use service client to bypass RLS
    const supabase = createServiceClient()

    // Build simple query without complex joins that may fail
    let query = supabase
      .from('grades')
      .select('*')

    if (queryParams.assignment_id) {
      query = query.eq('assignment_id', queryParams.assignment_id)
    }

    if (queryParams.student_id) {
      query = query.eq('student_id', queryParams.student_id)
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
    
    const normalizeRow = (row: any) => {
      // Prefer points_earned. If only legacy score provided, use it.
      const pointsEarned = row.points_earned ?? row.score ?? null

      // Keep the points-only workflow: if missing/excused is true, treat points as null.
      const missing = !!row.missing
      const excused = !!row.excused

      return {
        student_id: row.student_id,
        assignment_id: row.assignment_id,
        points_earned: missing || excused ? null : pointsEarned,
        late: !!row.late,
        excused,
        missing,
        feedback: row.feedback ?? row.notes ?? null,
        graded_at: row.graded_at,
      }
    }

    if ('grades' in validatedData) {
      // Bulk insert
      const gradeRows = (validatedData.grades as any[]).map((g) =>
        normalizeRow({ ...g, assignment_id: validatedData.assignment_id, graded_at: validatedData.graded_at })
      )

      const { data, error } = await supabase
        .from('grades')
        .insert(gradeRows)
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
      const gradeRow = normalizeRow(validatedData)
      const { data, error } = await supabase
        .from('grades')
        .insert(gradeRow)
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
