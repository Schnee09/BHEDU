/**
 * Bulk Grade Import API
 * POST /api/grades/bulk-import
 * 
 * Import multiple grades from Excel/CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { staffAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

interface GradeInput {
  student_id: string
  score: number
  category?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await staffAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Staff or Admin required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { class_id, assignment_id, grades } = body as {
      class_id: string
      assignment_id?: string
      grades: GradeInput[]
    }

    if (!class_id || !grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { success: false, error: 'class_id và grades array là bắt buộc' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    
    // Get students in the class from enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, profiles!enrollments_student_id_fkey(id, student_id, full_name)')
      .eq('class_id', class_id)
      .eq('status', 'active')

    const studentMap = new Map<string, string>()
    enrollments?.forEach((e: any) => {
      if (e.profiles) {
        // Map both profile.id and student_id (mã học sinh) to profile.id
        studentMap.set(e.profiles.id, e.profiles.id)
        if (e.profiles.student_id) {
          studentMap.set(e.profiles.student_id, e.profiles.id)
        }
      }
    })

    // Get active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single()

    // Process grades
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const grade of grades) {
      try {
        // Look up student by ID or student_id code
        const profileId = studentMap.get(grade.student_id)
        if (!profileId) {
          results.failed++
          results.errors.push(`Không tìm thấy học sinh: ${grade.student_id}`)
          continue
        }

        // Validate score
        if (grade.score < 0 || grade.score > 10) {
          results.failed++
          results.errors.push(`Điểm không hợp lệ cho ${grade.student_id}: ${grade.score}`)
          continue
        }

        // If assignment_id is provided, insert into grades table
        if (assignment_id) {
          const { error } = await supabase
            .from('grades')
            .upsert({
              student_id: profileId,
              assignment_id: assignment_id,
              points_earned: grade.score,
              feedback: grade.notes || null,
              graded_at: new Date().toISOString()
            }, {
              onConflict: 'student_id,assignment_id'
            })

          if (error) {
            results.failed++
            results.errors.push(`Lỗi khi lưu điểm ${grade.student_id}: ${error.message}`)
            continue
          }
        } else {
          // Insert into vietnamese_grades table (for category-based grading)
          // Get or create grade category
          let categoryId = null
          if (grade.category) {
            const { data: existingCategory } = await supabase
              .from('grade_categories')
              .select('id')
              .eq('name', grade.category)
              .eq('class_id', class_id)
              .single()

            if (existingCategory) {
              categoryId = existingCategory.id
            } else {
              // Create category
              const { data: newCategory } = await supabase
                .from('grade_categories')
                .insert({
                  name: grade.category,
                  class_id: class_id,
                  weight: 1
                })
                .select()
                .single()
              categoryId = newCategory?.id
            }
          }

          // Insert vietnamese grade
          const { error } = await supabase
            .from('vietnamese_grades')
            .insert({
              student_id: profileId,
              class_id: class_id,
              category_id: categoryId,
              semester_id: activeSemester?.id,
              score: grade.score,
              notes: grade.notes || null,
              graded_by: authResult.userId,
              graded_at: new Date().toISOString()
            })

          if (error) {
            results.failed++
            results.errors.push(`Lỗi khi lưu điểm ${grade.student_id}: ${error.message}`)
            continue
          }
        }

        results.imported++
      } catch (err: any) {
        results.failed++
        results.errors.push(`Lỗi không xác định cho ${grade.student_id}: ${err.message}`)
      }
    }

    logger.info('Bulk grade import completed', {
      class_id,
      total: grades.length,
      imported: results.imported,
      failed: results.failed,
      user_id: authResult.userId
    })

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error: any) {
    logger.error('Error in bulk grade import', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
