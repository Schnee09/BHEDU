/**
 * Admin Attendance API
 * Full CRUD operations for attendance records across all classes (admin only)
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

// GET /api/admin/attendance - List all attendance records with filters
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
    const teacherId = searchParams.get('teacher_id')
    const status = searchParams.get('status') // present, absent, late, excused
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const date = searchParams.get('date')

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'date'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Base query
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        enrollment:enrollments!attendance_records_enrollment_id_fkey(
          id,
          student:profiles!enrollments_student_id_fkey(
            id,
            first_name,
            last_name,
            email,
            student_number
          ),
          class:classes!enrollments_class_id_fkey(
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
        )
      `, { count: 'exact' })

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply date filters
    if (date) {
      query = query.eq('date', date)
    } else {
      if (startDate) {
        query = query.gte('date', startDate)
      }
      if (endDate) {
        query = query.lte('date', endDate)
      }
    }

    // Apply class filter
    if (classId) {
      query = query.eq('enrollment.class_id', classId)
    }

    // Apply student filter
    if (studentId) {
      query = query.eq('enrollment.student_id', studentId)
    }

    // Apply teacher filter (through class)
    if (teacherId) {
      query = query.eq('enrollment.class.teacher_id', teacherId)
    }

    // Apply sorting
    const validSortFields = ['date', 'status', 'created_at']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: records, error, count } = await query

    if (error) {
      console.error('Error fetching attendance records:', error)
      return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      records: records || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/attendance - Create attendance record (bulk)
export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const body = await request.json()

    const { records } = body

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'Records array is required' },
        { status: 400 }
      )
    }

    // Validate each record
    for (const record of records) {
      if (!record.enrollment_id || !record.date || !record.status) {
        return NextResponse.json(
          { error: 'Each record must have enrollment_id, date, and status' },
          { status: 400 }
        )
      }
    }

    // Insert records with upsert to handle duplicates
    const { data: createdRecords, error: createError } = await supabase
      .from('attendance_records')
      .upsert(
        records.map((r: any) => ({
          enrollment_id: r.enrollment_id,
          date: r.date,
          status: r.status,
          notes: r.notes || null,
          created_at: new Date().toISOString()
        })),
        { 
          onConflict: 'enrollment_id,date',
          ignoreDuplicates: false 
        }
      )
      .select()

    if (createError) {
      console.error('Error creating attendance records:', createError)
      return NextResponse.json({ error: 'Failed to create attendance records' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      records: createdRecords,
      count: createdRecords?.length || 0
    })

  } catch (error) {
    console.error('Error in POST /api/admin/attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
