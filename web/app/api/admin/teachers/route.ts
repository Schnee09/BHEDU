/**
 * Admin Teachers API
 * Specialized endpoints for teacher management with class assignments
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

// GET /api/admin/teachers - List teachers with class counts and workload
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
    const status = searchParams.get('status') // active, inactive
    const department = searchParams.get('department')
    const search = searchParams.get('search')
    const academicYearId = searchParams.get('academic_year_id')

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'first_name'
    const sortOrder = searchParams.get('sort_order') || 'asc'

    // Base query for teachers
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'teacher')

    // Apply status filter
    if (status === 'active') {
      query = query.eq('status', 'active')
    } else if (status === 'inactive') {
      query = query.eq('status', 'inactive')
    }

    // Apply department filter
    if (department) {
      query = query.eq('department', department)
    }

    // Apply search
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortFields = ['first_name', 'last_name', 'email', 'created_at', 'status']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'first_name'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: teachers, error: teachersError, count } = await query

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError)
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
    }

    // Get class counts and student counts for each teacher
    const teachersWithStats = await Promise.all(
      (teachers || []).map(async (teacher) => {
        // Count classes
        let classQuery = supabase
          .from('classes')
          .select('id, name, code, grade_level, status', { count: 'exact' })
          .eq('teacher_id', teacher.id)

        // Filter by academic year if specified
        if (academicYearId) {
          classQuery = classQuery.eq('academic_year_id', academicYearId)
        }

        const { data: classes, count: classCount } = await classQuery

        // Count total students across all classes
        let totalStudents = 0
        if (classes && classes.length > 0) {
          const classIds = classes.map(c => c.id)
          const { count: studentCount } = await supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .in('class_id', classIds)
            .eq('status', 'enrolled')
          
          totalStudents = studentCount || 0
        }

        return {
          ...teacher,
          class_count: classCount || 0,
          student_count: totalStudents,
          classes: classes || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      teachers: teachersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/teachers - Create new teacher (delegates to users API but ensures role is teacher)
export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    
    // Ensure role is set to teacher
    body.role = 'teacher'

    // Forward to the users API
    const usersApiUrl = new URL('/api/admin/users', request.url)
    const response = await fetch(usersApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error in POST /api/admin/teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
