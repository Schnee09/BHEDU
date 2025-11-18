/**
 * Admin Grades API
 * Full CRUD operations for grades across all classes (admin only)
 * Includes grade override and audit trail functionality
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

// GET /api/admin/grades - List all grades with filters
export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Filters
    const classId = searchParams.get('class_id')
    const studentId = searchParams.get('student_id')
    const assignmentId = searchParams.get('assignment_id')
    const teacherId = searchParams.get('teacher_id')
    const minGrade = searchParams.get('min_grade')
    const maxGrade = searchParams.get('max_grade')
    const status = searchParams.get('status') // graded, pending, missing

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Base query
    let query = supabase
      .from('grades')
      .select(`
        *,
        assignment:assignments!grades_assignment_id_fkey(
          id,
          title,
          max_points,
          type,
          due_date,
          class:classes!assignments_class_id_fkey(
            id,
            name,
            code,
            grade_level,
            teacher:profiles!classes_teacher_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        ),
        student:profiles!grades_student_id_fkey(
          id,
          first_name,
          last_name,
          email,
          student_number
        )
      `, { count: 'exact' })

    // Apply filters
    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (classId) {
      query = query.eq('assignment.class_id', classId)
    }

    if (teacherId) {
      query = query.eq('assignment.class.teacher_id', teacherId)
    }

    // Grade range filters
    if (minGrade) {
      query = query.gte('points_earned', parseFloat(minGrade))
    }
    if (maxGrade) {
      query = query.lte('points_earned', parseFloat(maxGrade))
    }

    // Status filter (based on points_earned being null or not)
    if (status === 'graded') {
      query = query.not('points_earned', 'is', null)
    } else if (status === 'pending') {
      query = query.is('points_earned', null)
    }

    // Apply sorting
    const validSortFields = ['points_earned', 'created_at', 'updated_at']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: grades, error, count } = await query

    if (error) {
      console.error('Error fetching grades:', error)
      return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      grades: grades || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/grades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/grades - Create grade (or bulk create)
export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const body = await request.json()

    const { grades } = body

    // Support both single grade and bulk grades
    const gradesList = Array.isArray(grades) ? grades : [body]

    // Validate each grade
    for (const grade of gradesList) {
      if (!grade.assignment_id || !grade.student_id) {
        return NextResponse.json(
          { error: 'Each grade must have assignment_id and student_id' },
          { status: 400 }
        )
      }

      // Verify assignment exists
      const { data: assignment } = await supabase
        .from('assignments')
        .select('id, max_points')
        .eq('id', grade.assignment_id)
        .single()

      if (!assignment) {
        return NextResponse.json(
          { error: `Assignment ${grade.assignment_id} not found` },
          { status: 404 }
        )
      }

      // Validate points if provided
      if (grade.points_earned !== null && grade.points_earned !== undefined) {
        if (grade.points_earned < 0 || grade.points_earned > assignment.max_points) {
          return NextResponse.json(
            { error: `Points must be between 0 and ${assignment.max_points}` },
            { status: 400 }
          )
        }
      }
    }

    // Insert grades
    const { data: createdGrades, error: createError } = await supabase
      .from('grades')
      .insert(
        gradesList.map((g: any) => ({
          assignment_id: g.assignment_id,
          student_id: g.student_id,
          points_earned: g.points_earned || null,
          letter_grade: g.letter_grade || null,
          feedback: g.feedback || null,
          created_at: new Date().toISOString()
        }))
      )
      .select()

    if (createError) {
      console.error('Error creating grades:', createError)
      return NextResponse.json({ error: 'Failed to create grades' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      grades: createdGrades,
      count: createdGrades?.length || 0
    })

  } catch (error) {
    console.error('Error in POST /api/admin/grades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
