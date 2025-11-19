/**
 * Admin Assignments API
 * Full CRUD operations for assignments across all classes (admin only)
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

// GET /api/admin/assignments - List all assignments with filters, pagination, sorting
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
    const classId = searchParams.get('class_id')
    const teacherId = searchParams.get('teacher_id')
    const categoryId = searchParams.get('category_id')
    const status = searchParams.get('status') // published, draft
    const type = searchParams.get('type') // homework, quiz, exam, project
    const search = searchParams.get('search')
    const academicYearId = searchParams.get('academic_year_id')

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'due_date'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Base query
    let query = supabase
      .from('assignments')
      .select(`
        *,
        class:classes!assignments_class_id_fkey(
          id,
          name,
          code,
          grade_level,
          academic_year_id,
          teacher:profiles!classes_teacher_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        ),
        category:assignment_categories(
          id,
          name,
          weight
        ),
        grades:grades(count)
      `, { count: 'exact' })

    // Apply filters
    if (classId) {
      query = query.eq('class_id', classId)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (status) {
      if (status === 'published') {
        query = query.eq('published', true)
      } else if (status === 'draft') {
        query = query.eq('published', false)
      }
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Filter by teacher
    if (teacherId) {
      query = query.eq('class.teacher_id', teacherId)
    }

    // Filter by academic year (through class)
    if (academicYearId) {
      query = query.eq('class.academic_year_id', academicYearId)
    }

    // Apply sorting
    const validSortFields = ['title', 'due_date', 'created_at', 'total_points', 'type']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'due_date'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: assignments, error, count } = await query

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Enrich with submission counts
    const enrichedAssignments = (assignments || []).map(assignment => ({
      ...assignment,
      submission_count: assignment.grades?.[0]?.count || 0
    }))

    return NextResponse.json({
      success: true,
      assignments: enrichedAssignments,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/assignments - Create new assignment
export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const body = await request.json()

    const {
      class_id,
      category_id,
      title,
      description,
      type,
      total_points,
      due_date,
      published
    } = body

    // Validate required fields
    if (!class_id || !title || !total_points) {
      return NextResponse.json(
        { error: 'Class ID, title, and total points are required' },
        { status: 400 }
      )
    }

    // Verify class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', class_id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Verify category exists if provided
    if (category_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('assignment_categories')
        .select('id')
        .eq('id', category_id)
        .single()

      if (categoryError || !categoryData) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    // Create assignment
    const { data: assignment, error: createError } = await supabase
      .from('assignments')
      .insert({
        class_id,
        category_id,
        title,
        description,
        type: type || 'homework',
        total_points,
        due_date,
        published: published !== undefined ? published : false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating assignment:', createError)
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assignment
    })

  } catch (error) {
    console.error('Error in POST /api/admin/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
