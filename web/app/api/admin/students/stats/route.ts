/**
 * Student Statistics API
 * GET /api/admin/students/stats
 * 
 * Returns aggregate statistics about students
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClientFromRequest(request as any)

    const stats: any = {
      total: 0,
      active: 0,
      inactive: 0,
      by_grade: {},
      by_gender: {},
      enrolled_this_month: 0
    }

    try {
      // Total students
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
      stats.total = totalCount || 0

      // Active students
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true)
      stats.active = activeCount || 0

      // Inactive students
      const { count: inactiveCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', false)
      stats.inactive = inactiveCount || 0

      // By grade level
      const { data: gradeData } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('role', 'student')
        .not('grade_level', 'is', null)

      if (gradeData) {
        stats.by_grade = gradeData.reduce((acc: any, { grade_level }) => {
          acc[grade_level] = (acc[grade_level] || 0) + 1
          return acc
        }, {})
      }

      // By gender
      const { data: genderData } = await supabase
        .from('profiles')
        .select('gender')
        .eq('role', 'student')
        .not('gender', 'is', null)

      if (genderData) {
        stats.by_gender = genderData.reduce((acc: any, { gender }) => {
          acc[gender] = (acc[gender] || 0) + 1
          return acc
        }, {})
      }

      // Enrolled this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: enrolledCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .gte('enrollment_date', startOfMonth.toISOString())
      stats.enrolled_this_month = enrolledCount || 0

    } catch (error: any) {
      console.error('Error fetching student stats:', error)
      // Return partial stats
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    console.error('Error in GET /api/admin/students/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
