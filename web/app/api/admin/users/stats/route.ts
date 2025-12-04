/**
 * User Statistics API
 * GET /api/admin/users/stats
 * 
 * Returns aggregate statistics about all users
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
      by_role: {
        admin: 0,
        teacher: 0,
        student: 0
      },
      created_this_month: 0,
      created_this_week: 0
    }

    try {
      // Total users
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
      stats.total = totalCount || 0

      // Active users
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
      stats.active = activeCount || 0

      // Inactive users
      const { count: inactiveCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', false)
      stats.inactive = inactiveCount || 0

      // By role
      const roles = ['admin', 'teacher', 'student']
      for (const role of roles) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', role)
        stats.by_role[role] = count || 0
      }

      // Created this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: monthCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
      stats.created_this_month = monthCount || 0

      // Created this week
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const { count: weekCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())
      stats.created_this_week = weekCount || 0

    } catch (error: any) {
      console.error('Error fetching user stats:', error)
      // Return partial stats
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    console.error('Error in GET /api/admin/users/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
