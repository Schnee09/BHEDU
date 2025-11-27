/**
 * Admin Individual Teacher API
 * GET /api/admin/teachers/[id] - Get teacher details with classes and schedule
 * PATCH /api/admin/teachers/[id] - Update teacher information
 * DELETE /api/admin/teachers/[id] - Deactivate teacher
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const { id } = await context.params

    // Get teacher profile
    const { data: teacher, error: teacherError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'teacher')
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get teacher's classes with enrollment counts
      const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        academic_year:academic_years(id, name, status),
        enrollments:enrollments(count)
      `)
      .eq('teacher_id', id)
      .order('academic_year_id', { ascending: false })
      .order('name', { ascending: true })

    if (classesError) {
      console.error('Error fetching teacher classes:', classesError)
    }

    // Calculate statistics
    const activeClasses = (classes || []).filter(c => c.status === 'active')
    const totalStudents = (classes || []).reduce((sum, cls) => {
      return sum + (cls.enrollments?.[0]?.count || 0)
    }, 0)

    // Get recent activity (could be attendance marked, grades entered, etc.)
    const { data: recentClasses } = await supabase
      .from('classes')
      .select('id, name, updated_at')
      .eq('teacher_id', id)
      .order('updated_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      teacher: {
        ...teacher,
        classes: classes || [],
        statistics: {
          total_classes: classes?.length || 0,
          active_classes: activeClasses.length,
          total_students: totalStudents
        },
        recent_activity: recentClasses || []
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/teachers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const { id } = await context.params
    const body = await request.json()

    // Verify teacher exists
    const { data: existingTeacher, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .eq('role', 'teacher')
      .single()

    if (fetchError || !existingTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Allowed fields to update
    const allowedFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'department',
      'status',
      'date_of_birth',
      'address',
      'emergency_contact',
      'qualifications',
      'hire_date',
      'notes'
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // If email is being changed, check if it's already in use
    if (updates.email) {
      const { data: emailCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', updates.email as string)
        .neq('id', id)
        .single()

      if (emailCheck) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Update teacher profile
    const { data: updatedTeacher, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating teacher:', updateError)
      return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      teacher: updatedTeacher
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/teachers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClientFromRequest(request as any)
    const { id } = await context.params

    // Check if teacher exists
    const { data: teacher, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, status, full_name, first_name, last_name')
      .eq('id', id)
      .eq('role', 'teacher')
      .single()

    if (fetchError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Check for active classes
    const { data: activeClasses, count: activeClassCount } = await supabase
      .from('classes')
      .select('id, name', { count: 'exact' })
      .eq('teacher_id', id)
      .eq('status', 'active')

    if (activeClassCount && activeClassCount > 0) {
      return NextResponse.json({
        error: `Cannot deactivate teacher with ${activeClassCount} active class(es). Please reassign or archive the classes first.`,
        activeClasses: activeClasses
      }, { status: 409 })
    }

    // Deactivate the teacher (don't actually delete)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (updateError) {
      console.error('Error deactivating teacher:', updateError)
      return NextResponse.json({ error: 'Failed to deactivate teacher' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Teacher ${teacher.first_name} ${teacher.last_name} has been deactivated`
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/teachers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
