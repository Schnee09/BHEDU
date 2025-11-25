/**
 * Admin Individual Assignment API
 * GET /api/admin/assignments/[id] - Get assignment details with submissions
 * PATCH /api/admin/assignments/[id] - Update assignment
 * DELETE /api/admin/assignments/[id] - Delete assignment
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

    // Get assignment with full details
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        *,
        class:classes!assignments_class_id_fkey(
          id,
          name,
          code,
          grade_level,
          academic_year:academic_years(
            id,
            name,
            status
          ),
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
        grades:grades(
          id,
          score,
          submitted_at,
          graded_at,
          enrollment:enrollments(
            id,
            student:profiles!enrollments_student_id_fkey(
              id,
              full_name,
              email
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Calculate statistics
    const grades = assignment.grades || []
    const totalSubmissions = grades.length
    const gradedSubmissions = grades.filter((g: any) => g.graded_at).length
    const averageScore = grades.length > 0
      ? grades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / grades.length
      : 0

    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
        statistics: {
          total_submissions: totalSubmissions,
          graded_submissions: gradedSubmissions,
          pending_submissions: totalSubmissions - gradedSubmissions,
          average_score: averageScore,
          total_points: assignment.total_points
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/assignments/[id]:', error)
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

    // Verify assignment exists
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Allowed fields to update
    const allowedFields = [
      'title',
      'description',
      'type',
      'total_points',
      'due_date',
      'published',
      'category_id',
      'class_id'
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

    // If class_id is being changed, verify it exists
    if (updates.class_id) {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('id', updates.class_id as string)
        .single()

      if (classError || !classData) {
        return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      }
    }

    // If category_id is being changed, verify it exists
    if (updates.category_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('assignment_categories')
        .select('id')
        .eq('id', updates.category_id as string)
        .single()

      if (categoryError || !categoryData) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating assignment:', updateError)
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/assignments/[id]:', error)
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

    // Check if assignment exists
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, title')
      .eq('id', id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if there are any grades
    const { count: gradesCount } = await supabase
      .from('grades')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', id)

    if (gradesCount && gradesCount > 0) {
      return NextResponse.json({
        error: `Cannot delete assignment with ${gradesCount} grade(s). Consider unpublishing instead.`
      }, { status: 409 })
    }

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Assignment "${assignment.title}" deleted successfully`
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/assignments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
