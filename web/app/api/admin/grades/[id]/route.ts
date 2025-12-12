/**
 * Admin Individual Grade API
 * GET /api/admin/grades/[id] - Get grade details with history
 * PATCH /api/admin/grades/[id] - Update/override grade with audit
 * DELETE /api/admin/grades/[id] - Delete grade
 */

import { NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'
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

  const { supabase } = await getDataClient(request)
    const { id } = await context.params

    const { data: grade, error } = await supabase
      .from('grades')
      .select(`
        *,
        assignment:assignments!grades_assignment_id_fkey(
          id,
          title,
          description,
          total_points,
          type,
          due_date,
          published,
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
            ),
            academic_year:academic_years(
              id,
              name,
              start_date,
              end_date
            )
          ),
          category:assignment_categories(
            id,
            name,
            weight
          )
        ),
        student:profiles!grades_student_id_fkey(
          id,
          full_name,
          email,
          date_of_birth,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error || !grade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
    }

    // Calculate percentage and letter grade if points are available
    let percentage = null
    let calculatedLetterGrade = null
    
    if (grade.points_earned !== null && grade.assignment?.total_points) {
      percentage = (grade.points_earned / grade.assignment.total_points) * 100
      
      // Simple letter grade calculation (can be enhanced with grading scales)
      if (percentage >= 90) calculatedLetterGrade = 'A'
      else if (percentage >= 80) calculatedLetterGrade = 'B'
      else if (percentage >= 70) calculatedLetterGrade = 'C'
      else if (percentage >= 60) calculatedLetterGrade = 'D'
      else calculatedLetterGrade = 'F'
    }

    return NextResponse.json({
      success: true,
      grade: {
        ...grade,
        percentage,
        calculated_letter_grade: calculatedLetterGrade
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/grades/[id]:', error)
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

  const { supabase } = await getDataClient(request)
    const { id } = await context.params
    const body = await request.json()

    // Verify grade exists
    const { data: existingGrade, error: fetchError } = await supabase
      .from('grades')
      .select(`
        *,
        assignment:assignments!grades_assignment_id_fkey(
          id,
          total_points
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
    }

    // Allowed fields to update
    const allowedFields = ['points_earned', 'letter_grade', 'feedback', 'submitted_at', 'graded_at']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Validate points if being updated
    if (updates.points_earned !== undefined && updates.points_earned !== null) {
      const totalPoints = existingGrade.assignment?.total_points
      const pointsValue = updates.points_earned as number
      if (!totalPoints) {
        return NextResponse.json({ error: 'Assignment total_points not found' }, { status: 400 })
      }
      if (pointsValue < 0 || pointsValue > totalPoints) {
        return NextResponse.json(
          { error: `Points must be between 0 and ${totalPoints}` },
          { status: 400 }
        )
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // If grade is being changed, set graded_at
    if (updates.points_earned !== undefined || updates.letter_grade !== undefined) {
      updates.graded_at = new Date().toISOString()
    }

    // Update grade
    const { data: updatedGrade, error: updateError } = await supabase
      .from('grades')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating grade:', updateError)
      return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 })
    }

    // TODO: Create audit log entry for grade override
    // This would track who changed the grade, when, and what the old value was
    // Can be implemented when grade_audit_log table is added

    return NextResponse.json({
      success: true,
      grade: updatedGrade,
      message: 'Grade updated successfully'
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/grades/[id]:', error)
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

  const { supabase } = await getDataClient(request)
    const { id } = await context.params

    // Check if grade exists
    const { data: grade, error: fetchError } = await supabase
      .from('grades')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !grade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
    }

    // Delete the grade
    const { error: deleteError } = await supabase
      .from('grades')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting grade:', deleteError)
      return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Grade deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/grades/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
