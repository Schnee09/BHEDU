/**
 * Assignments API
 * GET/POST /api/grades/assignments
 * 
 * Manage assignments for classes
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const categoryId = searchParams.get('categoryId')
    const published = searchParams.get('published')

    let query = supabase
      .from('assignments')
      .select(`
        *,
        category:assignment_categories(
          id,
          name,
          weight
        )
      `)
      .order('due_date', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)

      // Verify access
      const { data: classData } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .single()

      if (!classData || (classData.teacher_id !== authResult.userId && authResult.userRole !== 'admin')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (authResult.userRole !== 'admin') {
      // Filter by teacher's classes
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', authResult.userId)

      const classIds = teacherClasses?.map(c => c.id) || []
      if (classIds.length > 0) {
        query = query.in('class_id', classIds)
      } else {
        return NextResponse.json({ success: true, assignments: [] })
      }
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (published !== null) {
      query = query.eq('published', published === 'true')
    }

    const { data: assignments, error } = await query

    if (error) {
      logger.error('Failed to fetch assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || []
    })
  } catch (error) {
    logger.error('Assignments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      class_id,
      category_id,
      title,
      description,
      total_points,
      due_date,
      published
    } = body

    // Validation
    if (!class_id || !title || !total_points) {
      return NextResponse.json(
        { error: 'class_id, title, and total_points are required' },
        { status: 400 }
      )
    }

    if (total_points <= 0) {
      return NextResponse.json(
        { error: 'total_points must be greater than 0' },
        { status: 400 }
      )
    }

  const supabase = createServiceClient()

    // Verify teacher has access to this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', class_id)
      .single()

    if (!classData || (classData.teacher_id !== authResult.userId && authResult.userRole !== 'admin')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        class_id,
        category_id: category_id || null,
        title,
        description: description || null,
        total_points,
        due_date: due_date || null,
        assigned_date: new Date().toISOString(),
        published: published !== undefined ? published : true
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create assignment:', error)
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      )
    }

    // Create grade records for all enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', class_id)

    if (enrollments && enrollments.length > 0) {
      const gradeRecords = enrollments.map(enrollment => ({
        assignment_id: assignment.id,
        student_id: enrollment.student_id,
        points_earned: null,
        late: false,
        excused: false,
        missing: false
      }))

      await supabase
        .from('grades')
        .insert(gradeRecords)
    }

    return NextResponse.json({
      success: true,
      assignment
    }, { status: 201 })
  } catch (error) {
    logger.error('Create assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
