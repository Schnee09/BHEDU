/**
 * Admin Classes API
 * Full CRUD operations for classes (admin only)
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

// GET /api/admin/classes - List classes with filters, pagination, sorting
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Filters
    const gradeLevel = searchParams.get('grade_level')
    const teacherId = searchParams.get('teacher_id')
    const academicYearId = searchParams.get('academic_year_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'name'
    const sortOrder = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc'

    // Build query
    let query = supabase
      .from('classes')
      .select(`
        id,
        name,
        code,
        description,
        grade_level,
        status,
        academic_year_id,
        teacher_id,
        room_number,
        schedule,
        max_students,
        created_at,
        updated_at,
        teacher:profiles!classes_teacher_id_fkey(
          id,
          full_name,
          email
        ),
        academic_year:academic_years!classes_academic_year_id_fkey(
          id,
          name
        ),
        enrollments:enrollments(count)
      `, { count: 'exact' })

    // Apply filters
    if (gradeLevel) query = query.eq('grade_level', gradeLevel)
    if (teacherId) query = query.eq('teacher_id', teacherId)
    if (academicYearId) query = query.eq('academic_year_id', academicYearId)
    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: classes, error, count } = await query

    if (error) {
      logger.error('Failed to fetch classes', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to fetch classes', details: error.message },
        { status: 500 }
      )
    }

    // Calculate enrollment counts
    const classesWithCount = classes?.map(cls => ({
      ...cls,
      enrollment_count: cls.enrollments?.[0]?.count || 0
    })) || []

    return NextResponse.json({
      success: true,
      classes: classesWithCount,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    logger.error('Get classes error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/classes - Create new class
export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const body = await request.json()

    // Validate required fields
    const { name, code, grade_level, teacher_id, academic_year_id } = body
    if (!name || !grade_level || !teacher_id || !academic_year_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, grade_level, teacher_id, academic_year_id' },
        { status: 400 }
      )
    }

    // Check if code is unique (if provided)
    if (code) {
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('code', code)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Class code already exists' },
          { status: 409 }
        )
      }
    }

    // Verify teacher exists and is a teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', teacher_id)
      .single()

    if (teacherError || !teacher || teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Invalid teacher ID or user is not a teacher' },
        { status: 400 }
      )
    }

    // Verify academic year exists
    const { data: academicYear, error: yearError } = await supabase
      .from('academic_years')
      .select('id')
      .eq('id', academic_year_id)
      .single()

    if (yearError || !academicYear) {
      return NextResponse.json(
        { error: 'Invalid academic year ID' },
        { status: 400 }
      )
    }

    // Create class
    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert({
        name,
        code: code || null,
        description: body.description || null,
        grade_level,
        status: body.status || 'active',
        teacher_id,
        academic_year_id,
        room_number: body.room_number || null,
        schedule: body.schedule || null,
        max_students: body.max_students || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      logger.error('Failed to create class', { error: createError.message })
      return NextResponse.json(
        { error: 'Failed to create class', details: createError.message },
        { status: 500 }
      )
    }

    logger.info('Class created', { classId: newClass.id, name: newClass.name })

    return NextResponse.json({
      success: true,
      class: newClass
    }, { status: 201 })

  } catch (error) {
    logger.error('Create class error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
